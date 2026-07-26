'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createSurvey,
  deleteSurvey,
  getResponseById,
  getSurveyById,
  setCheckoutSurvey,
  setDefaultSurvey,
  setSurveyStatus,
  surveyNameExists,
  updateResponseInternal,
  updateSurvey,
  type ResponseStatus,
  type SurveyNote,
  type SurveyStatus,
} from '@aidahos/db';
import { canAccessHotel, getSession } from '@/lib/auth';
import { getHotelById, getHotelsForGroup } from '@aidahos/db';

/** Resolve the console hotel → its group, and assert the signed-in user may manage it. */
async function assertGroup(consoleHotelId: string): Promise<{ groupId: string; userName: string }> {
  const session = await getSession();
  if (!session || session.user.role === 'super_admin' || session.user.role === 'customer') throw new Error('forbidden');
  const hotel = await getHotelById(consoleHotelId);
  if (!hotel) throw new Error('not-found');
  if (!(await canAccessHotel(hotel.id, hotel.hotelGroupId))) throw new Error('forbidden');
  return { groupId: hotel.hotelGroupId, userName: session.user.name ?? session.user.email ?? 'Operatör' };
}

/* ---- starter SurveyJS models per template ---- */
function starterJson(template: string): { json: object; name: string; description: string } {
  const q = (name: string, title: string, extra: object = {}) => ({ type: 'rating', name, title, rateMax: 5, ...extra });
  switch (template) {
    case 'checkout':
      return {
        name: 'Check-out Feedback',
        description: 'Standard end-of-stay survey',
        json: {
          title: 'Check-out Feedback',
          pages: [{ name: 'page1', elements: [q('overall', 'How would you rate your overall experience with us?', { isRequired: true }), { type: 'comment', name: 'comments', title: 'Any additional comments or suggestions?' }] }],
        },
      };
    case 'in-stay':
      return { name: 'In-stay Recovery', description: 'Collect issues during the stay', json: { title: 'In-stay Recovery', pages: [{ name: 'page1', elements: [q('satisfaction', 'How is your stay so far?')] }] } };
    case 'restaurant':
      return { name: 'Restaurant Experience', description: 'Dining satisfaction', json: { title: 'Restaurant Experience', pages: [{ name: 'page1', elements: [q('food', 'How was the food?'), q('service', 'How was the service?')] }] } };
    case 'spa':
      return { name: 'Spa & Wellness', description: 'Wellness feedback', json: { title: 'Spa & Wellness', pages: [{ name: 'page1', elements: [q('treatment', 'How was your treatment?')] }] } };
    case 'nps':
      return { name: 'Quick NPS', description: 'Lightweight recommendation survey', json: { title: 'Quick NPS', pages: [{ name: 'page1', elements: [{ type: 'rating', name: 'nps', title: 'How likely are you to recommend us?', rateMax: 10 }] }] } };
    default:
      return { name: 'Untitled Survey', description: 'New guest feedback form', json: { title: 'Untitled Survey', pages: [{ name: 'page1', elements: [] }] } };
  }
}

export async function createSurveyAction(consoleHotelId: string, template: string) {
  const { groupId, userName } = await assertGroup(consoleHotelId);
  const s = starterJson(template);
  // New surveys are assigned to the hotel whose console created them; changeable in step 1.
  const survey = await createSurvey({
    hotelGroupId: groupId,
    hotelId: consoleHotelId,
    name: s.name,
    description: s.description,
    json: s.json,
    createdBy: userName,
  });
  revalidatePath(`/h/${consoleHotelId}/surveys/forms`);
  redirect(`/h/${consoleHotelId}/surveys/${survey.id}/edit/settings`);
}

async function assertSurveyInGroup(consoleHotelId: string, surveyId: string) {
  const { groupId, userName } = await assertGroup(consoleHotelId);
  const survey = await getSurveyById(surveyId);
  if (!survey || survey.hotelGroupId !== groupId) throw new Error('forbidden');
  return { survey, groupId, userName };
}

export async function updateSurveyAction(consoleHotelId: string, surveyId: string, formData: FormData) {
  const { groupId } = await assertSurveyInGroup(consoleHotelId, surveyId);
  // The assigned hotel must belong to this group (defence against tampering).
  const groupHotelIds = new Set((await getHotelsForGroup(groupId)).map((h) => h.id));
  const rawHotelId = String(formData.get('hotelId') ?? '');
  const hotelId = groupHotelIds.has(rawHotelId) ? rawHotelId : undefined;
  // Survey names are unique within the group — reject a rename that collides.
  const name = String(formData.get('name') ?? '').trim();
  if (name && (await surveyNameExists(groupId, name, surveyId))) {
    const next = formData.get('_next') === 'builder' ? '&_next=builder' : '';
    redirect(`/h/${consoleHotelId}/surveys/${surveyId}/edit/settings?err=name${next}`);
  }
  await updateSurvey(surveyId, {
    name: name || undefined,
    description: (formData.get('description') as string) ?? undefined,
    defaultLocale: (formData.get('defaultLocale') as string) || undefined,
    status: (formData.get('status') as SurveyStatus) || undefined,
    thankYouTitle: (formData.get('thankYouTitle') as string) ?? undefined,
    thankYouDescription: (formData.get('thankYouDescription') as string) ?? undefined,
    hotelId,
  });
  revalidatePath(`/h/${consoleHotelId}/surveys/${surveyId}/edit/settings`);
  if (formData.get('_next') === 'builder') redirect(`/h/${consoleHotelId}/surveys/${surveyId}/edit/builder`);
}

/** Called directly by the SurveyJS Creator save handler (client). */
export async function saveSurveyJsonAction(consoleHotelId: string, surveyId: string, json: unknown) {
  await assertSurveyInGroup(consoleHotelId, surveyId);
  await updateSurvey(surveyId, { json });
  revalidatePath(`/h/${consoleHotelId}/surveys/${surveyId}/edit/builder`);
  return { ok: true };
}

export async function deleteSurveyAction(consoleHotelId: string, surveyId: string) {
  await assertSurveyInGroup(consoleHotelId, surveyId);
  await deleteSurvey(surveyId);
  revalidatePath(`/h/${consoleHotelId}/surveys/forms`);
  redirect(`/h/${consoleHotelId}/surveys/forms`);
}

/**
 * Step-3 form. Always persists the access controls. The publish *status* only changes
 * when a `_publish` flag is present (set by the Publish/Unpublish confirm button) — so
 * "Save Changes" never (un)publishes by accident.
 */
export async function savePublishAction(consoleHotelId: string, surveyId: string, formData: FormData) {
  const { survey } = await assertSurveyInGroup(consoleHotelId, surveyId);
  const makeDefault = formData.get('isAccountDefault') === 'on';
  await updateSurvey(surveyId, {
    accessControl: {
      guestVerification: formData.get('guestVerification') === 'on',
      isAccountDefault: makeDefault,
      expiresAt: (formData.get('expiresAt') as string) || null,
    },
  });
  // The default survey is shown after captive-WiFi login — at most one per hotel.
  if (survey.hotelId) await setDefaultSurvey(survey.hotelId, surveyId, makeDefault);

  const flag = formData.get('_publish');
  if (flag === 'publish' || flag === 'unpublish') {
    await setSurveyStatus(surveyId, flag === 'publish' ? 'published' : 'draft');
    revalidatePath(`/h/${consoleHotelId}/surveys/${surveyId}`);
    redirect(`/h/${consoleHotelId}/surveys/${surveyId}`);
  }
  // Plain "Save Changes": persist settings, stay on the publish step.
  revalidatePath(`/h/${consoleHotelId}/surveys/${surveyId}/edit/publish`);
}

export async function setDefaultSurveyAction(consoleHotelId: string, surveyId: string, makeDefault: boolean) {
  const { survey } = await assertSurveyInGroup(consoleHotelId, surveyId);
  if (survey.hotelId) await setDefaultSurvey(survey.hotelId, surveyId, makeDefault);
  revalidatePath(`/h/${consoleHotelId}/surveys/forms`);
}

export async function setCheckoutSurveyAction(consoleHotelId: string, surveyId: string, makeCheckout: boolean) {
  const { groupId } = await assertSurveyInGroup(consoleHotelId, surveyId);
  await setCheckoutSurvey(groupId, surveyId, makeCheckout);
  revalidatePath(`/h/${consoleHotelId}/surveys/forms`);
}

export async function updateResponseInternalAction(consoleHotelId: string, respId: string, formData: FormData) {
  const { groupId, userName } = await assertGroup(consoleHotelId);
  const resp = await getResponseById(respId);
  if (!resp || resp.hotelGroupId !== groupId) throw new Error('forbidden');

  const notes = Array.isArray(resp.internalNotes) ? [...(resp.internalNotes as SurveyNote[])] : [];
  const newNote = String(formData.get('newNote') ?? '').trim();
  if (newNote) {
    notes.push({
      who: userName,
      when: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date()),
      body: newNote,
    });
  }
  await updateResponseInternal(respId, {
    status: (formData.get('status') as ResponseStatus) || undefined,
    assigneeName: ((formData.get('assigneeName') as string) ?? '').trim() || null,
    internalNotes: notes,
  });
  revalidatePath(`/h/${consoleHotelId}/surveys/responses/${respId}`);
}
