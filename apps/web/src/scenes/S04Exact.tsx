'use client';
/**
 * S04 "exactly", the proof. Storyboard row S04; tone paper; length 3.
 *
 *   0.00-0.06  Handoff from S03: paper, the letter as heard, centred.
 *   0.06-0.18  Quiet dotted underlines appear under the three things the app will fix.
 *   0.20-0.56  The fixes, one by one: "Mirror" becomes "Meera" (a name from the family dictionary),
 *              "um" leaves, a false start leaves. Nothing else moves; nothing is added.
 *   0.50-0.58  Beneath the letter, the app's own words: "3 small fixes." and its trust line.
 *   0.58-0.70  The letter steps down; "Exactly as you said it." and the support line arrive above it.
 *   0.86-0.96  The words leave and the letter returns to the centre (handoff to S05).
 * Reduced motion: the fixed letter with the headline above it.
 */
import { motion, useTransform } from 'motion/react';
import { Scene } from '@/film/Scene';
import { Headline, Support } from '@/film/Copy';
import { EDIT_COUNT, PaperLetter } from '@/film/PaperLetter';
import { useStage, useViewport } from '@/film/hooks';
import { site } from '@/content/site';
import { Grain, PaperTexture, Vignette } from '@/components/atmosphere';
import stage from '@/film/stage.module.css';
import styles from './S04Exact.module.css';

const copy = site.scenes.s04;

export function S04Exact() {
  return (
    <Scene id="exactly" label={copy.label} tone="paper" length={3}>
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
  const note = useTransform(p, [0.5, 0.58, 0.86, 0.92], [0, 1, 1, 0]);

  const down = narrow ? h * 0.13 : h * 0.12;
  const letterY = useTransform(p, [0.58, 0.7, 0.86, 0.96], [0, down, down, 0]);
  const letterScale = useTransform(p, [0.58, 0.7, 0.86, 0.96], [1, narrow ? 0.84 : 0.86, narrow ? 0.84 : 0.86, 1]);

  const headOpacity = useTransform(p, [0.6, 0.68, 0.86, 0.92], [0, 1, 1, 0]);
  const headY = useTransform(p, [0.6, 0.68], [16, 0]);
  const supOpacity = useTransform(p, [0.64, 0.72, 0.86, 0.92], [0, 1, 1, 0]);

  return (
    <div className={stage.frame} data-resting={resting || undefined}>
      <PaperTexture />
      <div className={styles.letterStage}>
        <motion.div style={{ y: letterY, scale: letterScale, position: 'relative' }}>
          <PaperLetter marks={marks} fixes={fixes} />
          <motion.p className={styles.note} style={{ opacity: note }}>
            <span className={styles.count}>{copy.appChanges}.</span> {copy.appTrust}
          </motion.p>
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
      <Vignette tone="paper" strength={0.8} />
      <Grain tone="paper" />
    </div>
  );
}
