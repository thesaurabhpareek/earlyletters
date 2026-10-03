'use client';
/**
 * The Listening screen (DESIGN_LANGUAGE 12, MOTION 5b and 5c) in dark mode: "To Meera", "Listening.",
 * the breathing glow behind the microphone disc (driven by `level`), the elapsed time, and the newest
 * lines of what was heard arriving word by word (driven by `words`). No waveform. The words are the
 * microphone's, as heard: the review scene shows the small fixes later.
 */
import { motion, useTransform, type MotionValue } from 'motion/react';
import { useLayoutEffect, useRef } from 'react';
import { site } from '@/content/site';
import { heardWords, WORD_COUNT } from '@/film/letter';
import { StatusBar } from './StatusBar';
import type { ListeningScreenProps } from './types';
import { MUTED, ZERO, u } from './units';

const c = site.scenes.s03;
const TOTAL_SECONDS = 72;
const LINE = 1.5; // line-height of the transcript, in em
const LINES_SHOWN = 4;

function Word({ i, words, text }: { i: number; words: MotionValue<number>; text: string }) {
  const opacity = useTransform(words, [i, i + 0.7], [0, 1]);
  const y = useTransform(words, [i, i + 0.7], [3, 0]);
  return (
    <motion.span style={{ opacity, y, display: 'inline-block', whiteSpace: 'pre' }}>
      {text}
      {i < WORD_COUNT - 1 ? ' ' : ''}
    </motion.span>
  );
}

export function ListeningScreen({ level = ZERO, words = ZERO }: ListeningScreenProps) {
  const glowScale = useTransform(level, (v) => 1 + 0.18 * v);
  const glowOpacity = useTransform(level, (v) => 0.18 + 0.22 * v);
  const haloScale = useTransform(level, (v) => 1 + 0.32 * v);
  const haloOpacity = useTransform(level, (v) => 0.06 + 0.12 * v);
  const elapsed = useTransform(words, (v) => {
    const s = Math.round((Math.max(0, Math.min(WORD_COUNT, v)) / WORD_COUNT) * TOTAL_SECONDS);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  });

  const box = useRef<HTMLDivElement>(null);
  const tops = useRef<number[]>([]);
  const lineH = useRef(0);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const spans = Array.from(el.querySelectorAll<HTMLElement>('[data-w]'));
      tops.current = spans.map((s) => s.offsetTop);
      lineH.current = parseFloat(getComputedStyle(el).fontSize) * LINE;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scrollY = useTransform(words, (v) => {
    const i = Math.max(0, Math.min(WORD_COUNT - 1, Math.floor(v)));
    const top = tops.current[i] ?? 0;
    const lh = lineH.current || 1;
    return -Math.max(0, top - lh * (LINES_SHOWN - 1));
  });

  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: 'var(--font-sans)', background: 'var(--night)' }}>
      <StatusBar />
      <div style={{ position: 'absolute', inset: 0, padding: `${u(84)} ${u(26)} ${u(40)}`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <p style={{ margin: 0, fontWeight: 500, fontSize: u(13), letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}>{c.appTo}</p>
        <p style={{ margin: `${u(8)} 0 0`, fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: u(28), letterSpacing: '-0.01em' }}>{c.appListening}</p>
        <p style={{ margin: `${u(6)} 0 0`, fontSize: u(15.5), color: MUTED }}>{c.appHint}</p>

        <div style={{ position: 'relative', width: u(240), height: u(240), marginTop: u(34), display: 'grid', placeItems: 'center' }}>
          <motion.div
            aria-hidden
            style={{
              position: 'absolute',
              inset: u(-40),
              borderRadius: '50%',
              background: 'radial-gradient(closest-side, var(--night-recording), transparent)',
              scale: haloScale,
              opacity: haloOpacity,
            }}
          />
          <motion.div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'radial-gradient(closest-side, color-mix(in srgb, var(--night-recording) 90%, white), color-mix(in srgb, var(--night-recording) 40%, transparent) 62%, transparent)',
              scale: glowScale,
              opacity: glowOpacity,
            }}
          />
          <div
            style={{
              width: u(120),
              height: u(120),
              borderRadius: '50%',
              background: 'var(--night-recording)',
              color: '#2a120e',
              display: 'grid',
              placeItems: 'center',
              boxShadow: `0 ${u(10)} ${u(30)} rgba(0,0,0,0.35)`,
            }}
          >
            <svg viewBox="0 0 24 24" style={{ width: u(44), height: u(44) }} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
            </svg>
          </div>
        </div>

        <motion.p style={{ margin: `${u(18)} 0 0`, fontWeight: 600, fontSize: u(19), fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}>{elapsed}</motion.p>

        <div
          ref={box}
          style={{
            position: 'relative',
            marginTop: u(18),
            width: '100%',
            height: `${LINE * LINES_SHOWN}em`,
            overflow: 'hidden',
            fontFamily: 'var(--font-serif)',
            fontSize: u(18),
            lineHeight: LINE,
            color: 'color-mix(in srgb, currentColor 86%, transparent)',
            maskImage: 'linear-gradient(to bottom, transparent, black 32%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 32%)',
          }}
        >
          <motion.div style={{ y: scrollY }}>
            {heardWords.map((w, i) => (
              <span key={i} data-w>
                <Word i={i} words={words} text={w} />
              </span>
            ))}
          </motion.div>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', gap: u(12), width: '100%' }}>
          <div style={{ flex: 1, height: u(58), borderRadius: u(29), display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: u(16), boxShadow: `inset 0 0 0 ${u(1.5)} color-mix(in srgb, currentColor 40%, transparent)` }}>
            {c.appPause}
          </div>
          <div style={{ flex: 1, height: u(58), borderRadius: u(29), display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: u(16), background: 'var(--night-accent)', color: 'var(--night-on-accent)' }}>
            {c.appDone}
          </div>
        </div>
      </div>
    </div>
  );
}
