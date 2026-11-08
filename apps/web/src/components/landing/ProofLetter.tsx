'use client';
/**
 * The proof behind "exactly as you said it": the sample letter as the microphone heard it, with the app's three
 * small fixes shown the way the app shows them. A misheard name is struck and corrected, a filler and a false
 * start are struck and gone. Nothing is added. When scrubbing is on, the letter grows into place and each fix is
 * drawn by your scroll, one after another; otherwise it shows the finished letter. The letter itself is checked
 * by test/sample-letter.test.ts: applying every fix gives exactly the final text, and no fix adds meaning.
 */
import { motion, useTransform, type MotionValue } from 'motion/react';
import { sampleLetter, site, type HeardSegment } from '@/content/site';
import styles from './ProofLetter.module.css';

const s04 = site.scenes.s04;
const segments = sampleLetter.heard as readonly HeardSegment[];

function Fix({ seg, index, progress, enabled }: { seg: HeardSegment; index: number; progress: MotionValue<number>; enabled: boolean }) {
  const from = 0.3 + index * 0.17;
  const to = from + 0.12;
  const width = useTransform(progress, [from, to], [0, 100]);
  const backgroundSize = useTransform(width, (v) => `${v.toFixed(1)}% 2px`);
  const strikeColor = useTransform(progress, [from, to], ['#2b2722', '#6b645b']);
  const inOpacity = useTransform(progress, [to - 0.02, to + 0.08], [0, 1]);
  return (
    <span>
      <motion.del className={styles.out} style={enabled ? { backgroundSize, color: strikeColor } : undefined}>
        {seg.text}
      </motion.del>
      {seg.becomes !== '' ? (
        <motion.ins className={styles.in} style={enabled ? { opacity: inOpacity } : undefined}>
          {seg.becomes}
        </motion.ins>
      ) : null}
    </span>
  );
}

export function ProofLetter({ progress, enabled }: { progress: MotionValue<number>; enabled: boolean }) {
  // The letter settles in, then keeps coming a little closer for the rest of the scene.
  const scale = useTransform(progress, [0, 0.24, 1], [0.92, 1, 1.03]);
  const y = useTransform(progress, [0, 0.24], [60, 0]);
  const rotate = useTransform(progress, [0, 0.24], [-2.5, -0.6]);
  const opacity = useTransform(progress, [0.02, 0.16], [0, 1]);
  const foot = useTransform(progress, [0.76, 0.88], [0, 1]);
  let fix = 0;
  return (
    <motion.figure className={styles.letter} style={enabled ? { scale, y, rotate, opacity } : undefined}>
      <figcaption className={styles.head}>
        <span>{`To ${sampleLetter.to}`}</span>
        <span>{sampleLetter.dateline}</span>
        <span>{`From ${sampleLetter.from}`}</span>
      </figcaption>
      <p className={styles.body}>
        {segments.map((seg, i) =>
          seg.becomes === undefined ? (
            <span key={i}>{seg.text}</span>
          ) : (
            <Fix key={i} seg={seg} index={fix++} progress={progress} enabled={enabled} />
          ),
        )}
      </p>
      <motion.p className={styles.foot} style={enabled ? { opacity: foot } : undefined}>
        <span className={styles.count}>{s04.appChanges}</span>
        <span>{s04.appTrust}</span>
      </motion.p>
    </motion.figure>
  );
}
