'use client';
/**
 * Owner: ACT3. Hydration-safe "prefers reduced motion".
 * useScene().reduced comes from Motion's useReducedMotion, which reads matchMedia during the first
 * client render, so a scene that branches its markup on it can mismatch the server HTML. This hook
 * reports false on the server and during hydration, then the real value, and follows changes.
 */
import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

export function useResting(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
