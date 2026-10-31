'use client';
/**
 * The film's calm ambient sound and its one button (WCAG 1.4.2: a control to stop it is on the page from the start).
 *
 * "On by default" cannot mean sound on page load: browsers refuse it before a user gesture, and scrolling alone is not
 * a gesture. So the choice is "on" in state (AMBIENT_DEFAULT_ON) and the sound fades in at the first pointerdown,
 * touchend, keydown or click. Until then the button says so ("Tap to start sound") instead of claiming "Sound on".
 * Reduced motion never starts on its own. The tab going hidden pauses it; leaving the page releases it.
 * Mounted from Film only, so /privacy, /terms and the sign-up pages never make a sound.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { site } from '@/content/site';
import { useToneAt } from '@/components/cta/useTone';
import { AmbientEngine, audioSupported } from './ambient-engine';
import {
  ambientParams,
  asTone,
  energyFromSpeed,
  initialWanted,
  readChoice,
  scrollProgress,
  smoothEnergy,
  toggleView,
  writeChoice,
} from './ambient-map';
import styles from './AmbientSound.module.css';

const TICK_MS = 120;
const GESTURES = ['pointerdown', 'touchend', 'keydown', 'click'] as const;
const IGNORED_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Escape']);

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function Icon({ on }: { on: boolean }) {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" />
      {on ? <path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" /> : <path d="M16 9.5l5 5M21 9.5l-5 5" />}
    </svg>
  );
}

export function AmbientSound() {
  const tone = useToneAt('top');
  const [supported, setSupported] = useState(false);
  const [wanted, setWanted] = useState<boolean | null>(null); // null until read on the client
  const [playing, setPlaying] = useState(false);
  const engineRef = useRef<AmbientEngine | null>(null);
  const energyRef = useRef(0);
  const wantedRef = useRef(false);
  wantedRef.current = wanted === true;

  const sync = useCallback(() => setPlaying(Boolean(engineRef.current?.playing)), []);

  const currentParams = useCallback(() => {
    const root = document.documentElement;
    return ambientParams({
      energy: energyRef.current,
      progress: scrollProgress(window.scrollY, root.scrollHeight, window.innerHeight),
      tone: asTone(root.dataset.tone),
    });
  }, []);

  const engine = useCallback(() => (engineRef.current ??= new AmbientEngine(sync)), [sync]);

  /** Must run inside a gesture handler. */
  const begin = useCallback(() => {
    void engine()
      .start(currentParams())
      .then(sync);
  }, [engine, currentParams, sync]);

  // Read the choice once on the client (SSR renders nothing, so there is no mismatch).
  useEffect(() => {
    if (!audioSupported()) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setSupported(true);
    setWanted(initialWanted(readChoice(storage()), mq.matches));
    const onMotion = () => {
      if (mq.matches && wantedRef.current) {
        engineRef.current?.stop();
        setWanted(false);
        setPlaying(false);
      }
    };
    mq.addEventListener('change', onMotion);
    return () => mq.removeEventListener('change', onMotion);
  }, []);

  // The first real gesture starts the sound; the listeners stay until it is truly running (iOS may need touchend, not pointerdown).
  useEffect(() => {
    if (!wanted || playing) return;
    const onGesture = (e: Event) => {
      if (e.target instanceof Element && e.target.closest('[data-ambient-toggle]')) return; // the button decides for itself
      if (e.type === 'keydown' && IGNORED_KEYS.has((e as KeyboardEvent).key)) return;
      begin();
    };
    // Scrolling alone is not a gesture the browser accepts (Chromium's autoplay policy excludes it). But a visitor who
    // has already tapped or typed anywhere on this page has earned the sound, so their next scroll starts it.
    const onScroll = () => {
      if ((navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive) begin();
    };
    for (const type of GESTURES) window.addEventListener(type, onGesture, { capture: true, passive: true });
    window.addEventListener('wheel', onScroll, { capture: true, passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      for (const type of GESTURES) window.removeEventListener(type, onGesture, { capture: true });
      window.removeEventListener('wheel', onScroll, { capture: true });
      window.removeEventListener('scroll', onScroll);
    };
  }, [wanted, playing, begin]);

  // Scroll speed, progress and tone glide the sound; it eases back to calm when the visitor stops.
  useEffect(() => {
    if (!playing) return;
    let lastY = window.scrollY;
    let lastT = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = (now - lastT) / 1000;
      if (dt <= 0) return;
      const y = window.scrollY;
      energyRef.current = smoothEnergy(energyRef.current, energyFromSpeed((y - lastY) / dt), dt);
      lastY = y;
      lastT = now;
      engineRef.current?.update(currentParams());
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [playing, currentParams]);

  // Hidden tab: quiet and hold. Back: wake if it was meant to play. Leaving the page: release.
  useEffect(() => {
    const onVisibility = () => {
      const e = engineRef.current;
      if (!e) return;
      if (document.hidden) e.pause();
      else if (wantedRef.current) void e.resume().then(sync);
    };
    const onHide = () => {
      engineRef.current?.dispose();
      engineRef.current = null;
      setPlaying(false);
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onHide);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [sync]);

  if (!supported || wanted === null) return null;

  const view = toggleView(wanted, playing);
  const label = view === 'on' ? site.sound.on : view === 'blocked' ? site.sound.start : site.sound.off;

  const onToggle = () => {
    if (playing) {
      writeChoice(storage(), false);
      setWanted(false);
      engineRef.current?.stop();
      engineRef.current = null;
      setPlaying(false);
    } else {
      writeChoice(storage(), true);
      setWanted(true);
      begin();
    }
  };

  return (
    <div className={styles.wrap} data-tone={tone}>
      <button type="button" className={styles.button} aria-pressed={playing} data-ambient-toggle data-state={view} onClick={onToggle}>
        <Icon on={view === 'on'} />
        <span className={styles.label}>{label}</span>
      </button>
    </div>
  );
}
