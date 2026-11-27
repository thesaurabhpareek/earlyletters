/**
 * WEB ONLY (design previews, never shipped). expo-sqlite on web runs in a
 * worker, and its sync calls time out if the worker is still loading the
 * wasm. Warm the worker with one async open before the first sync read.
 * In development, or in a preview export built with EXPO_PUBLIC_WEB_PREVIEW=1,
 * `?seed=asha` fills the store with the fictional family; `?seed=asha-waiting`
 * does the same with a recording waiting for its words, and `?seed=asha-quiet`
 * with a kept recording in which nobody spoke, `?seed=asha-marks`
 * with two quiet-day marks as older builds saved them, `?seed=asha-plus` with Plus on
 * (the same family, so Keep is not gated), and `?seed=asha-hidden` with a second book, Avi's,
 * hidden on this phone (Settings, Hidden books). For the journey's missing screens (BL-410): `?seed=asha-unborn`, Asha not
 * born yet (a due date, nothing written), `?seed=asha-drafts` with a second draft waiting on Review, and `?seed=asha-long`
 * with enough letters that the Book scrolls a long way.
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
      if (preview && (seed === 'asha' || seed === 'asha-waiting' || seed === 'asha-quiet' || seed === 'asha-marks' || seed === 'asha-plus' || seed === 'asha-hidden' || seed === 'asha-unborn' || seed === 'asha-drafts' || seed === 'asha-long')) {
        (await import('./asha-seed')).seedAsha({
          waiting: seed === 'asha-waiting',
          quiet: seed === 'asha-quiet',
          marks: seed === 'asha-marks',
          plus: seed === 'asha-plus',
          hidden: seed === 'asha-hidden',
          unborn: seed === 'asha-unborn',
          drafts: seed === 'asha-drafts',
          long: seed === 'asha-long',
        });
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
