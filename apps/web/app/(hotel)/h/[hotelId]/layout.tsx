import { redirect } from 'next/navigation';
import '@/styles/console/tokens.css';
import '@/styles/console/app.css';
import '@/styles/console/ops.css';
import '@/styles/console/forms.css';
import '@/styles/console/survey.css';
import '@/styles/console/survey-wizard.css';
import '@/styles/console/portal.css';
import { getHotelById } from '@aidahos/db';
import { canAccessHotel, getSession } from '@/lib/auth';
import { getLang } from '@/lib/i18n-server';
import { L } from '@/lib/i18n';
import { HotelSidebar } from '@/components/console/hotel-sidebar';
import { ConsoleHeader } from '@/components/console/console-header';
import { LangProvider } from '@/components/console/lang-provider';
import { RouteProgress } from '@/components/console/route-progress';

function initialsOf(name: string) {
  return (
    name
      .split(' ')
      .map((s) => s[0])
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'AD'
  );
}

export default async function HotelLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ hotelId: string }>;
}) {
  const { hotelId } = await params;
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.role === 'super_admin') redirect('/dashboard');

  const hotel = await getHotelById(hotelId);
  if (!hotel) redirect('/no-hotel');
  if (!(await canAccessHotel(hotel.id, hotel.hotelGroupId))) redirect('/no-hotel');

  const lang = await getLang();
  const name = session.user.name ?? 'Yönetici';
  const roleLabel =
    session.user.role === 'admin'
      ? L(['Grup Yöneticisi', 'Group Manager'], lang)
      : L(['Otel Yöneticisi', 'Hotel Manager'], lang);

  return (
    <LangProvider initial={lang}>
      <RouteProgress />
      <div className="app">
        <HotelSidebar hotelId={hotel.id} hotelName={hotel.name} sub={roleLabel} isAdmin={session.user.role === 'admin'} />
        <div className="main">
          <ConsoleHeader
            initials={initialsOf(name)}
            crumb="AIDA Cloud"
            title={hotel.name}
            search={L(['Misafir, oda, içerik ara…', 'Search guests, rooms, content…'], lang)}
          />
          <div className="content">
            <div className="content__inner">{children}</div>
          </div>
        </div>
      </div>
    </LangProvider>
  );
}
