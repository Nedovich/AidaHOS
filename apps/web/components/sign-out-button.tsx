'use client';

import { useRouter } from 'next/navigation';
import { authClient } from '@aidahos/auth/client';
import { Button } from '@aidahos/ui';
import { L } from '@/lib/i18n';
import { useLang } from '@/components/console/lang-provider';

export function SignOutButton() {
  const router = useRouter();
  const lang = useLang();
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={async () => {
        await authClient.signOut();
        router.push('/login');
        router.refresh();
      }}
    >
      {L(['Çıkış', 'Sign out'], lang)}
    </Button>
  );
}
