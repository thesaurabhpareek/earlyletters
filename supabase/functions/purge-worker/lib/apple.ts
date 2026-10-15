/**
 * Sign in with Apple token revocation (Apple 5.1.1(v), A-NFR-011, DATA-REQ-019,
 * DATA-REQ-033) and the at-rest wrapping of the stored refresh token (TDD 04
 * 3.1.1 and 3.9).
 *
 * Verified against Apple's pages on 3 Oct 2026:
 *  - Revoke: POST https://appleid.apple.com/auth/revoke, form-encoded
 *    client_id, client_secret, token, token_type_hint (refresh_token or
 *    access_token). 200 with no body when the token is invalidated "or if the
 *    token value was previously invalidated". Errors use Apple's ErrorResponse
 *    `{ "error": "invalid_client" | "invalid_grant" | ... }`.
 *  - Client secret: a JWT signed ES256 with the Sign in with Apple key (.p8),
 *    header {alg, kid: Key ID}, claims {iss: Team ID, iat, exp (at most six
 *    months ahead), aud: "https://appleid.apple.com", sub: the client_id}.
 *    For tokens minted by the native iOS sign-in, client_id is the app's
 *    bundle id; for the web or Android OAuth flow it is the Services ID.
 *
 * Runtime neutral: WebCrypto only (Deno, Node 22, browsers).
 */
import { drain, fetchWithTimeout, httpCode, ServiceError, type FetchFn } from './http.ts';

export const APPLE_REVOKE_URL = 'https://appleid.apple.com/auth/revoke';
export const APPLE_AUDIENCE = 'https://appleid.apple.com';

export interface AppleKeyConfig {
  /** 10-character Team ID (Apple Developer > Membership). */
  teamId: string;
  /** 10-character Key ID of the Sign in with Apple key. */
  keyId: string;
  /** Contents of the downloaded AuthKey_<KeyID>.p8 (PKCS#8 PEM). Literal "\n" sequences are accepted. */
  privateKeyPem: string;
}

const b64url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlJson = (v: unknown): string => b64url(new TextEncoder().encode(JSON.stringify(v)));
export const toBase64 = (bytes: Uint8Array): string => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
export const fromBase64 = (s: string): Uint8Array => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

function pemToDer(pem: string): Uint8Array {
  const body = pem
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/\s+/g, '');
  if (!body) throw new ServiceError('apple', 0, 'config');
  try {
    return fromBase64(body);
  } catch {
    throw new ServiceError('apple', 0, 'config');
  }
}

/** Builds a short-lived client secret (default 10 minutes; Apple's ceiling is six months). */
export async function makeClientSecret(cfg: AppleKeyConfig, clientId: string, nowMs = Date.now(), ttlSeconds = 600): Promise<string> {
  if (!/^[A-Z0-9]{10}$/.test(cfg.teamId) || !/^[A-Z0-9]{10}$/.test(cfg.keyId) || !clientId) {
    throw new ServiceError('apple', 0, 'config');
  }
  const iat = Math.floor(nowMs / 1000);
  const exp = iat + Math.min(Math.max(ttlSeconds, 60), 15_777_000);
  const header = { alg: 'ES256', kid: cfg.keyId };
  const claims = { iss: cfg.teamId, iat, exp, aud: APPLE_AUDIENCE, sub: clientId };
  const signingInput = `${b64urlJson(header)}.${b64urlJson(claims)}`;
  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey('pkcs8', pemToDer(cfg.privateKeyPem) as BufferSource, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  } catch (e) {
    if (e instanceof ServiceError) throw e;
    throw new ServiceError('apple', 0, 'config');
  }
  // WebCrypto ECDSA returns the IEEE P1363 r||s form that JWS ES256 requires.
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(signingInput)));
  return `${signingInput}.${b64url(sig)}`;
}

export type RevokeOutcome = 'revoked' | 'already_invalid';

/**
 * Revokes one token. 200 means revoked (or already revoked). `invalid_grant`
 * means Apple no longer recognises the token, so nothing is left to revoke.
 * `invalid_client` is our configuration (key, team, client id) and is thrown
 * as a non-transient `invalid_client` so the step retries after a fix and alerts.
 */
export async function revokeAppleToken(
  fetchFn: FetchFn,
  args: { clientId: string; clientSecret: string; token: string; tokenTypeHint?: 'refresh_token' | 'access_token'; timeoutMs?: number },
): Promise<RevokeOutcome> {
  const body = new URLSearchParams({
    client_id: args.clientId,
    client_secret: args.clientSecret,
    token: args.token,
    token_type_hint: args.tokenTypeHint ?? 'refresh_token',
  });
  const res = await fetchWithTimeout(fetchFn, 'apple', APPLE_REVOKE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  }, args.timeoutMs ?? 15_000);
  if (res.status === 200) {
    await drain(res);
    return 'revoked';
  }
  let error = '';
  try {
    const j = (await res.json()) as { error?: unknown };
    if (typeof j?.error === 'string') error = j.error;
  } catch {
    // no JSON body
  }
  if (res.status === 400 && error === 'invalid_grant') return 'already_invalid';
  if (res.status === 400 && (error === 'invalid_client' || error === 'unauthorized_client')) {
    throw new ServiceError('apple', 400, 'invalid_client');
  }
  throw new ServiceError('apple', res.status, res.status === 400 ? 'apple_error' : httpCode(res.status));
}

// ---------------------------------------------------------------------------
// Refresh token wrapping: AES-256-GCM under TOKEN_KEK_V<n>, AAD = profile id.
// The capture side (the `apple-token` function, not built yet) must use
// `wrapAppleToken` and store the result through `ops_apple_token_put`.
// ---------------------------------------------------------------------------

export interface WrappedToken {
  /** `v1.<base64 iv>.<base64 ciphertext+tag>` */
  ciphertext: string;
  keyVersion: number;
}

async function importKek(kekBase64: string, usage: 'encrypt' | 'decrypt'): Promise<CryptoKey> {
  let raw: Uint8Array;
  try {
    raw = fromBase64(kekBase64.trim());
  } catch {
    throw new ServiceError('apple', 0, 'config');
  }
  if (raw.length !== 32) throw new ServiceError('apple', 0, 'config');
  return crypto.subtle.importKey('raw', raw as BufferSource, { name: 'AES-GCM' }, false, [usage]);
}

export async function wrapAppleToken(kekBase64: string, keyVersion: number, profileId: string, token: string): Promise<WrappedToken> {
  const key = await importKek(kekBase64, 'encrypt');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(profileId.toLowerCase()) },
    key,
    new TextEncoder().encode(token),
  ));
  return { ciphertext: `v1.${toBase64(iv)}.${toBase64(ct)}`, keyVersion };
}

export async function unwrapAppleToken(kekBase64: string, profileId: string, ciphertext: string): Promise<string> {
  const m = /^v1\.([A-Za-z0-9+/=]+)\.([A-Za-z0-9+/=]+)$/.exec(ciphertext);
  if (!m) throw new ServiceError('apple', 0, 'decrypt_failed');
  const key = await importKek(kekBase64, 'decrypt');
  try {
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(m[1]) as BufferSource, additionalData: new TextEncoder().encode(profileId.toLowerCase()) },
      key,
      fromBase64(m[2]) as BufferSource,
    );
    return new TextDecoder().decode(pt);
  } catch {
    throw new ServiceError('apple', 0, 'decrypt_failed');
  }
}
