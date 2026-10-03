/**
 * Owner: E3 (release). Decides whether the page shows the pre-launch email form or the App Store badge.
 * Flip to live by setting NEXT_PUBLIC_APP_STORE_URL in Vercel (docs/ops/WEBSITE_RUNBOOK.md).
 */
const appStoreUrl = process.env.NEXT_PUBLIC_APP_STORE_URL ?? '';

export const launch = {
  mode: (appStoreUrl ? 'live' : 'prelaunch') as 'live' | 'prelaunch',
  appStoreUrl,
};
