/**
 * Owner: S20 (web). /auth/callback: the same page as /auth/confirm, served at the path the app and the email
 * templates on `develop` still use (apps/mobile src/lib/auth/links.logic.ts AUTH_CALLBACK_PATH,
 * supabase/templates/*.html). No redirect, so nothing about the visit changes. Remove it, and its line in the
 * apple-app-site-association route, once the app and the templates use /auth/confirm (request to S01).
 */
import { AuthConfirm, authConfirmMetadata } from '../confirm/AuthConfirm';

export const metadata = authConfirmMetadata;

export default function AuthCallbackPage() {
  return <AuthConfirm />;
}
