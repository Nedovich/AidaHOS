import Link from 'next/link';
import { ClipboardList, MapPin, Shield, Sparkles, Star, type LucideIcon } from 'lucide-react';
import { getLang } from '@/lib/i18n-server';
import { L, type Lang } from '@/lib/i18n';
import { Subhero } from '@/components/console/survey-helpers';
import { SubmitButton } from '@/components/console/submit-button';
import { createSurveyAction } from '../actions';

type Pair = readonly [string, string];
type Template = {
  key: string;
  cat: Pair;
  name: Pair;
  icon: LucideIcon;
  color: string;
  bg: string;
  desc: Pair;
  cta?: Pair;
  primary?: boolean;
};

const TEMPLATES: Template[] = [
  { key: 'blank', cat: ['ÖZEL', 'CUSTOM'], name: ['Boş anket', 'Blank survey'], icon: Sparkles, color: 'var(--text-2)', bg: 'var(--surface-3)', desc: ['Boş bir sayfayla sıfırdan başlayın ve kendi akışınızı kurun.', 'Start from scratch with an empty page and build your own flow.'], cta: ['Boş Başla', 'Start blank'], primary: true },
  { key: 'checkout', cat: ['MİSAFİR YOLCULUĞU', 'GUEST JOURNEY'], name: ['Check-out geri bildirimi', 'Check-out feedback'], icon: ClipboardList, color: 'var(--accent)', bg: 'var(--accent-soft)', desc: ['Genel konaklama, kahvaltı ve yorumları kapsayan klasik konaklama sonrası anket.', 'A classic post-stay survey covering overall stay, breakfast, and comments.'] },
  { key: 'in-stay', cat: ['OPERASYON', 'OPERATIONS'], name: ['Konaklama içi kurtarma', 'In-stay recovery'], icon: Shield, color: 'var(--info)', bg: 'var(--info-soft)', desc: ['Konaklama sırasında sorunları toplayın, ekipler ayrılıştan önce çözsün.', 'Collect issues during the stay so teams can resolve problems before departure.'] },
  { key: 'restaurant', cat: ['YİYECEK & İÇECEK', 'F&B'], name: ['Restoran deneyimi', 'Restaurant experience'], icon: MapPin, color: 'var(--warning)', bg: 'var(--warning-soft)', desc: ['Yemek kalitesi, servis hızı ve öğüne özel memnuniyeti ölçün.', 'Measure food quality, service speed, and meal-specific satisfaction.'] },
  { key: 'spa', cat: ['WELLNESS', 'WELLNESS'], name: ['SPA & wellness', 'Spa & wellness'], icon: MapPin, color: 'var(--success)', bg: 'var(--success-soft)', desc: ['Wellness misafirlerinden tedavi, tesis ve hizmet geri bildirimi toplayın.', 'Gather treatment, facility, and service feedback from wellness guests.'] },
  { key: 'nps', cat: ['NABIZ', 'PULSE'], name: ['Hızlı NPS', 'Quick NPS'], icon: Star, color: 'var(--purple)', bg: 'var(--purple-soft)', desc: ['QR temas noktaları ve hızlı takipler için hafif bir tavsiye anketi.', 'A lightweight recommendation survey for QR touchpoints and quick follow-ups.'] },
];

export default async function SurveyCreatePage({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const lang: Lang = await getLang();
  const base = `/h/${hotelId}/surveys`;

  return (
    <>
      <Subhero
        backHref={`${base}/forms`}
        crumb={<Link href={`${base}/forms`} style={{ color: 'inherit' }}>{L(['Formlar', 'Forms'], lang)}</Link>}
        title={L(['Yeni anket oluştur', 'Create a new survey'], lang)}
        sub={L(['Kanıtlanmış bir konaklama şablonuyla başlayın ya da boş tuval seçin. Her yeni form İngilizce başlar; diğer dilleri ve tema ayarlarını SurveyJS oluşturucusunda ekleyebilirsiniz.', 'Start with a proven hospitality template or choose a blank canvas. Each new form begins in English, then you can add other languages and theme settings in the SurveyJS builder.'], lang)}
      />

      <div className="tmpl-grid">
        {TEMPLATES.map((t) => {
          const Icon = t.icon;
          return (
            <form className="tmpl" key={t.key} action={createSurveyAction.bind(null, hotelId, t.key)}>
              <div className="tmpl__top">
                <div className="tmpl__ico" style={{ background: t.bg, color: t.color }}><Icon size={23} /></div>
                <div>
                  <div className="tmpl__cat">{L(t.cat, lang)}</div>
                  <div className="tmpl__name">{L(t.name, lang)}</div>
                </div>
              </div>
              <div className="tmpl__desc">{L(t.desc, lang)}</div>
              <SubmitButton className={`btn ${t.primary ? 'btn--primary' : 'btn--ghost'}`}>
                {L(t.cta ?? ['Şablonu Kullan', 'Use template'], lang)}
              </SubmitButton>
            </form>
          );
        })}
      </div>
    </>
  );
}
