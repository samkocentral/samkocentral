import React from 'react';
import type { Metadata, Viewport } from 'next';
import '../styles/tailwind.css';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/authContext';

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Syne:wght@400..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
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
