/**
 * The escrow function's configuration, read once per invocation from the escrow project's
 * function secrets (docs/ops/BACKUP_RUNBOOK.md, step B4 lists each name and who sets it).
 * Pure: takes a getter, so tests never touch real env. Anything missing or malformed fails
 * closed: the function answers 503 and opens nothing.
 */
import { decodeBase64 } from './bytes.ts';
import { templates } from './email/templates.ts';

export interface EscrowConfig {
  /** The main project, e.g. https://<ref>.supabase.co: JWT issuer and JWKS come from here. */
  mainUrl: string;
  /** postgresql://escrow_svc.<ref>:<password>@<pooler host>:5432/postgres (TLS is always on). */
  dbUrl: string;
  /** PEM of the main project's database CA (dashboard: Database settings, SSL). Required. */
  dbCaCerts: string[];
  /** ESCROW_PRIVATE_KEY_V<n>: raw 32-byte X25519 private keys by escrow key version. */
  keys: Record<number, Uint8Array>;
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

/** The escrow project's own off switch (F08 6.5 C9): anything but "on" pauses the function. */
export const switchOn = (get: EnvGetter): boolean => (get(SWITCH_ENV) ?? '').trim() === 'on';

export function readConfig(get: EnvGetter): { config: EscrowConfig | null; problems: string[] } {
  const v = (n: string) => (get(n) ?? '').trim();
  const problems: string[] = REQUIRED_ENV.filter((n) => !v(n)).map((n) => `missing ${n}`);
  const mainUrl = v('MAIN_SUPABASE_URL').replace(/\/+$/, '');
  if (mainUrl && !/^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(mainUrl)) problems.push('MAIN_SUPABASE_URL must be an https origin');
  const dbUrl = v('ESCROW_DB_URL');
  if (dbUrl && !/^postgres(ql)?:\/\/escrow_svc(\.[a-z0-9]+)?:[^@]+@[^/:]+(:\d+)?\/[A-Za-z0-9_]+(\?.*)?$/.test(dbUrl)) {
    problems.push('ESCROW_DB_URL must connect as escrow_svc');
  }
  const keys: Record<number, Uint8Array> = {};
  for (let n = 1; n <= 9; n++) {
    const raw = v(`ESCROW_PRIVATE_KEY_V${n}`);
    if (!raw) continue;
    let k: Uint8Array | null = null;
    try { k = decodeBase64(raw); } catch { k = null; }
    if (!k || k.length !== 32) problems.push(`ESCROW_PRIVATE_KEY_V${n} must be base64 of 32 bytes`);
    else keys[n] = k;
  }
  if (!Object.keys(keys).length) problems.push('no ESCROW_PRIVATE_KEY_V<n>');
  // Required: the pooler's certificate is checked against the main project's own CA, never
  // against the public roots alone (runbook B4).
  const ca = get('ESCROW_DB_CA') ?? '';
  const dbCaCerts = ca.includes('BEGIN CERTIFICATE') ? [ca] : [];
  if (!dbCaCerts.length) problems.push('ESCROW_DB_CA must be the PEM of the main database CA');
  let rotation: EscrowConfig['rotation'] = null;
  const secret = v('ESCROW_TASK_SECRET');
  if (secret) {
    const from = Number(v('ESCROW_ROTATE_FROM'));
    const to = Number(v('ESCROW_ROTATE_TO'));
    if (secret.length < 32 || !keys[from] || !keys[to] || from === to) problems.push('rotation needs ESCROW_TASK_SECRET (32+), and both key versions set');
    else rotation = { secret, from, to };
  }
  if (problems.length) return { config: null, problems };
  return {
    problems,
    config: {
      mainUrl,
      dbUrl,
      dbCaCerts,
      keys,
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
