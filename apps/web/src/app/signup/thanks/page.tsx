/**
 * Owner: E2 (back-end). Where a native form post (script off, or not loaded yet) lands after the address was saved.
 * The words are `site.notify`. Never indexed. Static.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import styles from '@/components/site/Unsubscribe.module.css';
import { site } from '@/content/site';

export const metadata: Metadata = { title: site.notify.thanksTitle, robots: { index: false, follow: false } };

export default function ThanksPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.line}>{site.notify.thanksTitle}</h1>
      <p className={styles.body}>{site.notify.success}</p>
      <Link className={styles.home} href="/">
        {site.notify.home}
      </Link>
    </main>
  );
}
