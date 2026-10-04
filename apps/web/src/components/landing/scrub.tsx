'use client';
/**
 * Scroll-linked ("scrubbed") motion in the language of a product launch page: a small set of effects used the
 * same way everywhere. Big type; text that fills from dim to bright as you read it; scenes that hold the screen
 * and hand off to the next with a fade; slow, steady scaling; opacity and a short lift only, with no blur,
 * bounce or sideways slides. What you see is tied to where you are on the page, so scrolling back reverses it.
 * Built on `motion` (MIT), already a dependency.
 *
 * Safe by default: the server, visitors without JavaScript and visitors who prefer reduced motion get the
 * finished state of every scene, with nothing pinned. Scrubbing switches on only after the page has mounted and
 * only if motion is welcome. A scene that is pinned must fit on the screen; if it does not (a short phone or
 * laptop), it is not pinned and scrubs as it scrolls past instead.
 */
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

const clamp = (v: number) => Math.min(1, Math.max(0, v));
/** Top plus bottom padding of a pinned stage, in pixels; keep in step with .pinOn .stageInner in Landing.module.css. */
const PINNED_PADDING = 120;
/** One light smoothing for every scrubbed value: steady, with almost no lag. */
const SMOOTH = { stiffness: 260, damping: 40, mass: 0.3 };
/** How dim text starts before it is read. */
const DIM = 0.16;

export function useScrubEnabled(): boolean {
  const still = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && !still;
}

/**
 * A pinned scene: an outer section `vh` screens tall holding a sticky stage. `progress` runs 0 to 1 while the
 * stage is pinned (or while the scene scrolls past, when it cannot be pinned). `handoff` fades the scene in at
 * the start and out at the end, so one scene gives way to the next instead of sliding off.
 */
export function usePin(vh: number, exit = true) {
  const outer = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const enabled = useScrubEnabled();
  const pinnedRef = useRef(false);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (!enabled) {
      pinnedRef.current = false;
      setPinned(false);
      return;
    }
    // The pinned stage uses its own, smaller padding (PINNED_PADDING), so measure the content without padding.
    const check = () => {
      const el = content.current;
      let fits = false;
      if (el) {
        const cs = getComputedStyle(el);
        const bare = el.offsetHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
        fits = bare + PINNED_PADDING <= window.innerHeight;
      }
      pinnedRef.current = fits;
      setPinned(fits);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [enabled]);

  const { scrollYProgress } = useScroll({ target: outer, offset: ['start end', 'end start'] });
  const a = 1 / (1 + vh);
  const b = vh / (1 + vh);
  const raw = useTransform(scrollYProgress, (p) => (pinnedRef.current ? clamp((p - a) / (b - a)) : clamp((p - 0.12) / 0.4)));
  const progress = useSpring(raw, SMOOTH);
  // The last scene of the page (`exit` false) fades in and then stays: nothing follows it to hand off to.
  const handoffOpacity = useTransform(progress, exit ? [0, 0.1, 0.9, 1] : [0, 0.1], exit ? [0, 1, 1, 0] : [0, 1]);
  const handoffY = useTransform(progress, exit ? [0, 0.1, 0.9, 1] : [0, 0.1], exit ? [14, 0, 0, -14] : [14, 0]);
  return { outer, content, enabled, pinned: enabled && pinned, progress, handoff: { opacity: handoffOpacity, y: handoffY } };
}

/** Fills its children from dim to bright between two points of a pinned scene's progress. */
export function ScrubIn({
  progress,
  from,
  to,
  enabled,
  min = 0,
  y = 0,
  as = 'span',
  children,
}: {
  progress: MotionValue<number>;
  from: number;
  to: number;
  enabled: boolean;
  min?: number;
  y?: number;
  as?: 'span' | 'div';
  children: ReactNode;
}) {
  const opacity = useTransform(progress, [from, to], [min, 1]);
  const yy = useTransform(progress, [from, to], [y, 0]);
  if (!enabled) return as === 'div' ? <div>{children}</div> : <span>{children}</span>;
  const style = { opacity, y: yy, display: as === 'div' ? 'block' : 'inline-block' };
  return as === 'div' ? <motion.div style={style}>{children}</motion.div> : <motion.span style={style}>{children}</motion.span>;
}

/** A block that is read by the progress of a pinned scene instead of by its own place on the screen. */
export type SceneWindow = { progress: MotionValue<number>; from: number; to: number; active: boolean };

/**
 * The same entrance for every block: it lifts a short way and fades in as it enters the lower part of the screen,
 * over a long, even stretch of scroll. Reverses if you scroll back. Inside a pinned scene (`scene` with `active`
 * true) the block does not move, so the same lift and fade are tied to the scene's progress between `from` and
 * `to` instead. `still` shows the finished block. It is one element in every state, so it is never remounted.
 */
export function Rise({ children, className, y = 34, scene, still = false }: { children: ReactNode; className?: string; y?: number; scene?: SceneWindow; still?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useScrubEnabled() && !still;
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.98', 'start 0.66'] });
  const own = useSpring(scrollYProgress, SMOOTH);
  const idle = useMotionValue(0);
  const inScene = useTransform(scene?.progress ?? idle, (v) => (scene ? clamp((v - scene.from) / (scene.to - scene.from)) : 0));
  const active = useMotionValue(0);
  useEffect(() => active.set(scene?.active ? 1 : 0), [active, scene?.active]);
  const p = useTransform([inScene, own, active], ([a, b, on]: number[]) => (on ? a : b));
  const opacity = useTransform(p, [0, 1], [0, 1]);
  const yy = useTransform(p, [0, 1], [y, 0]);
  return (
    <motion.div ref={ref} className={className} style={enabled ? { opacity, y: yy } : undefined}>
      {children}
    </motion.div>
  );
}

function FillWord({ progress, index, count, enabled, children }: { progress: MotionValue<number>; index: number; count: number; enabled: boolean; children: string }) {
  const start = (index / count) * 0.72;
  const opacity = useTransform(progress, [start, start + 0.28], [DIM, 1]);
  return (
    <>
      {index > 0 ? ' ' : null}
      <motion.span style={enabled ? { opacity } : undefined}>{children}</motion.span>
    </>
  );
}

/**
 * A paragraph that is read by scrolling: each word goes from dim to bright in turn as the paragraph crosses the
 * middle of the screen. The text is the finished, fully bright paragraph everywhere else.
 */
export function FillText({ text, className, scene }: { text: string; className?: string; scene?: SceneWindow }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const enabled = useScrubEnabled();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.9', 'end 0.45'] });
  const own = useSpring(scrollYProgress, SMOOTH);
  // Inside a pinned scene the paragraph does not move, so it is read by the scene's own progress instead.
  const idle = useMotionValue(0);
  const inScene = useTransform(scene?.progress ?? idle, (v) => (scene ? clamp((v - scene.from) / (scene.to - scene.from)) : 0));
  const active = useMotionValue(0);
  useEffect(() => active.set(scene?.active ? 1 : 0), [active, scene?.active]);
  const progress = useTransform([inScene, own, active], ([a, b, on]: number[]) => (on ? a : b));
  const words = text.split(' ');
  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => (
        <FillWord key={`${word}-${i}`} progress={progress} index={i} count={words.length} enabled={enabled}>
          {word}
        </FillWord>
      ))}
    </p>
  );
}

/** The hero recedes as you leave it: it shrinks a little, drifts up and fades. No blur. */
export function HeroStage({ children, className, innerClassName }: { children: ReactNode; className?: string; innerClassName?: string }) {
  const ref = useRef<HTMLElement>(null);
  const enabled = useScrubEnabled();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const p = useSpring(scrollYProgress, SMOOTH);
  const opacity = useTransform(p, [0, 0.6], [1, 0]);
  const y = useTransform(p, [0, 1], [0, -70]);
  const scale = useTransform(p, [0, 1], [1, 0.94]);
  return (
    <section ref={ref} className={className} aria-labelledby="hero-title">
      <motion.div style={enabled ? { opacity, y, scale } : undefined} className={innerClassName}>
        {children}
      </motion.div>
    </section>
  );
}
