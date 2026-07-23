import type { GuestEvent } from '@aidahos/db';
import { resolveLoc } from '@aidahos/db/portal-config';
import type { AidaEvent } from './data';
import type { Loc } from './i18n';

// Map a guest-portal day bucket: today / tomorrow / later — drives the Events filter chips.
function dayBucket(startsAt: Date | null): string {
  if (!startsAt) return 'later';
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  const startOfDayAfter = new Date(startOfTomorrow.getTime() + 24 * 60 * 60 * 1000);
  const t = startsAt.getTime();
  if (t >= startOfToday.getTime() && t < startOfTomorrow.getTime()) return 'today';
  if (t >= startOfTomorrow.getTime() && t < startOfDayAfter.getTime()) return 'tomorrow';
  return 'later';
}

function hhmm(d: Date | null): string {
  if (!d) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

// DB Loc (all-optional) → guest Loc (requires `en`). Falls back to any present language.
function toGuestLoc(loc: Partial<Record<'en' | 'tr' | 'de' | 'ru', string>> | null | undefined, fallback: string): Loc {
  const l = loc ?? {};
  const en = l.en ?? resolveLoc(l, 'en', 'en') ?? fallback;
  return { en: en || fallback, tr: l.tr, de: l.de, ru: l.ru };
}

// Gradient placeholder token by category — used when an event has no cover image.
function phForCategory(catEn: string): string {
  const c = catEn.toLowerCase();
  if (c.includes('well') || c.includes('spa') || c.includes('yoga')) return '--ph-spa';
  if (c.includes('food') || c.includes('drink') || c.includes('din') || c.includes('culinary')) return '--ph-wine';
  if (c.includes('music') || c.includes('night') || c.includes('jazz') || c.includes('special')) return '--ph-night';
  if (c.includes('sport') || c.includes('sea') || c.includes('water')) return '--ph-sea';
  if (c.includes('kid')) return '--ph-sand';
  return '--ph-sunset';
}

/** Convert DB guest events into the shape the guest UI cards/sheets expect. */
export function mapGuestEvents(rows: GuestEvent[]): AidaEvent[] {
  return rows.map((r) => {
    const catEn = r.categoryName ? resolveLoc(r.categoryName, 'en', 'en') : '';
    return {
      id: r.id,
      photo: r.coverUrl ?? '',
      ph: phForCategory(catEn),
      cat: catEn.toLowerCase() || 'event',
      day: dayBucket(r.startsAt),
      time: hhmm(r.startsAt),
      title: toGuestLoc(r.name, 'Event'),
      place: toGuestLoc(r.locationName, ''),
      desc: toGuestLoc(r.description, ''),
    } satisfies AidaEvent;
  });
}
