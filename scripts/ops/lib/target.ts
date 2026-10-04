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

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
