# Engineering compendium

How we build Early Letters: the standards every engineer and every agent follows, owned by five steward agents, applied to every PR, and kept true to the code. Adopted 2026-10-03 (ADR 0017).

**Start with `PRINCIPLES.md`.** It is one page, every agent run loads it, and each line names the rules behind it. Open a chapter only when your work touches its paths, and search it by rule id.

## Chapters

| # | Chapter | Rule prefix | Owner (steward) | Second reviewers | Covers |
|---|---|---|---|---|---|
| 01 | [Code and change](01-code-and-change.md) | CODE | `principal-architect` | ai-eng-lead, data-steward | PR size and scope, module boundaries, one definition per type and enum, typed errors, dependencies, tests as specification, flags |
| 02 | [API and contracts](02-api-and-contracts.md) | API | `principal-architect` | data-steward, security-architect | RPCs and Edge Functions, idempotency, error registry, versioning for old app builds, pagination and sync cursors, latency budgets, rate limits |
| 03 | [Database and schema](03-database-and-schema.md) | DB | `data-steward` | security-architect, compliance-engineer | Naming, UUIDv7 ids, migrations, RLS and grants, definer functions, read and write paths, tombstones, immutability, cascades, indexes |
| 04 | [Data quality and lifecycle](04-data-quality-and-lifecycle.md) | DQ | `data-steward` | compliance-engineer, security-architect | Classification, the data map, validation at boundaries, invariants, retention and purge, storage layout, analytics hygiene, test data, backups |
| 05 | [Identity and access](05-identity-and-access.md) | IAM | `security-architect` | data-steward, compliance-engineer | Users, members and roles, sign-in, sessions, authorisation in the database, invites, removal, service keys |
| 06 | [Security engineering](06-security-engineering.md) | SEC | `security-architect` | principal-architect, ai-eng-lead | Threat models, secrets, supply chain, repository protection, device data at rest, deep links, agent security, DNS and email, incidents |
| 07 | [Privacy engineering](07-privacy-engineering.md) | PRIV | `compliance-engineer` | security-architect, data-steward | Minimisation, purpose, consent, content-free telemetry, vendors, no training on user content, claims register, privacy labels |
| 08 | [Data rights and legal requests](08-data-rights-and-legal-requests.md) | DSR | `compliance-engineer` | security-architect, data-steward | Runbook for delete, export, access, correction, consent withdrawal, analytics forget and legal process: intake, verification, scope, deadlines, proof |
| 09 | [AI-assisted engineering](09-ai-assisted-engineering.md) | AIE | `ai-eng-lead` | principal-architect, security-architect | How agents are instructed, given context, shaped into tasks, verified, reviewed and evaluated; research in [research/ai-engineering-sources.md](research/ai-engineering-sources.md) |
| 10 | [Logging and observability](10-logging-and-observability.md) | OBS | `principal-architect` | compliance-engineer, security-architect | Structured logs, request ids, what each layer logs, log clocks, Sentry scrubbing, SLOs and alerts |

Also here: [ENFORCEMENT.md](ENFORCEMENT.md), every MUST rule with what enforces it today.

## Where this sits among the rules

When two sources disagree, the higher one wins (AIE-R01):

1. `CLAUDE.md` (the constitution, privacy and content rules) and the legal requirement documents (`docs/legal/ENGINEERING_REQUIREMENTS.md`, `docs/legal/DELETION_AND_EXPORT_SPEC.md`).
2. Founder instructions: comments by the founder in a journal or on a PR, the latest `docs/agents/BRIEF-*.md`, and `D-###` decisions in `docs/DECISIONS.md`.
3. `docs/agents/OPERATING_MODEL.md` (how agents work).
4. This compendium: `PRINCIPLES.md`, then the chapters.
5. The agent's charter, then its memory, then the task text.

ADRs and technical design docs (`docs/adr/`, `docs/tdd/`) record what we built and why; they are design references, not instructions. When one conflicts with a chapter, the chapter's owner reconciles them in a PR.

A chapter never restates a requirement; it cites the id (`DATA-REQ-0xx`, `LEGAL-REQ-0xx`, `D-0xx`) and states the engineering rule that makes it hold.

## How the compendium is enforced

| Mechanism | What it does | Where |
|---|---|---|
| Every run reads the principles | `brief.mjs` adds `PRINCIPLES.md` to every agent's reading order | `scripts/agents/brief.mjs` |
| Steward review by path | The dispatcher assigns a steward any open PR that touches its `review_paths` and lacks its verdict for the head commit. "Fix first" sends the author back to fix it | `agents/roster.json`, `docs/agents/AGENT-COMMS.md` section 7 |
| Checks in code | Tests, database constraints, CI jobs and lint rules listed per rule in `ENFORCEMENT.md` | the rule's *Enforced by* line |
| Turning wishes into checks | Each steward's standing duty 2: convert one `not yet` rule into a real check, or a backlog proposal, per run | each steward's charter |
| Red team and founder | Every PR still gets the red-team review and the founder's merge; `supabase/**` and auth changes also need `approve-migration` (D-041) | `docs/agents/OPERATING_MODEL.md` |
| Consistency check | `check.mjs` fails if a chapter's `owner` is not on the roster | `scripts/agents/check.mjs` |

Status on 2026-10-03: of 192 MUST rules, 42 are enforced on `develop`, 39 are pending in open PRs (mostly #26 to #32), 30 are partly enforced or review-only, and 81 have no check yet. The `not yet` rows are the stewards' work queue.

## Changing a standard

1. Anyone (agent or human) who thinks a rule is wrong says so: an agent opens an `rfc` handoff to the chapter's owner and the other four stewards (`node scripts/agents/handoff.mjs open --kind rfc`).
2. The owner drafts the change in a PR that edits the chapter, `ENFORCEMENT.md` and, if needed, `PRINCIPLES.md`. Every other steward replies with a position on the RFC.
3. A new or changed MUST rule merges only with the founder's approval. SHOULD and wording changes follow normal review.
4. Rule ids are permanent. A retired rule keeps its id, marked `(RETIRED: reason)`; its number is never reused.
5. Exceptions to a MUST rule are granted only by the founder: a `D-###` for a standing exception, or an `Exception:` line in the PR body for a one-off.

Chapters carry `last_reviewed` in their header. Owners run a conformance sweep of their chapters against the code as a standing duty, and refresh external references at most once a quarter.

## Writing a chapter or a rule

- Format: frontmatter (`chapter`, `title`, `owner`, `reviewers`, `status`, `last_reviewed`, `applies_to`), then Purpose, Principles, Rules, How to apply it, Exceptions, Open questions, References.
- A rule is one sentence an agent can test against a diff: `**DB-R12 (MUST)** ... *Why:* ... *Enforced by:* ...`. Levels follow RFC 2119 (MUST, MUST NOT, SHOULD, SHOULD NOT, MAY).
- 120 to 220 lines per chapter. Plain English, no em or en dashes, curly quotes, ellipsis characters or emoji.
- Cite only repo facts you found and sources you opened, with the date checked. Legal readings are labelled "engineering reading, confirm with counsel".
- Domain glossary: entry (code and DB) = letter (UI); child = book; `parent` and `contributor` = "Co-parent" and "Family"; `date_of_birth`; plan (state) vs Plus (product); `publisher`, not `company`.

## Decisions the stewards need from the founder

Collected from the five chapters on 2026-10-03, most consequential first. Each chapter's *Open questions* section has the detail.

| # | Decision | Recommended default | Raised by |
|---|---|---|---|
| 1 | Build the purge worker (PDATA-02) and device purge (PPRIV-01) before any beta family's data reaches a backend? Today the published 31, 38 and 45-day deletion promise has no executing code | Yes | compliance-engineer, data-steward |
| 2 | Turn on branch protection on `develop` and `main` (which on a private repo needs GitHub Pro or Team), and pause unattended agent runs and remove agent write connectors until it is on (CI-01, CI-04, PINF-01) | Yes | security-architect, ai-eng-lead |
| 3 | When a contributor leaves or is removed, are their letters kept in the book or tombstoned? | none given | data-steward, security-architect |
| 4 | Can one parent remove the other co-parent: yes, only the book creator, or only with both parents' agreement (WS-02)? | none given | security-architect |
| 5 | One contract package named `packages/api` holding generated DB types, the SQLSTATE registry, typed RPC wrappers and content-block schemas (BRIEF 17 vs WS-04) | `packages/api` | principal-architect |
| 6 | Approve the D-023 sync engine (outbox plus cursor pull) by 16 Oct, so `server_seq` and tombstone pull can be specified | Approve | data-steward |
| 7 | Switch `entries.author_id`, `children.created_by` and the `profiles` cascade from `auth.users` to `restrict`, so a dashboard delete fails closed (DB-17) | Yes | data-steward, security-architect |
| 8 | Sign-in at v1.0: BRIEF decision 4 lists Google; D-044 moves Google to v1.1. Chapter 05 follows D-044 | Confirm D-044 | security-architect |
| 9 | PR size limit of 400 lines and 20 files for everyone; block the merge or only label `size:large` and require an `Exception:` line? Lower limit for agent PRs? | 400/20, label not block | principal-architect |
| 10 | How long an old app build keeps working against the server | 180 days after its successor ships | principal-architect |
| 11 | Claims register: one file, `docs/legal/CLAIMS.md` (WS-19) or `docs/legal/claims-registry.yaml` (LEGAL-REQ-044) | One file; pick either | compliance-engineer |
| 12 | Set the real privacy and support address in `packages/brand/index.ts` (still a placeholder) | Before beta | compliance-engineer |
| 13 | Replace the `revenuecat` deletion step with `appstore_mapping` in a pending migration (spec v1.1.0, ADR 0013) | Yes | compliance-engineer |
| 14 | Who keeps the request log until a `privacy_requests` table exists | Founder, in the support mailbox, fields per DSR-R05 | compliance-engineer |
| 15 | Deep-link scheme: keep `scribe` or rename before the first build (DOC-17) | Rename | security-architect |
| 16 | Email sign-in codes: 6 or 8 digits before public launch (TDD 04 OQ-S1) | none given | security-architect |
| 17 | Compile packages to JS with an `exports` map, or raw TS with explicit `.ts` imports for Deno (MONO-04)? Needs an ADR before the first Edge Function | ADR first | principal-architect |
| 18 | Alert channel for Sev 1 and 2: Sentry alerts or a new push or SMS service | Sentry alerts | principal-architect |
| 19 | Where scheduled data invariant checks run (pg_cron or an Edge Function) | none given | data-steward |
| 20 | `AGENTS.md`: forbid it, or add a root `AGENTS.md` symlinked to `CLAUDE.md` so OpenCode reads the constitution | Symlink | ai-eng-lead |
| 21 | Thresholds that move an agent to a stronger model: acceptance under 50% over 10 PRs, fix-first over 50%, or caps hit on over 20% of runs | Confirm | ai-eng-lead |
| 22 | Backfill `Done when:` on ready agent tasks now, or as each comes up (AIE-G4) | As each comes up | ai-eng-lead |
| 23 | Counsel pack via `legal`: which state laws apply at launch, COPPA framing for adult-written content about children, D-050, legal-hold notice, analytics on cancelled deletion | Send to counsel | compliance-engineer |
| 24 | Team daily run cap: the roster now requests 50 runs a day against a cap of 30 (stewards add 10). Raise the cap to 40? At the harness's own estimate a typical DeepSeek run is about $0.04 | Raise to 40 | coordinator |
