/**
 * BL-410: what the extended journey capture must hold, as data a test can read without a browser.
 *
 * Two lists. MATRIX is the set of (spoken language, text size, control) cells to capture for the two-up controls and the
 * tab labels (D-056 seven spoken languages; LEGAL-REQ-051 text size). SCREENS is every screen BL-410 names, with where it
 * stands: `new` (this folder records it), `covered` (an earlier journey already records it), `not-built` (no such screen in
 * src/app yet, so there is nothing to capture) or `device` (native only; the run sheet and BL-279 hold it).
 * apps/mobile/test/journey-capture-matrix.test.ts keeps both honest against the flows and src/app.
 */

/** hi, es, zh, fr, ar (forced RTL) and pt. English is the default capture every other journey already holds. */
export const LOCALES = [
  { code: 'hi', rtl: false },
  { code: 'es', rtl: false },
  { code: 'zh', rtl: false },
  { code: 'fr', rtl: false },
  { code: 'ar', rtl: true },
  { code: 'pt', rtl: false },

] as const;

/** Default size, AX3 and AX5 (the accessibility sizes; scale names as in src/lib/a11y.logic.ts). */
export const SCALES = ['default', 'ax3', 'ax5'] as const;

/** The two-up controls and tab labels. `label` is the English words the control carries today. */
export const CONTROLS = [
  { key: 'born-or-not-yet', route: '/onboarding', label: ['Birthday', 'Not here yet'] },
  { key: 'add-to-book', route: '/review', label: ["Add to {child}'s book"] },
  // The row says "Keep it word for word" and "Sounds like me | Not quite"; the app says these today (content strings,
  // review.view and onboarding.cta). Reported to product as a req-question; the keys follow the app, not the old words.
  { key: 'exact-view', route: '/review', label: ['With small fixes', 'Exactly as said'] },
  { key: 'sounds-right', route: '/onboarding', label: ['That sounds right'] },
  { key: 'tab-labels', route: '/', label: ['Home', 'Book', 'Me'] },
] as const;

export type LocaleCode = (typeof LOCALES)[number]['code'];
export type Scale = (typeof SCALES)[number];
export type ControlKey = (typeof CONTROLS)[number]['key'];

/** Step id for one cell, e.g. J24-ar-ax5-born-or-not-yet. build-index reads the code before the first dash. */
export const cellStepId = (locale: LocaleCode, scale: Scale, control: ControlKey) => `J24-${locale}-${scale}-${control}`;

export function allCells() {
  return LOCALES.flatMap((l) => SCALES.flatMap((s) => CONTROLS.map((c) => ({ locale: l.code, scale: s, control: c.key, id: cellStepId(l.code, s, c.key) }))));
}

export type ScreenStatus =
  | { id: string; status: 'new'; flow: string; stepTitle: string }
  | { id: string; status: 'covered'; flow: string; stepTitle: string }
  | { id: string; status: 'not-built'; route: string; why: string }
  | { id: string; status: 'device'; why: string };

export const SCREENS: ScreenStatus[] = [
  { id: 'storage', status: 'covered', flow: 'j14-recordings.flow.ts', stepTitle: 'Storage, languages' },
  { id: 'spoken-language', status: 'new', flow: 'j23-more-screens.flow.ts', stepTitle: 'Spoken language' },
  { id: 'legal-terms-privacy', status: 'new', flow: 'j23-more-screens.flow.ts', stepTitle: 'Legal' },
  { id: 'about', status: 'covered', flow: 'j16-settings.flow.ts', stepTitle: 'Settings' },
  { id: 'tonight-not-yet-born', status: 'covered', flow: 'j04-tonight.flow.ts', stepTitle: 'Tonight before the birth' },
  { id: 'long-book', status: 'covered', flow: 'j09-book.flow.ts', stepTitle: 'Many letters, by month' },
  { id: 'help', status: 'not-built', route: 'settings/help', why: 'No Help screen in src/app/settings; Settings reaches the struggling pages and Legal only.' },
  { id: 'write-to-us', status: 'not-built', route: 'settings/contact', why: 'No Write to us screen in src/app/settings.' },
  { id: 'in-app-terms-privacy', status: 'not-built', route: 'settings/terms', why: 'Terms and Privacy Policy rows open the website (settings/legal.tsx), not an in-app page.' },
  { id: 'second-waiting-draft', status: 'not-built', route: 'seed:asha-waiting-two', why: 'The web seed fills one waiting draft (src/dev/asha-seed.ts); a second needs a seed kind.' },
  { id: 'lock-screen-notification', status: 'device', why: 'A notification on the lock screen is the phone; BL-279 evidence and docs/qa/DEVICE_TEST_PLAN.md.' },
  { id: 'interruption-states', status: 'device', why: 'A call, Siri or a route change interrupting a take needs the phone.' },
  { id: 'model-missing', status: 'device', why: 'The speech model is absent only on a phone; the web build has none to remove.' },
];
