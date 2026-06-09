'use client';

import { useEffect, useMemo, useState } from 'react';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import 'survey-core/survey-core.css';
import { submitSurveyResponse, verifyGuestForSurvey } from '@/app/s/[hotelSlug]/[surveySlug]/actions';
import { SurveyLangSwitcher, surveyLocales } from '@/components/survey-lang-switcher';

type Lang = 'tr' | 'en';
const T = (tr: string, en: string, lang: Lang) => (lang === 'tr' ? tr : en);

function deviceLabel(): string {
  if (typeof navigator === 'undefined') return 'Web';
  const ua = navigator.userAgent;
  const mobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  const os = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'macOS' : /Windows/.test(ua) ? 'Windows' : 'Web';
  return `${mobile ? 'Mobile' : 'Desktop'} · ${os}`;
}

export function SurveyRunner({
  surveyId,
  surveySlug,
  hotelSlug,
  json,
  guestVerification,
  thankYouTitle,
  thankYouDescription,
  lang = 'en',
  defaultLocale = 'en',
}: {
  surveyId: string;
  surveySlug: string;
  hotelSlug: string;
  json: unknown;
  guestVerification: boolean;
  thankYouTitle: string | null;
  thankYouDescription: string | null;
  lang?: Lang;
  defaultLocale?: string;
}) {
  const [stage, setStage] = useState<'verify' | 'survey' | 'done'>(guestVerification ? 'verify' : 'survey');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [room, setRoom] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const model = useMemo(() => {
    const m = new Model((json && typeof json === 'object' ? json : {}) as object);
    m.onComplete.add((sender) => {
      void submitSurveyResponse(surveyId, sender.data as Record<string, unknown>, deviceLabel());
    });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [json, surveyId]);

  // Languages the survey actually offers (default + admin-added translations).
  const locales = useMemo(() => surveyLocales(model, defaultLocale), [model, defaultLocale]);
  const [loc, setLoc] = useState<string>(() => (locales.includes(lang) ? lang : defaultLocale));
  useEffect(() => {
    model.locale = loc === defaultLocale ? '' : loc;
  }, [loc, model, defaultLocale]);

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await verifyGuestForSurvey(surveySlug, hotelSlug, room, dob);
    setBusy(false);
    if (res.ok) setStage('survey');
    else setError(T('Oda numarası veya doğum tarihi hatalı.', 'Room number or birth date is incorrect.', lang));
  }

  if (stage === 'verify') {
    return (
      <div style={card}>
        {locales.length > 1 ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <SurveyLangSwitcher locales={locales} active={loc} onChange={setLoc} />
          </div>
        ) : null}
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>{T('Erişim Doğrulaması', 'Access Verification', lang)}</h1>
        <p style={{ color: 'var(--muted, #667)', margin: '0 0 18px', fontSize: 14 }}>
          {T('Ankete erişmek için oda numaranızı ve doğum tarihinizi girin.', 'Enter your room number and birth date to access the survey.', lang)}
        </p>
        <form onSubmit={onVerify} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={lbl}>{T('Oda Numarası', 'Room Number', lang)}
            <input value={room} onChange={(e) => setRoom(e.target.value)} inputMode="numeric" placeholder="101" style={inp} required />
          </label>
          <label style={lbl}>{T('Doğum Tarihi (GGAAYYYY)', 'Birth Date (DDMMYYYY)', lang)}
            <input value={dob} onChange={(e) => setDob(e.target.value)} inputMode="numeric" placeholder="08051990" style={inp} required />
          </label>
          {error ? <div style={{ color: '#c0392b', fontSize: 13 }}>{error}</div> : null}
          <button type="submit" disabled={busy} style={btn}>{busy ? '…' : T('Doğrula', 'Verify', lang)}</button>
        </form>
      </div>
    );
  }

  if (stage === 'done') {
    return (
      <div style={{ ...card, textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>✓</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>{thankYouTitle || T('Teşekkürler', 'Thank you', lang)}</h1>
        <p style={{ color: 'var(--muted, #667)', margin: 0, fontSize: 14 }}>{thankYouDescription || T('Geri bildiriminiz kaydedildi.', 'Your feedback has been recorded.', lang)}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      {locales.length > 1 ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
          <SurveyLangSwitcher locales={locales} active={loc} onChange={setLoc} />
        </div>
      ) : null}
      {mounted ? <Survey model={model} onComplete={() => setStage('done')} /> : <div style={{ ...card, textAlign: 'center', color: '#667' }}>…</div>}
    </div>
  );
}

const card: React.CSSProperties = { maxWidth: 420, margin: '8vh auto', padding: 28, background: '#fff', borderRadius: 16, boxShadow: '0 8px 30px rgba(0,0,0,.08)' };
const lbl: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: '#334' };
const inp: React.CSSProperties = { padding: '11px 13px', border: '1px solid #d6dbe0', borderRadius: 10, font: 'inherit', fontWeight: 400 };
const btn: React.CSSProperties = { marginTop: 6, padding: '12px 16px', border: 'none', borderRadius: 10, background: 'var(--accent, #2F6E78)', color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer' };
