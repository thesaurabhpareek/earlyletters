/**
 * WEB ONLY (design previews, never shipped). expo-sqlite on web runs in a
 * worker, and its sync calls time out if the worker is still loading the
 * wasm. Warm the worker with one async open before the first sync read.
 * In development, or in a preview export built with EXPO_PUBLIC_WEB_PREVIEW=1,
 * `?seed=asha` fills the store with the fictional family; `?seed=asha-waiting`
 * does the same with a recording waiting for its words.
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
      const seed = new URLSearchParams(window.location.search).get('seed');
      if (preview && (seed === 'asha' || seed === 'asha-waiting')) {
        (await import('./asha-seed')).seedAsha({ waiting: seed === 'asha-waiting' });
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
