/**
 * The launch gate, checked when the build starts (next.config.ts). Owner: E3 (release).
 *
 * The site goes to launch mode when NEXT_PUBLIC_APP_STORE_URL is a valid App Store product link (src/lib/launch.ts).
 * That alone would put a text stand-in where Apple's badge belongs, or do nothing on the wrong home page. So when the
 * link is valid this gate also demands everything the launch needs, and the build stops with a message that says what
 * is missing. With the link unset or invalid nothing is checked: the live site is untouched.
 *
 * Pure: the environment and the files arrive as arguments, so every branch is tested (test/launch-guard.test.ts).
 */
import { checkAppStoreUrl } from './launch';
import { storeQrMatches, type StoreQrData } from './qr/build';
import { resolveSiteMode } from './site-mode';

/** Where the founder puts Apple's artwork, relative to apps/web. */
export const BADGE_FILE = 'public/brand/app-store-badge.svg';

/** The marker the rehearsal build writes into its stand-in file; the real build refuses any file that has it. */
export const REHEARSAL_MARKER = 'EARLY-LETTERS-REHEARSAL-STAND-IN';

/** Apple's own file is about 10 KB. Anything much smaller is not the artwork. */
const MIN_BADGE_BYTES = 1500;

export type LaunchGateInput = {
  env: Readonly<Record<string, string | undefined>>;
  /** The contents of BADGE_FILE, or null when the file is not there. */
  badgeFile: string | null;
  /** The committed QR (qr.generated.ts) and the link this deployment's QR must open (appStoreHref('qr')). */
  qr: StoreQrData;
  qrHref: string;
};

export type LaunchGateResult = { launch: boolean; rehearsal: boolean; problems: string[]; notes: string[] };

export function checkLaunchGate({ env, badgeFile, qr, qrHref }: LaunchGateInput): LaunchGateResult {
  const url = checkAppStoreUrl(env.NEXT_PUBLIC_APP_STORE_URL);
  const result: LaunchGateResult = { launch: url.ok, rehearsal: false, problems: [], notes: [] };
  if (!url.ok) return result; // prelaunch (or an invalid link, which launch.ts reports on its own): nothing to demand

  const rehearsal = env.LAUNCH_REHEARSAL === '1';
  result.rehearsal = rehearsal;
  if (rehearsal && env.VERCEL_ENV === 'production') {
    result.problems.push('LAUNCH_REHEARSAL=1 is set on a production build. It is for the rehearsal script only: unset it.');
  }

  if (resolveSiteMode(env) !== 'film') {
    result.problems.push(
      'The launch action lives in the scroll film, but SITE_MODE is not "film" for this build (the holding page has no download action). Set SITE_MODE=film.',
    );
  }

  if (env.NEXT_PUBLIC_APP_STORE_BADGE !== '1') {
    result.problems.push('NEXT_PUBLIC_APP_STORE_BADGE must be 1 once the official badge file is in place, or the site shows a plain text stand-in.');
  }

  if (rehearsal) {
    result.notes.push('Rehearsal build: the badge file is not checked.');
  } else if (badgeFile === null) {
    result.problems.push(`${BADGE_FILE} is missing. Add Apple's official "Download on the App Store" SVG there (see docs/web/launch-flip.md).`);
  } else {
    const file = badgeFile.trim();
    if (!/<svg[\s>]/i.test(file)) result.problems.push(`${BADGE_FILE} is not an SVG file.`);
    else if (file.length < MIN_BADGE_BYTES) result.problems.push(`${BADGE_FILE} is only ${file.length} bytes; Apple's artwork is about 10 KB. This looks like a stand-in.`);
    if (file.includes(REHEARSAL_MARKER)) result.problems.push(`${BADGE_FILE} is the rehearsal stand-in, not Apple's artwork.`);
    if (/<script[\s>]/i.test(file) || /\son[a-z]+\s*=/i.test(file)) result.problems.push(`${BADGE_FILE} contains script. Apple's artwork has none: do not use this file.`);
  }

  if (!storeQrMatches(qr, qrHref)) {
    result.problems.push(
      qr.url
        ? `The committed QR (src/lib/qr/qr.generated.ts) opens ${qr.url}, not ${qrHref}. Run: npm run qr:generate -w @scribe/web -- "<store link>" <provider token>, and commit the result.`
        : 'The committed QR (src/lib/qr/qr.generated.ts) is empty. Run: npm run qr:generate -w @scribe/web -- "<store link>" <provider token>, and commit the result.',
    );
  }

  if (!/^\d{1,12}$/.test((env.NEXT_PUBLIC_APPLE_PROVIDER_TOKEN ?? '').trim()) && !new URL(url.url).searchParams.get('pt')) {
    result.notes.push(
      'No Apple provider token (NEXT_PUBLIC_APPLE_PROVIDER_TOKEN, or pt in the link): links will carry no campaign token, so App Store Connect cannot count by placement. The site still works.',
    );
  }
  return result;
}

/** The message the build stops with. */
export function launchGateMessage(problems: string[]): string {
  return [
    '[launch] The launch switch is on (NEXT_PUBLIC_APP_STORE_URL is a valid App Store link) but the launch is not ready:',
    ...problems.map((p) => `  - ${p}`),
    'Fix these, or unset NEXT_PUBLIC_APP_STORE_URL to build the prelaunch site. Steps: docs/web/launch-flip.md.',
  ].join('\n');
}
