# 07.1 Customer communication: the register of every message

Status: PROPOSED engineering reference | 20 Nov 2026 | Owner: `sync` (with `mobile`, `content`, `privacy`) | Part 1 of 4 of document 07. Files: 07.2 security alerts, 07.3 lifecycle and leak rules, 07.4 tests, questions, cites.

Tags: [V] verified in code or a doc at the cited line, [E] estimate with basis, [U] unverified, Rec = our recommendation. Data levels are the names in `docs/legal/DATA_CLASSIFICATION.md:42-47` (L1 Public, L2 Internal, L3 Confidential (PII), L4 Restricted); no new level is invented. Cards win (CR-66): where this file and a card differ, the card stands and a Conflict line says so (section 7). Every word a parent reads here is a PROPOSED content key; nothing in this pack approves wording. This file adds no feature, no vendor and no date.

## 1. The rules that hold for every row

| # | Rule | Source |
|---|---|---|
| R1 | Nothing in this register carries letter words, a transcript, audio, a picture description, a child name (unless the parent turned names on, local only), a due date, a count of letters or gaps, or a streak | CLAUDE.md privacy rules; NS-32-R11, R12; `DATA_CLASSIFICATION.md:69` (L4 never in an email subject or push payload) |
| R2 | Local notifications are the only reminders. No remote push exists in v1: no `aps-environment`, no token request | `apps/mobile/app.config.ts:103-106` [V]; FR-MSG-16; CL-064 |
| R3 | One budgeted notification a day, 60 pending in total, plan notices first inside the 60 | NS-32-R1; E13; CR-69 A1; CL-115 |
| R4 | Email is for what a person needs to know or keep: receipts of a data act, sign-in, a legal notice. No drips, no win-back, no countdowns, no marketing in v1 | `docs/emails/CATALOG.md:10, 14` (principles 1 and 5), `:153-174` (never list); FR-MSG-22 |
| R5 | Every send has an idempotency key (event, subject id, period) and is never re-sent because it was not opened; we do not know if it was opened (no tracking pixel, no click tracking) | `CATALOG.md` principle 2; `packages/emails/README.md:3` [V] |
| R6 | Every body is a `packages/content` key, never generated text, never built from user words | NS-32-R11; `packages/emails/README.md` "Adding an email" step 1 |
| R7 | Interruption level `active`, never `time-sensitive`; no sound, no badge | NS-32-R10; CL-062 (Q-MSG-9); `scheduler.ts:161` (`sound: false`), `:302` (`allowBadge: false`) [V] |

## 2. Local notifications (on the phone, no server)

Planner: `apps/mobile/src/lib/reminders/planner.ts` (pure); scheduler: `scheduler.ts`; settings keys: `prefs.ts:46-54`. The notification id is `el.<kind>.<date>` (`planner.ts:131, 334, 365` [V]): no child id, no name. The tap payload is `{ source, kind }` only (`scheduler.ts:159` [V]).

| ID | Message | Status | Trigger | Owner (build / words) | Data used (level) | Consent and opt-out | Frequency and budget | Quiet hours | Test |
|---|---|---|---|---|---|---|---|---|---|
| L1 | Evening nudge (class `evening`, rank 5) | Built, never run on a phone [V `NOTIFICATIONS.md:9`] | Planner: cadence days at the chosen time | `mobile` / `content` (`en.notifications.evening` `strings.en.ts:690`, neutral set `reminders.en.ts`) | Cadence, days, time, paused flag (L2); last own save time (L2); child first name only if names on and App lock off (L4) | iOS permission asked once after the first kept letter, at most 2 showings of the ask card; off in Me, Reminders; pause; per-book "Include in my reminders"; iOS Settings | Default Tue and Sat 20:30 (`planner.ts:136-137`); back-off 7 daily then weekly for 4 weeks, nothing after day 35 (NS-32-R8, NS-13 3a); not within 20 h of a save, 2 h of a foreground (`planner.ts:140-141`) | 07:00 to 21:30 local; time clamped (`planner.ts:133`) | NS-32-R1, R8, R10; J-N24; NTC-T07, T15 |
| L2 | Month note (`monthAge`, rank 4) | Built | Birth date plus the day a new month begins | `mobile` / `content` (`monthOpen`) | Birth date (L4, stays on phone), child name (L4, only if names on) | Same permission; "Month and birthday messages" switch (`reminders.monthNotes`); a book with no birth date gets none; per-book pause | At most 1 a day; replaces that day's evening nudge | As L1 | NS-32-R1b, R3; planner tests |
| L3 | Birthday (`birthday`, rank 2) | Built; neutral title conflict (7, C4) | Child's birthday | `mobile` / `content` | Birth date (L4, on phone); name only if names on | As L2 | 1 a year per child; wins over month and evening | As L1 | NS-32-R1b, R3, R12 |
| L4 | Typed day (class `typedDay`, rank 1) | Card only; not in `PlannedKind` (`planner.ts:111` [V]) | A day the parent typed (NS-18) | `mobile` / `content` | The parent's own typed label (L4); fixed line by default, typed words only if that day's "show my words" is on | Per day; Me, Reminders; clears on sign-out and Erase (CR-69 A4) | 1 slot; survives back-off (NS-32-R9) | As L1 | NS-32-R9; NS-18 rows |
| L5 | Library day (inside the `typedDay` group, rank 3) | Card only (NS-46) | A day the parent ticked from the days list | `mobile` / `content` | Which days ticked (L4: can reveal faith); name only behind its own switch, forced off while App lock is on (GAP-LOG CB-5, `GAP-LOG.md:444`) | Opt-in per day; default none; the app never infers a day | Counts toward the one a day; no new class (CR-69 A1) | As L1 | NS-46 rows; NTC-T11, T12 |
| L6 | Photo moment nudge (variant pool in `evening`) | Card only (NS-51) | A date that has pictures the parent can pick from | `mobile` / `content` | A boolean "moments exist" per date only; no asset id, count, place or album | Photo moments switch; library permission; off cancels at once | 1 in any 7 days, none after day 35 (CL-040); never resets the back-off anchor | As L1 | FR-NTC-22 to 31; NTC-T08 |
| L7 | Plan notices (6 kinds: `trialLong`, `trialWeek`, `trialFinal`, `annualLong`, `annualShort`, `yearly`, `plan-reminders.logic.ts:54`) | Built (BL-342) | Subscription dates read from this phone's own plan record | `payments` / `content` (`billing/copy.ts`) | Plan period end and trial length (L3: purchase state); no price, count or child name (NS-32-R12) | Needs the iOS permission; not tied to the reminders switch; the plan date is shown in Me, Plan when notifications are off | At most 4 pending (`plan-reminders.logic.ts:48`), one message a day, outside the one-a-day budget; both can fire on one day (NS-32 section 3) | Preferred 10:00, never in quiet hours (`:45`, header) | NS-32-R4, R4b; billing tests |

Pending ceiling: 60 in total with plan notices first inside it (E13, CR-69 A1). Today the planner caps its own group at 60 (`planner.ts:295`) and plan notices add up to 4 (`plan-reminders.logic.ts:48`), so up to 64 [V]; BL-966 lowers it. The split inside the 60 is in `budget.ts`, not yet written [U].

Dormant keys that exist and are not sent: `en.notifications.gentleReturn` (planner header says not built, `planner.ts:30`), `familyLetter`, `familyAdded` (`strings.en.ts` "v1.1"). They stay unreachable until remote push is decided (section 3). A test that fails when a key is reachable from a v1 build is Rec (07.4, T-17).

## 3. Push (remote, from our server)

There is no remote push in v1 [V: entitlement stripped `app.config.ts:103-106`; no token request in `apps/mobile/src`, grep 20 Nov]. The shapes exist only as contracts.

| ID | Message | Status | Trigger | Data in the payload | Consent | Budget | Notes |
|---|---|---|---|---|---|---|---|
| P1 | Co-parent letter (`co_parent_letter`) | Shape only, `packages/api/src/server/push.ts:15` | A co-parent's letter | Kind and fixed words; no name, signature, text or id (`push.ts:6-9`) | Not built | 1 per author per book per 2 h (`push.ts:25`) | Interruption `passive` (`push.ts:19`). v1.1 at earliest |
| P2 | Restore request (`restore_request`) | Shape only | A recovery key restore asked for | As P1 | Not built | Never collapsed | `time-sensitive` is in the shape; CL-062 says do not ask Apple for it until NS-08 is live and the rule is read |
| P3 | Billing "trial final" push | Dropped for v1 (CL-064) | n/a | n/a | n/a | n/a | `CATALOG.md:92` still lists it: stale (Conflict C1) |

If remote push is ever decided (the founder's call, not made here; BL-546, NS-26 parked), these must be true first, from FR-MSG-17: an APNs key with a named holder and a rotation; consent text and an in-app opt-out; a privacy-label row (Q54(d)); payloads limited to kind plus fixed copy; no child name, signature, letter text or id; quiet hours equal to the local window; a token table with RLS, a delete on sign-out and on account deletion; the endpoint (`push-send`) callable only by the database or a job, never by a client; the key never in the app, a log or a PR. Today none of these exist [V].

## 4. Email (from our servers, Resend, and Supabase Auth)

Sender is always `Early Letters <hello@earlyletters.com>` and never `no-reply@` (`CATALOG.md:16`). Three senders exist as code today [V by reading `supabase/functions`: `renderForResend` appears only in `purge-worker/emails.ts`; `escrow` mails through its own `mail.ts`, 20 Nov]: Supabase Auth (six templates, `supabase/templates/`), `purge-worker` (three deletion receipts, `purge-worker/emails.ts:50, 58, 63`) and `escrow` (three recovery key emails, `escrow/restore.ts`, `rotate.ts`). Of the 43 template files in `packages/emails/src/templates`, only these 12 have a sender; the rest have none yet [V].

| ID | Message (template id) | Sender and status | Trigger | Data used (level) | Consent and opt-out | Frequency and cap | Quiet hours | Test |
|---|---|---|---|---|---|---|---|---|
| E1 | `sign-in-link` (link and 6-digit code) | Supabase Auth, built | Email entered on the sign-in sheet | Email address (L3); one-time code and link (L4 secret); expiry 15 min (`config.toml:74`) | The person asked; nothing to opt out of | 1 per address per 60 s (`config.toml:70`); 100 an hour project-wide (`config.toml:54`) | Exempt: the person is waiting | `emails` tests; FR-MSG-10 |
| E2 | `verify-email` | Supabase Auth, built | First sign-in with a new address | As E1 | As E1 | As E1 | Exempt | As E1 |
| E3 | `reauthenticate-code` | Supabase Auth, built | Before account deletion when the session is stale | As E1 | As E1 | As E1 | Exempt | DELETION spec 2.6.1 |
| E4 | `email-changed-new-address` and `-old-address` | Supabase Auth (change and notification), built | Sign-in email changed; both addresses confirm (`config.toml:68`) | Both addresses (L3) | Cannot be turned off (security) | Per request | Exempt | Section 07.2 A5 |
| E5 | `apple-account-linked`, `google-account-linked` | Supabase Auth notification `identity_linked`, built (`config.toml:110`) | A sign-in method added | Method name, address (L3) | Cannot be turned off | Per event | Exempt | 07.2 A7 |
| E6 | `account-deletion-scheduled`, `-cancelled`, `account-deleted` | `purge-worker`, built | Deletion requested, cancelled, executed | Request reference and dates (L2); address (L3) | Required notices: never suppressed by a cap (`CATALOG.md:135`) | Once per request; `account-deleted` is the last mail to that address | Exempt if a window would close | `supabase/functions/purge-worker` tests |
| E7 | `backup-restore-requested`, `backup-key-used`, `backup-key-rotated` | `escrow`, built | Restore asked, key used, key rotated | Address (L3); no key material | Security notices, cannot be turned off | Per event | Exempt | `escrow/test` |
| E8 | `deletion-request-received`, `deletion-confirm`, `privacy-request-received` | Ops by hand (support runbook) | A rights request by email or the web route | Address (L3) | Required | Once per request | n/a | `data-requests-by-email.md` |
| E9 | `book-deletion-scheduled`, `-cancelled`, `coparent-left`, `family-book-closing`, `-restored`, `export-ready` | Template only, no sender | Book deletion, co-parent leaves, server export | Dates (L2); no child name (E-1, `CATALOG.md:22`) | Required for data acts | Once per request | Exempt | Template tests only |
| E10 | `policy-update` | Template only | Major policy change, 30 days before it takes effect | Version id (L1) | Sent even to people who opted out of marketing (transactional) | Once per major version | Quiet window applies | Counsel reads (L2 review) |
| E11 | Billing set (12 templates: `trial-started` to `plus-quiet`) | Template only; sender waits on the status report (D-080, `killSwitches.statusReport`) | Plan dates reported by the phone | Plan, price, dates (L3) | Required notices; `plus-quiet` is 1.1 | Per `CATALOG.md:86-99`; never delayed by a cap | Exempt only where the legal window closes | `validation-2026-10-31.test.ts` |
| E12 | `welcome`, `welcome-coparent`, `welcome-family`, `coparent-invite` | Template only | First sign-in; invite typed | Address (L3) | n/a | Once per account | Quiet window applies | Conflict C2: no invite email (CL-063) |
| E13 | `new-device-sign-in`, `sign-in-trouble`, `account-create-attempt`, `passkey-added` | Template only; `account-create-attempt` and `sign-in-trouble` have no sender by decision (SIGN-05) | Not wired | See 07.2 | See 07.2 | See 07.2 | See 07.2 | See 07.2 |
| E14 | Incident notice to affected people | Ops by hand, counsel approves every notice | A confirmed incident | Address (L3) | Legal duty | Once per incident | Counsel decides | `docs/ops/runbooks/incident-notification.md:1-3` |

Global rules (`CATALOG.md:133-139`): at most one non-auth email per address a day; nothing between 21:30 and 07:00 in the person's time zone except sign-in mail and a notice whose legal window would close; time zone from the last synced device zone, else US Pacific; a hard bounce stops non-required mail and shows one quiet row in Me, Account (no receiver exists yet, FR-MSG-06, FR-MSG-07 [U]). Apple Hide My Email: the three sending identities must be registered or mail is dropped (`CATALOG.md:141-150`; founder task, state [U]).

## 5. In-app lines (no channel; shown inside the app)

| ID | Line (key family, all PROPOSED where new) | Where | Trigger | Data used (level) | Opt-out | Frequency |
|---|---|---|---|---|---|---|
| I1 | Reminder ask card (`reminders.en.ts` `together`, `priming`) | Over the Book after the first kept letter | First letter saved | None (L2 flags) | "No reminders"; never asked again after a no | At most 2 showings ever (`NOTIFICATIONS.md:12`) |
| I2 | Notifications off line and Open Settings | Me, Reminders | iOS says no | Permission state (L2) | n/a | While true; nothing nags (FR-MSG-20) |
| I3 | Plan date line | Me, Plan | Notifications not allowed | Plan period end (L3) | n/a | While true (NS-32-R4) |
| I4 | Update line (E-S16) | Me only | Build below `minSupportedVersion` | Version (L2) | n/a | One line, nothing on Home (FR-LCY-17) |
| I5 | Signed out for your safety | Sign-in screen | `forceReauthEpoch` raised or session ended on another phone | None | n/a | Once per event; letters kept (`reauth.logic.ts:2`) |
| I6 | Deletion status and the "other phone" line | Me, Account | Deletion requested here or on another phone | Dates (L2) | Cancel within 30 days | Until done (FR-LCY-19) |
| I7 | "We could not reach {email}" row | Me, Account | Hard bounce | Address (L3) | n/a | While true; copy needed (FR-MSG-07) |
| I8 | Wrong code pause line | Code step | 5 wrong codes in 15 minutes (`errors.logic.ts:79-94` [V]) | None | n/a | While paused |
| I9 | Security echo lines for 07.2 alerts | Me, Account (design not decided) | An alert sent | Event kind and time (L2) | n/a | See Q-COM-6 |
| I10 | Moment, month and celebration cards (`en.moments.*`) | Book, Home | A kept letter or a month | Count of kept letters only (L2) | Celebrations pause per book | Per `moments` rules; no gap counts |

## 6. Budget in one view

| Channel | Ceiling | Where it is enforced |
|---|---|---|
| Local notifications, budgeted | 1 per local day, 60 pending in total with plan notices first | `budget.ts` (to be written, BL-966); today `planner.ts:295` |
| Plan notices | 4 pending, 1 message a day | `plan-reminders.logic.ts:48` |
| Email, non-required | 1 per address per day | `CATALOG.md:135` (no enforcement code found [U]) |
| Email, sign-in | 1 per address per 60 s, 100 an hour for the project | `supabase/config.toml:54, 70` |
| Push | 0 | `app.config.ts:103-106` |

## 7. Conflicts found (routed in 07.4 section 4)

| # | Conflict | Sources | Route |
|---|---|---|---|
| C1 | The email catalogue still plans "one push" for the trial-final notice | `CATALOG.md:12, 92` against CL-064 and the stripped entitlement | `content`, `payments`: edit the catalogue |
| C2 | The catalogue lists `coparent-invite` and `welcome-coparent` at v1.0 | `CATALOG.md:70, 62` against CL-063 (no invite email) and FR-MSG-14 | `content` |
| C3 | NS-32-R4b says 64 in total; E13 and CR-69 A1 say 60; code plans 60 plus 4 | `11-foundations.md` R4b, `planner.ts:295`, `plan-reminders.logic.ts:48` | `mobile` (BL-966); applied by CL-115 in the cards |
| C4 | Built neutral birthday title "A birthday today" tells a lock screen it is the child's birthday; the default on `GAP-LOG.md:203` (G-D21) is the neutral title | `reminders.en.ts:25`; G-D21 is a founder item with a default, not yet closed | `product`, `privacy`; `mobile` switches only after it closes |
| C5 | NS-32-R13 wants a neutral hidden-preview placeholder per category; no category or placeholder exists in code | `grep categoryIdentifier hiddenPreviewsBodyPlaceholder apps/mobile` returns nothing [V] | `mobile` |
