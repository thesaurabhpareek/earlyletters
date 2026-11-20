# 07.4 Tests, budgets, conflicts, questions and cites

Status: PROPOSED engineering reference | 20 Nov 2026 | Owner: `sync` | Part 4 of 4 of document 07. Tags and level names as in 07.1.

## 1. How each message is tested

| Layer | What | Where it lives | Status |
|---|---|---|---|
| Planner, pure | One budgeted notification a day, 60 pending, back-off ends at day 35, time zone and daylight saving, quiet window, interruption level | `apps/mobile/src/lib/reminders/*.test.ts`; rows NS-32-R1 to R16 | Partly built; R13 and the registry (R2, R5, R15) wait for `budget.ts` (BL-966) |
| Catalogue, pure | `selectNotificationKey` and 25 tests NTC-T01 to T25 | `packages/core` (card NS-48) | Not built |
| Content rules | Length 40 and 110, no dash, curly quote, ellipsis character or emoji, no exclamation mark, no gap or count words, both renderings | `packages/content/test/rules.test.ts:269, 288-300` (as cited in `notification-catalogue.md`) | Built for the 8 evening variants |
| Email templates | Every template renders with the Asha fixture, no raw `{placeholder}`, links only to built or listed pages, no remote host | `packages/emails/test/*`, `generated/resend.ts` drift test | Built |
| Edge Function senders | Retry and idempotency: same key twice sends once; provider timeout then retry sends once; provider 4xx is not retried; failure is recorded without the body | `supabase/functions/purge-worker` and `escrow/test` (pattern); new for A1, A3, A6 | Pattern built; new senders not built |
| Contract | The alert queue row in `packages/api` matches the database column types | `packages/api` contract tests (standing duty 1) | To write with the migration |
| Device | Lock screen shows no name by default; Show Previews "Never" hides words; time zone change; one week on a real phone | Founder device check (NTC-T24), J-N4, J-N24; D4 is not done until it passes | Never run on a phone [V `NOTIFICATIONS.md:9`] |

### 1.1 Tests proposed by this document (ids for the PRs that build them)

| Id | Given, When, Then | Proves rule |
|---|---|---|
| T-01 to T-20 | The twenty tests named in the last column of 07.3 section 2 (LR-01 to LR-20) | LR-01 to LR-20 |
| T-21 | Given an alert kind and an event, When the sender is called twice with the same key, Then Resend receives one send and the second call returns the first result | 07.2 rule 5; R5 |
| T-22 | Given Resend times out, When the job retries, Then the key is reused and at most one mail arrives; given a 4xx, Then no retry and an `alert_failed` kind is recorded with no address | 07.2 rule 5 |
| T-23 | Given 6 alert mails to one account within an hour, Then 5 send one by one and the 6th and later fold into one summary sent within minutes, never held to the next day; A4 and A5 are never folded; no A2 email test exists because none is built | 07.2 rule 6; D2 |
| T-24 | Given any alert render with the Asha fixture, Then the subject has no placeholder and equals the content key, and the body has no IP, place, user agent, token or link that signs in | 07.2 rules 1 to 3 |
| T-25 | Given a client token (anon or user) calls the alert function URL, Then it answers 401 and writes nothing | 07.2 rule 7 |
| T-26 | Given a new device id at sign-in for an account that has one earlier device, Then exactly one A1 row is queued; for the first device none; the same device again none | A1 |
| T-27 | Given the account is deleted, Then no alert, billing or policy mail is queued afterwards, and a queued one is dropped | S13 |
| T-28 | Given content rules, Then `en.notifications.gentleReturn`, `familyLetter`, `familyAdded` are not referenced from any v1 code path | LR-17 |
| T-30 | Given names off, When every lock-screen key renders, Then no title or body holds a month number or "A year of letters." | LR-21; D4 |
| T-29 | Given a logged send, Then the log line holds kind, request id, outcome and no field named address, email, name, title, body, device | LR-11 |

## 2. Budgets and latency (Rec, with basis)

| Path | Budget | Basis |
|---|---|---|
| Local planner run (3 children, every evening, 8 weeks plus back-off) | under 50 ms | NS-32 section 8 (card) |
| Local schedule call | under 1 s | NS-32 section 8 (card) |
| Alert: event to queued row | p95 under 200 ms inside the same database call that caused it | Rec [E]: same bar as the local save commit (DATA-REQ-048) because it rides the same transaction; no network call in it |
| Alert: queued row to provider accepted | p95 under 60 s, p99 under 10 min; a miss pages `ops` | Rec [E]: a takeover warning is only useful soon; the purge worker already runs every 15 minutes (`purge-worker/alerts.ts` header), so alerts get their own 1-minute drain or a database webhook |
| Sign-in mail | p90 under 30 s | `docs/emails/SECURITY.md` finding on `A-NFR-004` (as read in 3.4) |
| Rate limits | alert mail: first 5 per account per hour one by one, then one summary within minutes, backstop 20 per account per day [E, reviewer's number] (D2), no A2 email; sign-in 1 per 60 s per address, 100 an hour for the project | 07.2 rule 6; `config.toml:54, 70` |

## 3. What could not be verified

1. Whether any notification has run on a device, including the lock screen and Show Previews behaviour [U]: no phone in this sandbox.
2. Whether iOS keeps a local notification's title when previews are hidden [U]: NS-32 and the catalogue say so; no Apple page was read for this file.
3. Whether the founder-paging job for 20 failed verifies per address exists [U]; a server per-address lockout [U]; Resend's behaviour on suppression and on stored content after account deletion [U].
4. Live state of DMARC, the Apple relay registration and the hello@ inbox [U] (founder hands, CL-062).
5. `budget.ts` and the split of the 60 between groups [U]: not on `develop`.
6. Whether the Supabase hosted project's notification toggles match `config.toml` [U]: this file read only the local config; no remote project was touched.
7. The email change screen: whether v1 lets a parent change the sign-in email in the app [U] (`SECURITY.md` section 3.7 says only if PRD C calls for it).

## 4. Conflicts routed (the cards win, CR-66)

| # | Conflict | Cards or ruling that decide | Sent to |
|---|---|---|---|
| C1 | Email catalogue plans "one push" for the trial-final notice | CL-064: dropped for v1, local notice only | `content`, `payments`: update `docs/emails/CATALOG.md:12, 92` |
| C2 | Catalogue lists `coparent-invite` and `welcome-coparent` at v1.0 | CL-063: no invite email | `content`: mark "not built" |
| C3 | Locked NS-32-R4b says 64; code plans 60 plus 4 | E13, CR-69 A1, CL-115: 60 in total | `mobile` (BL-966) |
| C4 | Built birthday title names the day on a lock screen | `GAP-LOG.md:203` default (a founder item, still open) | `product` and `privacy` decide; `mobile` waits |
| C5 | No notification category or hidden-preview placeholder in code | NS-32-R13 | `mobile` |
| C6 | Catalogue says `new-device-sign-in` is a 1.0 email; no card names it and nothing sends it | No card names it; PRD V2 F02-REQ-017 is P0 and puts it before the switch flip (`docs/prd/v2/features/F02-account.md:232, 306`). Cards win over PRD V2 (CR-66, `docs/agents/cto/RULINGS.md:632`); product confirms (D1). Built before the first outside family | `product` confirms: Q-COM-1 |
| C8 | The built `new-device-sign-in` template says "We will sign that device out" (`packages/content/src/emails/auth.en.ts:199`) and no lever exists | C10: build the lever or remove the line (words PROPOSED); D1 words replace it with the in-app path | `content`, `sync` |
| C7 | The founder-paging job in `SECURITY.md` section 3.4 is a Rec; it is not found as code | `docs/emails/SECURITY.md:122` | `security-architect`, `ops` |

## 5. Questions

### 5.1 Product and design (posted as feedback-loop comments on the PR; none is closed by E1 to E73 or CL-001 to CL-147 [V: searched `18-errata-after-lock.md` and `GAP-LOG.md` for sign-in alert, new device, sign-out everywhere, failed code, quiet hours on email, 20 Nov])

| Id | Question | Default engineering builds |
|---|---|---|
| Q-COM-1 | Which security alert emails exist at v1: new sign-in on a new device (A1), recovery (A3), sign-out of all devices (A6)? | D1 (product confirms): A1 built before the first outside family, no action link; A5, A7, A8 as specified; A3 and A6 after the BL-598 runbook; email only |
| Q-COM-2 | A control "Sign out other devices" already exists in Me, Account (`account.tsx:181-251`; it ends the other phones, keeps this one). Should using it send a confirmation email (A6), and should a "sign out everywhere including this phone" exist? (Correction: the question first posted on the PR said no control existed; that premise was wrong.) | Keep the control as built. Build the A6 confirmation email after the BL-598 runbook (D1); no second control; I5 tells each signed-out phone |
| Q-COM-3 | Are security alerts sent between 21:30 and 07:00? | Yes (exempt), like sign-in mail; AGREED (D2) |
| Q-COM-4 | In the email-changed notice to the old address, is the new address shown in full or masked? | Masked (first letter and domain) |
| Q-COM-5 | Does anyone get an email after repeated wrong codes (A2)? | No email (AGREED, D2 and D3). The phone pause line only: memory only, 5 in 15 minutes, and a server lockout may never block the local book (D3). A server count per address and a paging job stay an open question for `security-architect` until it is confirmed what Supabase gives (07.2 section 5, gap 2) |
| Q-COM-6 | Is there an in-app place that echoes an alert after the fact (I9), or is email the only record? | No new screen in v1. The email is the record; I5 and I6 are the only in-app lines |

### 5.2 Questions for the council (each with a default)

| To | Question | Default |
|---|---|---|
| CISO | May alert mail carry no action link at all (07.2 rule 3), only Help and "open the app"? | Yes, no link |
| CISO | Is a salted device-id hash per account (new table) acceptable for A1, and who may read it? | Yes; service role and the alert function only; deleted with the account; the CPrivO label read (does the hash count as Device ID, CQ8) comes before the table is built (D1) |
| Chief Privacy Officer | Does a device class word ("an iPhone") plus time count as L2 or L3 in an email? | L3 with the address; never stored in a log |
| CCO, CLO | Are A1 to A9 transactional under CAN-SPAM and need no unsubscribe, and does the incident notice (E14) stay counsel-approved by hand? | Yes transactional; yes by hand |
| CPO | Order of build: A4 (done), A5, A7, A8, then A1, then A6 and A3 | D1: A1 before the first outside family; A3 and A6 after the BL-598 runbook |
| CISO | When the 20-a-day backstop is reached, does a new takeover warning still send? | Yes, in one summary, never silently dropped [E] |
| CMO, CDesO | The words: subjects, the neutral lock-screen lines, the alert bodies (all PROPOSED keys `comms.alert.*`) | Written by `content` as a person, linted, approved by the founder |

### 5.3 Founder and counsel

| To | Question | Default |
|---|---|---|
| Founder | New-device sign-in email before the first outside family (D1, question 7 of the record)? | Yes |
| Founder | Remote push (APNs) in a later version? | No. Not decided here; 07.3 section 4 lists what would change |
| Founder | G-D21: neutral birthday title when names are off | The neutral title ("Something for the book today" family); D4 AGREED and widened: no month number or "A year of letters." with names off; founder confirms |
| Counsel | Whether Guideline 4.5.4 applies to local reminders (`09-capture.md:253`) and the notice of a data act sent after deletion | Local only, no promotion; receipts are legal notices |

## 6. Cites sampled

Checked against the worktree at `origin/develop` `4d33978f` on 20 Nov 2026 with a line-anchor script (a cite holds when the cited line contains the claim's anchor text). 89 cites sampled across the four files; 82 held at first pass; 7 were wrong by a few lines or had the wrong anchor and were corrected in the files (`auth.en.ts`, `DATA_CLASSIFICATION.md` range, `SECURITY.md`, `packages/emails/README.md` twice, and two `CATALOG.md` ranges); all 89 hold after correction.

| Group | Sampled | Held at first pass | Held after correction |
|---|---|---|---|
| Code (`planner.ts`, `scheduler.ts`, `prefs.ts`, `plan-reminders.logic.ts`, `errors.logic.ts`, `pending.ts`, `reauth.logic.ts`, `app.config.ts`, `push.ts`, `config.toml`, `purge-worker/emails.ts`, `escrow/restore.ts`, content files, `rules.test.ts`) | 44 | 42 | 44 |
| Docs (`CATALOG.md` 23, `SECURITY.md`, `DATA_CLASSIFICATION.md`, `NOTIFICATIONS.md`, `sign-everyone-out.md`, `back-office.md`, `GAP-LOG.md`, `packages/emails/README.md`, `09-capture.md` line 253 on the locked branch) | 45 | 40 | 45 |

Statements marked [U] were not cite-checked by design. The counts of grep results (no `categoryIdentifier`, no `scope: 'global'`, no `renderForResend` outside the purge worker) are command results from 20 Nov, not file lines.

Amendment check, 20 Nov 2026: the cites added by the council amendment were read at `origin/develop` `4e3abd50`: `docs/prd/v2/features/F02-account.md:232, 306`, `packages/content/src/emails/auth.en.ts:190-199`, `packages/content/src/features/reminders.en.ts:24-26`, `packages/content/src/features/auth.en.ts:291`, `docs/product/prd/11-foundations.md:109`, `docs/product/prd/14-test-plan.md:82`, `docs/agents/cto/RULINGS.md:632`, `docs/BACKLOG.md:2783`; and `docs/content/words-packet-20nov.md:80-81` on branch `docs/content-bl-965-founder-words` (PR #870). Not verified: CQ8 and the CPO and CDesO wording notes (read from the council returns, which are not in the repo), and whether `account.tsx` changed after 07.2 was written.
