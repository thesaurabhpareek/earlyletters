'use client';
/**
 * Fades and lifts its children into place the first time they scroll into view. The server renders them
 * fully visible, so the words are there without JavaScript and for anyone reading the page source. Anything
 * already on screen when the page loads stays put. Nothing moves under prefers-reduced-motion.
 */
import { motion, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

type Mode = 'server' | 'hidden' | 'shown';

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const [mode, setMode] = useState<Mode>('server');

  useEffect(() => {
    const el = ref.current;
    if (!el || still) {
      setMode('shown');
      return;
    }
    setMode(el.getBoundingClientRect().top < window.innerHeight * 0.92 ? 'shown' : 'hidden');
  }, [still]);

  const shown = mode !== 'hidden' || inView;
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={false}
      animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 26 }}
      transition={shown ? { duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] } : { duration: 0 }}
    >
      {children}
    </motion.div>
  );
}
