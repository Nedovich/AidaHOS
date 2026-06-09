import { notFound } from 'next/navigation';
import { Calendar, Check, Cpu, CreditCard, Download, Link2, Shield } from 'lucide-react';
import { getHotelById, getSurveyById, type SurveyAccessControl } from '@aidahos/db';
import { getLang } from '@/lib/i18n-server';
import { L, type Lang } from '@/lib/i18n';
import { WizardSteps } from '@/components/console/wizard-steps';
import { QrSvg } from '@/components/console/survey-helpers';
import { SubmitButton } from '@/components/console/submit-button';
import { PublishToggle } from '@/components/console/publish-toggle';
import { surveyPublicUrl } from '@/lib/urls';
import { savePublishAction } from '../../../actions';

export default async function SurveyPublishPage({ params }: { params: Promise<{ hotelId: string; surveyId: string }> }) {
  const { hotelId, surveyId } = await params;
  const lang: Lang = await getLang();

  const [survey, hotel] = await Promise.all([getSurveyById(surveyId), getHotelById(hotelId)]);
  if (!survey) notFound();
  const ac = (survey.accessControl ?? {}) as SurveyAccessControl;
  const publicUrl = surveyPublicUrl(hotel?.slug ?? hotelId, survey.slug);
  const action = savePublishAction.bind(null, hotelId, surveyId);
  const isPublished = survey.status === 'published';

  return (
    <form id="publishForm" action={action}>
      <WizardSteps hotelId={hotelId} surveyId={surveyId} current="publish" lang={lang} />

      <div className="page-hero" style={{ alignItems: 'flex-start' }}>
        <div>
          <span className="stepbadge">{L(['ADIM 3 / 3', 'STEP 3 OF 3'], lang)}</span>
          <h1 className="page-hero__h">{L(['Yayınlama Ayarları', 'Publishing Settings'], lang)}</h1>
          <p className="page-hero__sub" style={{ maxWidth: 560 }}>{L([`Misafirlerin "${survey.name}" anketine nasıl erişeceğini ve etkileşime geçeceğini yapılandırın.`, `Configure how guests will access and interact with the "${survey.name}" survey.`], lang)}</p>
        </div>
        <PublishToggle published={isPublished} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
          <div className="card">
            <div className="card__head"><div className="card__title" style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Link2 size={17} />{L(['Herkese Açık Bağlantı', 'Public Link'], lang)}</div></div>
            <div className="card__body" style={{ paddingTop: 12 }}>
              <p className="card__sub" style={{ marginBottom: 14 }}>{L(['Bu bağlantıyı misafirlerle e-posta veya SMS kampanyalarıyla doğrudan paylaşın.', 'Share this link directly with guests via email or SMS campaigns.'], lang)}</p>
              <div className="linkbox">
                <span className="linkbox__url">{publicUrl}</span>
                <button className="linkbox__btn" type="button"><CreditCard size={14} /> {L(['Kopyala', 'Copy Link'], lang)}</button>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card__head"><div className="card__title" style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Cpu size={17} />{L(['QR Kodu', 'QR Code'], lang)}</div></div>
            <div className="card__body" style={{ paddingTop: 12, display: 'flex', gap: 18, alignItems: 'center' }}>
              <div className="qrbox"><QrSvg seed={survey.slug} /></div>
              <div style={{ flex: 1 }}>
                <p className="card__sub" style={{ marginBottom: 14 }}>{L(['Oda içi kartlar, resepsiyon veya makbuzlar gibi fiziksel materyallere yerleştirmek için QR kodunu indirin.', 'Download the QR code to place on physical collateral like in-room tents, front desk, or receipts.'], lang)}</p>
                <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                  <button className="btn btn--ghost btn--sm" type="button"><Download size={15} /> {L(['PNG İndir', 'Download PNG'], lang)}</button>
                  <button className="btn btn--ghost btn--sm" type="button"><Download size={15} /> {L(['SVG İndir', 'Download SVG'], lang)}</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <div className="card__title" style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Shield size={17} />{L(['Erişim Kontrolleri', 'Access Controls'], lang)}</div>
          </div>
          <div className="card__body" style={{ paddingTop: 14 }}>
            <div className="tcard">
              <div className="tcard__head">
                <div className="tcard__t">{L(['Misafir doğrulaması', 'Guest verification'], lang)}</div>
                <label className="switch"><input type="checkbox" name="guestVerification" defaultChecked={ac.guestVerification ?? false} /></label>
              </div>
              <div className="tcard__d">{L(['Misafirler bu ankete oda numarası ve doğum tarihiyle erişir.', 'Guests will access this survey using room number and birth date.'], lang)}</div>
            </div>
            <div className="tcard">
              <div className="tcard__head">
                <div className="tcard__t">{L(['Bu anketi otelin varsayılan anketi yap', 'Make this the hotel’s default survey'], lang)}</div>
                <label className="switch"><input type="checkbox" name="isAccountDefault" defaultChecked={survey.isDefault} /></label>
              </div>
              <div className="tcard__d">{L(['Etkinleştirilirse, misafir WiFi girişinden sonra (guest portal açılmadan önce) bu anket teklif edilir. Otel başına yalnızca bir varsayılan anket olabilir.', 'If enabled, this survey is offered right after guest WiFi login (before the guest portal). Only one default survey per hotel.'], lang)}</div>
            </div>
            <div className="tcard">
              <div className="tcard__head">
                <div><div className="tcard__t">{L(['Form Geçerlilik Tarihi', 'Form Expiration Date'], lang)}</div><div className="tcard__d" style={{ marginTop: 6 }}>{L(['Form bu tarihten sonra otomatik olarak pasifleşir.', 'The form will automatically become inactive after this date.'], lang)}</div></div>
              </div>
              <div className="dateinput" style={{ marginTop: 13, padding: 0 }}>
                <Calendar size={16} style={{ marginLeft: 12 }} />
                <input type="date" name="expiresAt" defaultValue={ac.expiresAt ?? ''} style={{ border: 'none', background: 'transparent', flex: 1, padding: '10px 12px', font: 'inherit', color: 'inherit' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 'var(--sp-6)' }}>
              <SubmitButton className="btn btn--primary"><Check size={16} /> {L(['Değişiklikleri Kaydet', 'Save Changes'], lang)}</SubmitButton>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
