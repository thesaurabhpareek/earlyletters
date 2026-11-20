# 10. Reading and family: engineering design for NS-21 to NS-31, NS-05 and NS-06

Status: Proposed, 20 Nov 2026. Author: `mobile` (Claude Code session). Target: `docs/tdd/new-scope/10-reading-and-family.md`. Docs only.
Read at: locked pack #846 head `450bcb4a` (unchanged from the brief); `develop` `d5d12178`; plan #847 head `de44b839`; open PR heads #798 `7f36031a` (Find), #839 `81023add` (photo on the letter page), #840 `cc94d0d3` (Photos lens), #721 `75a0667e` (From the book, draft), #758 `4b108df4`. Platform sources read in the repo's `node_modules`: react-native 0.86.3, expo-sharing 57.0.22, expo-file-system 57.0.7, @expo/ui 57.0.21.
Tags as in `docs/tdd/01-mobile-client.md`: **Fact** (file:line, at `develop` `d5d12178` unless a PR is named), **Assumption**, **Rec**, **Risk**, **OQ** (owner, default), **Conflict** (listed again in section 6), **Unverified**. Schema detail for NS-06 lives in `data-and-sync.md` (written in parallel); this file names only what the phone needs.

| Card | Wave (13 s4, #847) | Depth here |
|---|---|---|
| NS-21 letter page | 2 | Full design (section 1) |
| NS-22 calm header | 3 | Outline (section 2) |
| NS-23 one past letter | 3 | Outline (section 3) |
| NS-05 share one letter, Level 1 | 3 | Outline (section 4) |
| NS-24 read the year back; NS-06 Part A Firsts | 4 | One paragraph each (section 5) |
| NS-06 Part B sealed letter, Part C quick capture; NS-25 | 5, gated | One paragraph each (section 5) |
| NS-26 to NS-31 | parked | One paragraph each (section 5) |

## 0. Summary

1. NS-21 is a layout change with no data, sync, native or flag work. The design puts the fixed row order in one pure row model (`components/book/letter-list.logic.ts`) so NS-01, NS-05, NS-06, NS-08, NS-12 and NS-15 each add a predicate, not a new block in a 670-line screen.
2. Two duties the cards ask for cannot be met by React Native today. **Fact**: RN 0.86.3 exposes no Writing Tools switch on `TextInput` (no `writingToolsBehavior` in `node_modules/react-native/Libraries` or `React`; none in @expo/ui 57.0.21), so ruling D2 becomes a recorded finding (NS-21-R12 allows it; NS-06-A22 then needs a founder decision). **Fact**: RN has no native `aria-level` (none in RN 0.86.3 `Libraries`; our `Text` sets it "on web", `components/ui/text.tsx:101`), so NS-21-R4's levels are provable on web only; on iOS both are header traits (**Unverified** that UIKit has no public heading level).
3. A P0 gap exists today: the built "A month ago" card ignores Quiet this book (`resurfaced()` takes no quiet input, `components/tonight/draft-card.logic.ts:190-206`; Home passes entries only, `app/(tabs)/index.tsx:200`), which J-N19 (P0) forbids. **Rec**: fix it in NS-23's first PR, outside the flag.
4. Share Level 1 uses RN `Share.share({ message, url })`, the only installed API that hands text and one file together (expo-sharing's `shareAsync(url, options)` takes one URL and no text, `expo-sharing/build/Sharing.d.ts:12`). Its iOS promise may never settle in one path (section 4), so temp-file deletion has three backstops.
5. Seals stay design-only: no seal code until counsel answers Q6 (CR-62 item 1, `docs/agents/cto/RULINGS.md:585`; #847 Q3). Co-parent (NS-25) stays alpha-only (D-162, `docs/DECISIONS.md:669`).

---

## 1. NS-21 The letter page reads as one place (wave 2, full design)

### 1.1 Behaviour to meet
Rows NS-21-R1 to R14 (card section 7); P0 rows R4, R9, R11, R12, R13. Journey J-N12. Order of work (card s10, #847): BL-928 (NS-33-R1, dateline heading) then #839 then BL-937 (this card).

### 1.2 What is built
- **Fact**: the page reads its letter synchronously on mount (`app/letter/[id].tsx:127`); Play sits after the words (`:413`); a provenance block holds the provenance line, the Private chip and the "Exactly as said" switch (`:430-456`); own letters get one inset list: Make private or Add to book, Change the date, Delete (`:458-481`); the words sheet's `TextField variant="letter"` is the only field whose text becomes a letter's words (`:617-629`).
- **Fact**: `toggleInBook` ignores the boolean that `setEntryInBook` returns and updates the page anyway (`:346-352`; `lib/store.ts:717`), so a failed write shows the new state. The card's Failed row (s6) forbids that.
- **Fact**: the other parent's letter shows no list at all today (`own &&`, `:458`); the card wants read-only facts there.
- **Fact**: `ListSection` already draws its title with `asHeading` (`components/ui/list-row.tsx:34-38`); `ListRow` is `min-h-11` (44 pt) and grows with type, value moving under the title at AX sizes (`:113`, `:94-106`).
- **Fact**: #839 adds `LetterPhoto` after the words and signature and before Play, with its own Add, Change, Edit words and Remove buttons inline (#839 `app/letter/[id].tsx` hunk at `:411`; `components/photos/letter-photo.tsx`).
- **Fact**: the page can tell whether anyone else reads the book: `listMembers(childId)` returns the other members from the last pull (`lib/store.ts:440`); a book only on this phone has none.

### 1.3 Design
**Row model** (new, pure, Node-tested): `apps/mobile/src/components/book/letter-list.logic.ts`.
- `LETTER_ROWS = ['day', 'first', 'picture', 'sealedUntil', 'whoCanRead', 'versions', 'recording'] as const` is the card's fixed order, stated once.
- `letterRows(input): { id: LetterRowId; actionable: boolean }[]`, where `input` is `{ own, words: 'waiting' | 'nobodySpoke' | 'words', typed, inBook, otherReaders, applies: Partial<Record<LetterRowId, boolean>> }`. Rules: `day` always, actionable only when `own`. `whoCanRead` when `own && (!inBook || otherReaders > 0)`. `recording` when not `typed`. `first`, `picture`, `sealedUntil` and `versions` only when their card's predicate in `applies` is true. `versions` and `sealedUntil` are never present when `!own`. Nothing is actionable when `!own`.
- `pageControls(input): { share: boolean; delete: boolean }`. `delete = own`. `share` is false until NS-05 passes its own predicate (`lib/share/eligibility.ts`, section 4).
- **Rec**: count every other member (parent or contributor) in `otherReaders`, not parents only, because anyone else who reads the book makes "who can read it" a real question.
- **Conflict** (C1): R10 (a waiting letter lists only day and recording) and R9 (P0, a private letter always shows its row) disagree for a private voice-only letter still waiting for words. **Rec**: P0 wins. The model shows `whoCanRead` for a private waiting letter, and the test cites both ids.

**Screen** (`app/letter/[id].tsx`), in tree order, which is also VoiceOver order: opening (dateline `asHeading={1}` from BL-928, the words), signature, picture (#839, display only), Play, waiting or read-it-back card (as built), the typed footnote (typed letters only) and the "Exactly as said" switch (as built), the Share slot (empty until NS-05), `ThisLetterList`, then Delete in its own `ListSection` as the last element.
- New `components/book/this-letter-list.tsx` maps the model to `ListSection` (title key below, heading) and `ListRow`s. The `day` row uses the built `DateSheet`. The `whoCanRead` row shows its current value and opens a new `components/book/who-can-read-sheet.tsx` (existing `Sheet` plus `ChoiceGroup`, two choices, the current one selected). Choosing the other calls `setEntryInBook`. On `false` it keeps the old value and shows `copy.errors.generic` as `changeDate` already does (`:358`). The `recording` row carries what the provenance line says today (`lib/provenance.ts:41-47`) as title and subtitle rather than one assembled sentence. NS-08 owns the "elsewhere" wording.
- The picture row (row 3): #839's add, change, edit-words and remove controls move out of `LetterPhoto` into this row and one sheet. The picture itself stays in the body.
- **Conflict** (C2): NS-21 s3 row 3 puts the picture "above the words"; #839 puts it after the words and signature. **Rec**: keep #839's place. `CardToPage` carries the card's dateline and words into a measured spot at the top of the page (`:263-276`), and a picture of unknown height above them would break the carry and move the words after open. **Conflict** (C3): R14's order omits the picture and the "Exactly as said" switch, both of which stay on the page. Product should add them to R14.
- **Conflict** (C4): s3 row 5 hides Who can read it for an in-book letter in a one-adult book. Under D-162 that is every store user, so the built "Make private" leaves the page for all of them (it stays in Review's destination choice). Product should confirm this is intended. When the row is absent, nothing on the page mentions another reader or an invite (D-161).
- **Rec** (design-systems hand-off): `ListSection` gains `titleLevel?: 2` (one line in `components/ui/list-row.tsx`) so web and tests can assert the level. On iOS the title stays a header trait.

**Content keys** (PROPOSED for `content`; `content` writes, the founder approves): `letterPage.list.title`; `letterPage.row.day`; `letterPage.row.whoCanRead` with values `letterPage.whoCanRead.onlyYou` and `letterPage.whoCanRead.inBook`; `letterPage.row.recording`; in a new `packages/content/src/features/letter-page.en.ts` (the `find.en.ts` and `photos.en.ts` pattern). Built keys reused: `book.entryMenu.deleteButton` and `settings.delete.*` (Delete), `review.destination.*Toast` (toasts), `book.provenance`, `book.recordingOnPhone`.
- **Conflict** (C5): BL-937's scope says "No new words beyond keys that exist", but the card needs a list title and two values. **Rec**: the content PR (PR 2 below) merges first.

### 1.4 Data
None new. Read: `entries.in_book`, `occurred_on`, `occurred_precision`, `capture_mode`, `audio_uri`, `final_text`, `raw_transcript` (through `lib/provenance.ts`), and the `members` JSON on `sync_books` (`lib/store.ts:441`). No local or server migration, no RLS or grant change, no classification change. Export: no effect.

### 1.5 Sync and API
None new. Who can read it and the day travel in the built field groups `in_book` and `occurred_on` (`packages/api/src/server/sync.ts:94-104`). Only the author can change a letter because the database decides (PRINCIPLES 8; `entries_select` and the update policies are author-only). The page only hides controls (R11).

### 1.6 Native, flags
Native: none; no module, entitlement or plist key. Flags: none (card s10). The change ships whole; rollback is a revert of each PR.

### 1.7 Privacy and security
Nothing new leaves the phone. The page logs nothing new; `letter_opened` stays content-free (`:145`) and analytics is off (D-124). Threat (card s13): a mis-tap makes a letter readable by the other parent. Control: the row states the value in words, the change goes through a two-choice sheet with the current choice selected, and the built toast announces it. D3: the page calls no donation API. **Fact**: there is no `NSUserActivity`, CoreSpotlight or App Intents use in `apps/mobile/src`, `apps/mobile/modules` or `app.config.ts` today (repo grep); `[X6-R1]` makes that a test. X2: n/a.

### 1.8 Accessibility
AX5 plus Bold Text: one column; `ListRow` puts values under titles at AX sizes; Share and Delete are full width. VoiceOver: dateline heading, then the tree order above. Voice Control: each row's label is its title plus value (`rowLabel`, `list-row.logic.ts`). Reduce Motion: the built 200 ms fade (no new motion). Increase Contrast and dark mode: tokens only.

### 1.9 Performance
Budget R8: page interactive p95 300 ms from a Book card on SE 3. The row model is O(1) and adds one synchronous read of `sync_books.members`. Nothing is awaited on open. CI cannot time a phone. CI guards the path with a source scan: no `await`, `fetch` or `supabase` in the page module or the row model. The timing itself is a founder device row (BL-948 run sheet). Launch budgets (A-NFR-001, A-NFR-002, B-NFR-008): untouched, because the page is not on the launch path.

### 1.10 How each P0 row is tested
| Row | Test |
|---|---|
| R4 headings | Unit: source scan of `letter/[id].tsx` and `this-letter-list.tsx` (dateline `asHeading={1}`, list title heading). Web journey (`e2e-web`, Playwright, Asha seed): `getByRole('heading', { level: 1 })` and `{ level: 2 }` on the letter page (**Assumption**: the web preview reaches `/letter/[id]` with the seed). Device: rotor walk on SE 3 (BL-948) |
| R9 private row | Unit on `letterRows`: own, private, `otherReaders` 0, 1, 2, each words state |
| R11 no author controls | Unit: `!own` gives no actionable row and no `whoCanRead`, `sealedUntil`, `versions` or Delete. Server: existing author-only RLS tests in `supabase/tests` |
| R12 writing tools | Ratchet test: reads RN's `TextInput.d.ts`. If `writingToolsBehavior` exists, every `TextField variant="letter"` must pass it (source scan); if not, the test passes and cites this file's finding (section 0 item 2) |
| R13 no donation | `[X6-R1]` source scan of `apps/mobile/src`, `apps/mobile/modules/*/ios` and `app.config.ts` for `NSUserActivity`, `CSSearchableItem`, `CoreSpotlight`, `AppIntent`, `INInteraction`, `donate` |

The P1 rows are unit-tested on the model: R1, R2, R3b, R6a, R6b and R10. R3a is tested once NS-05 fills the slot. R5, R8 and R14 are device rows, and J-N12 runs on device.

### 1.11 PR breakdown (merge order; each under 400 lines and 20 files)
| PR | Scope | Owner | Lenses A / B | Size |
|---|---|---|---|---|
| 1 | Row model and tests; `[X6-R1]` scan; R12 ratchet | mobile | principal-architect / design-systems | ~250 lines, 4 files |
| 2 | `letter-page.en.ts` keys (PROPOSED), index export, content rules | content | design-systems / compliance-engineer | ~60 lines, 3 files |
| 3 | Screen uses the model: `this-letter-list.tsx`, `who-can-read-sheet.tsx`, provenance into the row, Delete last, Share slot, the `setEntryInBook` failure fix, source-scan tests | mobile | principal-architect / design-systems | ~330 lines, 6 files |
| 4 | Picture row: #839's controls move from `LetterPhoto` into row 3 and one sheet | mobile (photo lane) | principal-architect / design-systems | ~200 lines, 4 files |
| D1 | `ListSection titleLevel` (web) | design-systems | mobile / qa | ~10 lines, 2 files |

### 1.12 Dependencies, risks, open questions
Dependencies: BL-928 (wave 1) and #839 merged before PR 3 and PR 4; PR 2's words approved by the founder before PR 3 merges (no flag); BL-948 carries R5, R8, R14 and the R4 rotor row (founder, Asha-only install, D13).
- **Risk**: every new-scope card edits `app/letter/[id].tsx`, so the file collides across PRs. Way back: the row model makes each later card a predicate plus one row component; a collision is reverted per PR.
- **Conflict** (C12): NS-21-R4 (P0, LEGAL-REQ-051) asks for heading levels; React Native 0.86.3 on iOS sets only the header trait, with no level (as `11-foundations.md` P7 records for NS-33-R1). The build ships the trait and the order, and the level is proven on web only, until product or `compliance-engineer` rules.
- **Risk**: LEGAL-REQ-051 asks for heading levels, but iOS may only carry a header trait. Way back: the web assertion plus the device rotor walk; `compliance-engineer` reads whether trait and order meet the duty (OQ-21b).
- **OQ-21a** (Karma): a dark flag for PR 3, so it can merge before the words are approved? Default: no flag; PR 3 waits for PR 2.
- **OQ-21b** (`compliance-engineer` with `design-systems`): does a header trait in the right order meet LEGAL-REQ-051 on iOS without levels? Default: yes, with the web level test as proof of intent.
- **OQ-21c** (design, card OQ): spacing between Share and the list. Default: the design language's section spacing.

---

## 2. NS-22 The Book header stays calm (wave 3, outline)

Rows R1 to R7; P0 R2 (44 pt and fixed order at AX5) and R3 (no gear; Quiet and Hide in 2 taps). It depends on #798 (Find) and #840 (lens) landing; BL-938 also waits for `design-systems`' one-page delta.
- **Fact**: the cover band takes Months and the gear as trailing controls (`components/book/cover-band.tsx:86-91`), and the inline bar repeats title, Months and gear (`app/(tabs)/book.tsx:385-401`). #798 adds Find between Months and the gear in both places. #840 adds the lens row under the band. `setChildQuiet` has no caller (`lib/store.ts:390`; repo grep). The column is `child_member_prefs.quiet_at`, not `children.quiet` as the card says (`lib/db/migrations.ts:299, 316`).
- **Decision**: one pure `bookHeader(input) -> ControlId[]` in `components/book/book-header.logic.ts` gives the order title, age, switcher, Read together, lens, Find, Go to a month, end menu, with absent (never disabled) controls. Both the cover band and the inline bar render from it, so the order exists once. The gear leaves both. The `/settings` deep link and Me are unchanged (`app/(tabs)/you.tsx:1-6`; its comment about the Book gear needs updating).
- **Decision**: the end menu is an `IconButton` that opens the system menu from `@expo/ui/swift-ui` `Menu`. The package is installed and already used by `components/ui/sheet.tsx` and `components/platform/toggle.ios.tsx`, so no new library. Its items: Quiet this book or Unquiet (`setChildQuiet`), and Hide this book (`hideChild` through the built confirm, `app/settings/children/[id].tsx:114-126`). A hidden book opened from Hidden books gets Show this book again (`unhideChild`). **Unverified**: `Menu`'s VoiceOver and AX5 behaviour inside an RN layout. Fallback: the existing `Sheet` with two `ListRow`s (the Months sheet pattern).
- **Fact**: Hide this book is offered only when there is more than one book (`app/settings/children/[id].tsx:187`). **Conflict** (C6): R3 says Hide is reachable in 2 taps with no one-book exception. **Rec**: keep the built rule; R3 applies where Hide exists. **OQ-22a** (product): does Hide's confirm count as a tap? Default: no; the confirm is the act.
- Data, sync, API, native, flags: none (card s10). Quiet stays on the phone until F12's per-person server column ships.
- Tests: unit on `bookHeader` (R2 order, R4 empty book, R7 Unquiet); source scan for R3 (no `GearSixIcon` in `book.tsx` or `cover-band.tsx`) and R6 (`/settings` route present); device rows R1, R5, R2 at AX5 (BL-948).
- PRs: (1) header model and tests (~200 lines); (2) band and bar render from it, the end menu, gear out (~300 lines). Lenses: design-systems / principal-architect (#847).
- **Risk**: the Book header at AX5 is reported to break (card 11 s2, **Unverified**). Way back: Go to a month folds into the end menu at AX3 and up (card OQ default).
- **Risk**: #798 waits on the founder's size exception (#847 Q4), and this card waits on #798.

---

## 3. NS-23 One past letter on Home (wave 3, outline)

Rows R1a to R18; P0 R5, R8, R11, R15, R17; journey J-N19 (P0). It replaces the built card under `EXPO_PUBLIC_PAST_LETTER` (PROPOSED, off by default).
- **Decision (P0 now)**: add the quiet guard to the built `resurfaced()` outside the flag (section 0 item 3), with a test `[NS-23-R8]` that runs with the flag off and on.
- **Decision**: one pure picker `pastLetter(entries, today, ctx)` in `components/tonight/past-letter.logic.ts`. `today` is the room clock's local day (`index.tsx:180-181`).
  - Eligible: #721's rule (`eligibleForTheBook`: kind letter, in the book, words, not month-only, not dated today, not `hard.*`), plus words kept (not `wordsUnreviewed`), not deleted, the book not quiet or hidden, and `ctx.isOpen(entry)`. `isOpen` is constant true until NS-06 Part B injects the seal rule.
  - Match: `dayMatches = d == D || (D == lastDay(Y, M) && d > D)`. That one clause covers R9a (29, 30, 31 into a shorter month) and R9b (29 Feb into 28 Feb). Year match: `m == M && y < Y`. Month match: `(y, m) < (Y, M)`. The current month never matches (R9c).
  - Choice: year matches by most recent year, else month matches by most recent month; ties by later `captured_at`, then id ascending (R12, PROPOSED).
  - It is O(n) over the active book. A CI microbenchmark over a 1,200-letter Asha fixture guards the 5 ms budget; the device row is authoritative.
- **Decision**: the slip registry `components/tonight/home-slips.ts`. `HOME_SLIPS = ['waiting', 'sealOpened', 'saveACopy', 'pastLetter']` and `homeSlip(input)` returns the first slip due, so the order is stated once. Home renders slips only through a `SLIP_VIEWS` map. `[FRAME-SLIP]` is a unit test of the order plus a source scan that fails when `index.tsx` renders a card outside the map.
- **Reuse from #721**: `excerptOf`, `cappedWords`, `isHardPrompt` and the grapheme prefix (#721 `from-the-book.logic.ts`). Its 28 to 35 day window, daily rotation and day-zero card do not ship here (R16; card OQ-1). **OQ-23a** (Karma): rebase #721 or supersede it? Default: supersede, carrying its pure helpers and tests into PR 2 with credit, and close #721.
- Settings (L2, phone only, not synced, cleared by Erase everything): `home.pastLetters` (switch, default per card OQ-2) and `home.pastLetter.dismissedOn`. **Risk**: a pure rule can change its pick mid-day when sync brings in a better match, which bends R13. **OQ-23b** (product): add a third key that pins the day's pick? Default: no new key; R13 is tested on an unchanged book.
- Privacy: the App lock privacy cover already blanks the switcher snapshot (`coverShown`, `lib/app-lock/machine.ts:135-137`), and `[NS-23-R11]` asserts that rule. No analytics event and no log. D3: covered by `[X6-R1]`.
- Native: none. Sync, API, data on the server: none.
- PRs: (1) quiet guard, slip registry, `[FRAME-SLIP]` (~200 lines); (2) the picker and its tests (~350 lines); (3) Home wiring behind the flag, the "Not today" dismiss, the Me switch in `app/settings/index.tsx`, keys PROPOSED (~300 lines). Lenses: principal-architect / design-systems. Depends on BL-937 (#847) and the NS-21 Back behaviour.
- Content keys (PROPOSED): `home.pastLetter.dismiss`, `settings.pastLetters.label`, `settings.pastLetters.footer`. The kicker is the letter's own date (`dayDate`); there is no new kicker string.

---

## 4. NS-05 Share one letter, Level 1 (wave 3, outline)

Rows R1 to R27; P0 R3a, R3b, R4a, R5a, R5b, R6a, R6b, R7, R10a, R10b, R12, R16a, R16b, R18, R21, R25, R27; journey J-N11 (P0). Flag `EXPO_PUBLIC_SHARE_LETTER`, off in production until its gates pass. It depends on NS-21 PR 3 (the Share slot).
- **Conflict** (C7): Karma's brief and BL-939's title say Level 1 is text only, while the card's R5b, R6a, R6b and R10a to R10c specify an optional picture (default off). **Rec**: build text first (PRs 1 and 2). Design the picture as PR 3, held until NS-01 is on and the X2 note is satisfied for a picture of the child leaving the phone (a `security-architect` read and counsel's Q45, on record).
- **Decision, payload**: `lib/share/payload.ts`, pure. `buildShareText(entry, child, locale)` returns exactly `FSI date PDI`, a blank line, `final_text`, a blank line, `FSI signature PDI` (R18, R20). The date is the about-day through `Intl.DateTimeFormat`, month and year when `occurred_precision = 'month'`. The signature is `copy.book.signature` with `authorOf` (`app/letter/[id].tsx:318-319`). Nothing else: no brand, link, subject or title (R16b, R21). The version is the one the Book shows (R19). Twenty fictional Asha fixtures, including Devanagari, Arabic and Chinese, back R4a.
- **Decision, eligibility**: `lib/share/eligibility.ts`: own, kept, has words, not a quiet-day mark, open (seal predicate injected later). NS-21's `pageControls` calls it (R7). The letter page is the only importer, and a source scan proves 0 controls on Home, the Book list, the lens, Find and Me (R1).
- **Decision, the call**: RN `Share.share({ message, url? })` with no options argument (R21), inside the built App lock hold `whileSharing` (`lib/app-lock/controller.ts:179-186`). The resolved object is discarded unread (R3b; a source scan forbids `activityType` and `.action` under `lib/share/`). No toast, haptic, row or settings key afterwards (R12, R22).
  - **Fact**: on iOS, RN adds the message and then the file URL as activity items (`node_modules/react-native/React/CoreModules/RCTActionSheetManager.mm:258-272`) and sets `subject` only when passed (`:281-283`).
  - **Fact**: the completion handler resolves only when `completed || activityType == nil` (`:289-295`), so a cancel inside a chosen app resolves nothing. **Unverified**: whether iOS then returns to the sheet and calls the handler again on final dismissal.
- **Decision, picture (PR 3)**: copy the NS-01 stored copy (already metadata-free; `ScribePhoto.reencodeUpright`, `modules/scribe-photo/index.ts`) to `Paths.cache/share/letter-photo.jpg`. **Fact**: expo-file-system 57 `Paths` exposes `cache` and `document` but no tmp (`build/Paths.d.ts`). **Conflict** (C8): the card's R10a to R10c name `tmp/share`. Exclude the file from backup with the built `ScribeFiles.setExcludedFromBackup` (`modules/scribe-files/index.ts:11`).
  - Complete protection needs a new Swift function `ScribeFiles.setProtection(uri, 'complete')`. That is a native change in a local module, with no entitlement and no plist key; the app default is `CompleteUntilFirstUserAuthentication` (`app.config.ts:93`). `security-architect` reviews it.
  - Deletion has three backstops: the `Share.share` settle, the next preview open, and the launch sweep. The sweep joins `runLaunchSweep` after the first frame (`lib/capture/sweep.ts:62-73`), so `_layout.tsx` is not touched.
  - A JPEG marker scan (APP1, APP13: 0 segments) backs R6b.
- **Conflict** (C9): R6a's fixed file name versus design spec 03 SH-R11 ("the letter's date"). The card wins (changed 20 Nov); design updates SH-R11.
- Data, sync, API, server: none. Classes: the payload is L4 in memory only; the temp file is L4 and transient (card s11). X2: Level 1 sends no voice (R5a, R16a: the payload type is `{ message: string; url?: string }`, and the module imports nothing from audio).
- Performance: preview p95 300 ms and sheet within 1 s (R11, R23) are device rows. String building is pure; the copy runs off the UI thread through the async file API.
- PRs: (1) payload, eligibility, flag, fixtures (~300 lines); (2) the preview sheet (`Sheet`, static words row, buttons equal per SH-R14), the call, the letter page slot, keys PROPOSED (~350 lines); (3) the picture: temp, sweep, `setProtection`, toggle (~300 lines). Lenses: principal-architect / compliance-engineer (#847); PR 3 adds `security-architect`.
- **Risk**: the share promise never settles, so the App lock hold stays up and the lock never applies. Way back: release the hold on the next AppState `active` after a `background`, and add a device row that cancels inside Mail.
- Gates: counsel Q45 before the flag turns on outside the founder's family; the share verb (OQ-6, `content` with `legal`); founder words; device rows R11, R13a, R13b, R23.

---

## 5. Waves 4 and 5, gated and parked (one paragraph each)

**NS-24 Read the year back (wave 4).** Rests on: an optional `{ from, to }` range parameter on `app/read-together.tsx`, which today reads `readableInBook(listEntriesForChild(id)).reverse()` (`:65`). Year bounds would come from `packages/core` `ageOn` over `occurred_on` (R5, R7), year rows would go in `components/book/months-sheet.tsx` with no count line, and the flag would be `EXPO_PUBLIC_READ_THE_YEAR`. R9 needs `expo-keep-awake` (installed, ~57.0.2, never called by Read together). The seal predicate from NS-06 B would join `readableInBook`. Decide first: design places the year choice (card OQ, default the Months sheet), and Q40 must be read before any public line. BL-947 covers only R1 to R3 (C10).

**NS-06 Part A Firsts (wave 4).** Rests on: two columns on `entries` and `drafts` and field group `first` (schema, the content-trigger tuple, the `book_entries` view and the export minor are in `data-and-sync.md`); NS-21's `first` row (row 2) and Review's action row; #798's `registerFindExtraSource` for the label (#798 `lib/find/sources.ts`); #840's lens mode for the Firsts lens; and a grapheme count whose floor is the built `graphemes` helper (Hermes `Intl.Segmenter` **Unverified**). Decide first: the five-parent study (founder OQ-A1, run by `user-research`) and Share Level 1 shipped (card gate). The founder must also decide on NS-06-A22, because RN 0.86.3 cannot switch Writing Tools off (section 0), and the label field does not ship until he does. `data-architect` writes the migration with the founder's `approve-migration`.

**NS-06 Part B Sealed letter (wave 5, gated).** Rests on: ADR 0028 D3a, now on `develop` (`docs/adr/0028-photo-seal-find-on-device-data.md:111-147`, accepted by CR-62). One opening rule would be written once as a pure `isOpen(entry, nowUtc)` in `packages/core` and also as #798's `visibleSql` source, with a parity test between the two forms. NS-06-B6's `isVisibleTo` would be the TS form used by every surface (NS-21 row 4, NS-23 `ctx.isOpen`, NS-05 eligibility, Read together, the lenses), and `HOME_SLIPS` already reserves `sealOpened`. Server columns, the guard, the `book_entries` clause and the B10.1 choice (default option b) are in `data-and-sync.md`. Decide first: counsel on Q6, the new minors question and Q50, through the founder. Until then, CR-62 item 1's default holds ("not built"), and #847 Q3 says no seal code is written. **Conflict** (C11): card B17 says Q6's "build at all" is answered by the founder's include-all-scope ruling; CR-62 and ADR 0028 Q6 (`:254`) keep it open with "not built". Also, card B21's gate "ADR 0028 merged on develop" is now met (#797 merged).

**NS-06 Part C Quick capture (after NS-04 GO).** Rests on: `startCapture({ source })`, built (`lib/capture/start-capture.ts:24`); one config plugin or native target per doorway that passed NS-04; and the plist delta preflight (C3). Decide first: NS-04's exit result and NS-04b; `security-architect`'s read of the plist and entitlement delta; the founder on OQ-C2 (no remote removal by default).

**NS-25 The other parent (wave 5, design notes only).** Rests on: the built server invite, peek, accept and 72-hour undo functions (card s2), `lib/family/*`, `app/invite/*`, and D-162's door rule `visibleCoParentDoors` (`lib/family/entry.logic.ts:74-76`). Every door stays alpha-only, and nothing anywhere says "coming soon" (D-161, D-162, now on `develop`, `docs/DECISIONS.md:668-669`, so the card's "#827 merged" gate is met). Decide first: counsel on Q48, Q49 and Q53 (D11 holds until Q53); the founder on D-053; BL-882 to BL-889 merged (still only on draft #767); BRAND.md line 40 rewritten (it still says the book "is shared with your co-parent", `packages/content/BRAND.md:40`). Owner per #847: `sync`.

**NS-26 Hear when the other parent writes.** Would rest on NS-32's registry row and a push token table (L3, with grants and a `grants.mjs` row). Decide first: NS-25 live in a store build, tester evidence (D5), counsel Q54(d).

**NS-27 Who can read each letter.** Would extend NS-21's `whoCanRead` row (the model's row 5), not replace it, with a new access rule in `book_entries`. Decide first: more than two readers exist (NS-28), and a security read.

**NS-28 A family link or circle.** X2 applies: a child's voice would reach people who are not account holders. Decide first: `security-architect` and counsel reads (Q45, Q42), NS-08 recording backup decided, the NS-03 read-out, and the founder's cost decision.

**NS-29 Words that light up.** Would rest on per-word timings that the phone does not keep today (card s29; `lib/transcribe.ts:53`), mapped through `machine_edits` offsets. Decide first: tester evidence and a ranked slot after NS-24.

**NS-30 A book you can hold.** The printable file is NS-07's. The printed book needs an entity, a print partner and hosted audio (X2). Decide first: the founder's sequence (entity, quotes, hosted audio).

**NS-31 A library of moments.** NX-39 with its counsel brief. Decide first: NS-01 shipped, its study read, and counsel's answers.

---

## 6. Conflicts

For product (card gaps):
- C1 NS-21-R9 (P0) versus R10 for a private waiting letter. Rec: R9 wins.
- C2 NS-21 s3 row 3 (picture above the words) versus #839 and the `CardToPage` carry. Rec: #839's place.
- C3 NS-21-R14 omits the picture and the "Exactly as said" switch.
- C4 NS-21 s3 row 5 removes the built Make private control from in-book letters for every store user (D-162). Confirm.
- C6 NS-22-R3 (Hide in 2 taps) versus the built rule that Hide needs two or more books.
- C8 NS-05-R10a to R10c `tmp/share` versus expo-file-system 57 (`Paths.cache` only). Rec: read it as the app's share temp folder in Caches, excluded from backup.
- C9 NS-05-R6a versus design spec 03 SH-R11 (file name).
- C11 NS-06 B17 versus CR-62 item 1, ADR 0028 Q6 and #847 Q3 (seals not built until Q6).
- NS-22 s2 and s10 name `children.quiet`; the column is `child_member_prefs.quiet_at`.
- C12 NS-21-R4 (P0, LEGAL-REQ-051) heading levels versus React Native on iOS, which sets the header trait with no level (section 1.3; `11-foundations.md` P7). Rec: trait plus order on iOS, levels proven on web; `compliance-engineer` reads whether that meets LEGAL-REQ-051.

For Karma (engineering decisions):
- C5 BL-937 "no new words" versus the card's new title and values (OQ-21a).
- C7 Level 1 "text only" (brief, BL-939) versus the card's optional picture. Rec: text first, picture PR held for X2.
- C10 Backlog rows narrower than the cards: BL-937 covers R1 to R5 (the card has R1 to R14, including P0 R9, R11, R12, R13); BL-939 covers R1 to R17 (to R27); BL-946 covers R1a to R8 (to R18, including P0 R11, R15, R17); BL-947 covers R1 to R3 (to R10, including P0 R10).
- BL-937 says rows are 56 pt "and grow"; NS-21-R5 asks for 56 pt at AX5 only. 56 pt at every size would change `ListRow` app-wide (`design-systems`).
- Owners for the cross-cutting tests `[X6-R1]`, `[FRAME-SLIP]` and `[X4-R1]`, none of which exist on `develop`. Default: `mobile` writes `[X6-R1]` in NS-21 PR 1 and `[FRAME-SLIP]` in NS-23 PR 1; `[X4-R1]` stays with NS-10.
- Writing Tools (D2) across every letter field: accept the recorded finding, or fund a native shim? Default: the finding; NS-06-A22 goes to the founder.
- The NS-23 quiet guard ships outside the flag, ahead of BL-946 (J-N19 P0).

## 7. Open questions that need the founder or counsel (with defaults)
| Question | Owner | Default |
|---|---|---|
| Past letters switch default (NS-23 OQ-2) | founder | On; Quiet this book is the hard-day path |
| A picture of the child leaving through the share sheet (NS-05, Q45; X2) | counsel, `security-architect` | Same as Export, the parent's own act; picture PR held until both reads are on record |
| Share verb and label (NS-05 OQ-6) | `content`, `legal` | "Share this letter" (PROPOSED) |
| Firsts label with no Writing Tools switch (NS-06-A22) | founder | Does not ship until he decides |
| Build the sealed letter; hide from the other parent; minors (Q6, Q50, new question) | counsel through the founder | Not built (CR-62 item 1) |
| Latest seal day (NS-06 OQ-B3) | founder | The child's 25th birthday |
| Co-parent in store builds (Q48, Q49, Q53; D-053) | counsel; founder | Alpha only (D-162); Terms' 72-hour undo (D11); keep D-053 |
| Any public line for Read the year back (Q40) | counsel | No public line beyond the current listing |

## 8. What I could not verify
- Nothing was run on a phone, a simulator or the web preview. All latency, AX5, VoiceOver and Smart Invert rows are device rows.
- Whether UIKit offers any public heading level (assumed not), and whether `aria-level` reaches the web preview's letter page.
- iOS share-sheet behaviour after a cancel inside a chosen app; how Messages, Mail and WhatsApp receive text plus one image together; whether the Caches folder is outside iCloud backup.
- `@expo/ui` `Menu` with VoiceOver and AX5 inside an RN layout; Hermes `Intl.Segmenter`.
- That no linked dependency donates to Spotlight or Siri on its own: `[X6-R1]` scans our source, not binaries.
