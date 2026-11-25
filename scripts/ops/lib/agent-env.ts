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
 * - a `jobs:` block with no two-space job keys, or a secret read inside `jobs:` before the first job key, is
 *   reported as `unparsed`. The workflows here use two-space indents and one job per `  name:` key.
 */

/** The only secrets an agent job may read: its model keys and its own GitHub App identity. */
export const AGENT_SECRET_ALLOWLIST = ['ANTHROPIC_API_KEY', 'CLAUDE_CODE_OAUTH_TOKEN', 'OPENROUTER_API_KEY', 'AGENTS_APP_PRIVATE_KEY'];

/** A secret name with production power: the service role and secret keys, signing keys, the backup key, the password manager, prod. */
export const PRODUCTION_POWER =
  /SERVICE_ROLE|SERVICE_KEY|SECRET|SIGNING|PRIVATE_KEY|BACKUP|ESCROW|KEK|PASSWORD|_PROD\b|\bPROD_|PRODUCTION|1PASSWORD|OP_SERVICE_ACCOUNT|BITWARDEN|VAULT/i;

/** Workflows whose every job runs an agent, whatever its steps say. */
export const AGENT_WORKFLOWS = ['agents.yml', 'claude.yml'];

/** A step that runs an agent engine. */
const AGENT_STEP = /anthropics\/claude-code-action|\bopencode\b|@anthropic-ai\/claude-code|\bclaude\s+(?:-p|--print)\b/i;

/** GitHub's own token is not a stored secret. */
const NOT_A_STORED_SECRET = new Set(['GITHUB_TOKEN']);

export type Job = { name: string; text: string; environment: boolean; secrets: string[]; runsAgent: boolean };
export type Rule = 'agent-allowlist' | 'all-secrets' | 'production-environment' | 'unparsed';
export type Finding = { file: string; job: string; rule: Rule; secret?: string };

const SECRET_REF = /\bsecrets\s*(?:\.([A-Za-z_][A-Za-z0-9_-]*)|\[\s*(['"])([A-Za-z_][A-Za-z0-9_-]*)\2\s*\])/gi;
const ALL_SECRETS = /secrets:\s*inherit|toJSON\(\s*secrets\s*\)|\bsecrets\s*\[\s*(?!['"][A-Za-z_][A-Za-z0-9_-]*['"]\s*\])/i;

/** Every stored secret NAME the text reads, upper-cased and sorted. */
export function secretsIn(text: string): string[] {
  const names = [...text.matchAll(SECRET_REF)].map((m) => (m[1] ?? m[3]).toUpperCase());
  return [...new Set(names.filter((s) => !NOT_A_STORED_SECRET.has(s)))].sort();
}

/**
 * Splits a workflow into the text outside any job, the text inside `jobs:` before the first job key, and the jobs.
 * The `jobs:` block ends at the next top-level line that is not a comment.
 */
export function split(workflow: string): { outside: string; beforeFirstJob: string; jobs: Job[]; hasJobsKey: boolean } {
  const lines = workflow.replace(/\r\n?/g, '\n').split('\n');
  const start = lines.findIndex((l) => /^jobs:\s*(?:#.*)?$/.test(l));
  if (start < 0) return { outside: lines.join('\n'), beforeFirstJob: '', jobs: [], hasJobsKey: false };
  let end = lines.findIndex((l, i) => i > start && /^[^\s#]/.test(l));
  if (end < 0) end = lines.length;
  const blocks: { name: string; lines: string[] }[] = [];
  const before: string[] = [];
  for (const line of lines.slice(start + 1, end)) {
    const head = line.match(/^ {2}([A-Za-z0-9_-]+):\s*(?:#.*)?$/);
    if (head) blocks.push({ name: head[1], lines: [] });
    else if (blocks.length) blocks.at(-1)!.lines.push(line);
    else before.push(line);
  }
  const jobs = blocks.map(({ name, lines: body }) => {
    const text = body.join('\n');
    return {
      name,
      text,
      environment: body.some((l) => /^ {4}environment:\s*[^\s#]/.test(l)) || /^ {4}environment:\s*(?:#.*)?\n {6}name:\s*[^\s#]/m.test(text),
      secrets: secretsIn(text),
      runsAgent: AGENT_STEP.test(text),
    };
  });
  return { outside: [...lines.slice(0, start), ...lines.slice(end)].join('\n'), beforeFirstJob: before.join('\n'), jobs, hasJobsKey: true };
}

/** The jobs of a workflow: the two-space keys under the top-level `jobs:` line. */
export const jobsOf = (workflow: string): Job[] => split(workflow).jobs;

/** Every finding in one workflow file. `file` is its base name, which decides whether it is an agent workflow. */
export function scanWorkflow(file: string, workflow: string): Finding[] {
  const out: Finding[] = [];
  const { outside, beforeFirstJob, jobs, hasJobsKey } = split(workflow);
  if (ALL_SECRETS.test(workflow)) out.push({ file, job: '*', rule: 'all-secrets' });
  if (!hasJobsKey || !jobs.length) {
    out.push({ file, job: '*', rule: 'unparsed' });
    return out;
  }
  if (secretsIn(beforeFirstJob).length) out.push({ file, job: '*', rule: 'unparsed' });
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
  if (f.rule === 'unparsed') return `${f.file}: could not split this workflow into two-space jobs, so it is not checked; treat as a failure`;
  if (f.rule === 'agent-allowlist') return `${f.file} ${f.job}: agent job reads ${f.secret}, which is not on the agent allowlist`;
  return `${f.file} ${f.job}: reads ${f.secret} with no environment, so it would be a repository secret`;
}
