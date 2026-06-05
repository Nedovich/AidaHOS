import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Building2, CheckCircle2, CreditCard, ExternalLink, Hotel, Pencil, Sparkles, Users } from 'lucide-react';
import { getGroupMembers, getGroupOwner, getHotelGroupById, getHotelsForGroup, listAssignableUsers } from '@aidahos/db';
import { getSession } from '@/lib/auth';
import { getLang } from '@/lib/i18n-server';
import { L, type Lang } from '@/lib/i18n';
import { FEATURE_LABELS, fmtK, getPlan } from '@/lib/plans';
import { AccountForm } from '@/components/console/account-form';
import { impersonate } from '../../actions';
import { updateAccountAction } from '../actions';

const STATUS: Record<string, [string, readonly [string, string]]> = {
  active: ['ok', ['Aktif', 'Active']],
  trial: ['info', ['Deneme', 'Trial']],
  suspended: ['warn', ['Askıda', 'Suspended']],
  archived: ['mute', ['Arşiv', 'Archived']],
};

function StatRow({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="stat-row">
      <span className="stat-row__k">{k}</span>
      <span className={`stat-row__v${mono ? ' mono' : ''}`}>{v}</span>
    </div>
  );
}

function LimitBar({ label, used, limit }: { label: string; used: number; limit: number | '∞' }) {
  const inf = limit === '∞';
  const pct = inf ? 30 : limit ? Math.min(100, Math.round((used / (limit as number)) * 100)) : 0;
  const warn = !inf && pct >= 85;
  return (
    <div style={{ marginBottom: 15 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', marginBottom: 6 }}>
        <span style={{ color: 'var(--text-2)' }}>{label}</span>
        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
          {used.toLocaleString()}{inf ? '' : ' / ' + (limit as number).toLocaleString()}
        </span>
      </div>
      <div className="minibar">
        <div className="minibar__f" style={{ width: `${pct}%`, background: warn ? 'var(--warning)' : inf ? 'var(--success)' : 'var(--accent)' }} />
      </div>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="kpi">
      <div className="kpi__top">
        <div className="kpi__ico">{icon}</div>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, letterSpacing: '-1px', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

export default async function AccountDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = 'overview' } = await searchParams;
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'super_admin') redirect('/');

  const lang: Lang = await getLang();
  const group = await getHotelGroupById(id);
  if (!group) redirect('/accounts');
  const hotels = await getHotelsForGroup(group.id);
  const members = await getGroupMembers(group.id);
  const owner = await getGroupOwner(group.id);
  const assignable = tab === 'edit' ? await listAssignableUsers() : [];
  const plan = getPlan(group.plan);
  const st = STATUS[group.status] ?? ['mute', [group.status, group.status]];
  const adminMember = members.find((m) => m.role === 'admin');

  const TABS: [string, readonly [string, string]][] = [
    ['overview', ['Genel Bakış', 'Overview']],
    ['edit', ['Düzenle', 'Edit']],
    ['plan', ['Plan & Limitler', 'Plan & Limits']],
    ['invoices', ['Faturalar', 'Invoices']],
    ['activity', ['Aktivite', 'Activity']],
  ];

  return (
    <>
      <div className="header__crumb" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
        <Link href="/accounts" className="row-link" style={{ color: 'var(--text-3)' }}>
          {L(['Hesaplar', 'Accounts'], lang)}
        </Link>
        <span>›</span>
        <span style={{ color: 'var(--text)' }}>{group.name}</span>
      </div>

      <div className="acct-detail-head">
        <div className="acct-detail-head__logo" style={{ background: `linear-gradient(135deg, ${group.color}, ${group.color}aa)` }}>
          {group.name.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 className="page-hero__h" style={{ fontSize: 'var(--text-2xl)' }}>{group.name}</h1>
            <span className={`badge badge--${st[0]}`}>
              <span className="ico-dot" />
              {L(st[1], lang)}
            </span>
            <span className="plan-tag">
              <span className="plan-dot" style={{ background: plan.color }} />
              {plan.name}
            </span>
          </div>
          <div className="cell-sub" style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            {[group.region, group.ownerName].filter(Boolean).join(' · ')}
            {group.ownerEmail && <> · <span className="mono">{group.ownerEmail}</span></>}
          </div>
        </div>
        <div className="page-hero__actions">
          {adminMember && (group.status === 'active' || group.status === 'suspended') && (
            <form action={impersonate.bind(null, adminMember.id)}>
              <button className="btn btn--ghost" type="submit">
                <ExternalLink size={16} /> {L(['Hesaba gir', 'Impersonate'], lang)}
              </button>
            </form>
          )}
          <Link className="btn btn--primary" href={`/accounts/${group.id}?tab=edit`}>
            <Pencil size={16} /> {L(['Düzenle', 'Edit'], lang)}
          </Link>
        </div>
      </div>

      <div className="tabbar">
        {TABS.map(([t, label]) => (
          <Link key={t} href={`/accounts/${group.id}?tab=${t}`} className={`tab${t === tab ? ' active' : ''}`}>
            {L(label, lang)}
          </Link>
        ))}
      </div>

      {tab === 'edit' ? (
        <AccountForm
          mode="edit"
          embedded
          action={updateAccountAction.bind(null, group.id)}
          defaults={{ name: group.name, slug: group.slug, status: group.status, ownerUserId: owner?.id ?? null, region: group.region, plan: group.plan }}
          lang={lang}
          users={assignable}
        />
      ) : tab === 'plan' || tab === 'invoices' || tab === 'activity' ? (
        <div className="card">
          <div className="card__body empty">
            <div style={{ color: 'var(--text-3)' }}>{L(['Bu sekme yakında.', 'This tab is coming soon.'], lang)}</div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid--kpi" style={{ marginBottom: 'var(--sp-5)' }}>
            <Kpi icon={<Hotel size={18} />} label={L(['Otel', 'Hotels'], lang)} value={hotels.length || '—'} />
            <Kpi icon={<Users size={18} />} label={L(['Kullanıcı', 'Users'], lang)} value={members.length || '—'} />
            <Kpi icon={<CreditCard size={18} />} label="MRR" value={group.mrr ? '€' + group.mrr.toLocaleString() : '—'} />
            <Kpi icon={<Sparkles size={18} />} label={L(['AI kredisi', 'AI credits'], lang)} value={`${fmtK(group.aiUsed)} / ${fmtK(group.aiLimit)}`} />
          </div>

          <div className="grid grid--2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
              <div className="card">
                <div className="card__head">
                  <div className="card__title">{L(['Hesap bilgileri', 'Account details'], lang)}</div>
                </div>
                <div className="card__body" style={{ paddingTop: 6 }}>
                  <StatRow k={L(['Sahip', 'Owner'], lang)} v={group.ownerName ?? '—'} />
                  <StatRow k={L(['E-posta', 'Email'], lang)} v={group.ownerEmail ?? '—'} mono />
                  <StatRow k={L(['Bölge', 'Region'], lang)} v={group.region ?? '—'} />
                  <StatRow k={L(['Oluşturma', 'Created'], lang)} v={group.createdAt.toISOString().slice(0, 10)} />
                  <StatRow k="Plan" v={plan.name} />
                  <StatRow k={L(['Hesap ID', 'Account ID'], lang)} v={`org_${group.slug}`} mono />
                </div>
              </div>

              <div className="card">
                <div className="card__head">
                  <div>
                    <div className="card__title">{L(['Altyapı durumu', 'Infrastructure'], lang)}</div>
                    <div className="card__sub">{L(['Tüm sistemler sağlıklı', 'All systems healthy'], lang)}</div>
                  </div>
                </div>
                <div className="card__body" style={{ paddingTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--success)', padding: '8px 0' }}>
                    <CheckCircle2 size={18} />
                    <span style={{ color: 'var(--text-2)' }}>
                      {L(['PMS, RADIUS, MikroTik ve AI uç noktaları çalışıyor.', 'PMS, RADIUS, MikroTik and AI endpoints operational.'], lang)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card__head">
                <div>
                  <div className="card__title">{L(['Plan & kullanım', 'Plan & usage'], lang)}</div>
                  <div className="card__sub">{plan.name} · €{plan.price.toLocaleString()}/{L(['ay', 'mo'], lang)}</div>
                </div>
                <Link className="btn btn--sm btn--subtle" href={`/accounts/${group.id}?tab=plan`}>
                  {L(['Yönet', 'Manage'], lang)}
                </Link>
              </div>
              <div className="card__body" style={{ paddingTop: 14 }}>
                <LimitBar label={L(['Oteller', 'Hotels'], lang)} used={hotels.length} limit={plan.hotels} />
                <LimitBar label={L(['AI kredisi', 'AI credits'], lang)} used={group.aiUsed} limit={plan.credits} />
                <LimitBar label={L(['Kullanıcılar', 'Users'], lang)} used={members.length} limit={plan.users} />
                <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-faint)' }}>
                  <div className="card__sub" style={{ marginBottom: 10 }}>{L(['Açık modüller', 'Enabled modules'], lang)}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {plan.features.map((f) => (
                      <span key={f} className="set-pill" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                        {L(FEATURE_LABELS[f], lang)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
