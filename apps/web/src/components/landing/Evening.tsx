'use client';
/**
 * Scene one, pinned: "Meera is asleep." The screen holds while the line is read word by word, each filling from
 * dim to bright as you scroll, the whole line settling a little closer, and the quiet sentence follows. The scene
 * fades in from the hero and out into the next. Without scrubbing (server, no JavaScript, reduced motion) it is a
 * normal section with the finished text.
 */
import { motion, useTransform } from 'motion/react';
import { site } from '@/content/site';
import { ScrubIn, usePin } from './scrub';
import styles from './Landing.module.css';

const s01 = site.scenes.s01;
const VH = 2.4;

export function Evening() {
  const { outer, content, enabled, pinned, progress, handoff } = usePin(VH);
  const scale = useTransform(progress, [0, 1], [0.94, 1.03]);
  const words = s01.headline.split(' ');
  return (
    <section
      ref={outer}
      className={`${styles.scene} ${pinned ? styles.pinOn : ''}`}
      style={pinned ? { height: `${VH * 100}svh` } : undefined}
      aria-labelledby="evening-title"
    >
      <div className={styles.stage}>
        <div ref={content} className={`${styles.stageInner} ${styles.evening}`}>
          <motion.div style={pinned ? handoff : undefined}>
            <ScrubIn progress={progress} from={0.02} to={0.12} enabled={enabled} min={0} as="div">
              <p className={styles.kicker}>
                {s01.label} <span className={styles.dateline}>{s01.dateline}</span>
              </p>
            </ScrubIn>
            <motion.h2 id="evening-title" className={styles.big} style={enabled ? { scale, transformOrigin: 'left center' } : undefined}>
              {words.map((word, i) => (
                <span key={`${word}-${i}`}>
                  {i > 0 ? ' ' : null}
                  <ScrubIn progress={progress} from={0.1 + i * 0.17} to={0.26 + i * 0.17} enabled={enabled} min={0.14}>
                    {word}
                  </ScrubIn>
                </span>
              ))}
            </motion.h2>
            <ScrubIn progress={progress} from={0.64} to={0.8} enabled={enabled} min={0} y={14} as="div">
              <p className={styles.sub}>{s01.support}</p>
            </ScrubIn>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
