import { redirect } from 'next/navigation';
import '@/styles/console/tokens.css';
import '@/styles/console/app.css';
import { getHotelById } from '@aidahos/db';
import { canAccessHotel, getSession } from '@/lib/auth';
import { HotelSidebar } from '@/components/console/hotel-sidebar';
import { ConsoleHeader } from '@/components/console/console-header';

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

  const name = session.user.name ?? 'Yönetici';
  const roleLabel = session.user.role === 'admin' ? 'Grup Yöneticisi' : 'Otel Yöneticisi';

  return (
    <div className="app">
      <HotelSidebar hotelId={hotel.id} hotelName={hotel.name} sub={roleLabel} />
      <div className="main">
        <ConsoleHeader
          initials={initialsOf(name)}
          crumb="AIDA Cloud"
          title={hotel.name}
          searchPlaceholder="Misafir, oda, içerik ara…"
        />
        <div className="content">
          <div className="content__inner">{children}</div>
        </div>
      </div>
    </div>
  );
}
