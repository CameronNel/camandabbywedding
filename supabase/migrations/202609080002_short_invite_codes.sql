-- Update default invite code generator to 3 letters + 2 digits (e.g. WED42)
create or replace function public.generate_wedding_invite_code()
returns text
language sql
volatile
set search_path = ''
as 
  select upper(
    substring(
      coalesce(
        nullif(regexp_replace(current_setting('wedding.household_name', true), '[^a-zA-Z]', '', 'g'), ''),
        'WED'
      ) from 1 for 3
    )
  ) || lpad(floor(random() * 100)::text, 2, '0');
;
