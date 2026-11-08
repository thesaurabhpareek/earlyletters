'use client';
/**
 * Owner: coordinator. The film's letter set on paper, shared by S03 (its last frame), S04 and S05,
 * so the handoffs match to the pixel.
 *
 * `marks` 0..1: the quiet dotted underlines under the words the app will fix (DESIGN_LANGUAGE 12).
 * `fixes` 0..N: how many of the allowed edits are applied, in order; fractional values cross-fade.
 * A removed filler or false start fades, then leaves the line (one reflow, never per frame).
 * The misheard name cross-fades in place to the right name, with a soft accentSoft wash.
 * With no `fixes`, the letter shows as heard; with `final`, it shows the finished text.
 */
import { motion, useMotionValueEvent, useTransform, type MotionValue } from 'motion/react';
import { useState, type CSSProperties } from 'react';
import { sampleLetter, type HeardSegment } from '@/content/site';
import styles from './PaperLetter.module.css';

const segments = sampleLetter.heard as readonly HeardSegment[];
const edits = segments.map((s, i) => ({ s, i })).filter(({ s }) => s.becomes !== undefined);
export const EDIT_COUNT = edits.length;

export type PaperLetterProps = {
  marks?: MotionValue<number> | number;
  fixes?: MotionValue<number>;
  final?: boolean;
  className?: string;
  style?: CSSProperties;
};

function NameFix({ seg, order, fixes, marks }: { seg: HeardSegment; order: number; fixes: MotionValue<number>; marks: MotionValue<number> | number }) {
  const [settled, setSettled] = useState(() => fixes.get() >= order + 0.85);
  // Deferred: the value can change while a parent renders (reduced motion swaps the source).
  useMotionValueEvent(fixes, 'change', (v) => queueMicrotask(() => setSettled(v >= order + 0.85)));
  const heard = useTransform(fixes, [order, order + 0.6], [1, 0]);
  const fixed = useTransform(fixes, [order + 0.2, order + 0.8], [0, 1]);
  const wash = useTransform(fixes, [order + 0.2, order + 0.8, order + 2.2, order + 3], [0, 1, 1, 0]);
  if (settled) {
    // Once the right name is in, it takes its own width: the line closes up once, never per frame.
    return (
      <span className={styles.name}>
        <motion.span aria-hidden className={styles.wash} style={{ opacity: wash }} />
        <span className={styles.cell}>{seg.becomes}</span>
      </span>
    );
  }
  return (
    <span className={styles.name}>
      <motion.span aria-hidden className={styles.wash} style={{ opacity: wash }} />
      <motion.span style={{ opacity: heard }} className={styles.cell}>
        <motion.span className={styles.mark} style={{ opacity: marks }} />
        {seg.text}
      </motion.span>
      <motion.span style={{ opacity: fixed }} className={styles.over}>
        {seg.becomes}
      </motion.span>
    </span>
  );
}

function Removal({ seg, order, fixes, marks }: { seg: HeardSegment; order: number; fixes: MotionValue<number>; marks: MotionValue<number> | number }) {
  const [gone, setGone] = useState(() => fixes.get() >= order + 0.7);
  useMotionValueEvent(fixes, 'change', (v) => queueMicrotask(() => setGone(v >= order + 0.7)));
  const opacity = useTransform(fixes, [order, order + 0.55], [1, 0]);
  if (gone) return null;
  return (
    <motion.span className={styles.removal} style={{ opacity }}>
      <motion.span className={styles.mark} style={{ opacity: marks }} />
      {seg.text}
    </motion.span>
  );
}

export function PaperLetter({ marks = 0, fixes, final = false, className, style }: PaperLetterProps) {
  return (
    <p lang="en" className={[styles.letter, className].filter(Boolean).join(' ')} style={style}>
      {final || !fixes
        ? final
          ? sampleLetter.text
          : segments.map((s) => s.text).join('')
        : segments.map((s, i) => {
            if (s.becomes === undefined) return <span key={i}>{s.text}</span>;
            const order = edits.findIndex((e) => e.i === i);
            return s.kind === 'name' ? (
              <NameFix key={i} seg={s} order={order} fixes={fixes} marks={marks} />
            ) : (
              <Removal key={i} seg={s} order={order} fixes={fixes} marks={marks} />
            );
          })}
    </p>
  );
}
