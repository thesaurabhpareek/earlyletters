/**
 * The build kind and the internal-tester switch for analytics (ER-A15, BL-1250, FH-10). Owner: analytics engineer.
 *
 * - `build_kind` comes from the build's app environment and nothing else: `APP_ENV` (../build-env.ts) is inlined by
 *   Metro from eas.json `EXPO_PUBLIC_APP_ENV` at bundle time, the same signal billing/alpha.ts uses. `production` (the
 *   App Store app, and only the eas.json production profile sets it; preflight-production.mjs checks that) is `store`;
 *   `preview` (the eas.json preview and testflight profiles) is `preview`; `development` (and an unset value) is
 *   `dev`. `testflight` is not told apart from `preview` here: both profiles carry the same app environment.
 * - The tester switch is one on-device flag in the settings table, `1` when on. No content, no id, never sent
 *   itself: it only sets the event property `is_internal`. In a store build it is never read and can never be
 *   written, whatever storage holds, so nothing can turn it on in a store install. The package also refuses it there
 *   (`isInternalEvent` in packages/analytics never calls the switch for `store`).
 * - Nothing in the app turns it on yet: no screen, setting or link calls `setInternalTester` (no entry point, no parent-facing
 *   words; a developer-only surface is a proposal for later). Erase everything clears it with the other settings.
 */
import type { BuildKind } from '@scribe/analytics';
import { APP_ENV, type AppEnv } from '../build-env';

/** Settings key of the on-device tester flag (proposed DATA_CLASSIFICATION row, BL-1250). */
export const INTERNAL_TESTER_KEY = 'scribe.analytics.internal_tester';

/** `build_kind` for an app environment. Only `production` is `store`. Pure. */
export function buildKindFor(env: AppEnv): BuildKind {
  if (env === 'production') return 'store';
  if (env === 'preview') return 'preview';
  return 'dev';
}

/** This build, decided at bundle time. Not a setting: never read from storage, remote config or a link. */
export const BUILD_KIND: BuildKind = buildKindFor(APP_ENV);

export interface InternalTesterSwitch {
  /** True only in a non-store build whose flag is exactly `1`. A store build never reads storage. */
  isOn(): boolean;
  /** Sets the flag in a non-store build and returns true. A store build writes nothing and returns false. */
  setInternalTester(on: boolean): boolean;
}

/** Synchronous key-value store (the device settings table): the client reads the switch on every event. */
export interface SyncSettings {
  get(key: string): string | null | undefined;
  set(key: string, value: string): void;
  remove(key: string): void;
}

/** The tester switch for a build kind over the settings store. */
export function makeInternalTester(buildKind: BuildKind, storage: SyncSettings): InternalTesterSwitch {
  const store = buildKind === 'store';
  return {
    isOn() {
      if (store) return false;
      try {
        return storage.get(INTERNAL_TESTER_KEY) === '1';
      } catch {
        return false;
      }
    },
    setInternalTester(on) {
      if (store) return false;
      if (on) storage.set(INTERNAL_TESTER_KEY, '1');
      else storage.remove(INTERNAL_TESTER_KEY);
      return true;
    },
  };
}
