/**
 * Owner: S20 (web). The page the link at the end of most emails opens when the app does not (BL-510, TPL-06;
 * `appUrl` in packages/emails/src/links.ts). With the app on the phone, iOS opens the app directly because /open is
 * in the apple-app-site-association paths; this page is the fallback.
 *
 * Rules: no token (the link carries none), no analytics, no third-party script, no request on load. "Open the app"
 * uses the app's own scheme with nothing after it. The App Store link shows only once the site is in launch mode
 * (a valid NEXT_PUBLIC_APP_STORE_URL, src/lib/launch.ts); before that there is no store page to point at, so the
 * page never shows a dead link. Never indexed. The words are `site.openApp` (content rules: test/copy-rules.test.ts).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { brand } from '@scribe/brand';
import { site } from '@/content/site';
import { pageShareCard } from '@/lib/brand/share-card';
import { launch } from '@/lib/launch';
import styles from '../auth/confirm/confirm.module.css';

/** The app itself, no path and no secret. */
export const OPEN_APP_HREF = `${brand.scheme}://`;

export const metadata: Metadata = {
  title: site.openApp.title,
  robots: { index: false, follow: false },
  alternates: { canonical: '/open' },
  ...pageShareCard('/open', site.openApp.title),
};

export default function OpenPage() {
  const copy = site.openApp;
  const live = launch.mode === 'live';
  return (
    <main className={styles.page}>
      <h1 className={styles.line}>{copy.line}</h1>
      <p className={styles.body}>{live ? copy.body : copy.bodyPrelaunch}</p>
      <a className={styles.open} href={OPEN_APP_HREF}>
        {copy.open}
      </a>
      {live ? (
        <a className={styles.home} href={launch.appStoreUrl} rel="noopener">
          {copy.get}
        </a>
      ) : null}
      <p className={styles.small}>{copy.onComputer}</p>
      <Link className={styles.home} href="/" prefetch={false}>
        {copy.home}
      </Link>
    </main>
  );
}
