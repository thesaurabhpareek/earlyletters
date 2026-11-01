# Threat model: account items for 1 Dec and sign-in for 1.1

Owner: `security-architect` (chapters 05 and 06). Written 1 Nov 2026 against `origin/develop` at `b79982d0`, plus open PR #520 (Erase everything) where named. Method: STRIDE per surface (TDD 04 section 2.3), adversaries A1 to A9 from TDD 04 section 2.2, OWASP MASVS v2.1.0 groups for the device rows. This file is the SEC-R01 entry for every surface below; PR #342 (`docs/security/threat-model.md`, open) keeps the product-wide rows P1 to P8 and T1 to T10.

**Level of detail (D-122 item 3).** D-122 sends threat-model detail to a private repository. That repository is not readable from sessions, so this file stays at requirement-row level: threat, mitigation, test, residual. It names no attack steps and no tooling. If the founder wants the rows themselves private too, move this folder when the private repository exists.

**Sources.** Decisions F1 to F11, PL-2, CPO-n, CDesO-n, CPrivO-n, CCO-n, CLO-n, CISO-1 to CISO-3 (`/home/claude/proposals/account-security/council.md`, `/home/claude/proposals/v1-experience/council.md`); lane files `account-security/security.md`, `journeys.md`, `design.md`, `legal-consent.md`, `privacy-settings.md`, `v1-experience/auth-emails-profile.md`. Outside sources, all read 1 Nov 2026: Supabase "User sessions" and "Rate limits" pages; Expo `expo-local-authentication` and "EAS Update code signing" pages; SQLite `PRAGMA secure_delete`; Apple support 108770 (iCloud Backup) and 102651 (iCloud data security); public DNS for the domain through dns.google. CISO rulings that came out of this model are in `ciso-rulings.md`; privacy effects in `privacy-impact.md`.

**Markers.** Status: **B** built on `develop`, **P#n** in open PR n, **N** not built. **[U]** not verified on a device or not read today. Test layer: **unit** (Node, `npm test -w @scribe/mobile`), **db** (`npm run test:db`), **fn** (`npm run test:functions`), **auth** (the proposed `test:auth`, local Supabase plus Mailpit), **device** (a DEVICE_TEST_PLAN row).

## 1. Assets and adversaries

| Asset | Level | Where in 1 Dec | Where in 1.1 |
|---|---|---|---|
| Letters, raw transcripts, recordings, child name and dates | L4 | Phone only: `scribe.db` (WAL), audio files, iPhone backup (F4, D-033) | Also server rows for synced books (`entries` incl. `raw_transcript`) |
| Export ZIP | L4, plaintext by design | `Caches/exports`, then wherever the parent sends it | Same |
| Session and pending invite tokens | L4 secret | None (no sign-in) | Keychain, `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` (IAM-R10) |
| Email address, account id | L3 | None | `auth.users`, Resend logs |
| Agreement record (`legal.terms`) and age gate state | L2 | Device settings | Uploaded as a `policy_acceptances` row at first sign-in |
| Integrity of the book (not erased or altered by someone else) | n/a | Phone | Phone and server |

Adversaries in scope: A1 ex-partner (knows the passcode or the email), A3 lost or picked-up phone, A4 account takeover through email, A6 vendor (Resend, Expo), A7 internet attacker (codes, email flooding), A8 supply chain (OTA). Out of scope, stated as residual: a forensic lab with the device in hand (MASVS-RESILIENCE is not a goal), a jailbroken phone, the holder of the device passcode.

## 2. 1 Dec items (device only, servers off)

### AX-01 App lock bypass

The lock is a gate in front of the interface. It does not encrypt anything: data at rest is protected by iOS Data Protection (`NSFileProtectionCompleteUntilFirstUserAuthentication`, SEC-R15). Spec: `security.md` section 2 as ruled by CISO-1, CPO-2 (offered once, off until turned on), F17-REQ-008 to -011 and -015. Status **N** (no `expo-local-authentication` in `apps/mobile/package.json`).

| # | Threat | Mitigation (requirement) | Test |
|---|---|---|---|
| 1a | First frame on cold start shows content before the lock state is read | Lock state is read synchronously before the first route renders, like the age gate in the root layout; an unreadable state counts as locked (fail closed) | unit: root gate renders the lock screen when the setting read throws |
| 1b | The cover is an overlay, so VoiceOver, a fast tap or a slow render reaches the content under it | While locked the root renders the lock screen **instead of** the routes (replace, not overlay); nothing behind it is mounted | unit: no letter, book or settings component mounts while locked; device: VoiceOver on the lock screen finds only Unlock and the app name |
| 1c | A notification tap, universal link or deep link opens a route directly | Navigation from a notification or link is held until unlock, then replayed (F17-U22); unknown routes still land on not-found (SEC-R17) | unit: a held route is replayed only after `authenticated`; device row for a reminder tap while locked |
| 1d | The grace period is stretched by a device clock change | Grace is measured with a monotonic clock or, failing that, any negative or implausible elapsed time locks | unit: clock moved backwards and forwards across the grace boundary |
| 1e | Lock fires during capture and loses audio | Never lock while capture runs; apply the lock when capture ends (`security.md` 2) | unit: lock policy returns "defer" while a take is recording; device row |
| 1f | Export or Erase reached through an unlocked session left open by someone else | Export and Erase everything ask for device owner authentication again when the lock is on (CISO-1; design 2.7, 2.12; CISO-4) | unit: Export and Erase call `authenticateAsync` first; a cancel builds and erases nothing |
| 1g | Face enrolment changed by someone who knows the passcode | Passcode fallback is the bound; the passcode holder is already inside the model. No `biometricsChanged` check on 1 Dec (CISO-5) | none; residual |
| 1h | Passcode removed in iOS Settings | Lock turns itself off and says so once (F17-U21); the switch cannot turn on without a passcode | unit on the policy; device row |
| 1i | Spotlight, Siri, Handoff or a widget shows a letter | None exist; any added later hides content while locked (F17-REQ-007) | unit: a grep test that fails on CoreSpotlight, `NSUserActivity` or widget targets without a lock check [proposed] |

**Residual.** Anyone who knows the device passcode opens the book (accepted, CISO-1; Privacy page says so, CPrivO-5). On a jailbroken phone the gate can be skipped; the files are still protected only by iOS. Carried by the parent, stated in copy.

### AX-02 App switcher snapshot

iOS takes a picture of the app when it leaves the foreground, shows it in the app switcher and keeps it on disk [U: location and how many are kept].

| # | Threat | Mitigation | Test |
|---|---|---|---|
| 2a | The switcher shows the open letter to someone holding the phone | When the lock is on, `PrivacyCover` (opaque `bg`, mark only) draws on `inactive` with no fade (design 2.4) | unit: the AppState handler sets the cover on `inactive` in the same tick, with no animation; device: switcher shows the cover |
| 2b | The stored snapshot outlives Erase everything | After Erase the app shows Before you begin, so the next snapshot replaces the old one [U]; the Erase copy claims nothing about system snapshots | device row: switcher after Erase shows first run |
| 2c | Cover left up after unlock, or never shown after a share sheet | Cover lifts only on `active` plus unlock; `inactive` alone never locks (share sheet, Face ID prompt, calls) | unit: state table for active, inactive, background |

**Residual.** With the lock off, the switcher shows the last screen. That is the same exposure as opening the app, so no cover is required then (CDesO decision stands).

### AX-03 Notifications on a locked phone

Local reminders only (no server push in 1 Dec). Names are off by default (D-025, `planner.ts:149`); no letter text ever (LEGAL-REQ-054, privacy policy section 5). Whether iOS shows previews on the lock screen is the parent's iOS setting [U default].

| # | Threat | Mitigation | Test |
|---|---|---|---|
| 3a | A child's name on the lock screen | Names only when the parent turns them on; with the app lock on, names are forced off (F17-REQ-015) | unit: planner output has no `{child}` value when lock is on, whatever `namesOnLockScreen` says |
| 3b | Notifications scheduled **before** the lock was turned on still carry names | Turning the lock on re-plans and replaces every pending request (CISO-14) | unit: lock on with names on, then the scheduler's pending set holds no child name |
| 3c | Memory card content reaches a notification | Memory push is 1.2, opt-in, off by default (F6, CDesO-5); when it ships it carries no letter text and no excerpt (CISO-14) | 1.2: planner test with the Asha fixture |
| 3d | Delivered notifications left after Erase | Erase removes scheduled and delivered reminders (P#520) | unit in `erase-all.test.ts` (P#520) |

**Residual.** A parent who turns names on with the lock off shows the child's first name to anyone who sees the lock screen. Their choice, explained by the preview (reminders-settings, CCO-10).

### AX-04 Erase everything: completeness and forensic residue

Status **P#520**. What it does today: files before rows; every table from `sqlite_master`; `PRAGMA secure_delete = ON` at open; `VACUUM`, then `wal_checkpoint(TRUNCATE)`; Keychain leftovers; scheduled and delivered reminders; export and recovery ZIPs; returns to Before you begin; byte scans of `scribe.db` and `scribe.db-wal` in tests. Refused while signed in. SQLite's own page (read today) says secure_delete overwrites deleted content "with zeros", that the `fast` setting leaves "forensic traces on freelist pages", and that FTS3 and FTS5 shadow tables "might leave forensic traces". No FTS table exists in `apps/mobile/src/lib/db` today (grep).

| # | Store | Covered by P#520 | Gap and requirement | Test |
|---|---|---|---|---|
| 4a | `scribe.db` and its WAL | Yes (secure_delete, VACUUM, checkpoint) | For the whole-store erase, close the connection, delete `scribe.db`, `-wal` and `-shm`, and open a new file, so no old file survives at all (CISO-6). Keep secure_delete and the checkpoint for single-letter and book erase | unit: file identity changes; byte scan of every file in the SQLite folder finds no Asha word |
| 4b | Other SQLite files (`backupDbFileFor(profileId)` in `lib/backup/runtime.ts:423`) | Not named | Erase removes every `*.db*` in the SQLite folder, not one name (backup is off in every profile, so the file should not exist [U]) | unit: a planted second database is gone after Erase |
| 4c | Future FTS or virtual tables | n/a | A test fails if a migration adds a virtual table and the erase test has not been extended (secure_delete does not cover shadow tables) | unit: `sqlite_master` has no `VIRTUAL TABLE` unless listed |
| 4d | Recordings, listening and whole-frame copies, stray takes | Yes | None | P#520 tests run the orphan sweep after Erase and expect nothing |
| 4e | `tmp` and `Caches` beyond exports | Partly | Erase empties the app's `tmp` and `Caches` except the remote document cache (L1) | unit over the file layer |
| 4f | Speech models and packs | Kept by spec (F17 6.2 F step 3) | The installed pack **list** reveals languages (DATA_CLASSIFICATION 6 item 8). Copy says the speech files stay; Storage removes them | none; residual |
| 4g | Keychain items | Yes for invite, auth leftovers, free-letter count | None for 1 Dec | P#520 |
| 4h | System snapshot, keyboard learned words | No (iOS owns them) | Copy claims nothing about them | none; residual |
| 4i | iCloud device backups made before the erase | No (cannot be reached) | Copy must not say Erase reaches backups. Apple: when iCloud Backup is turned off, backups "are kept for 180 days"; under Standard data protection Apple holds the backup keys, under Advanced Data Protection backups are end-to-end encrypted (102651) | content rule: the erase strings are in the claims registry (LEGAL-REQ-044) |
| 4j | Computer backups (Finder) and earlier exports | No | Same copy rule | as 4i |
| 4k | Erase used against the parent (A1 or anyone with the unlocked phone) | Typed "delete" only | Device owner authentication before Erase when the device has a passcode, as soon as `expo-local-authentication` is in the build (F17 6.2 F; CISO-6) | unit: Erase calls `authenticateAsync` when available; cancel erases nothing |
| 4l | Kill part way through | Yes (pending marks, `resumeEraseAtLaunch`) | None | P#520 |

**Residual.** Copies outside the app (iPhone backups, computer backups, shared exports) survive Erase and are the parent's to delete. Freed flash blocks after file deletion are a forensic-lab question [U: Apple's per-file key behaviour on delete was not stated on the pages read today]; out of scope like threat (a) in `security.md` 1.

### AX-05 Export files left in Files or the share sheet

Status **B** (`lib/export/device.ts`): ZIP built in `Caches/exports`, deleted when the share sheet closes, on screen visits and at launch (`_layout.tsx:112`). File name is the format id and a date, never a name (`device.ts:279`). PL-2 adds held letters to the same path (1 Dec, P0).

| # | Threat | Mitigation | Test |
|---|---|---|---|
| 5a | Copy kept in our sandbox after a kill mid-share | Launch sweep (built) | unit: exists for `cleanupExports`; add a case where the share promise never settles |
| 5b | Copy saved to Files, iCloud Drive, Mail, Messages or AirDrop | Outside our reach by design. Export asks for authentication again when the lock is on (AX-01 1f). The screen says plainly the copy is theirs to keep safe | unit for re-auth; content rules for the line |
| 5c | The child's name in the file name shows in Files, Mail or iCloud on other devices | Name never in the file name | unit: file name matches `^<format>-\d{4}-\d{2}-\d{2}\.zip$` |
| 5d | The app's own Documents folder becomes visible in Files | `UIFileSharingEnabled` and `LSSupportsOpeningDocumentsInPlace` stay absent (none in `app.config.ts` today) | config test asserting both keys are absent [proposed] |
| 5e | A password ZIP gives false comfort | No password export in 1.x (CISO-7) | none |

**Residual.** Once shared, the export is plaintext wherever the parent put it, including iCloud Drive's Recently Deleted and Mail's sent folder. Carried by the parent; the screen says so without fear words.

### AX-06 Agreement record tampering

Status **N**: proposed local `legal.terms` row `{version, acceptedAt, surface, appVersion, textSha256}` (legal-consent 3, design 2.2), uploaded at first sign-in with method `device_first_run`. Server side **B**: `policy_acceptances` is append-only (`policy_acceptances_guard`, `data_governance.sql:675`; writes revoked from the service role, `20261023010000`).

| # | Threat | Mitigation | Test |
|---|---|---|---|
| 6a | Row written without Yes and a tick (bug or UI race) | Written only by the Continue handler after Yes plus tick; No writes only `ageGate.stoppedAt` | unit: every other path leaves no `legal.terms` (legal-consent backlog) |
| 6b | The person edits their own record on the device | Accepted as unpreventable on a device they control. The record is evidence of their own act, never an access control | none |
| 6c | Backdated upload at 1.1 | Server keeps its own `accepted_at` next to `client_recorded_at`; refuses future times (built) and, new, times before that version's publication (CISO-15) | db: backdated before publication refused; backdated after accepted with both times kept |
| 6d | Text changed but version not bumped | `textSha256` of the rendered sentence; a content test pins the hash per version | unit |
| 6e | Record or its time in logs or analytics | Never logged (CPrivO-3) | unit: logger canary with the record |
| 6f | Restored to another phone or inherited on a shared iPad | Accepted; a second adult on a shared iPad uses the same app as the first (threat (c) in `security.md` 1) | none; residual |

**Residual.** A device record shows what the app recorded, not who tapped. Its weight is counsel's call (Q-B, Q-C in `legal-consent.md`).

## 3. 1.1 items (sign-in on)

### AX-10 Sign-in methods

Status: Apple, Google and email link plus code are built (`lib/auth/*`, `supabase/config.toml:59-75`), off in the store profiles.

| # | Threat | Mitigation | Test |
|---|---|---|---|
| 10a | Apple token replay | SHA-256 nonce to Apple, raw nonce to Supabase (IAM-R08); `apple-token` exchange (built: `supabase/functions/apple-token`) | unit: hashed nonce to Apple, raw to Supabase (auth lane matrix) |
| 10b | Google ID token replay with the nonce check skipped (L11) | Accepted for 1.1 with conditions (CISO-8): our client ids only in the provider's list; the ID token is never logged, stored or sent anywhere but `signInWithIdToken`; Google signed out right after (`google.ts:63`) | unit: new `auth-google.test.ts`; log canary over the adapter |
| 10c | Email code guessed by an attacker spread over many addresses | Server limits are per IP (`token_verifications = 30` per 5 minutes, `config.toml`); the 5-wrong-codes pause is client memory only (BL-477) and is not a control. Code length per CISO-9 | auth: count wrong tries before the code stops working; config test on `otp_length` |
| 10d | Account enumeration through sign-in responses | Same answer for known and unknown addresses (IAM-R09) | auth: identical response shape for both |
| 10e | Link token in a custom scheme | Universal link `https://.../auth/callback` only, PKCE, pending request on this phone (ADR 0023) | built tests; device 11.10 still owed |
| 10f | Automatic identity linking joins a Google identity to an email account | Only on a provider-verified email; an `identity_linked` email goes out (on in `config.toml`) | auth: link email sent on link |

### AX-11 Account takeover through email (A4, A1)

Who controls the inbox controls the account: there is no password and no second factor (D-054, IAM-R06).

| # | Effect | Mitigation | Test |
|---|---|---|---|
| 11a | Attacker pulls every synced letter, including raw transcripts (L4) | New-sign-in email on every new device (BL-361, F02-REQ-017; template built, no sender); "Sign out on every device" (global scope; today only `others`, IAM-R12); session inactivity timeout (CISO-11) | fn: sender fires within 2 minutes p95 of a new device's first session; unit: global sign-out row |
| 11b | **Persistence:** attacker invites a second account of theirs as co-parent; it survives the victim's sign-out | `undo_parent_join` allows the inviter to undo within 72 hours (built); after that only the support runbook. Gate for co-parent in 1.1: a "someone joined your book" email to every parent at join, naming the 72-hour undo (no template exists today) (CISO-10) | fn: email on `accept_child_invite`; db: undo inside and outside 72 h (exists) |
| 11c | Attacker schedules account deletion | Reauthentication code by email, 30-day grace, scheduled email, Cancel (built) | existing deletion tests |
| 11d | Attacker deletes our emails before the parent reads them | Partly answered by an iPhone mail notification arriving first; the phone itself shows nothing (no push) | none; residual |

**Residual.** Losing the inbox means losing the synced letters to whoever holds it, until the parent signs out every device. Carried by the parent; Help says the email account protects the book.

### AX-12 Restore hold (72 h or 24 h) and the Stop page

Status: server **B** (`20261023000000_backup_server.sql`, `escrow/restore.ts`); backup is off in every profile and is D-121 step (c), after sign-in. The Stop page and `account-stop` function are **N** (`backup_svc_stop` exists; no function folder). Hold per CISO-2; no passkey shortcut per CISO-3.

| # | Threat | Mitigation | Test |
|---|---|---|---|
| 12a | Attacker with the inbox requests a restore and deletes the email | Hold; old-phone approval needs device authentication (CISO-1); new-sign-in email must be queued before release (F02-REQ-017); release email "We used your recovery key" (built) | fn: `escrow/test/restore.test.ts`; db: `audio_backup_escrow.test.mjs` |
| 12b | Mail scanners prefetch the Stop link | GET shows a page and changes nothing; only the button posts (NAQ-1, F08-U27b) | fn: GET leaves the request open |
| 12c | Stop page reveals whether an account exists | Unknown, used and expired tokens get the same answer (`backup_svc_stop` returns only `stopped:false`) | fn: same body and status for all three |
| 12d | Stop token reuse or guessing | Single use, hashed, expires; random 256-bit token [U length in code] | db: second use refused |
| 12e | Stop leaves sessions alive | Stop signs out every session; the database refuses the old token (`28000 session_ended`, restore.ts header) | fn |

**Residual.** If the attacker holds the inbox for the whole hold and the parent opens no enrolled device, the recordings are released after 24 or 72 hours. Stated in privacy policy section 4.

### AX-13 New-device email

| # | Threat | Requirement (CISO-13) |
|---|---|---|
| 13a | The email becomes a phishing template | No sign-in link and no code in it. One action: a single-use "Sign out every device" link built like the Stop token, plus "reply to us" |
| 13b | The email leaks where the person is | No IP location and no map. Time shown in the phone's time zone, sent with the request and not stored |
| 13c | Child or letter details in an inbox | No child name, no letter text (CATALOG E-1) |
| 13d | Too late to matter | Queued within 2 minutes p95; release of any recovery key waits for it (F02-REQ-017) |

Test: `packages/emails` render test with the Asha fixture asserting no `{child}` value and no `/auth/` link; fn test for the sender.

### AX-14 DMARC, SPF, DKIM, CAA

Read today through dns.google: `_dmarc` is `p=none; rua=mailto:hello@...; adkim=r; aspf=r`; root SPF `v=spf1 -all`; `send.` SPF `include:amazonses.com ~all`; **no CAA record**. SEC-R22 requires DMARC to move to `quarantine` then `reject`, and CAA. Threat: mail that looks like ours asks for a code (A7). Mitigations: every email already says "We will never ask for a sign-in code" (Stop template); founder DNS steps in CISO-10. Test: a read-only DNS check script that fails when DMARC is `none` after the agreed date or CAA is missing (handoff to `ops`, not yet).

### AX-15 Custom SMTP (Resend)

| # | Threat | Requirement (CISO-10) |
|---|---|---|
| 15a | Built-in sender caps at 2 an hour (Supabase rate-limits page): sign-in fails for families | Resend SMTP on before anyone outside the family signs in; `email_sent = 100` per hour (in `config.toml`; hosted value unread) |
| 15b | Sign-in codes readable in Resend's logs (kept 30 days) | No Resend connector attached to any session or scheduled task (SR-12); dashboard access is the founder's only |
| 15c | Click tracking rewrites sign-in links through a tracker | Click and open tracking off; a render test asserts every link host is the app's own domain |
| 15d | One attacker floods sign-in requests and uses up the project's hourly email budget | Per-address 60 s (`max_frequency`); an alert when the hourly cap is hit; CAPTCHA on the OTP request (TDD 04 3.1.4) [U on native support] |
| 15e | The SMTP key does more than send | A sending-only key for the one domain, stored only in the Supabase dashboard, with a row in `SECRETS.md` (SEC-R02, PR #562) |

### AX-16 Supabase session lifetime

Today: 15-minute access tokens, rotation on, reuse interval 10 s (`config.toml:41-43`). Supabase (read today): refresh tokens "never expire but can only be used once"; time-boxed sessions, inactivity timeout and single session per user are "Pro Plans and up". Threat: a session on a phone that was sold, given away or forgotten stays live for ever. Mitigations: inactivity timeout (CISO-11, FOUNDER for the plan); global sign-out row; new-device email. Single session per user is refused: a parent with an iPhone and an iPad needs two. Test: config test pinning `jwt_expiry = 900` and rotation; the founder's settings read-back for the timeout.

## 4. Summary of new tests (owner `security` with `qa` and `mobile`)

| Id | Test | Layer | Release |
|---|---|---|---|
| T-AX-01 | Root renders lock screen instead of routes; fail closed; held route replay | unit | 1 Dec |
| T-AX-02 | Cover on `inactive` with no animation | unit plus device | 1 Dec |
| T-AX-03 | Lock on forces name-free and re-plans pending reminders | unit | 1 Dec |
| T-AX-04 | Whole-store erase deletes and recreates database files; second database removed; no virtual table unlisted; `tmp` and `Caches` emptied | unit | 1 Dec (with P#520 or after it) |
| T-AX-05 | Export and Erase re-authenticate; export file name pattern; Files sharing keys absent | unit, config | 1 Dec |
| T-AX-06 | Agreement row only after Yes plus tick; never logged | unit | 1 Dec |
| T-AX-07 | Backdated `device_first_run` acceptance before publication refused | db | 1.1 |
| T-AX-08 | `auth-google.test.ts`; Google token never logged | unit | 1.1 |
| T-AX-09 | Wrong-code count before a code dies; same answer for known and unknown address | auth | 1.1 |
| T-AX-10 | New-device and co-parent-joined senders | fn | 1.1 |
| T-AX-11 | Stop endpoint GET is inert; same answer for unknown, used, expired | fn | step (c) |
| T-AX-12 | Email links point only at the app's domain; no child name | unit (`packages/emails`) | 1.1 |
| T-AX-13 | DNS read-back: DMARC policy, CAA present | script | 1.1 |
