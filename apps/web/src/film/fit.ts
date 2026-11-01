'use client';
/**
 * Fit for a letter stack on a short phone.
 *
 * On a phone the sign-up pill floats over the bottom of every scene (18px up, 50px tall), and the words of a
 * scene sit at the top. A letter that has something hanging under it (S04's note, S05's player) can be too tall
 * for the space between the two. This measures the real letter, the real words and the real pill zone, and says
 * how small the letter must be, and how far it must move, to sit clear of both. It answers `null` when the
 * normal motion already fits (taller phones, desktop), so those screens are untouched.
 *
 * Everything is measured in layout pixels (offsetHeight and the unscaled boxes), so a running transform never
 * feeds back into the measurement.
 */
import { useLayoutEffect, useState, type RefObject } from 'react';

/** Pill offset from the bottom (18) plus its height (50) plus air. */
const PILL_ZONE = 18 + 50 + 8;
/** Air between the last line of the words and the top of the letter. */
const WORDS_GAP = 10;

export interface LetterFit {
  /** Scale of the letter while the words are up. */
  scale: number;
  /** Vertical move from the centre, in px, while the words are up. */
  y: number;
}

interface Options {
  frame: RefObject<HTMLElement | null>;
  words: RefObject<HTMLElement | null>;
  letter: RefObject<HTMLElement | null>;
  /** Px that hang below the letter's own box (a note, a player), unscaled. */
  hang: (letter: HTMLElement) => number;
  /** The scale the scene uses when everything already fits. */
  maxScale: number;
  /** Re-measure when the viewport changes. */
  w: number;
  h: number;
}

function safeBottom(): number {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;visibility:hidden;padding-bottom:env(safe-area-inset-bottom,0px)';
  document.body.appendChild(probe);
  const px = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
  probe.remove();
  return px;
}

export function useLetterFit({ frame, words, letter, hang, maxScale, w, h }: Options): LetterFit | null {
  const [fit, setFit] = useState<LetterFit | null>(null);

  useLayoutEffect(() => {
    const frameEl = frame.current;
    const wordsEl = words.current;
    const letterEl = letter.current;
    if (!frameEl || !wordsEl || !letterEl) return;

    const measure = () => {
      // The pill is a phone thing (it is gone from 900px).
      if (window.innerWidth >= 900) return setFit((p) => (p === null ? p : null));
      const frameH = frameEl.offsetHeight;
      const wordsBottom = wordsEl.getBoundingClientRect().bottom - frameEl.getBoundingClientRect().top;
      const letterH = letterEl.offsetHeight;
      const below = hang(letterEl);
      if (!frameH || !letterH) return;
      const top = wordsBottom + WORDS_GAP;
      const bottom = frameH - PILL_ZONE - safeBottom();
      const scale = (bottom - top) / (letterH + below);
      if (scale >= maxScale) return setFit((p) => (p === null ? p : null));
      const s = Math.round(scale * 1000) / 1000;
      const y = Math.round(top + (s * letterH) / 2 - frameH / 2);
      setFit((p) => (p && p.scale === s && p.y === y ? p : { scale: s, y }));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(letterEl);
    ro.observe(wordsEl);
    return () => ro.disconnect();
  }, [frame, words, letter, hang, maxScale, w, h]);

  return fit;
}
