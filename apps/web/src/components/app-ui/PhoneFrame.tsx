/**
 * Owner: E4 (app UI). A generic, brand-neutral phone frame (not an Apple device image;
 * see docs/web/research/R5 for Apple's marketing rules). Screen is 390 x 844 logical px
 * and scales with the `width` prop.
 */
import type { CSSProperties, ReactNode } from 'react';

export type PhoneFrameProps = {
  children: ReactNode;
  /** Rendered width in px of the whole device. Height follows the 390:844 screen ratio. */
  width?: number;
  scheme?: 'light' | 'dark';
  className?: string;
  style?: CSSProperties;
};

export function PhoneFrame({ children, width = 320, scheme = 'dark', className, style }: PhoneFrameProps) {
  const bezel = Math.round(width * 0.035);
  const screenW = width - bezel * 2;
  const screenH = Math.round((screenW * 844) / 390);
  return (
    <div
      className={className}
      style={{
        width,
        padding: bezel,
        borderRadius: width * 0.16,
        background: '#0d0c0b',
        boxShadow: '0 30px 80px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.06)',
        ...style,
      }}
    >
      <div
        style={{
          width: screenW,
          height: screenH,
          borderRadius: width * 0.13,
          overflow: 'hidden',
          position: 'relative',
          background: scheme === 'dark' ? 'var(--night)' : 'var(--paper)',
          color: scheme === 'dark' ? 'var(--night-ink)' : 'var(--ink)',
          containerType: 'inline-size',
        }}
      >
        {children}
      </div>
    </div>
  );
}
