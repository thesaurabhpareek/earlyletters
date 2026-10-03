'use client';
/**
 * S09 "private". Storyboard row S09; tone night; length 2.
 *
 *   0.00-0.16  An envelope draws itself, open, a letter inside.
 *   0.12-0.30  The letter slides in and the flap folds closed.
 *   0.26-0.34  "Private by default."
 *   0.34-0.60  Five plain promises, one at a time.
 *   0.92-0.99  Everything leaves (handoff to S10).
 * Reduced motion: the closed envelope, the headline and all five promises.
 */
import { motion, useTransform, type MotionValue } from 'motion/react';
import { Scene } from '@/film/Scene';
import { Headline } from '@/film/Copy';
import { useStage } from '@/film/hooks';
import { site } from '@/content/site';
import { Envelope } from '@/components/drawings/Envelope';
import { Grain, LampLight, Vignette } from '@/components/atmosphere';
import stage from '@/film/stage.module.css';
import styles from './S09Private.module.css';

const copy = site.scenes.s09;

export function S09Private() {
  return (
    <Scene id="private" label={copy.label} tone="night" length={2}>
      <PrivateStage />
    </Scene>
  );
}

function Point({ p, i, text }: { p: MotionValue<number>; i: number; text: string }) {
  const s = 0.34 + i * 0.055;
  const opacity = useTransform(p, [s, s + 0.05, 0.92, 0.98], [0, 1, 1, 0]);
  const y = useTransform(p, [s, s + 0.05], [12, 0]);
  return (
    <motion.li className={styles.point} style={{ opacity, y }}>
      <span className={styles.tick} aria-hidden />
      {text}
    </motion.li>
  );
}

function PrivateStage() {
  const { p, resting } = useStage(0.8);
  const draw = useTransform(p, [0, 0.16], [0, 1]);
  const open = useTransform(p, [0.12, 0.3], [1, 0]);
  const envOpacity = useTransform(p, [0, 0.04, 0.92, 0.98], [0, 1, 1, 0]);
  const headOpacity = useTransform(p, [0.26, 0.34, 0.92, 0.98], [0, 1, 1, 0]);
  const headY = useTransform(p, [0.26, 0.34], [16, 0]);
  const light = useTransform(p, [0.1, 0.4, 0.92, 1], [0, 0.55, 0.55, 0]);

  return (
    <div className={stage.frame} data-resting={resting || undefined}>
      <LampLight intensity={light} x="50%" y="30%" size="90vmax" warmth="lamp" />
      <div className={styles.column}>
        <motion.div className={styles.envelope} style={{ opacity: envOpacity }}>
          <Envelope draw={draw} open={open} strokeWidth={1.6} />
        </motion.div>
        <motion.div style={{ opacity: headOpacity, y: headY }}>
          <Headline>{copy.headline}</Headline>
        </motion.div>
        <ul className={styles.points}>
          {copy.points.map((t, i) => (
            <Point key={t} p={p} i={i} text={t} />
          ))}
        </ul>
      </div>
      <Vignette strength={1} />
      <Grain tone="night" />
    </div>
  );
}
