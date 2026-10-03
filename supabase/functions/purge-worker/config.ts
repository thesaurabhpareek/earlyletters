/**
 * Worker configuration from environment variables (Edge Function secrets).
 * Pure: takes a getter, so tests and ops scripts never touch real env.
 * Every name below is listed, with who sets it, in docs/ops/SECURITY.md.
 */
import { brand, bundleId } from '../../../packages/brand/index.ts';

export interface AppleConfig {
  teamId: string;
  keyId: string;
  privateKeyPem: string;
  /** Client ids a stored token may belong to: the bundle id (native iOS) and, later, the Services ID. */
  clientIds: string[];
}

export interface WorkerConfig {
  supabaseUrl: string;
  serviceKey: string;
  /** Shared secret the cron job presents (Authorization: Bearer). Not the service key. */
  triggerSecret: string;
  resendApiKey: string;
  /** "Name <address>" for user-facing deletion emails. */
  mailFrom: string;
  replyTo: string;
  /** Where content-free alerts go. */
  alertTo: string;
  /** null until the founder sets the Sign in with Apple key; Apple steps then retry and alert. */
  apple: AppleConfig | null;
  /** TOKEN_KEK_V<n>: base64 of 32 random bytes, by key version. */
  tokenKeks: Record<number, string>;
  /** Stop starting new work after this many ms (Edge Function wall clock is 150 s on Free, 400 s on paid; Unverified). */
  budgetMs: number;
  version: string;
}

export type EnvGetter = (name: string) => string | undefined;

export const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'PURGE_WORKER_SECRET', 'RESEND_API_KEY'] as const;

export function readConfig(get: EnvGetter): { config: WorkerConfig | null; missing: string[] } {
  const v = (name: string) => (get(name) ?? '').trim();
  const missing: string[] = REQUIRED_ENV.filter((n) => !v(n));

  const tokenKeks: Record<number, string> = {};
  for (let n = 1; n <= 9; n++) {
    const k = v(`TOKEN_KEK_V${n}`);
    if (k) tokenKeks[n] = k;
  }

  const teamId = v('APPLE_TEAM_ID');
  const keyId = v('APPLE_SIGNIN_KEY_ID');
  const privateKeyPem = get('APPLE_SIGNIN_PRIVATE_KEY') ?? '';
  const extraClients = v('APPLE_SERVICES_ID');
  const apple: AppleConfig | null = teamId && keyId && privateKeyPem.trim()
    ? { teamId, keyId, privateKeyPem, clientIds: [bundleId(), ...(extraClients ? [extraClients] : [])] }
    : null;

  const budget = Number(v('PURGE_WORKER_BUDGET_MS') || '110000');
  const support = brand.support.email;
  if (missing.length) return { config: null, missing };
  return {
    missing,
    config: {
      supabaseUrl: v('SUPABASE_URL'),
      serviceKey: v('SUPABASE_SERVICE_ROLE_KEY'),
      triggerSecret: v('PURGE_WORKER_SECRET'),
      resendApiKey: v('RESEND_API_KEY'),
      mailFrom: v('MAIL_FROM') || `${brand.name} <${support}>`,
      replyTo: support,
      alertTo: v('ALERT_EMAIL') || support,
      apple,
      tokenKeks,
      budgetMs: Number.isFinite(budget) && budget >= 5_000 && budget <= 380_000 ? budget : 110_000,
      version: /^[0-9][0-9A-Za-z.]{0,15}$/.test(v('WORKER_VERSION')) ? v('WORKER_VERSION') : '1',
    },
  };
}
