'use client';
/**
 * Owner: ACT3. The Letter reading view (docs/design/DESIGN_LANGUAGE.md section 12), as the film shows it:
 * back chevron, Month 9 dateline, "From Papa", the letter in letterBody, an italic sign-off, and the
 * floating pill player (play state, scrubber, elapsed and total time). No waveform, no word highlighting.
 *
 * Sized in container units: the PhoneFrame screen is a 390 logical px wide inline-size container,
 * so `u(n)` is n logical points at any rendered size. Colours follow the frame's scheme through
 * currentColor; the accent comes from `--letter-accent` (set by the scene) with the dark accent as default.
 *
 * `playback` 0..1 moves the scrubber and the elapsed time. Absent = paused near the start (resting state).
 */
import { motion, useTransform, type MotionValue } from 'motion/react';
import { sampleLetter, site } from '@/content/site';
import type { LetterScreenProps } from './types';

const u = (pt: number) => `${((pt / 390) * 100).toFixed(3)}cqw`;
const ACCENT = 'var(--letter-accent, var(--night-accent))';
const ON_ACCENT = 'var(--letter-on-accent, var(--night-on-accent))';
const MUTED = 'color-mix(in srgb, currentColor 68%, transparent)';

function toSeconds(mmss: string) {
  const [m, s] = mmss.split(':').map(Number);
  return (m || 0) * 60 + (s || 0);
}
const TOTAL = toSeconds(sampleLetter.duration);
const clock = (seconds: number) => {
  const s = Math.max(0, Math.min(TOTAL, Math.round(seconds)));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function LetterScreen({ playback }: LetterScreenProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: `${u(58)} ${u(24)} 0`,
        fontFamily: 'var(--font-sans)',
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden style={{ width: u(26), height: u(26), marginLeft: u(-6), color: ACCENT }} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 5l-7 7 7 7" />
      </svg>

      <p
        style={{
          margin: `${u(26)} 0 0`,
          fontWeight: 500,
          fontSize: u(13),
          lineHeight: 1.3,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: MUTED,
        }}
      >
        {sampleLetter.dateline}
      </p>
      <p
        style={{
          margin: `${u(6)} 0 0`,
          fontFamily: 'var(--font-serif)',
          fontWeight: 500,
          fontSize: u(26),
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
        }}
      >
        {site.scenes.s07.appFrom}
      </p>

      <p
        lang="en"
        style={{
          margin: `${u(20)} 0 0`,
          fontFamily: 'var(--font-serif)',
          fontWeight: 400,
          fontSize: u(19),
          lineHeight: 1.62,
          textWrap: 'pretty',
          hyphens: 'manual',
        }}
      >
        {sampleLetter.text}
      </p>
      <p
        style={{
          margin: `${u(10)} 0 0`,
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: u(19),
          lineHeight: 1.5,
          color: MUTED,
        }}
      >
        {sampleLetter.from}
      </p>

      <Player playback={playback} />
    </div>
  );
}

function Player({ playback }: { playback?: MotionValue<number> }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: u(16),
        right: u(16),
        bottom: u(30),
        height: u(60),
        borderRadius: u(30),
        display: 'flex',
        alignItems: 'center',
        gap: u(12),
        padding: `0 ${u(18)} 0 ${u(8)}`,
        background: 'var(--letter-pill, color-mix(in srgb, currentColor 11%, var(--night-raised)))',
        boxShadow: `0 ${u(8)} ${u(24)} rgba(0,0,0,0.28), inset 0 0 0 ${u(0.5)} color-mix(in srgb, currentColor 14%, transparent)`,
      }}
    >
      <span
        aria-hidden
        style={{
          flex: 'none',
          width: u(44),
          height: u(44),
          borderRadius: '50%',
          background: ACCENT,
          color: ON_ACCENT,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {playback ? (
          <svg viewBox="0 0 20 20" style={{ width: u(18), height: u(18) }} fill="currentColor">
            <rect x="4.5" y="3.5" width="3.6" height="13" rx="1.4" />
            <rect x="11.9" y="3.5" width="3.6" height="13" rx="1.4" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" style={{ width: u(18), height: u(18), marginLeft: u(2) }} fill="currentColor">
            <path d="M6 3.9c0-.8.9-1.3 1.6-.9l9 5.6c.6.4.6 1.4 0 1.8l-9 5.6c-.7.4-1.6-.1-1.6-.9z" />
          </svg>
        )}
      </span>
      <Scrubber playback={playback} />
    </div>
  );
}

function Scrubber({ playback }: { playback?: MotionValue<number> }) {
  const fallback = 0.08;
  return playback ? <LiveScrubber playback={playback} /> : <ScrubberParts fill={fallback} elapsed={clock(TOTAL * fallback)} />;
}

function LiveScrubber({ playback }: { playback: MotionValue<number> }) {
  const scaleX = useTransform(playback, [0, 1], [0, 1]);
  const knobX = useTransform(playback, (v) => `${(Math.max(0, Math.min(1, v)) * 100).toFixed(2)}%`);
  const elapsed = useTransform(playback, (v) => clock(TOTAL * v));
  return <ScrubberParts fillScale={scaleX} knobX={knobX} elapsedValue={elapsed} />;
}

type PartsProps = {
  fill?: number;
  elapsed?: string;
  fillScale?: MotionValue<number>;
  /** Translates a full-width layer, so the knob moves by transform only. */
  knobX?: MotionValue<string>;
  elapsedValue?: MotionValue<string>;
};

function ScrubberParts({ fill = 0, elapsed, fillScale, knobX, elapsedValue }: PartsProps) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: u(12), minWidth: 0 }}>
      <div style={{ position: 'relative', flex: 1, height: u(4) }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: u(2), background: 'color-mix(in srgb, currentColor 22%, transparent)' }} />
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: u(2),
            background: ACCENT,
            originX: 0,
            scaleX: fillScale ?? fill,
          }}
        />
        <motion.div style={{ position: 'absolute', inset: 0, x: knobX ?? `${fill * 100}%` }}>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              width: u(14),
              height: u(14),
              marginLeft: u(-7),
              marginTop: u(-7),
              borderRadius: '50%',
              background: ACCENT,
              boxShadow: `0 ${u(1)} ${u(3)} rgba(0,0,0,0.3)`,
            }}
          />
        </motion.div>
      </div>
      <span style={{ flex: 'none', fontSize: u(13), fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: MUTED, letterSpacing: '0.02em' }}>
        <motion.span>{elapsedValue ?? elapsed}</motion.span>
        <span aria-hidden> / </span>
        {sampleLetter.duration}
      </span>
    </div>
  );
}
