/**
 * Owner: E2 (back-end). Where a native form post lands when the address was not saved. `e` is a short reason
 * (invalid, slow, server); anything else reads as server. The words are `site.notify`. Never indexed.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import styles from '@/components/site/Unsubscribe.module.css';
import { site } from '@/content/site';

export const metadata: Metadata = { title: site.notify.sorryTitle, robots: { index: false, follow: false } };

export default async function SorryPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  const n = site.notify;
  const body = e === 'invalid' ? n.error : e === 'slow' ? n.rateLimited : n.server;
  return (
    <main className={styles.page}>
      <h1 className={styles.line}>{n.sorryTitle}</h1>
      <p className={styles.body}>{body}</p>
      <Link className={styles.home} href="/">
        {n.home}
      </Link>
    </main>
  );
}
