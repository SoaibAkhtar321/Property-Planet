-- 0022_site_visit_cancellation.sql
--
-- Implements the site-visit cancellation policy (client-confirmed, see PR
-- description) on top of the existing site_visits/leads model from
-- 0004_leads_site_visits_reveals.sql. Two things, both required together:
--
--   1. Buyers currently have NO update policy on site_visits at all (0004
--      only gave them SELECT, via "site visits follow lead visibility").
--      This adds a narrowly-scoped UPDATE policy + a BEFORE UPDATE trigger
--      backstop (same pattern as enforce_seller_property_update, 0008 —
--      RLS alone cannot compare OLD vs NEW status in one expression) so a
--      buyer can cancel their own requested/confirmed visit and nothing
--      else: no other column, no other buyer's row, no other status
--      transition.
--
--   2. "the seller must be notified" has no existing infrastructure to
--      hang off — the dashboard Notification.tsx component is static demo
--      markup, not backed by any table. Rather than build a full
--      notification system (email/push) that isn't asked for, this adds
--      the minimal real, queryable, RLS-safe primitive: a `notifications`
--      table with an admin/system-only write path (security definer
--      trigger, same shape as seller_contact_reveals in 0004) and a
--      recipient-scoped read policy. The UI to render it is a follow-up;
--      this migration guarantees the data exists and is correctly scoped.
--
-- Explicitly per the confirmed policy:
--   * No cancellation cutoff — buyer may cancel a requested/confirmed
--     visit at any time, including shortly before the scheduled time.
--   * Cancelling never touches the parent lead row.
--   * The site_visits row is never deleted — status becomes 'cancelled',
--     so admin visibility/history is automatically retained (existing
--     "admins can manage all site visits" policy already covers reading
--     cancelled rows; nothing new needed there).

-- ===========================================================================
-- 1. notifications table
-- ===========================================================================

create table notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references profiles (id) on delete cascade,
  type          text not null,          -- e.g. 'site_visit_cancelled'
  message       text not null,
  site_visit_id uuid references site_visits (id) on delete set null,
  lead_id       uuid references leads (id) on delete set null,
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);

create index notifications_recipient_idx on notifications (recipient_id, created_at desc);

alter table notifications enable row level security;

create policy "recipients can read own notifications"
  on notifications for select
  using (recipient_id = auth.uid());

create policy "recipients can mark own notifications read"
  on notifications for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

create policy "admins can read all notifications"
  on notifications for select
  using (current_role_is('admin'));

-- No INSERT policy for any role, including admin: notifications are only
-- ever written by the trigger function below (security definer), never
-- directly by a client. This mirrors seller_contact_reveals (0004).

-- ===========================================================================
-- 2. Buyer cancellation: RLS + column/transition-scoped trigger backstop
-- ===========================================================================

create policy "buyers can update own site visits"
  on site_visits for update
  using (
    exists (
      select 1 from leads l
      where l.id = site_visits.lead_id and l.buyer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from leads l
      where l.id = site_visits.lead_id and l.buyer_id = auth.uid()
    )
  );

-- RLS above only proves "this buyer owns the lead this visit belongs to" —
-- it says nothing about which column or which status transition. Same gap
-- enforce_seller_property_update (0008) closed for properties; same fix
-- here for site_visits.

create or replace function enforce_buyer_site_visit_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_is_buyer boolean;
begin
  -- Admins and the existing seller-update policy path are untouched by
  -- this trigger's restrictions — only lock down the buyer path.
  if current_role_is('admin') then
    return new;
  end if;

  select exists (
    select 1 from leads l
    where l.id = old.lead_id and l.buyer_id = auth.uid()
  ) into v_is_buyer;

  -- Not the buyer on this visit's lead: this is the seller-update path
  -- (0004's "sellers can update site visits on own-property leads"),
  -- which this trigger does not restrict further.
  if not v_is_buyer then
    return new;
  end if;

  if new.lead_id is distinct from old.lead_id
     or new.scheduled_at is distinct from old.scheduled_at
     or new.notes is distinct from old.notes then
    raise exception 'buyers may only cancel a site visit, not modify its details';
  end if;

  if new.status is distinct from old.status then
    if old.status in ('requested', 'confirmed') and new.status = 'cancelled' then
      -- allowed
    else
      raise exception
        'buyers may only cancel a requested or confirmed site visit (attempted % -> %)',
        old.status, new.status;
    end if;
  end if;

  return new;
end;
$$;

create trigger site_visits_00_enforce_buyer_scope
  before update on site_visits
  for each row execute function enforce_buyer_site_visit_update();

-- ===========================================================================
-- 3. Notify the seller when a visit is cancelled
-- ===========================================================================

create or replace function notify_seller_on_site_visit_cancelled()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_seller_id uuid;
  v_property_title text;
begin
  if new.status = 'cancelled' and old.status in ('requested', 'confirmed') then
    select p.owner_id, p.title
      into v_seller_id, v_property_title
    from leads l
    join properties p on p.id = l.property_id
    where l.id = new.lead_id;

    if v_seller_id is not null then
      insert into notifications (recipient_id, type, message, site_visit_id, lead_id)
      values (
        v_seller_id,
        'site_visit_cancelled',
        coalesce('The buyer cancelled their site visit for "' || v_property_title || '".',
                 'A buyer cancelled a site visit on one of your listings.'),
        new.id,
        new.lead_id
      );
    end if;
  end if;

  return new;
end;
$$;

-- AFTER UPDATE, not BEFORE: this only reads/inserts, never mutates NEW, so
-- it runs after the buyer-scope trigger above has already validated (or
-- rejected) the transition. Fires regardless of whether the cancellation
-- came from the buyer path or an admin override — the seller should learn
-- about a cancellation either way.
create trigger site_visits_notify_seller_on_cancel
  after update on site_visits
  for each row execute function notify_seller_on_site_visit_cancelled();
