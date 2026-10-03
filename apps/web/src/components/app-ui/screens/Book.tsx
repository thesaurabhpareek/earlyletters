'use client';
/**
 * The Book screen in light mode: "Meera's Book" and month chapter covers, newest first.
 * `arrive` 0..1 settles the new letter into Month 9 (a soft accentSoft wash on that chapter).
 */
import { motion, useTransform } from 'motion/react';
import { site } from '@/content/site';
import { StatusBar } from './StatusBar';
import type { BookScreenProps } from './types';
import { MUTED, ZERO, u } from './units';

const c = site.scenes.s06;

export function BookScreen({ arrive = ZERO }: BookScreenProps) {
  const wash = useTransform(arrive, [0.5, 0.8, 1], [0, 1, 0.7]);
  const chapters = [...c.chapters].reverse();
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: 'var(--font-sans)', background: 'var(--paper)', color: 'var(--ink)' }}>
      <StatusBar />
      <div style={{ position: 'absolute', inset: 0, padding: `${u(84)} ${u(20)} 0` }}>
        <p style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: u(34), letterSpacing: '-0.015em' }}>{c.appTitle}</p>
        <div style={{ display: 'grid', gap: u(14), marginTop: u(22) }}>
          {chapters.map((ch, i) => (
            <div key={ch.month} style={{ position: 'relative', height: u(150), borderRadius: u(20), background: 'var(--surface)', padding: u(20), overflow: 'hidden' }}>
              {i === 0 ? <motion.div aria-hidden style={{ position: 'absolute', inset: 0, background: 'var(--accent-soft)', opacity: wash }} /> : null}
              <p style={{ position: 'relative', margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: u(24) }}>{ch.month}</p>
              <p style={{ position: 'relative', margin: `${u(6)} 0 0`, fontSize: u(14), color: MUTED }}>{ch.meta}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
