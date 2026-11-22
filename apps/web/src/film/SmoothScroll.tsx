'use client';
/**
 * Smooth wheel scrolling for the film (Lenis, MIT). Native scroll position stays the source of truth,
 * so Motion's useScroll and every sticky stage keep working unchanged. Touch keeps the phone's own
 * scrolling (no syncTouch): iOS momentum is better than any imitation. Off under reduced motion.
 */
import { ReactLenis, useLenis } from 'lenis/react';
import { useMemo, type ReactNode } from 'react';
import { useResting } from './hooks';
import { makeWheelGovernor } from './wheel-governor';

export function SmoothScroll({ children }: { children: ReactNode }) {
  const resting = useResting();
  // One flick must not carry the visitor through several parts before they can read a line (wheel and trackpad only).
  const options = useMemo(() => {
    const govern = makeWheelGovernor();
    return {
      lerp: 0.11,
      smoothWheel: true,
      syncTouch: false,
      anchors: false,
      autoRaf: true,
      virtualScroll: (data: { deltaY: number; event: Event }) => {
        if (data.event.type.includes('wheel')) data.deltaY = govern(data.deltaY, performance.now());
        return true;
      },
    };
  }, []);
  if (resting) return <>{children}</>;
  return (
    <ReactLenis root options={options}>
      {children}
    </ReactLenis>
  );
}

export { useLenis };
