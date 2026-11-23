# NS-06: Firsts, the sealed letter and quick capture

Status: CURRENT (LOCKED rev 2) | 20 Nov 2026 | Owner: `product` (CPO role) | Replaces: none | Load when: building or testing NS-06.

Status detail: Locked v1.0, 20 Nov 2026 (council round 2). Changes after lock need a PR that lists every changed id.

Author: `product` (CPO lens). Rank 6 of 7. Index: `README.md`. Earlier: Draft v1.1, 11 Nov 2026. Ruled 20 Nov (Karma, council round 2): T2, T4, T5, D2, D3, D6, D13. Three cards in one file; each part carries the full card shape and its own `**Label effect.**` line.

Sources: design specs `04-FIRSTS-AND-SEALED-11nov.md` and `05-HANDS-FREE-CAPTURE-STATES-11nov.md`; `NX-44-firsts.md` (its ids are cited, not copied); ADR 0028 (on branch `docs/adr-photo-seal-find-data-11nov` at `1bee878b`, status Proposed, accepted by Karma under CR-62, `docs/agents/cto/RULINGS.md:570`; not yet on `develop`, so cited as "ADR 0028"). Code facts below were read on `develop` at `697233d35` on 20 Nov 2026.

Scope and order (T5: order and gates only; the roadmap holds dates): all three parts are in scope (founder, 10 Nov: include all new scope; founder approval of requirements, 19 Nov). Firsts and the sealed letter are built after Share one letter (Level 1) ships and their five-parent study has run. The sealed letter also waits for ADR 0028 to merge on `develop` and for the sync choice in B10.1. Quick capture waits for NS-04's GO.

Terms: "lens", "Firsts lens", "Photos lens", "Home memory", "seal" and "sealed" are internal. `content` names the parent-facing words (BRAND.md glossary, CR-25); the app says "hidden until" and never "locked" (design spec 04). Parent-facing strings in rows ("This was a first", "hidden until") are PROPOSED.

Tags: EVIDENCE, HYPOTHESIS, UNVERIFIED, PROPOSED as in the README. Competitor facts from `FEATURE-GAP-AND-WEDGE-10nov.md` are UNVERIFIED (pages read, not products run).

---

## Part A. Firsts (letters the parent marks as a first)

### A1. Who and when

A parent after something happened (a first laugh, a first word), opening the letter they just kept, or still in Review. Never before the moment and never prompted by the app. HYPOTHESIS: parents think in firsts; no parent evidence yet.

### A2. Why

- Job: "I go to a letter I kept to mark it as a first, in my own words, so that I can find our firsts together later."
- What goes wrong today: a first is buried in months of letters; Find (NS-02) helps only if the parent remembers a word. Milestone apps answer with checklists and typical ages, which count gaps and set norms (constitution: never count gaps).
- Evidence: HYPOTHESIS; NX-44 proposal; competitor checklists UNVERIFIED.

### A3. What, and Not in scope

What: a mark on a letter (an enricher, rule P9) with an optional label of up to 40 grapheme clusters, typed by the parent. The control sits on the letter page and in Review. A Firsts lens in the Book exists only when at least one first exists (rule P3). A first never creates a letter and never stands alone (NX-44-R6).

Not in scope: a list of suggested firsts, typical ages, "most babies", progress, reminders to mark, any count, any machine detection of a first, a dictated label inside the app (iOS keyboard dictation is the system's own), a first on a quiet day, a first on another parent's letter.

### A4. Happy path

1. The parent opens a kept letter of their own (or is in Review on a draft).
2. They tap the mark control (intent: "This was a first"); it announces its new state.
3. An optional label field appears, empty, with no placeholder or example. They type "laughed out loud" or leave it empty.
4. The letter card in the Book now shows the label as its first line (or the letter's own first line when the label is empty).
5. The Book offers the Firsts lens (it did not exist before the first mark). Opening it lists firsts newest first, each a normal letter card.
6. On a draft, the mark is stored with the draft and shows in the Book only once the letter is kept.

### A5. Unhappy paths and edge cases

| Case | Behaviour |
|---|---|
| Marked by mistake | Unmark in one tap; Undo restores mark and label within the T4 window (A2b) |
| Label at 40 grapheme clusters | The field stops accepting input and says nothing else |
| Label empty | Allowed; the card shows the letter's own first line |
| A quiet day | No mark control; a write is refused (A6; server CHECK) |
| The other parent's letter | No mark control (A13) |
| A sealed letter before it opens | The mark contributes nothing anywhere until it opens (A15) |
| A draft let go | The mark goes with the draft (A14) |
| A letter in a hidden book | Its mark is hidden with it |
| Servers off or offline | Marking works on the phone and syncs later (A18, A20) |
| A parent asks for suggestions | None: the same answer as "make it nicer" |
| The label contains a health fact | Allowed; the label is L4 like the words (Q32, Q48) |
| A letter deleted and restored | Mark and label go and return with it (A8) |

### A6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | No word "first" anywhere until the parent opens a letter page or Review, where the control is a quiet action |
| Empty | 0 firsts: no lens, no hint, no empty state (A3) |
| Many (1,000 letters, 300 pictures) | Lens with 200 firsts opens p95 500 ms on SE 3 (A24) |
| Offline | Mark and unmark work; the change queues (A18) |
| Slow | The mark is a local write inside the 200 ms save commit |
| Failed | A failed local write leaves the letter unmarked and shows the standard save error; nothing half-written |
| Interrupted (call, Siri, alarm, the baby) | A typed label autosaves on `inactive` as typed text does (F04-REQ-011) |
| App killed mid-flow | The mark is written in one transaction; a label being typed is kept up to its last autosave |
| App updated mid-flow | The local migration adds the columns with null and false; no existing letter changes |
| Low storage (under 1 GB, under 50 MB) | Under 50 MB: the standard save error; the mark is a few bytes |
| Low Power Mode and low battery | No change |
| Two books | Each book has its own lens; the mark belongs to the letter |
| Two parents | Only the author marks; the other parent sees the mark and label only on a letter visible to them (A17) |
| Expecting parent (due date only) | Before You letters can be marked; no due-date wording is added |
| Multilingual (Devanagari, RTL, CJK) | The 40 counts grapheme clusters (`Intl.Segmenter`); RTL labels right aligned; tested with Devanagari conjuncts and Arabic (A23) |
| AX5 and Bold Text on SE 3 | The control and label field stack in one column, 44 pt; the label never truncates on the card (it wraps) |
| VoiceOver | The mark is a labelled toggle that announces its state; the lens reads cards in order (A11) |
| Voice Control and Switch Control | The control's visible label is its command; reachable by scanning (NS-33) |
| Reduce Motion | No celebration animation exists in any mode (A11) |
| Dark mode and Increase Contrast | Tokens only; the mark is never shown by colour alone |
| Plan lapsed | Marking and reading work (A21) |
| Signed out | Marks stay on the phone with their letters (D1) |
| Second account on the same phone | Account B sees no marks of A's letters (X4) |
| New phone | Marks arrive with the letters through sync (A16) |

### A7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-06-A1 | Given a kept letter of one's own, When the parent chooses the mark control, Then the letter carries a mark and an optional label of 40 grapheme clusters or fewer, typed by the parent; the field has no placeholder, no example and no list (NX-44-R1, R3) | P1 | `[NS-06-A1] mark with an optional label, nothing suggested` |
| NS-06-A2 | Split 20 Nov into A2a and A2b; id kept | n/a | none |
| NS-06-A2a | Given a marked letter, When the parent unmarks it, Then mark and label clear in 1 tap, and `final_text`, `raw_transcript` and the recording are byte-identical before and after (NX-44-R2, R7) | P0 (a) | `[NS-06-A2a] unmark is one tap, words untouched` |
| NS-06-A2b | Given an unmark, Then Undo restores mark and label for 10 seconds, or until VoiceOver has finished reading the Undo line plus 10 seconds, whichever is later; with Switch Control on, until the parent moves on (ruling T4) | P1 | `[NS-06-A2b] Undo stays open for VoiceOver and Switch Control` |
| NS-06-A3 | Given at least 1 first in the active book, Then the Book offers a Firsts lens, newest first, each a normal letter card with the label as its first line; given 0, Then no Firsts control, empty state or hint appears anywhere (NX-44-R4) | P1 | `[NS-06-A3] the lens exists only when a first does` |
| NS-06-A4 | Given any number of firsts, Then no count appears on any screen, VoiceOver string, export file name, PDF or notification (NX-44-R5) | P0 (a) | `[NS-06-A4] firsts are never counted` |
| NS-06-A5 | Given the code, Then no suggested first, typical age, norm, progress element or machine detection exists: a scan of the Firsts `packages/content` keys against README appendix A finds 0 matches, and a scan of the Firsts folder finds no import of a classifier, speech or text-analysis module | P0 (a) | `[NS-06-A5] no suggestions and no detection` |
| NS-06-A6 | Given a quiet day, Then the mark control is absent and a write of a mark is refused (phone and server CHECK) | P1 | `[NS-06-A6] quiet days cannot be marked` |
| NS-06-A7 | Given an export, Then mark and label are plain fields per letter (export minor per the `export/schema.ts` header rules; changed 20 Nov from "ADR 0027", which is the recording container), and the PDF book shows the label above the letter only when present | P1 | `[NS-06-A7] export carries the mark and label` |
| NS-06-A8 | Given sync, Then mark and label travel as field group `first`, the later write wins for that group only, and the words follow the `text` group's rules; given delete and restore, Then they go and return with the letter (NX-44-R7, U3, U4) | P1 | `[NS-06-A8] mark and label travel with the letter` |
| NS-06-A9 | Given Find (NS-02), Then the label is searchable (the index `extra` column) and nothing else about the mark is | P1 | `[NS-06-A9] Find sees the typed label only` |
| NS-06-A10 | Given the analytics catalog, Then it holds no event about marks (NX-44-R12) | P1 | `[NS-06-A10] no analytics event for firsts` |
| NS-06-A11 | Given VoiceOver, AX5 and Reduce Motion, Then the mark is a labelled toggle that announces its state, the lens reads in order, and no celebration animation exists (NX-44-R10) | P1 | `[NS-06-A11] the mark toggle passes VoiceOver and AX5` (device) |
| NS-06-A12 | Given every Firsts string in `packages/content`, Then the content rules test passes and none matches README appendix A (NX-44-R11) | P1 | `[NS-06-A12] Firsts strings match no forbidden pattern` |
| NS-06-A13 | Given the other parent's letter, Then no mark control exists; only the author marks or unmarks, and the server refuses a `first` group write from a non-author (RLS: author-only update) | P0 (a) | `[NS-06-A13] only the author marks` |
| NS-06-A14 | Given a mark made in Review on a draft, Then it is stored with the draft; Let it go removes it; it shows in the Book only once the letter is kept | P1 | `[NS-06-A14] a draft's mark waits for Keep` |
| NS-06-A15 | Given a sealed letter with a mark, Then the mark contributes nothing to the lens, Find, export for others or any count until the seal opens (consistent with B2) | P0 (a) | `[NS-06-A15] a sealed letter's mark stays hidden until it opens` |
| NS-06-A16 | Given the author's second phone, When it pulls, Then the mark and label arrive with the letter; the later write wins for the group | P1 | `[NS-06-A16] marks reach the author's second phone` |
| NS-06-A17 | Given the other parent, Then mark and label are visible only on a letter visible to them through `book_entries`; a private letter shows nothing | P0 (a) | `[NS-06-A17] a private letter's mark never reaches the other parent` (SQL test) |
| NS-06-A18 | Given offline, When the parent marks, Then the change queues and applies at the next push | P1 | `[NS-06-A18] marks queue offline` |
| NS-06-A19 | Given a lost answer to a push, When it is retried, Then the mark is applied once (idempotent op) | P1 | `[NS-06-A19] a retried mark applies once` |
| NS-06-A20 | Given `serverFeaturesEnabled()` false or `killSwitches.sync` on, Then marking stays local and syncs when on | P1 | `[NS-06-A20] marks stay local while sync is off` |
| NS-06-A21 | Given a lapsed plan or a used allowance, Then marking and reading firsts work | P1 | `[NS-06-A21] marking is never gated` |
| NS-06-A22 | Given the label field, Then it is never prefilled from the letter's words, and iOS writing tools (rewrite, proofread) are off on it (ruling D2; the native setting of ADR 0039, PROPOSED); until that setting is built the label field is not shown in any `production` profile and a source test fails a `production` profile that shows it without the setting (CR-67 AX-1; E41), so no founder decision is needed for the default | P0 (a) | `[NS-06-A22] the label is the parent's alone`, default branch `[NS-06-A22b] the field stays off in production until the setting exists` |
| NS-06-A23 | Given a label of 40 Devanagari grapheme clusters with conjuncts, and one of 40 Arabic letters, Then both are accepted, a 41st cluster is refused by the app, and the server CHECK (code points, ceiling 200, PROPOSED) accepts both | P1 | `[NS-06-A23] the 40 counts graphemes in every script` |
| NS-06-A24 | Given a book with 200 firsts among 1,200 letters, Then the Firsts lens is interactive within p95 500 ms on an SE 3 (PROPOSED) | P1 | `[NS-06-A24] the lens opens in 500 ms with 200 firsts` (device) |
| NS-06-A25 | Given account A signed out and account B signed in on the same phone, Then B sees no mark, label or Firsts lens from A's letters (D1, X4) | P0 (a) | `[NS-06-A25] a second account sees no first marks` |

### A8. Non-functional budgets

| Line | Budget |
|---|---|
| Latency (p95 on SE 3) | Mark write inside the 200 ms save commit (06-nfr 2.2); lens 500 ms with 200 firsts (A24) |
| Memory | Lens inside the Book's 120 MB at 1,200 letters (06-nfr 10) |
| On-device storage | Under 200 bytes per marked letter |
| Battery | Under the measurable step |
| Offline | Works; queues |
| Accessibility | Toggle announces state; AX5 wraps; Voice Control and Switch Control (NS-33) |
| Localisation | Grapheme count via `Intl.Segmenter`; RTL right aligned; no assembled sentences |
| Privacy (log canary) | `first_label` added to the log canary; never in logs, crash reports or analytics |

### A9. State space

| Case | Expected | Test |
|---|---|---|
| Author's second phone | Arrives at the next pull; later write wins for the group | A16 |
| Co-parent phone | Only with a visible letter | A17 |
| Second account on this phone | Sees none (X4) | A25 |
| Offline | Queued, then applied | A18 |
| Retry after a lost answer | Applied once | A19 |
| Sign out | Marks stay on the phone (D1) | covered by `[X4-R1]` |
| Account deletion | Marks are purged with the letters | covered by the purge tests |
| Kill switch (`serverFeaturesEnabled()` off, `killSwitches.sync`) | Local; syncs when on | A20 |
| Remote pause | None: marking and reading are local, and the kill-switch vocabulary stops only server-dependent features (`packages/api/src/kill-switches.ts` header). Rollback is the build flag | n/a |
| Plan lapse | Works | A21 |

### A10. Data and engineering

- New fields (names per DB-R01; CTO pass):
  - Server `entries.first_mark boolean not null default false`, comment `L3 parent's own mark that a letter is a first`.
  - Server `entries.first_label text null`, comment `L4 parent-typed label of a first (free text, rule 3)`; CHECK `first_label is null or (first_mark and char_length(first_label) between 1 and 200)` (code points; the app enforces 40 grapheme clusters; 200 is PROPOSED so a 40-cluster Devanagari label passes; changed from the CTO pass's 80, which refuses valid conjunct-heavy labels); CHECK `not first_mark or kind <> 'not_much'` (quiet days, `scribe_core.sql:124`).
  - Phone: the next free local migration after 11 (photos), `entries.first_mark INTEGER NOT NULL DEFAULT 0`, `entries.first_label TEXT`, and the same pair on `drafts`; each column's level in the migration comment.
- Server migration (one file, after the newest in `supabase/migrations/` and `.github/migrations-applied.txt`; founder `approve-migration`, D-041):
  1. The two columns, comments and CHECKs.
  2. `entries_family_rules()`, the content trigger (latest definition `20261015030000_v1_wire_contract_columns.sql:174-186`; finding F12 cited `20261003000000_security_and_family.sql:444-450`, which this later file replaced): add `first_mark` and `first_label` to both tuples, so a mark needs current content consent like any content change.
  3. `book_entries` (latest `20261015030000_v1_wire_contract_columns.sql:229-248`; F12 cited `data_governance.sql:210`, also replaced): `create or replace view` adding `e.first_mark, e.first_label` to the column list, and re-running the revoke block (`:251-253` pattern).
  4. `sync_pull` own-row objects (`20261016000000_sync_v1_server.sql:1481-1496`, second `jsonb_build_object`, and the held section's builder at `:1589-1602`, so a mark on a held draft travels with it): add both keys; others' rows get them through `book_entries`.
  5. `sync_push`: field group `first` with columns `first_mark`, `first_label`.
  6. `supabase/tests/classification.test.mjs:24`: add `first_label` to `mustBeL4`.
- Contract and phone (`sync`): `FIELD_GROUPS`, `FIELD_GROUP_COLUMNS` and `ENTRY_DATA_KEYS` (`packages/api/src/server/sync.ts:94-104, 263-267`) gain the group and keys; `ALL_GROUPS` (`apps/mobile/src/lib/sync/types.ts:51`); `entrySnapshot` (`lib/sync/outbox.ts:161`) and the merge.
- Export: `first: { label }` per letter (absent when not marked) in the next free export minor after 1.7.0 when its PR merges (1.8.0 if it lands before the seal build, otherwise the one after); bump per the `export/schema.ts` header (an optional field is a minor bump); golden fixtures regenerated in their own commit.
- Find: the label in the index `extra` column (NS-02).
- Modules: `lib/firsts/` (mark, unmark, lens query), letter page and Review action rows, Book lens frame, `packages/content` strings.
- Flag: `EXPO_PUBLIC_FIRSTS` (name proposed). Remote pause: none (A9). Error codes: none new; a refused server write is the existing typed check violation surfaced as a rejected write.
- Rollout: preview and TestFlight first; production after the study passes and the device rows pass. Rollback: flag off hides the control and the lens; stored marks stay, still sync and export; no migration is reversed.

### A11. Data inventory

| Field | Class | Where | Synced | Retention clock | Deletion path | Export | Log exclusion |
|---|---|---|---|---|---|---|---|
| `entries.first_mark` | L3 (`privacy` confirms) | server and phone | Author's phones; the other parent through `book_entries` only when the letter is visible to them | Life of the letter | With the letter (Recently deleted 30 days, then purge; Erase everything; account deletion) | Per letter, next free minor | Not logged (PRIV-R10) |
| `entries.first_label` (40 graphemes) | L4 (free text, rule 3) | same; also the Find index `extra` | same | same | same; the index row goes with it | same | Log canary |
| `drafts.first_mark`, `drafts.first_label` | L3, L4 | phone | With the held draft's own sync only | Until Keep or Let it go | Let it go; Erase everything | No (drafts are not exported as letters) | as above |

Each row lands in the same PR in `docs/legal/data-policy.md` section 4 and `DATA_CLASSIFICATION.md` (X2).

### A12. Door lines

- Shown: the mark control (intent: "This was a first") and the optional empty label field.
- Records: one boolean and up to 40 grapheme clusters on the letter, synced with it. No PRIV-R21 row, because this is a mark on the parent's own letter, not an agreement.
- Never: a list, a suggestion, a count, a notification, an analytics event, a machine-detected first.
- Decline: do not mark, or unmark in one tap.

### A13. Threats

| Asset | Threat | Control | Test |
|---|---|---|---|
| Label (L4) on a private letter | Reaches the other parent | `book_entries` serves only visible letters | A17 |
| Label | A non-author writes it | Author-only update RLS | A13 |
| Label | Machine text enters it (system writing tools) | Writing tools off (D2) | A22 |
| Mark on a sealed letter | Reveals that a sealed letter exists | Hidden by the one visibility function; no row reaches others before the instant | A15, B8 |

### A14. Never (rulings D2 and D3)

- D3: no letter text, label, child name, picture or prompt is donated to Core Spotlight, `NSUserActivity` search, Siri suggestions or an App Intents entity (`[X6-R1]`).
- D2: iOS writing tools are off on the label field (A22).
- No streak, count, badge or celebration.

### A15. Design inputs

States: mark toggle off and on; label empty, typed, at 40; lens absent (0 firsts) and present; RTL label; AX5 on SE 3 (control and field stacked); dark mode and Increase Contrast; the Undo line with its T4 window. Components reused: letter action row, text field, Book lens frame, letter card. Motion: none beyond the system toggle; no celebration.

### A16. Content inputs

Intent: control "This was a first"; label field with no placeholder; lens name by `content`. Banned: milestone, track firsts, never miss a first, typical, most babies, any count, any appendix A pattern. `content` writes; the founder approves.

### A17. Legal, privacy and compliance

Counsel packet 1.5.0; counsel must confirm: Q32 (a first can be a health fact; consumer health data), Q48 (consent design for a label that names another adult). No new data type: User Content is already declared in label 1.4.0 (`privacy` confirms).

**Label effect.** None. Mark and label are User Content on rows already declared; nothing new is collected.

### A18. Claims

Enables: "Mark a letter as a first, in your own words." Forbids: "milestones", "track firsts", "never miss a first", "typical", any count.

### A19. Free or Plus

Free. Ruled 20 Nov (T2): every capability that ships free in the 1.0.x line falls under principle 6 and never moves behind Plus; public copy says nothing either way. Marking and reading work after the allowance is used (D-082).

### A20. Measures with analytics off

Five-parent concept study before the build: pass line (PROPOSED, set before the study) at least 3 of 5 parents say they would mark a first without being asked, and for no more than 1 of 5 is a suggestion list the reason for or against. After the build, tester question (fixed wording, x of n, D5): "Did you mark a first this month (yes or no)?"

### A21. Dependencies and gates

Share one letter (Level 1) shipped; the five-parent study passed; NS-02 for the label in Find; the Book lens frame; one server migration (founder `approve-migration`); `sync` for the contract and phone mappers; device rows A11, A24 on an Asha-only install (D13).

### A22. Open questions

| Id | Question | Owner | Default if unanswered |
|---|---|---|---|
| OQ-A1 | When does the five-parent Firsts study run? | Founder | After Share one letter (Level 1) ships; the build waits for it |
| OQ-A2 | Place of the mark control on the letter page | `design-systems` | A quiet action in the letter's action row |

---

## Part B. The sealed letter ("hidden until a day I choose")

### B1. Who and when

A parent in Review, just after saying something meant for a later day (a birthday, a first school day), who wants it out of sight until then, including on the other parent's phone. HYPOTHESIS. The child cannot read the book today (no child-facing input, PRIV-R20), so the benefit today is the author's own: a letter held back until a day they chose.

### B2. Why

- Job: "I go to Review, after I have said something to {child}, to hide it until a day I choose, so that nobody else reads it before then and it opens on its own."
- What goes wrong today: the parent either keeps it (everyone in the book reads it now) or does not say it. Source: PRD V2 F41 ("Sealed letters", later); research gap G5 (UNVERIFIED).
- Evidence: HYPOTHESIS.

### B3. What, and Not in scope

What: in Review or on the letter page of an own kept letter, the parent picks a day later than today. The phone writes two values once, together: the instant (local midnight at the start of that day in the device's zone, kept in UTC) and the chosen day (ADR 0028 D3a). Until the instant, the author's phones show one "hidden until {day}" row with no words; no other person's phone receives anything. At the instant the letter becomes a normal letter everywhere, quietly. The author can choose Open now at any time; opening is permanent.

Not in scope: hiding from the author; re-sealing; changing the day once set; a notification at opening; a countdown or count; "open at 18" wording (counsel); delivery to the child; encryption claims; a sealed quiet day.

### B4. Happy path

1. In Review (or on an own kept letter's page), the parent chooses the hide-until control.
2. A date control offers only days from tomorrow to the child's 25th birthday (B11).
3. One plain sentence explains (intent: "Only you can see it until that day"), with the honest limits (B12 Shown line).
4. The parent picks a day and confirms. The phone writes `seal_opens_at` and `seal_opens_on` together; nothing about the words changes.
5. The parent keeps the letter as usual (it counts like any kept letter, B7).
6. The Book shows one row: the chosen day with "hidden until" wording and no words.
7. The letter syncs to the author's other phones with the seal; no other person's phone receives a row.
8. At the instant, the author's phone shows the letter as normal with no network and no notification. On that day only, Home's one slip may show it once (`seal.homeOpened`).
9. Other readers in the book receive it as a normal letter at their next pull after the instant (B10.1).

### B5. Unhappy paths and edge cases

| Case | Behaviour |
|---|---|
| A day in the past or today | Not offered by the control; the server accepts a past instant if one arrives late from an offline phone and treats it as open (ADR 0028 D3) |
| Sealed offline, pushed after the instant | Server accepts; the letter is open for everyone at the next pull |
| The author travels across zones | The instant never moves (B1b). West of the sealing zone the letter opens during the evening before the shown day, local time; the Shown line says so |
| The device clock is set back | The letter stays closed on that phone |
| The device clock is set forward | It opens early on that phone only; the server uses its own clock, so no other phone sees it early (B16) |
| The author chooses Open now | One confirmation, default Cancel; permanent; the server stamps `seal_cleared_at` |
| Open now offline | Opens on this phone at once; the request is resent with the unchanged pair; others receive it after the server stamps it (B13) |
| The author tries to re-seal or change the day | Not offered; the server refuses a changed pair (`SCSEL`) |
| The author deletes a sealed letter | Confirmation; Recently deleted shows a row with no words for 30 days (B25) |
| The author deletes the account before the day | The letter is deleted with the account and never published (ruling D6; B18) |
| App killed at the instant | It opens at the next launch with no catch-up notice (B24) |
| A quiet-day mark | No seal control; a write is refused (B10) |
| Plan lapsed at the opening | Reading is free (B19) |
| The other parent asks why a letter appeared later | Nothing on their phone ever said a letter was hidden |

### B6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | The control is a quiet action in Review; no tip or prompt to seal |
| Empty | n/a because a seal needs a letter with words |
| Many (1,000 letters, 300 pictures) | Sealed rows render like cards; the launch catch-up uses the local index `entries_seal_idx`; Book first render stays p95 500 ms at 1,200 letters |
| Offline | Sealing, the hidden row, the opening at the instant and Open now all work offline on the author's phone |
| Slow | Publication to others waits for the reader's next pull; nothing on the author's phone waits for the network |
| Failed | A refused push (`SCSEL`) is a rejected write the author never sees as an error; the phone keeps its own rule |
| Interrupted (call, Siri, alarm, the baby) | The date control is a sheet; leaving it writes nothing; the pair is written only on confirm |
| App killed mid-flow | The pair is written in one transaction with the confirm, or not at all |
| App updated mid-flow | The local migration adds null columns; a draft with a pair keeps it |
| Low storage (under 1 GB, under 50 MB) | No change; the pair is bytes |
| Low Power Mode and low battery | No change; opening needs no background work |
| Two books | The seal belongs to the letter in its book |
| Two parents | The other parent's phone gets 0 rows before the instant and a normal letter after (B8) |
| Expecting parent (due date only) | Latest day is the due date plus 25 years (B11) |
| Multilingual (Devanagari, RTL, CJK) | The day is rendered in the reader's locale from `seal_opens_on` (never from the instant) |
| AX5 and Bold Text on SE 3 | The hidden row wraps to two lines; the date control is the system picker in a sheet |
| VoiceOver | The hidden row reads "hidden until {day}" (intent) and has no hint that reveals words |
| Voice Control and Switch Control | Open now and the date control are commandable and scannable |
| Reduce Motion | No reveal animation exists in any mode |
| Dark mode and Increase Contrast | Tokens only; the hidden row is never shown by colour alone |
| Plan lapsed | Stays hidden, opens, reads (B19) |
| Signed out | The letter stays hidden on the phone under the same rule (D1) |
| Second account on the same phone | Account B never sees the hidden row or the letter (B17) |
| New phone | The author's new phone receives the letter with its seal before the instant and hides it (B12) |

### B7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-06-B1 | Restated 20 Nov to ADR 0028 D3a (CR-62). Given a letter in Review or an own kept letter, When the parent picks a day later than today and confirms, Then the phone writes, once and together, `seal_opens_at` (local midnight at the start of that day in the device's zone at that moment, in UTC) and `seal_opens_on` (the chosen day), and nothing about the words changes; the letter is open when `seal_opens_at` is null, or `seal_cleared_at` is set, or now is at or after `seal_opens_at` | P0 (a) | `[NS-06-B1] sealing writes the pair and nothing else about the words` |
| NS-06-B1b | Given a seal made in UTC-8 for 10 Jan, When the device zone is UTC+14 and the clock reads one minute before the stored instant, Then the letter is closed; at the instant it is open; a zone change never moves the instant, and the row still says 10 Jan (FS-R7) | P0 (a) | `[NS-06-B1b] a seal made in UTC-8 stays closed at UTC+14 until the instant` (clock and zone injection) |
| NS-06-B2 | Given a sealed letter before its instant, Then the author's Book shows one row with the chosen day and "hidden until" wording and no words; the letter contributes nothing to the Photos lens, the Firsts lens, recordings, Find, Share, Read together, the PDF book, the month opener, the Home day card or a Home memory, and Recently deleted shows no words (FS-R10). Exception (FS-R11): the author's own data export (ZIP) carries it whole | P0 (a) | `[NS-06-B2][FS-R10] a sealed letter contributes nothing to any surface until it opens` |
| NS-06-B3 | Given the author, When they choose Open now, Then after one confirmation whose default is Cancel, the seal is removed permanently, the letter reads normally, and it cannot be sealed again | P1 | `[NS-06-B3] the author can open early; opening is permanent` |
| NS-06-B4 | Given the instant passes, Then the letter becomes a normal letter with no notification, badge, count or celebration; on that day only, Home's one slip may show it once through `seal.homeOpened` (slip order: frame), with the words shown only when the parent taps | P1 | `[NS-06-B4] opening day is quiet; the Home slip shows it at most once` |
| NS-06-B5 | Restated 20 Nov (ADR 0028 Q10). Given the author's data export, Then a sealed letter is included with its words and three fields `seal_opens_at`, `seal_opens_on`, `seal_cleared_at` (export 1.8.0 per ADR 0028 D3, or the next free minor when it merges); the PDF book omits the words until open; another person's export never holds them | P0 (a) | `[NS-06-B5] the author's export keeps sealed letters whole` |
| NS-06-B6 | Given one visibility function (`isVisibleTo(entry, reader, now)`, shared with Find), Then every surface calls it; a test lists the call sites and fails on a surface that does not | P0 (a) | `[NS-06-B6] one visibility path` |
| NS-06-B7 | Given the allowance, Then a sealed letter counts when it is kept, like any letter (D-103); sealing never makes a letter free or hides it from the count | P1 | `[NS-06-B7] sealing does not change counting` |
| NS-06-B8 | Author-only seal (ADR 0028 D3). Given a sealed letter and another member's phone in the same book, When that phone syncs at any time before the instant, Then it receives 0 bytes of the words, no row, no seal date, no marker and no placeholder, and its book, Find, lenses, Read together and export show nothing; at and after the instant the letter reaches it through sync as a normal letter without seal columns. Syncing the words and hiding them on the other phone is not acceptable | P0 (a) | `[NS-06-B8] before the instant another member gets 0 rows; after it, a normal letter` (SQL test) |
| NS-06-B8b | Given phone A (author) and phone B (another member), When A seals a letter for an instant T, A pushes, B pulls (0 rows for it, cursor advances past it), T passes with no write to the row, and B pulls again, Then B receives the letter once as a normal letter; a third pull does not resend it (B10.1) | P0 (a) | `[NS-06-B8b] an opened seal reaches a phone whose cursor had passed it` (two-phone sync test with injected time) |
| NS-06-B9 | Given every seal string in `packages/content`, Then the content rules test passes and none matches README appendix A, including the loss words and "locked" | P1 | `[NS-06-B9] seal strings match no forbidden pattern` |
| NS-06-B10 | Given a quiet-day mark (D-084), Then the seal control is absent and a seal write is refused (phone; server `entries_12_seal_guard`) | P0 (a) | `[NS-06-B10] a quiet day cannot be sealed` |
| NS-06-B11 | Given the date control, Then the earliest day offered is tomorrow and the latest is the child's 25th birthday (PROPOSED); a due-date-only child uses the due date plus 25 years; a book with neither uses 25 years from today | P1 | `[NS-06-B11] the date control is bounded` |
| NS-06-B12 | Given the author signs in on a new phone (or another own phone) before the instant, Then the sealed letter arrives there with its three seal columns and is hidden by the same rule | P0 (a) | `[NS-06-B12] the author's other phones receive the seal and hide the letter` |
| NS-06-B13 | Given Open now while offline, When the phone reconnects, Then the op carries the unchanged pair with the clear request, the server stamps `seal_cleared_at` with its own time, and other members receive the letter at their next pull | P1 | `[NS-06-B13] Open now offline reaches the server later` |
| NS-06-B14 | Given a lost answer to the seal or Open now push, When it is retried, Then the result is the same (the guard compares values; the server stamp is set once) | P1 | `[NS-06-B14] seal ops are idempotent` |
| NS-06-B15 | Given `serverFeaturesEnabled()` false or `killSwitches.sync` on at sealing, Then the seal is local and pushes when on; if the instant passed meanwhile, the letter is open for everyone at the next pull | P1 | `[NS-06-B15] a seal made while sync is off still works` |
| NS-06-B16 | Given another member's device clock set forward past the instant, Then that member's pull still returns 0 rows for the letter (the server uses its own `now()`) | P0 (a) | `[NS-06-B16] a reader's clock cannot open a seal` |
| NS-06-B17 | Given account A signed out and account B signed in on the same phone, Then B sees no hidden row, no sealed letter and no seal field of A's (D1, X4) | P0 (a) | `[NS-06-B17] a second account never sees the first account's sealed letters` |
| NS-06-B18 | Given the author requests account deletion before the instant, Then the letter is tombstoned at the request (`deleted_reason = 'account_deletion'`, latest at `20261005000000_family_cap_language_idempotency.sql:435`), no other member receives it at or after the instant, and it is purged with the account; the delete-account sheet says letters hidden until a day are deleted too (ruling D6) | P0 (b) | `[NS-06-B18] a sealed letter is never published after its author asks to delete the account` |
| NS-06-B19 | Given a lapsed plan, Then a sealed letter stays hidden, opens at its instant and reads (B7) | P1 | `[NS-06-B19] seals work after a plan lapses` |
| NS-06-B20 | Given the server, Then `book_entries` returns 0 rows for a sealed letter to a non-author before the instant and the row after it, and the view's column list holds no seal column | P0 (a) | `[NS-06-B20] book_entries hides sealed letters from other readers` (SQL test) |
| NS-06-B21 | Given the content trigger `entries_family_rules()`, Then a change to `seal_opens_at`, `seal_opens_on` or `seal_cleared_at` requires current content consent like any content change (both tuples list them) | P0 (b) | `[NS-06-B21] sealing and Open now pass the content-consent gate` (SQL test) |
| NS-06-B22 | Given the `entries` table, Then its only SELECT policy for `authenticated` stays author-only (`entries_select`, `20261002020000_data_governance.sql:203-204`), so a non-author can read a sealed row only through `book_entries` | P0 (a) | `[NS-06-B22] entries stays author-only to read` (SQL test) |
| NS-06-B23 | Given `supabase/tests/classification.test.mjs`, Then `seal_opens_at`, `seal_opens_on` and `seal_cleared_at` are in `mustBeL4` and their migration comments start `L4` | P0 (b) | `[NS-06-B23] seal columns are classed L4` |
| NS-06-B24 | Given the app was killed before the instant, When it launches after the instant, Then the letter is open and no catch-up notice, badge or slip other than B4's is shown | P1 | `[NS-06-B24] a seal opens quietly at the next launch` |
| NS-06-B25 | Given the author deletes a sealed letter, Then a confirmation appears (default Cancel), and Recently deleted holds it for 30 days showing the day and no words | P1 | `[NS-06-B25] a deleted sealed letter shows no words in Recently deleted` |
| NS-06-B26 | Given the letter page or Review of a sealed letter, Then no `NSUserActivity`, Spotlight item, Siri suggestion or App Intents entity carries its words, day or child name (ruling D3) | P0 (a) | `[NS-06-B26] sealed letters donate nothing to the system` (`[X6-R1]`) |

### B8. Non-functional budgets

| Line | Budget |
|---|---|
| Latency (p95 on SE 3) | Seal write inside the 200 ms save commit; the opening at the instant needs no work beyond the visibility check at render |
| Publication to others | Option (b): at the reader's first pull after the instant. Option (a): within one job cadence (15 minutes) plus the reader's next pull |
| Memory | No change |
| On-device storage | About 60 bytes per sealed letter |
| Battery | No background work; no scheduled local notification |
| Offline | Seal, hidden row, opening and Open now work offline on the author's phone |
| Accessibility | Date control is the system picker; hidden row wraps at AX5; Open now confirmation default Cancel |
| Localisation | The day from `seal_opens_on` through `Intl.DateTimeFormat`, never computed from the instant |
| Privacy (log canary) | The three seal values are never logged on the phone or the server (the instant reveals the sealing zone's offset) |

### B9. State space

| Case | Expected | Test |
|---|---|---|
| Author's second phone | Receives the three columns; hides the letter until the instant; opens offline at the instant | B12 |
| Another member's phone | 0 rows before; a normal letter after | B8, B8b, B20 |
| Sealed offline, pushed after the instant | Server accepts; open for all at the next pull | ADR 0028 D3 test list |
| Open now offline | The pair is resent unchanged with the clear request; the server stamps it | B13 |
| Retry after a lost answer | Idempotent | B14 |
| Kill switch `serverFeaturesEnabled()` off or `killSwitches.sync` on | Seal is local; pushes when on | B15 |
| Reader's clock set forward | Still 0 rows | B16 |
| Sign out, then a second account | Stays hidden on the phone; B never sees it | B17 |
| Account deletion before the day | Tombstoned at request; never published; purged (D6) | B18 |
| Plan lapse | Stays, opens, reads | B19 |
| Remote pause | None. Rollback is the build flag, which hides only the seal control; the visibility rule, the hidden row and Open now stay in every build that has the columns, so an author is never locked out and no seal is revealed | n/a |

### B10. Data and engineering

Fields (ADR 0028 D3a, accepted under CR-62; all L4):

| Field | Type | Meaning |
|---|---|---|
| `entries.seal_opens_at` | `timestamptz null` (phone `TEXT` `YYYY-MM-DDTHH:MM:SSZ`) | The instant; the rule |
| `entries.seal_opens_on` | `date null` (phone `TEXT` `YYYY-MM-DD`) | The day the parent chose; the words |
| `entries.seal_cleared_at` | `timestamptz null` (phone `TEXT`) | Stamped by the server at Open now; never cleared |

`drafts` carries the pair on the phone from Review until Keep copies it to the letter; a held draft's pair is not pushed before Keep (ADR 0028 D3a).

Server migration (one file, after the newest in `supabase/migrations/` and `.github/migrations-applied.txt`; red-team review and founder `approve-migration`, D-041), in this order:
1. The three columns with `comment on column` starting `L4`; CHECK `entries_seal_pair` and index `entries_seal_due_idx` exactly as ADR 0028 D3a writes them (option (a) only needs the due index; option (b) uses `entries_seal_open_idx`, below).
2. Trigger `entries_12_seal_guard` with function `entries_seal_guard()` (revoked from `public`, `anon`, `authenticated` in the same file, DB-R14): the pair may go from null to a value only on a row with `kind <> 'not_much'`; a set pair never changes (compare values, so a rewrite of the unchanged pair passes); `seal_cleared_at` is set to `now()` when the client sends any non-null value, never cleared, refused while the pair is null; a past instant is accepted; refusals raise SQLSTATE `SCSEL` (registered in `docs/engineering/02-api-and-contracts.md` error table with `sync`).
3. `entries_family_rules()` (latest `20261015030000_v1_wire_contract_columns.sql:174-186`): add the three seal columns to both tuples (B21). Opening a sealed letter makes content visible to others, the same class as `new.in_book and not old.in_book`, which the trigger already gates.
4. `book_entries` (latest `20261015030000_v1_wire_contract_columns.sql:229-248`): `create or replace view` with the non-author branch gaining the clause below; the column list gains no seal column (ADR 0028 Q11 answered by `product`: no); re-run the revoke and grant block (`:251-253`).
5. `sync_pull` (`20261016000000_sync_v1_server.sql:1302`): the own-row object gains the three keys (second `jsonb_build_object`, `:1481-1496`), and the held section's builder (`:1589-1602`) gains them as always-null keys so both shapes match; plus the change of the chosen option in B10.1.
6. `sync_push`: field group `seal` (`seal_opens_at`, `seal_opens_on`, and `seal_cleared_at` as the client's request the server stamps).
7. `supabase/tests/classification.test.mjs:24`: the three names join `mustBeL4` (B23); `docs/legal/data-policy.md:91` row `sealed_until` becomes the three columns, class C.
8. `entries_select` (`20261002020000_data_governance.sql:203-204`) is unchanged: it is already author-only, so no new SELECT policy is needed (B22). (The CTO pass asked for a non-author SELECT policy change; the code shows none exists to change.)

The `book_entries` clause (sketch for `data-architect`; the view text is theirs):

```sql
-- inside the non-author branch of public.book_entries, beside "e.deleted_at is null":
and (e.seal_opens_at is null
     or e.seal_cleared_at is not null
     or e.seal_opens_at <= now())
```

Contract and phone (`sync` owns): `FIELD_GROUPS`, `FIELD_GROUP_COLUMNS`, `ENTRY_DATA_KEYS` (`packages/api/src/server/sync.ts:94-104, 263-267`) gain group `seal` and the keys; `ALL_GROUPS` (`apps/mobile/src/lib/sync/types.ts:51`); `entrySnapshot` (`lib/sync/outbox.ts:161`) and the merge inserts and updates. Phone: next free local migration with the three columns, the pair on `drafts`, index `entries_seal_idx ON entries (seal_opens_at) WHERE seal_opens_at IS NOT NULL AND seal_cleared_at IS NULL`.

Export: the three fields for the author only (B5); another reader's export never carries the words before the instant (they have no row).

Modules: `lib/seal/` (write the pair, Open now, `isVisibleTo`), Review and letter page action rows, the Book's hidden row, Home slip `seal.homeOpened`, Recently deleted row, `packages/content` strings.

Flag: `EXPO_PUBLIC_SEALED_LETTERS` (name proposed). Error code: `SCSEL` (server); the phone treats a refused seal op as a rejected write and keeps its own rule. Rollout: preview and TestFlight, then production after the gates in B21 of this part. Rollback: flag off hides the seal control only (B9 last row); the migration is never reversed.

#### B10.1 Required choice for `data-architect`: how an opened seal reaches another reader

The problem (finding F13; ADR 0028 D3): the pull cursor is `entries.sync_xid`, stamped only by a write (`sync_v1_server.sql:145-168`), and incremental pull reads rows with `(sync_xid, id)` after the cursor (`:1500-1507`). A sealed row is skipped by another reader's pull before the instant (`book_entries` returns nothing), and that reader's cursor moves past it. At the instant the row becomes readable without any write, so no later incremental pull would ever fetch it. One of two mechanisms must carry it. `data-architect` chooses before the seal migration PR opens, records the choice in ADR 0028 (an amendment) and the seal PR body, and `sync` proves it with `[NS-06-B8b]`. Default if no choice is recorded: option (b).

| | Option (a): scheduled republish | Option (b): pull clause (recommended default) |
|---|---|---|
| How | `publish_opened_seals()` runs `update public.entries set updated_at = now() where seal_opens_at <= now() and updated_at < seal_opens_at` through `entries_seal_due_idx`; the write restamps `sync_xid`, so every reader's next incremental pull carries the row (ADR 0028 D3) | `sync_pull` also returns, per book, rows readable by the caller through `book_entries` whose `seal_opens_at` fell in the half-open window (`seal_since`, now], with `seal_cleared_at` null, and whose `(sync_xid, id)` is at or before the caller's cursor (newer rows already come through the normal page) |
| Who runs it | The purge worker Edge Function, one more step in its 15-minute run, scheduled by `pg_cron` with `pg_net` (`supabase/cron/purge-worker.sql`, run by hand per project); a `pg_cron` SQL job as backstop | Nobody: the pull computes it |
| Platform dependency | `pg_cron` and `pg_net` on the production project's plan. Availability and limits on the Supabase Free plan are UNVERIFIED this session; the worker schedule must also be installed in production (`docs/ops/runbooks/purge-failing.md`) | None beyond Postgres |
| Delay for others | Up to one cadence (15 minutes) plus the reader's next pull | The reader's first pull after the instant |
| Side effects | A write on the author's row: an author's later push with an older base answers `conflict: true` (advisory); ADR 0028 marks as UNVERIFIED that an `updated_at`-only update passes `entries_guard_immutable` and that the digest path does not fight it | No write. Adds a branch to `sync_pull`, a large security-definer function, and one field each way in the pull contract |
| New objects | Function plus `service_role` grant, `grants.mjs` `SERVICE_ROLE_FUNCTIONS` row, revoke block; one `rpc` call in `supabase/functions/purge-worker/worker.ts` | Partial index `entries_seal_open_idx on public.entries (child_id, seal_opens_at) where seal_opens_at is not null and seal_cleared_at is null`; no new function or grant (the `create or replace` of `sync_pull` re-states its grants per DB-R14) |
| Test cost | Job idempotence, grants, the republish-then-older-base edit test | Window bounds, clamping, merge of an older-version row, `sync_perf` with the extra scan |

Option (b), specified so it can be built:
- Request: each book object in `p_since.books` may carry `seal_since` (an ISO timestamp the server sent earlier). Response: each book object carries `seal_watermark`, the pull's own statement time (`statement_timestamp()`, read once per call), which the phone stores per book with its cursor and sends back as `seal_since` next time.
- Validation: `seal_since` later than the server's now is treated as now; earlier than now minus 45 days (PROPOSED) is clamped to that; absent on a fresh pull (no cursor) means no extra rows (the fresh pull already reads everything readable); absent on a non-fresh pull (an app from before the seal build) means now minus 45 days. A malformed value raises the existing `22023` like a bad cursor.
- The extra rows: `select ... from entries e where e.child_id = b.id and e.author_id <> v_uid and e.seal_opens_at is not null and e.seal_cleared_at is null and e.seal_opens_at > v_seal_since and e.seal_opens_at <= v_now and (e.sync_xid, e.id) <= (v_after_x, v_after_i) and exists (select 1 from book_entries be where be.id = e.id)`, built through `book_entries` exactly as others' rows are today (`(select to_jsonb(be) - 'search' from book_entries be where be.id = p.id) || {'own': false}`), with their own `v`, appended to the book's `rows`. They do not move the cursor. At most `p_limit` such rows per call (PROPOSED); if capped, `seal_watermark` is the latest `seal_opens_at` returned, so the next pull continues.
- Security: the window is only a lower bound and every row still passes `book_entries`, so a forged `seal_since` can only re-fetch rows the caller may already read. The server never trusts a client clock for opening: the clause is `seal_opens_at <= now()` on the server.
- Phone merge (`sync` proves): a row whose id is unknown locally is inserted; a row already held at the same `v` is ignored; the cursor never moves backwards.
- Cost: one index range scan per book per pull; `sync_perf.test.mjs` gains a book with 1,000 letters and 20 opened seals, and pull time stays inside its existing budget.
- Old clients: a phone from before the seal build sends no `seal_since` and ignores `seal_watermark` (whether the pull response parser tolerates an unknown key is UNVERIFIED; `sync` checks `packages/api` before the seal build).

If `data-architect` chooses (a) instead, the seal PR first records a read of the production plan's `pg_cron` and `pg_net` availability, and a `cron.job` listing showing `scribe-purge-worker` installed in production; without both, (a) cannot be chosen.

Two-phone test `[NS-06-B8b]` (both options; server test in `supabase/tests/sync_v1_server.test.mjs` or a new `seal_publish.test.mjs`, plus one device run):
1. Users A (author) and B (parent member) share a book; both have pulled once.
2. A pushes a kept letter L with `seal_opens_at = now() + interval '3 seconds'` (device run: 2 minutes) and the matching `seal_opens_on`.
3. B pulls: 0 rows for L; B's cursor is now past L's `sync_xid` (assert on the returned cursor).
4. Wait until after the instant with no write to L.
5. Option (a) only: run `publish_opened_seals()` once; a second run changes 0 rows.
6. B pulls with its stored cursor (and `seal_since` for (b)): exactly 1 row for L, with `final_text`, and no seal key in it.
7. B pulls again: 0 rows for L.
8. A's own second session pulls before step 4: L arrives with all three seal columns.
9. Option (a) only: A pushes an edit of L's words with the base from before the republish: applied, no `conflict_groups`, no conflict copy.
10. Device run on two SE-class phones with Asha-only test accounts (D13): B sees L only at its first foreground pull after the instant ((b)) or within 15 minutes plus that pull ((a)).

### B11. Data inventory

| Field | Class | Where | Synced | Retention clock | Deletion path | Export | Log exclusion |
|---|---|---|---|---|---|---|---|
| `entries.seal_opens_at` | L4 | server author row; author's phones | Author's phones only, before and after; never in `book_entries` | Life of the letter; the seal does not extend the 30-day Recently deleted window | With the letter; tombstoned at an account-deletion request (D6) | Author's ZIP only | Never logged (reveals the sealing zone's offset) |
| `entries.seal_opens_on` | L4 | same | same | same | same | same | Never logged |
| `entries.seal_cleared_at` | L4 | same | same | same | same | same | Never logged |
| `drafts` pair | L4 | phone | No (copied at Keep) | Until Keep or Let it go | Let it go; Erase everything | No | Never logged |
| `seal_watermark` per book (option (b)) | L2 | phone sync state | n/a | Until sign-out or Erase everything | With the sync state | No | Allowed (a timestamp, no content) |

`service_role` reads the seal columns only in `publish_opened_seals()` (option (a)); under option (b) no server code reads them outside `book_entries`, `sync_pull` and the seal guard. Rows land in `data-policy.md` section 4 and `DATA_CLASSIFICATION.md` in the same PR (X2).

### B12. Door lines

- Shown: the date control; one plain sentence of what hiding does (intent: "Only you can see it until that day"); the honest limits, which `content` must word (CR-62): in a time zone west of where it was hidden, it opens the evening before the day shown; a clock set forward opens it early on that phone; and it is hidden in the app, not locked (it is not end-to-end encrypted). The delete-account sheet says letters hidden until a day are deleted too (D6).
- Records: the pair at sealing and `seal_cleared_at` at Open now, on the author's own row and phones. No PRIV-R21 row, because hiding one's own letter is a setting on it, not an agreement.
- Never: a row, marker, count or notification on another person's phone; the letter in Find, lenses, Read together, the PDF or Share before it opens; "locked", "secure", "sealed forever".
- Decline: do not hide, or Open now.

### B13. Threats

| Asset | Threat | Control | Test |
|---|---|---|---|
| Sealed words (L4) | Another member pulls them before the instant | `book_entries` clause; no row; author-only `entries_select` | B8, B20, B22 |
| Sealed words | A reader's clock set forward | Server `now()` decides | B16 |
| Sealed words | An insider or `service_role` reads them | Residual risk: not end-to-end encrypted; copy never says secure (Q43) | n/a |
| Seal columns | Expose the sealing zone's offset | Author-only; never in `book_entries`; never logged | B20, B11 log rule |
| Seal (option (b)) | A forged `seal_since` fetches more | Every row passes `book_entries` | B8b variant with a forged window |
| Sealed letter after an account-deletion request | Published to the other parent | Tombstoned at request | B18 |

### B14. Never (rulings D2 and D3)

D3: no letter text, chosen day, child name, picture or prompt is donated to Core Spotlight, `NSUserActivity` search, Siri suggestions or an App Intents entity (B26). D2: n/a because the seal adds no text field (the words are edited in Review, where D2 already holds). No notification at opening, no countdown, no count.

### B15. Design inputs

States: date control (bounded, B11); the explanation sentence with the honest limits; the hidden row in the Book (light, dark, AX5 on two lines); Open now confirmation (default Cancel); the opening-day Home slip; Recently deleted row with no words; the delete-account sheet line. Components reused: system date picker in a sheet, letter card, confirmation sheet. Motion: none on opening.

### B16. Content inputs

Intent: "Hide until a day" (control); "Only you can see it until that day"; "hidden until {day}"; Open now confirmation "Open this letter now? It cannot be hidden again." with Cancel as default; the honest-limit lines (B12). Banned: locked, unlock, secure, vault, sealed forever, time capsule, delivered to your child, any loss word, "for when they turn 18" (counsel). `content` writes; counsel reads the honest-limit and deletion lines; the founder approves.

### B17. Legal, privacy and compliance

Counsel packet 1.5.0; counsel must confirm:
- New question (number by `legal` through `next-id`): "open at 18" and any duty to deliver to a minor. Default: ordinary dates only; no "open at 18" wording.
- Q49 (death, incapacity, fiduciary access to a sealed letter), Q50 (custody: a letter hidden from the other parent; a legal order).
- Q54 and Q20: the seal row states the sealing zone's UTC offset; never brief it as location-free (CR-62 item 2).
- Q43: the honest-limit sentence and "hidden, not locked".
- ADR 0028 Q6: the founder's "build at all" question is answered by the founder's include-all-scope ruling (10 Nov) and approval (19 Nov); whether an author may hide a letter from the other parent is answered yes by B8 unless counsel's Q50 answer says otherwise.

**Label effect.** None. The columns sit on rows already declared as User Content. Counsel must not be briefed that the seal is location-free (Q54, Q20).

### B18. Claims

Enables: "Keep a letter for a day you choose." Forbids: "time capsule" security claims, "locked", "secure", "sealed forever", "delivered to your child", "for when they turn 18" (counsel).

### B19. Free or Plus

Free. A sealed letter is a kept letter and counts like one (B7). Ruled 20 Nov (T2): free in 1.0.x stays free; public copy says nothing either way. No separate Plus feature (one gate, closed X3).

### B20. Measures with analytics off

Five-parent study before the build (Karma, 11 Nov): pass line (PROPOSED) at least 4 of 5 say they would hide one letter in the first year, and none describe it as a way to hide from the other parent. After the build, tester question (fixed wording, x of n, D5): "Did you hide a letter until a day you chose this month (yes or no)?"

### B21. Dependencies and gates

ADR 0028 merged on `develop` (X11, F5; #797); the B10.1 choice recorded; Share one letter (Level 1) shipped; the five-parent study passed; counsel's new question and Q50 read; NS-10 (new phone) and backup readiness (C29, C30) as they stand; one server migration (red-team review, founder `approve-migration`); `sync` for the contract, mappers and B8b; device rows on Asha-only installs (D13). Trace: `scripts/trace.mjs` must see NS ids (F1) before these rows count as traced.

### B22. Open questions

| Id | Question | Owner | Default if unanswered |
|---|---|---|---|
| OQ-B1 | When is the sealed letter built? | Founder | In scope; after Share one letter (Level 1) ships, the study passes, ADR 0028 merges and B10.1 is chosen |
| OQ-B2 | Closed 20 Nov: author-only and the clock are settled by ADR 0028 D3 and D3a (CR-62). What remains is B10.1 | `data-architect` | Option (b) |
| OQ-B3 | Latest day offered | Founder | The child's 25th birthday (B11) |

---

## Part C. Quick capture (the four doorways: `widget`, `controlCenterControl`, `actionButton`, `siri`)

### C1. Who and when

A parent with full hands (the NS-04 persona) who wants Home's Listen screen in one touch from outside the app. Conditional: only doorways that pass NS-04.

### C2. Why

- Job: "I go to a doorway (widget, Control Center control, Action Button or Siri phrase) to open Home's capture in one touch, so that a thought is still there when I can speak."
- What goes wrong today: unlock, find the app, wait, tap Speak. Evidence: HYPOTHESIS; competitors' widgets UNVERIFIED.

### C3. What, and Not in scope

What: each doorway that passed NS-04 opens the one Listen screen in the Ready state through `startCapture({source})` (design N3 and step 0 are prerequisites). None records on its own (NS-04 EX-2). None keeps a letter.

Not in scope: a doorway that did not pass NS-04 or cannot reach the phone and iOS version it runs on; a wake word; screen-off recording without an approved plist delta; a widget showing a name, letter or count; a second capture screen; any driving feature.

### C4. Happy path

1. The parent adds the widget, control or Action Button shortcut in iOS, or says the Siri phrase.
2. They trigger it; the phone asks to unlock if locked (Face ID or passcode).
3. App lock applies if on.
4. Listen opens in Ready with the active book.
5. The parent taps Ready to start; the take proceeds as from Home.
6. On finish, the letter is a draft ("Waiting to be kept") until kept in Review.

### C5. Unhappy paths and edge cases

| Case | Behaviour |
|---|---|
| A take is already active | Second start refused (F04-U23) |
| The phone is locked | Unlock first; no take starts from a locked screen |
| Siri mishears | Opens the app at Ready, never records by itself |
| The doorway is not available on this phone or iOS version | iOS does not offer it; nothing appears in the app about it (C6) |
| Not enough space | Today's capture error state |
| Speech model not ready | Draft with no words; counts only once words exist and it is kept (D-103) |
| A call or alarm mid-take | Held, not lost (NS-04 Q12 result) |
| AirPods connect mid-take | As NS-04 Q14 found |
| Driving Focus on | Opens Ready with no change; no driving wording (NS-04 Q13) |

### C6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | Before first run is complete, a doorway opens the first-run screen, never Ready |
| Empty | No book: Home's empty state, never a recording |
| Many (1,000 letters, 300 pictures) | No effect |
| Offline | Works |
| Slow | Trigger to Ready 3 s or less after unlock (NS-04 EX-1) |
| Failed | Opens the app at Home; no error naming the doorway |
| Interrupted (call, Siri, alarm, the baby) | Take held, not lost (C9) |
| App killed mid-flow | F04 and ADR 0027 take recovery; nothing new |
| App updated mid-flow | Static doorway; nothing to migrate |
| Low storage (under 1 GB, under 50 MB) | Under 50 MB: today's capture error state |
| Low Power Mode and low battery | Works; F04's battery and thermal rules |
| Two books | Ready opens with the active book (NS-14) |
| Two parents | Per phone; nothing shared |
| Expecting parent (due date only) | Ready with the Before You book |
| Multilingual (Devanagari, RTL, CJK) | Fixed label in the interface language; no letter words on the doorway |
| AX5 and Bold Text on SE 3 | Ready already passes AX5; widget text follows system sizes |
| VoiceOver | Ready announced on arrival; doorway label read by iOS |
| Voice Control and Switch Control | NS-04 Q7 results; visible labels are commands |
| Reduce Motion | Ready's own rules |
| Dark mode and Increase Contrast | System appearance |
| Plan lapsed | Works; capture is never blocked |
| Signed out | Works on the local book (D1) |
| Second account on the same phone | Ready for the signed-in account's books only (X4) |
| New phone | Doorways are per phone; added again in iOS |

### C7. Acceptance criteria (conditional on NS-04)

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-06-C1 | Given a doorway that passed NS-04 EX-1 to EX-5, When the parent uses it, Then Listen opens in Ready through the same `startCapture({source})` route as Speak; a second start while a take is active is refused (F04-U23) | P0 (c) | `[NS-06-C1] every doorway lands in the one Listen screen` |
| NS-06-C2 | Given a widget or control, Then it is static: no child name, no letter text, no data (F04-REQ-020) | P0 (a) | `[NS-06-C2] doorways carry no data` |
| NS-06-C3 | Given the built plist, Then it contains no app group, no `UIBackgroundModes` and no location unless the founder has recorded a decision (NX-39-R4, R51; preflight script) | P0 (b) | `[NS-06-C3] the plist delta equals the approved delta` |
| NS-06-C4 | Given a hands-free start that ends, Then the letter is a draft with its recording; 0 kept letters come from a doorway | P0 (c) | `[NS-06-C4] a doorway never keeps a letter` |
| NS-06-C5 | Given the doorway strings, Then copy never says "while driving", never counts how often a doorway is used, and matches no README appendix A pattern | P1 | `[NS-06-C5] doorway strings match no forbidden pattern` |
| NS-06-C6 | Given a phone model or iOS version on which a doorway did not pass NS-04 (NS-04 Q11), Then that doorway is not offered there (no widget kind, control or App Shortcut registered for it) | P1 | `[NS-06-C6] no doorway where it did not pass` |
| NS-06-C7 | Given the source, Then no App Intents entity, `NSUserActivity` or Spotlight item exists for a letter, child or prompt; App Shortcuts take no parameter carrying words (ruling D3; NS-04-R8) | P0 (a) | `[NS-06-C7] no letter, child or prompt entity exists` (`[X6-R1]`) |
| NS-06-C8 | Given `EXPO_PUBLIC_QUICK_CAPTURE` off, Then no doorway is registered in that build (no widget kind, control, App Shortcut or Siri phrase), and nothing about doorways appears in the app | P1 | `[NS-06-C8] flag off registers no doorway` |
| NS-06-C9 | Given an incoming call, a Siri request or an alarm during a take started from a doorway, Then the take is held, not lost, exactly as from Home | P0 (a) | `[NS-06-C9] an interrupted doorway take is held` (device) |
| NS-06-C10 | Given Driving Focus on, Then a doorway opens Ready with no change in behaviour and no driving wording | P1 | `[NS-06-C10] Driving Focus changes nothing` (device) |
| NS-06-C11 | Given AirPods connect or disconnect during a doorway take, Then the take continues or is held per NS-04 Q14, and is never lost | P1 | `[NS-06-C11] a route change never loses a take` (device) |

### C8. Non-functional budgets

| Line | Budget |
|---|---|
| Latency (p95 on SE 3) | Trigger to Ready 3 s or less after unlock (PROPOSED, NS-04 EX-1); Ready to microphone live p95 500 ms (F04-REQ-023) |
| Memory | An extension, if any, holds no letter data |
| On-device storage | None added |
| Battery | No background listening; static widgets |
| Offline | Works |
| Accessibility | Voice Control and Switch Control per NS-04 Q7; iOS-provided labels |
| Localisation | Fixed labels in `packages/content` |
| Privacy (log canary) | `source` is the only new value logged, never with audio, words or names |

### C9. State space

| Case | Expected | Test |
|---|---|---|
| Second phone | Doorways are per phone | n/a |
| Second account on this phone | Ready for the signed-in account only (X4) | `[X4-R1]` |
| Offline | Works | C1 |
| Retry after a lost answer | n/a: no server call | n/a |
| Sign out | Works on the local book (D1) | C1 |
| Account deletion | After the erase, Ready opens an empty Home | erase tests |
| Kill switch `serverFeaturesEnabled()` off | No effect | C1 |
| Remote pause | None. Changed 20 Nov: the draft's "own `source` entry in remote config" and the CTO pass's `remoteConfig.doorways` allowlist (default empty) are both withdrawn. An allowlist turns a feature on remotely, which the kill-switch vocabulary forbids ("none can turn a feature on", `packages/api/src/kill-switches.ts`) and Apple 2.5.19 treats as hidden; a per-doorway off switch would be a switch on recording, which LEGAL-REQ-040 excludes. Rollback is the build flag (C8) | n/a |
| Plan lapse | Works | C1 |

### C10. Data and engineering

- Fields, migrations, sync groups, export: none.
- Modules: `lib/capture/start-capture.ts` (`source` values `widget`, `controlCenterControl`, `actionButton`, `siri`), per doorway a config plugin or native target as NS-04 found, `app.config.ts` plist entries within the approved delta.
- Flag: `EXPO_PUBLIC_QUICK_CAPTURE` (name proposed), one flag for the doorways. Remote pause: none (C9).
- Error codes: none new.
- Rollout: a Siri or Shortcuts phrase first if it needs no new target; the widget and Control Center control only if their plist delta is approved. Rollback: flag off in the next build. Each native build counts against D-092.

### C11. Data inventory

None new. Opt-in analytics (off through 1.0, D-124) may later carry `capture_started` with a `source` value if `data-analyst` adds it.

### C12. Door lines

Written per doorway in NS-04b. For a doorway that needs no new permission: "Records: on the phone only; no PRIV-R21 row, because adding a doorway in iOS is a setting." Never: audio before the parent's tap on Ready. Decline: remove the doorway in iOS; nothing else changes.

### C13. Threats

| Asset | Threat | Control | Test |
|---|---|---|---|
| L4 data in an app-group container | An extension reads it | No app group (C3) | C3 preflight |
| Microphone | Records without a tap | Ready only; EX-5 | NS-04-R7, C1 |
| Letters, names, prompts | Donated to Siri, Spotlight or App Intents | D3 | C7 |

### C14. Never (rulings D2 and D3)

D3: as C7. D2: n/a because a doorway adds no text field. No always-on microphone, no wake word, no automatic title or summary of a doorway take.

### C15. Design inputs

Design spec 05 states: widget (static), Control Center tile, Siri result, Ready on arrival from a doorway, the unlock prompt. Smart Invert: the widget mark ignores invert. Dark mode: system appearance.

### C16. Content inputs

Intent: "Start a letter" (widget and control label); Siri phrase "Start a letter in {brand.name}". Banned: while driving, hands-free while you drive, always listening, "nothing leaves your phone" next to a Siri doorway (Siri sends the spoken phrase to Apple), any count.

### C17. Legal, privacy and compliance

Apple 2.5.19: each doorway is documented in the Notes for Review of the build that ships it (research notes 20 Nov). A plist purpose string or label line goes to Q54; counsel must confirm. Per doorway, NS-04's `Apple processes audio:` line decides any privacy wording.

**Label effect.** None from a Siri phrase or App Shortcut that needs no new permission; a widget or control is whatever delta NS-04 lists for it, applied in the same build as the doorway, never before.

### C18. Claims

Enables: "Start a letter from your Lock Screen" (or the doorway that ships), only after it ships. Forbids: hands-free while driving, always listening, voice-activated recording, "nothing leaves your phone" next to Siri.

### C19. Free or Plus

Free; capture is never blocked. Ruled 20 Nov (T2): free in 1.0.x stays free; public copy says nothing either way. No Plus line mentions doorways.

### C20. Measures with analytics off

Tester question (fixed wording, x of n, D5): "Did you start a letter from the Lock Screen, Control Center, the Action Button or Siri this week (yes or no)?"

### C21. Dependencies and gates

NS-04 GO and NS-04b; F04; the preflight rules; design step 0 (`startCapture({source})`) and navigation test N3; `security-architect` read of the plist delta; device rows C9 to C11 on Asha-only installs (D13).

### C22. Open questions

| Id | Question | Owner | Default if unanswered |
|---|---|---|---|
| OQ-C1 | Siri phrase before the widget? | `mobile` after NS-04 | Yes, if it needs no new target |
| OQ-C2 | Should a doorway ever be removable remotely? | Founder with counsel (LEGAL-REQ-040 owner) | No; the build flag is the rollback |

Not fully testable: A11, A24, B8b's device step and all of Part C need devices; Part C cannot be tested before NS-04 runs; study pass lines are proposals.
