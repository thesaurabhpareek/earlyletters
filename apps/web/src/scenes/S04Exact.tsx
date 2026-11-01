'use client';
/**
 * S04 "exactly", the proof. Storyboard row S04; tone paper; length 3.
 *
 *   0.00-0.06  Handoff from S03: paper, the letter as heard, centred.
 *   0.06-0.18  Quiet dotted underlines appear under the three things the app will fix.
 *   0.20-0.56  The fixes, one by one: a misheard name becomes the child's name (from the family dictionary),
 *              "um" leaves, a false start leaves. Nothing else moves; nothing is added.
 *   0.50-0.58  Beneath the letter, the app's own words: "3 small fixes." and its trust line.
 *   0.58-0.70  The letter steps down; "Exactly as you said it." and the support line arrive above it.
 *   0.86-0.96  The words leave and the letter returns to the centre (handoff to S05).
 * Reduced motion: the fixed letter with the headline above it.
 */
import { useRef } from 'react';
import { motion, useTransform } from 'motion/react';
import { Scene } from '@/film/Scene';
import { Headline, Support } from '@/film/Copy';
import { EDIT_COUNT, PaperLetter } from '@/film/PaperLetter';
import { useStage, useViewport } from '@/film/hooks';
import { useLetterFit } from '@/film/fit';
import { site } from '@/content/site';
import { Grain, PaperTexture, Vignette } from '@/components/atmosphere';
import stage from '@/film/stage.module.css';
import styles from './S04Exact.module.css';

const copy = site.scenes.s04;
/** What hangs under the letter box: the app's note (it is absolutely placed, so it adds no height of its own). */
const hangBelow = (box: HTMLElement) => {
  const note = box.parentElement?.querySelector<HTMLElement>('[data-s04-note]');
  return note ? note.offsetTop + note.offsetHeight - box.offsetHeight : 0;
};

export function S04Exact() {
  return (
    <Scene id="exactly" label={copy.label} tone="paper" length={3} rest={0.75}>
      <ExactStage />
    </Scene>
  );
}

function ExactStage() {
  const { p, resting } = useStage(0.75);
  const { w, h } = useViewport();
  const narrow = w < 900;

  const marks = useTransform(p, [0.06, 0.18], [0, 1]);
  const fixes = useTransform(p, [0.2, 0.56], [0, EDIT_COUNT]);
  const frameRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  // On a short phone the letter and the note under it will not fit between the words and the sign-up pill at the
  // usual 0.84. Then the letter settles earlier (before the note shows), smaller and higher.
  const fit = useLetterFit({ frame: frameRef, words: wordsRef, letter: boxRef, hang: hangBelow, maxScale: narrow ? 0.84 : 0.9, w, h });
  const tight = fit !== null;
  const note = useTransform(p, tight ? [0.62, 0.7, 0.86, 0.92] : [0.5, 0.58, 0.86, 0.92], [0, 1, 1, 0]);

  const down = narrow ? h * 0.1 : h * 0.05;
  const letterY = useTransform(p, tight ? [0.5, 0.7, 0.9, 0.96] : [0.58, 0.7, 0.86, 0.96], [0, tight ? fit.y : down, tight ? fit.y : down, 0]);
  // A macro on the fix: the camera leans toward the first word while the name is set right, then eases back.
  const macro = useTransform(p, [0.18, 0.3, 0.42], [1, narrow ? 1.1 : 1.16, 1]);
  const held = tight ? fit.scale : narrow ? 0.84 : 0.9;
  const settle = useTransform(p, tight ? [0.5, 0.7, 0.9, 0.96] : [0.58, 0.7, 0.86, 0.96], [1, held, held, 1]);
  const letterScale = useTransform([macro, settle], ([a, b]: number[]) => a * b);
  const origin = useTransform(p, tight ? [0.42, 0.5] : [0.42, 0.58], ['0% 0%', '50% 50%']);

  const headOpacity = useTransform(p, [0.6, 0.68, 0.86, 0.92], [0, 1, 1, 0]);
  const headY = useTransform(p, [0.6, 0.68], [16, 0]);
  const supOpacity = useTransform(p, [0.64, 0.72, 0.86, 0.92], [0, 1, 1, 0]);

  return (
    <div ref={frameRef} className={stage.frame} data-resting={resting || undefined}>
      <PaperTexture />
      <div className={styles.letterStage}>
        <motion.div style={{ y: letterY, scale: letterScale, transformOrigin: origin, position: 'relative' }}>
          {/* The box is as tall as the letter as heard, whatever the fixes do inside it. A fix closes up a line, and a box that shrank re-centred and shifted everything with it (and the note under it) once per fix: layout shift. */}
          <div ref={boxRef} className={styles.letterBox} data-s04-box>
            {!resting && (
              <div className={styles.ghost} aria-hidden>
                <PaperLetter />
              </div>
            )}
            <div className={styles.live}>
              <PaperLetter marks={marks} fixes={fixes} />
            </div>
          </div>
          <motion.p className={styles.note} data-s04-note style={{ opacity: note }}>
            <span className={styles.count}>{copy.appChanges}.</span> {copy.appTrust}
          </motion.p>
        </motion.div>
      </div>
      <div ref={wordsRef} className={styles.copy}>
        <motion.div style={{ opacity: headOpacity, y: headY }}>
          <Headline>{copy.headline}</Headline>
        </motion.div>
        <motion.div style={{ opacity: supOpacity }}>
          <Support>{copy.support}</Support>
        </motion.div>
      </div>
      <Vignette tone="paper" strength={0.8} />
      <Grain tone="paper" />
    </div>
  );
}
