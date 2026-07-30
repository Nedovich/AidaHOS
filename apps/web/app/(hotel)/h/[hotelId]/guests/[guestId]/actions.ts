'use server';

import { revalidatePath } from 'next/cache';
import {
  createGuestPopupSend,
  getHotelById,
  listPopupSendsForStay,
  setGuestPopupSendTrigger,
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

/**
 * Set the checkout-survey popup trigger from the guest detail KPI card.
 * - If a scheduled (not yet shown) send exists → update its triggerAt.
 * - Otherwise → create a new send record.
 * This keeps guest_popup_sends as the single source of truth.
 */
export async function setGuestPopupSendAction(
  hotelId: string,
  guestStayId: string,
  triggerAt: string | null,
  hotelGroupId: string,
  surveyId: string | null,
  surveyName: string | null,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertHotelAccess(hotelId);
    if (!triggerAt) return { ok: false, error: 'no-date' };

    const date = new Date(triggerAt);
    const sends = await listPopupSendsForStay(guestStayId);

    // Find the most recent scheduled (not yet shown) send to update.
    const scheduledSend = sends
      .filter((s) => !s.shownAt)
      .sort((a, b) => b.triggerAt.getTime() - a.triggerAt.getTime())[0];

    if (scheduledSend) {
      await setGuestPopupSendTrigger(scheduledSend.id, date);
    } else {
      // No scheduled send exists — create a new one.
      await createGuestPopupSend({
        hotelId,
        hotelGroupId,
        guestStayId,
        popupType: 'survey',
        surveyId,
        eventId: null,
        content: {
          tr: { title: surveyName ?? '', description: '', buttonLabel: 'Anketi Doldur' },
          en: { title: surveyName ?? '', description: '', buttonLabel: 'Take Survey' },
        },
        triggerAt: date,
      });
    }

    revalidatePath(`/h/${hotelId}/guests/${guestStayId}`);
    revalidatePath(`/h/${hotelId}/surveys/sends`);
    return { ok: true };
  } catch {
    return { ok: false, error: 'forbidden' };
  }
}
