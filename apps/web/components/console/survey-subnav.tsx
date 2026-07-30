import Link from 'next/link';
import { BarChart3, ClipboardList, LayoutGrid, MessageSquare, Send } from 'lucide-react';
import { L, type Lang } from '@/lib/i18n';

type Tab = 'overview' | 'forms' | 'responses' | 'reports' | 'sends';

/** Survey section sub-navigation (Overview / Forms / Sends / Responses / Reports). */
export function SurveySubnav({ hotelId, active, lang }: { hotelId: string; active: Tab; lang: Lang }) {
  const base = `/h/${hotelId}/surveys`;
  const items = [
    { id: 'overview' as Tab, icon: LayoutGrid, label: ['Genel Bakış', 'Overview'] as const, href: base },
    { id: 'forms' as Tab, icon: ClipboardList, label: ['Formlar', 'Forms'] as const, href: `${base}/forms` },
    { id: 'sends' as Tab, icon: Send, label: ['Gönderimler', 'Sends'] as const, href: `${base}/sends` },
    { id: 'responses' as Tab, icon: MessageSquare, label: ['Yanıtlar', 'Responses'] as const, href: `${base}/responses` },
    { id: 'reports' as Tab, icon: BarChart3, label: ['Raporlar', 'Reports'] as const, soon: true },
  ];
  return (
    <div className="subnav">
      {items.map((it) => {
        const Icon = it.icon;
        if (it.soon) {
          return (
            <div key={it.id} className="subnav__i" style={{ opacity: 0.5, cursor: 'default' }}>
              <Icon size={16} />
              {L(it.label, lang)}
              <span className="nav__badge" style={{ marginLeft: 4 }}>{L(['Yakında', 'Soon'], lang)}</span>
            </div>
          );
        }
        return (
          <Link key={it.id} href={it.href!} className={`subnav__i${it.id === active ? ' on' : ''}`}>
            <Icon size={16} />
            {L(it.label, lang)}
          </Link>
        );
      })}
    </div>
  );
}
