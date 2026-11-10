/**
 * The three screens of "Opening your book" (NX-36-S17 Tier 0; spec sections 2.1, 2.2): the existing StateScreen and
 * nothing new. A is loading (the moon breathes, still under Reduce Motion; no button, no count, no spinner). C and D are
 * the warm error form (the envelope drawing, never red). C has "Try again" and, quietly, "Try another way" (signs out).
 * D retries by itself when the connection returns (use-new-phone.ts). Their words are `authCopy.newPhone`, with
 * `outage.retry`, `consent.noBook.tryAnother` and `offline.body` reused. No motion of its own, no analytics event.
 */
import { StateScreen } from '@/components/ui/state-screen';
import { authCopy } from '@/lib/auth/copy';

export function OpeningBookScreen() {
  const t = authCopy.newPhone;
  return <StateScreen kind="loading" title={t.loading} body={t.loadingBody} />;
}

export function SlowBookScreen({ onTryAgain, onTryAnother }: { onTryAgain: () => void; onTryAnother: () => void }) {
  const t = authCopy.newPhone;
  return (
    <StateScreen
      kind="error"
      title={t.slowTitle}
      body={t.slowBody}
      primary={{ label: authCopy.outage.retry, onPress: onTryAgain, testID: 'newPhone.tryAgain' }}
      quiet={[{ label: authCopy.consent.noBook.tryAnother, onPress: onTryAnother, testID: 'newPhone.tryAnother' }]}
    />
  );
}

export function OfflineBookScreen({ onTryAgain, onTryAnother }: { onTryAgain: () => void; onTryAnother: () => void }) {
  const t = authCopy.newPhone;
  return (
    <StateScreen
      kind="error"
      title={t.offlineTitle}
      body={authCopy.offline.body}
      primary={{ label: authCopy.outage.retry, onPress: onTryAgain, testID: 'newPhone.tryAgain' }}
      quiet={[{ label: authCopy.consent.noBook.tryAnother, onPress: onTryAnother, testID: 'newPhone.tryAnother' }]}
    />
  );
}

/** "No book here yet" for a returning account with no book (or an unreadable answer), the same words as the consent sheet's. */
export function NoBookHereScreen({ onStartBook, onTryAnother }: { onStartBook: () => void; onTryAnother: () => void }) {
  const n = authCopy.consent.noBook;
  return (
    <StateScreen
      kind="empty"
      title={n.title}
      body={n.body}
      primary={{ label: n.startBook, onPress: onStartBook, testID: 'newPhone.startBook' }}
      quiet={[{ label: n.tryAnother, onPress: onTryAnother, testID: 'newPhone.tryAnother' }]}
    />
  );
}
