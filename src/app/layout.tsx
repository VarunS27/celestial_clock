import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { CelestialBackground } from '@/components/celestial-background';
import { NavigationBar } from '@/components/navigation-bar'; // Import NavigationBar
import { Toaster } from '@/components/ui/toaster';
import { TimeProvider } from '@/context/time-context'; // Import TimeProvider

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
        <TimeProvider> {/* Wrap with TimeProvider */}
          <CelestialBackground />
          <NavigationBar /> {/* Add NavigationBar */}
          <main className="flex-grow relative z-10 pt-16">{children}</main> {/* Add padding-top for fixed navbar */}
          <Toaster />
        </TimeProvider>
      </body>
    </html>
  );
}
