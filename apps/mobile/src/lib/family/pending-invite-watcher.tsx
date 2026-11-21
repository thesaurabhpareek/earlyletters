/**
 * A-REQ-028: an invite token that reached the phone survives sign-in and an
 * app kill. At launch (after the 18+ gate), if one is waiting and the person
 * is not already on the invite screen, open it once. Only where this build has the join flow (the one rule,
 * lib/family/entry.logic.ts inviteDestination 'invite_link'): without it nothing is pushed and any saved token is
 * dropped, so a leftover token can never open a screen that sends the person Home.
 */
import { router, usePathname, useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';
import { authUserId } from '../auth/machine.logic';
import { getAuthSnapshot, subscribeAuth } from '../auth/auth-store';
import { PLUS_ALPHA } from '../billing/alpha';
import { serverFeaturesEnabled } from '../capabilities';
import { inviteDestination } from './entry.logic';
import { clearPendingInvite, clearReadPendingInvite, readPendingInvite } from './pending-invite';

export function PendingInviteWatcher() {
  const nav = useRootNavigationState();
  const pathname = usePathname();
  const checked = useRef(false);
  const ready = !!nav?.key;

  useEffect(() => {
    if (checked.current || !ready) return;
    checked.current = true;
    // No join flow in this build (servers off, or a store build): push nothing, keep nothing. A link keeps no token
    // there (planIncomingLink), so this only ever drops one that is left over.
    if (inviteDestination('invite_link', serverFeaturesEnabled(), PLUS_ALPHA) !== 'flow') {
      void clearPendingInvite();
      return;
    }
    // CISO-2: whether a session exists is only known once it is no longer restoring. Reading earlier could
    // drop (or mark) a token for the wrong reason, so wait for the settled state.
    const open = () => {
      const userId = authUserId(getAuthSnapshot());
      if (!userId) void clearReadPendingInvite(); // a token a past session read does not outlive it
      if (pathname.startsWith('/invite')) return;
      void readPendingInvite(Date.now(), userId).then((p) => {
        if (p) router.push('/invite');
      });
    };
    if (getAuthSnapshot().status !== 'restoring') return open();
    const stop = subscribeAuth((s) => {
      if (s.status === 'restoring') return;
      stop();
      open();
    });
  }, [ready, pathname]);

  return null;
}
