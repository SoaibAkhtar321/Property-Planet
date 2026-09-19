-- 0032_visitor_assistance_deletion_compat.sql
--
-- Phase 7: fix an integration bug between 0030/0031 account deletion and the
-- 0031 visitor-assistance shape constraint.
--
-- The bug
-- -------
-- 0031 added leads_visitor_assistance_shape, which requires contact_name AND
-- contact_phone to be NOT NULL on every source = 'visitor_assistance' row.
-- 0031 also made request_own_account_deletion() scrub contact_name /
-- contact_phone / contact_email / message to NULL on leads where
-- requester_id = the deleting account. That UPDATE violates the constraint,
-- so the whole function raises and account deletion fails for any signed-in
-- user who ever submitted a visitor-assistance request.
--
-- The fix
-- -------
-- Relax the constraint (do not drop it) so a visitor-assistance row is valid
-- in exactly two shapes:
--   1. live:     contact_name and contact_phone both present
--   2. scrubbed: contact_name, contact_phone and contact_email all NULL
--                (the state request_own_account_deletion() leaves behind)
-- Everything else from 0031 is unchanged: buyer_id must stay NULL and
-- requirement_type must stay set. Rows can still only be created through
-- submit_visitor_assistance_request(), which validates name + phone, so this
-- does not open a path to create identity-less requests.
--
-- request_own_account_deletion() is unchanged in behaviour; it is not
-- re-declared here.

alter table leads
  drop constraint if exists leads_visitor_assistance_shape;

alter table leads
  add constraint leads_visitor_assistance_shape
  check (
    source <> 'visitor_assistance'
    or (
      buyer_id is null
      and requirement_type is not null
      and (
        (contact_name is not null and contact_phone is not null)
        or (contact_name is null and contact_phone is null and contact_email is null)
      )
    )
  );

comment on constraint leads_visitor_assistance_shape on leads is
  'Visitor-assistance rows: buyer_id NULL, requirement_type set, and either '
  'a live identity (name + phone) or a fully scrubbed one (name, phone and '
  'email all NULL, left by request_own_account_deletion()). See 0032.';
