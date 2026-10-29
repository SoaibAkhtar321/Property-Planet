-- 0037_security_audit_fixes.sql
-- Security audit, 2026-10. Each section below closes a hole that was
-- reproduced against migrations 0001..0036 by
-- supabase/tests/security_audit_rls.sql (attacks run as ordinary signed-in
-- users through the same anon-key + JWT path the browser client uses).
--
--   1. CRITICAL  Buyer could self-confirm a site visit and unlock the exact
--                address (site_visits INSERT had no status check, and
--                reveal_exact_location() trusts site_visits.status).
--   2. CRITICAL  Buyer could insert a lead already in 'negotiation'/'closed'
--                and unlock the exact address the same way (leads INSERT
--                policies never constrained status).
--   3. HIGH      0030 restated enforce_seller_property_update() "in full"
--                but dropped the project_id lock added by 0017/0023, so a
--                seller could again attach their listing to any
--                admin-curated project. Restored here, 0030's account-
--                deletion bypass kept as-is.
--   4. MEDIUM    Unbounded free text on publicly writable columns
--                (leads.message, site_visits.notes) — storage/abuse vector.
--   5. LOW       Notification recipients could rewrite any column of their
--                own notifications (message, type, links), not just `read`.

-- ===========================================================================
-- 1. site_visits: a buyer may only ever create a *requested* visit.
--    Confirming is the seller's (or admin's) job, via their UPDATE policies.
-- ===========================================================================

drop policy if exists "buyers can request a site visit on own lead" on site_visits;
create policy "buyers can request a site visit on own lead"
  on site_visits for insert
  with check (
    status = 'requested'
    and exists (
      select 1 from leads
      where leads.id = site_visits.lead_id
        and leads.buyer_id = auth.uid()
    )
  );

-- ===========================================================================
-- 2. leads: every non-admin insert starts life as 'new'.
--    A trigger (not a policy) so it covers every insert path at once —
--    property/project enquiries, the anonymous contact form, and anything
--    added later — without having to remember to repeat it in each policy.
--    Admins are exempt (manual data entry / corrections).
-- ===========================================================================

create or replace function enforce_lead_insert_status()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if current_role_is('admin') then
    return new;
  end if;

  if new.status is distinct from 'new' then
    raise exception 'a new enquiry must start with status ''new'' (attempted %)', new.status;
  end if;

  return new;
end;
$$;

comment on function enforce_lead_insert_status is
  'BEFORE INSERT backstop for `leads` (0037): non-admin callers can only '
  'create a lead in status ''new''. Without it a buyer could insert a lead '
  'already in negotiation/closed and satisfy reveal_exact_location().';

drop trigger if exists leads_00_enforce_insert_status on leads;
create trigger leads_00_enforce_insert_status
  before insert on leads
  for each row execute function enforce_lead_insert_status();

-- ===========================================================================
-- 3. Restore the project_id lock in enforce_seller_property_update().
--    Identical to the 0030 body plus the 0023 project_id check.
-- ===========================================================================

create or replace function enforce_seller_property_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Admins keep unrestricted update rights (moderation transitions,
  -- project assignment, corrections, etc.).
  if current_role_is('admin') then
    return new;
  end if;

  -- 0030: account deletion archives a seller's properties whatever their
  -- status. Only request_own_account_deletion() sets this flag,
  -- transaction-locally; no client-callable path can.
  if current_setting('app.deleting_own_account', true) = 'true' then
    return new;
  end if;

  if new.owner_id is distinct from old.owner_id then
    raise exception 'owner_id cannot be changed';
  end if;

  if new.published_at is distinct from old.published_at then
    raise exception 'published_at cannot be set directly';
  end if;

  -- 0017/0023, restored by 0037 after 0030 dropped it: attaching a listing
  -- to an admin-curated project is a moderation decision, admin only.
  if new.project_id is distinct from old.project_id then
    raise exception 'project_id can only be changed by an admin';
  end if;

  -- Seller-owned lifecycle: draft -> pending (submit) / draft -> archived.
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
  'BEFORE UPDATE trigger backstop for `properties`. Non-admin callers '
  'cannot change owner_id, published_at or project_id, and may only move '
  'status draft -> pending or draft -> archived. Admins are exempt; '
  'request_own_account_deletion() (0030) is exempt for its archive write. '
  'IMPORTANT: if you restate this function again, keep EVERY check — 0030 '
  'silently dropped the project_id lock, restored in 0037.';

-- ===========================================================================
-- 4. Length caps on publicly writable free text.
--    NOT VALID: enforced for every new/updated row from now on, without
--    failing the migration on any historical row that is already longer.
--    The app already validates far tighter limits (1000/2000 chars); these
--    are the database backstop against direct API calls.
-- ===========================================================================

alter table leads
  add constraint leads_message_length
  check (message is null or char_length(message) <= 4000) not valid;

alter table leads
  add constraint leads_contact_email_length
  check (contact_email is null or char_length(contact_email) <= 254) not valid;

alter table site_visits
  add constraint site_visits_notes_length
  check (notes is null or char_length(notes) <= 2000) not valid;

-- ===========================================================================
-- 5. notifications: recipients may only flip `read`.
--    Column-level privilege, so the existing RLS policy still decides
--    *which rows*, and this decides *which columns*.
-- ===========================================================================

revoke update on notifications from authenticated, anon;
grant update (read) on notifications to authenticated;
