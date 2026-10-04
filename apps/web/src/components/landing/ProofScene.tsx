'use client';
/**
 * Scene three, pinned: "Exactly as you said it." The headline holds on the left while the letter settles in on
 * the right and your scroll draws each of its three fixes. The scene fades in from the one before and out into
 * the next. Without scrubbing it is a normal two-column section with the finished letter.
 */
import { motion } from 'motion/react';
import { site } from '@/content/site';
import { ProofLetter } from './ProofLetter';
import { ScrubIn, usePin } from './scrub';
import styles from './Landing.module.css';

const s04 = site.scenes.s04;
const VH = 2.8;

export function ProofScene() {
  const { outer, content, enabled, pinned, progress, handoff } = usePin(VH);
  return (
    <section
      ref={outer}
      className={`${styles.scene} ${pinned ? styles.pinOn : ''}`}
      style={pinned ? { height: `${VH * 100}svh` } : undefined}
      aria-labelledby="exact-title"
    >
      <div className={styles.stage}>
        <div ref={content} className={`${styles.stageInner} ${styles.split}`}>
          <motion.div style={pinned ? handoff : undefined} className={styles.sceneCopy}>
            <ScrubIn progress={progress} from={0.02} to={0.14} enabled={enabled} as="div" y={18}>
              <h2 id="exact-title" className={styles.h2}>
                {s04.headline}
              </h2>
            </ScrubIn>
            <ScrubIn progress={progress} from={0.1} to={0.22} enabled={enabled} as="div" y={14}>
              <p className={styles.sub}>{s04.support}</p>
            </ScrubIn>
          </motion.div>
          <motion.div style={pinned ? handoff : undefined}>
            <ProofLetter progress={progress} enabled={enabled} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
