'use client';
/**
 * Owner: S20 (web). Takes the sign-in link out of the address bar once the page has loaded (defense in depth).
 * The page needs nothing from the address: no script here reads the token, and the Open button carries none. So
 * after load the entry becomes the bare path (history.replaceState, no request), and from then on the tab's history
 * entry no longer holds `#token_hash=...`. The browser may already have recorded the visit with it before this
 * runs, so this narrows where the token sits; it does not promise it was never stored. The words and the Open
 * button do not change. The entry keeps its history state (Next's router data), so Back and Forward still show
 * this page.
 */
import { useEffect } from 'react';

export function ForgetAddress() {
  useEffect(() => {
    const { pathname, search, hash } = window.location;
    if (search || hash) window.history.replaceState(window.history.state, '', pathname);
  }, []);
  return null;
}
