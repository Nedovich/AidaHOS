import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { ImpersonationBannerServer as ImpersonationBanner } from '@/components/impersonation-banner-server';

export const metadata: Metadata = {
  title: 'AidaHOS Admin',
  description: 'AidaHOS — Hotel Operating System admin console',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Suspense fallback={null}>
          <ImpersonationBanner />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
