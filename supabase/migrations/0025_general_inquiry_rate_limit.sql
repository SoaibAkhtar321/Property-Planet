-- 0025_general_inquiry_rate_limit.sql
-- Launch-audit fix (Stage 2, item H1).
--
-- PROBLEM: the general "Send Message" contact form (0021) has an INSERT
-- policy — "anyone can submit a general contact enquiry" — with no
-- signed-in identity behind it at all (buyer_id/property_id/project_id
-- all NULL). Nothing in the schema or the application layer limits how
-- many of these a single caller can submit. There is no CAPTCHA in this
-- codebase and none is being added here (that would require a
-- third-party key/secret this migration has no way to provision) — this
-- is a real, DB-enforced backstop instead: the actual boundary, not a
-- browser-side nicety that a script bypasses by calling the insert
-- directly with the anon key.
--
-- FIX: a BEFORE INSERT trigger on `leads`, scoped only to
-- source = 'contact_form' rows (every other insert path — buyer
-- property/project enquiries — is untouched and still goes through its
-- own RLS policy and unique-per-buyer constraint). It rejects a new
-- contact-form row if the same contact_phone OR contact_email already
-- has 3 or more contact-form leads within the last 60 minutes.
--
-- This is a blunt instrument (phone/email are self-reported and easy to
-- vary), not a substitute for a real CAPTCHA/WAF if spam volume turns out
-- to be high post-launch — but it stops the trivial case (a script
-- hammering the same submission or the same contact details repeatedly)
-- without adding any external dependency, and it cannot be bypassed by
-- skipping client-side JS since it runs in the database.

create or replace function enforce_general_inquiry_rate_limit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_recent_count integer;
begin
  if new.source is distinct from 'contact_form' then
    return new;
  end if;

  select count(*) into v_recent_count
  from leads
  where source = 'contact_form'
    and created_at > now() - interval '60 minutes'
    and (
      (new.contact_phone is not null and contact_phone = new.contact_phone)
      or (new.contact_email is not null and contact_email = new.contact_email)
    );

  if v_recent_count >= 3 then
    raise exception 'Too many messages submitted recently. Please try again later.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

comment on function enforce_general_inquiry_rate_limit is
  'BEFORE INSERT backstop for the unauthenticated general contact-form '
  'lead shape only (source = ''contact_form''). Rejects a submission when '
  'the same contact_phone or contact_email already has 3+ contact-form '
  'leads in the last 60 minutes. Runs in the database, so it cannot be '
  'bypassed by calling the insert without the client-side form/JS.';

create trigger leads_00_enforce_general_inquiry_rate_limit
  before insert on leads
  for each row execute function enforce_general_inquiry_rate_limit();
