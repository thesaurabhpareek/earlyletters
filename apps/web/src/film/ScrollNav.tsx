'use client';
/**
 * Two small buttons, down and up, that move the film one part at a time. For people who are stuck, who scroll
 * with a mouse wheel, a keyboard or one thumb, and for anyone who would rather tap than flick.
 *
 * Not side arrows: the film runs top to bottom, so left and right arrows point the wrong way, sit in the strip
 * where iOS and Android take the "back" swipe, and read as a carousel. These are always visible (quieter while the
 * visitor scrolls) and land each part where its words are fully in.
 */
import { useEffect, useRef, useState } from 'react';
import { useLenis } from './SmoothScroll';
import { useResting } from './hooks';
import { useToneAt } from '@/components/cta/useTone';
import { measureRestTops, restTops, watchRestTops } from './rest-tops';
import { JUMP_MS, jumpGuard } from './jump-guard';
import { NOTIFY_INPUT_ID } from '@/components/cta/NotifyForm';
import { tap } from '@/lib/haptics';
import { site } from '@/content/site';
import { pickTarget } from './scroll-nav-map';
import styles from './ScrollNav.module.css';

const c = site.scrollNav;
const IDLE_MS = 1800;

function Chevron({ up }: { up?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path d={up ? 'M6 14.5l6-6 6 6' : 'M6 9.5l6 6 6-6'} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ScrollNav() {
  const resting = useResting();
  const lenis = useLenis();
  const tone = useToneAt('bottom');
  const [busy, setBusy] = useState(false);
  const [canUp, setCanUp] = useState(false);
  const [canDown, setCanDown] = useState(true);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMeasure = useRef(0);
  const nextRef = useRef<HTMLButtonElement>(null);
  // Set when a keyboard press of Next is about to land on the last part, where Next goes away.
  const keepFocus = useRef(false);

  useEffect(() => {
    const unwatch = watchRestTops();
    const measure = () => {
      lastMeasure.current = performance.now();
      const y = window.scrollY;
      const tops = restTops();
      setCanUp(pickTarget(tops, y, -1) !== null);
      setCanDown(pickTarget(tops, y, 1) !== null);
    };
    const onScroll = () => {
      setBusy(true);
      if (performance.now() - lastMeasure.current> 250) measure();
      if (idle.current) clearTimeout(idle.current);
      idle.current = setTimeout(() => {
        measure();
        setBusy(false);
      }, IDLE_MS);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    // A jump ends with scrollend: settle the buttons then, not up to IDLE_MS later.
    window.addEventListener('scrollend', measure);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scrollend', measure);
      if (idle.current) clearTimeout(idle.current);
      unwatch();
    };
  }, []);

  // At the last part the buttons go away. A keyboard user who pressed Next to get here would be left on nothing, so
  // focus follows them to what the last part is for: the sign-up field (or its first control).
  useEffect(() => {
    if (canDown || !keepFocus.current) return;
    keepFocus.current = false;
    const end = document.getElementById('start');
    const target = document.getElementById(NOTIFY_INPUT_ID) ?? end?.querySelector<HTMLElement>('a[href], button, input');
    target?.focus({ preventScroll: true });
  }, [canDown]);

  function go(dir: 1 | -1) {
    // Measured fresh, not from the cache, so the target is exact whatever changed since the last read.
    const target = pickTarget(measureRestTops(), window.scrollY, dir);
    if (target === null) return;
    const next = nextRef.current;
    keepFocus.current = dir === 1 && !!next && document.activeElement === next && next.matches(':focus-visible');
    tap('light');
    jumpGuard.mark();
    // The hand-off only belongs to this jump; a later scroll to the end by other means must not steal focus.
    if (keepFocus.current) window.setTimeout(() => (keepFocus.current = false), JUMP_MS + 600);
    if (resting || !lenis) window.scrollTo({ top: target, behavior: resting ? 'auto' : 'smooth' });
    else lenis.scrollTo(target, { duration: 1.5 });
  }

  // Always there, so a visitor can always see how to move on. Quieter while they scroll, full once they pause. At the
  // end card there is nowhere further to go, and the buttons would sit over the sign-up card on a phone.
  const hidden = !canDown;
  return (
    <div
      className={styles.nav}
      data-tone={tone}
      data-busy={busy ? '' : undefined}
      data-hidden={hidden ? '' : undefined}
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
      role="group"
      aria-label="Move through the film"
   >
      {/* Both always in the page, so the group never changes size (a button mounting moved the other one). One that has nowhere to go is switched off, not removed. */}
      <button type="button" className={styles.btn} data-off={canUp ? undefined : ''} inert={canUp ? undefined : true} onClick={() => go(-1)} aria-label={c.previous} title={c.previous}>
        <Chevron up />
      </button>
      <button ref={nextRef} type="button" className={styles.btn} data-end="" onClick={() => go(1)} aria-label={c.next} title={c.next}>
        <Chevron />
      </button>
    </div>
  );
}
