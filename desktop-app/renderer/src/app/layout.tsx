import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ClientProviders } from '@/components/providers/ClientProviders';
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
  title: 'Habii',
  description: 'Your digital creature companion',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased pi-fullscreen`}
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
