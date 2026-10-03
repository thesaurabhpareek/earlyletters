'use client';
/** Owner: coordinator. Wraps one scene with a lead-in and lead-out screen so its full progress range can be scrolled. */
import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

export function Lab({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <div data-lab-pad="before" style={{ height: '100svh', background: '#000' }} />
      {children}
      <div data-lab-pad="after" style={{ height: '100svh', background: '#000' }} />
    </MotionConfig>
  );
}
