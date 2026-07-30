'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { L } from '@/lib/i18n';
import { useLang } from './lang-provider';

/**
 * Top navigation progress bar + a corner "Loading…" pill (no dependency). Gives
 * instant "something is happening" feedback on tab/link clicks while the next Server
 * Component renders (which, against a remote DB, can take ~1s). Starts on internal
 * link clicks, eases toward ~90%, then snaps to 100% and fades once the route changes.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const lang = useLang();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetT = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = () => {
    if (tick.current) {
      clearInterval(tick.current);
      tick.current = null;
    }
  };

  const safetyT = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    if (tick.current) return; // already running
    if (fadeT.current) clearTimeout(fadeT.current);
    if (resetT.current) clearTimeout(resetT.current);
    if (safetyT.current) clearTimeout(safetyT.current);
    setVisible(true);
    setProgress(10);
    tick.current = setInterval(() => {
      // ease toward 90% and slow down as it approaches
      setProgress((p) => (p >= 90 ? p : p + Math.max(0.5, (90 - p) * 0.06)));
    }, 120);
    // Safety: auto-complete after 10s so the bar never stays stuck
    safetyT.current = setTimeout(() => complete(), 10_000);
  };

  // Snap to 100% and fade out. Shared by route changes AND server-action submits.
  const complete = () => {
    stop();
    setProgress(100);
    if (fadeT.current) clearTimeout(fadeT.current);
    if (resetT.current) clearTimeout(resetT.current);
    fadeT.current = setTimeout(() => setVisible(false), 280);
    resetT.current = setTimeout(() => setProgress(0), 560);
  };

  // Start on internal link clicks; also on server-action submits (SubmitButton
  // dispatches aida:nav-start/end) so forms use the same top bar — one loading style.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || a.getAttribute('target') === '_blank' || a.hasAttribute('download')) return;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      } catch {
        return;
      }
      start();
    };
    const onStart = () => start();
    const onEnd = () => complete();
    document.addEventListener('click', onClick, true);
    window.addEventListener('aida:nav-start', onStart);
    window.addEventListener('aida:nav-end', onEnd);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('aida:nav-start', onStart);
      window.removeEventListener('aida:nav-end', onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When pathname changes the route is registered but server data is still loading.
  // Jump bar to 75% quickly, then wait for aida:page-ready (skeleton unmount) to finish.
  // Fallback: if loading.tsx never mounted (instant cache hit), complete after 400ms.
  useEffect(() => {
    stop();
    if (safetyT.current) clearTimeout(safetyT.current);
    setProgress((p) => {
      if (p === 0) return 0; // bar wasn't started (e.g. browser back/forward), don't show
      return 75;
    });
    safetyT.current = setTimeout(() => complete(), 3_000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // aida:page-ready fires when PageSkeleton unmounts (real content arrived).
  useEffect(() => {
    const onReady = () => complete();
    window.addEventListener('aida:page-ready', onReady);
    return () => window.removeEventListener('aida:page-ready', onReady);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      stop();
      if (fadeT.current) clearTimeout(fadeT.current);
      if (resetT.current) clearTimeout(resetT.current);
      if (safetyT.current) clearTimeout(safetyT.current);
    },
    [],
  );

  return (
    <>
      {/* top bar */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: 5,
          width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 55%, #ffffff))',
          boxShadow: '0 0 12px var(--accent), 0 0 6px var(--accent)',
          borderRadius: '0 4px 4px 0',
          opacity: visible ? 1 : 0,
          transition: 'width .2s ease, opacity .3s ease .1s',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      />
      {/* corner pill */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: 14,
          right: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 13px 7px 11px',
          borderRadius: 999,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-2, 0 6px 20px -8px rgba(0,0,0,.25))',
          color: 'var(--text-2)',
          fontSize: 13,
          fontWeight: 600,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-6px)',
          transition: 'opacity .2s ease, transform .2s ease',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        <span
          className="animate-spin"
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            border: '2px solid var(--accent-line, color-mix(in srgb, var(--accent) 30%, transparent))',
            borderTopColor: 'var(--accent)',
          }}
        />
        {L(['Yükleniyor…', 'Loading…'], lang)}
      </div>
    </>
  );
}
