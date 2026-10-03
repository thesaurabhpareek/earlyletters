'use client';
/**
 * Scene one, pinned: "Meera is asleep." The screen holds while the line arrives word by word, un-blurring as you
 * scroll, and the quiet sentence follows. Without scrubbing (server, no JavaScript, reduced motion) it is a
 * normal section with the finished text.
 */
import { site } from '@/content/site';
import { ScrubIn, usePin } from './scrub';
import styles from './Landing.module.css';

const s01 = site.scenes.s01;
const VH = 2.2;

export function Evening() {
  const { outer, content, enabled, pinned, progress } = usePin(VH);
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
          <ScrubIn progress={progress} from={0.02} to={0.14} enabled={enabled} y={16} as="div">
            <p className={styles.kicker}>
              {s01.label} <span className={styles.dateline}>{s01.dateline}</span>
            </p>
          </ScrubIn>
          <h2 id="evening-title" className={styles.big}>
            {words.map((word, i) => (
              <span key={`${word}-${i}`}>
                {i > 0 ? ' ' : null}
                <ScrubIn progress={progress} from={0.12 + i * 0.16} to={0.3 + i * 0.16} enabled={enabled} y={38} blur={14}>
                  {word}
                </ScrubIn>
              </span>
            ))}
          </h2>
          <ScrubIn progress={progress} from={0.66} to={0.84} enabled={enabled} y={20} blur={6} as="div">
            <p className={styles.sub}>{s01.support}</p>
          </ScrubIn>
        </div>
      </div>
    </section>
  );
}
