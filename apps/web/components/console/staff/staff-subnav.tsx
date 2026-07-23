import Link from 'next/link';
import { KeyRound, Users } from 'lucide-react';
import { L, type Lang } from '@/lib/i18n';

type StaffTab = 'users' | 'profiles';

export function StaffSubnav({ hotelId, active, lang }: { hotelId: string; active: StaffTab; lang: Lang }) {
  const base = `/h/${hotelId}/staff`;
  return (
    <div className="subnav staff-subnav">
      <Link className={`subnav__i${active === 'users' ? ' on' : ''}`} href={base}>
        <Users size={16} />{L(['Kullanıcılar', 'Users'], lang)}
      </Link>
      <Link className={`subnav__i${active === 'profiles' ? ' on' : ''}`} href={`${base}/profiles`}>
        <KeyRound size={16} />{L(['Kullanıcı Profilleri', 'User Profiles'], lang)}
      </Link>
    </div>
  );
}
