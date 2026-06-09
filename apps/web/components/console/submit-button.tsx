'use client';

import { useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';

/**
 * Submit button for `<form action={serverAction}>`. While the action runs it
 * disables itself and drives the global top progress bar (RouteProgress) — the
 * same loading affordance used for link navigations — so server-action submits
 * (create/save/publish) get the identical "Yükleniyor…" feedback instead of a
 * separate inline spinner.
 */
export function SubmitButton({
  children,
  className,
  name,
  value,
  style,
  title,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  name?: string;
  value?: string;
  style?: React.CSSProperties;
  title?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const started = useRef(false);

  useEffect(() => {
    if (pending) {
      started.current = true;
      window.dispatchEvent(new Event('aida:nav-start'));
    } else if (started.current) {
      started.current = false;
      window.dispatchEvent(new Event('aida:nav-end'));
    }
  }, [pending]);

  // If the action redirects to the SAME path and removes this row (e.g. delete from
  // the list), the button unmounts while still pending — pathname never changes and
  // the pending→false effect never runs. Complete the bar on unmount so it can't hang.
  useEffect(
    () => () => {
      if (started.current) {
        started.current = false;
        window.dispatchEvent(new Event('aida:nav-end'));
      }
    },
    [],
  );

  return (
    <button
      type="submit"
      className={className}
      name={name}
      value={value}
      title={title}
      disabled={pending || disabled}
      aria-busy={pending}
      style={{ ...style, ...(pending ? { opacity: 0.75, cursor: 'progress' } : disabled ? { opacity: 0.55, cursor: 'not-allowed' } : null) }}
    >
      {children}
    </button>
  );
}
