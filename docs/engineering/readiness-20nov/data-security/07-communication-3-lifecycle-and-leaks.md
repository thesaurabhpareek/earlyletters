# 07.3 Lifecycle stages and the rules that stop a message leaking child or family data

Status: PROPOSED engineering reference | 20 Nov 2026 | Owner: `sync` with `mobile`, `privacy`, `content` | Part 3 of 4 of document 07. Tags and level names as in 07.1. Message ids (L1 to L7, P1 to P3, E1 to E14, I1 to I10, A1 to A9) are the ones in 07.1 and 07.2.

## 1. Lifecycle, first run to deletion

For each stage: what may be sent or shown, by which channel, what is forbidden, and what must be cleaned up when the stage ends. "Nothing" is a valid answer and is the default.

| # | Stage | May send or show | Forbidden | Clean-up at the end of the stage | Source |
|---|---|---|---|---|---|
| S0 | Not installed, link tapped | Web page of the invite or the site; App Store link | Any message to a person who has not asked; any email for an invite | None | CL-063; FR-MSG-14 |
| S1 | First run, before the first letter | Nothing. No permission asked. One sentence of agreement; the age step | Notification permission ask; analytics before consent; any email | None | NS-39-R2; FR-MSG-19 |
| S2 | First kept letter | I1 reminder ask card (own sentence, then iOS alert), at most 2 showings; a first-letter moment card (I10) | A second ask after a no; any count of letters in a notification | Permission result stored as a setting only (L2) | NS-13; `NOTIFICATIONS.md:12` |
| S3 | Reminders on | L1 to L3 within the 1-a-day budget; I2, I3 | More than 1 budgeted a day; any text after day 35 without a made letter; any gap word | `forgetReminders` on sign-out or Erase (`scheduler.ts:322` [V]); re-plan on update, time zone change, permission change (NS-32-R6, R16) | NS-32; NS-13 3a |
| S4 | Sign in (email or Apple or Google) | E1 to E3; E5 when a method is added; in-app consent lines | Account existence hints; tokens in URLs or logs; a code in a push | Pending link read once (`pending.ts` `takePendingAuthLink`) | `SECURITY.md` 3.1, 3.6 |
| S5 | Family: a co-parent or contributor joins | The parent shares the link from their own Messages; the app shows its own lines | Any email from us to an address the parent types; any notice of removal, leaving or a declined invite | Invite tokens only in the URL fragment, hashed in the database | CL-063; `CATALOG.md:24-26`; FR-MSG-14 |
| S6 | Plus trial and renewal | L7 local plan notices (dates, no price on the lock screen); email notices E11 when a sender exists; the in-app sheet | A push; a countdown ("3 days left"); a save offer after cancelling | Plan notices re-planned on each status change; cancelled renewal skips the pending notices | CL-064; `CATALOG.md:86-99, 156-174` |
| S7 | Quiet or lapsed | Nothing after day 35 of no made letter (back-off). The plan notice still fires if a plan runs | "We miss you", "It has been a while", any win-back email, any gap count | None | NS-32-R8; `CATALOG.md:158` |
| S8 | New phone, restore, second account | I4 update line; the claim and "belongs to another sign-in" lines (FR-LCY-09, 10); the book reads signed out as normal | A scary "you lost your letters" line; a count of what is missing | Reminder settings do not sync: a new phone starts with none (NS-32 section 6) | `lifecycle-and-platforms.md` FR-LCY-09, 10 |
| S9 | Policy change | E10 `policy-update` by email, at least 30 days before it takes effect, plus an in-app card until accepted | Silent change; marketing text inside it | Acceptance stored (hashed, `policy_acceptances`) | `CATALOG.md:120` |
| S10 | Security events | A1 to A9 (07.2); A1 before the first outside family, A3 and A6 after the BL-598 runbook (D1); no A2 email (D2, D3) | Anything in 07.2 section 3 "never says" | Alert rows hold kind and time only | 07.2 |
| S11 | Deletion requested (30 days) | A4 receipt 1; in-app status I6; the other phone shows its line on next contact (FR-LCY-19) | Pressure to stay; an "are you sure" email after the first | Reminders and pending notifications cancelled on this phone at sign-out; the days store and moments index file deleted first (CR-69 A4) | `CATALOG.md:110-112`; FR-LCY-19 |
| S12 | Deletion cancelled | A4 receipt 2; in-app line | A win-back tone | None | `CATALOG.md:111` |
| S13 | Deletion executed | A4 receipt 3, sent before the sign-in user is removed; it is the last email to that address; it repeats how to cancel with Apple | Any later email, including billing, policy, or a survey; an alert to the former members except `coparent-left` once | Address removed from any send list; Resend suppression kept only as a hash if needed [U: vendor behaviour] | `CATALOG.md:112`; DATA-REQ-025 |
| S14 | Service closes (input only, unlocked function file FR-LCY-24; not a rule) | 90 days' notice by email and an in-app line; a final build that still saves a copy | Deleting data before the notice ends | Closing runbook (FR-LCY-24) | `lifecycle-and-platforms.md` FR-LCY-24 |
| S15 | After the person dies or cannot act (input only, FR-LCY-27; not a rule) | A human reply only; no automated mail | Any promise about access we cannot keep; any automated "memory" mail | None | FR-LCY-27 |

## 2. Leak rules: a message never carries child or family data

Each rule is testable. Test ids are proposals for 07.4. "Proves" says what the failing case looks like.

| # | Rule | Applies to | Why (level) | Test that proves it |
|---|---|---|---|---|
| LR-01 | A lock-screen title and body contain no child name unless the parent turned names on and App lock is off. Default off (`prefs.ts:41`). With App lock on, names are off whatever the stored choice (D4) | L1 to L7 | Child name is L4 (rule 6, `DATA_CLASSIFICATION.md`) | T-01: render every key both ways with names off; scan for the Asha child name and any `{child}` residue |
| LR-02 | A title never carries `{child}` or a day's family or faith name; the neutral title is "Something for the book today" family | L3, L4, L5, L6 | Birthday and faith are L4 facts; Apple lists religious belief as sensitive (`GAP-LOG.md:476`) | T-02: every title is name-free; neutral birthday title when names off (C4 closed in direction by D4; words PROPOSED) |
| LR-03 | A category sets a neutral hidden-preview body placeholder; iOS Show Previews "Never" then shows no words | L1 to L7 | NS-32-R13; today not built (07.1 C5); D4 adds it, words row 18 option A of #870 PROPOSED; NTC-T24 | T-03: scheduler test asserts every scheduled request has a category with a placeholder |
| LR-04 | Tap payload is `{ source, kind }` and nothing else: no asset id, date list, count, album, child id, book id | All local | Ids are L3 | T-04: the payload schema is strict and a fixture with a child id fails |
| LR-05 | Notification identifiers are `<prefix>.<kind>.<date>` only; no child or book id | All local | Book and child ids are L3 (rule 5) | T-05: id regex test over a plan of three children |
| LR-06 | No notification, plan notice or email carries a count of letters, a gap, a streak, a price (lock screen), a due date, or "tonight" before 17:00 | L1 to L7, E | Guardrail (a); FR-NTC-12 | T-06: content rules on every key (`rules.test.ts`) plus a time-of-day filter test |
| LR-07 | An email subject, preheader and body hold no child name, no book name, no letter text, no signature of a person outside the same book. Adult display names only in mail to members of the same book (E-2) | E1 to E14 | E-1, E-2 (`CATALOG.md:22-23`) | T-07: render each template with the Asha fixture; scan subject, preheader, html, text for the fixture's child name and letter lines |
| LR-08 | An email never carries a sign-in token in a query string or path; the link token is after `#`; alert mail carries no token at all | E1 to E5, A1 to A9 | Scanner prefetch burns or leaks it (FR-MSG-10) | T-08: link scan over all exports |
| LR-09 | No remote images from another host, no tracking pixel, no click tracking, no web fonts | E | A request would tell us and a third party it was opened (Q-MSG-8, CL-062) | T-09: `packages/emails` test on every `src` and `href` host |
| LR-10 | A push payload (if one ever exists) carries a kind and fixed words only; `PushPayloadSchema` is a strict object | P1, P2 | L4 never in a push payload (`DATA_CLASSIFICATION.md:69`) | T-10: schema test with an extra field fails (`push.ts` `strictObject` [V]) |
| LR-11 | Logs and crash reports hold the message kind, the request id and the outcome; never the address, title, body, name, device hash or token | Every sender | Level rules L3 and L4 | T-11: log canary over function logs with the Asha fixture (`DATA_CLASSIFICATION.md:38`, canary not built) |
| LR-12 | Analytics never records a notification's words, name, or whether a given letter or day was the cause; it may hold the allowlisted L2 events only | All | `CLAUDE.md` privacy rules; opt-in only | T-12: allowlist test; no event named for a notification body |
| LR-13 | A foreground notification of our own is not shown as a banner while the app is open (`shouldShowBanner: !ours`) | L1 to L7 | A name on screen beside another person | T-13: the handler test at `scheduler.ts:232` [V] |
| LR-14 | Sign-out, Erase and account deletion cancel and dismiss every pending and delivered notification of ours before any await | L1 to L7 | A second account on the phone must not see the first's reminders (NS-32 section 6) | T-14: `forgetReminders` clears all ids with prefix `el.` and `plan.` |
| LR-15 | Safety tiers stay on the device; no notification or email is chosen by a tier on a server | L1 to L6 | `CLAUDE.md` privacy rules | T-15: no server reader of tier keys (grep gate) |
| LR-16 | A quieted book (hard-day tool) contributes no notification of any class, and no email mentions it | L1 to L6, E | NS-32-R14 | T-16: planner test with a quieted book |
| LR-17 | A key that exists in content but is not wired to a v1 build is unreachable (`gentleReturn`, `familyLetter`, `familyAdded`, billing push) | All | No dormant surface (FR-MSG-09, FR-MSG-16) | T-17: reachability test over `en.notifications` |
| LR-18 | Words authored for a message are written by a person, linted by `rules.test.ts`, and marked PROPOSED until the founder approves them | All | CLAUDE.md: the machine never writes or shapes words | T-18: the content PR gate |
| LR-19 | The photo library is never read to decide a message: no notification is chosen by what a picture shows, where or when it was taken | L6 | Constitution; NS-51; FR-NTC-25 | T-19: the planner input type has a boolean per date and nothing more |
| LR-20 | An email to a person outside the book says nothing about the book beyond its existence on the invite path. No invite email is sent at all in v1 | E12 | CL-063 | T-20: no sender calls `coparent-invite` |
| LR-21 | With names off, no lock-screen title or body carries a month number or "A year of letters." | L2, L3 | Age is derived from the birth date (L4) (D4) | T-30: render `monthOpen` and the birthday keys with names off, scan for digits and "year" |

## 3. Who may read a message's inputs

| Input | Lives | Read by | Never read by |
|---|---|---|---|
| Reminder settings (`reminders.*`, `notifications.lockScreenNames`) | Phone `scribe.db` settings (L2) | The planner and the scheduler, this phone only | The server, analytics (the setting `lockScreenNames` is L2 and not an event) |
| Birth dates, child names | Phone and server `children` (L4) | The planner, in memory, to choose a neutral or named rendering | Any email, push, log or analytics |
| Account address | Supabase Auth (L3) | Auth, `purge-worker`, `escrow`, the alert function | The app after sign-in beyond display in Me, Account; logs |
| Plan dates | Phone plan record (L3); status report to server (D-080) | `plan-reminders.logic.ts`; the status function | Child-linked data; marketing |
| Event time and device class for alerts | Database row (L2 and L3) | The alert function only | Support tools beyond the audit-logged lookup |
| Device-seen hash for A1 | Database table (new; L3 with the account) | The alert function only (service role) | Logs, email bodies, support tools; not built until the CPrivO label read is done (D1) |

## 4. What changes if the founder decides remote push

Not decided here. If it is decided, engineering must add, in this order, with a threat read by `security-architect` first: (1) the entitlement removed from the strip list on purpose (`app.config.ts:98-103`) and the privacy label row; (2) consent text and an off switch in Me, Reminders; (3) a token table with RLS, written only by the owner, deleted on sign-out and on deletion, and the token treated as L4 (secret); (4) `push-send` as an Edge Function that no client can call; (5) APNs key in the function's secret store with a named holder and a rotation date; (6) payload built only by `buildPushPayload` with content keys; (7) the budget: push joins the same 60 and the same 1 a day (NS-32), never a second channel for the same reminder; (8) the tests LR-10, LR-11 and a delete-on-sign-out test. Endpoint class: Edge Function, caller is a database job, not a user.
