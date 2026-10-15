/**
 * Where a person goes from the not-found screen: always Tonight, the root of the app.
 * Kept as a function so the target is tested once and never typed in two places.
 */
export const TONIGHT_HREF = '/' as const;

/** Routes that start something real (microphone, a draft, audio playback). A link from outside the app never opens them directly. */
const CAPTURE_ROUTES = ['/listen', '/review', '/read-together'] as const;

/** Path only: no scheme, host, query or fragment, no trailing slash, lowercase. */
export function routePathOf(raw: string): string {
  let p = raw.trim();
  const scheme = p.match(/^[a-z][a-z0-9+.-]*:\/\/([^/?#]*)(.*)$/i);
  // scribe://listen puts "listen" in the host slot; https://host/listen puts it in the path.
  if (scheme) {
    const isCustom = !/^https?:/i.test(p);
    p = isCustom ? `/${scheme[1]}${scheme[2]}` : scheme[2] || '/';
  }
  p = p.split('#')[0].split('?')[0];
  if (!p.startsWith('/')) p = `/${p}`;
  p = p.replace(/\/{2,}/g, '/').replace(/\/+$/, '') || '/';
  return p.toLowerCase();
}

/** True when an incoming link points at a screen that must only open from a tap inside the app. */
export function isCaptureRoute(raw: string): boolean {
  const p = routePathOf(raw);
  return CAPTURE_ROUTES.some((r) => p === r || p.startsWith(`${r}/`));
}
