'use client';
/**
 * A thin line down the left edge that fills as you read, in the lamp's colours (amber, rose, dusk blue).
 * Decorative (aria-hidden), hidden on narrow screens, and fully drawn under prefers-reduced-motion.
 */
import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import styles from './StoryRail.module.css';

export function StoryRail() {
  const still = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const fill = useSpring(scrollYProgress, { stiffness: 90, damping: 28, restDelta: 0.001 });
  return (
    <div className={styles.rail} aria-hidden>
      <motion.div className={styles.fill} style={{ scaleY: still ? 1 : fill }} />
    </div>
  );
}
