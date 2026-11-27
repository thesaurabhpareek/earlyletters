/**
 * The You tab (NX-30a, founder 9 Nov 2026): Settings home as a tab root, so Settings is 1 tap and Account 2.
 * One component, not a copy: the body lives in app/settings/index.tsx (the only file that names the Settings routes,
 * test/account-deletion-switch.test.ts) and this route mounts it. The /settings deep link still opens that same file
 * as a pushed page. The Book's gear left in BL-938 (NS-22-R6).
 */
export { default } from '../settings/index';
