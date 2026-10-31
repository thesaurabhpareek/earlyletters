'use client';
/**
 * Owner: coordinator. The scene contract every scene builds on.
 *
 * A Scene is a tall <section> (length x 100svh) with a sticky stage that fills the viewport. As the
 * visitor scrolls through the section, `progress` goes 0 -> 1. Native scroll only (Lenis smooths the
 * wheel but the page's own scroll position stays the truth).
 *
 * Scenes overlap by one screen (Scene.module.css). A stage is visually hidden (opacity, not
 * visibility, so screen readers still read every scene) until its scene pins, so it never slides over
 * the scene before it; at the cut it appears on top, on a matching frame.
 *
 * `rest` is the progress at which the scene is at its fullest (words in, nothing moving). Links to the
 * scene's id land there (scroll-margin), and keyboard focus entering the scene scrolls there.
 * `toneStops` change the tone the header and pill read (data-ui-tone) mid-scene, e.g. paper to dusk.
 * The stage's own background always follows `tone`.
 *
 * Rules (docs/web/TEAM.md): animate transform and opacity only (plus SVG pathLength); words come from
 * src/content/site.ts; text never over busy motion; every scene has a designed reduced-motion frame.
 */
import { createContext, useContext, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cubicBezier, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';
import styles from './Scene.module.css';

export type Tone = 'paper' | 'dusk' | 'night';

type SceneContextValue = {
  /** 0 when the section top meets the viewport top, 1 when its bottom meets the viewport bottom. */
  progress: MotionValue<number>;
  /** True when the visitor prefers reduced motion. */
  reduced: boolean;
  id: string;
};

const SceneContext = createContext<SceneContextValue | null>(null);

export function useScene(): SceneContextValue {
  const value = useContext(SceneContext);
  if (!value) throw new Error('useScene must be used inside <Scene>');
  return value;
}

export type SceneProps = {
  /** Stable id, also the anchor (#id). */
  id: string;
  /** Accessible name for the section (from site.ts). */
  label: string;
  /** Scroll length in viewport heights. 1 = no pinning. */
  length?: number;
  tone?: Tone;
  /** Progress at which the scene is at rest (fully shown). Default 0.5. */
  rest?: number;
  /** Tone changes inside the scene, in progress order. */
  toneStops?: { at: number; tone: Tone }[];
  /** Extra height for the reduced-motion layout, when a scene's resting frame is taller than a screen. */
  reducedMinHeight?: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/** How far a scene reaches back over the one before it, in screens. A short scene reaches back less (half its own run). */
export function handoffOf(length: number): number {
  return Math.max(0, Math.min(0.35, (length - 1) * 0.5));
}

const DISSOLVE = cubicBezier(0.4, 0, 0.2, 1);

export function Scene({ id, label, length = 2, tone = 'night', rest = 0.5, toneStops, reducedMinHeight, children, className, style }: SceneProps) {
  const ref = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  // The scene reaches back over the one before it and fades in across that overlap, so lights and backgrounds
  // dissolve into each other instead of cutting. The first scene has nothing before it and is always there.
  const handoff = handoffOf(length);
  const fade = useTransform(scrollYProgress, [0, handoff / Math.max(length - 1, 0.01)], [0, 1], { ease: DISSOLVE });
  const [dissolve, setDissolve] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    const prev = el?.previousElementSibling as HTMLElement | null;
    // Only dissolve where the colour changes. Two scenes on the same paper would show both sets of words at once.
    const differs = !!prev && prev.tagName === 'SECTION' && prev.dataset.tone !== el?.dataset.tone;
    const on = !reduced && handoff > 0 && differs;
    setDissolve(on);
    el?.style.setProperty('--scene-handoff', on ? String(handoff) : '0');
  }, [reduced, handoff]);

  const { scrollYProgress: arrival } = useScroll({ target: ref, offset: ['start end', 'start start'] });
  const show = (v: number) => {
    if (stageRef.current) stageRef.current.dataset.live = v >= 0.999 ? 'true' : 'false';
  };
  useMotionValueEvent(arrival, 'change', show);

  const toneAt = (v: number) => {
    let t: Tone = tone;
    for (const s of toneStops ?? []) if (v >= s.at) t = s.tone;
    return t;
  };
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (!toneStops || !ref.current) return;
    const t = toneAt(v);
    if (ref.current.dataset.uiTone !== t) ref.current.dataset.uiTone = t;
  });

  useLayoutEffect(() => {
    const read = () => {
      const top = ref.current?.getBoundingClientRect().top ?? 0;
      show(top <= 0.5 ? 1 : 0);
    };
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, []);

  const onFocusCapture = () => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const vh = document.getElementById('svh-probe')?.offsetHeight || window.innerHeight;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const target = top + rest * (el.offsetHeight - vh);
    if (Math.abs(window.scrollY - target) > 8) window.scrollTo({ top: target });
  };

  return (
    <section
      ref={ref}
      id={id}
      aria-label={label}
      data-tone={tone}
      onFocusCapture={onFocusCapture}
      className={[styles.scene, className].filter(Boolean).join(' ')}
      style={{
        ['--scene-length' as string]: String(length),
        ['--scene-rest' as string]: String(rest),
        ...(reducedMinHeight ? { ['--reduced-min-height' as string]: reducedMinHeight } : {}),
        ...style,
      }}
    >
      <motion.div ref={stageRef} className={styles.stage} data-live="true" style={dissolve ? { opacity: fade } : undefined}>
        <SceneContext.Provider value={{ progress: scrollYProgress, reduced, id }}>{children}</SceneContext.Provider>
      </motion.div>
    </section>
  );
}
