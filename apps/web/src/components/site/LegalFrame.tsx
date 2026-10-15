/** Owner: E1 (web platform). Paper-tone frame for the legal pages: a back link home, the page, then the footer. */
import Link from 'next/link';
import { legalCopy } from '@/lib/legal/legal-copy';
import { Footer } from './Footer';
import styles from './Legal.module.css';

export function LegalFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className={styles.frame}>
        <header className={styles.bar}>
          <Link href="/" className={styles.back}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
            {legalCopy.backHome}
          </Link>
        </header>
        <main id="main">{children}</main>
      </div>
      <Footer />
    </>
  );
}
