/**
 * FP-6 (NS-41-R25, O-19): `killSwitches.signIn` from the cached signed remote config. Hide-only and fail-open: a config that
 * cannot be read means "not paused", never "paused" (a stale or missing config must not lock sign-in out). Sync, no network.
 *
 * The remote module imports react-native, so it is loaded lazily here (the way family/invites-switch.ts does it) and logic
 * modules that import this file stay loadable in Node tests. Metro resolves the inline require when it bundles the app.
 */
export interface RemoteSignInReader {
  getRemoteConfig(): { killSwitches: { signIn?: boolean } };
}

export function signInPaused(load: () => RemoteSignInReader = () => require('../remote') as RemoteSignInReader): boolean {
  try {
    return load().getRemoteConfig().killSwitches.signIn === true;
  } catch {
    return false;
  }
}
