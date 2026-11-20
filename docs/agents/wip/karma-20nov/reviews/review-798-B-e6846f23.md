## Review B at e6846f2381b5d0b187983bb1b41c3550ecd8a090: CHANGES

Head verified via gh api (e6846f23, base develop 09a104da). Read: CLAUDE.md, VOICE.md, BRAND.md glossary and CR-25 table, PR body (Rebuilt and aligned, row table, 12-string table), PRD 02-find.md s4-9 and 11-14 (develop), spec 02-FIND-11nov.md whole, spec 06 Find lines, docs/qa/DEVICE_TEST_PLAN.md, the 36-file diff, find-mode.tsx, find-result-row.tsx, find.logic.ts, cover-band.tsx, book.tsx, lib/find/* (8 files), store.ts, repos, text-field.tsx, button.tsx, card.tsx, copy.ts fill(), find-logic.test.ts, find-fixture.ts. No review or issue comments exist on the PR (GitHub API returned none); the board row and check-in are the only in-repo notes.
Ran in a worktree (624 node_modules): packages/content `npx vitest run` 19 files, 405 pass (rules.test.ts and find-copy.test.ts in); apps/mobile find-logic 38, find-index 24, find-lifecycle 20 = 82 pass; `tsc --noEmit` exactly 5 errors (help-fallback.tsx 1, app-lock/controller.ts 4); 0 non-ASCII bytes in added lines; `git merge-tree --write-tree origin/develop e6846f23` clean (9f31e2a8). CI at the head: `required` success, 14 checks success, simulator build skipped, `store-profile Release launch` still in_progress at read time.

### 1. The 12 strings (find.en.ts; slots as spec 02 s9)
- button "Find" (l12): magnifier in the cover band (cover-band.tsx:92) and inline bar (book.tsx:411); VoiceOver name and AX HUD text. True, one word per spec 02 s9, ASCII. PASS. Founder note: PRD R1 text says the action is labelled "Find a letter" while spec 02 s2/s8/s9 say "Find"; the PR follows the spec; one of the two docs owes a one-line fix.
- buttonHint "Looks for a word in this book's letters." (l14): hint on both magnifiers. One sentence, glossary words, no machine-writes. PASS.
- placeholder "Find in {child}'s book" (l16): find-mode.tsx:130 through fill(); blank name gives "Find in your child's book" (copy.ts:42-49, spec 06 l135). PASS.
- fieldLabel "Find a letter" (l18): TextField accessibilityLabel, labelHidden (find-mode.tsx:126-127; text-field.tsx:74). Names the act. PASS.
- fieldHint "A few letters are enough to start looking." (l22, TODO(founder)): accessibilityHint only (find-mode.tsx:131; text-field.tsx:75 passes it to TextInput; helper undrawn). ASCII, one sentence, no number, does not claim three. NEEDS FOUNDER: in this product "letter" is the kept piece (BRAND glossary) and the field has just said "Find a letter", so a VoiceOver user can hear "a few kept letters are enough". Alternative that keeps every rule: "Type a word, or part of one, to start looking."
- notReady "Find is still getting ready on this phone." (l24): footnote only when the index is not ready and the scan also failed (find-mode.tsx:153). True while the index is being made; on a phone with no FTS5 it is never ready, so with a failed scan the line would be untrue (edge of an edge; see Notes). PASS with note.
- error "Find could not look just now." (l25): callout above Try again (find-mode.tsx:161). Names what did not finish (VOICE lean-on rule). PASS.
- retry "Try again" (l26): find-mode.tsx:162. PASS.
- rowA11y "{date}. {label}. Opens the letter." (l28): row label via rowLabel (find-result-row.tsx:23; find.logic.ts:47-50). Matches spec 02 s8/s9, no count. CHANGE: the same row also sets accessibilityHint copy.reader.openHint = "Opens the letter." (find-result-row.tsx:24; strings.en.ts:1230), so VoiceOver reads it twice per row (Must fix 1).
- foundA11y "Letters found" (l30): announce() once when results appear (find-mode.tsx:98-101; find.logic.ts:41). No number. PASS.
- clear "Clear" (l31): IconButton accessibilityLabel (find-mode.tsx:142). PASS. cancel "Cancel" (l32): Button (find-mode.tsx:150). PASS.
- Removed noMatchHelp: absent, test pins it (find-copy.test.ts:29-32). Reused book.empty.searchTitle (strings.en.ts:567): drawn at find-mode.tsx:167, announced for 'none'; it had no consumer on develop, so "reused, not changed" is exact. All 12 are ASCII, no "we", no count, no fear or loss, no index/lens/query/search in parent text (find-copy.test.ts:69-71). Counsel: none needed (phone-only read of final_text; spec 02 s9 door lines: Records nothing).

### 2. Rows read from the code (device UNVERIFIED)
R11: no count on screen or spoken: find.logic.ts:39-50, find-copy.test.ts:13-22; FlatList adds no iOS count. Holds. R13: 'none' renders one Text and nothing else (find-mode.tsx:164-168). Holds. R23: hint is a prop only, drawn nowhere (text-field.tsx:75, helper not passed). Holds. R12: markOpeningLetter before router.push('/letter/[id]') (find-mode.tsx:103-108, book.tsx:345); (tabs) and letter/[id] are sibling root-Stack screens (_layout.tsx:222,229) so the Book blurs on push and clearOnBlur spends the mark once (find.logic.ts:25-37, test l263-281); Find stays mounted over the Book, no route of its own. Holds; residual: a push that does not navigate leaves the mark set and the next tab switch keeps the query once. R14: React state only, no persistence; blur clears (find-mode.tsx:57-65); autocorrect and spellCheck off (l133-134); lifecycle.ts writes only find.dirtyAt and find.secureDelete (l82,213). Holds. R15: no console, analytics, URL or router param carries the query (test l318-347; search.ts imports none). Holds. R21: tree order field, Clear, Cancel, footnote, rows; Cancel wraps under the field (flex-wrap, l122); Card role button, one label (card.tsx:73-75); FadeIn.reduceMotion(System) (l118); AX5 and VoiceOver on a device open. Gap: the 'failed' view is never announced (announcementFor returns null; accessibilityLiveRegion is Android-only in RN), so a VoiceOver user does not hear the error line. R3: prepareQuery returns none under 3 code points and for spaces-only (query.ts:54-64); idle renders null and says nothing (find-mode.tsx:159; find.logic.ts:42). Holds.

### 3. App Review and dead ends
Every state has a way back: Cancel (l150) and Back; Clear (l142); Try again (l162) re-runs; the footnote is text. No Plus, plan or gate reference in components/find or lib/find (grep: only a comment about a pack gate); no capture starter (test l250, spec 06 N8b). D-082 stays the one gate. Flag off: findSurface false (flag.ts:7,24), find=null, both magnifiers absent, FindMode never mounts (book.tsx:359-361,492); no empty-state file changed, so the Book is develop's. Remote pause hides only (flag.ts:20-26).

### 4. Constitution
searchable_letters selects e.final_text AS body and never names raw_transcript (sources.ts:86-99; test find-logic l440-443; find-index l38); the index is filled from the view; OQ-2 default (no raw) holds. Excerpt is a contiguous slice with mark offsets (snippet.ts:81-86); the row prints the slice with underline and weight, no added words (find-result-row.tsx:31-39). rowLabel strips only a trailing full stop for VoiceOver (find.logic.ts:48). No summary, rank or highlight text.

### 5. Device plan
docs/qa/DEVICE_TEST_PLAN.md has no Find row on develop and the PR does not touch docs/qa. Owed, one row S1-205 (highest is S1-204): R2 p95 300 ms with 1,000 Asha letters on the SE 3; R20 peak memory and index size; R21 VoiceOver (order, "Letters found", no count, the row read once), AX5, Reduce Motion, Voice Control "Tap Find"; FTS5 present on a real build (index path taken); nameless placeholder "Find in your child's book"; Back keeps the query, tab switch clears it; the mark in both themes. Fictional family Asha only.

### Must fix
1. find-result-row.tsx:24: remove accessibilityHint={copy.reader.openHint} (or drop "Opens the letter." from rowA11y and amend spec 02 s9). Failing scenario: VoiceOver on a result row reads "... Opens the letter. Button. Opens the letter."; spec 02 s8 reads it once.
2. docs/qa/DEVICE_TEST_PLAN.md: add row S1-205 as in section 5, or Karma names the follow-up PR that carries it before EXPO_PUBLIC_BOOK_SEARCH turns on anywhere (PRD s13, s14).

### Notes
- fieldHint wording is the founder's call (section 1); the code side of R23 is done.
- PRD 02 s6 "Empty book: the header action is present" contradicts spec 02 s6/J8 "absent, not greyed"; the PR follows the spec (book.tsx:359). PRD R1 "Find a letter" vs spec "Find": same. Two one-line PRD edits owed to product.
- Announce the error line too (announcementFor 'failed' -> findCopy.error) so VoiceOver hears it; cheap, pairs with Must fix 1.
- notReady can be untrue where FTS5 is absent and the scan fails; consider showing it only while ensureFindIndex is running.
- Stale comments say "the screen shows its idle line" (query.ts:21, search.ts:29); nothing is drawn under R3.
- Spec 02 s5 puts the magnifier leading in the field; the PR draws it trailing (find-mode.tsx:144). Design lens.
- "Ravi" (find-index.test.ts:161) is the fictional second child used in five existing tests; "She" is fixture letter text.

### Not verified
Any device behaviour: R2, R20, R21 (VoiceOver autoFocus landing, AX5 wrap, Reduce Motion), FTS5 presence in a real build, the Back flow on a phone. The `store-profile Release launch` check was still running at read time.
A PASS holds only once required CI is green at this exact head and the twelve words have the founder's approval.
Reviewer: independent of the author (CR-44).
