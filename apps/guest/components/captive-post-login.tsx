import type { SurveyOffer } from '@/lib/survey-types';

type Lang = 'en' | 'tr';
const T = (tr: string, en: string, lang: Lang) => (lang === 'tr' ? tr : en);

/**
 * Lightweight post-login screen shown INSIDE the captive mini-browser (CNA) on the
 * `?connected=1` return. The CNA cannot run the full portal SPA (SurveyJS + Home), so we
 * keep this page minimal: confirm connectivity + point the guest to the survey/portal,
 * which they open in their real browser (now that internet is granted). Server component,
 * no heavy client imports.
 */
export function CaptivePostLogin({
  hotelName,
  hotelSlug,
  guestName,
  surveyOffer,
  lang = 'en',
}: {
  hotelName: string | null;
  hotelSlug: string;
  guestName: string | null;
  surveyOffer: SurveyOffer | null;
  lang?: Lang;
}) {
  const mono = (hotelName ?? 'AIDA')
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const surveyUrl = surveyOffer ? `/s/${hotelSlug}/${surveyOffer.slug}` : null;

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg, #f6f1e7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#2a2622' }}>
      <div style={{ width: 84, height: 84, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--brand-primary, #a4663f)', color: '#fff', fontSize: 30, fontWeight: 700, marginBottom: 20, fontFamily: 'Georgia, serif' }}>
        {mono}
      </div>

      <div style={{ fontSize: 15, color: '#1c7a4a', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 6 }}>
        ✓ {T('Bağlandınız', 'Connected', lang)}
      </div>
      <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 600, fontFamily: 'Georgia, serif' }}>
        {guestName ? T(`Hoş geldiniz, ${guestName}`, `Welcome, ${guestName}`, lang) : T('Hoş geldiniz', 'Welcome', lang)}
      </h1>
      <p style={{ margin: '0 0 28px', fontSize: 15, color: '#6b635a', maxWidth: 340, lineHeight: 1.5 }}>
        {T(
          `İnternet erişiminiz açıldı. ${hotelName ?? ''} portalını ve hizmetleri tarayıcınızdan keşfedebilirsiniz.`,
          `You're online. Explore the ${hotelName ?? 'hotel'} portal and services from your browser.`,
          lang,
        )}
      </p>

      {surveyUrl ? (
        <a
          href={surveyUrl}
          style={{ display: 'block', width: '100%', maxWidth: 360, padding: '15px 18px', borderRadius: 14, background: 'var(--brand-primary, #a4663f)', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', marginBottom: 12 }}
        >
          {T('Kısa anketimize katılın →', 'Take our quick survey →', lang)}
        </a>
      ) : null}

      <a
        href={`/${hotelSlug}`}
        style={{ display: 'block', width: '100%', maxWidth: 360, padding: '15px 18px', borderRadius: 14, background: 'transparent', color: 'var(--brand-primary, #a4663f)', border: '1.5px solid var(--brand-primary, #a4663f)', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
      >
        {T('Otel portalını aç →', 'Open hotel portal →', lang)}
      </a>

      <p style={{ marginTop: 22, fontSize: 12.5, color: '#9a9088', maxWidth: 320, lineHeight: 1.5 }}>
        {T(
          'İpucu: En iyi deneyim için bu pencereyi kapatıp tarayıcınızdan ',
          'Tip: For the best experience, close this window and open ',
          lang,
        )}
        <b>aidaguest.kreatinmedya.com/{hotelSlug}</b>
        {T(' adresini açın.', ' in your browser.', lang)}
      </p>
    </main>
  );
}
