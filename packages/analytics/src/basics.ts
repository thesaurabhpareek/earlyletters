/**
 * The basics (founder rules, 20 Nov 2026): key taps, impressions of the few surfaces we will change, and five
 * timed steps. Three helpers, each taking an id from the registry's closed lists, so an id that is not registered
 * does not compile and, if forced, is dropped by the validator. Names come from registry.ts (`EV`, `PROP`).
 *
 * No SDK autocapture is involved (captureTouches and captureScreens stay false): the app calls these on purpose.
 */
import { msBucket } from './buckets';
import type { Analytics, TrackResult } from './client';
import { CONTROL, EV, PERF_METRIC, PROP, SURFACE } from './registry';
import type { RouteValue } from './routes';

export type ControlId = (typeof CONTROL.values)[number];
export type SurfaceId = (typeof SURFACE.values)[number];
export type PerfMetric = (typeof PERF_METRIC.values)[number];

export interface Basics {
  /** A registered key control was activated. */
  tap(control: ControlId, route: RouteValue): TrackResult;
  /**
   * A registered surface was at least half visible for one second. At most once per surface per foreground
   * session (the dedupe lives in memory only); call `newSession()` when a new foreground session starts.
   */
  impress(surface: SurfaceId, route: RouteValue, rank?: number): TrackResult | 'deduped';
  /** One timed step finished. The time is bucketed here; the number is not sent. */
  perf(metric: PerfMetric, ms: number, ok?: boolean): TrackResult;
  /** Start a timer; the returned function ends it and sends `perf`. Safe to call once. */
  startPerf(metric: PerfMetric): (ok?: boolean) => TrackResult;
  newSession(): void;
}

export function createBasics(analytics: Pick<Analytics, 'track'>, now: () => number = Date.now): Basics {
  let seen = new Set<SurfaceId>();
  const perf = (metric: PerfMetric, ms: number, ok = true): TrackResult =>
    analytics.track(EV.perfMeasured, { [PROP.metric]: metric, [PROP.msBucket]: msBucket(ms), [PROP.ok]: ok });
  return {
    tap: (control, route) => analytics.track(EV.controlTapped, { [PROP.control]: control, [PROP.route]: route }),
    impress(surface, route, rank) {
      if (seen.has(surface)) return 'deduped';
      seen.add(surface);
      const r = rank !== undefined && Number.isInteger(rank) && rank >= 1 && rank <= 9 ? { [PROP.rank]: rank } : {};
      return analytics.track(EV.surfaceImpressed, { [PROP.surface]: surface, [PROP.route]: route, ...r });
    },
    perf,
    startPerf(metric) {
      const t0 = now();
      let done = false;
      return (ok = true) => {
        if (done) return 'dropped_invalid';
        done = true;
        return perf(metric, now() - t0, ok);
      };
    },
    newSession() {
      seen = new Set();
    },
  };
}
