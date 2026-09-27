-- 0035_leads_insert_any_authenticated_role.sql
--
-- Previously (0004_leads_site_visits_reveals.sql) only buyer-role accounts
-- could create a lead:
--
--   create policy "buyers can create own leads"
--     on leads for insert
--     with check (auth.uid() = buyer_id and current_role_is('buyer'));
--
-- Product decision: the "Send Inquiry" button should work from any signed-in
-- account (buyer, seller, admin) as well as logged-out visitors (who are
-- routed through Google sign-in first, same as before). A seller or admin
-- browsing another listing as a prospective buyer should be able to send an
-- inquiry just like anyone else. This does not touch the UPDATE policies
-- (sellers can only update leads on their own properties; admins can update
-- any lead) or SELECT policies — it only widens who may INSERT a lead for
-- themselves.
--
-- The identity check (auth.uid() = buyer_id) is unchanged and remains the
-- real guarantee here: this only ever lets someone create a lead row with
-- themselves as buyer_id, never impersonate another user.

drop policy if exists "buyers can create own leads" on leads;

create policy "any authenticated account can create own leads"
  on leads for insert
  with check (auth.uid() = buyer_id);