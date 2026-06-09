// DEV: seed example surveys + responses for a hotel group.
// Usage: node scripts/seed-surveys.mjs [hotelSlug]
import postgres from 'postgres';
import '../../../scripts/load-root-env.mjs';

const slug = process.argv[2] ?? 'esken-bodrum';
const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error('seed-surveys: MIGRATION_DATABASE_URL / DATABASE_URL is not set');
  process.exit(1);
}

// A real SurveyJS model so the builder/preview/guest runner all have content.
const checkoutJson = {
  title: 'Check-out Feedback',
  description: 'Standard end-of-stay survey',
  pages: [
    {
      name: 'page1',
      elements: [
        { type: 'rating', name: 'overall', title: 'How would you rate your overall experience with us?', rateMax: 5, isRequired: true },
        {
          type: 'checkbox',
          name: 'amenities',
          title: 'Which amenities did you use during your stay?',
          choices: ['Spa & Wellness', 'Room Service', 'Fitness Center', 'Pool', 'Restaurant'],
        },
        { type: 'comment', name: 'comments', title: 'Do you have any additional comments or suggestions?' },
      ],
    },
  ],
};

const draftJson = {
  title: 'Restaurant Experience',
  pages: [{ name: 'page1', elements: [{ type: 'rating', name: 'food', title: 'How was the food?', rateMax: 5 }] }],
};

// roomNo, guestName, score, status, source, data
const RESPONSES = [
  ['402', 'Eleanor James', 2.0, 'flagged', 'Standard flow', { overall: 2, amenities: ['Room Service'], comments: 'AC was noisy at night.' }],
  ['1105', 'Marcus Webb', 5.0, 'new', 'QR Code scan', { overall: 5, amenities: ['Spa & Wellness', 'Pool'], comments: 'Fantastic stay!' }],
  ['312', 'Sarah Palmer', 4.0, 'reviewed', 'Email invite', { overall: 4, amenities: ['Restaurant'], comments: 'Great food.' }],
  ['508', 'Ahmet Yıldız', 4.5, 'reviewed', 'WhatsApp', { overall: 5, amenities: ['Restaurant', 'Pool'], comments: 'Çok memnun kaldık.' }],
  ['210', 'Lena Hoffmann', 3.0, 'flagged', 'Captive portal', { overall: 3, amenities: [], comments: 'Check-in was slow.' }],
  ['615', 'Davide Russo', 5.0, 'new', 'Push notification', { overall: 5, amenities: ['Spa & Wellness'], comments: 'Loved the spa.' }],
];

const sql = postgres(url, { ssl: 'prefer', max: 1, connect_timeout: 15, onnotice: () => {} });
try {
  const hotel = await sql`select id, hotel_group_id from hotels where slug = ${slug} limit 1`;
  if (!hotel.length) {
    console.error(`seed-surveys: no hotel with slug "${slug}"`);
    process.exit(1);
  }
  const groupId = hotel[0].hotel_group_id;
  const hotelId = hotel[0].id;

  // Published survey (deterministic slug → idempotent upsert). Assigned to one hotel.
  const pub = await sql`
    insert into surveys (hotel_group_id, hotel_id, name, description, slug, status, default_locale, json,
      thank_you_title, thank_you_description, access_control, published_at)
    values (${groupId}, ${hotelId}, 'Check-out Memnuniyeti', 'Standart konaklama sonu anketi', 'checkout-feedback',
      'published', 'en', ${sql.json(checkoutJson)}, 'Teşekkürler', 'Geri bildiriminiz kaydedildi.',
      ${sql.json({ guestVerification: true, isAccountDefault: false, expiresAt: null })}, now())
    on conflict (slug) do update set name = excluded.name, hotel_id = excluded.hotel_id, json = excluded.json,
      status = excluded.status, access_control = excluded.access_control, updated_at = now()
    returning id`;
  const surveyId = pub[0].id;

  // Draft survey
  await sql`
    insert into surveys (hotel_group_id, hotel_id, name, description, slug, status, json)
    values (${groupId}, ${hotelId}, 'Restoran Geri Bildirimi', 'Taslak', 'restaurant-feedback', 'draft', ${sql.json(draftJson)})
    on conflict (slug) do update set name = excluded.name, hotel_id = excluded.hotel_id, json = excluded.json, updated_at = now()`;

  // Reset + insert responses for the published survey (idempotent for dev)
  await sql`delete from survey_responses where survey_id = ${surveyId}`;
  for (const [roomNo, guestName, score, status, source, data] of RESPONSES) {
    await sql`
      insert into survey_responses (survey_id, hotel_group_id, hotel_id, room_no, guest_name, data, score, status, source, device, auth_method)
      values (${surveyId}, ${groupId}, ${hotelId}, ${roomNo}, ${guestName}, ${sql.json(data)}, ${score}, ${status}, ${source},
        'Mobile · iPhone (iOS 18)', 'Room Number + Surname')`;
  }

  console.log(`seed-surveys: seeded 2 surveys + ${RESPONSES.length} responses for group ${groupId} (hotel "${slug}").`);
  console.log('  published survey slug: checkout-feedback');
} catch (e) {
  console.error('seed-surveys ERROR:', e.code ?? '', e.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 3 });
}
