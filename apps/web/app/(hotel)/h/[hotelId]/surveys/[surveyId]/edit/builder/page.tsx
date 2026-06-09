import { notFound } from 'next/navigation';
import { Cpu, Shield } from 'lucide-react';
import { getSurveyById } from '@aidahos/db';
import { getLang } from '@/lib/i18n-server';
import { L, type Lang } from '@/lib/i18n';
import { WizardSteps } from '@/components/console/wizard-steps';
import { SurveyBuilderClient } from '@/components/console/survey-builder-client';
import { BuilderNextButton } from '@/components/console/builder-next-button';

export default async function SurveyBuilderPage({ params }: { params: Promise<{ hotelId: string; surveyId: string }> }) {
  const { hotelId, surveyId } = await params;
  const lang: Lang = await getLang();
  const base = `/h/${hotelId}/surveys`;

  const survey = await getSurveyById(surveyId);
  if (!survey) notFound();

  return (
    <>
      <WizardSteps hotelId={hotelId} surveyId={surveyId} current="builder" lang={lang} />

      <div className="page-hero" style={{ alignItems: 'flex-start' }}>
        <div>
          <span className="stepbadge">{L(['ADIM 2 / 3', 'STEP 2 OF 3'], lang)}</span>
          <h1 className="page-hero__h">{L(['Anket Oluşturucu', 'Survey Builder'], lang)}</h1>
          <p className="page-hero__sub">{L(['Soruları sürükleyip bırakın, mantık ve çeviri ekleyin. “Sonraki Adım” değişikliklerinizi otomatik kaydeder.', 'Drag and drop questions, add logic and translations. “Next step” saves your changes automatically.'], lang)}</p>
        </div>
        <BuilderNextButton hotelId={hotelId} surveyId={surveyId} nextHref={`${base}/${surveyId}/edit/publish`} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--sp-4)', flexWrap: 'wrap' }}>
        <span className="badge badge--mute"><Cpu size={12} /> {L(['Gömülü SurveyJS Creator', 'Embedded SurveyJS Creator'], lang)}</span>
        <span className="cell-sub">{L(['Bu alan üçüncü taraf kütüphane tarafından oluşturulur — AIDA teması yalnızca çevreleyen arayüze uygulanır.', 'This area is rendered by the third-party library — the AIDA theme applies to the surrounding chrome only.'], lang)}</span>
      </div>

      <div className="sjs" style={{ overflow: 'hidden' }}>
        <SurveyBuilderClient hotelId={hotelId} surveyId={surveyId} json={survey.json} />
        <div className="sjs__license"><Shield size={15} /> {L(['SurveyJS Creator kütüphanesini kullanmak için geliştirici lisansı gereklidir.', 'To use the Survey Creator library in your application, a developer license is required.'], lang)}</div>
      </div>
    </>
  );
}
