-- Update default invite code generator to custom 3 letters + hyphen + 3 digits (e.g. Anr-658)
create or replace function public.generate_wedding_invite_code()
returns text
language sql
volatile
set search_path = ''
as \$\$
  select initcap(
    substring(
      coalesce(
        nullif(regexp_replace(current_setting('wedding.household_name', true), '[^a-zA-Z]', '', 'g'), ''),
        'Wed'
      ) from 1 for 3
    )
  ) || '-' || lpad(floor(100 + random() * 900)::text, 3, '0');
\$\$;

-- Update lookup_invitation to support custom short codes (e.g. Anr-658) and case/punctuation-insensitive search
create or replace function public.lookup_invitation(raw_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as \$\$
declare
  household_id uuid;
begin
  if raw_token is null or char_length(trim(raw_token)) < 4 then
    return null;
  end if;

  select id into household_id
  from public.households
  where upper(regexp_replace(invite_code, '[^a-zA-Z0-9]', '', 'g')) = upper(regexp_replace(raw_token, '[^a-zA-Z0-9]', '', 'g'))
     or upper(trim(invite_code)) = upper(trim(raw_token))
  limit 1;

  if household_id is null then
    return null;
  end if;

  return public.invitation_bundle(household_id);
end;
\$\$;

-- Update submit_household_rsvp to support custom short codes (e.g. Anr-658)
create or replace function public.submit_household_rsvp(raw_token text, response jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as \$\$
declare
  household_row public.households%rowtype;
  member_payload jsonb;
  member_id_text text;
  member_attending boolean;
  response_status text;
  response_count integer;
  response_members jsonb;
  restrictions text[];
  invited_member_count integer;
  submitted_attending_count integer := 0;
  submitted_new_count integer := 0;
  persisted_attending_count integer;
  submitted_member_ids uuid[] := '{}'::uuid[];
begin
  if raw_token is null or char_length(trim(raw_token)) < 4 then
    raise exception 'Invitation not found' using errcode = 'P0002';
  end if;

  if response is null or jsonb_typeof(response) <> 'object' then
    raise exception 'Invalid RSVP response' using errcode = '22023';
  end if;

  select * into household_row
  from public.households
  where upper(regexp_replace(invite_code, '[^a-zA-Z0-9]', '', 'g')) = upper(regexp_replace(raw_token, '[^a-zA-Z0-9]', '', 'g'))
     or upper(trim(invite_code)) = upper(trim(raw_token))
  for update;

  if household_row.id is null then
    raise exception 'Invitation not found' using errcode = 'P0002';
  end if;

  response_status := response ->> 'rsvpStatus';
  if response_status not in ('attending', 'declined') then
    raise exception 'Invalid RSVP status' using errcode = '22023';
  end if;

  select count(*) into invited_member_count
  from public.household_members
  where household_id = household_row.id;

  response_members := coalesce(response -> 'members', '[]'::jsonb);
  if jsonb_typeof(response_members) <> 'array' then
    raise exception 'Invalid members list' using errcode = '22023';
  end if;

  if jsonb_array_length(response_members) > 0 then
    for member_payload in select * from jsonb_array_elements(response_members) loop
      member_id_text := member_payload ->> 'id';
      member_attending := coalesce((member_payload ->> 'attending')::boolean, false);
      restrictions := public.jsonb_text_array_or_empty(member_payload -> 'dietaryRestrictions');

      if member_id_text is not null and member_id_text <> '' then
        update public.household_members
        set
          attending = member_attending,
          dietary_restrictions = restrictions,
          dietary_details = nullif(trim(member_payload ->> 'dietaryDetails'), ''),
          meal_selection = nullif(trim(member_payload ->> 'mealSelection'), ''),
          updated_at = timezone('utc', now())
        where id = member_id_text::uuid
          and household_id = household_row.id;

        submitted_member_ids := array_append(submitted_member_ids, member_id_text::uuid);
        if member_attending then
          submitted_attending_count := submitted_attending_count + 1;
        end if;
      elsif household_row.is_plus_one_allowed and coalesce(trim(member_payload ->> 'name'), '') <> '' then
        insert into public.household_members (
          household_id,
          name,
          is_primary,
          is_invited,
          attending,
          dietary_restrictions,
          dietary_details,
          meal_selection
        ) values (
          household_row.id,
          trim(member_payload ->> 'name'),
          false,
          false,
          member_attending,
          restrictions,
          nullif(trim(member_payload ->> 'dietaryDetails'), ''),
          nullif(trim(member_payload ->> 'mealSelection'), '')
        );

        submitted_new_count := submitted_new_count + 1;
        if member_attending then
          submitted_attending_count := submitted_attending_count + 1;
        end if;
      end if;
    end loop;
  end if;

  if response_status = 'declined' then
    update public.household_members
    set attending = false, updated_at = timezone('utc', now())
    where household_id = household_row.id;
    persisted_attending_count := 0;
  else
    select count(*) into persisted_attending_count
    from public.household_members
    where household_id = household_row.id and attending is true;

    if persisted_attending_count = 0 then
      response_count := coalesce((response ->> 'attendingCount')::integer, 0);
      persisted_attending_count := greatest(0, least(response_count, household_row.max_party_size));
    end if;
  end if;

  update public.households
  set
    rsvp_status = response_status,
    attending_count = persisted_attending_count,
    email = coalesce(nullif(trim(response ->> 'email'), ''), household_row.email),
    phone = coalesce(nullif(trim(response ->> 'phone'), ''), household_row.phone),
    meal_selection = coalesce(nullif(trim(response ->> 'mealSelection'), ''), household_row.meal_selection),
    dietary_restrictions = coalesce(public.jsonb_text_array_or_empty(response -> 'dietaryRestrictions'), household_row.dietary_restrictions),
    dietary_details = coalesce(nullif(trim(response ->> 'dietaryDetails'), ''), household_row.dietary_details),
    song_request = coalesce(nullif(trim(response ->> 'songRequest'), ''), household_row.song_request),
    message = coalesce(nullif(trim(response ->> 'message'), ''), household_row.message),
    table_number = case
      when response_status = 'declined' then null
      else coalesce(nullif(trim(response ->> 'tableNumber'), ''), household_row.table_number)
    end,
    updated_at = timezone('utc', now())
  where id = household_row.id;

  return public.invitation_bundle(household_row.id);
end;
\$\$;

-- Migrate existing households with old CA- format or long hex tokens to the new Anr-658 format
update public.households
set invite_code = initcap(substring(regexp_replace(coalesce(display_name, 'Wed'), '[^a-zA-Z]', '', 'g') from 1 for 3)) || '-' || lpad(floor(100 + random() * 900)::text, 3, '0')
where invite_code like 'CA-%' or char_length(invite_code) > 10;
