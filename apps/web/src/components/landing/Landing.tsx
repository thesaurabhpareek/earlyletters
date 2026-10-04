/**
 * The home page shown on production until the film is approved (SITE_MODE, see lib/site-mode.ts), told as a
 * short story over a lamp that changes colour as you read, with scroll-linked motion in the style of a product
 * launch page: the hero recedes, and every section after it is a pinned scene that your scroll plays (Evening,
 * ProofScene, and PinScene for the rest), paragraphs fill from dim to bright as you read them, and blocks lift
 * into place the same way everywhere. Every word comes from site.ts, which the copy rules check. The server
 * renders every scene in its finished state, so the page reads without JavaScript and with reduced motion
 * (scrub.tsx). The sign-up is one quiet field, once, at the end; no other button on the page asks for an email. It
 * appears only when the email service is configured at build time, so a visitor never meets a form that cannot work
 * (set RESEND_API_KEY and RESEND_SEGMENT_ID, then redeploy). The same code
 * serves earlyletters.com once the domain is attached.
 */
import { site } from '@/content/site';
import { NotifyForm } from '@/components/cta/NotifyForm';
import { ShareButton } from '@/components/site/ShareButton';
import { Aurora } from './Aurora';
import { Evening } from './Evening';
import { ProofScene } from './ProofScene';
import { HeroStage } from './scrub';
import { Beat, PinScene, SceneText } from './PinScene';
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
          </div>
        </HeroStage>

        <Evening />

        <PinScene vh={2.4} id="how" labelledBy="minute-title">
          <Beat from={0.02} to={0.14}>
            <p className={styles.kicker}>{site.comingSoon.howTitle}</p>
            <h2 id="minute-title" className={styles.h2}>
              {s.s02.headline}
            </h2>
          </Beat>
          <SceneText text={s.s02.support} className={styles.sub} from={0.1} to={0.5} />
          <Beat className={styles.pull} from={0.5} to={0.68}>
            <p className={styles.pullTitle}>{s.s03.headline}</p>
            <p className={styles.pullText}>{s.s03.support}</p>
          </Beat>
        </PinScene>

        <ProofScene />

        <PinScene vh={2.2} labelledBy="voice-title" wrapClassName={styles.split}>
          <div>
            <Beat from={0.02} to={0.14}>
              <h2 id="voice-title" className={styles.h2}>
                {s.s05.headline}
              </h2>
            </Beat>
            <SceneText text={s.s05.support} className={styles.sub} from={0.1} to={0.5} />
          </div>
          <Beat className={styles.years} from={0.3} to={0.5}>
            <p className={styles.kicker}>{s.s07.dateline}</p>
            <p className={styles.yearsTitle}>{s.s07.headline}</p>
            <p className={styles.cardText}>{s.s07.support}</p>
          </Beat>
        </PinScene>

        <PinScene vh={2.6} labelledBy="book-title">
          <Beat from={0.02} to={0.14}>
            <p className={styles.kicker}>{s.s06.label}</p>
            <h2 id="book-title" className={styles.h2}>
              {s.s06.headline}
            </h2>
          </Beat>
          <SceneText text={s.s06.support} className={styles.sub} from={0.1} to={0.4} />
          <ol className={styles.timeline}>
            {s.s06.chapters.map((chapter, i) => {
              const last = i === s.s06.chapters.length - 1;
              return (
                <li key={chapter.month}>
                  <Beat className={`${styles.month} ${last ? styles.monthNow : ''}`} from={0.4 + i * 0.12} to={0.54 + i * 0.12}>
                    {last ? <span className={styles.filed}>{s.s06.filedChip}</span> : null}
                    <span className={styles.monthName}>{chapter.month}</span>
                    <span className={styles.monthMeta}>{chapter.meta}</span>
                  </Beat>
                </li>
              );
            })}
          </ol>
        </PinScene>

        <PinScene vh={2.8} id="languages" labelledBy="lang-title">
          <Beat from={0.02} to={0.14}>
            <p className={styles.kicker}>{s.s08.label}</p>
            <h2 id="lang-title" className={styles.h2}>
              {s.s08.headline}
            </h2>
          </Beat>
          <SceneText text={s.s08.support} className={styles.sub} from={0.1} to={0.34} />
          <ul className={styles.langs}>
            {s.s08.lines.map((line, i) => (
              <li key={line.lang}>
                <Beat className={styles.lang} from={0.3 + i * 0.055} to={0.42 + i * 0.055}>
                  <span className={styles.langName}>{line.name}</span>
                  <span lang={line.lang} dir={line.dir} className={styles.langText}>
                    {line.text}
                  </span>
                </Beat>
              </li>
            ))}
          </ul>
        </PinScene>

        <PinScene vh={2.5} id="private" labelledBy="private-title">
          <Beat from={0.02} to={0.14}>
            <p className={styles.kicker}>{s.s09.label}</p>
            <h2 id="private-title" className={styles.h2}>
              {s.s09.headline}
            </h2>
          </Beat>
          <ul className={styles.points}>
            {s.s09.points.map((point, i) => (
              <li key={point}>
                <Beat className={styles.point} from={0.2 + i * 0.1} to={0.32 + i * 0.1}>
                  {point}
                </Beat>
              </li>
            ))}
          </ul>
        </PinScene>

        <PinScene vh={2.4} id="price" labelledBy="price-title">
          <Beat from={0.02} to={0.14}>
            <p className={styles.kicker}>{s.s10.label}</p>
            <h2 id="price-title" className={styles.h2}>
              {s.s10.headline}
            </h2>
          </Beat>
          <SceneText text={s.s10.support} className={styles.sub} from={0.1} to={0.55} />
        </PinScene>

        <PinScene vh={2} id="early-access" labelledBy="start-title" innerClassName={styles.closing} exit={false} showOnFocus>
          <Beat from={0.02} to={0.16}>
            <h2 id="start-title" className={`${styles.h2} ${styles.sheen}`}>
              {s.s11.headline}
            </h2>
          </Beat>
          <Beat from={0.14} to={0.3}>
            {notifyReady ? (
              <>
                <p className={styles.sub}>{s.s11.supportPrelaunch}</p>
                <div className={styles.form}>
                  <NotifyForm quiet />
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
          </Beat>
        </PinScene>
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
