/**
 * Connects the pure observers in @scribe/analytics (src/observe.ts) to other
 * modules' public state, so their events need no line in another owner's
 * screen (TRACKING_PLAN section 9, rows marked "wired"):
 *
 *   auth state        auth_method_selected, auth_email_sent, auth_failed, auth_succeeded, signed_out
 *   invite accepted   invite_accepted (co-parent: the only role in the app at v1.0)
 *   spoken languages  language_set
 *   pack engine       pack_download
 *   StoreKit plan     plan_changed (production only)
 *   reminder prefs    reminder_schedule_set
 *   notification tap  notification_opened (evening reminders only)
 *
 * Every event is still dropped until the person says yes (the client's
 * consent gate). Call `startAnalyticsObservers()` once after the first frame,
 * after `startAnalytics()`; it never throws.
 */
import * as Notifications from 'expo-notifications';
import {
  createAuthObserver,
  createLanguageObserver,
  createPackObserver,
  createPlanObserver,
  createReminderObserver,
  notificationOpenedEvent,
  trackNotificationOpened,
  type AuthLike,
} from '@scribe/analytics';
import { getAuthSnapshot, onInviteAccepted, subscribeAuth, type AuthState } from '@/lib/auth';
import { getPlan, subscribePlan } from '@/lib/billing';
import { getSpokenLanguages } from '@/lib/language';
import { onProgress } from '@/lib/packs';
import { expoNetwork } from '@/lib/packs/expo-adapter';
import { readPrefs } from '@/lib/reminders';
import { listChildren, listEntriesForChild, subscribe } from '@/lib/store';
import { getSyncStatus, subscribeSyncStatus } from '@/lib/sync';
import { analytics, stopAnalyticsForUnder18, trackers } from './index';
import { noteReminderOpened } from './track';

type Connection = 'wifi' | 'cellular' | 'none' | 'unknown';

// The app's AuthState must stay assignable to the observer's structural copy.
const asAuthLike = (s: AuthState): AuthLike => s;

function hasLocalLetters(): boolean {
  try {
    return listChildren().some((c) => listEntriesForChild(c.id).length > 0);
  } catch {
    return false;
  }
}

let started = false;

export function startAnalyticsObservers(): () => void {
  if (started) return () => {};
  started = true;
  const stops: (() => void)[] = [];
  const safe = (fn: () => void) => {
    try {
      fn();
    } catch {
      // Analytics never breaks the app; there is no consent-free channel to report on.
    }
  };

  safe(() => {
    const see = createAuthObserver(analytics, { hasLocalLetters, onUnder18: () => void stopAnalyticsForUnder18() });
    see(asAuthLike(getAuthSnapshot()));
    stops.push(subscribeAuth((s) => safe(() => see(asAuthLike(s)))));
    stops.push(onInviteAccepted(() => safe(() => void trackers.trackInviteAccepted({ role: 'parent' }))));
  });

  safe(() => {
    const see = createLanguageObserver(analytics);
    const read = () => see(getSpokenLanguages().languages.map((l) => l.code));
    read();
    const seeReminders = createReminderObserver(analytics);
    const readReminders = () => seeReminders(readPrefs());
    readReminders();
    stops.push(subscribe(() => safe(() => (read(), readReminders()))));
  });

  safe(() => {
    let connection: Connection = 'unknown';
    void expoNetwork.connection().then((c) => (connection = c), () => undefined);
    const unsubNet = expoNetwork.subscribe?.((c) => (connection = c));
    if (unsubNet) stops.push(unsubNet);
    const see = createPackObserver(analytics, () => connection);
    stops.push(onProgress((p) => safe(() => see(p))));
  });

  safe(() => {
    const see = createPlanObserver(analytics);
    const read = () => {
      const plan = getPlan();
      see({
        state: plan.view.state,
        period: plan.details.period,
        ownership: plan.details.ownership,
        environment: plan.view.environment,
        checked: plan.checkedAt !== null,
      });
    };
    read();
    stops.push(subscribePlan(() => safe(read)));
  });

  // sync_failed: an attempt ended offline or needing sign-in again. Counted once per change into that
  // state, so a phone that stays offline does not report every retry.
  safe(() => {
    let last = getSyncStatus().phase;
    stops.push(
      subscribeSyncStatus((st) =>
        safe(() => {
          if (st.phase !== last && (st.phase === 'offline' || st.phase === 'auth')) {
            analytics.track('sync_failed', { reason: st.phase === 'offline' ? 'network' : 'auth' });
          }
          last = st.phase;
        }),
      ),
    );
  });

  safe(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((r) =>
      safe(() => {
        const data = r.notification.request.content.data;
        // An evening reminder (never a month or birthday note): `from_notification_2h` on letter_saved.
        if (notificationOpenedEvent(data)) noteReminderOpened();
        void trackNotificationOpened(analytics, data);
      }),
    );
    stops.push(() => sub.remove());
  });

  return () => {
    stops.forEach((s) => safe(s));
    started = false;
  };
}
