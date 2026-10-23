# Device session YYYY-MM-DD, build x.y.z (n), device-tag

<!--
Copy this file to docs/qa/evidence/<YYYY-MM-DD>-<x.y.z(n)>-<device-tag>.md, for example
docs/qa/evidence/2026-10-23-1.0.0(3)-se3.md, and fill it in during the session.
One file per device session (PRD V2 08 section 3.3 S19). A session that uses two or three
phones at once (sign-in, co-parent, sync, backup) is one file named after Phone A.
Rules: docs/qa/evidence/README.md. Delete this comment block when the file is filled in.

Never write in this file, its screenshots' names or its issue links: a real child's name,
a real letter or any words from one, a real email address, a sign-in code, a magic link, an
invite link or code, a user id, a session or refresh token, a receipt or transaction id, a
Keychain item name, key material, a Supabase key, or a push token. Use the fictional family
(Asha, Avi, Mama, Papa) and labels (Phone A, Account A).
-->

## Session

| Field | Value |
|---|---|
| Date and time (UTC) | YYYY-MM-DD hh:mm to hh:mm |
| Tester | initials only |
| Second person (if any) | initials only, and their role (co-parent phone, observer) |
| Run sheets followed | for example `docs/qa/run-sheets/AL-04-sign-in.md` |
| Build | marketing version and build number from Settings > About, for example `1.0.0 (3)` |
| Build lane and profile | TestFlight `testflight` (build 1, servers off) / TestFlight `preview` (build 2, servers on) / EAS development |
| Commit | short SHA the build was made from (EAS build page) |
| Server switch | `EXPO_PUBLIC_SERVER_FEATURES` = off / on |
| Build flags | `EXPO_PUBLIC_BACKUP` = off / on; `EXPO_PUBLIC_STATUS_REPORT` = off / on; `EXPO_PUBLIC_ANALYTICS` = off |
| Backend | none / staging (`scribe-staging`) / production |
| Escrow project | none / `scribe-escrow-staging` with the drill key |

## Phones

| Label | Device tag | Model | iOS | Storage free | Apple Account (drill label) | iCloud Keychain | App account (drill label) | Plan: Plus or Free, and letters already kept | Drill-phone check (`run-sheets/README.md` rule 3) | Battery and thermal state at start |
|---|---|---|---|---|---|---|---|---|---|---|
| Phone A | se3 | iPhone SE (3rd generation) | | GB | drill Apple Account A | on / off | Drill Mama / signed out | Free, 0 kept / Plus on (sandbox or StoreKit file) | pass / stop | %, nominal |
| Phone B | current | | | GB | drill Apple Account A / B | on / off | | | pass / stop | %, nominal |
| Phone C | | | | GB | | on / off | Drill Papa | | pass / stop | |

Sandbox or purchase accounts used (labels only), and which account Apple's sheet used (AL-09 account check).
Settings during the session: Dark on / off; text size default / AX5; Bold Text on / off; Reduce Motion on / off; Low Power on / off; network Wi-Fi / cellular / airplane.

## Before the first step

- [ ] Every phone passed the drill-phone check (`docs/qa/run-sheets/README.md` "Drill identities" rule 3): signed out or a drill account, only the drill child Asha in the Book, the drill Apple Account where the sheet needs it. A phone that fails is not used, and nothing on it is deleted or reinstalled.
- [ ] Every letter, name and recording used today is fictional (Asha, Avi, Mama, Papa) or a scripted Asha letter read by a consenting adult (DEVICE_TEST_PLAN P-08).
- [ ] Screen recording and screenshots go to your own storage, never the repo; only their file names go below.
- [ ] Each phone's App Privacy Report is on (Settings > Privacy and Security > App Privacy Report) so the domains the app contacted can be read at the end.
- [ ] You know the stop rule: an S0 (a letter or recording lost or changed, data seen by the wrong person, anything made after an under-18 answer, a consent skipped) stops the session. Keep the phone as it is for diagnosis and file the issue first.

## Results

Result words: **pass**, **fail**, **blocked** (with the reason, for example "switch off" or "staging not ready"), **n/a** (with the reason), **not run**. A row without its numbers is not evidence.

| ID | Result | Numbers (with units) | Captured (file names, outside the repo) | Issue | Owner doc updated? |
|---|---|---|---|---|---|
| AL-01.1 | | | | | |

## Network observed

| Phone | Domains in the App Privacy Report for the app | Expected for this build | Match? |
|---|---|---|---|
| Phone A | | build 1: `packs.earlyletters.app` (signed config and documents) and the speech model host (`huggingface.co`, only after a download tap); build 2: also the staging Supabase host, only after sign-in; never an analytics or crash-report host | |

## Issues filed

| Issue | Severity (S0 to S3) | Row | One line, no letter text |
|---|---|---|---|

## Sign-off

| Who | What | Date |
|---|---|---|
| Tester | Every row above has a result; no forbidden data in this file | |
| S19 reviewer | Rows checked against the run sheets; numbers present; issues linked | |
