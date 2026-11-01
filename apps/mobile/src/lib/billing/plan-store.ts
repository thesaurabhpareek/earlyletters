/**
 * The device's Plus state (ADR 0013). Source of truth: StoreKit 2 on this
 * phone, read through modules/scribe-store. The last good snapshot is cached
 * in device settings so Plus shows at once on launch and offline, and a
 * payer is never locked out by a missing network (C-NFR-004). Nothing here
 * talks to our server.
 *
 * Read with usePlan() (use-plan.ts) or getPlan(). startPlus() starts the
 * listeners; the coordinator wires it in app/_layout.tsx.
 */
import { AppState } from 'react-native';
import { ScribeStore, type NativeEntitlementSnapshot, type StoreViewSupport } from '../../../modules/scribe-store';
import { capabilities } from '../capabilities';
import { getSetting, setSetting } from '../store';
import { PLAN_CACHE_KEY, PLUS_PRODUCT_IDS } from './config';
import { startPlanReminders } from './plan-reminders';
import { EMPTY_PLAN, parsePlanCache, planFromSnapshot, sameEntitlements, sanitizeSnapshot, serializePlanCache, type PlanState } from './plan.logic';

/** Rewrite the cache at least this often even when nothing changed, so its read time stays honest. */
const CACHE_REFRESH_MS = 24 * 60 * 60 * 1000;

let snapshot: NativeEntitlementSnapshot | null = null;
let plan: PlanState = EMPTY_PLAN;
let hydrated = false;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function hydrate(): void {
  if (hydrated) return;
  hydrated = true;
  try {
    snapshot = parsePlanCache(getSetting(PLAN_CACHE_KEY));
    plan = planFromSnapshot(snapshot);
  } catch {
    // No database yet (web preview) or an unreadable value: Free, nothing locked.
  }
}

function emit(): void {
  for (const l of listeners) l();
}

/** The current plan. Stable object between changes (safe for useSyncExternalStore). */
export function getPlan(): PlanState {
  hydrate();
  return plan;
}

export function subscribePlan(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Whether Apple's store view can open here. */
export function storeViewSupport(): StoreViewSupport {
  if (!ScribeStore) return 'unsupported';
  try {
    return ScribeStore.storeViewSupport();
  } catch {
    return 'unsupported';
  }
}

function accept(next: NativeEntitlementSnapshot): void {
  const changed = !sameEntitlements(snapshot, next);
  const stale = !snapshot || Date.parse(next.checkedAt) - Date.parse(snapshot.checkedAt) > CACHE_REFRESH_MS;
  snapshot = next;
  plan = planFromSnapshot(next);
  if (changed || stale) {
    try {
      setSetting(PLAN_CACHE_KEY, serializePlanCache(next));
    } catch {
      // The in-memory plan is still right; the cache catches up next time.
    }
  }
  emit();
}

/** Re-reads StoreKit on this phone. Never throws; on failure the cached plan stays. */
export function refreshPlan(): Promise<void> {
  hydrate();
  if (!ScribeStore) return Promise.resolve();
  if (inflight) return inflight;
  const store = ScribeStore;
  inflight = (async () => {
    try {
      const next = sanitizeSnapshot(await store.currentEntitlements([...PLUS_PRODUCT_IDS]));
      if (next) accept(next);
    } catch {
      // StoreKit unavailable for now: keep the last good plan (fail open for payers).
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

let started = false;

/**
 * Starts Plus: the StoreKit transaction listener, a re-read whenever Apple
 * reports a change or the app comes to the foreground, and a first read now.
 * Call once at boot. Returns a stop function.
 */
export function startPlus(): () => void {
  hydrate();
  if (started) return () => {};
  started = true;
  const store = ScribeStore;
  try {
    store?.startTransactionListener();
  } catch {
    // The module starts it on its own at launch as well.
  }
  const changes = store?.addListener('onEntitlementsChanged', () => {
    void refreshPlan();
  });
  const foreground = AppState.addEventListener('change', (s) => {
    if (s === 'active') void refreshPlan();
  });
  // Plan reminders (G-15, a courtesy): re-planned on every plan change, on foreground and now.
  let stopReminders: () => void = () => {};
  try {
    stopReminders = startPlanReminders({ getPlan, subscribePlan });
  } catch {
    // Notifications unavailable (web preview): the in-app note still works.
  }
  // The D-080 status report (WP-F14-15a): only in a build with the statusReport flag, and
  // loaded lazily so a build without it never evaluates the server contract.
  let stopStatusReport: () => void = () => {};
  let stopped = false;
  if (capabilities.statusReport) {
    void import('./status-report.app')
      .then((m) => {
        if (!stopped) stopStatusReport = m.startStatusReport();
      })
      .catch(() => {
        // Not loadable (web preview): the phone reminders still work.
      });
  }
  void refreshPlan();
  return () => {
    changes?.remove();
    foreground.remove();
    stopReminders();
    stopped = true;
    stopStatusReport();
    started = false;
  };
}
