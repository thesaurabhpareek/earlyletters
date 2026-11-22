/** Boot wiring of the moments launch cleanup (PRD 28 PR 10, BL-1541). Called from startServices in app/_layout.tsx; flag off: a no-op. */
import { getAuthSnapshot, currentAuthUserId, onSignedIn, subscribeAuth } from '../auth/auth-store';
import { listChildren, listClosedBooks, listDeletedBooks } from '../store';
import { MOMENTS_TAB_ON } from '../nav/moments-tab';
import { startMomentsLaunchCleanup } from './launch.logic';
import { momentsStore } from './store';

export function startMomentsCleanup(on: boolean = MOMENTS_TAB_ON): () => void {
  return startMomentsLaunchCleanup({
    on,
    auth: {
      userId: currentAuthUserId,
      settledSignedOut: () => getAuthSnapshot().status === 'signedOut',
      subscribe: (l) => subscribeAuth(() => l()),
      onSignedIn: (l) => onSignedIn(() => l()),
    },
    cleanup: (books) => momentsStore.cleanupAtLaunch(books),
    // A book in Recently deleted can still come back, so its row stays until the book is erased for good.
    liveBooks: () => [...listChildren(), ...listClosedBooks(), ...listDeletedBooks()].map((b) => b.id),
  });
}
