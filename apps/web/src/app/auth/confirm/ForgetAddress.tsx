'use client';
/**
 * Owner: S20 (web). Takes the sign-in link out of the address bar once the page has loaded (defense in depth).
 * The page needs nothing from the address: no script here reads the token, and the Open button carries none. So
 * after load the entry becomes the bare path (history.replaceState, no request), and `#token_hash=...` stays out of
 * this tab's history and any history the browser syncs. The words and the Open button do not change.
 */
import { useEffect } from 'react';

export function ForgetAddress() {
  useEffect(() => {
    const { pathname, search, hash } = window.location;
    if (search || hash) window.history.replaceState(null, '', pathname);
  }, []);
  return null;
}
