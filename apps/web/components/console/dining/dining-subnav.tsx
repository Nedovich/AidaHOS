import Link from 'next/link';
import {
  BarChart3,
  ClipboardList,
  Grid2X2,
  LayoutGrid,
  MessageSquareText,
  Sparkles,
  Table2,
  UtensilsCrossed,
} from 'lucide-react';
import { L, type Lang } from '@/lib/i18n';

const ITEMS = [
  { id: 'overview', href: '', icon: Grid2X2, label: ['Genel Bakış', 'Overview'] as const },
  { id: 'venues', href: '/venues', icon: UtensilsCrossed, label: ['Mekanlar', 'Venues'] as const },
  {
    id: 'reservations',
    href: '/reservations',
    icon: ClipboardList,
    label: ['Rezervasyonlar', 'Reservations'] as const,
  },
  { id: 'tables', href: '/tables', icon: Table2, label: ['Masalar', 'Tables'] as const },
  { id: 'menu', href: '/menu', icon: LayoutGrid, label: ['Menü', 'Menu'] as const },
  {
    id: 'requests',
    href: '/requests',
    icon: MessageSquareText,
    label: ['Özel Talepler', 'Guest Requests'] as const,
  },
  {
    id: 'analytics',
    href: '/analytics',
    icon: BarChart3,
    label: ['Analitik', 'Analytics'] as const,
  },
];

export function DiningSubnav({
  hotelId,
  active,
  lang,
}: {
  hotelId: string;
  active: string;
  lang: Lang;
}) {
  const base = `/h/${hotelId}/dining`;

  return (
    <nav
      className="subnav dining-subnav"
      aria-label={L(['Restoran sayfaları', 'Dining pages'], lang)}
    >
      {ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            className={['subnav__i', active === item.id ? 'on' : null].filter(Boolean).join(' ')}
            href={`${base}${item.href}`}
            key={item.id}
          >
            <Icon size={16} />
            {L(item.label, lang)}
          </Link>
        );
      })}
      <span className="subnav__sp" />
      <Link className="subnav__i dining-subnav__ai" href={`${base}/ai`}>
        <Sparkles size={16} />
        {L(['AI Asistan', 'AI Assistant'], lang)}
      </Link>
    </nav>
  );
}
