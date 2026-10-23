/**
 * Owner: S20 (web). The share card (Open Graph) for a page that is not the home page: its own url and title, with the
 * site's name, description and approved share image. Next merges metadata shallowly, so a page that sets `openGraph`
 * replaces the layout's whole object, the share image from app/opengraph-image.ts included. This names the image
 * again (brand registry `og.image`, served at its registry url), so the card keeps its picture.
 */
import type { Metadata } from 'next';
import { brand } from '@scribe/brand';
import { site } from '@/content/site';
import { webAsset, webAssetSize } from './web-assets';

export function pageOpenGraph(url: string, title: string): NonNullable<Metadata['openGraph']> {
  return {
    type: 'website',
    siteName: site.brand.name,
    title,
    description: site.meta.description,
    url,
    locale: 'en_US',
    images: [
      { url: webAsset('og.image').url, ...webAssetSize('og.image'), type: 'image/png', alt: `${brand.name}. ${brand.tagline}` },
    ],
  };
}
