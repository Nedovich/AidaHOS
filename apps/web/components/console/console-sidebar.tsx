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

type NavItem = { id: string; icon: LucideIcon; label: string; href?: string; soon?: boolean };

const NAV: { group: string; items: NavItem[] }[] = [
  { group: 'Genel', items: [{ id: 'dashboard', href: '/dashboard', icon: LayoutGrid, label: 'Genel Bakış' }] },
  {
    group: 'Müşteriler',
    items: [
      { id: 'accounts', icon: Building2, label: 'Hesaplar', soon: true },
      { id: 'users', icon: Users, label: 'Kullanıcılar', soon: true },
      { id: 'hotels', icon: Hotel, label: 'Oteller', soon: true },
      { id: 'radius', icon: Shield, label: 'Radius', soon: true },
      { id: 'mikrotik', icon: Router, label: 'Mikrotik', soon: true },
    ],
  },
  {
    group: 'Gelir',
    items: [
      { id: 'billing', icon: CreditCard, label: 'Faturalama', soon: true },
      { id: 'plans', icon: Layers, label: 'Planlar', soon: true },
    ],
  },
  {
    group: 'Sistem',
    items: [
      { id: 'infrastructure', icon: Router, label: 'Altyapı', soon: true },
      { id: 'audit', icon: Clock, label: 'Denetim', soon: true },
    ],
  },
];

export function ConsoleSidebar({
  operator,
}: {
  operator: { name: string; role: string; initials: string };
}) {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="brandmark ops">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3 4 19h3.2l1.2-2.6h7.2L16.8 19H20L12 3zm-2.1 10.7L12 8.9l2.1 4.8H9.9z"
              fill="#fff"
            />
          </svg>
        </div>
        <div>
          <div className="brand__word">AIDA</div>
          <div className="brand__ops-tag">
            <Shield size={10} /> Süper Yönetici
          </div>
        </div>
      </div>

      <div className="operator">
        <div className="operator__av">{operator.initials}</div>
        <div className="operator__meta">
          <div className="operator__name">{operator.name}</div>
          <div className="operator__role">{operator.role}</div>
        </div>
      </div>

      <nav className="nav">
        {NAV.map((g) => (
          <div className="nav__group" key={g.group}>
            <div className="nav__label">{g.group}</div>
            {g.items.map((it) => {
              const Icon = it.icon;
              if (it.soon) {
                return (
                  <div key={it.id} className="nav__item soon">
                    <Icon size={17} />
                    <span>{it.label}</span>
                    <span className="nav__badge">Yakında</span>
                  </div>
                );
              }
              const active = pathname === it.href;
              return (
                <Link key={it.id} href={it.href!} className={`nav__item${active ? ' active' : ''}`}>
                  <Icon size={17} />
                  <span>{it.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar__foot">
        <div className="usage">
          <div className="usage__top">
            <span className="usage__label">Sistem durumu</span>
            <span className="usage__val" style={{ color: 'var(--success)' }}>
              çevrimiçi
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
