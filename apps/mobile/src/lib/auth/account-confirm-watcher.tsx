/**
 * A session restored at launch whose account was never confirmed for this
 * phone (the app was closed on "Is this your account?"): open the consent
 * sheet once, which asks first (security review H1, gap G-01). Until then
 * nothing is claimed or synced, so waiting is always safe.
 */
import { router, usePathname, useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useAuth } from './session-provider';

export function AccountConfirmWatcher() {
  const auth = useAuth();
  const nav = useRootNavigationState();
  const pathname = usePathname();
  const shownFor = useRef<string | null>(null);
  const ready = !!nav?.key;
  const user = auth.state.status === 'ready' || auth.state.status === 'needsConsent' ? auth.state.userId : null;

  useEffect(() => {
    if (!ready || !user || !auth.accountConfirmPending || shownFor.current === user) return;
    if (pathname.startsWith('/sign-in')) return;
    shownFor.current = user;
    router.push('/sign-in/consent');
  }, [ready, user, auth.accountConfirmPending, pathname]);

  return null;
}
