'use client';
/**
 * S09 "private". Storyboard row S09; tone night; length 2.
 *
 *   0.00-0.16  (never an empty frame: the lamp is already lit and the envelope already drawing) An envelope draws itself, open, a letter inside.
 *   0.12-0.30  The letter slides in and the flap folds closed.
 *   0.26-0.34  "Just for your family."
 *   0.34-0.60  Five plain promises, one at a time.
 *   0.92-0.99  Everything leaves (handoff to S10).
 * Layout: the envelope and headline on the left, the five promises as quiet rows with a thin line icon on the
 * right (a tidy stack on a phone). Reduced motion: the closed envelope, the headline and all five promises.
 */
import { motion, useTransform, type MotionValue } from 'motion/react';
import { Scene } from '@/film/Scene';
import { Headline } from '@/film/Copy';
import { useStage } from '@/film/hooks';
import { site } from '@/content/site';
import { Envelope } from '@/components/drawings/Envelope';
import { Grain, LampLight, Vignette } from '@/components/atmosphere';
import { PromiseIcon } from './parts/PromiseIcons';
import stage from '@/film/stage.module.css';
import styles from './S09Private.module.css';

const copy = site.scenes.s09;

export function S09Private() {
  return (
    <Scene id="private" label={copy.label} tone="night" length={2.2} rest={0.8}>
      <PrivateStage />
    </Scene>
  );
}

function Point({ p, i, text }: { p: MotionValue<number>; i: number; text: string }) {
  const s = 0.4 + i * 0.055;
  const opacity = useTransform(p, [s, s + 0.05, 0.92, 0.98], [0, 1, 1, 0]);
  const y = useTransform(p, [s, s + 0.05], [12, 0]);
  return (
    <motion.li className={styles.point} style={{ opacity, y }}>
      <PromiseIcon index={i} className={styles.icon} />
      <span>{text}</span>
    </motion.li>
  );
}

function PrivateStage() {
  const { p, resting } = useStage(0.8);
  const draw = useTransform(p, [0, 0.16], [0, 1]);
  const open = useTransform(p, [0.12, 0.3], [1, 0]);
  const envOpacity = useTransform(p, [0, 0.92, 0.98], [1, 1, 0]);
  const headOpacity = useTransform(p, [0.34, 0.4, 0.92, 0.98], [0, 1, 1, 0]);
  const headY = useTransform(p, [0.34, 0.4], [16, 0]);
  const light = useTransform(p, [0, 0.4, 0.92, 1], [0.3, 0.55, 0.55, 0]);

  return (
    <div className={stage.frame} data-resting={resting || undefined}>
      <LampLight intensity={light} x="50%" y="30%" size="90vmax" warmth="lamp" />
      <div className={styles.column}>
        <div className={styles.grid}>
          <div className={styles.intro}>
            <motion.div className={styles.envelope} style={{ opacity: envOpacity }}>
              <Envelope draw={draw} open={open} strokeWidth={1.4} />
            </motion.div>
            <motion.div style={{ opacity: headOpacity, y: headY }}>
              <Headline>{copy.headline}</Headline>
            </motion.div>
          </div>
          <ul className={styles.points}>
            {copy.points.map((t, i) => (
              <Point key={t} p={p} i={i} text={t} />
            ))}
          </ul>
        </div>
      </div>
      <Vignette strength={1} />
      <Grain tone="night" />
    </div>
  );
}
