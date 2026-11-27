/**
 * Agents hold no production power (BL-1330, FR-BKO-21; the rule is written once in docs/ops/ACCESS.md).
 *
 * Parses each workflow with the `yaml` package (strict: duplicate keys, bad indentation and unclosed quotes are
 * errors) and reports, by file, job and secret NAME (never a value):
 * 1. an agent job that reads a secret outside the agent allowlist, or that names an environment;
 * 2. any job that hands out every secret (`secrets:` that is not a mapping of names, such as `inherit` in any
 *    spelling, or an expression that reads the whole context: `toJSON(secrets)`, `secrets.*`, `secrets[x]`);
 * 3. any other job that reads a production-power secret without a literal environment name (so the secret would
 *    be a repository secret that any job, an agent's included, could be edited to read);
 * 4. a workflow that does not parse, or has no `jobs:` mapping of job mappings, reported as `unparsed`.
 *
 * Reading the parsed document instead of lines closes the layout tricks a line reader misses: anchors, aliases
 * are resolved into every job that uses them (a merge key, which GitHub does not support, is unparsed), quoted and flow-style job keys are ordinary keys, and
 * a quoted scalar that runs over several lines stays one value. Secret reads are found inside `${{ }}` in every
 * string, keys included, wherever it sits (GitHub expands expressions inside block scalars such as `prompt: |`).
 * An expression ends at the first `}}` outside a single-quoted string, as GitHub's reader does. Names match in any
 * case, as GitHub does. A secret read outside any job (a workflow-level `env:`) counts for every job.
 *
 * Limits, also listed in ACCESS.md: an agent engine run from a composite, local or other action, or an engine
 * other than Claude Code and OpenCode, is not recognised; a reusable workflow a job calls is not followed; data
 * passed between jobs through outputs or artifacts is not followed; a production secret with a harmless name is not
 * caught in a non-agent job; where this parser and GitHub's read the same text differently, this one is the guide.
 */
// The browser build is plain ESM and reads no environment variables, so it runs under Deno's --allow-read alone and
// under Node. `yaml` is pinned by package-lock.json (apps/web depends on it); a missing install fails the import.
// @deno-types="../../../node_modules/yaml/dist/index.d.ts"
import { parseDocument } from '../../../node_modules/yaml/browser/dist/index.js';

/** The only secrets an agent job may read: its model keys and its own GitHub App identity. */
export const AGENT_SECRET_ALLOWLIST = ['ANTHROPIC_API_KEY', 'CLAUDE_CODE_OAUTH_TOKEN', 'OPENROUTER_API_KEY', 'AGENTS_APP_PRIVATE_KEY'];

/** A secret name with production power: service role and secret keys, signing and backup keys, account tokens, database URLs, prod, password managers. */
export const PRODUCTION_POWER =
  /SERVICE_ROLE|SERVICE_KEY|SECRET|SIGNING|PRIVATE_KEY|BACKUP|ESCROW|KEK|PASSWORD|(?:^|_)PROD(?:_|$)|PRODUCTION|ACCESS_TOKEN|DB_URL|VERCEL_TOKEN|1PASSWORD|OP_SERVICE_ACCOUNT|OP_CONNECT|BITWARDEN|LASTPASS|DASHLANE|KEEPER|VAULT/i;

/** Workflows whose every job runs an agent, whatever its steps say. */
export const AGENT_WORKFLOWS = ['agents.yml', 'claude.yml'];

/**
 * A job runs an agent engine: Anthropic's actions, the npm or Python packages, the native installer, OpenCode, or
 * `claude` as a word anywhere in the job's strings (behind `sudo`, `timeout`, `env`, a path or a quote, and even in
 * a step name or an echo: a false alarm here costs an edit, a miss costs a key).
 */
const AGENT_STEP =
  /anthropics\/claude-code-|@anthropic-ai\/claude-(?:code|agent-sdk)|claude[-_]agent[-_]sdk|claude\.ai\/install|\bopencode\b|(?:^|[\s`'"(/;&|{!=])claude(?=[\s`'";)|&}]|$)/i;

/** GitHub's own token is not a stored secret. */
const NOT_A_STORED_SECRET = new Set(['GITHUB_TOKEN']);

export type Job = { name: string; environment: boolean; secrets: string[]; runsAgent: boolean; handsOutAll: boolean };
export type Rule = 'agent-allowlist' | 'agent-environment' | 'all-secrets' | 'production-environment' | 'unparsed';
export type Finding = { file: string; job: string; rule: Rule; secret?: string };

const NAMED_READ = /\bsecrets\s*(?:\.\s*([A-Za-z_][A-Za-z0-9_-]*)|\[\s*'([A-Za-z_][A-Za-z0-9_-]*)'\s*\])/gi;
const LITERAL_ENV = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/;

/** The body of every `${{ }}` in a string. An expression ends at `}}` outside a single-quoted string; an unclosed one runs to the end. */
export function expressionsIn(text: string): string[] {
  const out: string[] = [];
  let i = text.indexOf('${{');
  while (i >= 0) {
    let j = i + 3;
    let quoted = false;
    for (; j < text.length; j++) {
      if (text[j] === "'") quoted = !quoted; // a doubled '' toggles twice and stays inside the string
      else if (!quoted && text[j] === '}' && text[j + 1] === '}') break;
    }
    out.push(text.slice(i + 3, j));
    i = text.indexOf('${{', j + 2);
  }
  return out;
}

/** The named secrets an expression reads, and whether it reads the whole context. */
function readsOf(expr: string): { names: string[]; whole: boolean } {
  const names = [...expr.matchAll(NAMED_READ)].map((m) => (m[1] ?? m[2]).toUpperCase());
  const rest = expr.replace(NAMED_READ, ' ').replace(/'(?:[^']|'')*'?/g, "''");
  return { names, whole: /\bsecrets\b/i.test(rest) };
}

/** Every string in a parsed value, mapping keys included. */
function stringsOf(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const v of value) stringsOf(v, out);
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      out.push(k);
      stringsOf(v, out);
    }
  }
  return out;
}

/** The stored secret NAMES a parsed value reads, upper-cased and sorted, and whether it reads the whole context. */
export function secretsOf(value: unknown): { names: string[]; whole: boolean } {
  const reads = stringsOf(value).flatMap(expressionsIn).map(readsOf);
  const names = [...new Set(reads.flatMap((r) => r.names).filter((s) => !NOT_A_STORED_SECRET.has(s)))].sort();
  return { names, whole: reads.some((r) => r.whole) };
}

const isMap = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === 'object' && !Array.isArray(v);

function hasLiteralEnvironment(env: unknown): boolean {
  const name = isMap(env) ? env.name : env;
  return typeof name === 'string' && LITERAL_ENV.test(name);
}

/**
 * True when the value holds only what a workflow can mean: plain objects, arrays, strings, numbers, booleans and
 * null. A tagged collection (`!!omap`, `!!set`) becomes a Map or Set, and a timestamp a Date, which the string
 * walk would skip; a merge key `<<` is one GitHub does not support. Each makes the workflow unparsed, never passed.
 */
function plainOnly(value: unknown): boolean {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return true;
  if (Array.isArray(value)) return value.every(plainOnly);
  if (typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) return false;
  return Object.entries(value as Record<string, unknown>).every(([k, v]) => k !== '<<' && plainOnly(v));
}

/** The parsed workflow, or null when it does not parse cleanly or has no `jobs:` mapping of job mappings. */
export function parse(workflow: string): { root: Record<string, unknown>; jobs: Record<string, Record<string, unknown>> } | null {
  let root: unknown;
  try {
    const doc = parseDocument(workflow, { uniqueKeys: true, merge: false, prettyErrors: false });
    if (doc.errors.length || doc.warnings.length) return null;
    root = doc.toJS({ maxAliasCount: 100 });
  } catch {
    return null;
  }
  if (!plainOnly(root) || !isMap(root) || !isMap(root.jobs)) return null;
  const jobs = root.jobs as Record<string, unknown>;
  if (!Object.keys(jobs).length || !Object.values(jobs).every(isMap)) return null;
  return { root, jobs: jobs as Record<string, Record<string, unknown>> };
}

/** The jobs of a workflow, or [] when it does not parse. */
export function jobsOf(workflow: string): Job[] {
  const parsed = parse(workflow);
  if (!parsed) return [];
  return Object.entries(parsed.jobs).map(([name, job]) => {
    const { names, whole } = secretsOf(job);
    return {
      name,
      environment: hasLiteralEnvironment(job.environment),
      secrets: names,
      runsAgent: stringsOf(job).some((s) => AGENT_STEP.test(s)),
      handsOutAll: whole || ('secrets' in job && !isMap(job.secrets)),
    };
  });
}

/** Every finding in one workflow file. `file` is its base name, which decides whether it is an agent workflow. */
export function scanWorkflow(file: string, workflow: string): Finding[] {
  const parsed = parse(workflow);
  if (!parsed) return [{ file, job: '*', rule: 'unparsed' }];
  const out: Finding[] = [];
  const { jobs: _jobs, ...outside } = parsed.root;
  const everyJob = secretsOf(outside);
  if (everyJob.whole) out.push({ file, job: '*', rule: 'all-secrets' });
  const agentFile = AGENT_WORKFLOWS.includes(file);
  for (const job of jobsOf(workflow)) {
    const agent = agentFile || job.runsAgent;
    if (job.handsOutAll) out.push({ file, job: job.name, rule: 'all-secrets' });
    if (agent && parsed.jobs[job.name].environment !== undefined) out.push({ file, job: job.name, rule: 'agent-environment' });
    for (const secret of [...new Set([...job.secrets, ...everyJob.names])].sort()) {
      if (agent && !AGENT_SECRET_ALLOWLIST.includes(secret)) out.push({ file, job: job.name, rule: 'agent-allowlist', secret });
      else if (!agent && PRODUCTION_POWER.test(secret) && (!job.environment || everyJob.names.includes(secret))) {
        out.push({ file, job: job.name, rule: 'production-environment', secret });
      }
    }
  }
  return out;
}

export function explain(f: Finding): string {
  if (f.rule === 'unparsed') return `${f.file}: does not parse as a workflow with a jobs mapping, so it is not checked; treat as a failure`;
  const where = f.job === '*' ? f.file : `${f.file} ${f.job}`;
  if (f.rule === 'all-secrets') return `${where}: hands out every secret (secrets: inherit, toJSON(secrets), secrets.* or a computed secrets[...])`;
  if (f.rule === 'agent-environment') return `${where}: agent job names an environment, which would give it that environment's secrets and variables`;
  if (f.rule === 'agent-allowlist') return `${where}: agent job reads ${f.secret}, which is not on the agent allowlist`;
  return `${where}: reads ${f.secret} with no environment, so it would be a repository secret`;
}
