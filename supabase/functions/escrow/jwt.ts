/**
 * Verifies the caller's Supabase access token against the MAIN project's public signing keys
 * (JWKS), so the escrow project never holds a secret that can mint or check tokens (F08 6.5 G2).
 * Only asymmetric algorithms (ES256, RS256) are accepted; a token signed with the legacy shared
 * secret (HS256) is refused, so the main project must use asymmetric signing keys (runbook B2).
 *
 * Step-up (F08 6.5 C1): `authAt` is the newest `amr[].timestamp`, the time of the latest real
 * sign-in. A refreshed token keeps it, so a stolen refresh token cannot satisfy the 10-minute rule.
 * [A: confirmed on staging in the B4 deploy check, runbook B6.]
 */
import { decodeBase64, UUID } from './bytes.ts';

export interface VerifiedUser {
  sub: string;
  email: string | null;
  /** Unix seconds of the most recent sign-in (amr), 0 when the token carries none. */
  authAt: number;
  sessionId: string | null;
}

export class JwtError extends Error {
  readonly code: 'unauthorized' | 'unavailable';
  constructor(code: 'unauthorized' | 'unavailable', why: string) {
    super(why);
    this.code = code;
  }
}

export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

interface Jwk { kty: string; kid?: string; alg?: string; use?: string; crv?: string; x?: string; y?: string; n?: string; e?: string }

/** JWKS cache: 10 minutes, and at most one refetch a minute for an unknown kid. */
export class JwksCache {
  private keys = new Map<string, CryptoKey>();
  private fetchedAt = 0;
  private readonly url: string;
  private readonly fetchFn: FetchFn;
  private readonly now: () => number;
  constructor(mainUrl: string, fetchFn: FetchFn, now: () => number = Date.now) {
    this.url = `${mainUrl}/auth/v1/.well-known/jwks.json`;
    this.fetchFn = fetchFn;
    this.now = now;
  }

  async key(kid: string, alg: string): Promise<CryptoKey | null> {
    const age = this.now() - this.fetchedAt;
    if (age > 600_000 || (!this.keys.has(`${alg}:${kid}`) && age > 60_000)) await this.refresh();
    return this.keys.get(`${alg}:${kid}`) ?? null;
  }

  private async refresh(): Promise<void> {
    let body: { keys?: Jwk[] };
    try {
      const r = await this.fetchFn(this.url, { headers: { accept: 'application/json' } });
      if (!r.ok) throw new Error(String(r.status));
      body = await r.json();
    } catch {
      throw new JwtError('unavailable', 'jwks');
    }
    const next = new Map<string, CryptoKey>();
    for (const k of body.keys ?? []) {
      if (!k.kid) continue;
      try {
        if (k.kty === 'EC' && k.crv === 'P-256' && k.x && k.y) {
          next.set(`ES256:${k.kid}`, await crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: k.x, y: k.y }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']));
        } else if (k.kty === 'RSA' && k.n && k.e) {
          next.set(`RS256:${k.kid}`, await crypto.subtle.importKey('jwk', { kty: 'RSA', n: k.n, e: k.e }, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']));
        }
      } catch {
        // a key we cannot use is skipped
      }
    }
    this.keys = next;
    this.fetchedAt = this.now();
  }
}

const json = (part: string): Record<string, unknown> => {
  const o = JSON.parse(new TextDecoder().decode(decodeBase64(part)));
  if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error('not an object');
  return o as Record<string, unknown>;
};

export async function verifyAccessToken(token: string, opts: { mainUrl: string; jwks: JwksCache; nowSec: number }): Promise<VerifiedUser> {
  const parts = token.split('.');
  if (parts.length !== 3 || token.length > 8192) throw new JwtError('unauthorized', 'shape');
  let header: Record<string, unknown>;
  let claims: Record<string, unknown>;
  try {
    header = json(parts[0]);
    claims = json(parts[1]);
  } catch {
    throw new JwtError('unauthorized', 'decode');
  }
  const alg = header.alg;
  const kid = header.kid;
  if ((alg !== 'ES256' && alg !== 'RS256') || typeof kid !== 'string') throw new JwtError('unauthorized', 'alg');
  const key = await opts.jwks.key(kid, alg);
  if (!key) throw new JwtError('unauthorized', 'kid');
  let sig: Uint8Array;
  try {
    sig = decodeBase64(parts[2]);
  } catch {
    throw new JwtError('unauthorized', 'sig');
  }
  const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const algo = alg === 'ES256' ? { name: 'ECDSA', hash: 'SHA-256' } : { name: 'RSASSA-PKCS1-v1_5' };
  if (alg === 'ES256' && sig.length !== 64) throw new JwtError('unauthorized', 'sig');
  const ok = await crypto.subtle.verify(algo, key, sig.buffer.slice(sig.byteOffset, sig.byteOffset + sig.byteLength) as ArrayBuffer, data);
  if (!ok) throw new JwtError('unauthorized', 'sig');

  const now = opts.nowSec;
  const aud = claims.aud;
  const audOk = aud === 'authenticated' || (Array.isArray(aud) && aud.includes('authenticated'));
  if (claims.iss !== `${opts.mainUrl}/auth/v1` || !audOk || claims.role !== 'authenticated') throw new JwtError('unauthorized', 'claims');
  if (typeof claims.exp !== 'number' || claims.exp <= now) throw new JwtError('unauthorized', 'expired');
  if (typeof claims.iat === 'number' && claims.iat > now + 60) throw new JwtError('unauthorized', 'iat');
  if (typeof claims.sub !== 'string' || !UUID.test(claims.sub)) throw new JwtError('unauthorized', 'sub');
  if (claims.is_anonymous === true) throw new JwtError('unauthorized', 'anonymous');
  let authAt = 0;
  if (Array.isArray(claims.amr)) {
    for (const m of claims.amr) {
      const t = (m as { timestamp?: unknown })?.timestamp;
      if (typeof t === 'number' && Number.isFinite(t) && t <= now + 60 && t > authAt) authAt = t;
    }
  }
  return {
    sub: claims.sub,
    email: typeof claims.email === 'string' && claims.email.includes('@') ? claims.email : null,
    authAt,
    sessionId: typeof claims.session_id === 'string' && UUID.test(claims.session_id.toLowerCase()) ? claims.session_id.toLowerCase() : null,
  };
}

/** The 10-minute step-up rule, checked only when a new restore request is opened. */
export const STEP_UP_SECONDS = 600;
export const recentSignIn = (u: VerifiedUser, nowSec: number): boolean => u.authAt > 0 && nowSec - u.authAt <= STEP_UP_SECONDS;
