'use client';
/**
 * The lamp light behind the whole page. It is fixed, so it stays while you read, and its colour follows the
 * scroll: amber near the top, rose in the middle, dusk blue towards the end. On top of that each layer drifts
 * and breathes on its own slow loop, and a faint sweep turns once a minute. The pointer nudges the glow a
 * little. Decorative (aria-hidden). Still under prefers-reduced-motion. The pointer position never leaves
 * the page.
 */
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { useEffect } from 'react';
import styles from './Aurora.module.css';

const loop = (seconds: number) => ({ duration: seconds, repeat: Infinity, repeatType: 'mirror' as const, ease: 'easeInOut' as const });

export function Aurora() {
  const still = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const amber = useTransform(scrollYProgress, [0, 0.45, 1], [1, 0.4, 0.2]);
  const rose = useTransform(scrollYProgress, [0, 0.4, 0.75, 1], [0.3, 1, 0.5, 0.25]);
  const dusk = useTransform(scrollYProgress, [0, 0.5, 1], [0.08, 0.5, 1]);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 40, damping: 22 });
  const sy = useSpring(py, { stiffness: 40, damping: 22 });
  const nearX = useTransform(sx, (v) => v * 44);
  const nearY = useTransform(sy, (v) => v * 30);
  const farX = useTransform(sx, (v) => v * -26);
  const farY = useTransform(sy, (v) => v * -18);

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
    <div className={styles.aurora} aria-hidden>
      <motion.div className={styles.slot} style={{ opacity: dusk }}>
        <motion.div
          className={`${styles.layer} ${styles.dusk}`}
          style={{ x: farX, y: farY }}
          animate={still ? undefined : { scale: [0.94, 1.1], x: ['-4%', '5%'] }}
          transition={loop(16)}
        />
      </motion.div>
      <motion.div className={styles.slot} style={{ opacity: rose }}>
        <motion.div
          className={`${styles.layer} ${styles.rose}`}
          style={{ x: nearX, y: nearY }}
          animate={still ? undefined : { opacity: [0.45, 1], scale: [1.08, 0.92], rotate: [-8, 8] }}
          transition={loop(12)}
        />
      </motion.div>
      <motion.div className={styles.slot} style={{ opacity: amber }}>
        <motion.div
          className={`${styles.layer} ${styles.amber}`}
          style={{ x: farX, y: farY }}
          animate={still ? undefined : { opacity: [1, 0.6], scale: [1, 1.1] }}
          transition={loop(10)}
        />
        <motion.div
          className={`${styles.layer} ${styles.gold}`}
          style={{ x: nearX, y: nearY }}
          animate={still ? undefined : { opacity: [0.95, 0.5], scale: [0.94, 1.08] }}
          transition={loop(7)}
        />
      </motion.div>
      <motion.div
        className={`${styles.layer} ${styles.sweep}`}
        animate={still ? undefined : { rotate: 360 }}
        transition={{ duration: 70, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
