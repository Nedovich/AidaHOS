'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createHotelFull,
  findHotelBySlug,
  getHotelById,
  updateHotel,
  writeAudit,
} from '@aidahos/db';
import { getSession } from '@/lib/auth';
import { provisionNas } from '@/lib/nas';
import { slugify } from '@/lib/slug';

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let n = 2;
  while (await findHotelBySlug(slug)) slug = `${base}-${n++}`;
  return slug;
}

type TenantStatus = 'active' | 'trial' | 'suspended' | 'archived';

/** Create a hotel under a group + provision its FreeRADIUS NAS. super_admin only. Audited. */
export async function createHotelAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role !== 'super_admin') throw new Error('forbidden');

  const name = String(formData.get('name') ?? '').trim();
  const hotelGroupId = String(formData.get('hotelGroupId') ?? '');
  const mikrotikIp = String(formData.get('mikrotikIp') ?? '').trim() || null;
  const exitIp = String(formData.get('exitIp') ?? '').trim() || null;
  const nasSecret = String(formData.get('nasSecret') ?? '').trim() || null;

  if (name.length < 2) throw new Error('name required');
  if (!hotelGroupId) throw new Error('hotel group required');

  const hotel = await createHotelFull({ hotelGroupId, name, slug: await uniqueSlug(name), mikrotikIp, exitIp, nasSecret });

  await writeAudit({
    actorUserId: session.user.id,
    hotelGroupId,
    hotelId: hotel.id,
    action: 'hotel.create',
    target: hotel.name,
    meta: { mikrotikIp, exitIp },
  });
  await provisionNas({
    slug: hotel.slug,
    name: hotel.name,
    exitIp,
    mikrotikIp,
    nasSecret,
    actorId: session.user.id,
    hotelId: hotel.id,
    hotelGroupId,
  });

  revalidatePath('/hotels');
  redirect(`/hotels/${hotel.id}`);
}

/** Edit a hotel + re-provision its FreeRADIUS NAS. super_admin only. Audited. */
export async function updateHotelAction(id: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role !== 'super_admin') throw new Error('forbidden');

  const name = String(formData.get('name') ?? '').trim();
  const status = String(formData.get('status') ?? 'trial') as TenantStatus;
  const hotelGroupId = String(formData.get('hotelGroupId') ?? '');
  const mikrotikIp = String(formData.get('mikrotikIp') ?? '').trim() || null;
  const exitIp = String(formData.get('exitIp') ?? '').trim() || null;
  const nasSecret = String(formData.get('nasSecret') ?? '').trim() || null;

  if (name.length < 2) throw new Error('name required');
  if (!hotelGroupId) throw new Error('hotel group required');

  await updateHotel(id, { name, status, hotelGroupId, mikrotikIp, exitIp, nasSecret });
  await writeAudit({ actorUserId: session.user.id, hotelId: id, hotelGroupId, action: 'hotel.update', target: name, meta: { mikrotikIp, exitIp } });

  const hotel = await getHotelById(id);
  if (hotel) {
    await provisionNas({
      slug: hotel.slug,
      name,
      exitIp,
      mikrotikIp,
      nasSecret,
      actorId: session.user.id,
      hotelId: id,
      hotelGroupId,
    });
  }

  revalidatePath(`/hotels/${id}`);
  revalidatePath('/hotels');
  redirect(`/hotels/${id}`);
}
