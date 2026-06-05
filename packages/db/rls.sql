-- ============================================================
-- AidaHOS Row-Level Security — canonical, idempotent.
-- Applied by scripts/apply-rls.mjs after every `db:push` (drizzle-kit push does
-- NOT reliably serialize policy USING/WITH CHECK expressions, so we own RLS here).
-- Run as the table OWNER (aida_master / MIGRATION_DATABASE_URL).
--
-- Per-request GUCs (set by withTenant() in src/client.ts):
--   app.current_role         super_admin | admin | user | customer
--   app.current_hotel        active hotel uuid (or '')
--   app.current_hotel_group  active hotel group uuid (or '')
-- super_admin sees all; admin is group-scoped; user is hotel-scoped.
-- Owner bypasses RLS; the runtime role aidahos_app does not.
-- ============================================================

-- ---- hotel_groups ----
alter table hotel_groups enable row level security;
drop policy if exists hotel_groups_rls on hotel_groups;
create policy hotel_groups_rls on hotel_groups
  for all to public
  using (
    current_setting('app.current_role', true) = 'super_admin'
    or (current_setting('app.current_role', true) = 'admin'
        and id = nullif(current_setting('app.current_hotel_group', true), '')::uuid)
  )
  with check (
    current_setting('app.current_role', true) = 'super_admin'
    or (current_setting('app.current_role', true) = 'admin'
        and id = nullif(current_setting('app.current_hotel_group', true), '')::uuid)
  );

-- ---- hotels ----
alter table hotels enable row level security;
drop policy if exists hotels_rls on hotels;
create policy hotels_rls on hotels
  for all to public
  using (
    current_setting('app.current_role', true) = 'super_admin'
    or (current_setting('app.current_role', true) = 'admin'
        and hotel_group_id = nullif(current_setting('app.current_hotel_group', true), '')::uuid)
    or (current_setting('app.current_role', true) = 'user'
        and id = nullif(current_setting('app.current_hotel', true), '')::uuid)
  )
  with check (
    current_setting('app.current_role', true) = 'super_admin'
    or (current_setting('app.current_role', true) = 'admin'
        and hotel_group_id = nullif(current_setting('app.current_hotel_group', true), '')::uuid)
    or (current_setting('app.current_role', true) = 'user'
        and id = nullif(current_setting('app.current_hotel', true), '')::uuid)
  );

-- Phase 1+ extends RLS to memberships, audit_logs, and every module table
-- (each carries hotel_id / hotel_group_id). Keep the same predicate shape.

-- ---- hotel_simulation (DEV PMS stand-in) ----
-- No RLS: the guest captive portal reads it without an authenticated session,
-- scoped explicitly by hotel_id in the query. New tables are owned by the migration
-- role, so grant the least-privilege runtime role access here (owner runs this file).
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'aidahos_app') then
    grant select, insert, update, delete on hotel_simulation to aidahos_app;
  end if;
end $$;
