/**
 * WEB ONLY (design previews, never shipped). expo-sqlite on web runs in a
 * worker, and its sync calls time out if the worker is still loading the
 * wasm. Warm the worker with one async open before the first sync read.
 * In development, or in a preview export built with EXPO_PUBLIC_WEB_PREVIEW=1,
 * `?seed=asha` fills the store with the fictional family.
 */
import * as SQLite from 'expo-sqlite';
import { useEffect, useState } from 'react';

let ready = false;

export function useStoreReady(): boolean {
  const [ok, setOk] = useState(ready);
  useEffect(() => {
    if (ready) return;
    let live = true;
    (async () => {
      const warm = await SQLite.openDatabaseAsync(':memory:');
      await warm.closeAsync();
      const preview = __DEV__ || process.env.EXPO_PUBLIC_WEB_PREVIEW === '1';
      if (preview && new URLSearchParams(window.location.search).get('seed') === 'asha') {
        (await import('./asha-seed')).seedAsha();
      }
      ready = true;
      if (live) setOk(true);
    })();
    return () => {
      live = false;
    };
  }, []);
  return ok;
}
