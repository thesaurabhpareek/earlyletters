# Backlog

The ordered list of work for Early Letters. Format and rules: ADR 0011 (`docs/adr/0011-requirements-and-agent-workflow.md`).
Window: 5 Oct to 30 Oct 2026 (4 weeks). Last re-planned: 2 Oct 2026 (PRD.md 1.2: founder decisions of 2 Oct; E1 promoted as one migration; 18+ entry gate, consent screen, recordings row and Read together limit added).

Requirements are cited, never copied. Sources: `docs/prd/PRD.md` (PRD-REQ, conflict log K-##; wins over A, B and C where they differ), `docs/prd/A-*.md` (A-REQ, A-NFR), `docs/prd/B-*.md` (B-REQ, B-NFR), `docs/prd/C-*.md` (C-REQ, C-NFR), `docs/legal/ENGINEERING_REQUIREMENTS.md` (LEGAL-REQ), `docs/legal/DELETION_AND_EXPORT_SPEC.md` (DATA-REQ; classes C, S, A, T in `docs/legal/data-policy.md` section 2). If a PRD and a LEGAL-REQ disagree, LEGAL-REQ wins until the founder decides.

---

## How a scheduled run uses this file

1. Pull `main`. Read `CLAUDE.md`, then this file.
2. Run `gh pr list --state open`. Any task whose `bl-###` appears in an open PR branch is taken.
3. Pick the **first** task in file order with `Status: ready`, `Mode: agent`, and every `Depends on` task `done`. Skip `human`, `blocked` and `needs-decision` tasks.
4. One task per run and per PR. Branch: `<type>/<area>-bl-###-<slug>` (for example `fix/db-bl-010-immutability`). PR title: `BL-###: <title>`.
5. Meet the Definition of Done below. If a task is bigger than one PR, open a PR that only splits it here (new BL numbers, same `Satisfies`), and stop.
6. In the same PR, change only this task's status line to `in-review (PR #n)`. Do not reorder or edit other tasks.
7. If tests fail and the fix is outside the task, open a **draft** PR titled `BL-###: blocked`, say why, and stop.
8. Never: apply a migration to a remote Supabase project, touch secrets or store accounts, edit an applied migration, weaken a test to make it pass, merge a PR, add an analytics or crash SDK, or edit a requirement document. Propose requirement changes in the PR body.

Issues: GitHub Issues are an inbox for the founder's bugs and ideas (labels `inbox`, `bug`, `idea`). Agents act on an Issue only after it is copied here as a task. A PR that finishes such a task writes `Closes #n`.

Status values: `ready`, `blocked (reason)`, `needs-decision (question)`, `in-review (PR #n)`, `done (PR #n)`.
Mode values: `agent` (a scheduled run may do it), `human` (founder, device, store or secrets), `pair` (interactive session with the founder).

---

## Definition of Done (every task)

A PR is done only when all of these hold. The PR template (BL-003) repeats them as a checklist.

1. **Tests.** `npm test`, `npm run typecheck` and `npm run test:db` pass locally and in CI. New behaviour has tests. Every test that proves a requirement starts its title with the ID in brackets, for example `[DATA-REQ-040] raw_sha256 cannot change`. Logic lives in `packages/*` (pure TS, vitest) wherever possible so it can be tested without a phone.
2. **Traceability.** PR body lists `Satisfies:` IDs, matching the task. `scripts/trace.mjs` passes once BL-002 is merged (no unknown IDs).
3. **Constitution.** Nothing writes, rewrites, summarizes or shapes a person's words. Machine edits go through `verifyEdits`. `raw_transcript` stays immutable.
4. **Content rules.** Every user-facing word lives in `packages/content` and passes `packages/content/test/rules.test.ts` (no em or en dashes, curly quotes, ellipsis characters or emoji; no fear, guilt or loss language; never imply AI writes; `{child}` never gendered; no streaks, points, badges or gap counts). The brand name comes only from `packages/brand`. If a rule test fails, fix the copy, not the test.
5. **Data classification.** Any new or changed table, column, Storage bucket, device store, SDK or vendor has its row in `docs/legal/data-policy.md` section 4 in the **same PR**, with one class (C, S, A or T) and its level (L1 Public, L2 Internal, L3 Confidential, L4 Restricted; PRD.md 7.10, PRD-REQ-010), owner and retention (DATA-REQ-001, DATA-REQ-002). The PR body states `Data classes touched:`. Content (C) and Sensitive (S) data never reach analytics, logs, crash reports, push payloads, URLs or support prefill (LEGAL-REQ-014, DATA-REQ-004).
6. **Privacy in tests.** Fixtures use only the fictional family "Asha". No real names.
7. **Database.** Schema changes ship as a new file in `supabase/migrations/`; applied migrations are never edited. Every new RLS rule has an access test in `supabase/tests` (LEGAL-REQ-024, B-NFR-003).
8. **Performance budgets.** If the task touches a budgeted path, the PR states the budget and how it was checked (unit timing, bundle size, or "needs device check" with a `human` follow-up task). Budgets in play this month: cold start p50 <= 1.2 s and p90 <= 2.0 s on iPhone SE 3, warm start p50 <= 400 ms, no awaited network or model load on launch (A-NFR-001, A-NFR-002); intro images <= 250 KB each and <= 1.5 MB total, no frame over 16.7 ms (A-NFR-003); first-run screens interactive <= 300 ms (B-NFR-008); Settings opens < 300 ms (C-NFR-007).
9. **Accessibility.** New screens: Dynamic Type to AX5 without truncation, VoiceOver labels, 44 pt targets, Reduce Motion honoured (A-NFR-005 to A-NFR-007, B-NFR-006, LEGAL-REQ-051).
10. **Scope.** One concern per PR. Status line updated to `in-review (PR #n)`.

---

## Week 1 (5 to 9 Oct): guardrails and database integrity

### E0. Workflow guardrails

#### BL-001 Point CLAUDE.md at the backlog
- Status: ready. Mode: agent.
- Satisfies: none (process; ADR 0011).
- Scope: add a short "Work selection" section to `CLAUDE.md` that links this file and its run protocol, and adds the `-bl-###-` branch pattern to "Branches and commits". No other edits to `CLAUDE.md`.
- Done when: the section is under 10 lines and `npm test` passes.

#### BL-002 Traceability check
- Status: ready. Mode: agent.
- Satisfies: none (process; ADR 0011).
- Scope: `scripts/trace.mjs` (Node, no dependencies). Collect IDs defined in the five source files (A/B/C-REQ, A/B/C-NFR, LEGAL-REQ, DATA-REQ). Collect IDs cited in this file, in test titles across `packages/*/test`, `experiments`, `supabase/tests`, and in `.github/pull_request_template.md`. Fail on any cited ID that is not defined. Write `docs/TRACE.md`: per requirement, its tasks and tests; list P0 IDs with no test as "not yet covered" (report only, never fail). Add `npm run trace` and call it from `npm test`.
- Done when: unit tests for the parser cover each ID family, including numbering gaps (DATA-REQ jumps from 006 to 010); a deliberately wrong ID in a fixture fails.

#### BL-003 Pull request template
- Status: ready. Mode: agent.
- Satisfies: none (process; ADR 0011).
- Scope: `.github/pull_request_template.md` with `Task: BL-###`, `Satisfies:`, `Data classes touched:`, `Budgets checked:`, `Closes #` (optional), and the Definition of Done as a checklist.

#### BL-004 Continuous integration
- Status: ready. Mode: agent. Depends on: BL-002.
- Satisfies: LEGAL-REQ-024 (access rules are tested on every change).
- Scope: `.github/workflows/ci.yml` on pull requests and `main`: Node 20, `npm ci`, `npm run typecheck`, `npm test`, `npm run test:db`. No secrets. Cache npm.
- Done when: the workflow runs green on its own PR.

#### BL-005 Founder setup for the workflow
- Status: ready. Mode: human.
- Satisfies: none (process).
- Scope: create Issue labels `inbox`, `bug`, `idea`; update the scheduled-run prompt to "follow the protocol at the top of docs/BACKLOG.md"; turn on branch protection for `main` requiring CI. Accept ADR 0011 or send it back.

### E1. Database integrity and governance

`supabase/migrations/20261002020000_data_governance.sql` fixes findings F1 to F9 in `DELETION_AND_EXPORT_SPEC.md` section 0. It was promoted from the draft as **one** migration on 2 Oct 2026 (commit 81d9546), not in slices, and its cases run in `npm run test:db` from `supabase/tests/data_governance.test.mjs`. It is written and tested but **not yet applied** to the live project (`supabase/APPLY.md`, BL-015). BL-010 to BL-014 below are therefore done in that one file; follow-up gaps get new tasks.

#### BL-010 Entry immutability, checksum and version history
- Status: done (commit 81d9546, `20261002020000_data_governance.sql`; live apply is BL-015). Mode: agent.
- Satisfies: DATA-REQ-040, DATA-REQ-041, DATA-REQ-042, DATA-REQ-046, DATA-REQ-013 (findings F2, F6, F7, F8).
- Scope: new migration with the immutability guard (including `created_at`), server-set `raw_sha256`, versioning of `machine_edits`, server-clock tombstones via `delete_entry` and `restore_entry`.
- Data classes touched: C (entries), A (versions metadata). Update `data-policy.md` rows for `entries.raw_sha256` from Draft to Live.

#### BL-011 Members see the book, not the raw transcript
- Status: done (commit 81d9546, `20261002020000_data_governance.sql`; live apply is BL-015). Mode: agent. Depends on: BL-010.
- Satisfies: DATA-REQ-003, DATA-REQ-047, LEGAL-REQ-024 (findings F3, F9).
- Scope: restrict non-author reads of `raw_transcript`, `machine_edits`, `stt_meta`; `photo_path` must start with `{child_id}/{author_id}/`; Storage read policy matches.
- Data classes touched: C.

#### BL-012 No cascade across authors, no orphaned books
- Status: done (commit 81d9546, `20261002020000_data_governance.sql`; live apply is BL-015). Mode: agent. Depends on: BL-010.
- Satisfies: DATA-REQ-012, DATA-REQ-014, DATA-REQ-015, DATA-REQ-016, B-REQ-016 (findings F1, F4, F5).
- Scope: replace `children.created_by ... on delete cascade`; contributors cannot update the child row; last parent cannot leave; `children_guard` and `child_members_guard`.
- Data classes touched: S (children), A (child_members).

#### BL-013 Audit log and deletion state machine
- Status: done (commit 81d9546, `20261002020000_data_governance.sql`; live apply is BL-015). Mode: agent. Depends on: BL-012.
- Satisfies: DATA-REQ-045, DATA-REQ-010, DATA-REQ-011, DATA-REQ-019, DATA-REQ-020, DATA-REQ-026, DATA-REQ-035, DATA-REQ-006, LEGAL-REQ-029, LEGAL-REQ-033.
- Scope: `audit_events` (enum-only detail), `deletion_requests`, `deletion_request_steps`, `legal_holds`, `purge_ledger`, `storage_purge_queue`, `request_account_deletion`, `cancel_account_deletion`, `purge_due`. Scheduling the hourly cron is a separate human task (BL-015). The `purge-worker` Edge Function is out of scope this month.
- Data classes touched: A (all new tables; content-free by construction).

#### BL-014 Policy acceptance records
- Status: done (commit 81d9546, `20261002020000_data_governance.sql`; live apply is BL-015). Mode: agent.
- Satisfies: LEGAL-REQ-001, LEGAL-REQ-009, A-REQ-034.
- Scope: new migration for `policy_acceptances` and `record_policy_act` per `docs/legal/POLICY_VERSIONING.md` sections 6 and 7; RLS so a user reads and inserts only their own rows and never updates or deletes; tests. LEGAL-REQ-001 replaces A-REQ-034's "stored on the profile".
- Data classes touched: A.

#### BL-015 Apply integrity migrations to the dev project
- Status: ready. Mode: human.
- Satisfies: DATA-REQ-006, DATA-REQ-005.
- Scope: founder applies `20261002010000_entries_select_policy.sql` then `20261002020000_data_governance.sql` to the dev Supabase project (us-west-1) following `supabase/APPLY.md` steps 1 to 7 (pre-flight, apply, checks, consent pepper), turns on the hourly `purge_due()` cron, confirms point-in-time recovery setting matches DATA-REQ-030 before any real family data.

#### BL-016 Data inventory check
- Status: ready. Mode: agent. Depends on: BL-002.
- Satisfies: DATA-REQ-001, DATA-REQ-002, LEGAL-REQ-041.
- Scope: extend `scripts/trace.mjs` (or a sibling script run by `npm test`) to parse `create table` and `add column` in `supabase/migrations/*.sql` and fail when a table or column has no row with a class in `data-policy.md` section 4. This is what makes Definition of Done item 5 enforceable.

---

## Week 2 (12 to 16 Oct): privacy plumbing and first-run foundations

### E2. Privacy plumbing (no vendor SDKs yet)

#### BL-020 Typed analytics catalogue and allowlist
- Status: ready. Mode: agent.
- Satisfies: LEGAL-REQ-003, LEGAL-REQ-017, LEGAL-REQ-016, A-NFR-012, B-NFR-001, C-NFR-005, C-REQ-034, PRD-REQ-016, PRD-REQ-018.
- Scope: new workspace `packages/analytics` (pure TS, no PostHog or Sentry dependency): event-name union with enum, count and duration props only (ADR 0008); `sanitize()` that drops non-allowlisted props and strings over 40 characters; consent gate default off with nothing queued before consent; `optOut()` on withdrawal; random analytics id. Full product catalogue (PRD.md K-01) from `docs/analytics`, plus A section 10, B-NFR-001 and C-REQ-034. Children only as ordinals and `child_count_bucket`.
- Data classes touched: T. Add the catalogue to `data-policy.md` section 4.

#### BL-021 Crash and log scrubber
- Status: ready. Mode: agent. Depends on: BL-020.
- Satisfies: LEGAL-REQ-014, A-NFR-012, DATA-REQ-004.
- Scope: pure `scrubEvent()` and `scrubBreadcrumb()` in `packages/analytics` matching Sentry's `beforeSend` shape: remove fields named like text, transcript, name, note, letter; drop URLs with `token_hash` or `/i/`; drop HTTP bodies and query strings. Tests use Asha fixtures.
- Data classes touched: T.

#### BL-023 Ask sequencer and analytics consent sheet
- Status: blocked (BL-020, BL-042). Mode: agent.
- Satisfies: PRD-REQ-001, PRD-REQ-016, LEGAL-REQ-003, LEGAL-REQ-008.
- Scope: pure `nextAsk(state)` in `packages/core` returning at most one of Keep the book, reminder prime, analytics consent per session after the first letter, never during recording, review or export; consent sheet with `analyticsConsent.*` copy, nothing preselected; Settings > Privacy row to change it. Tests prove no two asks in one session.
- Data classes touched: A (`policy_acceptances` for analytics consent).

#### BL-024 Server business aggregates
- Status: blocked (BL-013). Mode: agent.
- Satisfies: PRD-REQ-017.
- Scope: SQL views or a scheduled Edge Function computing daily counts (accounts, books, letters saved, family letters, books per family bucket); RevenueCat totals later. Counts only; no ids leave the database. Service role only, with an access test.
- Data classes touched: T (L2).

#### BL-022 Kill switches and remote config shape
- Status: needs-decision (which remote config source: Supabase table or PostHog flags? ADR 0008 vs C-NFR-009). Mode: pair.
- Satisfies: LEGAL-REQ-040, C-NFR-009, A-REQ-011.

### E3. First run, local-first (letter before account)

#### BL-030 Day-1 component spike on a real iPhone
- Status: ready. Mode: human (needs a dev build on a phone).
- Satisfies: none directly (ADR 0101 section 8 gate for all UI tasks).
- Scope: prove Uniwind, Reanimated 4.5.1, Expo Router form sheet and one Expo UI `Host` render together with the React Compiler on. Record result in ADR 0101.

#### BL-031 URL scheme derived from the brand package
- Status: ready. Mode: agent.
- Satisfies: A-NFR-010.
- Scope: replace the scaffold scheme `lumiraletters` in `apps/mobile/app.json` with one derived from `packages/brand` (move to `app.config.ts` if needed). Redirect allowlist work waits for the real domain (`brand.company.domain` is still `example.com`).

#### BL-032 Local store and atomic save
- Status: needs-decision (ADR 0004 picks op-sqlite with PowerSync; the app currently ships `expo-sqlite`. Confirm op-sqlite now, or expo-sqlite for dogfood with a planned swap). Mode: pair.
- Satisfies: DATA-REQ-048, DATA-REQ-044, A-REQ-030, B-NFR-009.
- Scope after decision: local schema mirroring `entries`, `children`, `profiles`, `dictionary_terms`; one transaction per letter save (text, audio reference, dictionary updates); idempotent client ids.
- Data classes touched: C, S, A (device store row in `data-policy.md` 4.x).

#### BL-037 18+ entry gate and stop screen
- Status: ready. Mode: agent (mobile engineer; Declared Age Range needs a human sandbox check).
- Satisfies: PRD-REQ-019, LEGAL-REQ-002, A-REQ-012.
- Scope: before any first-run screen, story 4 action or invite flow, ask "Are you 18 or older?" (Yes, No, nothing preselected) with `ageGate.*` copy; iOS Declared Age Range where required, used in memory only. Yes stores a device boolean; No or an under-18 signal shows the stop screen, creates nothing (no child, letter, recording, dictionary term or auth user, no network call) and stays for 24 hours before the question can be asked again. No local-only mode. Gate logic (state, 24-hour window) as a pure tested module. PRD.md checklist 6.1 lines for PRD-REQ-019.
- Data classes touched: device store, L2 (`DATA_CLASSIFICATION.md` 4.6 row "18+ entry gate state"; add the data-policy row in the same PR).
- Note: `ageGate.stopBody` uses an `{app}` placeholder that the content rules test does not allow; fix the copy (not the test) before this merges.

#### BL-033 Minimal first-run profile
- Status: blocked (BL-032, BL-037). Mode: agent.
- Satisfies: B-REQ-001, B-REQ-002, B-REQ-003, B-REQ-006, B-NFR-007, B-NFR-009, LEGAL-REQ-012, A-REQ-035.
- Scope: child name and birthday or due date (required), "What does {child} call you?" signature, languages and Hindi script preference; names and signature seed dictionary terms through `packages/core`. Works offline. Birthdays stored as calendar dates. Copy in `packages/content`.
- Data classes touched: S (child name, date of birth, languages), A (signature).
- Budgets: B-NFR-008 (interactive <= 300 ms).
- Note (PRD.md PRD-REQ-015, decided 2 Oct): "Add another child" in first run creates one book each, with no Plus sheet, for twins or any children added together; mark them as the first-run batch so `create_child` accepts them at sign-up without Plus.

#### BL-034 Child switcher and per-child local scope
- Status: blocked (BL-032, BL-033). Mode: agent.
- Satisfies: B-REQ-004, PRD-REQ-011, PRD-REQ-012.
- Scope: every local query scoped by `child_id`; "For {child}" switcher and "Whose book?" sheet with `children.switcher.*` copy; "To {child}" in recording and Review, changeable before save; last opened child per device. Logic (selection, ordering, defaulting) in `packages/core` with tests.
- Data classes touched: S (device store).
- Budgets: switch child p95 300 ms (PRD.md 7.1).

#### BL-035 Per-child settings
- Status: blocked (BL-034). Mode: agent.
- Satisfies: PRD-REQ-013, B-REQ-014, C-REQ-012, C-REQ-016.
- Scope: Settings > Children list and "{child}'s book" page with the three scopes in PRD.md K-12 (book, person per child, person global); hide and show again; include in my reminders; pause celebrations per person per child. All rows 2 taps or fewer. Copy `children.settings.*`.
- Data classes touched: S, A (local now; server table `child_member_prefs` belongs to the data architect).

#### BL-036 Additional-child Plus rule (pure logic)
- Status: ready (decided 2 Oct 2026: every child added together in first run is free, and books joined as a co-parent do not count; PRD.md PRD-REQ-015). Mode: agent.
- Satisfies: PRD-REQ-015.
- Scope: pure `canCreateBook({booksStarted, hasPlus, inFirstRunBatch})` in `packages/core` with tests. `booksStarted` counts non-deleted books the user started (hidden included), never books joined as co-parent; `inFirstRunBatch` is true for every child added together in first run, whatever their dates. The app shows `children.add.*` (including `joinedNote`) and the Plus sheet; server enforcement in `create_child` follows with the entitlement work (data architect). If the founder narrows the first-run rule to same-date multiples (PRD.md section 9 Q9), add that one condition.

---

## Week 3 (19 to 23 Oct): entry experience

#### BL-040 Launch path and splash
- Status: blocked (BL-030). Mode: agent, then human device check (BL-044).
- Satisfies: A-REQ-001, A-REQ-002, A-NFR-001, A-NFR-002.
- Scope: branded splash that hides on first layout; nothing awaited on launch; analytics initialised after first frame.
- Budgets: A-NFR-001, A-NFR-002.

#### BL-041 Story intro
- Status: blocked (BL-030). Mode: agent.
- Satisfies: A-REQ-004, A-REQ-005, A-REQ-006, A-REQ-007, A-REQ-008, A-REQ-009, A-REQ-010, A-NFR-003, A-NFR-005, A-NFR-006, A-NFR-007.
- Scope: four stories, tap, swipe and hold; auto-advance off under VoiceOver, Switch Control and Reduce Motion; shows once per install. Timing logic in a pure, tested module. Story copy from A section 4 in `packages/content`.
- Budgets: A-NFR-003 (asset sizes checked by a test over the bundled files).

#### BL-042 Recording and saving the first letter (audio local, rules-only clean)
- Status: blocked (BL-032, BL-033). Mode: agent.
- Satisfies: A-REQ-012, A-REQ-030, DATA-REQ-048, LEGAL-REQ-007, LEGAL-REQ-019.
- Scope: record with primed microphone permission and accurate purpose string; save letter locally through `packages/core` pipeline and `verifyEdits` with the rules-only clean (ARCHITECTURE Phase 0); typed entry is the fallback until on-device transcription lands. No diarization or voiceprints.
- Data classes touched: C.

#### BL-043 On-device transcription spike (whisper.rn)
- Status: ready. Mode: human (dev build, real recordings, `npm run experiment`).
- Satisfies: none directly (ARCHITECTURE section 10 Phase 0; ADR 0001).
- Scope: model download on Wi-Fi, latency on the oldest supported iPhone, decide turbo vs small default. Result goes into ADR 0001.

#### BL-044 Device budget check
- Status: blocked (BL-040, BL-041). Mode: human.
- Satisfies: A-NFR-001, A-NFR-003, B-NFR-008.
- Scope: measure cold and warm start and first-run interactivity on iPhone SE 3; paste numbers into the PRs.

---

## Week 4 (26 to 30 Oct): keep the book (sign-in after the first letter)

#### BL-050 Keep-the-book sheet with notice, terms and age gate
- Status: blocked (BL-014, BL-042). Mode: agent.
- Satisfies: A-REQ-013, A-REQ-014, A-REQ-031, A-REQ-034, LEGAL-REQ-001, LEGAL-REQ-045.
- Scope: sheet after the first save with Apple, Google, Email and Later; child-data notice and the Terms line with the 18+ confirmation above the buttons (the age question itself is the entry gate, BL-037; record `age_attested` in the `terms` acceptance context); Later keeps everything working locally and the sheet returns at most once a day. Age range is never stored.
- Data classes touched: A (`policy_acceptances`).

#### BL-054 Sensitive-data consent screen
- Status: blocked (BL-050). Mode: agent.
- Satisfies: PRD-REQ-002, LEGAL-REQ-006, A-REQ-034.
- Scope: one plain screen after a new account is created and before the first sync, copy `sensitiveConsent.*` (counsel to approve; consumer-health-data-notice.md HN-4). "Agree and sync" records `sensitive-data` accept; "Keep on this phone" records decline and keeps sync, backup and family off. Settings > Privacy row shows `settings.privacy.sensitiveHelp` and allows withdrawal with the offer to delete synced letters.
- Data classes touched: A (`policy_acceptances`).

#### BL-051 Email link and code sign-in
- Status: blocked (BL-050; custom SMTP on the brand domain needs BL-053). Mode: agent.
- Satisfies: A-REQ-018, A-REQ-023, A-REQ-024, A-REQ-025, A-REQ-027, A-NFR-008.
- Scope: one email with link and 6-digit code; scanner-safe page; resend limits; session tokens only in Keychain-backed storage.
- Data classes touched: A.

#### BL-052 Re-own local letters on sign-in
- Status: blocked (BL-032, BL-051). Mode: agent.
- Satisfies: A-REQ-015, DATA-REQ-044.
- Scope: move every local row to the signed-in user id in one transaction before any sync; on failure nothing changes and Retry shows. Tests cover crash mid-transaction (A-NFR-013: no lost letter).

#### BL-053 Sign-in provider and email setup
- Status: needs-decision (company name, domain and legal entity are still placeholders in `packages/brand`; founder reports earlyletters.com, .app and .co available on 2 Oct 2026, choice pending; PRD.md section 9 Q5). Mode: human.
- Satisfies: A-REQ-016, A-REQ-022, A-REQ-026, A-NFR-009, LEGAL-REQ-026.
- Scope: real domain; custom SMTP with SPF, DKIM, DMARC; Apple Services ID and key with a named owner and rotation date; Google client ids; AASA and `assetlinks.json`. Secrets stay out of the repo.

---

## Later (not in this window, kept for ordering)

- Apple and Google native sign-in UI (A-REQ-016, A-REQ-017), after BL-053.
- Invites and family (B-REQ-007 to B-REQ-011), after sign-in. Per-child sharing and the cross-child leak test (PRD-REQ-014).
- Export, free and offline (C-REQ-017, LEGAL-REQ-034, DATA-REQ-050 to DATA-REQ-053).
- In-app account deletion flow and `purge-worker` (C-REQ-019, DATA-REQ-019 to DATA-REQ-027, DATA-REQ-033, DATA-REQ-034).
- Reminders (C-REQ-001 to C-REQ-007, LEGAL-REQ-054).
- Plus and paywall (C-REQ-020 to C-REQ-029, LEGAL-REQ-046 to LEGAL-REQ-049). Account-level entitlement and `book_has_plus` (PRD.md K-28); server-side `create_child` Plus check (PRD-REQ-015); notice schedule per PRD.md K-04 (PRD-REQ-003).
- Vendor wiring for PostHog and Sentry behind `packages/analytics` after counsel approves the consent copy (PRD-REQ-016; event volume of about 13M a month at 100k families accepted by the founder 2 Oct 2026, PRD.md K-01).
- Read together free-session limit (PRD-REQ-020): remote config `read_together_free_sessions`, default 3, audit-logged; after BL-022 decides the config source. Fourth session opens the Plus sheet; single-recording playback never limited.
- Recordings row conditional on backup (PRD.md K-21): show `settings.recordings.onPhone*` while backup is off and `backedUp*` while it is on; remove `settingsMore.signedOutHelp` and `deleteAccountNotYet` in the release that ships sign-in. With the backup work.
- Beta label removal: only when the founder ends the beta (PRD.md K-13); one release removes `settings.about.beta.*`, the store beta lines and Terms 16.4.
- Printed books: future launch, not in v1 (PRD.md K-32); C-REQ-033 and ADR 0007 stay as roadmap.
