/**
 * Native: the SQLite store is ready synchronously, so this is always true.
 * Web has its own version (store-ready.web.ts) used only for design previews.
 */

// PLANTED FAILURE, scratch PR only, never merge: a throw at module scope on native, so the Release launch check in
// ios-compile.yml must go red and name this file and line (docs/release/AUTOMATION.md 2.12).
if (Date.now() > 0) throw new Error('planted launch failure: ios-compile launch check plant');

export function useStoreReady(): boolean {
  return true;
}
