# P5 critics' pass: Book, letter and Read together (go/no-go B2-10)

Wednesday 28 October 2026. The experience critics' pass over package P5 of `docs/design/EXPERIENCE_PASS_2026-10.md` (v1.3): section 6 "P5 Book, letter and Read together", journeys J09 (the Book), J10 (the letter, delete, Recently deleted, Erase now) and J11 (Read together), spec ids S24 to S32 and S35 to S39, the P5 parts of S62 and S63, and section 5.8 rows 5 (the arrival), 7 and 8. Read against `develop` at **817879d**, where all of P5 is merged: P5 #222 (d14dbaa), with #228 and #296 and the Family tab edits of #314 on its files. `develop` is now a6519a4; the two commits since (#358, #362) touch none of P5's files, checked with `git diff 817879d origin/develop` over P5's file list, so every file:line below holds at a6519a4. This pass critiques; it changes no app code, test or copy.

## 0. Verdict for B2-10 (P5's share)

**Signed, with nine Should items to fix or rule before build 2 and the device checks in section 8 on the build 2 run sheet.** There is no Must item: nothing in P5 writes, rewrites or shapes a person's words, every machine edit that reaches the Book or the letter stays visible and reversible as a view, the raw transcript is never touched, no screen counts a gap, and the held-for-counsel text is word for word as registered.

P5 is the calm half of the product and it mostly reads that way. The Book opens like a printed book: a lit current month that stands alone with no sentence, a numeral and a date range per month, excerpts that end in a fade and never in an ellipsis, a card that is one VoiceOver element, and quiet days that are small, unsigned and never counted. The letter is a page: the words in the letter's serif, the signature, one pill player, one provenance line, "Exactly as said" one tap away. Delete asks once, returns to the Book and leaves one Undo that does not time out. Recently deleted shows the person's own words, one date line, no countdown. Read together has the right dateline, no "1 / 5", a night pool that never sits behind the words, and a way forward from a stale link.

What keeps it from a clean sign is a handful of places where the screen promises one thing and the build does another, none of them harmful to a person's words: the receipt of a save (the wash) is lost on the screen that matters most, the first letter; the card-to-page move that S26 calls the signature of the Book is built but switched off; a recording with no words has no way to get words; Read together's Next letter button clips at the largest text size, on the screen the large-print reader uses; and on the second parent's phone the Book makes two claims about the first parent's recording and fixes that the phone cannot know.

| Rank | Count |
|---|---|
| Must before build 2 | 0 |
| Should before build 2 | 9 |
| Later | 9 |
| Accept as built | 16 |

The three to look at first: **S1** (the arrival wash never shows for a Book that mounts with `arrived`, which is every first letter), **S2** (card to page is not live; the coordinator needs to rule: flip it for build 2 after the device checks, or accept the platform push) and **S3** ("Write the words" is missing on a recording with no words, though the store now accepts it).

## 1. How this was looked at

- A scratch worktree at 817879d (then checked to a6519a4 for P5's files), `node_modules` built as symlinks to the main checkout's entries with `@scribe/*` pointing at the worktree (no `npm ci`), the web exports built fresh by the e2e global setup (default, seeded, and server features on).
- The P5 Playwright journeys with the preinstalled Chromium, `JOURNEY_SHOTS=1`, one worker: **j09, j10 and j11, 12 of 13 passed (28.8 min, the machine at a load average above 30)**. The one failure, J10c, is in section 2 (S9). The journey step files the run rewrote under `docs/release/journey/` were not committed.
- Scratch probes (never committed) against patched copies of the web build, as the P4 pass did: a font scale reported to the app so the accessibility-size branches run (there are none in P5's screens, see section 7), text sizes emulated by scaling every px font size by React Native's multipliers (`a11y.logic.ts` `FONT_SCALE`: AX3 2.643, AX5 3.571) with the token caps (numeral 1.4, display 1.6, title1 1.8, title2 2.0, letterDateline 2.4; icons keep their size; the emulation does not know `maxFontSizeMultiplier`, so the capped top bar and "Aa" look larger than they would be); dark mode (`prefers-color-scheme`); Reduce Motion (`prefers-reduced-motion`); a fixed clock at 11:00 and 21:30 for Read together's night pool; a frame log of the arrival wash on every animation frame; the letter route switched to `cardToPage` in a copy of the bundle, to see whether the flip works today; and the states from the screens' tables (the Book with one letter, many letters, a waiting letter, a letter with no words, quiet days; a deleted letter; an erased or never-existing id; the shelf in a build that syncs).
- Screenshots stay out of git (COORDINATION section 8): `/tmp/cr-p5/shots/` (`book-*`, `letter-*`, `rt-*`, `shelf-*`, `delete-*`, `flip-*`, contact sheets `sheet-*.png`) and the probe results in `/tmp/cr-p5/results.jsonl`; scripts in `/tmp/claude-0/-home-user-earlyletters/9c7d4e54-75ea-5024-8f40-e18f5142ba43/scratchpad/critics-p5-scripts/`. Token contrast was computed from `packages/design-tokens` (section 6).
- Read: CLAUDE.md, the spec sections above (S24 to S32, S35 to S39, S62 and S63, 5.8, P5's section 6 entry and its card-to-page contract), DESIGN_LANGUAGE 8 to 12, MOTION 5a, 5e, 5f, 5g, 5i, 5m and 6, COMPONENTS 0.1, 2.5, 2.5b, 2.14, 2.20 to 2.22, `packages/content` VOICE.md and BRAND.md, every string these screens read (dumped from `packages/content`), every file in P5's list, and #222's body, its two reviews and P1's replies. The server side was read where a P5 claim depends on it (`book_entries`, `entry.erase`).

The web preview is a stand-in. It has no haptics, no VoiceOver, no iOS sheet or native stack animation (the web mounts a letter over the tabs and keeps the Tonight screen in the page behind the Book), no recordings on disk (the seeded audio files do not exist, so the player is the closest honest state), no speech model, no second phone and no StoreKit. Where that limits a finding, the finding says so; section 8 lists everything left for a phone.

## 2. Findings, ranked

### Must before build 2

None.

### Should before build 2

**S1. The arrival wash is lost whenever the Book mounts with `arrived`, which includes the first letter.** (Raised on the P4 pass as S11, where P4 handed it to P5; not changed since.)
- Spec: S26 acceptance (line 822): "After a save, the Book shows the new card in view and washed, once"; S26 Motion (809); 5.8 row 5 (1806): "the Book is positioned before its first frame with the new card under its opener, then the 1.6 s wash"; MOTION 5e "Arrival: ... already in place with an `accentSoft` wash fading over 1.6 s".
- Built: the Book keeps its letters in state that starts empty and fills in an effect (`apps/mobile/src/app/(tabs)/book.tsx:75`, `:95-100`). The arrival is looked up from those chapters at render (`:136`) and acted on in an effect keyed to the param (`:141-155`). On a Book that mounts with `arrived` already on its route, the first render has no chapters, so `arrival` is null: no wash (`:144`), no positioning (`:145-146`), and the param is cleared anyway (`:152`), so nothing runs again when the letters arrive. The tab layout sets no `lazy: false` (`apps/mobile/src/app/(tabs)/_layout.tsx:54-72`), so on a phone the Book tab mounts the first time it is shown.
- Measured on the web (a real typed letter kept from Write, the seeded Plus family, 350 frames): from the first frame the Book is on screen, the wash layer on the new card is at opacity 0 on every frame; the card is in view at the top of the current month, unwashed. The P4 pass (S11) measured the same. On a phone the tabs stay mounted after the first visit, so the wash probably runs for later letters; for the first letter of a new install, and for any session where the person has not yet opened the Book tab, the Book mounts with the param and the wash is lost (device check D2).
- A parent: keeps the very first letter, the Book appears, and the new card is just a card among cards. The one moment the product says "this is kept, here" is the moment it says nothing.
- Fix: keep the param until the card is found (key the effect on the arrival's id, clear the param after the wash starts), read the letters synchronously in the state initialiser (`useState(() => listEntriesForChild(active.id))`) so the first frame is not the empty-book state, and start the wash when the Book is uncovered (after `route.dissolveMs`), as the P4 pass proposed. Pin it with a test that mounts the Book with a param and an empty first read.

**S2. Card to page is built and switched off: every letter still opens by the platform push.** (#222 request 1; P1 said "right after this merges, as the coordinator set"; not done.)
- Spec: S26 Motion (809) and acceptance (818 to 820): the card grows into its page, reverses on Back, keeps its press through the 136 ms hold, VoiceOver lands on the page's opening and cannot reach the Book; 5.8 row 7 (1811); P5's entry (section 6, line 1972): "The letter route stays a native push until the page mounts `CardToPage`; then P5 asks P1 to switch `ROUTES['letter/[id]']`". The page mounts `CardToPage` since #222.
- Built: `'letter/[id]': { rows: [7], move: 'push' }` (`apps/mobile/src/lib/transitions.logic.ts:52`), so `CARD_MODE` is false (`apps/mobile/src/app/letter/[id].tsx:86`) and the whole card-mode branch (`:172-178`, `:249-262`, `:359`, `:373`, `:494-499`) is not exercised by the shipped app. The page still estimates when the carried words are home with `pageRestPlan` (`:253`) instead of reading P1's `useCardToPagePhase()` (#228), which Reviewer C asked to switch before the flip (#222 note 2) and which the final review recorded as open.
- Probed: with the route switched to `cardToPage` in a copy of the bundle, a card opens into its page and Back returns to the Book, light and under Reduce Motion, with no console or page error, the page `aria-modal` and 14 nodes marked `aria-hidden`. The move itself (timing, press, focus) was not frame-measured here; #222's reviewers did that on the web at 879e90c and #228 fixed their three findings. All of it is a device question (D4).
- A parent: opens a letter and gets a screen sliding in from the side, not the page growing out of the card they touched. The Book's biggest piece of motion is not in build 2.
- Fix: coordinator rules. Either flip the row now (P1's one line and its test), after switching `pageRestPlan` to `useCardToPagePhase()` and after D4 on a phone; or accept the push for build 2 and write S26's lines 818 to 820 and 5.8 row 7 as "build 3". Not flipping is safe: the push is the platform default and every other P5 line works under it.

**S3. "Write the words" is missing on a recording with no words, though the store now accepts it.** (#222 request 4, "Open" at merge; the store half landed, the screen half did not.)
- Spec: S28 (855): the page for a letter with no words offers `wordsCopy.waiting.writeButton` "Write the words" (opens the words sheet), "Record again" is removed, "Add to book" and "Delete" stay; S28 acceptance (858).
- Built: the words card is rendered only for a letter still waiting (`apps/mobile/src/app/letter/[id].tsx:386`: `own && words === 'waiting'`). `setTypedWordsOnce` accepts a spoken letter whose words came back empty (`apps/mobile/src/lib/db/repos/entries.ts:270-283`, "S28, P5 #222"; `store.ts:527-539`) and nothing calls it for that letter.
- Rendered (the seeded no-words letter, `letter-nowords.png`): the app's note "No words in this one. The recording is kept just as it is.", the pill player, "Add to book", "Delete". No way to put the person's own words with their recording. J10e asserts only that "Record again" is gone, so the journey passes.
- A parent: the recording has a quiet voice or a laugh the phone did not hear as words; they can play it, keep it or delete it, but not write what was said. The note promises the recording is kept; it does not let them add to it.
- Fix: render the same words card for `nobodySpoke` (the "Write the words" button and sheet; no "Get words ready" or retry), keep the result on the existing route (Review for the typed words, as for a waiting letter), and add a J10e assertion.

**S4. Read together's "Next letter" clips at the largest text size.** (Emulated; device check D3.)
- Spec: COMPONENTS 0.1 (line 52): "Layouts must reflow at AX5: rows stack, nothing truncates silently, and buttons grow taller instead of clipping"; S30 Visual (884): chrome-free, Large print by default, for the reader who needs it.
- Built: "Back one" and "Next letter" are two `flex-1` buttons in one row (`apps/mobile/src/app/read-together.tsx:158-163`); neither this screen nor any P5 screen has an accessibility-size branch (section 7).
- Rendered at an emulated AX5 (`rt-ax5-1.png`): both pills become tall circles, "Back / one" and "Next / letter" on two lines, and "letter" runs past the pill's edge. The primary control of the screen is the one that clips.
- A parent: a grandparent reading with a child at the largest text size cannot read the button that turns the page.
- Fix: at accessibility sizes (`useIsAccessibilitySize()`) stack the two buttons full width, "Next letter" first, no fixed shape; check on a phone at AX3 and AX5 on a 6.1-inch iPhone and an SE.

**S5. Erase now is hidden in a build that syncs, although the erase it waits for is merged.** (#222 request 7; needs a ruling.)
- Spec: S39 (1011): "With sync on, Erase now is shown only once the server erase exists (S63)"; S63 (1580): until WP-F16-13 merges a sync build hides it, "the honest state, not a broken button"; S63 acceptance (1585 to 1588).
- Built: `shelfActions({ sync: capabilities.sync })` with no `serverErase` (`apps/mobile/src/app/settings/recently-deleted.tsx:58`; `apps/mobile/src/components/book/shelf.logic.ts:99-100`). But the client half is in: `store.eraseEntry` queues `entry.erase` in the same transaction as the row (`apps/mobile/src/lib/store.ts:718-755`, "WP-F16-13, F16-REQ-024"), and the server half is in `supabase/migrations/20261016000000_sync_v1_server.sql` (its header lists WP-F16-13: `entry.erase`, the erasure record).
- Rendered on the server-on build (`shelf-sync.png`): a card with its date line and "Restore" only.
- A parent: in build 2 (servers on, the family's two phones) a deleted letter cannot be erased now; it waits its 30 days. That is honest and is what the spec says while the erase is missing, but the erase now exists.
- Fix: ask S03 and S02 whether WP-F17-10's reach (the backup object, every M14 system) is complete. If it is, pass `serverErase: true` (a one-line change in the screen and the test), and check S63's four acceptance lines on two phones; if not, leave it, and write the date of the flip next to this item. Unverified here: whether the server's erase reaches every system F17 8.4 lists.

**S6. Erase now fails without a word.**
- Spec: S39 (1011): "On a phone the file is removed first, then the row (D-085)"; principle 8 (honest states).
- Built: `eraseEntry` returns false when the recording file cannot be removed, keeping the row for a retry (`apps/mobile/src/lib/store.ts:741-743`); the screen toasts only on success (`apps/mobile/src/app/settings/recently-deleted.tsx:72-80`, `if (done) toast.show(...)`).
- A parent: confirms "Erase this letter now?", the sheet closes, a haptic warning plays (`:76`), nothing else happens and the card is still there. They are left to guess whether it worked.
- Fix: say it on the failure path, in the app's error shape (what did not happen, then what is true): the letter is still on the shelf and nothing was erased; offer "Erase now" again. A new content key; request to P0's owner. Not seen on the web (it has no files to fail on).

**S7. On the second parent's phone, a card's spoken label says "Recording kept on this phone" for a letter whose recording is on the other parent's phone.**
- Spec: S27 acceptance (849): "The other parent's letter shows ... 'Recording kept on Papa's phone'"; K-42 and D-033, the "on this phone" fact must be true where it is shown.
- Built: the Book card's label adds `copy.book.recordingOnPhone` for every spoken letter, with no author check (`apps/mobile/src/components/book/letter-card.tsx:83`, `:91`). The letter page gets it right (`apps/mobile/src/app/letter/[id].tsx:310`, `own &&`), and the player says "Recording kept on Papa's phone" (`apps/mobile/src/components/player/audio-player.tsx:67-73`).
- A parent: Papa, with VoiceOver on, reads Mama's letters in the Book and hears "Recording kept on this phone" on each. The visible card shows no such line (the length is not synced to the other parent), so only a screen reader user is told something false.
- Fix: leave the line out of the label when `!isOwnEntry(entry)` (or say `recordingElsewhere`); pin it with a label test. Seen from source and the sync view only; no second phone was available (D1).

**S8. On the second parent's phone, every spoken letter of the first parent says "Spoken, with small fixes", whether or not any fix was made.**
- Spec: VOICE "Word for word": say "Exactly as said" only when it is true; BRAND glossary: "In review and on the letter page we say what happened"; S27 (833): the provenance line.
- Built: `provenanceKey` compares the raw words with the kept words (`apps/mobile/src/lib/provenance.ts:11-15`). The other parent's phone never receives the raw words: they read the letter through `book_entries`, "without the author's working material (raw transcript, its hash, machine edits, STT metadata)" (`supabase/migrations/20261003000000_security_and_family.sql:563-566`, PRD K-09). So `rawTranscript` there is empty, the two never match, and the letter page prints the "fixed" line for every spoken letter (`apps/mobile/src/app/letter/[id].tsx:309-310`) with no "Exactly as said" to check it against (`:306`, `own &&`, deliberately, "co-parent letters have no raw transcript").
- A parent: Papa reads Mama's word-perfect letter under "Spoken, with small fixes", a claim that software changed her words, shown on the one page that exists to say it did not. The claim cannot be true or false on his phone; it is just unknown.
- Fix: for a letter whose raw words are not on this phone, say only that it was spoken ("Spoken", a new key `book.provenance.spokenOther`, or nothing); keep the two honest lines for the author. Content request to P0's owner; S27's line 833 changes with it. Seen from source and the database view; not rendered on a second phone (D1).

**S9. j10c fails on today's data, so the journey record for the waiting letter is stale.**
- Spec: P5's tests (section 6, line 1978); P7 re-runs the journey from these files.
- Built: `apps/mobile/e2e-web/j10-letter.flow.ts:115` clicks `getByText(/waiting for its words/i).first()`. On the web the Tonight screen stays in the page under the Book, and its draft card carries the same words, so `.first()` is that button (top 340 pt), covered by the lit opener ("subtree intercepts pointer events", 148 retries, 90 s timeout). The Book's own card is the second match (`book.card`, top 591 pt). Probed, same two matches. The other twelve pass.
- A parent: never sees it. The record P7 regenerates would have no J10c step, and the next run of this flow fails.
- Fix: select the card (`getByTestId('book.card').filter({ hasText: ... })`, as j09 does elsewhere for cards); P5 owns the file.

### Later

| # | Spec line | Built (817879d) | What a parent meets | Fix |
|---|---|---|---|---|
| L1 | S27 (833, 842): one provenance line; S27 Motion (844): "Exactly as said" cross-fades the text with its label | the line stays "Spoken, with small fixes. Recording kept on this phone." under the "Exactly what you said" label (`apps/mobile/src/app/letter/[id].tsx:368-372`, `:407-410`; `letter-exact-light.png`) | the page says "exactly what you said" at the top and "with small fixes" at the foot | while the exact view is on, the line says how the letter was made without "small fixes", or drops it; spec owner to word it |
| L2 | the constitution: every edit stored and reversible; S27 | after Keep, the letter page offers the whole-letter toggle only: no mark shows which words were fixed (the "we we" in `letter-exact-light.png`) and a single fix cannot be put back (`[id].tsx:306-310`) | the person can read what was fixed only by reading both versions | spec owner to rule whether a kept letter ever gets its marks back; the raw is kept, so nothing is lost either way |
| L3 | 5.8 rule 3, TDD 09 A11Y focus; S30 acceptance (892): "VoiceOver reads 'Letter 1 of 5'" | a page turn announces "Letter 2 of 5" and moves no focus (`apps/mobile/src/app/read-together.tsx:91-99`; `components/motion/page-turn.tsx` has no focus move) | a VoiceOver reader hears the position, then has to swipe back up to reach the new page's dateline and words | device check D5; if focus stays on "Next letter", move it to the new dateline after the turn |
| L4 | S30 States (888); S32 (909) | the Book's Read together button shows when any kept letter exists (`apps/mobile/src/app/(tabs)/book.tsx:243`); Read together reads only kept letters with words (`quiet-day.logic.ts:53`) | with one kept letter that is still waiting for its words, the button opens "Letters you add to the book will be here to read together." | show the button on `readableInBook`, as the screen itself does |
| L5 | COMPONENTS 2.5b: long-press or the VoiceOver action removes a mark | a quiet-day row removes on a 450 ms long-press with no visible cue (`quiet-day-row.tsx:34-41`) | a sighted parent who wants a mark gone has nothing that says how | none for now (the app's own words stay small); revisit with the first person who asks |
| L6 | COMPONENTS 0.1: labels name the thing | every shelf card has a "Restore" and an "Erase now" with the same names (`recently-deleted.tsx:146-147`) | VoiceOver hears the card, then "Restore, button", "Erase now, button", and on three cards the same two again | a hint naming the card's first words, or a card-level rotor action |
| L7 | S27 (834, 836), S62 (1552, 1565); #222 request 6 | the restore line slot is a comment (`book.tsx:254-255`); `book.recordingBackedUp` and `backupCopy.recordingOnItsWay` are not read or not defined anywhere under `src` | with backup on, the page keeps saying "Recording kept on this phone", which is true and incomplete; a new phone shows a player for a recording still on its way | waits on P8c and S05 (a read of one recording's backup state); build 2 backup depends on AL-06, so this can wait for that decision |
| L8 | S29 (863), MOTION 6: `selection` haptic per Reading Size step | `ChoiceGroup` plays `tap` (#222 "Not in this PR") | a slightly different tick on iPhone | P1's primitive plays `selection` for radio rows |
| L9 | S38 (996): "Back in {child}'s book." | `fill(d.restoredToast, { child: child?.name ?? '' })` (`recently-deleted.tsx:65-68`) | if a letter's book has gone, the toast reads "Back in 's book." | fall back to the active book's name, or the `book.title` words |

### Accept as built

| # | What | Ruling |
|---|---|---|
| A1 | Nothing in P5 writes, rewrites or shapes a person's words. The Book, the letter and the shelf show `finalText`, or `rawTranscript` under "Exactly what you said"; the one write is the typed words for a waiting letter, stored as the raw and the words and labelled "Typed" (`entries.ts:270-283`) | Accept. |
| A2 | Edits stay visible and reversible as a view: the provenance line, "Exactly as said" and back, shown only when the two differ (`letter/[id].tsx:306`); the raw is never written by P5 (a read of every `rawTranscript` use in P5's files). The marks live in Review (P4); see L2 | Accept, with L1 and L2. |
| A3 | Excerpts cut visually only: `ExcerptFade` clips by height, keeps the whole text in the element, and fades the last 40 percent of the last line; no ellipsis glyph, no `numberOfLines` on a person's words (`letter-card.tsx:113`; `excerpt-fade.tsx`). Cards and shelf cards read every word in their label (`letter-card.tsx:91`, `recently-deleted.tsx:132`) | Accept. Seen in every shot; whole lines at xSmall, Small and Medium are a device check (D6). |
| A4 | Celebrate what exists, never count gaps: openers count only letters (`chapters.ts:202-212`), a quiet day never enters a count or the "From" line (`chapters.ts:61`), the current month with no letters stands alone with no sentence, no streaks, badges or counts anywhere | Accept (J09 asserts it; rendered). |
| A5 | S24 and S26 openers: one VoiceOver header per month ("Month 6. 2 letters, from Mama. September 28 to October 27", no middle dot spoken), the lit current month with a still radial, hairlines between months, `book.monthRange` filled with real dates (`month-opener.tsx:55-74`, `chapters.ts:141-163`) | Accept. Rendered light, dark, AX3 and AX5 (emulated). |
| A6 | S24: the empty Book is the closed cover, one plain sentence, "Write a letter" to Tonight, no "For Asha" with one book (`book.tsx:237`, `:274-287`) | Accept (J09, rendered in the journey run). |
| A7 | S35, S36: the delete sheet has no header Close and "Keep it" is the default; confirm returns to the Book, the card leaves its row and one toast, "Letter deleted." with Undo and Close, has no timer and goes when the Book is left; Undo restores in place (`confirm-sheet.tsx`, `book.tsx:157-188`, `toast.tsx:71`) | Accept. Rendered: toast above the tab bar from the first frame, no full-page deleted state (`sheet-delete.png`). Collapse timing is not frame-measured. |
| A8 | S37: not found shows the page drawing, "This letter is not in the book", "It is in Recently deleted." with "Open Recently deleted" (primary) and "Back to the book" only for a letter on the shelf; one way back otherwise; never the id (`notfound-shelf.png`, J10d) | Accept. |
| A9 | S38 on one phone: the words in the letter face and muted, two lines and a fade, "From Mama", one line "Deleted October 28. Kept here until November 27.", Restore and Erase now, a new toast replaces the last, the empty page has no repeated heading (`sheet-shelf.png`, J10f) | Accept, with S5 and S6. |
| A10 | S30 to S32: dateline "The first weeks / Month N, then From Mama" (the middle-dot separator is not spoken), a 2 pt position hairline labelled "Letter 1 of 5", no counter, Keep playing as a switch chip, the night pool low and behind the controls only (rendered at 21:30, light and dark), the moon draws on and the buttons are present from the first frame, a stale link has "Write a letter" (`sheet-rt.png`, J11, J11b) | Accept, with S4 and L3. |
| A11 | S27's pill player: one control group, 56 pt, play, "Hear Mama", time remaining, a thin scrubber, two VoiceOver elements (button and adjustable position), a note instead of a broken player for the other parent's letter or a file that is not here (`audio-player.tsx:55-83`, `:155-219`) | Accept. Real playback is a device check (D8). |
| A12 | The words: every string comes from `packages/content` or `book/copy.ts`; nothing genders Asha; no "we"; nothing says software wrote, fixed up or improved a letter; "Back in {child}'s book." and "Letter erased." name no place; the held text is untouched: `settings.delete.eraseNowBody` ("The letter and its recording are erased for good.", C8), `book.recordingOnPhone` (K-42, D-033), and `book.recordingBackedUp` (C7) is not shown anywhere yet, so no claim runs ahead of the build (section 9) | Accept. |
| A13 | Contrast (computed from the tokens): textMuted on surfaceRaised 5.83 (light) and 7.32 (dark); textMuted on accentSoft 4.75 and 5.73 (the wash); accent on accentSoft 4.74 and 5.99 (Keep playing on); destructive on surfaceRaised 5.35 and 6.99 (Erase now, Delete); #222's reviewer measured the lit month at 4.56 to 12.21 (light) and 5.86 to 11.44 (dark) | Accept. `LIT_CARD_STRENGTH` still has no test; light `focus` has 0.06 to spare. |
| A14 | Roles and targets: cards are one button with one label, openers one header, the Keep playing chip a switch, every control at least 44 pt (`button.tsx:61-64`, `read-together.tsx:245`, `letter/[id].tsx:320`), the delete sheet and the Reading size sheet close by Escape and by the labelled backdrop (`sheet.tsx:150`, `:188-190`) | Accept. |
| A15 | Privacy: `letter_opened` sends author relation and `has_audio`; `letter_deleted`, `settings_changed`, `child_switched`, `playback_started`, `book_opened` send enums, booleans and ordinals; no letter text, transcript, audio or child name; no `console` calls | Accept. |
| A16 | Dark mode: the Book, the letter page, the delete sheet, Read together with its night pool, and the shelf read as the light ones do, with no raw colour and the lit month's edge in the amber at 40 percent (`book-dark-0.png`, `letter-spoken-dark.png`, `rt-night-dark-1.png`, `shelf-dark.png`) | Accept. |

## 3. What #222 left open, ruled

| #222 item | Where it stands | Ruling |
|---|---|---|
| Request 1: flip `ROUTES['letter/[id]']` to `cardToPage` | not done (`transitions.logic.ts:52`) | S2, coordinator to rule |
| Request 2: `lamp.test.ts` pins the cover | done (the empty Book is the cover, `book.tsx:281`) | Accept |
| Request 3: P1's footer, press, pale patch, `useCardToPagePhase` | fixed in #228; the page still estimates (`[id].tsx:253`) | S2 |
| Request 4: S03, words for a recording with no words | store done (`entries.ts:270-283`); screen not | S3 |
| Request 5: P4 sets `arrived` | set; the Book loses it on a fresh mount | S1 |
| Request 6: P8c restore line and "on its way" | not built (`book.tsx:254-255`) | L7 |
| Request 7: `serverErase` once the server erase ships | the erase is merged and the flag is not passed | S5 |
| Reviewer C note 2: `pageRestPlan` estimates | open | S2 |
| Reviewer C and final note 2: nothing pins the lit month's contrast | open; contrast computed here | Accept (A13) |
| Not in the PR: S29 per-step `selection` haptic | open | L8 |

## 4. Spec-owner changes

Each row changes a line in `docs/design/EXPERIENCE_PASS_2026-10.md` to match what was built and accepted, or to the fix a Should item proposes. Line numbers are at 817879d.

| Spec line | Says now | Proposed wording | Because |
|---|---|---|---|
| S26 Motion, 809, and acceptance, 818 to 820; 5.8 row 7, 1811 | the card grows into its page | "in build 2 the letter opens by the platform push; card to page ships with the route flip (S2)", or no change if the coordinator flips it | S2 |
| S26 acceptance, 822 | "After a save, the Book shows the new card in view and washed, once" | no change; add "also when the Book mounts for the first time with the param" | S1 |
| S27, 833, and acceptance, 849 | the provenance line for every spoken letter | "On the other parent's letter, where this phone has no raw words, the line says 'Spoken' and claims no fixes" | S8 |
| S27 States | nothing for a VoiceOver card label | "A card's spoken label names the recording's place only for the reader's own letters" | S7 |
| S28, 855 | "Write the words" on a letter with no words | no change; add a J10e assertion | S3 |
| S30 Visual, 884 | two buttons | "at accessibility sizes the two buttons stack, full width, Next letter first" | S4 |
| S38 Behaviour, 1002 | "Erase now: the sheet (S39), then 'Letter erased.'" | add: "if the file cannot be removed, the shelf says so and keeps the card" | S6 |
| S39, 1011, and S63, 1580 | Erase now hidden in a sync build | one line saying whether `serverErase` is on for build 2 | S5 |

## 5. Motion

| Moment | Spec | What was seen | Verdict |
|---|---|---|---|
| The Book's first view settles the header (MOTION 5a, row 2) | opacity 0.6 to 1, y 6 to 0, `gentle`, once per session | built (`book.tsx:353-370`); not frame-measured | unverified, device |
| The arrival wash (5.8 row 5) | 1.6 s `accentSoft` wash, once, card in view | wash layer opacity 0 on every frame (350) from the first Book frame, web, light | S1 |
| Card to page and back (row 7) | the paper grows from the card, words carried, 136 ms hold, press kept | not live; with the route switched in a copy, opens and returns without error, light and Reduce Motion | S2, device D4 |
| Delete and Undo (S36) | the card collapses over `exitMs`, one toast, Undo washes the card back | toast on screen at the first frame measured (60 ms), card out of its row; the Undo wash was not looked at | partly measured; collapse timing and the Undo wash are device checks |
| Page turn (row 8, MOTION 5m) | 24 pt, fade, interruptible; Reduce Motion a 200 ms cross-fade | J11 turns forwards, back, to the end and again; the leaving page leaves the accessibility tree; no frame timing | unverified for timing; works |
| Reading size and "Exactly as said" | text cross-fades over 150 ms, size never animates | "Exactly as said" swaps the words and the label (`letter-exact-light.png`); the fade was not measured | unverified |
| Read together night pool and the end page | pool arrives once per opening, dims to half at the end, then nothing moves | pool present at 21:30, absent at 11:00, never behind the words; the end page shows the moon complete; the dimming over 1,200 ms was not measured | rendered, not timed |
| Reduce Motion | every custom move one 200 ms fade, the lamp never animates | the Book, letter and Read together render and work under `prefers-reduced-motion`; the arrival wash is the same S1 | unverified for timing |

## 6. Dark mode

Looked at: the Book (empty month and cards), the letter page, the delete sheet in the Book's frames, Read together at 21:30 and the end page, the shelf and the sync shelf. Nothing reads as the light screen with a darker background: the lit month keeps its amber edge and a faint glow, cards are `surfaceRaised` with the 1 pt edge, the pill player has the edge in place of the shadow, "Delete" and "Erase now" are the lighter destructive tone, and the night pool is a deep violet low behind the controls. Contrast is in A13. Not seen in dark: Whose book, the Reading size sheet, a waiting card, the toast on the shelf (the toast is the same component in both schemes).

## 7. Text size

Emulated, not iOS Dynamic Type (section 1). There is no accessibility-size branch in any P5 screen (`useIsAccessibilitySize` is not imported by the Book, the letter page, Read together, the shelf, the player or the book components), so every layout depends on natural reflow.

- The Book at AX5: the title, the "Read together" pill (label on two lines, grows taller), the lit month (the date range wraps to two lines), the openers (numeral capped at 1.4, line and range wrap), and the cards (the excerpt is two whole lines, "Bath / time. You", with the fade on the last) all reflow with nothing clipped (`book-ax5-0.png`, `book-ax5-1.png`). The inline title bar and the tab labels look wrong in the emulation because it ignores `maxFontSizeMultiplier` and the tab bar's fixed height; unverified on a phone.
- The letter page at AX3 and AX5: the date, the words and the signature reflow; the page scrolls. Not shot below the fold.
- Read together at AX5: S4.
- The shelf at AX5: cards show two whole lines and a fade, the date line wraps, "Restore" and "Erase now" sit in a wrapping row; the emulated navigation title overlaps the help line, which the native header will not do (unverified).
- xSmall, Small and Medium (0.823, 0.882, 0.941): whole lines on every excerpt is P5's acceptance line (821); a device check (D6).

## 8. What we could not see on the web

Each item has a procedure a person can follow in about two minutes on a phone with build 2.

- **D1. A second phone (S7, S8).** Two phones in one family, Mama's letter kept with a spoken recording on hers. On Papa's phone with VoiceOver on, open the Book and touch Mama's card: is "Recording kept on this phone" in what is read? Open the letter: does the line say "Spoken, with small fixes", and is there an "Exactly as said"? A word-perfect letter (say a short sentence with no um) is the useful case.
- **D2. The first letter's arrival (S1).** On a fresh install, never open the Book tab, keep a typed letter from Write. Does the new card wash on the Book, and is it in view? Repeat after opening the Book once, and after a Review keep.
- **D3. Read together at AX3 and AX5 (S4).** Settings, Accessibility, Larger Text, maximum. Open Read together on a 6.1-inch iPhone and an SE: are "Back one" and "Next letter" whole and tappable, and does "Next letter" stay on screen?
- **D4. Card to page, if flipped (S2).** Touch a card and hold: does it shrink within a tenth of a second, and does the page grow out of it? Back by the button, by a swipe down on the top bar: do the words go back into the card? With VoiceOver, after the page arrives: does focus land on the dateline, and can you reach the Book behind (it should not)?
- **D5. Read together with VoiceOver (L3).** Turn a page with "Next letter": is "Letter 2 of 5" heard, and where is focus? Can you reach the new dateline and words in a swipe or two? Is Keep playing read as a switch with its state?
- **D6. Excerpts at xSmall, Small, Medium and AX5.** Settings, Display, Text Size: on the Book and on Recently deleted, are the two lines whole, with the fade on the second?
- **D7. Delete and Undo.** Delete a letter from its page: does the Book return at once, does the card leave its row, is "Letter deleted. Undo." heard once, does Undo bring the card back with the wash, and does the toast go when you leave the Book? Is the `warning` haptic felt on "Delete letter" and not on "Keep it"?
- **D8. The player.** Play a real recording from a letter, drag along the pill, interrupt it with a call or Siri; at AX5 does the pill grow and stay whole? With VoiceOver: two elements, "Position in the recording, 0:12 of 0:42", swipe up and down moves five seconds.
- **D9. The lit month and the night pool.** On an OLED phone at night, light and dark: is the lit month readable and still, and is the pool behind the Read together controls and never the words?
- **D10. Whose book (S25) with two books.** The row "For Asha" is hidden with one book and shown with two; the sheet shows each child's month and a check on the current book; a tap chooses and the Book cross-fades. Not rendered here (it needs a second book; read from source only).
- **D11. Erase now on a phone (S6).** Erase a letter that has a recording; does the recording leave the phone? Then fill the disk so the file cannot be removed, if that can be arranged, and see what the shelf says (today: nothing).
- **D12. Reduce Motion.** Book, a letter, Read together with Reduce Motion on: one fade each way, the page turn a cross-fade, no slide.
- **D13. Haptics.** `warning` on "Delete letter" and "Erase now" only; `tap` on Restore and Undo; none on a page turn, on opening a letter or on a tab.
- **D14. Backup on (L7).** With backup on and a recording uploaded, what does the letter page say; on a new phone, what does a letter whose recording is still coming show?
- **Not seen on the web, as for P4:** VoiceOver itself (the card label, the header read without the middle dot, focus on the dateline), haptics, the native push and sheets, real recordings, the second phone, and StoreKit (not used by P5).

## 9. The constitution and the content rules, checked

- The person's words are kept exactly: the Book and the shelf show `finalText` and cut only by height; the letter page shows `finalText`, or `rawTranscript` as "Exactly what you said"; P5 writes no machine edit and calls no engine; the one write, `setTypedWordsForWaitingEntry`, stores the person's typing as the words and the raw.
- Machine edits that reach P5 are visible and reversible as a view (A2); marks and single put-backs live in Review (P4) and are not offered after Keep (L2).
- The held-for-counsel text is untouched. `settings.delete.eraseNowBody` reads "The letter and its recording are erased for good." (C8, S39). `book.recordingOnPhone` is shown as registered. `book.recordingBackedUp` (C7) exists and is read nowhere, so it makes no claim. No `trust.*`, `billingCopy.*` or `consent*` key is read by a P5 screen. `git diff 817879d origin/develop` over `packages/content/src` shows only the account-deletion and account email copy (#358), which is not P5's.
- Nothing on these screens writes meaning: the headings, kickers, ranges and datelines are the app's small words in the app's face; "A quiet day" is a mark with no sentence; the no-words and waiting notes are the app's own, small, muted, unsigned.
- Nothing says software wrote, fixed up or improved a letter (the provenance lines name what happened: "Spoken, with small fixes", "Spoken, exactly as said", "Typed"; see S8 for where the first is unknown); nothing genders Asha; no streak, point or badge; no count of gaps.
- This document uses the fictional family Asha only, and no em dashes, en dashes, curly quotes, ellipsis characters or emoji (the middle-dot separator in the datelines is written out in words).
- The content rules test (`npm test --workspace packages/content`) was run before this PR; the result is in the PR body.
