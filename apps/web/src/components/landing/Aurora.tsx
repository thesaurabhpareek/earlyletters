'use client';
/**
 * The lamp light behind the whole page. It is fixed, so it stays while you read, and its colour follows the
 * scroll: amber near the top, rose in the middle, dusk blue towards the end. On top of that each layer drifts
 * and breathes on its own very slow loop (14 to 28 seconds), so the page feels lit rather than busy.
 * Decorative (aria-hidden). Still under prefers-reduced-motion.
 */
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import styles from './Aurora.module.css';

const loop = (seconds: number) => ({ duration: seconds, repeat: Infinity, repeatType: 'mirror' as const, ease: 'easeInOut' as const });

export function Aurora() {
  const still = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const amber = useTransform(scrollYProgress, [0, 0.45, 1], [1, 0.4, 0.2]);
  const rose = useTransform(scrollYProgress, [0, 0.4, 0.75, 1], [0.3, 1, 0.5, 0.25]);
  const dusk = useTransform(scrollYProgress, [0, 0.5, 1], [0.08, 0.5, 1]);

  return (
    <div className={styles.aurora} aria-hidden>
      <motion.div className={styles.slot} style={{ opacity: dusk }}>
        <motion.div
          className={`${styles.layer} ${styles.dusk}`}
          animate={still ? undefined : { scale: [0.94, 1.1], x: ['-4%', '5%'] }}
          transition={loop(28)}
        />
      </motion.div>
      <motion.div className={styles.slot} style={{ opacity: rose }}>
        <motion.div
          className={`${styles.layer} ${styles.rose}`}
          animate={still ? undefined : { opacity: [0.45, 1], scale: [1.08, 0.92], rotate: [-8, 8] }}
          transition={loop(22)}
        />
      </motion.div>
      <motion.div className={styles.slot} style={{ opacity: amber }}>
        <motion.div
          className={`${styles.layer} ${styles.amber}`}
          animate={still ? undefined : { opacity: [1, 0.6], scale: [1, 1.1] }}
          transition={loop(18)}
        />
        <motion.div
          className={`${styles.layer} ${styles.gold}`}
          animate={still ? undefined : { opacity: [0.95, 0.5], scale: [0.94, 1.08] }}
          transition={loop(14)}
        />
      </motion.div>
    </div>
  );
}
