/**
 * Logo direction for the site header and footer. B1 drew direction "a", B2
 * direction "b" (packages/brand/assets/logo/<dir>/). The founder picks one;
 * null falls back to the typographic wordmark.
 * TODO(founder): confirm the direction.
 */
export const LOGO_DIRECTION: 'a' | 'b' | null = 'a';

const files = import.meta.glob('../../../../packages/brand/assets/logo/*/lockup-horizontal.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

/** The ink lockup with its fills switched to currentColor, so one inline SVG serves light and dark. */
export function lockupSvg(): string | null {
  if (!LOGO_DIRECTION) return null;
  const key = Object.keys(files).find((k) => k.includes(`/logo/${LOGO_DIRECTION}/`));
  if (!key) return null;
  return files[key]
    .replace(/<\?xml[^>]*>/, '')
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/\s(role|aria-label|width|height)="[^"]*"/g, '')
    .replace('<svg', '<svg aria-hidden="true" focusable="false" class="lockup"')
    .replace(/fill="#2B2722"/gi, 'fill="currentColor"');
}
