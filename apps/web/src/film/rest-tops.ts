import { stableHeight } from '@/components/cta/goToStart';

/** Scroll positions where each part of the film is at rest: its top plus its rest fraction of the pinned range. */
export function restTops(): number[] {
  const vh = stableHeight();
  return [...document.querySelectorAll<HTMLElement>('main > section')].map((el) => {
    const rest = Number.parseFloat(getComputedStyle(el).getPropertyValue('--scene-rest')) || 0.5;
    return el.getBoundingClientRect().top + window.scrollY + rest * Math.max(0, el.offsetHeight - vh);
  });
}
