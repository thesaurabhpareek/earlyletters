'use client';
import { NOTIFY_INPUT_ID } from './NotifyForm';

type LenisLike = { scrollTo: (target: number, opts?: { duration?: number; onComplete?: () => void; immediate?: boolean }) => void } | null | undefined;

/** Where the end card rests: the bottom of #start's pinned range (its form fully shown). */
export function startTop(): number | null {
  const start = document.getElementById('start');
  if (!start) return null;
  return start.getBoundingClientRect().top + window.scrollY + start.offsetHeight - stableHeight();
}

/** The small viewport height (100svh), which does not change when the iOS toolbar collapses. */
export function stableHeight(): number {
  const probe = document.getElementById('svh-probe');
  return probe?.offsetHeight || window.innerHeight;
}

/**
 * Jump to the end card and put the cursor in the email field once the scroll has landed and the
 * stage is live (focus on a hidden stage is a silent no-op). Smooth unless reduced motion.
 */
export function goToStart(lenis?: LenisLike) {
  const top = startTop();
  if (top === null) return;
  const focusInput = () => (document.getElementById(NOTIFY_INPUT_ID) as HTMLInputElement | null)?.focus({ preventScroll: true });
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    window.scrollTo({ top, behavior: 'auto' });
    requestAnimationFrame(focusInput);
    return;
  }
  if (lenis) {
    lenis.scrollTo(top, { duration: 2.2, onComplete: () => requestAnimationFrame(focusInput) });
    return;
  }
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    window.clearTimeout(timer);
    window.removeEventListener('scrollend', finish);
    requestAnimationFrame(focusInput);
  };
  window.addEventListener('scrollend', finish, { once: true });
  const timer = window.setTimeout(finish, 2400);
  window.scrollTo({ top, behavior: 'smooth' });
}
