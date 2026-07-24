'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Bell,
  Building2,
  Calendar,
  Check,
  ChevronsUpDown,
  ClipboardList,
  CreditCard,
  Database,
  KeyRound,
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
      { id: 'analytics', icon: BarChart3, label: ['Analitik', 'Analytics'] },
    ],
  },
  {
    group: ['Tesis', 'Property'],
    items: [
      { id: 'hotels', icon: Building2, label: ['Oteller', 'Hotels'], adminOnly: true },
      { id: 'users', icon: UserCog, label: ['Kullanıcılar', 'Users'], adminOnly: true },
      { id: 'portal', icon: Layers, label: ['Misafir Portalı', 'Guest Portal'] },
    ],
  },
  {
    group: ['Bağlantı', 'Connectivity'],
    items: [
      { id: 'pms', icon: Database, label: ['PMS', 'PMS'], soon: true },
      { id: 'radius', icon: Shield, label: ['FreeRADIUS', 'FreeRADIUS'] },
      { id: 'mikrotik', icon: Router, label: ['Mikrotik', 'Mikrotik'] },
      { id: 'staff', icon: KeyRound, label: ['Personel', 'Staff'] },
    ],
  },
  {
    group: ['Etkileşim', 'Engagement'],
    items: [
      { id: 'surveys', icon: ClipboardList, label: ['Anketler', 'Surveys'] },
      { id: 'notifs', icon: Bell, label: ['Bildirimler', 'Notifications'], soon: true },
      { id: 'ai', icon: Sparkles, label: ['AI Asistan', 'AI Assistant'], soon: true },
      { id: 'events', icon: Calendar, label: ['Etkinlikler', 'Events'] },
      { id: 'spa', icon: Leaf, label: ['Spa', 'Spa'], soon: true },
      { id: 'dining', icon: UtensilsCrossed, label: ['Restoran', 'Dining'] },
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

function initials2(name: string) {
  return name.split(' ').map((s) => s[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || 'HT';
}

interface HotelEntry { id: string; name: string; color: string; slug: string }

function PropertySwitcher({
  hotelId,
  hotelName,
  hotelColor,
  sub,
  groupHotels,
}: {
  hotelId: string;
  hotelName: string;
  hotelColor: string;
  sub: string;
  groupHotels: HotelEntry[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const safeColor = hotelColor || '#2F6E78';

  return (
    <div ref={ref} className={`tenant-wrap${open ? ' open' : ''}`}>
      <button
        type="button"
        className="tenant"
        onClick={() => setOpen((o) => !o)}
        style={{ textAlign: 'left' }}
      >
        <div
          className="tenant__logo"
          style={{
            background: `${safeColor}1f`,
            color: safeColor,
            borderColor: `${safeColor}40`,
          }}
        >
          {initials2(hotelName)}
        </div>
        <div className="tenant__meta">
          <div className="tenant__name">{hotelName}</div>
          <div className="tenant__role">{sub}</div>
        </div>
        <span className="tenant__chev">
          <ChevronsUpDown size={15} />
        </span>
      </button>

      <div className="tenant-pop">
        <div className="tnp__head">Otel Seç / Switch Property</div>
        <div className="tnp__list">
          <div className="tnp__sep">OTELLER / PROPERTIES</div>
          {groupHotels.map((h) => {
            const active = h.id === hotelId;
            const hColor = h.color || '#2F6E78';
            return (
              <button
                key={h.id}
                type="button"
                className={`tnp__item${active ? ' on' : ''}`}
                onClick={() => {
                  setOpen(false);
                  router.push(`/h/${h.id}/dashboard`);
                }}
              >
                <div
                  className="tnp__logo"
                  style={{
                    background: `${hColor}1f`,
                    color: hColor,
                    borderColor: `${hColor}40`,
                  }}
                >
                  {initials2(h.name)}
                </div>
                <div className="tnp__meta">
                  <div className="tnp__name">{h.name}</div>
                  <div className="tnp__sub">
                    <span className="tnp__dot" style={{ background: 'var(--success)' }} />
                    {h.slug}
                  </div>
                </div>
                {active && (
                  <span className="tnp__check">
                    <Check size={14} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function HotelSidebar({
  hotelId,
  hotelName,
  hotelColor = '#2F6E78',
  sub,
  isAdmin = false,
  groupHotels = [],
}: {
  hotelId: string;
  hotelName: string;
  hotelColor?: string;
  sub: string;
  isAdmin?: boolean;
  groupHotels?: HotelEntry[];
}) {
  const pathname = usePathname();
  const lang = useLang();
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

      <PropertySwitcher
        hotelId={hotelId}
        hotelName={hotelName}
        hotelColor={hotelColor}
        sub={sub}
        groupHotels={groupHotels}
      />

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
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={it.id}
                  href={href}
                  className={['nav__item', active ? 'active' : null].filter(Boolean).join(' ')}
                >
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
