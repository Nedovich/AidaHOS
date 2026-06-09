import 'server-only';
import { getDefaultSurvey, hasGuestResponded } from '@aidahos/db';
import type { SurveyOffer } from './survey-types';

export type { SurveyOffer };

/**
 * The hotel's default survey to offer a freshly-logged-in guest — unless they've
 * already answered it during this stay (`since` = check-in). Returns null otherwise.
 */
export async function defaultSurveyOffer(
  hotelId: string,
  roomNo: string,
  checkIn: string | Date | null,
): Promise<SurveyOffer | null> {
  const def = await getDefaultSurvey(hotelId);
  if (!def) return null;
  const since = checkIn ? new Date(checkIn) : new Date(0);
  if (await hasGuestResponded(def.id, hotelId, roomNo, since)) return null;
  return {
    id: def.id,
    slug: def.slug,
    name: def.name,
    json: def.json,
    defaultLocale: def.defaultLocale,
    thankYouTitle: def.thankYouTitle,
    thankYouDescription: def.thankYouDescription,
  };
}
