import { getSession } from '@/lib/auth';
import { getLang } from '@/lib/i18n-server';
import { L } from '@/lib/i18n';
import { ImpersonationBanner } from './impersonation-banner';

export async function ImpersonationBannerServer() {
  const session = await getSession();
  if (!session?.session?.impersonatedBy) return null;
  const lang = await getLang();

  return (
    <ImpersonationBanner
      email={session.user.email}
      label={L(['Kullanıcı taklidi aktif —', 'Impersonation active —'], lang)}
      stopLabel={L(['Taklidi bitir', 'Stop impersonating'], lang)}
    />
  );
}
