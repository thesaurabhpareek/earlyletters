/**
 * The organised home page shown on production until the film is approved (SITE_MODE, see lib/site-mode.ts).
 * One calm page in seven parts: hero, how it works, languages, privacy, price, early access, footer. Every
 * word comes from site.ts, which the copy rules check. Server-rendered; only the lamp, the reveal-on-scroll
 * wrappers and the two buttons run in the browser. The sign-up form appears only when the email service is
 * configured at build time, so a visitor never meets a form that cannot work (set RESEND_API_KEY and
 * RESEND_SEGMENT_ID, then redeploy). The same code serves earlyletters.com once the domain is attached.
 */
import { site } from '@/content/site';
import { NotifyForm } from '@/components/cta/NotifyForm';
import { ShareButton } from '@/components/site/ShareButton';
import { Aurora } from './Aurora';
import { Reveal } from './Reveal';
import styles from './Landing.module.css';

const notifyReady = Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_SEGMENT_ID?.trim());

const s = site.scenes;
const steps = [s.s03, s.s04, s.s05, s.s06];

export function Landing() {
  return (
    <div className={styles.page}>
      <Aurora />

      <header className={styles.header}>
        <a href="#top" className={styles.brand}>
          {site.brand.name}
        </a>
        {notifyReady ? (
          <a href="#early-access" className={styles.headerButton}>
            {site.cta.prelaunch.button}
          </a>
        ) : null}
      </header>

      <main id="top" className={styles.main}>
        <section className={`${styles.section} ${styles.hero}`} aria-labelledby="hero-title">
          <h1 id="hero-title" className={styles.title}>
            {site.brand.name}
          </h1>
          <p className={styles.lead}>{site.comingSoon.line}</p>
          <p className={styles.trust}>{site.comingSoon.trust}</p>
          <div className={styles.actions}>
            <p className={styles.pill}>{site.cta.prelaunch.eyebrow}</p>
            {notifyReady ? (
              <a href="#early-access" className={styles.primary}>
                {site.cta.prelaunch.button}
              </a>
            ) : null}
          </div>
        </section>

        <section id="how" className={styles.section} aria-labelledby="how-title">
          <Reveal>
            <p className={styles.kicker}>{site.comingSoon.howTitle}</p>
            <h2 id="how-title" className={styles.h2}>
              {s.s02.headline}
            </h2>
            <p className={styles.sub}>{s.s02.support}</p>
          </Reveal>
          <ol className={styles.steps}>
            {steps.map((step, i) => (
              <li key={step.headline}>
                <Reveal delay={i * 0.08} className={styles.card}>
                  <h3 className={styles.h3}>{step.headline}</h3>
                  <p className={styles.cardText}>{step.support}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        <section id="languages" className={styles.section} aria-labelledby="lang-title">
          <Reveal>
            <p className={styles.kicker}>{s.s08.label}</p>
            <h2 id="lang-title" className={styles.h2}>
              {s.s08.headline}
            </h2>
            <p className={styles.sub}>{s.s08.support}</p>
          </Reveal>
          <ul className={styles.langs}>
            {s.s08.lines.map((line, i) => (
              <li key={line.lang}>
                <Reveal delay={i * 0.05} className={styles.lang}>
                  <span className={styles.langName}>{line.name}</span>
                  <span lang={line.lang} dir={line.dir} className={styles.langText}>
                    {line.text}
                  </span>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        <section id="private" className={styles.section} aria-labelledby="private-title">
          <Reveal>
            <p className={styles.kicker}>{s.s09.label}</p>
            <h2 id="private-title" className={styles.h2}>
              {s.s09.headline}
            </h2>
          </Reveal>
          <ul className={styles.points}>
            {s.s09.points.map((point, i) => (
              <li key={point}>
                <Reveal delay={i * 0.06} className={styles.point}>
                  {point}
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        <section id="price" className={styles.section} aria-labelledby="price-title">
          <Reveal>
            <p className={styles.kicker}>{s.s10.label}</p>
            <h2 id="price-title" className={styles.h2}>
              {s.s10.headline}
            </h2>
            <p className={styles.sub}>{s.s10.support}</p>
          </Reveal>
        </section>

        <section id="early-access" className={`${styles.section} ${styles.closing}`} aria-labelledby="start-title">
          <Reveal>
            <h2 id="start-title" className={styles.h2}>
              {s.s11.headline}
            </h2>
            {notifyReady ? (
              <>
                <p className={styles.sub}>{s.s11.supportPrelaunch}</p>
                <div className={styles.form}>
                  <NotifyForm />
                </div>
              </>
            ) : (
              <>
                <p className={styles.pill}>{site.cta.prelaunch.eyebrow}</p>
                <p className={styles.sub}>
                  {site.comingSoon.writeToUs} <a href={`mailto:${site.footer.contact}`}>{site.footer.contact}</a>
                </p>
              </>
            )}
            <ShareButton />
          </Reveal>
        </section>
      </main>

      <footer className={styles.footer}>
        <nav aria-label="Legal" className={styles.links}>
          {site.footer.links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <a href={`mailto:${site.footer.contact}`} className={styles.contact}>
          {site.footer.contact}
        </a>
      </footer>
    </div>
  );
}
