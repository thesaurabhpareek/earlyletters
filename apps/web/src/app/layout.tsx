import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/literata';
import '@fontsource/mukta/400.css';
import '@fontsource/mukta/500.css';
import '@fontsource/mukta/600.css';
import './globals.css';
import { site } from '@/content/site';
import { webAsset } from '@/lib/brand/web-assets';
import { resolveSiteUrl } from '@/lib/site-url';

// Every picture of the brand here is an approved registry file, copied by scripts/web/sync-brand-assets.mjs
// (lib/brand/web-assets.ts): the tab icons are icon.svg and icon1.png, the Apple touch icon is apple-icon.ts, link
// previews (Open Graph and Twitter) use opengraph-image.ts, /favicon.ico redirects to icon.svg, and the web manifest
// lists the 192 and 512 icons. Their URLs are absolute, built from lib/site-url.ts.
export const metadata: Metadata = {
  metadataBase: resolveSiteUrl(process.env),
  title: site.meta.title,
  description: site.meta.description,
  applicationName: site.brand.name,
  manifest: webAsset('favicon.manifest').url,
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
      <body>
        {children}
      </body>
    </html>
  );
}
