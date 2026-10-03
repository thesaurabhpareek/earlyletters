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

**CODE-R02 (MUST)** A PR changes at most 400 lines and 20 files, not counting the lockfile, generated files and test data files (golden corpora, fixtures). Above that, split it, or write `Size exception: <reason>` in the PR body for the founder to accept. *Why:* review quality collapses with size; Google's guidance puts about 100 lines as reasonable and 1000 as usually too large. *Enforced by:* not yet: gap CODE-G1 (a CI size check reading `gh api .../pulls/<n>/files`). For reference, PR #29 has 1,668 insertions and 445 deletions across 17 files.

**CODE-R03 (MUST NOT)** A PR does not weaken, skip or delete a test to make it pass; a test that is wrong is fixed in its own commit with the reason in the PR body. *Why:* tests are the specification (principle 5). *Enforced by:* review; `docs/agents/OPERATING_MODEL.md` section 4.

**CODE-R04 (MUST)** Every behaviour change ships with a test that fails without it; every bug fix starts with a failing test that reproduces the bug. *Why:* proves the fix and stops regressions. *Enforced by:* review; CI `required` job runs `npm test`, `npm run test:db` and typecheck (`.github/workflows/ci.yml`, enforced on develop).

**CODE-R05 (MUST)** Any change to cleaning behaviour bumps `ENGINE_VERSION` in `packages/core/src/pipeline.ts` with a dated comment and updates the golden corpus. *Why:* every stored letter must be re-derivable by the engine that produced it (CORE-08). *Enforced by:* PR template checkbox (develop); golden test `packages/core/test/golden.test.ts` pending PR #28.

### Code shape

**CODE-R06 (SHOULD)** New functions stay under about 50 lines and new files under about 300 lines; files already over (`apps/mobile/src/lib/store.ts` 734, `packages/core/src/verify.ts` 498) must not grow, and are split when touched for other reasons. *Why:* a small model must hold the whole unit in context. *Enforced by:* review.

**CODE-R07 (MUST)** Names follow the domain glossary: `entry` (code and DB) is a letter (UI); `child` is a book (1:1); `parent` and `contributor` are Co-parent and Family in UI only; `date_of_birth`, never `birthday`, in code; plan (state) versus Plus (product); `publisher`, not `company`. *Why:* a second name for one concept is how `birthday` vs `date_of_birth` drift happened (CORE-03). *Enforced by:* review; `docs/GLOSSARY.md` pending WS-17 (not yet opened).

**CODE-R08 (SHOULD)** Comments explain why (a constraint, a requirement id, a past bug), not what the next line does. *Why:* agents read comments as instructions; stale "what" comments mislead (the PowerSync comment in `store.ts`, CORE-03). *Enforced by:* review.

**CODE-R09 (MUST)** Dead code is deleted, not commented out or left unreferenced; a feature flag is removed within one release after it is fully on. *Why:* unused code is context cost and false signal for agents (MONO-07, MOB-13). *Enforced by:* review.

### Module boundaries

**CODE-R10 (MUST NOT)** Code under `packages/*/src` does not import `react-native`, `expo*`, `node:*` or any platform global; package `src` compiles with `types: []`, tests in a separate config. *Why:* the same code runs in Deno Edge Functions and Next.js (ADR 0010, MONO-02). *Enforced by:* partly: `packages/core/tsconfig.json` has `types: []` today; `analytics`, `content` and `design-tokens` include `node` types (MONO-02); lint rule not yet (MONO-01, WS-12).

**CODE-R11 (MUST NOT)** Screens and components do not import `expo-sqlite`, `apps/mobile/src/lib/db/*` or native audio and file modules; they call `apps/mobile/src/lib` functions. *Why:* one data-access layer that tests can cover (MOB-04). *Enforced by:* not yet: WS-12 `no-restricted-imports` (MONO-01, MOB-08). PR #29 removes `expo-sqlite` from `store.ts`.

**CODE-R12 (SHOULD)** A new package has an `exports` map and imports that work without a bundler; the module format is settled by the MONO-04 ADR before the first Edge Function imports a package. *Why:* raw TS with extensionless imports breaks Deno and Next.js consumers (MONO-04). *Enforced by:* not yet: MONO-04.

### One source of truth

**CODE-R13 (MUST)** Domain types and enums (`EntryKind`, `CaptureMode`, `EditLevel`, `MemberRole`, `PlanState` and the rest) are defined once in `packages/core/src/domain.ts` and imported everywhere; app, analytics and SQL never redeclare them. *Why:* hand copies drifted (`CAPTURE_MODE` lacked `mixed`, CORE-05). *Enforced by:* pending PR #31 (`domain.ts` plus `packages/analytics/test/domain.test.ts`, which parses migration CHECK constraints). Note: PR #29 `apps/mobile/src/lib/db/repos/types.ts` still declares local unions and must re-export from core once #31 merges.

**CODE-R14 (MUST)** A business rule has one implementation: Plus gating uses `decide()` in `packages/core/src/plan.ts`. *Why:* three copies (core, mobile `hasPlus`, SQL) diverged (CORE-06). *Enforced by:* PR template checkbox; review.

### Errors

**CODE-R15 (MUST)** Errors that callers branch on are typed: an `Error` subclass with a stable `code` string, or a result union (`{ ok: true, ... } | { ok: false, code }`); callers never match on message text. *Why:* messages change; codes are contracts (CORE-13; the same reason Postgres says to test SQLSTATE, not text). *Enforced by:* review; not yet as lint (CORE-13). Good examples: `MigrationError` (`apps/mobile/src/lib/db/migrations.ts`), `TranscriberUnavailable` (`apps/mobile/src/lib/transcribe.ts`).

**CODE-R16 (MUST NOT)** Error messages do not include user data. *Why:* messages reach logs and crash reports (chapter 07, LEGAL-REQ-014). Today `packages/core/src/age.ts` line 15 puts the input date (a child's date of birth is L4) into the message: gap CODE-G2. *Enforced by:* review; log canary (chapter 10, OBS-R10).

### Dependencies

**CODE-R17 (MUST)** A new dependency is permissive (MIT, Apache-2.0, BSD, ISC), released in the last 12 months with an active tracker, verified against the installed version's source, installed through the serialised `flock` command, and justified in the PR body. *Why:* BRIEF coordination rules; every dependency is code we ship and must update. *Enforced by:* review; Dependabot and `npm audit` gate pending PR #30; licence check not yet (CODE-G3).

**CODE-R18 (MUST)** Prefer the platform and a known library over custom code; custom infrastructure (a sync engine, a payment system, a component a library already offers) needs an ADR. *Why:* BRIEF decision 1. *Enforced by:* review (principal-architect).

### Flags, lint and types

**CODE-R19 (MUST)** User-facing behaviour that talks to the network (sync, invites, server-driven content, transcription gateway) ships behind a remote config key or kill switch from `app_config` (D-035), with an owner and a removal date in the PR body. *Why:* a bad release must be stoppable without App Review (LEGAL-REQ-040). *Enforced by:* not yet: BL-022, PDATA-08.

**CODE-R20 (MUST)** Every workspace typechecks with `strict: true`, and lint and format pass once WS-12 lands; `console.*` is banned in `apps/mobile/src` and `packages/*/src`. *Why:* the compiler and linter are the cheapest reviewers. *Enforced by:* typecheck in CI on develop (strict verified in every `tsconfig.json`); lint not yet: no ESLint config exists (MONO-01); PR #30 adds a lint job that runs only once a root `lint` script exists.

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

Only the founder grants an exception. A one-off (an oversized PR, a temporary duplicate type) is recorded in the PR body as `Exception: CODE-Rnn, <reason>, <removal date>`. A standing exception is a `D-###` in `docs/DECISIONS.md`.

## Open questions

1. Is 400 lines and 20 files the right ceiling, or should agent PRs have a lower one (for example 250) than founder PRs?
2. MONO-04: compile packages to JS with an `exports` map, or keep raw TS and add explicit `.ts` extensions for Deno? Needs an ADR before the first Edge Function.
3. Should the CI size check (CODE-G1) block, or only label `size:large` and require the exception line?

## References

Repo: `CLAUDE.md`; `docs/agents/BRIEF-2026-10-03.md` (decisions 1, 17; coordination rules); `docs/agents/OPERATING_MODEL.md` section 4; ADR 0010; `docs/tdd/07-quality-test-strategy.md` 2.1; `.github/pull_request_template.md`; `.github/workflows/ci.yml`; `packages/core/src/pipeline.ts`; `packages/core/src/plan.ts`; findings CORE-02, -03, -05, -06, -08, -13, MONO-01, -02, -04, -07, MOB-04, -08, PDATA-08 (architecture review 2026-10-03); D-035.

External:
- Google Engineering Practices, "Small CLs": https://google.github.io/eng-practices/review/developer/small-cls.html (checked 2026-10-03). One self-contained change; about 100 lines reasonable, 1000 usually too large; files touched also count.
- PostgreSQL, Appendix A "PostgreSQL Error Codes": https://www.postgresql.org/docs/current/errcodes-appendix.html (checked 2026-10-03). Applications should test the error code, not the message text.
