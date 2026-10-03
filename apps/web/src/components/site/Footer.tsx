/**
 * Owner: E1 (web platform). Night-tone footer: name, one quiet line, contact and the legal links.
 * Used by the film (a client component) and the legal pages, so it stays free of server-only code.
 * Links and contact come from site.footer; the new words are in lib/legal/site-copy.ts.
 */
import Link from 'next/link';
import { Wordmark } from '@/components/brand/Wordmark';
import { site } from '@/content/site';
import { siteCopy } from '@/lib/legal/site-copy';
import styles from './Footer.module.css';

export function Footer() {
  const { contact, links } = site.footer;
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.identity}>
          <p className={styles.mark}>
            <Wordmark />
          </p>
          <p className={styles.tagline}>{siteCopy.footer.tagline}</p>
        </div>

        <div className={styles.contact}>
          <p className={styles.contactLead}>{siteCopy.footer.contactLead}</p>
          <a className={styles.email} href={`mailto:${contact}`}>
            {contact}
          </a>
        </div>

        <nav className={styles.nav} aria-label={siteCopy.footer.legalNavLabel}>
          <ul className={styles.links}>
            {links.map((link) => (
              <li key={link.href}>
                <Link className={styles.link} href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
