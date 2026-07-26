'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { resolveLoc, type PortalAgreement, type PortalLang, type PortalLogin, type PortalSplash } from '@aidahos/db/portal-config';
import { L, useLang } from '@/lib/i18n';
import {
  AIDA_DINING, AIDA_EXPERIENCES, AIDA_SPA, AIDA_TONIGHT, AIDA_WEATHER, IMG, PH,
  type AidaEvent, type Brand, type Dining, type Experience, type Spa,
} from '@/lib/data';
import type { SurveyOffer } from '@/lib/survey-types';
import { Button, Icon, LangSwitch, Ph, Sheet, StatusBar } from './ui';
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

type LoginFn = (room: string, dob: string) => Promise<{ ok: boolean; error?: string; username?: string; survey?: SurveyOffer | null; showCheckoutSurvey?: boolean }>;
type StaffLoginFn = (username: string) => Promise<{ ok: boolean; error?: string; username?: string }>;
interface MikrotikPortal { loginUrl: string; orig: string; mac: string }

type LoginMode = 'guest' | 'user' | 'free';

function LoginModes({ mode, onChange, enabled }: { mode: LoginMode; onChange: (mode: LoginMode) => void; enabled: LoginMode[] }) {
  const { t } = useLang();
  const META: Record<LoginMode, { label: string; icon: string }> = {
    guest: { label: t('seg_guest'), icon: 'key' },
    user: { label: t('seg_user'), icon: 'user' },
    free: { label: t('seg_free'), icon: 'wifi' },
  };
  const modes = enabled.map((id) => ({ id, ...META[id] }));
  if (modes.length < 2) return null; // a single mode needs no switcher

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${modes.length},1fr)`, gap: 4, padding: 5, marginBottom: 24, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-pill)' }}>
      {modes.map((m) => {
        const on = m.id === mode;
        return (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            style={{
              border: 0,
              cursor: 'pointer',
              borderRadius: 'var(--r-pill)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '11px 6px',
              transition: 'color .2s, box-shadow .2s',
              background: on ? 'var(--brand-primary)' : 'transparent',
              color: on ? '#fff' : 'var(--ink-2)',
              boxShadow: on ? '0 6px 16px -8px color-mix(in srgb, var(--brand-primary) 70%, transparent)' : 'none',
            }}
          >
            <Icon name={m.icon} size={16} stroke={on ? 2.1 : 1.8} color={on ? '#fff' : 'var(--ink-3)'} />
            <span style={{ fontSize: 12.5, fontWeight: on ? 800 : 700, letterSpacing: '.01em', whiteSpace: 'nowrap' }}>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function AgreementModal({ onClose, agreement }: { onClose: () => void; agreement?: PortalAgreement | null }) {
  const { t, lang } = useLang();
  const useCfg = !!(agreement && agreement.sections && agreement.sections.length);
  const rL = (loc: Parameters<typeof resolveLoc>[0]) => resolveLoc(loc, lang as PortalLang, lang as PortalLang);
  const title = useCfg ? rL(agreement!.title) : t('ag_title');
  const updated = useCfg ? rL(agreement!.updated) : t('ag_updated');
  const intro = useCfg ? rL(agreement!.intro) : t('ag_p1');
  const sections = useCfg
    ? agreement!.sections.map((s) => ({ h: rL(s.heading), b: rL(s.body) }))
    : ([['ag_h1', 'ag_b1'], ['ag_h2', 'ag_b2'], ['ag_h3', 'ag_b3'], ['ag_h4', 'ag_b4']] as [string, string][]).map(([h, b]) => ({ h: t(h), b: t(b) }));

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} className="anim-in" style={{ position: 'absolute', inset: 0, background: 'rgba(28,18,8,.5)', backdropFilter: 'blur(2px)' }} />
      <div className="anim-up" style={{ position: 'relative', background: 'var(--surface)', borderTopLeftRadius: 'var(--r-xl)', borderTopRightRadius: 'var(--r-xl)', maxHeight: '82%', display: 'flex', flexDirection: 'column', boxShadow: '0 -20px 50px -20px rgba(28,18,8,.5)' }}>
        <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
          <div style={{ width: 38, height: 4, borderRadius: 99, background: 'var(--line-2)', margin: '0 auto 14px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 23, fontWeight: 600, color: 'var(--ink)' }}>{title}</h2>
              {updated ? <div className="t-caption" style={{ marginTop: 3 }}>{updated}</div> : null}
            </div>
            <button onClick={onClose} aria-label={t('b_close')} style={{ width: 36, height: 36, borderRadius: '50%', border: 0, cursor: 'pointer', background: 'var(--surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name="close" size={18} color="var(--ink-2)" stroke={2} />
            </button>
          </div>
        </div>
        <div className="no-scrollbar" style={{ overflowY: 'auto', padding: '18px 24px 8px' }}>
          <p className="t-body" style={{ margin: '0 0 20px', lineHeight: 1.6 }}>{intro}</p>
          {sections.map((sec, i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <h3 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 800, color: 'var(--ink)', letterSpacing: '.01em' }}>{sec.h}</h3>
              <p className="t-body" style={{ margin: 0, lineHeight: 1.6, fontSize: 13.5 }}>{sec.b}</p>
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 24px calc(env(safe-area-inset-bottom,0px) + 18px)', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
          <Button variant="primary" block onClick={onClose} style={{ padding: '15px' }}>{t('b_close')}</Button>
        </div>
      </div>
    </div>
  );
}

export function Login({ brand, onLogin, loginAction, staffLoginAction, portal, hotelSlug, login }: { brand: Brand; onLogin: (survey?: SurveyOffer | null, showCheckoutSurvey?: boolean) => void; loginAction?: LoginFn; staffLoginAction?: StaffLoginFn; portal?: MikrotikPortal | null; hotelSlug?: string; login?: PortalLogin | null }) {
  const { t, lang } = useLang();
  // Which sign-in tabs the hotel enabled (Guest is always available + is the real system).
  const enabledModes: LoginMode[] = ['guest'];
  if (!login || login.userMode) enabledModes.push('user');
  if (!login || login.freeMode) enabledModes.push('free');
  const showPrivacy = login ? login.privacy : true;
  const helpText = login ? resolveLoc(login.help, lang as PortalLang, lang as PortalLang) : t('login_help');
  const [mode, setMode] = useState<LoginMode>('guest');
  const [room, setRoom] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // If the hotel disabled the currently-active tab, fall back to Guest.
  useEffect(() => { if (!enabledModes.includes(mode)) setMode('guest'); }, [mode, login?.userMode, login?.freeMode]);
  const fieldsValid = mode === 'guest'
    ? room.trim().length >= 1 && dob.replace(/\D/g, '').length === 8
    : mode === 'user'
      ? email.trim().length >= 2
      : name.trim().length >= 2 && /.+@.+\..+/.test(email);
  const valid = fieldsValid && agreed;
  const subLabel = mode === 'guest' ? t('login_sub') : mode === 'user' ? t('auth_user_sub') : t('auth_free_sub');
  const cta = loading ? t('login_signing') : mode === 'free' ? t('auth_connect') : t('login_continue');

  const submit = async () => {
    if (!agreed) {
      setShake(true);
      window.setTimeout(() => setShake(false), 500);
      return;
    }
    if (!fieldsValid || loading) return;
    setErr(null);
    setLoading(true);
    try {
      if (mode === 'user') {
        if (staffLoginAction) {
          const res = await staffLoginAction(email.trim());
          if (res.ok && res.username) {
            if (portal?.loginUrl) {
              const origin = typeof window !== 'undefined' ? window.location.origin : '';
              const dst = `${origin}/${hotelSlug ?? ''}?connected=1`;
              const u = `${portal.loginUrl}?username=${encodeURIComponent(res.username)}&password=${encodeURIComponent('333')}&dst=${encodeURIComponent(dst)}`;
              window.location.href = u;
              return;
            }
            onLogin(null);
            return;
          }
          setErr(
            res.error === 'not_found'
              ? L({ en: 'Hotel not found.', tr: 'Otel bulunamadı.', de: 'Hotel nicht gefunden.', ru: 'Отель не найден.' }, lang)
              : L({ en: 'Username or password is incorrect.', tr: 'Kullanıcı adı veya şifre hatalı.', de: 'Benutzername oder Passwort ist falsch.', ru: 'Неверное имя пользователя или пароль.' }, lang),
          );
        } else {
          await new Promise((r) => setTimeout(r, 650));
          onLogin(null);
        }
        return;
      }
      if (mode === 'free') {
        await new Promise((r) => setTimeout(r, 650));
        return;
      }
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
          onLogin(res.survey ?? null, res.showCheckoutSurvey ?? false);
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
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, color: 'var(--ink)' }}>{t('login_welcome')}</h1>
          <p className="t-body" style={{ margin: '6px 0 0' }}>{subLabel} · {brand.name}</p>
        </div>

        <LoginModes mode={mode} enabled={enabledModes} onChange={(next) => { setMode(next); setErr(null); }} />

        {mode === 'guest' && (
          <>
            <Field label={t('login_room')}>
              <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder={t('login_room_ph')} inputMode="numeric" style={inputStyle} />
            </Field>
            <Field label={t('login_birth')}>
              <input
                value={dob}
                onChange={(e) => setDob(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder={L({ en: 'DD / MM / YYYY', tr: 'GG / AA / YYYY', de: 'TT / MM / JJJJ', ru: 'ДД / ММ / ГГГГ' }, lang)}
                inputMode="numeric"
                maxLength={8}
                style={inputStyle}
              />
            </Field>
          </>
        )}

        {mode === 'user' && (
          <Field label={t('auth_username')}>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth_username_ph')} autoCapitalize="none" autoCorrect="off" spellCheck={false} style={inputStyle} />
          </Field>
        )}

        {mode === 'free' && (
          <>
            <Field label={t('auth_name')}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('auth_name_ph')} style={inputStyle} />
            </Field>
            <Field label={t('auth_email')}>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth_email_ph')} inputMode="email" autoCapitalize="none" style={inputStyle} />
            </Field>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, margin: '2px 2px 4px' }}>
              <Icon name="wifi" size={16} color="var(--brand-secondary)" style={{ flexShrink: 0, marginTop: 1 }} />
              <p className="t-caption" style={{ margin: 0, lineHeight: 1.45 }}>{t('auth_free_note')}</p>
            </div>
          </>
        )}

        {err && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, padding: '11px 14px', borderRadius: 'var(--r-md)', background: 'color-mix(in srgb, var(--danger, #d4524a) 12%, var(--surface))', border: '1px solid color-mix(in srgb, var(--danger, #d4524a) 35%, transparent)' }}>
            <Icon name="shield" size={16} color="var(--danger, #d4524a)" style={{ flexShrink: 0 }} />
            <span className="t-caption" style={{ margin: 0, color: 'var(--danger, #d4524a)', fontWeight: 600 }}>{err}</span>
          </div>
        )}

        <div className={shake ? 'aida-shake' : ''} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, margin: '18px 2px 0' }}>
          <button
            onClick={() => setAgreed((a) => !a)}
            aria-label={t('auth_agree_link')}
            aria-checked={agreed}
            role="checkbox"
            style={{
              flexShrink: 0,
              width: 22,
              height: 22,
              marginTop: 1,
              borderRadius: 7,
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              transition: 'all .18s',
              background: agreed ? 'var(--brand-primary)' : 'var(--surface)',
              border: '1.5px solid ' + (agreed ? 'var(--brand-primary)' : (shake ? 'var(--brand-secondary)' : 'var(--line-2)')),
            }}
          >
            {agreed && <Icon name="check" size={14} color="#fff" stroke={2.6} />}
          </button>
          <p className="t-caption" style={{ margin: 0, lineHeight: 1.5, color: 'var(--ink-2)' }}>
            {t('auth_agree_pre')}{' '}
            <button onClick={() => setShowAgreement(true)} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'var(--brand-primary)', fontWeight: 800, textDecoration: 'underline', textUnderlineOffset: 2, fontSize: 'inherit', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              {t('auth_agree_link')}
            </button>.
          </p>
        </div>

        <Button variant="primary" block disabled={!fieldsValid || loading} onClick={submit} style={{ marginTop: 18, padding: '16px', opacity: valid || loading ? 1 : .55 }}>
          {cta}
          {!loading && <Icon name={mode === 'free' ? 'wifi' : 'arrowR'} size={18} stroke={2} />}
        </Button>

        {!agreed && (
          <p className="t-caption" style={{ textAlign: 'center', margin: '10px 0 0', color: shake ? 'var(--brand-secondary)' : 'var(--ink-3)', transition: 'color .2s' }}>
            {t('auth_must_agree')}
          </p>
        )}

        {(mode === 'user' || (mode === 'guest' && !!helpText)) && (
          <button style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 0, cursor: 'pointer', color: 'var(--brand-primary)', fontWeight: 700, fontSize: 13.5 }}>
            {mode === 'user' ? t('auth_create') : helpText}
          </button>
        )}

        {showPrivacy && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: 24, padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
            <Icon name="shield" size={18} color="var(--brand-secondary)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p className="t-caption" style={{ margin: 0, lineHeight: 1.45 }}>{t('login_privacy')}</p>
          </div>
        )}
      </div>

      {showAgreement && <AgreementModal onClose={() => setShowAgreement(false)} agreement={login?.agreement} />}
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
  events: AidaEvent[];
}

export function Home({ guest, joined, onJoin, onNav, onOpenEvent, onOpenDining, onOpenSpa, onReception, onSurvey, events }: HomeProps) {
  const { t } = useLang();
  const today = events.filter((e) => e.day === 'today');
  const openExperience = (x: Experience) => {
    const ev = events.find((e) => e.id === x.ref);
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
        <TonightHero item={AIDA_TONIGHT} onReserve={() => { const e = today[0] ?? events[0]; if (e) onOpenEvent(e); }} />

        <RowHead title={t('h_dining')} action={t('see_all')} onAction={() => onNav('explore-dining')} />
        <div style={{ marginBottom: 34 }}>
          <Rail peek="80%">{AIDA_DINING.filter((d) => d.type === 'restaurant').map((d) => <DiningCard key={d.id} d={d} onOpen={onOpenDining} />)}</Rail>
        </div>

        <RowHead title={t('h_spa')} action={t('see_all')} onAction={() => onNav('explore-spa')} />
        <div style={{ marginBottom: 34 }}>
          <Rail peek="80%">{AIDA_SPA.map((s) => <SpaCard key={s.id} s={s} onOpen={onOpenSpa} />)}</Rail>
        </div>

        {today.length > 0 && (
          <>
            <RowHead title={t('h_today_act')} action={t('see_all')} onAction={() => onNav('events')} />
            <div style={{ marginBottom: 34 }}>
              <Rail peek="80%">{today.map((ev) => <EventCard key={ev.id} ev={ev} onOpen={onOpenEvent} joined={joined.has(ev.id)} onJoin={onJoin} />)}</Rail>
            </div>
          </>
        )}

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

/* ---------------- Events ---------------- */
export function Events({
  joined,
  onJoin,
  onOpenEvent,
  events,
}: {
  joined: Set<string>;
  onJoin: (e: AidaEvent) => void;
  onOpenEvent: (e: AidaEvent) => void;
  events: AidaEvent[];
}) {
  const { t } = useLang();
  const [filter, setFilter] = useState<'today' | 'upcoming' | 'all'>('today');
  const chips: Array<{ id: 'today' | 'upcoming' | 'all'; label: string }> = [
    { id: 'today', label: t('ev_today') },
    { id: 'upcoming', label: t('ev_upcoming') },
    { id: 'all', label: t('ev_all') },
  ];
  const items = events.filter((ev) => {
    if (filter === 'all') return true;
    if (filter === 'today') return ev.day === 'today';
    return ev.day === 'tomorrow' || ev.day === 'later';
  });

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 22px 104px' }} className="no-scrollbar">
        <h1 style={{ margin: '6px 0 18px', fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 600, color: 'var(--ink)', lineHeight: 1, letterSpacing: '-.02em' }}>
          {t('ev_title')}
        </h1>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {chips.map((chip) => {
            const active = chip.id === filter;
            return (
              <button
                key={chip.id}
                onClick={() => setFilter(chip.id)}
                style={{
                  border: active ? '1px solid transparent' : '1px solid color-mix(in srgb, var(--brand-accent) 26%, var(--line-2))',
                  background: active ? 'var(--ink)' : 'var(--surface)',
                  color: active ? '#fff' : 'var(--ink-2)',
                  borderRadius: 'var(--r-pill)',
                  padding: '13px 22px',
                  fontSize: 15,
                  fontWeight: 700,
                  lineHeight: 1,
                  cursor: 'pointer',
                  boxShadow: active ? 'none' : '0 1px 0 rgba(255,255,255,.78) inset',
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--ink-2)' }}>
              <p className="t-body" style={{ margin: 0 }}>{t('ev_empty')}</p>
            </div>
          ) : (
            items.map((ev) => (
              <EventCard
                key={ev.id}
                ev={ev}
                onOpen={onOpenEvent}
                joined={joined.has(ev.id)}
                onJoin={onJoin}
                layout="list"
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function EventJoinConfirm({
  ev,
  onConfirm,
  onCancel,
  loading,
  done,
}: {
  ev: AidaEvent;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  done: boolean;
}) {
  const { lang } = useLang();
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 70, display: 'grid', placeItems: 'center', padding: 24, background: 'rgba(20,28,30,.5)', backdropFilter: 'blur(3px)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 360, padding: 24, textAlign: 'center' }}>
        {done ? (
          <>
            <div style={{ width: 56, height: 56, margin: '0 auto 14px', borderRadius: 16, display: 'grid', placeItems: 'center', background: 'color-mix(in srgb, var(--success, #22c55e) 14%, var(--surface))', color: 'var(--success, #22c55e)' }}>
              <Icon name="check" size={26} stroke={2} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: 23, fontWeight: 600, color: 'var(--ink)' }}>
              {L({ en: 'You\'re registered!', tr: 'Kayıt olundu!', de: 'Angemeldet!', ru: 'Вы зарегистрированы!' }, lang)}
            </h3>
            <p className="t-body" style={{ margin: '0 0 20px' }}>
              {L({ en: 'Your spot is reserved. See you there!', tr: 'Yeriniz ayrıldı. Görüşürüz!', de: 'Ihr Platz ist reserviert. Bis dann!', ru: 'Ваше место зарезервировано. До встречи!' }, lang)}
            </p>
            <button onClick={onCancel} style={{ padding: '14px 28px', border: 'none', borderRadius: 'var(--r-md)', background: 'var(--brand-primary)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              {L({ en: 'Close', tr: 'Kapat', de: 'Schließen', ru: 'Закрыть' }, lang)}
            </button>
          </>
        ) : (
          <>
            <div style={{ width: 56, height: 56, margin: '0 auto 14px', borderRadius: 16, display: 'grid', placeItems: 'center', background: 'color-mix(in srgb, var(--brand-secondary) 14%, var(--surface))', color: 'var(--brand-secondary)' }}>
              <Icon name="calPlus" size={26} stroke={1.8} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: 23, fontWeight: 600, color: 'var(--ink)' }}>
              {L({ en: 'Join this event?', tr: 'Bu etkinliğe katılmak istiyor musunuz?', de: 'An diesem Event teilnehmen?', ru: 'Участвовать в мероприятии?' }, lang)}
            </h3>
            <p className="t-body" style={{ margin: '0 0 20px' }}>
              {L({ en: 'We\'ll save your spot.', tr: 'Yerinizi ayıracağız.', de: 'Wir reservieren Ihren Platz.', ru: 'Мы сохраним ваше место.' }, lang)}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={onConfirm}
                disabled={loading}
                style={{ padding: '14px', border: 'none', borderRadius: 'var(--r-md)', background: 'var(--brand-primary)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1 }}
              >
                {loading
                  ? L({ en: 'Registering…', tr: 'Kaydediliyor…', de: 'Wird angemeldet…', ru: 'Регистрация…' }, lang)
                  : L({ en: 'Yes, join', tr: 'Evet, katıl', de: 'Ja, teilnehmen', ru: 'Да, участвовать' }, lang)}
              </button>
              <button onClick={onCancel} disabled={loading} style={{ padding: '12px', border: 0, background: 'none', color: 'var(--ink-2)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                {L({ en: 'No thanks', tr: 'Hayır, teşekkürler', de: 'Nein, danke', ru: 'Нет, спасибо' }, lang)}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function EventSheet({
  open,
  onClose,
  ev,
  joined,
  onJoin,
  onRegister,
}: {
  open: boolean;
  onClose: () => void;
  ev: AidaEvent | null;
  joined: boolean;
  onJoin: (e: AidaEvent) => void;
  onRegister?: (eventId: string) => Promise<{ ok: boolean }>;
}) {
  const { lang, t } = useLang();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (!open) { setConfirmOpen(false); setRegistering(false); setRegistered(false); }
  }, [open]);

  if (!ev) return null;

  const handleRegisterConfirm = async () => {
    if (!onRegister) return;
    setRegistering(true);
    const res = await onRegister(ev.id);
    setRegistering(false);
    if (res.ok) setRegistered(true);
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div style={{ padding: '4px 0 0' }}>
        <div style={{ height: 230, position: 'relative' }}>
          <Ph token={ev.ph} photo={ev.photo} w={900} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 45%, rgba(20,12,6,.66))', pointerEvents: 'none' }} />
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 14,
              right: 16,
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'rgba(255,255,255,.2)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,.3)',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
            }}
          >
            <Icon name="close" size={18} />
          </button>
          <div style={{ position: 'absolute', left: 22, right: 22, bottom: 16 }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: '#fff', lineHeight: 1.08 }}>
              {L(ev.title, lang)}
            </h3>
          </div>
        </div>

        <div style={{ padding: '20px 22px 0' }}>
          <div style={{ display: 'flex', gap: 24, marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span className="t-caption" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon name="clock" size={13} />
                {t('ev_when')}
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>{ev.time}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span className="t-caption" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon name="pin" size={13} />
                {t('ev_where')}
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>{L(ev.place, lang)}</span>
            </div>
            {ev.capacity != null && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span className="t-caption" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="user" size={13} />
                  {L({ en: 'Capacity', tr: 'Kapasite', de: 'Kapazität', ru: 'Вместимость' }, lang)}
                </span>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>{ev.capacity}</span>
              </div>
            )}
          </div>

          <div className="t-eyebrow" style={{ marginBottom: 8 }}>{t('ev_about')}</div>
          <p className="t-body" style={{ marginTop: 0, marginBottom: 22 }}>{L(ev.desc, lang)}</p>

          <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
            <Button
              variant={joined ? 'secondary' : 'primary'}
              block
              onClick={() => onJoin(ev)}
              icon={joined ? 'check' : 'calPlus'}
            >
              {joined ? t('b_added') : t('b_add_cal')}
            </Button>
            {ev.registrationRequired && (
              <Button
                variant="primary"
                block
                onClick={() => setConfirmOpen(true)}
                icon={registered ? 'check' : 'arrowR'}
                style={{ background: registered ? 'var(--success, #22c55e)' : 'var(--brand-secondary)' }}
              >
                {registered
                  ? L({ en: 'Registered', tr: 'Kayıt olundu', de: 'Angemeldet', ru: 'Зарегистрировано' }, lang)
                  : L({ en: 'Join', tr: 'Katıl', de: 'Teilnehmen', ru: 'Участвовать' }, lang)}
              </Button>
            )}
          </div>
          {confirmOpen && (
            <EventJoinConfirm
              ev={ev}
              onConfirm={handleRegisterConfirm}
              onCancel={() => { setConfirmOpen(false); if (registered) onClose(); }}
              loading={registering}
              done={registered}
            />
          )}
        </div>
      </div>
    </Sheet>
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
