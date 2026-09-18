-- 0028_admin_audit_log.sql
-- Launch-audit Stage 6 item (checklist section F: "Admin audit logs").
--
-- PROBLEM: nothing in the schema records *who* performed a moderation or
-- role-change action, or *when* — only the current state (properties.status,
-- profiles.role, etc.) is stored, with no history. If a listing is
-- wrongly approved/rejected, or a user's role is changed unexpectedly,
-- there is no way to answer "who did this and when" beyond checking
-- application logs (which are not queryable from the database and are
-- not retained the same way).
--
-- FIX: a minimal, append-only `admin_audit_log` table plus triggers on
-- the three actions the client checklist and Stage 0 audit call out as
-- admin-consequential and already exist in this schema:
--   1. Role changes (admin_set_user_role, 0005) — extended in place to
--      log after a successful change, same function signature/behavior.
--   2. Property moderation — any status transition, performed while the
--      caller is an admin (current_role_is('admin')). Reuses the same
--      "was this an admin, not a seller" check every other admin-only
--      trigger in this schema already uses.
--   3. Project moderation — same shape, for `projects.status`.
--
-- Design, matching every other audit/history table already in this
-- schema (seller_contact_reveals, 0004; notifications, 0022):
--   * No client-writable path at all. Every insert happens inside a
--     security definer function/trigger, never through a client-facing
--     RLS INSERT policy.
--   * Read-only to admins. No UPDATE/DELETE policy for anyone, including
--     admin — an audit log that can be edited after the fact is not an
--     audit log.
--   * actor_id is always auth.uid() at the time of the action, not
--     anything passed in by the caller.

create table admin_audit_log (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references profiles (id) on delete set null,
  action       text not null,          -- e.g. 'role_change', 'property_status_change'
  target_table text not null,          -- e.g. 'profiles', 'properties', 'projects'
  target_id    uuid not null,
  details      jsonb,                  -- e.g. {"from": "pending", "to": "published"}
  created_at   timestamptz not null default now()
);

create index admin_audit_log_target_idx on admin_audit_log (target_table, target_id, created_at desc);
create index admin_audit_log_actor_idx on admin_audit_log (actor_id, created_at desc);

comment on table admin_audit_log is
  'Append-only record of admin-consequential actions (role changes, '
  'property/project moderation). No client-writable path — every row is '
  'inserted by a security definer function/trigger. No UPDATE/DELETE '
  'policy for any role, including admin: an editable audit log is not '
  'an audit log.';

alter table admin_audit_log enable row level security;

create policy "admins can read audit log"
  on admin_audit_log for select
  using (current_role_is('admin'));

-- No INSERT/UPDATE/DELETE policy for any role. Every writer below is
-- security definer, matching seller_contact_reveals (0004) and
-- notifications (0022).

-- ===========================================================================
-- 1. Role changes: extend admin_set_user_role (0005) to log itself.
-- ===========================================================================

create or replace function admin_set_user_role(target_user_id uuid, new_role user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_role user_role;
begin
  if not current_role_is('admin') then
    raise exception 'only admins can change roles';
  end if;

  select role into v_old_role from profiles where id = target_user_id;

  update profiles set role = new_role where id = target_user_id;

  insert into admin_audit_log (actor_id, action, target_table, target_id, details)
  values (
    auth.uid(),
    'role_change',
    'profiles',
    target_user_id,
    jsonb_build_object('from', v_old_role, 'to', new_role)
  );
end;
$$;

comment on function admin_set_user_role is
  'Admin-only role change (0005), now also logging itself to '
  'admin_audit_log (0028) with the actor, the target profile, and the '
  'old/new role. Authorization is unchanged — still current_role_is(''admin'') '
  'or nothing happens.';

-- ===========================================================================
-- 2. Property moderation: any status change made while acting as admin.
-- ===========================================================================

create or replace function log_property_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status and current_role_is('admin') then
    insert into admin_audit_log (actor_id, action, target_table, target_id, details)
    values (
      auth.uid(),
      'property_status_change',
      'properties',
      new.id,
      jsonb_build_object('from', old.status, 'to', new.status, 'rejection_reason', new.rejection_reason)
    );
  end if;
  return new;
end;
$$;

comment on function log_property_status_change is
  'AFTER UPDATE trigger on `properties`. Logs a status transition to '
  'admin_audit_log only when the caller is an admin (current_role_is('
  '''admin'')) — a seller''s own draft -> pending/archived transition '
  '(0008/0017/0023) is not an admin action and is deliberately not '
  'logged here.';

create trigger properties_log_status_change
  after update on properties
  for each row execute function log_property_status_change();

-- ===========================================================================
-- 3. Project moderation: same shape, for `projects.status`.
-- ===========================================================================

create or replace function log_project_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status and current_role_is('admin') then
    insert into admin_audit_log (actor_id, action, target_table, target_id, details)
    values (
      auth.uid(),
      'project_status_change',
      'projects',
      new.id,
      jsonb_build_object('from', old.status, 'to', new.status)
    );
  end if;
  return new;
end;
$$;

comment on function log_project_status_change is
  'AFTER UPDATE trigger on `projects`. Every write path to projects.status '
  'is already admin-only (0006 has no non-admin write policy at all), so '
  'the current_role_is(''admin'') check here is defense-in-depth/clarity '
  'rather than a distinct case the way it is for properties, but kept for '
  'the same shape and the same reason: never log a transition as an '
  '"admin action" without independently confirming the caller was one.';

create trigger projects_log_status_change
  after update on projects
  for each row execute function log_project_status_change();
