/**
 * The home page shown on production until the film is approved (SITE_MODE, see lib/site-mode.ts), told as a
 * short story over a lamp that changes colour as you read, with scroll-linked motion in the style of a product
 * launch page: the hero recedes, "Meera is asleep." and the proof letter are pinned scenes that your scroll
 * plays, paragraphs fill from dim to bright as you read them, and the rest lift into place the same way. Every word comes from site.ts, which the copy rules check. The server
 * renders every scene in its finished state, so the page reads without JavaScript and with reduced motion
 * (scrub.tsx). The sign-up form appears only when the email service is configured at build time, so a visitor
 * never meets a form that cannot work (set RESEND_API_KEY and RESEND_SEGMENT_ID, then redeploy). The same code
 * serves earlyletters.com once the domain is attached.
 */
import { site } from '@/content/site';
import { NotifyForm } from '@/components/cta/NotifyForm';
import { ShareButton } from '@/components/site/ShareButton';
import { Aurora } from './Aurora';
import { Evening } from './Evening';
import { ProofScene } from './ProofScene';
import { FillText, HeroStage, Rise } from './scrub';
import { StoryRail } from './StoryRail';
import styles from './Landing.module.css';

const notifyReady = Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_SEGMENT_ID?.trim());

const s = site.scenes;

export function Landing() {
  return (
    <div className={styles.page}>
      <Aurora />
      <StoryRail />

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
        <HeroStage className={`${styles.section} ${styles.hero}`} innerClassName={styles.heroInner}>
          <h1 id="hero-title" className={`${styles.title} ${styles.sheen}`}>
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
        </HeroStage>

        <Evening />

        <section id="how" className={styles.section} aria-labelledby="minute-title">
          <Rise>
            <p className={styles.kicker}>{site.comingSoon.howTitle}</p>
            <h2 id="minute-title" className={styles.h2}>
              {s.s02.headline}
            </h2>
          </Rise>
          <FillText text={s.s02.support} className={styles.sub} />
          <Rise className={styles.pull}>
            <p className={styles.pullTitle}>{s.s03.headline}</p>
            <p className={styles.pullText}>{s.s03.support}</p>
          </Rise>
        </section>

        <ProofScene />

        <section className={styles.section} aria-labelledby="voice-title">
          <div className={styles.split}>
            <div>
              <Rise>
                <h2 id="voice-title" className={styles.h2}>
                  {s.s05.headline}
                </h2>
              </Rise>
              <FillText text={s.s05.support} className={styles.sub} />
            </div>
            <Rise className={styles.years}>
              <p className={styles.kicker}>{s.s07.dateline}</p>
              <p className={styles.yearsTitle}>{s.s07.headline}</p>
              <p className={styles.cardText}>{s.s07.support}</p>
            </Rise>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="book-title">
          <Rise>
            <p className={styles.kicker}>{s.s06.label}</p>
            <h2 id="book-title" className={styles.h2}>
              {s.s06.headline}
            </h2>
          </Rise>
          <FillText text={s.s06.support} className={styles.sub} />
          <ol className={styles.timeline}>
            {s.s06.chapters.map((chapter, i) => {
              const last = i === s.s06.chapters.length - 1;
              return (
                <li key={chapter.month}>
                  <Rise className={`${styles.month} ${last ? styles.monthNow : ''}`}>
                    {last ? <span className={styles.filed}>{s.s06.filedChip}</span> : null}
                    <span className={styles.monthName}>{chapter.month}</span>
                    <span className={styles.monthMeta}>{chapter.meta}</span>
                  </Rise>
                </li>
              );
            })}
          </ol>
        </section>

        <section id="languages" className={styles.section} aria-labelledby="lang-title">
          <Rise>
            <p className={styles.kicker}>{s.s08.label}</p>
            <h2 id="lang-title" className={styles.h2}>
              {s.s08.headline}
            </h2>
          </Rise>
          <FillText text={s.s08.support} className={styles.sub} />
          <ul className={styles.langs}>
            {s.s08.lines.map((line, i) => (
              <li key={line.lang}>
                <Rise className={styles.lang}>
                  <span className={styles.langName}>{line.name}</span>
                  <span lang={line.lang} dir={line.dir} className={styles.langText}>
                    {line.text}
                  </span>
                </Rise>
              </li>
            ))}
          </ul>
        </section>

        <section id="private" className={styles.section} aria-labelledby="private-title">
          <Rise>
            <p className={styles.kicker}>{s.s09.label}</p>
            <h2 id="private-title" className={styles.h2}>
              {s.s09.headline}
            </h2>
          </Rise>
          <ul className={styles.points}>
            {s.s09.points.map((point) => (
              <li key={point}>
                <Rise className={styles.point}>{point}</Rise>
              </li>
            ))}
          </ul>
        </section>

        <section id="price" className={styles.section} aria-labelledby="price-title">
          <Rise>
            <p className={styles.kicker}>{s.s10.label}</p>
            <h2 id="price-title" className={styles.h2}>
              {s.s10.headline}
            </h2>
          </Rise>
          <FillText text={s.s10.support} className={styles.sub} />
        </section>

        <section id="early-access" className={`${styles.section} ${styles.closing}`} aria-labelledby="start-title">
          <Rise>
            <h2 id="start-title" className={`${styles.h2} ${styles.sheen}`}>
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
          </Rise>
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
