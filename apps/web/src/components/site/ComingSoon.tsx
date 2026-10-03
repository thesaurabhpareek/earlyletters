/**
 * The calm holding page shown on production until the film is approved (SITE_MODE=coming-soon).
 * Server-rendered text; only the lamp and the two buttons run in the browser. Words from site.ts.
 * The sign-up form appears only when the email service is configured at build time, so a visitor never
 * meets a form that cannot work (set RESEND_API_KEY and RESEND_SEGMENT_ID, then redeploy).
 */
import { site } from '@/content/site';
import { NotifyForm } from '@/components/cta/NotifyForm';
import { LampLight } from './LampLight';
import { ShareButton } from './ShareButton';
import styles from './ComingSoon.module.css';

const notifyReady = Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_SEGMENT_ID?.trim());

export function ComingSoon() {
  return (
    <div className={styles.page}>
      <LampLight />
      <div className={styles.vignette} aria-hidden />
      <main className={styles.main}>
        <h1 className={styles.title}>{site.brand.name}</h1>
        <p className={styles.line}>{site.comingSoon.line}</p>
        <p className={`${styles.line} ${styles.trust}`}>{site.comingSoon.trust}</p>
        <p className={styles.soon}>{site.cta.prelaunch.eyebrow}</p>
        {notifyReady ? <div className={styles.form}><NotifyForm /></div> : null}
        <ShareButton />
      </main>
      <footer className={styles.footer}>
        <a href={`mailto:${site.footer.contact}`}>{site.footer.contact}</a>
      </footer>
    </div>
  );
}
