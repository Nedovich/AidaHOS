'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { PORTAL_LANGS, portalAccent, portalPrimary, resolveLoc, type PortalConfig } from '@aidahos/db/portal-config';
import { AIDA_BRANDS, AIDA_GUEST, AIDA_NOTIFS, type AidaEvent, type Brand } from '@/lib/data';
import { LangCtx, L, makeT, useLang, type Lang } from '@/lib/i18n';
import type { SurveyOffer } from '@/lib/survey-types';
import { BottomNav, Icon, Sheet } from './ui';
import { ComingSoon, EventSheet, Events, Home, Login, Splash } from './screens';
import { CaptiveSurvey } from '@/components/captive-survey';

/** Build the guest Brand tokens from a published portal config (name/colors/monogram). */
function brandFromConfig(cfg: PortalConfig): Brand {
  const def = cfg.langs.default;
  const name = resolveLoc(cfg.splash.name, def, def) || 'AIDA Bay';
  const mono = name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'AB';
  const primary = portalPrimary(cfg.brand);
  const accent = portalAccent(cfg.brand);
  const sp = cfg.splash.sub;
  const sub = { en: sp.en ?? resolveLoc(sp, def, def), tr: sp.tr, de: sp.de, ru: sp.ru };
  return { name, sub, monogram: mono, primary, primary700: primary, secondary: accent, accent };
}

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

export type LoginFn = (
  room: string,
  dob: string,
) => Promise<{ ok: boolean; error?: string; username?: string; survey?: SurveyOffer | null }>;

export type StaffLoginFn = (
  username: string,
) => Promise<{ ok: boolean; error?: string; username?: string }>;

/* Post-login invite: "want to take the survey?" → Yes opens the default survey, No skips. */
function SurveyInvite({ name, onYes, onNo }: { name: string; onYes: () => void; onNo: () => void }) {
  const { lang } = useLang();
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 70, display: 'grid', placeItems: 'center', padding: 24, background: 'rgba(20,28,30,.5)', backdropFilter: 'blur(3px)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 360, padding: 24, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, margin: '0 auto 14px', borderRadius: 16, display: 'grid', placeItems: 'center', background: 'color-mix(in srgb, var(--brand-primary) 14%, var(--surface))', color: 'var(--brand-primary)' }}>
          <Icon name="check" size={26} stroke={2} />
        </div>
        <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: 23, fontWeight: 600, color: 'var(--ink)' }}>
          {L({ en: 'Got a minute?', tr: 'Bir dakikanız var mı?', de: 'Haben Sie eine Minute?', ru: 'Найдётся минутка?' }, lang)}
        </h3>
        <p className="t-body" style={{ margin: '0 0 20px' }}>
          {L(
            {
              en: `Would you like to take our short survey “${name}”? It only takes a minute.`,
              tr: `Kısa anketimize (“${name}”) katılmak ister misiniz? Yalnızca bir dakika sürer.`,
              de: `Möchten Sie an unserer kurzen Umfrage „${name}“ teilnehmen? Dauert nur eine Minute.`,
              ru: `Хотите пройти короткий опрос «${name}»? Это займёт минуту.`,
            },
            lang,
          )}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onYes} style={{ padding: '14px', border: 'none', borderRadius: 'var(--r-md)', background: 'var(--brand-primary)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            {L({ en: 'Yes, sure', tr: 'Evet, katılayım', de: 'Ja, gerne', ru: 'Да, конечно' }, lang)}
          </button>
          <button onClick={onNo} style={{ padding: '12px', border: 0, background: 'none', color: 'var(--ink-soft, var(--brand-secondary))', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            {L({ en: 'No thanks', tr: 'Hayır, teşekkürler', de: 'Nein, danke', ru: 'Нет, спасибо' }, lang)}
          </button>
        </div>
      </div>
    </div>
  );
}

export interface MikrotikPortal {
  loginUrl: string;
  orig: string;
  mac: string;
}

export interface GuestSession {
  room: string | null;
  name: string | null;
  checkIn: string | null;
  checkOut: string | null;
}

export interface GuestAppProps {
  hotelSlug?: string;
  hotelName?: string | null;
  loginAction?: LoginFn;
  staffLoginAction?: StaffLoginFn;
  portal?: MikrotikPortal | null;
  startInApp?: boolean;
  session?: GuestSession | null;
  surveyOffer?: SurveyOffer | null;
  portalConfig?: PortalConfig | null;
  events?: AidaEvent[];
}

function AppInner({ loginAction, staffLoginAction, portal, hotelSlug, startInApp, session, surveyOffer, portalConfig, events }: { loginAction?: LoginFn; staffLoginAction?: StaffLoginFn; portal?: MikrotikPortal | null; hotelSlug?: string; startInApp?: boolean; session?: GuestSession | null; surveyOffer?: SurveyOffer | null; portalConfig?: PortalConfig | null; events?: AidaEvent[] }) {
  const [stage, setStage] = useState<'splash' | 'login' | 'app'>(startInApp ? 'app' : 'splash');
  // Default-survey flow: server passes surveyOffer on the ?connected=1 return; the dev
  // (no-MikroTik) login path supplies it via the loginAction result instead.
  const [offer, setOffer] = useState<SurveyOffer | null>(surveyOffer ?? null);
  const [invite, setInvite] = useState<boolean>(!!surveyOffer);
  const [surveyOpen, setSurveyOpen] = useState(false);
  const clearUrl = () => {
    try {
      if (typeof window !== 'undefined' && window.location.search) window.history.replaceState(null, '', `/${hotelSlug ?? ''}`);
    } catch {}
  };
  const [tab, setTab] = useState('home');
  const [stack, setStack] = useState<string[]>([]);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [sheet, setSheet] = useState<SheetState>({ type: null });

  const brand = portalConfig ? brandFromConfig(portalConfig) : AIDA_BRANDS.aida!;
  // Real guest from the persisted session (room + name); other fields stay mock for now.
  const guest = session
    ? { ...AIDA_GUEST, name: session.name || AIDA_GUEST.name, initials: (session.name || AIDA_GUEST.name).split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase(), room: session.room || AIDA_GUEST.room }
    : AIDA_GUEST;
  const toggleJoin = (ev: AidaEvent) =>
    setJoined((p) => { const n = new Set(p); n.has(ev.id) ? n.delete(ev.id) : n.add(ev.id); return n; });
  // Real events from the DB; the page always supplies them (possibly empty).
  const eventList = events ?? [];

  const navTo = (key: string) => {
    if (key === 'explore-spa' || key === 'explore-dining') { setTab('explore'); setStack([key]); }
    else { setTab(key); setStack([]); }
  };
  const onTab = (id: string) => { setStack([]); setTab(id); };

  const renderScreen = () => {
    switch (tab) {
      case 'home':
        return (
          <Home guest={guest} joined={joined} onJoin={toggleJoin} onNav={navTo} events={eventList}
            onOpenEvent={(e) => setSheet({ type: 'event', item: e })}
            onOpenDining={(d) => setSheet({ type: 'dining', item: d })}
            onOpenSpa={(s) => setSheet({ type: 'spa', item: s })}
            onReception={() => setSheet({ type: 'reception' })}
            onSurvey={() => setTab('survey')} />
        );
      case 'explore': return <ComingSoon title="Keşfet" />;
      case 'events':
        return <Events joined={joined} onJoin={toggleJoin} events={eventList} onOpenEvent={(e) => setSheet({ type: 'event', item: e })} />;
      case 'messages': return <ComingSoon title="Mesajlar" />;
      case 'profile': return <ComingSoon title="Profil" />;
      case 'survey': return <ComingSoon title="Anket" />;
      default: return null;
    }
  };

  const showNav = stage === 'app' && tab !== 'survey';
  const unread = AIDA_NOTIFS.filter((n) => n.unread).length;

  return (
    <div className="aida-app" data-mode={portalConfig?.brand.evening ? 'evening' : 'day'}
      style={{ '--brand-primary': brand.primary, '--brand-primary-700': brand.primary700, '--brand-secondary': brand.secondary, '--brand-accent': brand.accent, position: 'absolute', inset: 0, overflow: 'hidden', background: 'var(--bg)' } as CSSProperties}>
      {stage === 'splash' && (
        <Splash
          brand={brand}
          onEnter={() => setStage('login')}
          splash={portalConfig?.splash}
          defaultLang={portalConfig?.langs.default}
          enabledLangs={portalConfig ? PORTAL_LANGS.filter((l) => portalConfig.langs.enabled.includes(l)) : undefined}
        />
      )}
      {stage === 'login' && (
        <Login
          brand={brand}
          loginAction={loginAction}
          staffLoginAction={staffLoginAction}
          portal={portal}
          hotelSlug={hotelSlug}
          login={portalConfig?.login}
          onLogin={(survey) => {
            setStage('app');
            setTab('home');
            if (survey) {
              setOffer(survey);
              setInvite(true);
            }
          }}
        />
      )}
      {stage === 'app' && (
        <>
          <div style={{ position: 'absolute', inset: 0 }}>{renderScreen()}</div>
          {showNav && <BottomNav active={tab} onNav={onTab} unread={unread} />}
        </>
      )}
      {stage === 'app' && invite && offer && (
        <SurveyInvite
          name={offer.name}
          onYes={() => { setInvite(false); setSurveyOpen(true); clearUrl(); }}
          onNo={() => { setInvite(false); clearUrl(); }}
        />
      )}
      {stage === 'app' && surveyOpen && offer && (
        <CaptiveSurvey offer={offer} onDone={() => { setSurveyOpen(false); clearUrl(); }} />
      )}
      <EventSheet
        open={sheet.type === 'event'}
        ev={sheet.type === 'event' ? (sheet.item as AidaEvent) : null}
        joined={sheet.type === 'event' && sheet.item ? joined.has((sheet.item as AidaEvent).id) : false}
        onJoin={toggleJoin}
        onClose={() => setSheet({ type: null })}
      />
      <ReceptionSheet open={sheet.type === 'reception'} onClose={() => setSheet({ type: null })} />
    </div>
  );
}

export function GuestApp({ loginAction, staffLoginAction, portal, hotelSlug, startInApp, session, surveyOffer, portalConfig, events }: GuestAppProps = {}) {
  // Initial language = the portal's default (unless the guest already picked one).
  const [lang, setLangState] = useState<Lang>((portalConfig?.langs.default as Lang) ?? 'en');
  useEffect(() => {
    const saved = (typeof localStorage !== 'undefined' && localStorage.getItem('aida_lang')) as Lang | null;
    if (saved) setLangState(saved);
  }, []);
  const setLang = (l: Lang) => { setLangState(l); try { localStorage.setItem('aida_lang', l); } catch {} };
  const value = useMemo(() => ({ lang, t: makeT(lang), setLang }), [lang]);

  return (
    <LangCtx.Provider value={value}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 440, height: '100dvh', margin: '0 auto', overflow: 'hidden', background: 'var(--bg)', boxShadow: '0 0 80px -20px rgba(40,25,12,.25)' }}>
        <AppInner loginAction={loginAction} staffLoginAction={staffLoginAction} portal={portal} hotelSlug={hotelSlug} startInApp={startInApp} session={session} surveyOffer={surveyOffer} portalConfig={portalConfig} events={events} />
      </div>
    </LangCtx.Provider>
  );
}
