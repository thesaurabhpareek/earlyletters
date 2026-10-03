import { assetFor, type BrandAsset } from '@scribe/brand';

/**
 * Site logos, resolved through the brand registry (packages/brand/registry.ts):
 * `web.header` and `web.footer` name the lockup each place uses. No file names here.
 */
const files = import.meta.glob('../../../../packages/brand/assets/logo/primary/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

function raw(a: BrandAsset): string {
  const key = Object.keys(files).find((k) => a.path && k.endsWith(a.path.replace(/^packages\/brand\/assets\/logo\/primary/, '/primary')));
  if (!key) throw new Error(`logo: ${a.id} (${a.path}) not found in packages/brand/assets/logo/primary`);
  return files[key];
}

/** The ink lockup with its fills switched to currentColor, so one inline SVG serves light and dark. */
export function lockupSvg(place: 'header' | 'footer' = 'header'): string {
  const a = assetFor(place === 'header' ? 'web.header' : 'web.footer')[0];
  return raw(a)
    .replace(/<\?xml[^>]*>/, '')
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/\s(role|aria-label|width|height)="[^"]*"/g, '')
    .replace('<svg', `<svg aria-hidden="true" focusable="false" class="lockup" data-asset="${a.id}"`)
    .replace(new RegExp(`fill="${a.fill}"`, 'gi'), 'fill="currentColor"');
}

/** Absolute URL of the Open Graph image (`web.og-image`) and its size. */
export function ogImage(origin: string) {
  const a = assetFor('web.og-image')[0];
  return { url: new URL(a.url!, origin).toString(), width: a.dimensions!.width, height: a.dimensions!.height };
}
