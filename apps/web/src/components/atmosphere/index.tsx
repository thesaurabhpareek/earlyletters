'use client';
/**
 * Owner: AT (atmosphere). Light and texture layers that make the film feel shot, not drawn.
 * Gallery: /lab/atmosphere. Assets and light profiles: scripts/atmosphere/make_textures.py.
 *
 * CONTRACT (scenes use these; names and existing props are stable, new props are optional):
 * - <LampLight intensity x y size warmth="lamp|recording|dusk" surface? aspect? breathe? flicker? />
 *     A pool of light solved from a photometric model (inverse-square falloff under a shade, bounce,
 *     filmic shoulder, warmer and deeper toward the edge). Normal blending. Transform/opacity only.
 * - <Grain opacity? tone? animate? />: pre-rendered signed film grain; kills banding on dark gradients.
 * - <PaperTexture opacity? />: paper formation, tooth and fibre for paper scenes. Mean colour = --paper.
 * - <Vignette strength? tone? />: natural lens falloff (cos^4-like) with a clean centre.
 * - <Motes x y radius warmth intensity count? />: a few dust motes lit by the pool (canvas).
 * - <NightSky moon? intensity? />: deep-night backdrop, extremely subtle; optional cool moonlight wash.
 *
 * Layer order inside a stage (back to front): NightSky, LampLight, Motes, your drawings and copy,
 * Vignette, Grain. Every layer is aria-hidden and pointer-events: none.
 */
import { useRef } from 'react';
import type { CSSProperties } from 'react';
import type { MotionValue } from 'motion/react';
import { motion } from 'motion/react';
import { MOON_STOPS, POOL_STOPS, POOL_SURFACE, SKY_STOPS, TEXTURE, VIGNETTE_STOPS } from './light.generated';
import { useIdleAttribute } from './visibility';
import styles from './atmosphere.module.css';

export { Motes } from './Motes';
export type { MotesProps } from './Motes';

type Num = number | MotionValue<number>;
export type Warmth = 'lamp' | 'recording' | 'dusk';
export type AtmosphereTone = 'night' | 'dusk' | 'paper';

export type LampLightProps = {
  /** 0..1. Opacity of the whole pool (a MotionValue to bloom it with scroll). */
  intensity?: Num;
  /** Centre of the pool within the stage. */
  x?: string;
  y?: string;
  /** Diameter of the pool (the light reaches zero exactly at the edge). */
  size?: string;
  /** lamp: tungsten, about 2700 K. recording: the terracotta listening glow. dusk: late-afternoon amber. */
  warmth?: Warmth;
  /** The tone the pool sits on; the gradient is solved for it. Default: night (dusk for warmth="dusk"). */
  surface?: AtmosphereTone;
  /** Vertical squash for a pool seen at an angle on a table or floor (0.55 to 1). Default 1. */
  aspect?: number;
  /** A slow swell, about 9 s (scale 1 to 1.022, opacity 1 to 0.9). Off under reduced motion and off-screen. */
  breathe?: boolean;
  /** A faint, irregular filament flicker (4% at most). Off under reduced motion and off-screen. */
  flicker?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function LampLight({
  intensity = 1,
  x = '50%',
  y = '70%',
  size = '90vmax',
  warmth = 'lamp',
  surface,
  aspect = 1,
  breathe = false,
  flicker = false,
  className,
  style,
}: LampLightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const tone = surface ?? POOL_SURFACE[warmth];
  useIdleAttribute(ref, breathe || flicker);
  const gradient = `radial-gradient(closest-side, ${POOL_STOPS[tone][warmth]})`;
  return (
    <motion.div
      ref={ref}
      aria-hidden
      className={[styles.pool, className].filter(Boolean).join(' ')}
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        translateX: '-50%',
        translateY: '-50%',
        scaleY: aspect,
        opacity: intensity,
        ...style,
      }}
    >
      <div className={[styles.fill, breathe ? styles.breathe : ''].join(' ')}>
        <div className={[styles.fill, flicker ? styles.flicker : ''].join(' ')} style={{ background: gradient }} />
      </div>
    </motion.div>
  );
}

const GRAIN_DEFAULT: Record<AtmosphereTone, number> = { night: 0.06, dusk: 0.06, paper: 0.035 };

export type GrainProps = {
  /** Default 0.06 on night and dusk, 0.035 on paper. 0.04 to 0.08 is the useful range. */
  opacity?: number;
  /** Picks the default opacity. */
  tone?: AtmosphereTone;
  /** Re-register the tile a few pixels at 12 fps, like a projected print. Off under reduced motion and off-screen. */
  animate?: boolean;
};

/**
 * Grain uses normal compositing on purpose: the texture is signed (white and black specks with alpha),
 * so it adds the same noise on night, dusk and paper. A grey texture with mix-blend-mode: overlay
 * would be isolated by the sticky stage (it creates a stacking context) and would leave a grey veil,
 * and overlay also vanishes in near-black, which is exactly where the banding lives.
 */
export function Grain({ opacity, tone = 'night', animate = false }: GrainProps) {
  const ref = useRef<HTMLDivElement>(null);
  useIdleAttribute(ref, animate);
  return (
    <div
      ref={ref}
      aria-hidden
      className={[styles.grain, animate ? styles.grainAnimate : ''].join(' ')}
      style={{ backgroundImage: `url(${TEXTURE.grain})`, opacity: opacity ?? GRAIN_DEFAULT[tone] }}
    />
  );
}

export function PaperTexture({ opacity = 1 }: { opacity?: Num }) {
  return (
    <motion.div
      aria-hidden
      className={[styles.layer, styles.paper].join(' ')}
      style={{ backgroundImage: `url(${TEXTURE.paper})`, opacity }}
    />
  );
}

export type VignetteProps = {
  strength?: Num;
  /** night: deep, warm black. dusk: lighter and browner. paper: a soft warm shade, like a page under a lamp. */
  tone?: AtmosphereTone;
  /** Optical centre. Default slightly above middle, where the eye rests. */
  x?: string;
  y?: string;
};

export function Vignette({ strength = 1, tone = 'night', x = '50%', y = '46%' }: VignetteProps) {
  return (
    <motion.div
      aria-hidden
      className={styles.layer}
      style={{ opacity: strength, background: `radial-gradient(ellipse farthest-corner at ${x} ${y}, ${VIGNETTE_STOPS[tone]})` }}
    />
  );
}

export type NightSkyProps = {
  /** Opacity of the sky gradient above --night (the --night fill itself always stays). */
  intensity?: Num;
  /** A faint cool moonlight wash, the only cool light in the film. Place it near the window. */
  moon?: { x?: string; y?: string; size?: string; intensity?: Num };
};

/**
 * Deep night for S01 and S08: --night with a breath of cool sky at the top that settles into exactly
 * --night by the middle, so the lower half hands off to any plain night scene without a seam.
 * No stars. Pair it with <Grain />, which dithers the gradient.
 */
export function NightSky({ intensity = 1, moon }: NightSkyProps) {
  return (
    <div aria-hidden className={styles.layer} style={{ background: 'var(--night)' }}>
      <motion.div className={styles.layer} style={{ opacity: intensity, background: `linear-gradient(to bottom, ${SKY_STOPS})` }} />
      {moon ? (
        <motion.div
          className={styles.pool}
          style={{
            left: moon.x ?? '72%',
            top: moon.y ?? '24%',
            width: moon.size ?? '70vmax',
            height: moon.size ?? '70vmax',
            translateX: '-50%',
            translateY: '-50%',
            opacity: moon.intensity ?? 1,
            background: `radial-gradient(closest-side, ${MOON_STOPS})`,
          }}
        />
      ) : null}
    </div>
  );
}
