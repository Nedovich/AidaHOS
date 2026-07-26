import { sql } from 'drizzle-orm';
import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { pmsType, radiusBackendType, tenantStatus } from './enums';

// NOTE: RLS for these tenant tables is NOT defined here — drizzle-kit push does not
// reliably serialize policy USING/WITH CHECK expressions. RLS lives in rls.sql and is
// applied by scripts/apply-rls.mjs (run automatically after `db:push`). See that file.

/** Top tenant: a hotel group / company, e.g. "Esken Otel Group". */
export const hotelGroups = pgTable('hotel_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  status: tenantStatus('status').notNull().default('active'),

  // Display / billing metadata (shown on the Accounts cards & detail)
  ownerName: text('owner_name'),
  ownerEmail: text('owner_email'),
  region: text('region'),
  plan: text('plan').notNull().default('scale'),
  mrr: integer('mrr').notNull().default(0),
  aiUsed: integer('ai_used').notNull().default(0),
  aiLimit: integer('ai_limit').notNull().default(100000),
  color: text('color').notNull().default('#5457D6'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * A single hotel — the primary tenant unit for RLS.
 * Holds network/provisioning fields used by the FastAPI integration layer:
 *  - mikrotik_ip + nas_secret  -> written to FreeRADIUS `nas` on provisioning
 *  - tailscale_host / ip       -> how the cloud reaches the on-prem boxes
 */
export const hotels = pgTable('hotels', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelGroupId: uuid('hotel_group_id')
    .notNull()
    .references(() => hotelGroups.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  status: tenantStatus('status').notNull().default('trial'),

  // Display metadata (Hotels list & detail)
  region: text('region'),
  rooms: integer('rooms').notNull().default(0),
  guestsOnline: integer('guests_online').notNull().default(0),
  color: text('color').notNull().default('#2F6E78'),

  // PMS / on-prem
  pmsType: pmsType('pms_type').notNull().default('none'),

  // RADIUS backend: our hosted FreeRADIUS, or the hotel's own local MikroTik.
  radiusBackend: radiusBackendType('radius_backend').notNull().default('central_freeradius'),

  // Network provisioning (central_freeradius): MikroTik gateway + FreeRADIUS nas client
  mikrotikIp: text('mikrotik_ip'),
  nasSecret: text('nas_secret'),
  exitIp: text('exit_ip'),

  // MikroTik RouterOS v7 REST API (local_mikrotik): host = tailscaleHost ?? tailscaleIp ?? mikrotikIp
  mikrotikApiUser: text('mikrotik_api_user'),
  mikrotikApiPassword: text('mikrotik_api_password'),
  mikrotikApiPort: integer('mikrotik_api_port'),

  // Tailscale reachability for the on-prem boxes
  tailscaleHost: text('tailscale_host'),
  tailscaleIp: text('tailscale_ip'),

  // Guest portal brand/theme tokens (mirrors design tweaks system)
  brand: jsonb('brand').notNull().default(sql`'{}'::jsonb`),

  // Survey trigger: how many days before checkout to interrupt internet and show the
  // checkout survey. Default 3. Guest stays inherit this at login; can be overridden
  // per-stay on the guest detail page.
  surveyTriggerDays: integer('survey_trigger_days').notNull().default(3),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
