# B. Mobile client engineering design for the locked pack

Author: `mobile` (Mobile Engineer, iOS first, Expo), for Karma (CTO). Date: 20 Nov 2026.
Base read: the lock branch worktree at `450bcb4a9` (develop `4f89d659` merged in), plus the open PRs #834 (merged), #841, #842, #835 to #840, #798, #758 and #721 read through the GitHub REST API on 20 Nov.
Scope: every locked card in `docs/product/prd/01` to `12`, the frame `00`, plan `13`, test plan `14`, council record `16`, and backlog rows BL-922 to BL-987 whose owner is `mobile engineer`, `export owner` or `reminders owner`.

How to read the tags. [F] = read in code or a PR diff this session, with file:line. [V] = read in vendor docs this session (link in section 7). UNVERIFIED = not read in code or vendor docs this session, or not run. Nothing here was run on a phone or in CI; no `node_modules` exists in the worktree, so no installed library source was read. Where a card and this file differ, the card wins until Karma rules; section 8 lists where I think a card is wrong.

---

## 0. The design in one page

1. **Pure first.** Every rule a card states becomes a pure function in `packages/core` (domain rules shared across app, export and server tests) or a `*.logic.ts` file in `apps/mobile/src` (app rules), tested in Node. Screens stay thin. Native code is limited to the existing `modules/scribe-photo` (T3 sizes, two derivatives) and one new small module `modules/scribe-system` (Switch Control status, writing tools off). No new third-party package is needed for the whole pack.
2. **Four registries kill the merge conflicts.** Most of the pack lands on four hot files: `app/letter/[id].tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/book.tsx` and `app/review.tsx`. Each gets a small ordered registry first (letter rows, Home slips, Book header items, Review rows), so later features add one registry line and one component instead of editing the route.
3. **Local feature flags are not server flags.** `capabilities.ts` build flags require `EXPO_PUBLIC_SERVER_FEATURES=on` (`apps/mobile/src/lib/capabilities.ts:185-194`), but the `testflight` profile has servers off (`apps/mobile/eas.json`, read [F]). Photos, Find, Share, Firsts and the rest are local features, so they get a second flag family in `capabilities.ts` (`localFlagEnabled`) that does not depend on servers.
4. **One account scope.** `currentUserId()` returns the stored owner, not the signed-in session (`lib/store.ts:432-434`), and the visible-books query has no account predicate (`lib/db/repos/children.ts:54-56`). So today account B on A's phone would read A's book. One pure `account-scope` decision gates every reading surface, Find, reminders, slips and Share (`[X4-R1]`, BL-961), and it must land before any new reading surface turns on outside the founder's family.
5. **One visibility rule.** `isVisibleTo(entry, reader, now)` lives in `packages/core` with a SQL twin generated from the same clause list; Find's `searchable_letters` view, the seal rule, the past-letter picker, Read together, Share and the PDF all call it, and a parity test runs both forms over the Asha fixtures in `node:sqlite` (NS-06-B6, NS-02-R16b).
6. **T4 undo is one helper.** `lib/undo-window.logic.ts` (pure clock) and `useUndoWindow` (VoiceOver `announcementFinished` [V], Switch Control from `scribe-system`). Toast and action expire together. `components/ui/toast.tsx` is `design-systems` code, so the Toast change is a hand-off.
7. **Reminders: one plan, one budget, a total of 60.** The back-off is computed into the plan, the budget picks one notification per local day across books, plan notices are scheduled first, and the total pending stays at 60 so NS-13-R23 and NS-32 both hold (section 8 item 1).
8. **Three vendor facts change the work.** React Native's `TextInput` has no writing-tools prop (docs for 0.81 and 0.88 read [V]); Hermes has no `Intl.Segmenter` (formatjs guide [V]); React Native has no Switch Control query (AccessibilityInfo docs [V]). Each has a native or pure-TS answer below, and the writing-tools gap is recorded as a finding (D2) rather than passed silently.

---

## 1. Module map

### 1.1 Boundaries

| Layer | Where | Runs in Node tests | Rule |
|---|---|---|---|
| Domain rules shared beyond the app | `packages/core/src/*` | yes | No React Native, no Expo imports. New: `length.ts`, `visibility.ts`, `graphemes.ts` |
| App rules | `apps/mobile/src/lib/**/*.logic.ts` and pure `lib/**` files | yes | Import nothing from `react-native` or `expo-*`; device effects are parameters (the pattern `lib/photos/baker.ts` already uses [F]) |
| Device adapters | `apps/mobile/src/lib/**` non-logic files | stand-ins | Thin: SQLite, file system, notifications, share sheet |
| Screens | `apps/mobile/src/app/**`, `components/**` | component and source tests | Read state, call lib, render. No rule lives here |
| Native | `apps/mobile/modules/scribe-photo`, new `modules/scribe-system` | no | `security-architect` reviews; every call has a JS fallback when the module is absent (`requireOptionalNativeModule`, as `modules/scribe-photo/index.ts` does [F]) |
| Not mine | `apps/mobile/src/components/ui/**` (`design-systems`), payment and Plus code (`payments`), `packages/content` (`content`), `packages/api` contracts and `lib/sync` (`sync`), `supabase/**` (`data-architect`) | | Hand-offs listed per feature |

### 1.2 New shared modules (used by several cards)

| Module | Kind | What it holds | Cards |
|---|---|---|---|
| `packages/core/src/graphemes.ts` | pure | `graphemes(s)`, `graphemeCount(s)`: an extended-grapheme-cluster splitter in plain TS (combining marks, ZWJ sequences, Indic virama conjuncts, regional-indicator pairs, Hangul L/V/T, CR LF). Never calls `Intl.Segmenter` at runtime. Replaces the three ad hoc versions: `packages/core/src/text.ts:63-87` (`splitsCluster`), `components/book/book-cover.logic.ts:104-114` (`graphemes` with a Segmenter fallback) and `lib/photos/text.ts` (#836) | NS-01-R54, NS-06-A23, NS-16-R7, NS-23-R2 |
| `packages/core/src/length.ts` | pure | One table of typed-word limits and one check. `LIMITS = { photoText: {graphemes: 140, dbCodePoints: 700}, place: {graphemes: 60, dbCodePoints: 300}, firstLabel: {graphemes: 40, dbCodePoints: 200}, signsAs: {codePoints: 30}, typedDay: {graphemes: 80} }`; `fits(field, text)`, `clamp(field, text)`, `remaining(field, text)` | BL-957, NS-01-R21a, R54, NS-06-A1, A23, NS-16-R1, R6, NS-18-R5 |
| `packages/core/src/visibility.ts` | pure | `isVisibleTo(entry, reader, now, surface)` plus `VISIBILITY_CLAUSES` (the same rules as data, rendered to SQL by `visibilitySql()`) so the Find view and the TS predicate cannot drift | NS-06-B2, B6, NS-02-R4, R16b, NS-23-R5, NS-24-R3, NS-05-R7, NS-07-C28-4, C28-18 |
| `apps/mobile/src/lib/capabilities.ts` (extended) | pure | `LocalFlag` type, `localFlagEnabled(flag)`, a getter per flag on `capabilities`, `setLocalFlagForTests` guarded by `VITEST` like the existing setters (`capabilities.ts:276-314`). `lib/photos/flag.ts` (#837) and `lib/find/flag.ts` (#798) become one-line re-exports | every flagged card |
| `apps/mobile/src/lib/account-scope.logic.ts` + `account-scope.ts` | pure + hook | `scopeOf({ sessionUserId, ownerId, signedIn })` returns `owner`, `signedOutHolder` or `foreign`. Foreign: no book, letter, picture, Find result, slip, Share or reminder of the owner is reachable | `[X4-R1]`, NS-01-R29, NS-02-R24, NS-06-A25, B17, NS-10-R3, R5, NS-13-R13, NS-14-R11, NS-05-R27, NS-07-C5-12, C28-17 |
| `apps/mobile/src/lib/undo-window.logic.ts` + `use-undo-window.ts` | pure + hook | The T4 clock (section 4.4) | NS-01-R38a to c, NS-06-A2b, NS-33-R15, NS-21-R7b |
| `apps/mobile/src/lib/home/slips.logic.ts` | pure | The slip registry and `pickSlip(state)` (section 2.5) | `[FRAME-SLIP]`, NS-11-R4, NS-23-R6, R18, NS-06-B4 |
| `apps/mobile/src/lib/letter/rows.logic.ts` | pure | The "This letter" row registry in the NS-21 order, each row with `applies(entry, viewer)` | NS-21-R1 to R3b, R9 to R11 |
| `apps/mobile/src/lib/book/header.logic.ts` | pure | Book header items in the NS-22 order, each with `applies(book)` | NS-22-R2 to R4 |
| `apps/mobile/src/lib/review/rows.logic.ts` | pure | Review's optional rows (day it is about, photo, first, seal, From) and their order | NS-15-R1, NS-01, NS-06-A14, B1, NS-16-R1 |
| `modules/scribe-system` | native (Swift) | `isSwitchControlRunning()`, event `switchControlChanged` (`UIAccessibility.isSwitchControlRunning`, `switchControlStatusDidChangeNotification`), and writing tools set to `.none` on every React Native text input (section 7, item 1) | T4, D2 (NS-01-R50, NS-06-A22, NS-21-R12, BL-962) |

### 1.3 Per feature: new and changed files

Files in the open stacks are named as the PRs have them [F]. "New" means proposed here.

| Feature (card) | New | Changed | Pure TS | Native | Hand-offs |
|---|---|---|---|---|---|
| Photo (NS-01, NS-37; BL-931, 932, 953, 955, 956) | Stack: `lib/photos/{files,device,entry-media,housekeeping,session,strip,text,adopt,failures,flag,pause,pending,picker,registry,copy,hooks,surface,use-photo-pick,use-photo-start,attach,lens}.ts`, `components/photos/{photo-start,pending-photo-thumb,photo-frame,letter-photo,review-photo,photos-lens}.tsx` (#841 to #840). New: `lib/photos/derivatives.logic.ts` (paths `<id>-512.jpg`, `<id>-1280.jpg`, which copy each surface reads), `lib/photos/regen.ts` (background regeneration, skipped while recording and under Low Power Mode), `lib/photos/export.ts` (BL-933) | `modules/scribe-photo/ios/ScribePhotoModule.swift:50-51` (`longestSide = 4096`, `quality = 0.9` become 4032 and 0.85) plus a new `makeCopy(source, destination, maxSide)` using the same ImageIO path; `lib/capture/{start-capture,start-capture.logic,erase,sweep}.ts`, `lib/erase-everything.ts`, `lib/store.ts`, `lib/db/migrations.ts` (v11), Home, Listen, Write, Review, letter page, Book, `components/book/letter-card.tsx` | strip, text, session, adopt, lens, derivatives, pending, registry, attach | `scribe-photo` | `content` (`photosCopy`, R31, R32 keys), `design-systems` (`PhotoFrame` hairline and `accessibilityIgnoresInvertColors` live in `components/photos`, mine; the lens control is `ChoiceGroup` in `components/ui`, theirs), `security-architect` (Swift), `privacy` (inventory rows) |
| Find (NS-02; BL-952) | `lib/find/{flag,pause,fts-index,lifecycle,query,scan-index,search,snippet,sources}.ts`, `components/find/{find-mode,find-result-row}.tsx`, `components/find/find.logic.ts` (#798). New: `lib/find/rebuild.logic.ts` (batches of 200, yield between batches), `lib/find/debounce.logic.ts` (150 ms, counted inside the 300 ms) | `lib/store.ts` (catch-up, drop before erase), `lib/db/repos/{entries,children,wipe}.ts` (`reindexLetter`), `lib/sync/engine.ts:117-125` (reconcile in the sync transaction), `components/book/cover-band.tsx`, `app/(tabs)/book.tsx`, `packages/api/src/{kill-switches,remote-config,envelope,standards}.ts` | query, snippet, sources, rebuild, debounce | none (FTS5 in `expo-sqlite`, UNVERIFIED on a phone) | `sync` (engine hook), `content` (`findCopy`, R39 line), `design-systems` (`TextField` in `components/ui`) |
| Share one letter, Level 1 (NS-05; BL-939) | `lib/share/payload.logic.ts` (wrapper: date line, words, signature line; FSI and PDI isolates), `lib/share/temp.ts` (`tmp/share/letter-photo.jpg`, complete protection, backup-excluded, launch sweep), `lib/share/share.ts` (React Native `Share.share` with `message` and `url`; no `title`, no `subject`; result discarded), `components/share/share-preview.tsx` | letter row registry (one Share row), `lib/capture/sweep.ts` (temp sweep) | payload | none | `content` (share strings), `design-systems` (sheet, toggle) |
| Firsts (NS-06 A; BL-968) | `lib/firsts/{mark.logic,lens.logic}.ts`, `components/firsts/{first-row,first-sheet}.tsx`, Find extra source `firstLabelSource` | `lib/db/migrations.ts` (v12: `entries.first_mark`, `first_label`, same pair on `drafts`), `lib/db/repos/{entries,drafts}.ts`, Review rows, letter rows, Book lens frame, `lib/export/schema.ts` (next minor) | mark, lens | none | `sync` (field group `first`, `ALL_GROUPS` at `lib/sync/types.ts:51`, `entrySnapshot` at `lib/sync/outbox.ts:161`), `data-architect` (server migration), `content` |
| Sealed letters (NS-06 B; BL-970) | `lib/seal/{seal.logic,open-now}.ts`, `components/seal/{seal-row,hidden-row,seal-sheet}.tsx`, slip `seal.homeOpened` | migrations v13 (three columns, the pair on `drafts`, `entries_seal_idx`), repos, Review rows, letter rows, Book row renderer, `packages/core/src/visibility.ts` clause, Recently deleted row, `lib/export/schema.ts` 1.8.0 | seal clock, visibility | none | `sync` (group `seal`, `seal_watermark` per book for option (b)), `data-architect` |
| Quick capture doorways (NS-06 C; BL-971) | After the NS-04 spike only: per doorway a config plugin or native target, a source in `start-capture.logic.ts:19` | `lib/capture/start-capture.logic.ts` (doorway plan: route `/listen`, `armListen: false`), `app.config.ts` within the approved plist delta | plan | per doorway (UNVERIFIED until NS-04) | `security-architect`, `speech` |
| Home slip registry (frame; BL-963) | `lib/home/slips.logic.ts`, `components/home/slip-host.tsx` | `app/(tabs)/index.tsx:192-200, 300-325` (cards, `monthAgo`, `ResurfacedCard` move behind `SlipHost`) | yes | none | none |
| One past letter (NS-23; BL-946) | `lib/home/past-letter.logic.ts` (date rule R12, eligibility of #721, `isVisibleTo`) | `components/tonight/draft-card.logic.ts:177-206` (`resurfaced` removed), `components/tonight/resurfaced-card.tsx`, Me switch in `app/settings/index.tsx` | yes | none | `content` (switch label) |
| Notification budget and back-off (NS-32, NS-13, NS-18; BL-966, 967, 943, 982) | `lib/reminders/budget.ts` (from #758, reworked), `lib/reminders/backoff.logic.ts`, `lib/reminders/typed-days.ts` (BL-982) | `lib/reminders/planner.ts:288-289` (horizons), `:313` (key per day, not per kind), `:350` (one per day), `:371` (ceiling); `lib/reminders/prefs.ts:115-131` (quiet books, drafts in the anchor, `reminders.onSince`); `lib/reminders/scheduler.ts` (category with `previewPlaceholder`, `interruptionLevel: 'active'`, re-plan on version change); `lib/auth/session-provider.tsx:291-307` (sign-out cancels and clears); `lib/billing/plan-reminders.logic.ts:48` registered as class `plan` | planner, budget, backoff | none | `content` (placeholder, back-off copy), `payments` (plan notice module is theirs: registration only) |
| Shared undo window (T4; BL-954) | `lib/undo-window.logic.ts`, `lib/use-undo-window.ts` | `components/ui/toast.tsx:10-12, 71` (action toasts never time out today) | clock | `scribe-system` (Switch Control) | `design-systems` owns `toast.tsx` |
| Length helper (BL-957) | `packages/core/src/{graphemes,length}.ts` | photo words and place fields, Firsts label, From, typed day; the #835 local CHECK (raise to `dbCodePoints` before #835 merges) | yes | none | `data-architect` (server CHECKs) |
| Letter page list (NS-21; BL-937) | `lib/letter/rows.logic.ts`, `components/letter/this-letter-list.tsx` | `app/letter/[id].tsx:458-479` (the `ListSection` with Make private, Change the date, Delete) and `:427-457` (provenance block moves into the list) | rows | none | `design-systems` (`ListSection` heading level) |
| Book header (NS-22; BL-938, 985) | `lib/book/header.logic.ts`, `components/book/book-end-menu.tsx` (Quiet or Unquiet, Hide) | `app/(tabs)/book.tsx`, `components/book/cover-band.tsx`; gear leaves the Book | header | none | `design-systems` delta first (BL-938 "Who") |
| Child switcher on Home (NS-14; BL-941) | none | `app/(tabs)/index.tsx` renders `components/child/child-switcher.tsx` above the dateline with `surface: 'home'` | none new | none | `content` (one label) |
| Save a copy (NS-11; BL-942) | `lib/export/copy-slip.logic.ts` (birthday week, leap day, twins), `app/settings/save-a-copy.tsx` (or the renamed export row; `content` names it) | `app/settings/index.tsx`, `app/settings/export.tsx` (one export function, R6a), slip registry | slip rule | none | `content` |
| New phone (NS-10; BL-922, 978) | `lib/first-run/held.logic.ts` addition, `components/book/new-phone-line.tsx` | `lib/first-run/gate.logic.ts` (`heldNewPhoneView`), `lib/first-run/use-new-phone.ts`, `app/(auth)/sign-in/consent.tsx:134, 193` (one reader), Book header line | route logic | none | `sync` (BL-987 answers) |
| Quiet this book (BL-985) | Me row beside Hide | `app/settings/children/[id].tsx` (Hide at `:99-122`), `lib/store.ts:390-393` (`setChildQuiet`, built) | none | none | none |
| Another day (NS-15; BL-945) | none | `app/review.tsx` (dateline opens `components/book/date-sheet.tsx`), `app/letter/[id].tsx` two-date line via the row registry | `components/book/date-change.logic.ts` (unchanged) | none | `content` |
| From name (NS-16; BL-980) | `lib/review/sign-as.logic.ts` (recent list, cap 20) | Review rows, local draft column (v14, PROPOSED) or settings key | yes | none | counsel gates; `content` |
| Read the year back (NS-24; BL-947) | `lib/book/year-range.logic.ts` (birthday to day before, Before You) | `app/read-together.tsx` (year range param), Months sheet, `lib/resilience/keep-awake.ts` (5 min grace) | yes | none | none |
| Printable book (NS-07 C28; BL-973) | `lib/export/print-pdf.ts`, `lib/export/print-layout.logic.ts` | `lib/export/device.ts` (`renderPdf`), `lib/export/build.logic.ts` ordering, Export screen | layout | none (system PDF render) | `design-systems` (fonts), `legal` (font evidence) |
| Accessibility floor (NS-33; BL-928, 984) | `lib/a11y/bold-text.ts` (hook), heading roles | `app/letter/[id].tsx` (level 1 dateline), `app/(tabs)/_layout.tsx:87-91` (`headerTitle: copy.settings.title` vs tab `t.you`), `app/listen.tsx` (recording state text and shape) | none | `scribe-system` | `design-systems` (font face map in `components/ui/fonts.ts`, `Text` variants) |
| X4 and X6 (BL-961, 962) | `lib/account-scope*.ts`, scan extensions | `lib/store.ts` reads through the scope; `test/no-system-indexing.test.ts` (exists, RT-PRV-07) gains `AppEntity`, `EntityQuery`, `IndexedEntity`, `@Parameter` over text | scope | `scribe-system` (writing tools) | `privacy`, `security-architect` |

---

## 2. State and data flow

### 2.1 Store and settings

`lib/store.ts` is a module-level store over `scribe.db` with a `ctx()` connection and a `bus` that emits table names (`bus.emit('children')`, `lib/store.ts:381-393` [F]); screens subscribe and re-read. I keep that shape. No new global state library. New state is either a column on a synced row (Firsts, seals), a phone-only table (`entry_media`, Find index), a settings key, or component state (the Find query, the pending picture on Ready).

New settings keys (all phone only, never synced or exported, cleared by Erase everything; "sign-out" column says what sign-out does):

| Key | Class | Writer | Sign-out | Card |
|---|---|---|---|---|
| `find.dirtyAt`, `find.secureDelete` | L2, L1 | `lib/find/lifecycle.ts` | kept (book stays, D1) | NS-02 |
| `reminders.onSince` | L2 | `turnOnReminders()` | cleared with `reminders.*` | NS-13 |
| `typedDay.<yyyy-mm-dd>`, `typedDay.showWords` | L4, L2 | typed-day settings | cleared | NS-18-R6 |
| `discard.failures.<draft id>` | L3, L2 | let-it-go path | kept with the draft | NS-09-R15 |
| `copySlip.<child id>.<year>` | L3, L2 | slip host | kept per D1, hidden from a foreign scope (NS-11-R22) | NS-11 |
| `home.pastLetters`, `home.pastLetter.dismissedOn` | L2 | Me switch, slip host | kept | NS-23 |
| `newPhoneLine.dismissed` | L2 | Book line | cleared | NS-10-R13 |
| `signAs.recent` | L3 | Review | cleared | NS-16-R15 |
| `app.lastPlannedVersion` | L1 | scheduler | kept | NS-32-R16, NS-13-R21 |

### 2.2 `startCapture` is the single entry (NS-35)

`startCapture(req)` (`lib/capture/start-capture.ts:24-49` [F]) runs `planCapture(req)` from the closed list in `start-capture.logic.ts:18-20` [F]. The pack changes it in three places only:
- `photo` (#838): returns `route /listen` with the pending picture already in `lib/photos/pending.ts`; Home is the only caller (NS-01-R1).
- Doorways (BL-971): `route /listen` with `armListen: false`, so Listen opens at Ready and the microphone starts only on the parent's tap (NS-35-R7, NS-06-C1). A doorway arriving before first run ends routes to first run, not Ready. The four names are already reserved; no new source is added without its handler in the same PR (NS-35-R5).
- Active book (NS-14): the plan reads `getActiveChildId()` at the tap, as today; the switcher changes the active child before the tap, so `[NS-14-R3]` and `[NS-01-R60]` hold by construction. A waiting draft keeps its `child_id` (R4) because resume never goes through `startCapture`.

Nothing else may push `/listen` or `/write`. `test/navigation-one-entry.test.ts` (exists) gains N7 to N9 once Find, the lens and Share exist (NS-35-R6): Find, the lens, Share, the slip host and the letter rows import nothing from `lib/capture/start-capture`.

### 2.3 Photo

1. Home "Start from a photo" -> `usePhotoStart` -> `ScribePhoto.pickOne(destination in Caches/ImagePicker)` -> pending picture in memory (`lib/photos/pending.ts`, #837) -> `startCapture({ source: 'photo' })`.
2. **Change for BL-955 (R43, O-3):** the moment a draft row exists (Listen creates it on Speak; Write on first keystroke), `adoptPending(draftId)` writes the stored copy, then the `entry_media` row with `draft_id`, then deletes the picker copy. Today the stack does this when Review opens. A kill between file and row is the R36 sweep case.
3. Stored-copy writer (`commitPhoto`, #836) gains T3: native re-encode caps the long side at 4,032 and quality 0.85 (BL-953); an upright JPEG under 4,032 keeps its bytes with segments stripped (O-1 default); then `makeCopy` writes `-512` and `-1280` derivatives, backup-excluded (NS-37-R4). Free-space check becomes size plus 50 MB (R45; #836 checks twice the size per the card).
4. Keep: one transaction moves `draft_id` to `entry_id` (same media id, the file never moves).
5. Reading: the Book list and the lens read `-512`, the letter page `-1280`, export the stored copy (NS-37-R8). A missing derivative renders the card without a thumbnail and enqueues regeneration (R3). No decode while `lib/capture/busy.ts` says a take is recording (NS-37-R2): the regenerator and the image components both check it.
6. Delete, restore, purge, let go, erase: file first, then row, through the eraser the stack adds to `lib/capture/erase.ts` and `lib/erase-everything.ts`, now removing three files (NS-37-R5).
7. Inactive: every picture is replaced by an opaque box before the snapshot (`PHOTO_BLANK_WITHOUT_APP_LOCK`, #838 `surface.ts`).

### 2.4 Find reads `searchable_letters`

- **Index:** `letter_search(body, extra)` FTS5 with `unicode61 remove_diacritics 2` and `letter_search_rows(entry_id, row_id)`, created by `ensureSearchIndex`, not by a migration (#798 `lifecycle.ts`).
- **One definition of findable:** the view `searchable_letters` (#798 `sources.ts:81-100` [F]). Its WHERE clause becomes `visibilitySql('find')` from `packages/core/src/visibility.ts`, so sealed, hidden, deleted, private-to-others, quiet, waiting and empty letters drop out by the same clauses the TS predicate uses. Every query joins the view, so a stale index row is never returned (R16b).
- **Account scope:** today the view treats `author_id = sync.ownerId` as own (`sources.ts:76-96` [F]). In a `foreign` scope Find is not offered and `findLetters` returns nothing; the view also gains `account_scope_ok()` as a clause so a direct call cannot leak (R24).
- **Writes:** `reindexLetter(id)` runs inside the same transaction as the letter write in the repos; `reconcileSearch(db)` runs inside the sync engine's transaction (`lib/sync/engine.ts:117-125` with #798 [F]). An index failure marks the index untrusted and the letter write still commits (R44).
- **Rebuild:** #798 runs the catch-up 3 s after the store opens in one transaction [F, #798 `store.ts` patch]. BL-952 slice changes it to `rebuildInBatches(200)` with a `setTimeout(0)` yield between batches, never while `busy.ts` says recording, and after the first frame via `InteractionManager.runAfterInteractions` (UNVERIFIED that this API still behaves the same under the new architecture; a plain timer after first render is the fallback).
- **Query:** the field's text is component state in `find-mode.tsx`, never a route param (R25); 150 ms debounce (card O-1), the first-row target 300 ms p95 includes it; queries under 3 code points do nothing except CJK (R3); terms quoted by `ftsMatchString` (R45). The failed view announces once (R37).
- **Off:** flag off drops the index at launch (R43); `killSwitches.bookSearch` hides the action only and the index keeps following letters.

### 2.5 Home slip registry

```
type SlipId = 'waiting.kept' | 'waiting.recovered' | 'waiting.readBack' | 'seal.homeOpened' | 'copy.birthdayWeek' | 'pastLetter';
const SLIP_ORDER: readonly SlipId[]  // the frame order, frozen by a test
pickSlip(input): { id: SlipId; payload } | null
```
- Order: (1) the existing waiting cards in their existing order (`draftCards`, `components/tonight/draft-card.logic.ts`), (2) `seal.homeOpened` on its opening day only, (3) Save a copy in the birthday week, (4) one past letter. First eligible wins; at most one renders.
- Inputs are a plain snapshot (active child, quiet and hidden flags, drafts, today in the device zone, settings keys, scope), so the picker is pure and Node-tested.
- Not slips: the reminder ask sheet, the Plus line (`PlusLine`, `index.tsx:247`), the photo start, the quiet-day inline line.
- `[FRAME-SLIP]`: `SlipHost` renders only ids from the registry, and a test mounts Home with a stub slip component that is not registered and expects the build-time check (`assertRegistered`) to throw; a source scan also fails when a file under `components/tonight` or `components/home` exports a component named `*Slip` or `*Card` that `slip-host.tsx` does not import.
- The #721 day-zero card is not registered; #721 is closed or superseded and its grapheme-safe excerpt moves into `past-letter.logic.ts`.

### 2.6 The reminder plan, and re-planning

Build (pure, `planReminders` in `lib/reminders/planner.ts`):
1. **Anchor** = later of the newest made letter's local date (own entries, own drafts waiting at Keep or held, never `discarding`) and `reminders.onSince` (NS-13 3a). `lastOwnSaveAt` (`prefs.ts:120-131` [F]) reads only entries today; it gains drafts.
2. **Candidates** per class over days 0 to 35 from the anchor: evening days 1 to 7 on the chosen weekdays; days 8 to 35 the first chosen weekday per 7-day block; month and birthday notes only on days 0 to 35; typed days on their dates whatever the back-off; nothing else after day 35 (`horizonDays ?? 21` and `monthHorizonDays ?? 92` at `planner.ts:288-289` [F] are replaced).
3. **Eligibility:** visible, included and not quiet books only. Today `plannerChildren()` maps `included: c.remindersOn` (`prefs.ts:115-116` [F]) and never reads `Child.quiet`, although `store.ts:388` says the planner does. This is a P0 gap (NS-13-R12, NS-32-R14, J-N19).
4. **Budget** (`budget.ts`): group the candidates by local calendar date (not by `${kind}:${date}`, `planner.ts:313` [F]); keep one per date by priority `typedDay > birthday > monthAge > evening`; two children's notes on one date stay one grouped note (as built); birthday copy wins over month copy.
5. **Clamp** 07:00 to 21:30 in 15-minute steps (built, `planner.ts:127-130, 172-184` per card).
6. **Ceiling:** plan notices first (at most 4, `MAX_PLAN_NOTIFICATIONS`, `lib/billing/plan-reminders.logic.ts:48` [F]); then budgeted notes earliest first until the total is 60; the latest-dated budgeted notes drop first (as `planner.ts:371` already does for its own list).
7. **Content:** every title and body a `packages/content` key; names only when the opt-in is on and App lock is off (`prefs.ts`); `data` stays `{ source, kind }`; category `reminder` with a neutral `previewPlaceholder`; `interruptionLevel: 'active'`.

Re-plan (`lib/reminders/scheduler.ts`, built triggers: every store write, foreground, permission change): cancel ours and schedule the new plan when `planSignature` changes. New triggers: the first launch after an app update (`app.lastPlannedVersion`, R16, R21), and sign-out. Sign-out calls `forgetReminders()` (`scheduler.ts:322`) and deletes `reminders.*`, `notifications.lockScreenNames`, `typedDay.*` (BL-967; today only `erase-everything.ts:84` calls it [F]). Plan notices are scheduled by `payments`' module; the budget exposes `allocate({ planPending, budgeted })` that both schedulers call, so the 60 holds across both.

Second phone: a letter on phone A ends phone B's nudges only after B pulls and re-plans (NS-13-R25), because the store write from the pull fires the re-plan.

### 2.7 Share, Firsts, seals, and the rest

- **Share L1:** letter row -> preview sheet (exact text from `buildSharePayload(entry, child, locale)`, picture toggle default off and absent without a stored copy on this phone) -> `Share.share({ message, url? })` with no `title` and no `subject` options; the returned `{ action, activityType }` is dropped without reading (`void` and a lint rule) -> `finally` deletes `tmp/share/letter-photo.jpg`. Launch sweep empties `tmp/share`. No row, setting or toast records the share.
- **Firsts:** toggle on the letter row or Review row -> one transaction sets `first_mark` and `first_label` (grapheme-capped) -> outbox op group `first` -> Find extra source -> Firsts lens shows when at least one open first exists in the active book. Undo through the T4 helper.
- **Seals:** sheet with the system date picker bounded tomorrow to the 25th birthday (B11) -> confirm writes `seal_opens_at` (local midnight in the device zone at that moment, in UTC) and `seal_opens_on` together -> letter is closed while `isVisibleTo` says so -> at the instant it opens on render with no work -> `seal.homeOpened` slip on that local day once. Open now: one confirm (default Cancel) -> phone sends a clear request with the unchanged pair; the server stamps `seal_cleared_at` (card B5, B13). The phone treats `seal_cleared_at IS NOT NULL` as open immediately (optimistic local stamp, replaced by the server value on pull).
- **Letter page list:** `rows.logic.ts` returns `[dayRow, firstRow, photoRow, sealRow, whoCanReadRow, versionsRow, recordingRow]` filtered by `applies`; Share sits above the list as its own button; Delete is last, outside the list (NS-21).
- **Book header:** `header.logic.ts` returns `[title, age, switcher, readTogether, lens, find, goToMonth, endMenu]`; the end menu holds Quiet or Unquiet and Hide (two taps, NS-22-R3); the gear leaves the Book and Settings stays reachable through Me and `/settings` (R6).
- **Save a copy:** the Me row and the slip both call the existing export function (`lib/export/device.ts`), R6a; the temp ZIP is deleted on sheet completion and swept at launch (R23); keep-awake only while exporting (already in `app/settings/export.tsx:101-136` [F]).
- **New phone:** BL-922 holds a `needsConsent` session with no local book out of the child step (consent sheet again at relaunch, or a held screen with Finish setup and Try another way within 10 s), one `readAccountBooks` reader; BL-978 adds the kill switch at sign-in (local book only, R8), the `sync_books` retry that does not restart the wait (R11), and one Book-level line when backup is off (R13).
- **Read the year back:** `year-range.logic.ts` gives the `[from, to]` about-day range; Read together filters by `isVisibleTo(entry, reader, now, 'readTogether')` and the range; keep-awake gains a 5-minute grace after pause (NS-24-R9).
- **Another day:** Review dateline opens the built `DateSheet`; bounds `BACKDATE_YEARS = 3` before birth or due date, no future (R5); the Book re-files within 300 ms through the store's re-read (R12).

### 2.8 Account scope (X4, D1)

```
scopeOf({ signedIn, sessionUserId, ownerId }):
  !signedIn                      -> 'signedOutHolder'  (D1: the book stays readable to whoever holds the phone)
  signedIn && (!ownerId || ownerId === sessionUserId) -> 'owner'
  otherwise                      -> 'foreign'
```
- `foreign` is already the state where `takeOwnership` throws `AccountMismatchError` and sync stops (`lib/sync/ownership.ts:25-51` [F]). Today nothing on screen changes in that state.
- In `foreign`: the root route shows one held screen (words from `content`, PROPOSED) with Sign out; `listChildren`, `findLetters`, slips, Share, the lens and reminders all read the scope and return nothing; reminders are cancelled (NS-13-R13). Default: no Erase everything on that screen, because account B erasing A's book would remove the only copy of A's recordings while backup is off (D1); the founder may change this.
- This touches root routing. `apps/mobile/src/app/_layout.tsx` boot wiring is owned per task; BL-961 owns this change, and the gate lives in `lib/first-run/route.logic.ts` beside the existing held states so `_layout.tsx` is not edited beyond reading one more route value.

---

## 3. Flags and kill switches

### 3.1 Local flag family

Add to `capabilities.ts`: `type LocalFlag = 'photos' | 'bookSearch' | 'shareLetter' | 'firsts' | 'sealedLetters' | 'quickCapture' | 'saveACopy' | 'pastLetter' | 'readTheYear' | 'typedDays' | 'signAsOther' | 'printReady'`, each read from its own `EXPO_PUBLIC_*` with `parseServerFeatures` (only `on` is on), inlined at build time like the others, with no dependency on `serverFeaturesEnabled()`. Remote config can never turn one on. Test overrides throw outside `VITEST` (the #798 `setFindForTest` has no such guard [F, #798 `flag.ts:12-15`]; fix in its slice).

| Getter (`capabilities.*`) | Env var | development | e2e | preview | testflight | production | Off hides | Off keeps |
|---|---|---|---|---|---|---|---|---|
| `photos` | `EXPO_PUBLIC_PHOTOS` | on | on | on (BL-958) | on (BL-958) | off until G6 | photo start, Change, Add, Take off, lens | sweep, erase, export, deletion of every picture (NS-01-R19) |
| `bookSearch` | `EXPO_PUBLIC_BOOK_SEARCH` | on | on | on (BL-958) | on (BL-958) | off until S1-205 passes | Find action; the next launch drops the index (NS-02-R43) | letters |
| `shareLetter` | `EXPO_PUBLIC_SHARE_LETTER` | on | on | off until words approved | off until words approved | off until Q45 and device rows | Share row and every share code path (NS-05-R26) | nothing stored |
| `firsts` | `EXPO_PUBLIC_FIRSTS` | on | on | after study | after study | off | mark control and lens | stored marks still sync, export, Find |
| `sealedLetters` | `EXPO_PUBLIC_SEALED_LETTERS` | on | on | after gates | after gates | off | the seal control only | visibility rule, hidden row and Open now in every build with the columns (B9) |
| `quickCapture` | `EXPO_PUBLIC_QUICK_CAPTURE` | per NS-04 | off | per NS-04 | per NS-04 | off | every doorway registration (C8) | n/a |
| `saveACopy` | `EXPO_PUBLIC_SAVE_A_COPY` | on | on | off until words | off until words | off | the birthday slip | the Me export row (NS-11 section 10) |
| `pastLetter` | `EXPO_PUBLIC_PAST_LETTER` | on | on | on after words | on after words | off until device rows | new picker; the built "A month ago" card stays | n/a |
| `readTheYear` | `EXPO_PUBLIC_READ_THE_YEAR` | on | on | on | on | off until device rows | year rows in the Months sheet | Read together |
| `typedDays` | `EXPO_PUBLIC_TYPED_DAYS` | on | on | off | off | off | the typed-day row; cancels typed-day notifications | n/a |
| `signAsOther` | `EXPO_PUBLIC_SIGN_AS_OTHER` | on | off | off | off | off until Q45, Q48 | From field | stored names |
| `printReady` | `EXPO_PUBLIC_PRINT_READY` | on | on | off | off | off | the printable file row | export |

Notes: profiles are named as in `apps/mobile/eas.json` [F]. `production` stays off for every row; BL-958's `preflight-production.mjs` (exists at `apps/mobile/scripts/preflight-production.mjs` [F]) fails a production build that sets any of them `on` without a recorded gate. NS-14 (switcher), NS-15 (another day), NS-21 (letter list), NS-22 (header), NS-33, NS-32 and NS-13 ship without a flag (their cards say so). Development and e2e "on" values are proposals for testing only; `qa` may prefer e2e to mirror testflight.

### 3.2 Kill switches

| Key | File | Today | Change | Read by | Can never |
|---|---|---|---|---|---|
| `killSwitches.photos` | `packages/api/src/kill-switches.ts:15-16` [F] | "Photo upload and signed photo URLs" | description becomes "hides the photo surfaces; never turns them on" (NS-01 section 10) | `photosPausedNow` (#837 `pause.ts`) | turn photos on; stop sweep, erase or export |
| `killSwitches.bookSearch` | added by #798 to `KILL_SWITCH_KEYS`, remote-config schema (default false), `ERROR_DETAILS` | absent on the lock branch [F] | lands in Find slice 1 with the pause function | `findPaused` (#798 `flag.ts:20-21`) | turn Find on; stop the index following letters |
| `killSwitches.sync` | existing | | none | sync engine | stop local writes; Firsts, seals, another day queue locally (A20, B15, NS-15-R13) |
| `killSwitches.reminders` | not added | | default not added (NS-13 OQ) | | |

The kill-switch file header says each switch stops only a server-dependent feature (`kill-switches.ts:2-6` [F]). `photos` and `bookSearch` now pause local surfaces. The cards accept this (they never stop reading, export or erase); I recommend the header text change in the same PR so the vocabulary stays true ("or hides a local surface; never reading, playback, export or erase").

---

## 4. Performance and accessibility

### 4.1 Budgets (iPhone SE 3, 06-nfr section 0 protocol), and how each is checked

"CI proxy" = a Node test with a time assertion on the Asha fixture, a regression tripwire only, never evidence for the device number. Device rows go to the BL-929/BL-948 run sheet, Asha-only install (D13).

| Budget | Number | Card | CI proxy | Device row |
|---|---|---|---|---|
| Cold start p50 / p90 | 1.2 s / 2.0 s; warm p50 400 ms | A-NFR-001, NS-34 | source check: no awaited network or model load before first frame; Find catch-up, photo sweep, temp sweeps, derivative regen and category registration are not awaited on launch | NS-34 sheet, cold and warm, airplane mode too |
| Tap Speak to mic live | p95 500 ms, also with a picture attached | F04-REQ-023, NS-01 section 8 | none | NS-34, NS-01 |
| Screen change start, controls usable | 100 ms, 350 ms; named hand-offs 900 ms; save hand-off 2,000 ms, commit p95 200 ms | NS-34 | commit-path test asserts the index write and media move are inside the commit transaction | NS-34 |
| Picker close to thumbnail | p95 1,000 ms (20 picks of 12 MP HEIC) | NS-01 | none | NS-01 |
| Stored copy written | p95 1,500 ms off UI thread; native hard limit 20 s (`BAKE_TIMEOUT_MS`) | NS-01, T3 | baker timeout test (exists in #834 tests) | NS-01 |
| Attach peak memory | under 80 MB above Home | NS-01 | none | Instruments |
| Book scroll | no frame over 16.7 ms with 1,000 letters and 300 pictures | NS-37-R1, J-N13 | test that the list query selects only `-512` paths | NS-37 |
| Book memory | under 150 MB resident with 300 pictures | NS-37-R6 | none | NS-37 |
| List copy decode | p95 50 ms off UI thread | NS-37-R7 | none | NS-37 |
| Find first row | p95 300 ms after last keystroke, 1,000 letters, debounce included | NS-02-R2 | `node:sqlite` query over 1,000 letters under 30 ms (proxy) | S1-205 |
| Find rebuild | 1,000 letters within 3 s, batches of 200, no JS frame over 50 ms | NS-02-R35 | batch size and yield asserted | S1-205 |
| Index write per save | under 20 ms p95 | NS-02-R36 | proxy timing | S1-205 |
| Find memory and size | +50 MB peak; index at most 10 MB at 1,200 letters | NS-02-R20 | file size on fixture (proxy) | S1-205 |
| Planner run | under 50 ms (3 children, 35-day plan, 1,000-letter anchor read) | NS-32, NS-13 | Node timing on the fixture; anchor uses one `MAX(captured_at)` query instead of the per-child scan in `prefs.ts:120-131` | spot check |
| Past-letter pick | under 5 ms, year-5 fixture | NS-23 | Node timing | none |
| Share preview, sheet | 300 ms; sheet within 1 s of Continue; +30 MB | NS-05-R11, R23 | payload build timing | NS-05 |
| Letter page interactive | p95 300 ms from a card | NS-21-R8 | none | BL-948 |
| Switch child | p95 300 ms offline | NS-14-R10 | none | NS-14 |
| Firsts lens | 500 ms with 200 firsts | NS-06-A24 | query plan uses an index | NS-06 |
| Seal, mark writes | inside the 200 ms commit | NS-06 | in-transaction assertion | none |
| Delete and restore commit | p95 200 ms | NS-36 | none | none |
| Year chosen to first page | p95 500 ms | NS-24 | none | NS-24 |
| PDF | 240 letters plus 50 pictures in 60 s; under 150 MB | NS-07-C28-9, 10 | none | C28 rows |
| Empty sweep | under 5 ms; 50 discarding drafts within 2 s off UI thread | NS-09-R5, R13 | count-based test | NS-09 |
| Doorway trigger to Ready | 3 s after unlock | NS-06-C8 | none | NS-04 spike |

Two gaps to state plainly: the `perf` EAS profile and marker harness do not exist (NS-34 section 2), so every device number is "by hand, Instruments, release build" until they do; and no CI step today can measure UI frame times.

### 4.2 Accessibility per surface

Settings on every walk: AX5 with Bold Text, VoiceOver, Voice Control, Switch Control, Reduce Motion, Increase Contrast, Smart Invert, dark mode (`14-test-plan.md` section 5).

| Surface | AX5 on SE 3 | VoiceOver | Voice Control | Switch Control | Smart Invert, colour | Bold Text |
|---|---|---|---|---|---|---|
| Home | switcher above the dateline, names wrap (NS-14-R5); capture cluster inline; photo start never larger than Speak or Type | dateline heading first; switcher reads book name and age; slip is one element (NS-23-R7) | visible labels are commands; "Speak" only on Home (NS-35) | every control scannable | photo start icon is not the only cue | Mukta faces (4.5) |
| Ready with a picture | thumbnail at most 88 pt from AX3 (R39; #838 grows to screen width [card]); fit, not crop (R42) | order thumbnail, prompt, Speak, Type, Change (R20b) | Change | yes | picture `accessibilityIgnoresInvertColors` (R40); 1 pt hairline (R41) | |
| Listen | | start and stop announced within 1 s (NS-33-R6) | | | recording state has a word and a shape, never terracotta alone (NS-33-R12) | |
| Review | rows stack; From, dateline, first, seal, photo words fields one column | focus lands on the title; Undo of a small fix reachable | | | | |
| Letter page | rows at least 56 pt (NS-21-R5) | dateline level 1, list title level 2 (NS-21-R4, NS-33-R1); order dateline, words, Play, Share, list title, rows, Delete (R14); picture label is the parent's photo words or the fixed phrase (R9a, R21c) | row titles are commands | rows scannable | picture ignores invert | |
| Book header | fixed order at every size, 44 pt (NS-22-R2) | header first; lens is a single choice with the selected one stated (NS-33-R3; #840 uses `tablist` [card]) | "Tap Find" | yes | lens selection by shape and weight | |
| Find | field full width, Cancel wraps; date line never truncates (R42) | "Letters found" or no-match once, no count (R11); short-query hint is VoiceOver-only (R23); row read once (R41) | "Tap Find", "Tap Cancel" | rows scannable | match underlined plus medium weight (R40) | |
| Photos lens, Firsts lens | thumbnail above the words (#840) | no count in any string (NS-01-R11, NS-06-A4) | | | thumbnails ignore invert | |
| Sealed row | wraps to two lines | "hidden until {day}" with no hint revealing words | Open now commandable | yes | not by colour | |
| Share preview | one column; Continue and Not now equal and visible (R13b) | words row is static text, not a dimmed switch (R4b) | | | | |
| Me | | heading equals the tab label (NS-33-R2; today `headerTitle: copy.settings.title` at `app/(tabs)/_layout.tsx:91` vs tab `t.you` [F]) | | | | |
| Read together | | | | | | keep-awake while playing (built at `components/player/audio-player.tsx:113` [F]) plus 5 min grace |

### 4.3 Undo windows (ruling T4)

Today: a toast with an action never times out (`components/ui/toast.tsx:10-12, 71` [F]), while #839's `undoPhotoChange` refuses after `expiresAt`, so a dead Undo can stay on screen (NS-01-R38b).

Design:
```
// lib/undo-window.logic.ts (pure)
type UndoEvent = { t: 'shown'; at } | { t: 'announced'; at } | { t: 'screenReader'; on } | { t: 'switchControl'; on }
              | { t: 'movedOn'; at } | { t: 'undone' } | { t: 'tick'; at }
undoWindow(statedMs, events) -> { open: boolean; closesAt: number | null }
// closesAt = max(shownAt + statedMs, announcedAt + statedMs) when VoiceOver is on
// Switch Control on: closesAt = null (open) until 'movedOn'
// VoiceOver on and no 'announced' yet: open; a cap of 60 s after 'shown' stands in for a lost event (PROPOSED)
```
- `useUndoWindow(statedMs, line)` wires `AccessibilityInfo.addEventListener('announcementFinished', { announcement, success })` [V] and matches the announced string; `success: false` still counts as finished.
- Switch Control state comes from `scribe-system` (React Native has no query [V]). Without the module (web, Expo Go) the hook treats Switch Control as off.
- One owner: the hook returns `{ open, undo }`; `undo()` is a no-op when closed, and the toast is hidden in the same render the window closes, so button and action expire together (R38b).
- `toast.tsx` gains an `expires` option driven by the hook. That file is `design-systems`', so BL-954 is a pair: I write the logic and hook, and hand off the `Toast` prop.
- Users: photo replace and take-off (NS-01-R38), Firsts unmark (NS-06-A2b), letter delete Undo in the Book (NS-21-R7b), any later undo. The quiet-day line has no timer and already meets T4 (NS-07-C5-6).

### 4.4 Voice Control, Switch Control, Smart Invert, Bold Text

- **Voice Control:** visible label equals `accessibilityLabel` for every new control; a component test compares the rendered text to the label (no "button" in labels, NS-33 section 16).
- **Switch Control:** every control is a native focusable element; no gesture-only action (a button for every gesture, frame section 5).
- **Smart Invert:** `accessibilityIgnoresInvertColors` on every `Image` of a picture and the brand mark. There is no use anywhere in `apps/mobile/src` today (NS-33 section 2, consistent with my grep).
- **Bold Text:** `AccessibilityInfo.isBoldTextEnabled()` and `boldTextChanged` exist on iOS [V]. Whether iOS thickens our custom faces on its own is UNVERIFIED; the safe design is a face map that steps each face up one weight when Bold Text is on: Mukta Regular to Medium, Medium to SemiBold (all bundled, `packages/design-tokens/fonts/` [F]); Literata Regular to Medium (bundled) and Medium to a SemiBold cut (not bundled); Tiro Devanagari Hindi has only Regular bundled [F], so it cannot render heavier with what ships (section 8 item 9). The map lives in `components/ui/fonts.ts`, which is `design-systems`' file; I supply the hook.

---

## 5. PR slicing

### 5.1 Rules used

Each slice is one concern, at most 400 changed lines and 20 files (CODE-R02), tests included in the count, with its failing test first. Line counts are estimates [E]. Content keys come from `content` as PROPOSED keys before or with the code. `docs/agents/BOARD.md` lines (every stack PR touches it [F]) are dropped from feature PRs to remove a constant conflict; the board is updated by the harness.

### 5.2 Slices per BL row I own

| BL | Slice | Est. lines / files | Files touched (main) | Depends on |
|---|---|---|---|---|
| BL-931 photo stack | as open: #841 (347/5), #842 (68/4), #835 (672/14), #836 (830/17), #837 (686/15), #838 (561/25), #839 (512/17), #840 (257/11) [F]. Six are over 400 lines and #838 is over 20 files. Proposed re-cut where review is not yet counted: #835 into 835a migration 11 and `entry_media` repo, 835b sweep and erase; #836 into 836a `strip.ts` with its 10-fixture test, 836b `session.ts` commit path; #837 into 837a picker adapter and flag or pause, 837b pending and adopt; #838 into 838a capture plumbing (`start-capture*`, Listen, Write, Review hooks), 838b Home photo start and components plus content; #839 into 839a Review photo, 839b letter page photo and attach | each 250 to 400 / under 20 | as listed in 1.3 | in stack order |
| BL-953 T3 sizes | one slice | 120 / 4 | `ScribePhotoModule.swift:50-51, 212, 224`, `lib/photos/session.ts` (`commitPhoto` cap), tests | #836 |
| BL-932 derivatives (NS-37) | (a) native `makeCopy` and `derivatives.logic.ts` with stripped and backup-excluded tests; (b) writer calls it at attach, eraser removes three files, sweep; (c) list, lens and page read the right copy, `regen.ts` | 300/6, 250/8, 300/8 | Swift, `lib/photos/*`, `components/book/letter-card.tsx`, `components/photos/photos-lens.tsx` | #840, BL-953 |
| BL-955 survives a kill | one slice | 200 / 6 | `lib/photos/{adopt,pending}.ts`, Listen and Write draft-creation hooks, test | #838 |
| BL-956 large text, invert, fit, lens | (a) thumbnail 88 pt from AX3, fit not crop, `accessibilityIgnoresInvertColors`, hairline; (b) lens control to `ChoiceGroup` and virtualised `FlatList` over list copies | 200/6, 250/6 | `components/photos/*`, `app/(tabs)/book.tsx` | #840, BL-932 |
| BL-933 export 1.7.0 (export owner) | (a) `lib/photos/export.ts` and schema 1.7.0 with the `photo` object; (b) golden Asha fixture with one picture, regenerated in its own commit; 1.6.0 still reads | 350/8, fixtures | `lib/export/{schema,build.logic,device,pack}.ts` | BL-868 fix in a PR, #797 merged |
| BL-952 Find | follow the card's order (section 8 item 4): (1) content keys and `bookSearch` pause key (`packages/api`, `packages/content`); (2) pure query, snippet, sources with `visibilitySql`; (3) lifecycle and repo hooks with batch rebuild; (4) store and sync wiring (engine reconcile, erase drop, launch catch-up off first frame); (5) Find mode, header action, debounce, failed-view announcement; (6) device row S1-205 in `docs/qa/DEVICE_TEST_PLAN.md` | (1) 200/9 (2) 380/8 (3) 380/7 (4) 250/6 (5) 400/8 (6) 30/1 | as #798, split | #797 merged, `visibility.ts` |
| BL-957 length | (a) `packages/core/src/graphemes.ts` with the Node `Intl.Segmenter` oracle property test; (b) `length.ts` and the fields use it; the #835 local CHECK raised before #835 merges | 380/4, 250/8 | core, photo fields, (later) Firsts and From | none |
| BL-954 T4 undo | (a) `undo-window.logic.ts` with tests; (b) `scribe-system` Switch Control (native, security review); (c) hook, Toast `expires` prop (pair with `design-systems`), photo undo uses it | 200/3, 150/5, 250/7 | `lib/`, `modules/scribe-system`, `components/ui/toast.tsx` (theirs) | #839 for the photo user |
| BL-961 X4 | (a) `account-scope.logic.ts` and the `[X4-R1]` integration test over two seeded accounts (red); (b) gate in `lib/first-run/route.logic.ts`, store reads, Find view clause, reminders cancel; held screen with content keys | 250/4, 400/12 | store, route logic, Find, reminders | content keys BL-965 |
| BL-962 X6 and D2 | (a) extend `test/no-system-indexing.test.ts` with App Intents entity tokens and a failing fixture; (b) `scribe-system` writing tools off for every text input, with the finding recorded in `docs/agents/cto/RULINGS.md` and on the cards | 150/3, 200/5 | test, `modules/scribe-system`, `app.config.ts` plugin entry if needed | none |
| BL-963 slips | one slice: registry, `SlipHost`, existing waiting cards and "A month ago" moved behind it, `[FRAME-SLIP]` test | 350 / 7 | `lib/home/slips.logic.ts`, `components/home/slip-host.tsx`, `app/(tabs)/index.tsx` | none |
| BL-937 letter list | (a) `rows.logic.ts` and `this-letter-list.tsx` extracted with today's rows; (b) Share apart, Delete last, headings | 300/5, 150/4 | `app/letter/[id].tsx`, `components/letter/*` | BL-928, #839 |
| BL-928 a11y fixes | (a) letter page heading; (b) Me heading equals tab | 60/3, 40/3 | `app/letter/[id].tsx`, `app/(tabs)/_layout.tsx` | BL-927 note |
| BL-938 header | (a) `header.logic.ts` with AX5 layout test; (b) end menu with Quiet and Hide, gear leaves | 300/6, 250/6 | `app/(tabs)/book.tsx`, `components/book/cover-band.tsx` | #798 slice 5, #840 |
| BL-985 Quiet in Me | one slice (and the planner fix of 2.6 item 3 in BL-966) | 120 / 3 | `app/settings/children/[id].tsx` | none |
| BL-941 switcher on Home | one slice | 120 / 4 | `app/(tabs)/index.tsx`, `components/child/child-switcher.tsx` | BL-963 (same file) |
| BL-942 Save a copy | (a) `copy-slip.logic.ts` and slip registration; (b) Me row and screen through the one export function | 250/5, 250/6 | slips, `app/settings/*` | BL-963, BL-933 for R10 |
| BL-946 past letter | (a) `past-letter.logic.ts` with R9 and R12 to R16; (b) slip, Me switch, `resurfaced` removed | 350/4, 250/7 | `components/tonight/*`, `app/settings/index.tsx` | BL-963, BL-937, #721 closed |
| BL-945 another day | one slice | 250 / 6 | `app/review.tsx`, letter rows | BL-937 |
| BL-947 read the year | one slice | 300 / 6 | `app/read-together.tsx`, Months sheet, keep-awake grace | none |
| BL-939 share L1 | (a) `payload.logic.ts` with 20 fixtures; (b) temp file and sweep; (c) preview sheet, row, `Share.share` | 300/3, 150/4, 350/7 | `lib/share/*`, `components/share/*`, letter rows | BL-937, words, picture part after #839 |
| BL-966 budget (reminders owner) | (a) `budget.ts` registry (no `occasion`) and `allocate`; (b) planner one-per-day across books, priority, ceiling, quiet books; (c) category placeholder and interruption level | 250/3, 350/4, 150/3 | `lib/reminders/*` | supersedes #758 |
| BL-967 sign-out cancels | one slice | 120 / 3 | `lib/auth/session-provider.tsx:291-307`, test | none |
| BL-943 reminders proven | (a) anchor counts drafts, `reminders.onSince`; (b) back-off pre-scheduled to day 35; (c) re-plan after update | 250/4, 300/3, 100/3 | `lib/reminders/*` | BL-966, BL-967 |
| BL-982 typed days | one slice behind `typedDays` | 350 / 7 | `lib/reminders/typed-days.ts`, settings | BL-966, BL-943 |
| BL-968 Firsts (phone half) | (a) local migration v12 and repos; (b) mark logic, Review and letter rows, undo; (c) lens and Find source; (d) export minor | 250/5, 350/8, 300/6, 250/5 | as 1.3 | server migration and `sync` contract |
| BL-970 seals (phone) | (a) local migration v13, `seal.logic.ts` with zone and clock injection tests; (b) seal sheet, hidden row, Open now; (c) `visibility.ts` clause wired to every surface plus the call-site test; (d) slip and Recently deleted row; (e) export 1.8.0 | 300/5, 350/8, 300/10, 200/5, 250/5 | many surfaces | BL-969 |
| BL-971 doorways | one slice per doorway after NS-04 | n/a | `start-capture.logic.ts`, plugin | BL-972 |
| BL-973 printable PDF (export owner) | (a) layout logic and text-layer golden; (b) fonts and `print-pdf.ts`; (c) Export row, temp delete, keep-awake | 350/5, 300/6, 200/5 | `lib/export/*` | BL-933 |
| BL-974 quiet days | one slice: C5-10 display dedupe | 120 / 3 | `components/book/quiet-day.logic.ts` | none |
| BL-977 let it go rest | one slice phone half | 200 / 5 | sweep, settings counter, Storage | BL-925, BL-926 |
| BL-926 Review line | one slice | 100 / 3 | `app/review.tsx` (letItGo result) | BL-925 |
| BL-922, BL-978 new phone | BL-922 one slice (`gate.logic.ts`, consent sheet reader); BL-978 (a) kill switch at sign-in and `sync_books` retry; (b) Book-level line | 300/6; 250/6, 150/4 | `lib/first-run/*`, Book | #764 |
| BL-979 earlier versions | blocked on counsel; (a) row in the registry; (b) read RPC client | later | | counsel, data-architect |
| BL-980 From name | one slice behind `signAsOther` | 300 / 7 | Review rows, `sign-as.logic.ts` | counsel |
| BL-984 a11y beyond VO | (a) Bold Text hook; (b) recording state text and shape; (c) Voice Control label tests | 150/3, 150/3, 200/4 | `lib/a11y`, `app/listen.tsx` | BL-928 |
| BL-987 facts (mobile lines) | doc lines on the cards: this file's section 7 items 2, 3, 4 | docs | | none |

### 5.3 Merge order

1. Foundations with no screen: BL-957a/b (core length), `visibility.ts`, `capabilities.ts` local flags, BL-954a, BL-962a, BL-967, BL-966a/b/c, BL-961a (red test lands with the fix, not before).
2. Photo stack in order #841, #842, #835, #836, #837, #838, #839, #840, then BL-953, BL-955, BL-932, BL-956, BL-933.
3. Find slices 1 to 6 (after #797 merges), parallel to step 2 because they share only `store.ts` (different regions) and `erase-everything` order (see 5.4).
4. Registries: BL-963 (Home), BL-928 then BL-937 (letter page, after #839), BL-938 (Book header, after Find slice 5 and #840).
5. Riders on the registries: BL-941, BL-985, BL-945, BL-942, BL-946, BL-939, BL-947, BL-943, BL-982, BL-984.
6. Gated: BL-968, BL-970, BL-973, BL-971, BL-979, BL-980.

### 5.4 Conflicts between slices of different tasks

| File | Touched by | Resolution |
|---|---|---|
| `app/letter/[id].tsx` | #839 (+3), BL-928 (heading), BL-937 (list), BL-945 (two-date line), BL-939 (Share), BL-968, BL-970, BL-979 (rows), BL-962 (words sheet field) | Order BL-928, #839, BL-937 (card NS-21 section 10). After BL-937, every later row edits `lib/letter/rows.logic.ts` and adds a component under `components/letter/`; the route file is not touched again |
| `app/(tabs)/index.tsx` | #838 (photo start), #721 (day-zero card), BL-963 (slip host), BL-941 (switcher), BL-942, BL-946, BL-970 (slips) | #838 first; BL-963 next; #721 closed (its card is unregistered); BL-941 touches only the top of the screen; slips register in `slips.logic.ts` |
| `app/(tabs)/book.tsx` | #798 (Find mode), #840 (lens), BL-956 (lens control), BL-938 (header), BL-947 (Months sheet), BL-985 (end menu via BL-938) | #840 and Find slice 5 first, then BL-938 introduces `header.logic.ts`; BL-956's control change goes into the header item, not the route |
| `app/review.tsx` | #838, #839 (photo), BL-926, BL-945, BL-968, BL-970, BL-980 | A Review row registry (`lib/review/rows.logic.ts`) in BL-945's first slice; BL-926 is independent (the let-go result) |
| `lib/store.ts` | #835, #839 (photo), #798 (Find catch-up, erase drop), BL-961 (scope), BL-968/970 (repos) | Find adds a new region; photo edits erase paths. Erase order must be: drop Find index, then rows, then the photos folder by listing (ADR 0028 D5); a single test pins the order (`test/erase-all.test.ts` exists in #836/#839) |
| `lib/db/migrations.ts` | #835 (v11), BL-968 (v12), BL-970 (v13), BL-980 (v14 if a column) | Version numbers are assigned at merge time; each PR appends one step; rebase renumbers and the "every row byte-identical" test (NS-01-R35 shape) runs for each step |
| `lib/erase-everything.ts` | #835, #836 (photos), BL-967 shares `forgetReminders` | BL-967 does not edit this file; it calls the same function from sign-out |
| `lib/capture/sweep.ts` | #835, #836 (photo), BL-939 (share temp), BL-932 (partial copies), BL-977 | One sweep list (`sweepTargets`), each feature adds an entry |
| `lib/sync/engine.ts` | #798 (reconcile), BL-968 and BL-970 (via `sync`) | `sync` reviews both; Find's hook is one line inside `inTransaction` |
| `packages/api/src/kill-switches.ts`, `remote-config.ts` | #798 (`bookSearch`), photo description change | Find slice 1 lands both edits |
| `packages/content/src/features/index.ts` | #838, #798, every later feature | append-only; content owns |
| `apps/mobile/eas.json` | BL-958 (platform) | one PR for all local flags in preview and testflight |
| `components/ui/toast.tsx`, `fonts.ts`, `list-row.tsx`, `choice-group.tsx` | BL-954, BL-984, BL-937, BL-956 | `design-systems` owns; hand-offs |

---

## 6. Tests

### 6.1 Per card: P0 rows and where their tests live

Test titles carry the row id in brackets (`14-test-plan.md`). "src" = source scan; "int" = integration over the store with Asha fixtures in Node; "SQL" = `npm run test:db` (`data-architect`); "dev" = device row.

| Card | P0 rows (from `14` section 7) | Unit and integration files (new unless named) | Source scans | Device |
|---|---|---|---|---|
| NS-01 | R4, R6, R8, R9a, R9b, R13a, R13b, R14 to R18, R21b, R22, R25 to R27, R29 to R33, R35 to R37a, R38a, R38b, R49 to R52, R55, R61, R62 | stack files `photos-{device,phone,capture,surfaces,c8}.test.ts` [F, PR lists]; new `photos-t3.test.ts` (R37a with a 6,000 px fixture), `photos-derivatives.test.ts`, `undo-window.test.ts` (R38a, R38b), `photos-export.test.ts` (R14), `account-scope.test.ts` (R29) | R22 (plist, lockfile), R33 (no Vision or Core ML in `lib/photos`, `modules/scribe-photo`), R49 (X6), R51 canary | R13a, R20a to e, R27, R39, R46 |
| NS-02 | R4, R5, R14, R15, R16a to d, R18, R22, R24 to R26, R31, R44, R47 to R49 | #798 `find-{index,lifecycle,logic}.test.ts` split with the slices; new `find-scope.test.ts` (R24), `find-route.test.ts` (R25: render Find, read the router state, no query) | R22 (no network, log or analytics import in `lib/find`, `components/find`), R26, R31 (no index name in export, backup or sync code) | S1-205 (R2, R20, R21, R35, R36) |
| NS-05 | R3a, R3b, R4a, R5a, R5b, R6a, R6b, R7, R10a, R10b, R12, R16a, R16b, R18, R21, R25, R27 | `share-payload.test.ts` (20 fixtures incl. Devanagari, Arabic, Chinese), `share-temp.test.ts`, `share-scope.test.ts` | R3b (no read of `activityType`), R12 (no settings key or column named share), R16a (no `audio/` and no recording uri), R16b, R21 | R11, R13a, R13b |
| NS-06 A | A2a, A4, A5, A13, A15, A17, A22, A25 | `firsts-mark.test.ts`, `firsts-lens.test.ts` | A4, A5, A22 (writing tools) | A11, A24 |
| NS-06 B | B1, B1b, B2, B5, B6, B8, B8b, B10, B12, B16 to B18, B20 to B23, B26 | `seal-clock.test.ts` (zone and clock injection), `visibility-callsites.test.ts` (B6: lists every surface module and fails on one that renders entries without `isVisibleTo`), `visibility-parity.test.ts` (TS and SQL agree) | B26 | B8b two phones, NS-36-R3 |
| NS-06 C | C1 to C4, C7, C9 | `start-capture.test.ts` (exists) gains doorway plans | C3 plist delta, C7 | C9 to C11 |
| NS-07 | C5-3, C5-9, C5-12, C28-2 to 5, C28-11 to 13, C28-17, C28-18 | `quiet-day.test.ts` (C5-10), `print-pdf.test.ts` (text layer golden) | C28-6 | C28-9, 10 |
| NS-09 | R1 to R4b, R7 to R12, R14, R15 | existing BL-923/924 tests; `let-go-counter.test.ts` (R15), sign-out discard tests with `sync` | R17 | J-N1 kill |
| NS-10 | R0, R1, R3, R4a, R4b, R5, R6, R8, R10 | `new-phone-route.test.ts`, `use-first-run-route.test.ts` (exist) | | S1-204 two phones |
| NS-11 | R5, R8, R10, R12, R23 | `copy-slip.test.ts`, `export-temp.test.ts` | content rules | J-N8 |
| NS-13 | R3 to R6b, R10 to R15, R18, R19, R23, R24, R27, R30, R31 | `reminders-planner.test.ts` (exists) gains back-off and anchor cases with an injected clock; `reminders-budget.test.ts`; `reminders-signout.test.ts` | R24 (bodies from content keys), R20 (no time-sensitive) | J-N3 to J-N5, J-N24 |
| NS-14 | R3, R4, R8, R11 | `home-switcher.test.ts` | | R5 |
| NS-15 | R4, R11, R16, R18 | `another-day.test.ts` | R4, R18 (no date parsed from words or a picture: no import of a date parser in Review or photo code) | J-N7 (CI) |
| NS-16 | R3 to R6, R9, R15, R16, R18 | `sign-as.test.ts` | R4 (no Contacts import), R9 (no diarization) | |
| NS-18 | R3, R6, R8 | `typed-days.test.ts` | R8 canary | |
| NS-21 | R4, R9, R11, R12, R13 | `letter-rows.test.ts`, `letter-headings.test.ts` | R12 (writing tools), R13 | J-N12 |
| NS-22 | R2, R3 | `book-header.test.ts` (AX5 layout order) | | header row |
| NS-23 | R5, R8, R11, R15, R17 | `past-letter.test.ts` | R17 | |
| NS-24 | R2, R3, R10 | `year-range.test.ts` | | R9 keep-awake |
| NS-32 | R1, R1b, R4, R4b, R8, R11, R12, R14 | `reminders-budget.test.ts` | R11 | J-N27 |
| NS-33 | R1 to R10, R12, R15, R16 | `a11y-headings.test.ts`, `undo-window.test.ts` | R12 (recording state has a text node) | R4 to R10, R16 (XCUITest audit, UNVERIFIED that the e2e stack can run `performAccessibilityAudit()` today) |
| NS-34 | R2, R5, R6 | `perf-markers.test.ts` (markers content-free) | | run sheet |
| NS-35 | R1, R3, R4, R7 | `navigation-one-entry.test.ts` (exists) | | |
| NS-36 | R1a to R1d, R2 to R8, R10 to R12 | `data-follows-letter.test.ts` (one fixture letter with picture, first, seal and index row through delete, restore, purge, export) | R12 canary | R3 |
| NS-37 | R2, R4, R5 | `photos-derivatives.test.ts` | R2 (no image component mounts while `busy.ts` says recording) | R1, R6, R7 |
| Cross-cutting | `[X4-R1]`, `[X6-R1]`, `[FRAME-SLIP]` | `account-scope.test.ts`, `no-system-indexing.test.ts` (exists, extended), `home-slips.test.ts` | | J-N sign-out |

### 6.2 Tests that must fail on today's code

Each was checked against the code read this session; "card" means the card's own reading of an open PR.

| Test | Why it fails today |
|---|---|
| `[NS-32-R1b]`, `[NS-13-R19]` | notes keyed `${kind}:${date}` (`planner.ts:313` [F]): a birthday and another child's month-day on one date give two |
| `[NS-13-R3]`, `[NS-13-R4]`, `[NS-13-R18]`, `[NS-32-R8]` | horizons 21 and 92 days, no back-off (`planner.ts:288-289` [F]) |
| `[NS-13-R27]` | anchor reads entries only (`prefs.ts:120-131` [F]) |
| `[NS-13-R12]`, `[NS-32-R14]`, J-N19 | `plannerChildren` ignores `quiet` (`prefs.ts:116` [F]) |
| `[NS-13-R14]`, `[NS-13-R13]` | sign-out never calls `forgetReminders` (`session-provider.tsx:291-307` [F]; only `erase-everything.ts:84`) |
| `[NS-32-R13]` | no category or placeholder is set anywhere in `apps/mobile/src` (grep [F]) |
| `[X4-R1]`, `[NS-10-R3]`, `[NS-02-R24]` | `listVisible` has no account predicate (`children.ts:54-56` [F]); `currentUserId()` returns the stored owner (`store.ts:432-434` [F]) |
| `[NS-01-R37a]`, `[NS-01-R37c]` | `longestSide = 4096`, `quality = 0.9` (`ScribePhotoModule.swift:50-51` [F]) |
| `[NS-01-R38b]` | action toasts never time out (`toast.tsx:10-12, 71` [F]) |
| `[NS-01-R43]` | stored with the draft only at Review (card, #836 to #839) |
| `[NS-01-R40]`, `[NS-33-R11]` | no `accessibilityIgnoresInvertColors` in `apps/mobile/src` (card; my grep agrees) |
| `[NS-33-R1]`, `[NS-21-R4]` | no header role on the letter page (`app/letter/[id].tsx`, grep [F]) |
| `[NS-33-R2]` | `headerTitle: copy.settings.title` vs tab `t.you` (`app/(tabs)/_layout.tsx:87-91` [F]) |
| `[NS-02-R35]` | one-transaction catch-up 3 s after open (#798 `store.ts` patch [F]) |
| `[NS-02-R37]` | failed view not announced (card on #798) |
| `[NS-23-R4]`, `[NS-23-R5]`, `[NS-23-R8]`, `[NS-23-R15]` | built `resurfaced` is a 28 to 35 day window with no switch, no quiet-book or `hard.*` check (`draft-card.logic.ts:177-206` [F]) |
| `[NS-11-R2]`, `[NS-11-R6a]` | no slip, no screen |
| `[FRAME-SLIP]` | no registry |
| `[NS-15-R2]` style Review control | Review dateline is not a control (card) |
| `[NS-24-R9]` 5 min grace | keep-awake releases at once on pause (`keep-awake.ts:14-21` [F]) |
| `[X6-R1]` App Intents entity | the existing scan has no `AppEntity` token (`test/no-system-indexing.test.ts:22-35` [F]); BL-962 adds a fixture that proves the scan fails on one |
| `[NS-01-R54]`, `[NS-06-A23]` | `maxLength` counts UTF-16 units; #835 CHECK counts code points at 140 (card) |

### 6.3 e2e-web flows

Existing flows under `apps/mobile/e2e-web/` (`j01` to `j22` [F]) run the web build, where native modules are absent. New or extended:
- `j09-book.flow.ts`: header order at default and large text; no gear; end menu offers Quiet and Hide; Find action present with letters, absent without (flag on in the web e2e build).
- `j23-find.flow.ts`: type, result, open, Back keeps query; hide the letter, not found; URL never contains the query (`page.url()` checked after each keystroke, R25).
- `j10-letter.flow.ts`: row order, Share apart, Delete last, heading levels (ARIA roles from react-native-web).
- `j04-tonight.flow.ts`: one slip at a time across fixtures with a waiting draft, a birthday week, a past letter.
- `j24-photo-absent.flow.ts`: on web the photo start, Change and Add are absent (NS-01-R59).
- `j13-reminders.flow.ts`: settings only (notifications do not run on web).
- `j25-share-preview.flow.ts`: the preview text equals the payload; Not now leaves nothing.
- J-N6 (two books on Home) and J-N7 (another day) as web flows, because they need no device.

### 6.4 Device rows and D13

- Every device row runs on a separate install signed in to a test account holding only the Asha book (D13). Engineering support: a `perf` or `asha` EAS profile whose first launch seeds the Asha book from `apps/mobile/src/dev/asha-seed.ts` (exists, development only [F]) extended to 1,000 letters and 300 generated pictures (synthetic gradients with fixture text, no real photo). The seed must be impossible in `production` (preflight check).
- Evidence path `docs/qa/evidence/<date>-<build>-<phone>.md`; `no-real-family-data` runs on every evidence PR.
- Rows I need from `qa` (BL-948): NS-01 R13a, R20a to e, R27, R39, R46; S1-205; NS-37 R1, R6, R7; NS-13 J-N3 to J-N5, J-N24 with Show Previews set to Never; NS-33 walk V1 to V6; NS-05 R11, R13a/b; NS-06 B8b and NS-36-R3 on two phones; NS-24-R9; NS-14-R5; NS-34 sheet; iPad smoke.

### 6.5 The log canary (J-N18)

One harness `test/canary.test.ts`: seeds canary strings into a letter, photo words, place, Find query, typed day, From name, first label and share payload; drives each path including forced failures; captures `console.*`, the logger sink, breadcrumbs, router state and notification payloads; asserts zero hits. Extends the PRIV-R10 pattern; no new logging is added by any feature in this pack.

---

## 7. Risks and open questions

### 7.1 Vendor and platform facts

| # | Question | What I found | Status | Recommended default |
|---|---|---|---|---|
| 1 | Does React Native expose a switch for iOS writing tools? | No prop in `TextInput` docs for 0.81 and for the current 0.88 [V: reactnative.dev textinput]. UIKit has `UITextInputTraits.writingToolsBehavior`, iOS 18+, and `.none` prevents use [V: Apple docs]. A developer forum thread reports `UITextView.appearance().writingToolsBehavior = .none` crashing on iOS 18.1 [V: Apple forums 768711]. App uses React Native 0.86.3 (`apps/mobile/package.json:54` [F]); its installed source was not read | Finding (D2): React Native exposes no switch | `scribe-system` sets `writingToolsBehavior = .none` on React Native's iOS text views when they move to a window, on the main thread, app-wide (simplest and covers every field whose text becomes a letter's words; no field in the app needs writing tools). Mechanism (swizzle vs a patch of React Native's text view) is UNVERIFIED and is a `security-architect` decision. Record the finding in `docs/agents/cto/RULINGS.md` and on NS-01-R50, NS-06-A22, NS-21-R12; the fields stay behind their flags in `production` until a device row shows Writing Tools absent |
| 2 | `Intl.Segmenter` on Hermes | formatjs guide lists `Intl.Segmenter` as not supported by Hermes, polyfill `@formatjs/intl-segmenter` [V]. Repo comments agree (`packages/core/src/text.ts:75`, `packages/core/src/lang/types.ts:74` [F]); `book-cover.logic.ts:105` uses it only when present | Not on the device (vendor doc; not run) | Pure-TS grapheme splitter in `packages/core` (1.2); Node's `Intl.Segmenter` is the test oracle over Devanagari, Arabic, CJK and emoji fixtures. No polyfill package (bundle size, and the oracle gives the same assurance). Node 22's Unicode version for GB9c conjuncts is UNVERIFIED |
| 3 | expo-notifications and `hiddenPreviewsBodyPlaceholder` | Expo SDK 58 docs list `NotificationCategoryOptions.previewPlaceholder` ("shown when the user has disabled previews"), and `NotificationContentInput.interruptionLevel` (iOS) [V]. The docs do not name `hiddenPreviewsBodyPlaceholder`; the app is on SDK 57 (`expo-notifications ~57.0.21`, `package.json:40` [F]) and its source was not read | Likely supported, mapping UNVERIFIED | Use `setNotificationCategoryAsync('reminder', [], { previewPlaceholder })` once, not awaited at launch; set `categoryIdentifier` and `interruptionLevel: 'active'` on every request. Before merge, read the installed SDK 57 iOS source for the mapping; device row with Show Previews set to Never |
| 4 | Keep-awake in Read together | Built: `useKeepAwakeWhile(context === 'readTogether' && p.playing, KEEP_AWAKE_TAGS.readTogether)` at `components/player/audio-player.tsx:113` [F]; the hook releases at once when `active` turns false (`lib/resilience/keep-awake.ts:14-21` [F]) | NS-24-R9's "no keep-awake call found" is inaccurate; the 5 min grace is missing | Add `useKeepAwakeWhile(active, tag, { graceMs })`; Read together passes 5 minutes |
| 5 | Bold Text with custom fonts | `AccessibilityInfo.isBoldTextEnabled()` and `boldTextChanged` exist (iOS) [V]. Bundled: Mukta Regular, Medium, SemiBold; Literata Regular, Medium, Italic; Tiro Regular only (`packages/design-tokens/fonts/` [F]). Whether iOS thickens custom faces itself is UNVERIFIED | Partly blocked for Tiro | Face map stepped up one weight under Bold Text (4.4); add a Literata SemiBold static cut (OFL); Tiro has no heavier cut, so either accept Regular for Devanagari letters or fall back to a system Devanagari face under Bold Text; `design-systems` and the founder decide; device check first (NS-33-R14) |
| 6 | Switch Control status from JS | React Native AccessibilityInfo has no Switch Control method or event [V] | Gap | `scribe-system` exposes `UIAccessibility.isSwitchControlRunning` and its change notification (UIKit, from memory; UNVERIFIED this session) |
| 7 | `announcementFinished` | iOS event with `{ announcement, success }` [V] | Available | Match by string; cap 60 s if the event never arrives (PROPOSED) |
| 8 | FTS5 in `expo-sqlite` 57 | #798 notes it compiles by default (card) | UNVERIFIED on a phone | Probe with a temporary table at startup (as #798); scan path ships alone if absent (R19) |
| 9 | Share text plus one image | RN `Share.share` documents `message` and `url`, iOS options `subject`, `excludedActivityTypes`, and returns `{ action, activityType }` [V]; whether iOS hands both to the sheet together is not stated | UNVERIFIED | `Share.share({ message, url })`, never `title` or `subject`; R4a fixtures on device; if only one item arrives, ship text only and keep the picture toggle off (Level 1 still holds) |
| 10 | `InteractionManager` under the new architecture | not read | UNVERIFIED | Use a timer after first render as the floor for "off the first frame" work |
| 11 | XCUITest `performAccessibilityAudit()` for NS-33-R16 | the repo's iOS e2e uses Maestro flows (`apps/mobile/e2e/flows` [F]); no XCUITest target found | Gap | `qa` adds a minimal XCUITest target or the row becomes device-only; founder decision on CI cost |

### 7.2 Engineering risks and open questions

| # | Risk or question | Recommended default |
|---|---|---|
| 1 | The photo stack's review debt: six PRs over 400 lines, #838 at 25 files [F] | Re-cut where no counted review exists yet (5.2); otherwise record the exception in each PR body |
| 2 | A foreign account on the phone (X4) has no UX today | Held screen with Sign out only; no Erase on it (D1); founder may change |
| 3 | Local migrations v11 to v14 all edit one file in parallel | Assign numbers at merge; byte-identity test per step |
| 4 | Server-side seal choice (B10.1) | Option (b), as card 06 says; the phone stores `seal_watermark` per book; old clients ignore unknown keys (`sync` confirms the parser, BL-987) |
| 5 | Visibility drift between surfaces | `isVisibleTo` plus the call-site test (B6) before the seal flag turns on anywhere |
| 6 | Index bytes of removed words | `secure_delete` and FTS5 `optimize` at idle (R30), as #798 does |
| 7 | Derivatives and iPhone backup restore | regenerate from the stored copy on first view (NS-37 section 5) |
| 8 | Notification ceiling across two schedulers (`payments` owns plan notices) | one `allocate()` in `budget.ts` both call; total 60 |
| 9 | Low Power Mode guard for loops (bucket E) | add `useLowPowerMode` beside Reduce Motion in `lib/motion.ts` (UNVERIFIED: React Native has no Low Power Mode API in AccessibilityInfo; `expo-battery` exposes it, not installed) |
| 10 | Words gate (G3) blocks flags, not code | every slice ships with PROPOSED keys behind its flag |
| 11 | EAS build count (D-092: 15 iOS builds a month on Free) | batch native changes (BL-953, BL-932a, `scribe-system`) into one native build per wave |
| 12 | `remoteConfig` pause keys hiding local surfaces vs LEGAL-REQ-040 | fine as carded (they never stop reading, export or erase); header text updated |

---

## 8. Cards and rows I think are wrong, with evidence

1. **NS-13 vs NS-32 on the notification ceiling.** NS-13 3a item 7 and NS-13-R23 say at most 60 pending of all classes together, plan notices first. NS-32 section 3 and NS-32-R4b, R7 give the budgeted group its own 60 and plan its own 4, total 64 ("Given the budgeted group holds 60 pending, Then all due plan notices (up to 4) are still scheduled, and the total pending is at most 64"). BL-966 follows NS-13 ("at most 60 pending, plan notices kept first"). Recommend: total 60, budgeted fills what plan notices leave; reword NS-32-R4b's Given to "a plan that would fill 60 budgeted slots".
2. **NS-05 Share vs BL-939 and J-N11.** The card's Level 1 sends a wrapper (date line, words, signature line; NS-05-R4a, R18) and optionally the stored picture (R5b, Q45). BL-939's title says "text only" and its test says "byte-equal to the kept words"; J-N11 says "the text sent equals the kept words byte for byte, with nothing added". Recommend the backlog row and journey say "the R18 wrapper around `final_text`, byte for byte", and that the picture toggle ships only after Q45.
3. **NS-06 Part B vs BL-969 and BL-970.** The card uses `seal_opens_at` and `seal_opens_on` and a server-stamped `seal_cleared_at` that is never cleared, and the guard refuses any change to a set pair (B10 items 1, 2; B1, B3, B13). BL-969 names `sealed_until` (DATE) and BL-970 says "Open now nulls both columns", which the card's guard would refuse with `SCSEL`. The rows should follow the card.
4. **NS-02 split order vs BL-952.** The card's rollout order is content and pause key; pure query, snippet, sources; lifecycle and repos; store and sync; Find mode and header; device row (`02-find.md:193`). BL-952 lists a different order (tables, view, reconcile, bar, batches, pause plus announcement plus debounce). Not harmful, but two sources of truth; I follow the card.
5. **NS-36 open question default vs NS-06 B10.1.** NS-36 section 23 defaults to the job (option (a)) when `pg_cron` is available; NS-06 B10.1 and OQ-B2 default to option (b). One default should win; option (b) has no platform dependency.
6. **NS-24-R9's evidence note.** It says no keep-awake call was found in `read-together.tsx`. The call is in `components/player/audio-player.tsx:113` [F] for the Read together context; what is missing is the 5-minute grace after pause.
7. **NS-24-R3 vs BL-947.** The card skips private letters of any author; BL-947 says "skip the other parent's private letters". The card should win; the row should be corrected.
8. **Quiet this book and reminders (NS-13-R12, NS-32-R14, BL-985).** `store.ts:388` says "The planner reads `Child.quiet`", but `plannerChildren()` maps only `remindersOn` (`prefs.ts:115-116` [F]). No backlog row says to wire quiet into the planner: BL-985 adds only the Me control, and NS-13-R12 merges "quieted" with "Include in my reminders off". Once BL-985 ships, a quieted book will still get month and birthday notes. I put the fix in BL-966's planner slice; the row should say so.
9. **NS-33-R14 (Bold Text on Mukta, Literata and Tiro).** Tiro Devanagari Hindi ships only a Regular face (`packages/design-tokens/fonts/` [F]), and Literata has no cut heavier than Medium in the bundle, so the row cannot pass for Tiro (and only partly for Literata) without a font or design decision.
10. **NS-01-R54 and BL-957 on the From name unit.** NS-16-R1 counts the From name in database code points (30); BL-957 says "the app counts graphemes and refuses before save" for every field. These are compatible only if `length.ts` keeps a per-field unit (graphemes for photo words, place, first label, typed day; code points for `author_signs_as`), which is how 1.2 defines it. The row should say per-field units.
11. **`capabilities.ts` house style for local flags (BL-942 and others).** BL-942 asks the flag to "follow `capabilities.ts` house style", but that file's build flags require server features (`capabilities.ts:185-194` [F]) and `testflight` runs with servers off (`eas.json` [F]). Following the style literally would hide every local feature in testflight. The local-flag family in 3.1 is needed.
12. **NS-01-R13a and NS-23-R11 scope.** NS-01 blanks pictures on inactive with or without App lock; NS-23-R11 hides the past-letter fragment only with App lock on. Not wrong, but inconsistent for the same snapshot; I would ask the CPO whether a letter fragment deserves the same rule as a picture.

---

## Sources read this session

Repo (read-only worktree `/home/claude/wt/E` at `450bcb4a9`): cards `00`, `01`, `02`, `05`, `06`, `08` (NS-09 to NS-11), `09` (NS-13 to NS-16, NS-18), `10` (NS-21 to NS-24), `11`, `13`, `14`, `16`; `docs/BACKLOG.md` BL-922 to BL-987; `docs/engineering/PRINCIPLES.md`; the code files cited above; PRs #834, #835 to #842, #798, #758, #721 through `gh api` (REST). Cards `03`, `04`, `07` (outside C5 and C28 rows), `12` and NS-12, NS-17, NS-19, NS-20, NS-25 to NS-31 were read only at heading or row level.

Vendor pages read 20 Nov 2026:
- React Native TextInput, 0.81 and current (0.88): https://reactnative.dev/docs/0.81/textinput , https://reactnative.dev/docs/textinput
- Apple `UITextInputTraits.writingToolsBehavior`: https://developer.apple.com/documentation/uikit/uitextinputtraits/writingtoolsbehavior.md
- Apple developer forums, setting writing tools globally: https://developer.apple.com/forums/thread/768711
- formatjs, React Native and Hermes Intl support: https://formatjs.github.io/docs/guides/react-native-hermes
- Expo Notifications (SDK 58 reference): https://docs.expo.dev/versions/latest/sdk/notifications.md
- React Native AccessibilityInfo: https://reactnative.dev/docs/accessibilityinfo
- React Native Share: https://reactnative.dev/docs/share
