/**
 * Owner: S20 (web). The page a co-parent invite link opens when the app does not (PRD V2 F11 6.3 step 1, F11-U01,
 * F11-U02; WP-F11-11; F21-REQ-024). The app writes invites as https://earlyletters.com/j#t=<token>
 * (apps/mobile src/lib/family/invite-link.logic.ts). The token is in the fragment, which the browser never sends,
 * so the request for this page is a plain /j: one static page, and no server, log or cache ever sees a token.
 *
 * Rules (F11-REQ-005, B-NFR-002): no analytics, no third-party script, no request that carries the token, no
 * child or inviter name. Its one action copies the page's own address (fragment included) on a tap; the app's
 * "I was invited" reads the token out of the pasted link. If a chat or mail app's own browser dropped the fragment,
 * the page says so instead of offering a copy that would not work (F11-U02). The Referer header is off for /j
 * (next.config.ts).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/content/site';
import { pageOpenGraph } from '@/lib/brand/share-card';
import styles from '../auth/confirm/confirm.module.css';
import { CopyInvite } from './CopyInvite';

export const metadata: Metadata = {
  title: site.invite.title,
  robots: { index: false, follow: false },
  // Its own address and share card, not the home page's from layout.tsx (chats build link previews from these).
  alternates: { canonical: '/j' },
  openGraph: pageOpenGraph('/j', site.invite.title),
};

export default function InvitePage() {
  const copy = site.invite;
  return (
    <main className={styles.page}>
      <h1 className={styles.line}>{copy.line}</h1>
      <p className={styles.body}>{copy.body}</p>
      <ol className={styles.steps}>
        {copy.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <CopyInvite label={copy.copy} copied={copy.copied} failed={copy.copyFailed} missing={copy.missing} />
      <p className={styles.small}>{copy.onComputer}</p>
      <p className={styles.small}>{copy.notYou}</p>
      <Link className={styles.home} href="/" prefetch={false}>
        {copy.home}
      </Link>
    </main>
  );
}
