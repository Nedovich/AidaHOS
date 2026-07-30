import { redirect } from 'next/navigation';
import { getHotelById, getPopupAutomations, listGuestPopupSends } from '@aidahos/db';
import { getLang } from '@/lib/i18n-server';
import { GuestPopupSendsClient, type SerializedPopupSend } from '@/components/console/guests/guest-popup-sends-client';
import { SurveySubnav } from '@/components/console/survey-subnav';
import { togglePopupAutomationStatusAction, deletePopupAutomationAction } from './automations/actions';

function avatarColor(seed: string): string {
  const COLORS = ['#0E7490', '#7C5CE0', '#0E9F6E', '#B8740A', '#2563C9', '#D5485A'];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length]!;
}

function initials(first: string | null, last: string | null): string {
  const f = (first ?? '').trim()[0] ?? '';
  const l = (last ?? '').trim()[0] ?? '';
  return (f + l).toUpperCase() || '?';
}

export default async function SurveySendsPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const [{ hotelId }, lang] = await Promise.all([params, getLang()]);

  const hotel = await getHotelById(hotelId);
  if (!hotel) redirect('/no-hotel');

  const [sends, automations] = await Promise.all([
    listGuestPopupSends(hotelId),
    getPopupAutomations(hotelId),
  ]);

  const records: SerializedPopupSend[] = sends.map((s) => {
    const name = [s.firstName, s.lastName].filter(Boolean).join(' ') || `Oda ${s.roomNo}`;
    const localized = s.content?.[lang] ?? s.content?.en ?? s.content?.tr ?? null;
    return {
      id: s.id,
      guest: {
        id: s.guestStayId,
        name,
        initials: initials(s.firstName, s.lastName),
        color: avatarColor(s.guestStayId),
        room: s.roomNo,
        hotel: hotel.name,
        email: s.email ?? null,
        phone: s.phone ?? null,
      },
      popupType: s.popupType,
      popupTitle: localized?.title ?? null,
      triggerAt: s.triggerAt.toISOString(),
      shownAt: s.shownAt ? s.shownAt.toISOString() : null,
      status: s.shownAt ? 'sent' : 'scheduled',
    };
  });

  const basePath = `/h/${hotelId}/surveys/sends`;

  return (
    <GuestPopupSendsClient
      hotelId={hotelId}
      lang={lang}
      records={records}
      automations={automations.map((a) => ({ id: a.id, kind: a.kind, timing: a.timing, status: a.status }))}
      basePath={basePath}
      subnav={<SurveySubnav hotelId={hotelId} active="sends" lang={lang} />}
      onToggleAutomation={async (id) => {
        'use server';
        return togglePopupAutomationStatusAction(hotelId, id);
      }}
      onDeleteAutomation={async (id) => {
        'use server';
        return deletePopupAutomationAction(hotelId, id);
      }}
    />
  );
}
