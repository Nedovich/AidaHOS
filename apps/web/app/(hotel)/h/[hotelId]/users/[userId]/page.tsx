import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Clock, Hotel as HotelIcon, KeyRound, Mail, Monitor, Pencil, ShieldAlert, Smartphone, Power } from 'lucide-react';
import {
  getHotelById,
  getHotelGroupById,
  getHotelsForGroup,
  getUserById,
  getUserMemberships,
} from '@aidahos/db';
import { getSession } from '@/lib/auth';
import { getLang } from '@/lib/i18n-server';
import { L, type Lang } from '@/lib/i18n';
import { avatarColor, initials } from '@/lib/avatar';
import { UserForm } from '@/components/console/user-form';
import { updateGroupUser } from '../actions';

const ROLE: Record<string, [string, readonly [string, string]]> = {
  super_admin: ['purple', ['Süper Admin', 'Super Admin']],
  admin: ['accent', ['Grup Yöneticisi', 'Group Manager']],
  user: ['info', ['Otel Yöneticisi', 'Hotel Manager']],
  customer: ['mute', ['Müşteri', 'Customer']],
};
const STATUS_BADGE = (banned: boolean, lang: Lang) => (
  <span className={`badge badge--${banned ? 'warn' : 'ok'}`}>
    <span className="ico-dot" />
    {banned ? L(['Askıda', 'Suspended'], lang) : L(['Aktif', 'Active'], lang)}
  </span>
);

function StatRow({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="stat-row">
      <span className="stat-row__k">{k}</span>
      <span className={`stat-row__v${mono ? ' mono' : ''}`}>{v}</span>
    </div>
  );
}
function Kpi({ icon, label, value, iconBg, iconColor }: { icon: React.ReactNode; label: string; value: string | number; iconBg?: string; iconColor?: string }) {
  return (
    <div className="kpi">
      <div className="kpi__top">
        <div className="kpi__ico" style={iconBg ? { background: iconBg, color: iconColor } : undefined}>{icon}</div>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, letterSpacing: '-1px' }}>{value}</div>
    </div>
  );
}

export default async function AdminUserDetail({
  params,
  searchParams,
}: {
  params: Promise<{ hotelId: string; userId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { hotelId, userId } = await params;
  const { tab = 'overview' } = await searchParams;
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'admin') redirect(`/h/${hotelId}/dashboard`);

  const lang: Lang = await getLang();
  const current = await getHotelById(hotelId);
  if (!current) redirect('/no-hotel');
  const groupId = current.hotelGroupId;

  const user = await getUserById(userId);
  if (!user) redirect(`/h/${hotelId}/users`);

  // Security: the target user must belong to the admin's group.
  const mems = await getUserMemberships(userId);
  const m = mems.find((x) => x.hotelGroupId === groupId);
  if (!m) redirect(`/h/${hotelId}/users`);

  const [group, groupHotels] = await Promise.all([
    getHotelGroupById(groupId),
    getHotelsForGroup(groupId),
  ]);
  const accessHotels = m.hotelId
    ? groupHotels.filter((h) => h.id === m.hotelId)
    : m.scope === 'hotel_group'
      ? groupHotels
      : [];

  const targetRole = (m.role ?? user.role) as string;
  const color = avatarColor(user.id);
  const r = ROLE[targetRole] ?? ['mute', [targetRole, targetRole]];
  const lastLogin = user.createdAt.toISOString().slice(0, 10);

  const TABS: [string, readonly [string, string]][] = [
    ['overview', ['Genel Bakış', 'Overview']],
    ['edit', ['Düzenle', 'Edit']],
  ];

  return (
    <>
      <div className="header__crumb" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
        <Link href={`/h/${hotelId}/users`} className="row-link" style={{ color: 'var(--text-3)' }}>{L(['Kullanıcılar', 'Users'], lang)}</Link>
        <span>›</span>
        <span style={{ color: 'var(--text)' }}>{user.name}</span>
      </div>

      <div className="acct-detail-head">
        <div className="acct-detail-head__logo" style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)`, fontSize: 20 }}>
          {initials(user.name)}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 className="page-hero__h" style={{ fontSize: 'var(--text-2xl)' }}>{user.name}</h1>
            {STATUS_BADGE(user.banned, lang)}
            <span className={`badge badge--${r[0]}`}>{L(r[1], lang)}</span>
          </div>
          <div className="cell-sub" style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <Mail size={14} /> <span className="mono">{user.email}</span>
            {group && <> · <span style={{ color: 'var(--accent)' }}>{group.name}</span></>}
          </div>
        </div>
        <div className="page-hero__actions">
          <Link className="btn btn--primary" href={`/h/${hotelId}/users/${user.id}?tab=edit`}>
            <Pencil size={16} /> {L(['Düzenle', 'Edit'], lang)}
          </Link>
        </div>
      </div>

      <div className="tabbar">
        {TABS.map(([t, label]) => (
          <Link key={t} href={`/h/${hotelId}/users/${user.id}?tab=${t}`} className={`tab${t === tab ? ' active' : ''}`}>
            {L(label, lang)}
          </Link>
        ))}
      </div>

      {tab === 'edit' ? (
        <UserForm
          mode="edit"
          embedded
          action={updateGroupUser.bind(null, hotelId, user.id)}
          groups={group ? [{ id: group.id, name: group.name }] : []}
          hotels={groupHotels.map((h) => ({ id: h.id, name: h.name }))}
          roles={targetRole === 'admin' ? ['admin'] : ['user']}
          backHref={`/h/${hotelId}/users`}
          defaults={{ name: user.name, email: user.email, role: targetRole as 'admin' | 'user', banned: user.banned, hotelGroupId: groupId, hotelId: m.hotelId ?? null }}
        />
      ) : (
        <>
          <div className="grid grid--kpi" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 'var(--sp-5)' }}>
            <Kpi icon={<KeyRound size={18} />} label={L(['Rol', 'Role'], lang)} value={L(r[1], lang)} />
            <Kpi icon={<ShieldAlert size={18} />} label="MFA" value={L(['Kapalı', 'Off'], lang)} iconBg="var(--warning-soft)" iconColor="var(--warning)" />
            <Kpi icon={<HotelIcon size={18} />} label={L(['Otel erişimi', 'Hotel access'], lang)} value={accessHotels.length || '—'} />
            <Kpi icon={<Clock size={18} />} label={L(['Son giriş', 'Last login'], lang)} value={lastLogin} />
          </div>

          <div className="grid grid--2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
              <div className="card">
                <div className="card__head">
                  <div className="card__title">{L(['Profil', 'Profile'], lang)}</div>
                  <Link className="btn btn--sm btn--subtle" href={`/h/${hotelId}/users/${user.id}?tab=edit`}>
                    <Pencil size={14} /> {L(['Düzenle', 'Edit'], lang)}
                  </Link>
                </div>
                <div className="card__body" style={{ paddingTop: 6 }}>
                  <StatRow k={L(['Ad Soyad', 'Full name'], lang)} v={user.name} />
                  <StatRow k={L(['E-posta', 'Email'], lang)} v={user.email} mono />
                  <StatRow k={L(['Hesap', 'Account'], lang)} v={group ? group.name : '—'} />
                  <StatRow k={L(['Rol', 'Role'], lang)} v={<span className={`badge badge--${r[0]}`}>{L(r[1], lang)}</span>} />
                  <StatRow k={L(['Durum', 'Status'], lang)} v={STATUS_BADGE(user.banned, lang)} />
                  <StatRow k={L(['Oluşturma', 'Created'], lang)} v={lastLogin} />
                  <StatRow k={L(['Kullanıcı ID', 'User ID'], lang)} v={`usr_${user.id.slice(0, 8)}`} mono />
                </div>
              </div>

              <div className="card">
                <div className="card__head">
                  <div>
                    <div className="card__title">{L(['Otel erişimi', 'Hotel access'], lang)}</div>
                    <div className="card__sub">{accessHotels.length ? `${accessHotels.length} ${L(['otel', 'hotels'], lang)}` : L(['Otel atanmadı', 'No hotels assigned'], lang)}</div>
                  </div>
                </div>
                <div className="card__body" style={{ paddingTop: 6 }}>
                  {accessHotels.length ? (
                    accessHotels.map((h) => (
                      <div key={h.id} className="integ">
                        <div className="integ__ico" style={{ background: `${h.color}1a`, color: h.color }}>{initials(h.name)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="integ__name">{h.name}</div>
                          <div className="cell-sub">{h.region ?? h.slug}</div>
                        </div>
                        <span className="badge badge--mute">{h.status}</span>
                      </div>
                    ))
                  ) : (
                    <div className="empty"><div style={{ color: 'var(--text-3)' }}>{L(['Bu kullanıcıya otel atanmamış.', 'No hotels assigned to this user.'], lang)}</div></div>
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card__head">
                <div>
                  <div className="card__title">{L(['Güvenlik & oturumlar', 'Security & sessions'], lang)}</div>
                  <div className="card__sub">{L(['Aktif cihazlar', 'Active devices'], lang)}</div>
                </div>
                <button className="btn btn--sm btn--subtle"><Power size={14} /> {L(['Tümünü kapat', 'Revoke all'], lang)}</button>
              </div>
              <div className="card__body" style={{ paddingTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', marginBottom: 6, borderBottom: '1px solid var(--border-faint)' }}>
                  <ShieldAlert size={18} style={{ color: 'var(--warning)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{L(['İki adımlı doğrulama', 'Two-factor auth'], lang)}</div>
                    <div className="cell-sub">{L(['Etkin değil — risk', 'Not enabled — at risk'], lang)}</div>
                  </div>
                  <span className="badge badge--warn"><span className="ico-dot" />{L(['Kapalı', 'Off'], lang)}</span>
                </div>
                {[
                  { dev: 'MacBook Pro · Chrome', icon: <Monitor size={16} />, loc: 'İstanbul, TR', ip: '85.34.12.9', cur: true, when: lastLogin },
                  { dev: 'iPhone 15 · AIDA App', icon: <Smartphone size={16} />, loc: group?.region ?? '—', ip: '85.34.12.40', cur: false, when: L(['dün', 'yesterday'], lang) },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', borderTop: '1px solid var(--border-faint)' }}>
                    <div className="integ__ico" style={{ background: 'var(--surface-3)', color: 'var(--text-2)' }}>{s.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>
                        {s.dev}
                        {s.cur && <span className="set-pill" style={{ background: 'var(--success-soft)', color: 'var(--success)', marginLeft: 4 }}>{L(['bu cihaz', 'this device'], lang)}</span>}
                      </div>
                      <div className="cell-sub">{s.loc} · <span className="mono">{s.ip}</span> · {s.when}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
