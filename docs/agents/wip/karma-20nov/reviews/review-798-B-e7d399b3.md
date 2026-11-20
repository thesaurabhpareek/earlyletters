## Review B at e7d399b3a52c729901cf1de89ff8c45f6eae95b4: PASS WITH NOTES
Head verified (gh api pulls/798: e7d399b3, feat/mobile-find, base develop; origin/develop 09a104da is the merge-base). Read: CLAUDE.md, review-798-B-prev.md, review-798-A-prev.md, the PR body "Fix round, head e7d399b3", the whole fix diff e6846f23..e7d399b3 (5 files, +131/-9: find-result-row.tsx, find-index.test.ts, find-lifecycle.test.ts, find-logic.test.ts, DEVICE_TEST_PLAN.md), find-result-row.tsx, find-mode.tsx, find.logic.ts, flag.ts, snippet.ts, lifecycle.ts l64-169, book.tsx l359-361, 396-416, 492, cover-band.tsx l88-94, card.tsx l45-81, button.tsx l9-11 and 194-212, copy.ts fill(), eas.json, find.en.ts (byte-identical to e6846f23), DEVICE_TEST_PLAN.md l1-26, 32, 765-836, PRD 02-find.md s5, 6, 13, 14 and spec 02 s3, 8, 9, 13 at origin/develop, F09-REQ-015. The two issue comments on the PR are Karma's posts of the previous A and B reviews; no review comments.
Ran in a detached worktree at e7d399b3 (624 node_modules): packages/content `npx vitest run` 19 files, 405 pass; apps/mobile find-logic 39 + find-index 24 + find-lifecycle 22 = 85 pass; `npx tsc --noEmit` exactly 5 errors (help-fallback.tsx 1, app-lock/controller.ts 4); 0 non-ASCII bytes in added lines (fix diff, and the whole PR against develop); `git merge-tree --write-tree origin/develop e7d399b3` clean (d2723174); one mutation (the hint put back on the row): 1 red, restored, worktree clean. CI at the head at 21:51 UTC: the three required contexts `required`, `applied migrations unchanged`, `compliance-fence` success; 12 other checks success, simulator build skipped, `store-profile Release launch` (not required) in_progress.

### 1. Must fix 1: resolved
find-result-row.tsx sets no accessibilityHint; the `@/lib/copy` import went with it; Card passes an undefined hint through (card.tsx:76, 81), so the row is one VoiceOver element with one label that ends "Opens the letter." once. rowLabel and rowA11y are untouched (find.logic.ts is not in the diff; find.en.ts identical); nothing else about the label changed. The pin find-logic.test.ts:229-241 `[NS-02-R21]` asserts the label ends " Opens the letter." once, rowA11y holds the sentence once, and the stripped source keeps the accessibilityLabel and has no accessibilityHint, openHint or @/lib/copy. Red when the hint is put back (verified). The header comment (l4-5) says why.

### 2. Must fix 2: resolved
docs/qa/DEVICE_TEST_PLAN.md: table row S1-205 (l32, right after S1-204) and section `### S1-205` (l820-835) in the S1-204 shape: Needs, Steps (a) to (j), Expected per step, Record, Update. Every expectation opens "From the code"; the Needs line says the row is read from PR #798, not run, and a difference is filed, not argued. Runnable with two phones and H, N1, R: the nameless N1 book cites S1-202 (l) (a real step); R's landing cites S1-204 (f), which does read "No book here yet" then Start a book. Covers R2 (b: 20 runs x 20 queries, frames from a 60 fps recording, p95 of 400; F09-REQ-015 exists and states 300 ms p95, SE 3), R20 (c: Xcode gauge; `dbstat` over `letter_search%`, which takes the FTS5 shadow tables and the map since the table is a plain fts5 one, lifecycle.ts:169; file-size fallback), R21 (d: focus, order, "Letters found" once with no number, a row once, no match once, AX5, Reduce Motion, "Tap Find" and "Tap Cancel"), FTS5 presence (f: both names; the scan path if neither), the nameless placeholder (a), Back keeps the query, tab switch, Cancel and relaunch clear it (e), the failed view drawn and never announced on iOS, recorded, run only with a way to fail (g), light and dark (h), R's deleted book never searched (i), airplane mode (j). Each "From the code" line matches the source: findSurface needs a kept letter with words (book.tsx:360, flag.ts:24); autoFocus, Clear only with text, returnKeyType search, flex-wrap (find-mode.tsx:122-150); announcementFor is null for 'failed' and the footnote's live region is Android-only (find.logic.ts:40-44, find-mode.tsx:154); the inline bar is hidden from VoiceOver while the band shows (book.tsx:403-404); sm IconButton 32 pt + hitSlop 6 = 44 (button.tsx:194-212). eas.json: no profile sets EXPO_PUBLIC_BOOK_SEARCH; `preview` has server features on. Asha only ("The ducks were loud today.", "Asha fed the ducks."); ASCII; PRD s5, 13, 14 and spec 02 s13 (UNVERIFIED) exist for the Update line. One wording slip, Notes.

### 3. The 12 words (find.en.ts; `git diff e6846f23 e7d399b3 -- packages/content` is empty; all twelve still need the founder's approval)
- button "Find": the magnifier's name in band and bar. PASS.
- buttonHint "Looks for a word in this book's letters.": one sentence, glossary words. PASS.
- placeholder "Find in {child}'s book", "Find in your child's book" with no name: PASS.
- fieldLabel "Find a letter": the field's VoiceOver name. PASS.
- fieldHint "A few letters are enough to start looking.": PROPOSED, the founder's choice. Alternative that keeps every rule and avoids "letter" meaning the kept piece right after "Find a letter": "Type a word, or part of one, to start looking."
- notReady "Find is still getting ready on this phone.": PASS, with the no-FTS5 edge in Notes.
- error "Find could not look just now.": PASS.
- retry "Try again": PASS.
- rowA11y "{date}. {label}. Opens the letter.": PASS, now read once (Must fix 1).
- foundA11y "Letters found": announced once, no number. PASS.
- clear "Clear": PASS.
- cancel "Cancel": PASS.
Reused book.empty.searchTitle unchanged; noMatchHelp absent and pinned.

### 4. PRD one-liners still owed to product
Not in this commit, and still in the PRD at origin/develop: s6 "Empty book: The header action is present." (l87) vs spec 02 s6 absent, which the code follows (book.tsx:360); R1 "labelled for VoiceOver 'Find a letter'" (l40) vs the spec's and the code's "Find". Two PRD one-liners for product's PR, not this one.

### Must fix
None.

### Notes
- S1-205 (h) says the row's words are "the letter's own sentence, whole". snippet.ts:23-74 cuts a sentence over 180 UTF-16 units on whole words (cutStart/cutEnd), and the fade is "Not in this PR", so the row then shows a slice with no fade and no ellipsis. One-line plan fix: "the sentence that holds the match, or a slice of it cut on whole words when the sentence is longer than 180 characters; no ellipsis character". As written a tester files a false difference on a long letter.
- Table row "When" says before the switch turns on in any profile; PRD s13 turns it on in preview and testflight first. The Needs line resolves it (a build made for the row), but a reader of the table alone may stumble.
- The failed view is still not announced on iOS; the plan records what is heard. The cheap fix (announcementFor 'failed' -> findCopy.error) stays open. Also open from last round, none blocking: notReady can be untrue where FTS5 is absent and the scan fails; stale "idle line" comments in query.ts and search.ts; the magnifier trailing in the field vs spec 02 s5 leading (design lens).

### Not verified
Every device row in S1-205 (R2, R20, R21, FTS5 on a real build, the Back and tab flows, AX5 wrap, VoiceOver focus landing). `store-profile Release launch` was still running (not required). This PASS holds only while required CI stays green at this exact head and once the twelve words have the founder's approval.
Reviewer: independent of the author (CR-44).
