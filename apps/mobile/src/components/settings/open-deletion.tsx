/**
 * The deletion screen (coordinator D-117; critics' pass 30 Oct 2026, M1): what a phone with no book shows while a
 * request to delete the account is open, in place of the first-run welcome. A sole parent's book goes with her request,
 * so without this she met "Begin the book" and no way to Settings, Delete account or "Cancel deletion".
 *
 * Plain on purpose, the shared StateScreen: the page drawing, "Deletion scheduled", the date, "Cancel deletion" as the
 * one button and "Sign out of this phone" quiet beneath it (confirmed: it says the request stays open). Nothing else is
 * offered: not the welcome, not a new book, not Settings. Signed out it offers "Sign in", which is also how a person
 * cancels; after a cancel it says the book is coming back and waits for it (the phone is pulled at once, and the route
 * leaves for the Book when the book arrives, see useFirstRunGate). The words and buttons are lib/account-deletion/
 * open-request.ts deletionView, from accountDeletionCopy. A failure keeps its line under the date and says that
 * nothing has changed, as the Delete account page does.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StateScreen } from '@/components/ui/state-screen';
import { useTheme } from '@/lib/a11y';
import { deletionView, localDay, useAccountDeletion, type DeletionAction, type OpenRequest } from '@/lib/account-deletion';
import { confirmSignOut } from '@/lib/account-deletion/confirm-sign-out';
import { copy } from '@/lib/copy';
import { longDate } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { syncNow } from '@/lib/sync';
import { failureLine } from './delete-account.logic';

export function OpenDeletionScreen({ request }: { request: OpenRequest }) {
  const d = useAccountDeletion();
  const [busy, setBusy] = useState(false);
  const date = request.state === 'scheduled' || request.state === 'held' ? longDate(localDay(request.scheduledFor)) : '';
  const view = deletionView(request, { signedIn: d.signedIn, date, tryAgainLabel: copy.common.tryAgainButton });
  const failure = failureLine(d.error);

  const run: Record<DeletionAction, () => void> = {
    cancel: () => {
      if (busy || d.busy) return;
      setBusy(true);
      void d.cancel().then((ok) => {
        setBusy(false);
        if (ok) haptic('success');
      });
    },
    signOut: () => confirmSignOut(date, () => void d.signOut()),
    signIn: () => router.push({ pathname: '/sign-in', params: { trigger: 'settings' } }),
    retry: () => void syncNow(),
  };
  const act = (a: DeletionAction) => ({ label: view.labels[a], onPress: run[a] });
  const [first, ...rest] = view.actions;

  return (
    <StateScreen
      kind={failure ? 'error' : 'empty'}
      art="page"
      title={view.title}
      body={failure ? `${view.body}\n\n${failure}` : view.body}
      primary={first ? act(first) : undefined}
      quiet={rest.map(act)}
    />
  );
}

/**
 * A moment of paper where the welcome would be: this phone is signed in, a book on it was just closed by the server, and
 * the server has not yet said whether a request is open (useFirstRunGate, at most a few seconds). No words: it is gone
 * before they could be read, and it never asks anything.
 */
export function CheckingScreen() {
  const { c } = useTheme();
  return (
    <View className="flex-1 items-center justify-center bg-background" accessibilityState={{ busy: true }}>
      <ActivityIndicator color={c.accent} />
    </View>
  );
}
