-- 0034_leads_inquiry_consent.sql
--
-- Records that the buyer explicitly checked the consent checkbox on the
-- universal inquiry dialog (src/components/inquiry/InquiryDialog.tsx)
-- before their property/project enquiry was submitted.
--
-- consent_given defaults to false so any insert path that does not set it
-- explicitly (there should be none, going forward) is never silently
-- treated as consented. consent_given_at is the server-side timestamp of
-- the insert itself, not a client-supplied value.
--
-- This is a minimal, additive change: no existing column, policy, or
-- constraint is touched, and RLS on `leads` is unaffected (the existing
-- "buyers can create own leads" / general-contact-form policies do not
-- reference specific columns).

alter table leads
  add column consent_given boolean not null default false,
  add column consent_given_at timestamptz;
