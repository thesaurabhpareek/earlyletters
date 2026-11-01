/**
 * Which project a script talks to, and who runs it. Pure (no env, no I/O).
 * Every script needs `--project-ref <ref>` equal to the ref in SUPABASE_URL,
 * so a staging command can never run against production by accident.
 */
export interface Target {
  url: string;
  serviceKey: string;
  projectRef: string;
  operator: string;
  ticket: string;
}

export function projectRefOf(url: string): string | null {
  const m = /^https:\/\/([a-z0-9]{8,40})\.supabase\.co\/?$/.exec(url.trim());
  return m ? m[1] : null;
}

export function resolveTarget(input: { url: string; serviceKey: string; projectRef: string | true | undefined; operator: string; ticket: string | true | undefined }):
  { target: Target; problems: [] } | { target: null; problems: string[] } {
  const problems: string[] = [];
  const ref = projectRefOf(input.url);
  if (!ref) problems.push('SUPABASE_URL must be https://<project-ref>.supabase.co');
  if (!input.serviceKey) problems.push('SUPABASE_SERVICE_ROLE_KEY is not set');
  if (typeof input.projectRef !== 'string') problems.push('--project-ref <ref> is required');
  else if (ref && input.projectRef !== ref) problems.push('--project-ref does not match SUPABASE_URL');
  if (!/^[A-Za-z0-9._-]{1,80}$/.test(input.operator)) problems.push('OPS_OPERATOR must be your staff handle (letters, digits, . _ -)');
  if (typeof input.ticket !== 'string' || !/^[A-Za-z0-9._#-]{1,80}$/.test(input.ticket)) problems.push('--ticket <reference> is required (no spaces, no names)');
  if (problems.length) return { target: null, problems };
  return { target: { url: input.url.trim().replace(/\/+$/, ''), serviceKey: input.serviceKey, projectRef: ref!, operator: input.operator, ticket: input.ticket as string }, problems: [] };
}

/** libpq settings for a Postgres URL, passed to psql as PG* variables so the password is never in argv. */
export interface DbTarget {
  env: Record<'PGHOST' | 'PGPORT' | 'PGUSER' | 'PGPASSWORD' | 'PGDATABASE' | 'PGSSLMODE', string>;
  /** The Supabase project the URL belongs to: `db.<ref>.supabase.co`, or a pooler host with user `postgres.<ref>`. */
  projectRef: string | null;
}

/** Control characters: a NUL makes spawn throw with the value in its message, so they never get that far. */
const CONTROL_RE = /[\u0000-\u001f\u007f]/;

/**
 * Parses a Postgres URL into psql settings. Problems are fixed sentences that
 * never echo any part of the URL. TLS is required: `sslmode` may only be
 * `require` (the default), `verify-ca` or `verify-full`, so a pasted URL
 * cannot send the password in clear.
 */
export function dbTargetOf(raw: string): { target: DbTarget; problem: null } | { target: null; problem: string } {
  const no = (problem: string) => ({ target: null, problem });
  if (CONTROL_RE.test(raw.trim())) return no('SUPABASE_DB_URL holds a control character');
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return no('SUPABASE_DB_URL is not a postgres:// URL');
  }
  if (u.protocol !== 'postgres:' && u.protocol !== 'postgresql:') return no('SUPABASE_DB_URL is not a postgres:// URL');
  if (!u.hostname || !u.username) return no('SUPABASE_DB_URL needs a host and a user');
  let user: string, password: string, database: string;
  try {
    user = decodeURIComponent(u.username);
    password = decodeURIComponent(u.password);
    database = decodeURIComponent(u.pathname.replace(/^\//, ''));
  } catch {
    return no('SUPABASE_DB_URL has a malformed percent escape');
  }
  if ([user, password, database].some((part) => CONTROL_RE.test(part))) return no('SUPABASE_DB_URL holds a control character');
  const sslmode = u.searchParams.get('sslmode') ?? 'require';
  if (!/^(require|verify-ca|verify-full)$/.test(sslmode)) return no('SUPABASE_DB_URL must use TLS: sslmode require, verify-ca or verify-full');
  const host = u.hostname.toLowerCase();
  const direct = /^db\.([a-z0-9]{8,40})\.supabase\.co$/.exec(host);
  const pooled = /\.pooler\.supabase\.com$/.test(host) ? /^postgres\.([a-z0-9]{8,40})$/.exec(user) : null;
  return {
    target: {
      env: { PGHOST: host, PGPORT: u.port || '5432', PGUSER: user, PGPASSWORD: password, PGDATABASE: database || 'postgres', PGSSLMODE: sslmode },
      projectRef: direct?.[1] ?? pooled?.[1] ?? null,
    },
    problem: null,
  };
}

export const UUID_RE =/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
