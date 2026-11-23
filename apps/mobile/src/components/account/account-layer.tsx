/**
 * The screen cover for another account (BL-961; NS-10-R3, `[X4-R1]`; 08-keeping.md 3.2 and K8; the cover half of
 * ADR 0031 under Karma's ruling on AX-12). Rendered once by the root layout, beside the app lock and under it.
 *
 * - Up while another account is signed in on a phone that holds this owner's book (lib/auth/account-scope.logic.ts
 *   bookVisibleTo), from the first moment of that session, before consent too, until the session has ended.
 * - Over everything, as the app lock is: on iOS in FullWindowOverlay, above presented modals and sheets, so every route
 *   and deep link is under it. Mounted only while needed. The page colour is opaque from the first frame
 *   (StateScreenView's page does not animate; only its words take the house's one fade in).
 * - Shows nothing of the owner's (no name, letter, child or count) and nothing of the signed-in account (no email).
 * - One action, Sign out, through `notMyAccount`: nothing of this account was claimed or queued on this phone, so it
 *   never waits for the owner's queued uploads, which cannot go up under this account. No Erase everything (D1).
 * - VoiceOver: the layer is modal; on arrival the heading takes focus and the title is said once (useArrival).
 * - It only covers. Nothing under it unmounts, and nothing is deleted, moved or sent.
 */
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import { StateScreenView } from '@/components/ui/state-screen';
import { useTheme } from '@/lib/a11y';
import { watchAccountScope } from '@/lib/auth/account-scope';
import { bookVisibleTo } from '@/lib/auth/account-scope.logic';
import { authCopy } from '@/lib/auth/copy';
import { authUserId } from '@/lib/auth/machine.logic';
import { useAuth } from '@/lib/auth/session-provider';
import { useArrival } from '@/lib/first-run/use-arrival';
import { currentUserId, subscribeTo } from '@/lib/store';
import { accountScopeCopy } from './copy';

/** The owner is written at the first claim and forgotten by releaseEmptyOwner; both emit a settings change. */
const subscribeToOwner = (onChange: () => void) => subscribeTo('settings', onChange);
/** With no session the book is visible whoever owns it (D1), so the owner is not read at all. */
const noOwner = (): string | null => null;

export function AccountLayer() {
  const auth = useAuth();
  // The store's lists are read through the same check (lib/store.ts shown); tell their readers when it changes.
  useEffect(() => watchAccountScope(), []);
  const sessionUser = authUserId(auth.state);
  const readOwner = sessionUser ? currentUserId : noOwner;
  const owner = useSyncExternalStore(subscribeToOwner, readOwner, readOwner);
  if (bookVisibleTo({ owner, sessionUser })) return null;
  const signOut = () => {
    auth.notMyAccount().catch(() => undefined);
  };
  const content = <OtherAccountScreen onSignOut={signOut} />;
  if (Platform.OS === 'ios') return <FullWindowOverlay unstable_accessibilityContainerViewIsModal>{content}</FullWindowOverlay>;
  return <View style={[StyleSheet.absoluteFill, styles.web]}>{content}</View>;
}

function OtherAccountScreen({ onSignOut }: { onSignOut: () => void }) {
  const { c } = useTheme();
  const block = useRef<View>(null);
  useArrival(block, accountScopeCopy.title, 'otherAccount');
  return (
    <View ref={block} collapsable={false} accessibilityViewIsModal style={[StyleSheet.absoluteFill, { backgroundColor: c.bg }]} testID="account.otherAccount">
      <StateScreenView
        kind="empty"
        title={accountScopeCopy.title}
        body={accountScopeCopy.body}
        primary={{ label: authCopy.account.signOut, onPress: onSignOut, testID: 'account.otherAccount.signOut' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Under the app lock's layer (zIndex 1000), over everything else, in the web preview.
  web: { zIndex: 999 },
});
