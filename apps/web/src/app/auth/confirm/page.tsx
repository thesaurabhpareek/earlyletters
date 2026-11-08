/** Owner: S20 (web). /auth/confirm: where a sign-in or confirm-your-email link lands when the app did not open it (F02). */
import { AuthConfirm, authConfirmMetadata } from './AuthConfirm';

export const metadata = authConfirmMetadata;

export default function AuthConfirmPage() {
  return <AuthConfirm />;
}
