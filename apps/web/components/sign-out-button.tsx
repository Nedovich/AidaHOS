'use client';

import { useRouter } from 'next/navigation';
import { authClient } from '@aidahos/auth/client';
import { Button } from '@aidahos/ui';

export function SignOutButton() {
  const router = useRouter();
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
      Çıkış
    </Button>
  );
}
