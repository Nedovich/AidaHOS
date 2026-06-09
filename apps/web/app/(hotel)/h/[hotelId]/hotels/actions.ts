'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getHotelById, updateHotel, writeAudit } from '@aidahos/db';
import { canAccessHotel, getSession } from '@/lib/auth';
import { provisionHotelRadius, type RadiusBackend } from '@/lib/radius-backend';

type TenantStatus = 'active' | 'trial' | 'suspended' | 'archived';

/**
 * Group admin edits a hotel that belongs to their group + re-provisions its
 * FreeRADIUS NAS. Scoped: the target hotel must be in the admin's group, and the
 * group cannot be changed (no cross-group moves from the admin console).
 */
export async function updateGroupHotel(consoleHotelId: string, targetId: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') throw new Error('forbidden');

  const consoleHotel = await getHotelById(consoleHotelId);
  if (!consoleHotel) throw new Error('hotel not found');
  const groupId = consoleHotel.hotelGroupId;

  const target = await getHotelById(targetId);
  if (!target || target.hotelGroupId !== groupId) throw new Error('forbidden');
  if (!(await canAccessHotel(target.id, groupId))) throw new Error('forbidden');

  const name = String(formData.get('name') ?? '').trim();
  const status = String(formData.get('status') ?? 'trial') as TenantStatus;
  const backend: RadiusBackend = formData.get('radiusBackend') === 'local_mikrotik' ? 'local_mikrotik' : 'central_freeradius';
  const mikrotikIp = String(formData.get('mikrotikIp') ?? '').trim() || null;
  const exitIp = String(formData.get('exitIp') ?? '').trim() || null;
  const nasSecret = String(formData.get('nasSecret') ?? '').trim() || null;
  const mikrotikApiUser = String(formData.get('mikrotikApiUser') ?? '').trim() || null;
  const mikrotikApiPassword = String(formData.get('mikrotikApiPassword') ?? '').trim() || null;
  const portRaw = String(formData.get('mikrotikApiPort') ?? '').trim();
  const mikrotikApiPort = portRaw ? Number(portRaw) : null;
  if (name.length < 2) throw new Error('name required');

  // hotelGroupId stays fixed to the admin's group.
  await updateHotel(targetId, { name, status, hotelGroupId: groupId, radiusBackend: backend, mikrotikIp, exitIp, nasSecret, mikrotikApiUser, mikrotikApiPassword, mikrotikApiPort });
  await writeAudit({ actorUserId: session.user.id, hotelId: targetId, hotelGroupId: groupId, action: 'hotel.update_group', target: name, meta: { radiusBackend: backend, mikrotikIp, exitIp } });

  await provisionHotelRadius({
    backend,
    slug: target.slug,
    name,
    exitIp,
    mikrotikIp,
    nasSecret,
    actorId: session.user.id,
    hotelId: targetId,
    hotelGroupId: groupId,
  });

  revalidatePath(`/h/${consoleHotelId}/hotels/${targetId}`);
  revalidatePath(`/h/${consoleHotelId}/hotels`);
  redirect(`/h/${consoleHotelId}/hotels/${targetId}`);
}
