/** Boot wiring of the moments launch cleanup (NS-53 PR 8 follow-up, BL-1541). Called from startServices in app/_layout.tsx; flag off: a no-op. */
import { getAuthSnapshot, currentAuthUserId, onSignedIn, subscribeAuth } from '../auth/auth-store';
import { bookVisibleNow, listChildren, listClosedBooks, listDeletedBooks } from '../store';
import { MOMENTS_TAB_ON } from '../nav/moments-tab';
import { startMomentsLaunchCleanup } from './launch.logic';
import { momentsStore } from './store';

/**
 * The books this phone lists, or null when they cannot be told. The store's lists return [] (not null) while another
 * account is signed in over this owner's book (`shown()`, [X4-R1]); an empty list would read as "no book is live" and
 * prune every home-place row, so that case is null and the rows are left alone.
 * A book in Recently deleted can still come back, so its row stays until the book is erased for good.
 */
export function liveBookIds(): string[] | null {
  if (!bookVisibleNow()) return null;
  return [...listChildren(), ...listClosedBooks(), ...listDeletedBooks()].map((b) => b.id);
}

/**
 * A file that would not go: its code only, held in memory (never a path, a day or a word). Nothing here logs or sends:
 * the moments folder may not (R250, `moments-store.test.ts`), and the analytics allowlist has no event for it. A reader
 * for a diagnostics screen can use `momentsCleanupFailure()`; the next launch retries the removal either way.
 */
let lastFailure: string | null = null;
export const momentsCleanupFailure = (): string | null => lastFailure;
const holdCode = (code: string): void => {
  lastFailure = code;
};

export function startMomentsCleanup(on: boolean = MOMENTS_TAB_ON, report: (code: string) => void = holdCode): () => void {
  return startMomentsLaunchCleanup({
    on,
    auth: {
      userId: currentAuthUserId,
      settledSignedOut: () => getAuthSnapshot().status === 'signedOut',
      subscribe: (l) => subscribeAuth(() => l()),
      onSignedIn: (l) => onSignedIn(() => l()),
    },
    cleanup: (books) => momentsStore.cleanupAtLaunch(books),
    failed: report,
    liveBooks: liveBookIds,
  });
}
