'use client';
/**
 * Scene three, pinned: "Exactly as you said it." The headline holds on the left while the letter grows in on the
 * right and your scroll draws each of its three fixes. Without scrubbing it is a normal two-column section with
 * the finished letter.
 */
import { site } from '@/content/site';
import { ProofLetter } from './ProofLetter';
import { ScrubIn, usePin } from './scrub';
import styles from './Landing.module.css';

const s04 = site.scenes.s04;
const VH = 2.6;

export function ProofScene() {
  const { outer, content, enabled, pinned, progress } = usePin(VH);
  return (
    <section
      ref={outer}
      className={`${styles.scene} ${pinned ? styles.pinOn : ''}`}
      style={pinned ? { height: `${VH * 100}svh` } : undefined}
      aria-labelledby="exact-title"
    >
      <div className={styles.stage}>
        <div ref={content} className={`${styles.stageInner} ${styles.split}`}>
          <div>
            <ScrubIn progress={progress} from={0} to={0.16} enabled={enabled} y={30} blur={8} as="div">
              <h2 id="exact-title" className={styles.h2}>
                {s04.headline}
              </h2>
            </ScrubIn>
            <ScrubIn progress={progress} from={0.08} to={0.24} enabled={enabled} y={24} as="div">
              <p className={styles.sub}>{s04.support}</p>
            </ScrubIn>
          </div>
          <ProofLetter progress={progress} enabled={enabled} />
        </div>
      </div>
    </section>
  );
}
