import Link from 'next/link';
import { BarChart3, Calendar, Grid2X2, Layers3, Sparkles, Users } from 'lucide-react';
import { L, type Lang } from '@/lib/i18n';

const ITEMS = [
  { id: 'overview', href: '', icon: Grid2X2, label: ['Genel Bakış', 'Overview'] as const },
  { id: 'calendar', href: '/calendar', icon: Calendar, label: ['Takvim', 'Calendar'] as const },
  { id: 'list', href: '/list', icon: Layers3, label: ['Etkinlikler', 'Events'] as const },
  {
    id: 'participants',
    href: '/participants',
    icon: Users,
    label: ['Katılımcılar', 'Participants'] as const,
  },
  {
    id: 'analytics',
    href: '/analytics',
    icon: BarChart3,
    label: ['Analitik', 'Analytics'] as const,
  },
];

export function EventsSubnav({
  hotelId,
  active,
  lang,
}: {
  hotelId: string;
  active: string;
  lang: Lang;
}) {
  const base = `/h/${hotelId}/events`;

  return (
    <nav
      className="subnav events-subnav"
      aria-label={L(['Etkinlik sayfaları', 'Event pages'], lang)}
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
      <Link className="subnav__i events-subnav__ai" href={`${base}/ai`}>
        <Sparkles size={16} />
        {L(['AI Asistan', 'AI Assistant'], lang)}
      </Link>
    </nav>
  );
}
