# Conventions for the next-set requirements (one page)

Status: draft, 8 Nov 2026 (UTC). Docs only. Written after the engineering readiness audit (`../12-engineering-readiness-audit.md`, gap G-30). It assigns no real id and reserves nothing.

## 1. The working id

Every requirement has one stable working id: `NX-<theme>-R<n>`.

- `<theme>` is the two-digit theme number of the file (`NX-02-R5` is theme 2, row 5). Files added later keep the backlog rank as their number (`NX-15-R1` is backlog rank 15).
- `R<n>` never changes and is never reused. If a row is split, the children are `R5a`, `R5b` (the parent stays as a heading, like `F16-REQ-029a`). If a row is dropped, the id stays in the file as "Dropped on <date>: <reason>".
- One behaviour per id (RR-2). If a Then clause needs "and" between two behaviours that can fail separately, split it.
- The id is a working label. It is not an `F##-REQ-###` id and not a `BL-###` id, so `scripts/trace.mjs` (whose `ID_SOURCE` only matches `X-REQ-nnn` and `X-NFR-nnn`) neither counts nor flags it. That is deliberate: the ids cannot be reported as "undefined" while they are still labels.

## 2. How a test names the requirement

A test title that proves a requirement starts with the id in square brackets, as in `COORDINATION.md` section 10 and `CLAUDE.md`:

```
test('[NX-02-R5] forced sign-out runs once per epoch after the outbox drains', ...)
```

- One bracket per id. A test that proves two rows carries two brackets: `[NX-02-R5] [NX-02-R4] ...`.
- A device or Maestro row names the id in its `tags:` list (`apps/mobile/e2e/README.md` section 2) and in its row text in `docs/qa/DEVICE_TEST_PLAN.md`.
- A database test (`supabase/tests/*.test.mjs`) and a function test (`supabase/functions/*/handler.test.ts`) use the same bracket in the test name.
- Every row in a theme file has a line in that file's "Trace and tests" table: id, the existing requirement it refines, the layer, the file path, the exact title, and the device or ops row. A path marked "proposed" does not exist yet.
- A row that cannot be checked by a test (a decision, a study) is labelled `HYPOTHESIS` and carries "Test: none, study" with the owner (`user-research`). It is not handed to an engineer as a build row.

## 3. The trace link line

Each theme file ends its "Trace and tests" table with one line:

`Trace: NX-02-R1..R10 -> F02-REQ-001, -003, ...` (the F##-REQ ids the theme refines, copied from its "Refines" row, never changed here).

## 4. Converting a working id to a real id without renaming anything

When `product` adds a backlog row or a PRD requirement for a working id:

1. Product takes the id from `node scripts/agents/next-id.mjs` (never guesses, never reuses `BL-621`, `D-139`, `D-141`, `D-142` while those clashes stand) and writes the backlog row with `Satisfies:` naming the real `F##-REQ-###` (or a new one in the feature spec).
2. Product adds one line to `_ID-MAP.md` in this folder: `NX-02-R5 | F02-REQ-023 | BL-7xx | date`. The map is the only place that holds both names.
3. The test title keeps `[NX-02-R5]` and gains the real bracket beside it: `[NX-02-R5] [F02-REQ-023] ...`. `trace.mjs` then sees the real id; the working id stays searchable. Nothing is renamed, so no PR has to touch a test only to change a label.
4. When the feature spec carries the row (a `F##-REQ-###` definition), the theme file's row gets "Defined as F02-REQ-023" and stops being the source. After one release the NX bracket may be dropped in a normal edit; it is optional.

`_ID-MAP.md` does not exist until the first conversion. Product creates it then.

## 5. Every theme file carries, in this order

1. A `Readiness` line (score out of 28 against the 14-point Definition of Ready in the audit, section 1, what remains).
2. For themes that wait on a founder decision or counsel: a `Blocked on` block (exact question, recommended default). The theme stays "not ready" until the answer is on record; everything else in it is finished.
3. The customer's side, then the check table (Given, When, Then with a number, why it fails on old code, tag).
4. Door lines (Shown, Records, Never, Decline and withdraw) wherever a person agrees to something (COORDINATION section 10).
5. Edge cases, offline behaviour, never, copy, analytics, device rows, dependencies.
6. The "Engineering block" (API contract, budget, accessibility, switch and rollback, data class, schema and grants, analytics catalog status).
7. The "Trace and tests" table.
8. Founder-only decisions and "Not verified".

## 6. Rules for facts

- A claim about code names the file, and was searched on the tree it is dated for. "Fails on old code" states the behaviour the tree has today, never "because PR #nnn is a draft" (a draft that merges would make the claim false).
- A count that CLAUDE.md or a tool owns (test files, function folders) is stated as "what the script lists" with today's number marked "today", or not stated.
- Numbers come from `docs/prd/v2/06-nfr.md` by row. A number marked "proposed" is a target, not data.
- Copy keys are named under the real `packages/content` namespace and are marked `exists` or `new`. A registered string is flagged for counsel.
- An analytics event is marked `in catalog` or `add to catalog first` (`packages/analytics/src/catalog.ts` and `docs/analytics/TRACKING_PLAN.md` in the same PR). Analytics are off in every 1.0 profile (D-124 item 3), so an event "in catalog" still sends nothing in 1.0.
- No em dashes, en dashes, curly quotes, ellipsis characters or emoji. Never gender the child; use {child}. Nothing implies a machine writes the family's words.
