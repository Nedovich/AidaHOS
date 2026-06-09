import { redirect } from 'next/navigation';
import { Building2, Hotel, Users, Clock } from 'lucide-react';
import { schema, listUsersByRole, recentAudit } from '@aidahos/db';
import { getSession, withTenantDb } from '@/lib/auth';
import { getLang } from '@/lib/i18n-server';
import { L } from '@/lib/i18n';
import { SignOutButton } from '@/components/sign-out-button';
import { SubmitButton } from '@/components/console/submit-button';
import { impersonate } from '../actions';

export default async function SuperDashboard() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'super_admin') redirect('/');

  const lang = await getLang();
  // Run independent reads concurrently (each is a remote round trip). hotels+groups
  // share one tenant transaction; admins + audit run in parallel alongside.
  const [tenantRows, admins, audit] = await Promise.all([
    withTenantDb((tx) => Promise.all([tx.select().from(schema.hotels), tx.select().from(schema.hotelGroups)])),
    listUsersByRole('admin'),
    recentAudit(6),
  ]);
  const [hotels, groups] = tenantRows ?? [[], []];

  const kpis = [
    { icon: Building2, label: L(['Otel Grupları', 'Hotel Groups'], lang), value: groups.length },
    { icon: Hotel, label: L(['Oteller', 'Hotels'], lang), value: hotels.length },
    { icon: Users, label: L(['Adminler', 'Admins'], lang), value: admins.length },
  ];

  return (
    <>
      <div className="page-hero">
        <div>
          <h1 className="page-hero__h">
            {L(['Genel', 'General'], lang)} <span className="accent-serif">{L(['Bakış', 'Overview'], lang)}</span>
          </h1>
          <p className="page-hero__sub">{L(['Platform geneli hesaplar, oteller ve sistem durumu.', 'Platform-wide accounts, hotels and system status.'], lang)}</p>
        </div>
        <div className="page-hero__actions">
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>{session.user.email}</span>
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
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', fontWeight: 600 }}>{k.label}</span>
              </div>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 600, letterSpacing: '-1px', fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
            </div>
          );
        })}
      </div>

      <div className="card mt-6">
        <div className="card__head">
          <div>
            <div className="card__title">{L(['Oteller', 'Hotels'], lang)}</div>
            <div className="card__sub">{L(['Tüm tesisler (RLS: süper yönetici tümünü görür)', 'All properties (RLS: super admin sees all)'], lang)}</div>
          </div>
        </div>
        <div className="card__body">
          <table className="table">
            <thead>
              <tr>
                <th>{L(['Otel', 'Hotel'], lang)}</th>
                <th>Slug</th>
                <th>{L(['Durum', 'Status'], lang)}</th>
              </tr>
            </thead>
            <tbody>
              {hotels.map((h) => (
                <tr key={h.id}>
                  <td>
                    <div className="table__name">
                      <div className="table__logo" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
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
                    {L(['Henüz otel yok.', 'No hotels yet.'], lang)}
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
              <div className="card__title">{L(['Kullanıcı taklidi', 'Impersonation'], lang)}</div>
              <div className="card__sub">{L(['Bir admin olarak görüntüle', 'View as an admin'], lang)}</div>
            </div>
          </div>
          <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {admins.map((u) => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div className="table__name">
                  <div className="table__logo" style={{ background: 'var(--surface-3)', color: 'var(--text-2)' }}>
                    {(u.name ?? 'A').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>{u.email}</div>
                  </div>
                </div>
                <form action={impersonate.bind(null, u.id)}>
                  <SubmitButton className="btn btn--subtle btn--sm">
                    {L(['Taklit et', 'Impersonate'], lang)}
                  </SubmitButton>
                </form>
              </div>
            ))}
            {admins.length === 0 && <p style={{ color: 'var(--text-3)' }}>{L(['Admin kullanıcı yok.', 'No admin users.'], lang)}</p>}
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <div>
              <div className="card__title">{L(['Son denetim', 'Recent audit'], lang)}</div>
              <div className="card__sub">{L(['Impersonation & provisioning', 'Impersonation & provisioning'], lang)}</div>
            </div>
          </div>
          <div className="card__body">
            <div className="audit-feed">
              {audit.map((a) => (
                <div className="audit-item" key={a.id}>
                  <div className="audit-ico" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
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
              {audit.length === 0 && <p style={{ color: 'var(--text-3)' }}>{L(['Kayıt yok.', 'No records.'], lang)}</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
