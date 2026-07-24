import Link from 'next/link';
import { L, type Lang } from '@/lib/i18n';

const TABS = [
  { id: 'sessions', label: ['Aktif Oturumlar', 'Active Sessions'], path: '' },
  { id: 'auth-logs', label: ['Kimlik Logları', 'Auth Logs'], path: '/auth-logs' },
  { id: 'accounting', label: ['Hesaplama', 'Accounting'], path: '/accounting' },
  { id: 'nas-devices', label: ['NAS Cihazları', 'NAS Devices'] },
  { id: 'clients', label: ['Clients', 'Clients'] },
] as const;

export function RadiusSubnav({
  hotelId,
  active,
  lang,
}: {
  hotelId: string;
  active: (typeof TABS)[number]['id'];
  lang: Lang;
}) {
  const base = `/h/${hotelId}/radius`;

  return (
    <nav className="radius-subnav" aria-label={L(['FreeRADIUS bölümleri', 'FreeRADIUS sections'], lang)}>
      {TABS.map((tab) => {
        const className = `radius-subnav__tab${tab.id === active ? ' active' : ''}`;
        if ('path' in tab) {
          return (
            <Link
              className={className}
              href={`${base}${tab.path}`}
              key={tab.id}
              aria-current={tab.id === active ? 'page' : undefined}
            >
              {L(tab.label, lang)}
            </Link>
          );
        }
        return (
          <span className={className} aria-disabled="true" key={tab.id}>
            {L(tab.label, lang)}
          </span>
        );
      })}
    </nav>
  );
}
