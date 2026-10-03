'use client';
/**
 * Owner: AT. Lab only. The S01 lamp-on beat with every atmosphere layer, driven by scroll progress:
 * night sky, lamp blooms (opacity + scale), dust appears with the light, headline holds in the pool.
 */
import { motion, useTransform } from 'motion/react';
import { Scene, useScene } from '@/film/Scene';
import { Grain, LampLight, Motes, NightSky, Vignette } from '@/components/atmosphere';
import { site } from '@/content/site';

function Beat() {
  const { progress } = useScene();
  const lamp = useTransform(progress, [0.15, 0.55], [0, 1]);
  const bloom = useTransform(progress, [0.15, 0.7], [0.82, 1]);
  const copy = useTransform(progress, [0.45, 0.6, 0.9, 1], [0, 1, 1, 0.6]);
  return (
    <>
      <NightSky moon={{ x: '76%', y: '16%', size: '80vmax', intensity: 0.8 }} />
      <motion.div style={{ position: 'absolute', inset: 0, scale: bloom, transformOrigin: '50% 80%' }}>
        <LampLight warmth="lamp" x="50%" y="80%" size="120vmax" aspect={0.72} intensity={lamp} breathe flicker />
      </motion.div>
      <Motes warmth="lamp" x={0.5} y={0.8} radius={0.5} intensity={lamp} ignoreDeviceLimits />
      <motion.div style={{ position: 'relative', zIndex: 1, textAlign: 'center', opacity: copy, padding: '0 var(--gutter)' }}>
        <p style={{ margin: '0 0 0.9em', font: '500 14px/1.2 var(--font-sans)', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.72 }}>{site.scenes.s01.dateline}</p>
        <h2 style={{ margin: 0, font: '500 clamp(40px, 7.2vw, 112px)/1.02 var(--font-serif)', letterSpacing: '-0.02em' }}>{site.scenes.s01.headline}</h2>
      </motion.div>
      <Vignette />
      <Grain animate />
    </>
  );
}

export function AtmosphereFilm() {
  return (
    <Scene id="atmosphere" label="Atmosphere" tone="night" length={3}>
      <Beat />
    </Scene>
  );
}
