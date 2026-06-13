// DEV: seed default event categories (group), locations (hotel) and a few sample events.
// Usage: node scripts/seed-events.mjs [hotelSlug]   (default esken-bodrum)
// Idempotent: matches on name->>'en' so re-runs don't duplicate.
import postgres from 'postgres';
import '../../../scripts/load-root-env.mjs';

const slug = process.argv[2] ?? 'esken-bodrum';
const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) { console.error('seed-events: MIGRATION_DATABASE_URL / DATABASE_URL not set'); process.exit(1); }

const CATEGORIES = [
  { name: { tr: 'Eğlence', en: 'Entertainment', de: 'Unterhaltung', ru: 'Развлечения' }, color: '#7C5CFC' },
  { name: { tr: 'Çocuk Kulübü', en: 'Kids Club', de: 'Kinderclub', ru: 'Детский клуб' }, color: '#3B82F6' },
  { name: { tr: 'Spor', en: 'Sports', de: 'Sport', ru: 'Спорт' }, color: '#16A34A' },
  { name: { tr: 'Wellness', en: 'Wellness', de: 'Wellness', ru: 'Велнес' }, color: '#14B8A6' },
  { name: { tr: 'Yeme & İçme', en: 'Food & Drink', de: 'Essen & Trinken', ru: 'Еда и напитки' }, color: '#D97706' },
  { name: { tr: 'Özel Etkinlik', en: 'Special Event', de: 'Sonderveranstaltung', ru: 'Особое событие' }, color: '#DC2626' },
];

const LOCATIONS = [
  { tr: 'Ana Havuz', en: 'Main Pool', de: 'Hauptpool', ru: 'Главный бассейн' },
  { tr: 'Plaj', en: 'Beach', de: 'Strand', ru: 'Пляж' },
  { tr: 'Wellness Deck', en: 'Wellness Deck', de: 'Wellness-Deck', ru: 'Велнес-палуба' },
  { tr: 'Horizon Terası', en: 'Horizon Terrace', de: 'Horizont-Terrasse', ru: 'Терраса Горизонт' },
  { tr: 'Mini Kulüp', en: 'Mini Club', de: 'Miniclub', ru: 'Мини-клуб' },
];

const at = (dayOffset, h, m) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

const sql = postgres(url, { ssl: 'prefer', max: 1, connect_timeout: 15, onnotice: () => {} });
try {
  const hotel = (await sql`select id, hotel_group_id from hotels where slug = ${slug} limit 1`)[0];
  if (!hotel) { console.error(`seed-events: no hotel with slug "${slug}"`); process.exit(1); }
  const hotelId = hotel.id;
  const gid = hotel.hotel_group_id;

  // categories (group-scoped, dedupe by name->>'en')
  const catId = {};
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i];
    const ex = (await sql`select id from event_categories where hotel_group_id = ${gid} and name->>'en' = ${c.name.en} limit 1`)[0];
    if (ex) { catId[c.name.en] = ex.id; continue; }
    const r = (await sql`insert into event_categories (hotel_group_id, name, color, sort_order) values (${gid}, ${sql.json(c.name)}, ${c.color}, ${i}) returning id`)[0];
    catId[c.name.en] = r.id;
  }

  // locations (hotel-scoped)
  const locId = {};
  for (let i = 0; i < LOCATIONS.length; i++) {
    const l = LOCATIONS[i];
    const ex = (await sql`select id from event_locations where hotel_id = ${hotelId} and name->>'en' = ${l.en} limit 1`)[0];
    if (ex) { locId[l.en] = ex.id; continue; }
    const r = (await sql`insert into event_locations (hotel_group_id, hotel_id, name, sort_order) values (${gid}, ${hotelId}, ${sql.json(l)}, ${i}) returning id`)[0];
    locId[l.en] = r.id;
  }

  // sample events (dedupe by name->>'en')
  const SAMPLE = [
    { name: { tr: 'Havuz Başı DJ Performansı', en: 'Poolside DJ Set' }, cat: 'Entertainment', loc: 'Main Pool', s: at(0, 16, 0), e: at(0, 18, 0), cap: 200, status: 'live' },
    { name: { tr: 'Sabah Yogası', en: 'Sunrise Yoga' }, cat: 'Wellness', loc: 'Wellness Deck', s: at(1, 8, 0), e: at(1, 9, 0), cap: 30, status: 'scheduled' },
    { name: { tr: 'Türk Gecesi', en: 'Turkish Night' }, cat: 'Special Event', loc: 'Horizon Terrace', s: at(2, 21, 30), e: at(2, 23, 30), cap: 500, status: 'scheduled' },
  ];
  let made = 0;
  for (const ev of SAMPLE) {
    const ex = (await sql`select id from events where hotel_id = ${hotelId} and name->>'en' = ${ev.name.en} limit 1`)[0];
    if (ex) continue;
    await sql`insert into events (hotel_group_id, hotel_id, category_id, location_id, name, starts_at, ends_at, capacity, status, options)
      values (${gid}, ${hotelId}, ${catId[ev.cat] ?? null}, ${locId[ev.loc] ?? null}, ${sql.json(ev.name)}, ${ev.s}, ${ev.e}, ${ev.cap}, ${ev.status}, ${sql.json({ registrationRequired: true })})`;
    made++;
  }

  console.log(`seed-events: ${CATEGORIES.length} categories, ${LOCATIONS.length} locations ready; ${made} new sample event(s) for "${slug}".`);
} catch (e) {
  console.error('seed-events ERROR:', e.code ?? '', e.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 3 });
}
