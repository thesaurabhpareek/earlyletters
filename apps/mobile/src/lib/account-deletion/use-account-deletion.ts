/**
 * useAccountDeletion(): state and actions for Settings > Delete account.
 * Wires the pure parts (logic.ts, api.ts) to the app's auth session, local
 * store, analytics and Plus state. Network only on the screen, never at launch.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { analytics, analyticsIdsForDeletion, forgetAnalyticsIds, withdrawAnalytics } from '@/lib/analytics';
import { useAuth } from '@/lib/auth/session-provider';
import { usePlan } from '@/lib/billing';
import { currentUserId, deleteSetting, getSetting, listEntriesForChild, setSetting, uuidv7 } from '@/lib/store';
import {
  cancelDeletion, forgetAnalytics, loadBooks, loadStatus, requestDeletion, retryForget,
  type AnalyticsIds, type DeletionClient, type FlagStore,
} from './api';
import { bookImpacts, impactLines, showSubscriptionNotice, type ServerStatus, type SyncBook } from './logic';

const flags: FlagStore = { get: getSetting, set: setSetting, remove: deleteSetting };
const ids: AnalyticsIds = { ids: analyticsIdsForDeletion, forget: forgetAnalyticsIds };

/** The current person's letters in a book on this phone (local-only letters are theirs too). */
function myLetterCount(childId: string): number {
  const me = currentUserId();
  try {
    return listEntriesForChild(childId).filter((e) => e.kind !== 'not_much' && (!e.authorId || e.authorId === me)).length;
  } catch {
    return 0;
  }
}

export function useAccountDeletion() {
  const auth = useAuth();
  const plan = usePlan();
  const client = auth.client as unknown as DeletionClient | null;
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [books, setBooks] = useState<SyncBook[] | null>(null);
  const [error, setError] = useState<'offline' | 'failed' | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!client || !auth.signedIn) return;
    const [s, b] = await Promise.all([loadStatus(client), loadBooks(client)]);
    if (s.ok) setStatus(s.value);
    else setError(s.reason);
    if (b.ok) setBooks(b.value);
    // A forget that failed earlier (offline at request time) is finished here.
    void retryForget(client, ids, flags, uuidv7());
  }, [client, auth.signedIn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const lines = useMemo(() => (books ? impactLines(bookImpacts(books, myLetterCount)) : null), [books]);
  const subscriptionNotice = showSubscriptionNotice(plan.details);

  const request = useCallback(async (): Promise<boolean> => {
    if (!client) return false;
    setBusy(true);
    setError(null);
    const r = await requestDeletion(client, subscriptionNotice ? true : plan.details.status === 'none' ? false : null);
    if (!r.ok) {
      setBusy(false);
      setError(r.reason);
      return false;
    }
    // The last event for this analytics id (TRACKING_PLAN), then sharing stops at once (DELETION spec 2.6.1 step 7),
    // then PostHog deletes this phone's persons through analytics-forget.
    analytics.track('account_deletion', { stage: 'confirmed' });
    await withdrawAnalytics().catch(() => {});
    await forgetAnalytics(client, ids, flags, 'account_deletion', uuidv7());
    setStatus({ state: 'scheduled', requestId: r.value.requestId, scheduledFor: r.value.scheduledFor });
    setBusy(false);
    return true;
  }, [client, subscriptionNotice, plan.details.status]);

  const cancel = useCallback(async (): Promise<boolean> => {
    if (!client) return false;
    setBusy(true);
    setError(null);
    const r = await cancelDeletion(client);
    setBusy(false);
    if (!r.ok) {
      setError(r.reason);
      return false;
    }
    setStatus({ state: 'none' });
    setCancelled(true);
    return true;
  }, [client]);

  return {
    configured: auth.configured,
    signedIn: auth.signedIn,
    status,
    lines,
    subscriptionNotice,
    error,
    cancelled,
    busy,
    request,
    cancel,
    signOut: auth.signOut,
    trackStage: (stage: 'started' | 'export_offered') => analytics.track('account_deletion', { stage }),
  };
}
