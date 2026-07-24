'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ImpersonationBanner({
  email,
  label,
  stopLabel,
}: {
  email: string;
  label: string;
  stopLabel: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStop() {
    setLoading(true);
    try {
      await fetch('/api/impersonate/stop', { method: 'POST' });
      router.push('/dashboard');
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '9px 18px',
        background: 'linear-gradient(90deg, #5457D6, #6E70E8)',
        color: '#fff',
        fontSize: 13,
        position: 'relative',
        zIndex: 40,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 0 0 4px rgba(255,255,255,.25)',
        }}
      />
      <span>
        {label} <b>{email}</b>
      </span>
      <button
        type="button"
        disabled={loading}
        onClick={handleStop}
        style={{
          marginLeft: 'auto',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          padding: '6px 13px',
          borderRadius: 999,
          background: 'rgba(255,255,255,.16)',
          color: '#fff',
          fontWeight: 600,
          border: 'none',
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? '…' : stopLabel}
      </button>
    </div>
  );
}
