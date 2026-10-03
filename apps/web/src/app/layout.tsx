import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/literata';
import '@fontsource/mukta/400.css';
import '@fontsource/mukta/500.css';
import '@fontsource/mukta/600.css';
import './globals.css';
import { site } from '@/content/site';

// Owner: coordinator. E1 extends `metadata` (Open Graph, icons, canonical) in src/app/metadata.ts.
export const metadata: Metadata = {
  metadataBase: new URL('https://earlyletters.com'),
  title: site.meta.title,
  description: site.meta.description,
};

export const viewport: Viewport = {
  themeColor: '#161412',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
