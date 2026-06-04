import { redirect } from 'next/navigation';
import { Building2, Hotel, Users, Shield, Clock } from 'lucide-react';
import { schema, listUsersByRole, recentAudit } from '@aidahos/db';
import { getSession, withTenantDb } from '@/lib/auth';
import { SignOutButton } from '@/components/sign-out-button';
import { impersonate } from '../actions';

export default async function SuperDashboard() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'super_admin') redirect('/');

  const hotels = (await withTenantDb((tx) => tx.select().from(schema.hotels))) ?? [];
  const groups = (await withTenantDb((tx) => tx.select().from(schema.hotelGroups))) ?? [];
  const admins = await listUsersByRole('admin');
  const audit = await recentAudit(6);

  const kpis = [
    { icon: Building2, label: 'Otel Grupları', value: groups.length },
    { icon: Hotel, label: 'Oteller', value: hotels.length },
    { icon: Users, label: 'Adminler', value: admins.length },
  ];

  return (
    <>
      <div className="page-hero">
        <div>
          <h1 className="page-hero__h">
            Genel <span className="accent-serif">Bakış</span>
          </h1>
          <p className="page-hero__sub">Platform geneli hesaplar, oteller ve sistem durumu.</p>
        </div>
        <div className="page-hero__actions">
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>
            {session.user.email}
          </span>
          <SignOutButton />
        </div>
      </div>

      <div className="grid grid--kpi">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div className="kpi" key={k.label}>
              <div className="kpi__top">
                <div className="kpi__ico">
                  <Icon size={18} />
                </div>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', fontWeight: 600 }}>
                  {k.label}
                </span>
              </div>
              <div
                style={{
                  fontSize: 'var(--text-3xl)',
                  fontWeight: 600,
                  letterSpacing: '-1px',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {k.value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card mt-6">
        <div className="card__head">
          <div>
            <div className="card__title">Oteller</div>
            <div className="card__sub">Tüm tesisler (RLS: süper yönetici tümünü görür)</div>
          </div>
        </div>
        <div className="card__body">
          <table className="table">
            <thead>
              <tr>
                <th>Otel</th>
                <th>Slug</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {hotels.map((h) => (
                <tr key={h.id}>
                  <td>
                    <div className="table__name">
                      <div
                        className="table__logo"
                        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                      >
                        {h.name.slice(0, 2).toUpperCase()}
                      </div>
                      <b>{h.name}</b>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-3)' }}>{h.slug}</td>
                  <td>
                    <span className="badge badge--warn">
                      <span className="ico-dot" />
                      {h.status}
                    </span>
                  </td>
                </tr>
              ))}
              {hotels.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                    Henüz otel yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid--2 mt-6">
        <div className="card">
          <div className="card__head">
            <div>
              <div className="card__title">Kullanıcı taklidi</div>
              <div className="card__sub">Bir admin olarak görüntüle</div>
            </div>
          </div>
          <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {admins.map((u) => (
              <div
                key={u.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div className="table__name">
                  <div
                    className="table__logo"
                    style={{ background: 'var(--surface-3)', color: 'var(--text-2)' }}
                  >
                    {(u.name ?? 'A').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>
                      {u.email}
                    </div>
                  </div>
                </div>
                <form action={impersonate.bind(null, u.id)}>
                  <button className="btn btn--subtle btn--sm" type="submit">
                    Taklit et
                  </button>
                </form>
              </div>
            ))}
            {admins.length === 0 && (
              <p style={{ color: 'var(--text-3)' }}>Admin kullanıcı yok.</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <div>
              <div className="card__title">Son denetim</div>
              <div className="card__sub">Impersonation & provisioning</div>
            </div>
          </div>
          <div className="card__body">
            <div className="audit-feed">
              {audit.map((a) => (
                <div className="audit-item" key={a.id}>
                  <div
                    className="audit-ico"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                  >
                    <Clock size={16} />
                  </div>
                  <div className="audit-b">
                    <div className="audit-text">
                      <b>{a.action}</b>
                    </div>
                    <div className="audit-meta">{a.createdAt.toISOString().slice(0, 19)}</div>
                  </div>
                </div>
              ))}
              {audit.length === 0 && <p style={{ color: 'var(--text-3)' }}>Kayıt yok.</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
