'use client';
/**
 * S06 "the-book": scroll becomes time. Storyboard row S06; tone paper to dusk; length 3.
 *
 *   0.00-0.04  Handoff from S05: the letter card, centred, at 0.6.
 *   0.04-0.24  Month chapters slide in around it (Month 7 and 8 to the left, 9 in the centre);
 *              the card settles into Month 9. 0.22-0.30 "Filed in Month 9".
 *   0.30-0.40  "A book that grows by month." and the support line, above the book.
 *   0.58-0.64  The words leave.
 *   0.58-0.92  Time: the book moves on, month after month, gently gathering speed; the numerals climb.
 *   0.70-0.95  The light warms from paper to dusk; the book slides away (handoff to S07: dusk, empty).
 * Months after 9 show only their label: we never count.
 * Reduced motion: Month 7, 8 and 9 with the card filed in Month 9, and the words.
 */
import { motion, useTransform, type MotionValue } from 'motion/react';
import { Scene } from '@/film/Scene';
import { Headline, Support } from '@/film/Copy';
import { LetterCard } from '@/film/LetterCard';
import { useStage, useViewport } from '@/film/hooks';
import { site } from '@/content/site';
import { Grain, PaperTexture, Vignette } from '@/components/atmosphere';
import { CARD_SCALE } from './S05Voice';
import stage from '@/film/stage.module.css';
import styles from './S06Book.module.css';

const copy = site.scenes.s06;
const FIRST = 7;
const LAST = 30;
const label = (n: number) => copy.chapters[0].month.replace(/\d+/, String(n));
const meta = (n: number) => copy.chapters.find((c) => c.month === label(n))?.meta;

export function S06Book() {
  return (
    <Scene id="the-book" label={copy.label} tone="paper" length={3}>
      <BookStage />
    </Scene>
  );
}

/** Ease-in for time gathering speed, ease-out at the end. */
const travel = (t: number) => (t < 0.7 ? Math.pow(t / 0.7, 2.2) * 0.62 : 0.62 + (1 - Math.pow(1 - (t - 0.7) / 0.3, 2)) * 0.38);

function Cover({ n, offset, cw, enter }: { n: number; offset: MotionValue<number>; cw: number; enter: MotionValue<number> }) {
  const gap = cw * 1.12;
  const x = useTransform(offset, (o) => (n - 9 - o) * gap);
  const d = useTransform(offset, (o) => Math.abs(n - 9 - o));
  const opacity = useTransform([d, enter], ([dd, e]: number[]) => {
    const fade = Math.max(0, 1 - Math.max(0, dd - 1.6) / 1.6);
    const arrived = n <= 9 ? e : 1;
    return fade * arrived;
  });
  const scale = useTransform(d, (dd) => 1 - Math.min(dd, 3) * 0.06);
  const y = useTransform(enter, [0, 1], [n <= 9 ? 40 : 0, 0]);
  const m = meta(n);
  return (
    <motion.div className={styles.cover} style={{ x, opacity, scale, y, width: cw, height: cw * 1.32, marginLeft: -cw / 2, marginTop: (-cw * 1.32) / 2 }}>
      <span className={styles.numeral}>{n}</span>
      <span className={styles.coverLabel}>{label(n)}</span>
      {m ? <span className={styles.meta}>{m}</span> : null}
    </motion.div>
  );
}

function BookStage() {
  const { p, resting } = useStage(0.4);
  const { w, h } = useViewport();
  const narrow = w < 900;
  const cw = Math.round(Math.min(narrow ? w * 0.5 : w * 0.17, h * 0.3, 280));

  const enter = useTransform(p, [0.04, 0.2], [0, 1]);
  const months = useTransform(p, (v) => (v < 0.58 ? 0 : travel(Math.min(1, (v - 0.58) / 0.34)) * (LAST - 9 + 2)));
  // The card's rendered width (LetterCard: letter measure plus side padding) shrinks to sit inside Month 9.
  const fs = Math.min(26, Math.max(19, w * 0.0175));
  const gutter = Math.min(48, Math.max(16, w * 0.04));
  const pad = Math.min(64, Math.max(24, w * 0.044));
  const cardW = Math.min(w - 2 * gutter, 31 * fs) + 2 * pad;
  const cardScale = useTransform(p, [0, 0.06, 0.22], [CARD_SCALE, CARD_SCALE, (cw * 0.78) / cardW]);
  const cardOpacity = useTransform(p, [0.16, 0.24], [1, 0]);
  const filed = useTransform(p, [0.22, 0.3, 0.56, 0.62], [0, 1, 1, 0]);
  const bookY = useTransform(p, [0.24, 0.34], [0, narrow ? h * 0.08 : h * 0.06]);
  const bookOut = useTransform(p, [0.86, 0.95], [1, 0]);
  const dusk = useTransform(p, [0.7, 0.95], [0, 1]);

  const headOpacity = useTransform(p, [0.3, 0.38, 0.56, 0.62], [0, 1, 1, 0]);
  const headY = useTransform(p, [0.3, 0.38], [16, 0]);
  const supOpacity = useTransform(p, [0.34, 0.42, 0.56, 0.62], [0, 1, 1, 0]);

  const covers = Array.from({ length: LAST - FIRST + 1 }, (_, i) => FIRST + i);

  return (
    <div className={stage.frame} data-resting={resting || undefined}>
      <PaperTexture />
      <motion.div className={styles.book} style={{ y: bookY, opacity: bookOut }}>
        {covers.map((n) => (
          <Cover key={n} n={n} offset={months} cw={cw} enter={enter} />
        ))}
        <motion.span className={styles.chip} style={{ opacity: filed, top: `calc(50% + ${(cw * 1.32) / 2 + 18}px)` }}>
          {copy.filedChip}
        </motion.span>
      </motion.div>

      <div className={styles.cardStage}>
        <motion.div style={{ scale: cardScale, opacity: cardOpacity }}>
          <LetterCard card={ONE} player={ONE} />
        </motion.div>
      </div>

      <div className={styles.copy}>
        <motion.div style={{ opacity: headOpacity, y: headY }}>
          <Headline>{copy.headline}</Headline>
        </motion.div>
        <motion.div style={{ opacity: supOpacity }}>
          <Support>{copy.support}</Support>
        </motion.div>
      </div>

      <motion.div className={styles.dusk} style={{ opacity: dusk }} aria-hidden />
      <Vignette tone="paper" strength={0.8} />
      <Grain tone="paper" />
    </div>
  );
}

import { motionValue } from 'motion/react';
const ONE = motionValue(1);
