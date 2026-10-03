/** Owner: E1 (web platform). The 404 page, in the brand: night tone, one line, a link home. */
import type { Metadata } from 'next';
import Link from 'next/link';
import { siteCopy } from '@/lib/legal/site-copy';
import styles from '@/components/site/NotFound.module.css';

export const metadata: Metadata = { title: siteCopy.notFound.title };

export default function NotFound() {
  return (
    <main className={styles.page}>
      <p className={styles.line}>{siteCopy.notFound.line}</p>
      <Link className={styles.home} href="/">
        {siteCopy.notFound.home}
      </Link>
    </main>
  );
}
