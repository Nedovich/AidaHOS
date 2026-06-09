'use client';

// Surfaces the real client-side error (the captive mini-browser has no dev console).
// Remove once the portal render is stable.
export default function GuestError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ minHeight: '100dvh', background: '#fff', color: '#7a1320', padding: 20, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 13, lineHeight: 1.5 }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Portal error</div>
      <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#fbeaec', border: '1px solid #e0b4ba', borderRadius: 8, padding: 12 }}>
        <b>message:</b> {error?.message || String(error)}
        {'\n'}<b>name:</b> {error?.name}
        {'\n'}<b>digest:</b> {error?.digest ?? '—'}
      </div>
      {error?.stack ? (
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 11, color: '#555', marginTop: 12 }}>{error.stack}</pre>
      ) : null}
      <button onClick={reset} style={{ marginTop: 14, padding: '10px 18px', border: 'none', borderRadius: 8, background: '#7a1320', color: '#fff', fontWeight: 600 }}>
        Retry
      </button>
    </div>
  );
}
