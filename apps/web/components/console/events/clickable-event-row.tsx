'use client';

import { useRouter } from 'next/navigation';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';

function isInteractiveTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement && Boolean(target.closest('a, button, input, select, textarea'))
  );
}

export function ClickableEventRow({ href, children }: { href: string; children: ReactNode }) {
  const router = useRouter();

  function openRow(event: MouseEvent<HTMLTableRowElement>) {
    if (isInteractiveTarget(event.target)) return;
    router.push(href);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (isInteractiveTarget(event.target)) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      router.push(href);
    }
  }

  return (
    <tr
      className="events-table-row-clickable"
      onClick={openRow}
      onKeyDown={onKeyDown}
      role="link"
      tabIndex={0}
    >
      {children}
    </tr>
  );
}
