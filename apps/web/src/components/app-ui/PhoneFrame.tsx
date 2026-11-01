'use client';
/**
 * A premium, generic phone (no Apple branding or product imagery). Screen 390 x 844 logical px,
 * exposed as an inline-size container so screens size themselves in `cqw`.
 * Layers: brushed edge, black bezel, glass screen with a faint sheen, a generic camera pill.
 * `chrome` 0..1 fades the edge, bezel, sheen and pill (for a push-in into the screen); the screen stays.
 */
import { motion, type MotionValue } from 'motion/react';
import type { CSSProperties, ReactNode } from 'react';

export type PhoneFrameProps = {
  children: ReactNode;
  /** Rendered width in px of the whole device. Height follows the screen ratio. */
  width?: number;
  scheme?: 'light' | 'dark';
  className?: string;
  style?: CSSProperties;
  /** Hide the glass sheen (for full-bleed handoffs). */
  sheen?: boolean;
  chrome?: MotionValue<number> | number;
  /** What the screen shows, for screen readers. The mock-up's own text is decorative. */
  label?: string;
};

export function PhoneFrame({ children, width = 320, scheme = 'dark', className, style, sheen = true, chrome = 1, label }: PhoneFrameProps) {
  const edge = Math.max(2, Math.round(width * 0.012));
  const bezel = Math.round(width * 0.03);
  const screenW = width - (edge + bezel) * 2;
  const screenH = Math.round((screenW * 844) / 390);
  const outerR = width * 0.165;
  const innerR = outerR - edge - bezel * 0.85;
  return (
    <div className={className} role={label ? 'img' : undefined} aria-label={label} style={{ width, padding: edge + bezel, position: 'relative', ...style }}>
      <motion.div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: outerR,
          background: 'linear-gradient(145deg, #4a4540 0%, #1d1b19 38%, #2e2a27 62%, #57514b 100%)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.08) inset, 0 40px 90px -20px rgba(0,0,0,0.55), 0 18px 40px -18px rgba(0,0,0,0.5)',
          opacity: chrome,
        }}
      >
        <div style={{ position: 'absolute', inset: edge, borderRadius: outerR - edge, background: '#050505' }} />
      </motion.div>
      <div
        aria-hidden={label ? true : undefined}
        style={{
          width: screenW,
          height: screenH,
          borderRadius: innerR,
          overflow: 'hidden',
          position: 'relative',
          background: scheme === 'dark' ? 'var(--night)' : 'var(--paper)',
          color: scheme === 'dark' ? 'var(--night-ink)' : 'var(--ink)',
          containerType: 'inline-size',
          isolation: 'isolate',
        }}
      >
        {children}
        <motion.div
          aria-hidden
          style={{
            position: 'absolute',
            top: '1.5%',
            left: '50%',
            width: '31%',
            height: '3.9%',
            translateX: '-50%',
            borderRadius: 999,
            background: '#000',
            zIndex: 20,
            opacity: chrome,
          }}
        />
        {sheen ? (
          <motion.div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 21,
              pointerEvents: 'none',
              background: 'linear-gradient(118deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 28%, transparent 46%)',
              opacity: chrome,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
