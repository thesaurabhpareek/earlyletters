# Function review: risk and security (RSK, SEC)

Owner: `security-architect` (identity and security steward), also covering enterprise risk. Backlog row BL-999. Written 20 Nov 2026 under `docs/product/prd/functions/BRIEF.md`.

Who wrote this: a Claude session playing the security and risk role. It is not a licensed auditor, penetration tester or lawyer. Every legal reading below says "counsel must confirm". Nothing here was run on a phone or against a live service. All test families in this file use the fictional family Asha.

---

## 1. What I reviewed, and what I did not

### Read this session

| Source | Head or version |
|---|---|
| `docs/product/prd/00` to `12`, `14`, `16`, `18`, `GAP-LOG.md`, `functions/BRIEF.md` | branch `docs/locked-pack-inputs-20nov` at `7d0446d02` |
| `docs/product/prd/19-from-download-to-first-letter.md` (NS-38 to NS-44 acceptance rows, NS-41 threats, open items O-5, O-6, O-7, O-20, O-21) and `docs/product/prd/inputs/first-run-auth-security.md` (all of it) | the branch moved while I worked; both landed by `6285ab346`. Card 19 was also being edited in the shared worktree (uncommitted); I read that working copy, in which NS-45 has no section yet |
| `docs/BACKLOG.md` BL-922 to BL-999 (BL-959, BL-961, BL-962, BL-994 to BL-999 read in full) | same head |
| `docs/engineering/eval-20nov/C-platform-quality-delivery.md` sections 1.2 to 1.4 (trust boundaries TB1 to TB8, ADR list 0029 to 0039), 2 and 3 | `origin/docs/eng-eval-20nov` at `6c0119199` |
| `docs/design/e2e/{A,B,C,D,E}*/DESIGN.md` (screen inventories, security-relevant journeys J-E17, J-E21, J-E23, J-C01, J-D01) and `docs/design/system/COMPONENTS.md` (`GlassSurface`, native modules) | `origin/docs/e2e-ux-20nov` at `f3063ed81` |
| Code: `apps/mobile/src/lib/first-run/gate.logic.ts`, `use-first-run-route.ts`, `lib/sync/ownership.ts`, `lib/sync/index.ts`, `lib/store.ts:311-313`, `lib/app-lock/machine.ts`, `prefs.ts`, `controller.ts`, `lib/auth/reauth.logic.ts`, `lib/family/invite-link.logic.ts`, `packages/api/src/server/family.ts`, `packages/api/src/keys.ts`, `supabase/config.toml` (auth section), `supabase/migrations/20261028010000_invite_redeem_by_code.sql`, `20261015020000_v1_gate_coparent_invites_undo.sql` (limits), `supabase/functions/invite-redeem/handler.ts`, `apps/mobile/package.json`, `package-lock.json` (expo-glass-effect entry), `apps/mobile/modules/*` | `7d0446d02` |
| Standards: `docs/engineering/05-identity-and-access.md` (IAM), `06-security-engineering.md` (SEC), `.claude/skills/early-letters-ciso/SKILL.md`, `docs/legal/COUNSEL_PACKET.md` 1.5.0 (question index), `docs/security/REVIEW_R17_CHECKLIST.md` status table, `docs/ops/runbooks/` listing | `7d0446d02` |

Outside sources read this session (20 Nov 2026):
- Apple, `UNNotificationCategory.hiddenPreviewsBodyPlaceholder`: "The placeholder text to display when the system disables notification previews for the app." https://developer.apple.com/tutorials/data/documentation/usernotifications/unnotificationcategory/hiddenpreviewsbodyplaceholder.md (read 20 Nov 2026).
- OWASP MAS, MASWE-0029 "Step-Up Authentication Not Implemented After Login": the user asking for "an action that is considered sensitive" is "required to provide additional information to authenticate their identity". The page marks itself a placeholder in beta and maps to no MASVS control. https://mas.owasp.org/MASWE/MASVS-AUTH/MASWE-0029/ (read 20 Nov 2026).

### Not read, or not available

- When I started, card 19 and `inputs/first-run-auth-security.md` were not on the branch; both arrived during this review. I build on the input and do not repeat it: its auth journey (section 1), rate limits (2.1), enumeration (2.2), code brute force (2.3), bot limits (2.4), session theft (2.7), invite abuse (2.8), deep links (2.9), logging (2.10), validation (3), failure states F1 to F40 and gaps G1 to G20 stand as written. Where I add or differ, the row says so and cites the G id.
- NS-45 (sign-out, deletion, session end, app update) had no section in the copy I read. Its verdict is "missing (not written yet)".
- The OWASP MASVS-AUTH page (mas.owasp.org/MASVS/06-MASVS-AUTH/) was blocked by the session's permission step. I quote no MASVS control text.
- The open threat-model draft (PR #342) and PR #35 (`SECURITY.md`, `docs/ops/INCIDENT.md`): not on this branch; not read.
- Hosted Supabase settings (rate limits, SMTP, CAPTCHA): not read. The `config.toml` values below are the local stack; the hosted project may differ (UNVERIFIED).
- Apple App Review Guidelines: not re-read this session. Apple facts quoted from `16-council-review-round-2.md` section 6 (Karma read them 20 Nov) are marked "per 16 s6, UNVERIFIED this session".
- Law (California Civil Code 1798.82, FTC HBNR 16 CFR 318): not re-read this session. UNVERIFIED; counsel must confirm.

---

## 2. Coverage verdict per card (security and risk lens)

"Covered" means the card names the threat, a control and a test. "Partly" means one of those is missing or the control does not hold in today's code. The `[X4-R1]` cite counts as "partly" everywhere until the defect in section 5 is fixed, because the test it names does not exist yet (grep for `X4-R1` under `apps`, `packages`, `scripts`, `supabase`: 0 files).

| Card | Verdict | Why (TB = trust boundary in eval C section 1.2) |
|---|---|---|
| NS-01 Photo | partly | Strong threat table (TB1 switcher, picker temp copies R52, metadata 0). Relies on `[X4-R1]` (R29) which today fails: see section 5 (TB4). Native module intake named (R22) but no package-intake check exists (FR-SEC-14) |
| NS-02 Find | partly | R24 cites `[X4-R1]`; the index lives in `scribe.db` with every account's rows (TB4). No row says a query string never reaches a log (TB8): FR-SEC-18 |
| NS-03 Pilot | covered | No build; X2 gate for voice leaving the phone; D4, D5 |
| NS-04 Spike | covered | Spike only; names a `security-architect` read of the plist delta |
| NS-05 Share L1 | covered | Preview of exact text, picture off by default, 0 metadata (R5b, R6b), temp sweep, no audio (R16a). Residual: a send is irreversible (RSK-23) |
| NS-06 A Firsts | covered | TB5 trigger tuple and `book_entries`; label guard |
| NS-06 B Seals | partly | Server clock only (good); author-only read clause. Watermark fix E3 not yet in the card body. The seal is not a confidentiality control on the author's own phone: the card already forbids "secure" and "locked" claims (good) |
| NS-06 C Quick capture | partly | Lock-screen doorways (TB1). App lock applies (step 3). Missing: a row that no widget, control or Siri phrase ever shows a child name or letter words, whatever "Names in notifications" says (FR-SEC-21) |
| NS-07 C5, G11 | covered | Quiet marks `inBook: false`; G11 label guard owned by `security-architect` and `compliance-engineer` |
| NS-07 C28 Print | partly | Temp PDF deleted (C28-12). Same whole-book exit as NS-11 with no owner check unless App lock is on (FR-SEC-06) |
| NS-08 Backup (stay off) | covered | Flip needs a security read, counsel, a drill |
| NS-09 Let it go | covered | D7 and E8 (server purge in the acknowledging call) |
| NS-10 New phone | partly | E9: decline rule enforced only on the phone; claim screen; second-account rows depend on `[X4-R1]` |
| NS-11 Save a copy | partly | Temp ZIP and file name covered. Missing: the whole book (letters, voices, pictures, child name and dates) leaves in one unencrypted file with an owner check only when App lock is on (`confirmForExport`, C-S04 step 3); no line tells the parent that anyone with the file can read it (FR-SEC-06, FR-SEC-08) |
| NS-12 Earlier versions | covered | Author-only read RPC (TB5); needs the deny cells in the access matrix (IAM-R24) in the same PR |
| NS-13 Reminders | covered | Names off by default, off under App lock, sign-out clears (R13, R14 not built yet, P0) |
| NS-14 Whose book | covered | Second account resets selection (A-U31) |
| NS-15 Another day | covered | Local dates; D1 |
| NS-16 From name | covered | D9; X4 |
| NS-17 Second language | partly | E7: withheld words remain in the server copy until a new migration ships (TB2) |
| NS-18 Typed days | covered | Words hidden by default on the lock screen (R3) |
| NS-19 Add more | covered | No new boundary |
| NS-20 Two books | covered (parked) | Not built; threats "n/a until decided". When built it needs a per-book role check on both books (IAM-R02) |
| NS-21 to NS-24 | covered | NS-23-R11 snapshot; NS-24 skips private letters of any author (E15) |
| NS-25 Other parent | partly | Token hashed, single use, 7 days, peek needs sign-in, 72-hour undo. Missing: the inviter is not told at once that someone joined, so a forwarded link that reaches the wrong adult is found only by chance inside the 72 hours (FR-SEC-09); ex-partner removal waits on Q50 and Q53 |
| NS-26 to NS-31 | covered (parked) | Each names a security read and counsel read as a gate |
| NS-32 Notification budget | covered | Placeholder for hidden previews; one planner |
| NS-33, NS-34, NS-37 | covered | No new boundary |
| NS-35 Only Home starts | covered | Matches SEC-R17 |
| NS-36 Data follows the letter | covered | L3 ids (BL-959), erase row |
| NS-38 App Store page | covered | R4 label matches the build; demo reviewer account needs FR-SEC-26 |
| NS-39 First launch | covered | R9 removes the lock offer from the end of first run (I agree; FR-SEC-07 moves the offer to the sign-out sheet) |
| NS-40 Age and region | covered | R8 ends the session on No; the 18+ answer is an attestation (residual, TDD 04) |
| NS-41 Sign up and sign in | covered | R1 to R25 carry the input's controls; R6 states X4 for sign-in. R6 will fail on today's code (section 5); FR-SEC-02 adds the silent sync stop for B's own letters, which R6 does not name. O-6, O-7, O-21 open |
| NS-42 Agreements | covered | R16 "Not now records nothing"; consent enforced in the database (IAM-R03) |
| NS-43 First book | covered | No new boundary; R10 keeps the lock offer off first Home |
| NS-44 First letter | covered | No new boundary |
| NS-45 After: sign-out, delete, session end, update | missing | No section yet. Needs FR-SEC-06, FR-SEC-07, the input's G5 (deletion notice email) and G15, and the D1 sheet |

---

## 3. Function requirements

Priority: P0 only with an RR-4 reason: (a) promise, (b) legal or store, (c) core loop. Owner lanes are agent handles.

### 3.1 Second account on one phone (the live defect; detail in section 5)

These build on the input's G1 and NS-41-R6; they add the code-level conditions a test must pin.

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-SEC-01 | Given a phone whose sync owner is account A with A's book on it, When account B is signed in and the first-run gate runs, Then `hasLocalBook` counts only books B may open, the gate never returns `openTonight` on A's book, and B lands on E-S18 routing (B's book arrives, or "No book here yet") | `[X4-R1]`, NS-41-R6, NS-01-R29, NS-02-R24, NS-25-R19, J-E17, E-S18, BL-961, ADR 0031, input G1 | P0 (a) | mobile | `use-first-run-route.ts:131` computes `hasLocalBook` from `listChildren()`, which is `children.listVisible` (`store.ts:311-313`) with no owner filter; `gate.logic.ts:123-125` then opens it for any session |
| FR-SEC-02 | Given B signed in on a phone A owns, When B keeps a letter, Then the letter goes into a book B owns, and either it syncs or B sees one SystemLine (E-S15) saying it stays on this phone; sync never stops without a word | J-E17, E-S15, BL-961, ADR 0031 | P0 (a) | mobile, data-architect | `ownership.ts:49` throws `AccountMismatchError`; `sync/index.ts:180` records `mismatchUser` and stops; nothing in the gate tells B |
| FR-SEC-03 | Given A's book is hidden from B, Then none of A's data reaches B by any path: Home, waiting cards, Book, Find (FTS rows), Read together, Read the year back, Save a copy, the printable book, Storage per-book lines, the slip registry, reminders and planned notifications, quick-capture doorways, the active-book setting | J-E17 step 3, NS-02-R24, NS-13-R13, NS-11-R22, A-U31 | P0 (a) | mobile, qa | One `[X4-R1]` integration test with two seeded Asha accounts, one assertion per surface Superseded in part by FR-SEC-34 on 20 Nov. |
| FR-SEC-04 | Given A's book is hidden after B signed in, When anyone opens the app, Then A's book opens again only when A signs in, or is removed by Erase everything; no screen names A or says another book exists | J-E17, C-S19, E-S18, ADR 0031 | P0 (a) | mobile | Design decision recorded in area C (C-S02 note: no neutral line, it would disclose A) |
| FR-SEC-05 | Given a phone with local books and no owner, When anyone signs in and taps "Keep in this account" on E-S24, Then the screen first names how many books will move to that account | E-S24, NS-41-R5, NS-10-R5 | P1 | mobile, content | NS-41-R5 already requires the tap and the masked address; `ownership.ts:47-60` then claims every `server_state = 'local'` book. Adds only the count, so a person signing in on someone else's phone sees what they are about to take |

### 3.2 Step-up checks, warnings and lock-screen privacy

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-SEC-06 | Given the phone has a passcode, When a person taps Erase everything (C-S19.confirm), Then the system owner check (Face ID, Touch ID or passcode) runs before the erase, whether or not App lock is on; a cancelled check changes nothing. Without a passcode, the existing confirm runs alone | C-S19, D1, NS-36 erase row, NS-45 | P1 | mobile | Today only App lock calls `authenticateAsync` (`app-lock/controller.ts:106`). Erase has no undo, and on a signed-out phone with backup off it removes the only copy of the voice. MASWE-0029 (read 20 Nov). This is a phone-side check, not a sign-in, so it does not add the friction the input's G5 warns about for deletion |
| FR-SEC-07 | Given App lock is off, When the sign-out sheet (C-S03) opens, Then it offers "Turn on App lock" as a secondary action under the D1 lines | C-S03, D1, E-S22 | P1 | mobile, content | D1 line says "Anyone who opens the app here can read them"; the only controls against that are App lock and Erase |
| FR-SEC-08 | Given a copy or printable book is ready (C-S04.ready, C-S05.ready), Then one line says the file is not locked and anyone who has it can read every letter and hear every recording in it | C-S04, C-S05, NS-11, NS-07 C28 | P1 | content | The ZIP is unencrypted by design (open formats, NS-11); honesty about what a file can do |
| FR-SEC-21 | Given any quick-capture doorway (widget, Control Center control, Action Button, Siri phrase) or notification category, Then it shows no child name and no letter words, whatever the names setting says, and every category sets `hiddenPreviewsBodyPlaceholder` to a neutral line | NS-06 C, A-S14, D-S10, NS-32-R12 | P0 (a) | mobile | Frame guardrail "zero child names on a lock screen by default"; Apple doc read 20 Nov |
| FR-SEC-22 | Given any screen that shows L4 data (Review editor, letter page, Find results, Save a copy preview, share preview, earlier versions), When the app goes inactive, Then the switcher snapshot is blank, whether or not App lock is on | E18, NS-01-R13a, NS-23-R11, E-S22 | P0 (a) | mobile | E18 rules one blank-snapshot rule; today's tests name pictures and the Home fragment only Superseded in part by FR-SEC-33 on 20 Nov. |

### 3.3 Fraud and abuse

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-SEC-09 | Given an invite is accepted, When the inviter next opens the app, Then a line on the Family page (D-S18.undo-open) names who joined (their sign-off) and offers Undo for the rest of the 72 hours | NS-25-R4, D-S18, D-S19 | P1 | mobile, content | A forwarded link joins whoever opens it first, with the book's whole history (NS-25 threat table) |
| FR-SEC-10 | Given typed-code failures reach the global brake (1,000 an hour), Then a content-free security event is written and `ops` is alerted, and links (token path) keep working | NS-25, D-S16, SEC-R24 | P1 | security, ops | `20261028010000_invite_redeem_by_code.sql:78-124`; `handler.ts:166` answers `codes_paused` to everyone. A low-cost way to block every family's code join |
| FR-SEC-11 | Given the input's G3 and card open item O-7 (bot check and quota alert), Then the sending domain's DMARC reports are read weekly while email sign-in is public, and a rise in bounces or complaints is treated as abuse of the sign-in form (SEC-R22) | E-S05, NS-41-R21, O-7, input G3 | P2 | ops | Adds only the reputation side: flooding mails strangers from our domain. I agree with the O-7 default (Turnstile before the public link) |
| FR-SEC-12 | Adopt the input's G6 ("New sign-in to your book" email) and G5 (email on deletion request and on cancel) as NS-45 rows; no new requirement here | NS-45, C-S02, C-S20, input G5, G6 | P1 | product, security | Avoids a second wording of the same control |
| FR-SEC-23 | Given scraping of public pages, Then the invite page (D-S14) and every public route show no child name, letter or inviter email, and the token stays in the fragment | D-S14, NS-25-R6 | P0 (a) | mobile, ops | `invite-link.logic.ts` header; regression test only |

### 3.4 Keys, secrets, supply chain, and additions to the first-run input (NS-38 to NS-45)

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-SEC-14 | Given a PR adds a native dependency (an npm package with iOS code, a local Expo module under `apps/mobile/modules`, a widget or App Intents target), Then it is its own PR with the lockfile diff, a licence row (SEC-R07 allowlist), the `Info.plist`, entitlement and privacy-manifest diff, and a `security-architect` review; it adds no network, analytics or crash SDK | NS-01 (`scribe-photo`), NS-06 C, ADR 0039 native prop, COMPONENTS R2 (Switch Control module), SEC-R06, SEC-R07 | P1 | security | SEC-R07 licence check is "not yet"; five local modules exist today (`scribe-audio`, `-files`, `-keys`, `-photo`, `-store`) |
| FR-SEC-15 | Given `expo-glass-effect`, Then `GlassSurface` is its only importer (lint ban, as for `expo-blur`), it renders no L4 text into a system surface, and its version moves only with the Expo SDK group (SEC-R09) | design system COMPONENTS `GlassSurface`, DS2-07 | P2 | design-systems, security | Lockfile: `expo-glass-effect` 57.0.4, licence MIT (`package-lock.json:7558-7562`); already a dependency (`apps/mobile/package.json:34`) |
| FR-SEC-16 | Given the signed remote config, Then a valid signature can only hide a surface, stop a write, or raise `forceReauthEpoch`; it can never turn a feature on, stop export, or delete local data; a test feeds a validly signed hostile payload and asserts that | ADR 0029 rule 7, E21, J-E21, LEGAL-REQ-040 | P0 (a) | mobile, security | `packages/api/src/keys.ts:20-23` trusts two keys for `remote-config`; a stolen signing key is bounded only by what the app accepts |
| FR-SEC-17 | Given the pack adds no secret, Then no card's flag needs a new secret before its gate; any that later does (APNs key for NS-26, hosted links for NS-28, recording sound for NS-05 Level 2 or 3) gets a `docs/ops/SECRETS.md` row and a threat-model row first | SEC-R01, SEC-R02, NS-05, NS-26, NS-28 | P1 | security, ops | `docs/ops/SECRETS.md` does not exist on this head (SEC-R02 not yet) |
| FR-SEC-18 | Given Find, From name, Firsts labels, typed days and photo paths, Then no query, label, name or file path appears in a log, crash report or analytics event; the J-N18 canary covers each new path | NS-02, NS-16, NS-06 A, NS-18, NS-01, TB8 | P0 (a) | privacy, qa | CLAUDE.md privacy rules; eval C TB8 Superseded in part by FR-PRV-45 (privacy.md) on 20 Nov. |
| FR-SEC-19 | Given each new surface in the pack (picker, Find, share, seal pull clause, earlier-versions RPC, doorways, print), Then a threat-model row exists (SEC-R01) before its flag turns on in `preview` | all cards with a surface; ADR 0029 G6 | P1 | security | SEC-R01 "not yet": `docs/security/threat-model.md` is not on this head |
| FR-SEC-20 | Given new server acts (Open now on a seal, removing an earlier version, invite brake trips, epoch raises), Then each writes a content-free security event (SEC-R24) | NS-06 B, NS-12, NS-25, J-E21 | P2 | data-architect | No `security_events` table in `supabase/migrations` (grep) |
| FR-SEC-24 | O-6 (code length): I agree with the default (8 digits, 900 s, the app length set in the same release, `token_verifications` lowered) and ask that NS-41-R10 also check the Notes for Review sentence | NS-41-R9, R10, O-6, input G2 | P0 (b) | security-architect, founder (dashboard) | Input 2.3: about 1 in 11,000 per IP per code life at 6 digits |
| FR-SEC-25 | Given NS-39-R9 removes the lock offer from first run, Then App lock is offered only in Me and on the sign-out sheet (FR-SEC-07), never in front of first Home (NS-43-R10) | NS-39-R9, NS-43-R10, E-S22, C-S03 | P1 | mobile | `onboarding.tsx:577-579` mounts `<LockOffer />` today (card 19 line 331) |
| FR-SEC-26 | Given the App Review demo sign-in, Then the reviewer account holds only the Asha book and is not a founder or family account, and its credentials live outside the repo | `proposals/app-review-demo-signin.md` (project doc, not read here) | P0 (b) | ops | D13; SEC-R03 |

### 3.5 Risk management requirements

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-RSK-01 | Given a release candidate, Then the gate record (`docs/release/gates/<version>-rc<n>.md`, ADR 0029) has one row per open register entry in section 4 scored 12 or more, with its status and a named owner; an entry at 16 or more with no control in place blocks the candidate unless the founder signs the residual | eval C 2.3, `14-test-plan.md:98` | P1 | security | This file, section 4 |
| FR-RSK-02 | Given any incident where letters, voices, pictures or a child's details may have reached the wrong person, Then the runbook `suspected-data-leak.md` runs, times are recorded from the first report, and counsel is asked about notice clocks the same day | Q28, Q23, SEC-R05, SEC-R23 | P0 (b) | ops, legal | Runbook exists (`docs/ops/runbooks/suspected-data-leak.md`); `SECURITY.md` and `docs/ops/INCIDENT.md` do not exist on this head |
| FR-RSK-03 | Given any public sentence about safety (store listing, website, in-app), Then it makes no claim of "secure", "encrypted", "locked" or "private" that a test in this pack does not prove, and each has a claims-inventory row | frame "Claims", NS-06 B content rule | P0 (b) | content, compliance | The seal and App lock are the likely places for drift |
| FR-RSK-04 | Given no person outside the founding family stores letters on the server, Then the R-17 review passes (section 9 signed) before NS-25 or any server-on store build ships | R-17 checklist, D-100, NS-25 gates | P0 (b) | security, founder | `REVIEW_R17_CHECKLIST.md`: sign-off "not started" |
| FR-RSK-05 | Given cost abuse (sign-in email, invite redemption, Edge Function calls), Then usage alerts exist at 80 percent of each free-tier or plan limit and reach `ops` | FR-SEC-10, FR-SEC-11, `docs/ops/runbooks/free-tier-ops.md` | P1 | ops | Limits read from local config only Superseded in part by FR-RSK-07 on 20 Nov. |
| FR-RSK-06 | Given a kill switch per surface (ADR 0029), Then each card's switch is tested in `.killSwitch` state to hide the surface and never delete data or stop export | E21, ADR 0029 rule 4 | P0 (a) | mobile, qa | eval C 2.2 |

---

## 4. Risk register across the pack

Scale: likelihood (L) and impact (I) 1 to 5; score = L x I. Impact 5 = a child's letters, voice or picture reach someone outside the family, or letters are lost with no copy. Scores are my judgement from the evidence named, not measurements.

| Id | Kind | Risk | L | I | Score | Owner | Mitigation (status) | Card rows |
|---|---|---|---|---|---|---|---|---|
| RSK-01 | Security, privacy | A second account signed in on a phone sees and can add to the first account's local book (live defect, section 5) | 3 | 5 | 15 | mobile | FR-SEC-01 to 04, ADR 0031, BL-961 (ready, not built) | X4-R1, NS-01-R29, NS-02-R24, NS-25-R19, NS-13-R13 |
| RSK-02 | Privacy | A signed-out book is readable by anyone who opens the app on that phone (D1, accepted) | 3 | 4 | 12 | founder (accepted D1) | D1 sheet line, App lock offer at sign-out (FR-SEC-07), Erase everything | D1, NS-08-R6 |
| RSK-03 | Privacy, reputational | A child's name or letter words on a lock screen, widget or app-switcher snapshot | 2 | 4 | 8 | mobile | Names off by default; placeholder; blank snapshot; FR-SEC-21, 22 | NS-13-R6a/b, NS-18-R3, NS-32-R12, NS-23-R11, NS-01-R13a |
| RSK-04 | Security, privacy | Someone holding an unlocked phone saves the whole book to their own Files or AirDrop | 2 | 5 | 10 | mobile | Owner check only with App lock (built); FR-SEC-08 warning; founder Q-S2 | NS-11, NS-07 C28 |
| RSK-05 | Operational, abuse | Someone holding the phone erases the only copy (no undo), or asks to delete the account (30-day undo, input 1.7) | 2 | 5 | 10 | mobile | Confirm sheets (built); FR-SEC-06 owner check on Erase; G5 email on deletion request | D1, D6, C-S19, C-S20, NS-45 |
| RSK-06 | Abuse | A forwarded invite link joins the wrong adult with the whole book's history | 2 | 5 | 10 | mobile | Hashed single-use token, 7 days, peek needs sign-in, 72-hour undo (built); FR-SEC-09 | NS-25-R2, R4, R6, R18 |
| RSK-07 | Abuse, operational | An ex-partner co-parent keeps reading after separation; removal only within 72 hours | 3 | 4 | 12 | legal, support | Private letters; support runbook; Q50, Q53 open | NS-25 threat table |
| RSK-08 | Abuse, availability | Code brute force pauses all code joins (global brake) | 2 | 2 | 4 | security | 40-bit codes, per-person, device, IP limits (built); FR-SEC-10 | NS-25 |
| RSK-09 | Abuse, financial, reputational | Sign-in email flooding exhausts the project quota and mails strangers from our domain | 2 | 3 | 6 | ops | Per-address 60 s, per-IP limits; NS-41-R21 keeps Apple open; O-7 Turnstile; FR-SEC-11 | NS-41, E-S05 |
| RSK-10 | Security | Account takeover through a parent's mailbox, a guessed code, or a stolen session reads the synced book | 2 | 5 | 10 | security | Input 2.7 controls (Keychain this device only, 15-minute JWT, rotation, Sign out other devices); O-6 8-digit codes; O-21 password path test; G6 new sign-in email | NS-41-R9, R10, R19, R23 |
| RSK-11 | Security | A stolen remote-config signing key signs everyone out or hides features | 1 | 3 | 3 | founder, security | Remote config can only turn things off (ADR 0029 rule 7); FR-SEC-16; two keys for rotation (`keys.ts:20-23`) | J-E21, E21 |
| RSK-12 | Security, supply chain | A new native module or package brings a network call, a tracking SDK, a bad licence or a plist change | 2 | 4 | 8 | security | `npm ci`, committed lockfile (SEC-R06); FR-SEC-14; licence check "not yet" (SEC-R07) | NS-01, NS-06 C, ADR 0039 |
| RSK-13 | Privacy | Letter text reaches system intelligence or a system rewrite puts machine words in a letter | 2 | 4 | 8 | mobile | `[X6-R1]`, D2, D3, BL-962; a platform gap is a finding | X6-R1, all text fields |
| RSK-14 | Privacy | Letter text, a Find query or a child's name in logs or crash reports | 2 | 4 | 8 | privacy | Content-free codes; J-N18 canary; FR-SEC-18 | TB8 |
| RSK-15 | Store rejection | Privacy label out of step with the build that turns on pictures or the other parent | 2 | 4 | 8 | compliance | G11 label guard (CI job not built yet); Q54 | NS-01, NS-25, NS-07 G11 |
| RSK-16 | Store rejection | Review finds a hidden feature, a placeholder, or cannot sign in (per 16 s6, UNVERIFIED this session) | 2 | 3 | 6 | ops | Flags off and absent in production; demo Asha account (FR-SEC-26); ADR 0029 preflight | G6 |
| RSK-17 | Legal | A disclosure triggers notice duties under state law or the FTC HBNR on a clock (UNVERIFIED; counsel must confirm) | 1 | 5 | 5 | legal | FR-RSK-02; Q28 | all |
| RSK-18 | Legal | A child's picture or voice, or another adult's words, held or shared without the right consent | 2 | 4 | 8 | legal | X2 gate; Q45, Q48; D9 | NS-01, NS-05, NS-16, NS-25 |
| RSK-19 | Privacy, legal | Withheld other-language words stay in the server copy (E7) | 3 | 3 | 9 | data-architect | New migration (E7 row); until then NS-17 flag stays off | NS-17 |
| RSK-20 | Security | A sealed letter shows to the other parent before its day | 1 | 4 | 4 | data-architect | Server clock only; author-only clause; E3 watermark fix | NS-06 B |
| RSK-21 | Operational | The tested database is not the live one (`.github/migrations-applied.txt` lists 2 applied files; this head has 31 migration files) | 3 | 4 | 12 | ops | Apply per `supabase/APPLY.md`; read-back before any server-on candidate | NS-06 B, NS-12, NS-25 |
| RSK-22 | Operational, security | One founder account and the agent tooling are a single point of compromise for every console; every session posts as the founder | 2 | 5 | 10 | founder, security | SEC-R19, SEC-R25; CI action SHA pins partial (`ci.yml` unpinned) | all |
| RSK-23 | Reputational | A shared letter goes to the wrong thread and cannot be taken back | 2 | 3 | 6 | product | Preview of exact text, Continue and Not now equal (NS-05); no fix possible after send | NS-05 |
| RSK-24 | Operational, loss | ADR 0031 hides A's book; A can no longer sign in (account deleted, lost mailbox); with backup off the voice is stranded | 2 | 4 | 8 | founder | Founder Q-S1 | X4-R1, D1 |
| RSK-25 | Financial | Free allowance reset by Erase everything ("your free letters start again", C-S19) | 1 | 1 | 1 | finance | Accept: erasing also removes the letters | C-S19 |
| RSK-26 | Security | No independent test before outsiders store letters on the server; reviews are by sessions of one model family | 3 | 4 | 12 | founder | FR-RSK-04; pen test brief (founder spend) | NS-25, NS-08 flip |

---

## 5. The second-account-on-one-phone defect

What the code does today (read at `7d0446d02`):
1. `use-first-run-route.ts:131`: `hasLocalBook = active && listChildren().length > 0`. `listChildren()` is `children.listVisible(ctx())` (`store.ts:311-313`). Nothing filters by account.
2. `gate.logic.ts:123-125`: `if (input.hasLocalBook) { ... return result('openTonight', { mayBeginBook: true, offerSignIn: !input.hasSession }) }`. For a signed-in account B, the earlier session block (`:114-121`) falls through when the new-phone view is `new` (which `:115` picks whenever `hasLocalBook` is true and `newPhone` is undefined). So B opens A's book.
3. `ownership.ts:49`: `if (owner && owner !== userId) throw new AccountMismatchError()`. `sync/index.ts:180` stores `mismatchUser` and sync stops. This guards only the upload. It does not hide anything.

Consequences:
- B reads every letter, voice and picture of A's (L4), and Find, Read together and Save a copy all work over A's book. This breaks `[X4-R1]`, which every card cites as P0.
- B can keep new letters into A's book. They never upload (owner mismatch), and nothing tells B. That is a silent loss path for B and a mixed-author book for A.
- `[X4-R1]` does not exist as a test, so nothing fails today.

What the fix must hold (ADR 0031 as proposed in eval C 1.4): local rows carry the owning account; a mismatched owner hides the old book from every surface (FR-SEC-03); it returns only for its owner or is removed by Erase everything (FR-SEC-04); B starts clean (FR-SEC-01, 02).

An honest limit: X4-R1 protects A's book from being claimed, uploaded or mixed while B is signed in. It does not make a signed-out book private. Under D1, anyone who opens the app before B signs in reads A's book. The confidentiality controls there are App lock and Erase everything. The cards should say this plainly (card change CC-1).

---

## 6. Threats and required controls per card

Only cards with a security boundary are listed. "Adds" means a control this file adds on top of the card.

| Card | TB | Main threats (adversary per TDD 04 2.2) | Controls in the card | Adds |
|---|---|---|---|---|
| NS-01 Photo | TB1, TB4, TB8 | Lost phone or shoulder (A3); second account (TB4); GPS in temp copies; native module (A8) | Blank snapshot R13a; no picture before unlock R13b; 0 metadata; temp sweep R52; pictures never sync | FR-SEC-01 to 03, FR-SEC-14 |
| NS-02 Find | TB4, TB8 | Second account finds A's letters; query in logs | R24 | FR-SEC-03 (FTS rows), FR-SEC-18 |
| NS-05 Share | TB1 | Wrong recipient; picture metadata; recording leaks | Exact preview; picture off by default; R6b; no audio | none (RSK-23 residual) |
| NS-06 A Firsts | TB5 | Label in another reader's view before intended | Trigger tuple, view, label guard | FR-SEC-18 (label never logged) |
| NS-06 B Seals | TB5 | Early read by other parent; client clock forgery | Server `now()`; author-only clause | FR-SEC-20 (Open now event) |
| NS-06 C Quick capture | TB1 | Name or words on lock screen; a doorway that starts recording (SEC-R17) | `startCapture({source})`; App lock applies | FR-SEC-21, FR-SEC-14 (extension target) |
| NS-07 C28 Print, NS-11 Save a copy | TB1 | Whole book exits from an unlocked phone (A1, A3) | Temp file deleted; owner check only with App lock | FR-SEC-06 (founder default Q-S2), FR-SEC-08 |
| NS-08 Backup | TB2 | Escrow key and audio on the server | Stays off; security read before flip | FR-SEC-17 |
| NS-10 New phone | TB2, TB4 | Pull while consent outstanding (E9); claim by the wrong account | Claim screen; E9 phone rule | FR-SEC-05 |
| NS-12 Earlier versions | TB5 | Another reader reads earlier wording | Author-only read RPC | FR-SEC-20; deny cells (IAM-R24) |
| NS-13, NS-18, NS-32 | TB1 | Name or typed words on lock screen; reminders of A on B's phone | Names off; placeholder; sign-out clears (R14) | FR-SEC-21 |
| NS-16 From name | TB2, TB4 | Another adult's name; A's names list shown to B | D9; X4 | FR-SEC-03 |
| NS-17 Language | TB2, TB8 | Withheld words on the server | D10; E7 migration | RSK-19 |
| NS-23 Past letter | TB1 | Fragment in switcher | R11 | FR-SEC-22 (all L4 screens) |
| NS-25 Other parent | TB5 | Forwarded link (A2); ex-partner (A1); code guessing; brake abuse | Hashed token; single use; 7 days; 72-hour undo; limits | FR-SEC-09, FR-SEC-10, FR-SEC-23, FR-RSK-04 |
| NS-35 Only Home starts | TB1 | A link or intent starts recording | Source test | none |
| NS-38 to NS-45 First run | TB2, TB4 | Enumeration, code guessing, email flooding, session theft, password path, under-18 user (A9, attestation only); full table in the input section 2 and NS-41 section 13 | NS-41-R1 to R25 | FR-SEC-01, 02, 05, 24, 25, 26, FR-SEC-11 |

---

## 7. Design needs

| Screen or state | Need | For |
|---|---|---|
| E-S18 (second account) | Draw the states `signedInB-ownerMismatch` (A's book hidden, B's arrives or "No book here yet") and `signedInB-localOnly` (B's letters stay on this phone: one SystemLine, E-S15) | FR-SEC-01, 02, 04 |
| C-S03 sign-out sheet | Add a secondary "Turn on App lock" action when App lock is off, under the D1 lines | FR-SEC-07 |
| C-S19 Erase everything | After the confirm, the system owner check (Face ID or passcode); cancel returns to the confirm unchanged; new state `.ownerCheckCancelled` (no message) | FR-SEC-06 |
| C-S04.ready, C-S05.ready | One line (PROPOSED intent): "Anyone who has this file can read and hear everything in it." | FR-SEC-08 |
| D-S18 Family page | `.undo-open` names who joined in the first line, with Undo | FR-SEC-09 |
| D-S16 | Error line for `codes_paused` that suggests asking for the link instead | FR-SEC-10 |
| A-S14 doorways, D-S10 | Every widget, control and placeholder string is neutral; no name in any state | FR-SEC-21 |
| E-S06 code screen | Field drawn for 8 digits as well as 6 (O-6); the input's F17 paused state stands | FR-SEC-24 |
| E-S22, C-S03, Me | App lock offered in Me and on the sign-out sheet only; nothing at the end of first run | FR-SEC-25, FR-SEC-07 |
| Every L4 screen | `.backgrounded` state drawn blank (as B-S04 already does for pictures) | FR-SEC-22 |

All strings above are intent only; `content` writes the words and the founder approves them.

---

## 8. Card changes proposed (for Karma to rule)

| # | Card row | Change | Why |
|---|---|---|---|
| CC-1 | `00-product-frame.md` sign-out paragraph (D1) | Add: "`[X4-R1]` keeps A's book from being seen, claimed or uploaded while another account is signed in. It does not make a signed-out book private; App lock and Erase everything do." | Prevents X4-R1 being read as a confidentiality claim (section 5) |
| CC-2 | `14-test-plan.md` section 7 cross-cutting ids | Split `[X4-R1]` into `[X4-R1a]` gate (FR-SEC-01), `[X4-R1b]` B's letters (FR-SEC-02), `[X4-R1c]` every surface (FR-SEC-03), `[X4-R1d]` release (FR-SEC-04) | One test hides which surface leaks |
| CC-3 | NS-11 section 13 threats | Add row: "Whole book, an unlocked phone (A1, A3) / owner check with App lock; honest line on ready / FR-SEC-06, FR-SEC-08" | Missing threat |
| CC-4 | NS-25 acceptance | Add a P1 row from FR-SEC-09 | Wrong-adult join found only by chance |
| CC-5 | NS-06 Part C acceptance | Add a P0 (a) row from FR-SEC-21 | Doorways sit on the lock screen |
| CC-6 | NS-02 acceptance | Add a P0 (a) row: no query string in any log (FR-SEC-18) | TB8 |
| CC-7 | `19-from-download-to-first-letter.md` NS-45 (when written) | Carry FR-SEC-06, FR-SEC-07, FR-SEC-12 (input G5, G6) and the D1 sheet; add FR-SEC-02 to NS-41-R6 ("B's own letters never stop syncing without a word") | NS-45 has no section yet |
| CC-8 | NS-06 B10.1 | Apply the E3 watermark fix in the card body, not only in errata | TB5 correctness |

---

## 9. Engineering needs (backlog)

| Row | Change | Owner |
|---|---|---|
| BL-961 (change) | Scope adds: `hasLocalBook` filtered by owner (FR-SEC-01); B's letters never stuck behind a phone-wide owner (FR-SEC-02); hidden-book surfaces (FR-SEC-03); the four split test ids (CC-2). Size moves from M to L | mobile |
| ADR 0031 (write) | One phone, two accounts, as in eval C 1.4, plus the founder answer to Q-S1 | principal-architect, security-architect |
| New | Owner-check helper over `expo-local-authentication` for Erase everything and Delete account (FR-SEC-06) | mobile |
| New | Invite brake event and alert (FR-SEC-10); DMARC report reading while sign-in is public (FR-SEC-11) | security, ops |
| New | `scripts/guards/native-intake.mjs`: fails a PR that changes the lockfile or `apps/mobile/modules/**` together with unrelated code, or adds a dependency without a licence row (FR-SEC-14, SEC-R07) | security |
| New | Hostile signed remote-config test (FR-SEC-16) | mobile |
| New | Log canary cases for Find queries, labels, From names, typed days, photo paths (FR-SEC-18) | privacy, qa |
| New | `security_events` table and writers for the new acts (FR-SEC-20, SEC-R24) | data-architect |
| Existing, unblock | `SECURITY.md`, `docs/ops/INCIDENT.md`, `docs/ops/SECRETS.md`, threat model (SEC-R01, R02, R23); SHA pins in `ci.yml` (SEC-R10) | security, ops |

---

## 10. Founder and counsel questions

| # | Question | Recommended default | Route |
|---|---|---|---|
| Q-S1 | When ADR 0031 hides A's book and A can no longer sign in, may the phone owner (device passcode) open a hidden book only to Save a copy? | Yes, only Save a copy, after the owner check and a line naming the risk. It is no weaker than D1, which already lets anyone read a signed-out book, and it keeps the only copy of a voice from being stranded | founder CLOSED 20 Nov, see GAP-LOG Closures CL-068 |
| Q-S2 | Should Save a copy and the printable book ask for the owner check when App lock is off? | No. Keep as built (ask only with App lock) and add the FR-SEC-08 line. Export is never gated (LEGAL-REQ-040), and an owner check is not a gate, but it adds a step where none is required. Erase and Delete do get the check (FR-SEC-06) | founder; counsel to confirm the step does not conflict with LEGAL-REQ-040 CLOSED 20 Nov, see GAP-LOG Closures CL-068 |
| Q-S3 | Fund an independent penetration test before the first person outside the family stores letters on the server? | Yes, scoped to sign-in, invite links and codes, Edge Functions, RLS and the iOS build; Asha data only. Without it, say plainly that the R-17 review is self-assessed | founder (spend) FOUNDER-ANSWERED 20 Nov, default accepted (CL-069, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: pen test spend |
| Q-S4 | Bot check on email send (card O-7) | Agree with O-7: Turnstile before the public TestFlight link, subprocessor page first, Apple unaffected | founder CLOSED 20 Nov, see GAP-LOG Closures CL-070: Turnstile before public TestFlight link |
| Q-S5 | Breach notice: do letters, a child's details, voice recordings or pictures held by this app count as personal information or a personal health record under California Civil Code 1798.82 and the FTC HBNR, and on which clock? | Treat as covered for readiness (packet Q28 default). Counsel must confirm | counsel Q28 FOUNDER-ANSWERED 20 Nov, default accepted (CL-071, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement |
| Q-S6 | Is a join by the wrong adult through a forwarded invite link a security incident needing notice, or a support case? | Support case with the 72-hour undo, logged as a security event; counsel must confirm | counsel Q23, Q50 FOUNDER-ANSWERED 20 Nov, default accepted (CL-071, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement |
| Q-S7 | May a co-parent be removed for safety after 72 hours? | Keep the Terms (72 hours only) until counsel answers | counsel Q50, Q53 FOUNDER-ANSWERED 20 Nov, default accepted (CL-071, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement |

---

Summary of what is new here: the code-level shape of the live second-account defect (section 5), 26 register entries, 25 security rows and 6 risk rows, 8 card changes, and 7 questions. The first-run auth controls are the input's; this file only adds to them. Nothing here was tested on a phone or against a live service.

Signed: security-architect (Claude role; not an auditor, penetration tester or lawyer).

## Addendum 20 Nov 2026: photo moments and pictures and videos

Status: draft for Karma. Source: `../26-founder-direction-photos-library-and-media.md`. Cards NS-51 Photo moments and NS-52 Pictures and videos with a letter (card file 27 not on disk; row ids pending). Claude security role, not an auditor or lawyer. Read 20 Nov: Supabase signed URLs, https://supabase.com/docs/guides/storage/serving/downloads (private buckets need a signed URL or authenticated GET; "You can't revoke individual signed URLs"; to revoke delete, move or rename the object, or rotate the URL signing key); Supabase limits, https://supabase.com/docs/guides/storage/uploads/file-limits (Free projects: global file size limit cannot exceed 50 MB; per-bucket limit and type restrictions exist); Apple PhotoKit article (see `privacy.md` addendum). Not read: Apple docs on video metadata, ImageIO or AVFoundation hardening, Supabase RLS for storage beyond the above. Variants A and B are those of `privacy.md` PQ-13 (A: media stay on the phone; B: media sync).

### A. New requirements

| Id | Requirement (Given, When, Then) | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-SEC-27 | Variant B only. Given media uploads, Then they go to a new private bucket (never public; the closed `entry-photos` bucket and its `SCPHO` refusal, NS-01-R61, stay closed and are not reused) whose object path is `<book>/<letter>/<random id>`, with storage access rules that allow read only to a member of that book who may read that letter (private letters author-only; sealed letters author-only until the day), write only by the letter's author, and no list, update or delete outside those rules; a `test:db` matrix proves each cell, and the grant lives in its own migration and in `supabase/tests/grants.mjs` (CLAUDE.md) | NS-52; NS-06 B; NS-25; BL-870 | P0 (a) | data-architect, security | Supabase docs above; CLAUDE.md rule on grants |
| FR-SEC-28 | Variant B. Given a member opens a picture or video, Then the app asks an Edge Function that checks membership and returns a signed URL of at most 5 minutes (proposed), never stored, never logged, never placed in a share link or notification; because one URL cannot be revoked, removal of access (leave, removal, delete) deletes or moves the object, and the key-rotation runbook is part of the incident runbook | NS-52; FR-RSK-02 | P0 (a) | security, ops | Supabase "can't revoke individual signed URLs" |
| FR-SEC-29 | Variant B. Given Free-plan limits, Then the bucket file size limit is set below the plan's 50 MB global cap for pictures and for video, a video over the cap is refused on the phone before upload with one calm line, and an object whose bytes do not match its type (magic bytes) or cap is rejected server-side | NS-52; FR-RSK-05 | P1 | data-architect | Supabase limits page |
| FR-SEC-30 | Given any picture, Then Exif, GPS, XMP and trailing bytes are stripped before it is stored and before it is shared, as NS-01-R6 requires. Given any video, Then container metadata (including any location, device and creation fields) is handled by an explicit rule before NS-52 ships: either re-encoded with metadata dropped or the video refused for sharing and print. Which fields a phone video carries is UNVERIFIED (Apple video metadata docs not read); the spike lists them on fictional Asha clips | NS-01-R6; NS-05-R6b; NS-52 | P0 (a): location of a child's home must not leak | mobile, security | NS-01-R6 [F] |
| FR-SEC-31 | Given malicious or malformed media (corrupt HEIC, oversized dimensions, huge duration, decompression bomb, a file that is a symlink or outside the container, a wrong extension), Then the app reads the bytes from one open handle, checks type by content, enforces dimension, duration and byte caps before decode, decodes only with system frameworks, runs no third-party decoder and no ffmpeg in 1.x, and refuses with one calm line; fixtures are Asha-only synthetic files and a fuzz-lite test runs per release | NS-01 section 13; FR-PHS-53; NS-49-R19 | P0 (a) | mobile, security, qa | NS-49-R19 pattern |
| FR-SEC-32 | Given no server-side processing, Then thumbnails and poster frames are made on the phone; the server never decodes, transcodes or scans media in 1.x; any later server processing needs its own threat row and review first | NS-52; FR-SEC-14 | P1 | security | default; founder may change |
| FR-SEC-33 | Given the moments index and thumbnails of library pictures, Then they appear only in the capture area behind App lock, the switcher snapshot is blank (FR-SEC-22 covers moment cards and the media tray), no thumbnail is written outside `Caches`, and nothing from them is in a notification or widget | NS-51; FR-SEC-21, 22 | P0 (a) | mobile | FR-SEC-22 |
| FR-SEC-34 | Given the second-account defect (section 5), Then every new media path is in the `[X4-R1]` enumeration: attached files, poster frames, thumbnails, the moments index and its album picks; a test signs A out, B in, and finds none; ADR 0031 and BL-961 are a hard prerequisite of NS-51 and NS-52 | FR-SEC-01 to 04; FR-PRV-44 | P0 (a) | mobile, qa | FR-SEC-03 |
| FR-SEC-35 | Given Save a copy and share of media, Then a video or picture leaves only by the parent's tap, the ZIP is unencrypted and the FR-SEC-08 line says so, and a child's picture or video leaving the phone keeps the X2 reads (E23) | FR-SEC-08; E23; NS-05; NS-11 | P0 (a) | mobile, content | frame X2 |
| FR-RSK-07 | Given storage and egress cost abuse by large uploads (Variant B), Then usage alerts at 80 percent of the plan's storage and egress, per-account byte caps, and rate limits on upload URLs reach `ops` | FR-RSK-05; FIN addendum | P1 | ops, finance | FR-RSK-05 |

### B. Threat-model rows and register entries (new; ids continue RSK-26)

| Id | Kind | Risk | L | I | Score | Owner | Mitigation | Card rows |
|---|---|---|---|---|---|---|---|---|
| RSK-27 | Privacy | A signed URL of a child's video is forwarded and cannot be revoked until it expires | 2 | 5 | 10 | security | FR-SEC-28 (5 minutes, delete or move on revoke) | NS-52 |
| RSK-28 | Security | Malformed media crashes or exploits the decoder on the phone | 2 | 4 | 8 | mobile | FR-SEC-31 | NS-52, NS-51 |
| RSK-29 | Privacy | Location or device data in video metadata leaves with a share, copy or sync | 3 | 5 | 15 | mobile | FR-SEC-30 (rule before ship); unknown fields UNVERIFIED | NS-52 |
| RSK-30 | Privacy | After a separation a parent keeps access to the other's children's videos | 2 | 5 | 10 | founder | Terms 4.4 and Q50, Q53 unchanged; Variant A limits to phone | NS-52 |
| RSK-31 | Privacy | Moment thumbnails or a nudge reveal what the pictures show on a shared screen | 3 | 4 | 12 | mobile | FR-SEC-33; neutral nudge (FR-PRV-46) | NS-51 |
| RSK-32 | Financial | Storage and egress cost grows with video | 3 | 3 | 9 | finance | FR-RSK-07; caps | NS-52 |

### C. Existing requirements changed (pointers added in place)
FR-SEC-03 (list gains media and moments), FR-SEC-18 (log canary gains file and album names), FR-SEC-22 (blank snapshot gains moment cards and media tray), FR-RSK-05 (cost alerts gain storage).

### D. Design needs
States for: video refused (too long or large), media still loading from iCloud (UNVERIFIED how it behaves), upload paused, a letter's media absent on this phone (Variant A, other parent), blank snapshot of moment and tray. New screen needed; area A.

### E. Engineering needs
New bucket, storage access rules and tests (BL ids by Karma), Edge Function for signed URLs, media validator and caps module, video metadata spike, fuzz-lite fixtures, ADR 0031 as prerequisite.

### F. Questions
| # | Question | Default | Route |
|---|---|---|---|
| Q-S8 | Signed URL life | 5 minutes | Karma CLOSED 20 Nov, see GAP-LOG Closures CL-072 |
| Q-S9 | Strip video metadata by re-encode, or refuse video in share and print | Refuse in share and print until the spike lists the fields | founder after spike CLOSED 20 Nov, see GAP-LOG Closures CL-072 |
| Q-S10 | Independent test (Q-S3) covers storage rules and media decoding if Variant B ships | Yes | founder (spend) FOUNDER-ANSWERED 20 Nov, default accepted (CL-069, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: pen test spend |

### G. Cannot assess yet
Which metadata a phone video holds; behaviour of iCloud-only originals under limited access; real decoder attack surface on current iOS; whether Supabase storage rules can express the sealed-letter condition without a function (not read). Not run: no test, no phone, no service.
