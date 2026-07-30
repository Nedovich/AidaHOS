'use server';

import { revalidatePath } from 'next/cache';
import {
  getHotelById,
  getPopupAutomations,
  upsertPopupAutomation,
  setPopupAutomationStatus,
  deletePopupAutomation,
  applyCheckoutAutomationToActiveStays,
  setDefaultSurvey,
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

/**
 * Create or update the automation slot for (hotelId, kind).
 * - 'checkout' kind: batch-scans and retroactively updates every in-house guest's
 *   guest_popup_sends row IF the resulting status is 'active'. Skipped while paused.
 * - 'default' kind: also calls setDefaultSurvey to keep surveys.isDefault in sync.
 */
export async function upsertPopupAutomationAction(
  hotelId: string,
  input: {
    kind: 'checkout' | 'default';
    timing: 'd3' | 'd2' | 'd1' | 'd0' | 'every';
    surveyId: string | null;
    content: PopupContentMap;
    status: 'active' | 'paused';
  },
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertHotelAccess(hotelId);
    const row = await upsertPopupAutomation({ hotelId, ...input });

    if (input.kind === 'default' && input.surveyId) {
      await setDefaultSurvey(hotelId, input.surveyId, true);
    }

    // Batch-scan on create-while-active or any edit that leaves status active.
    // NOT on active->paused — existing scheduled rows are left alone.
    if (input.kind === 'checkout' && row.status === 'active') {
      await applyCheckoutAutomationToActiveStays(row);
    }

    revalidatePath(`/h/${hotelId}/surveys/sends`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'error' };
  }
}

/**
 * Toggle active/paused. Re-triggers the batch-scan only on paused->active for
 * 'checkout'. For 'default', keeps surveys.isDefault in sync with the automation's
 * status in both directions (pause clears it, reactivate restores it).
 */
export async function togglePopupAutomationStatusAction(
  hotelId: string,
  automationId: string,
): Promise<{ ok: boolean }> {
  try {
    await assertHotelAccess(hotelId);
    const rows = await getPopupAutomations(hotelId);
    const automation = rows.find((a) => a.id === automationId);
    if (!automation) return { ok: false };
    const next = automation.status === 'active' ? 'paused' : 'active';

    // Keep surveys.isDefault in sync with the automation's status. Clear/restore
    // BEFORE flipping popup_automations.status, so a failure here leaves the
    // automation row's status unchanged (still matching isDefault) rather than
    // flipped while isDefault is stale.
    if (automation.kind === 'default' && automation.surveyId) {
      await setDefaultSurvey(hotelId, automation.surveyId, next === 'active');
    }

    await setPopupAutomationStatus(automationId, next);

    if (automation.kind === 'checkout' && next === 'active') {
      await applyCheckoutAutomationToActiveStays({ ...automation, status: 'active' });
    }
    revalidatePath(`/h/${hotelId}/surveys/sends`);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Delete an automation slot. For 'default', clears surveys.isDefault first so the survey stops being offered. */
export async function deletePopupAutomationAction(
  hotelId: string,
  automationId: string,
): Promise<{ ok: boolean }> {
  try {
    await assertHotelAccess(hotelId);
    const rows = await getPopupAutomations(hotelId);
    const automation = rows.find((a) => a.id === automationId);

    if (automation?.kind === 'default' && automation.surveyId) {
      await setDefaultSurvey(hotelId, automation.surveyId, false);
    }

    await deletePopupAutomation(automationId);
    revalidatePath(`/h/${hotelId}/surveys/sends`);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
