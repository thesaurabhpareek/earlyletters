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
import { restTops } from './rest-tops';
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

  useEffect(() => {
    const measure = () => {
      lastMeasure.current = performance.now();
      const y = window.scrollY;
      const tops = restTops();
      setCanUp(pickTarget(tops, y, -1) !== null);
      setCanDown(pickTarget(tops, y, 1) !== null);
    };
    const onScroll = () => {
      setBusy(true);
      if (performance.now() - lastMeasure.current > 250) measure();
      if (idle.current) clearTimeout(idle.current);
      idle.current = setTimeout(() => {
        measure();
        setBusy(false);
      }, IDLE_MS);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      if (idle.current) clearTimeout(idle.current);
    };
  }, []);

  function go(dir: 1 | -1) {
    const target = pickTarget(restTops(), window.scrollY, dir);
    if (target === null) return;
    tap('light');
    if (resting || !lenis) window.scrollTo({ top: target, behavior: resting ? 'auto' : 'smooth' });
    else lenis.scrollTo(target, { duration: 1.5 });
  }

  // Always there, so a visitor can always see how to move on. Quieter while they scroll, full once they pause. At the
  // end card there is nowhere further to go, and the buttons would sit over the sign-up card on a phone.
  const visible = canDown;
  return (
    <div className={styles.nav} data-tone={tone} data-busy={busy ? '' : undefined} data-hidden={visible ? undefined : ''} role="group" aria-label="Move through the film">
      {canUp && (
        <button type="button" className={styles.btn} onClick={() => go(-1)} aria-label={c.previous} title={c.previous} tabIndex={visible ? 0 : -1}>
          <Chevron up />
        </button>
      )}
      {canDown && (
        <button type="button" className={styles.btn} data-end="" onClick={() => go(1)} aria-label={c.next} title={c.next} tabIndex={visible ? 0 : -1}>
          <Chevron />
        </button>
      )}
    </div>
  );
}
