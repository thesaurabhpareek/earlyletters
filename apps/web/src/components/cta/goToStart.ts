'use client';
import { NOTIFY_INPUT_ID } from './NotifyForm';

/** Jump to the end card and put the cursor in the email field. Smooth unless reduced motion. */
export function goToStart() {
  const start = document.getElementById('start');
  if (!start) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const top = start.getBoundingClientRect().top + window.scrollY + start.offsetHeight - window.innerHeight;
  window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  const focus = () => (document.getElementById(NOTIFY_INPUT_ID) as HTMLInputElement | null)?.focus({ preventScroll: true });
  if (reduce) focus();
  else window.setTimeout(focus, 900);
}
