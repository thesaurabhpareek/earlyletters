'use client';
/**
 * Scroll-linked ("scrubbed") motion, the way product launch pages do it: what you see is tied to where you are
 * on the page, so scrolling back plays it in reverse. Built on `motion` (MIT), already a dependency.
 *
 * Safe by default: the server, visitors without JavaScript and visitors who prefer reduced motion all get the
 * finished state of every scene, with nothing pinned. Scrubbing switches on only after the page has mounted
 * and only if motion is welcome. A scene that is pinned must fit on the screen; if it does not (a short phone),
 * it is not pinned and scrubs as it scrolls past instead.
 */
import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

const clamp = (v: number) => Math.min(1, Math.max(0, v));
/** Top plus bottom padding of a pinned stage, in pixels; keep in step with .pinOn .stageInner in Landing.module.css. */
const PINNED_PADDING = 120;

export function useScrubEnabled(): boolean {
  const still = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && !still;
}

/**
 * A pinned scene: an outer section `vh` screens tall holding a sticky stage. `progress` runs 0 to 1 while the
 * stage is pinned (or while the scene scrolls past, when it cannot be pinned).
 */
export function usePin(vh: number) {
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
  const progress = useSpring(raw, { stiffness: 140, damping: 32, mass: 0.35 });
  return { outer, content, enabled, pinned: enabled && pinned, progress };
}

/** Fades, lifts and un-blurs its children between two points of a pinned scene's progress. */
export function ScrubIn({
  progress,
  from,
  to,
  enabled,
  y = 28,
  blur = 0,
  as = 'span',
  children,
}: {
  progress: MotionValue<number>;
  from: number;
  to: number;
  enabled: boolean;
  y?: number;
  blur?: number;
  as?: 'span' | 'div';
  children: ReactNode;
}) {
  const o = useTransform(progress, [from, to], [0, 1]);
  const yy = useTransform(progress, [from, to], [y, 0]);
  const filter = useTransform(o, (v) => (blur ? `blur(${((1 - v) * blur).toFixed(2)}px)` : 'none'));
  const display = as === 'div' ? 'block' : 'inline-block';
  if (!enabled) return as === 'div' ? <div>{children}</div> : <span>{children}</span>;
  const style = { opacity: o, y: yy, filter, display };
  return as === 'div' ? <motion.div style={style}>{children}</motion.div> : <motion.span style={style}>{children}</motion.span>;
}

/**
 * Scrubbed entrance for a block that is not pinned: it rises, grows and fades in as it enters the lower part of
 * the screen, and reverses if you scroll back. `x` slides it in from the side instead.
 */
export function Rise({
  children,
  className,
  x = 0,
  y = 46,
  scale = 0.965,
  start = 0.97,
  end = 0.6,
}: {
  children: ReactNode;
  className?: string;
  x?: number;
  y?: number;
  scale?: number;
  start?: number;
  end?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useScrubEnabled();
  const { scrollYProgress } = useScroll({ target: ref, offset: [`start ${start}`, `start ${end}`] });
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 32, mass: 0.35 });
  const opacity = useTransform(p, [0, 1], [0, 1]);
  const yy = useTransform(p, [0, 1], [y, 0]);
  const xx = useTransform(p, [0, 1], [x, 0]);
  const s = useTransform(p, [0, 1], [scale, 1]);
  return (
    <motion.div ref={ref} className={className} style={enabled ? { opacity, y: yy, x: xx, scale: s } : undefined}>
      {children}
    </motion.div>
  );
}

/** The hero recedes as you leave it: it shrinks, drifts up and fades. */
export function HeroStage({ children, className, innerClassName }: { children: ReactNode; className?: string; innerClassName?: string }) {
  const ref = useRef<HTMLElement>(null);
  const enabled = useScrubEnabled();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 32, mass: 0.35 });
  const opacity = useTransform(p, [0, 0.7], [1, 0]);
  const y = useTransform(p, [0, 1], [0, -110]);
  const scale = useTransform(p, [0, 1], [1, 0.9]);
  const blur = useTransform(p, [0, 0.7], [0, 10]);
  const filter = useTransform(blur, (v) => `blur(${v.toFixed(2)}px)`);
  return (
    <section ref={ref} className={className} aria-labelledby="hero-title">
      <motion.div style={enabled ? { opacity, y, scale, filter } : undefined} className={innerClassName}>
        {children}
      </motion.div>
    </section>
  );
}
