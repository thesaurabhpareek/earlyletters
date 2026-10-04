'use client';
/**
 * S02 "a-minute". Storyboard row S02; tone night; length 2.5.
 *
 *   0.00-0.08  The lamp light from S01, unchanged. A phone appears, lying dark in the light.
 *   0.06-0.30  It tilts up to face us; 0.20-0.34 the screen wakes to Tonight.
 *   0.32-0.46  "A minute is plenty." and the support line, beside the phone (below it on phones).
 *   0.78-0.86  The words leave; 0.80-0.94 the phone moves to the centre.
 *   0.88-0.98  Speak is pressed (handoff to S03: phone centred, upright, Speak pressed).
 * Reduced motion: the phone upright on Tonight beside the words.
 */
import { motion, useTransform } from 'motion/react';
import { Scene } from '@/film/Scene';
import { Headline, Support } from '@/film/Copy';
import { phoneWidthFor, useStage, useViewport } from '@/film/hooks';
import { site } from '@/content/site';
import { PhoneFrame, TonightScreen } from '@/components/app-ui';
import { Lamp } from '@/components/drawings/Lamp';
import { Grain, LampLight, Vignette } from '@/components/atmosphere';
import { lampPool } from './parts/act1/lamp';
import stage from '@/film/stage.module.css';
import styles from './S02Minute.module.css';

const copy = site.scenes.s02;

export function S02Minute() {
  return (
    <Scene id="a-minute" label={copy.label} tone="night" length={2.5}>
      <MinuteStage />
    </Scene>
  );
}

function MinuteStage() {
  const { p, resting } = useStage(0.6);
  const { w, h } = useViewport();
  const narrow = w < 900;
  const pool = lampPool(w);
  const width = phoneWidthFor(w, h);

  const lampOpacity = useTransform(p, [0.1, 0.34], [1, 0.4]);
  const phoneOpacity = useTransform(p, [0, 0.06], [0, 1]);
  const tilt = useTransform(p, [0.06, 0.3], [62, 0]);
  const lift = useTransform(p, [0.06, 0.3], [0.9, 1]);
  const dark = useTransform(p, [0.2, 0.34], [1, 0]);
  const press = useTransform(p, [0.88, 0.98], [0, 1]);
  const x = useTransform(p, [0.8, 0.94], narrow ? ['0vw', '0vw'] : ['17vw', '0vw']);
  const y = useTransform(p, [0.8, 0.94], narrow ? ['10svh', '0svh'] : ['0svh', '0svh']);

  const headOpacity = useTransform(p, [0.32, 0.4, 0.78, 0.85], [0, 1, 1, 0]);
  const headY = useTransform(p, [0.32, 0.4], [18, 0]);
  const supOpacity = useTransform(p, [0.38, 0.46, 0.79, 0.86], [0, 1, 1, 0]);
  const supY = useTransform(p, [0.38, 0.46], [12, 0]);

  return (
    <div className={stage.frame} data-resting={resting || undefined}>
      <LampLight intensity={1} x={pool.x} y={pool.y} size={pool.size} warmth="lamp" aspect={0.8} breathe />
      <motion.div className={styles.lamp} style={{ opacity: lampOpacity }}>
        <Lamp glow={1} strokeWidth={1.5} />
      </motion.div>

      <div className={styles.phoneStage}>
        <motion.div style={{ x, y, opacity: phoneOpacity }}>
          <motion.div style={{ rotateX: tilt, scale: lift, transformPerspective: 1400, transformOrigin: '50% 80%' }}>
            <PhoneFrame width={width} scheme="dark">
              <TonightScreen press={press} />
              <motion.div aria-hidden style={{ position: 'absolute', inset: 0, background: '#000', opacity: dark, zIndex: 7 }} />
            </PhoneFrame>
          </motion.div>
        </motion.div>
      </div>

      <div className={stage.copySide}>
        <motion.div style={{ opacity: headOpacity, y: headY }}>
          <Headline>{copy.headline}</Headline>
        </motion.div>
        <motion.div style={{ opacity: supOpacity, y: supY }}>
          <Support>{copy.support}</Support>
        </motion.div>
      </div>

      <Vignette strength={1} />
      <Grain tone="night" />
    </div>
  );
}
