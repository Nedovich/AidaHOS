import { redirect } from 'next/navigation';
import '@/styles/console/tokens.css';
import '@/styles/console/app.css';
import '@/styles/console/ops.css';
import '@/styles/console/forms.css';
import { getSession } from '@/lib/auth';
import { getLang } from '@/lib/i18n-server';
import { L } from '@/lib/i18n';
import { ConsoleSidebar } from '@/components/console/console-sidebar';
import { ConsoleHeader } from '@/components/console/console-header';
import { LangProvider } from '@/components/console/lang-provider';

function initialsOf(name: string) {
  return (
    name
      .split(' ')
      .map((s) => s[0])
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'OP'
  );
}

export default async function SuperLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'super_admin') redirect('/');

  const lang = await getLang();
  const name = session.user.name ?? 'Operatör';
  const initials = initialsOf(name);
  const role = ['Süper Yönetici', 'Super Admin'] as const;

  return (
    <LangProvider initial={lang}>
      <div className="app">
        <ConsoleSidebar operator={{ name, role, initials }} />
        <div className="main">
          <ConsoleHeader initials={initials} crumb="AIDA Operations" title={L(role, lang)} />
          <div className="content">
            <div className="content__inner">{children}</div>
          </div>
        </div>
      </div>
    </LangProvider>
  );
}
