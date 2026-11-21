/**
 * The screens of "Opening your book" (NX-36-S17 Tier 0; spec sections 2.1, 2.2, 5): the existing StateScreen and nothing
 * new. A is loading (the moon breathes, still under Reduce Motion; no button, no count, no spinner). C and D are the warm
 * error form (the envelope drawing, never red). C has "Try again" and, quietly, "Try another way" (signs out). D retries
 * by itself when the connection returns (use-new-phone.ts). "No book here yet" is the consent sheet's words, on the route,
 * for a returning account with no book or an answer that could not be read. Their words are `authCopy.newPhone`, with
 * `outage.retry`, `consent.noBook.*` and `offline.body` reused. No motion of its own, no analytics event.
 * Accessibility, as the outage screen does it: on arrival the heading takes focus and the title is announced once (iOS
 * needs `announce()`; StateScreen's live region is Android-only). Cannot be checked on a device from here.
 */
import { useRef, type ReactNode } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { copy as appCopy } from '@/lib/copy';
import { capabilities } from '@/lib/capabilities';
import { heldScreenModel } from '@/lib/first-run/held-screen.logic';
import { StateScreen } from '@/components/ui/state-screen';
import { authCopy } from '@/lib/auth/copy';
import { useArrival } from '@/lib/first-run/use-arrival';

function Arrives({ title, screen, children }: { title: string; screen: string; children: ReactNode }) {
  const block = useRef<View>(null);
  useArrival(block, title, screen);
  return (
    <View ref={block} collapsable={false} style={{ flex: 1 }}>
      {children}
    </View>
  );
}

/**
 * State A. `lettersComing` is true only once the account has said it holds a book (use-first-run-route.ts accountHasBook):
 * before that answer, and for a session whose consent gate is still being read, the heading stands alone, so "Your letters
 * are coming across." is never read by an account with no letters.
 */
export function OpeningBookScreen({ lettersComing }: { lettersComing: boolean }) {
  const t = authCopy.newPhone;
  return (
    <Arrives title={t.loading} screen="opening">
      <StateScreen kind="loading" title={t.loading} body={lettersComing ? t.loadingBody : undefined} />
    </Arrives>
  );
}

export function SlowBookScreen({ onTryAgain, onTryAnother }: { onTryAgain: () => void; onTryAnother: () => void }) {
  const t = authCopy.newPhone;
  return (
    <Arrives title={t.slowTitle} screen="slow">
      <StateScreen
        kind="error"
        title={t.slowTitle}
        body={t.slowBody}
        primary={{ label: authCopy.outage.retry, onPress: onTryAgain, testID: 'newPhone.tryAgain' }}
        quiet={[{ label: authCopy.consent.noBook.tryAnother, onPress: onTryAnother, testID: 'newPhone.tryAnother' }]}
      />
    </Arrives>
  );
}

export function OfflineBookScreen({ onTryAgain, onTryAnother }: { onTryAgain: () => void; onTryAnother: () => void }) {
  const t = authCopy.newPhone;
  return (
    <Arrives title={t.offlineTitle} screen="offlineBook">
      <StateScreen
        kind="error"
        title={t.offlineTitle}
        body={authCopy.offline.body}
        primary={{ label: authCopy.outage.retry, onPress: onTryAgain, testID: 'newPhone.tryAgain' }}
        quiet={[{ label: authCopy.consent.noBook.tryAnother, onPress: onTryAnother, testID: 'newPhone.tryAnother' }]}
      />
    </Arrives>
  );
}

/** "No book here yet" for a returning account with no book (or an unreadable answer), the same words as the consent sheet's. */
export function NoBookHereScreen({ onStartBook, onTryAnother }: { onStartBook: () => void; onTryAnother: () => void }) {
  const n = authCopy.consent.noBook;
  return (
    <Arrives title={n.title} screen="noBookHere">
      <StateScreen
        kind="empty"
        title={n.title}
        body={n.body}
        primary={{ label: n.startBook, onPress: onStartBook, testID: 'newPhone.startBook' }}
        quiet={[{ label: n.tryAnother, onPress: onTryAnother, testID: 'newPhone.tryAnother' }]}
      />
    </Arrives>
  );
}

/**
 * Consent still to give, no book on this phone (BL-922a, NS-10-R0): one held screen with a way forward, never the child
 * step. Finish setting up opens the consent sheet, as Settings > Account does. Try another way signs out. Delete account and
 * the export are quiet and never ask for Terms (R4a, R4b). Decided from auth state alone: no network, no wait. The title
 * reuses state A's heading; the body and the export line are PROPOSED keys (auth.newPhone.consentBody and .nothingToCopy).
 */
export function HeldScreen({ onTryAnother }: { onTryAnother: () => void }) {
  const t = authCopy.newPhone;
  const m = heldScreenModel({ accountDeletion: capabilities.accountDeletion, hasLocalBook: false });
  const quiet = [
    { label: authCopy.consent.noBook.tryAnother, onPress: onTryAnother, testID: 'held.tryAnother' },
    ...(m.deleteAccount ? [{ label: appCopy.settingsHome.deleteAccountLabel, onPress: () => router.push(m.deleteAccount!.route), testID: 'held.deleteAccount' }] : []),
    { label: appCopy.settingsHome.exportLabel, onPress: () => router.push(m.exportCopy.route), testID: 'held.export' },
  ];
  return (
    <Arrives title={t.loading} screen="finishSetup">
      <StateScreen
        kind="empty"
        title={t.loading}
        body={m.exportCopy.nothingToCopy ? `${t.consentBody} ${t.nothingToCopy}` : t.consentBody}
        primary={{ label: authCopy.account.finishSetup, onPress: () => router.push(m.finishSetup.route), testID: 'held.finishSetup' }}
        quiet={quiet}
      />
    </Arrives>
  );
}
