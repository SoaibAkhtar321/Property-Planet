-- 0030_account_deletion.sql
-- Phase 3: self-service account deletion for buyers and sellers.
--
-- Two-step delete, matching the split already established elsewhere in
-- this schema between "what RLS-respecting code can do" and "what only
-- the service role can do" (see src/lib/supabase/server.ts):
--
--   1. request_own_account_deletion() -- this migration. Runs as the
--      calling user via the RLS-respecting client. Scrubs/anonymizes the
--      personal data this account is directly responsible for and
--      archives (unpublishes) any properties it owns. Takes NO user_id
--      parameter -- it only ever operates on auth.uid() -- so there is
--      nothing for a client to spoof into deleting someone else's data.
--
--   2. Deleting the auth.users row itself -- done from server-side
--      application code via createServiceClient().auth.admin.deleteUser(),
--      AFTER step 1 succeeds (see src/lib/account/actions.ts). Postgres/
--      RLS has no ability to call the Supabase Auth admin API, so this
--      part cannot live in a SQL function. That delete then cascades
--      (profiles.id -> auth.users(id) ON DELETE CASCADE, 0001) to remove
--      the profile row itself, plus favourites (already emptied below)
--      and notifications (purely personal, 0022) via their own existing
--      ON DELETE CASCADE.
--
-- Three existing foreign keys pointed straight at profiles(id) with
-- ON DELETE CASCADE or (for seller_contact_reveals) no delete action at
-- all -- meaning a profile disappearing would previously either silently
-- wipe out business records the property owner / admin still legitimately
-- need (a seller's properties, and every lead ever filed against them),
-- or block the delete outright with a foreign-key violation
-- (seller_contact_reveals.revealed_to, NOT NULL with no ON DELETE action).
-- Both are wrong for this feature: deleting *a person* should not delete
-- *the business records about them*. All three are changed here to
-- ON DELETE SET NULL instead, so the row survives with the personal link
-- removed:
--
--   * properties.owner_id  -- a seller's listings are archived by this
--     function (below) while still owned, then detached (owner_id NULL)
--     only once the profile row is actually deleted. Never cascade-
--     deleted: buyers who already inquired, and the seller's own past
--     listing history, are not erased just because the seller account
--     closed.
--   * leads.buyer_id       -- already nullable since 0021 (general
--     contact-form leads). The row (property, status, dates) is kept as
--     the seller's/admin's business record that an enquiry happened;
--     every free-text/contact field the buyer supplied is scrubbed by
--     this function first, so no personal data rides along on the
--     orphaned row.
--   * seller_contact_reveals.revealed_to -- this is a security audit
--     trail (who was shown an exact address, and when); it must survive
--     the person leaving, just with the identity redacted.

-- ===========================================================================
-- 1. Loosen the three FKs
-- ===========================================================================

alter table properties
  alter column owner_id drop not null;
alter table properties
  drop constraint if exists properties_owner_id_fkey;
alter table properties
  add constraint properties_owner_id_fkey
  foreign key (owner_id) references profiles (id) on delete set null;

comment on column properties.owner_id is
  'The seller who owns this listing. NULL if that seller''s account has '
  'since been deleted (see request_own_account_deletion(), 0030) -- the '
  'property itself is preserved (archived, not cascade-deleted) rather '
  'than disappearing along with the account.';

alter table leads
  drop constraint if exists leads_buyer_id_fkey;
alter table leads
  add constraint leads_buyer_id_fkey
  foreign key (buyer_id) references profiles (id) on delete set null;

comment on column leads.buyer_id is
  'The signed-in buyer this lead belongs to. NULL for a general '
  'contact-form lead (0021), or once that buyer''s account has since been '
  'deleted (0030) -- contact_name/contact_email/contact_phone/message are '
  'scrubbed by request_own_account_deletion() before the buyer_id link is '
  'ever removed, so no personal data rides along on the orphaned row.';

alter table seller_contact_reveals
  alter column revealed_to drop not null;
alter table seller_contact_reveals
  drop constraint if exists seller_contact_reveals_revealed_to_fkey;
alter table seller_contact_reveals
  add constraint seller_contact_reveals_revealed_to_fkey
  foreign key (revealed_to) references profiles (id) on delete set null;

comment on column seller_contact_reveals.revealed_to is
  'Who an exact address was revealed to. NULL if that account has since '
  'been deleted (0030) -- this audit trail (which lead, when, why) is a '
  'security record and is preserved even though the identity behind it '
  'is not.';

-- ===========================================================================
-- 2. Let request_own_account_deletion() archive a seller's properties
--    regardless of their current status.
--
-- enforce_seller_property_update() (0008) otherwise only allows a
-- non-admin caller to move a property draft -> pending or draft ->
-- archived. That is correct for ordinary seller edits, but account
-- deletion legitimately needs to archive a *published* (or pending)
-- listing too. Re-stated in full (create or replace) with one additional,
-- narrowly-scoped bypass: a session-local flag that ONLY
-- request_own_account_deletion() ever sets, and only for the duration of
-- its own transaction -- there is no client-callable path that can set
-- it. Every other rule in this function (owner_id immutable,
-- published_at immutable, draft -> pending/archived for ordinary seller
-- edits) is unchanged.
-- ===========================================================================

create or replace function enforce_seller_property_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Admins keep unrestricted update rights (moderation transitions,
  -- corrections, etc.) — this trigger only constrains non-admin callers.
  if current_role_is('admin') then
    return new;
  end if;

  -- 0030: account deletion needs to archive a seller's properties
  -- whatever their current status (a published listing included), which
  -- the ordinary seller-edit rule below does not allow. Only
  -- request_own_account_deletion() ever sets this, transaction-locally,
  -- on itself — never reachable from any client-callable path.
  if current_setting('app.deleting_own_account', true) = 'true' then
    return new;
  end if;

  -- owner_id is never transferable by anyone but an admin (defense in
  -- depth on top of the RLS check, which already requires
  -- auth.uid() = owner_id on both the old and new row).
  if new.owner_id is distinct from old.owner_id then
    raise exception 'owner_id cannot be changed';
  end if;

  -- published_at is derived, not seller-settable. The only trigger that
  -- may set it is properties_set_published_at, and a non-admin can never
  -- drive a transition into 'published' (see status check below), so pin
  -- it to its previous value for non-admin callers.
  if new.published_at is distinct from old.published_at then
    raise exception 'published_at cannot be set directly';
  end if;

  -- Seller-owned lifecycle: draft -> pending (submit for review) and
  -- draft -> archived (seller's removal mechanism — see brief, no physical
  -- delete). Any other transition, including no-op edits to a non-draft
  -- row's status column, is a moderation action and belongs to admin only.
  if new.status is distinct from old.status then
    if old.status = 'draft' and new.status in ('pending', 'archived') then
      -- allowed
    else
      raise exception
        'sellers may only move a property from draft to pending or archived (attempted % -> %)',
        old.status, new.status;
    end if;
  end if;

  return new;
end;
$$;

comment on function enforce_seller_property_update is
  'BEFORE UPDATE trigger backstop for `properties`. RLS (0002) already '
  'restricts non-admin updates to rows the caller owns; this adds the '
  'column/transition-level restriction RLS cannot express (no OLD-vs-NEW '
  'comparison in a single policy): non-admin callers cannot change '
  'owner_id or published_at, and may only move status draft -> pending or '
  'draft -> archived for an ordinary edit. Admins are exempt and keep '
  'full moderation rights. request_own_account_deletion() (0030) is '
  'exempt for the single archive-on-deletion write it performs, via a '
  'transaction-local session flag only that function ever sets.';

-- ===========================================================================
-- 3. request_own_account_deletion()
-- ===========================================================================

create or replace function request_own_account_deletion()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_role user_role;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select role into v_role from profiles where id = v_uid;

  if v_role is null then
    raise exception 'no profile found for this account';
  end if;

  if v_role = 'admin' then
    raise exception 'admin accounts cannot be deleted through this function';
  end if;

  -- Let the one archive write below bypass the ordinary seller
  -- draft-only status-transition rule (see enforce_seller_property_update
  -- above). Local to this transaction only -- never visible to, or
  -- settable by, any other session or any client-callable path.
  perform set_config('app.deleting_own_account', 'true', true);

  -- Favourites: purely personal, no business-record value once the
  -- account is gone.
  delete from favourites where user_id = v_uid;

  -- Leads this account filed as a buyer: scrub every personal/free-text
  -- field submitted with the enquiry. The row itself (property_id,
  -- status, preferred_date/time, created_at) stays -- it is the
  -- seller's/admin's own business record that an enquiry happened, not
  -- the buyer's personal data, and sellers already cannot read
  -- contact_name/contact_email/contact_phone/buyer_id at all (0029 --
  -- seller_leads view). buyer_id is left in place here; it is nulled
  -- automatically when the profile row is deleted (ON DELETE SET NULL,
  -- above), by the application code that deletes auth.users.
  update leads
     set contact_name  = null,
         contact_email = null,
         contact_phone = null,
         message       = null
   where buyer_id = v_uid;

  -- Properties owned by this account (relevant to sellers only, but
  -- harmless to run for a buyer with none): archive rather than delete,
  -- so a published listing does not vanish out from under buyers who
  -- already inquired about it, and so the seller's own past listing
  -- history is not destroyed. Leaves 'sold'/'rejected'/'archived' rows
  -- untouched -- already not publicly live, or already a terminal state
  -- worth keeping as-is. owner_id is left in place here for the same
  -- reason as buyer_id above; it is nulled when the profile row is
  -- deleted.
  update properties
     set status = 'archived'
   where owner_id = v_uid
     and status in ('draft', 'pending', 'published');

  -- Nothing else to do here: profiles.id -> auth.users(id) already
  -- cascades (0001), so the profile row itself, plus every table that
  -- still legitimately CASCADEs from it (favourites -- now already
  -- empty, notifications -- purely personal, 0022), is removed
  -- automatically once the caller's application code deletes the
  -- auth.users row via the service role (see src/lib/account/actions.ts).
  -- This function never touches auth.users itself -- it has no ability
  -- to from plain SQL.
end;
$$;

comment on function request_own_account_deletion is
  'Self-service account deletion, step 1 of 2. SECURITY DEFINER so it can '
  'write across favourites/leads/properties regardless of the caller''s '
  'own RLS grants, but takes NO user_id parameter -- every write is '
  'scoped to auth.uid() internally, so a caller can never target another '
  'account, and admin accounts are explicitly refused. Step 2 (deleting '
  'the auth.users row) happens in server-side application code via the '
  'service role, only after this function returns successfully -- see '
  'src/lib/account/actions.ts.';

revoke all on function request_own_account_deletion() from public, anon;
grant execute on function request_own_account_deletion() to authenticated;
