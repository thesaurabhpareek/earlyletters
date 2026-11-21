'use client';
/**
 * The Review ("Read it back") screen in light mode: title, the trust line, the letter as heard with
 * its few allowed fixes resolving as `fix` goes 0 to 1 (a misheard name, a filler, a false start).
 * Nothing is added. The film shows this large on paper in S04; this phone version is for reuse.
 */
import { motion, useTransform, type MotionValue } from 'motion/react';
import { sampleLetter, site, type HeardSegment } from '@/content/site';
import { StatusBar } from './StatusBar';
import type { ReviewScreenProps } from './types';
import { MUTED, ZERO, u } from './units';

const c = site.scenes.s04;
const segments = sampleLetter.heard as readonly HeardSegment[];

function Fix({ seg, fix }: { seg: HeardSegment; fix: MotionValue<number> }) {
  const out = useTransform(fix, [0, 1], [1, 0]);
  const inn = useTransform(fix, [0, 1], [0, 1]);
  return (
    <span style={{ position: 'relative' }}>
      <motion.span style={{ opacity: out, textDecoration: 'underline dotted', textUnderlineOffset: '0.2em', textDecorationColor: 'var(--accent)' }}>{seg.text}</motion.span>
      {seg.becomes ? <motion.span style={{ opacity: inn, position: 'absolute', left: 0, top: 0 }}>{seg.becomes}</motion.span> : null}
    </span>
  );
}

export function ReviewScreen({ fix = ZERO }: ReviewScreenProps) {
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: 'var(--font-sans)', background: 'var(--paper)', color: 'var(--ink)' }}>
      <StatusBar />
      <div style={{ position: 'absolute', inset: 0, padding: `${u(84)} ${u(24)} 0` }}>
        <p style={{ margin: 0, fontWeight: 500, fontSize: u(13), letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}>{sampleLetter.dateline}</p>
        <p style={{ margin: `${u(8)} 0 0`, fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: u(28) }}>{c.appTitle}</p>
        <p style={{ margin: `${u(6)} 0 0`, fontSize: u(15), color: MUTED }}>{c.appTrust}</p>
        <p style={{ margin: `${u(20)} 0 0`, fontFamily: 'var(--font-serif)', fontSize: u(18.5), lineHeight: 1.6 }}>
          {segments.map((s, i) => (s.becomes !== undefined ? <Fix key={i} seg={s} fix={fix} /> : <span key={i}>{s.text}</span>))}
        </p>
      </div>
    </div>
  );
}
