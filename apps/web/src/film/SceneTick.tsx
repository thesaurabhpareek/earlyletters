'use client';
/**
 * A very light tick each time the visitor arrives at a part of the film, where its words are fully in. Android
 * browsers can give it (the Vibration API, after the visitor's first tap); iPhone Safari has no web haptics, so there
 * it is silent and the visuals carry the feel. Never while reduced motion is on (lib/haptics checks that).
 * Quiet after the Next and Previous buttons: they tap on press, so the arrival would be a second buzz for one action.
 */
import { useEffect } from 'react';
import { tap } from '@/lib/haptics';
import { restTops, watchRestTops } from './rest-tops';
import { jumpGuard } from './jump-guard';
import { stableHeight } from '@/components/cta/goToStart';

const BAND = 0.1; // within a tenth of a screen of a part's rest position counts as arriving

export function SceneTick() {
  useEffect(() => {
    const unwatch = watchRestTops();
    let current = -1;
    let frame = 0;
    const check = () => {
      frame = 0;
      const y = window.scrollY;
      const reach = stableHeight() * BAND;
      const at = restTops().findIndex((t) => Math.abs(y - t) < reach);
      if (at !== -1 && at !== current) {
        current = at;
        // Still note the arrival while a button jump is under way, just do not tick for it.
        if (!jumpGuard.active()) tap('light');
      } else if (at === -1) current = -1;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
      unwatch();
    };
  }, []);
  return null;
}
