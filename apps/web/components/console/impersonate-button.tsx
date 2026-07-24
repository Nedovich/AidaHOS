'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck } from 'lucide-react';

export function ImpersonateButton({ userId, label }: { userId: string; label: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch('/api/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        const body = await res.json().catch(() => ({}));
        alert(`Taklit başlatılamadı: ${body.error ?? res.statusText}`);
        setLoading(false);
      }
    } catch {
      alert('Bir hata oluştu.');
      setLoading(false);
    }
  }

  return (
    <button type="button" className="btn btn--ghost" onClick={handleClick} disabled={loading}>
      <UserCheck size={16} />
      {loading ? '…' : label}
    </button>
  );
}
