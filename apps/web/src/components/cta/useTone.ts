'use client';
/**
 * Which scene tone is under a horizontal band of the viewport (top: header, bottom: the phone pill),
 * and whether the hero or the end card is on screen, so the persistent action can adapt.
 */
import { useEffect, useState } from 'react';

export type Tone = 'night' | 'paper' | 'dusk';

export function useToneAt(band: 'top' | 'bottom'): Tone {
  const [tone, setTone] = useState<Tone>('night');
  useEffect(() => {
    const read = () => {
      const y = band === 'top' ? 32 : window.innerHeight - 40;
      // The topmost live scene stage at that height (hidden, arriving stages are skipped).
      const stage = document
        .elementsFromPoint(window.innerWidth / 2, y)
        .find((n) => n instanceof HTMLElement && n.dataset.live === 'true') as HTMLElement | undefined;
      const t = stage?.parentElement?.dataset.tone as Tone | undefined;
      setTone(t ?? 'night');
    };
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [band]);
  return tone;
}

/** True while the element with this id covers at least `ratio` of the viewport. */
export function useInView(id: string, ratio = 0.35): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.intersectionRatio > 0 && e.intersectionRect.height >= window.innerHeight * ratio), {
      threshold: Array.from({ length: 21 }, (_, i) => i / 20),
    });
    io.observe(el);
    return () => io.disconnect();
  }, [id, ratio]);
  return inView;
}
