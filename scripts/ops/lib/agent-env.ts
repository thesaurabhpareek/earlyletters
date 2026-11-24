/**
 * Agents hold no production power (BL-1330, FR-BKO-21; the rule is written once in docs/ops/ACCESS.md).
 *
 * Reads workflow files as text and reports, by file, job and secret NAME (never a value):
 * 1. an agent job that reads a secret outside the agent allowlist;
 * 2. an agent workflow that hands a job every secret (`secrets: inherit`, `toJSON(secrets)`, `secrets[...]`);
 * 3. any job that reads a production-power secret without naming an `environment:` (so the secret would be a
 *    repository secret that any job, an agent's included, could be edited to read).
 *
 * The failure it guards against is silent: a service role key or signing key added to an agent job works, and
 * nothing else would notice until it leaked. Line-based on purpose: the workflows here use two-space indents and
 * one job per `  name:` key under `jobs:`, and the test runs on every workflow in the repo, so a layout this
 * reader cannot split shows up as a job with no steps, not as a pass.
 */

/** The only secrets an agent job may read: its model keys and its own GitHub App identity. */
export const AGENT_SECRET_ALLOWLIST = ['ANTHROPIC_API_KEY', 'CLAUDE_CODE_OAUTH_TOKEN', 'OPENROUTER_API_KEY', 'AGENTS_APP_PRIVATE_KEY'];

/** A secret name with production power: the service role, signing keys, the backup key, the password manager, prod. */
export const PRODUCTION_POWER =
  /SERVICE_ROLE|SERVICE_KEY|SIGNING|PRIVATE_KEY|BACKUP|ESCROW|KEK|PASSWORD|_PROD\b|_PRODUCTION\b|1PASSWORD|OP_SERVICE_ACCOUNT|BITWARDEN|VAULT/;

/** Workflows whose every job runs an agent, whatever its steps say. */
export const AGENT_WORKFLOWS = ['agents.yml', 'claude.yml'];

/** A step that runs an agent engine. */
const AGENT_STEP = /anthropics\/claude-code-action|\bopencode\b/i;

/** The secrets a job may read that the allowlist is checked against; GitHub's own token is not a stored secret. */
const NOT_A_STORED_SECRET = new Set(['GITHUB_TOKEN']);

export type Job = { name: string; text: string; environment: boolean; secrets: string[]; runsAgent: boolean };
export type Finding = { file: string; job: string; rule: 'agent-allowlist' | 'agent-all-secrets' | 'production-environment'; secret?: string };

const SECRET_REF = /\bsecrets\.([A-Za-z_][A-Za-z0-9_]*)/g;
const ALL_SECRETS = /secrets:\s*inherit|toJSON\(\s*secrets\s*\)|\bsecrets\s*\[/;

/** Splits a workflow into its jobs: the two-space keys under the top-level `jobs:` line. */
export function jobsOf(workflow: string): Job[] {
  const lines = workflow.split('\n');
  const start = lines.findIndex((l) => /^jobs:\s*(?:#.*)?$/.test(l));
  if (start < 0) return [];
  const jobs: { name: string; lines: string[] }[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) break; // the next top-level key ends `jobs:`
    const head = line.match(/^ {2}([A-Za-z0-9_-]+):\s*(?:#.*)?$/);
    if (head) jobs.push({ name: head[1], lines: [] });
    else if (jobs.length) jobs.at(-1)!.lines.push(line);
  }
  return jobs.map(({ name, lines: body }) => {
    const text = body.filter((l) => !/^\s*#/.test(l)).join('\n');
    return {
      name,
      text,
      environment: body.some((l) => /^ {4}environment:\s*\S/.test(l)) || /^ {4}environment:\s*$\n {6}name:\s*\S/m.test(body.join('\n')),
      secrets: [...new Set([...text.matchAll(SECRET_REF)].map((m) => m[1]).filter((s) => !NOT_A_STORED_SECRET.has(s)))].sort(),
      runsAgent: AGENT_STEP.test(text),
    };
  });
}

/** Every finding in one workflow file. `file` is its base name, which decides whether it is an agent workflow. */
export function scanWorkflow(file: string, workflow: string): Finding[] {
  const out: Finding[] = [];
  const agentFile = AGENT_WORKFLOWS.includes(file);
  if (agentFile && ALL_SECRETS.test(workflow.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n'))) {
    out.push({ file, job: '*', rule: 'agent-all-secrets' });
  }
  for (const job of jobsOf(workflow)) {
    const agent = agentFile || job.runsAgent;
    if (agent && ALL_SECRETS.test(job.text) && !agentFile) out.push({ file, job: job.name, rule: 'agent-all-secrets' });
    for (const secret of job.secrets) {
      if (agent && !AGENT_SECRET_ALLOWLIST.includes(secret)) out.push({ file, job: job.name, rule: 'agent-allowlist', secret });
      else if (!agent && PRODUCTION_POWER.test(secret) && !job.environment) {
        out.push({ file, job: job.name, rule: 'production-environment', secret });
      }
    }
  }
  return out;
}

export function explain(f: Finding): string {
  if (f.rule === 'agent-all-secrets') return `${f.file} ${f.job}: an agent workflow hands out every secret`;
  if (f.rule === 'agent-allowlist') return `${f.file} ${f.job}: agent job reads ${f.secret}, which is not on the agent allowlist`;
  return `${f.file} ${f.job}: reads ${f.secret} with no environment, so it would be a repository secret`;
}
