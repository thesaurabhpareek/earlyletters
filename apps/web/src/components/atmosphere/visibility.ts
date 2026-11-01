'use client';
/**
 * Owner: AT. Tells a layer whether it is worth animating: on screen (IntersectionObserver) and the
 * tab visible. Calls back on change only; never sets React state, so nothing re-renders per frame.
 */
import { useEffect, type RefObject } from 'react';

export function watchActive(el: Element, onChange: (active: boolean) => void): () => void {
  let inView = false;
  let shown = typeof document === 'undefined' ? true : document.visibilityState !== 'hidden';
  let last: boolean | null = null;
  const emit = () => {
    const next = inView && shown;
    if (next !== last) {
      last = next;
      onChange(next);
    }
  };
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) inView = e.isIntersecting;
      emit();
    },
    { rootMargin: '10% 0px' },
  );
  io.observe(el);
  const onVis = () => {
    shown = document.visibilityState !== 'hidden';
    emit();
  };
  document.addEventListener('visibilitychange', onVis);
  return () => {
    io.disconnect();
    document.removeEventListener('visibilitychange', onVis);
  };
}

/** Marks the element with data-at-idle while it is off-screen or the tab is hidden (CSS pauses on it). */
export function useIdleAttribute(ref: RefObject<HTMLElement | null>, enabled: boolean): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const stop = watchActive(el, (active) => {
      if (active) el.removeAttribute('data-at-idle');
      else el.setAttribute('data-at-idle', '');
    });
    return () => {
      stop();
      el.removeAttribute('data-at-idle');
    };
  }, [ref, enabled]);
}
