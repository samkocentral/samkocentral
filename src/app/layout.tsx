import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Syne, DM_Sans } from 'next/font/google';
import '../styles/tailwind.css';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/authContext';

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
    icon: [
      { url: '/icon.png?v=3', type: 'image/png', sizes: '32x32' },
      { url: '/favicon.ico?v=3', sizes: 'any' },
      { url: '/icon-192.png?v=3', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png?v=3', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-icon.png?v=3', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico?v=3',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body className={dmSans.className}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            theme="dark"
            closeButton
            richColors={false}
            offset={18}
            toastOptions={{
              duration: 4000,
              className: 'samko-toast',
              classNames: {
                toast: 'samko-toast',
                title: 'samko-toast-title',
                description: 'samko-toast-desc',
                closeButton: 'samko-toast-close',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}