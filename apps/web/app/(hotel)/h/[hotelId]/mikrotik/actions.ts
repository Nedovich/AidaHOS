'use server';

import { getHotelById } from '@aidahos/db';
import { getSession } from '@/lib/auth';
import { mikrotikClientFromHotel } from '@/lib/mikrotik';

async function getHotelAndClient(hotelId: string) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  const hotel = await getHotelById(hotelId);
  if (!hotel) throw new Error('Hotel not found');
  const client = mikrotikClientFromHotel(hotel);
  return { hotel, client };
}

export async function listProfilesAction(hotelId: string) {
  const { client } = await getHotelAndClient(hotelId);
  return client.listHotspotProfiles();
}

export async function createProfileAction(
  hotelId: string,
  input: { name: string; rateLimit: string; sharedUsers: number },
) {
  const { client } = await getHotelAndClient(hotelId);
  return client.createHotspotProfile(input);
}

export async function updateProfileAction(
  hotelId: string,
  mtId: string,
  input: { name?: string; rateLimit?: string; sharedUsers?: number },
) {
  const { client } = await getHotelAndClient(hotelId);
  return client.updateHotspotProfile(mtId, input);
}

export async function deleteProfileAction(hotelId: string, mtId: string) {
  const { client } = await getHotelAndClient(hotelId);
  return client.deleteHotspotProfile(mtId);
}

export async function pingAction(hotelId: string) {
  try {
    const { client } = await getHotelAndClient(hotelId);
    return await client.ping();
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
