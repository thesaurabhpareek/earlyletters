---
chapter: 01
title: Code and change
owner: principal-architect
reviewers: [ai-eng-lead, data-steward]
status: adopted
last_reviewed: 2026-10-03
applies_to: packages/**, apps/mobile/src/**, supabase/functions/**, scripts/**
---

# 01. Code and change

## Purpose

Early Letters is built mostly by agents, many on open-weight models with small context windows, and reviewed by one founder. Code that is small, boring and clearly bounded is code those agents can change without breaking the constitution or a family's letters. This chapter sets the shape of code and the discipline of change: how big a change may be, where code may live, what it may import, and what proves it works.

## Principles

1. **Small diffs, one concern.** A reviewer must understand a PR in ten minutes (`docs/agents/OPERATING_MODEL.md` section 4). Big PRs hide bugs.
2. **One definition of every domain fact.** A type, enum or rule written twice will drift (CORE-02, CORE-05, CORE-06 all happened).
3. **Packages are pure TypeScript.** Shared logic must run on the phone, in Node tests, in Deno Edge Functions and in Next.js (ADR 0010).
4. **Standard over custom.** Use the platform and well-maintained libraries; build only the finishing touches (BRIEF decision 1).
5. **Tests are the specification.** If a behaviour has no test, it is not a promise and the next agent may remove it.

## Rules

### Change discipline

**CODE-R01 (MUST)** A PR has one concern: one backlog item, one finding fix or one refactor, never a refactor mixed with a behaviour change. *Why:* mixed PRs cannot be reverted cleanly and reviewers miss the behaviour change. *Enforced by:* review (principal-architect); `CLAUDE.md` "Branches and commits"; PR template.

**CODE-R02 (MUST)** A PR changes at most 400 lines and 20 files, not counting the lockfile, generated files and test data files (golden corpora, fixtures). Above that, split it, or write `Size exception: <reason>` in the PR body for the founder to accept. *Why:* review quality collapses with size; Google's guidance puts about 100 lines as reasonable and 1000 as usually too large. *Enforced by:* the check is written but not running: `scripts/guards/pr-size.mjs` with tests (#1096), and a proposed job in `docs/ops/proposed/pr-size.md` that runs only when the founder pastes the workflow (agents cannot edit `.github/workflows/`). Gap CODE-G1 stays open until then. For reference, PR #29 has 1,668 insertions and 445 deletions across 17 files.

**CODE-R03 (MUST NOT)** A PR does not weaken, skip or delete a test to make it pass; a test that is wrong is fixed in its own commit with the reason in the PR body. *Why:* tests are the specification (principle 5). *Enforced by:* review; `docs/agents/OPERATING_MODEL.md` section 4.

**CODE-R04 (MUST)** Every behaviour change ships with a test that fails without it; every bug fix starts with a failing test that reproduces the bug. *Why:* proves the fix and stops regressions. *Enforced by:* review; CI `required` job runs `npm test`, `npm run test:db` and typecheck (`.github/workflows/ci.yml`, enforced on develop).

**CODE-R05 (MUST)** Any change to cleaning behaviour bumps `ENGINE_VERSION` in `packages/core/src/pipeline.ts` with a dated comment and updates the golden corpus. *Why:* every stored letter must be re-derivable by the engine that produced it (CORE-08). *Enforced by:* PR template checkbox (develop); golden test `packages/core/test/golden.test.ts` merged in #28.

### Code shape

**CODE-R06 (SHOULD)** New functions stay under about 50 lines and new files under about 300 lines; files already over (`apps/mobile/src/lib/store.ts` 734, `packages/core/src/verify.ts` 498) must not grow, and are split when touched for other reasons. *Why:* a small model must hold the whole unit in context. *Enforced by:* review.

**CODE-R07 (MUST)** Names follow the domain glossary: `entry` (code and DB) is a letter (UI); `child` is a book (1:1); `parent` and `contributor` are Co-parent and Family in UI only; `date_of_birth`, never `birthday`, in code; plan (state) versus Plus (product); `publisher`, not `company`. *Why:* a second name for one concept is how `birthday` vs `date_of_birth` drift happened (CORE-03). *Enforced by:* review; `docs/GLOSSARY.md` pending WS-17 (not yet opened).

**CODE-R08 (SHOULD)** Comments explain why (a constraint, a requirement id, a past bug), not what the next line does. *Why:* agents read comments as instructions; stale "what" comments mislead (the PowerSync comment in `store.ts`, CORE-03). *Enforced by:* review.

**CODE-R09 (MUST)** Dead code is deleted, not commented out or left unreferenced; a feature flag is removed within one release after it is fully on. *Why:* unused code is context cost and false signal for agents (MONO-07, MOB-13). *Enforced by:* review.

### Module boundaries

**CODE-R10 (MUST NOT)** Code under `packages/*/src` does not import `react-native`, `expo*`, `node:*` or any platform global; package `src` compiles with `types: []`, tests in a separate config. *Why:* the same code runs in Deno Edge Functions and Next.js (ADR 0010, MONO-02). *Enforced by:* partly: `packages/core/tsconfig.json` has `types: []` today; `analytics`, `content` and `design-tokens` include `node` types (MONO-02); lint rule not yet (MONO-01, WS-12).

Import cycles are checked, though no rule number names them yet: `apps/mobile/test/import-graph.test.ts` (gate G5; #1090, hardened in #1127) walks the value-import graph of `apps/mobile/src`, `packages/core`, `api`, `content` and `analytics` with Tarjan's algorithm and fails on any cycle (ratchet at zero). A dynamic `import()` is not an edge, and the app uses one on purpose in `lib/billing/plan-store.ts`. The boundary scan (gate G4, #1085) is also on `develop`: `apps/mobile/test/boundaries.test.ts` scans for the CODE-R10 and CODE-R11 imports, plus two further checks (nothing under `packages` imports `apps/mobile`; `packages/core/src` imports only itself). It is a ratchet: a `KNOWN` list holds the imports that already broke a rule when it landed (for example build scripts in `design-tokens` and `emails` that import `node:*`). It is a source scan, not a lint rule, and has known open gaps that a `qa` PR is fixing; this chapter claims no more than the test reads.

**CODE-R11 (MUST NOT)** Screens and components do not import `expo-sqlite`, `apps/mobile/src/lib/db/*` or native audio and file modules; they call `apps/mobile/src/lib` functions. *Why:* one data-access layer that tests can cover (MOB-04). *Enforced by:* not yet: WS-12 `no-restricted-imports` (MONO-01, MOB-08). PR #29 removes `expo-sqlite` from `store.ts`.

**CODE-R12 (SHOULD)** A new package has an `exports` map and imports that work without a bundler; the module format is settled by the MONO-04 ADR before the first Edge Function imports a package. *Why:* raw TS with extensionless imports breaks Deno and Next.js consumers (MONO-04). *Enforced by:* not yet: MONO-04.

### One source of truth

**CODE-R13 (MUST)** Domain types and enums (`EntryKind`, `CaptureMode`, `EditLevel`, `MemberRole`, `PlanState` and the rest) are defined once in `packages/core/src/domain.ts` and imported everywhere; app, analytics and SQL never redeclare them. *Why:* hand copies drifted (`CAPTURE_MODE` lacked `mixed`, CORE-05). *Enforced by:* on develop since #31 (`domain.ts` plus `packages/analytics/test/domain.test.ts`, which parses migration CHECK constraints). Note: PR #29 `apps/mobile/src/lib/db/repos/types.ts` still declares local unions and must re-export from core once #31 merges.

**CODE-R14 (MUST)** A business rule has one implementation: Plus gating uses `decide()` in `packages/core/src/plan.ts`. *Why:* three copies (core, mobile `hasPlus`, SQL) diverged (CORE-06). *Enforced by:* PR template checkbox; review.

### Errors

**CODE-R15 (MUST)** Errors that callers branch on are typed: an `Error` subclass with a stable `code` string, or a result union (`{ ok: true, ... } | { ok: false, code }`); callers never match on message text. *Why:* messages change; codes are contracts (CORE-13; the same reason Postgres says to test SQLSTATE, not text). *Enforced by:* review; not yet as lint (CORE-13). Good examples: `MigrationError` (`apps/mobile/src/lib/db/migrations.ts`), `TranscriberUnavailable` (`apps/mobile/src/lib/transcribe.ts`).

**CODE-R16 (MUST NOT)** Error messages do not include user data. *Why:* messages reach logs and crash reports (chapter 07, LEGAL-REQ-014). `packages/core/src/age.ts` throws `InvalidIsoDateError`, whose message is the fixed code `invalid_iso_date` and never the date (#1118, #1146); a child's date of birth is L4. Gap CODE-G2 is closed for `age.ts`; other throw sites are still found by review. *Enforced by:* review; log canary (chapter 10, OBS-R10).

### Dependencies

**CODE-R17 (MUST)** A new dependency is permissive (MIT, Apache-2.0, BSD, ISC), released in the last 12 months with an active tracker, verified against the installed version's source, installed through the serialised `flock` command, and justified in the PR body. *Why:* BRIEF coordination rules; every dependency is code we ship and must update. *Enforced by:* review; Dependabot and `npm audit` gate pending PR #30; licence check not yet (CODE-G3).

**CODE-R18 (MUST)** Prefer the platform and a known library over custom code; custom infrastructure (a sync engine, a payment system, a component a library already offers) needs an ADR. *Why:* BRIEF decision 1. *Enforced by:* review (principal-architect).

### Flags, lint and types

**CODE-R19 (MUST)** User-facing behaviour that talks to the network (sync, invites, server-driven content, transcription gateway) ships behind a remote config key or kill switch from `app_config` (D-035), with an owner and a removal date in the PR body. *Why:* a bad release must be stoppable without App Review (LEGAL-REQ-040). *Enforced by:* not yet: BL-022, PDATA-08.

**CODE-R20 (MUST)** Every workspace typechecks with `strict: true`, and lint and format pass once WS-12 lands; `console.*` is banned in `apps/mobile/src` and `packages/*/src`. *Why:* the compiler and linter are the cheapest reviewers. *Enforced by:* typecheck in CI on develop (strict verified in every `tsconfig.json`); lint not yet: no ESLint config exists (MONO-01); PR #30 adds a lint job that runs only once a root `lint` script exists.

### Release gates, as-built docs and CI time

**CODE-R23 (MUST)** Each release gate (feature freeze, alpha build, TestFlight build, store submission) has one file that lists every check, its owner and its evidence (a CI run id, a device run per CODE-R22, or a decision id). For a build that file is a copy of `docs/release/go-no-go/TEMPLATE.md`: nine function rows (QA, Security, Privacy, Compliance, Legal, Marketing claims, Support, Finance, Design), each with a mark (verified, unverified, founder-held), a source, a date read, a status (pass, open, fail, n/a) and a ruling id. `scripts/release/go-no-go-check.mjs` checks form only: every row has a mark, an existing source, a date, a status and ruling ids that exist; Legal, Compliance and Finance read pass only with a CLO-, CCO- or CFO- id; the page stays within 900 words and 60 lines and holds no ship call. A person decides everything else: whether a source says what its row claims, and whether the open, unverified and founder-held rows allow the gate to pass. A gate passes only when each row is either pass with evidence or an open row a named decision accepts. `docs/qa/ALPHA_GO_NO_GO.md` holds the alpha's own check list and stays a separate file. Other docs link to the gate file and never restate its rows; dates live in `docs/release/dates.json`. *Stale wording:* the template and the checker say the founder makes the ship call; CR-176 moved that call to Karma. This chapter does not edit them; the follow-up is a handoff to the owner of `scripts/release/go-no-go-check.mjs` and the template. *Why:* a gate spread over several files cannot be checked in one place; the 1.0.0 record (`docs/release/1.0.0.md`), `docs/qa/ALPHA_GO_NO_GO.md`, `docs/release/AUTOMATION.md` and ADR 0027 each carried part of the gate. When a release chapter lands (open PR #112), this rule moves there under a REL id. *Enforced by:* the checker for the form of per-build pages; review for the rest. Not yet a check that every gate has a file.

**CODE-R24 (SHOULD)** A doc that describes as-built behaviour (`docs/ARCHITECTURE.md`, as-built reference pages) carries `verified_at: <commit sha>` and a `covers:` list of the code paths it describes. A PR that changes a covered path updates the page, or says in its body which page is now stale. *Why:* as-built docs drift silently when the code moves. `docs/ARCHITECTURE.md` has a "Changed" banner for the ADR 0027 capture format (line 17), but lines 60, 109 and 118 still describe M4A capture. *Enforced by:* review only. Not yet: no page carries `verified_at`, and no `docs/reference/` convention is on `develop` (it is in open PR #167).

**CODE-R25 (SHOULD)** The target is that a normal run of each job in the `required` set of `.github/workflows/ci.yml` finishes in under 10 minutes; the budget is per required PR job, not for the whole CI. Device-class checks outside `required` (the iOS Release launch in `.github/workflows/ios-compile.yml`, the kill harness in `.github/workflows/kill-harness.yml`) state their own timeout and are not bound by it. *Why:* "under 10 minutes end to end" (`.github/workflows/ci.yml` lines 1 and 2) reads as a limit on all CI, and `.github/README.md` ("Keeping CI under 10 minutes") and `docs/tdd/07-quality-test-strategy.md` line 556 ("Budget: under 10 minutes, alarm at 8") say the same without the words "end to end", yet the jobs' `timeout-minutes` are ceilings, not the budget: install 4, content 5, unit 10, db 15, functions 5, typecheck 5, seam-guard 15 and `required` 1. The two 15-minute ceilings sit above the target on purpose (a slow runner on the database perf seed). Those three sources keep the old wording until a follow-up. *Enforced by:* nothing measures a run against the target: gap CODE-G7. The ceilings are enforced by `timeout-minutes` in `ci.yml`.

## How to apply it

Before opening a PR:
- [ ] One concern? Under 400 lines and 20 files (CODE-R02)? If not, split by layer: types, then logic plus tests, then wiring.
- [ ] New logic that is not UI lives in `packages/core` (or a `*.logic.ts` beside the screen) with unit tests.
- [ ] No new enum or domain type outside `packages/core/src/domain.ts`.
- [ ] Errors you throw have a `code`; messages hold no user data.
- [ ] New dependency: licence, last release date, installed-source check written in the PR body.
- [ ] `npm test`, `npm run test:db` (if `supabase/**`), `npm run typecheck` pass.

Typed error pattern for this repo:

```ts
export type StoreErrorCode = 'audio_missing' | 'tombstoned' | 'child_frozen';
export class StoreError extends Error {
  constructor(readonly code: StoreErrorCode) {
    super(code); // the message is the code: never user data
    this.name = 'StoreError';
  }
}
// caller: if (e instanceof StoreError && e.code === 'tombstoned') ...
```

Tests, in order of preference: a unit test of a pure function; a property test with a seeded PRNG that prints its seed on failure (pattern: `packages/core/test/verify.fuzz.test.ts`, `SCRIBE_FUZZ_SEED`); a golden corpus for outputs that must never change silently (PR #28); a `node:sqlite` integration test for device storage (`apps/mobile/test/migrations.test.ts`); a PGlite test for database rules (`supabase/tests`). Test titles start with the requirement id in brackets (TDD 07 2.1).

## Exceptions

Only Karma, with the owning executive, grants an exception (CR-176). A one-off (an oversized PR, a temporary duplicate type) is recorded in the PR body as `Exception: CODE-Rnn, <reason>, <removal date>`. A standing exception is a `D-###` in `docs/DECISIONS.md`.

## Open questions

1. Is 400 lines and 20 files the right ceiling, or should agent PRs have a lower one (for example 250) than founder PRs?
2. MONO-04: compile packages to JS with an `exports` map, or keep raw TS and add explicit `.ts` extensions for Deno? Needs an ADR before the first Edge Function.
3. Should the CI size check (CODE-G1) block, or only label `size:large` and require the exception line?

## References

Repo: `CLAUDE.md`; `docs/agents/BRIEF-2026-10-03.md` (decisions 1, 17; coordination rules); `docs/agents/OPERATING_MODEL.md` section 4; ADR 0010; `docs/tdd/07-quality-test-strategy.md` 2.1; `.github/pull_request_template.md`; `.github/workflows/ci.yml`; `packages/core/src/pipeline.ts`; `packages/core/src/plan.ts`; findings CORE-02, -03, -05, -06, -08, -13, MONO-01, -02, -04, -07, MOB-04, -08, PDATA-08 (architecture review 2026-10-03); D-035.

External:
- Google Engineering Practices, "Small CLs": https://google.github.io/eng-practices/review/developer/small-cls.html (checked 2026-10-03). One self-contained change; about 100 lines reasonable, 1000 usually too large; files touched also count.
- PostgreSQL, Appendix A "PostgreSQL Error Codes": https://www.postgresql.org/docs/current/errcodes-appendix.html (checked 2026-10-03). Applications should test the error code, not the message text.
