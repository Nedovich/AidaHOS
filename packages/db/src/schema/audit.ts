import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/** Append-only audit trail. Captures impersonation, provisioning, role changes, etc. */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorUserId: uuid('actor_user_id'),
  impersonatedUserId: uuid('impersonated_user_id'),
  hotelId: uuid('hotel_id'),
  hotelGroupId: uuid('hotel_group_id'),
  action: text('action').notNull(),
  target: text('target'),
  meta: jsonb('meta').notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
