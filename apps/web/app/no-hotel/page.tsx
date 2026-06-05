import { getLang } from '@/lib/i18n-server';
import { L } from '@/lib/i18n';
import { LangProvider } from '@/components/console/lang-provider';
import { SignOutButton } from '@/components/sign-out-button';

// Shown when a signed-in admin/user has no accessible hotel yet.
export default async function NoHotel() {
  const lang = await getLang();
  return (
    <LangProvider initial={lang}>
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold">{L(['Henüz bir otel atanmadı', 'No hotel assigned yet'], lang)}</h1>
        <p className="text-muted">
          {L(
            ['Hesabınıza bir otel ya da otel grubu atandığında paneliniz burada görünecek. Lütfen yöneticinizle iletişime geçin.',
              'Once a hotel or hotel group is assigned to your account, your console appears here. Please contact your administrator.'],
            lang,
          )}
        </p>
        <SignOutButton />
      </main>
    </LangProvider>
  );
}
