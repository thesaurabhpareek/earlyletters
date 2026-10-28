/**
 * Owner: E2 (back-end). Where a native form post (script off, or not loaded yet) lands when the address was already on the list.
 * The words are `site.notify`. Never indexed. Static.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import styles from '@/components/site/Unsubscribe.module.css';
import { site } from '@/content/site';

export const metadata: Metadata = { title: site.notify.alreadyTitle, robots: { index: false, follow: false } };

export default function AlreadyPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.line}>{site.notify.alreadyTitle}</h1>
      <p className={styles.body}>{site.notify.already}</p>
      <Link className={styles.home} href="/">
        {site.notify.home}
      </Link>
    </main>
  );
}
