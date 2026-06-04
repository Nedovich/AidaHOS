import { SignOutButton } from '@/components/sign-out-button';

// Shown when a signed-in admin/user has no accessible hotel yet.
export default function NoHotel() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Henüz bir otel atanmadı</h1>
      <p className="text-muted">
        Hesabınıza bir otel ya da otel grubu atandığında paneliniz burada görünecek. Lütfen
        yöneticinizle iletişime geçin.
      </p>
      <SignOutButton />
    </main>
  );
}
