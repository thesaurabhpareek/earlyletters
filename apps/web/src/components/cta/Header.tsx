'use client';
/**
 * The persistent header: wordmark left, the one action right. It reads the tone of the scene beneath
 * it (night, paper, dusk) and keeps AA contrast on each. The wordmark joins once the hero's own
 * wordmark has gone. On phones the action moves to a bottom pill in the thumb zone (CtaPill).
 */
import { site } from '@/content/site';
import { launch } from '@/lib/launch';
import { track } from '@/lib/analytics';
import { Wordmark } from '@/components/brand/Wordmark';
import { AppStoreBadge } from './AppStoreBadge';
import { goToStart } from './goToStart';
import { useInView, useToneAt } from './useTone';
import styles from './Header.module.css';

export function Header() {
  const tone = useToneAt('top');
  const hero = useInView('evening', 0.62);
  const end = useInView('start', 0.5);
  return (
    <header className={styles.header} data-tone={tone} data-hero={hero || undefined}>
      <a href="#evening" className={styles.mark} aria-label={site.brand.name} tabIndex={hero ? -1 : 0}>
        <Wordmark />
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
              goToStart();
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
  const hero = useInView('evening', 0.62);
  const end = useInView('start', 0.3);
  const hidden = hero || end;
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
            goToStart();
          }}
        >
          {site.cta.prelaunch.pill}
        </button>
      )}
    </div>
  );
}

export function SkipLink() {
  return (
    <a
      href="#start"
      className={styles.skip}
      onClick={(e) => {
        e.preventDefault();
        goToStart();
      }}
    >
      {site.skip}
    </a>
  );
}
