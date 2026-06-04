import { sql } from 'drizzle-orm';
import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { pmsType, tenantStatus } from './enums';

// NOTE: RLS for these tenant tables is NOT defined here — drizzle-kit push does not
// reliably serialize policy USING/WITH CHECK expressions. RLS lives in rls.sql and is
// applied by scripts/apply-rls.mjs (run automatically after `db:push`). See that file.

/** Top tenant: a hotel group / company, e.g. "Esken Otel Group". */
export const hotelGroups = pgTable('hotel_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  status: tenantStatus('status').notNull().default('active'),
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

  // PMS / on-prem
  pmsType: pmsType('pms_type').notNull().default('none'),

  // Network provisioning
  mikrotikIp: text('mikrotik_ip'),
  nasSecret: text('nas_secret'),
  exitIp: text('exit_ip'),

  // Tailscale reachability for the on-prem boxes
  tailscaleHost: text('tailscale_host'),
  tailscaleIp: text('tailscale_ip'),

  // Guest portal brand/theme tokens (mirrors design tweaks system)
  brand: jsonb('brand').notNull().default(sql`'{}'::jsonb`),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
