'use server';

import { cookies } from 'next/headers';
import { createSurveyResponse, findHotelBySlug, getSurveyById, getSurveyBySlug } from '@aidahos/db';
import { verifyGuest } from '@/lib/verify';

const DOB = /^\d{8}$/; // DDMMYYYY
const cookieName = (surveyId: string) => `aida_survey_v_${surveyId}`;

type VerifiedGuest = { hotelId: string; roomNo: string; guestName: string | null };

export type VerifyResult = { ok: true; guestName: string | null } | { ok: false };

/**
 * Gate verification for a guest-verified survey: room-no + birth-date against the
 * hotel (DEV: hotel_simulation). On success, stash the verified identity in an
 * httpOnly cookie so the submit action can trust it (the client never supplies it).
 */
export async function verifyGuestForSurvey(
  surveySlug: string,
  hotelSlug: string,
  room: string,
  dob: string,
): Promise<VerifyResult> {
  const roomNo = room.trim();
  const birthDate = dob.replace(/\D/g, '');
  if (roomNo.length < 1 || !DOB.test(birthDate)) return { ok: false };

  const [survey, hotel] = await Promise.all([getSurveyBySlug(surveySlug), findHotelBySlug(hotelSlug)]);
  if (!survey || survey.status !== 'published' || !hotel || survey.hotelId !== hotel.id) return { ok: false };

  const res = await verifyGuest(hotel.id, roomNo, birthDate);
  if (!res.ok) return { ok: false };

  const jar = await cookies();
  const verified: VerifiedGuest = { hotelId: hotel.id, roomNo, guestName: res.guest.guestName };
  jar.set(cookieName(survey.id), JSON.stringify(verified), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // 1h to complete the survey
  });
  return { ok: true, guestName: res.guest.guestName };
}

type SurveyQuestion = { type?: string; name?: string; rateMax?: number };

/** Derive a 0–5 overall score from the first rating question, if any. */
function deriveScore(json: unknown, data: Record<string, unknown>): number | null {
  const j = json as { pages?: { elements?: SurveyQuestion[] }[]; elements?: SurveyQuestion[] } | null;
  const qs = j?.pages ? j.pages.flatMap((p) => p.elements ?? []) : (j?.elements ?? []);
  const rating = qs.find((q) => q.type === 'rating' && q.name && data[q.name] != null);
  if (!rating || !rating.name) return null;
  const v = Number(data[rating.name]);
  if (Number.isNaN(v)) return null;
  const max = rating.rateMax ?? 5;
  const score = max > 5 ? (v / max) * 5 : v;
  return Math.round(score * 10) / 10;
}

export type SubmitResult = { ok: true } | { ok: false; error: 'not_found' | 'verify' };

/** Persist a completed SurveyJS response. Guest identity is read server-side from the verify cookie. */
export async function submitSurveyResponse(
  surveyId: string,
  data: Record<string, unknown>,
  device?: string,
): Promise<SubmitResult> {
  const survey = await getSurveyById(surveyId);
  if (!survey || survey.status !== 'published') return { ok: false, error: 'not_found' };

  const ac = (survey.accessControl ?? {}) as { guestVerification?: boolean };
  let verified: VerifiedGuest | null = null;
  if (ac.guestVerification) {
    const jar = await cookies();
    const raw = jar.get(cookieName(surveyId))?.value;
    if (!raw) return { ok: false, error: 'verify' };
    try {
      verified = JSON.parse(raw) as VerifiedGuest;
    } catch {
      return { ok: false, error: 'verify' };
    }
  }

  await createSurveyResponse({
    surveyId,
    hotelGroupId: survey.hotelGroupId,
    // Responses always belong to the survey's single assigned hotel.
    hotelId: survey.hotelId ?? verified?.hotelId ?? null,
    roomNo: verified?.roomNo ?? null,
    guestName: verified?.guestName ?? null,
    data,
    score: deriveScore(survey.json, data),
    source: 'Public link',
    device: device ?? null,
    authMethod: ac.guestVerification ? 'Room Number + Surname' : null,
  });

  if (verified) {
    const jar = await cookies();
    jar.delete(cookieName(surveyId));
  }
  return { ok: true };
}
