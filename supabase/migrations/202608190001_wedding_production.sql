-- Cam & Abby wedding production data model.
-- Real guest data must be added through the authenticated dashboard after this
-- migration is applied; no guest PII or unconfirmed event copy is seeded.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create or replace function public.is_wedding_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) in (
    'cameronnel111@gmail.com',
    'abby@snappy.click'
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.generate_wedding_invite_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select 'CA-' || upper(encode(extensions.gen_random_bytes(12), 'hex'));
$$;

create table public.site_config (
  id text primary key check (id = 'main'),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint site_config_never_contains_admin_pin check (not (config ? 'adminPin'))
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(trim(display_name)) between 1 and 160),
  email text,
  phone text,
  invite_code text not null unique default public.generate_wedding_invite_code(),
  rsvp_status text not null default 'pending' check (rsvp_status in ('pending', 'attending', 'declined')),
  max_party_size integer not null default 1 check (max_party_size between 1 and 20),
  attending_count integer not null default 0 check (attending_count between 0 and 20),
  dietary_restrictions text[] not null default '{}',
  dietary_details text,
  meal_selection text,
  song_request text,
  message text,
  table_number text,
  is_plus_one_allowed boolean not null default false,
  checked_in boolean not null default false,
  tags text[] not null default '{}',
  responded_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint households_allowed_tags check (
    tags <@ array['free_venue_housing', 'presence_is_our_gift']::text[]
  ),
  constraint households_attending_within_party check (attending_count <= max_party_size)
);

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  email text,
  phone text,
  is_primary boolean not null default false,
  is_invited boolean not null default true,
  attending boolean,
  meal_selection text,
  dietary_restrictions text[] not null default '{}',
  dietary_details text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index household_one_primary_member
  on public.household_members (household_id)
  where is_primary;
create index household_members_household_id_idx on public.household_members(household_id);
create index households_invite_code_idx on public.households(invite_code);

create table public.accommodations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 200),
  description text,
  address text not null default '',
  phone text not null default '',
  email text,
  booking_code text not null default '',
  distance text not null default '',
  link text not null default '',
  rate text not null default '',
  price_amount numeric(12, 2) check (price_amount is null or price_amount >= 0),
  currency char(3) not null default 'ZAR',
  price_unit text not null default 'night',
  visibility text not null default 'general' check (visibility in ('general', 'free_venue_housing', 'all')),
  is_venue_housing boolean not null default false,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.wedding_services (
  id uuid primary key default gen_random_uuid(),
  category text not null default '',
  name text not null check (char_length(trim(name)) between 1 and 200),
  description text,
  contact_name text,
  phone text,
  email text,
  link text,
  price_amount numeric(12, 2) check (price_amount is null or price_amount >= 0),
  currency char(3) not null default 'ZAR',
  price_unit text not null default 'service',
  visibility text not null default 'general' check (visibility in ('general', 'free_venue_housing', 'all')),
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  public_url text not null,
  category text not null default 'couple',
  title text not null default '',
  subtitle text,
  alt_text text not null default '',
  published boolean not null default false,
  sort_order integer not null default 0,
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.registry_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 200),
  description text not null default '',
  link text,
  type text not null default 'registry' check (type in ('honeymoon', 'registry', 'cash')),
  icon text not null default 'Gift',
  goal_amount numeric(12, 2) check (goal_amount is null or goal_amount >= 0),
  current_amount numeric(12, 2) check (current_amount is null or current_amount >= 0),
  account_details text,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.wishes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid unique references public.households(id) on delete set null,
  name text not null check (char_length(trim(name)) between 1 and 160),
  message text not null check (char_length(trim(message)) between 1 and 2000),
  likes integer not null default 0 check (likes >= 0),
  approved boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.invitation_templates (
  id uuid primary key default gen_random_uuid(),
  kind text not null unique check (kind in ('save_the_date', 'official_invitation')),
  name text not null,
  subject text not null default '',
  heading text not null default '',
  body text not null default '',
  email_html text,
  design jsonb not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.invitation_deliveries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  template_id uuid not null references public.invitation_templates(id) on delete restrict,
  channel text not null check (channel in ('email', 'sms', 'whatsapp')),
  recipient text not null,
  status text not null default 'queued' check (status in ('draft', 'queued', 'sent', 'delivered', 'failed', 'bounced')),
  attempt_number integer not null default 1 check (attempt_number > 0),
  provider_message_id text,
  error_message text,
  pdf_path text,
  request_key text not null unique,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index invitation_deliveries_household_idx on public.invitation_deliveries(household_id, created_at desc);
create index invitation_deliveries_template_idx on public.invitation_deliveries(template_id, created_at desc);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'site_config', 'households', 'household_members', 'accommodations',
    'wedding_services', 'gallery_items', 'registry_items', 'wishes',
    'invitation_templates', 'invitation_deliveries'
  ]
  loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end;
$$;

alter table public.site_config enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.accommodations enable row level security;
alter table public.wedding_services enable row level security;
alter table public.gallery_items enable row level security;
alter table public.registry_items enable row level security;
alter table public.wishes enable row level security;
alter table public.invitation_templates enable row level security;
alter table public.invitation_deliveries enable row level security;

create policy "Public can read site configuration"
  on public.site_config for select
  to anon, authenticated
  using (true);
create policy "Admins manage site configuration"
  on public.site_config for all
  to authenticated
  using ((select public.is_wedding_admin()))
  with check ((select public.is_wedding_admin()));

create policy "Admins manage households"
  on public.households for all
  to authenticated
  using ((select public.is_wedding_admin()))
  with check ((select public.is_wedding_admin()));
create policy "Admins manage household members"
  on public.household_members for all
  to authenticated
  using ((select public.is_wedding_admin()))
  with check ((select public.is_wedding_admin()));
create policy "Admins manage accommodations"
  on public.accommodations for all
  to authenticated
  using ((select public.is_wedding_admin()))
  with check ((select public.is_wedding_admin()));
create policy "Admins manage services"
  on public.wedding_services for all
  to authenticated
  using ((select public.is_wedding_admin()))
  with check ((select public.is_wedding_admin()));
create policy "Admins manage registry"
  on public.registry_items for all
  to authenticated
  using ((select public.is_wedding_admin()))
  with check ((select public.is_wedding_admin()));
create policy "Admins manage invitation templates"
  on public.invitation_templates for all
  to authenticated
  using ((select public.is_wedding_admin()))
  with check ((select public.is_wedding_admin()));
create policy "Admins read delivery history"
  on public.invitation_deliveries for select
  to authenticated
  using ((select public.is_wedding_admin()));

create policy "Public can read published gallery items"
  on public.gallery_items for select
  to anon, authenticated
  using (published or (select public.is_wedding_admin()));
create policy "Admins manage gallery items"
  on public.gallery_items for all
  to authenticated
  using ((select public.is_wedding_admin()))
  with check ((select public.is_wedding_admin()));

create policy "Public can read approved wishes"
  on public.wishes for select
  to anon, authenticated
  using (approved or (select public.is_wedding_admin()));
create policy "Admins manage wishes"
  on public.wishes for all
  to authenticated
  using ((select public.is_wedding_admin()))
  with check ((select public.is_wedding_admin()));

-- Anonymous visitors cannot select guest, accommodation, service, registry, or
-- delivery tables directly. The token-scoped functions below return one
-- household and only the content that household is entitled to see.

-- The admin editor submits a complete member roster. Keeping the household and
-- its people in one database function prevents partial saves if any row fails.
create or replace function public.update_household_with_members(
  target_household_id uuid,
  household_patch jsonb,
  members_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  household_row public.households%rowtype;
  member_payload jsonb;
  member_id_text text;
  submitted_member_ids uuid[] := '{}'::uuid[];
  member_restrictions text[];
  requested_tags text[];
  final_max_party_size integer;
  final_rsvp_status text;
  final_attending_count integer;
  primary_member_count integer := 0;
  invited_member_count integer := 0;
  result jsonb;
begin
  if not public.is_wedding_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  household_patch := coalesce(household_patch, '{}'::jsonb);
  if jsonb_typeof(household_patch) <> 'object' then
    raise exception 'Invalid household patch' using errcode = '22023';
  end if;
  if exists (
    select 1
    from jsonb_object_keys(household_patch) as submitted_key(key)
    where submitted_key.key not in (
      'display_name', 'email', 'phone', 'rsvp_status', 'max_party_size',
      'attending_count', 'dietary_restrictions', 'dietary_details',
      'meal_selection', 'song_request', 'message', 'table_number',
      'is_plus_one_allowed', 'checked_in', 'tags'
    )
  ) then
    raise exception 'Household patch contains unsupported fields' using errcode = '22023';
  end if;

  select * into household_row
  from public.households
  where id = target_household_id
  for update;
  if household_row.id is null then
    raise exception 'Household not found' using errcode = 'P0002';
  end if;

  if household_patch ? 'display_name' and (
    jsonb_typeof(household_patch -> 'display_name') <> 'string'
    or char_length(trim(household_patch ->> 'display_name')) not between 1 and 160
  ) then
    raise exception 'Invalid household name' using errcode = '22023';
  end if;
  if household_patch ? 'email' and (
    jsonb_typeof(household_patch -> 'email') not in ('string', 'null')
    or char_length(coalesce(household_patch ->> 'email', '')) > 320
  ) then
    raise exception 'Invalid household email' using errcode = '22023';
  end if;
  if household_patch ? 'phone' and (
    jsonb_typeof(household_patch -> 'phone') not in ('string', 'null')
    or char_length(coalesce(household_patch ->> 'phone', '')) > 40
  ) then
    raise exception 'Invalid household phone' using errcode = '22023';
  end if;
  if household_patch ? 'rsvp_status' and (
    jsonb_typeof(household_patch -> 'rsvp_status') <> 'string'
    or household_patch ->> 'rsvp_status' not in ('pending', 'attending', 'declined')
  ) then
    raise exception 'Invalid household RSVP status' using errcode = '22023';
  end if;
  if household_patch ? 'max_party_size' and (
    jsonb_typeof(household_patch -> 'max_party_size') <> 'number'
    or (household_patch ->> 'max_party_size') !~ '^[0-9]{1,2}$'
    or (household_patch ->> 'max_party_size')::integer not between 1 and 20
  ) then
    raise exception 'Invalid maximum party size' using errcode = '22023';
  end if;
  if household_patch ? 'attending_count' and (
    jsonb_typeof(household_patch -> 'attending_count') <> 'number'
    or (household_patch ->> 'attending_count') !~ '^[0-9]{1,2}$'
    or (household_patch ->> 'attending_count')::integer not between 0 and 20
  ) then
    raise exception 'Invalid attending count' using errcode = '22023';
  end if;
  if household_patch ? 'is_plus_one_allowed'
    and jsonb_typeof(household_patch -> 'is_plus_one_allowed') <> 'boolean'
  then
    raise exception 'Invalid plus-one setting' using errcode = '22023';
  end if;
  if household_patch ? 'checked_in'
    and jsonb_typeof(household_patch -> 'checked_in') <> 'boolean'
  then
    raise exception 'Invalid check-in setting' using errcode = '22023';
  end if;
  if char_length(coalesce(household_patch ->> 'dietary_details', '')) > 2000
    or char_length(coalesce(household_patch ->> 'meal_selection', '')) > 200
    or char_length(coalesce(household_patch ->> 'song_request', '')) > 500
    or char_length(coalesce(household_patch ->> 'message', '')) > 2000
    or char_length(coalesce(household_patch ->> 'table_number', '')) > 80
  then
    raise exception 'One or more household fields are too long' using errcode = '22023';
  end if;

  if household_patch ? 'tags' then
    if jsonb_typeof(household_patch -> 'tags') <> 'array'
      or jsonb_array_length(household_patch -> 'tags') > 2
      or exists (
        select 1
        from jsonb_array_elements(household_patch -> 'tags') as tag(value)
        where jsonb_typeof(tag.value) <> 'string'
          or tag.value #>> '{}' not in ('free_venue_housing', 'presence_is_our_gift')
      )
    then
      raise exception 'Invalid household tags' using errcode = '22023';
    end if;
    select coalesce(array_agg(distinct value), '{}') into requested_tags
    from jsonb_array_elements_text(household_patch -> 'tags');
  else
    requested_tags := household_row.tags;
  end if;

  if household_patch ? 'dietary_restrictions' then
    if jsonb_typeof(household_patch -> 'dietary_restrictions') <> 'array'
      or jsonb_array_length(household_patch -> 'dietary_restrictions') > 20
      or exists (
        select 1
        from jsonb_array_elements(household_patch -> 'dietary_restrictions') as restriction(value)
        where jsonb_typeof(restriction.value) <> 'string'
          or char_length(restriction.value #>> '{}') > 100
      )
    then
      raise exception 'Invalid household dietary restrictions' using errcode = '22023';
    end if;
  end if;

  final_max_party_size := case when household_patch ? 'max_party_size'
    then (household_patch ->> 'max_party_size')::integer else household_row.max_party_size end;
  final_rsvp_status := case when household_patch ? 'rsvp_status'
    then household_patch ->> 'rsvp_status' else household_row.rsvp_status end;
  final_attending_count := case when household_patch ? 'attending_count'
    then (household_patch ->> 'attending_count')::integer else household_row.attending_count end;
  if final_attending_count > final_max_party_size
    or (final_rsvp_status <> 'attending' and final_attending_count <> 0)
  then
    raise exception 'Household attendance is inconsistent' using errcode = '22023';
  end if;

  update public.households
  set
    display_name = case when household_patch ? 'display_name' then trim(household_patch ->> 'display_name') else display_name end,
    email = case when household_patch ? 'email' then nullif(trim(household_patch ->> 'email'), '') else email end,
    phone = case when household_patch ? 'phone' then nullif(trim(household_patch ->> 'phone'), '') else phone end,
    rsvp_status = final_rsvp_status,
    max_party_size = final_max_party_size,
    attending_count = final_attending_count,
    dietary_restrictions = case when household_patch ? 'dietary_restrictions'
      then array(select jsonb_array_elements_text(household_patch -> 'dietary_restrictions')) else dietary_restrictions end,
    dietary_details = case when household_patch ? 'dietary_details' then nullif(trim(household_patch ->> 'dietary_details'), '') else dietary_details end,
    meal_selection = case when household_patch ? 'meal_selection' then nullif(trim(household_patch ->> 'meal_selection'), '') else meal_selection end,
    song_request = case when household_patch ? 'song_request' then nullif(trim(household_patch ->> 'song_request'), '') else song_request end,
    message = case when household_patch ? 'message' then nullif(trim(household_patch ->> 'message'), '') else message end,
    table_number = case when household_patch ? 'table_number' then nullif(trim(household_patch ->> 'table_number'), '') else table_number end,
    is_plus_one_allowed = case when household_patch ? 'is_plus_one_allowed' then (household_patch ->> 'is_plus_one_allowed')::boolean else is_plus_one_allowed end,
    checked_in = case when household_patch ? 'checked_in' then (household_patch ->> 'checked_in')::boolean else checked_in end,
    tags = requested_tags
  where id = household_row.id;

  if members_payload is not null then
    if jsonb_typeof(members_payload) <> 'array' then
      raise exception 'Invalid household member roster' using errcode = '22023';
    end if;
    if jsonb_array_length(members_payload) not between 1 and 20 then
      raise exception 'A household needs between 1 and 20 members' using errcode = '22023';
    end if;

    for member_payload in select value from jsonb_array_elements(members_payload)
    loop
      if jsonb_typeof(member_payload) <> 'object'
        or jsonb_typeof(member_payload -> 'name') <> 'string'
        or char_length(trim(member_payload ->> 'name')) not between 1 and 160
      then
        raise exception 'Invalid household member name' using errcode = '22023';
      end if;
      if member_payload ? 'email' and (
        jsonb_typeof(member_payload -> 'email') not in ('string', 'null')
        or char_length(coalesce(member_payload ->> 'email', '')) > 320
      ) then
        raise exception 'Invalid member email' using errcode = '22023';
      end if;
      if member_payload ? 'phone' and (
        jsonb_typeof(member_payload -> 'phone') not in ('string', 'null')
        or char_length(coalesce(member_payload ->> 'phone', '')) > 40
      ) then
        raise exception 'Invalid member phone' using errcode = '22023';
      end if;
      if member_payload ? 'is_primary' and jsonb_typeof(member_payload -> 'is_primary') <> 'boolean' then
        raise exception 'Invalid primary-member setting' using errcode = '22023';
      end if;
      if member_payload ? 'is_invited' and jsonb_typeof(member_payload -> 'is_invited') <> 'boolean' then
        raise exception 'Invalid invited-member setting' using errcode = '22023';
      end if;
      if member_payload ? 'attending' and jsonb_typeof(member_payload -> 'attending') not in ('boolean', 'null') then
        raise exception 'Invalid member attendance setting' using errcode = '22023';
      end if;
      if char_length(coalesce(member_payload ->> 'meal_selection', '')) > 200
        or char_length(coalesce(member_payload ->> 'dietary_details', '')) > 2000
      then
        raise exception 'One or more member fields are too long' using errcode = '22023';
      end if;
      if member_payload ? 'dietary_restrictions' then
        if jsonb_typeof(member_payload -> 'dietary_restrictions') <> 'array'
          or jsonb_array_length(member_payload -> 'dietary_restrictions') > 20
          or exists (
            select 1
            from jsonb_array_elements(member_payload -> 'dietary_restrictions') as restriction(value)
            where jsonb_typeof(restriction.value) <> 'string'
              or char_length(restriction.value #>> '{}') > 100
          )
        then
          raise exception 'Invalid member dietary restrictions' using errcode = '22023';
        end if;
      end if;

      if coalesce((member_payload ->> 'is_primary')::boolean, false) then
        primary_member_count := primary_member_count + 1;
      end if;
      if coalesce((member_payload ->> 'is_invited')::boolean, true) then
        invited_member_count := invited_member_count + 1;
      end if;

      member_id_text := nullif(trim(member_payload ->> 'id'), '');
      if member_id_text is not null then
        if member_id_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
          or member_id_text::uuid = any(submitted_member_ids)
          or not exists (
            select 1 from public.household_members member_row
            where member_row.id = member_id_text::uuid
              and member_row.household_id = household_row.id
          )
        then
          raise exception 'Invalid or duplicate household member identifier' using errcode = '22023';
        end if;
        submitted_member_ids := array_append(submitted_member_ids, member_id_text::uuid);
      end if;
    end loop;

    if primary_member_count <> 1 then
      raise exception 'Exactly one household member must be primary' using errcode = '22023';
    end if;
    if invited_member_count > final_max_party_size or final_attending_count > invited_member_count then
      raise exception 'Member roster exceeds the household allowance' using errcode = '22023';
    end if;

    update public.household_members set is_primary = false where household_id = household_row.id;
    delete from public.household_members
    where household_id = household_row.id
      and not (id = any(submitted_member_ids));

    for member_payload in select value from jsonb_array_elements(members_payload)
    loop
      select coalesce(array_agg(value), '{}') into member_restrictions
      from jsonb_array_elements_text(coalesce(member_payload -> 'dietary_restrictions', '[]'::jsonb));
      member_id_text := nullif(trim(member_payload ->> 'id'), '');
      if member_id_text is null then
        insert into public.household_members (
          household_id, name, email, phone, is_primary, is_invited, attending,
          meal_selection, dietary_restrictions, dietary_details
        ) values (
          household_row.id,
          trim(member_payload ->> 'name'),
          nullif(trim(member_payload ->> 'email'), ''),
          nullif(trim(member_payload ->> 'phone'), ''),
          coalesce((member_payload ->> 'is_primary')::boolean, false),
          coalesce((member_payload ->> 'is_invited')::boolean, true),
          case when member_payload ? 'attending' then (member_payload ->> 'attending')::boolean else null end,
          nullif(trim(member_payload ->> 'meal_selection'), ''),
          member_restrictions,
          nullif(trim(member_payload ->> 'dietary_details'), '')
        );
      else
        update public.household_members
        set
          name = trim(member_payload ->> 'name'),
          email = nullif(trim(member_payload ->> 'email'), ''),
          phone = nullif(trim(member_payload ->> 'phone'), ''),
          is_primary = coalesce((member_payload ->> 'is_primary')::boolean, false),
          is_invited = coalesce((member_payload ->> 'is_invited')::boolean, true),
          attending = case when member_payload ? 'attending' then (member_payload ->> 'attending')::boolean else null end,
          meal_selection = nullif(trim(member_payload ->> 'meal_selection'), ''),
          dietary_restrictions = member_restrictions,
          dietary_details = nullif(trim(member_payload ->> 'dietary_details'), '')
        where id = member_id_text::uuid
          and household_id = household_row.id;
      end if;
    end loop;
  end if;

  select jsonb_build_object(
    'household', jsonb_build_object(
      'id', updated_household.id,
      'display_name', updated_household.display_name,
      'email', updated_household.email,
      'phone', updated_household.phone,
      'invite_code', updated_household.invite_code,
      'rsvp_status', updated_household.rsvp_status,
      'max_party_size', updated_household.max_party_size,
      'attending_count', updated_household.attending_count,
      'dietary_restrictions', updated_household.dietary_restrictions,
      'dietary_details', updated_household.dietary_details,
      'meal_selection', updated_household.meal_selection,
      'song_request', updated_household.song_request,
      'message', updated_household.message,
      'table_number', updated_household.table_number,
      'is_plus_one_allowed', updated_household.is_plus_one_allowed,
      'checked_in', updated_household.checked_in,
      'tags', updated_household.tags,
      'responded_at', updated_household.responded_at,
      'household_members', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', member_row.id,
          'household_id', member_row.household_id,
          'name', member_row.name,
          'email', member_row.email,
          'phone', member_row.phone,
          'is_primary', member_row.is_primary,
          'is_invited', member_row.is_invited,
          'attending', member_row.attending,
          'meal_selection', member_row.meal_selection,
          'dietary_restrictions', member_row.dietary_restrictions,
          'dietary_details', member_row.dietary_details
        ) order by member_row.is_primary desc, member_row.created_at)
        from public.household_members member_row
        where member_row.household_id = updated_household.id
      ), '[]'::jsonb)
    )
  ) into result
  from public.households updated_household
  where updated_household.id = household_row.id;

  return result;
end;
$$;

revoke all on function public.update_household_with_members(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.update_household_with_members(uuid, jsonb, jsonb) to authenticated;

create or replace function public.invitation_bundle(target_household_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  household_row public.households%rowtype;
  household_json jsonb;
  accommodation_json jsonb := '[]'::jsonb;
  services_json jsonb := '[]'::jsonb;
  registry_json jsonb := '[]'::jsonb;
begin
  select * into household_row
  from public.households
  where id = target_household_id;

  if household_row.id is null then
    return null;
  end if;

  -- The invite code is a bearer credential, so expose only what the guest
  -- experience actually needs. Operational fields (table/check-in/timestamps)
  -- and individual member contact details never leave this function.
  household_json := jsonb_build_object(
    'id', household_row.id,
    'display_name', household_row.display_name,
    'email', household_row.email,
    'phone', household_row.phone,
    'invite_code', household_row.invite_code,
    'rsvp_status', household_row.rsvp_status,
    'max_party_size', household_row.max_party_size,
    'attending_count', household_row.attending_count,
    'is_plus_one_allowed', household_row.is_plus_one_allowed,
    'tags', household_row.tags,
    'household_members', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', member_row.id,
          'name', member_row.name,
          'attending', member_row.attending,
          'meal_selection', member_row.meal_selection,
          'dietary_restrictions', member_row.dietary_restrictions,
          'dietary_details', member_row.dietary_details
        )
        order by member_row.is_primary desc, member_row.created_at
      )
      from public.household_members member_row
      where member_row.household_id = household_row.id
        and member_row.is_invited
    ), '[]'::jsonb)
  );

  if household_row.rsvp_status = 'attending' then
    select coalesce(jsonb_agg(
      jsonb_build_object(
        'id', item.id,
        'name', item.name,
        'description', item.description,
        'address', item.address,
        'phone', item.phone,
        'email', item.email,
        'booking_code', item.booking_code,
        'distance', item.distance,
        'link', item.link,
        'rate', item.rate,
        'price_amount', item.price_amount,
        'currency', item.currency,
        'price_unit', item.price_unit,
        'visibility', item.visibility,
        'is_venue_housing', item.is_venue_housing,
        'published', true,
        'sort_order', item.sort_order
      )
      order by item.price_amount nulls last, item.sort_order
    ), '[]'::jsonb)
    into accommodation_json
    from public.accommodations item
    where item.published
      and (
        ('free_venue_housing' = any(household_row.tags) and item.visibility = 'free_venue_housing')
        or
        (not ('free_venue_housing' = any(household_row.tags)) and item.visibility = 'general')
      );

    select coalesce(jsonb_agg(
      jsonb_build_object(
        'id', item.id,
        'category', item.category,
        'name', item.name,
        'description', item.description,
        'contact_name', item.contact_name,
        'phone', item.phone,
        'email', item.email,
        'link', item.link,
        'price_amount', item.price_amount,
        'currency', item.currency,
        'price_unit', item.price_unit,
        'visibility', item.visibility,
        'published', true,
        'sort_order', item.sort_order
      )
      order by item.price_amount nulls last, item.sort_order
    ), '[]'::jsonb)
    into services_json
    from public.wedding_services item
    where item.published
      and (
        ('free_venue_housing' = any(household_row.tags) and item.visibility = 'free_venue_housing')
        or (not ('free_venue_housing' = any(household_row.tags)) and item.visibility = 'general')
      );

    if not ('presence_is_our_gift' = any(household_row.tags)) then
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'id', item.id,
          'title', item.title,
          'description', item.description,
          'link', item.link,
          'type', item.type,
          'icon', item.icon,
          'goal_amount', item.goal_amount,
          'current_amount', item.current_amount,
          'account_details', item.account_details,
          'published', true,
          'sort_order', item.sort_order
        )
        order by item.sort_order
      ), '[]'::jsonb)
      into registry_json
      from public.registry_items item
      where item.published;
    end if;
  end if;

  return jsonb_build_object(
    'household', household_json,
    'accommodations', accommodation_json,
    'services', services_json,
    'registry_items', registry_json
  );
end;
$$;

create or replace function public.lookup_invitation(raw_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  household_id uuid;
begin
  if raw_token is null or char_length(trim(raw_token)) < 16 then
    return null;
  end if;

  select id into household_id
  from public.households
  where invite_code = upper(trim(raw_token))
  limit 1;

  if household_id is null then
    return null;
  end if;

  return public.invitation_bundle(household_id);
end;
$$;

create or replace function public.submit_household_rsvp(raw_token text, response jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
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
  if raw_token is null or char_length(trim(raw_token)) < 16 then
    raise exception 'Invitation not found' using errcode = 'P0002';
  end if;

  if response is null or jsonb_typeof(response) <> 'object' then
    raise exception 'Invalid RSVP response' using errcode = '22023';
  end if;

  select * into household_row
  from public.households
  where invite_code = upper(trim(raw_token))
  for update;

  if household_row.id is null then
    raise exception 'Invitation not found' using errcode = 'P0002';
  end if;

  response_status := response ->> 'rsvpStatus';
  if response_status not in ('attending', 'declined') then
    raise exception 'Invalid RSVP status' using errcode = '22023';
  end if;

  if coalesce(response ->> 'attendingCount', '') <> ''
    and (
      (response ->> 'attendingCount') !~ '^[0-9]+$'
      or char_length(response ->> 'attendingCount') > 2
    )
  then
    raise exception 'Invalid attending count' using errcode = '22023';
  end if;
  response_count := coalesce(nullif(response ->> 'attendingCount', '')::integer, 0);

  response_members := coalesce(response -> 'members', '[]'::jsonb);
  if jsonb_typeof(response_members) <> 'array' then
    raise exception 'Invalid household member response' using errcode = '22023';
  end if;
  if jsonb_array_length(response_members) > household_row.max_party_size then
    raise exception 'Invalid household member response' using errcode = '22023';
  end if;

  if char_length(coalesce(response ->> 'email', '')) > 320
    or char_length(coalesce(response ->> 'phone', '')) > 40
    or char_length(coalesce(response ->> 'mealSelection', '')) > 200
    or char_length(coalesce(response ->> 'dietaryDetails', '')) > 2000
    or char_length(coalesce(response ->> 'songRequest', '')) > 500
    or char_length(coalesce(response ->> 'message', '')) > 2000
  then
    raise exception 'One or more RSVP fields are too long' using errcode = '22023';
  end if;

  if response ? 'dietaryRestrictions' then
    if jsonb_typeof(response -> 'dietaryRestrictions') <> 'array' then
      raise exception 'Invalid dietary restrictions' using errcode = '22023';
    end if;
    if jsonb_array_length(response -> 'dietaryRestrictions') > 20 or exists (
      select 1
      from jsonb_array_elements(response -> 'dietaryRestrictions') as restriction(value)
      where jsonb_typeof(restriction.value) <> 'string'
        or char_length(restriction.value #>> '{}') > 100
    ) then
      raise exception 'Invalid dietary restrictions' using errcode = '22023';
    end if;
  end if;

  select count(*) into invited_member_count
  from public.household_members
  where household_id = household_row.id
    and is_invited;

  -- First validate the complete submitted roster without mutating anything.
  -- A later exception therefore cannot leave a partially-applied RSVP.
  for member_payload in select value from jsonb_array_elements(response_members)
  loop
    if jsonb_typeof(member_payload) <> 'object'
      or member_payload -> 'attending' is null
      or jsonb_typeof(member_payload -> 'attending') <> 'boolean'
    then
      raise exception 'Every household member needs a valid attendance response' using errcode = '22023';
    end if;

    if char_length(coalesce(member_payload ->> 'name', '')) > 160
      or char_length(coalesce(member_payload ->> 'mealSelection', '')) > 200
      or char_length(coalesce(member_payload ->> 'dietaryDetails', '')) > 2000
    then
      raise exception 'One or more member RSVP fields are too long' using errcode = '22023';
    end if;

    if member_payload ? 'dietaryRestrictions' then
      if jsonb_typeof(member_payload -> 'dietaryRestrictions') <> 'array' then
        raise exception 'Invalid member dietary restrictions' using errcode = '22023';
      end if;
      if jsonb_array_length(member_payload -> 'dietaryRestrictions') > 20 or exists (
        select 1
        from jsonb_array_elements(member_payload -> 'dietaryRestrictions') as restriction(value)
        where jsonb_typeof(restriction.value) <> 'string'
          or char_length(restriction.value #>> '{}') > 100
      ) then
        raise exception 'Invalid member dietary restrictions' using errcode = '22023';
      end if;
    end if;

    member_attending := (member_payload ->> 'attending')::boolean;
    if member_attending then
      submitted_attending_count := submitted_attending_count + 1;
    end if;

    member_id_text := nullif(trim(member_payload ->> 'id'), '');
    if member_id_text is not null then
      if member_id_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
        raise exception 'Invalid household member identifier' using errcode = '22023';
      end if;
      if member_id_text::uuid = any(submitted_member_ids) then
        raise exception 'A household member was submitted more than once' using errcode = '22023';
      end if;
      if not exists (
        select 1
        from public.household_members member_row
        where member_row.id = member_id_text::uuid
          and member_row.household_id = household_row.id
          and member_row.is_invited
      ) then
        raise exception 'An uninvited household member was submitted' using errcode = '42501';
      end if;
      submitted_member_ids := array_append(submitted_member_ids, member_id_text::uuid);
    else
      submitted_new_count := submitted_new_count + 1;
      if not household_row.is_plus_one_allowed
        or response_status <> 'attending'
        or not member_attending
        or char_length(trim(coalesce(member_payload ->> 'name', ''))) not between 1 and 160
      then
        raise exception 'This invitation does not allow that additional guest' using errcode = '42501';
      end if;
    end if;
  end loop;

  if coalesce(array_length(submitted_member_ids, 1), 0) <> invited_member_count then
    raise exception 'A response is required for every invited household member' using errcode = '22023';
  end if;

  if invited_member_count + submitted_new_count > household_row.max_party_size then
    raise exception 'The RSVP exceeds the invitation allowance' using errcode = '22023';
  end if;

  if response_count <> submitted_attending_count
    or response_count > household_row.max_party_size
    or (response_status = 'attending' and response_count < 1)
    or (response_status = 'declined' and response_count <> 0)
  then
    raise exception 'Attending count does not match the household responses' using errcode = '22023';
  end if;

  select coalesce(array_agg(value), '{}') into restrictions
  from jsonb_array_elements_text(coalesce(response -> 'dietaryRestrictions', '[]'::jsonb));

  -- Apply only RSVP-owned fields. Existing names and individual contact details
  -- remain admin-managed and cannot be rewritten by an invitation holder.
  for member_payload in select value from jsonb_array_elements(response_members)
  loop
    select coalesce(array_agg(value), '{}') into restrictions
    from jsonb_array_elements_text(coalesce(member_payload -> 'dietaryRestrictions', '[]'::jsonb));

    member_id_text := nullif(trim(member_payload ->> 'id'), '');
    if member_id_text is not null then
      update public.household_members
      set
        attending = (member_payload ->> 'attending')::boolean,
        meal_selection = nullif(trim(member_payload ->> 'mealSelection'), ''),
        dietary_restrictions = restrictions,
        dietary_details = nullif(trim(member_payload ->> 'dietaryDetails'), '')
      where id = member_id_text::uuid
        and household_id = household_row.id
        and is_invited;
    else
      insert into public.household_members (
        household_id, name, is_primary, is_invited, attending,
        meal_selection, dietary_restrictions, dietary_details
      ) values (
        household_row.id,
        left(trim(member_payload ->> 'name'), 160),
        false,
        true,
        true,
        nullif(trim(member_payload ->> 'mealSelection'), ''),
        restrictions,
        nullif(trim(member_payload ->> 'dietaryDetails'), '')
      );
    end if;
  end loop;

  select count(*) into persisted_attending_count
  from public.household_members
  where household_id = household_row.id
    and is_invited
    and attending is true;

  if persisted_attending_count <> response_count then
    raise exception 'Stored attendance does not match the RSVP' using errcode = '23514';
  end if;

  update public.households
  set
    email = coalesce(nullif(trim(response ->> 'email'), ''), email),
    phone = coalesce(nullif(trim(response ->> 'phone'), ''), phone),
    rsvp_status = response_status,
    attending_count = persisted_attending_count,
    dietary_restrictions = restrictions,
    dietary_details = nullif(trim(response ->> 'dietaryDetails'), ''),
    meal_selection = nullif(trim(response ->> 'mealSelection'), ''),
    song_request = nullif(trim(response ->> 'songRequest'), ''),
    message = nullif(trim(response ->> 'message'), ''),
    responded_at = timezone('utc', now())
  where id = household_row.id;

  if nullif(trim(response ->> 'message'), '') is not null then
    insert into public.wishes (household_id, name, message, approved)
    values (household_row.id, household_row.display_name, left(trim(response ->> 'message'), 2000), false)
    on conflict (household_id) do update
    set message = excluded.message, approved = false, updated_at = timezone('utc', now());
  end if;

  return public.invitation_bundle(household_row.id);
end;
$$;

revoke all on function public.invitation_bundle(uuid) from public, anon, authenticated;
revoke all on function public.lookup_invitation(text) from public;
revoke all on function public.submit_household_rsvp(text, jsonb) from public;
grant execute on function public.lookup_invitation(text) to anon, authenticated;
grant execute on function public.submit_household_rsvp(text, jsonb) to anon, authenticated;

insert into public.site_config (id, config)
values (
  'main',
  jsonb_build_object(
    'brideName', 'Abby',
    'brideShortName', 'Abby',
    'groomName', 'Cameron Nel',
    'groomShortName', 'Cam',
    'weddingDate', '2027-01-04',
    'timezone', 'Africa/Johannesburg',
    'rsvpDeadline', '',
    'contactEmail', '',
    'siteUrl', 'https://cameronnel.github.io/camandabbywedding/',
    'tbcFields', jsonb_build_object(
      'weddingDate', false,
      'rsvpDeadline', true,
      'ceremonyVenue', true,
      'receptionVenue', true,
      'dressCode', true
    ),
    'tagline', '',
    'hashtag', '',
    'quote', '',
    'quoteAuthor', '',
    'ceremonyVenue', jsonb_build_object(
      'name', 'ArendsRus Country Lodge',
      'address', 'Koesterbos Road, Geelhoutboom',
      'city', 'George, Western Cape, South Africa',
      'time', 'To be confirmed',
      'mapUrl', 'https://maps.google.com/?q=ArendsRus+Country+Lodge+George+South+Africa',
      'description', ''
    ),
    'receptionVenue', jsonb_build_object(
      'name', 'ArendsRus Country Lodge',
      'address', 'Koesterbos Road, Geelhoutboom',
      'city', 'George, Western Cape, South Africa',
      'time', 'To be confirmed',
      'mapUrl', 'https://maps.google.com/?q=ArendsRus+Country+Lodge+George+South+Africa',
      'description', ''
    ),
    'dressCode', jsonb_build_object('title', '', 'description', '', 'palette', '[]'::jsonb),
    'mealOptions', '[]'::jsonb
  )
)
on conflict (id) do nothing;

insert into public.invitation_templates (kind, name)
values
  ('save_the_date', 'Save the date'),
  ('official_invitation', 'Official invitation')
on conflict (kind) do nothing;

insert into public.gallery_items (storage_path, public_url, category, title, alt_text, published, sort_order)
values
  ('bundled/images/couple.jpg', 'https://cameronnel.github.io/camandabbywedding/images/couple.jpg', 'couple', 'Cam & Abby', 'Cam and Abby', true, 0),
  ('bundled/images/hero-arendsrus.jpg', 'https://cameronnel.github.io/camandabbywedding/images/hero-arendsrus.jpg', 'venue', 'ArendsRus Country Lodge', 'ArendsRus Country Lodge', true, 1),
  ('bundled/images/venue.jpg', 'https://cameronnel.github.io/camandabbywedding/images/venue.jpg', 'venue', 'ArendsRus Country Lodge', 'ArendsRus Country Lodge venue', true, 2),
  ('bundled/images/chapel.jpg', 'https://cameronnel.github.io/camandabbywedding/images/chapel.jpg', 'venue', 'ArendsRus Country Lodge', 'ArendsRus Country Lodge ceremony area', true, 3)
on conflict (storage_path) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('wedding-gallery', 'wedding-gallery', true, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('wedding-invitations', 'wedding-invitations', false, 41943040, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can read wedding gallery objects"
  on storage.objects for select
  to public
  using (bucket_id = 'wedding-gallery');
create policy "Admins upload wedding gallery objects"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'wedding-gallery' and (select public.is_wedding_admin()));
create policy "Admins update wedding gallery objects"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'wedding-gallery' and (select public.is_wedding_admin()))
  with check (bucket_id = 'wedding-gallery' and (select public.is_wedding_admin()));
create policy "Admins delete wedding gallery objects"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'wedding-gallery' and (select public.is_wedding_admin()));
create policy "Admins read generated invitations"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'wedding-invitations' and (select public.is_wedding_admin()));
