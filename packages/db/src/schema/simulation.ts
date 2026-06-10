import { boolean, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { hotels } from './tenancy';

/**
 * DEV ONLY — stand-in for the on-prem hotel PMS (MSSQL behind a PHP layer reached
 * over Tailscale). The guest captive portal verifies room-no + birth-date against
 * this table while we build locally. In production the same `verifyGuest()` call
 * is routed to the hotel's server instead; this table is then ignored.
 *
 *   username (RADIUS) = `${hotel.slug}-${roomNo}`
 *   password (RADIUS) = birthDate (DDMMYYYY)
 */
export const hotelSimulation = pgTable(
  'hotel_simulation',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    hotelId: uuid('hotel_id')
      .notNull()
      .references(() => hotels.id, { onDelete: 'cascade' }),
    roomNo: text('room_no').notNull(),
    birthDate: text('birth_date').notNull(), // DDMMYYYY, e.g. "08051990"
    guestName: text('guest_name'),
    checkIn: timestamp('check_in', { withTimezone: true }),
    checkOut: timestamp('check_out', { withTimezone: true }),
    // Richer reservation fields mirroring the real PMS view (RMOS dbo.vwparali) so the
    // dev sim can exercise the full guest-capture path. All optional.
    firstName: text('first_name'), // Rez_Adi_1
    lastName: text('last_name'), // Rez_Adi_2
    agency: text('agency'), // Ac_Adi
    phone: text('phone'), // Kimlik_Tel
    email: text('email'), // Kimlik_Mail
    country: text('country'), // Ulke_Adi / Kimlik_Uyruk
    roomType: text('room_type'), // Oda_Tipi
    currency: text('currency'), // Doviz_Kodu
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    roomPerHotel: unique('hotel_simulation_hotel_room').on(t.hotelId, t.roomNo),
  }),
);
