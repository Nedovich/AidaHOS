import { pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { membershipScope, userRole } from './enums';
import { users } from './auth';
import { hotelGroups, hotels } from './tenancy';

/**
 * Links a user to a tenant with a role. A user may manage multiple hotels/groups.
 * Exactly one of (hotelGroupId, hotelId) is set depending on `scope`.
 */
export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    scope: membershipScope('scope').notNull(),
    hotelGroupId: uuid('hotel_group_id').references(() => hotelGroups.id, { onDelete: 'cascade' }),
    hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }),
    role: userRole('role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('memberships_user_group_uq').on(t.userId, t.hotelGroupId),
    unique('memberships_user_hotel_uq').on(t.userId, t.hotelId),
  ],
);
