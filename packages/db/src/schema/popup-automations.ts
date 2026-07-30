import { jsonb, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { popupAutomationKind, popupAutomationStatus, popupAutomationTiming } from './enums';
import { hotels } from './tenancy';
import { surveys } from './surveys';

/**
 * One automation slot per hotel per kind (unique(hotelId, kind)) — mirrors the 2
 * fixed console rows (checkout, default).
 *
 * kind='checkout': timing = days-before-checkout; surveyId/content drive
 *   guest_popup_sends rows via loginGuest + applyCheckoutAutomationToActiveStays.
 * kind='default': timing is always 'every'; surveyId mirrors surveys.isDefault —
 *   this table is the source of truth for the UI, saving it also calls
 *   setDefaultSurvey() to keep isDefault in sync.
 */
export const popupAutomations = pgTable(
  'popup_automations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    hotelId: uuid('hotel_id')
      .notNull()
      .references(() => hotels.id, { onDelete: 'cascade' }),
    kind: popupAutomationKind('kind').notNull(),
    timing: popupAutomationTiming('timing').notNull(),
    surveyId: uuid('survey_id').references(() => surveys.id, { onDelete: 'set null' }),
    content: jsonb('content').notNull().default(sql`'{}'::jsonb`), // PopupContentMap
    status: popupAutomationStatus('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ oneSlotPerKind: unique('popup_automations_hotel_kind').on(t.hotelId, t.kind) }),
);
