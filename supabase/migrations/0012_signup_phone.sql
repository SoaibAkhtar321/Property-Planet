-- 0012_signup_phone.sql
--
-- Seller registration now collects a required phone number
-- (SellerRegisterForm.tsx), but nothing wrote it to `profiles.phone` --
-- 0011's handle_new_user() only ever read `full_name` and `role` out of
-- raw_user_meta_data. This migration is a NEW file rather than an edit to
-- 0001/0011 because those migrations are already applied against the live
-- database; Postgres migrations here are append-only, so the fix is a
-- create-or-replace of the same function in a new file, exactly like 0011
-- itself did to 0001's version of handle_new_user().
--
-- Buyers are unaffected: they sign up via Google OAuth only, which never
-- sends a `phone` in raw_user_meta_data, so `requested_phone` below is
-- simply null for them and the insert behaves exactly as it did before --
-- the mandatory-phone buyer flow is a separate, later profile-completion
-- step (see /auth/complete-profile), not something this trigger enforces.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
  requested_phone text := new.raw_user_meta_data ->> 'phone';
  resolved_role user_role := 'buyer';
begin
  if requested_role = 'seller' then
    resolved_role := 'seller';
  end if;
  -- Any other value (including 'admin', null, or garbage) stays 'buyer'.
  -- This is the only place role is ever set from signup input; every RLS
  -- policy still re-derives role from this table on every request, never
  -- from the client, so this trigger is the sole point that needs to stay
  -- correct for the "no self-serve admin" guarantee to hold.

  insert into public.profiles (id, full_name, phone, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', requested_phone, resolved_role);
  return new;
end;
$$;
