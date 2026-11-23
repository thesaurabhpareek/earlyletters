/**
 * The library days switch and its remote pause (NS-46-R33, NS-46-R42, BL-1008). Pure: no React Native, no network module.
 *
 * - Build switch: `EXPO_PUBLIC_DAYS=on`. Anything else, or nothing, is off.
 * - Pause: `killSwitches.libraryDays` in the signed config already on the phone. It is read as `!== true`, outside
 *   `mayRun` (NS-46-R28): only the boolean `true` pauses, a config signed before the key existed lacks it and reads as
 *   not paused (E21), and a config that cannot be read is not paused either. A pause hides and stops library notes; it
 *   never turns anything on, and it never touches typed days, letters, the export or Erase everything.
 * - The reader is injected (same shape as `lib/find/pause.ts`), so this module loads nothing at boot.
 */
export const parseDaysFlag = (raw: string | undefined | null): boolean => (raw ?? '').trim().toLowerCase() === 'on';

/** Inlined at bundle time: Expo only inlines `process.env.EXPO_PUBLIC_*` written out in full. */
const DAYS_BUILD_VALUE: boolean = parseDaysFlag(process.env.EXPO_PUBLIC_DAYS);
let buildOverride: boolean | null = null;

/** Tests only. */
export function setDaysBuildForTest(value: boolean | null): void {
  buildOverride = value;
}

export const daysBuildEnabled = (): boolean => buildOverride ?? DAYS_BUILD_VALUE;

type KillSwitchesLike = { killSwitches?: Readonly<Record<string, unknown>> | null } | null | undefined;

/** The signed config on the phone, and a way to hear that it changed (lib/remote fits it, see `remoteConfigReader`). */
export interface RemoteConfigReader {
  get(): KillSwitchesLike;
  subscribe(listener: () => void): () => void;
}

/** True only when the config says `libraryDays: true`. Absent key, absent config and any other value are not paused. */
export const libraryDaysPaused = (config: KillSwitchesLike): boolean => config?.killSwitches?.libraryDays === true;

/** A throw while reading counts as not paused: the build switch alone turns library days on, a pause only hides. */
export function libraryDaysPausedNow(reader: RemoteConfigReader | null): boolean {
  if (!reader) return false;
  try {
    return libraryDaysPaused(reader.get());
  } catch {
    return false;
  }
}

/** Library notes may be planned: build switch on and no pause. */
export const libraryDaysAllowed = (reader: RemoteConfigReader | null, build: boolean = daysBuildEnabled()): boolean =>
  build && !libraryDaysPausedNow(reader);

/** Drops library notes from a plan when they may not run. Typed days, birthdays, months and evenings are never touched. */
export function withoutLibraryNotes<T extends { kind: string }>(plan: readonly T[], allowed: boolean): T[] {
  return allowed ? [...plan] : plan.filter((n) => n.kind !== 'libraryDay');
}

/**
 * Calls `onChange` when the pause flips (not on every config refresh). Returns the unsubscribe.
 * A reader whose `subscribe` throws gives no updates; the next foreground re-plan still reads the config.
 */
export function watchLibraryDaysPause(reader: RemoteConfigReader | null, onChange: () => void): () => void {
  if (!reader) return () => {};
  let last = libraryDaysPausedNow(reader);
  try {
    return reader.subscribe(() => {
      const now = libraryDaysPausedNow(reader);
      if (now === last) return;
      last = now;
      onChange();
    });
  } catch {
    return () => {};
  }
}

/** The default reader, over lib/remote, loaded late and only when the build switch is on (nothing extra at boot). */
export function remoteConfigReader(
  load: () => { getRemoteConfig(): KillSwitchesLike; subscribeRemoteConfig(fn: () => void): () => void } = () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../remote') as never,
): RemoteConfigReader {
  return { get: () => load().getRemoteConfig(), subscribe: (fn) => load().subscribeRemoteConfig(fn) };
}
