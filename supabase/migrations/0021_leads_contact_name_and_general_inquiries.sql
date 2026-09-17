-- 0021_leads_contact_name_and_general_inquiries.sql
--
-- Two changes, both requested together:
--
-- 1. leads.contact_name
--    Every inquiry surface (property, project, and the general "Send
--    Message" contact form) now collects the enquirer's name explicitly,
--    the same way contact_phone (0020) is collected explicitly rather than
--    assumed from profiles. For a signed-in buyer this may duplicate
--    profiles.full_name, which is fine — contact_name is "the name given
--    with THIS enquiry", exactly like contact_phone is "the number given
--    with THIS enquiry".
--
-- 2. General ("Send Message") contact-form leads
--    Until now every lead required a signed-in buyer (buyer_id not null,
--    RLS policy "buyers can create own leads") and either a property or a
--    project. The site's general contact form has none of those — it is
--    open to anyone, tied to no listing. This adds a fourth lead shape:
--    buyer_id NULL, property_id NULL, project_id NULL, source =
--    'contact_form', with contact_name/contact_email/contact_phone all
--    required on the row itself (since there is no profile to fall back
--    on). A dedicated RLS insert policy allows this one specific shape
--    for anyone, signed in or not; every other insert path is unchanged.

alter table leads
  add column if not exists contact_name  text,
  add column if not exists contact_email text;

comment on column leads.contact_name is
  'Name given with this specific enquiry (property, project, or the '
  'general contact form). Required by the application for every new '
  'enquiry; nullable in the schema so pre-0021 leads remain valid rows.';

comment on column leads.contact_email is
  'Email given with this specific enquiry. Only ever populated by the '
  'general contact form (source = ''contact_form''), since property/'
  'project enquiries come from a signed-in buyer whose email lives on '
  'auth.users instead.';

alter table leads
  drop constraint if exists leads_contact_name_length;
alter table leads
  add constraint leads_contact_name_length
  check (contact_name is null or char_length(contact_name) between 1 and 120);

-- buyer_id: was "not null" since 0004. A general contact-form lead has no
-- signed-in buyer at all, so this can no longer be a blanket requirement.
alter table leads
  alter column buyer_id drop not null;

comment on column leads.buyer_id is
  'The signed-in buyer this lead belongs to. NULL only for a general '
  'contact-form lead (source = ''contact_form'', see 0021) — every '
  'property/project-level lead still requires a real buyer, enforced by '
  'the "buyers can create own leads" RLS policy rather than this column '
  'alone.';

-- The 0013 exclusivity check required project_id or property_id on every
-- row. A general contact-form lead has neither, so that row shape is
-- explicitly carved out here rather than the constraint being dropped.
alter table leads
  drop constraint if exists leads_project_or_property_required;
alter table leads
  add constraint leads_project_or_property_required
  check (
    project_id is not null
    or property_id is not null
    or source = 'contact_form'
  );

-- A general contact-form lead must carry its own identity, since it has
-- no buyer_id to resolve name/phone/email from.
alter table leads
  drop constraint if exists leads_contact_form_requires_identity;
alter table leads
  add constraint leads_contact_form_requires_identity
  check (
    source <> 'contact_form'
    or (contact_name is not null and contact_phone is not null and contact_email is not null)
  );

-- RLS: allow exactly the general-contact-form shape from anyone (signed in
-- or not). Every other insert path is untouched — "buyers can create own
-- leads" still requires auth.uid() = buyer_id and current_role_is('buyer'),
-- so this new policy cannot be used to sneak a property/project lead past
-- that check; it only ever matches rows with no buyer, no property and no
-- project.
drop policy if exists "anyone can submit a general contact enquiry" on leads;
create policy "anyone can submit a general contact enquiry"
  on leads for insert
  with check (
    source = 'contact_form'
    and buyer_id is null
    and property_id is null
    and project_id is null
    and contact_name is not null
    and contact_phone is not null
    and contact_email is not null
  );

-- No new SELECT policy: a general contact-form lead has no buyer_id and no
-- property_id, so neither "buyers can read own leads" nor "sellers can
-- read leads on own properties" can ever match it. Only "admins can read
-- all leads" (0004) sees these rows, which is exactly the "goes to the
-- admin lead section" requirement.
