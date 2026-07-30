import { jsonb, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { popupSendType } from './enums';
import { hotelGroups, hotels } from './tenancy';
import { guestStays } from './guest-stays';
import { surveys } from './surveys';
import { events } from './events';

/**
 * One scheduled / completed popup send for a guest — survey, event announcement, or a
 * free-text announcement. A guest can have many of these; each row is independent:
 * scheduling a new send never overwrites a previous one.
 *
 * popupType  — which kind of popup this is; drives whether surveyId/eventId is set.
 * content    — denormalized per-language {title, description, buttonLabel}, always populated
 *              at create time (so the guest app never needs to re-derive text from
 *              surveys/events at render time — one render path for all 3 types).
 * triggerAt  — when to disconnect the guest and show the popup.
 * shownAt    — set by loginGuest on reconnect when the popup is displayed.
 *              NULL means still scheduled; non-NULL means sent.
 */
export const guestPopupSends = pgTable('guest_popup_sends', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id')
    .notNull()
    .references(() => hotels.id, { onDelete: 'cascade' }),
  hotelGroupId: uuid('hotel_group_id')
    .notNull()
    .references(() => hotelGroups.id, { onDelete: 'cascade' }),
  guestStayId: uuid('guest_stay_id')
    .notNull()
    .references(() => guestStays.id, { onDelete: 'cascade' }),
  popupType: popupSendType('popup_type').notNull().default('survey'),
  surveyId: uuid('survey_id')
    .references(() => surveys.id, { onDelete: 'set null' }),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'set null' }),
  content: jsonb('content').default(sql`'{}'::jsonb`),
  triggerAt: timestamp('trigger_at', { withTimezone: true }).notNull(),
  shownAt: timestamp('shown_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
