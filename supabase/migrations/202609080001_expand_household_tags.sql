-- Allow wedding party, honored VIP roles, and custom tags on households.
-- This drops the restrictive check constraint so tags can contain roles such as
-- bridesmaid, groomsman, best_man, maid_of_honor, master_of_ceremonies, etc.

alter table public.households drop constraint if exists households_allowed_tags;
