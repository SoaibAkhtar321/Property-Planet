-- 0011_signup_role_selection.sql
--
-- Auth architecture change: buyers register via Google OAuth (always role
-- 'buyer'); sellers/agents register via a separate self-serve email/password
-- form and should land as role 'seller' as soon as they confirm their email
-- -- no admin approval step on the role itself. The actual trust gate stays
-- where it already was: a seller's *listings* still go draft -> pending ->
-- published only after admin approval (0002/0008/0009), completely
-- unchanged by this migration.
--
-- handle_new_user() previously always inserted role = 'buyer' (the column
-- default) regardless of what the client sent. This replaces it with a
-- trigger that reads an intended role out of auth.users.raw_user_meta_data,
-- but only ever honors 'buyer' or 'seller' from it -- 'admin' (or anything
-- else/garbage) is always coerced to 'buyer'. Admin is, and remains, never
-- self-serve: it can only ever be granted by a manual UPDATE on `profiles`
-- by an existing admin/DB operator, never via signup metadata.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
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

  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', resolved_role);
  return new;
end;
$$;
