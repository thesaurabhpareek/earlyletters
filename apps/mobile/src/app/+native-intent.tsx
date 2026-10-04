/**
 * Deep links (TDD 01 3.1, TDD 04 3.1.6). Expo Router hands every URL that
 * opens the app to `redirectSystemPath` before routing, cold or warm, so
 * secrets are taken out of the URL here and never become route params,
 * history entries or log lines (A-NFR-012, LEGAL-REQ-014).
 *
 * - https://earlyletters.com/auth/callback#token_hash=...  -> token hash kept
 *   in memory, route /sign-in/verify
 * - scribe://auth/callback (website fallback, no secret)    -> /sign-in/code
 * - https://earlyletters.com/i/<token>                      -> token to the
 *   Keychain first (A-REQ-028), route /invite
 * - Google's own redirect scheme                            -> left alone
 *
 * The 18+ gate still comes first: the root layout renders no route until it
 * passes (PRD-REQ-019). During an under-18 stop an invite token is dropped,
 * not kept (TDD 01 F-20).
 */
import { brand } from '@scribe/brand';
import { decideGate } from '@/lib/age-gate.logic';
import { classifyIncomingUrl } from '@/lib/auth/links.logic';
import { setPendingAuthLink } from '@/lib/auth/pending';
import { savePendingInvite } from '@/lib/family/pending-invite';
import { getSetting } from '@/lib/store';

function gateStopped(): boolean {
  try {
    // Keys from docs/DECISIONS.md D-026 (lib/age-gate.ts).
    const r = decideGate({ passed: getSetting('ageGate.passed') === '1', stoppedAt: getSetting('ageGate.stoppedAt') }, Date.now());
    return r.decision === 'stop';
  } catch {
    return false;
  }
}

export async function redirectSystemPath({ path }: { path: string; initial: boolean }): Promise<string | null> {
  try {
    const link = classifyIncomingUrl(path, { origin: brand.web.origin, scheme: brand.scheme });
    switch (link.kind) {
      case 'auth-link':
        setPendingAuthLink({ tokenHash: link.tokenHash, type: link.type });
        return '/sign-in/verify';
      case 'auth-code':
        return '/sign-in/code';
      case 'invite':
        if (gateStopped()) return '/';
        await savePendingInvite(link.token);
        return '/invite';
      case 'provider-redirect':
        return null;
      default:
        return path;
    }
  } catch {
    // Never crash on a link (Expo Router warns that a throw here can end the app).
    return '/';
  }
}
