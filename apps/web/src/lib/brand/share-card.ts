/**
 * Owner: S20 (web). The share card for a page that is not the home page: its own url and title, with the site's name,
 * description and approved share image, in the Open Graph tags and in the Twitter tags that some link previews read
 * first. Next merges metadata shallowly, so a page that sets `openGraph` or `twitter` replaces the layout's whole
 * object: the share image from app/opengraph-image.ts and the home page's twitter:title included. This names the image
 * again (brand registry `og.image`, served at its registry url), so the card keeps its picture, and gives both sets of
 * tags the page's own title.
 */
import type { Metadata } from 'next';
import { brand } from '@scribe/brand';
import { site } from '@/content/site';
import { webAsset, webAssetSize } from './web-assets';

export function pageShareCard(url: string, title: string): Pick<Metadata, 'openGraph' | 'twitter'> {
  const description = site.meta.description;
  const images = [
    { url: webAsset('og.image').url, ...webAssetSize('og.image'), type: 'image/png', alt: `${brand.name}. ${brand.tagline}` },
  ];
  return {
    openGraph: { type: 'website', siteName: site.brand.name, title, description, url, locale: 'en_US', images },
    twitter: { card: 'summary_large_image', title, description, images },
  };
}
