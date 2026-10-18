// scripts/release/github-settings.ts: the GitHub settings the release pipeline needs, as code (AF-03, AF-07,
// AF-22, AF-23; docs/security/SECRETS_REVIEW.md section 5). These tests pin the plan and the drift checks;
// nothing here calls GitHub.
import { describe, expect, it } from 'vitest';
import {
  BRANCHES,
  ENVIRONMENTS,
  environmentBody,
  environmentDrift,
  plan,
  protectionDrift,
  REQUIRED_CHECKS,
  RULESETS,
  rulesetBody,
  rulesetDrift,
  workflowEnvironmentProblems,
} from '../../../scripts/release/github-settings';

const APPROVER_ID = 4242;

describe('environments (SECRETS_REVIEW section 5)', () => {
  it('lists every environment the plan names, and never Vercel\'s', () => {
    expect(ENVIRONMENTS.map((e) => e.name)).toEqual(['staging', 'db-production', 'testflight', 'testers', 'app-store', 'packs', 'health', 'agents']);
    expect(ENVIRONMENTS.map((e) => e.name.toLowerCase())).not.toContain('production');
  });

  it('gives the approver, alone, to every environment with a reviewer, with self-review prevented and no admin bypass', () => {
    for (const env of ENVIRONMENTS) {
      const body = environmentBody(env, APPROVER_ID);
      expect(body.can_admins_bypass).toBe(false);
      expect(body.wait_timer).toBe(0);
      expect(body.deployment_branch_policy).toEqual({ protected_branches: false, custom_branch_policies: true });
      if (env.reviewer) {
        expect(body.reviewers).toEqual([{ type: 'User', id: APPROVER_ID }]);
        expect(body.prevent_self_review).toBe(true);
      } else {
        expect(body.reviewers).toEqual([]);
      }
    }
    expect(ENVIRONMENTS.filter((e) => !e.reviewer).map((e) => e.name)).toEqual(['health', 'agents']);
  });

  it('allows app-store only release tags and release branches, and db-production only db tags', () => {
    const refs = (n: string) => ENVIRONMENTS.find((e) => e.name === n)!.refs;
    expect(refs('app-store')).toEqual([{ type: 'tag', name: 'ios-v*' }, { type: 'branch', name: 'release/*' }]);
    expect(refs('db-production')).toEqual([{ type: 'tag', name: 'db-v*' }]);
    expect(refs('staging')).toEqual([{ type: 'branch', name: 'develop' }, { type: 'branch', name: 'main' }]);
    for (const e of ENVIRONMENTS) for (const r of e.refs) expect(r.name).not.toMatch(/refs\/pull/);
  });
});

describe('the plan', () => {
  it('creates each environment before adding its refs, then protects the branches, then the rulesets', () => {
    const calls = plan(APPROVER_ID);
    const firstProtection = calls.findIndex((c) => c.path.endsWith('/protection'));
    const firstRuleset = calls.findIndex((c) => c.path.endsWith('/rulesets'));
    expect(firstProtection).toBeGreaterThan(0);
    expect(firstRuleset).toBeGreaterThan(firstProtection);
    for (const env of ENVIRONMENTS) {
      const put = calls.findIndex((c) => c.method === 'PUT' && c.path.endsWith(`/environments/${env.name}`));
      const posts = calls.flatMap((c, i) => (c.path.endsWith(`/environments/${env.name}/deployment-branch-policies`) ? [i] : []));
      expect(posts).toHaveLength(env.refs.length);
      for (const p of posts) expect(p).toBeGreaterThan(put);
    }
  });

  it('never touches a secret, a variable or Actions permissions', () => {
    for (const c of plan(APPROVER_ID)) expect(c.path).not.toMatch(/secrets|variables|actions\//);
  });

  it('protects develop and main with the required checks, no bypass, no force push, and one approval on main', () => {
    const calls = plan(APPROVER_ID).filter((c) => c.path.endsWith('/protection'));
    expect(calls.map((c) => c.path.split('/')[4])).toEqual(BRANCHES.map((b) => b.branch));
    for (const c of calls) {
      const body = c.body as Record<string, any>;
      expect(body.required_status_checks.contexts).toEqual(REQUIRED_CHECKS);
      expect(body.enforce_admins).toBe(true);
      expect(body.allow_force_pushes).toBe(false);
      expect(body.allow_deletions).toBe(false);
    }
    const main = calls.find((c) => c.path.includes('/branches/main/'))!.body as Record<string, any>;
    expect(main.required_pull_request_reviews.required_approving_review_count).toBe(1);
  });

  it('makes release tags immutable for everyone and updates a ruleset that already exists', () => {
    for (const r of RULESETS) expect(rulesetBody(r).bypass_actors).toEqual([]);
    const tags = rulesetBody(RULESETS[0]);
    expect(tags.target).toBe('tag');
    expect(tags.rules.map((r) => r.type)).toEqual(['update', 'deletion']);
    expect(tags.rules.map((r) => r.type)).not.toContain('creation');
    const again = plan(APPROVER_ID, [{ id: 7, name: RULESETS[0].name }]).filter((c) => c.path.includes('/rulesets'));
    expect(again[0]).toMatchObject({ method: 'PUT', path: 'repos/thesaurabhpareek/earlyletters/rulesets/7' });
    expect(again[1].method).toBe('POST');
  });
});

describe('read-back', () => {
  const spec = ENVIRONMENTS.find((e) => e.name === 'app-store')!;
  const good = {
    name: 'app-store',
    protection_rules: [{ type: 'required_reviewers', prevent_self_review: true, reviewers: [{ reviewer: { login: 'el-approver' } }] }],
    deployment_branch_policy: { protected_branches: false, custom_branch_policies: true },
  };

  it('passes a matching environment and names each kind of drift', () => {
    expect(environmentDrift(spec, good, spec.refs, 'el-approver')).toEqual([]);
    expect(environmentDrift(spec, undefined, undefined, 'el-approver')).toEqual(['environment app-store: missing']);
    const founderReviews = { ...good, protection_rules: [{ ...good.protection_rules[0], reviewers: [{ reviewer: { login: 'founder' } }] }] };
    expect(environmentDrift(spec, founderReviews, spec.refs, 'el-approver').join()).toMatch(/expected only el-approver/);
    const selfReview = { ...good, protection_rules: [{ ...good.protection_rules[0], prevent_self_review: false }] };
    expect(environmentDrift(spec, selfReview, spec.refs, 'el-approver').join()).toMatch(/prevent self-review/);
    expect(environmentDrift(spec, { ...good, can_admins_bypass: true }, spec.refs, 'el-approver').join()).toMatch(/bypass/);
    expect(environmentDrift(spec, { ...good, deployment_branch_policy: null }, spec.refs, 'el-approver').join()).toMatch(/selected branches/);
    const extra = [...spec.refs, { type: 'branch' as const, name: 'develop' }];
    expect(environmentDrift(spec, good, extra, 'el-approver')).toEqual(['environment app-store: unexpected ref branch:develop']);
  });

  it('flags an unprotected or weakened branch', () => {
    expect(protectionDrift(BRANCHES[0], undefined)).toEqual(['branch develop: not protected']);
    const weak = { required_status_checks: { contexts: ['required'] }, enforce_admins: { enabled: false }, required_pull_request_reviews: null, allow_force_pushes: { enabled: true } };
    const d = protectionDrift(BRANCHES[1], weak).join('\n');
    expect(d).toMatch(/applied migrations unchanged/);
    expect(d).toMatch(/administrators can bypass/);
    expect(d).toMatch(/pull requests are not required/);
    expect(d).toMatch(/force pushes/);
  });

  it('flags a ruleset with a bypass list or a missing rule', () => {
    const r = RULESETS[0];
    const live = { name: r.name, target: 'tag', enforcement: 'active', bypass_actors: [], conditions: { ref_name: { include: r.include } }, rules: [{ type: 'update' }, { type: 'deletion' }] };
    expect(rulesetDrift(r, live)).toEqual([]);
    const weak = rulesetDrift(r, { ...live, bypass_actors: [{ actor_id: 5 }], rules: [{ type: 'update' }] });
    expect(weak).toContain(`ruleset "${r.name}": has a bypass list`);
    expect(weak).toContain(`ruleset "${r.name}": rule deletion is missing`);
    expect(rulesetDrift(r, { ...live, enforcement: 'evaluate' }).join()).toMatch(/enforcement is evaluate/);
  });

  it('catches a workflow that names Vercel\'s environment or one the spec does not define', () => {
    const problems = workflowEnvironmentProblems({
      'a.yml': 'jobs:\n  x:\n    environment: production\n',
      'b.yml': 'jobs:\n  y:\n    environment: app-store\n',
      'c.yml': 'jobs:\n  z:\n    environment: release\n',
    });
    expect(problems).toHaveLength(2);
    expect(problems[0]).toMatch(/a.yml.*another tool/);
    expect(problems[1]).toMatch(/c.yml.*not in the spec/);
  });
});
