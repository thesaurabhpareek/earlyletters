/**
 * Native: the SQLite store is ready synchronously, so this is always true.
 * Web has its own version (store-ready.web.ts) used only for design previews.
 */
export function useStoreReady(): boolean {
  return true;
}
