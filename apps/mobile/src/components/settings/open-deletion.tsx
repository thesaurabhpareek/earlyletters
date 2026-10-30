/**
 * The deletion screen (coordinator D-117; critics' pass 30 Oct 2026, M1): what a phone with no book shows while a
 * request to delete the account is open, in place of the first-run welcome. A sole parent's book goes with her request,
 * so without this she met "Begin the book" and no way to Settings, Delete account or "Cancel deletion".
 *
 * Plain on purpose, the shared StateScreen: the page drawing, "Deletion scheduled", the date, "Cancel deletion" as the
 * one button and "Sign out of this phone" quiet beneath it (confirmed: it says the request stays open). Nothing else is
 * offered: not the welcome, not a new book, not Settings. Signed out it offers "Sign in", which is also how a person
 * cancels; after a cancel it says the book is coming back and waits for it (the phone is pulled at once, and the route
 * leaves for the Book when the book arrives, see useFirstRunGate). While the request is being carried out it only
 * explains, with Sign out (Sign in when signed out) as the way out. The words and buttons are lib/account-deletion/
 * open-request.ts deletionView, from accountDeletionCopy. A failure of something the person pressed keeps its line under
 * the date and says that nothing has changed, as the Delete account page does; a press is answered by the loading state
 * and spoken (announce), and Try again says when the book is still on its way.
 */
import { router } from 'expo-router';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StateScreen } from '@/components/ui/state-screen';
import { announce, useTheme } from '@/lib/a11y';
import { accountDeletionCopy as c, deletionView, localDay, useAccountDeletion, type DeletionAction, type OpenRequest } from '@/lib/account-deletion';
import { confirmSignOut } from '@/lib/account-deletion/confirm-sign-out';
import { copy } from '@/lib/copy';
import { longDate } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { listChildren } from '@/lib/store';
import { syncNow } from '@/lib/sync';
import { failureLine } from './delete-account.logic';
import { createPressController, type PressController } from './open-deletion.logic';

export function OpenDeletionScreen({ request }: { request: OpenRequest }) {
  const d = useAccountDeletion();
  // The press state (Cancel deletion, Try again) is open-deletion.logic.ts's: a press is answered by the loading state, with
  // no buttons to press twice, and the buttons come back if it never settles. StateScreen's primary has no `loading` of
  // its own (components/ui is design-systems'), so the whole state says it. `acted`: nothing is shown as a failure until
  // the person has pressed something: the passive read on a cold launch with no connection sets the hook's error, and
  // "Nothing has changed. Deleting an account needs a connection." would be an answer to a question nobody asked.
  const latest = useRef(d);
  latest.current = d;
  const controller = useRef<PressController | null>(null);
  if (!controller.current) {
    controller.current = createPressController({
      cancel: () => latest.current.cancel(),
      pull: () => syncNow(),
      announce,
      success: () => haptic('success'),
      bookListed: () => listChildren().length > 0,
      words: { cancelling: c.open.cancelling, notYet: c.open.notYet },
    });
  }
  const ctl = controller.current;
  useEffect(() => {
    ctl.attach();
    return () => ctl.dispose();
  }, [ctl]);
  const press = useSyncExternalStore(ctl.subscribe, ctl.get, ctl.get);
  const working = press.working !== null;
  const date = request.state === 'scheduled' || request.state === 'held' ? longDate(localDay(request.scheduledFor)) : '';
  const view = deletionView(request, { signedIn: d.signedIn, date, tryAgainLabel: copy.common.tryAgainButton });
  const failure = press.acted ? failureLine(d.error) : null;

  // VoiceOver is told what changed: the screen becoming the "your letters are on their way back" state, and a failed
  // cancel (a live region alone is not spoken on iOS). The cancel on its way and a Try again that found nothing are
  // spoken by the controller. Android: announce() does nothing there yet (lib/a11y.ts).
  const before = useRef(request.state);
  useEffect(() => {
    if (before.current !== 'cancelled' && request.state === 'cancelled') announce(`${c.open.restoringTitle}. ${c.open.restoringBody}`);
    before.current = request.state;
  }, [request.state]);
  useEffect(() => {
    if (press.failedPresses > 0 && failure) announce(failure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [press.failedPresses]);

  const run: Record<DeletionAction, () => void> = {
    cancel: () => ctl.cancel(),
    // Executing has nothing to promise about cancelling, so it signs out at once; a scheduled request says first that it stays open.
    signOut: () => (request.state === 'executing' ? void d.signOut() : confirmSignOut(date, () => void d.signOut())),
    signIn: () => router.push({ pathname: '/sign-in', params: { trigger: 'settings' } }),
    // Try again is a pull for the book; the screen answers it, with the loading state while it runs and a line after it.
    retry: () => ctl.retry(),
  };
  const act = (a: DeletionAction) => ({ label: view.labels[a], onPress: run[a] });
  const [first, ...rest] = working ? [] : view.actions;
  const lines = [view.body, request.state === 'cancelled' && press.notYet && !working ? c.open.notYet : null, failure].filter(Boolean);

  return (
    <StateScreen
      kind={working ? 'loading' : failure ? 'error' : 'empty'}
      art="page"
      title={view.title}
      body={lines.join('\n\n')}
      primary={first ? act(first) : undefined}
      quiet={rest.map(act)}
    />
  );
}

/**
 * A moment of paper where the welcome would be: this phone is signed in, a book on it was just closed by the server, and
 * the server has not yet said whether a request is open (useFirstRunGate, at most a few seconds). No words are drawn: it
 * is gone before they could be read, and it never asks anything. A screen reader is given a name for it.
 */
export function CheckingScreen() {
  const { c: colors } = useTheme();
  return (
    <View className="flex-1 items-center justify-center bg-background" accessible accessibilityLabel={c.open.checking} accessibilityLiveRegion="polite" accessibilityState={{ busy: true }}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}
