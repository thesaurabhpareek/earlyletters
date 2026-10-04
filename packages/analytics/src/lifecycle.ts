/**
 * App lifecycle events and the session definition shared with the ask
 * sequencer: a session starts at a cold start or when the app returns after
 * 30 minutes or more away (TDD 01 3.11.3, TRACKING_PLAN `app_opened`).
 *
 * Keeps two L2 times in device settings, as ordinary app state that is never
 * sent raw: the first launch (for `analytics_opted_in` summary buckets,
 * TRACKING_PLAN 8.2) and the last time the app was active (for the
 * `days_since_last_open` bucket). They are written whatever the consent,
 * because they are local only; they leave the phone only as buckets, after a
 * yes. Pure and tested; the app feeds it AppState changes.
 */
import { daysBucket, sessionBucket, ttfiBucket } from './buckets';
import type { Analytics } from './client';
import type { KeyValueStorage } from './consent';

export const SESSION_GAP_MS = 30 * 60 * 1000;

export const LIFECYCLE_KEYS = {
  firstLaunchAt: 'scribe.analytics.first_launch_at',
  lastActiveAt: 'scribe.analytics.last_active_at',
} as const;

export interface LifecycleOptions {
  analytics: Pick<Analytics, 'track' | 'flush'>;
  storage: KeyValueStorage;
  now?: () => number;
}

export interface Session {
  /** ms epoch when this session started. */
  startedAt: number;
  /** 1 for the session that began at launch, then 2, 3 and so on in this process. */
  index: number;
}

export interface Lifecycle {
  /** Once per process, after the first frame. */
  launch(i?: { ttfiMs?: number; source?: 'cold' | 'notification' | 'link' }): Promise<void>;
  /** App became active. Returns true when this starts a new session. */
  foreground(source?: 'warm' | 'notification' | 'link'): Promise<boolean>;
  /** App went to the background: sends the session bucket and flushes. */
  background(): Promise<void>;
  session(): Session;
  firstLaunchAt(): number | null;
}

const parseTime = (v: string | null | undefined): number | null => {
  const t = v ? Number(v) : NaN;
  return Number.isFinite(t) && t > 0 ? t : null;
};

export function createLifecycle(opts: LifecycleOptions): Lifecycle {
  const now = opts.now ?? Date.now;
  const { analytics, storage } = opts;
  let session: Session = { startedAt: now(), index: 0 };
  let lastActive: number | null = null;
  let firstLaunch: number | null = null;
  let backgroundedAt: number | null = null;

  return {
    async launch(i = {}) {
      const t = now();
      firstLaunch = parseTime(await storage.get(LIFECYCLE_KEYS.firstLaunchAt));
      if (firstLaunch === null) {
        firstLaunch = t;
        await storage.set(LIFECYCLE_KEYS.firstLaunchAt, String(t));
      }
      lastActive = parseTime(await storage.get(LIFECYCLE_KEYS.lastActiveAt));
      session = { startedAt: t, index: 1 };
      if (i.ttfiMs !== undefined) analytics.track('app_cold_start', { ttfi_bucket: ttfiBucket(i.ttfiMs) });
      analytics.track('app_opened', {
        source: i.source ?? 'cold',
        days_since_last_open: lastActive === null ? 'd0' : daysBucket(t - lastActive),
      });
      lastActive = t;
    },

    async foreground(source = 'warm') {
      const t = now();
      const awaySince = backgroundedAt ?? lastActive;
      backgroundedAt = null;
      const fresh = awaySince === null || t - awaySince >= SESSION_GAP_MS;
      if (fresh) {
        session = { startedAt: t, index: session.index + 1 };
        analytics.track('app_opened', {
          source,
          days_since_last_open: lastActive === null ? 'd0' : daysBucket(t - lastActive),
        });
      }
      lastActive = t;
      return fresh;
    },

    async background() {
      const t = now();
      backgroundedAt = t;
      lastActive = t;
      analytics.track('app_backgrounded', { session_bucket: sessionBucket(t - session.startedAt) });
      await storage.set(LIFECYCLE_KEYS.lastActiveAt, String(t));
      await analytics.flush();
    },

    session: () => ({ ...session }),
    firstLaunchAt: () => firstLaunch,
  };
}
