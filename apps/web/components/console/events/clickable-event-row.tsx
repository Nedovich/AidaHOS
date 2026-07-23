'use client';

import { useRouter } from 'next/navigation';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';

export function ClickableEventRow({
  href,
  children,
  actions,
}: {
  href: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const router = useRouter();

  function openRow(event: MouseEvent<HTMLTableRowElement>) {
    router.push(href);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
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
      {actions != null && (
        <td onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          {actions}
        </td>
      )}
    </tr>
  );
}
