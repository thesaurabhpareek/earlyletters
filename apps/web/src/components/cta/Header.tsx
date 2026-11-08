'use client';
/**
 * The persistent header: the brand lockup left (the approved mark, in the header's ink colour), the one action
 * right. It reads the tone of the scene beneath it (night, paper, dusk) and keeps AA contrast on each. The lockup
 * joins once the hero's own wordmark has gone. On phones the action moves to a bottom pill in the thumb zone (CtaPill).
 */
import { site } from '@/content/site';
import { launch } from '@/lib/launch';
import { track } from '@/lib/analytics';
import { Lockup } from '@/components/brand/Lockup';
import { useLenis } from '@/film/SmoothScroll';
import { useViewport } from '@/film/hooks';
import { AppStoreBadge } from './AppStoreBadge';
import { goToStart } from './goToStart';
import { useSceneActive, useToneAt } from './useTone';
import styles from './Header.module.css';

export function Header() {
  const tone = useToneAt('top');
  const hero = useSceneActive('evening', -Infinity, 0.13);
  const end = useSceneActive('start', -0.4, Infinity);
  const lenis = useLenis();
  return (
    <header className={styles.header} data-tone={tone} data-hero={hero || undefined}>
      <a href="#evening" className={styles.mark} aria-label={site.brand.name} tabIndex={hero ? -1 : 0}>
        <Lockup />
      </a>
      <div className={styles.action} data-hidden={end || undefined}>
        {launch.mode === 'live' ? (
          <AppStoreBadge placement="header" height={40} />
        ) : (
          <button
            type="button"
            className={styles.pill}
            onClick={() => {
              track({ name: 'cta_click', mode: 'prelaunch', placement: 'header' });
              goToStart(lenis);
            }}
          >
            {site.cta.prelaunch.button}
          </button>
        )}
      </div>
    </header>
  );
}

export function CtaPill() {
  const tone = useToneAt('bottom');
  const end = useSceneActive('start', -0.6, Infinity);
  // The playing letter in S07 sits low on phones; the pill steps aside while it plays. On a short phone the player
  // bar is still fading (S07's phone is gone at 0.97) when the pill would return at 0.92, and the two overlap, so
  // there the pill waits for the phone to finish fading.
  const { h } = useViewport();
  const peak = useSceneActive('years-later', 0.4, h < 760 ? 0.97 : 0.92);
  const lenis = useLenis();
  // Shown from the very first screen on phones: a parent who stops at the top still has one thing to do.
  const hidden = end || peak;
  return (
    <div className={styles.pillBar} data-tone={tone} data-hidden={hidden || undefined} aria-hidden={hidden || undefined}>
      {launch.mode === 'live' ? (
        <AppStoreBadge placement="pill" height={48} />
      ) : (
        <button
          type="button"
          className={styles.pill}
          tabIndex={hidden ? -1 : 0}
          onClick={() => {
            track({ name: 'cta_click', mode: 'prelaunch', placement: 'pill' });
            goToStart(lenis);
          }}
        >
          {site.cta.prelaunch.pill}
        </button>
      )}
    </div>
  );
}

export function SkipLink() {
  const lenis = useLenis();
  return (
    <a
      href="#start"
      className={styles.skip}
      onClick={(e) => {
        e.preventDefault();
        goToStart(lenis);
      }}
    >
      {site.skip}
    </a>
  );
}
