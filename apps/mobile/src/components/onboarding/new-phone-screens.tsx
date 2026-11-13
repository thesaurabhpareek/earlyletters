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
import { View } from 'react-native';
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

export function OpeningBookScreen() {
  const t = authCopy.newPhone;
  return (
    <Arrives title={t.loading} screen="opening">
      <StateScreen kind="loading" title={t.loading} body={t.loadingBody} />
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
