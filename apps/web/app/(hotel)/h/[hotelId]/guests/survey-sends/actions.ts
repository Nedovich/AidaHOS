'use server';

import { revalidatePath } from 'next/cache';
import {
  getHotelById,
  getGuestStayById,
  getCheckoutSurveyForHotel,
  createGuestPopupSend,
  setGuestPopupSendTrigger,
  markGuestPopupSendShown,
  deleteGuestPopupSend,
  // Legacy: used only for the auto-set trigger from loginGuest flow
  setGuestSurveyTrigger,
  markSurveyShown,
} from '@aidahos/db';
import { canAccessHotel, getSession } from '@/lib/auth';

async function assertHotelAccess(hotelId: string) {
  const session = await getSession();
  if (!session || session.user.role === 'super_admin' || session.user.role === 'customer') throw new Error('forbidden');
  const hotel = await getHotelById(hotelId);
  if (!hotel) throw new Error('not-found');
  if (!(await canAccessHotel(hotel.id, hotel.hotelGroupId))) throw new Error('forbidden');
  return hotel;
}

/** Create a brand-new survey send record — never touches existing sends. */
export async function createSurveySendAction(
  hotelId: string,
  guestStayId: string,
  triggerAt: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const hotel = await assertHotelAccess(hotelId);
    const stay = await getGuestStayById(guestStayId);
    if (!stay) return { ok: false, error: 'not-found' };

    const checkoutSurvey = await getCheckoutSurveyForHotel(hotel.hotelGroupId);

    const send = await createGuestPopupSend({
      hotelId: hotel.id,
      hotelGroupId: hotel.hotelGroupId,
      guestStayId,
      popupType: 'survey',
      surveyId: checkoutSurvey?.id ?? null,
      eventId: null,
      content: {
        tr: { title: checkoutSurvey?.name ?? '', description: '', buttonLabel: 'Anketi Doldur' },
        en: { title: checkoutSurvey?.name ?? '', description: '', buttonLabel: 'Take Survey' },
      },
      triggerAt: new Date(triggerAt),
    });

    revalidatePath(`/h/${hotelId}/guests/survey-sends`);
    return { ok: true, id: send.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'error' };
  }
}

/** Edit trigger time of a scheduled (not yet shown) survey send. */
export async function updateSurveySendTriggerAction(
  hotelId: string,
  surveySendId: string,
  triggerAt: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertHotelAccess(hotelId);
    await setGuestPopupSendTrigger(surveySendId, new Date(triggerAt));
    revalidatePath(`/h/${hotelId}/guests/survey-sends`);
    revalidatePath(`/h/${hotelId}/guests/survey-sends/${surveySendId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: 'forbidden' };
  }
}

/** Mark a survey send as shown (= "sent") from the console. */
export async function markSurveySendShownAction(
  hotelId: string,
  surveySendId: string,
): Promise<{ ok: boolean }> {
  try {
    await assertHotelAccess(hotelId);
    await markGuestPopupSendShown(surveySendId);
    revalidatePath(`/h/${hotelId}/guests/survey-sends`);
    revalidatePath(`/h/${hotelId}/guests/survey-sends/${surveySendId}`);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Delete a scheduled (not yet shown) survey send. */
export async function deleteSurveySendAction(
  hotelId: string,
  surveySendId: string,
): Promise<{ ok: boolean }> {
  try {
    await assertHotelAccess(hotelId);
    await deleteGuestPopupSend(surveySendId);
    revalidatePath(`/h/${hotelId}/guests/survey-sends`);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

// ---- Legacy actions kept for guest_stays.surveyTriggerAt (auto-set at login) ----

/** @deprecated Use createSurveySendAction for new sends. Only used by the edit page for the auto-set trigger. */
export async function setSurveyTriggerAction(
  hotelId: string,
  guestStayId: string,
  triggerAt: string | null,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertHotelAccess(hotelId);
    await setGuestSurveyTrigger(guestStayId, triggerAt ? new Date(triggerAt) : null, false);
    revalidatePath(`/h/${hotelId}/guests/survey-sends`);
    revalidatePath(`/h/${hotelId}/guests/survey-sends/${guestStayId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: 'forbidden' };
  }
}

/** @deprecated Use markSurveySendShownAction. */
export async function markSurveyShownAction(
  hotelId: string,
  guestStayId: string,
): Promise<{ ok: boolean }> {
  try {
    await assertHotelAccess(hotelId);
    await markSurveyShown(guestStayId);
    revalidatePath(`/h/${hotelId}/guests/survey-sends`);
    revalidatePath(`/h/${hotelId}/guests/survey-sends/${guestStayId}`);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
