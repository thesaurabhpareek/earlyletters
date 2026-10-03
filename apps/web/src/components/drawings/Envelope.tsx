'use client';
/** Stub drawing. Replaced by its owner (see docs/web/TEAM.md). Keep the name and DrawingProps. */
import type { DrawingProps } from './types';

export function Envelope({ className, title, strokeWidth = 1.5 }: DrawingProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden={title ? undefined : true} role={title ? 'img' : undefined} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
      {title ? <title>{title}</title> : null}
      <rect x="10" y="20" width="80" height="60" rx="4" />
    </svg>
  );
}
