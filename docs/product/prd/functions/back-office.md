# Function review: back office and internal tooling (BKO)

Owner: a Claude role playing operations and support engineering, second wave. Written 20 Nov 2026 (UTC) under `docs/product/prd/functions/BRIEF.md`, on branch `docs/locked-pack-inputs-20nov`. Docs only: nothing here is built, no string is live, no decision is recorded.

The writer is a Claude role. It is not a lawyer, an auditor or a security professional. Every legal reading says "counsel must confirm". Words a parent would read are intent only: `content` writes them and the founder approves. Every example family is the fictional family Asha.

What this file adds. The first wave wrote the support rules (`support.md`, SUP and POL), the runbook gaps (`operations.md`, OPS), the security rows (`risk-security.md`, SEC and RSK) and the privacy rows (`privacy.md`, PRV). None of them asks the question this file asks: how does a team of one founder plus agents actually run this product, day to day, without ever reading a family's words? So this file does four things: it lists the tooling that exists and the tooling that is missing, it fixes who may see what, it writes the operating rules that the first-wave rows assume (lookups, hand recovery, requests, reports, pausing, keys), and it lists the runbook cards that still need writing. Where a first-wave row already says it, this file points to its id and does not repeat it.

---

## 1. What I reviewed, and what I did not

### Read this session (all at branch head on 20 Nov 2026)

| Source | What for |
|---|---|
| `docs/product/prd/functions/BRIEF.md`; `docs/product/prd/README.md`; `18-errata-after-lock.md` | Format, linking, locked-card rules, E21 (kill-switch header) |
| `docs/product/prd/GAP-LOG.md` (grep for support, runbook, W-G11) | Where a runbook is named and does not exist |
| `functions/support.md` (sections 1 to 3 in full; FR-SUP-01 to 23, FR-POL-01 to 13 by row); `functions/operations.md` (FR-OPS-01 to 36 by row); `functions/privacy.md` (FR-PRV-01 to 35 by row); `functions/risk-security.md` (FR-SEC-01 to 26, FR-RSK-01 to 06, RSK-22 by row); `functions/compliance.md`, `legal.md`, `data-and-measurement.md` (row lists only) | What not to duplicate |
| `10-reading-and-family.md` lines 715 to 784 and 835 (NS-25 unhappy paths, R1 to R19, threat row); `19-from-download-to-first-letter.md` (card heads NS-38 to NS-45, grep for support and recovery lines) | The co-parent safety gap; first-run help |
| `docs/ops/runbooks/data-requests-by-email.md` in full (277 lines); `sign-everyone-out.md` lines 1 to 50; `suspected-data-leak.md` lines 1 to 40; `stuck-deletion.md` lines 1 to 40; `underage-account.md` lines 1 to 30; the runbook folder listing | Existing runbooks |
| `docs/ops/SECURITY.md` lines 1 to 80 and 112 to 125 (secrets, scripts, console 2FA); `docs/ops/PACKS_HOSTING.md` (grep: signing keys, kill switches, 5-minute reach); `docs/ops/RELEASE.md` (grep: kill switches); `docs/ops/DOMAINS.md` lines 125 to 140 (aliases) | Keys, switches, mail |
| `docs/engineering/06-security-engineering.md` lines 85 to 120 (SEC-R23 to R25, open questions 2 and 4); `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-025, -026; `docs/legal/DATA_CLASSIFICATION.md` (logging row line 69, support mailbox row line 770) | Access, audit, classification |
| `supabase/migrations/20261004200000_ops_deletion_worker.sql` lines 30 to 101 and 375 to 395 (`ops.audit_log`, `ops_audit_write`); `scripts/ops/lib/runbook.ts` lines 1 to 40; `scripts/ops` file list | What the audit log can hold today |
| `packages/api/src/kill-switches.ts` (the key list and server parse); `packages/api/src/remote-config.ts` (grep `forceReauthEpoch`) | What can be paused |
| `docs/legal/privacy-policy.md` lines 53 to 57 (who can see letters); `docs/legal/terms-of-service.md` sections 4.4, 9, 10, 11; `docs/legal/COUNSEL_PACKET.md` Q46, Q49, Q50, Q57 headings and the Q-number tail (last number is Q57); `packages/brand/index.ts` lines 34 to 70 and 147 to 149 | Promises staff must keep |
| `docs/BACKLOG.md` BL-236, BL-237, BL-551, BL-552, BL-597, BL-598 (full rows) and BL-994 to BL-999 | Backlog |
| `docs/agents/HARNESS.md` (grep: secrets, tokens, switch on, merge); `docs/agents/` is otherwise unread | How agents run |
| e2e design on `origin/docs/e2e-ux-20nov` at `3dabf9614`: the screen-id tables of `C-keeping-and-trust/DESIGN.md`, `D-family-sharing-reminders/DESIGN.md` and `E-foundations-and-system-states/DESIGN.md` | Screen ids |

### Outside sources read this session

| Fact | Source |
|---|---|
| Supabase Platform Audit Logs: "only available on the Team and Enterprise plans". They log Platform API and dashboard actions by organization members (creating a project, inviting members, changing settings). The page does not say whether SQL Editor queries or data reads are logged, and gives no retention period ("depend on your plan") | https://supabase.com/docs/guides/platform/audit-logs (read 20 Nov 2026) |

Everything else about Supabase, Apple or any vendor that appears below is quoted from repo files that cite their own reading dates (for example `sign-everyone-out.md` section 1, read 8 Nov 2026). I did not re-read those vendor pages. Treat them as repo evidence, not as verified here. Where I say UNVERIFIED, the repo does not settle it.

### Not read, not run

- I ran nothing: no phone, no Supabase project, no dashboard, no script, no database. Everything is a reading of files.
- `agents/roster.json`, `docs/agents/OPERATING_MODEL.md`, `AGENT-COMMS.md`, `COORDINATION.md` section 10 beyond what the first-wave files quote, the `.claude/agents/*.md` charters other than what `support.md` quotes. I do not know which agent identities hold which tokens.
- `docs/ops/runbooks/*` other than the six named above (free-tier-ops, purge-failing, restore-drill, sanctions-match, incident-notification, speech-models-on-r2, staging-backup-free, staging-smoke were not read in full).
- PR #620 (the account-recovery runbook, named in `sign-everyone-out.md` line 5): the file is not on this branch and I could not read it. PR #847 (`17-engineering-project-plan.md`) likewise.
- The website (`apps/web`), the delete-account page, `docs/ops/BACKUP_RUNBOOK.md`, `docs/release/`, `docs/qa/`.
- Whether `hello@`, `privacy@` or `security@` are live aliases, and how the founder sends mail as `hello@` (the repo leaves it open: `data-requests-by-email.md` section 2 step 4).
- Any vendor's own console features (password-manager emergency access, Supabase roles, GitHub App scopes). I name none as available.
- This session's tool list shows Gmail, Supabase and Vercel connectors. I called none of them, and nothing in this file came from them.

---

## 2. Coverage check: what the repo and the cards say today about the back office

### 2.1 What exists (cited)

| Area | What exists today | Evidence |
|---|---|---|
| Staff action log | `ops.audit_log`: append-only (trigger raises `SCIMM`), 12 months, in the `ops` schema that is not in the Data API. Columns: operator (staff handle), runbook (a closed list of 12 values), reason code, ticket, target profile, book and letter ids, a 512-byte `detail` of enums and counts. Written by `public.ops_audit_write` (service role only) | `20261004200000_ops_deletion_worker.sql:33-47`, `:380-386` |
| Runbook scripts | `scripts/ops`: `enumerate-affected`, `verify-deletion`, `restore-drill`, `restore-check`, `dump-manifest`, `keepalive`, `free-limits`, `staging-smoke`. Each refuses without `--project-ref` and `--ticket`, and writes one audit row first. Only four runbook values are wired in `runbook.ts` (`incident_scope`, `verify_deletion`, `restore_drill`, `restore_replay`) | `scripts/ops/lib/runbook.ts:1-40`; BL-237 |
| Hand data requests | Five routes, a control-code check, a request log (a file on the founder's own computer, no person id), a 45-day clock with follow-ups on day 7 and 30, and a list of what cannot be kept by hand | `data-requests-by-email.md` sections 0 to 9 |
| Other runbooks | `suspected-data-leak`, `sign-everyone-out` (all drills NOT RUN), `stuck-deletion`, `purge-failing`, `underage-account`, `sanctions-match`, `incident-notification`, `restore-drill`, `staging-backup-free`, `free-tier-ops` and others: 13 files | runbook folder listing |
| Pause levers | Eight kill-switch keys in the signed remote config; a server-side `KILL_SWITCHES` secret; database settings `app.backup_enabled`, `app.escrow_enabled`, `app.status_report_enabled` and the escrow project's `ESCROW_SWITCH`; `forceReauthEpoch` to sign phones out locally | `kill-switches.ts:11-37`; `SECURITY.md:33`; `sign-everyone-out.md` section 2 |
| Console hygiene | Two-factor on every console, recovery codes offline, only the founder a member. "Add a second named person with break-glass access only when one exists" | `SECURITY.md:117` |
| Signing keys | Ed25519 primary and a cold backup, the backup's secret in a separate password-manager entry and an offline copy elsewhere; `publish.ts` refuses a key file inside any repo | `PACKS_HOSTING.md:26, 49, 59-61` |
| Mail aliases | `hello@`, `privacy@` (suggested), `security@` (suggested), `abuse@` (optional): receive-only aliases that forward to the founder's inbox | `DOMAINS.md:131-139` |
| Support mailbox class | L4: "People may paste letters; handled as L4" | `DATA_CLASSIFICATION.md:770` |
| Agent limits | Agents never merge; the founder approves; the `support` agent never contacts a user; no session with a mail or Supabase connector attached may run a data-request step | `HARNESS.md:109`; `data-requests-by-email.md` section 0; `CLAUDE.md` |

### 2.2 What the cards and first-wave files already require (not repeated here)

| Need | Already in | Row |
|---|---|---|
| The mail row, fixed subject, no content | support | FR-SUP-01, -03, FR-PRV-12 |
| Macros M1 to M21; support asks only six kinds of fact; letters in email are L4 | support | FR-SUP-07, -09, -10 |
| Safety routing file; M6; never counsel | support | FR-SUP-16, -17 |
| Hand data requests follow the runbook; Route 1 closed until BL-551 | support, operations | FR-SUP-15, FR-OPS-05, -06 |
| Safety-removal runbook and a tool to limit access before NS-25 ships | support | FR-POL-04, -05, -06 |
| Suspension, hand recovery named but not built | support, operations | FR-POL-10, FR-SUP-13, FR-OPS-09 |
| Kill-switch runbook; pause keys before they are needed; sign-everyone-out proven | operations | FR-OPS-01, -02, -03 |
| Content-free signals; support hand-off per runbook | operations | FR-OPS-17, -21 |
| Security events table; quarterly access review named | risk-security | FR-SEC-20, SEC-R24, SEC-R25; RSK-22 |
| Agents never read the mailbox | support | FR-POL-12 |
| Mailbox provider listed as a subprocessor | support | FR-SUP-23 |

### 2.3 Coverage verdict for the back office

| Back-office area | Verdict | Why |
|---|---|---|
| Support lookups (what a person on staff may look at to answer a parent) | missing | No file says what a lookup is, what it may show, or how it is logged. The only tool is the dashboard as `postgres`. The runbook's rule is "do not look up or read their data to answer" (`data-requests-by-email.md` Route 3), and the Route 3 correction step shows the email beside the id in a SQL Editor query |
| Account recovery by hand | partly | `data-requests-by-email.md` and BL-598 say "never change an email or link an identity by hand". The runbook BL-598 asks for is not on this branch (PR #620 is named, unreadable). Cases such as "my sign-in method is different on the new phone" have no written decision |
| Data requests received by email | partly | Well covered by the runbook. Missing: a rhythm that keeps 45-day clocks from being forgotten, a volume trigger for moving off a file, the gate that says rehearsal before launch, and how the founder sends mail as `hello@` |
| Abuse reports | missing | Terms 9 sets the rules and says CSAM is reported. No intake route, triage card or owner for an abuse report exists; `abuse@` is "optional" in `DOMAINS.md:139`. First wave has policy rows (POL-01 to POL-03, POL-09), not an operating card |
| Co-parent safety route | partly | FR-POL-04 requires the runbook and a tool. Nothing says what the tool does, who decides, what a solo founder does with no second reviewer, or what each person is told |
| Kill switch and remote pause operation | partly | The runbook is FR-OPS-01 (not written). Missing: who may pull the lever, how the three sources stay in step, how it is logged, and what happens when the founder or the signing key is not available |
| Audit log of staff actions | partly | The table exists and is wired in four runbooks. Missing: values for the acts this file adds, a rule that the by-hand SQL steps carry a row, the quarterly review, and the claim rule (LEGAL-REQ-025: no public line may say every access is logged) |
| Who can see what | missing | Policy text says "Today only the founder has that access" (`privacy-policy.md:55`); there is no access matrix, and the technical truth is that the founder's dashboard role can read every table |
| Tooling inventory, existing versus needed | missing | Nothing lists the staff tools in one place |
| Access control and key custody | partly | `SECURITY.md` has the secrets and the console rule. Open: second person for break-glass (`06-security-engineering.md:118`, PINF-06), what happens if the founder cannot act, and the loss of the signing key or the backup-decryption key |
| Runbook cards | partly | 13 runbooks exist; 13 more cards named in cards, backlog rows and first-wave files do not (section 6) |

---

## 3. Tooling that exists today, and what is missing

The product's staff tooling is a Supabase dashboard, a handful of scripts, a mailbox, a GitHub repository and a password manager. That is honest for one founder. The table is the inventory the requirements below work from.

| Tool or surface | Exists today | What it can reach | Gap for launch |
|---|---|---|---|
| Supabase dashboard, SQL Editor, as `postgres` | Yes (`data-requests-by-email.md`: "All SQL runs in Dashboard > SQL Editor") | Every table, including letter text (technical truth; the rule is procedural) | No support view. SQL Editor history is kept: UNVERIFIED (runbook section 0 says to look at the rehearsal and clear it). Platform audit logs are Team and Enterprise only (read this session), and production is on the Free plan (FR-OPS-11, D-159), so dashboard sessions are not logged by the platform |
| `scripts/ops/*` | Yes, 8 scripts | Counts and ids; audit row first | Four runbook values wired; no script for lookup, suspension, access limit, recovery |
| `ops.audit_log` and `ops_audit_write` | Yes | The log | Closed list of 12 runbook values has no value for a lookup, a suspension, a kill switch, a key change or an abuse report. `break_glass` exists as a catch-all |
| Support mailbox (`hello@`, `privacy@`, `security@`) | Aliases forward to the founder (suggested; liveness UNVERIFIED) | Whatever parents write, which is L4 | Provider and retention not set (BL-367, Q-SUP-4) |
| Request log | A file on the founder's computer | Ticket, kind, dates, outcome; no person id | Not a table (BL-237 remainder) |
| Signed remote config, `publish.ts`, server secrets | Yes | Hides a feature; raises `forceReauthEpoch` | Unmeasured reach time; no runbook (FR-OPS-01); a switch set in a function secret leaves no git trace |
| Suspend one account | No (BL-552, named, not built) | n/a | Needed for takeover, sanctions, a limit on a safety case |
| Open a deletion for another person | No (BL-551) | n/a | Route 1 and under-18 closure cannot run |
| Limit one person's access to one book | No | n/a | Terms 4.4 promises it; FR-POL-04 requires it |
| Support account summary (counts only) | No | n/a | Needed so a lookup never needs the Table Editor |
| Server-built export for a person with no phone | No (DATA-REQ-054, no BL row found: `data-requests-by-email.md` section 9) | n/a | A promise gap, not a back-office tool: noted, owned by `privacy` and `data-architect` |
| Admin console, support console | None, by design | n/a | This file does not ask for one. A console that shows a family is a console that can show a letter. The tools below return counts and states only |
| Password manager, console accounts | Yes | Every credential | One person holds all of it |
| Agent harness (`agents.yml`) | Disabled manually (FR-OPS-35) | Opens PRs | Secrets it holds are not listed in one place |

---

## 4. Who can see what

This is the matrix I propose as `docs/ops/ACCESS.md`. It is the answer to "who can see what". It states a rule and, in the last column, whether anything technical enforces it today. The honest column is the last one.

| Data (class from `DATA_CLASSIFICATION.md`) | Parent | Founder | Agents (any role) | A future second person | Enforced by tech today |
|---|---|---|---|---|---|
| Letter words, From name, photo words, Find index, typed days (L4) | Own, and the other parent's non-private letters | Never, except when the parent asks for help, to deal with a security problem or misuse, or when the law requires (`privacy-policy.md:55`). Support rule is stricter: never | Never | Never | No. The dashboard role can read them. The rule is procedural |
| Child name and dates (L4) | Yes | Never in a ticket, log or message | Never | Never | No |
| Recordings, pictures, seals, safety tiers | Phone only (or backup, if flipped) | Not on our servers while backup is off | n/a | n/a | Yes, by architecture: they never leave the phone |
| Sign-in email, person id, book id (L3) | Own | On screen in the dashboard during a runbook step only; never pasted into a ticket or chat | Never | Only if a role is defined | No |
| Counts, states, consent record, deletion status, plan state from Apple | Own | Yes, by the support summary (FR-BKO-02) once built | Aggregates only | By role | Partly (the `ops` schema is not in the Data API) |
| Audit log rows | No | Yes | No | Read-only if a role is defined | Yes (append-only trigger; service role only) |
| The mailbox (L4 by rule) | n/a | Yes, alone | Never (FR-POL-12) | Only on the founder's decision, and only after the policy line is changed (FR-BKO-18) | No |
| Secrets, signing keys, service role | No | Yes | Never | Sealed recovery only (FR-BKO-18) | Partly (secret store rules, secret scan) |

Two facts the matrix makes plain, which the first wave did not. First, "no staff tool shows letters, names, audio" is true of every tool we have built (there is no staff tool that does), and not true of the dashboard, which can show anything. The promise is kept by the founder's discipline and by a short list of rules, not by a wall. Second, the Privacy Policy says "Today only the founder has that access". The day anyone else gets any access to production, that sentence is false. So no second person is added before the text is changed and counsel has read it (counsel must confirm; Q-BKO-3).

---

## 5. Function requirements

Priority follows RR-4: P0 with reason (a) a promise we make, (b) a legal or store duty, (c) the core loop; else P1 or P2. Owner lane is the agent who carries the work; the founder executes every step that touches production. "New row needed" means the backlog needs a row after BL-999 or, until the id format is changed, grouped inside the engineering thread on #846; I propose no id above BL-999.

Screen ids: the back office has almost no screens by design. Where a parent sees the effect, I name the e2e id (C-S01 Me, C-S02 Account, C-S20 Delete account, D-S18 Family page, E-S01 launch, E-S06 sign-in code, E-S09 first-run router, E-ST05 to E-ST13c pause renders, E-ST17 forced sign-out). Where no screen applies I say "no screen".

### 5.1 Who sees what, lookups and the audit log (BKO-01 to BKO-06)

| Id | Requirement (Given, When, Then where testable) | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-BKO-01 | One access page. Given the repo, Then `docs/ops/ACCESS.md` holds the matrix of section 4 (data class by role, and whether a tool enforces it), the console list of `SECURITY.md:117` with owner and recovery path (no secrets), and the sentence "no staff tool shows entry text, audio, pictures or child names". A test fails if `privacy-policy.md` says "only the founder" while ACCESS.md lists a second role | Card row: new card row needed (NS-45 account life, section 12 door lines); e2e: no screen; backlog: new row needed | P0 (a): Privacy 3 promises who can see letters | `ops`, `privacy` | `privacy-policy.md:55`; LEGAL-REQ-025 first sentence |
| FR-BKO-02 | A support lookup never needs a table of content. Given a person's profile id and a ticket, When the founder runs the support summary, Then one service-role-only function returns only: sign-in provider, created date, last sign-in date, whether consent is current (document and version), number of books and their roles (parent, contributor), deletion request status and its dates, legal-hold flag, open invite count, and whether an Apple plan is linked. It returns no email, no book name, no child name, no letter or version text, no photo or audio path. It writes one `ops.audit_log` row first (reason `support_lookup`). Tests: a canary string in every L4 column never appears in the result; the grant is service role only and sits in `supabase/tests/grants.mjs` | NS-36 (data follows the letter), NS-45; no screen; new row needed (data-architect) | P1. P0 (a) before any person outside the founder's family signs in | `data-architect`, `ops` | `ops_audit_write` pattern (`20261004200000:380`); runbook "do not look up or read their data to answer" |
| FR-BKO-03 | Dashboard use rules. Given a runbook step that needs the dashboard, Then the card says: Table Editor is never opened on `entries`, `entry_versions`, `held_drafts`, `children`, `dictionary_terms` or Storage; the SQL Editor runs only the statements printed in the card; the editor's history is cleared after each session (UNVERIFIED that it keeps history: confirm at the first rehearsal); no result containing an id or an email is pasted anywhere; every by-hand change carries its own `ops_audit_write` row inside the same statement block (as Route 3 step 5 does) | Card row: new card row needed; no screen; BL-237 | P0 (a) | `ops`, founder | `data-requests-by-email.md` section 0 ("Keep ids and emails on screen only"), Route 3 step 5 |
| FR-BKO-04 | No claim that every staff access is logged. Given Supabase Platform Audit Logs exist only on Team and Enterprise plans (read 20 Nov 2026) and production is on Free (FR-OPS-11), Then no sentence in the product, the site, the help centre or a macro says "every access is logged", "we log everything we do" or similar, until LEGAL-REQ-025's three conditions hold (database-level audit of service-role and dashboard sessions live; the LEGAL-REQ-023 release check passes; a quarterly review written down). A claims-registry flag keeps the sentence out of `packages/content` (the LEGAL-REQ-025 test) | LEGAL-REQ-025; card rows: NS-45 claims; no screen; BL-237 | P0 (a) | `legal`, `content`, `support` | `ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-025; supabase.com audit-logs page, read 20 Nov |
| FR-BKO-05 | The audit log covers every act this file adds. Given a new migration (never an edit of an applied one), Then the `runbook` check on `ops.audit_log` gains values for `support_lookup`, `account_recovery`, `suspension`, `access_limit`, `kill_switch`, `key_change`, `abuse_report`; `scripts/ops/lib/runbook.ts` lists them; the log keeps the 12-month window and the "no free text" rule (`detail` enums and counts, 512 bytes). A kill switch set in a function secret or a database setting (not in git) writes a `kill_switch` row by hand | BL-236 (done in part), BL-237; FR-SEC-20 (security events); no screen; new row needed | P1 | `data-architect`, `ops` | `20261004200000:37-38` (the closed list); `RELEASE.md:280` (git is the audit log only for signed config) |
| FR-BKO-06 | The quarterly card. Given a calendar date each quarter, Then the founder runs one card: read the `ops.audit_log` rows for the quarter against the request log (every `dsar`, `deletion`, `legal_process` row has a ticket), list console members and keys against ACCESS.md, and write one dated line in `docs/ops/` ("reviewed, n rows, no unexplained access"; counts only). This is the "quarterly log review" LEGAL-REQ-025 names and the "quarterly access review" SEC-R25 names | LEGAL-REQ-025; SEC-R25; FR-RSK-01; no screen; new row needed | P1 | `ops`, founder | `06-security-engineering.md:89`; LEGAL-REQ-025 |

### 5.2 Account recovery and data requests by hand (BKO-07 to BKO-11)

| Id | Requirement (Given, When, Then where testable) | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-BKO-07 | One recovery card, one decision table. Given the recovery runbook BL-598 asks for (PR #620 is not on this branch), Then `docs/ops/runbooks/account-recovery.md` decides each case once. (1) "I lost my email": nothing changes by hand; point to Apple's own account recovery if the person signed in with Apple, or to the mail provider's recovery if the sign-in is a code to an email; the sign-in email is never edited (`double_confirm_changes`, runbook section 0). (2) "My new phone shows no book": the person used a different sign-in way last time; macro M9; no hand merge of two accounts in 1.0, because a merge moves one account's letters into another on a stranger's word (default; Q-BKO-1). (3) "Someone is in my account": end sessions (BL-597 lever), suspend (BL-552), then investigate. (4) "My Apple relay address changed or Hide My Email": we cannot find the person by the address they write from; log `could_not_verify` (runbook section 2). (5) A person who signed in once and deleted the app: nothing is lost on the server; sign in again. (6) A person who cannot get the email code (bounces, Spam): macro M11; if the sending domain is the cause, the DMARC reading of FR-SEC-11. Each case ends with what the parent is told and no content is asked | NS-10, NS-41, NS-45; E-S06, E-S09 `noBook`, C-S02; BL-598, BL-597, BL-552 | P0 (a): a takeover exposes the book to a stranger | `ops`, `support`, `security-architect` | `data-requests-by-email.md` section 0 and 2; BL-598 (read this session); `sign-everyone-out.md` section 2 (lever status unproven) |
| FR-BKO-08 | A takeover target that a solo founder can keep. BL-598 says "suspended within 4 hours of the report". Given one founder asleep, away or ill, Then no public or in-app sentence promises a speed; the internal target is "read the same day"; the reply to the reporter says only that we have it and will write again by a stated date; and the 4 hours in BL-598 is reworded as "within 4 hours of the founder reading it" or the founder takes the founder-unavailable plan of FR-BKO-18. Counsel must confirm that no speed is promised in Terms or Privacy | BL-598; FR-SUP-16; Q-BKO-2; no screen | P1 | `ops`, founder | BL-598 acceptance row; `data-requests-by-email.md` ("a reply within 45 days" is the only published time) |
| FR-BKO-09 | The weekly clock. Given every open data request has a due date (received plus 45 days, with the day-7, day-30 and day-40 follow-ups of the runbook), When the founder runs the weekly card (FR-BKO-23), Then each open `DREQ` row is checked against its due date, any row at day 35 or later is listed first, and an extension notice, if one is needed, goes before day 45 with its reason (DSR-R12). The request log gains a "next action date" column. A row that passes day 45 with no notice is treated as a P0 defect and goes to counsel the same day | FR-SUP-15; `data-requests-by-email.md` sections 0 and 1; no screen; new row needed | P0 (b): Privacy 10 promises a reply within 45 days | founder, `ops` | `data-requests-by-email.md` section 0 ("The clock"), section 8 step 3 |
| FR-BKO-10 | Rehearsal is a launch gate. Given section 10 of the runbook has never been run, When any servers-on build reaches a person outside the founder's family, Then there is a dated rehearsal record (Asha account, an address the founder controls) for the section 2 code check, Routes 2, 3 and 5, and the email-list removal steps that are not yet written; Route 1 is either built (BL-551) and rehearsed, or the sentence "we will do it by hand" has been changed by a version bump (CR-60). The founder also records, once, how mail is sent as `hello@` and that the control-code email reaches a test inbox | BL-779 (as cited by the runbook); FR-OPS-06, FR-SUP-15; no screen | P0 (b): the 0.9.0 text promises hand routes | founder, `ops`, `privacy` | `data-requests-by-email.md` status paragraph, sections 9 and 10 |
| FR-BKO-11 | When to leave the file. Given the request log is a founder-only file (BL-237 remainder), Then the card says what moves it into a `privacy_requests` table with a counts-only admin view: more than 10 requests in a calendar month, or a second person who handles requests, or a request that passes day 35 for lack of tracking. Until then the file stays; the table keeps no person id (as the file does) and nulls nothing at deletion because it holds nothing to null | BL-237; FR-SUP-15; no screen; new row needed (only when a trigger trips) | P2 | `compliance-engineer`, founder | `data-requests-by-email.md` section 1 (why no id); BL-237 ("a dated spreadsheet is acceptable at v1.0 volume") |

### 5.3 Abuse reports and the co-parent safety route (BKO-12 to BKO-16)

| Id | Requirement (Given, When, Then where testable) | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-BKO-12 | One intake for reports. Given a parent, a co-parent or anyone writes that a person is misusing the service (harassment, impersonation, a child at risk, an account they should not be in), Then there is one documented route: the Help row (FR-SUP-01) and the help centre page "Report a concern" both open mail to the support mailbox with a fixed subject; `abuse@` is set up as an alias to the founder's inbox (DOMAINS.md:139 calls it optional); and one card, `docs/ops/runbooks/report-a-concern.md`, sorts a report into four classes with an owner and a first action each: (1) a child at risk or apparent child sexual abuse material: do not open attachments, no forward, counsel and the reporting duty of Terms 9 (FR-POL-02); (2) someone in danger: macro M6, no data-request process that day (FR-SUP-16); (3) the other parent as a risk: FR-BKO-14; (4) harassment or impersonation through a sign-off or an invite: FR-POL-09. Level 1 share hosts nothing, so there is nothing for us to take down or block in our own app today (FR-POL-03); the card says so and names what would change it | NS-05, NS-25, NS-26 to NS-28 (parked); E-S01 and C-S01 Help row; D-S18 Family page; backlog: new row needed | P1; P0 (b) the day a build lets one person's words reach another (NS-25 store flag), because Apple's guideline 1.2 asks for a way to report content and published contact details (support.md reading of 20 Nov 2026, not re-read here) | `support`, `ops`, counsel | `DOMAINS.md:131-139`; Terms 9; `support.md` FR-POL-01 to -03, -09 |
| FR-BKO-13 | Triage in the same day, with no content. Given a report arrives, When the founder reads it, Then the first action is within the day (not a published time), it is logged under a ticket and a `safety` or `abuse_report` kind with no free text, the reporter gets one neutral first reply (the same words every time; it never says whether an account exists, IAM-R09), and nothing in a log, ticket or message holds a name, a letter, a picture or an email | FR-SUP-10, -16; `data-requests-by-email.md` section 0 | P0 (a) | `support`, founder | Runbook section 0, "Never by email" |
| FR-BKO-14 | The co-parent safety card. Given NS-25 is in a store build and one parent writes that the other is a risk, or asks for removal after the 72-hour undo, Then `docs/ops/runbooks/safety-removal.md` exists (it is FR-POL-04's file) and this file fixes its operating rules. (a) The only tool is a service-role function that limits one member's read of one book's server rows: reversible, never deletes a letter, writes one `access_limit` audit row, tested in `supabase/tests`, grants in `grants.mjs`; the limited person's own letters stay theirs to export (Terms 4.2). (b) The evidence standard, who decides and whether the limited person is told are counsel's (Q50; Q-BKO-4). (c) Until counsel's standard exists, the card says: no action on one person's word; both parents get the same first reply (macro M14); a message that says someone is in danger goes to M6 first. (d) The founder has no second reviewer, so the card names counsel as the second reader for any limit, and any limit is recorded for the quarterly card. (e) Nothing is promised in the app or the help centre about removal: NS-25-R13 already offers no control | NS-25-R3, R4, R13; D-S18, D-S19, D-S20 (no new screen for the limited person until counsel rules); new row needed (data-architect) | P0 (a)(b): Terms 4.4 promises "after checking, we may limit a person's access to a book" | `data-architect`, `ops`, `support`, counsel | `terms-of-service.md` 4.4; `10-reading-and-family.md:727, 733`; `data-requests-by-email.md` section 0 table row on limiting access |
| FR-BKO-15 | What the limited person sees. Given a member is limited, When their phone next syncs, Then the book's server rows stop arriving, the letters already on their phone stay readable and exportable (their own always), and the app says one neutral line that does not name a reason or the other parent. The line is `content`'s; it must not read as a ban and must not say "removed". Whether this needs a state in the sync pull is a question for `data-architect` (the existing `undo_parent_join` path stops a book for P2 within 72 hours: NS-25-R4) | NS-25-R4; D-S20 (closest existing state); new screen state needed (design) | P1, with FR-BKO-14 | `data-architect`, `mobile`, `content` | `10-reading-and-family.md:769` (R4 undo behaviour) |
| FR-BKO-16 | Letters from lawyers, courts and the police. Given one arrives, Then the card copies `data-requests-by-email.md` section 0 (no action, no disclosure, no reply until counsel says so; `legal_date` the same day) and adds the one operating line that is missing: the founder tells the CLO the kind and the date only, never the document, and writes an `ops.audit_log` row with runbook `legal_process` only when a step touches data | FR-POL-06; Q50; no screen | P0 (b) | founder, counsel | `data-requests-by-email.md` section 0 table; the `legal_process` value already in the audit log |

### 5.4 Kill switch and remote pause (BKO-17 to BKO-19)

| Id | Requirement (Given, When, Then where testable) | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-BKO-17 | Who may pull the lever. Given a feature must stop, Then the decision is the founder's alone; an agent may recommend by opening or commenting on an `ops-alert` issue and never publishes, signs or sets a secret; no agent holds the signing key or the service role (FR-BKO-21). The runbook FR-OPS-01 carries this as its first line. A parent-facing line already exists per key (E-ST05 to E-ST13c); no new parent copy is needed here | FR-OPS-01, -02; RSK-06; E-ST05 to E-ST13c; no new screen | P1 | `ops`, founder | `RELEASE.md:278-282`; `kill-switches.ts` header and E21 (a switch hides, never turns on, never stops export) |
| FR-BKO-18 | The founder cannot act. Given a founder who is ill, away or lost a device, Then there is a written plan on one page. It names one trusted second person (open question 4 of the security chapter, PINF-06), what that person holds (a sealed recovery kit for the password manager and console recovery codes, opened only if the founder cannot act, and a one-page "pause and tell people" card), and what they can do (read the card; publish a pause using the cold-backup signing key; send one holding message from `hello@` saying the service is paused and exports still work). They never read the mailbox for requests and never open a letter. Before any second person holds anything that can reach production, `privacy-policy.md` line 55 ("Today only the founder has that access") is changed and counsel has read it (Q-BKO-3, counsel must confirm). Default if the founder names no one: no second person; the plan says what the founder does in advance (a pre-written holding line on the site, the pause already staged on staging) and the 45-day clocks are the risk accepted in writing | FR-OPS-01, -03; SEC-R25; RSK-22; open question 4 of `06-security-engineering.md`; no screen | P0 (a) if any second person is given production reach, because the policy sentence changes; else P1 | founder, counsel, `ops` | `SECURITY.md:117` ("Add a second named person with break-glass access only when one exists"); `06-security-engineering.md:118`; `privacy-policy.md:55` |
| FR-BKO-19 | The three pause sources stay in step. Given a pause may be set in three places (the signed remote config, the `KILL_SWITCHES` function secret, and the database settings with `ESCROW_SWITCH`), Then the card ends with one "state check" step that prints all three and compares them with the committed `scripts/packs/remote-config.json`; any difference is written down as an `ops.audit_log` `kill_switch` row and fixed the same day. The 5-minute reach to open apps stays labelled an Assumption until measured on a staging phone (J-E14 in the device sheet) | FR-OPS-01, -30; RELEASE.md section 9.6; E-ST05 to E-ST13c | P2 | `ops` | `PACKS_HOSTING.md:244` ("Assumption: not measured"); `SECURITY.md:33`; `kill-switches.ts:42-48` |

### 5.5 Access control and key custody (BKO-20 to BKO-25)

| Id | Requirement (Given, When, Then where testable) | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-BKO-20 | One secrets and keys register. Given `SECURITY.md` section 1 lists the secrets and the signing-key page lists the keys, Then `docs/ops/ACCESS.md` carries one register: name, where it lives (store, not value), who can read it, rotation, and whether it must never rotate. It includes the keys that cannot be replaced: `app.consent_pepper` and `INVITE_CODE_PEPPER` (never rotate while their records live), the Ed25519 signing keys compiled into the app (`TRUSTED_SIGNING_KEYS`, so a lost pair means no remote pause until a new build), `TOKEN_KEK_V<n>`, and the key that decrypts the nightly backup dump. For the last one: where the copies are, and a dated restore test that proves the offline copy decrypts (loss of the key means loss of every backup) | FR-PRV-08 (the dump is encrypted to the founder's key), FR-OPS-07; LEGAL-REQ-026; no screen; new row needed | P1; P0 (a) for the backup key once backup is flipped on, because the backup promise needs a recoverable key | `ops`, `security-architect`, founder | `SECURITY.md:19-52`; `PACKS_HOSTING.md:26-65`; `privacy.md` FR-PRV-08 row |
| FR-BKO-21 | Agents hold no production power. Given the harness opens pull requests and never merges, Then the rule is written once and tested: the service role key, the signing keys, the backup key and the password manager are never in an agent environment or an Actions secret an agent job can read; a session that does support, operations or request work has no mail, Supabase or Vercel connector attached (the runbook already says so for request steps; this extends it to every back-office step); and the secret scan of `scripts/packs/secret-scan.mjs` runs on every PR. Where an agent needs to know a state (a switch, a count), the founder pastes a content-free number into an issue. Note for the founder: this session's tool list shows Gmail, Supabase and Vercel connectors; I called none | FR-POL-12; RSK-22; SEC-R12 (named in the security chapter's open question 2); no screen; new row needed | P0 (a): the promise that nobody reads a family's words | founder, `security-architect`, `ops` | `data-requests-by-email.md` section 0; `SECURITY.md` rules that never bend; `06-security-engineering.md:117` |
| FR-BKO-22 | Founder-machine hygiene during a runbook. Given the service role key is exported in a shell for one session (`SECURITY.md` 1.4), Then the card says: history off for the session (the runbook already warns about `~/.zsh_history` for packs), the shell closed at the end, nothing recorded on screen or in a screenshot while a person's data is shown, no cloud-synced notes for the request log, and no use of the key from a machine that is not the founder's own | `SECURITY.md:100-107`; `PACKS_HOSTING.md:86`; no screen | P1 | founder, `ops` | `SECURITY.md` 1.4; `data-requests-by-email.md` section 1 (a file in a folder that does not sync) |
| FR-BKO-23 | One weekly card. Given a solo operator, Then one card, read every Monday, lists in order: open data requests and their next action dates (FR-BKO-09); the support tally by category with counts only (FR-SUP-08); open `ops-alert` issues and the three D-159 jobs' last green run (FR-OPS-11); the sign-in email cap and the Auth rate limit (FR-OPS-10); the date the helpline readings expire (90 days from 8 Nov 2026 is 6 Feb 2027, FR-SUP-17); the DMARC report (FR-SEC-11); open pauses and why. Nothing on it holds a name or text | FR-SUP-08, -17; FR-OPS-10, -11; FR-SEC-11; no screen; new row needed | P1 | founder, `ops` | The rows cited |
| FR-BKO-24 | The absence line. Given the founder is away, Then an out-of-office reply on the support mailbox says that mail is read by one person, that it may take longer than usual, and, for anyone in danger, to use local emergency numbers and the page in the app (Me, If you are struggling). It makes no promise of speed, and it does not promise any refund, deletion date or outcome. `content` writes it in the product's voice; it is a fixed text kept under `docs/support/` | FR-SUP-16, -17; C-S01 "If you are struggling"; no screen | P1 | `support`, `content`, founder | `.claude/agents/support.md` as quoted in `support.md` (never promise a refund; never counsel) |
| FR-BKO-25 | Runbook card template. Given every runbook in section 6, Then it uses one shape: trigger; who may run it; the tool; the "never" list (no content, no ids pasted); the audit value written first; the done check; the parent-facing line and the support category (FR-OPS-21); the date it was last rehearsed; and a "status" line that says plainly NOT RUN when it has not been run on a real project. A card with no rehearsal date is not counted as done by any gate | FR-OPS-21, FR-OPS-03; no screen; new row needed | P1 | `ops`, `support` | The shape the existing runbooks already approximate (`sign-everyone-out.md` "Status: NOT RUN"; `data-requests-by-email.md` "Status") |

### 5.6 Cases a back-office rule must make safe for the parent (BKO-26, BKO-27)

| Id | Requirement (Given, When, Then where testable) | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-BKO-26 | A suspended or limited account looks like itself, not like a loss. Given BL-552 suspends sign-in and sync for one account while keeping all data, When that person opens the app, Then the book stays readable on the phone, sync waits, and one neutral line is shown (not "banned", not a reason); the person can still Save a copy and Delete account; Terms 10.2's "export for at least 30 days" is met by that route. No state implies the data is gone | NS-45; E-S15 (SystemLine); E-ST02-like render; C-S04, C-S20; BL-552, BL-553 (the refused sign-up screen) | P1 | `mobile`, `content`, `data-architect` | `terms-of-service.md` 10.2; BL-552 text (keeps all their data, reversible, audited) |
| FR-BKO-27 | A hand act is visible to the person it affects. Given any back-office change to one person's account (a suspension, a deletion opened for them, an access limit, a hand consent act), When it is done, Then a content-free email goes to the address on the account naming only the kind of act and the date, except where counsel rules a safety case must not (Q-BKO-4), and an audit row exists. This adopts input G5 and G6 (email on deletion request, new-sign-in email) already proposed under FR-SEC-12, and adds the by-hand acts to the same list | FR-SEC-12 (NS-45 G5, G6); C-S02; new row needed | P1 | `security-architect`, `content`, `mobile` | `risk-security.md` FR-SEC-12 |

---

## 6. Runbook cards that need writing

Existing files are not rewritten here; each gap names what is missing. "Cited by" shows who already leans on the card.

| Card (file under `docs/ops/runbooks/` unless stated) | State on this branch | Cited by | Gate | Owner | FR |
|---|---|---|---|---|---|
| `account-recovery.md` | Missing (PR #620 named, unreadable) | `sign-everyone-out.md:5`; BL-598 | Before any sign-in outside the family | `ops`, `support` | BKO-07, -08 |
| `safety-removal.md` | Missing | NS-25 sections 5 and 13; runbook section 0; FR-POL-04 | Before the NS-25 store flag | `ops`, counsel | BKO-14, -15 |
| `report-a-concern.md` | Missing | none yet | Before NS-25 store flag; useful sooner | `support`, `ops` | BKO-12, -13 |
| `docs/support/safety-routing.md` | Missing (named by `data-requests-by-email.md`, `underage-account.md`) | both | Before any person outside the family signs in | `support`, clinician read (BL-105) | FR-SUP-16 |
| `kill-switch-and-pause.md` | Missing | FR-OPS-01; `RELEASE.md` 9.6 lists 5 of 8 keys | Before the first servers-on public build | `ops` | BKO-17, -19; FR-OPS-01 |
| `support-lookup.md` (or a section of `ACCESS.md`) | Missing | none | With FR-BKO-02 | `ops` | BKO-02, -03 |
| `founder-unavailable.md` | Missing | `SECURITY.md:117`; PINF-06 | Before any outside sign-in | founder | BKO-18 |
| `legal-process-intake.md` | Folded into a table row of the data-request runbook | Q50 | Before any outside sign-in | founder, counsel | BKO-16 |
| `death-or-incapacity.md` | Missing; the row says "no action" | Q49 ("runbook before C1"); FR-POL-11 | Counsel's answer | counsel, `support` | FR-POL-11 |
| `email-list-removal.md` | Missing: "No steps for it are written anywhere in the repo" | `data-requests-by-email.md` first table | At the first rehearsal | `ops` | BKO-10 |
| `quarterly-access-and-log-review.md` | Missing | LEGAL-REQ-025; SEC-R25 | First quarter after launch | `ops` | BKO-06 |
| `weekly-card.md` | Missing | none | Launch | founder | BKO-23 |
| `child-safety-report.md` (the reporting duty in Terms 9) | Missing: steps for a report to the National Center for Missing and Exploited Children are not in the repo (UNVERIFIED how a small service files it) | Terms 9; FR-POL-02 | Before any build hosts a person's words (NS-26 to NS-28 reopened) | counsel, `ops` | BKO-12 |
| Existing, to amend | `suspected-data-leak.md` (FR-OPS-04), `sign-everyone-out.md` (drills NOT RUN, FR-OPS-03), `stuck-deletion.md`, `underage-account.md` (needs BL-551 and the safety routing), `data-requests-by-email.md` (rehearsal, BKO-09, -10) | | | `ops` | as shown |

---

## 7. Design needs

The back office has no staff screens and should not get any. The design work is what a parent sees when a back-office act happens, plus two public pages.

| Need | Screen id | What |
|---|---|---|
| Help route for a concern | C-S01 (Me, Help and legal), E-S01.recovery, E-S06 | Reuse the Help row and "Write to us" (FR-SUP-01, -02). No new parent screen. The help centre gets one page, "Report a concern" (FR-BKO-12) |
| A limited member's line (FR-BKO-15) | D-S20 is the nearest state (the other parent's phone after an undo); otherwise **new screen state needed** | One neutral SystemLine on the Book of the limited person; no reason, no name; content's words |
| A suspended account's line (FR-BKO-26) | E-S15 SystemLine; **new state needed** on C-S02 | The book stays readable; sync waits; Save a copy and Delete account stay reachable |
| Account-act emails (FR-BKO-27) | `packages/emails` templates; no screen | Content-free; kind and date only; the same voice as the other transactional mail |
| Pause renders | E-ST05 to E-ST13c | Already designed per key. FR-BKO-17 needs nothing new, but E-ST13c lists seven keys behind one render; confirm each key in `kill-switches.ts` has a row (today `bookSearch` is absent: FR-OPS-02) |
| Public status page | none in app | Owned by FR-OPS-20; this file adds only that the holding line for FR-BKO-18 is the same static page |
| Out-of-office text | none | FR-BKO-24; a fixed text file |

No string here implies that anything writes a person's words. None of these rows adds a feature that rewrites, summarises or shapes letter text.

---

## 8. Card changes proposed (for Karma to rule)

| Card row | Change | Why |
|---|---|---|
| NS-25 section 5 rows "P1 tries to remove P2 after 72 hours" and "Separation, or an ex-partner" | "only the support runbook" becomes "only the safety-removal runbook (FR-POL-04, FR-BKO-14), on counsel's evidence standard (Q50)"; add to section 22 (gates): the limit tool and `safety-removal.md` exist before the store flag | Same change `support.md` proposes; this file supplies the tool contract |
| NS-45 (account life after first run) | Add a P1 row: when an account is suspended or an access limited, the book stays readable and one neutral line shows (FR-BKO-26); add a P1 row for the account-act emails (FR-BKO-27, adopting G5 and G6) | Terms 10.2 promises export after an ending; no card says what the parent sees |
| NS-41 section 12 (door lines) | Add a Never line: "support never edits a sign-in email or links an identity by hand, and never merges two accounts" (FR-BKO-07) | The rule is in a runbook and BL-598, not on the card that a parent's sign-in lives in |
| NS-10 unhappy path "new phone shows no book" | Add: the decision is no hand merge in 1.0 (default); the macro is M9 | Case (2) of FR-BKO-07 |
| `00-product-frame.md` section 3 (tally) | Add the weekly card (FR-BKO-23) as the place the tally is read | One place, one rhythm |
| `19-from-download-to-first-letter.md` NS-39, E-S01.recovery | Nothing to change; FR-SUP-02 already asks for the Write to us button | Noted so no one adds it twice |

---

## 9. Engineering needs (backlog)

Rows are proposals. I assign no id above BL-999. After BL-999 the dispatcher cannot read a new three-digit id (BACKLOG line 4052); these go in the engineering thread on #846 with the FR id, and take ids when the id format is changed.

| Row (new unless named) | FR | Owner | Gate |
|---|---|---|---|
| `ops_support_summary(p_profile, p_ticket)`: service role only, counts and states only, audit row first, canary test, grant in `grants.mjs` | BKO-02 | `data-architect` | Before any outside sign-in |
| Migration (new file) widening the `ops.audit_log` runbook check with `support_lookup`, `account_recovery`, `suspension`, `access_limit`, `kill_switch`, `key_change`, `abuse_report`; update `scripts/ops/lib/runbook.ts` | BKO-05 | `data-architect`, `ops` | With the first function that writes one |
| `ops_limit_member_access` (limit one member's read of one book, reversible, audited, no delete) and its test; sync behaviour for the limited member | BKO-14, -15 | `data-architect`, `sync` | Before the NS-25 store flag |
| BL-551 (open a deletion for another person) and BL-552 (suspend sign-in): already rows; raise to the gate "before any outside sign-in" in FR-OPS-06 and FR-POL-10 and link BKO-07, BKO-26 | BKO-07, -26 | `data-architect` | Before any outside sign-in |
| BL-597 drills D1 to D4 run and recorded; BL-598 runbook written | BKO-07, -08 | `ops`, `security-architect`, founder | Before any outside sign-in |
| `docs/ops/ACCESS.md` and its test (policy sentence versus roles) | BKO-01, -20 | `ops`, `privacy` | Launch |
| A claims-registry flag for "every access is logged", false until LEGAL-REQ-025's conditions hold; content scan | BKO-04 | `content`, `legal` | Launch |
| Secret-scan and connector rule for agent sessions (list of what an agent job may read) | BKO-21 | `security-architect`, `ops` | Before the dispatcher restarts (FR-OPS-35) |
| `report-a-concern.md`, `safety-removal.md`, `account-recovery.md`, `kill-switch-and-pause.md`, `founder-unavailable.md`, `weekly-card.md` (section 6) | BKO-12 to -25 | `ops`, `support` | As section 6 |
| Account-act email templates in `packages/emails` | BKO-27 | `emails`, `content` | With NS-45 |

---

## 10. Founder and counsel questions, each with a default

Counsel numbers are from `COUNSEL_PACKET.md` 1.5.0; the highest existing number is Q57, so new ones need a number from `legal`.

| Id | Question | Who | Recommended default |
|---|---|---|---|
| Q-BKO-1 | May support ever merge two accounts, or move letters from one account to another, for a parent who signed in two different ways? | Founder, with `security-architect` | No, never by hand in 1.0. The parent signs in the original way. It would move one account's letters on a stranger's word. Reopen when there is an in-app way to link identities, proved by both sign-ins |
| Q-BKO-2 | May a takeover reply promise a time? BL-598 says 4 hours. | Founder | No published time. Internal target "same day". Reword BL-598's acceptance line to "within 4 hours of the founder reading the report". Counsel must confirm that no speed appears in Terms or Privacy |
| Q-BKO-3 | Is a second person with any production reach acceptable, and what must the policy say first? | Founder, counsel (needs a number from legal) | No second person by default. If the founder names one, the policy line 55 and any health-privacy text are changed first, the person holds sealed recovery only, and counsel confirms the access fits Privacy 3 and the sensitive-data consent |
| Q-BKO-4 | In a safety case, is the limited person told, and when? Terms 10.2 says "where we can, we will tell you why first"; Terms 4.4 says "after checking, we may limit". They can pull in opposite directions when the reporter may be at risk | Counsel (Q50 family; needs a number from legal) | Counsel decides per case until a standard exists; default is no notice beyond the neutral in-app line and the one content-free email of FR-BKO-27 sent only if counsel says it is safe |
| Q-BKO-5 | Does the 4-hour or same-day handling of a safety report need a second reader, given one founder? | Founder, counsel | Counsel is the second reader for any act that limits or ends an account. For a macro M6 reply, no second reader: speed matters more |
| Q-BKO-6 | Who holds the sealed recovery kit if the founder names no one: nobody, or an attorney or a family member? | Founder | Nobody; the plan records the accepted risk and the pre-staged pause. Revisit at the first month with a person outside the founder's family |
| Q-BKO-7 | Is the nightly backup's decryption key held only by the founder? Is there a second offline copy, and has a restore from it been tested? | Founder, `security-architect` | Two offline copies in different places, restore tested at the first monthly drill and recorded. UNVERIFIED today which copies exist |
| Q-BKO-8 | Set up `abuse@` as an alias to the founder's inbox? | Founder | Yes, with `security@`, when the aliases are made live. Until then the policy and Help say `hello@` only. Liveness UNVERIFIED |

---

## 11. Totals and top findings

Totals: 27 requirements (FR-BKO-01 to FR-BKO-27). P0 now: 10 (BKO-01, 03, 04, 07, 09, 10, 13, 14, 16, 21). P1 now but P0 on a named gate: 4 (BKO-02, 12, 18, 20). P1: 11 (BKO-05, 06, 08, 15, 17, 22, 23, 24, 25, 26, 27). P2: 2 (BKO-11, 19). Also: 8 questions (Q-BKO-1 to Q-BKO-8), 10 engineering rows, 6 card changes, 3 design states, 13 runbook cards to write and 5 existing ones to amend.

Top findings:

1. The promise "nobody on our side reads your words" is kept by discipline, not by a wall. The dashboard role can read every table, there is no support lookup that returns counts only, and the platform's own audit log is not available on the plan production uses (read this session). So no sentence may claim every access is logged (BKO-04), and the lookup must be built so the dashboard is never needed to answer a parent (BKO-02, BKO-03).
2. Hand recovery has no written decision. The runbook BL-598 asks for is not on this branch, the levers in `sign-everyone-out.md` are all NOT RUN, and "I signed in a different way on my new phone" is the most likely first support message with no merge allowed by default (BKO-07).
3. The co-parent safety route promised in Terms 4.4 has no tool and no evidence standard, and a solo founder has no second reviewer. Counsel is the only second reader the plan can name (BKO-14).
4. Single point of failure: one founder holds every console, the signing keys, the backup key and the mailbox. If the founder cannot act, nothing can be paused, and the 45-day clocks run. A second person changes the Privacy Policy sentence "Today only the founder has that access", so it needs counsel first (BKO-18, Q-BKO-3).
5. Agents are given no production power, but nothing says so in one test. This session's tool list shows mail, database and hosting connectors attached; the runbook rule is for request steps only, and should cover every back-office step (BKO-21).
6. The 45-day clock has follow-ups in the runbook but no weekly rhythm, and the rehearsal has never been run; both should gate any outside sign-in (BKO-09, BKO-10).

What needs a ruling (Karma): the card changes in section 8 (NS-25, NS-45, NS-41, NS-10, frame section 3); whether BKO-02 and BKO-21 are P0 gates for the first outside sign-in (I recommend yes); and the grouping of the section 9 rows into the engineering thread. For the founder: Q-BKO-1 to Q-BKO-8, above all Q-BKO-2, Q-BKO-3 and Q-BKO-7. For counsel (through the founder): Q-BKO-3 and Q-BKO-4, and that no speed is promised for safety reports.
