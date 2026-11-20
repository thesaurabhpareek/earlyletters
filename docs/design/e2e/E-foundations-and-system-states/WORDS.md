# Area E. Foundations and system states: the words

Status: DRAFT, 20 Nov 2026 (UTC). Content design lead, area E. Docs only. Nothing here is written into `packages/content`; every new key is PROPOSED and waits for the founder's word approval (gate G3) and, where marked, a counsel read (gate G2). Words in the cards are intent; these are the proposed strings.

Keyed to `DESIGN.md` in this folder: screen ids `E-S01` to `E-S26`, its state names (section 4) and its cross-area catalogue `E-ST01` to `E-ST41` (section 6). This file was first drafted against the skeleton and then re-keyed to the full design file; the states this file needs that the design file does not list yet are in section 12a.

Sources read, in the brief's order: cards `00`, `08` (NS-10), `11` (NS-32 to NS-37), `01` and `02` and `05` and `06` and `07` and `09` (error codes only), `14-test-plan.md`, `16-council-review-round-2.md` (T1 to T5, D1 to D13); `docs/BACKLOG.md` BL-922, BL-961, BL-965; `/home/claude/review/eng/C-platform-quality-delivery.md` sections 2 and 4; `packages/api/src/envelope.ts` and `kill-switches.ts`; `packages/content/VOICE.md`, `BRAND.md`, `test/rules.test.ts`, `src/strings.en.ts`, `src/features/*.en.ts`; the built screens and logic named in each section. Engineering plan PR #847 was not fetched (no network call made); nothing below depends on it beyond the backlog rows, which are on disk.

Flags used in the tables:
- **REUSE**: the key exists today and is used as is.
- **PROPOSED**: a new key. Text is this file's proposal.
- **CHANGE**: an existing key whose words this file proposes to change (with why). Registered text changes only through counsel.
- **COUNSEL**: counsel and the founder read these exact words before a store build shows them.
- **HOLD**: words are drafted but no build may show them; the state they describe does not exist in code yet, or the feature is off.

Superseded: `docs/design/specs/FIRST-RUN-WORDS-10nov.md` is history (brief section 1.5). Where it differs from the cards or the code on `develop`, this file wins. Specifically superseded: its story-card deck (section 1, not built on `develop`; out of scope here until a card asks for it), `firstRun.auth.*` keys (the built `authCopy.firstRun`, `authCopy.outage` and `authCopy.offline` cover the same states), the Google and passkey rows for the first-run entry (Build 12 offers Apple and email only), and its proposal to keep the co-parent "coming soon" line (the frame, section 4, now says nothing anywhere says "coming soon" for the other parent).

---

## 1. Rules every line here was checked against

From `rules.test.ts`, `VOICE.md`, `BRAND.md` and brief section 2, applied by hand and by the check in section 12:

1. ASCII only: no em or en dashes, curly quotes, ellipsis characters or emoji.
2. No fear, guilt or loss words (the test's list, plus the cards' bans for this area: "lost", "missing", "everything moved", "gone" for a book).
3. Nothing implies the app writes; "rewrite" only inside a "never".
4. `{child}` only; no gendered word for anyone.
5. No counts of gaps, streaks, "since", days-left, countdowns.
6. Parent words only from the glossary. Never in a parent line: take, entry, draft (noun), pack, lens, index, sync as a noun for a status, server, error, code (except the 6-digit sign-in code), kill switch, outage, account mismatch.
7. Placeholders only from the test's list. This file uses `{app}`, `{child}`, `{email}`, `{date}`, `{size}`, `{n}`.
8. Buttons 22 characters or fewer, as written and filled with the Asha fixtures.
9. Error and state titles carry no full stop (the `en.errors` rule).
10. No "we" or "our" outside the sanctioned promises in any PROPOSED line.
11. "safe" only after a failed save and a crash (VOICE, "Words we lean on too much"). "Nothing has changed." only where nothing did.
12. Plus: one gate, at Keep. No price, trial length, "free trial", "free months" or "we will email" in any Keep or Plan line (D-083). No "free forever", no "always free", no "never limited" (frame section 7; ruling T1). Read together is never named in a Plus line; the only public form is the listing's.
13. No "stays on this phone", "never leaves", "only on this phone" in a PROPOSED line (option B, D-100), except the D1 sign-out sentence, which is ruled.

## 2. The system-state voice (the shared rule every area reuses)

Every system line has the same three parts, in this order, and drops any part it does not need:

1. **What happened**, named plainly: "You're offline.", "Sending letters to your account is paused for now.", "That sign-in did not finish." Never "Something went wrong" where the act is known.
2. **What is still true**, only if it is true on this phone in this state: "Recording, reading and saving still work." Never "safe" outside a failed save or a crash. Never "Nothing has changed." when something did.
3. **What the parent can do**, at most one action, as a button with a glossary verb: Try again, Open Settings, Sign in, Open the App Store.

What the lines never do: show a code, a request id, a status number or the word "error"; blame the parent ("You entered", "invalid"); name our servers or a vendor; promise when it will be fixed; count anything; use red. A remote pause hides a surface silently; a line appears only when a parent was in the middle of the act that the pause stopped.

Where it shows (design owns the layout, keyed here for the words): a full screen only when nothing else on the screen can work (launch fault, fault screen, sign-in unreachable on first run); otherwise the `SystemLine` in place (E-S15), under the control that did not work.

## 3. Cross-area state catalogue: which words each state uses

Re-keyed to `DESIGN.md` section 6 (the design lead's `E-ST01` to `E-ST41` and render classes R0 to R6). This file proposed its own ids in its first draft; those are withdrawn and the design lead's ids stand. Only states that carry words are listed; every other state is R0 or R1 and says nothing.

| State id | State | Render | Line key (sections 4 to 7) | Flag |
|---|---|---|---|---|
| E-ST01 | Offline | R2 on the server act touched | `system.offline.line`, or the act's own line (table 4.1, `network`) | PROPOSED |
| E-ST02 | Service outage, signed in | R0; R2 on a server act a parent is waiting on | `system.unreachable.line`; Account Sync row `account.sync.unknown` | PROPOSED + REUSE |
| E-ST03 | Sign-in outage, first run | R4 (E-S14) | `authCopy.outage.*`, `authCopy.offline.*` | REUSE |
| E-ST04 | Servers-off build | R1 | none; Me card `settingsHome.cardOnPhone` | REUSE |
| E-ST05 | `sync` paused | R0; R2 on the Sync row | `account.sync.paused` "Paused for now"; `system.paused.sync` only if a parent taps Sync | PROPOSED |
| E-ST06 | `invites` paused | R2 | `familyCopy.errors.paused` | REUSE (area D) |
| E-ST07 | `photos` paused | R1 | none; `system.paused.line` only if the picker was open | PROPOSED |
| E-ST08 | `packDownloads` paused | R2 | `packsCopy.failures.downloads_paused`, `languageCopy.status.paused` | REUSE |
| E-ST09, E-ST12 | `serverContent`, `statusReport` | R0 | none | n/a |
| E-ST10, E-ST11 | `backupUploads`, `escrow` | R2 at flip only | `backupCopy.paused` | REUSE, HOLD |
| E-ST13a to E-ST13c | proposed pauses | R1 | none; `system.paused.line` only if a sheet was open | PROPOSED |
| E-ST17 | `forceReauthEpoch` raised | R2 in Me | `authCopy.errors.session_expired` | REUSE |
| E-ST18 | `minSupportedVersion` above this build | R2 in Me (E-S16.line) | `system.update.line` + `system.update.storeButton` | PROPOSED |
| E-ST20 | Free, allowance not used | R0 | `billingCopy.membership.line` on Welcome and Plan | REUSE |
| E-ST21 | Second free letter kept | R3 | `billingCopy.keepGate.secondFreeNote` | REUSE |
| E-ST22 | Allowance used, Plus off | E-S26, E-S10 | `billingCopy.tonight.plusLine` (CHANGE), `keepGate.*` | REUSE |
| E-ST23, E-ST25 | Plus on, trial, renews, ends, shared, grace, retry | E-S11 | `billingCopy.plan.*` (registered) | REUSE |
| E-ST24 | Plan lapsed | E-S11.ended, E-S26, E-S10.lapsed | `membership.ended`, `keepGate.lapsedBody`, `plusLine` | REUSE (section 6) |
| E-ST27 | Alpha build | Welcome, Plan, Keep | `billingCopy.alpha.note` | REUSE |
| E-ST28 | Signed out with a book | C-S02 | `authCopy.account.signedOutTitle`, D1 body (area C) | REUSE |
| E-ST29 | Second account on the phone | filter rule, no line | none (section 5.6) | n/a |
| E-ST30, E-ST31 | Consent outstanding, declined | E-S09 to C-S11 | `authCopy.newPhone.consentBody`, `declinedTitle`, `declinedBody`, `system.consentNeeded.line` | PROPOSED |
| E-ST32 | Under 1 GB | R2 on Listen Ready | `system.storage.lowLine` | PROPOSED |
| E-ST33 | Under 50 MB | R4 on Listen; Me, Storage | `en.errors.phoneFull.*`; `system.storage.card*` | REUSE + PROPOSED |
| E-ST34 | Under 20 MB mid-take | Review line (area A) | `wordsCopy.pack.stoppedFull` | PROPOSED |
| E-ST35 | Low Power Mode | printable PDF line (area C) | card intent "This may take a little longer while Low Power Mode is on." | area C |
| E-ST37 | First launch after an update | R0 | none: no "what's new" | n/a |
| E-ST38, E-ST39 | Interrupted, killed | E-S19 | `wordsCopy.pack.stopped*`, `tonight.draft.*` | REUSE |
| E-ST40 | Screen threw, fatal | R6 E-S13 | `en.errors.crash.*` | REUSE |
| E-ST41 | Database did not open | R6 E-S01.recovery | `en.errors.launch.*` | REUSE |

---

## 4. The shared error vocabulary (every code, one parent line each)

Source column: **envelope** means the code is in `packages/api/src/envelope.ts` (`API_ERROR_CODES` version 2, `SQLSTATE_RULES`, `ERROR_DETAILS`); **phone** means a closed code or outcome raised only on the phone (a TypeScript union in `apps/mobile/src`, or a code named in a locked card). No code is ever shown to the parent: the parent reads only the line in the Text column. "Not shown" means the action is a silent retry or a reject that keeps the content on the phone, per `ERROR_CODE_ACTIONS`; the line in brackets is what shows if a parent is waiting on that exact call.

### 4.1 Envelope codes (`API_ERROR_CODES`, version 2)

| Code | Source | Action (envelope) | Met where | Parent line key | Text | Flag |
|---|---|---|---|---|---|---|
| `bad_request` | envelope | reject | Queue: never shown. A request a parent waits on (invite, consent, Plus status) | `system.notThrough.line` | That did not go through. Nothing you saved has changed. | PROPOSED |
| `unauthorized` (28000) | envelope | reauth | Refresh once, silently. If refresh fails | `authCopy.errors.session_expired` | You were signed out. Sign in again to carry on. | REUSE |
| `unauthorized` with detail `session_ended` | envelope | reauth | Signed out by Sign out other devices | `authCopy.errors.session_expired` | You were signed out. Sign in again to carry on. | REUSE |
| `forbidden` (42501, SCAPR) | envelope | reject | Queue: not shown. Family request | `familyCopy.errors.not_allowed` | That isn't possible from here. | REUSE |
| `not_found` (P0002) | envelope | reject | Queue: not shown. Invite link | `familyCopy.errors.not_found` | That link does not open an invite. Check it and try again. | REUSE (area D) |
| `conflict` (23505, 409) | envelope | reject | Queue: not shown (the letter is kept on the phone). Request | `system.notThrough.line` | That did not go through. Nothing you saved has changed. | PROPOSED |
| `conflict` (40001, 40P01, 55P03) | envelope | retry | Not shown | none | n/a | n/a |
| `gone` (410) | envelope | reject | An endpoint this version no longer has | `system.update.line` | This version of {app} can no longer reach your account. Recording, reading and saving still work on this phone. | PROPOSED |
| `payload_too_large` (413) | envelope | reject | Queue: not shown; the letter stays on the phone | none | n/a | n/a |
| `upgrade_required` (426, SCVER) | envelope | tell_user | Any server act; Me (E-S16.line) | `system.update.line` / `.storeButton` | This version of {app} can no longer reach your account. Recording, reading and saving still work on this phone. / Open the App Store | PROPOSED |
| `rate_limited` (429, SCRAT) | envelope | retry (queue) / tell_user (request) | Queue: not shown. Request | `system.waitAMoment.line` | Too many tries for now. Wait a few minutes, then try again. | PROPOSED (same words as the second half of `authCopy.errors.rate_limited`) |
| `timeout` (408, 57014) | envelope | retry | Not shown. If a parent is waiting past the screen's own wait | `system.unreachable.line` | Your account can't be reached right now. Recording, reading and saving still work. | PROPOSED |
| `unavailable` (5xx, transient classes) | envelope | retry | Same | `system.unreachable.line` | Your account can't be reached right now. Recording, reading and saving still work. | PROPOSED |
| `internal` (unknown code or SQLSTATE) | envelope | reject | Queue: not shown. Request | `system.notThrough.line` | That did not go through. Nothing you saved has changed. | PROPOSED |
| `network` (status 0) | envelope | retry | Not shown in the queue. A tapped act | `system.offline.line` | You're offline. Recording, reading and saving still work. | PROPOSED |
| `consent_required` (SCCON, details `terms`, `age`, `sensitive-data`) | envelope | pause_for_consent | The outbox pauses; Me, Account and the returning sheet | `system.consentNeeded.line` + `authCopy.account.finishSetup` | Your letters are kept on this phone until you finish setting up. / Finish setting up | PROPOSED + REUSE, COUNSEL |
| `consent_required` detail `family-share` | envelope | pause_for_consent | Invite | `familyCopy.errors.family_share_consent` | Sharing a book now asks for one more agreement. Update the app to see it, then try again. | REUSE (area D); CHANGE proposed: "the app" is a banned name, use "Update {app} to see it, then try again." |
| `consent_required` detail `backup` | envelope | pause_for_consent | Backup (off in every build) | none | HOLD with backup | HOLD |
| `immutable` (SCIMM) | envelope | reject | Not shown; the phone's copy is kept | none | n/a | n/a |
| `tombstoned` (SCTMB) | envelope | reject | Not shown | none | n/a | n/a |
| `last_parent` (SCLPG) | envelope | reject | Leave a book | `familyCopy.errors.last_parent` | You're the only parent of {child}'s book now, so it stays with you. | REUSE (area D) |
| `deleted` (SCDEL) | envelope | reject | Queue: not shown. On the new-phone wait: the account was deleted elsewhere (NS-10-R9) | `authCopy.newPhone.accountDeleted` | This account was deleted on another phone. You can start a new book here. | PROPOSED, COUNSEL |
| `deleted` detail `purged` | envelope | reject | Same | `authCopy.newPhone.accountDeleted` | as above | PROPOSED |
| `not_parent` (SCPAR) | envelope | reject | Queue: not shown. Family request | `familyCopy.errors.not_allowed` | That isn't possible from here. | REUSE |
| `invite_unusable` (SCINV, details `expired`, `used`, `revoked`, `already_member`, `not_found`, `role_disabled`, `code_taken`, `token_taken`, `closed`, `codes_paused`) | envelope | tell_user | Invite | `familyCopy.errors.<detail>`; `role_disabled` and `codes_paused` read `familyCopy.errors.paused`; `code_taken`, `token_taken`, `closed` retry once with a new invite, then `familyCopy.errors.unknown` | (area D's words) | REUSE (area D) |
| `plus_required` (SCPLS) | envelope | tell_user | Server no longer enforces Plus (founder decision 3). If ever met: the Keep gate (E-S10), never an error line | `billingCopy.keepGate.*` | section 6 | REUSE |
| `anonymous_refused` (SCANO) | envelope | reject | Never the app's case | none | n/a | n/a |
| `parents_full` (SCCAP) | envelope | tell_user | Join a book | `familyCopy.errors.book_full` | This book already has two parents. Ask the person who invited you. | REUSE (area D) |
| `paused` (SCKIL, SCBKO, `Retry-After`) | envelope | retry | Per detail: table 7 | table 7 | table 7 | see table 7 |
| `idempotency_conflict` | envelope | reject | A client bug; not shown | none | n/a | n/a |
| `reauth_required` (SCSTP, detail `step_up_required`) | envelope | tell_user | Backup and recovery-key steps only (off) | `system.signInFresh.line` / `account.signIn` | This step needs a fresh sign-in. Sign in again, then try once more. / Sign in | HOLD (backup off) |
| `quota_full` (SCQTA) | envelope | tell_user | Backup (off) | `backupCopy.quotaReached` | New recordings are not being backed up. Write to us and we'll help. | REUSE, HOLD (backup off); note "we'll" is a "we" line, registered with backup |

Escrow and backup-server details (`device_unknown`, `device_revoked`, `on_hold`, `cancelled`, `deletion_pending`, `limit_*`, `key_exists`, `revoked`, `entry`, `key`, `object`, `nothing`, `released`, `count`, `code`, `size`, `approvals`, `begin`, `devices`, `pending`, `restore_open`, `rotation`): backup and recovery are off in every build (NS-08 "get ready, do not turn it on"). No parent line is drafted; they are area C's when NS-08 turns on, and each must then get a row here.

SQLSTATEs the platform pass found missing from the chapter 02 table (`SCCAP`, `SCBKO`, `SCSTP`, `SCQTA`, `SCKIL`) are each in the rows above with their parent line, so the chapter fix can copy this mapping.

### 4.2 Phone codes: sign-in (`AuthErrorKind`, `lib/auth/machine.logic.ts`)

| Code | Source | Met where (E screen) | Parent line key | Text | Flag |
|---|---|---|---|---|---|
| `cancelled` | phone | E-S04 | none: the sheet stays | n/a | n/a |
| `network` | phone | E-S04, E-S05, E-S06 | `authCopy.errors.network` | Nothing has changed. Sign in once you are back online. | REUSE |
| `expired` | phone | E-S06 (link) | `authCopy.errors.expired` | That link has expired. Send a new email for a fresh one. | REUSE |
| `wrong_code` | phone | E-S06 | `authCopy.errors.wrong_code` | That code didn't match. Check the newest email, or send a new one. | REUSE |
| `code_paused` | phone | E-S06 | `authCopy.errors.code_paused` + `authCopy.code.pausedOtherWays` | Nothing has changed. You can try a code again in 15 minutes. / The link in the newest email still works, and so do the other ways to sign in. | REUSE |
| `email_wait` | phone | E-S05 | `authCopy.errors.email_wait` | Nothing has changed. Another email can't be sent just yet. Wait a few minutes, then try again. | REUSE |
| `rate_limited` | phone | E-S06 | `authCopy.errors.rate_limited` | Nothing has changed. Too many tries for now. Wait a few minutes, then try again. | REUSE |
| `invalid_email` | phone | E-S05 | `authCopy.errors.invalid_email` | That email doesn't look quite right. | REUSE |
| `not_available` | phone | E-S04 | `authCopy.errors.not_available` | Nothing has changed. This way of signing in isn't available right now. Try another way. | REUSE |
| `provider` | phone | E-S04 (first run, no book) | `authCopy.firstRun.errors.provider` | That sign-in did not finish. Try again, or try another way. | REUSE |
| `provider` | phone | E-S04 (a book is on the phone) | `authCopy.errors.provider` | Nothing has changed. That sign-in did not finish. Try again, or try another way. | REUSE |
| `session_expired` | phone | Me, Account; any act | `authCopy.errors.session_expired` | You were signed out. Sign in again to carry on. | REUSE |
| `under_18` | phone | E-S03 | `en.ageGate.stopTitle` | {app} is currently for adults 18 and over | REUSE, COUNSEL (registered) |
| `consent_unavailable` | phone | E-S07 | `authCopy.errors.consent_unavailable` | Setting up your account did not finish. Try again. | REUSE |
| `other_phone` | phone | E-S06 (verify) | `authCopy.verify.refusedTitle` + `authCopy.errors.other_phone` | This link can't be used here / Type the code from the email on this phone instead. | REUSE |
| `other_phone_spent` | phone | E-S06 | `authCopy.verify.refusedTitle` + `authCopy.errors.other_phone_spent` | This link was opened on a different phone. Send a new email, then use the link or code from it. | REUSE |
| `already_signed_in` | phone | E-S06 | `authCopy.verify.refusedTitle` + `authCopy.errors.already_signed_in` | You're already signed in on this phone. To use another account, sign out, then type the code from the email. | REUSE |
| `unknown` | phone | any sign-in step | `authCopy.errors.unknown` | That did not go through. Nothing has changed. | REUSE |
| first run, sign-in unreachable (gate step `outage`, variant `outage`) | phone | E-S04 replaced by E-S14 | `authCopy.outage.title` / `.body` / `.retry` / `.startLocal` / `.startLocalNote` | Sign-in cannot be reached right now. / Try again in a moment. / Try again / Start on this phone / Start the book on this phone for now. You can sign in later and choose to keep your letters in your account. | REUSE; CHANGE proposed for the title: drop the full stop, "Sign-in cannot be reached right now" (titles carry none) |
| first run, offline (gate step `outage`, variant `offline`) | phone | E-S14 | `authCopy.offline.title` / `.body` | Sign-in needs a connection. / Connect to the internet, then tap Try again. | REUSE; CHANGE proposed: title without full stop |
| back online under E-S14 | phone | announcement only | `authCopy.outage.backOnline` | You are back online. | REUSE |
| `notConfigured` (a build with no project settings) | phone | E-S04 | `authCopy.sheet.notConfigured` | Signing in is not available right now. Nothing on this phone has changed. | REUSE |

### 4.3 Phone codes: sync, account and second account

| Code | Source | Met where | Parent line key | Text | Flag |
|---|---|---|---|---|---|
| `CallFailure.network` | phone | Queue | Not shown. Where your letters live shows `account.sync.unknown` | Waiting for a connection | REUSE |
| `CallFailure.auth` | phone | Queue | Refresh; if it fails, `authCopy.errors.session_expired` | You were signed out. Sign in again to carry on. | REUSE |
| `CallFailure.anonymous` | phone | Never the app's case | none | n/a | n/a |
| `CallFailure.rate_limited` | phone | Queue | Not shown (back off in order) | n/a | n/a |
| `CallFailure.bad_request` | phone | Queue | Not shown; the one op is set aside and the letter stays on the phone | n/a | n/a |
| `CallFailure.server` | phone | Queue | Not shown | n/a | n/a |
| `AccountMismatchError` (`sync_account_mismatch`; the platform pass's `owner_mismatch`) | phone | E-S18 (a filter rule) | none: sync stops, lists filter to the signed-in account, no line (section 5.6) | n/a | BL-961 |
| account read timed out at 10 s on a new phone | phone | E-S09 | `authCopy.newPhone.slowTitle` / `.slowBody` | Your book is taking a while. / Check your connection, then try again. | REUSE |
| account read offline on a new phone | phone | E-S09 | `authCopy.newPhone.offlineTitle` + `authCopy.offline.body` | Opening your book needs a connection. / Connect to the internet, then tap Try again. | REUSE |
| account has no book | phone | E-S09 | `authCopy.consent.noBook.*` | No book here yet / Did you use a different way to sign in last time? / Try another way / Start a book | REUSE |
| signed-in session, settings unreadable (any failed read) | phone | Me, invite sheets | `authCopy.account.gateOffline` | You're signed in. This needs a connection. Try again in a moment. | REUSE |

### 4.4 Phone codes: capture, words and storage (shared with area A)

| Code | Source | Met where | Parent line key | Text | Flag |
|---|---|---|---|---|---|
| `MicProblem` off | phone | Listen | `en.errors.micDenied.*` | The microphone is off / Turn it on in Settings, or type this one. / Open Settings / Type instead | REUSE |
| `MicProblem` busy | phone | Listen | `en.errors.micBusy.*` | The microphone is in use / A call or another app has it right now. | REUSE |
| `MicProblem` full (under 50 MB) | phone | Listen | `en.errors.phoneFull.*` | This phone is full / Free some space to record, or type this one. | REUSE |
| save failed | phone | Review, Write | `en.errors.saveFailed.*` | Not saved to the book yet / Your words are safe on this phone. We will try again on our own. / Try again now | REUSE (the test requires "safe on this phone") |
| `JobFailure.file_missing` | phone | Review | `en.review.missingFile.title` | The recording did not save | REUSE |
| `JobFailure.decode_failed`, `model_load_failed`, `transcribe_failed` | phone | Review, Book | `en.errors.transcriptionFailed.*` | No words yet for this one / The recording is kept. / Try again | REUSE |
| `JobFailure.unsupported`, `UnavailableReason.model-missing` | phone | Review, Book | `languageCopy.waitingForLanguage` or the speech ask (`speechConsentCopy`) | (area A's words) | REUSE (area A) |
| `UnavailableReason.native-module-missing` | phone | Development builds only | none | n/a | n/a |
| stop reason `background` / `interruption` / `dismiss` (closed) | phone | Review | `wordsCopy.pack.stoppedInBackground` / `stoppedInterruption` / `stoppedClosed` | The recording stopped when you left the app. Everything before that is kept. / The recording stopped for a call or an alert. Everything before that is kept. / The recording stopped when the app closed. Everything before that is kept. | REUSE |
| stop because the phone filled mid-recording (06-nfr 11.3: under 20 MB) | phone | Review | `wordsCopy.pack.stoppedFull` | The recording stopped because this phone is full. Everything before that is kept. | PROPOSED (no stop reason for it today: engineering gap G5) |
| `PackFailure.*` (11 codes) | phone | Me, Storage; language row | `packsCopy.failures.*`, `speechSettingsCopy.downloadFailures.*` | (as built) | REUSE; `needs_app_update` routes to the E-ST18 wording family |

### 4.5 Phone codes: launch, faults and links

| Code | Source | Met where | Parent line key | Text | Flag |
|---|---|---|---|---|---|
| launch fault (database open or migration failed) | phone | E-S01 | `en.errors.launch.*` | The book could not open / Export saves a copy of the recordings and book files it can read, exactly as they are. / Try again, or restart the phone. / Try again / Trying again / It did not open this time either. / Export what's readable | REUSE (claims rows E1, E3, E4, E8) |
| recovery export outcome `nothing` / `failed` | phone | E-S01 | `en.errors.launch.exportNothing` / `.exportFailed` | Export has nothing to put in a file right now. / That export did not work. Your files are still on this phone. | REUSE |
| `GlobalErrorCode` (9 codes: `type_error`, `range_error`, `reference_error`, `syntax_error`, `eval_error`, `uri_error`, `aggregate_error`, `error`, `non_error`), fatal, production build | phone | E-S13 | `en.errors.crash.*` | This page did not open / Your letters and recordings are safe on this phone. / Try again / Go to Home | REUSE; see section 5.11 for a fresh install |
| `GlobalErrorCode`, rejection or non-fatal | phone | none | Not shown (recorded by class only) | n/a | n/a |
| route not found | phone | E-S20 | `en.errors.notFoundPage.*` | Nothing at this link / Your book is right where you left it. / Back to Home | REUSE |

### 4.6 Phone codes named in the locked cards (other areas own the screens; one shared line each)

| Code | Source | Card | Owner area | Parent line key | Text | Flag |
|---|---|---|---|---|---|---|
| `photo_pick_failed`, `photo_reencode_failed`, `photo_bake_timeout`, `photo_path_refused`, `photo_temp_name_refused`, `picked_file_outside_picker_folder`, `baked_file_outside_folder`, `photos_folder_unknown`; commit `unreadable` (`not_jpeg`, `corrupt`, `needs_rotation`), `failed` | phone | NS-01 | A | `photosCopy.couldNotOpen` | That photo could not be opened | PROPOSED here as the shared line (the stack's `photos.en.ts` has a line of this shape; area A confirms the key) |
| pick outcome `cancelled` | phone | NS-01 | A | none | n/a | n/a |
| commit `no_space` (and the stored copy did not fit, R45) | phone | NS-01-R58 | A | `photosCopy.didNotCome` | The photo did not come along this time. Your words are kept. | PROPOSED |
| iCloud-only picture offline (R46) | phone | NS-01 | A | `photosCopy.needsConnection` | This photo is in iCloud. It needs a connection to come to this phone. | PROPOSED |
| platform pass photo set (`pick_unsupported_type`, `space_low`, `decode_failed`, `strip_failed`, `write_failed`, `derivative_failed`, `orphan_swept`, `killed`) | phone | eng C 4.2 | A | Map to the three lines above: unsupported, decode, strip, write go to `couldNotOpen`; `space_low` to `didNotCome`; `derivative_failed` and `orphan_swept` are silent (NS-37-R3); `killed` is table 7 | as above | Card names stand over the pass's names (NS-01 section 10) |
| `fts_unavailable`, `index_corrupt`, `rebuild_batch_failed`, `find_index_rowid` | phone | NS-02 | B | none: the scan path or a rebuild, silent | n/a | n/a |
| Find view `failed` (the scan threw) | phone | NS-02 | B | `findCopy.failed` | Find did not work this time. Try again. | PROPOSED (area B may reword) |
| `share_temp_write_failed` | phone | NS-05 | D | `shareCopy.pictureNotAdded` | The picture could not be added this time. The words will go. | PROPOSED from the card intent |
| `share_cancelled` | phone | eng C 4.2 | D | none | n/a | n/a |
| `print_pdf_failed`, `pdf_render_failed`, `font_missing` | phone | NS-07 C28 | C | `exportCopy.printable.failed` | The book could not be made this time. | PROPOSED from the card intent |
| `print_pdf_disk_full` | phone | NS-07 C28 | C | `exportCopy.lowSpaceBody` | This phone needs more free space first. | REUSE |
| Export `tooBig`, `lowSpace` (`export_low_space`), `other` | phone | NS-11 | C | `exportCopy.*.tooBigTitle`, `.lowSpaceBody`, `.failedTitle` + `.failedBody` | This book is too big for one file / This phone needs more free space first. / The export did not finish / Your letters and recordings are all still here. Please try again. | REUSE |
| `sign_as_too_long` | phone | NS-16 | A | `en.childrenExtra.edit.signsAsTooLong` | Up to {n} characters. | REUSE |
| `seal_in_past`, `seal_after_limit` | phone | NS-06 B | B | (area B's words) | n/a here | n/a |
| `SCSEL` | envelope (proposed new SQLSTATE; not yet in `SQLSTATE_RULES`) | NS-06 B | B | Not shown: a rejected write; the phone keeps its own rule | n/a | Engineering gap G7: add to `envelope.ts` and chapter 02 in the same PR (API-R09) |
| reminders `permission_denied`, `schedule_failed`, `budget_full`, `clock_jump` | phone | NS-13, NS-32 | D | `reminderCopy.deniedTitle` / `.deniedBody`; `reminderCopy.scheduleFailed`; the last two silent | Notifications are off / Turn them on in Settings to get these reminders. / Could not set reminders just now. | REUSE (area D) |
| undo `expired`, `superseded`; length `too_long`, `segmenter_unavailable` | phone | eng C 4.2 | all | none: the Undo button leaves with its window (T4); the length line is the field's own | n/a | n/a |
| app lock `cancelled` | phone | E-S22 | E | none (a nag here reads as pressure) | n/a | n/a |
| app lock `noPasscode` | phone | E-S22 | E | `appLockCopy.noPasscode` | This iPhone has no passcode. Set one in iPhone Settings, then turn on the lock here. | REUSE |
| app lock `failed` | phone | E-S22 | E | none of ours: the system sheet says it. The cover stays with Unlock | n/a | n/a |
| Plus store sheet `offline` / `codeFailed` / `needs_ios_17` / `unsupported` | phone | E-S10, E-S11 | E | section 6 | section 6 | REUSE |
| restore purchases: nothing / failed | phone | E-S11 | E | `billingCopy.plan.restoreNothing` / `.restoreFailed` | No Plus was found for this Apple Account. / The App Store could not be reached. Please try again in a moment. | REUSE (registered) |

---

## 5. Strings by screen and state

Columns: Key | Text | Where (state id) | VoiceOver label / hint | Voice Control name | Card row | Flag. Where VoiceOver reads the visible text, the label column says "as shown". Voice Control names equal the visible button label in every row (NS-33-R9), so the column is written only where a control has no visible text.

### 5.1 E-S01 Launch and boot

| Key | Text | Where | VoiceOver | Voice Control | Card row | Flag |
|---|---|---|---|---|---|---|
| (none) | No words on the splash. The mark only, `accessibilityIgnoresInvertColors` | E-S01.default | Not focusable | n/a | NS-33-R11 | n/a |
| `en.errors.launch.title` | The book could not open | E-S01.error-launch | as shown, heading, focus lands here | n/a | NS-35 (recovery lands on Home) | REUSE |
| `en.errors.launch.body` | Export saves a copy of the recordings and book files it can read, exactly as they are. | E-S01.error-launch | as shown | n/a | claims E1 | REUSE |
| `en.errors.launch.hint` | Try again, or restart the phone. | E-S01.error-launch | as shown | n/a | | REUSE |
| `en.errors.launch.tryAgainButton` | Try again | E-S01.error-launch | as shown; hint `system.a11y.tryAgainLaunchHint` "Opens the book again." | Try again | | REUSE + PROPOSED hint |
| `en.errors.launch.tryingAgainButton` | Trying again | E-S01.loading | announced once | n/a | | REUSE |
| `en.errors.launch.stillClosed` | It did not open this time either. | E-S01.error-launch, after a retry | announced | n/a | | REUSE |
| `en.errors.launch.exportButton` | Export what's readable | E-S01.error-launch | as shown; hint "Saves a copy of the files it can read." (`system.a11y.recoveryExportHint`) | Export what's readable | LEGAL-REQ-040 | REUSE + PROPOSED hint |
| `en.errors.launch.exportingTitle` | Gathering your files | E-S01.loading-export | announced | n/a | | REUSE |

Dark: same words. AX5: no change in words; buttons stack.

### 5.2 E-S02 Welcome and E-S03 Age gate (first run, as built, servers on)

| Key | Text | Where | VoiceOver | Card row | Flag |
|---|---|---|---|---|---|
| `en.onboarding.welcome.title` | {app} | E-S02.default | heading | | REUSE |
| `en.onboarding.welcome.subtitle` | Letters to your child, in your own words and voice. | E-S02.default | as shown | BRAND descriptor | REUSE |
| `en.onboarding.welcome.body` | Talk for a minute, or type a few lines. Kept for {child} to read and hear for years. | E-S02.default ({child} filled with `onboarding.childFallback` "your child") | as shown | | REUSE |
| `authCopy.sheet.bodies.sign_in_first` | Sign in to begin your book. | E-S02.default | as shown | NX-36 S2 | REUSE, needs founder approval (marked TODO in code) |
| `authCopy.sheet.agreeLine` | By continuing, you confirm you are 18 or older and agree to the Terms of Service and Privacy Policy. | E-S02.default | as shown; links follow as their own elements | PRIV-R21 | REUSE, registered, COUNSEL |
| (system) | Sign in with Apple | E-S02.default | Apple's button; label is Apple's | | REUSE (system) |
| `authCopy.sheet.email` | Sign in with email | E-S02.default | as shown | glossary | REUSE |
| `en.beforeBegin.termsLink` / `.privacyLink` | Terms of Service / Privacy Policy | E-S02.default | as shown; hint `en.beforeBegin.linkA11yHint` "Opens in a browser inside the app." | | REUSE |
| `billingCopy.membership.line` (= `en.onboarding.welcome.freeLine`) | Your first two letters are free. After that, Plus keeps the book growing. Reading, listening and your copy stay free. | E-S02.default, store build only | as shown | F5, principle 6 | REUSE (pinned by the test) |
| `billingCopy.alpha.note` | Plus is not part of this test. Every letter is free while you test. | E-S02.default, TestFlight only | as shown | | REUSE |
| `authCopy.sheet.busy` | Signing you in | E-S02.loading | announced | | REUSE |
| `en.ageGate.title` | Are you 18 or older? | E-S03.default | heading | LEGAL-REQ-002 | REUSE, COUNSEL |
| `en.ageGate.yesButton` / `noButton` | Yes / No | E-S03.default | as shown, a choice of two, neither selected | | REUSE |
| `en.beforeBegin.agree` | I agree to the Terms of Service and Privacy Policy. | E-S03.default | a checkbox, unchecked | PRIV-R21 | REUSE, registered |
| `en.beforeBegin.chooseAnswer` / `.tickBox` | Choose Yes or No. / Check the box to continue. | E-S03.reason-noAnswer and E-S03.reason-noTick | announced | | REUSE |
| `en.ageGate.stopTitle` | {app} is currently for adults 18 and over | E-S03.stop | heading | LEGAL-REQ-002 | REUSE, COUNSEL |
| `en.ageGate.mistakeButton` | I answered by mistake | E-S03.stop | as shown | | REUSE |
| `en.beforeBegin.returningTitle` | Before you continue | E-S03.agreeOnly | heading | | REUSE |

Servers-off build (E-ST04, E-S02.serversOff): `en.onboarding.welcome.startButton` "Begin the book" and `signInButton` "I already have a book" (REUSE). `joinButton` "I was invited" is never shown in a store build (frame section 4: nothing says "coming soon" and the other parent is NS-25, gated).

### 5.3 E-S04 to E-S07 Sign in, code, consent

All REUSE from `authCopy` (`email.*`, `code.*`, `verify.*`, `claim.*`, `consent.terms.*`) and `en.sensitiveConsent.*`, with the error lines in table 4.2. Additions and changes:

| Key | Text | Where | VoiceOver | Card row | Flag |
|---|---|---|---|---|---|
| `authCopy.code.lettersSafe` | Your letters are still on this phone. | E-S06.default, only where a book is on the phone | as shown | VOICE "safe" rule | REUSE |
| `authCopy.code.noMailHelp` | Nothing yet? Look in spam, or send a new email. | E-S06.default after a minute | announced once (`authCopy.code.announceResend` when the button returns) | NX-31-R11 | REUSE, needs founder approval |
| `authCopy.consent.terms.body` | Your letters stay private to you and the family you invite. We never sell them, use them for ads or use them to train machine learning models. | E-S07.default | as shown | registered | REUSE, COUNSEL. Flag: "the family you invite" describes an invite the store build does not offer (NS-25 gated). Counsel's replacement is needed (card gap CG3) |
| `en.trust.signIn.why` | An account keeps your book safe when you change phones. | Wherever the sign-in sheet shows it | as shown | registered | Flag: with backup off, recordings do not move (NS-10 Claims forbid "everything moves"). Proposed replacement for counsel: "Your letters' words come with you to a new phone." (CG4) |
| `en.trust.signIn.privacy` | Only you and the people you invite can read your letters. We never sell them or use them for ads. | Sign-in sheet | as shown | registered | Same invite flag (CG3) |

### 5.4 E-S08 First book (child step)

All REUSE: `en.onboarding.child.*` (including `nameOptionalLabel`, `nameOptionalHelp`, `signedInAs`, `signedInAsLabel`, `spokenAddress`, `useAnother`, `useAnotherHint`), `en.onboarding.signsAs.*`, the language row (`languageCopy`). VoiceOver says the masked address with `spokenAddress` ("a, hidden, at example.com"). No new strings. The NS-10-R0 rule (a returning account never meets this step) is a route rule, not words.

### 5.5 E-S09 Opening your book (new phone; shared with area C, C-S10)

| Key | Text | Where | VoiceOver | Card row | Flag |
|---|---|---|---|---|---|
| `authCopy.newPhone.loading` | Opening your book. | C-S10.loading (E-S09 route) | heading, announced | NS-10 happy path 3 | REUSE; CHANGE proposed: "Opening your book" (a title, no full stop) |
| `authCopy.newPhone.loadingBody` | Your letters are coming across. | C-S10.loading (E-S09 route) | as shown | | REUSE |
| `authCopy.newPhone.slowTitle` / `.slowBody` | Your book is taking a while. / Check your connection, then try again. | C-S10.slow | heading then body | NS-10-R2 (before 10 s) | REUSE; title full stop as above |
| `authCopy.newPhone.offlineTitle` | Opening your book needs a connection. | C-S10.offline | heading | NS-10 "No network" | REUSE |
| `authCopy.outage.retry` | Try again | C-S10.offline, .slow | as shown | | REUSE |
| `authCopy.consent.noBook.tryAnother` | Try another way | C-S10.slow, .needsConsent | as shown; hint `system.a11y.tryAnotherHint` "Signs out, so you can sign in a different way." | NS-10 wrong account | REUSE + PROPOSED hint |
| `authCopy.account.finishSetup` | Finish setting up | C-S11.held (E-S09 route) | as shown | NS-10-R0, BL-922 | REUSE |
| `authCopy.newPhone.consentBody` | Your book is ready to open once you finish setting up. | C-S11.held (E-S09 route) | as shown | NS-10-R0 | PROPOSED, COUNSEL |
| `authCopy.newPhone.signedInWithLine` | uses `authCopy.account.signedInWith.apple` / `.google` / `.email` | C-S11.held (E-S09 route) and .noBook (wrong account row) | as shown | NS-10-R12 (names the method, never the full email) | REUSE |
| `authCopy.newPhone.accountDeleted` | This account was deleted on another phone. You can start a new book here. | C-S10.deletedElsewhere | heading-less line, announced | NS-10-R9 | PROPOSED, COUNSEL |
| `authCopy.newPhone.declinedTitle` | Your book is waiting in your account | C-S11.declined | heading | NS-10 decline row, R4b | PROPOSED, COUNSEL (hands to area C, C-S11, which may own the final words) |
| `authCopy.newPhone.declinedBody` | Nothing comes to this phone until you agree. You can still delete your account from here. | C-S11.declined | as shown | NS-10-R4a | PROPOSED, COUNSEL |
| `authCopy.newPhone.arrivedPlain` | Your book is here. | Book, once after arrival | read once | NS-10 | REUSE |

The Book-level line for absent recordings (NS-10-R13, intent "Your words are here. Recordings stay on the phone that made them.") is area C's (C-S12); its words are not repeated here.

### 5.6 E-S18 Second account on one phone (a rule, no screen)

Re-keyed to `DESIGN.md` E-S18: there is no screen and no line. While account B is signed in on a phone holding account A's rows, every list filters to B's rows; nothing mentions another book (NS-10-R3, R5, `[X4-R1]`). B meets the ordinary new-phone states (C-S10) or the first book (E-S08), so the words are the ones already keyed in sections 5.4 and 5.5. The claim screen (E-S24) never lists A's letters: its words are `authCopy.claim.*` (REUSE).

The first draft of this file proposed a full screen (`system.otherAccount.*`). It is withdrawn: a screen that says "this phone already has a book" tells B that A's book exists, which the filter rule avoids. No string here names A, A's child or A's email. Until BL-961 lands, the built gate opens Home for any session (design gap G-E05, this file's G2), and no words can make that true.

### 5.7 E-S19 Interruption and recovery

All REUSE: `wordsCopy.pack.stopped*` (table 4.4), `en.tonight.draft.swept` "Recorded before the app closed.", `en.tonight.draft.held` "Waiting to be kept.", `en.tonight.draftWaiting.title` "A recording is ready to read back.", `en.listen.ready.hint` "Tap the red circle and talk." (Listen opened without a tap: nothing records, NS-35-R7). Relaunch after a kill lands on Home's heading (NS-33 scenario "App killed"). No line says how long the parent was away.

### 5.8 E-S10 to E-S12 Plus: the one gate, and Plus in Me

One gate, at Keep, for the third and later letters (D-082, principle 6). Recording, typing, reading, Read together, Find, export and Save a copy are never gated. No line here names Read together, a price, a trial length or a future.

| Key | Text | Where | VoiceOver | Card row | Flag |
|---|---|---|---|---|---|
| `billingCopy.keepGate.title` | Keep adding to {child}'s book | E-S10.default | heading | D-082 | REUSE |
| `billingCopy.keepGate.body` | Your first two letters are kept for good. Plus lets you keep adding letters. | E-S10.default | as shown | | REUSE, registered |
| `billingCopy.keepGate.heldNote` | This letter waits on Home, on this phone, exactly as it is. Keep it whenever you like. | E-S10.default, said before any button | as shown | F14-REQ-028 | REUSE, COUNSEL (C10) |
| `billingCopy.keepGate.heldNoteLetter` | Your words stay with this letter, exactly as they are. Keep them whenever you like. | E-S10.fromLetter | as shown | | REUSE, COUNSEL |
| `billingCopy.keepGate.heldChip` | Waiting | E-S10.default, on the letter card | part of the card label: "Waiting. {first words}" | | REUSE |
| `billingCopy.keepGate.seePlus` | See Plus | E-S10.default | as shown; hint `billingCopy.gate.opening` while opening | | REUSE |
| `billingCopy.keepGate.holdButton` | Keep it here for now | E-S10.default | as shown; equal weight to See Plus | frame guardrail "zero paywalls before a parent has seen their words" | REUSE |
| `billingCopy.keepGate.redeemLink` | Redeem a code | E-S10.default | as shown | | REUSE |
| `billingCopy.keepGate.lapsedBody` | Plus has ended. Every letter you kept is still yours to read, play and export. | E-S10.lapsed | as shown | NS-10-R10, J-N25 | REUSE |
| `billingCopy.keepGate.offline` | Plus needs a connection to start. This letter waits on Home, on this phone, exactly as it is. | E-S10.offline | announced under See Plus | | REUSE |
| `billingCopy.gate.needsNewerIos` / `.unavailable` | Plus can be added on iOS 17 or later. / Plus is not available on this device yet. | E-S10.needsNewerIos and E-S10.unavailable | as shown | | REUSE |
| `en.errors.generic.body` | Please try again. Nothing you saved has changed. | E-S10.error-codeFailed | announced | | REUSE |
| `billingCopy.keepGate.secondFreeNote` | That was your second free letter. Whenever you are ready, Plus keeps the book growing. | Book toast, once, store build | announced politely | F5, PL-5 | REUSE (pinned) |
| `billingCopy.tonight.plusLine` | Adding new letters to the book needs Plus. Recording, reading and export are always free. | Home, above Speak, once the free letters are used | as shown | F14-REQ-040 | CHANGE proposed: "Adding new letters to the book needs Plus. Recording, reading and export stay free." ("always free" is an open-ended promise; principle 6 says public and app copy say nothing about the future, and "stay free" matches the pinned membership line) |
| `billingCopy.membership.status.free` / `.plus` / `.shared` | Free / Plus / Plus, shared | Me, Plan row value | as shown | F5 | REUSE (pinned) |
| `en.settingsHome.planHelp` | Your first two letters are free. Plus lets you keep adding letters. | Me, under Plan, while Plus is off | as shown | | REUSE (pinned) |
| `billingCopy.plan.*` | (registered: on, trial, renews, ends, grace, retry, shared, manage, restore, refund, payment, saveCopy, notificationsOff) | E-S11 states .default, .trial, .renewing, .ending, .grace, .retry, .shared | as shown | Terms 14.6 | REUSE, registered. Flag: `plan.retry` says "Every letter you have kept is safe." The "safe" word is outside its two allowed places; counsel's replacement: "Every letter you have kept is still yours." (CG5) |
| `billingCopy.membership.ended` | Plus ended on {date}. Every letter you kept is still yours. | E-S11.lapsed | as shown | J-N25 | REUSE |
| `billingCopy.confirmation.*` | (registered; title "Thank you. Plus is on") | E-S12 | title is the heading | California 17602 | REUSE, registered |
| `en.plus.legal.*` | (registered store disclosure) | E-S10 and E-S11, above Apple's sheet | as shown | in-app-disclosures section 3 | REUSE, registered (two lines still name a trial length until counsel retires them) |

Plan notifications (the `plan` class, outside the budget, NS-32): bodies are `billingCopy.reminders.*` (REUSE). The category placeholder when previews are hidden (NS-32-R13):

| Key | Text | Where | Card row | Flag |
|---|---|---|---|---|
| `billingCopy.reminders.hiddenPlaceholder` | A reminder about your plan | Lock screen, previews hidden | NS-32-R12, R13 | PROPOSED (no child name, count or price; "note" is not used for what the app sends, glossary) |

### 5.9 E-S14 and E-S15 Outage, remote pause and the system line

E-S14 on first run is the built outage screen (table 4.2). After first run there is no outage screen: E-S15 `SystemLine` shows in place.

| Key | Text | Where | VoiceOver | Card row | Flag |
|---|---|---|---|---|---|
| `system.offline.line` | You're offline. Recording, reading and saving still work. | E-S15.offline, under a network act | announced once, politely; not repeated more than once a minute (NS-33 "Slow") | E-ST01 | PROPOSED |
| `system.unreachable.line` | Your account can't be reached right now. Recording, reading and saving still work. | E-S15.outage | same | E-ST02 | PROPOSED |
| `system.notThrough.line` | That did not go through. Nothing you saved has changed. | E-S15.error-request | announced | VOICE "name what did not finish" | PROPOSED |
| `system.waitAMoment.line` | Too many tries for now. Wait a few minutes, then try again. | E-S15.error-rate_limited | announced | | PROPOSED |
| `system.consentNeeded.line` | Your letters are kept on this phone until you finish setting up. | Me, Account; E-S15 under a paused queue | as shown | SCCON, NS-10-R0 | PROPOSED, COUNSEL |
| `system.paused.line` | Paused for now. Nothing you made has changed. | E-S15.paused, only when a parent was mid-act and the surface has no line of its own (table 7) | announced | ADR 0029 rule 4 (kill hides, never deletes) | PROPOSED |
| `common.tryAgainButton` | Try again | E-S15 action | as shown | | REUSE |

### 5.10 E-S16 App update and E-S17 Low storage

| Key | Text | Where | VoiceOver | Card row | Flag |
|---|---|---|---|---|---|
| `system.update.line` | This version of {app} can no longer reach your account. Recording, reading and saving still work on this phone. | E-S16.line (Me, top of the list, a SystemLine with one action; absent when the build is at or above `minSupportedVersion`); also under any server act that answers `upgrade_required` or SCVER | as shown | E-ST18; LEGAL-REQ-040 (never blocks recording or reading) | PROPOSED (supersedes the design file's placeholder "A newer version is ready in the App Store.", which does not say why it matters) |
| `system.update.storeButton` | Open the App Store | E-S16.line action | as shown; hint "Opens the App Store page for {app}." (`system.update.storeHint`) | | PROPOSED (18 characters; the design's "Update" does not say where it goes) |
| (none) | After an update, nothing is said: no "what's new" sheet, no ceremony | E-ST37 | n/a | NS-32-R16 | n/a |
| `system.storage.lowLine` | Space on this phone is getting low. You can still record. | E-S17.under1gb (under 1 GB), on Listen at start | announced once | 06-nfr 11.3, NS-33 "Low storage" | PROPOSED, HOLD (no 1 GB check on Listen: G4) |
| `en.errors.phoneFull.title` / `.body` | This phone is full / Free some space to record, or type this one. | E-S17.under50mb (under 50 MB), Listen | heading then body | 06-nfr 11.3 | REUSE |
| `system.storage.cardTitle` | Recording needs more space | E-S17.under50mb, Me, Storage card | heading | 06-nfr "the storage card shows" | PROPOSED |
| `system.storage.cardBody` | Free some space on this phone to record again. iPhone Settings, General, iPhone Storage shows what uses it. Typing still works. | E-S17.under50mb, Me, Storage card | as shown | | PROPOSED |
| `system.storage.openSettingsButton` | Open Settings | E-S17.under50mb | as shown; hint "Opens iPhone Settings." | | PROPOSED (same words as `en.errors.micDenied.settingsButton`) |
| `wordsCopy.pack.stoppedFull` | The recording stopped because this phone is full. Everything before that is kept. | E-S17.under20mbMidTake (under 20 MB mid-recording), Review | as shown | 06-nfr 11.3 | PROPOSED, HOLD (G5) |
| `en.settings.storage.storageUsed` (existing line) | {count} MB used on this phone | Me, Storage | as shown | NS-37 "Pictures on this phone" (area B and A own the pictures row) | REUSE |

### 5.11 E-S13 Global fault screen, E-S20 Not found

| Key | Text | Where | VoiceOver | Card row | Flag |
|---|---|---|---|---|---|
| `en.errors.crash.title` | This page did not open | E-S13.boundary and E-S13.global | heading, focus here | BL-568 | REUSE |
| `en.errors.crash.body` | Your letters and recordings are safe on this phone. | E-S13.boundary and E-S13.global, a book is on the phone | as shown | VOICE (crash is one of the two "safe" places) | REUSE |
| `en.errors.crash.bodyNoBook` | Try again, or go back to Home. | E-S13.noBook (new state, design to add): a fresh install with no book (no letters to be safe) | as shown | VOICE "safe" rule, `build12-untrue-copy.test.ts` reasoning | PROPOSED |
| `en.errors.crash.tryAgainButton` / `.tonightButton` | Try again / Go to Home | E-S13 | as shown | | REUSE |
| `en.errors.notFoundPage.*` | Nothing at this link / Your book is right where you left it. / Back to Home | E-S20.default | heading then body | | REUSE. On a fresh install with no book, use `bodyNoBook` (PROPOSED): "This link does not open anything here." |

### 5.12 E-S21 Appearance, E-S22 App lock

All REUSE: `en.settingsHome.appearanceLabel` "Appearance", `en.settingsMore.themeLabel` "Theme", `en.settingsMore.themes.*` "Match this phone" / "Light" / "Dark" (a single choice; VoiceOver states the selected one, NS-33-R3 pattern). App lock: `appLockCopy.*` as built (cover label `{app}`, Unlock, unlock hints, offer, toggles, `recordingLine` "The lock waits until a recording ends.", `footer` "When the lock is on, reminders never show a name."). The 10 Nov drafts `firstRun.lock.tryAgain` and `lockedOut` stay HOLD: the system sheet already says both, and the code cannot tell them apart (`user_fallback` maps to cancelled).

### 5.13 E-S23 Accessibility walk and speed run sheet

Not parent-facing. Two content rows for the walk sheet (NS-33):
- Every accessibility label lives in `packages/content`, never contains the word "button", and carries no child name beyond what the screen already shows (NS-33 sections 8 and 16).
- The recording state has a word, not only a colour: REUSE `en.tonight.states.listening` "Listening." and `en.tonight.states.paused` "Paused." (NS-33-R12).
No claim line: "accessible to everyone", "fully accessible", "works with VoiceOver", "fast" and "instant" are forbidden in public until the walk and the run sheet pass (NS-33 and NS-34 Claims).

### 5.14 From App Store download to the first kept letter (the founder's path, 20 Nov)

Karma relayed on 20 Nov that product is writing NS-38 to NS-45 (`docs/product/prd/19-from-download-to-first-letter.md`, inputs in `docs/product/prd/inputs/`). Neither existed on disk when this file was written (checked in both the worktree and the main checkout), so this section is keyed to the built path on `develop` and to E's screen ids; it is re-keyed to NS-38 to NS-45 when they land. Anything the cards will need to answer is in section 10 (CG9 to CG14).

Every step, in order, with every string a parent can read on it. Capture screens (steps 11 to 15) are area A's; they are listed so the path is whole, and area A's WORDS.md owns any change.

| Step | Screen (state) | Strings, in reading order | Flag |
|---|---|---|---|
| 1 | App Store page (not ours to draw) | `storeListing.*` (name, subtitle, description, captions). No in-app copy. The listing names no sign-in, co-parent or language other than English (rules test) | REUSE |
| 2 | First launch, E-S01.default | No words | n/a |
| 3 | Welcome, E-S02.default | `welcome.title`, `welcome.subtitle`, `welcome.body`, `sheet.bodies.sign_in_first`, `sheet.agreeLine` + links, Sign in with Apple, `sheet.email`, `membership.line` (store) or `alpha.note` (TestFlight) | REUSE |
| 4 | Age and agreement, E-S03.default | `ageGate.title`, Yes / No, `beforeBegin.agree`, links, `common.continueButton` | REUSE, registered |
| 4a | Validation, E-S03.reason-noAnswer and E-S03.reason-noTick | `beforeBegin.chooseAnswer` "Choose Yes or No."; `beforeBegin.tickBox` "Check the box to continue." Said in words under Continue and announced, never only a greyed button | REUSE |
| 4b | Age fail, E-S03.stop | `ageGate.stopTitle` "{app} is currently for adults 18 and over"; `ageGate.mistakeButton` "I answered by mistake". No reason asked, no blame, nothing stored but the answer | REUSE, COUNSEL |
| 4c | Region fail, E-S03.region | No region check exists in the app (searched `lib/auth`, `lib/first-run`, `app`). Store availability is set in App Store Connect, so a person outside the storefronts cannot download. Draft only: `system.region.title` "{app} is not offered where you are"; `system.region.body` "Nothing was set up on this phone." | PROPOSED, HOLD (CG10) |
| 5 | Sign in: choose, E-S04.default | Sign in with Apple; `sheet.email`; `sheet.lastMethod.*` under the matching button for a returning phone | REUSE |
| 5a | Apple sheet closed, E-S04 | nothing (`cancelled` is silent) | n/a |
| 5b | Apple or provider failed, E-S04.error-provider | `firstRun.errors.provider` "That sign-in did not finish. Try again, or try another way." | REUSE |
| 5c | Offline or sign-in unreachable, E-S14 | `offline.title` / `.body`, or `outage.title` / `.body` / `.retry` / `.startLocal` / `.startLocalNote` | REUSE (title full stops: CHANGE, section 9) |
| 6 | Email, E-S05.default | `email.title` "Sign in with email", `email.label` "Email", `email.placeholder` "you@example.com", `email.help` "A link and a code arrive by email. No password to remember.", `email.send` "Send link" | REUSE |
| 6a | Email empty, Send disabled, E-S05.reason-empty (new state, design to add) | `authCopy.email.needEmail` "Type your email to continue." (today the button is disabled with no reason in words) | PROPOSED |
| 6b | Email malformed, E-S05.error-invalid_email | `errors.invalid_email` "That email doesn't look quite right." | REUSE |
| 6c | Too many emails, E-S05.error-email_wait | `errors.email_wait` | REUSE |
| 6d | Email provider off, E-S05.error-not_available | `errors.not_available` | REUSE |
| 6e | Offline, E-S05.error-network | `errors.network` "Nothing has changed. Sign in once you are back online." | REUSE |
| 7 | Code, E-S06.default | `code.title` "Check your email", `code.sentToEmail` "A link and a code are on their way to {email}.", `code.body` "Tap the link on this phone, or type the code here.", `code.label` "Code", `code.verify` "Continue", `code.openMail` "Open Mail", `code.resend`, `code.differentEmail`; `code.lettersSafe` only with a book on the phone | REUSE |
| 7a | Code too short, Continue disabled, E-S06.reason-short (new state, design to add) | `authCopy.code.sixDigits` "The code has 6 digits." (today disabled with no reason in words; the field submits at full length) | PROPOSED |
| 7b | Wrong code, E-S06.error-wrong_code | `errors.wrong_code` "That code didn't match. Check the newest email, or send a new one." | REUSE |
| 7c | Expired link, E-S06.error-expired | `errors.expired` "That link has expired. Send a new email for a fresh one." An expired code reads as `wrong_code` (Supabase answers "expired or invalid" for both) | REUSE |
| 7d | Five wrong codes, E-S06.paused | `errors.code_paused` + `code.pausedOtherWays`. No minutes counted down | REUSE |
| 7e | 429 on verify, E-S06.error-rate_limited | `errors.rate_limited` | REUSE |
| 7f | No email after a minute, E-S06.help | `code.noMailHelp` "Nothing yet? Look in spam, or send a new email."; `auth.troubleButton` "Trouble signing in?"; `auth.noEmailHelp` | REUSE; `noEmailHelp` names Google, which Build 12 does not offer: CHANGE proposed to drop "Use Sign in with Apple or Google" for "Use Sign in with Apple" while Google is off |
| 7g | Resend, E-S06 | `code.resent` "A new email is on its way."; `code.resendWait` "You can send another in a minute."; `code.announceResend` | REUSE |
| 7h | Link opened on another phone, or already signed in, E-S06.refused-other_phone, refused-other_phone_spent, refused-already_signed_in | `verify.refusedTitle` + `errors.other_phone` / `other_phone_spent` / `already_signed_in`; buttons `verify.typeCode`, `verify.newEmail`, `verify.close` | REUSE |
| 7i | Restarted between send and code, E-S06.noAddress | `code.emailLabel` "Your email address" | REUSE |
| 8 | Setting up, E-S07.loading | `consent.settingUp` "Setting up your account" | REUSE |
| 8a | Agreements, E-S07.default | `consent.terms.title` "Before your book syncs", `.body` (CG3), `.agreeLine`, links, `.agree` "Agree and continue", `.notNow` "Not now"; then `en.sensitiveConsent.*` with `agreeButton` "Agree and sync" and `declineHelp` | REUSE, registered, COUNSEL |
| 8b | Setup did not finish, E-S07.error-consent_unavailable | `errors.consent_unavailable` "Setting up your account did not finish. Try again." | REUSE |
| 8c | Declined, E-S07.declined | `en.sensitiveConsent.declineHelp` "If you keep it on this phone, syncing and sharing stay off." | REUSE |
| 8d | Letters already on this phone, E-S07.claim | `claim.title`, `claim.body` / `bodyHasBook`, `claim.help`, `claim.keep`, `claim.notMine`, `claim.recordingsNote` | REUSE, COUNSEL |
| 9 | Returning account, E-S09 | section 5.5 | REUSE + PROPOSED |
| 10 | First book, E-S08.default | `child.title` "Who is this book for?", `nameOptionalLabel`, `namePlaceholder`, `nameOptionalHelp`, `bornQuestion`, `bornLabel` / `expectingLabel`, `birthdayLabel` / `dueDateLabel`, `chooseDate`, `bornToday`, `addAnotherButton`, `addAnotherHelp`, `signedInAs` and `useAnother`; then `signsAs.title`, `placeholder`, `examplesLabel`, `examples`, `notYetHelp`, `preview`, `cta` "Sign my letters" | REUSE |
| 10a | Validation, E-S08.error-* | `needBirthday` "Choose {child}'s birthday to continue."; `needDueDate` "Choose the due date to continue."; `needNameMany` "Fill in or remove this name to continue."; `nameLimit` "A name can have up to {n} characters."; `childrenExtra.edit.birthdayFuture` "Choose today or an earlier day."; `childrenExtra.edit.dueDateRange` "Choose a due date from today up to ten months ahead."; `childrenExtra.edit.dateInvalid` "That date does not look right. Try again."; `signsAs.needSignsAs` / `needSignsAsMany`; `childrenExtra.edit.signsAsLimit` "Up to {n} characters." Each shown in words under Continue and announced | REUSE |
| 11 | Home, first time, A-S01 | `tabs.*`, greeting, prompt, Speak, Type, Not much today | REUSE (area A) |
| 12 | Microphone, A-S04.primer | `listen.primer.title` "Your phone will ask about the microphone", `.body`, `.continueButton`; then iOS's prompt with `permissions.microphone` | REUSE, registered |
| 12a | Microphone refused, A-S04.blocked | `errors.micDenied.*` | REUSE |
| 13 | Recording, A-S05 | `tonight.states.*`, `listen.toChild`, `listen.audience`, `trust.firstRecording.*` once | REUSE (area A) |
| 14 | Review, A-S07 | `review.*`, `review.firstNote.*` | REUSE (area A) |
| 15 | First kept letter | `review.destination.addButton` "Add to {child}'s book" or `privateButton` "Keep private"; `addedToast` / `privateToast`; `filedChip*`; `tonight.afterSave.*` "Kept." / "One more page for {child}." The first two letters never meet the gate; the third meets E-S10 | REUSE (area A) |

### 5.15 E-S24 Claim screen, E-S25 Plan reminder note, E-S26 Home Plus line

All REUSE. E-S24: `authCopy.claim.title`, `.body` (masked `{email}`, read with `spokenAddress`) or `.noEmail`, `.help`, `.keep` "Keep in this account", `.notMine` "Not my account", and in E-S24.hasBook `.bodyHasBook`, `.recordingsNote`, `.keepHint`; E-S24.waiting `.waiting` (COUNSEL, each says where letters go). E-S25: `billingCopy.note.*` (title "A reminder about Plus", the date line, the cancel-by line, `dismiss` "Got it"), never a name, count or price. E-S26: `billingCopy.tonight.plusLine`, with the CHANGE in section 9.

---

## 6. Plan lapse, in one place (E-ST24)

What a parent sees when Plus has ended, and nothing else: Plan says `membership.ended` with the date; Me's Plan row value reads "Free"; the Keep gate body becomes `keepGate.lapsedBody`; Home's Plus line shows once the free letters are used. Every past letter opens, plays, is found, is in Save a copy and in Read the year back (J-N25). Reminders never name Plus, a price or the Keep step (J-N22). No line counts letters, days or what is "left". The plan notices stop (NS-32 state space).

## 7. Remote pauses (`killSwitches.*`) and the servers-off build

Rule (eng C 2.2 rule 4, ADR 0029 as proposed): a pause hides the surface and stops new writes; files, rows and export stay. No switch exists for recording, typing, saving, reading, playback or export (LEGAL-REQ-040).

| Switch key | Status | Parent sees | Line if met mid-act | Flag |
|---|---|---|---|---|
| `sync` | exists | Nothing on Home or the Book. Where your letters live shows `account.sync.unknown` "Waiting for a connection" | `system.paused.sync`: "Sending letters to your account is paused for now. Everything you make is kept on this phone." | PROPOSED; CHANGE proposed for the status: a paused value `account.sync.paused` "Paused for now" instead of a connection line that is not true (online but paused) |
| `invites` | exists | Invite and join hidden | `familyCopy.errors.paused` "Invites are paused for now. Please try again a little later." | REUSE (area D) |
| `photos` | exists; meaning changes to "hides photo surfaces" (NS-01) | Photo start and Change hidden; pictures already kept still show | `system.paused.line` | PROPOSED (area A may give its own) |
| `packDownloads` | exists | Download buttons wait | `packsCopy.failures.downloads_paused` "Downloads are paused for now. Please try again later." | REUSE |
| `serverContent` | exists | Nothing: the packaged words are used | none | n/a |
| `backupUploads`, `escrow` | exist; backup off | Nothing | `backupCopy.paused` "Backup will carry on later." when backup ships | REUSE, HOLD |
| `statusReport` | exists | Nothing | none | n/a |
| `bookSearch` | proposed (#798) | Find hidden; the index keeps following letters | `system.paused.line` | PROPOSED (area B) |
| `reminders`, `shareLetter`, `firsts`, `seals`, `printBook`, `quickCapture`, `earlierVersions`, `signAsOther` | proposed (eng C 2.2 rule 3) | The surface hidden | `system.paused.line` only if a sheet was open | PROPOSED |
| `serverFeaturesEnabled()` false (build) | exists | No sign-in anywhere; Me's header card `settingsHome.cardOnPhone` "On this phone"; Where your letters live `whereLive.onPhone` "Your letters and recordings are kept on this iPhone." A signed-in session meets the local book only (NS-10-R8) | none | REUSE |

---

## 8. Strings that exist today and are reused (index)

Every key below is used as is by an E screen: `en.errors.{saveFailed, micDenied, micBusy, phoneFull, transcriptionFailed, offline, generic, crash, notFoundPage, launch}`; `en.onboarding.welcome.*`, `en.onboarding.child.*`, `en.onboarding.signsAs.*`; `en.ageGate.*`; `en.beforeBegin.*`; `en.trust.*` (registered); `en.settingsHome.{cardOnPhone, planLabel, planHelp, appearanceLabel, storageLabel, storageHelp}`; `en.settingsMore.{themeLabel, themes}`; `en.whereLive.onPhone`; `en.tonight.draft.*`, `en.tonight.states.*`; `en.listen.ready.*`; `en.plus.legal.*`; `features.auth` (`authCopy`) whole file; `features.billing` (`billingCopy`) whole file; `features.words.pack.stopped*`; `features.packs.failures.*`; `features.speech.downloadFailures.*`; `features.export` failure keys; `features.family.errors.*` (area D owns the screens); `appLockCopy` (app copy file, moves to `packages/content` per the standing duty); `common.*` buttons.

## 9. New keys, collected (all PROPOSED)

Proposed home: a new `packages/content/src/features/system.en.ts` (`systemCopy`), joined to `features` with one `copy-surfaces.ts` row (placeholders `{app}`, `{email}`; no "we"; buttons listed), except where a key extends an existing file.

| Key | Text | Characters |
|---|---|---|
| `system.offline.line` | You're offline. Recording, reading and saving still work. | 57 |
| `system.unreachable.line` | Your account can't be reached right now. Recording, reading and saving still work. | 82 |
| `system.notThrough.line` | That did not go through. Nothing you saved has changed. | 55 |
| `system.waitAMoment.line` | Too many tries for now. Wait a few minutes, then try again. | 59 |
| `system.consentNeeded.line` | Your letters are kept on this phone until you finish setting up. | 64 |
| `system.paused.line` | Paused for now. Nothing you made has changed. | 45 |
| `system.paused.sync` | Sending letters to your account is paused for now. Everything you make is kept on this phone. | 93 |
| `system.signInFresh.line` (HOLD) | This step needs a fresh sign-in. Sign in again, then try once more. | 67 |
| `system.update.storeButton` | Open the App Store | 18 |
| `system.update.storeHint` | Opens the App Store page for {app}. | 35 |
| `system.update.line` | This version of {app} can no longer reach your account. Recording, reading and saving still work on this phone. | 111 |
| `appLockCopy.failedLine` (HOLD) | Face ID did not open the book. Try again, or use your passcode. | 63 |
| `system.storage.lowLine` (HOLD) | Space on this phone is getting low. You can still record. | 57 |
| `system.storage.cardTitle` | Recording needs more space | 26 |
| `system.storage.cardBody` | Free some space on this phone to record again. iPhone Settings, General, iPhone Storage shows what uses it. Typing still works. | 127 |
| `system.storage.openSettingsButton` | Open Settings | 13 |
| `system.a11y.tryAgainLaunchHint` | Opens the book again. | 21 |
| `system.a11y.recoveryExportHint` | Saves a copy of the files it can read. | 38 |
| `system.a11y.tryAnotherHint` | Signs out, so you can sign in a different way. | 46 |
| `authCopy.newPhone.consentBody` | Your book is ready to open once you finish setting up. | 54 |
| `authCopy.newPhone.accountDeleted` | This account was deleted on another phone. You can start a new book here. | 73 |
| `authCopy.newPhone.declinedTitle` | Your book is waiting in your account | 36 |
| `authCopy.newPhone.declinedBody` | Nothing comes to this phone until you agree. You can still delete your account from here. | 89 |
| `en.errors.crash.bodyNoBook` | Try again, or go back to Home. | 30 |
| `en.errors.notFoundPage.bodyNoBook` | This link does not open anything here. | 38 |
| `wordsCopy.pack.stoppedFull` (HOLD) | The recording stopped because this phone is full. Everything before that is kept. | 81 |
| `billingCopy.reminders.hiddenPlaceholder` | A reminder about your plan | 26 |
| `account.sync.paused` | Paused for now | 14 |
| `authCopy.email.needEmail` | Type your email to continue. | 28 |
| `authCopy.code.sixDigits` | The code has 6 digits. | 22 |
| `system.region.title` (HOLD) | {app} is not offered where you are | 34 |
| `system.region.body` (HOLD) | Nothing was set up on this phone. | 33 |
| `photosCopy.couldNotOpen` (area A confirms) | That photo could not be opened | 30 |
| `photosCopy.didNotCome` (area A) | The photo did not come along this time. Your words are kept. | 60 |
| `photosCopy.needsConnection` (area A) | This photo is in iCloud. It needs a connection to come to this phone. | 69 |
| `findCopy.failed` (area B) | Find did not work this time. Try again. | 39 |
| `shareCopy.pictureNotAdded` (area D) | The picture could not be added this time. The words will go. | 60 |
| `exportCopy.printable.failed` (area C) | The book could not be made this time. | 37 |

Changes proposed to existing keys (each through its owner; registered ones through counsel):

| Key | Now | Proposed | Why |
|---|---|---|---|
| `billingCopy.tonight.plusLine` | ... Recording, reading and export are always free. | ... Recording, reading and export stay free. | No open-ended promise (principle 6, frame section 7) |
| `authCopy.outage.title`, `authCopy.offline.title`, `authCopy.newPhone.loading`, `.slowTitle`, `.offlineTitle` | end in a full stop | no full stop | Titles carry no full stop (the `en.errors` rule); `server-surfaces-auth.test.ts` pins them, so its pins change in the same PR |
| `familyCopy.errors.family_share_consent` | Update the app to see it | Update {app} to see it | "the app" as a name is banned (glossary) |
| `billingCopy.plan.retry` (registered) | ... Every letter you have kept is safe. | ... Every letter you have kept is still yours. | "safe" outside its two places; counsel (CG5) |
| `en.trust.signIn.why` (registered) | An account keeps your book safe when you change phones. | Your letters' words come with you to a new phone. | Recordings do not move with backup off (NS-10 Claims); counsel (CG4) |

## 10. Card gaps

| Card row | What is missing or wrong | Proposed default |
|---|---|---|
| CG1. NS-32 section 16, intent "A note for tonight" | "note" is a word only for something a person makes (glossary); the placeholder is something the app sends | Area D: "Something for tonight" or "An evening reminder" |
| CG2. Frame section 4 vs `familyCopy.soon.*` | The frame says nothing anywhere says "coming soon" for the other parent; `familyCopy.soon.status` "Coming soon" and `settingsRowHelp` still exist, and `language.en.ts` says "Other languages are coming in a later update." (NS-17 territory) | Area D removes the co-parent "soon" lines from every store-build surface; the languages line is area A's call under NS-17 |
| CG3. NS-10 door lines and the registered consent and sign-in privacy lines | "the family you invite" and "the people you invite" describe invites the store build does not offer while NS-25 is gated | Counsel replaces both with a line that names no invitation (for example "Only you can read your letters, until you choose to share one." pending counsel) |
| CG4. NS-10 Claims vs `trust.signIn.why` | "keeps your book safe when you change phones" is broader than "words follow you" | Replace as in section 9 |
| CG5. VOICE "safe" rule vs `billingCopy.plan.retry` | "safe" in a billing line | Replace as in section 9 |
| CG6. NS-10 second-account row vs the built gate | The route opens the phone's book for any session (gate step 2); B would see A's book | BL-961 adds the filter rule (DESIGN.md E-S18); no words are needed, and none can make it true before then |
| CG7. No card names an app-update state beyond NS-32-R16 and the frame's "app updated mid-flow" (design's K-E05) | No surface for a required update, though `upgrade_required`, SCVER and `minSupportedVersion` exist | `system.update.line` in Me (E-S16.line), never blocking recording or reading |
| CG9. NS-38 to NS-45 (not on disk at writing) | The download-to-first-letter path has no locked card yet | Section 5.14 is keyed to the built path; product re-keys the step numbers to NS ids |
| CG10. Region check | No card and no code decides a region gate; App Store availability already limits where the app can be downloaded. A traveller or a VPN would meet an in-app check wrongly | Default: no in-app region screen. Availability stays an App Store Connect setting. If counsel names a list (export or sanctions), the HOLD lines in 5.14 step 4c are the draft |
| CG11. Disabled buttons with no reason in words | Email Send is disabled when empty and code Continue until 6 digits, with no line saying why (the child step already says why in words) | Add `authCopy.email.needEmail` and `authCopy.code.sixDigits`, shown under the button and announced |
| CG12. Sign-up versus sign-in | Email uses one path (`shouldCreateUser`), so a new and a returning person read the same screens. No card says whether the words should offer two doors | Default: one door, the glossary verb "sign in" only; never "Sign up", "Create account" or "Log in" |
| CG13. `auth.noEmailHelp` names Google | Build 12 offers Apple and email only | Drop Google from the line while it is off (section 5.14 step 7f) |
| CG14. Age fail is final on this phone? | `ageGate.mistakeButton` lets a person change the answer; no card says whether that is kept for a store build | Default: keep "I answered by mistake" (LEGAL-REQ-002 neutrality); counsel confirms |
| CG8. Site FAQ (`site.en.ts:109`) | "Reading, playing your recordings, Read together and export are never locked away" is an open-ended "never" that ruling T1 forbids for Read together | `content` (my own file) rewords to the listing's present tense: "Reading, playing your recordings, Read together and export are free." after counsel Q40 |

## 11. Engineering gaps

| Id | Gap | Backlog row it belongs to |
|---|---|---|
| G1 | `SystemLine` component (E-S15) does not exist; StateScreen has no note slot (comment in `outage-screen.tsx`) | design-systems; no row: proposed for BL-965's sibling or a new row |
| G2 | Second account: the first-run gate opens Home for any session when the phone holds a book; lists do not filter by account (design gap G-E05) | BL-961 |
| G3 | `minSupportedVersion` is in the remote-config schema with no consumer, and no screen reads an SCVER or 426 answer (design gap G-E03) | No row; propose one under BL-987 |
| G4 | No under-1 GB check on Listen for the calm line | No row; 06-nfr 11.3 (F04-REQ-008). Propose under BL-948 |
| G5 | No stop reason for a phone that fills mid-recording | Same as G4 |
| G6 | `account.sync` has no paused value; `killSwitches.sync` shows as "Waiting for a connection" | BL-978 (NS-10 names `killSwitches.sync`) |
| G7 | `SCSEL` is named in NS-06 B but not in `SQLSTATE_RULES` or chapter 02 | BL-969 |
| G8 | Fresh-install variants of the crash and not-found bodies need a "book on this phone" read | BL-568 follow-up; no row |

## 12. Claims check

Every line in this file that makes a promise a parent or the public could hold us to, and the card Claims section it stays inside.

| Line (key) | Promise | Card Claims it stays inside | Status |
|---|---|---|---|
| `system.offline.line`, `system.unreachable.line`, `system.update.line`: "Recording, reading and saving still work." | Local acts work without the server | LEGAL-REQ-040 (no switch for recording, reading or export); NS-02 "Find works without a connection"; NS-35 "Capture works" when signed out | True of the build: capture, read and save are local |
| `system.paused.sync`: "Everything you make is kept on this phone." | Letters made while sync is paused are kept locally | NS-36 "Kill switch: local rules hold"; ADR 0029 rule 4 | True; not a "stays on this phone" claim (it is about the pause only). COUNSEL read requested |
| `system.consentNeeded.line` | Letters wait on the phone until consent | SCCON `pause_for_consent` (the op is kept) | True of the outbox; COUNSEL |
| `authCopy.newPhone.declinedBody`: "Nothing comes to this phone until you agree. You can still delete your account from here." | No download before consent; deletion without agreeing | NS-10 door lines, R4a; Apple 5.1.1(v) | Depends on the NEEDS EVIDENCE row (does `sync_pull` serve rows while consent is outstanding). HOLD until `sync` answers |
| `authCopy.newPhone.accountDeleted` | The account no longer exists | NS-10-R9 | True when SCDEL `purged` |
| `billingCopy.keepGate.*`, `membership.*`, `plusLine` (as changed) | First two letters free; Plus keeps adding; reading, listening, export stay free | Principle 6 and T2 (internal); frame section 7: public copy says nothing about the future, no "free forever"; T1 for Read together | Holds once `plusLine` loses "always". No line names Read together; no price, trial or count |
| `billingCopy.reminders.hiddenPlaceholder` | none (a label) | NS-32 Claims forbid promising the lock screen shows nothing | Makes no promise about the lock screen |
| `system.storage.*` | Typing still works when full | 06-nfr 11.3 | True: typing writes no audio |
| `en.errors.crash.body` "safe on this phone" (REUSE) | The words are on the phone | VOICE "safe" rule | True only with a book on the phone; `bodyNoBook` covers a fresh install |
| Nothing here says: fast, instant, accessible to everyone, works with VoiceOver, never miss, everything moves, recordings move, nothing is ever lost, free forever, never limited | | NS-33, NS-34, NS-10, NS-32 Claims; T1 | Checked |

## 12a. Reconciliation notes for the design lead (DESIGN.md)

| Where in DESIGN.md | What differs | Proposed fix |
|---|---|---|
| E-S04 "Continue with email" | The glossary bans "Continue with email"; the built label is `authCopy.sheet.email` "Sign in with email" (`sign-in/index.tsx` uses `s.email`) | Use "Sign in with email" |
| E-S02 default (store) | Describes "Begin the book" and "I already have a book"; with servers on, the built Welcome is `WelcomeSignIn`: `welcome.body`, `sheet.bodies.sign_in_first`, the agree line with links, Sign in with Apple, Sign in with email, `lastMethod` | Draw the servers-on Welcome as built; "Begin the book" is E-S02.serversOff |
| E-S08 name-waiting | Shows `childrenExtra.nameRequired`; on the account-first path the name is optional (`nameOptionalLabel`, `nameOptionalHelp`) and the blockers are the date and, for twins, `needNameMany` | Keep name-waiting only for twins and the servers-off path |
| E-S16 | Placeholder "A newer version is ready in the App Store." with "Update" | `system.update.line` and `system.update.storeButton` (section 5.10) |
| E-S22 failed | "one line, Try again" | The built copy has no failed line; the system sheet says it. If a line is wanted: `appLockCopy.failedLine` "Face ID did not open the book. Try again, or use your passcode." (PROPOSED, HOLD: whether the passcode fallback shows is UNVERIFIED) |
| E-S13 | Card gap: `crash.body` makes a safety statement | Agreed for a fresh install: E-S13.noBook with `en.errors.crash.bodyNoBook`. With a book, VOICE keeps "safe" for a crash |
| States to add | E-S05.reason-empty, E-S06.reason-short (CG11), E-S13.noBook, E-S20.noBook, E-S03.region (HOLD, CG10), E-S10.error-codeFailed (built: `sheetTap` `codeFailed`) | Add to section 4 |

## 13. How the strings were checked

A node check (a throwaway script outside the repo, run in this session with no install) read the whole file for non-ASCII characters (0 found) and every new key in the section 9 table (38 rows, after the re-key withdrew the second-account screen and the separate update title) for: the test's fear words plus "lost" and "missing"; the AI-writing words; gendered words; daily rhythm and gap counts; the CR-25 internal words plus "server" and "error"; "safe"; "we" or "our"; the "stays on this phone" family; placeholders outside the test's list; buttons over 22 characters with `{app}` filled; and the stated character count. Result: no rule hits; seven character counts were off by one and are fixed. The REUSE lines were read by hand, not by the script; the ones that break a rule are flagged in sections 5 and 9 (`plan.retry` "safe", `tonight.plusLine` "always free", the full stops on five titles, "the app" in `family_share_consent`). `vitest` was not run, because nothing was written into `packages/content`.
