'use client';
/**
 * The change between pages: a warm gradient wash that clears like a curtain while the new page rises into place.
 * It plays only when the visitor moves from one page of the site to another (the first load has its own entrance),
 * never blocks a click (pointer-events none, aria-hidden), and is switched off by reduced motion. Used by
 * app/template.tsx, which React re-mounts on every navigation. Animates opacity, transform and a gradient position
 * only.
 */
import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import styles from './PageTransition.module.css';

/** True once any page has mounted in this tab, so the next mount is a navigation and not the first load. */
let visited = false;

export function PageTransition({ children }: { children: ReactNode }) {
  const [navigated, setNavigated] = useState(false);
  const [veil, setVeil] = useState(false);

  useLayoutEffect(() => {
    if (visited && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setNavigated(true);
      setVeil(true);
    }
    visited = true;
  }, []);

  useEffect(() => {
    if (!veil) return;
    const done = window.setTimeout(() => setVeil(false), 1000);
    return () => window.clearTimeout(done);
  }, [veil]);

  return (
    <>
      <div className={navigated ? styles.enter : undefined}>{children}</div>
      {veil ? <div className={styles.veil} aria-hidden="true" /> : null}
    </>
  );
}
