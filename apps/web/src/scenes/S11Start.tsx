'use client';
/**
 * S11 "start": the end card and the one action. Storyboard row S11; tone night; length 1.2.
 *   0.00-0.30  The lamp light returns behind the card; "Tell Meera about today." and the line beneath.
 *   The action: before launch the email form; after launch the official App Store badge.
 * The card stays; this is where the persistent action and the skip link land (#start).
 */
import { motion, useTransform } from 'motion/react';
import { Scene } from '@/film/Scene';
import { Headline, Support } from '@/film/Copy';
import { useStage } from '@/film/hooks';
import { site } from '@/content/site';
import { launch } from '@/lib/launch';
import { Grain, LampLight, Motes, Vignette } from '@/components/atmosphere';
import { NotifyForm } from '@/components/cta/NotifyForm';
import { AppStoreBadge } from '@/components/cta/AppStoreBadge';
import stage from '@/film/stage.module.css';
import styles from './S11Start.module.css';

const copy = site.scenes.s11;

export function S11Start() {
  return (
    <Scene id="start" label={copy.label} tone="night" length={1.2}>
      <StartStage />
    </Scene>
  );
}

function StartStage() {
  const { p, resting } = useStage(1);
  const light = useTransform(p, [0, 0.35], [0.2, 1]);
  const opacity = useTransform(p, [0, 0.2], [0.001, 1]);
  const y = useTransform(p, [0, 0.2], [16, 0]);
  const live = launch.mode === 'live';
  return (
    <div className={stage.frame} data-resting={resting || undefined}>
      <LampLight intensity={light} x="50%" y="62%" size="110vmax" warmth="lamp" aspect={0.8} breathe />
      <Motes x={0.5} y={0.62} radius={0.3} intensity={light} />
      <div className={styles.card}>
        <motion.div style={{ opacity, y }}>
          <Headline>{copy.headline}</Headline>
          <Support>{live ? copy.supportLive : copy.supportPrelaunch}</Support>
          <div className={styles.action}>{live ? <AppStoreBadge placement="start" /> : <NotifyForm />}</div>
        </motion.div>
      </div>
      <Vignette strength={1} />
      <Grain tone="night" />
    </div>
  );
}
