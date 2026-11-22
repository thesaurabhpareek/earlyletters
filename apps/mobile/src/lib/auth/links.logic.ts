/**
 * Classifies every URL that opens the app (Expo Router's +native-intent hands
 * them here before any routing). Pure, tested in test/auth-links.test.ts.
 *
 * Sign-in email link (PRD A F5, TDD 04 3.1.3):
 *   https://earlyletters.com/auth/callback#token_hash=<hash>&type=email
 *   (or /auth/confirm, the same link on the website's other auth path; SIGN-04)
 * The token hash travels in the fragment so the website, Vercel logs and mail
 * scanners never receive it; a query string is also accepted. The app opens
 * it only through PKCE: GET /auth/v1/verify, then exchangeCodeForSession with
 * this phone's code verifier (email-link.logic.ts, email.ts; ADR 0023).
 *
 * Custom-scheme fallback: `scribe://auth/callback` opens the code screen. A
 * token hash or invite token arriving on the custom scheme is ignored, never
 * used: any app can register a custom scheme (TDD 04 3.1.6), so the website's
 * fallback button must not put secrets in it. The person types the code from
 * the same email instead, which is what the fallback page shows.
 *
 * Invites: https://earlyletters.com/j#t=<token> (family/invite-link.logic.ts).
 */
import { parseInviteUrl } from '../family/invite-link.logic';
import { originHost, splitUrl } from './url.logic';

export const AUTH_CALLBACK_PATH = '/auth/callback';
/**
 * The website's other auth path (SIGN-04). The AASA file hands `/auth/confirm` to the app too, and the
 * website comments ask to move the templates there, so the app reads it exactly as `/auth/callback`;
 * otherwise iOS would open the app at home and drop the token, with no fallback to the page.
 */
export const AUTH_CONFIRM_PATH = '/auth/confirm';
const AUTH_LINK_PATHS: readonly string[] = [AUTH_CALLBACK_PATH, AUTH_CONFIRM_PATH];

/**
 * Supabase email OTP types a link may carry. Anything else is refused. `email_change` (TPL-04) is the
 * `email_change.html` template's link: it confirms a new address for the account signed in on this
 * phone, never a sign-in (email-link.logic decideEmailLink).
 */
export type EmailLinkType = 'email' | 'magiclink' | 'signup' | 'email_change';
const LINK_TYPES: readonly EmailLinkType[] = ['email', 'magiclink', 'signup', 'email_change'];

export type IncomingLink =
  | { kind: 'auth-link'; tokenHash: string; type: EmailLinkType }
  /** Open the "type the code" screen (scheme fallback, or a callback link without a usable token). */
  | { kind: 'auth-code' }
  | { kind: 'invite'; token: string }
  /** A provider's own redirect (Google's reversed client id scheme): not ours to route. */
  | { kind: 'provider-redirect' }
  | { kind: 'other' };

export interface LinkConfig {
  /** https origin of the website, from packages/brand ("https://earlyletters.com"). */
  origin: string;
  /** The app's custom scheme, from packages/brand ("scribe"). */
  scheme: string;
}

const TOKEN_HASH = /^[A-Za-z0-9_-]{16,256}$/;

export function authCallbackUrl(origin: string): string {
  return `${origin.replace(/\/+$/, '')}${AUTH_CALLBACK_PATH}`;
}

export function classifyIncomingUrl(url: string, cfg: LinkConfig): IncomingLink {
  const u = splitUrl(url);
  if (!u) return { kind: 'other' };

  if (u.scheme.startsWith('com.googleusercontent.apps.')) return { kind: 'provider-redirect' };

  if (u.scheme === 'https') {
    if (u.host !== originHost(cfg.origin)) return { kind: 'other' };
    const path = u.path.replace(/\/+$/, '') || '/';
    if (AUTH_LINK_PATHS.includes(path)) {
      const p = { ...u.query, ...u.fragment }; // fragment wins: that is where our template puts it
      const tokenHash = p.token_hash ?? '';
      const type = (p.type ?? 'email') as EmailLinkType;
      if (TOKEN_HASH.test(tokenHash) && LINK_TYPES.includes(type)) return { kind: 'auth-link', tokenHash, type };
      return { kind: 'auth-code' };
    }
    const token = parseInviteUrl(url, cfg.origin);
    if (token) return { kind: 'invite', token };
    return { kind: 'other' };
  }

  if (u.scheme === cfg.scheme.toLowerCase()) {
    // scribe://auth/callback parses "auth" as the host; scribe:///auth/callback does not.
    const path = `/${[u.host, ...u.path.split('/')].filter(Boolean).join('/')}`;
    if (AUTH_LINK_PATHS.includes(path)) return { kind: 'auth-code' };
    return { kind: 'other' };
  }

  return { kind: 'other' };
}
