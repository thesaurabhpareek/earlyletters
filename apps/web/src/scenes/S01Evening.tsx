'use client';
/**
 * S01 "evening": the hero. Storyboard row S01; tone night; length 3.
 *
 *   0.00-0.16  Hero: the wordmark (the page's h1) and the brand line, still, on deep night.
 *   0.14-0.26  The hero recedes (up, a touch smaller, out).
 *   0.16-0.42  A window draws itself; the moon's cool light comes up behind it.
 *   0.30-0.47  "9:41 pm", then "Meera is asleep.", then the support line.
 *   0.44-0.58  A bedside lamp draws itself; 0.56-0.66 it switches on and warm light pools low.
 *   0.62-0.78  Dust drifts in the lamp light.
 *   0.74-0.82  The words leave. 0.82-1.00 the window steps back; the lamp light holds (handoff to S02).
 * Reduced motion: no pinning; one composed frame: hero, window, words, lamp on.
 */
import { motion, useTransform } from 'motion/react';
import { Scene } from '@/film/Scene';
import { Dateline, Headline, Support } from '@/film/Copy';
import { useStage, useViewport } from '@/film/hooks';
import { site } from '@/content/site';
import { Wordmark } from '@/components/brand/Wordmark';
import { Window } from '@/components/drawings/Window';
import { Lamp } from '@/components/drawings/Lamp';
import { Grain, LampLight, Motes, NightSky, Vignette } from '@/components/atmosphere';
import { lampPool } from './parts/act1/lamp';
import stage from '@/film/stage.module.css';
import styles from './S01Evening.module.css';

const copy = site.scenes.s01;

export function S01Evening() {
  return (
    <Scene id="evening" label={copy.label} tone="night" length={3}>
      <EveningStage />
    </Scene>
  );
}

function EveningStage() {
  const { p, resting } = useStage(0.7);
  const { w } = useViewport();
  const pool = lampPool(w);

  const heroOpacity = useTransform(p, [0, 0.14, 0.24], [1, 1, 0]);
  const heroY = useTransform(p, [0.12, 0.26], [0, -48]);
  const heroScale = useTransform(p, [0.12, 0.26], [1, 0.965]);

  const windowDraw = useTransform(p, [0.16, 0.42], [0, 1]);
  const windowOpacity = useTransform(p, [0.14, 0.18, 0.82, 0.96], [0, 1, 1, 0.22]);
  const moon = useTransform(p, [0.3, 0.5], [0, 1]);

  const dateOpacity = useTransform(p, [0.3, 0.36, 0.74, 0.8], [0, 1, 1, 0]);
  const headOpacity = useTransform(p, [0.34, 0.42, 0.75, 0.81], [0, 1, 1, 0]);
  const headY = useTransform(p, [0.34, 0.42], [18, 0]);
  const supOpacity = useTransform(p, [0.4, 0.47, 0.76, 0.82], [0, 1, 1, 0]);
  const supY = useTransform(p, [0.4, 0.47], [12, 0]);

  const lampDraw = useTransform(p, [0.44, 0.58], [0, 1]);
  const glow = useTransform(p, [0.56, 0.66], [0, 1]);
  const dust = useTransform(p, [0.62, 0.78], [0, 1]);
  const vignette = useTransform(p, [0, 0.5], [0.7, 1]);
  const heroGlow = useTransform(p, [0, 0.12, 0.24], [0.5, 0.5, 0]);

  return (
    <div className={stage.frame} data-resting={resting || undefined}>
      <NightSky moon={{ x: w < 900 ? '56%' : '74%', y: w < 900 ? '20%' : '30%', size: '80vmax', intensity: moon }} />
      <LampLight intensity={heroGlow} x="50%" y="58%" size={w < 900 ? '130vmax' : '90vmax'} warmth="lamp" aspect={0.7} breathe />
      <LampLight intensity={glow} x={pool.x} y={pool.y} size={pool.size} warmth="lamp" aspect={0.8} breathe />
      <Motes x={pool.fx} y={pool.fy} radius={0.32} intensity={dust} />

      <motion.div className={styles.window} style={{ opacity: windowOpacity }}>
        <Window draw={windowDraw} strokeWidth={1.5} />
      </motion.div>
      <div className={styles.lamp}>
        <Lamp draw={lampDraw} glow={glow} strokeWidth={1.5} />
      </div>

      <motion.div className={styles.hero} style={{ opacity: heroOpacity, y: heroY, scale: heroScale }}>
        <h1 className={styles.h1}>
          <Wordmark />
        </h1>
        <p className={styles.line}>{site.brand.line}</p>
        <span className={styles.cue} aria-hidden />
      </motion.div>

      <div className={styles.copy}>
        <motion.div style={{ opacity: dateOpacity }}>
          <Dateline>{copy.dateline}</Dateline>
        </motion.div>
        <motion.div style={{ opacity: headOpacity, y: headY }}>
          <Headline>{copy.headline}</Headline>
        </motion.div>
        <motion.div style={{ opacity: supOpacity, y: supY }}>
          <Support>{copy.support}</Support>
        </motion.div>
      </div>

      <Vignette strength={vignette} />
      <Grain tone="night" />
    </div>
  );
}
