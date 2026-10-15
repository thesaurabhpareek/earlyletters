# Test evidence

One file per device session: `docs/qa/evidence/<YYYY-MM-DD>-<build>-<device>.md`, for example `2026-10-30-1.0.0(14)-se3.md`. Build is the marketing version and build number shown in Settings > About (or TestFlight). Device is a short tag: `se3`, `ip12`, `ip15`, `current`, `ipad`, `mac`, `win11`. A session that uses two phones at once (sign-in on a second phone, co-parent, sync, backup) is one file named after the first phone, with both phones in the header.

Rules (TDD 07 2.1, CLAUDE.md privacy rules, LEGAL-REQ-014):
- Only the fictional family appears in notes, numbers and screenshots (Asha, Avi, Mama, Papa). Never a real child's name, a real letter, a real email address or a sign-in code.
- Server-on rows add more things that never go in evidence: user ids, invite links or tokens, magic links, session or refresh tokens, Keychain item names or contents, key material, Supabase project keys, push tokens. Name accounts and phones by label instead (Account A, Account B; Phone A, Phone B) and keep the mapping in your own notes.
- Screenshots and screen recordings are **not** committed (COORDINATION section 8). Keep them in your own storage and write the file name in the Notes column.
- Numbers keep their unit (s, ms, MB, %; iOS reports no temperature, so write the thermal state: nominal, fair, serious, critical).
- A failure gets a GitHub issue labelled `beta` and `S0` to `S3` (TDD 07 11.3); write the issue number in the row. Issues never contain letter text either.
- Run sheets for scripted sessions live in `docs/qa/run-sheets/`; the evidence file names the run sheet it followed.

## Template (copy into the new file)

```markdown
# Device session <YYYY-MM-DD>, build <x.y.z (n)>, <device tag>

Tester: <initials>. Run sheet: <docs/qa/run-sheets/... or none>.
Phone A: <tag, model, iOS, storage free>. Phone B: <tag, model, iOS, storage free, or none>.
Builds: <EAS development | preview | TestFlight, build number, profile> per phone.
Server switch: <off | on> (`EXPO_PUBLIC_SERVER_FEATURES` in the build's profile). Backend: <none | staging | production>.
Apple Accounts: Phone A on <Account A>, Phone B on <Account A | Account B>. iCloud Keychain: <on | off> per phone. Sandbox testers used: <labels only>.
Settings during the session: Dark <on/off>, text size <default/AX5>, Low Power <on/off>, network <Wi-Fi/cellular/offline>.

| ID | Result (pass, fail, blocked, n/a) | Numbers | Notes and issue | Owner doc updated? |
|---|---|---|---|---|
| S1-01 | | | | |
```

## Server-on rows (M14)

PRD V2 turned sign-in, sync, co-parent sharing and the owner's backup on for v1.0 (M14, M16). These rows need a build made with the server switch on and a backend; a build with the switch off shows "coming soon" for them, so record `blocked` with the reason "switch off" rather than `fail`. Each row must carry the numbers below; a row without them is not evidence.

| ID | Build and backend | Phones and accounts | Numbers the row must carry | Pass needs | Owner doc |
|---|---|---|---|---|---|
| S1-06 Sign in with Apple | Switch on; staging | Phone A on Account A ("Share My Email"); a second Apple Account for "Hide My Email" | Seconds from the Apple sheet closing to signed in, 3 tries each (a smoke; the gate is 06-nfr's lab run, 50 runs, p90 3 s, A-NFR-004); Terms sheet shown on first sign-in (yes, no) and on the second (must be no); relay email arrived (yes, no, minutes) | Identity listed in Supabase Users (write "listed", never the id); no Terms sheet on the second sign-in | `docs/ops/AUTH_SETUP.md` 11.1 |
| S1-07 Sign in with Google | Switch on; staging; both Google client ids in the build | Phone A | Seconds to signed in, 3 tries; button present (yes, no) | Identity listed; no nonce error | AUTH_SETUP 11.2 |
| S1-08 Email link and code | Switch on; staging; AASA live (P-05) | Phone A; a laptop | One line per mail app (iOS Mail, Gmail, Outlook, Messages forward): opened the app (yes, no), signed in (yes, no); email arrival seconds (06-nfr gate: p90 30 s over 50 sends, A-NFR-004); code typed by hand works; expired link message seen; laptop page signs nothing in | Every mail app opens the app; no click-tracking redirect in the link | AUTH_SETUP 11.3, 11.4, section 6 assumption |
| S1-09 Universal links for invites | Switch on; staging; AASA on Apple's CDN | Phone A on Account A invites; Phone B on Account B joins | Cases (a) to (d) each pass or fail; cold and warm open; the `/i/` page shows no child name (yes, no); after an 18+ No, invite dropped (yes, no) | All four cases; no clipboard read without a tap | AUTH_SETUP 11.5; `docs/ops/DOMAINS.md` |
| S1-22 Co-parent sync | Switch on; staging | Phone A on Account A (Mama), Phone B on Account B (Papa); two Apple Accounts, not one | 10 timings in s from the save tap on A to the row on B, both in the foreground with the book open, with the slowest (PRD V2 06-nfr section 4: p95 30 s, p99 60 s; this replaced PRD 1.3's 5 s); offline queue: letters saved offline 2, after kill 2, after reconnect on B 2; raw transcript or private letter visible on B (must be no) | No timing over 30 s in 10 (a 10-run smoke, not the p95 gate); zero lost; nothing private crosses | PRD V2 06-nfr sync budget; F16; TDD 02 |
| B1-01 Backup spike (WP-F08-B1) | Spike build from S05's `scribe-keys` spike branch (development client); staging Storage bucket for the upload | Phone A and Phone B on **one** Apple Account, iCloud Keychain on both | Keychain item: made on A at hh:mm, seen on B at hh:mm (minutes; F08 A2 assumes 2 or less); deleted on A, gone from B (yes, no, minutes); 15 MB encrypt time on SE 3 in s (F08 budget 1 s per 10 MB); upload resumed after a kill (yes, no; parts re-sent); HPKE on iOS 17 (yes, no, or "not measured: no iOS 17 phone") | Item syncs and deletes both ways; upload resumes from the last finished part | F08 sections 6.5 and 11.2, A2; ADR for owner backup (T13) |

Related server-on rows in Part 2 of the plan use the same header fields: S2-13 account deletion (switch on; staging) and S2-14 sign out and Apple revocation (switch on).

The item IDs, steps and expected results are in `docs/qa/DEVICE_TEST_PLAN.md`. When an item changes a fact in another document (a measured speed, a confirmed setting), update that document in the same pull request and tick the last column.
