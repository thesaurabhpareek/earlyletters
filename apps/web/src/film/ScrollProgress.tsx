'use client';
/**
 * A thin line down the right edge that fills as the visitor moves through the film, so it is clear there is more and
 * how much is left. Transform only (scaleY), so it costs the scroll nothing. Decorative: hidden from screen readers.
 */
import { motion, useScroll, useSpring } from 'motion/react';
import { useToneAt } from '@/components/cta/useTone';
import styles from './ScrollProgress.module.css';

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  // The line sits at mid height: it reads the scene there, so it is dark on paper and light on night.
  const tone = useToneAt('middle');
  return (
    <div className={styles.track} data-tone={tone} aria-hidden>
      <motion.div className={styles.fill} style={{ scaleY: fill }} />
    </div>
  );
}
