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
  UserCog,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { L } from '@/lib/i18n';
import { useLang } from './lang-provider';

type Pair = readonly [string, string];
type Item = { id: string; icon: LucideIcon; label: Pair; soon?: boolean; adminOnly?: boolean };

const NAV: { group: Pair; items: Item[] }[] = [
  {
    group: ['Genel', 'Overview'],
    items: [
      { id: 'dashboard', icon: LayoutGrid, label: ['Genel Bakış', 'Dashboard'] },
      { id: 'analytics', icon: BarChart3, label: ['Analitik', 'Analytics'], soon: true },
    ],
  },
  {
    group: ['Tesis', 'Property'],
    items: [
      { id: 'hotels', icon: Building2, label: ['Oteller', 'Hotels'], adminOnly: true },
      { id: 'users', icon: UserCog, label: ['Kullanıcılar', 'Users'], adminOnly: true },
      { id: 'portal', icon: Layers, label: ['Misafir Portalı', 'Guest Portal'], soon: true },
    ],
  },
  {
    group: ['Bağlantı', 'Connectivity'],
    items: [
      { id: 'pms', icon: Database, label: ['PMS', 'PMS'], soon: true },
      { id: 'radius', icon: Shield, label: ['Radius', 'Radius'], soon: true },
      { id: 'mikrotik', icon: Router, label: ['Mikrotik', 'Mikrotik'], soon: true },
    ],
  },
  {
    group: ['Etkileşim', 'Engagement'],
    items: [
      { id: 'surveys', icon: ClipboardList, label: ['Anketler', 'Surveys'], soon: true },
      { id: 'notifs', icon: Bell, label: ['Bildirimler', 'Notifications'], soon: true },
      { id: 'ai', icon: Sparkles, label: ['AI Asistan', 'AI Assistant'], soon: true },
      { id: 'events', icon: Calendar, label: ['Etkinlikler', 'Events'], soon: true },
      { id: 'spa', icon: Leaf, label: ['Spa', 'Spa'], soon: true },
      { id: 'dining', icon: UtensilsCrossed, label: ['Restoran', 'Dining'], soon: true },
    ],
  },
  {
    group: ['Sistem', 'System'],
    items: [
      { id: 'billing', icon: CreditCard, label: ['Faturalama', 'Billing'], soon: true },
      { id: 'settings', icon: Settings, label: ['Ayarlar', 'Settings'], soon: true },
    ],
  },
];

export function HotelSidebar({
  hotelId,
  hotelName,
  sub,
  isAdmin = false,
}: {
  hotelId: string;
  hotelName: string;
  sub: string;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const lang = useLang();
  const base = `/h/${hotelId}`;
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="brandmark">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 3 4 19h3.2l1.2-2.6h7.2L16.8 19H20L12 3zm-2.1 10.7L12 8.9l2.1 4.8H9.9z" fill="#fff" />
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
          <div className="nav__group" key={g.group[0]}>
            <div className="nav__label">{L(g.group, lang)}</div>
            {g.items.map((it) => {
              const Icon = it.icon;
              if (it.adminOnly && !isAdmin) return null;
              if (it.soon) {
                return (
                  <div key={it.id} className="nav__item soon">
                    <Icon size={17} />
                    <span>{L(it.label, lang)}</span>
                    <span className="nav__badge">{L(['Yakında', 'Soon'], lang)}</span>
                  </div>
                );
              }
              const href = `${base}/${it.id}`;
              const active = pathname === href;
              return (
                <Link key={it.id} href={href} className={`nav__item${active ? ' active' : ''}`}>
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
            <span className="usage__label">{L(['Bağlantı durumu', 'Connection'], lang)}</span>
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
