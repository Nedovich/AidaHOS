import { notFound } from 'next/navigation';
import { ChevronRight, Download, Globe } from 'lucide-react';
import { getHotelsForGroup, getSurveyById } from '@aidahos/db';
import { getLang } from '@/lib/i18n-server';
import { L, type Lang } from '@/lib/i18n';
import { WizardSteps } from '@/components/console/wizard-steps';
import { SubmitButton } from '@/components/console/submit-button';
import { updateSurveyAction } from '../../../actions';

export default async function SurveySettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ hotelId: string; surveyId: string }>;
  searchParams: Promise<{ err?: string }>;
}) {
  const { hotelId, surveyId } = await params;
  const { err } = await searchParams;
  const lang: Lang = await getLang();

  const survey = await getSurveyById(surveyId);
  if (!survey) notFound();
  const groupHotels = await getHotelsForGroup(survey.hotelGroupId);
  const action = updateSurveyAction.bind(null, hotelId, surveyId);
  const nameError = err === 'name';

  return (
    <form action={action}>
      <WizardSteps hotelId={hotelId} surveyId={surveyId} current="settings" lang={lang} />

      <div className="page-hero" style={{ alignItems: 'flex-start' }}>
        <div>
          <span className="stepbadge">{L(['ADIM 1 / 3', 'STEP 1 OF 3'], lang)}</span>
          <h1 className="page-hero__h">{L(['Form ayarları', 'Form settings'], lang)}</h1>
          <p className="page-hero__sub" style={{ maxWidth: 560 }}>{L(['Önce anket kimliğini burada tanımlayın. Bir sonraki adımda yalnızca soruları ve mantığı oluşturmaya odaklanacağız.', 'Define the survey identity here first. In the next step, we will focus only on building questions and logic.'], lang)}</p>
        </div>
        <SubmitButton className="btn btn--primary" name="_next" value="builder">{L(['Oluşturucuya Devam Et', 'Continue to builder'], lang)} <ChevronRight size={16} /></SubmitButton>
      </div>

      <div className="infobar">
        <span className="infobar__ico"><Globe size={18} /></span>
        <div className="infobar__t">
          {L(['Bir anket artık birden fazla dil içerebilir. Temel dili burada seçin, ardından İngilizce, Almanca, Rusça ve diğer kopyalar için ', 'One survey can now hold multiple languages. Choose the base locale here, then use '], lang)}
          <b>{L(['Oluşturucu › Çeviri', 'Builder › Translation'], lang)}</b>
          {L([' sekmesini kullanın. ', ' for English, German, Russian, and other copies. '], lang)}
          <b>{L(['Oluşturucu › Tema', 'Builder › Theme'], lang)}</b>
          {L([' aynı formu tüm diller için tek seferde biçimlendirir.', ' styles the same form once for all languages.'], lang)}
        </div>
      </div>

      <div className="card">
        <div className="card__body" style={{ padding: 'var(--sp-6)' }}>
          <div className="fgrid">
            <div>
              <label className="flabel">{L(['Form adı', 'Form name'], lang)}</label>
              <input
                className="finput"
                name="name"
                defaultValue={survey.name}
                required
                style={nameError ? { borderColor: 'var(--danger)' } : undefined}
              />
              {nameError ? (
                <div style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)', marginTop: 6 }}>
                  {L(['Bu isimde bir anket zaten var. Lütfen farklı bir isim girin.', 'A survey with this name already exists. Please choose a different name.'], lang)}
                </div>
              ) : null}
              <div style={{ marginTop: 'var(--sp-6)' }}>
                <label className="flabel">{L(['Açıklama', 'Description'], lang)}</label>
                <textarea className="ftextarea" name="description" style={{ minHeight: 140 }} defaultValue={survey.description ?? ''} />
              </div>
              <div style={{ marginTop: 'var(--sp-5)' }}>
                <label className="flabel">{L(['Atanan Otel', 'Assigned Hotel'], lang)}</label>
                <select className="finput" name="hotelId" defaultValue={survey.hotelId ?? hotelId} style={{ height: 44 }} required>
                  {groupHotels.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
                <div className="cell-sub" style={{ marginTop: 8 }}>
                  {L(['Anket tek bir otele atanır; yanıtlar bu otele göre filtrelenir.', 'A survey is assigned to a single hotel; responses are filtered by that hotel.'], lang)}
                </div>
              </div>
            </div>
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-5)' }}>
                <div>
                  <label className="flabel">{L(['Varsayılan dil', 'Default locale'], lang)}</label>
                  <select className="finput" name="defaultLocale" defaultValue={survey.defaultLocale} style={{ height: 44 }}>
                    <option value="en">EN · {L(['İngilizce', 'English'], lang)}</option>
                    <option value="tr">TR · {L(['Türkçe', 'Turkish'], lang)}</option>
                    <option value="de">DE · {L(['Almanca', 'German'], lang)}</option>
                    <option value="ru">RU · {L(['Rusça', 'Russian'], lang)}</option>
                  </select>
                </div>
                <div>
                  <label className="flabel">{L(['Durum', 'Status'], lang)}</label>
                  <select className="finput" name="status" defaultValue={survey.status} style={{ height: 44 }}>
                    <option value="draft">{L(['Taslak', 'Draft'], lang)}</option>
                    <option value="published">{L(['Yayında', 'Published'], lang)}</option>
                    <option value="paused">{L(['Duraklatıldı', 'Paused'], lang)}</option>
                    <option value="archived">{L(['Arşiv', 'Archived'], lang)}</option>
                  </select>
                </div>
              </div>
              <div className="card" style={{ background: 'var(--surface-2)', marginTop: 'var(--sp-5)', boxShadow: 'none' }}>
                <div className="card__body" style={{ padding: 'var(--sp-4) var(--sp-5)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>{L(['Önerilen yerelleştirme akışı', 'Recommended localization flow'], lang)}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', lineHeight: 1.55 }}>{L(['Varsayılan dili bir kez ayarlayın, ardından formu Oluşturucu\'da aynı tutun. Çevrilmiş başlık, soru, seçenek ve teşekkür içeriklerini yinelenen formlar oluşturmak yerine Çeviri sekmesine ekleyin.', 'Set the default language once, then keep the same form in Builder. Add translated titles, questions, choices, and thank-you content inside the Translation tab instead of creating duplicate forms.'], lang)}</div>
                </div>
              </div>
              <div style={{ marginTop: 'var(--sp-5)' }}>
                <label className="flabel">{L(['Teşekkür başlığı', 'Thank-you title'], lang)}</label>
                <input className="finput" name="thankYouTitle" defaultValue={survey.thankYouTitle ?? ''} placeholder={L(['Teşekkürler', 'Thank you'], lang)} />
              </div>
              <div style={{ marginTop: 'var(--sp-5)' }}>
                <label className="flabel">{L(['Teşekkür açıklaması', 'Thank-you description'], lang)}</label>
                <textarea className="ftextarea" name="thankYouDescription" defaultValue={survey.thankYouDescription ?? ''} placeholder={L(['Geri bildiriminiz kaydedildi.', 'Your feedback has been recorded.'], lang)} />
              </div>
            </div>
          </div>
          <div className="wfooter">
            <div className="wfooter__note">{L(['İlerlemenizi istediğiniz zaman kaydedin, sorular, çeviriler ve tema için hazır olduğunuzda Oluşturucu\'ya geçin.', 'Save your progress anytime, then move to Builder when you are ready for questions, translations, and theme.'], lang)}</div>
            <SubmitButton className="btn btn--ghost"><Download size={16} /> {L(['Değişiklikleri Kaydet', 'Save changes'], lang)}</SubmitButton>
          </div>
        </div>
      </div>
    </form>
  );
}
