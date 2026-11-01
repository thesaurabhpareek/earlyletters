# Privacy impact notes: 1 Dec account items and 1.1 sign-in

Owner: `security-architect`, working from the privacy engineer's `proposals/privacy-settings.md` and the CPrivO rulings (CPrivO-3 to CPrivO-7). Written 1 Nov 2026 against `origin/develop` at `b79982d0`. Companion to `threat-model.md` (rows AX-nn) and `ciso-rulings.md`.

**Nothing in `docs/legal/**` is edited here.** Every change to `DATA_CLASSIFICATION.md`, `privacy-policy.md` and `app-store-privacy-labels.md` below is proposed text for `legal` and the founder. Counsel must confirm every policy and label line (COUNSEL_PACKET Q54 for labels). `data-map.yaml` does not exist yet (DATA_CLASSIFICATION 6 item 7; PRIV-R01 `not yet: PDATA-05`), so section 4 gives the entries in PRIV-R01's fields, ready to paste when it does.

## 1. DATA_CLASSIFICATION rows needed

### 1.1 For 1 Dec (device only)

Section 4.5 (device settings, `scribe.db`):

| Element | Level | Note (proposed) | Source |
|---|---|---|---|
| `appLock.enabled`, `appLock.grace` | L2 | App lock on or off and the grace period. Stays on the phone, never sent | CPO-2, CISO-1 |
| `legal.terms` (`version`, `acceptedAt`, `surface`, `appVersion`, `textSha256`) | L2 | The Before you begin agreement. Never logged. Uploaded once at first sign-in as a `policy_acceptances` row (method `device_first_run`), then kept as the phone's copy | CPrivO-3, legal-consent 3 |
| `memories.enabled`; `memories.notToday.<date>` | L2 | Memory card switch and the per-date Not today flag (CR-43). No letter id in the key | CDesO-5, CR-43 |
| `erase.everything.pending`, `book.erasing.<book id>`, `book.deletedAt.<book id>` | L3 (key holds a book id) | Erase and book-delete progress marks (P#520). Removed when the erase finishes | P#520 |

Section 4.6 (files and system stores):

| Element | Level | Note (proposed) |
|---|---|---|
| Export ZIPs in app temp (existing row) | L4 | Add: "Includes held letters (PL-2). The file name holds the format id and a date, never a name. Swept at launch and on each Export visit" |
| App switcher snapshot (kept by iOS) | L4 when it shows content | "Not ours to delete. With the app lock on it shows only the cover (F17-REQ-009)" |
| Delivered and scheduled reminders (kept by iOS) | L2, L4 when names are on | "Names only when the parent turns them on, never with the app lock on (F17-REQ-015). Erase removes both" |
| Face ID or passcode check | none | "The app receives only success or failure from iOS. No biometric data reaches the app" |

### 1.2 For 1.1 (sign-in on)

| Element | Section | Level | Note (proposed) |
|---|---|---|---|
| `parent_profile` (device): `birthdayMonthDay`, `anniversaryMonthDay` | 4.5 | L3 | F8: month and day only, device only, owner only, removable, in Export and in Erase, never in notifications or email (CPrivO-7). If they ever sync: two `MM-DD` columns on `profiles`, owner-only, a new CPrivO ruling first |
| `account_sessions_seen` (planned table for the new-device email) | 4.3 | `device_id` L3, `profile_id` L3, `first_seen_at` L2, `last_seen_at` L2, `platform` L2 | No IP, no location, no device name. Deleted at account deletion, and a row 12 months after `last_seen_at`. Already named in labels 3.4 |
| `security_events` (SEC-R24, planned) | 4.3 | actor and target ids L3; action, time L2 | Content-free; 12 months (LEGAL-REQ-037) |
| `policy_acceptances.method` value `device_first_run` | 4.1 | L2 | Enum value added by migration; no new column |
| `profiles.welcome_sent_at` (if F10 needs a once-only mark) | 4.1 | L2 | Set when the welcome email is queued; deleted with the profile |
| `auth.sessions` | 4.2 | L4 (existing) | Add: "Supabase may also store the IP address and user agent of a session [U on the hosted version]; never copied into our tables" |
| Email provider (Resend) | 4.8 | L3 | Add: "Its message log holds sign-in codes and links for 30 days. No session or scheduled task may hold a Resend connector (SR-12)" |
| Phone time zone for email times | 4.8 | L2, not stored | "Sent with the request that triggers an email, used to render the time, not stored" (CISO-13) |
| EAS Update requests (1.0.x OTA, if used) | 4.8 | L3 request logs | "Expo sees an IP address, platform and runtime version per update check" (section 3) |

## 2. Privacy Policy lines that must change (proposed text only)

Against `docs/legal/privacy-policy.md` version 3.0.0. Each new line is a privacy claim and goes to `claims-registry.yaml` (LEGAL-REQ-044) before it ships.

| # | Where | Release | Today | Proposed |
|---|---|---|---|---|
| PP-1 | "Which builds of the app this covers", first bullet | 1 Dec | Build 1 and first store build lumped together | Add: "The first App Store build also has an optional app lock and Erase everything on this phone." |
| PP-2 | Section 2, "What we do not collect" | 1 Dec | No app lock line | Add: "If you turn on the app lock, your iPhone checks your Face ID or passcode. The app learns only whether it worked, and never receives your face data." |
| PP-3 | Section 7, opening italic line | 1 Dec | "everything is on your phone and you delete it there" | "In builds with servers off, everything is on your phone. Settings, Erase everything on this phone removes every book, letter, recording and setting from the app. It does not reach copies outside the app: an iPhone or computer backup made before you erased, or a copy you exported and saved somewhere else. Those stay until you delete them or the backup is replaced." |
| PP-4 | Section 7, export sentence | 1 Dec | "You can export your letters and the recordings on your phone at any time, free" | Add after it: "This includes letters waiting for Plus." (PL-2; only once its export test passes, CCO-12) |
| PP-5 | Section 2, "Your account" | 1.1 | "your name if Apple shares it" | "the name you give us, or that Apple or Google shares" (legal-consent 4; F3) |
| PP-6 | Section 2, "Your book" | 1.1 | none | "If you add them in Settings, your birthday and an anniversary (month and day only) are kept on your phone and used only to show you a question on those days. They are not sent to us." (F8, CPrivO-7) |
| PP-7 | Section 2, "Technical details" | 1.1 | none | "When you sign in on a new device, we keep a random ID for that device and when it was last used, so we can tell you about a sign-in you do not recognise. We do not keep its IP address or location for this." |
| PP-8 | Section 5, emails | 1.1 | "sign-in codes and deletion notices" | Add: "an email when your account is used on a new device; one welcome email when you first keep your book in your account" (F10; CLO-6 decides whether the welcome email is commercial, and if so it needs an unsubscribe line) |
| PP-9 | Section 6, Resend row | 1.1 | "Sends our emails" | "Sends our emails. It keeps a copy of each email, including sign-in codes, for 30 days." (auth-emails-profile 4) |
| PP-10 | Section 11, Security | 1.1 | No session line | Add: "Sign-in codes work once, for 15 minutes. You can sign out every device from Settings, Account." Add only if CISO-11 is bought: "A device that has not opened the app for 180 days is signed out." |
| PP-11 | Section 6, or a new line | 1.0.x, only if OTA ships | none | "App updates may be delivered by Expo, which sees your IP address and app version when the app checks for one." (CISO-12; PRIV-R12 vendor steps) |
| PP-12 | Section 4, hold sentence | step (c), no change needed now | "or three days if you have another device that uses backup" | Optional precision: "or three days if another of your devices has used backup in the last 90 days, including one you no longer have" (CISO-2; `backup_server.sql:84-88`) |

## 3. App Store privacy label, per release

Against `app-store-privacy-labels.md` 2.1.0 section 3.4. Apple, read 1 Nov in wave 2: data "processed only on device is not collected".

| Release | Label effect | Info.plist and manifest | Owner check |
|---|---|---|---|
| **1 Dec** (production profile, servers off) | **No change.** App lock, Erase, Export (user-initiated share), local reminders, memory card and the Plus line send nothing to us. The working default stays "Data Not Collected" (D-088, D-121 item 3), subject to counsel | Add `NSFaceIDUsageDescription` through the `expo-local-authentication` plugin with the counsel-approved string (LEGAL-REQ-007, CLO-4); update the permission-key list in `scripts/preflight-testflight.mjs`. Check the module's own privacy manifest for required-reason APIs [U] | CPrivO at submission; labels section 6 checklist |
| **1.0.x** with EAS Update | Arguably none (request data needed to serve the update, not kept by us); counsel to confirm. A new network host means PRIV-R12: data map, `subprocessors.md`, labels re-run | none | `legal`, counsel Q54 |
| **1.1** (sign-in on) | Label flips to collected: Contact Info, Name (optional name or provider name) and Email Address; Identifiers, User ID; User Content, Other User Content (synced letters); Sensitive Info (due date) when it syncs; Identifiers, Device ID once the new-device email ships (`account_sessions_seen`). Still No: Audio Data (backup off), Purchase History (no status report), Usage Data, Diagnostics. Profile dates stay device-only: no row (F8). If counsel classifies the welcome email as commercial, Email Address may also need "Developer's Advertising or Marketing" (F10, CLO-6) | Manifest `NSPrivacyCollectedDataTypes` equal to the label (PRIV-R18) | CPrivO, counsel Q54 |

## 4. Data map entries (PRIV-R01 fields)

| Element | Store | Level | Purpose | Retention | Deletion path | Leaves the phone | Release |
|---|---|---|---|---|---|---|---|
| App lock settings | `scribe.db` settings | L2 | Lock the app | While the app is installed | Erase everything | No | 1 Dec |
| Agreement record | `scribe.db` settings | L2 | Evidence of the Terms act | Until Erase; server copy 3 years after account deletion, pseudonymised | Erase (device); purge pipeline (server) | Once, at first sign-in | 1 Dec (device), 1.1 (upload) |
| Memory card flags | `scribe.db` settings | L2 | Not today and the switch | While installed | Erase | No | 1 Dec |
| Export ZIP | `Caches/exports`, then the parent's chosen place | L4 | Parent's own copy | Until the share sheet closes (ours) | Sweep at launch and visit; Erase | Only where the parent sends it | built; PL-2 1 Dec |
| Profile dates | `scribe.db` `parent_profile` | L3 | One card on the day | Until removed | Remove row; Erase | No | 1.1 |
| Devices seen | `account_sessions_seen` | L3 | New-device email | 12 months after last use | Account deletion cascade; daily sweep | Yes (server) | 1.1 |
| Security events | `security_events` | L3 | Detect takeover, audit | 12 months | Sweep | Yes (server) | 1.1 (SEC-R24) |
| Email log | Resend | L3 | Deliver email | 30 days | Provider | Yes (vendor) | 1.1 |
| Update check | Expo | L3 request | Deliver JS updates | Expo's terms [U] | n/a | Yes (vendor) | 1.0.x if OTA |

## 5. Open items for the privacy steward and counsel

1. P9 (`privacy-settings.md` 4) "Deleting the app removes its letters and recordings from this phone" stays true for content. The Keychain free-letter count survives deletion by design (D-083) [U on current iOS behaviour]; it holds no content.
2. The installed pack list reveals languages and survives Erase (F17 keeps packs). Say so on the Erase screen or add "and speech files" as an option: CPrivO to rule.
3. Whether a device-recorded agreement is valid evidence: counsel Q-B, Q-C.
4. Whether the welcome email is commercial: CLO-6.
