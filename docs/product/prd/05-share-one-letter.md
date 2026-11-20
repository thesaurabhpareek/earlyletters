# NS-05: Share one letter (Level 1: the words as text, from the parent's own share sheet)

Status: Locked v1.0, 20 Nov 2026 (council round 2). Changes after lock need a PR that lists every changed id.

Author: `product` (CPO lens). Rank 5 of 7. Index: `README.md`. Earlier: Draft v1, 11 Nov 2026. Founder decision, 10 Nov 2026: build Share one letter, text first (relayed by Karma on 11 Nov; design spec 03 records it as Q0/Q1 "DECIDED by the founder"). Ruled 20 Nov (Karma, council round 2): T2 (free in 1.0.x stays free), T4 (undo and time limits), T5 (no build numbers or dates), D2, D3, D13.

Design source: `docs/design/specs/03-SHARE-ONE-LETTER-11nov.md` (PR #794; SH-R rows in its section 9; the Share-tab test in its section 8). Navigation test N9 proves there is no share control on Home. This card specifies Level 1 in full. Levels 2 and 3 carry only the guards in section 3; their requirements are written after their gates, not before.

Tags: EVIDENCE = repo file or PR read in the session that wrote the line. HYPOTHESIS = about parents. UNVERIFIED = not read or not run. PROPOSED = a number `product` proposes. Code facts below were read on `develop` at `697233d35` on 20 Nov 2026.

## 1. Who and when

- A parent who kept a letter about something a grandparent would love to know ("{child} said a first word today"), sitting with the phone after the baby is down, wanting to send it now in the thread they already use with that person. HYPOTHESIS; demand from our own parents is not yet measured (NS-03 measures it).
- Only the author of the letter shares it. Not the other parent, not the child, not the recipient (who needs no account and no app).

## 2. Why

- The job: "I go to a letter I kept to send it to one person I choose, so that they can read it on any phone, without an account or an app."
- What goes wrong today: the parent screenshots the letter page (an image of text, unreadable at small sizes, no copyable words) or exports the whole book (far more than one letter). Neither is the one-letter, plain-words act they want.
- Evidence tag: HYPOTHESIS. The research file counts seven of 12 products with family following and cites sharing with relatives as praise in listings (UNVERIFIED: pages read by another agent).

## 3. What, and Not in scope

What (Level 1): a "Share this letter" control on the letter page of the author's own open letter (label PROPOSED; `content` owns the final words; design caps it at 22 characters). It opens a preview that names what leaves, then the iOS share sheet with the words as plain text and, only if the parent turns it on, the stored copy of the letter's picture. Nothing passes through our servers. Sharing is an output, never a capture: it makes no new letter and no new words, and only Home starts a letter (rule P1).

The three levels:

| Level | What leaves the phone | Through what | Gate before it can ship |
|---|---|---|---|
| 1 | The words as plain text (date line, words, signature line), and optionally the stored copy of the picture; no recording | The iOS share sheet (the parent's own Messages, Mail, WhatsApp) | Content and review rules, and a counsel read on the optional picture (a picture of the child leaving through the parent's own share sheet; Q45, default "same as Export: the parent's own act; we collect nothing"), before the flag is on outside the founder's family |
| 2 | Level 1 plus the recording file | Same | `security-architect` and counsel reads first (closed X2); NS-03 Arm V result |
| 3 | A link to a page with words and sound, hosted by us | Our hosted page | Both reads; NS-03 GO; the founder decides hosting spend; label moves Audio Data to collected and linked (Q54(a), Q42) |

Binding line (Karma, 11 Nov): Level 1 has no recording row and no recording path until `security-architect` and counsel reads are on record (NS-05-R16a). The shared text carries no footer, brand name or link (NS-05-R16b).

Guards binding on any future Level 2 or 3 card: per-letter and by the author only; never default on; no "seen by", open counts, reactions or counts of shares; an unguessable link that expires and can be revoked; no recipient account; no machine caption; no loss or legacy-death wording; the privacy label and Apple 1.2 position read first.

Not in scope: Levels 2 and 3; a Share tab (section 3.1); sharing several letters at once (that is Export); sharing from Home, the Book list, the Photos lens, Find results or Me; any record that a letter was shared; any footer, link or brand line; a subject line for Mail; any change to the words.

### 3.1 Does this justify a Share tab?

No, not at Level 1. The closed decision is Home | Book | Me; a fourth tab ships only when it passes the job-clarity checklist (N2). NAV-TAB-ROLES's test for a tab: a verb no other tab has, material no other tab holds, and a day-one state that is not empty. Level 1 gives a verb but no material: Export sits in Me, and sharing starts from a letter page. Revisit only when Level 2 or 3 is live, Export, share-one-letter and people with access are three outputs parents actually use (a study, not telemetry), and the checklist passes with five parents. No build shows a co-parent "coming soon" surface (founder, 19 Nov; D-161 as drafted in #827).

## 4. Happy path

1. The parent opens a kept letter of their own from the Book.
2. They tap "Share this letter" (the letter's action row; one control).
3. A preview sheet opens within p95 300 ms (PROPOSED) and shows, top to bottom: a title (intent: "This will be sent"); the exact text that will leave (date line, words, signature line); a static row "The words always go" (text, not a switch); a toggle "Include the picture" (only if the letter has a stored picture on this phone; default off); a line naming the version (intent: "Sent as it reads in the book, with small fixes", or "Sent exactly as said" when that is the version the Book shows); a line on where it goes (intent: "It goes only where you send it, and cannot be taken back once sent"); then Continue and Not now, equal in size, weight and type.
4. The parent taps Continue.
5. The iOS share sheet opens within 1 s (NS-05-R11) with the text and, if toggled on, one image file named `letter-photo.jpg`.
6. The parent picks their messaging app and a person, and sends in that app.
7. The share sheet closes; the app deletes the temporary picture file in the completion handler, shows no toast and records nothing.

## 5. Unhappy paths and edge cases

| Case | Behaviour |
|---|---|
| The letter has no words yet (recording still being made) | No Share control (R7). No empty text |
| The letter is held at the Keep gate (not kept) | No Share control (R7): only kept letters are shared |
| The author's own private letter | Shareable: it is theirs (R7) |
| The other parent's letter | No Share control (R7) |
| A sealed (hidden-until) letter | No Share control until it opens (R7; NS-06-B2) |
| A quiet-day mark | No Share control (R7; D-084) |
| The picture file is missing on this phone (new phone, or a failed write) | The toggle is hidden; words only; no error (R5b) |
| The temporary picture copy cannot be written (disk full) | Error code `share_temp_write_failed`; the share falls back to words only and the preview says the picture could not be added (intent: "The picture could not be added this time. The words will go."); nothing is logged with a path |
| Very long letter | Plain text, no length limit, nothing truncated; the preview scrolls with Continue and Not now pinned in the bottom third |
| Right-to-left or mixed-direction letter | The wrapper lines are wrapped in Unicode isolates (R20); the recipient's phone draws the words |
| The share sheet has no apps | iOS decides; nothing from us |
| The parent cancels in the share sheet | Nothing sent; temp file deleted in the completion handler (R10a) |
| The send fails in the other app | That app's own error; we cannot know; temp file deleted (R10a) |
| The app is killed after Continue | The launch sweep deletes any file left in `tmp/share` (R10b) |
| The parent shares to the wrong person | Our app cannot know or undo it; the preview says a sent letter cannot be taken back. This is the main reason Level 1 carries no voice |
| A letter about another adult | The app does nothing different; counsel owns the other-people position (`NX-39-R38`; Q48) |
| The parent asks for a nicer version, a summary or a title | No: the shared text is the letter's words and nothing else (constitution) |

## 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | The first kept letter of one's own shows the control; no tip, coach mark or "try sharing" prompt |
| Empty | No kept letters: no letter page, so no control; nothing on Home or the Book invites sharing |
| Many (1,000 letters, 300 pictures) | No effect: one letter at a time; preview and sheet budgets hold for a 1,000-word letter |
| Offline | Works: the text is built and the sheet opens with 0 network calls from our code (R9); sending depends on the parent's app |
| Slow | Preview p95 300 ms and sheet within 1 s (R11, R23); the picture copy is written off the UI thread |
| Failed | `share_temp_write_failed` falls back to words only (section 5) |
| Interrupted (call, Siri, alarm, the baby) | The preview or share sheet stays open; nothing is sent until the parent acts; the temp file stays until the sheet completes or the next launch |
| App killed mid-flow | Nothing sent by us; the launch sweep deletes `tmp/share` (R10b) |
| App updated mid-flow | n/a beyond the kill row: an update kills the app; the sweep runs on the first launch after it |
| Low storage (under 1 GB, under 50 MB) | Under 1 GB: no change. Under 50 MB: a picture copy may fail and falls back to words only; text sharing always works |
| Low Power Mode and low battery | No change |
| Two books | The letter's own book decides nothing: the wrapper names no child and no book |
| Two parents | Each author shares only their own letters; never the other parent's (R7) |
| Expecting parent (due date only) | A Before You letter shares like any other; the date line is its about-day; no due-date wording is added |
| Multilingual (Devanagari, RTL, CJK) | Words pass byte for byte; the date line uses the device locale; wrapper lines carry isolates (R20); 20 fixtures (R4a) |
| AX5 and Bold Text on SE 3 | One column; Continue and Not now stacked, equal size, 44 pt or more; the text preview wraps and scrolls; buttons stay in view (R13b) |
| VoiceOver | The preview reads, in order: title, the text that leaves, the static words row as text, the picture toggle with its state, the version line, the where-it-goes line, Continue, Not now (R13a) |
| Voice Control and Switch Control | Every visible label is a Voice Control command; every control is reachable by item scanning (NS-33) |
| Reduce Motion | The sheet uses the system presentation; no custom motion |
| Dark mode and Increase Contrast | Preview follows tokens; the picture thumbnail has a 1 pt hairline frame and ignores Smart Invert |
| Plan lapsed | Works (R8) |
| Signed out | Works on letters on this phone (ruling D1: the book stays on the phone after sign-out) |
| Second account on the same phone | Account B sees and shares only B's own letters; never A's (R27; X4) |
| New phone | Words-only letters share normally; a letter whose picture stayed on the old phone shows no toggle (R5b) |

## 7. Acceptance criteria (Level 1)

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-05-R1 | Given the letter page with `EXPO_PUBLIC_SHARE_LETTER` on, Then exactly 1 Share control exists on an own, open, kept letter with words, and 0 on any other letter (R7); given Home, the Book list, the Photos lens, Find results and Me, Then 0 share controls exist | P1 | `[NS-05-R1] the only share control is on the letter page of an own, open letter` |
| NS-05-R2 | Given a tap on Share, Then a preview sheet shows the exact text that will leave and the picture only if toggled on (default off), has no recording row, and its Continue and Not now controls have the same size, weight and type at AX5 | P1 | `[NS-05-R2] the preview names what leaves` |
| NS-05-R3a | Given Continue, Then the iOS share sheet receives the text and, only if toggled on, one image file; the app records no destination, app or recipient | P0 (a) | `[NS-05-R3a] the share sheet gets the words and the app records nothing` |
| NS-05-R3b | Given the share sheet completes, Then the activity type it returns is never read, stored or logged (source scan of the share module plus a unit test asserting the result object is discarded) | P0 (a) | `[NS-05-R3b] the activity type is never read` |
| NS-05-R4a | Given a share, Then the text equals the R18 wrapper around `final_text` (the version the Book shows), with nothing added or removed, for 20 fixtures including Devanagari, Arabic and Chinese | P0 (a) | `[NS-05-R4a] the shared text is the letter's words inside the fixed wrapper` |
| NS-05-R4b | Given the preview, Then "The words always go" is static text with no switch role and is not announced as dimmed (SH-R15); only the picture has a toggle | P1 | `[NS-05-R4b][SH-R15] the words row is static text` |
| NS-05-R5a | Given any share, Then it contains 0 audio files and no MIME type starting `audio/` | P0 (a) | `[NS-05-R5a] no audio leaves` |
| NS-05-R5b | Given a letter with a stored picture on this phone, Then the picture is attached only if the parent turned its toggle on, as the stored copy (ruling T3; 0 metadata segments, `NX-39-R8`); given no stored picture on this phone, Then the toggle is absent | P0 (a) | `[NS-05-R5b] the picture goes only if chosen, as the stored copy` |
| NS-05-R6a | Given an attached picture, Then its file name is exactly `letter-photo.jpg` (changed 20 Nov from "the letter's date": a date can state the child's birthday, an L4 fact) | P0 (a) | `[NS-05-R6a] the picture's file name is fixed` |
| NS-05-R6b | Given the attached file's metadata, Then it holds no child name, email, device name, account id, GPS or date (byte scan for Exif, XMP and IPTC segments: 0) | P0 (a) | `[NS-05-R6b] the picture carries no metadata` |
| NS-05-R7 | Given another parent's letter, a sealed letter before it opens, a quiet-day mark, a letter with no words, or a draft not yet kept, Then Share is absent; given the author's own kept letter with words, private or not, Then Share is present (design SH-R5) | P0 (a) | `[NS-05-R7] only own, open, kept letters with words can be shared` |
| NS-05-R8 | Given the plan engine, Then sharing is never gated; it works after the allowance is used and after Plus lapses | P1 | `[NS-05-R8] Share is never gated` |
| NS-05-R9 | Given airplane mode or `serverFeaturesEnabled()` false, Then the text is built and the sheet opens; 0 network calls come from our code | P1 | `[NS-05-R9] building the share makes 0 network calls` |
| NS-05-R10 | Rewritten 20 Nov as R10a, R10b and R10c; id kept | n/a | none |
| NS-05-R10a | Given the share sheet completes (sent, cancelled or failed), Then the temporary picture file is deleted in its completion handler (0 files left in `tmp/share`) | P0 (a) | `[NS-05-R10a] the temp picture is deleted when the sheet completes` |
| NS-05-R10b | Given a file left in `tmp/share` (app killed after Continue), When the app next launches, Then the sweep deletes it before the first frame's idle (0 files after launch) | P0 (a) | `[NS-05-R10b] the launch sweep removes a left temp picture` |
| NS-05-R10c | Given the temporary picture, Then it is written under the app's `tmp/share` folder with complete file protection and is excluded from the iPhone backup | P1 | `[NS-05-R10c] the temp picture is protected and not backed up` |
| NS-05-R11 | Given a letter of 1,000 words with a picture, Then the share sheet opens within 1 s of Continue on an SE 3 (PROPOSED; device run) | P1 | `[NS-05-R11] the sheet opens within 1 second` |
| NS-05-R12 | Given any share, Then no row, column, counter, "shared" badge or "last shared" date is stored on the letter, in the book or in settings, and none is shown | P0 (a) | `[NS-05-R12] nothing remembers that a letter was shared` (schema and settings-key test) |
| NS-05-R13 | Split 20 Nov into R13a and R13b; id kept | n/a | none |
| NS-05-R13a | Given VoiceOver, Then the Share control, the preview and the picture toggle are labelled, the static words row is read as text, and the preview reads in the section 6 order | P1 | `[NS-05-R13a] the share flow reads in order with VoiceOver` (device) |
| NS-05-R13b | Given AX5 with Bold Text on an SE 3, Then the preview is one column, every control is 44 pt or more, and Continue and Not now are visible without scrolling past the text | P1 | `[NS-05-R13b] the share flow fits AX5 on an SE 3` (device) |
| NS-05-R14 | Given App lock on, Then the Share control is reachable only past App lock, and the preview is blank in the app-switcher snapshot | P1 | `[NS-05-R14] the preview is blank in the switcher` |
| NS-05-R15 | Withdrawn by Karma's ruling of 11 Nov: the shared text carries no footer, brand name or link (see NS-05-R16b) | n/a | none |
| NS-05-R16 | Split 20 Nov into R16a and R16b; id kept | n/a | none |
| NS-05-R16a | Given Level 1 (SH-R10), Then the sheet and code have no recording row, no audio URI and no recording copy slot, even behind a flag; the payload is text plus at most one image URI | P0 (a) | `[NS-05-R16a][SH-R10] Level 1 has no recording path` (payload unit test) |
| NS-05-R16b | Given the wrapper the app adds (date line, signature line, joining lines), Then a scan finds no value of `brand.name`, no `http`, no `www.` and no "sent from" line; the scan excludes `final_text`, and a fixture whose words contain "www.example", "http" and the brand name passes with those words unchanged | P0 (a) | `[NS-05-R16b] the wrapper carries no footer, brand or link` |
| NS-05-R17 | Given the share strings, Then they pass the content rules test and match no README appendix A pattern; no "gift", no machine-writing implication; `{child}` for the child | P1 | `[NS-05-R17] share strings match no forbidden pattern` |
| NS-05-R18 | Given a share, Then the wrapper is exactly: the letter's about-day (`occurred_on`; a long date in the device locale through `Intl.DateTimeFormat`, or month and year when `occurred_precision` is month), a blank line, the words, a blank line, the signature line the letter page shows (`copy.book.signature` with `authorOf(entry, child)`, `app/letter/[id].tsx:318-319`). No child name, age or month count is added; a child's name appears only if it is in the words | P0 (a) | `[NS-05-R18] the wrapper is date, words, signature and nothing else` (20 fixtures) |
| NS-05-R19 | Given the preview, Then a line names the version that leaves: the version the Book shows for this letter (with small fixes, or exactly as said), and the text sent is that version | P1 | `[NS-05-R19] the preview says which version is sent` |
| NS-05-R20 | Given an Arabic or Hebrew letter, or mixed directions, Then the date line and the signature line are each wrapped in FSI and PDI isolates, so the recipient's phone draws them in order | P1 | `[NS-05-R20] wrapper lines keep their order in right-to-left letters` (fixture test) |
| NS-05-R21 | Given the share call, Then no subject, title or email subject is passed to the share sheet (the options object has no `subject` and no `title` key) | P0 (a) | `[NS-05-R21] the payload has no subject` |
| NS-05-R22 | Given the share sheet completes, Then no success toast, banner or haptic tells the parent it was sent (the app cannot know) | P1 | `[NS-05-R22] no sent confirmation is shown` |
| NS-05-R23 | Given a tap on Share, Then the preview is on screen within p95 300 ms on an SE 3 (PROPOSED), and peak memory stays under 30 MB above the letter page's baseline for a 1,000-word letter with a picture (PROPOSED) | P1 | `[NS-05-R23] the preview opens in 300 ms within 30 MB` (device) |
| NS-05-R24 | Given the preview, Then it shows the where-it-goes line (intent: "It goes only where you send it, and cannot be taken back once sent") before Continue | P1 | `[NS-05-R24] the preview says a sent letter cannot be taken back` |
| NS-05-R25 | Given the letter page or the share flow, Then no `NSUserActivity`, Spotlight item, Siri suggestion or App Intents entity carries the letter's text, the child's name or the picture (ruling D3) | P0 (a) | `[NS-05-R25] sharing donates nothing to the system` (covered by `[X6-R1]` source scan) |
| NS-05-R26 | Given `EXPO_PUBLIC_SHARE_LETTER` off, Then 0 share controls and 0 share code paths are reachable, and the letter page is otherwise unchanged | P1 | `[NS-05-R26] flag off removes Share cleanly` |
| NS-05-R27 | Given account A signed out and account B signed in on the same phone, Then B's letter pages offer Share only on B's own letters, and A's letters are neither listed nor shareable for B (ruling D1; X4) | P0 (a) | `[NS-05-R27] a second account never shares the first account's letters` |

Withdrawn or replaced ids: R10, R13 and R16 are kept as split markers; R15 stays withdrawn. `scripts/trace.mjs` does not see NS ids yet (F1, PR #819); no row claims to be traced until it does.

## 8. Non-functional budgets

Inherit 06-nfr; differences only:

| Line | Budget |
|---|---|
| Latency (p95 on SE 3) | Preview 300 ms (R23, PROPOSED); share sheet within 1 s of Continue (R11, PROPOSED); the temp picture copy written off the UI thread, no UI frame over 16.7 ms |
| Memory | Under 30 MB above the letter page baseline for 1,000 words with a picture (PROPOSED) |
| On-device storage | 0 bytes left after the sheet completes or the next launch (R10a, R10b); the temp copy is at most the stored copy's size (about 1.5 to 3 MB) |
| Battery | Under the measurable step; no background work |
| Offline | Works (R9) |
| Accessibility | AX5 plus Bold Text, VoiceOver order (section 6), 44 pt, Voice Control and Switch Control (NS-33) |
| Localisation | Date line from `Intl.DateTimeFormat` in the device locale; FSI and PDI on wrapper lines; no assembled sentences; strings in `packages/content` |
| Privacy (log canary) | The canary letter's words, the child name and the temp path never appear in logs, crash reports or analytics; the activity type is never read (R3b) |

## 9. State space

| Case | Expected | Test |
|---|---|---|
| Second phone, same account | Share works on that phone's copy of the letter; a picture that stayed on the other phone gives no toggle | R5b |
| Second account on the same phone | Never A's letters (D1, X4) | R27 |
| Offline | Works | R9 |
| Retry after a lost answer | n/a: no server call exists | R9 |
| Sign out | Works on letters still on the phone (D1) | R27 |
| Account deletion | After this phone runs the deletion erase, no letter remains to share | covered by the erase tests |
| Kill switch `serverFeaturesEnabled()` off | No change; Share is local | R9 |
| Remote pause | None. Share is a local export path, and the kill-switch vocabulary stops only server-dependent features and never export (`packages/api/src/kill-switches.ts` header; LEGAL-REQ-040). Rollback is the build flag | n/a |
| Plan lapse | Works | R8 |

## 10. Data and engineering

- Fields: none new. Reads `entries.final_text`, `occurred_on`, `occurred_precision`, `edit_level`, `author_id`, the signature via `authorOf` (`app/letter/[id].tsx:318`) and, if present, the `entry_media` stored copy (NS-01, local migration 11).
- Classes: words L4, date L3 (L4 when it is a birthday, rule 6), picture L4. None are stored by this feature.
- Migrations: none, local or server. Sync field group: none. Export schema: no effect.
- Modules: `lib/share/payload.ts` (pure: builds the wrapper and the payload; unit-tested with the 20 fixtures), `lib/share/temp.ts` (writes and sweeps `tmp/share`), the letter page action row in `app/letter/[id].tsx`, a preview sheet component reusing the existing sheet and toggle components, `packages/content` share strings. The share call uses React Native's `Share.share` (already used at `lib/family/share.ts:13`) or `expo-sharing` (used at `lib/export/device.ts:358`); `mobile` picks the one that can hand text and one image together and proves it with the R4a fixtures (UNVERIFIED which can).
- Flag: `EXPO_PUBLIC_SHARE_LETTER` (name proposed; `capabilities.ts` sets the final name). Off in production until the Q45 counsel read on the optional picture and the device rows (R11, R13a, R13b) pass.
- Remote pause key: none (section 9).
- Error codes: `share_temp_write_failed` (falls back to words only; never logged with a path).
- Rollout: flag on in preview and TestFlight; production when the gates in section 22 pass. Rollback: flag off in the next build; nothing to migrate or clean (no data).
- Size: S to M (CTO pass). Order: after NS-01 (the stored copy) is in TestFlight; the roadmap holds the date (T5).

## 11. Data inventory

| Field | Class | Where | Synced | Retention clock | Deletion path | Export | Log exclusion |
|---|---|---|---|---|---|---|---|
| Temporary picture copy `tmp/share/letter-photo.jpg` | L4 | phone `tmp`, complete protection, excluded from backup | No | Until the sheet completes, or the next launch | Completion handler (R10a); launch sweep (R10b) | No | Path, name and hash never logged |
| The share payload text | L4 | memory only | No | The share call | Released after the call | No | Never logged |

Nothing else is newly used or stored. The activity type the share sheet returns is never read (R3b).

## 12. Door lines

- Shown: the preview sheet (R2, R19, R24): exactly what leaves, the version, and that it cannot be taken back.
- Records: nothing, on the phone or the server. No PRIV-R21 row: sending is the parent's own act through their own app, not an agreement with us. The activity type is never read, stored or logged.
- Never: audio at Level 1; the recipient; the app chosen; a "shared" count or date; the child's name in a file name or metadata; a tracking link; a footer or brand line; a subject line.
- Decline: Not now. Nothing is built, nothing sent, nothing left on the phone.

## 13. Threats

| Asset | Threat | Control | Test |
|---|---|---|---|
| Letter words (L4) | Leave with more than the parent saw | Preview shows the exact text; payload is wrapper plus `final_text` only | R4a, R18 |
| Child picture (L4) | Leaves without the parent's choice, or with GPS or dates in metadata | Default off; stored copy only; 0 metadata | R5b, R6b |
| Child's birthday (L4) | Leaks through the picture's file name | Fixed name `letter-photo.jpg` | R6a |
| Temp file | Left on the phone, in the backup or readable while locked | Completion-handler delete, launch sweep, complete protection, backup exclusion | R10a, R10b, R10c |
| What the parent shared and where | We learn it | Activity type never read; nothing stored | R3b, R12 |
| Words in another app | A share extension the parent picks (any app, including an AI app) receives the words | Residual risk: the parent's choice; we never claim to control it | n/a |
| The letter in the app switcher | Shoulder-surfing with App lock on | Blank snapshot | R14 |

## 14. Never (rulings D2 and D3)

- D3: no letter text, child name, picture or prompt is donated to Core Spotlight, `NSUserActivity` search, Siri suggestions or an App Intents entity (R25; `[X6-R1]`).
- D2: n/a because Share adds no text field; the words are not editable in the preview.
- The machine adds no meaning: no title, caption, summary, tag, greeting or sign-off beyond the fixed wrapper.

## 15. Design inputs

States to draw: preview with the picture toggle off and on; preview with no picture (no toggle); the picture could not be added line; long letter (text scrolls, buttons pinned in the bottom third); RTL letter; preview at AX5 on an SE 3 (one column, Continue and Not now stacked, equal size); dark mode and Increase Contrast; the letter page action row with and without the control. No success toast after sending. Components reused: the existing sheet, toggle and letter action row; no new component. Motion: system sheet only; Reduce Motion follows the system. The picture thumbnail ignores Smart Invert and has a 1 pt hairline frame in dark mode.

## 16. Content inputs

Lines as intent; `content` writes, the founder approves:
- Control label: "Share this letter" (17 characters, PROPOSED; design cap 22). The verb ("Share" or "Send") is `content` with `legal` (OQ-6).
- Preview title: "This will be sent".
- Static words row: "The words always go".
- Toggle: "Include the picture".
- Version line: "Sent as it reads in the book, with small fixes" or "Sent exactly as said".
- Where it goes: "It goes only where you send it, and cannot be taken back once sent".
- Picture failed: "The picture could not be added this time. The words will go."
Banned: gift, share your voice, private link, family can listen, any loss word, any count, any line implying the app wrote or tidied the words, "every change shown" about what the recipient receives.

## 17. Legal, privacy and compliance

Counsel packet 1.5.0; counsel must confirm each:
- Q45: a picture of a child leaving through the parent's own share sheet. Default: the same as Export, the parent's own act; we collect nothing. Gates the production flag.
- Q43: the where-it-goes line and any privacy wording in the preview (a claims row).
- Q48: a letter that names another adult, shared by the parent.
- Levels 2 and 3: Q54(a) and Q42 (Audio Data collected and linked), plus `security-architect`.
- Apple: 2.5.19 (no hidden features): the control exists only where the flag is on in that build and is documented in the Notes for Review (research notes 20 Nov).

**Label effect.** None at Level 1: nothing is sent to our servers and nothing is collected. Levels 2 and 3 move Audio Data to collected and linked (Q54(a), Q42), in the same build as the behaviour, never before.

## 18. Claims

Enables: "Send one letter to someone you love, as text, from your own messages." Forbids: "share your voice", "private link", "family can listen", "share with grandparents in the app", any claim that the recipient sees every change (the plain text carries no fix marks), any count of shares. Share earns trust, not installs: there is no footer or brand by decision (Karma, 11 Nov), so the launch plan does not count on it for reach; acquisition comes from App Store search and communities (PRD v2 03 section 4.5). A Mother's Day line is fine once Level 1 has shipped.

## 19. Free or Plus

Free. Ruled 20 Nov (T2): every capability that ships free in the 1.0.x line falls under principle 6 and never moves behind Plus; public copy says nothing either way. Sharing a kept letter is the smallest form of export, and what a family kept stays theirs to read, hear and export (D-082). Plus holds one paid act, keeping beyond the allowance; sharing raises the value of a kept letter. Levels 2 and 3 add no gate and no second tier (closed X3).

## 20. Measures with analytics off

Source: a five-parent study plus hand-sent tester answers (ruling D5: numbers only, in the founder's private sheet, deleted 90 days after the round). Reporting rule: "x of n", never a percentage when n is under 20. Fixed question wording, versioned in `docs/research/` (aggregate only):
1. "Did you send a letter from the app this week (yes or no)?"
2. "Did the person reply (yes, no, don't know)?"
Study pass line (PROPOSED): 4 of 5 parents send one letter in under 60 seconds without help, and 4 of 5 can say that the recording does not go. Opt-in analytics, if ever on, may carry `letter_share_started` with no property; never a destination or a count per child.

## 21. Dependencies and gates

- Cards: NS-01 (the stored copy and its toggle), NS-06 (sealed letters excluded), NS-33 (Voice Control and Switch Control).
- Founder: OQ-1 order (default: after NS-01 is in TestFlight; the roadmap holds the date).
- Counsel: Q45 on the optional picture before the flag is on outside the founder's family.
- Device runs: R11, R13a, R13b, R23 on an SE 3 with an Asha-only test install (ruling D13).
- `content`: the strings and the verb (OQ-6).
- Trace: `scripts/trace.mjs` must see NS ids (F1, PR #819) before this card's rows count as traced.

## 22. Open questions

| Id | Question | Owner | Default if unanswered |
|---|---|---|---|
| OQ-1 | When does Level 1 ship? | Founder | After NS-01 is in TestFlight and the Q45 read is on record; order only, the roadmap holds the date (T5). The NS-03 read-out is not a gate for Level 1 |
| OQ-2 | Footer or brand name in the shared text | Closed (Karma, 11 Nov) | None (R16b) |
| OQ-3 | Which version goes in the text? | Closed 20 Nov (council round 2) | The version the Book shows, named in the preview (R19) |
| OQ-4 | Picture on or off by default | Closed | Off (R5b) |
| OQ-5 | Share tab | Founder | No tab (section 3.1) |
| OQ-6 | The verb and the letter-page label | `content`, `legal` | "Share this letter" until they decide |

Not fully testable: R11, R13a, R13b and R23 need devices; how each app (Messages, Mail, WhatsApp) receives text and one image together is UNVERIFIED until the 20-fixture run.
