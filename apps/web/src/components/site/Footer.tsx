/**
 * Owner: E1 (web platform). Night-tone footer: the name, one quiet line, and the links: Privacy, Terms, Contact.
 * Used by the film (a client component) and the legal pages, so it stays free of server-only code.
 * The links come from site.footer (Contact is a mailto link); the new words are in lib/legal/site-copy.ts.
 */
import Link from 'next/link';
import { Wordmark } from '@/components/brand/Wordmark';
import { site } from '@/content/site';
import { siteCopy } from '@/lib/legal/site-copy';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
          <p className={styles.mark}>
            <Wordmark />
          </p>
          <p className={styles.tagline}>{siteCopy.footer.tagline}</p>
        </div>

        <nav aria-label={siteCopy.footer.legalNavLabel}>
          <ul className={styles.links}>
            {site.footer.links.map((link) => (
              <li key={link.href}>
                {link.href.startsWith('mailto:') ? (
                  <a className={styles.link} href={link.href}>
                    {link.label}
                  </a>
                ) : (
                  <Link className={styles.link} href={link.href}>
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
