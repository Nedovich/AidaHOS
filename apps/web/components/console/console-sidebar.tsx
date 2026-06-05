'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Clock,
  CreditCard,
  LayoutGrid,
  Layers,
  Router,
  Shield,
  Users,
  Hotel,
  type LucideIcon,
} from 'lucide-react';
import { L } from '@/lib/i18n';
import { useLang } from './lang-provider';

type Pair = readonly [string, string];
type NavItem = { id: string; icon: LucideIcon; label: Pair; href?: string; soon?: boolean };

const NAV: { group: Pair; items: NavItem[] }[] = [
  { group: ['Genel', 'Overview'], items: [{ id: 'dashboard', href: '/dashboard', icon: LayoutGrid, label: ['Genel Bakış', 'Dashboard'] }] },
  {
    group: ['Müşteriler', 'Customers'],
    items: [
      { id: 'accounts', href: '/accounts', icon: Building2, label: ['Hesaplar', 'Accounts'] },
      { id: 'users', href: '/users', icon: Users, label: ['Kullanıcılar', 'Users'] },
      { id: 'hotels', href: '/hotels', icon: Hotel, label: ['Oteller', 'Hotels'] },
      { id: 'radius', icon: Shield, label: ['Radius', 'Radius'], soon: true },
      { id: 'mikrotik', icon: Router, label: ['Mikrotik', 'Mikrotik'], soon: true },
    ],
  },
  {
    group: ['Gelir', 'Revenue'],
    items: [
      { id: 'billing', icon: CreditCard, label: ['Faturalama', 'Billing'], soon: true },
      { id: 'plans', icon: Layers, label: ['Planlar', 'Plans'], soon: true },
    ],
  },
  {
    group: ['Sistem', 'System'],
    items: [
      { id: 'infrastructure', icon: Router, label: ['Altyapı', 'Infrastructure'], soon: true },
      { id: 'audit', icon: Clock, label: ['Denetim', 'Audit'], soon: true },
    ],
  },
];

export function ConsoleSidebar({
  operator,
}: {
  operator: { name: string; role: Pair; initials: string };
}) {
  const pathname = usePathname();
  const lang = useLang();
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="brandmark ops">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 3 4 19h3.2l1.2-2.6h7.2L16.8 19H20L12 3zm-2.1 10.7L12 8.9l2.1 4.8H9.9z" fill="#fff" />
          </svg>
        </div>
        <div>
          <div className="brand__word">AIDA</div>
          <div className="brand__ops-tag">
            <Shield size={10} /> {L(['Süper Yönetici', 'Super Admin'], lang)}
          </div>
        </div>
      </div>

      <div className="operator">
        <div className="operator__av">{operator.initials}</div>
        <div className="operator__meta">
          <div className="operator__name">{operator.name}</div>
          <div className="operator__role">{L(operator.role, lang)}</div>
        </div>
      </div>

      <nav className="nav">
        {NAV.map((g) => (
          <div className="nav__group" key={g.group[0]}>
            <div className="nav__label">{L(g.group, lang)}</div>
            {g.items.map((it) => {
              const Icon = it.icon;
              if (it.soon) {
                return (
                  <div key={it.id} className="nav__item soon">
                    <Icon size={17} />
                    <span>{L(it.label, lang)}</span>
                    <span className="nav__badge">{L(['Yakında', 'Soon'], lang)}</span>
                  </div>
                );
              }
              const active = pathname === it.href || pathname.startsWith(it.href + '/');
              return (
                <Link key={it.id} href={it.href!} className={`nav__item${active ? ' active' : ''}`}>
                  <Icon size={17} />
                  <span>{L(it.label, lang)}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar__foot">
        <div className="usage">
          <div className="usage__top">
            <span className="usage__label">{L(['Sistem durumu', 'System status'], lang)}</span>
            <span className="usage__val" style={{ color: 'var(--success)' }}>
              {L(['çevrimiçi', 'online'], lang)}
            </span>
          </div>
          <div className="usage__bar">
            <div className="usage__fill" style={{ width: '100%' }} />
          </div>
        </div>
      </div>
    </aside>
  );
}
