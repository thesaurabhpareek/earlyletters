'use client';
/**
 * Smooth wheel scrolling for the film (Lenis, MIT). Native scroll position stays the source of truth,
 * so Motion's useScroll and every sticky stage keep working unchanged. Touch keeps the phone's own
 * scrolling (no syncTouch): iOS momentum is better than any imitation. Off under reduced motion.
 */
import { ReactLenis, useLenis } from 'lenis/react';
import type { ReactNode } from 'react';
import { useResting } from './hooks';

export function SmoothScroll({ children }: { children: ReactNode }) {
  const resting = useResting();
  if (resting) return <>{children}</>;
  return (
    <ReactLenis root options={{ lerp: 0.11, smoothWheel: true, syncTouch: false, anchors: false, autoRaf: true }}>
      {children}
    </ReactLenis>
  );
}

export { useLenis };
