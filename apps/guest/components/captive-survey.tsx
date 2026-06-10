'use client';

import { useEffect, useMemo, useState } from 'react';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import 'survey-core/survey-core.css';
import { submitCaptiveSurvey } from '@/app/[hotelSlug]/actions';
import { L, useLang } from '@/lib/i18n';
import { Icon } from '@/components/guest/ui';
import { SurveyLangSwitcher, surveyLocales } from '@/components/survey-lang-switcher';
import type { SurveyOffer } from '@/lib/survey-types';

function deviceLabel(): string {
  if (typeof navigator === 'undefined') return 'Web';
  const ua = navigator.userAgent;
  const mobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  const os = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'macOS' : /Windows/.test(ua) ? 'Windows' : 'Web';
  return `${mobile ? 'Mobile' : 'Desktop'} · ${os}`;
}

/** Full-screen captive survey (default survey after WiFi login). */
export function CaptiveSurvey({ offer, onDone }: { offer: SurveyOffer; onDone: () => void }) {
  const { lang } = useLang();
  const [done, setDone] = useState(false);

  const model = useMemo(() => {
    const m = new Model((offer.json && typeof offer.json === 'object' ? offer.json : {}) as object);
    m.onComplete.add((sender) => {
      void submitCaptiveSurvey(offer.id, sender.data as Record<string, unknown>, deviceLabel());
    });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offer.id]);

  const locales = useMemo(() => surveyLocales(model, offer.defaultLocale), [model, offer.defaultLocale]);
  const [loc, setLoc] = useState<string>(() => (locales.includes(lang) ? lang : offer.defaultLocale));
  useEffect(() => {
    model.locale = loc === offer.defaultLocale ? '' : loc;
  }, [loc, model, offer.defaultLocale]);

  // After completion, briefly show the thank-you then auto-return to the portal home.
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(onDone, 3000);
    return () => clearTimeout(id);
  }, [done, onDone]);

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', zIndex: 60, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', borderBottom: '1px solid var(--line)', background: 'var(--surface)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t-label" style={{ fontSize: 12, color: 'var(--brand-secondary)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            {L({ en: 'Quick survey', tr: 'Kısa anket', de: 'Kurze Umfrage', ru: 'Короткий опрос' }, lang)}
          </div>
          <div style={{ fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{offer.name}</div>
        </div>
        {!done && locales.length > 1 ? <SurveyLangSwitcher locales={locales} active={loc} onChange={setLoc} /> : null}
        {!done && (
          <button onClick={onDone} aria-label="Close" style={{ all: 'unset', cursor: 'pointer', width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'var(--surface-2)', color: 'var(--ink)' }}>
            <Icon name="close" size={18} />
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
        {done ? (
          <div style={{ padding: '64px 28px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, margin: '0 auto 16px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'color-mix(in srgb, var(--success) 16%, var(--surface))', color: 'var(--success)' }}>
              <Icon name="check" size={32} stroke={2.4} />
            </div>
            <h2 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--ink)' }}>
              {offer.thankYouTitle || L({ en: 'Thank you', tr: 'Teşekkürler', de: 'Danke', ru: 'Спасибо' }, lang)}
            </h2>
            <p className="t-body" style={{ margin: '0 auto', maxWidth: 280 }}>
              {offer.thankYouDescription || L({ en: 'Your feedback has been recorded.', tr: 'Geri bildiriminiz kaydedildi.', de: 'Ihr Feedback wurde gespeichert.', ru: 'Ваш отзыв записан.' }, lang)}
            </p>
            <button onClick={onDone} style={{ marginTop: 26, padding: '14px 28px', border: 'none', borderRadius: 'var(--r-md)', background: 'var(--brand-primary)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              {L({ en: 'Continue', tr: 'Devam et', de: 'Weiter', ru: 'Продолжить' }, lang)}
            </button>
          </div>
        ) : (
          <div style={{ padding: 8 }}>
            <Survey model={model} onComplete={() => setDone(true)} />
          </div>
        )}
      </div>
    </div>
  );
}
