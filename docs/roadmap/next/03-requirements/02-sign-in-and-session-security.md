# Theme 2: Sign in, my account, and nobody else getting in

| | |
|---|---|
| Working label | NX-02 (id: to be assigned) |
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
| NX-02-R1 | EVIDENCE | Given the production Apple provider, When 3 of 3 real phones sign in with Apple, Then each reaches the Keep the book result without error. Weekly auth success, cancels excluded, is 97% or more (alert below 93%). | Build 11 has the method off; S1-06 never run. | F02-REQ-015; gap map 1.1 |
| NX-02-R2 | EVIDENCE | Given the server's code length is N, When the preflight reads the hosted auth settings, Then it fails unless N equals the length the app accepts (6 today). | A mismatch refuses every typed code and nothing checks it. | `TESTFLIGHT.md` lines 80 to 88; gap map section 5 |
| NX-02-R3 | EVIDENCE | Given a known and an unknown address, When each is submitted, Then the screen, the wording and the timing class are identical (same status, same wait within the test's tolerance). | Check exists in the PRD; not run on a hosted project. | F02-REQ-005 |
| NX-02-R4 | EVIDENCE | Given 3 unsent letters and Sign out, When the parent confirms, Then the session stays until the queue is empty and the server holds 3 letters. | Sync never run on a phone against a real server. | F02-REQ-001 |
| NX-02-R5 | EVIDENCE | Given `forceReauthEpoch` raised in signed remote config, When a phone next refreshes config, Then it signs out locally exactly once per epoch after its outbox drains, 0 letters lost. | #657 is a draft; the app does not read the epoch. | F02-REQ-023; #657 |
| NX-02-R6 | EVIDENCE | Given a stored session, When the test reads its Keychain attributes, Then the accessibility class equals the one named in BL-599. | #632 is a draft. | BL-599 |
| NX-02-R7 | EVIDENCE | Given a `preview` or `production` build and a Supabase URL that starts with `http://`, Then the build refuses to start, 1 of 1. | #633 is a draft. | BL-600 |
| NX-02-R8 | EVIDENCE | Given a thrown error that contains a token, an email address or a child name, When the global handler reports it, Then the report holds a code only, 0 of 3 strings leak. | #617 is a draft. | BL-568 |
| NX-02-R9 | EVIDENCE | Given a link requested on phone A and opened on phone B, or while another account is signed in, Then no session starts on B. | Merged in code; never run across two phones. | F02-REQ-018, -020 |
| NX-02-R10 | HYPOTHESIS | Given the recovery runbook (#620), When a tester follows it for "I lost my phone and my email", Then access returns in the minutes the runbook states and the drill's minutes are recorded. The target minutes are not set; support owns them. | No runbook is merged; no drill run. | BL-598 |

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

Keys to add (words by `content`, reviewed for the rules): `authCopy.errors.codeLengthMismatch` (only if a user can ever see it; otherwise preflight only), `authCopy.account.signOutOthersDone`, `authCopy.account.signedOutForSafety` (plain, no alarm words, says letters are safe and on the phone). No wording is proposed here.

## Analytics events (opt-in, content-free, names only)

Existing: `auth_sheet_shown`, `auth_method_selected`, `auth_succeeded`, `auth_failed`, `auth_email_sent`, `auth_deferred`, `signed_out`. New: `forced_sign_out` (no properties).

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

## Not verified

Whether Apple's provider and Resend SMTP are set on any hosted project (S-52 FAIL on 8 Nov). The access-token lifetime on the real project.
