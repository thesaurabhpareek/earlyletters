'use client';
/**
 * The proof behind "exactly as you said it": the sample letter as the microphone heard it, with the app's
 * three small fixes shown the way the app shows them. A misheard name is struck and corrected, a filler and
 * a false start are struck and gone. Nothing is added. The fixes play once as the letter scrolls into view;
 * the server and reduced-motion visitors get the finished state. The letter itself is checked by
 * test/sample-letter.test.ts: applying every fix gives exactly the final text, and no fix adds meaning.
 */
import { useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { sampleLetter, site, type HeardSegment } from '@/content/site';
import styles from './ProofLetter.module.css';

const s04 = site.scenes.s04;
const segments = sampleLetter.heard as readonly HeardSegment[];
type Phase = 'server' | 'armed' | 'played';

export function ProofLetter() {
  const ref = useRef<HTMLElement>(null);
  const still = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: '0px 0px -25% 0px' });
  const [phase, setPhase] = useState<Phase>('server');

  useEffect(() => {
    const el = ref.current;
    if (!el || still) {
      setPhase('played');
      return;
    }
    setPhase(el.getBoundingClientRect().top < window.innerHeight * 0.6 ? 'played' : 'armed');
  }, [still]);

  const played = phase !== 'armed' || inView;
  let fix = 0;

  return (
    <figure ref={ref} className={`${styles.letter} ${played ? styles.played : ''}`}>
      <figcaption className={styles.head}>
        <span>{`To ${sampleLetter.to}`}</span>
        <span>{sampleLetter.dateline}</span>
        <span>{`From ${sampleLetter.from}`}</span>
      </figcaption>
      <p className={styles.body}>
        {segments.map((seg, i) => {
          if (seg.becomes === undefined) return <span key={i}>{seg.text}</span>;
          const delay = `${0.5 + fix++ * 0.7}s`;
          return (
            <span key={i} style={{ ['--d' as string]: delay }}>
              <del className={styles.out}>{seg.text}</del>
              {seg.becomes !== '' ? <ins className={styles.in}>{seg.becomes}</ins> : null}
            </span>
          );
        })}
      </p>
      <p className={styles.foot}>
        <span className={styles.count}>{s04.appChanges}</span>
        <span>{s04.appTrust}</span>
      </p>
    </figure>
  );
}
