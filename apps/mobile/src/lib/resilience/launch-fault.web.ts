/**
 * WEB PREVIEW ONLY (never shipped: gated like the seed in dev/store-ready.web.ts). Lets the recorded
 * journey flow (apps/mobile/e2e-web j20) show the launch recovery screen:
 *   ?fault=launch       every open fails (Try again keeps failing)
 *   ?fault=launch-once  the first open fails, Try again works
 */
let used = false;

export function launchFaultForPreview(): boolean {
  const preview = __DEV__ || process.env.EXPO_PUBLIC_WEB_PREVIEW === '1';
  if (!preview || typeof window === 'undefined') return false;
  const fault = new URLSearchParams(window.location.search).get('fault');
  if (fault === 'launch') return true;
  if (fault === 'launch-once' && !used) {
    used = true;
    return true;
  }
  return false;
}
