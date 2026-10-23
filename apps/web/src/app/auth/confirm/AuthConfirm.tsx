/**
 * Owner: S20 (web). The page a sign-in or confirm-your-email link opens when the app does not (PRD V2 F02 6.3
 * step 3b, F02-U09; WP-F02-10). Used by /auth/confirm and by /auth/callback, the path the app and the email
 * templates on `develop` still use until they move to /auth/confirm.
 *
 * Rules (A-REQ-023, F02-REQ-011, F21-REQ-024; docs/ops/AUTH_SETUP.md 5.3 on `develop`, not yet on `main`):
 * - It verifies nothing. The token sits in the URL fragment, which no server receives, and nothing here reads it:
 *   no Supabase call on load, on script run or on any button; no form; no analytics; no third-party script.
 *   After load, ForgetAddress takes the fragment (and any query) out of the address bar.
 * - "Open the app" uses the app's own scheme with no token in it, ever. The custom scheme lands on the app's
 *   "type the code" screen (apps/mobile src/lib/auth/links.logic.ts), and any app could claim a scheme, so a
 *   secret never travels in one.
 * - Never indexed; the Referer header is off for /auth (next.config.ts).
 * The words are `site.authConfirm` (content rules in test/copy-rules.test.ts).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { brand } from '@scribe/brand';
import { site } from '@/content/site';
import { pageShareCard } from '@/lib/brand/share-card';
import styles from './confirm.module.css';
import { ForgetAddress } from './ForgetAddress';

/** The app's "type the code" screen. Scheme from packages/brand; the path matches the app's AUTH_CALLBACK_PATH. */
export const OPEN_APP_HREF = `${brand.scheme}://auth/callback`;

export const authConfirmMetadata: Metadata = {
  title: site.authConfirm.title,
  robots: { index: false, follow: false },
  // Its own address and share card, not the home page's from layout.tsx. /auth/callback shares both.
  alternates: { canonical: '/auth/confirm' },
  ...pageShareCard('/auth/confirm', site.authConfirm.title),
};

export function AuthConfirm() {
  const copy = site.authConfirm;
  return (
    <main className={styles.page}>
      <h1 className={styles.line}>{copy.line}</h1>
      <p className={styles.body}>{copy.body}</p>
      <p className={styles.body}>{copy.onPhone}</p>
      <a className={styles.open} href={OPEN_APP_HREF}>
        {copy.open}
      </a>
      <p className={styles.small}>{copy.expired}</p>
      <p className={styles.small}>{copy.notYou}</p>
      <Link className={styles.home} href="/" prefetch={false}>
        {copy.home}
      </Link>
      <ForgetAddress />
    </main>
  );
}
