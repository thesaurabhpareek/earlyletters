/**
 * Settings > Account's early-end line (BL-451; BL-479 point 1, CPO-105; EXPERIENCE_PASS S56). The auth provider holds
 * it (`endedEarly` in lib/auth/session-provider.tsx, moved by account-view.logic's `heldEndedEarly` on every state
 * change), so a wait that ends early while Account is closed still shows the line on the next visit. This page only
 * reads it and speaks it.
 *
 * The announce is as before: said once, when the line first shows signed out while this page is open. The provider's
 * `said` count moves at that moment; the count already there when the page opens was said before (or never on an open
 * page), so a later visit reads the line in page order and does not announce it again.
 */
import { useEffect, useRef } from 'react';
import { announce } from '@/lib/a11y';
import type { EndedEarly } from './account-view.logic';

/** Whether the line shows; announces `line` once for each move of `said` seen while the page is open. */
export function useEarlyEndLine(held: EndedEarly, line: string): boolean {
  const saidAtVisit = useRef(held.said);
  useEffect(() => {
    if (held.said === saidAtVisit.current) return;
    saidAtVisit.current = held.said;
    announce(line);
  }, [held.said, line]);
  return held.shown;
}
