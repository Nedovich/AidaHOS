'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Bell,
  Building2,
  Calendar,
  ClipboardList,
  CreditCard,
  Database,
  LayoutGrid,
  Layers,
  Leaf,
  Router,
  Settings,
  Shield,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';

type Item = { id: string; icon: LucideIcon; label: string; soon?: boolean };

const NAV: { group: string; items: Item[] }[] = [
  {
    group: 'Genel',
    items: [
      { id: 'dashboard', icon: LayoutGrid, label: 'Genel Bakış' },
      { id: 'analytics', icon: BarChart3, label: 'Analitik', soon: true },
    ],
  },
  {
    group: 'Tesis',
    items: [
      { id: 'hotels', icon: Building2, label: 'Oteller', soon: true },
      { id: 'portal', icon: Layers, label: 'Misafir Portalı', soon: true },
    ],
  },
  {
    group: 'Bağlantı',
    items: [
      { id: 'pms', icon: Database, label: 'PMS', soon: true },
      { id: 'radius', icon: Shield, label: 'Radius', soon: true },
      { id: 'mikrotik', icon: Router, label: 'Mikrotik', soon: true },
    ],
  },
  {
    group: 'Etkileşim',
    items: [
      { id: 'surveys', icon: ClipboardList, label: 'Anketler', soon: true },
      { id: 'notifs', icon: Bell, label: 'Bildirimler', soon: true },
      { id: 'ai', icon: Sparkles, label: 'AI Asistan', soon: true },
      { id: 'events', icon: Calendar, label: 'Etkinlikler', soon: true },
      { id: 'spa', icon: Leaf, label: 'Spa', soon: true },
      { id: 'dining', icon: UtensilsCrossed, label: 'Restoran', soon: true },
    ],
  },
  {
    group: 'Sistem',
    items: [
      { id: 'billing', icon: CreditCard, label: 'Faturalama', soon: true },
      { id: 'settings', icon: Settings, label: 'Ayarlar', soon: true },
    ],
  },
];

export function HotelSidebar({
  hotelId,
  hotelName,
  sub,
}: {
  hotelId: string;
  hotelName: string;
  sub: string;
}) {
  const pathname = usePathname();
  const base = `/h/${hotelId}`;
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="brandmark">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3 4 19h3.2l1.2-2.6h7.2L16.8 19H20L12 3zm-2.1 10.7L12 8.9l2.1 4.8H9.9z"
              fill="#fff"
            />
          </svg>
        </div>
        <div>
          <div className="brand__word">AIDA</div>
          <div className="brand__tag">Hotel OS</div>
        </div>
      </div>

      <div className="tenant">
        <div className="tenant__logo">{hotelName.slice(0, 2).toUpperCase()}</div>
        <div className="tenant__meta">
          <div className="tenant__name">{hotelName}</div>
          <div className="tenant__role">{sub}</div>
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
              const href = `${base}/${it.id}`;
              const active = pathname === href;
              return (
                <Link key={it.id} href={href} className={`nav__item${active ? ' active' : ''}`}>
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
            <span className="usage__label">Bağlantı durumu</span>
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
