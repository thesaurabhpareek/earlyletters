'use client';
/**
 * Viewport size for components that need a number (PhoneFrame width). Height is the small viewport
 * (100svh, from a fixed probe), so the iOS toolbar collapsing does not move anything. Resize only.
 */
import { useEffect, useState } from 'react';

export function useViewport(fallback = { w: 390, h: 844 }) {
  const [size, setSize] = useState(fallback);
  useEffect(() => {
    const probe = document.getElementById('svh-probe');
    let raf = 0;
    const read = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setSize((p) => {
          const w = window.innerWidth;
          const h = probe?.offsetHeight || window.innerHeight;
          return p.w === w && p.h === h ? p : { w, h };
        }));
    };
    read();
    window.addEventListener('resize', read);
    const ro = probe ? new ResizeObserver(read) : null;
    if (probe) ro?.observe(probe);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', read);
      ro?.disconnect();
    };
  }, []);
  return size;
}
