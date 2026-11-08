'use client';
/**
 * Owner: AT. Dust motes drifting slowly through lamp light. 2D canvas, at most 40 particles.
 *
 * Dust is only visible where light falls on it, so each mote's brightness is the pool's own
 * irradiance at its position (POOL_PROFILE, same model as LampLight): motes fade in as they drift
 * into the pool and out as they leave. A few are out of focus (bigger, softer, dimmer).
 *
 * Off when: prefers-reduced-motion, navigator.deviceMemory < 4, hardwareConcurrency < 4, the canvas
 * is off-screen (IntersectionObserver) or the tab is hidden. No React state per frame.
 */
import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { isMotionValue, type MotionValue } from 'motion/react';
import { POOL_PROFILE } from './light.generated';
import { watchActive } from './visibility';
import styles from './atmosphere.module.css';

type Warmth = keyof typeof POOL_PROFILE;
type Num = number | MotionValue<number>;

const TINT: Record<Warmth, [number, number, number]> = {
  lamp: [255, 226, 178],
  recording: [255, 205, 190],
  dusk: [255, 220, 170],
};

export type MotesProps = {
  /** Pool centre, as a fraction of the layer (match LampLight x / y). Default 0.5, 0.7. */
  x?: number;
  y?: number;
  /** Pool radius as a fraction of the layer's larger side (LampLight size / 2). Default 0.45. */
  radius?: number;
  /** How many motes; capped at 40. Default 26 (14 on narrow screens). */
  count?: number;
  warmth?: Warmth;
  /** 0..1, multiplies everything (tie it to the lamp's intensity so dust appears with the light). */
  intensity?: Num;
  /** Lab and QA only: run even when the device reports fewer than 4 cores or under 4 GB (headless
   *  Chromium reports 2 cores). Reduced motion is always respected. Never set this in a scene. */
  ignoreDeviceLimits?: boolean;
};

type Mote = { x: number; y: number; vx: number; vy: number; r: number; a: number; ph: number; f: number; blur: boolean };

function canRun(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) return false;
  // WebKit reports 4 or 8 (fingerprinting clamp), so this only excludes small Android and old desktops.
  if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency < 4) return false;
  return true;
}

function profileAt(p: readonly number[], d: number): number {
  if (d >= 1) return 0;
  const i = d * (p.length - 1);
  const k = Math.floor(i);
  return p[k] + (p[k + 1] - p[k]) * (i - k);
}

// mulberry32: small, deterministic (same first frame for every visitor and every shot), and free of the
// lattice artefact a plain LCG shows (successive values put motes on straight lines).
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Motes({ x = 0.5, y = 0.7, radius = 0.45, count, warmth = 'lamp', intensity = 1, ignoreDeviceLimits = false }: MotesProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion() ?? false;
  const intensityRef = useRef<Num>(intensity);
  intensityRef.current = intensity;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || reduced || (!ignoreDeviceLimits && !canRun())) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const profile = POOL_PROFILE[warmth];
    const [tr, tg, tb] = TINT[warmth];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let motes: Mote[] = [];
    let raf = 0;
    let last = 0;
    let running = false;

    // One pre-rendered sprite per focus state; drawImage is far cheaper than arc + shadowBlur.
    const sprite = (soft: boolean) => {
      const s = document.createElement('canvas');
      const size = 64;
      s.width = s.height = size;
      const c = s.getContext('2d')!;
      const g = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      const col = `${tr},${tg},${tb}`;
      if (soft) {
        g.addColorStop(0, `rgba(${col},0.55)`);
        g.addColorStop(0.55, `rgba(${col},0.32)`);
        g.addColorStop(0.85, `rgba(${col},0.08)`);
        g.addColorStop(1, `rgba(${col},0)`);
      } else {
        g.addColorStop(0, `rgba(255,248,236,1)`);
        g.addColorStop(0.25, `rgba(${col},0.85)`);
        g.addColorStop(0.6, `rgba(${col},0.22)`);
        g.addColorStop(1, `rgba(${col},0)`);
      }
      c.fillStyle = g;
      c.fillRect(0, 0, size, size);
      return s;
    };
    const sharp = sprite(false);
    const soft = sprite(true);

    const seed = () => {
      const narrow = w < 600;
      const n = Math.min(40, Math.max(0, count ?? (narrow ? 14 : 26)));
      const rand = rng(9241);
      const R = radius * Math.max(w, h);
      motes = Array.from({ length: n }, () => {
        const blur = rand() < 0.18;
        // Start inside a box around the pool so the first frame already has dust in the light.
        const ang = rand() * Math.PI * 2;
        const d = Math.sqrt(rand()) * R * 1.1;
        return {
          x: x * w + Math.cos(ang) * d,
          y: y * h + Math.sin(ang) * d * 0.8,
          vx: (rand() - 0.5) * 6,
          vy: -1.5 - rand() * 3.5, // warm air rises: a slow upward drift, px per second
          r: blur ? 3.2 + rand() * 3.2 : 0.8 + rand() * 1.0,
          a: blur ? 0.16 + rand() * 0.12 : 0.55 + rand() * 0.45,
          ph: rand() * Math.PI * 2,
          f: 0.05 + rand() * 0.09,
          blur,
        };
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      draw(0, performance.now());
    };

    const level = () => {
      const v = intensityRef.current;
      const n = isMotionValue(v) ? v.get() : v;
      return Math.max(0, Math.min(1, n));
    };

    const draw = (dt: number, now: number) => {
      ctx.clearRect(0, 0, w, h);
      const k = level();
      if (k <= 0.001) return;
      const R = radius * Math.max(w, h);
      const cx = x * w;
      const cy = y * h;
      const t = now / 1000;
      for (const m of motes) {
        if (dt > 0) {
          // Brownian wander on a slow sinusoidal current; velocities in px per second.
          m.vx += (Math.sin(t * m.f * 2.1 + m.ph) * 1.6 - m.vx * 0.15) * dt;
          m.vy += (Math.cos(t * m.f * 1.7 + m.ph) * 0.9 - (m.vy + 2.4) * 0.12) * dt;
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          // Recycle motes that drift out of the lit region back under it.
          const dx = m.x - cx;
          const dy = m.y - cy;
          if (dx * dx + dy * dy > R * R * 1.44) {
            m.x = cx + (Math.random() - 0.5) * R * 1.4;
            m.y = cy + R * (0.5 + Math.random() * 0.4);
          }
        }
        const d = Math.hypot(m.x - cx, m.y - cy) / R;
        const lit = profileAt(profile, d);
        // Glints: dust turns and catches the light now and then.
        const glint = m.blur ? 1 : 0.75 + 0.25 * Math.sin(t * 0.9 + m.ph * 3);
        const alpha = m.a * lit * glint * k;
        if (alpha < 0.01) continue;
        const s = m.r * 4;
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.drawImage(m.blur ? soft : sharp, m.x - s / 2, m.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
    };

    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0);
      last = now;
      draw(dt, now);
      raf = requestAnimationFrame(tick);
    };

    const setRunning = (on: boolean) => {
      if (on === running) return;
      running = on;
      if (on) {
        last = 0;
        raf = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(raf);
      }
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    const stopWatch = watchActive(canvas, setRunning);
    return () => {
      setRunning(false);
      stopWatch();
      ro.disconnect();
    };
  }, [reduced, warmth, x, y, radius, count, ignoreDeviceLimits]);

  return <canvas ref={ref} aria-hidden className={styles.motes} />;
}
