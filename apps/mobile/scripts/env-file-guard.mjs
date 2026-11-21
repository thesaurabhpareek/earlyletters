/**
 * The `.env*` guard of the TestFlight preflight (scripts/preflight-testflight.mjs, section 4), as a pure function so a test
 * can run it on any file name and text without writing into apps/mobile.
 *
 * Why it exists: Expo bakes `EXPO_PUBLIC_*` values from the `.env*` files it loads into the bundle, and which files it loads
 * depends on NODE_ENV (`.env`, `.env.local` and `.env.production` for a release; `.env.development` and its `.local` for
 * `expo start`), a thing the preflight cannot see for an EAS worker. So a committed or stray `.env*` file may hold only values
 * that are harmless if they are baked into any build: the app env (the profile overrides it), and the server and analytics
 * switches only as `off`.
 *
 * `EXPO_PUBLIC_ACCOUNT_DELETION` (the Delete account row, founder, 30 Oct 2026) is never allowed in any `.env*` file, with any
 * value: the two alpha profiles leave it unset on purpose, so the EAS `preview` environment decides, and a file that filled
 * it in would show the row in a build meant to hide it. A drill gets the row by passing it to Metro in the shell
 * (docs/qa/run-sheets/AL-07-account-deletion.md "Needs first"), never through a file.
 */

/** The `KEY=value` lines of an env file, without blanks and comments. */
export function envFileLines(text) {
  return String(text)
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

/**
 * The entries of one `.env*` file that must not be there, as "<file>: <KEY>".
 * Allowed: EXPO_PUBLIC_APP_ENV (any value), EXPO_PUBLIC_SERVER_FEATURES=off and EXPO_PUBLIC_ANALYTICS=off.
 */
export function envFileProblems(file, text) {
  const bad = [];
  for (const line of envFileLines(text)) {
    const [k, ...v] = line.split('=');
    if (k === 'EXPO_PUBLIC_APP_ENV') continue;
    if (k === 'EXPO_PUBLIC_SERVER_FEATURES' && v.join('=').trim() === 'off') continue;
    if (k === 'EXPO_PUBLIC_ANALYTICS' && v.join('=').trim() === 'off') continue;
    bad.push(`${file}: ${k}`);
  }
  return bad;
}
