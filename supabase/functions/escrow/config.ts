/**
 * The escrow function's configuration, read once per invocation from the escrow project's
 * function secrets (docs/ops/BACKUP_RUNBOOK.md, step B5 lists each name and who sets it).
 * Pure: takes a getter, so tests never touch real env. Anything missing or malformed fails
 * closed: the function answers 503 and opens nothing.
 *
 * Two readers (review B S2 on PR #151):
 *  - readConfig: every setting but the private keys, on every call. For the keys it checks only
 *    that each set ESCROW_PRIVATE_KEY_V<n> has the shape of base64 of 32 bytes and that its version
 *    has a pinned public key, so a malformed or unpinned key still refuses every route; it never
 *    decodes one.
 *  - readKeys: decodes the private keys, checks each against its pinned public key
 *    (public-keys.ts) and zeroes every decoded byte on any refusal. The handler calls it only
 *    for a release or a rotation, after the caller's token or task secret has been checked,
 *    and zeroes the keys when the call ends. Opening a request needs no private key.
 */
import { decodeBase64, encodeBase64 } from './bytes.ts';
import { templates } from './email/templates.ts';
import { publicKeyOf } from './hpke.ts';
import { PINNED_PUBLIC_KEYS } from './public-keys.ts';

export interface EscrowConfig {
  /** The main project, e.g. https://<ref>.supabase.co: JWT issuer and JWKS come from here. */
  mainUrl: string;
  /** postgresql://escrow_svc.<ref>:<password>@<pooler host>:5432/postgres (TLS is always on). */
  dbUrl: string;
  /** PEM of the main project's database CA (dashboard: Database settings, SSL). Required. */
  dbCaCerts: string[];
  /** The versions whose ESCROW_PRIVATE_KEY_V<n> is set (not decoded here; readKeys decodes them). */
  keyVersions: number[];
  resendApiKey: string;
  mailFrom: string;
  replyTo: string;
  alertTo: string;
  stopUrl: string;
  /** Only while a rotation runs: the bearer secret for POST /escrow/v1/rotate, and the versions. */
  rotation: { secret: string; from: number; to: number } | null;
  version: string;
}

export const SWITCH_ENV = 'ESCROW_SWITCH';
export const KEY_ENV = /^ESCROW_PRIVATE_KEY_V([1-9])$/;
export const REQUIRED_ENV = ['MAIN_SUPABASE_URL', 'ESCROW_DB_URL', 'RESEND_API_KEY'] as const;

export type EnvGetter = (name: string) => string | undefined;

/**
 * The escrow project's own switch (F08 6.5 C9). `on`: every route. `rotation`: only
 * POST /escrow/v1/rotate, so a key rotation can run while restores stay paused (runbook R2 and
 * section 6). Anything else, or nothing: every route is paused.
 */
export type SwitchMode = 'on' | 'rotation' | 'off';
export function switchMode(get: EnvGetter): SwitchMode {
  const s = (get(SWITCH_ENV) ?? '').trim();
  return s === 'on' ? 'on' : s === 'rotation' ? 'rotation' : 'off';
}

/** Standard or URL-safe base64 of exactly 32 bytes (keygen.ts prints the standard form). */
const KEY_TEXT = /^[A-Za-z0-9+/_-]{43}=?$/;

export function readConfig(get: EnvGetter, pinned: Readonly<Record<number, string>> = PINNED_PUBLIC_KEYS): { config: EscrowConfig | null; problems: string[] } {
  const v = (n: string) => (get(n) ?? '').trim();
  const problems: string[] = REQUIRED_ENV.filter((n) => !v(n)).map((n) => `missing ${n}`);
  const mainUrl = v('MAIN_SUPABASE_URL').replace(/\/+$/, '');
  if (mainUrl && !/^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(mainUrl)) problems.push('MAIN_SUPABASE_URL must be an https origin');
  const dbUrl = v('ESCROW_DB_URL');
  if (dbUrl && !/^postgres(ql)?:\/\/escrow_svc(\.[a-z0-9]+)?:[^@]+@[^/:]+(:\d+)?\/[A-Za-z0-9_]+(\?.*)?$/.test(dbUrl)) {
    problems.push('ESCROW_DB_URL must connect as escrow_svc');
  }
  const keyVersions: number[] = [];
  for (let n = 1; n <= 9; n++) {
    const text = v(`ESCROW_PRIVATE_KEY_V${n}`);
    if (!text) continue;
    keyVersions.push(n);
    if (!KEY_TEXT.test(text)) problems.push(`ESCROW_PRIVATE_KEY_V${n} must be base64 of 32 bytes`);
    if (typeof pinned[n] !== 'string') problems.push(`ESCROW_PRIVATE_KEY_V${n} has no pinned public key (public-keys.ts)`);
  }
  if (!keyVersions.length) problems.push('no ESCROW_PRIVATE_KEY_V<n>');
  // Required: the pooler's certificate is checked against the main project's own CA, never
  // against the public roots alone (runbook B5).
  const ca = get('ESCROW_DB_CA') ?? '';
  const dbCaCerts = ca.includes('BEGIN CERTIFICATE') ? [ca] : [];
  if (!dbCaCerts.length) problems.push('ESCROW_DB_CA must be the PEM of the main database CA');
  let rotation: EscrowConfig['rotation'] = null;
  const secret = v('ESCROW_TASK_SECRET');
  if (secret) {
    const from = Number(v('ESCROW_ROTATE_FROM'));
    const to = Number(v('ESCROW_ROTATE_TO'));
    if (secret.length < 32 || !keyVersions.includes(from) || !keyVersions.includes(to) || from === to) {
      problems.push('rotation needs ESCROW_TASK_SECRET (32+), and both key versions set');
    } else rotation = { secret, from, to };
  }
  if (problems.length) return { config: null, problems };
  return {
    problems,
    config: {
      mainUrl,
      dbUrl,
      dbCaCerts,
      keyVersions,
      resendApiKey: v('RESEND_API_KEY'),
      mailFrom: v('MAIL_FROM') || templates.meta.from,
      replyTo: templates.meta.replyTo,
      alertTo: v('ALERT_EMAIL') || templates.meta.replyTo,
      stopUrl: templates.meta.stopUrl,
      rotation,
      version: /^[0-9][0-9A-Za-z.]{0,15}$/.test(v('ESCROW_VERSION')) ? v('ESCROW_VERSION') : '1',
    },
  };
}

/**
 * The private keys of the given versions, each checked against its pinned public key. Any
 * problem (not set, not base64 of 32 bytes, no pinned key, a key that does not derive its pinned
 * public key) refuses them all, and every byte decoded so far is zeroed first. Problems name the
 * variable only, never a value.
 */
export async function readKeys(get: EnvGetter, versions: readonly number[],
  pinned: Readonly<Record<number, string>> = PINNED_PUBLIC_KEYS,
  opts: { onDecoded?: (k: Uint8Array) => void } = {}): Promise<{ keys: Record<number, Uint8Array> | null; problems: string[] }> {
  const keys: Record<number, Uint8Array> = {};
  const problems: string[] = [];
  for (const n of versions) {
    const name = `ESCROW_PRIVATE_KEY_V${n}`;
    let k: Uint8Array | null = null;
    try { k = decodeBase64((get(name) ?? '').trim()); } catch { k = null; }
    if (k) opts.onDecoded?.(k); // tests only: lets a test see that refused bytes are zeroed
    if (!k || k.length !== 32) {
      k?.fill(0);
      problems.push(`${name} must be base64 of 32 bytes`);
      continue;
    }
    keys[n] = k;
    if (typeof pinned[n] !== 'string') {
      problems.push(`${name} has no pinned public key (public-keys.ts)`);
      continue;
    }
    const pk = await publicKeyOf(k);
    if (encodeBase64(pk) !== pinned[n]) problems.push(`${name} does not match its pinned public key`);
  }
  if (!versions.length) problems.push('no ESCROW_PRIVATE_KEY_V<n>');
  if (problems.length) {
    for (const k of Object.values(keys)) k.fill(0);
    return { keys: null, problems };
  }
  return { keys, problems };
}
