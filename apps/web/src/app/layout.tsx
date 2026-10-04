import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/literata';
import '@fontsource/mukta/400.css';
import '@fontsource/mukta/500.css';
import '@fontsource/mukta/600.css';
import './globals.css';
import { site } from '@/content/site';
import { resolveSiteUrl } from '@/lib/site-url';

// Link previews: Open Graph and Twitter cards use the generated image in opengraph-image.tsx; the icon is
// icon.svg, apple-icon.tsx and the /favicon.ico redirect. Their URLs are absolute, built from lib/site-url.ts.
export const metadata: Metadata = {
  metadataBase: resolveSiteUrl(process.env),
  title: site.meta.title,
  description: site.meta.description,
  applicationName: site.brand.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: site.brand.name,
    title: site.meta.title,
    description: site.meta.description,
    url: '/',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: site.meta.title,
    description: site.meta.description,
  },
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
