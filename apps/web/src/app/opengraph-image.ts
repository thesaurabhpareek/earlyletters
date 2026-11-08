/**
 * The picture that appears when the link is shared (Messages, WhatsApp, Slack, social): the approved share image,
 * the stacked lockup and the tagline on paper (brand registry `og.image`, 1200 x 630), byte for byte. Nothing is
 * drawn here. It stays at /opengraph-image, the address link previews already know.
 * The file is public/og/og-image.png (also served there), copied by scripts/web/sync-brand-assets.mjs.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { brand } from '@scribe/brand';
import { webAsset, webAssetSize } from '../lib/brand/web-assets';

const image = webAsset('og.image');

/** What the picture shows: the name and the tagline. */
export const alt = `${brand.name}. ${brand.tagline}`;
export const size = webAssetSize('og.image');
export const contentType = 'image/png';

// Read at build time (the route is static); the build runs in apps/web.
export default async function OpenGraphImage(): Promise<Response> {
  const png = await readFile(join(process.cwd(), 'public', image.url));
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': contentType } });
}
