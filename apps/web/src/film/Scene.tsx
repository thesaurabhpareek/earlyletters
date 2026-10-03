'use client';

/**
 * Owner: coordinator. The scene contract every scene builds on. Do not fork it;
 * request changes in your report.
 *
 * A Scene is a tall <section> (length x 100svh) with a sticky stage that fills
 * the viewport. As the visitor scrolls through the section, `progress` goes
 * 0 -> 1. Native scroll only: no scroll-jacking, no wheel hijack.
 *
 * Inside a scene:
 *   const { progress, reduced } = useScene();
 *   const opacity = useTransform(progress, [0.1, 0.25], [0, 1]);
 *
 * Rules (docs/web/TEAM.md):
 * - Animate transform and opacity only (plus SVG pathLength). No layout props.
 * - When `reduced` is true, render the scene's resting state and use opacity
 *   fades only (MotionConfig reducedMotion="user" already strips transforms).
 * - All words come from src/content/site.ts. Never hardcode copy.
 * - Text must stay readable at every progress value (never over busy motion).
 */
import { createContext, useContext, useRef, type CSSProperties, type ReactNode } from 'react';
import { useReducedMotion, useScroll, type MotionValue } from 'motion/react';
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
  /** Scroll length in viewport heights. 1 = no pinning. Keep 1.5 to 3.5. */
  length?: number;
  tone?: Tone;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function Scene({ id, label, length = 2, tone = 'night', children, className, style }: SceneProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  return (
    <section
      ref={ref}
      id={id}
      aria-label={label}
      data-tone={tone}
      className={[styles.scene, className].filter(Boolean).join(' ')}
      style={{ ['--scene-length' as string]: String(length), ...style }}
    >
      <div className={styles.stage}>
        <SceneContext.Provider value={{ progress: scrollYProgress, reduced, id }}>{children}</SceneContext.Provider>
      </div>
    </section>
  );
}
