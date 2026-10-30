-- 0039_seller_business_rules.sql
--
-- Part 1: block self-enquiry.  Part 2: let sellers revise rejected listings.
--
-- Business rule: an account cannot file an enquiry (lead) on a property it
-- owns. 0035 lets any signed-in role enquire, so a seller could enquire on
-- their own listing: a fake lead that notified the seller about
-- themselves and inflated admin lead counts and AI insights.
-- Admins are exempt (manual data entry). Visitor-assistance and contact
-- form leads have no buyer_id and are unaffected.

create or replace function enforce_no_self_enquiry()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.buyer_id is null or new.property_id is null or current_role_is('admin') then
    return new;
  end if;
  if exists (select 1 from properties p where p.id = new.property_id and p.owner_id = new.buyer_id) then
    raise exception 'You cannot send an enquiry for your own listing.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists leads_00_no_self_enquiry on leads;
create trigger leads_00_no_self_enquiry
  before insert on leads
  for each row execute function enforce_no_self_enquiry();


-- ===========================================================================
-- Part 2: rejected listings were a dead end.
-- A seller could read the admin's rejection reason but not edit or resubmit
-- the listing (only draft -> pending/archived was allowed), so the only way
-- forward was a duplicate listing. Allow rejected -> draft (revise, then
-- submit again for review) and rejected -> archived. Everything else in this
-- trigger is unchanged from 0037 — keep every check if you restate it.
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
    elsif old.status = 'rejected' and new.status in ('draft', 'archived') then
      -- 0039: a rejected listing can be taken back to draft to fix and
      -- resubmit (it still needs admin approval to go live), or archived.
    else
      raise exception
        'sellers may only submit a draft, archive a draft, or revise a rejected listing (attempted % -> %)',
        old.status, new.status;
    end if;
  end if;

  return new;
end;
$$;

