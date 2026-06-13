'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createEvent, createEventCategory, createEventLocation,
  deleteEventCategory, deleteEventLocation,
  getEventById, getHotelById, updateEvent, updateEventCategory, updateEventLocation,
  type EventOptions, type Loc,
} from '@aidahos/db';
import { canAccessHotel, getSession } from '@/lib/auth';

/** Resolve the console hotel → its group and assert the user can manage it. */
async function assertGroup(consoleHotelId: string): Promise<string> {
  const session = await getSession();
  if (!session || session.user.role === 'customer') throw new Error('forbidden');
  const hotel = await getHotelById(consoleHotelId);
  if (!hotel) throw new Error('not-found');
  if (session.user.role !== 'super_admin' && !(await canAccessHotel(hotel.id, hotel.hotelGroupId))) throw new Error('forbidden');
  return hotel.hotelGroupId;
}

/** A target hotel must belong to the same group the user manages. */
async function assertHotelInGroup(groupId: string, targetHotelId: string): Promise<void> {
  const target = await getHotelById(targetHotelId);
  if (!target || target.hotelGroupId !== groupId) throw new Error('forbidden');
}

/* ---------------- categories (group-scoped) ---------------- */
export async function createCategoryAction(consoleHotelId: string, input: { name: Loc; color: string }) {
  const groupId = await assertGroup(consoleHotelId);
  await createEventCategory({ hotelGroupId: groupId, name: input.name, color: input.color });
  revalidatePath(`/h/${consoleHotelId}/events/settings`);
  revalidatePath(`/h/${consoleHotelId}/events/new`);
}

export async function updateCategoryAction(consoleHotelId: string, id: string, patch: { name?: Loc; color?: string }) {
  await assertGroup(consoleHotelId);
  await updateEventCategory(id, patch);
  revalidatePath(`/h/${consoleHotelId}/events/settings`);
}

export async function deleteCategoryAction(consoleHotelId: string, id: string) {
  await assertGroup(consoleHotelId);
  await deleteEventCategory(id);
  revalidatePath(`/h/${consoleHotelId}/events/settings`);
}

/* ---------------- locations (hotel-scoped) ---------------- */
export async function createLocationAction(consoleHotelId: string, targetHotelId: string, input: { name: Loc }) {
  const groupId = await assertGroup(consoleHotelId);
  await assertHotelInGroup(groupId, targetHotelId);
  await createEventLocation({ hotelGroupId: groupId, hotelId: targetHotelId, name: input.name });
  revalidatePath(`/h/${consoleHotelId}/hotels/${targetHotelId}`);
  revalidatePath(`/h/${consoleHotelId}/events/new`);
}

export async function updateLocationAction(consoleHotelId: string, targetHotelId: string, id: string, patch: { name?: Loc }) {
  const groupId = await assertGroup(consoleHotelId);
  await assertHotelInGroup(groupId, targetHotelId);
  await updateEventLocation(id, patch);
  revalidatePath(`/h/${consoleHotelId}/hotels/${targetHotelId}`);
  revalidatePath(`/h/${consoleHotelId}/events/new`);
}

export async function deleteLocationAction(consoleHotelId: string, targetHotelId: string, id: string) {
  const groupId = await assertGroup(consoleHotelId);
  await assertHotelInGroup(groupId, targetHotelId);
  await deleteEventLocation(id);
  revalidatePath(`/h/${consoleHotelId}/hotels/${targetHotelId}`);
}

/* ---------------- events ---------------- */
export interface CreateEventInput {
  hotelId: string;
  categoryId: string | null;
  locationId: string | null;
  name: Loc;
  description: Loc;
  coverUrl: string | null;
  startsAt: string | null; // ISO
  endsAt: string | null;
  capacity: number;
  status: 'draft' | 'scheduled' | 'live' | 'full' | 'completed' | 'cancelled';
  options: EventOptions;
}

export async function createEventAction(consoleHotelId: string, input: CreateEventInput) {
  const groupId = await assertGroup(consoleHotelId);
  await assertHotelInGroup(groupId, input.hotelId);
  await createEvent({
    hotelGroupId: groupId,
    hotelId: input.hotelId,
    categoryId: input.categoryId,
    locationId: input.locationId,
    name: input.name,
    description: input.description,
    coverUrl: input.coverUrl,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    capacity: input.capacity,
    status: input.status,
    options: input.options,
  });
  revalidatePath(`/h/${consoleHotelId}/events/list`);
  revalidatePath(`/h/${consoleHotelId}/events`);
  redirect(`/h/${consoleHotelId}/events/list`);
}

export async function updateEventAction(consoleHotelId: string, eventId: string, input: CreateEventInput) {
  const groupId = await assertGroup(consoleHotelId);
  const ev = await getEventById(eventId);
  if (!ev || ev.hotelGroupId !== groupId) throw new Error('forbidden');
  await updateEvent(eventId, {
    categoryId: input.categoryId,
    locationId: input.locationId,
    name: input.name,
    description: input.description,
    coverUrl: input.coverUrl,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    capacity: input.capacity,
    status: input.status,
    options: input.options,
  });
  revalidatePath(`/h/${consoleHotelId}/events/list`);
  revalidatePath(`/h/${consoleHotelId}/events`);
  redirect(`/h/${consoleHotelId}/events/list`);
}
