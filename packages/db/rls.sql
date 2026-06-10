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

-- ---- surveys (group-scoped, same shape as hotels) ----
-- admin AND user carry app.current_hotel_group (resolveTenantContext sets it for both),
-- so a single hotel_group_id predicate covers the whole console.
alter table surveys enable row level security;
drop policy if exists surveys_rls on surveys;
create policy surveys_rls on surveys
  for all to public
  using (
    current_setting('app.current_role', true) = 'super_admin'
    or hotel_group_id = nullif(current_setting('app.current_hotel_group', true), '')::uuid
  )
  with check (
    current_setting('app.current_role', true) = 'super_admin'
    or hotel_group_id = nullif(current_setting('app.current_hotel_group', true), '')::uuid
  );

-- ---- survey_responses (group-scoped via denormalized hotel_group_id) ----
-- Guest submissions are inserted by the guest app inside a withTenant({role:'admin',
-- hotelGroupId}) transaction, which satisfies WITH CHECK below.
alter table survey_responses enable row level security;
drop policy if exists survey_responses_rls on survey_responses;
create policy survey_responses_rls on survey_responses
  for all to public
  using (
    current_setting('app.current_role', true) = 'super_admin'
    or hotel_group_id = nullif(current_setting('app.current_hotel_group', true), '')::uuid
  )
  with check (
    current_setting('app.current_role', true) = 'super_admin'
    or hotel_group_id = nullif(current_setting('app.current_hotel_group', true), '')::uuid
  );

-- ---- guest_stays (group-scoped via denormalized hotel_group_id) ----
-- Our persisted copy of verified guest reservations. Written by the guest app as
-- super_admin (trusted server, no console session); read in the console group-scoped.
alter table guest_stays enable row level security;
drop policy if exists guest_stays_rls on guest_stays;
create policy guest_stays_rls on guest_stays
  for all to public
  using (
    current_setting('app.current_role', true) = 'super_admin'
    or hotel_group_id = nullif(current_setting('app.current_hotel_group', true), '')::uuid
  )
  with check (
    current_setting('app.current_role', true) = 'super_admin'
    or hotel_group_id = nullif(current_setting('app.current_hotel_group', true), '')::uuid
  );

-- Least-privilege grants for the runtime role (owner runs this file).
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'aidahos_app') then
    grant select, insert, update, delete on surveys to aidahos_app;
    grant select, insert, update, delete on survey_responses to aidahos_app;
    grant select, insert, update, delete on guest_stays to aidahos_app;
  end if;
end $$;
