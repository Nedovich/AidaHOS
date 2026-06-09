import { sql } from 'drizzle-orm';
import { boolean, integer, jsonb, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { responseStatusType, surveyStatusType } from './enums';
import { hotelGroups, hotels } from './tenancy';

/**
 * A guest-feedback survey. Assigned to exactly **one hotel** (`hotelId`) so its
 * responses filter cleanly. `hotelGroupId` is kept (the hotel's group) for RLS —
 * group managers see every survey across their hotels. The form definition itself
 * is a SurveyJS model JSON stored in `json`.
 *
 * RLS lives in rls.sql (group-scoped, same shape as the `hotels` policy).
 */
export const surveys = pgTable('surveys', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelGroupId: uuid('hotel_group_id')
    .notNull()
    .references(() => hotelGroups.id, { onDelete: 'cascade' }),
  // The single hotel this survey belongs to. Nullable only to ease migration; the
  // app always sets it on create and the wizard requires it.
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  description: text('description'),
  slug: text('slug').notNull().unique(),
  status: surveyStatusType('status').notNull().default('draft'),
  defaultLocale: text('default_locale').notNull().default('en'),
  // At most one default survey per hotel — shown after captive-WiFi login. Enforced
  // in setDefaultSurvey() (unsets siblings); no DB partial-unique to keep push simple.
  isDefault: boolean('is_default').notNull().default(false),

  // SurveyJS model JSON (questions / pages / logic / theme).
  json: jsonb('json').notNull().default(sql`'{}'::jsonb`),

  thankYouTitle: text('thank_you_title'),
  thankYouDescription: text('thank_you_description'),

  // { guestVerification: bool, isAccountDefault: bool, expiresAt: string|null }
  accessControl: jsonb('access_control').notNull().default(sql`'{}'::jsonb`),

  createdBy: text('created_by'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * A single submitted response. `hotelGroupId` is denormalized from the survey so RLS
 * can scope by group without a join. Guest submissions are inserted by the guest app
 * inside a `withTenant({ role:'admin', hotelGroupId })` transaction (satisfies WITH CHECK).
 */
export const surveyResponses = pgTable('survey_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  surveyId: uuid('survey_id')
    .notNull()
    .references(() => surveys.id, { onDelete: 'cascade' }),
  hotelGroupId: uuid('hotel_group_id')
    .notNull()
    .references(() => hotelGroups.id, { onDelete: 'cascade' }),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'set null' }),

  roomNo: text('room_no'),
  guestName: text('guest_name'),

  // Raw SurveyJS answers keyed by question name.
  data: jsonb('data').notNull().default(sql`'{}'::jsonb`),
  // Overall score (0.0–5.0) derived at submit time when resolvable.
  score: numeric('score', { precision: 3, scale: 1 }),
  status: responseStatusType('status').notNull().default('new'),

  source: text('source'),
  device: text('device'),
  authMethod: text('auth_method'),
  completionSeconds: integer('completion_seconds'),

  // Internal triage
  assigneeName: text('assignee_name'),
  nlpTags: jsonb('nlp_tags').notNull().default(sql`'[]'::jsonb`),
  internalNotes: jsonb('internal_notes').notNull().default(sql`'[]'::jsonb`),

  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
