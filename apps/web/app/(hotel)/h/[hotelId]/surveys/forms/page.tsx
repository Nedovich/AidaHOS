import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { getHotelById, listSurveys } from '@aidahos/db';
import { getLang } from '@/lib/i18n-server';
import { L } from '@/lib/i18n';
import { SurveySubnav } from '@/components/console/survey-subnav';
import {
  SurveysListClient,
  type SerializedSurvey,
} from '@/components/console/surveys/surveys-list-client';
import { setCheckoutSurveyAction } from '../actions';

const PALETTE = ['var(--accent)', 'var(--purple)', 'var(--success)', 'var(--info)', 'var(--warning)'];
function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length]!;
}

export default async function SurveyFormsPage({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const lang = await getLang();
  const base = `/h/${hotelId}/surveys`;

  const hotel = await getHotelById(hotelId);
  if (!hotel) redirect('/no-hotel');
  const forms = await listSurveys(hotel.hotelGroupId);

  const serialized: SerializedSurvey[] = forms.map((f) => ({
    id: f.id,
    name: f.name,
    description: f.description ?? null,
    status: f.status,
    isDefault: f.isDefault,
    isCheckout: f.isCheckout,
    responseCount: f.responseCount,
    createdAt: f.createdAt.toISOString(),
    color: colorFor(f.id),
  }));

  return (
    <>
      <div className="page-hero">
        <div>
          <h1 className="page-hero__h">{L(['Anket Formları', 'Survey Forms'], lang)}</h1>
          <p className="page-hero__sub">
            {L(['Misafir geri bildirim anketlerinizi oluşturun ve dağıtın.', 'Create and distribute your guest feedback surveys.'], lang)}
          </p>
        </div>
        <div className="page-hero__actions">
          <Link className="btn btn--primary" href={`${base}/new`}>
            <Plus size={16} />
            {L(['Yeni Anket Oluştur', 'Create New Survey'], lang)}
          </Link>
        </div>
      </div>

      <SurveySubnav hotelId={hotelId} active="forms" lang={lang} />

      <SurveysListClient
        surveys={serialized}
        lang={lang}
        hotelId={hotelId}
        base={base}
        onToggleCheckout={async (surveyId, makeCheckout) => {
          'use server';
          await setCheckoutSurveyAction(hotelId, surveyId, makeCheckout);
        }}
      />
    </>
  );
}
