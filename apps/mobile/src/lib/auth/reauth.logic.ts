/**
 * Remote "sign everyone in again" (LEGAL-REQ-040, security review L3, gap
 * G-06). Pure, tested in test/auth-reauth.test.ts.
 *
 * `forceReauthEpoch` in the signed remote config (packages/api) is a Unix time
 * in seconds. A session that signed in before it is ended on this phone once:
 * local letters, books and the upload queue stay, and the person signs in
 * again when they like. A session that signed in after it is left alone, so a
 * bump signs each phone out exactly once.
 *
 * The sign-in time comes from the access token's `amr` claim (Supabase puts
 * each authentication method with its Unix timestamp there, and refreshes keep
 * it), so it is the time of the sign-in, not of the last refresh. The token is
 * read, not verified: it is this phone's own session, and the worst a wrong
 * value can do is sign the person out once.
 *
 * This is the client half. The server half (signing-key rotation, TDD 04
 * 3.2.3) stops the old tokens working anywhere.
 */

/** Values above this are milliseconds typed by mistake; read them as seconds. */
const MS_THRESHOLD = 100_000_000_000;

export function normaliseEpochSeconds(epoch: number): number {
  if (!Number.isFinite(epoch) || epoch <= 0) return 0;
  return Math.floor(epoch > MS_THRESHOLD ? epoch / 1000 : epoch);
}

function base64UrlDecode(s: string): string | null {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    return atob(padded);
  } catch {
    return null;
  }
}

/** The latest `amr` timestamp of a Supabase access token, in seconds; null when unreadable. */
export function sessionSignedInAt(accessToken: string | null | undefined): number | null {
  if (!accessToken) return null;
  const parts = accessToken.split('.');
  if (parts.length !== 3) return null;
  const json = base64UrlDecode(parts[1]);
  if (!json) return null;
  try {
    const claims = JSON.parse(json) as { amr?: unknown };
    if (!Array.isArray(claims.amr)) return null;
    const times = claims.amr
      .map((m) => (m && typeof m === 'object' ? (m as { timestamp?: unknown }).timestamp : undefined))
      .filter((t): t is number => typeof t === 'number' && Number.isFinite(t) && t > 0);
    return times.length ? Math.max(...times) : null;
  } catch {
    return null;
  }
}

/**
 * True when this phone should end its session now. An unknown sign-in time
 * counts as "before" a set epoch: signing in again is always safe, while
 * keeping a session the founder meant to end is not.
 */
export function shouldForceReauth(epoch: number, signedInAt: number | null): boolean {
  const e = normaliseEpochSeconds(epoch);
  if (e === 0) return false;
  return signedInAt === null || signedInAt < e;
}
