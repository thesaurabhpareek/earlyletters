/**
 * Agents hold no production power (BL-1330, FR-BKO-21; the rule is written once in docs/ops/ACCESS.md).
 *
 * Reads workflow files as text and reports, by file, job and secret NAME (never a value):
 * 1. an agent job that reads a secret outside the agent allowlist;
 * 2. any workflow that hands a job every secret (`secrets: inherit`, `toJSON(secrets)`, a computed `secrets[...]`);
 * 3. any job that reads a production-power secret without naming an `environment:` (so the secret would be a
 *    repository secret that any job, an agent's included, could be edited to read);
 * 4. a workflow this reader cannot split into jobs, reported as `unparsed` instead of passing.
 *
 * The failure it guards against is silent: a service role key or signing key added to an agent job works, and
 * nothing else would notice until it leaked. So the reader fails closed:
 * - a secret read outside any job (a workflow-level `env:`) counts as read by every job;
 * - no line is skipped as a comment, because GitHub expands `${{ }}` inside block scalars such as a `prompt: |`,
 *   even on a line that starts with `#`; a commented-out read therefore counts as a read;
 * - secret names are matched without regard to case, as GitHub does;
 * - `secrets` inside an expression that is not followed by `.NAME` or `['NAME']` (as in `toJSON(secrets)`,
 *   `secrets.*` or `secrets[format(...)]`) hands out every secret, and so does `secrets: inherit`, quoted or not;
 * - an environment counts only when it is a literal name (`environment: ''`, `~` or an expression does not);
 * - a workflow is reported as `unparsed`, never passed, when it has no two-space job keys under `jobs:`, a line
 *   inside `jobs:` indented under four spaces that is not a bare `  name:` job key (a quoted or flow-style job),
 *   a secret read before the first job key, or any YAML anchor, alias or merge key (which would carry text from
 *   one job into another). The workflows here use two-space indents, one job per `  name:` key, and no anchors.
 *
 * Limits, also listed in ACCESS.md: an agent engine run from a composite, local or other action, or an engine
 * other than Claude Code and OpenCode, is not recognised; data passed between jobs through outputs or artifacts is
 * not followed; a production secret with a harmless name is not caught in a non-agent job.
 */

/** The only secrets an agent job may read: its model keys and its own GitHub App identity. */
export const AGENT_SECRET_ALLOWLIST = ['ANTHROPIC_API_KEY', 'CLAUDE_CODE_OAUTH_TOKEN', 'OPENROUTER_API_KEY', 'AGENTS_APP_PRIVATE_KEY'];

/** A secret name with production power: the service role and secret keys, signing keys, the backup key, the password manager, prod. */
export const PRODUCTION_POWER =
  /SERVICE_ROLE|SERVICE_KEY|SECRET|SIGNING|PRIVATE_KEY|BACKUP|ESCROW|KEK|PASSWORD|(?:^|_)PROD(?:_|$)|PRODUCTION|ACCESS_TOKEN|DB_URL|VERCEL_TOKEN|1PASSWORD|OP_SERVICE_ACCOUNT|OP_CONNECT|BITWARDEN|VAULT/i;

/** Workflows whose every job runs an agent, whatever its steps say. */
export const AGENT_WORKFLOWS = ['agents.yml', 'claude.yml'];

/** A step that runs an agent engine. */
const AGENT_STEP =
  /anthropics\/claude-code-|\bopencode\b|@anthropic-ai\/claude-(?:code|agent-sdk)|claude[-_]agent[-_]sdk|\bclaude\b[^\n]*\s(?:-p|--print|--dangerously-skip-permissions)\b/i;

/** GitHub's own token is not a stored secret. */
const NOT_A_STORED_SECRET = new Set(['GITHUB_TOKEN']);

export type Job = { name: string; text: string; environment: boolean; secrets: string[]; runsAgent: boolean };
export type Rule = 'agent-allowlist' | 'all-secrets' | 'production-environment' | 'unparsed';
export type Finding = { file: string; job: string; rule: Rule; secret?: string };

/** A read of one named secret. Outside an expression the dot must touch the name, so prose ("secrets. Each") is not one. */
const SECRET_REF = /\bsecrets\s*(?:\.([A-Za-z_][A-Za-z0-9_-]*)|\[\s*(['"])([A-Za-z_][A-Za-z0-9_-]*)\2\s*\])/gi;
const SECRET_REF_IN_EXPR = /\bsecrets\s*(?:\.\s*([A-Za-z_][A-Za-z0-9_-]*)|\[\s*(['"])([A-Za-z_][A-Za-z0-9_-]*)\2\s*\])/gi;
/** In an expression, `secrets` not followed by one name: the whole context (`toJSON(secrets)`, `secrets.*`, `secrets[x]`). */
const WHOLE_CONTEXT = /\bsecrets\b(?!\s*\.\s*[A-Za-z_])(?!\s*\[\s*(['"])[A-Za-z_][A-Za-z0-9_-]*\1\s*\])/i;
const INHERIT = /['"]?\bsecrets['"]?\s*:\s*['"]?inherit\b/i;
const EXPRESSION = /\$\{\{([\s\S]*?)\}\}/g;
/** A YAML anchor, alias or merge key in a node position. */
const ANCHOR_OR_ALIAS = /(?:^|[:\-[,{]\s*|\s)[&*][A-Za-z0-9_-]+\s*(?:$|[,\]}#])|(?:^|\s)<<\s*:/m;

const expressions = (text: string) => [...text.matchAll(EXPRESSION)].map((m) => m[1]);

/** Every stored secret NAME the text reads, upper-cased and sorted. */
export function secretsIn(text: string): string[] {
  const refs = [...text.matchAll(SECRET_REF), ...expressions(text).flatMap((e) => [...e.matchAll(SECRET_REF_IN_EXPR)])];
  const names = refs.map((m) => (m[1] ?? m[3]).toUpperCase());
  return [...new Set(names.filter((s) => !NOT_A_STORED_SECRET.has(s)))].sort();
}

/** True when the text hands a job every secret at once. */
export function handsOutAll(text: string): boolean {
  return INHERIT.test(text) || expressions(text).some((e) => WHOLE_CONTEXT.test(e));
}

/** A literal environment name; an empty, null or computed one does not put the job behind an environment. */
const ENV_NAME = String.raw`(?!['"]?null['"]?\s*(?:#.*)?$)['"]?[A-Za-z0-9][A-Za-z0-9_.-]*['"]?\s*(?:#.*)?$`;
const ENV_INLINE = new RegExp(String.raw`^ {4}environment:\s*` + ENV_NAME, 'i');
const ENV_BLOCK = new RegExp(String.raw`^ {4}environment:\s*(?:#.*)?\n(?: {6}.*\n)*? {6}name:\s*` + ENV_NAME, 'mi');

/**
 * Splits a workflow into the text outside any job, the text inside `jobs:` before the first job key, and the jobs.
 * The `jobs:` block ends at the next top-level line that is not a comment.
 */
export function split(workflow: string): { outside: string; beforeFirstJob: string; jobs: Job[]; hasJobsKey: boolean; strays: number } {
  const lines = workflow.replace(/\r\n?/g, '\n').split('\n');
  const start = lines.findIndex((l) => /^jobs:\s*(?:#.*)?$/.test(l));
  if (start < 0) return { outside: lines.join('\n'), beforeFirstJob: '', jobs: [], hasJobsKey: false, strays: 0 };
  let end = lines.findIndex((l, i) => i > start && /^[^\s#]/.test(l));
  if (end < 0) end = lines.length;
  const blocks: { name: string; lines: string[] }[] = [];
  const before: string[] = [];
  let strays = 0;
  for (const line of lines.slice(start + 1, end)) {
    const head = line.match(/^ {2}([A-Za-z0-9_-]+):\s*(?:#.*)?$/);
    if (!head && /^ {0,3}[^\s#]/.test(line)) strays++;
    if (head) blocks.push({ name: head[1], lines: [] });
    else if (blocks.length) blocks.at(-1)!.lines.push(line);
    else before.push(line);
  }
  const jobs = blocks.map(({ name, lines: body }) => {
    const text = body.join('\n');
    return {
      name,
      text,
      environment: body.some((l) => ENV_INLINE.test(l)) || ENV_BLOCK.test(text + '\n'),
      secrets: secretsIn(text),
      runsAgent: AGENT_STEP.test(text),
    };
  });
  return { outside: [...lines.slice(0, start), ...lines.slice(end)].join('\n'), beforeFirstJob: before.join('\n'), jobs, hasJobsKey: true, strays };
}

/** The jobs of a workflow: the two-space keys under the top-level `jobs:` line. */
export const jobsOf = (workflow: string): Job[] => split(workflow).jobs;

/** Every finding in one workflow file. `file` is its base name, which decides whether it is an agent workflow. */
export function scanWorkflow(file: string, workflow: string): Finding[] {
  const out: Finding[] = [];
  const { outside, beforeFirstJob, jobs, hasJobsKey, strays } = split(workflow);
  if (handsOutAll(workflow)) out.push({ file, job: '*', rule: 'all-secrets' });
  if (!hasJobsKey || !jobs.length) {
    out.push({ file, job: '*', rule: 'unparsed' });
    return out;
  }
  if (strays || secretsIn(beforeFirstJob).length || ANCHOR_OR_ALIAS.test(workflow)) out.push({ file, job: '*', rule: 'unparsed' });
  const agentFile = AGENT_WORKFLOWS.includes(file);
  const everyJob = secretsIn(outside);
  for (const job of jobs) {
    const agent = agentFile || job.runsAgent;
    for (const secret of [...new Set([...job.secrets, ...everyJob])].sort()) {
      if (agent && !AGENT_SECRET_ALLOWLIST.includes(secret)) out.push({ file, job: job.name, rule: 'agent-allowlist', secret });
      else if (!agent && PRODUCTION_POWER.test(secret) && (!job.environment || everyJob.includes(secret))) {
        out.push({ file, job: job.name, rule: 'production-environment', secret });
      }
    }
  }
  return out;
}

export function explain(f: Finding): string {
  if (f.rule === 'all-secrets') return `${f.file}: hands a job every secret (secrets: inherit, toJSON(secrets) or a computed secrets[...])`;
  if (f.rule === 'unparsed') return `${f.file}: could not split this workflow into two-space jobs (or it uses a YAML anchor or alias), so it is not checked; treat as a failure`;
  if (f.rule === 'agent-allowlist') return `${f.file} ${f.job}: agent job reads ${f.secret}, which is not on the agent allowlist`;
  return `${f.file} ${f.job}: reads ${f.secret} with no environment, so it would be a repository secret`;
}
