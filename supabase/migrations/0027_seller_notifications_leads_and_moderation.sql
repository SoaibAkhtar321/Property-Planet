-- 0027_seller_notifications_leads_and_moderation.sql
-- Launch-audit Stage 7 continuation.
--
-- 0022_site_visit_cancellation.sql built the `notifications` table and
-- wired exactly one event to it (seller notified when a buyer cancels a
-- site visit) — its own header comment explicitly says the UI/other
-- events are "a follow-up." The dashboard Notification.tsx component
-- (Stage 7, already shipped) reads real rows from that table, but only
-- one event has ever written to it, so in practice a seller almost never
-- sees anything there.
--
-- This migration adds the two next-highest-value events from the client
-- checklist's Notifications section (G) that this schema can already
-- support without inventing new tables/columns:
--
--   1. Seller new-enquiry notification — a buyer submits a lead against
--      one of the seller's properties (property-level lead only; a
--      project-only lead has no property owner to notify).
--   2. Listing approval / rejection notification — an admin moves a
--      seller's property to 'published' or 'rejected'.
--
-- Both follow the exact pattern 0022 already established:
--   * AFTER INSERT/UPDATE trigger (never BEFORE — these only read/insert,
--     never mutate NEW), security definer so it can insert into
--     `notifications` despite the caller having no direct INSERT grant
--     on that table (see 0022: "No INSERT policy for any role, including
--     admin").
--   * Recipient is always re-derived server-side from the row itself
--     (properties.owner_id), never trusted from anything client-supplied.
--   * Fires regardless of which path caused the change (UI or a direct
--     RLS-respecting client call), same as 0022's cancellation notifier.
--
-- Explicitly NOT done here (kept out of scope, matching the "do not
-- fabricate notification functionality" rule from Stage 7's own brief):
--   * Buyer-side "your enquiry was received" notification — the
--     inquiry forms already show an immediate success toast client-side
--     (createInquiry/createProjectInquiry/createGeneralInquiry all
--     return success/failure synchronously), so a second, persisted
--     notification for the same instant confirmation would be a
--     duplicate of something the buyer already saw, not new information.
--   * Admin notifications — `notifications.recipient_id` is a single
--     profile, and there is no single "the admin" row (there can be more
--     than one admin); fanning a notification out to every admin would
--     need a different shape than this table currently supports, and is
--     left as a genuinely separate follow-up rather than guessed at here.
--   * Email/push delivery of any kind — out of scope for this table,
--     which only ever produced an in-app row, exactly as 0022 scoped it.

-- ===========================================================================
-- 1. Seller: new enquiry on one of their properties
-- ===========================================================================

create or replace function notify_seller_on_new_lead()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_seller_id uuid;
  v_property_title text;
begin
  -- Project-only lead (property_id null) has no property owner to notify.
  if new.property_id is null then
    return new;
  end if;

  select p.owner_id, p.title
    into v_seller_id, v_property_title
  from properties p
  where p.id = new.property_id;

  if v_seller_id is not null then
    insert into notifications (recipient_id, type, message, lead_id)
    values (
      v_seller_id,
      'new_lead',
      coalesce('You have a new enquiry on "' || v_property_title || '".',
               'You have a new enquiry on one of your listings.'),
      new.id
    );
  end if;

  return new;
end;
$$;

comment on function notify_seller_on_new_lead is
  'AFTER INSERT trigger on `leads`. Notifies the property owner of a new '
  'property-level enquiry (project-only leads, property_id NULL, have no '
  'single property owner and are skipped). Recipient is re-derived from '
  'properties.owner_id, never trusted from the inserted row directly.';

create trigger leads_notify_seller_on_new_lead
  after insert on leads
  for each row execute function notify_seller_on_new_lead();

-- ===========================================================================
-- 2. Seller: their listing was approved or rejected
-- ===========================================================================

create or replace function notify_seller_on_property_moderation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status
     and new.status in ('published', 'rejected') then
    insert into notifications (recipient_id, type, message)
    values (
      new.owner_id,
      case new.status
        when 'published' then 'listing_approved'
        else 'listing_rejected'
      end,
      case new.status
        when 'published' then
          'Your listing "' || new.title || '" has been approved and is now live.'
        else
          'Your listing "' || new.title || '" was not approved.'
          || coalesce(' Reason: ' || new.rejection_reason, '')
      end
    );
  end if;

  return new;
end;
$$;

comment on function notify_seller_on_property_moderation is
  'AFTER UPDATE trigger on `properties`. Notifies the listing owner when '
  'an admin moves their property to published or rejected. Fires for any '
  'transition into either state (draft/pending -> published/rejected, and '
  'a corrected rejected -> published or vice versa), matching the '
  'existing admin actions'' own comment that such corrections are a '
  'legitimate admin action, not a bug. Does not fire for admin-owned '
  'properties notifying themselves in any special way — same recipient '
  'logic (properties.owner_id) either way, which is correct: an '
  'admin-created listing''s owner_id is the admin who created it.';

create trigger properties_notify_seller_on_moderation
  after update on properties
  for each row execute function notify_seller_on_property_moderation();
