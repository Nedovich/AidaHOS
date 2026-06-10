'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Save, Send } from 'lucide-react';
import type { PortalConfig } from '@aidahos/db/portal-config';
import { L, type Lang } from '@/lib/i18n';
import { publishPortalAction, saveDraftPortalAction } from '@/app/(hotel)/h/[hotelId]/portal/actions';
import { LeftPane } from './left-pane';
import { InspectorPane } from './inspector-pane';
import { PhonePreview } from './phone-preview';
import { configFromState, reducer, stateFromConfig, type ScreenId } from './portal-state';

const SCREEN_TABS: [ScreenId, string][] = [
  ['splash', 'Splash'], ['login', 'Sign-in'], ['home', 'Home'], ['explore', 'Explore'], ['events', 'Events'],
];

type Status = 'idle' | 'dirty' | 'saving' | 'saved' | 'publishing' | 'published';

/**
 * Three-pane Guest Portal composer. Loads the hotel's draft config, edits it (incl. per-language
 * splash text), Save persists the draft, Publish makes it live for guests. Home/Explore/Events
 * blocks are still mock for now — only Splash + Brand + Languages are wired to the DB this pass.
 */
export function PortalComposer({
  hotelId,
  lang,
  initialConfig,
  hotels,
  previewUrl,
}: {
  hotelId: string;
  lang: Lang;
  initialConfig: PortalConfig;
  hotels: { id: string; name: string }[];
  previewUrl: string;
}) {
  const router = useRouter();
  const [s, dispatch] = useReducer(reducer, initialConfig, stateFromConfig);
  const [status, setStatus] = useState<Status>('idle');
  const first = useRef(true);

  // Mark unsaved changes whenever editor state changes (skip the initial mount).
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setStatus('dirty');
  }, [s]);

  const busy = status === 'saving' || status === 'publishing';

  const run = async (kind: 'save' | 'publish') => {
    setStatus(kind === 'save' ? 'saving' : 'publishing');
    try {
      const cfg = configFromState(s);
      if (kind === 'save') await saveDraftPortalAction(hotelId, cfg);
      else await publishPortalAction(hotelId, cfg);
      setStatus(kind === 'save' ? 'saved' : 'published');
    } catch (e) {
      console.error(`${kind} portal failed`, e);
      setStatus('dirty');
      alert(L(['İşlem başarısız. Tekrar deneyin.', 'Action failed. Please try again.'], lang));
    }
  };

  const STATUS: Record<Status, { tr: string; en: string; color?: string; bg?: string }> = {
    idle: { tr: 'Taslak', en: 'Draft' },
    dirty: { tr: 'Kaydedilmemiş değişiklikler', en: 'Unsaved changes' },
    saving: { tr: 'Kaydediliyor…', en: 'Saving…' },
    saved: { tr: 'Taslak kaydedildi', en: 'Draft saved', color: 'var(--text-2)', bg: 'var(--surface-3)' },
    publishing: { tr: 'Yayınlanıyor…', en: 'Publishing…' },
    published: { tr: 'Yayında', en: 'Published', color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 12%, transparent)' },
  };
  const st = STATUS[status];

  return (
    <>
      <div className="page-hero">
        <div>
          <h1 className="page-hero__h">{L(['Misafir Portalı', 'Guest Portal'], lang)}</h1>
          <p className="page-hero__sub">
            {L([
              'Misafirlerinizin gördüğü mobil portalı tasarlayın ve markanıza göre özelleştirin.',
              'Compose the mobile portal your guests see — arrange, brand it, and publish.',
            ], lang)}
          </p>
        </div>
        <div className="page-hero__actions">
          {hotels.length > 1 && (
            <select
              value={hotelId}
              onChange={(e) => router.push(`/h/${e.target.value}/portal`)}
              aria-label={L(['Otel', 'Hotel'], lang)}
              style={{ height: 38, padding: '0 30px 0 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontWeight: 600, fontSize: 'var(--text-sm)', cursor: 'pointer' }}
            >
              {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          )}
          <span className="pb-status" style={st.color ? { color: st.color, background: st.bg } : undefined}>
            <span className="ico-dot" />{L([st.tr, st.en], lang)}
          </span>
          <a className="btn btn--ghost" href={previewUrl} target="_blank" rel="noreferrer"><Eye size={16} />{L(['Önizleme', 'Preview'], lang)}</a>
          <button className="btn btn--ghost" type="button" onClick={() => run('save')} disabled={busy}><Save size={16} />{L(['Kaydet', 'Save'], lang)}</button>
          <button className="btn btn--primary" type="button" onClick={() => run('publish')} disabled={busy}><Send size={16} />{L(['Yayınla', 'Publish'], lang)}</button>
        </div>
      </div>

      <div className="pb">
        <LeftPane s={s} dispatch={dispatch} />
        <div className="pb-stage">
          <div className="pb-screentabs">
            {SCREEN_TABS.map((t) => (
              <button key={t[0]} className={t[0] === s.screen ? 'on' : ''} onClick={() => dispatch({ t: 'screen', screen: t[0] })}>{t[1]}</button>
            ))}
          </div>
          <PhonePreview s={s} onSelect={(id) => dispatch({ t: 'select', id })} onEditLang={(l) => dispatch({ t: 'editLang', lang: l })} />
        </div>
        <InspectorPane s={s} dispatch={dispatch} />
      </div>
    </>
  );
}
