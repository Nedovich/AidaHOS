'use server';

import { getHotelById, publishHotelPortal, saveHotelPortalDraft, type PortalConfig } from '@aidahos/db';
import { canAccessHotel, getSession } from '@/lib/auth';

async function assertAccess(hotelId: string) {
  const session = await getSession();
  if (!session) throw new Error('unauthorized');
  const hotel = await getHotelById(hotelId);
  if (!hotel) throw new Error('hotel not found');
  if (session.user.role !== 'super_admin' && !(await canAccessHotel(hotel.id, hotel.hotelGroupId))) {
    throw new Error('forbidden');
  }
}

/** Save the admin's working draft (not yet visible to guests). */
export async function saveDraftPortalAction(hotelId: string, config: PortalConfig): Promise<{ ok: true }> {
  await assertAccess(hotelId);
  await saveHotelPortalDraft(hotelId, config);
  return { ok: true };
}

/** Publish: the config becomes live (what guests see) and the working draft. */
export async function publishPortalAction(hotelId: string, config: PortalConfig): Promise<{ ok: true }> {
  await assertAccess(hotelId);
  await publishHotelPortal(hotelId, config);
  return { ok: true };
}
