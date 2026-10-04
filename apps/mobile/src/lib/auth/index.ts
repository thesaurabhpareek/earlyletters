/**
 * Account layer (PRD A, TDD 04 3.1 to 3.3). Screens use `useAuth()`; code
 * outside React (sync, store) uses the auth-store functions.
 */
export {
  currentAuthUserId,
  getAuthSnapshot,
  onInviteAccepted,
  onSignedIn,
  registerUploadQueue,
  subscribeAuth,
  syncAllowed,
  type UploadQueueProbe,
} from './auth-store';
export { authCopy } from './copy';
export { classifyIncomingUrl, type IncomingLink } from './links.logic';
export { canSync, isSignedIn, type AuthErrorKind, type AuthMethod, type AuthState, type ConsentStep } from './machine.logic';
export { asSignInTrigger, type SignInTrigger } from './pending';
export { SessionProvider, useAuth, type AuthApi, type Outcome } from './session-provider';
