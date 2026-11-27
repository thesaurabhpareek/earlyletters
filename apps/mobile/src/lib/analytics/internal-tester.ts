/**
 * The build kind and the internal-tester switch (ER-A15, BL-1250; FH-10 ruled in CPrivO-61). Every event the app
 * sends carries `build_kind` and `is_internal` (packages/analytics client.ts adds both after the event's own props).
 *
 * - `build_kind` comes from app.config.ts `extra.buildKind` (src/lib/build-env.ts `buildKindFor`). The production app
 *   env is always `store` here too, whatever `extra` says, so no setting or config can make the App Store build a test
 *   build. A missing or unknown `extra` value falls back to the app env alone.
 * - The switch is one device setting, `scribe.analytics.internal_tester`, holding exactly `true` while on and absent
 *   while off. No text, name or id. A store build never reads it and cannot write it, and Settings shows its row only
 *   in a build that is not a store build and can send usage (CPO and CCO conditions in CPrivO-61). It never syncs,
 *   is not in an export, and goes with the rest of the settings table on Erase everything.
 */
import Constants from 'expo-constants';
import { resolveBuildKind, type BuildKind } from '@scribe/analytics';
import { APP_ENV, buildKindFor, type AppEnv } from '@/lib/build-env';
import { capabilities } from '@/lib/capabilities';
import { deleteSetting, getSetting, setSetting } from '@/lib/store';

export const INTERNAL_TESTER_KEY = 'scribe.analytics.internal_tester';

/** The build kind for an app env and the config's `extra.buildKind`. Pure, so every build's answer is tested. */
export function buildKindOf(appEnv: AppEnv, extraBuildKind: unknown): BuildKind {
  if (appEnv === 'production') return 'store';
  if (extraBuildKind === undefined || extraBuildKind === null) return buildKindFor(appEnv, null);
  const kind = resolveBuildKind(extraBuildKind);
  // An unknown value resolves to dev in the package; here the app env still decides between preview and dev.
  return kind === 'dev' && extraBuildKind !== 'dev' ? buildKindFor(appEnv, null) : kind;
}

/** This build's kind, read once. */
export const BUILD_KIND_NOW: BuildKind = buildKindOf(APP_ENV, (Constants.expoConfig?.extra as { buildKind?: unknown } | undefined)?.buildKind);

/** Whether Settings shows the tester row: never in a store build, and only where usage can be sent. */
export function internalTesterRowShown(kind: BuildKind = BUILD_KIND_NOW, analyticsOn: boolean = capabilities.analytics): boolean {
  return kind !== 'store' && analyticsOn;
}

/** The switch as stored. A store build answers false without reading the setting. */
export function internalTesterOn(kind: BuildKind = BUILD_KIND_NOW): boolean {
  if (kind === 'store') return false;
  return getSetting(INTERNAL_TESTER_KEY) === 'true';
}

/** Turns the switch on or off. Refused, with nothing written, in a store build. Returns whether it was written. */
export function setInternalTester(on: boolean, kind: BuildKind = BUILD_KIND_NOW): boolean {
  if (kind === 'store') return false;
  if (on) setSetting(INTERNAL_TESTER_KEY, 'true');
  else deleteSetting(INTERNAL_TESTER_KEY);
  return true;
}

/** What createAnalytics needs from this file (src/lib/analytics/index.ts). */
export function analyticsBuildOptions(kind: BuildKind = BUILD_KIND_NOW): { buildKind: BuildKind; internalTester: () => boolean } {
  return { buildKind: kind, internalTester: () => internalTesterOn(kind) };
}
