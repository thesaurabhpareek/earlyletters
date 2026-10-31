'use client';
/**
 * Two small buttons, down and up, that move the film one part at a time. For people who are stuck, who scroll
 * with a mouse wheel, a keyboard or one thumb, and for anyone who would rather tap than flick.
 *
 * Not side arrows: the film runs top to bottom, so left and right arrows point the wrong way, sit in the strip
 * where iOS and Android take the "back" swipe, and read as a carousel. These sit bottom right, appear once the
 * visitor pauses (never while they scroll, so the film stays clean), and land each part where its words are fully in.
 */
import { useEffect, useRef, useState } from 'react';
import { useLenis } from './SmoothScroll';
import { useResting } from './hooks';
import { useToneAt } from '@/components/cta/useTone';
import { stableHeight } from '@/components/cta/goToStart';
import { site } from '@/content/site';
import { pickTarget } from './scroll-nav-map';
import styles from './ScrollNav.module.css';

const c = site.scrollNav;
const IDLE_MS = 1800;

/** Scroll positions where each part is at rest: its top plus its rest fraction of the pinned range. */
function restTops(): number[] {
  const vh = stableHeight();
  return [...document.querySelectorAll<HTMLElement>('main > section')].map((el) => {
    const rest = Number.parseFloat(getComputedStyle(el).getPropertyValue('--scene-rest')) || 0.5;
    return el.getBoundingClientRect().top + window.scrollY + rest * Math.max(0, el.offsetHeight - vh);
  });
}

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
  const [show, setShow] = useState(false);
  const [canUp, setCanUp] = useState(false);
  const [canDown, setCanDown] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const measure = () => {
      const y = window.scrollY;
      const tops = restTops();
      setCanUp(pickTarget(tops, y, -1) !== null);
      setCanDown(pickTarget(tops, y, 1) !== null);
    };
    const arm = () => {
      setShow(false);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        measure();
        setShow(true);
      }, IDLE_MS);
    };
    arm();
    window.addEventListener('scroll', arm, { passive: true });
    window.addEventListener('resize', arm);
    return () => {
      window.removeEventListener('scroll', arm);
      window.removeEventListener('resize', arm);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function go(dir: 1 | -1) {
    const target = pickTarget(restTops(), window.scrollY, dir);
    if (target === null) return;
    if (resting || !lenis) window.scrollTo({ top: target, behavior: resting ? 'auto' : 'smooth' });
    else lenis.scrollTo(target, { duration: 1.5 });
  }

  // At the end card there is nowhere further to go, and the buttons would sit over the sign-up card on a phone.
  const visible = show && canDown;
  return (
    <div className={styles.nav} data-tone={tone} data-hidden={visible ? undefined : ''} role="group" aria-label="Move through the film">
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
