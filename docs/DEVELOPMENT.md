# Development definitions

How work moves from an idea to a build in people's hands. If this file and another doc disagree, this file wins for process. `CLAUDE.md` holds the product rules (constitution, content, privacy); this holds the delivery rules.

## Branches

| Branch | Role | Who may merge into it |
|---|---|---|
| `develop` | Integration branch and release base for the app. Always green (typecheck, tests, db tests). | The coordinator for app code, docs and tests, once two independent review agents pass and CI is green on the head; the founder for `supabase/**`, auth, payments, release configuration and the engine files (D-107, `docs/agents/COORDINATION.md` section 6) |
| `main` | What is live: the website (Vercel deploys from `main`) and tagged app releases. Updated only by a release PR from `develop`, or a website hotfix. | Founder |
| short branches | `feat/<area>-<what>`, `fix/<what>`, `chore/<what>`, `docs/<what>`, `test/<what>`, `qa/<what>`, `exp/<what>` | The author opens a PR into `develop` |

Rules:
- Every change is a pull request into `develop`. No direct pushes to `develop` or `main`.
- One concern per pull request. Stacked PRs name their base in the description and retarget to `develop` when the base merges.
- Website hotfix: PR into `main`, then merge `main` back into `develop` the same day so the lineages never drift again.
- Release (ADR 0022, D-089; the runbook is `docs/ops/RELEASE.md`): PR `develop` into `main`, then the coordinator cuts `release/<major>.<minor>` from `main` at freeze. Fixes merge to `develop` first and are cherry-picked onto the release branch. The version lives only in `apps/mobile/version.json` (after #109; until then `apps/mobile/app.config.ts:162`); build numbers come only from EAS. Two lanes: preview-lane TestFlight builds come from `develop` (`docs/release/TESTFLIGHT.md`); store builds come only from tags on the release branch, `ios-v<x.y.z>-rc.<n>` for a candidate and `ios-v<x.y.z>` on the candidate Apple approved, pushed after release. Tags never move.
- Database changes ship as a new migration file. Never edit a migration that has been applied.

## Definition of Ready
A task is ready when it has a backlog id (`docs/BACKLOG.md`, FT-## for founder steps), an owner role, a testable outcome, and no open founder decision. Founder decisions are recorded as `D-###` in `docs/DECISIONS.md` before code depends on them. Ids are never reused, and an id is never renumbered once its entry is on `develop`.

## Definition of Done
A pull request merges only when all hold:
1. `npm run typecheck` and `npm test` pass; `npm run test:db` passes when `supabase/**` changed; website e2e passes when `apps/web/**` changed.
2. New behaviour has tests, including the unhappy path (offline, denied permission, empty state, bad input). Bug fixes add a test that failed before.
3. Content rules pass (fix the copy, never the test). No entry text, transcript, audio or child name in analytics, logs or crash reports.
4. Docs updated: backlog status, decision record or ADR when a decision was made, runbook when a step changed.
5. Screens changed: a recorded flow in `apps/mobile/e2e-web` covers it and the journey record is regenerated.
6. The PR template is filled in; the diff was re-read by someone other than the author: two independent review agents (D-107), and the founder for founder-only merges.

## Environments
| | App bundle id | Backend | Purpose |
|---|---|---|---|
| dev | local | local | Day to day work |
| preview (TestFlight) | `com.earlyletters.scribe.preview` | `EXPO_PUBLIC_APP_ENV=preview` | Founder and invited testers |
| production | `com.earlyletters.scribe` | production | App Store. The id is permanent once created |

## Who does what
The role agents (`.claude/agents/`, `agents/roster.json`) pick up backlog items through the dispatcher and open PRs. Two independent review agents pass a pull request before it merges (D-107). Agents never merge, never change founder decisions, and never touch secrets. Founder-only steps (Apple, Expo, Supabase, domains, keys) live in `docs/FOUNDER_TASKS.md`.
