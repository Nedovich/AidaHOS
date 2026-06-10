'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { resolveLoc, type PortalLang, type PortalSplash } from '@aidahos/db/portal-config';
import { L, useLang } from '@/lib/i18n';
import {
  AIDA_DINING, AIDA_EVENTS, AIDA_EXPERIENCES, AIDA_SPA, AIDA_TONIGHT, AIDA_WEATHER, IMG, PH,
  type AidaEvent, type Brand, type Dining, type Experience, type Spa,
} from '@/lib/data';
import type { SurveyOffer } from '@/lib/survey-types';
import { Button, Icon, LangSwitch, Ph, StatusBar } from './ui';
import { DiningCard, EventCard, ExperienceCard, Rail, RowHead, SpaCard, TonightHero, WeatherLine } from './cards';

/* ---------------- Splash ---------------- */
export function Splash({ brand, onEnter, splash, defaultLang, enabledLangs }: {
  brand: Brand;
  onEnter: () => void;
  splash?: PortalSplash;
  defaultLang?: PortalLang;
  enabledLangs?: PortalLang[];
}) {
  const { t, lang } = useLang();
  const def = defaultLang ?? 'en';
  const name = splash ? resolveLoc(splash.name, lang as PortalLang, def) || brand.name : brand.name;
  const sub = splash ? resolveLoc(splash.sub, lang as PortalLang, def) : L(brand.sub, lang);
  const tag = splash ? resolveLoc(splash.tag, lang as PortalLang, def) || t('splash_tagline') : t('splash_tagline');
  const enter = splash ? resolveLoc(splash.enter, lang as PortalLang, def) || t('splash_enter') : t('splash_enter');
  const bgUrl = splash?.backgroundUrl || IMG(PH.resortSea, 1000);
  const logo = splash?.logoUrl;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'var(--ph-night)' }}>
      <img src={bgUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(20,14,8,.32) 0%, rgba(20,14,8,.12) 38%, rgba(16,11,6,.82) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
        <StatusBar light />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '30px 30px 42px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }} className="anim-in"><LangSwitch light compact langs={enabledLangs} /></div>
          <div className="anim-up" style={{ textAlign: 'center' }}>
            <div style={{ width: 84, height: 84, borderRadius: '50%', margin: '0 auto 22px', display: 'grid', placeItems: 'center', overflow: 'hidden', background: 'rgba(255,255,255,.16)', border: '1.5px solid rgba(255,255,255,.5)', backdropFilter: 'blur(8px)' }}>
              {logo
                ? <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 600, color: '#fff' }}>{brand.monogram}</span>}
            </div>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 46, fontWeight: 500, color: '#fff', letterSpacing: '.01em', lineHeight: 1 }}>{name}</h1>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,.82)', marginTop: 12 }}>{sub}</div>
          </div>
          <div className="anim-up" style={{ animationDelay: '.1s' }}>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.92)', fontSize: 16, fontWeight: 500, marginBottom: 22, fontFamily: 'var(--font-display)', fontStyle: 'italic', letterSpacing: '.01em' }}>{tag}</p>
            <button onClick={onEnter} className="btn btn-block" style={{ background: '#fff', color: 'var(--ink)', fontSize: 16, padding: '17px', boxShadow: '0 12px 30px -12px rgba(0,0,0,.5)' }}>
              {enter} <Icon name="arrowR" size={19} stroke={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Login ---------------- */
const inputStyle: CSSProperties = {
  width: '100%', padding: '15px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--line-2)',
  background: 'var(--surface)', fontSize: 16, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-ui)', outline: 'none',
};
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 8, letterSpacing: '.02em' }}>{label}</label>
      {children}
    </div>
  );
}

type LoginFn = (room: string, dob: string) => Promise<{ ok: boolean; error?: string; username?: string; survey?: SurveyOffer | null }>;
interface MikrotikPortal { loginUrl: string; orig: string; mac: string }

export function Login({ brand, onLogin, loginAction, portal, hotelSlug }: { brand: Brand; onLogin: (survey?: SurveyOffer | null) => void; loginAction?: LoginFn; portal?: MikrotikPortal | null; hotelSlug?: string }) {
  const { t, lang } = useLang();
  const [room, setRoom] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const valid = room.trim().length >= 1 && dob.replace(/\D/g, '').length === 8;
  const submit = async () => {
    if (!valid || loading) return;
    setErr(null);
    setLoading(true);
    try {
      if (loginAction) {
        const birth = dob.replace(/\D/g, '');
        const res = await loginAction(room.trim(), birth);
        if (res.ok) {
          // Captive portal: hand the credentials to the MikroTik gateway so the
          // client actually gets online, then bounce back to the app (with internet).
          if (portal?.loginUrl && res.username) {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const dst = `${origin}/${hotelSlug ?? ''}?connected=1`;
            const u = `${portal.loginUrl}?username=${encodeURIComponent(res.username)}&password=${encodeURIComponent(birth)}&dst=${encodeURIComponent(dst)}`;
            window.location.href = u; // top-level nav (https→http allowed; not mixed content)
            return;
          }
          // Dev path (no MikroTik): no gateway round-trip, so offer the default survey here.
          onLogin(res.survey ?? null);
          return;
        }
        setErr(
          res.error === 'not_found'
            ? L({ en: 'Hotel not found.', tr: 'Otel bulunamadı.', de: 'Hotel nicht gefunden.', ru: 'Отель не найден.' }, lang)
            : res.error === 'provisioning'
              ? L({ en: 'Could not connect you. Please try again.', tr: 'Bağlanılamadı. Lütfen tekrar deneyin.', de: 'Verbindung fehlgeschlagen. Bitte erneut versuchen.', ru: 'Не удалось подключить. Повторите попытку.' }, lang)
              : res.error === 'expired'
                ? L({ en: 'Your stay has ended, so internet access is closed. Please contact reception.', tr: 'Konaklamanız sona erdiği için internet erişimi kapalı. Lütfen resepsiyona başvurun.', de: 'Ihr Aufenthalt ist beendet, der Internetzugang ist geschlossen. Bitte wenden Sie sich an die Rezeption.', ru: 'Ваше пребывание завершено, доступ в интернет закрыт. Обратитесь на ресепшен.' }, lang)
                : res.error === 'not_started'
                  ? L({ en: 'Your reservation has not started yet. Internet access opens at check-in.', tr: 'Rezervasyonunuz henüz başlamadı. İnternet erişimi giriş tarihinde açılır.', de: 'Ihre Reservierung hat noch nicht begonnen. Der Internetzugang öffnet beim Check-in.', ru: 'Ваше бронирование ещё не началось. Доступ в интернет откроется при заселении.' }, lang)
                  : L({ en: 'Room number or birth date is incorrect.', tr: 'Oda numarası veya doğum tarihi hatalı.', de: 'Zimmernummer oder Geburtsdatum ist falsch.', ru: 'Неверный номер комнаты или дата рождения.' }, lang),
        );
      } else {
        // No backend bound (static preview) — fall back to the visual mock flow.
        await new Promise((r) => setTimeout(r, 900));
        onLogin();
      }
    } catch {
      setErr(L({ en: 'Something went wrong. Please try again.', tr: 'Bir hata oluştu. Lütfen tekrar deneyin.', de: 'Etwas ist schiefgelaufen.', ru: 'Произошла ошибка.' }, lang));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <div style={{ height: 210, position: 'relative', flexShrink: 0 }}>
        <img src={IMG(PH.beach, 900)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(20,40,45,.18), var(--bg))' }} />
        <div style={{ position: 'absolute', top: 14, right: 20 }}><LangSwitch light compact /></div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: -32, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--brand-primary)', color: '#fff', boxShadow: 'var(--sh-3)', border: '3px solid var(--bg)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600 }}>{brand.monogram}</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '48px 28px 24px' }} className="no-scrollbar">
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 600, color: 'var(--ink)' }}>{t('login_welcome')}</h1>
          <p className="t-body" style={{ margin: '6px 0 0' }}>{t('login_sub')} · {brand.name}</p>
        </div>

        <Field label={t('login_room')}>
          <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder={t('login_room_ph')} inputMode="numeric" style={inputStyle} />
        </Field>
        <Field label={t('login_birth')}>
          <input
            value={dob}
            onChange={(e) => setDob(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder={L({ en: 'DDMMYYYY', tr: 'GGAAYYYY', de: 'TTMMJJJJ', ru: 'ДДММГГГГ' }, lang)}
            inputMode="numeric"
            maxLength={8}
            style={inputStyle}
          />
        </Field>

        {err && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, padding: '11px 14px', borderRadius: 'var(--r-md)', background: 'color-mix(in srgb, var(--danger, #d4524a) 12%, var(--surface))', border: '1px solid color-mix(in srgb, var(--danger, #d4524a) 35%, transparent)' }}>
            <Icon name="shield" size={16} color="var(--danger, #d4524a)" style={{ flexShrink: 0 }} />
            <span className="t-caption" style={{ margin: 0, color: 'var(--danger, #d4524a)', fontWeight: 600 }}>{err}</span>
          </div>
        )}

        <Button variant="primary" block disabled={!valid || loading} onClick={submit} style={{ marginTop: 8, padding: '16px' }}>
          {loading ? t('login_signing') : t('login_continue')}
          {!loading && <Icon name="arrowR" size={18} stroke={2} />}
        </Button>

        <button style={{ display: 'block', margin: '18px auto 0', background: 'none', border: 0, cursor: 'pointer', color: 'var(--brand-primary)', fontWeight: 700, fontSize: 13.5 }}>{t('login_help')}</button>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: 30, padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
          <Icon name="shield" size={18} color="var(--brand-secondary)" style={{ flexShrink: 0, marginTop: 1 }} />
          <p className="t-caption" style={{ margin: 0, lineHeight: 1.45 }}>{t('login_privacy')}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Home ---------------- */
function GreetingHeader({ guest, onProfile }: { guest: typeof import('@/lib/data').AIDA_GUEST; onProfile: () => void }) {
  const { t, lang } = useLang();
  // Compute the time-of-day greeting on the client only — the server (UTC) and the
  // guest's device can be in different hours, which would cause a hydration mismatch.
  const [greet, setGreet] = useState('g_morning');
  useEffect(() => {
    const hr = new Date().getHours();
    setGreet(hr < 12 ? 'g_morning' : hr < 18 ? 'g_afternoon' : 'g_evening');
  }, []);
  const first = guest.name.split(' ')[0];
  return (
    <div style={{ padding: '6px 22px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="t-eyebrow" style={{ color: 'var(--brand-primary)', marginBottom: 6 }}>{t(greet)}</div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 600, color: 'var(--ink)', lineHeight: 1, letterSpacing: '-.01em' }}>{first}</h1>
          <div className="t-caption" style={{ marginTop: 7 }}>{t('pr_room')} {guest.room} · {L(guest.roomType, lang)}</div>
        </div>
        <button onClick={onProfile} style={{ all: 'unset', cursor: 'pointer', position: 'relative' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', boxShadow: 'var(--sh-2)', border: '2px solid var(--surface)' }}>
            <img src={IMG(guest.photo, 200)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </button>
      </div>
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
        <WeatherLine w={AIDA_WEATHER} />
      </div>
    </div>
  );
}

function ConciergeStrip({ onOpen }: { onOpen: () => void }) {
  const { t } = useLang();
  return (
    <div style={{ padding: '0 22px', marginBottom: 34 }}>
      <button onClick={onOpen} style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 'var(--r-lg)', background: 'var(--brand-secondary)', color: '#fff', boxShadow: 'var(--sh-2)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.3)' }}><Icon name="bell" size={22} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, lineHeight: 1.1 }}>{t('h_concierge')}</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.85)', marginTop: 2 }}>{t('h_concierge_sub')}</div>
          </div>
          <Icon name="chevR" size={20} color="rgba(255,255,255,.85)" />
        </div>
      </button>
    </div>
  );
}

export interface HomeProps {
  guest: typeof import('@/lib/data').AIDA_GUEST;
  joined: Set<string>;
  onJoin: (e: AidaEvent) => void;
  onNav: (key: string) => void;
  onOpenEvent: (e: AidaEvent) => void;
  onOpenDining: (d: Dining) => void;
  onOpenSpa: (s: Spa) => void;
  onReception: () => void;
  onSurvey: () => void;
}

export function Home({ guest, joined, onJoin, onNav, onOpenEvent, onOpenDining, onOpenSpa, onReception, onSurvey }: HomeProps) {
  const { t } = useLang();
  const today = AIDA_EVENTS.filter((e) => e.day === 'today');
  const openExperience = (x: Experience) => {
    const ev = AIDA_EVENTS.find((e) => e.id === x.ref);
    if (ev) return onOpenEvent(ev);
    const d = AIDA_DINING.find((dd) => dd.id === x.ref);
    if (d) return onOpenDining(d);
    const s = AIDA_SPA.find((ss) => ss.id === x.ref);
    if (s) onOpenSpa(s);
  };
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }} className="no-scrollbar">
        <GreetingHeader guest={guest} onProfile={() => onNav('profile')} />
        <TonightHero item={AIDA_TONIGHT} onReserve={() => { const e = AIDA_EVENTS.find((x) => x.id === 'e3'); if (e) onOpenEvent(e); }} />

        <RowHead title={t('h_dining')} action={t('see_all')} onAction={() => onNav('explore-dining')} />
        <div style={{ marginBottom: 34 }}>
          <Rail peek="80%">{AIDA_DINING.filter((d) => d.type === 'restaurant').map((d) => <DiningCard key={d.id} d={d} onOpen={onOpenDining} />)}</Rail>
        </div>

        <RowHead title={t('h_spa')} action={t('see_all')} onAction={() => onNav('explore-spa')} />
        <div style={{ marginBottom: 34 }}>
          <Rail peek="80%">{AIDA_SPA.map((s) => <SpaCard key={s.id} s={s} onOpen={onOpenSpa} />)}</Rail>
        </div>

        <RowHead title={t('h_today_act')} action={t('see_all')} onAction={() => onNav('events')} />
        <div style={{ marginBottom: 34 }}>
          <Rail peek="80%">{today.map((ev) => <EventCard key={ev.id} ev={ev} onOpen={onOpenEvent} joined={joined.has(ev.id)} onJoin={onJoin} />)}</Rail>
        </div>

        <RowHead title={t('h_recommended')} />
        <div style={{ marginBottom: 34 }}>
          <Rail peek="72%">{AIDA_EXPERIENCES.map((x) => <ExperienceCard key={x.id} x={x} onOpen={openExperience} />)}</Rail>
        </div>

        <ConciergeStrip onOpen={onReception} />

        <div style={{ padding: '0 22px' }}>
          <div style={{ borderRadius: 'var(--r-lg)', padding: '26px 24px', background: 'var(--surface)', border: '1px solid var(--line)', textAlign: 'center' }}>
            <Icon name="heart" size={22} color="var(--brand-primary)" fill />
            <h3 style={{ margin: '12px 0 6px', fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.1 }}>{t('h_feedback_t')}</h3>
            <p className="t-body" style={{ margin: '0 auto 18px', maxWidth: 280, fontSize: 14 }}>{t('h_feedback_b')}</p>
            <Button variant="primary" onClick={onSurvey}>{t('h_share')}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Placeholder tabs (built in pass 2) ---------------- */
export function ComingSoon({ title }: { title: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 30, textAlign: 'center' }}>
        <div>
          <Icon name="sparkle" size={34} color="var(--brand-accent)" />
          <h2 style={{ margin: '14px 0 6px', fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--ink)' }}>{title}</h2>
          <p className="t-body" style={{ margin: 0 }}>Bu ekran bir sonraki adımda gelecek.</p>
        </div>
      </div>
    </div>
  );
}
