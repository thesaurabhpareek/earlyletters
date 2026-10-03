/**
 * Owner: E3 (release). Website analytics, off unless NEXT_PUBLIC_ANALYTICS=vercel.
 *
 * Call `track(...)` from a click handler or an effect; it never throws and does nothing on the server.
 * With the variable unset (the default) it is a no-op, no network request is made and nothing is stored.
 * Also a no-op when the browser sends Do Not Track or Global Privacy Control.
 *
 *   track({ name: 'cta_click', mode: launch.mode, placement: 'header' });
 *   track({ name: 'notify_submit', result: res.ok ? 'ok' : res.error });
 *   track({ name: 'scene_reached', id });   // throttled, see below
 *
 * Mount <WebAnalytics /> (from './WebAnalytics') once in the root layout; it loads Vercel's script.
 * Events use Vercel's documented `window.va('event', { name, data })` queue, so they are safe to send
 * before the script has loaded. Only the values listed in ./events.ts can be sent: no personal data, ever.
 */
import { toWireEvent, type AnalyticsEvent, type SceneId } from './events';
import { scrubEvent } from './scrub';

export type { AnalyticsEvent, CtaMode, CtaPlacement, NotifyOutcome, SceneId } from './events';
export { SCENE_IDS, CTA_PLACEMENTS } from './events';

/** Literal access so Next inlines it at build time. */
export const analyticsEnabled = process.env.NEXT_PUBLIC_ANALYTICS === 'vercel';

/** Minimum gap between two `scene_reached` events. */
export const SCENE_THROTTLE_MS = 1000;

export interface TrackerDeps {
  enabled: boolean;
  /** Hands one validated event to the analytics queue. Must not throw. */
  emit: (name: string, data: Record<string, string>) => void;
  now: () => number;
  setTimer: (run: () => void, ms: number) => unknown;
}

/**
 * Builds a `track` function. Exported so tests can drive it with a fake clock.
 *
 * `scene_reached` rules: each scene is reported at most once per page load, and at most one is reported
 * per SCENE_THROTTLE_MS (first one immediately, then the latest one when the window closes). A visitor who
 * scrolls through the whole film in a second is counted at the first scene and at the furthest one.
 */
export function createTracker(deps: TrackerDeps): (event: AnalyticsEvent) => void {
  const reported = new Set<SceneId>();
  let lastSceneAt = Number.NEGATIVE_INFINITY;
  let pending: SceneId | null = null;
  let timer: unknown = null;

  function sendScene(id: SceneId): void {
    reported.add(id);
    lastSceneAt = deps.now();
    deps.emit('scene_reached', { id });
  }

  return function track(event: AnalyticsEvent): void {
    if (!deps.enabled) return;
    try {
      const wire = toWireEvent(event);
      if (!wire) return;

      if (wire.name !== 'scene_reached') {
        deps.emit(wire.name, wire.data);
        return;
      }

      const id = wire.data.id as SceneId;
      if (reported.has(id)) return;

      const wait = lastSceneAt + SCENE_THROTTLE_MS - deps.now();
      if (wait <= 0 && timer === null) {
        sendScene(id);
        return;
      }
      pending = id; // latest wins
      if (timer === null) {
        timer = deps.setTimer(() => {
          timer = null;
          const next = pending;
          pending = null;
          if (next && !reported.has(next)) sendScene(next);
        }, Math.max(wait, 0));
      }
    } catch {
      // Analytics must never break the page.
    }
  };
}

type VaWindow = {
  va?: (kind: string, payload?: unknown) => void;
  vaq?: unknown[];
  doNotTrack?: string;
  navigator: Navigator & { globalPrivacyControl?: boolean };
};

/** True when the visitor's browser asks not to be tracked (Do Not Track or Global Privacy Control). */
export function privacySignalOn(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as VaWindow;
  return w.navigator.globalPrivacyControl === true || w.navigator.doNotTrack === '1' || w.doNotTrack === '1';
}

function emitToVercel(name: string, data: Record<string, string>): void {
  if (typeof window === 'undefined' || privacySignalOn()) return;
  const w = window as unknown as VaWindow;
  if (!w.va) {
    // The queue stub from Vercel's docs. The script (or <Analytics />) picks the queue up when it loads.
    // Register the URL scrubber first so no queued event can leave with a full query string.
    w.va = (...params: unknown[]) => {
      (w.vaq = w.vaq || []).push(params);
    };
    w.va('beforeSend', scrubEvent);
  }
  w.va('event', { name, data });
}

export const track = createTracker({
  enabled: analyticsEnabled,
  emit: emitToVercel,
  now: () => Date.now(),
  setTimer: (run, ms) => setTimeout(run, ms),
});
