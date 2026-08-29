import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://group-up-hero-roulette.onrender.com'),
  title: 'Group Up — Overwatch Hero Roulette',
  description:
    'Spin a wheel of custom names, the full Overwatch hero roster, or Stadium-only heroes with role filters.',
  icons: {
    icon: '/stadium-icon.svg',
  },
  openGraph: {
    title: 'Group Up — Overwatch Hero Roulette',
    description:
      'Spin custom names, all 53 heroes through D.Mon, or the Stadium roster with role filters.',
    type: 'website',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Group Up Overwatch Hero Roulette',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Group Up — Overwatch Hero Roulette',
    description:
      'Spin custom names, all 53 heroes through D.Mon, or the Stadium roster with role filters.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
