/**
 * The icon iPhones use for "Add to Home Screen" and some link previews: the approved app icon tile at 180 px (brand
 * registry `favicon.apple-touch`), byte for byte. Nothing is drawn here.
 * It stays at /apple-icon, where the site has always served it, so welcome emails already sent keep their picture.
 * The file is public/favicon/apple-touch-icon.png (also served there), copied by scripts/web/sync-brand-assets.mjs.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { webAsset, webAssetSize } from '../lib/brand/web-assets';

const icon = webAsset('favicon.apple-touch');

export const size = webAssetSize('favicon.apple-touch');
export const contentType = 'image/png';

// Read at build time (the route is static); the build runs in apps/web.
export default async function AppleIcon(): Promise<Response> {
  const png = await readFile(join(process.cwd(), 'public', icon.url));
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': contentType } });
}
