/**
 * Classifies every URL that opens the app (Expo Router's +native-intent hands
 * them here before any routing). Pure, tested in test/auth-links.test.ts.
 *
 * Sign-in email link (PRD A F5, TDD 04 3.1.3):
 *   https://earlyletters.com/auth/callback#token_hash=<hash>&type=email
 * The token hash travels in the fragment so the website, Vercel logs and mail
 * scanners never receive it; a query string is also accepted. The app calls
 * verifyOtp({ token_hash, type }) with it.
 *
 * Custom-scheme fallback: `scribe://auth/callback` opens the code screen. A
 * token hash or invite token arriving on the custom scheme is ignored, never
 * used: any app can register a custom scheme (TDD 04 3.1.6), so the website's
 * fallback button must not put secrets in it. The person types the code from
 * the same email instead, which is what the fallback page shows.
 *
 * Invites: https://earlyletters.com/i/<token> (family/invite-link.logic.ts).
 */
import { parseInviteUrl } from '../family/invite-link.logic';
import { originHost, splitUrl } from './url.logic';

export const AUTH_CALLBACK_PATH = '/auth/callback';

/** Supabase email OTP types a link may carry. Anything else is refused. */
export type EmailLinkType = 'email' | 'magiclink' | 'signup';
const LINK_TYPES: readonly EmailLinkType[] = ['email', 'magiclink', 'signup'];

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
    if (path === AUTH_CALLBACK_PATH) {
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
    if (path === AUTH_CALLBACK_PATH) return { kind: 'auth-code' };
    return { kind: 'other' };
  }

  return { kind: 'other' };
}
