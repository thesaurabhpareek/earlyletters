'use client';
/**
 * The lamp behind the holding page. Three layers of light (amber, rose, gold) drift and trade places on slow
 * loops, so the glow changes colour without ever flashing; the pointer nudges them a little. Decorative only.
 * Still when the visitor prefers reduced motion. No tracking: the pointer position never leaves the page.
 */
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { useEffect } from 'react';
import styles from './LampLight.module.css';

const loop = (seconds: number) => ({ duration: seconds, repeat: Infinity, repeatType: 'mirror' as const, ease: 'easeInOut' as const });

export function LampLight() {
  const still = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 40, damping: 22 });
  const sy = useSpring(py, { stiffness: 40, damping: 22 });
  const nearX = useTransform(sx, (v) => v * 36);
  const nearY = useTransform(sy, (v) => v * 24);
  const farX = useTransform(sx, (v) => v * -22);
  const farY = useTransform(sy, (v) => v * -14);

  useEffect(() => {
    if (still) return;
    const onMove = (e: PointerEvent) => {
      px.set(e.clientX / window.innerWidth - 0.5);
      py.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [still, px, py]);

  return (
    <div className={styles.lamp} aria-hidden>
      <motion.div
        className={`${styles.layer} ${styles.amber}`}
        style={{ x: farX, y: farY, scaleY: 0.72 }}
        animate={still ? undefined : { opacity: [1, 0.55], scale: [1, 1.08] }}
        transition={loop(11)}
      />
      <motion.div
        className={`${styles.layer} ${styles.rose}`}
        style={{ x: nearX, y: nearY, scaleY: 0.72 }}
        animate={still ? undefined : { opacity: [0.12, 0.7], scale: [1.06, 0.94], rotate: [-6, 6] }}
        transition={loop(14)}
      />
      <motion.div
        className={`${styles.layer} ${styles.gold}`}
        style={{ x: nearX, y: nearY, scaleY: 0.72 }}
        animate={still ? undefined : { opacity: [0.9, 0.5], scale: [0.96, 1.06] }}
        transition={loop(7)}
      />
    </div>
  );
}
