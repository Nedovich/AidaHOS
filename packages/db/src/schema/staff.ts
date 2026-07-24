import { pgTable, serial, text, timestamp, uuid, date } from 'drizzle-orm/pg-core';
import { hotels } from './tenancy';

/**
 * Hotel staff accounts — the source of truth for display names and local usernames.
 * RADIUS only stores credentials (radcheck) + hotspot profile (radreply/Mikrotik-Group).
 * Everything else (displayName, hotelId mapping) lives here.
 *
 * radiusUsername = full RADIUS key, e.g. "staff-aida-garden-aysan"
 * localUsername  = short name the staff member types, e.g. "aysan"
 */
export const staffAccounts = pgTable('staff_accounts', {
  id: serial('id').primaryKey(),
  hotelId: uuid('hotel_id')
    .notNull()
    .references(() => hotels.id, { onDelete: 'cascade' }),
  radiusUsername: text('radius_username').notNull().unique(),
  localUsername: text('local_username').notNull(),
  displayName: text('display_name').notNull(),
  mikrotikGroup: text('mikrotik_group').notNull().default(''),
  jobTitle: text('job_title'),
  accessUntil: date('access_until'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
