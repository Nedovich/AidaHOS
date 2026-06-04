'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { AIDA_BRANDS, AIDA_GUEST, AIDA_NOTIFS, type AidaEvent } from '@/lib/data';
import { LangCtx, L, makeT, useLang, type Lang } from '@/lib/i18n';
import { BottomNav, Icon, Sheet } from './ui';
import { ComingSoon, Home, Login, Splash } from './screens';

/* Reception quick-request sheet (concierge) */
function ReceptionSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useLang();
  const [sent, setSent] = useState<string | null>(null);
  useEffect(() => { if (open) setSent(null); }, [open]);
  const reqs = [
    { id: 'towels', icon: 'waves', label: { en: 'Fresh towels', tr: 'Temiz havlu', de: 'Frische Handtücher', ru: 'Свежие полотенца' } },
    { id: 'housekeeping', icon: 'sparkle', label: { en: 'Housekeeping', tr: 'Kat hizmetleri', de: 'Zimmerservice', ru: 'Уборка' } },
    { id: 'amenities', icon: 'leaf', label: { en: 'Bath amenities', tr: 'Banyo malzemeleri', de: 'Bad-Amenities', ru: 'Туалетные принадлежности' } },
    { id: 'taxi', icon: 'pin', label: { en: 'Arrange a taxi', tr: 'Taksi çağır', de: 'Taxi bestellen', ru: 'Заказать такси' } },
    { id: 'wakeup', icon: 'clock', label: { en: 'Wake-up call', tr: 'Uyandırma servisi', de: 'Weckruf', ru: 'Звонок-будильник' } },
    { id: 'dnd', icon: 'shield', label: { en: 'Do not disturb', tr: 'Rahatsız etmeyin', de: 'Bitte nicht stören', ru: 'Не беспокоить' } },
  ];
  return (
    <Sheet open={open} onClose={onClose} maxH="74%">
      <div style={{ padding: '8px 22px 4px' }}>
        <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--ink)' }}>{t('qa_reception')}</h3>
        <p className="t-body" style={{ marginTop: 0, marginBottom: 18 }}>{L({ en: 'Tap a request — our team will take care of it.', tr: 'Bir talebe dokunun — ekibimiz ilgilenecek.', de: 'Tippen Sie auf eine Anfrage — unser Team kümmert sich darum.', ru: 'Нажмите на запрос — наша команда позаботится об этом.' }, lang)}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
          {reqs.map((r) => {
            const done = sent === r.id;
            return (
              <button key={r.id} onClick={() => setSent(r.id)} style={{ all: 'unset', cursor: 'pointer' }}>
                <div className="card" style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start', borderColor: done ? 'var(--success)' : 'var(--line)', transition: 'all .2s' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', display: 'grid', placeItems: 'center', background: done ? 'color-mix(in srgb,var(--success) 16%,var(--surface))' : 'var(--surface-2)', color: done ? 'var(--success)' : 'var(--brand-primary)' }}>
                    <Icon name={done ? 'check' : r.icon} size={20} stroke={done ? 2.4 : 1.7} />
                  </div>
                  <span className="t-label" style={{ fontSize: 13.5 }}>{done ? t('m_request_sent') : L(r.label, lang)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}

type SheetState = { type: null | 'reception' | 'event' | 'dining' | 'spa'; item?: unknown };

function AppInner() {
  const [stage, setStage] = useState<'splash' | 'login' | 'app'>('splash');
  const [tab, setTab] = useState('home');
  const [stack, setStack] = useState<string[]>([]);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [sheet, setSheet] = useState<SheetState>({ type: null });

  const brand = AIDA_BRANDS.aida!;
  const toggleJoin = (ev: AidaEvent) =>
    setJoined((p) => { const n = new Set(p); n.has(ev.id) ? n.delete(ev.id) : n.add(ev.id); return n; });

  const navTo = (key: string) => {
    if (key === 'explore-spa' || key === 'explore-dining') { setTab('explore'); setStack([key]); }
    else { setTab(key); setStack([]); }
  };
  const onTab = (id: string) => { setStack([]); setTab(id); };

  const renderScreen = () => {
    switch (tab) {
      case 'home':
        return (
          <Home guest={AIDA_GUEST} joined={joined} onJoin={toggleJoin} onNav={navTo}
            onOpenEvent={(e) => setSheet({ type: 'event', item: e })}
            onOpenDining={(d) => setSheet({ type: 'dining', item: d })}
            onOpenSpa={(s) => setSheet({ type: 'spa', item: s })}
            onReception={() => setSheet({ type: 'reception' })}
            onSurvey={() => setTab('survey')} />
        );
      case 'explore': return <ComingSoon title="Keşfet" />;
      case 'events': return <ComingSoon title="Etkinlikler" />;
      case 'messages': return <ComingSoon title="Mesajlar" />;
      case 'profile': return <ComingSoon title="Profil" />;
      case 'survey': return <ComingSoon title="Anket" />;
      default: return null;
    }
  };

  const showNav = stage === 'app' && tab !== 'survey';
  const unread = AIDA_NOTIFS.filter((n) => n.unread).length;

  return (
    <div className="aida-app" data-mode="day"
      style={{ '--brand-primary': brand.primary, '--brand-primary-700': brand.primary700, '--brand-secondary': brand.secondary, '--brand-accent': brand.accent, position: 'absolute', inset: 0, overflow: 'hidden', background: 'var(--bg)' } as CSSProperties}>
      {stage === 'splash' && <Splash brand={brand} onEnter={() => setStage('login')} />}
      {stage === 'login' && <Login brand={brand} onLogin={() => { setStage('app'); setTab('home'); }} />}
      {stage === 'app' && (
        <>
          <div style={{ position: 'absolute', inset: 0 }}>{renderScreen()}</div>
          {showNav && <BottomNav active={tab} onNav={onTab} unread={unread} />}
        </>
      )}
      <ReceptionSheet open={sheet.type === 'reception'} onClose={() => setSheet({ type: null })} />
    </div>
  );
}

export function GuestApp() {
  const [lang, setLangState] = useState<Lang>('en');
  useEffect(() => {
    const saved = (typeof localStorage !== 'undefined' && localStorage.getItem('aida_lang')) as Lang | null;
    if (saved) setLangState(saved);
  }, []);
  const setLang = (l: Lang) => { setLangState(l); try { localStorage.setItem('aida_lang', l); } catch {} };
  const value = useMemo(() => ({ lang, t: makeT(lang), setLang }), [lang]);

  return (
    <LangCtx.Provider value={value}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 440, height: '100dvh', margin: '0 auto', overflow: 'hidden', background: 'var(--bg)', boxShadow: '0 0 80px -20px rgba(40,25,12,.25)' }}>
        <AppInner />
      </div>
    </LangCtx.Provider>
  );
}
