/**
 * Account deletion (PRD C-REQ-019, LEGAL-REQ-029, DELETION_AND_EXPORT_SPEC 2.6).
 * Screen: app/settings/delete-account.tsx. Server: request_account_deletion,
 * cancel_account_deletion, the purge-worker and analytics-forget Edge Functions.
 *
 * Coordinator wiring (optional): after sign-in or launch, call
 * `retryForget(client, ids, flags, uuidv7())` so a phone that was offline when
 * it asked for deletion still sends its analytics ids. The screen also retries
 * each time it opens.
 */
export { accountDeletionCopy } from './copy';
export {
  bookImpacts, confirmationMatches, expectedDeletionDate, GRACE_DAYS, impactLines, localDay, parseStatus,
  showSubscriptionNotice, stepFor, type BookImpact, type ServerStatus, type Step, type SyncBook,
} from './logic';
export {
  cancelDeletion, FORGET_PENDING_KEY, forgetAnalytics, loadBooks, loadStatus, requestDeletion, retryForget,
  type AnalyticsIds, type ApiOutcome, type DeletionClient, type FlagStore,
} from './api';
export {
  CANCELLED_WAIT_MS, chooseScreen, deletionView, liveNote, noteAfterCancel, noteAfterRead, noteWithBook, OPEN_REQUEST_KEY,
  openRequestOf, parseOpenRequest, readOpenRequest, writeOpenRequest,
  type DeletionAction, type DeletionView, type OpenRequest, type PhoneScreen,
} from './open-request';
export { useAccountDeletion } from './use-account-deletion';
export { useFirstRunGate } from './use-first-run-gate';
