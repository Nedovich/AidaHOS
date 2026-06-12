import { sql } from 'drizzle-orm';
import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { eventStatusType } from './enums';
import { hotelGroups, hotels } from './tenancy';

/**
 * Event categories (Entertainment, Sports, …). GROUP-scoped: shared across the group's
 * hotels, managed from Events → Settings. `name` is a localized object ({tr,en,de,ru})
 * because it is shown to guests. RLS = group-scoped (see rls.sql).
 */
export const eventCategories = pgTable('event_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelGroupId: uuid('hotel_group_id')
    .notNull()
    .references(() => hotelGroups.id, { onDelete: 'cascade' }),
  name: jsonb('name').notNull().default(sql`'{}'::jsonb`), // Loc {tr,en,de,ru}
  color: text('color').notNull().default('#6366F1'),
  icon: text('icon'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Event locations (Main Pool, Beach, …). HOTEL-bound (each hotel has its own), managed
 * from the hotel detail Settings tab. `hotelGroupId` is denormalized for the group RLS
 * predicate. `name` is localized (guest-facing).
 */
export const eventLocations = pgTable('event_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelGroupId: uuid('hotel_group_id')
    .notNull()
    .references(() => hotelGroups.id, { onDelete: 'cascade' }),
  hotelId: uuid('hotel_id')
    .notNull()
    .references(() => hotels.id, { onDelete: 'cascade' }),
  name: jsonb('name').notNull().default(sql`'{}'::jsonb`), // Loc {tr,en,de,ru}
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * A hotel event/activity. Belongs to one hotel; `hotelGroupId` carried for group RLS.
 * Name/description are localized (guest-facing). Category & location reference the tables
 * above (nulled if the referenced row is deleted).
 */
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelGroupId: uuid('hotel_group_id')
    .notNull()
    .references(() => hotelGroups.id, { onDelete: 'cascade' }),
  hotelId: uuid('hotel_id')
    .notNull()
    .references(() => hotels.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => eventCategories.id, { onDelete: 'set null' }),
  locationId: uuid('location_id').references(() => eventLocations.id, { onDelete: 'set null' }),

  name: jsonb('name').notNull().default(sql`'{}'::jsonb`), // Loc
  description: jsonb('description').notNull().default(sql`'{}'::jsonb`), // Loc
  coverUrl: text('cover_url'),

  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  capacity: integer('capacity').notNull().default(0),
  status: eventStatusType('status').notNull().default('draft'),
  visibility: text('visibility').notNull().default('guest_portal'),

  // { registrationRequired: bool, paid: bool, maxPerBooking: number, recurring: bool }
  options: jsonb('options').notNull().default(sql`'{}'::jsonb`),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
