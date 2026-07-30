'use server';

import { revalidatePath } from 'next/cache';
import {
  getHotelById,
  getGuestStayById,
  createGuestPopupSend,
  setGuestPopupSendTrigger,
  markGuestPopupSendShown,
  deleteGuestPopupSend,
  type PopupContentMap,
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

export async function createPopupSendAction(
  hotelId: string,
  payload: {
    guestStayId: string;
    popupType: 'survey' | 'event' | 'announcement';
    surveyId: string | null;
    eventId: string | null;
    content: PopupContentMap;
    triggerAt: string;
  },
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const hotel = await assertHotelAccess(hotelId);
    const stay = await getGuestStayById(payload.guestStayId);
    if (!stay) return { ok: false, error: 'not-found' };

    const send = await createGuestPopupSend({
      hotelId: hotel.id,
      hotelGroupId: hotel.hotelGroupId,
      guestStayId: payload.guestStayId,
      popupType: payload.popupType,
      surveyId: payload.popupType === 'survey' ? payload.surveyId : null,
      eventId: payload.popupType === 'event' ? payload.eventId : null,
      content: payload.content,
      triggerAt: new Date(payload.triggerAt),
    });

    revalidatePath(`/h/${hotelId}/surveys/sends`);
    return { ok: true, id: send.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'error' };
  }
}

export async function updatePopupSendTriggerAction(
  hotelId: string,
  popupSendId: string,
  triggerAt: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertHotelAccess(hotelId);
    await setGuestPopupSendTrigger(popupSendId, new Date(triggerAt));
    revalidatePath(`/h/${hotelId}/surveys/sends`);
    revalidatePath(`/h/${hotelId}/surveys/sends/${popupSendId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: 'forbidden' };
  }
}

export async function markPopupSendShownAction(
  hotelId: string,
  popupSendId: string,
): Promise<{ ok: boolean }> {
  try {
    await assertHotelAccess(hotelId);
    await markGuestPopupSendShown(popupSendId);
    revalidatePath(`/h/${hotelId}/surveys/sends`);
    revalidatePath(`/h/${hotelId}/surveys/sends/${popupSendId}`);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function deletePopupSendAction(
  hotelId: string,
  popupSendId: string,
): Promise<{ ok: boolean }> {
  try {
    await assertHotelAccess(hotelId);
    await deleteGuestPopupSend(popupSendId);
    revalidatePath(`/h/${hotelId}/surveys/sends`);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
