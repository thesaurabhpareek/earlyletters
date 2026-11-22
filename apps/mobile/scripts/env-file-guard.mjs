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
 *
 * Only plain `KEY=value` lines are parsed: `export KEY=value` is unparsable here (it is reported as a line number, and so is a FAIL).
 * A FAIL line never carries text from the file except an `EXPO_PUBLIC_*` name of at most 64 characters; anything else is
 * reported as `<unparsable line N>`, because a secret can sit in the name position (`sb_secret_...=1`).
 */

/** The only shape of name that is ever printed: a public build switch, short, upper case. */
const PRINTABLE_NAME = /^EXPO_PUBLIC_[A-Z0-9_]{1,64}$/;

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
  String(text)
    .split('\n')
    .forEach((raw, i) => {
      const line = raw.trim();
      if (!line || line.startsWith('#')) return;
      const eq = line.indexOf('=');
      const k = eq === -1 ? '' : line.slice(0, eq).trim();
      const v = eq === -1 ? '' : line.slice(eq + 1).trim();
      // Never echo content from a line: a name is printed only when there is an "=" and it has the EXPO_PUBLIC_* shape.
      const named = eq !== -1 && PRINTABLE_NAME.test(k);
      if (named && k === 'EXPO_PUBLIC_APP_ENV') return;
      if (named && k === 'EXPO_PUBLIC_SERVER_FEATURES' && v === 'off') return;
      if (named && k === 'EXPO_PUBLIC_ANALYTICS' && v === 'off') return;
      bad.push(`${file}: ${named ? k : `<unparsable line ${i + 1}>`}`);
    });
  return bad;
}
