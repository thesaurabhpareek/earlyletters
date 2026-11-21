'use client';
/**
 * The scene tone under a band of the viewport (top: header, bottom: the phone pill), and whether a
 * scene is on screen, from cached section geometry: no hit testing or layout reads per scroll frame.
 * A scene's tone can change mid-scene (Scene writes data-tone at its tone stops); that is read from
 * the attribute, which costs nothing.
 */
import { useEffect, useState } from 'react';

export type Tone = 'night' | 'paper' | 'dusk';

type Geo = { el: HTMLElement; id: string; top: number; bottom: number };
let geo: Geo[] = [];
const listeners = new Set<() => void>();
let started = false;

function measure() {
  const sy = window.scrollY;
  geo = Array.from(document.querySelectorAll<HTMLElement>('main > section[data-tone]')).map((el) => {
    const top = el.getBoundingClientRect().top + sy;
    return { el, id: el.id, top, bottom: top + el.offsetHeight };
  });
  listeners.forEach((l) => l());
}

function start() {
  if (started) return;
  started = true;
  measure();
  window.addEventListener('scroll', () => listeners.forEach((l) => l()), { passive: true });
  window.addEventListener('resize', measure);
  new ResizeObserver(measure).observe(document.body);
}

/** The live (pinned or passed) scene covering viewport offset y: the last one whose top is above the fold. */
function sceneAt(offset: number): Geo | undefined {
  const sy = window.scrollY;
  let pick: Geo | undefined;
  for (const g of geo) if (g.top <= sy + 0.5) pick = g;
  return pick && sy + offset < pick.bottom ? pick : undefined;
}

export function useToneAt(band: 'top' | 'middle' | 'bottom'): Tone {
  const [tone, setTone] = useState<Tone>('night');
  useEffect(() => {
    start();
    const read = () => {
      const off = band === 'top' ? 32 : band === 'middle' ? window.innerHeight / 2 : window.innerHeight - 40;
      const g = sceneAt(off);
      setTone(((g?.el.dataset.uiTone ?? g?.el.dataset.tone) as Tone | undefined) ?? 'night');
    };
    listeners.add(read);
    read();
    return () => {
      listeners.delete(read);
    };
  }, [band]);
  return tone;
}

/**
 * True while the scene's progress is within [from, to]. Progress is 0 when the scene pins and 1 when it
 * ends; it is negative before the scene and above 1 after it (in units of its pinned range).
 */
export function useSceneActive(id: string, from = 0, to = 1): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    start();
    const read = () => {
      const g = geo.find((x) => x.id === id);
      if (!g) return setOn(false);
      const range = Math.max(1, g.bottom - g.top - window.innerHeight);
      const p = (window.scrollY - g.top) / range;
      setOn(p >= from && p <= to);
    };
    listeners.add(read);
    read();
    return () => {
      listeners.delete(read);
    };
  }, [id, from, to]);
  return on;
}
