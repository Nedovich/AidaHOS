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
import { provisionHotelRadius, type RadiusBackend } from '@/lib/radius-backend';
import { slugify } from '@/lib/slug';

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let n = 2;
  while (await findHotelBySlug(slug)) slug = `${base}-${n++}`;
  return slug;
}

type TenantStatus = 'active' | 'trial' | 'suspended' | 'archived';

/** Parse the shared network/RADIUS fields off a hotel form. */
function parseRadiusForm(formData: FormData) {
  const backend: RadiusBackend = formData.get('radiusBackend') === 'local_mikrotik' ? 'local_mikrotik' : 'central_freeradius';
  const portRaw = String(formData.get('mikrotikApiPort') ?? '').trim();
  return {
    radiusBackend: backend,
    mikrotikIp: String(formData.get('mikrotikIp') ?? '').trim() || null,
    exitIp: String(formData.get('exitIp') ?? '').trim() || null,
    nasSecret: String(formData.get('nasSecret') ?? '').trim() || null,
    mikrotikApiUser: String(formData.get('mikrotikApiUser') ?? '').trim() || null,
    mikrotikApiPassword: String(formData.get('mikrotikApiPassword') ?? '').trim() || null,
    mikrotikApiPort: portRaw ? Number(portRaw) : null,
  };
}

/** Create a hotel under a group + provision its FreeRADIUS NAS. super_admin only. Audited. */
export async function createHotelAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role !== 'super_admin') throw new Error('forbidden');

  const name = String(formData.get('name') ?? '').trim();
  const hotelGroupId = String(formData.get('hotelGroupId') ?? '');
  const net = parseRadiusForm(formData);

  if (name.length < 2) throw new Error('name required');
  if (!hotelGroupId) throw new Error('hotel group required');

  const hotel = await createHotelFull({ hotelGroupId, name, slug: await uniqueSlug(name), ...net });

  await writeAudit({
    actorUserId: session.user.id,
    hotelGroupId,
    hotelId: hotel.id,
    action: 'hotel.create',
    target: hotel.name,
    meta: { radiusBackend: net.radiusBackend, mikrotikIp: net.mikrotikIp, exitIp: net.exitIp },
  });
  await provisionHotelRadius({
    backend: net.radiusBackend,
    slug: hotel.slug,
    name: hotel.name,
    exitIp: net.exitIp,
    mikrotikIp: net.mikrotikIp,
    nasSecret: net.nasSecret,
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
  const net = parseRadiusForm(formData);

  if (name.length < 2) throw new Error('name required');
  if (!hotelGroupId) throw new Error('hotel group required');

  await updateHotel(id, { name, status, hotelGroupId, ...net });
  await writeAudit({ actorUserId: session.user.id, hotelId: id, hotelGroupId, action: 'hotel.update', target: name, meta: { radiusBackend: net.radiusBackend, mikrotikIp: net.mikrotikIp, exitIp: net.exitIp } });

  const hotel = await getHotelById(id);
  if (hotel) {
    await provisionHotelRadius({
      backend: net.radiusBackend,
      slug: hotel.slug,
      name,
      exitIp: net.exitIp,
      mikrotikIp: net.mikrotikIp,
      nasSecret: net.nasSecret,
      actorId: session.user.id,
      hotelId: id,
      hotelGroupId,
    });
  }

  revalidatePath(`/hotels/${id}`);
  revalidatePath('/hotels');
  redirect(`/hotels/${id}`);
}
