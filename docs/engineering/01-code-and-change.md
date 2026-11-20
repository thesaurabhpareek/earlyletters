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

> **Proposed changes, pending founder (28 Oct 2026, retro package R2-05).** Status: proposal only; nothing here is in force until the founder accepts it at review. Changed: CODE-R02 (size limit on product code, with a label and a stated reason). New: CODE-R21 (stacked PRs), CODE-R22 (`Done when` and device evidence), CODE-R23 (one release gate file), CODE-R24 (`verified_at` on as-built docs), CODE-R25 (CI time budget per required PR job). Each rule below carries its evidence. Evidence ids (IMP-xx, panel 05 sections B1 to B5) are from the 28 Oct retrospective synthesis, which lives outside this repo; every number is also cited to a PR, file or run here. `PRINCIPLES.md` item 1 and AIE-R13 (chapter 09) still say 400 lines and 20 files; they change in a follow-up once PR #112, which edits `PRINCIPLES.md`, settles.

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

**CODE-R02 (MUST) (Proposed, pending founder; replaces the 3 Oct text "at most 400 lines and 20 files")** A PR changes at most **800 lines or 30 files of product code**. Product code is every changed file except tests and test data (golden corpora, fixtures, snapshots), docs, generated files and lockfiles, classified as `scripts/qa/pr-size.mjs` does (PR #345). Above that, split it, or add the label `size:large` and one line in the PR body, `Size: <one sentence on why it cannot be split>`. One concern (CODE-R01) applies at every size. *Why:* review quality falls with size (Google: about 100 lines reasonable, 1,000 usually too large). The 3 Oct rule counted tests and docs, so half of all work broke it and nobody recorded an exception, which taught that the rule is optional. *Evidence (IMP-82; panel 05 B1; PR #345 live run over the 141 PRs merged 16 to 28 Oct):*

| Measure (lines or files) | PRs over it | Share |
|---|---|---|
| 400 / 20, raw (the 3 Oct rule as measured) | 72 of 141 | 51% |
| 800 / 30, raw (panel 05's proposal) | 52 of 141 | 37% |
| 400 / 20, product code only | 39 of 141 | 28% |
| 600 / 25, product code only | 29 of 141 | 21% |
| **800 / 30, product code only (proposed)** | **23 of 141** | **16%** |
| 1,200 / 40, product code only | 14 of 141 | 10% |

Tests are 39% of all changed lines in those PRs and docs 16% (#345). Merged PR bodies held zero `Exception: CODE-R02` lines and the repo has no `size:large` label (panel 05 B1; label list checked 28 Oct). At 800/30 the label would fall on about one PR in six, which keeps it a signal; at 400/20 product-only it would fall on more than one in four. The 23 include #150 (4,681 product lines), #151 (3,800) and #138 (3,284). *Enforced by:* not yet: gap CODE-G1. `scripts/qa/pr-size.mjs` (PR #345, open) reports the split, warn only; until a CI job runs it, the reviewer checks the label and the `Size:` line. The label must be created before the rule applies.

**CODE-R03 (MUST NOT)** A PR does not weaken, skip or delete a test to make it pass; a test that is wrong is fixed in its own commit with the reason in the PR body. *Why:* tests are the specification (principle 5). *Enforced by:* review; `docs/agents/OPERATING_MODEL.md` section 4.

**CODE-R04 (MUST)** Every behaviour change ships with a test that fails without it; every bug fix starts with a failing test that reproduces the bug. *Why:* proves the fix and stops regressions. *Enforced by:* review; CI `required` job runs `npm test`, `npm run test:db` and typecheck (`.github/workflows/ci.yml`, enforced on develop).

**CODE-R05 (MUST)** Any change to cleaning behaviour bumps `ENGINE_VERSION` in `packages/core/src/pipeline.ts` with a dated comment and updates the golden corpus. *Why:* every stored letter must be re-derivable by the engine that produced it (CORE-08). *Enforced by:* PR template checkbox (develop); golden test `packages/core/test/golden.test.ts` merged in #28.

**CODE-R21 (MUST) (Proposed, pending founder)** A PR may target another PR's branch (a stack) only when that base PR is expected to merge within 48 hours, and the first line of its body says `Stacked on #N`. If the base has not merged after 48 hours, retarget the PR to `develop` or close it. Never merge `develop` into a stacked head. *Why:* GitHub diffs a stacked head against its base branch, so a stale base makes a small PR look huge and unreviewable. *Evidence (IMP-85; panel 05 A2, A3, F4):* #167 and #168 target `docs/knowledge-leads` (the head of #164, open since 15 Oct). GitHub shows #167 as +143,071 / -4,633 over 1,094 files and 139 commits, and #168 as +143,806 / -4,627 over 1,093 files and 137 commits (`gh api .../pulls/<n>`, 28 Oct). Their real content against `develop` is 24 files, +2,360 and 23 files, +3,101 (`git diff --shortstat origin/develop...<head>`, 28 Oct). Daily runs merged `develop` into the heads (for example ccb4e1ba, 27 Oct). *Enforced by:* not yet; reviewer checks the base branch and its age.

**CODE-R22 (MUST) (Proposed, pending founder)** Every PR body has a `Done when:` line that names the observable result and the evidence that shows it (a test name, a CI run id, or a device run). For a change to mobile behaviour, "done" names a device run: build number, device, iOS version, date and result. Simulator evidence is labelled "simulator"; it may support a release gate but never closes one. *Why:* green CI and a simulator are not proof that the app works on a phone. *Evidence (IMP-88; panel 05 B3 row 2, F10; synthesis spot-check 10):* of the 141 PR bodies merged 16 to 28 Oct, none has a `Done when` line of its own; the phrase appears only in #222 (a test table row) and #262 (a quote from another doc) (`prs.json` search, 28 Oct; this corrects IMP-88's "1 of 141"). ADR 0027 line 3 reads "Accepted; flipped on the simulator evidence; V1 speech half, V3 Mac half and V4 due before the build 2 freeze" (#293). The app could not launch in a Release build from #96 (5 Oct) until the fix in #276 (24 Oct), and no CI check launched a Release build until #284 the same day (`ios-compile.yml` lines 24 to 26). *Enforced by:* not yet: neither the PR template on `develop` nor the one proposed in open PR #315 has a `Done when` line; adding it is a follow-up there.

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

**CODE-R13 (MUST)** Domain types and enums (`EntryKind`, `CaptureMode`, `EditLevel`, `MemberRole`, `PlanState` and the rest) are defined once in `packages/core/src/domain.ts` and imported everywhere; app, analytics and SQL never redeclare them. *Why:* hand copies drifted (`CAPTURE_MODE` lacked `mixed`, CORE-05). *Enforced by:* on develop since #31 (`domain.ts` plus `packages/analytics/test/domain.test.ts`, which parses migration CHECK constraints). Note: PR #29 `apps/mobile/src/lib/db/repos/types.ts` still declares local unions and must re-export from core once #31 merges.

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

### Release gates, as-built docs and CI time

**CODE-R23 (MUST) (Proposed, pending founder)** Each release gate (feature freeze, alpha build, TestFlight build, store submission) has one file, written before the gate date, that lists every check, its owner and its evidence (CI run id, device run per CODE-R22, or decision id). The release record `docs/release/<version>.md` names that file. A gate passes only when every row has evidence; other docs link to the file and never restate its dates or rows. When chapter 11 lands (open PR #112), this rule moves there under a REL id. *Why:* a gate spread over several files cannot be checked in one place. *Evidence (IMP-85; panel 05 B5):* the 1.0.0 gates and dates sit in `docs/release/1.0.0.md` (line 17 cites the other sources), `docs/qa/ALPHA_GO_NO_GO.md`, `docs/release/AUTOMATION.md` section 6 and 0.2 item 17, D-089's proposed freeze, and the V1 to V4 rows of ADR 0027 (line 133 onward). *Enforced by:* not yet.

**CODE-R24 (SHOULD) (Proposed, pending founder)** A doc that describes as-built behaviour (`docs/ARCHITECTURE.md`, as-built reference pages) carries `verified_at: <commit sha>` and a `covers:` list of the code paths it describes. A PR that changes a covered path updates the page, or says in its body which page is now stale. *Why:* as-built docs drift silently when the code moves. *Evidence (IMP-85; panel 05 B5, F12):* `docs/ARCHITECTURE.md` lines 56, 105 and 114 still describe M4A capture after ADR 0027 flipped iOS builds to ADTS on 27 Oct (#293). The convention already exists, unmerged, in open PR #167 (`docs/reference/README.md` lines 20 to 25 and `scripts/docs/reference.mjs --check`). *Enforced by:* not yet; `reference.mjs --check` once #167 merges.

**CODE-R25 (SHOULD) (Proposed, pending founder; replaces "CI under 10 minutes end to end")** Each job in the `required` set of `.github/workflows/ci.yml` finishes in under 10 minutes on a normal run; the budget is per required PR job, not for every workflow. Device-class checks outside `required` (the iOS Release launch in `ios-compile.yml`, the kill harness) state their own timeout in the workflow and are not bound by this budget. *Why:* the old wording (TDD 07 section 10; `ci.yml` line 1; `.github/README.md` "Keeping CI under 10 minutes") read as a limit on all CI, which the macOS checks cannot meet. *Evidence (IMP-87; panel 02 qa Q9):* the last 10 successful `ci.yml` pull request runs on 28 Oct took 1.7 to 4.6 minutes wall time (runs 40644258804 to 40644879641). The iOS launch job took 16 to 30 minutes in its last 8 successful runs (for example 40637162592 at 16 and 40634821778 at 30). The kill harness gate size has a 340-minute timeout (`kill-harness.yml` lines 113 to 116). The source wording in TDD 07, `ci.yml` and `.github/README.md` is outside this PR and changes in a follow-up. *Enforced by:* each job's `timeout-minutes`; review.

## How to apply it

Before opening a PR:
- [ ] One concern? Under 800 lines and 30 files of product code (CODE-R02, proposed)? If not, split by layer: types, then logic plus tests, then wiring; or label `size:large` with a `Size:` line.
- [ ] Stacked? Only on a PR due to merge within 48 hours, with `Stacked on #N` first (CODE-R21, proposed).
- [ ] A `Done when:` line naming its evidence; a device run for mobile behaviour (CODE-R22, proposed).
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

1. Founder: accept 800 lines or 30 files of product code for CODE-R02, or pick another row of its table. Should docs-only PRs also have a ceiling? #124 changed 16,366 lines with 0 product lines and passes the proposed rule (#345 fixture).
2. MONO-04: compile packages to JS with an `exports` map, or keep raw TS and add explicit `.ts` extensions for Deno? Needs an ADR before the first Edge Function.
3. Should the CI size check (CODE-G1) block, or only label? Proposed: warn and label only, using `scripts/qa/pr-size.mjs` (#345), until the founder decides (`README.md` line 83, decision 9, recommended "label not block").

## References

Repo: `CLAUDE.md`; `docs/agents/BRIEF-2026-10-03.md` (decisions 1, 17; coordination rules); `docs/agents/OPERATING_MODEL.md` section 4; ADR 0010; `docs/tdd/07-quality-test-strategy.md` 2.1; `.github/pull_request_template.md`; `.github/workflows/ci.yml`; `packages/core/src/pipeline.ts`; `packages/core/src/plan.ts`; findings CORE-02, -03, -05, -06, -08, -13, MONO-01, -02, -04, -07, MOB-04, -08, PDATA-08 (architecture review 2026-10-03); D-035.

External:
- Google Engineering Practices, "Small CLs": https://google.github.io/eng-practices/review/developer/small-cls.html (checked 2026-10-03). One self-contained change; about 100 lines reasonable, 1000 usually too large; files touched also count.
- PostgreSQL, Appendix A "PostgreSQL Error Codes": https://www.postgresql.org/docs/current/errcodes-appendix.html (checked 2026-10-03). Applications should test the error code, not the message text.
