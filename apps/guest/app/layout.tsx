import type { Metadata } from 'next';
import './globals.css';
import '../styles/guest-tokens.css';

export const metadata: Metadata = {
  title: 'AIDA Hotel OS',
  description: 'Hotel guest portal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: 'var(--bg)' }}>{children}</body>
    </html>
  );
}
