/**
 * A-REQ-028: an invite token that reached the phone survives sign-in and an
 * app kill. At launch (after the 18+ gate), if one is waiting and the person
 * is not already on the invite screen, open it once.
 */
import { router, usePathname, useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';
import { readPendingInvite } from './pending-invite';

export function PendingInviteWatcher() {
  const nav = useRootNavigationState();
  const pathname = usePathname();
  const checked = useRef(false);
  const ready = !!nav?.key;

  useEffect(() => {
    if (checked.current || !ready) return;
    checked.current = true;
    if (pathname.startsWith('/invite')) return;
    void readPendingInvite().then((p) => {
      if (p) router.push('/invite');
    });
  }, [ready, pathname]);

  return null;
}
