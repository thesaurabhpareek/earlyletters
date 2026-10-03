'use client';
/**
 * The Tonight screen (DESIGN_LANGUAGE 12) at night, in dark mode: dateline, the night greeting,
 * the subtitle, a prompt card, Speak and Type as equal twin pills, "Not much today", the tab bar.
 * Words are the app's own (strings.en.ts, via site.ts). `press` 0..1 presses Speak.
 */
import { motion, useTransform } from 'motion/react';
import { site } from '@/content/site';
import { StatusBar } from './StatusBar';
import type { TonightScreenProps } from './types';
import { FAINT, MUTED, ZERO as zero, u } from './units';

const c = site.scenes.s02;
const ACCENT = 'var(--night-accent)';

function Mic() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: u(26), height: u(26) }} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
    </svg>
  );
}
function Pencil() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: u(26), height: u(26) }} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />
    </svg>
  );
}

export function TonightScreen({ press }: TonightScreenProps) {
  const speakScale = useTransform(press ?? zero, [0, 0.5, 1], [1, 0.95, 0.97]);
  const ring = useTransform(press ?? zero, [0, 0.4, 1], [0, 1, 1]);

  const pill = {
    flex: 1,
    height: u(76),
    borderRadius: u(38),
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: u(4),
    background: ACCENT,
    color: 'var(--night-on-accent)',
    fontWeight: 600,
    fontSize: u(16),
    position: 'relative' as const,
  };

  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: 'var(--font-sans)', background: 'var(--night)' }}>
      <StatusBar />
      <div style={{ position: 'absolute', inset: 0, padding: `${u(78)} ${u(22)} 0`, display: 'flex', flexDirection: 'column' }}>
        <p style={{ margin: 0, fontWeight: 500, fontSize: u(13), letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}>
          {c.appDateline}
        </p>
        <p style={{ margin: `${u(10)} 0 0`, fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: u(30), lineHeight: 1.15, letterSpacing: '-0.015em' }}>
          {c.appGreeting}
        </p>
        <p style={{ margin: `${u(10)} 0 0`, fontSize: u(17), lineHeight: 1.35, color: MUTED }}>{c.appSubtitle}</p>

        <div
          style={{
            marginTop: u(26),
            padding: `${u(20)} ${u(20)} ${u(18)}`,
            borderRadius: u(20),
            background: 'var(--night-raised)',
            boxShadow: `inset 0 0 0 ${u(1)} var(--night-line)`,
          }}
        >
          <p style={{ margin: 0, fontWeight: 500, fontSize: u(12.5), letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED }}>
            {c.appPromptLabel}
          </p>
          <p style={{ margin: `${u(10)} 0 0`, fontFamily: 'var(--font-serif)', fontSize: u(23), lineHeight: 1.3 }}>{c.appPrompt}</p>
          <p style={{ margin: `${u(16)} 0 0`, fontWeight: 500, fontSize: u(15), color: ACCENT }}>{c.appAnother}</p>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', gap: u(12) }}>
          <motion.div style={{ ...pill, scale: speakScale }}>
            <Mic />
            {c.speak}
            <motion.span
              aria-hidden
              style={{ position: 'absolute', inset: u(-5), borderRadius: u(43), boxShadow: `0 0 0 ${u(2)} ${ACCENT}`, opacity: ring }}
            />
          </motion.div>
          <div style={pill}>
            <Pencil />
            {c.type}
          </div>
        </div>
        <p style={{ margin: `${u(16)} 0 0`, textAlign: 'center', fontWeight: 500, fontSize: u(15), color: MUTED }}>{c.notMuch}</p>

        <div
          style={{
            margin: `${u(18)} ${u(-22)} 0`,
            height: u(92),
            borderTop: `${u(1)} solid ${FAINT}`,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            paddingTop: u(10),
            fontSize: u(11.5),
            fontWeight: 500,
            textAlign: 'center',
            background: 'color-mix(in srgb, var(--night-raised) 70%, transparent)',
          }}
        >
          {c.appTabs.map((t, i) => (
            <span key={t} style={{ color: i === 0 ? ACCENT : MUTED, display: 'grid', justifyItems: 'center', gap: u(4) }}>
              <span style={{ width: u(24), height: u(24), borderRadius: u(7), border: `${u(1.6)} solid currentColor`, opacity: i === 0 ? 1 : 0.8 }} />
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

