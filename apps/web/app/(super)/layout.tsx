import { redirect } from 'next/navigation';
import '@/styles/console/tokens.css';
import '@/styles/console/app.css';
import '@/styles/console/ops.css';
import { getSession } from '@/lib/auth';
import { ConsoleSidebar } from '@/components/console/console-sidebar';
import { ConsoleHeader } from '@/components/console/console-header';

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

  const name = session.user.name ?? 'Operatör';
  const initials = initialsOf(name);

  return (
    <div className="app">
      <ConsoleSidebar operator={{ name, role: 'Süper Yönetici', initials }} />
      <div className="main">
        <ConsoleHeader initials={initials} />
        <div className="content">
          <div className="content__inner">{children}</div>
        </div>
      </div>
    </div>
  );
}
