'use server';

import { revalidatePath } from 'next/cache';
import { setGuestSurveyTrigger } from '@aidahos/db';
import { canAccessHotel, getSession } from '@/lib/auth';
import { getHotelById } from '@aidahos/db';

async function assertHotelAccess(hotelId: string) {
  const session = await getSession();
  if (!session || session.user.role === 'super_admin' || session.user.role === 'customer') throw new Error('forbidden');
  const hotel = await getHotelById(hotelId);
  if (!hotel) throw new Error('not-found');
  if (!(await canAccessHotel(hotel.id, hotel.hotelGroupId))) throw new Error('forbidden');
  return hotel;
}

export async function setGuestSurveyTriggerAction(
  hotelId: string,
  guestId: string,
  triggerAt: string | null,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertHotelAccess(hotelId);
    const date = triggerAt ? new Date(triggerAt) : null;
    await setGuestSurveyTrigger(guestId, date);
    revalidatePath(`/h/${hotelId}/guests/${guestId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: 'forbidden' };
  }
}
