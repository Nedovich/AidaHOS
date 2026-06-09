'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

/**
 * Mobile hamburger that opens the off-canvas sidebar drawer (CSS `.app.nav-open`).
 * Hidden on desktop via CSS. Closes on navigation and via the backdrop overlay.
 */
export function MobileNavToggle() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the route changes (e.g., a sidebar link was tapped).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Reflect open state onto the .app container that the CSS drawer rule targets.
  useEffect(() => {
    const app = document.querySelector('.app');
    app?.classList.toggle('nav-open', open);
    return () => {
      document.querySelector('.app')?.classList.remove('nav-open');
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="nav-toggle"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open && <div className="nav-overlay" onClick={() => setOpen(false)} aria-hidden />}
    </>
  );
}
