'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@aidahos/auth/client';
import { ArrowRight, BarChart3, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, Wifi } from 'lucide-react';

const AidaMark = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M12 3 4 19h3.2l1.2-2.6h7.2L16.8 19H20L12 3zm-2.1 10.7L12 8.9l2.1 4.8H9.9z" fill="#EAF7FA" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      setError(error.message ?? 'Giriş başarısız');
      setLoading(false);
      return;
    }
    const { data } = await authClient.getSession();
    router.push(data?.user?.role === 'super_admin' ? '/dashboard' : '/');
    router.refresh();
  }

  return (
    <div className="auth" data-mode="login" data-theme="light">
      {/* ---- brand showcase ---- */}
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
            Otel teknolojisini <em>tek panelden</em> yönetin.
          </h1>
          <p>
            Hotspot ekranları, FreeRADIUS kullanıcıları, MikroTik ağları ve misafir portalı —
            hepsi AIDA&apos;da. Çoklu otel, çok kullanıcılı yönetim.
          </p>

          <div className="auth__points">
            <div className="auth__point">
              <span className="auth__point-ico">
                <Wifi />
              </span>
              MikroTik & FreeRADIUS provisioning
            </div>
            <div className="auth__point">
              <span className="auth__point-ico">
                <ShieldCheck />
              </span>
              Rol bazlı erişim ve kullanıcı taklidi
            </div>
            <div className="auth__point">
              <span className="auth__point-ico">
                <BarChart3 />
              </span>
              Operasyon analitiği ve misafir deneyimi
            </div>
          </div>

          <div className="auth__quote">
            <p>
              {'“AIDA, otel grubumuzun tüm teknik altyapısını tek yerden yönetmemizi sağladı.”'}
            </p>
            <div className="auth__quote-by">
              <div className="auth__quote-av">EO</div>
              <div>
                <div className="auth__quote-name">Esken Otel Group</div>
                <div className="auth__quote-role">IT Direktörü</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- form panel ---- */}
      <div className="auth__panel">
        <div className="auth__form-wrap">
          <div className="auth__head">
            <span className="auth__kicker">
              <Sparkles />
              Yönetim Paneli
            </span>
            <h1 className="auth__title">Tekrar hoş geldiniz</h1>
            <p className="auth__sub">Devam etmek için hesabınızla oturum açın.</p>
          </div>

          <form className="auth__form" onSubmit={onSubmit}>
            <div className="fld">
              <label className="fld__l">E-posta</label>
              <div className="fld__box">
                <span className="fld__ico">
                  <Mail />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@otel.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="fld">
              <label className="fld__l">
                Parola
                <a className="fld__link" href="#">
                  Şifremi unuttum
                </a>
              </label>
              <div className="fld__box">
                <span className="fld__ico">
                  <Lock />
                </span>
                <input
                  type={show ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button type="button" className="fld__eye" onClick={() => setShow((s) => !s)}>
                  {show ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--danger)', fontWeight: 500 }}>
                {error}
              </div>
            )}

            <button type="submit" className="auth__submit" disabled={loading}>
              {loading ? 'Giriş yapılıyor…' : 'Giriş yap'}
              {!loading && <ArrowRight />}
            </button>
          </form>

          <p className="auth__legal">
            Hesaplar yöneticiler tarafından oluşturulur. Erişim için otel yöneticinizle iletişime
            geçin.
          </p>
        </div>
      </div>
    </div>
  );
}
