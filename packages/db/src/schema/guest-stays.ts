import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { hotelGroups, hotels } from './tenancy';

/**
 * Our persistent record of a verified guest stay — the data we pull from the hotel PMS
 * (dev: hotel_simulation; prod: MSSQL via PHP over Tailscale) at captive login and keep.
 * The PMS stays the source of truth; this is our working copy for the portal, surveys and
 * the hotel dashboard. Written by the guest app inside a withTenant(group) transaction so
 * the group-scoped RLS policy is satisfied.
 *
 * KVKK/GDPR: the hotel collects written, signed guest consent at check-in (the hotel is
 * the data controller, we are the processor). Keep a retention/purge policy for after
 * check-out (follow-up).
 */
export const guestStays = pgTable(
  'guest_stays',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    hotelId: uuid('hotel_id')
      .notNull()
      .references(() => hotels.id, { onDelete: 'cascade' }),
    // Denormalized for the group-scoped RLS predicate (same shape as survey_responses).
    hotelGroupId: uuid('hotel_group_id')
      .notNull()
      .references(() => hotelGroups.id, { onDelete: 'cascade' }),
    roomNo: text('room_no').notNull(),
    birthDate: text('birth_date').notNull(), // as used for verification (DDMMYYYY in dev)
    firstName: text('first_name'),
    lastName: text('last_name'),
    checkIn: timestamp('check_in', { withTimezone: true }),
    checkOut: timestamp('check_out', { withTimezone: true }),
    agency: text('agency'),
    phone: text('phone'),
    email: text('email'),
    country: text('country'),
    roomType: text('room_type'),
    currency: text('currency'),
    // Identity documents as the PMS holds them: tcNo only for Turkish citizens, idNo the
    // passport / ID number for everyone. Needed to attribute RADIUS session logs (5651)
    // to a person rather than just a room.
    tcNo: text('tc_no'),
    idNo: text('id_no'),
    reservationRef: text('reservation_ref'),
    // Checkout survey trigger: when to interrupt the session and show the checkout survey.
    // Set automatically at login = checkout - hotel.survey_trigger_days (midnight of that day).
    // Can be overridden manually from the guest detail page (with time precision for testing).
    surveyTriggerAt: timestamp('survey_trigger_at', { withTimezone: true }),
    // Set when the checkout popup is shown — prevents showing it twice and switches the
    // Session-Timeout to checkout + 1 day so the guest is not interrupted again.
    surveyShownAt: timestamp('survey_shown_at', { withTimezone: true }),

    lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    // A guest is identified at login by room + birth-date (handles two guests per room).
    stayKey: unique('guest_stays_hotel_room_birth').on(t.hotelId, t.roomNo, t.birthDate),
  }),
);
