/**
 * Owner: S20 (web). The page a co-parent invite link opens when the app does not (PRD V2 F11 6.3 step 1, F11-U01;
 * F21-REQ-024). Served at /i and, through a rewrite in next.config.ts, at every /i/<token> the app on `develop`
 * writes (apps/mobile src/lib/family/invite-link.logic.ts), so one static page answers every token and no token is
 * ever rendered, cached or stored by this site.
 *
 * Rules (F11-REQ-005, B-NFR-002): no analytics, no third-party script, no request that carries the token, no
 * child or inviter name. Its one action copies the page's own address on a tap; the app's "I was invited" reads
 * the token out of the pasted link. The Referer header is off for /i (next.config.ts).
 *
 * Known gap: /i/<token> puts the token in the path, so the request for this page reaches the host and its logs.
 * PRD V2 F11 writes invites as /j#t=<token> (fragment only); moving the app to that format is WP-F11-11 with S04.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/content/site';
import styles from '../auth/confirm/confirm.module.css';
import { CopyInvite } from './CopyInvite';

export const metadata: Metadata = {
  title: site.invite.title,
  robots: { index: false, follow: false },
};

export default function InvitePage() {
  const copy = site.invite;
  return (
    <main className={styles.page}>
      <h1 className={styles.line}>{copy.line}</h1>
      <p className={styles.body}>{copy.body}</p>
      <CopyInvite label={copy.copy} copied={copy.copied} failed={copy.copyFailed} />
      <p className={styles.small}>{copy.notYou}</p>
      <Link className={styles.home} href="/" prefetch={false}>
        {copy.home}
      </Link>
    </main>
  );
}
