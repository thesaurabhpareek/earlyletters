# Theme 2: Sign in, my account, and nobody else getting in

Readiness: 25 of 28 (audit 8 Nov: 16). Author's re-score, `qa` to confirm. Remains: R10 is a question until `support` sets the target minutes by Mon 16 Nov; the Apple key and Resend SMTP are founder steps (C14); VoiceOver order on the account screen needs one `design-systems` read (C7).

| | |
|---|---|
| Working label | NX-02 (working id, see `_CONVENTIONS.md`) |
| Refines | F02-REQ-001, -003, -005, -008, -011, -012, -015, -018, -020, -023, -025; BL-594, BL-597, BL-598, BL-599, BL-600, BL-568, BL-603 |
| Tag | EVIDENCE for the state of the code (`BUILD12-GAP-MAP-2026-11-08.md` 1.1, 1.2). HYPOTHESIS for demand: no parent interview mentions sign-in; the customer need is rank 1 and 2 in `01-customer-needs.md` (it must just work, easy start) |
| Size | M in agent PRs; S each for #657, #632, #633, #617 (gap map ranks 1, 2, 15) |
| Gate | Founder (Apple key, Resend SMTP, OTP length, a read of #602 or a counted second review for credentials code). Apple: guideline 4.8 (equivalent login) |
| Order | 2 of 12 |

## What the parent will see and do

A parent opens "Keep the book", taps Continue with Apple or types an email address and a short code from the email. Their letters now follow them. In Account they see the sign-in email, Sign out, Sign out other devices. If something looks wrong, one switch from us signs everyone out and each phone does it quietly after its letters have safely gone up.

They are never asked for a password.

## The check

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-02-R1 | EVIDENCE | Given the production Apple provider, When 3 of 3 real phones sign in with Apple, Then each reaches the Keep the book result without error. Weekly auth success, cancels excluded, is 97% or more (alert below 93%), counted from Supabase Auth logs (successes divided by attempts) by the weekly ops check, not from app analytics, which are off in 1.0 (D-124); this is the operating SLO row of `06-nfr.md` (A-NFR-013), not a build gate. | Build 11 has the method off; S1-06 never run. | F02-REQ-015; gap map 1.1 |
| NX-02-R2 | EVIDENCE | Given the hosted auth code length is N, When the preflight reads the hosted auth settings, Then it fails unless N equals `EMAIL_CODE_LENGTH` as resolved for that build profile (`apps/mobile/src/lib/auth/email.ts:29`: 6 unless `EXPO_PUBLIC_EMAIL_OTP_LENGTH` sets 6 to 10). The production profile pins 6, and a test fails if `apps/mobile/eas.json` for `production` and `supabase/config.toml` `otp_length` do not both equal 6. | A mismatch refuses every typed code. Searched 8 Nov: `otp_length = 6` is in `supabase/config.toml` and the length is read in `email.ts`, but no script or test compares them or the hosted value, and `eas.json` sets no `EXPO_PUBLIC_EMAIL_OTP_LENGTH`. | `TESTFLIGHT.md` lines 80 to 88; gap map section 5 |
| NX-02-R3 | EVIDENCE | Given a known and an unknown address, When each is submitted, Then the screen, the wording and the timing class are identical (same status, same wait within the test's tolerance). | Check exists in the PRD; it has never run against a hosted project, whose Auth timing is the thing under test. | F02-REQ-005 |
| NX-02-R4 | EVIDENCE | Given 3 unsent letters and Sign out, When the parent confirms, Then the session stays until the queue is empty and the server holds 3 letters. | Sync never run on a phone against a real server. | F02-REQ-001 |
| NX-02-R5 | EVIDENCE | Given `forceReauthEpoch` raised in signed remote config, When a phone next refreshes config, Then it signs out locally exactly once per epoch after its outbox drains, 0 letters lost. | The app does not read the epoch: `forceReauthEpoch` appears only in `packages/api/src/remote-config.ts` and its standards test (searched 8 Nov). | F02-REQ-023; #657 |
| NX-02-R6 | EVIDENCE | Given the native storage adapter, When `setItem`, `getItem` and `removeItem` run, Then each passes `keychainAccessible: AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` (the value `apps/mobile/src/lib/supabase/secure-storage.ts` sets today). | No test pins the option, so changing it passes CI (BL-599 problem line). | BL-599 |
| NX-02-R7 | EVIDENCE | Given a `preview` or `production` build and a Supabase URL that starts with `http://`, Then the build refuses to start, 1 of 1. | Not found by search in `apps/mobile/src/lib/supabase/env.ts`: no refusal of an `http://` URL in store builds. | BL-600 |
| NX-02-R8 | EVIDENCE | Given a thrown error that contains a token, an email address or a child name, When the global handler reports it, Then the report holds a code only, 0 of 3 strings leak. | No global error handler is installed (`ErrorUtils.setGlobalHandler` absent from `apps/mobile/src`, BL-568 problem line); only the root ErrorBoundary exists. | BL-568 |
| NX-02-R9 | EVIDENCE | Given a link requested on phone A and opened on phone B, or while another account is signed in, Then no session starts on B. | Merged in code; never run across two phones. | F02-REQ-018, -020 |
| NX-02-R10 | HYPOTHESIS | Given the recovery runbook (#620), When a tester follows it for "I lost my phone and my email", Then access returns within the target minutes and the drill's minutes are recorded. Owner: `support`. The target is set by Mon 16 Nov 2026; until it is, this row is a question (RR-13), not a requirement, and no engineer is handed it. | No recovery runbook is on `develop` (`docs/ops/runbooks/` has none for sign-in recovery); no drill has run. | BL-598 |

**Shown:** `authCopy.sheet.*`, `authCopy.email.*`, `authCopy.code.*`, `authCopy.errors.*`, `authCopy.account.*` (exist in `packages/content/src/features/auth.en.ts`), with the versioned Terms and Privacy links directly above the buttons (theme 3).
**Records:** a sign-in act through `record_policy_act` per PRIV-R21 (document, version, action, method, surface, server and phone times, app version and build, OS major, platform, text language, hash of the words shown, allowlisted context).
**Never:** a password, an advertising id, contacts, a location, the email address in any log or crash report, a token in storage other than the Keychain.
**Decline and withdraw:** Not now keeps the phone fully working (record, read, export). Signing out and deleting the account stay available (PRIV-R09).

## Edge cases

- Apple "Hide My Email" relay address: sign-in mail must arrive (F02-REQ-006; sender registered with Apple).
- Code expired after 900 seconds: friendly retry, no new account.
- Second account on the same phone: link refused while another is signed in (R9).
- Access token lifetime: the doc recommends 900 seconds; the project default of one hour is UNVERIFIED.
- Google sign-in: not in build 12 (see decisions). If it comes in, Apple sign-in must sit beside it (4.8).

## Offline behaviour

A signed-in phone with no network keeps working from its stored session; letters wait in the outbox. Sign-in itself needs a network: the sheet says so in plain words and "Not now" stays one tap.

## What we never do

Passwords (D-054). Rewriting any words. Counting how often a parent signs in.

## Copy needs (packages/content)

Existing, checked 8 Nov: `authCopy.account.signOutOthersDone` ('Other devices are signed out.', `auth.en.ts:210`). Keys to add (words by `content`, reviewed for the rules): `authCopy.account.signedOutForSafety` (new; shown once per epoch bump; plain, no alarm words, says letters are safe and on the phone), and `authCopy.errors.codeLengthMismatch` only if a person can ever see it (otherwise preflight only). No wording is proposed here.

## Analytics events (opt-in, content-free, names only)

Existing: `auth_sheet_shown`, `auth_method_selected`, `auth_succeeded`, `auth_failed`, `auth_email_sent`, `auth_deferred`, `signed_out`. New: `forced_sign_out` (no properties): not in `packages/analytics/src/catalog.ts` (checked 8 Nov), so add it to the catalog and `docs/analytics/TRACKING_PLAN.md` in the same PR; the allowlist test fails on any property. Sends nothing in 1.0 (analytics off, D-124).

## Device rows

S1-06 (Apple), S1-07 (Google, only if in), S1-08 (email with a review mailbox), S1-27 (account screen). New row: "force sign-out with 3 unsent letters".

## Dependencies

Theme 1 (a hosted project). #602 before legacy keys go off. #657, #632, #633, #617, #620, #658.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| Google sign-in in build 12 | Leave it out. Apple and email only; keeps 4.8 simple (gap map section 6 question 4) |
| Code length 6 or 8 | Keep 6 |
| Read of #602 | Founder reads it, or a counted second review; credentials code is fenced |

## Engineering block (cross-cutting, added 8 Nov 2026 after the readiness audit, G-31 to G-37)

| Line | This theme |
|---|---|
| API contract (`packages/api`) | `forceReauthEpoch` already exists in `packages/api/src/remote-config.ts`; the change is in the app reading it. No new type. A test in `packages/api/test/remote-config.test.ts` (exists) keeps the field name stable. Version: unchanged. |
| Budget (`06-nfr.md`) | Native Apple or Google sign-in after the OS sheet closes: p90 3 s (A-NFR-004). New-sign-in email within 2 minutes p95. Crash during sign-in loses 0 local letters or invite tokens (A-NFR-013). Auth success 97% weekly (operating SLO). |
| Accessibility | Sign-in sheet, code entry and account screen: Dynamic Type to AX5 with 0 clipped lines; VoiceOver reads the Terms and Privacy line before the buttons; tap targets 44 pt or more; Reduce Motion: fade only. Device rows S1-06 to S1-08 and S1-27 run once at AX5. |
| Switch, off behaviour, noticed by | Switches: `forceReauthEpoch` (sign out everyone once) and the server-features switch. Off or unreachable: the phone keeps its stored session and works locally. Rollback: lower nothing; the epoch only goes up, and a wrong bump is answered by the next signed config, since each phone signs out once per epoch. Noticed by: Supabase Auth logs (counts only) and the weekly auth-success check. |
| Data class and retention | Session tokens: L3, Keychain only, removed at sign out. Sign-in email: L3, never in a log or crash report. A sign-in act row: per PRIV-R21 (theme 3). Epoch seen: a device setting, L2, removed with the app. |
| Schema and grants | No schema change from this theme. The new-sign-in email and session record already exist in migrations on develop. |
| Analytics events | Existing and in catalog: auth_sheet_shown, auth_method_selected, auth_succeeded, auth_failed, auth_email_sent, auth_deferred, signed_out. New: forced_sign_out (add to catalog first). |

## Trace and tests

Id convention: `_CONVENTIONS.md`. A test title starts with the bracketed id. Paths marked "proposed" do not exist yet; the PR that adds the test names the real path.

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-02-R1 | F02-REQ-015 | device, 3 phones; `[NX-02-R1] Apple sign-in reaches Keep the book`; the weekly rate is an ops check, no test | S1-06 |
| NX-02-R2 | BL-598 area; TESTFLIGHT lines 80 to 88 | script test (proposed `scripts/release/auth-settings.test.mjs`); `[NX-02-R2] preflight fails when code length differs from EMAIL_CODE_LENGTH` | S1-08 |
| NX-02-R3 | F02-REQ-005 | e2e against the throwaway project (proposed `scripts/ops/hosted-check.mjs`); `[NX-02-R3] known and unknown address look the same` | S1-08 |
| NX-02-R4 | F02-REQ-001 | mobile unit `apps/mobile/test` (proposed `sign-out-queue.test.ts`); `[NX-02-R4] sign out waits for an empty queue` | new: sign out with 3 unsent letters |
| NX-02-R5 | F02-REQ-023 | mobile unit (proposed `apps/mobile/test/force-reauth.test.ts`); `[NX-02-R5] signs out once per epoch after the outbox drains` | new: force sign-out with 3 unsent letters |
| NX-02-R6 | BL-599 | mobile unit (proposed `apps/mobile/test/secure-storage.test.ts`); `[NX-02-R6] every storage call passes AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` | none |
| NX-02-R7 | BL-600 | mobile unit on the env reader (proposed `apps/mobile/test/supabase-env.test.ts`); `[NX-02-R7] store builds refuse http` | none |
| NX-02-R8 | BL-568 | mobile unit (proposed `apps/mobile/test/global-error-handler.test.ts`); `[NX-02-R8] report holds a code only, 0 of 3 strings leak` | none |
| NX-02-R9 | F02-REQ-018, -020 | device, 2 phones; `[NX-02-R9] link from phone A does not sign in phone B` | S1-22, S1-28 |
| NX-02-R10 | BL-598 | drill, minutes in the runbook; Test: none until the target is set | new: recovery drill |

Trace: NX-02-R1..R10 -> F02-REQ-001, -003, -005, -008, -011, -012, -015, -018, -020, -023, -025; BL-568, BL-598 to BL-600, BL-603, BL-594, BL-597.

## Not verified

Whether Apple's provider and Resend SMTP are set on any hosted project (S-52 FAIL on 8 Nov). The access-token lifetime on the real project.
