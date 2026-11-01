// GitHub settings for the release pipeline, as code: branch protection (AF-03), the environments and their
// deployment refs (AF-07, AF-22), and the rulesets that keep release tags and branches immutable (AF-23).
// Sources: docs/release/AUTOMATION.md 2.0 and 2.1, ADR 0026 (Proposed), docs/security/SECRETS_REVIEW.md sections 5
// and 8 (on #206 until it merges).
//
// The founder runs it from their own computer, signed in to `gh` as the repository owner. Agents never run
// `--apply`: settings are founder actions (D-107, ADR 0026 decision 11).
//
//   npx tsx scripts/release/github-settings.ts --approver <login>            # dry run: print every call
//   npx tsx scripts/release/github-settings.ts --approver <login> --apply    # make the calls
//   npx tsx scripts/release/github-settings.ts --approver <login> --verify   # read back, exit 1 on any drift
//
// It never reads, writes or prints a secret or variable. Secrets are added by hand, in Settings, only after
// `--verify` passes (SECRETS_REVIEW section 9, on #206 until it merges). Facts marked [U] in comments are not
// verified on GitHub's pages.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO = 'thesaurabhpareek/earlyletters';

export type Ref = { type: 'branch' | 'tag'; name: string };
export type EnvironmentSpec = { name: string; reviewer: boolean; refs: Ref[] };

/**
 * AUTOMATION.md 2.0 and SECRETS_REVIEW section 5. `staging` takes `develop` only: staging follows `develop`, and a
 * push to `main` deploys nothing to a database (17 Oct). `db-production` replaces `production`, which is Vercel's
 * environment (SR-2); `deploy-db.yml` names `db-production`.
 */
export const ENVIRONMENTS: EnvironmentSpec[] = [
  { name: 'staging', reviewer: true, refs: [{ type: 'branch', name: 'develop' }] },
  { name: 'db-production', reviewer: true, refs: [{ type: 'tag', name: 'db-v*' }] },
  { name: 'testflight', reviewer: true, refs: [{ type: 'branch', name: 'develop' }] },
  { name: 'testers', reviewer: true, refs: [{ type: 'branch', name: 'develop' }] },
  { name: 'app-store', reviewer: true, refs: [{ type: 'tag', name: 'ios-v*' }, { type: 'branch', name: 'release/*' }] },
  { name: 'packs', reviewer: true, refs: [{ type: 'branch', name: 'develop' }] },
  { name: 'health', reviewer: false, refs: [{ type: 'branch', name: 'develop' }] },
  { name: 'agents', reviewer: false, refs: [{ type: 'branch', name: 'develop' }] },
];

/** Environments other tools create. Never written here; a secret must never be added to them (SR-2). */
export const FOREIGN_ENVIRONMENTS = ['Production', 'Preview'];

/** Both report on every pull request today (AUTOMATION 2.1). #30 and RA-20-03 add more later. */
export const REQUIRED_CHECKS = ['required', 'applied migrations unchanged'];

export type BranchSpec = { branch: string; approvals: number; extraChecks?: string[] };
/**
 * `main` needs one approving review (the approver); `develop` none until AF-21 (D-107).
 * `develop` also requires `compliance-fence` (CR-27). Not `main`: a release PR into `main` carries compliance
 * paths while `main` has no FENCE.json yet, so the fence's bootstrap path fails it and a required check would
 * block every release.
 */
export const BRANCHES: BranchSpec[] = [
  { branch: 'develop', approvals: 0, extraChecks: ['compliance-fence'] },
  { branch: 'main', approvals: 1 },
];

/** Every check a branch requires: the shared ones plus its own. */
export const checksFor = (spec: BranchSpec) => [...REQUIRED_CHECKS, ...(spec.extraChecks ?? [])];

export type RulesetSpec = { name: string; target: 'branch' | 'tag'; include: string[]; rules: string[] };
/**
 * Immutability only (SECRETS_REVIEW SR-3): every session uses the owner account, so a ruleset cannot tell the
 * coordinator from any other session and is not a gate. Tags never move or disappear; release branches are
 * never force-pushed or deleted. No bypass list: not even an admin can move a tag (ADR 0022 decision 4).
 */
export const RULESETS: RulesetSpec[] = [
  { name: 'release tags are immutable', target: 'tag', include: ['refs/tags/ios-v*', 'refs/tags/db-v*'], rules: ['update', 'deletion'] },
  { name: 'release branches keep their history', target: 'branch', include: ['refs/heads/release/*'], rules: ['deletion', 'non_fast_forward'] },
];

export type Call = { method: 'GET' | 'PUT' | 'POST' | 'DELETE'; path: string; body?: unknown; why: string };

export function environmentBody(spec: EnvironmentSpec, approverId: number) {
  return {
    wait_timer: 0,
    prevent_self_review: spec.reviewer,
    reviewers: spec.reviewer ? [{ type: 'User', id: approverId }] : [],
    // [U] `can_admins_bypass` is accepted by github.com's REST API (go-github and the Terraform provider send it);
    // GitHub's own reference page does not list it, so --verify asks for a look in Settings as well.
    can_admins_bypass: false,
    deployment_branch_policy: { protected_branches: false, custom_branch_policies: true },
  };
}

export function protectionBody(spec: BranchSpec) {
  return {
    required_status_checks: { strict: false, contexts: checksFor(spec) },
    enforce_admins: true,
    required_pull_request_reviews: { required_approving_review_count: spec.approvals, dismiss_stale_reviews: spec.approvals > 0 },
    restrictions: null,
    allow_force_pushes: false,
    allow_deletions: false,
  };
}

export function rulesetBody(spec: RulesetSpec) {
  return {
    name: spec.name,
    target: spec.target,
    enforcement: 'active',
    bypass_actors: [],
    conditions: { ref_name: { include: spec.include, exclude: [] } },
    rules: spec.rules.map((type) => ({ type })),
  };
}

/** Every write the apply step makes, in order. Pure, so the dry run and the tests see exactly what runs. */
export function plan(approverId: number, existingRulesets: { id: number; name: string }[] = []): Call[] {
  const calls: Call[] = [];
  for (const env of ENVIRONMENTS) {
    calls.push({
      method: 'PUT',
      path: `repos/${REPO}/environments/${env.name}`,
      body: environmentBody(env, approverId),
      why: `environment ${env.name}: ${env.reviewer ? 'approver is the only reviewer, prevent self-review on' : 'no reviewer'}, selected refs only`,
    });
    for (const ref of env.refs) {
      calls.push({
        method: 'POST',
        path: `repos/${REPO}/environments/${env.name}/deployment-branch-policies`,
        body: { name: ref.name, type: ref.type },
        why: `environment ${env.name}: allow ${ref.type} ${ref.name}`,
      });
    }
  }
  for (const b of BRANCHES) {
    calls.push({
      method: 'PUT',
      path: `repos/${REPO}/branches/${b.branch}/protection`,
      body: protectionBody(b),
      why: `protect ${b.branch}: pull request, ${checksFor(b).join(' and ')}, ${b.approvals} approval(s), no bypass, no force push or deletion`,
    });
  }
  for (const r of RULESETS) {
    const existing = existingRulesets.find((e) => e.name === r.name);
    calls.push({
      method: existing ? 'PUT' : 'POST',
      path: existing ? `repos/${REPO}/rulesets/${existing.id}` : `repos/${REPO}/rulesets`,
      body: rulesetBody(r),
      why: `ruleset "${r.name}": ${r.rules.join(', ')} restricted on ${r.include.join(', ')}, no bypass`,
    });
  }
  return calls;
}

// ---- read-back -----------------------------------------------------------------------------------------

export type LiveEnvironment = {
  name: string;
  can_admins_bypass?: boolean;
  protection_rules?: { type: string; prevent_self_review?: boolean; reviewers?: { reviewer?: { login?: string } }[] }[];
  deployment_branch_policy?: { protected_branches: boolean; custom_branch_policies: boolean } | null;
};

/** Differences between one live environment and its spec. Empty means it matches. */
export function environmentDrift(spec: EnvironmentSpec, live: LiveEnvironment | undefined, policies: Ref[] | undefined, approver: string): string[] {
  if (!live) return [`environment ${spec.name}: missing`];
  const out: string[] = [];
  const rule = live.protection_rules?.find((r) => r.type === 'required_reviewers');
  const reviewers = (rule?.reviewers ?? []).map((r) => r.reviewer?.login).filter(Boolean);
  if (spec.reviewer) {
    if (reviewers.length !== 1 || reviewers[0]?.toLowerCase() !== approver.toLowerCase()) {
      out.push(`environment ${spec.name}: reviewers are [${reviewers.join(', ')}], expected only ${approver}`);
    }
    if (rule?.prevent_self_review !== true) out.push(`environment ${spec.name}: prevent self-review is not on`);
  } else if (reviewers.length > 0) {
    out.push(`environment ${spec.name}: has reviewers [${reviewers.join(', ')}], expected none`);
  }
  if (live.can_admins_bypass === true) out.push(`environment ${spec.name}: administrators can bypass`);
  const p = live.deployment_branch_policy;
  if (!p || p.custom_branch_policies !== true || p.protected_branches !== false) {
    out.push(`environment ${spec.name}: deployment refs are not "selected branches and tags"`);
  }
  const want = new Set(spec.refs.map((r) => `${r.type}:${r.name}`));
  const have = new Set((policies ?? []).map((r) => `${r.type}:${r.name}`));
  for (const w of want) if (!have.has(w)) out.push(`environment ${spec.name}: missing ref ${w}`);
  for (const h of have) if (!want.has(h)) out.push(`environment ${spec.name}: unexpected ref ${h}`);
  return out;
}

export type LiveProtection = {
  required_status_checks?: { contexts?: string[] } | null;
  enforce_admins?: { enabled: boolean };
  required_pull_request_reviews?: { required_approving_review_count?: number } | null;
  allow_force_pushes?: { enabled: boolean };
  allow_deletions?: { enabled: boolean };
};

export function protectionDrift(spec: BranchSpec, live: LiveProtection | undefined): string[] {
  if (!live) return [`branch ${spec.branch}: not protected`];
  const out: string[] = [];
  const contexts = live.required_status_checks?.contexts ?? [];
  for (const c of checksFor(spec)) if (!contexts.includes(c)) out.push(`branch ${spec.branch}: check "${c}" is not required`);
  if (live.enforce_admins?.enabled !== true) out.push(`branch ${spec.branch}: administrators can bypass`);
  if (!live.required_pull_request_reviews) out.push(`branch ${spec.branch}: pull requests are not required`);
  else if ((live.required_pull_request_reviews.required_approving_review_count ?? 0) < spec.approvals) {
    out.push(`branch ${spec.branch}: fewer than ${spec.approvals} required approval(s)`);
  }
  if (live.allow_force_pushes?.enabled) out.push(`branch ${spec.branch}: force pushes allowed`);
  if (live.allow_deletions?.enabled) out.push(`branch ${spec.branch}: deletion allowed`);
  return out;
}

export type LiveRuleset = {
  name: string;
  target: string;
  enforcement: string;
  bypass_actors?: unknown[];
  conditions?: { ref_name?: { include?: string[] } };
  rules?: { type: string }[];
};

export function rulesetDrift(spec: RulesetSpec, live: LiveRuleset | undefined): string[] {
  if (!live) return [`ruleset "${spec.name}": missing`];
  const out: string[] = [];
  if (live.target !== spec.target) out.push(`ruleset "${spec.name}": target is ${live.target}`);
  if (live.enforcement !== 'active') out.push(`ruleset "${spec.name}": enforcement is ${live.enforcement}`);
  if ((live.bypass_actors ?? []).length > 0) out.push(`ruleset "${spec.name}": has a bypass list`);
  const include = live.conditions?.ref_name?.include ?? [];
  for (const i of spec.include) if (!include.includes(i)) out.push(`ruleset "${spec.name}": does not cover ${i}`);
  const types = (live.rules ?? []).map((r) => r.type);
  for (const t of spec.rules) if (!types.includes(t)) out.push(`ruleset "${spec.name}": rule ${t} is missing`);
  return out;
}

/** `environment:` names in workflow files that the spec does not define, or that belong to another tool. */
export function workflowEnvironmentProblems(workflows: Record<string, string>): string[] {
  const known = new Set(ENVIRONMENTS.map((e) => e.name));
  const foreign = new Set(FOREIGN_ENVIRONMENTS.map((e) => e.toLowerCase()));
  const out: string[] = [];
  for (const [file, text] of Object.entries(workflows)) {
    for (const m of text.matchAll(/^\s*environment:\s*(?:\n\s*name:\s*)?['"]?([A-Za-z0-9_.-]+)['"]?\s*$/gm)) {
      const name = m[1];
      if (foreign.has(name.toLowerCase())) {
        out.push(`${file}: environment "${name}" resolves to another tool's environment (names are case-insensitive [U]); use one from the spec (SR-2)`);
      } else if (!known.has(name)) {
        out.push(`${file}: environment "${name}" is not in the spec; a run would create it with no protection (SR-11)`);
      }
    }
  }
  return out;
}

// ---- command line --------------------------------------------------------------------------------------

function gh(args: string[], input?: unknown): unknown {
  const out = execFileSync('gh', ['api', ...args, ...(input === undefined ? [] : ['--input', '-'])], {
    input: input === undefined ? undefined : JSON.stringify(input),
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return out.trim() ? JSON.parse(out) : null;
}

function ghOrNull(args: string[]): unknown {
  try {
    return gh(args);
  } catch {
    return null;
  }
}

function readWorkflows(root: string): Record<string, string> {
  const dir = join(root, '.github', 'workflows');
  const files: Record<string, string> = {};
  for (const f of readdirSync(dir)) if (/\.ya?ml$/.test(f)) files[`.github/workflows/${f}`] = readFileSync(join(dir, f), 'utf8');
  return files;
}

function main(argv: string[]) {
  const i = argv.indexOf('--approver');
  const approver = i >= 0 ? argv[i + 1] : undefined;
  if (!approver) {
    console.error('Usage: npx tsx scripts/release/github-settings.ts --approver <login> [--apply | --verify]');
    process.exit(2);
  }
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const me = (gh(['user']) as { login: string }).login;
  if (me.toLowerCase() === approver.toLowerCase()) {
    console.error(`The approver must be a second account, not ${me}: agent sessions act as ${me} (ADR 0026 decision 1, AF-02).`);
    process.exit(2);
  }
  const user = ghOrNull([`users/${approver}`]) as { id: number } | null;
  if (!user) {
    console.error(`No GitHub user ${approver}.`);
    process.exit(2);
  }
  const perm = ghOrNull([`repos/${REPO}/collaborators/${approver}/permission`]) as { permission?: string } | null;
  if (!perm || !['write', 'admin'].includes(perm.permission ?? '')) {
    console.error(`${approver} is not a collaborator with write access on ${REPO} (an invitation counts only once accepted). Invite it first (AF-02).`);
    process.exit(2);
  }

  if (argv.includes('--verify')) {
    const problems: string[] = [];
    const envs = ((ghOrNull([`repos/${REPO}/environments`]) as { environments?: LiveEnvironment[] } | null)?.environments) ?? [];
    for (const spec of ENVIRONMENTS) {
      const live = envs.find((e) => e.name === spec.name);
      const pol = live
        ? (((ghOrNull([`repos/${REPO}/environments/${spec.name}/deployment-branch-policies`]) as { branch_policies?: Ref[] } | null)?.branch_policies) ?? [])
        : undefined;
      problems.push(...environmentDrift(spec, live, pol, approver));
    }
    for (const b of BRANCHES) problems.push(...protectionDrift(b, (ghOrNull([`repos/${REPO}/branches/${b.branch}/protection`]) as LiveProtection | null) ?? undefined));
    const list = (ghOrNull([`repos/${REPO}/rulesets`]) as { id: number; name: string }[] | null) ?? [];
    for (const r of RULESETS) {
      const hit = list.find((e) => e.name === r.name);
      problems.push(...rulesetDrift(r, hit ? ((ghOrNull([`repos/${REPO}/rulesets/${hit.id}`]) as LiveRuleset | null) ?? undefined) : undefined));
    }
    problems.push(...workflowEnvironmentProblems(readWorkflows(root)));
    const stale = ghOrNull([`repos/${REPO}/branches?per_page=100`]) as { name: string }[] | null;
    for (const s of (stale ?? []).filter((b) => b.name.startsWith('release/') && !/^release\/\d+\.\d+$/.test(b.name))) {
      problems.push(`branch ${s.name}: matches release/* but is not release/<major>.<minor>; the ruleset keeps it from deletion`);
    }
    if (problems.length) {
      for (const p of problems) console.log(`DRIFT  ${p}`);
    } else {
      console.log('Settings match the spec.');
    }
    console.log('Also look in Settings > Environments: "Allow administrators to bypass" must be off on each (not readable by the API [U]).');
    process.exit(problems.length ? 1 : 0);
  }

  const existing = ((ghOrNull([`repos/${REPO}/rulesets`]) as { id: number; name: string }[] | null) ?? []).map(({ id, name }) => ({ id, name }));
  const calls = plan(user.id, existing);
  const apply = argv.includes('--apply');
  for (const c of calls) {
    console.log(`${apply ? 'APPLY' : 'PLAN '}  ${c.method} ${c.path}  # ${c.why}`);
    if (!apply) continue;
    try {
      gh(['-X', c.method, c.path], c.body);
    } catch (e) {
      const msg = (e as { stderr?: string }).stderr ?? String(e);
      // A deployment ref that already exists answers 303 or 422 [U]; anything else stops the run.
      if (c.path.endsWith('/deployment-branch-policies') && /already exists|303|422/i.test(msg)) {
        console.log('       already present');
        continue;
      }
      console.error(msg);
      process.exit(1);
    }
  }
  console.log(apply ? 'Done. Now run with --verify.' : 'Dry run. Add --apply to make these calls.');
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main(process.argv.slice(2));
