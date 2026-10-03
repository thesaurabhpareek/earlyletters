/**
 * The calm holding page shown on production until the film is approved (SITE_MODE=coming-soon).
 * Server-rendered, no JavaScript needed. Words from site.ts.
 */
import { site } from '@/content/site';
import styles from './ComingSoon.module.css';

export function ComingSoon() {
  return (
    <div className={styles.page}>
      <div className={styles.light} aria-hidden />
      <div className={styles.vignette} aria-hidden />
      <main className={styles.main}>
        <h1 className={styles.title}>{site.brand.name}</h1>
        <p className={styles.line}>{site.comingSoon.line}</p>
        <p className={`${styles.line} ${styles.trust}`}>{site.comingSoon.trust}</p>
        <p className={styles.soon}>{site.cta.prelaunch.eyebrow}</p>
      </main>
      <footer className={styles.footer}>
        <a href={`mailto:${site.footer.contact}`}>{site.footer.contact}</a>
      </footer>
    </div>
  );
}
