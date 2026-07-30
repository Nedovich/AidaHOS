import 'server-only';
import { getDefaultSurvey, getPopupAutomation, hasGuestResponded } from '@aidahos/db';
import type { SurveyOffer } from './survey-types';

export type { SurveyOffer };

/**
 * The hotel's default survey to offer a freshly-logged-in guest — unless they've
 * already answered it during this stay (`since` = check-in). Returns null otherwise.
 *
 * surveys.isDefault is just a badge/tag on the survey — it does NOT by itself turn
 * the offer on. Actually sending requires an active 'default' popup_automations row
 * (created/managed from /h/{hotelId}/surveys/sends). This stops a stale isDefault
 * flag (set once, automation never created or since paused/deleted) from silently
 * offering a survey forever.
 */
export async function defaultSurveyOffer(
  hotelId: string,
  roomNo: string,
  checkIn: string | Date | null,
): Promise<SurveyOffer | null> {
  const automation = await getPopupAutomation(hotelId, 'default');
  if (!automation || automation.status !== 'active') return null;

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
