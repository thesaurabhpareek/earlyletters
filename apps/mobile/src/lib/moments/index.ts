/** The moments store surface. Nothing on a reachable path reads it yet (EXPO_PUBLIC_MOMENTS_TAB is off); only the wipes are wired. */
import { onBookErased } from '../store';
import { momentsStore } from './store';

export { createMomentsStore, endMomentsSession, eraseMomentsFile, momentsStore, MomentsStoreError } from './store';

// Deleting a book for good removes that book's rows in the same step (CDO-23 item 3).
onBookErased((bookId) => void momentsStore.removeBook(bookId));
