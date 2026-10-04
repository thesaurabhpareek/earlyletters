# Operating model: how the harness runs the iOS v1.0 release

Status: proposed 4 Oct 2026. Source of truth for tasks is `docs/BACKLOG.md` (plus `docs/release/overlay.json` for D-051 and D-052 work not yet in it). This file says how agents are assigned, sequenced, checked and reported. The generated plan is `docs/release/PLAN.md` and `docs/release/plan.json` (`npm run plan`).

## Roles
| Who | Does | Never does |
|---|---|---|
| **Founder** | `human` tasks (accounts, domain, Apple, counsel, devices, decisions D-###), applies the `approve-migration` label, merges every PR | delegated to nobody |
| **release-manager** (agent) | refreshes the plan, picks startable tasks, assigns agents, enforces locks and WIP limits, tracks status, reports | write product code; merge |
| **Skill agents** (13, `.claude/agents/`) | one task per PR in their paths: mobile-engineer, speech-engineer, design-systems-engineer, content-designer, data-architect, sync-engineer, security-engineer, privacy-engineer, payments-engineer, analytics-engineer, qa-engineer, legal-drafter | merge; touch accounts, secrets or remote databases; add purchase, analytics or crash SDKs unattended |
| **independent-reviewer** (agent) | cold first-pass review of every PR; required for `supabase/**` and auth | approve or merge for the founder |

The role-to-agent map is `docs/release/agents.json`. A task with several owners goes to the first owner's agent; the rest are listed as support.

## The loop (one cycle)
1. `git checkout release/ios-v1.0 && git pull`; `npm run plan` (regenerates the plan; `npm run plan:check` fails on a broken graph).
2. Find tasks already taken: open PRs and branches named `*-bl-###-*`. A taken task is skipped.
3. `npm run plan:next -- 6`: the startable agent tasks, ordered by severity tag (Critical, High first) then by how many open tasks they unblock.
4. Take at most **6 concurrent tasks**, and never two whose **file areas overlap** (see locks). Start one agent per task, in its own worktree, with the task id and the rules below.
5. Each agent opens a PR into `release/ios-v1.0` and stops. The release-manager routes it to **independent-reviewer**.
6. Founder reviews and merges (batch daily). After a merge the task's status line becomes `done (PR #n)` (the PR already changed it to `in-review`; the founder's merge commit or the next cycle flips it).
7. Report to the founder (below). Repeat from 1.

## File-area locks (avoid collisions)
Two tasks may run together only if their areas differ. Areas: `supabase/**`; `packages/core/**`; `packages/content/**`; `packages/design-tokens/**`; `packages/analytics/**`; `apps/mobile/src/app/**` (one screen at a time); `apps/mobile/src/components/**` (one folder at a time); `apps/mobile/src/lib/**` (one module at a time); `apps/web/**`; `docs/legal/**`; `.github/**`. Shared files (`package.json`, lockfile, `tokens.ts`, `strings.en.ts`) are taken by one task at a time.

## Fences (from the backlog, D-041)
- `supabase/**` and authentication code: every PR needs an independent review and the founder's `approve-migration` label. Migrations reach staging and production only through CI on a tag.
- Unattended agents never: merge, apply migrations to a remote project, touch secrets or store accounts, edit an applied migration, weaken a test, add an analytics, crash or purchase SDK (those tasks are `pair`), edit a requirement document (propose in the PR body).
- `pair` tasks run in a live session with the founder. `human` tasks are the founder's.

## Quality gates per PR (Definition of Done in the backlog, abbreviated)
Tests with requirement ids in titles; `npm run typecheck` and `npm test` (and `npm run test:db` for database work); constitution holds (no path writes, rewrites or discards a person's words; `verifyEdits`; immutable `raw_transcript`); content rules; data-map row; Asha-only fixtures; accessibility (AX5, VoiceOver, 44 pt, Reduce Motion); one concern.

## What an agent cannot prove here, and what happens instead
Device behaviour (capture on iPhone SE 3, transcription speed, battery), Apple behaviour (StoreKit, review, sandbox), email deliverability in real inboxes, legal sufficiency. The agent writes `needs device check` or `unverified` in the PR and the plan gets a `human` or `pair` follow-up. A gate is green only on evidence, never on the absence of failures.

## Reporting to the founder
After each cycle, one short message: merged since last report; open PRs waiting for review (with the label or decision they need); founder tasks that are now blocking others, ranked by how many tasks they unblock; red gates; the next six tasks started. The readiness gates are in `docs/release/READINESS.md`.

## Waves (how the first weeks run)
- **Wave 1 (now):** startable tasks inside the fence that need no device, account or secret. Guardrails (CI, traceability, PR template, mobile test harness), content-rule additions, pure `packages/core` work. The release-manager takes the top six from `plan:next`.
- **Wave 2:** database fix pack and governance (fenced; needs the label), capture and atomic save, plan engine rewrite once BL-223 is decided.
- **Wave 3:** sync, family, shared voice (needs D-023 and D-032), the Plus server and notice engine, privacy and deletion.
- **Wave 4:** accessibility pass, analytics wiring, beta build, store submission pack.
The sequence inside each wave is the dependency level in `PLAN.md`; the critical path is the chain of founder long poles (BL-100 to BL-109) into accounts and sync, then family, then the beta build.
