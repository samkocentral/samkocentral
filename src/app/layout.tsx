import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Syne, DM_Sans } from 'next/font/google';
import '../styles/tailwind.css';
import { Toaster } from 'sonner';

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-head',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'SamkoCentral — Operations. Compliance. Documents. Governance.',
  description:
    'SamkoCentral gives hospitality operators a single command centre to track compliance, documents, and tasks across all sites — preventing regulatory breaches before they happen.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body className={dmSans.className}>
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: 'var(--card)',
              border: '1px solid var(--border-strong)',
              color: 'var(--foreground)',
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
            },
          }}
        />
</body>
    </html>
  );
}