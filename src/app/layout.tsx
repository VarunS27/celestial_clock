import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { CelestialBackground } from '@/components/celestial-background';
import { Toaster } from '@/components/ui/toaster'; // Ensure Toaster is imported if used by hooks/use-toast

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Celestial Clock',
  description: 'A portfolio background showing an animated sun/moon based on time.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative flex flex-col min-h-screen`}
      >
        <CelestialBackground />
        <main className="flex-grow relative z-10">{children}</main>
        <Toaster /> {/* Add Toaster for potential notifications */}
      </body>
    </html>
  );
}
