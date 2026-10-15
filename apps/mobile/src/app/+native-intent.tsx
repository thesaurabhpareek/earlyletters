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
 * v1.0 (server features off, lib/capabilities.ts): auth links open home and keep
 * nothing; an invite link opens co-parent "coming soon" and its token is dropped
 * (lib/family/entry.logic.ts planIncomingLink).
 *
 * - scribe://listen (or any link to /listen, /review, /read-together)  -> Tonight. Links never open the
 *   microphone or a draft: the person taps Speak. (Listen also refuses to start without that tap,
 *   src/app/listen.tsx, so a restored or stale route is covered too.)
 *
 * The 18+ gate still comes first: the root layout renders no route until it
 * passes (PRD-REQ-019). During an under-18 stop an invite token is dropped,
 * not kept (TDD 01 F-20).
 */
import { brand } from '@scribe/brand';
import { decideGate } from '@/lib/age-gate.logic';
import { classifyIncomingUrl } from '@/lib/auth/links.logic';
import { setPendingAuthLink } from '@/lib/auth/pending';
import { serverFeaturesEnabled } from '@/lib/capabilities';
import { planIncomingLink } from '@/lib/family/entry.logic';
import { savePendingInvite } from '@/lib/family/pending-invite';
import { isCaptureRoute, TONIGHT_HREF } from '@/lib/resilience/not-found.logic';
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
    if (isCaptureRoute(path)) return TONIGHT_HREF;
    const link = classifyIncomingUrl(path, { origin: brand.web.origin, scheme: brand.scheme });
    const plan = planIncomingLink(link, { serverFeatures: serverFeaturesEnabled(), gateStopped: link.kind === 'invite' && gateStopped(), path });
    if (plan.keepAuthLink && link.kind === 'auth-link') setPendingAuthLink({ tokenHash: link.tokenHash, type: link.type });
    if (plan.keepInviteToken && link.kind === 'invite') await savePendingInvite(link.token);
    return plan.route;
  } catch {
    // Never crash on a link (Expo Router warns that a throw here can end the app).
    return '/';
  }
}
