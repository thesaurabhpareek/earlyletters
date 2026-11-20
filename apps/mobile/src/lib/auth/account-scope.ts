/**
 * BL-961 (`[X4-R1]`; ADR 0031): when the answer of `bookVisibleNow()` (lib/store.ts) changes because a session began
 * or ended, every store reader is told, so the Book, Home and the reminder planner (which re-plans on any store change,
 * lib/reminders/scheduler.ts) read their lists again through the check at once, not at the next save or foreground.
 * The owner itself changes only through writes that already emit a store change (the first claim, releaseEmptyOwner).
 * Started by the screen cover (components/account/account-layer.tsx), once, for the life of the session provider.
 * Reads nothing else, records nothing, sends nothing.
 */
import { bookVisibleNow, notifyStoreChanged } from '../store';
import { subscribeAuth } from './auth-store';

export function watchAccountScope(): () => void {
  let last = bookVisibleNow();
  return subscribeAuth(() => {
    const now = bookVisibleNow();
    if (now === last) return;
    last = now;
    notifyStoreChanged();
  });
}
