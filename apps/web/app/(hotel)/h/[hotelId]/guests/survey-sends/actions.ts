'use server';

import { revalidatePath } from 'next/cache';
import { getHotelById, getGuestStayById, setGuestSurveyTrigger, markSurveyShown } from '@aidahos/db';
import { canAccessHotel, getSession } from '@/lib/auth';
import { mikrotikClientFromHotel } from '@/lib/mikrotik';

async function assertHotelAccess(hotelId: string) {
  const session = await getSession();
  if (!session || session.user.role === 'super_admin' || session.user.role === 'customer') throw new Error('forbidden');
  const hotel = await getHotelById(hotelId);
  if (!hotel) throw new Error('not-found');
  if (!(await canAccessHotel(hotel.id, hotel.hotelGroupId))) throw new Error('forbidden');
  return hotel;
}

/** Set (or clear) the survey trigger time for a guest stay from the Survey Sends page. */
export async function setSurveyTriggerAction(
  hotelId: string,
  guestStayId: string,
  triggerAt: string | null,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertHotelAccess(hotelId);
    await setGuestSurveyTrigger(guestStayId, triggerAt ? new Date(triggerAt) : null);
    revalidatePath(`/h/${hotelId}/guests/survey-sends`);
    revalidatePath(`/h/${hotelId}/guests/survey-sends/${guestStayId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: 'forbidden' };
  }
}

/** Mark a stay's survey as shown (= "sent") from the console. */
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
