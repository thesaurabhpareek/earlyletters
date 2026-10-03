'use client';
/** Owner: ACT3. Viewport size for sizing a PhoneFrame (its width prop is a number). Updates on resize only. */
import { useEffect, useState } from 'react';

export function useViewport(fallback = { w: 390, h: 844 }) {
  const [size, setSize] = useState(fallback);
  useEffect(() => {
    let raf = 0;
    const read = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setSize({ w: window.innerWidth, h: window.innerHeight }));
    };
    read();
    window.addEventListener('resize', read);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', read);
    };
  }, []);
  return size;
}
