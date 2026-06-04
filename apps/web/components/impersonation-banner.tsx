import { getSession } from '@/lib/auth';
import { stopImpersonate } from '@/app/(super)/actions';

/** Shown app-wide while a super_admin is impersonating another user. */
export async function ImpersonationBanner() {
  const session = await getSession();
  const impersonatedBy = session?.session?.impersonatedBy;
  if (!impersonatedBy) return null;

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
        Kullanıcı taklidi aktif — <b>{session?.user?.email}</b> olarak görüntülüyorsunuz.
      </span>
      <form action={stopImpersonate} style={{ marginLeft: 'auto' }}>
        <button
          type="submit"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '6px 13px',
            borderRadius: 999,
            background: 'rgba(255,255,255,.16)',
            color: '#fff',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Taklidi bitir
        </button>
      </form>
    </div>
  );
}
