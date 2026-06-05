'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@aidahos/auth/client';
import { ArrowRight, BarChart3, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, Wifi } from 'lucide-react';
import { L, type Lang } from '@/lib/i18n';

const AidaMark = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M12 3 4 19h3.2l1.2-2.6h7.2L16.8 19H20L12 3zm-2.1 10.7L12 8.9l2.1 4.8H9.9z" fill="#EAF7FA" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('tr');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const m = document.cookie.match(/(?:^|; )aida-lang=(tr|en)/);
    if (m) setLang(m[1] as Lang);
  }, []);
  const applyLang = (l: Lang) => {
    setLang(l);
    document.cookie = `aida-lang=${l};path=/;max-age=31536000`;
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      setError(error.message ?? L(['Giriş başarısız', 'Sign-in failed'], lang));
      setLoading(false);
      return;
    }
    const { data } = await authClient.getSession();
    router.push(data?.user?.role === 'super_admin' ? '/dashboard' : '/');
    router.refresh();
  }

  const pill = (l: Lang) => ({
    border: 0,
    cursor: 'pointer',
    borderRadius: 99,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '.04em',
    background: lang === l ? 'var(--accent)' : 'transparent',
    color: lang === l ? '#fff' : 'var(--ink-2)',
  } as React.CSSProperties);
  const LangPills = () => (
    <div style={{ display: 'flex', gap: 6, background: 'var(--surface-2)', padding: 5, borderRadius: 99, border: '1px solid var(--line)' }}>
      <button type="button" style={pill('tr')} onClick={() => applyLang('tr')}>TR</button>
      <button type="button" style={pill('en')} onClick={() => applyLang('en')}>EN</button>
    </div>
  );

  return (
    <div className="auth" data-mode="login" data-theme="light">
      <div className="auth__brand">
        <div className="auth__logo">
          <div className="auth__mark">
            <AidaMark />
          </div>
          <div>
            <div className="auth__word">AIDA</div>
            <div className="auth__tagline">Hotel Operating System</div>
          </div>
        </div>

        <div className="auth__hero">
          <h1>
            {L(['Otel teknolojisini ', 'Manage hotel technology '], lang)}
            <em>{L(['tek panelden', 'from one console'], lang)}</em>
            {L([' yönetin.', '.'], lang)}
          </h1>
          <p>
            {L(
              ['Hotspot ekranları, FreeRADIUS kullanıcıları, MikroTik ağları ve misafir portalı — hepsi AIDA’da. Çoklu otel, çok kullanıcılı yönetim.',
                'Hotspot screens, FreeRADIUS users, MikroTik networks and the guest portal — all in AIDA. Multi-hotel, multi-user management.'],
              lang,
            )}
          </p>

          <div className="auth__points">
            <div className="auth__point">
              <span className="auth__point-ico"><Wifi /></span>
              {L(['MikroTik & FreeRADIUS provisioning', 'MikroTik & FreeRADIUS provisioning'], lang)}
            </div>
            <div className="auth__point">
              <span className="auth__point-ico"><ShieldCheck /></span>
              {L(['Rol bazlı erişim ve kullanıcı taklidi', 'Role-based access and impersonation'], lang)}
            </div>
            <div className="auth__point">
              <span className="auth__point-ico"><BarChart3 /></span>
              {L(['Operasyon analitiği ve misafir deneyimi', 'Operations analytics and guest experience'], lang)}
            </div>
          </div>

          <div className="auth__quote">
            <p>{L(['“AIDA, otel grubumuzun tüm teknik altyapısını tek yerden yönetmemizi sağladı.”', '“AIDA lets us run our whole group’s tech stack from one place.”'], lang)}</p>
            <div className="auth__quote-by">
              <div className="auth__quote-av">EO</div>
              <div>
                <div className="auth__quote-name">Esken Otel Group</div>
                <div className="auth__quote-role">{L(['IT Direktörü', 'IT Director'], lang)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth__panel">
        <div className="auth__topbar">
          <div className="auth__sp" />
          <LangPills />
        </div>
        <div className="auth__form-wrap">
          <div className="auth__head">
            <span className="auth__kicker">
              <Sparkles />
              {L(['Yönetim Paneli', 'Admin Console'], lang)}
            </span>
            <h1 className="auth__title">{L(['Tekrar hoş geldiniz', 'Welcome back'], lang)}</h1>
            <p className="auth__sub">{L(['Devam etmek için hesabınızla oturum açın.', 'Sign in to your account to continue.'], lang)}</p>
          </div>

          <form className="auth__form" onSubmit={onSubmit}>
            <div className="fld">
              <label className="fld__l">{L(['E-posta', 'Email'], lang)}</label>
              <div className="fld__box">
                <span className="fld__ico"><Mail /></span>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@otel.com" autoComplete="email" />
              </div>
            </div>

            <div className="fld">
              <label className="fld__l">
                {L(['Parola', 'Password'], lang)}
                <a className="fld__link" href="#">{L(['Şifremi unuttum', 'Forgot password'], lang)}</a>
              </label>
              <div className="fld__box">
                <span className="fld__ico"><Lock /></span>
                <input type={show ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
                <button type="button" className="fld__eye" onClick={() => setShow((s) => !s)}>
                  {show ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {error && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--danger)', fontWeight: 500 }}>{error}</div>}

            <button type="submit" className="auth__submit" disabled={loading}>
              {loading ? L(['Giriş yapılıyor…', 'Signing in…'], lang) : L(['Giriş yap', 'Sign in'], lang)}
              {!loading && <ArrowRight />}
            </button>
          </form>

          <p className="auth__legal">
            {L(['Hesaplar yöneticiler tarafından oluşturulur. Erişim için otel yöneticinizle iletişime geçin.',
              'Accounts are created by administrators. Contact your hotel administrator for access.'], lang)}
          </p>
        </div>
      </div>
    </div>
  );
}
