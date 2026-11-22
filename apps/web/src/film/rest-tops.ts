import { stableHeight } from '@/components/cta/goToStart';
import { restTopsFor } from './rest-tops-map';

const REDUCED = '(prefers-reduced-motion: reduce)';
let cache: number[] | null = null;

/** Reads the page. Forces layout (26 to 48 ms after a style invalidation), so nothing calls it per frame. */
export function measureRestTops(): number[] {
  const sy = window.scrollY;
  const boxes = [...document.querySelectorAll<HTMLElement>('main > section')].map((el) => ({
    top: el.getBoundingClientRect().top + sy,
    height: el.offsetHeight,
    rest: Number.parseFloat(getComputedStyle(el).getPropertyValue('--scene-rest')) || 0.5,
  }));
  const tops = restTopsFor(boxes, stableHeight(), window.matchMedia(REDUCED).matches);
  cache = tops;
  return tops;
}

/** The rest positions, from the cache. Costs nothing per call once warm; `watchRestTops` keeps it fresh. */
export function restTops(): number[] {
  return cache ?? measureRestTops();
}

let watchers = 0;
let stop: (() => void) | null = null;

/**
 * Keeps the cache fresh: it is dropped (and re-measured when the browser is idle) on resize, when any part or the page
 * changes size, when web fonts finish loading and when reduced motion is switched. Returns a function that stops
 * watching; the observers are shared by everyone who watches and go away with the last one.
 */
export function watchRestTops(): () => void {
  if (watchers++ === 0) {
    let idle = 0;
    const refresh = () => {
      cache = null;
      window.clearTimeout(idle);
      // Re-measure off the scroll path, so the first read during a scroll is not the one that pays for it.
      idle = window.setTimeout(() => {
        if (cache === null) measureRestTops();
      }, 120);
    };
    const ro = new ResizeObserver(refresh);
    const main = document.querySelector('main');
    if (main) {
      ro.observe(main);
      main.querySelectorAll(':scope > section').forEach((s) => ro.observe(s));
    }
    const mq = window.matchMedia(REDUCED);
    let alive = true;
    window.addEventListener('resize', refresh);
    mq.addEventListener('change', refresh);
    void document.fonts?.ready.then(() => alive && refresh());
    stop = () => {
      alive = false;
      window.clearTimeout(idle);
      ro.disconnect();
      window.removeEventListener('resize', refresh);
      mq.removeEventListener('change', refresh);
      cache = null;
    };
  }
  return () => {
    if (--watchers === 0) {
      stop?.();
      stop = null;
    }
  };
}
