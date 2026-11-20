Requirements: PRD `docs/product/prd/02-find.md` v1.1 (merged in #795), design `docs/design/specs/02-FIND-11nov.md` (merged in #794), data design ADR 0028 D4/D5 (PR #797). Base: develop `09a104da`.

## Rebuilt and aligned (19 Nov 2026)

Rebuilt onto develop `09a104da` as a merge commit with both parents (the branch's own delta, no content change; the push was a fast-forward), then aligned to PRD 02-find.md v1.1 section 5a and design spec 02 section 9:

- NS-02-R13 / FD-R10: the no-match view shows `book.empty.searchTitle` and nothing else. The second line "Try another word." (`noMatchHelp`) left the screen and the content file; spec 02 withdrew the slot.
- NS-02-R23 / FD-R13: the field carries `book.find.fieldHint` as its `accessibilityHint` only (VoiceOver and Switch Control), drawn nowhere. Words PROPOSED, marked `TODO(founder)` in `find.en.ts`: "A few letters are enough to start looking."
- NS-02-R12: the one-shot "a result is opening its letter" mark moved into `find.logic.ts` (`markOpeningLetter`, `clearOnBlur`) so Back-keeps-the-query is a runtime test; a scan proves Find is drawn over the mounted Book and is no route of its own.
- NS-02-R22: a runtime canary (fetch and XMLHttpRequest stubbed) over the index path, the scan path and the index build: 0 calls.
- Nameless child (#701, spec 06 N5): the placeholder reads "Find in your child's book" for a blank name through the app's `fill()` (test).
- Content tests `[NS-02-R3] find.en.ts has no hint key`, `[NS-02-R13] ... no noMatchHelp key`, `[NS-02-R23] fieldHint ...`. The content test mislabelled `[NS-02-R12]` (it checks CR-25, the two vocabularies) is now `[NS-02][CR-25]`.
- `supabase/functions/_shared/http/http.ts` is out of this PR (founder-only class). Find is phone-only: the `bookSearch` pause is read from the signed remote config, which `publish.ts` validates against `KILL_SWITCH_KEYS`; no Edge Function checks `serverKilled` for it, and `parseKillSwitchList` already accepts the exact name. If a case-folded `KILL_SWITCHES=booksearch` secret is wanted later, that is a one-line founder PR.
- ASCII: the 45 non-ASCII lines the branch carried (fixture words, regex character classes, one banner) are `\u` escapes now, as PRD R7 asks.

### Row status (PRD 02-find.md section 5)

| Row | Status at this head | Proof |
|---|---|---|
| R1 header only | Built | `[NS-02-R1]` x5, find-logic.test.ts |
| R2 300 ms p95 SE 3 | Open, device | none (founder device check) |
| R3 short queries, CJK | Built | `[NS-02-R3]` x6 (mobile) and `[NS-02-R3] find.en.ts has no hint key` (content) |
| R4 scope | Built | `[NS-02-R4]` x3, find-index.test.ts |
| R5 index contents | Built | `[NS-02-R5]` x6 |
| R6 words rule | Built | `[NS-02-R6]` x4 |
| R7 accents | Built on fixtures (tokenizer UNVERIFIED on a phone) | `[NS-02-R7]` x3 |
| R8 Devanagari, Arabic | Built on fixtures | `[NS-02-R8]` x3 |
| R9 snippet is a slice | Built | `[NS-02-R9]` x7 |
| R10 newest first, no score | Built | `[NS-02-R10]` x1 |
| R11 no count | Built | `[NS-02-R11]` x3 (mobile and content) |
| R12 Back keeps the query | Built; unit and scan (device flow: founder) | `[NS-02-R12]` x2, new |
| R13 one calm line | Built (changed at this head) | `[NS-02-R13]` x3 mobile, x2 content |
| R14 not remembered | Built | `[NS-02-R14]` x4 |
| R15 never leaves the screen | Built | `[NS-02-R15]` x3 |
| R16 index moves with the letter | Built | `[NS-02-R16]` x19 |
| R17 no words, not found | Built | `[NS-02-R17]` x1 |
| R18 erase removes the index | Built | `[NS-02-R18]` x4 |
| R19 fallback and index agree | Built | `[NS-02-R19]` x6 |
| R20 memory budget | Open, device | none |
| R21 VoiceOver, AX5, Reduce Motion | Open, device | none |
| R22 0 network calls | Built; scan and runtime canary | `[NS-02-R22]` x3 (one new) |
| R23 VoiceOver-only hint | Built (new at this head); words PROPOSED | `[NS-02-R23][FD-R13]` x2 mobile, x1 content |

### Words the founder approves (`packages/content/src/features/find.en.ts`, all new against develop)

| Key | Text | Where |
|---|---|---|
| `find.button` | Find | Book header action (visible and VoiceOver) |
| `find.buttonHint` | Looks for a word in this book's letters. | VoiceOver hint on the action |
| `find.placeholder` | Find in {child}'s book ("Find in your child's book" with no name) | The field |
| `find.fieldLabel` | Find a letter | VoiceOver label of the field |
| `find.fieldHint` | A few letters are enough to start looking. | VoiceOver and Switch Control only; drawn nowhere (PROPOSED, new at this head) |
| `find.notReady` | Find is still getting ready on this phone. | Footnote while the index is made and the scan also failed |
| `find.error` | Find could not look just now. | Error line |
| `find.retry` | Try again | Button under the error line |
| `find.rowA11y` | {date}. {label}. Opens the letter. | VoiceOver label of a result row |
| `find.foundA11y` | Letters found | Announced once when results appear |
| `find.clear` | Clear | VoiceOver name of the clear button |
| `find.cancel` | Cancel | The Cancel button |

Removed against the earlier head: `find.noMatchHelp` "Try another word." (R13). Reused, not changed: `book.empty.searchTitle` "No letters with that word yet."

Tests at head e6846f23 (19 Nov, sandbox): mobile 274 files, 266 pass, 5051 tests pass; the 8 failing files (73 tests: app-lock-wiring, capabilities, config, hosting-ios17, licences, preflight-production, privacy-manifest, store-sign-in-capabilities) are the sandbox baseline, not this PR. Find files 82 tests pass. content 405 pass (rules.test.ts included). api 289 pass. `tsc --noEmit` at the 5 known sandbox errors. 0 non-ASCII characters added against develop. `git merge-tree --write-tree origin/develop HEAD` clean.

## Earlier body (first draft, 10 to 11 Nov)

Draft. Rank 2, Find (NS-02), behind `EXPO_PUBLIC_BOOK_SEARCH` (default off). Requirements: PRD `02-find.md` (PR #795, head 41ed5166), design `02-FIND-11nov.md` (PR #794, head 56a0df68), data design ADR 0028 D4/D5 (PR #797). Independent of #796 (photo): the photo words and typed place plug in through `FindExtraSource` (`lib/find/sources.ts`) and are tested with a fixture table.

## What it does
- Find is a mode of the Book (magnifier in the cover band and the inline bar), drawn over the list, which stays mounted (Back keeps query and place). Absent, not greyed, when the switch is off, the remote pause is on, or the book has no letter with words.
- Index: FTS5 `letter_search` (body, extra; `unicode61 remove_diacritics 2`) plus map `letter_search_rows` inside `scribe.db`. `searchable_letters` is the one definition of what may be found. One function, `reindexLetter`, runs in the transaction of every letter write (repos, plus the sync engine's `tx`); book hide/unhide/delete/restore/remove call `reconcileSearch`. Launch catch-up and the FTS5 merge run 3 s after open, off the first frame. Erase everything drops the table before `removeEverything` (which also drops it, defensively). No export, backup or sync file names it (test).
- Scan fallback (`scan-index.ts`) gives the same letters in the same order when the index is missing, damaged, or FTS5 is absent; CJK queries use the substring rule.
- Remote pause: new kill switch `bookSearch` in `packages/api` (hides, never enables), mirrored in `scripts/packs/remote-config.json` and the Edge Function name list.
- Words: `packages/content/src/features/find.en.ts`, reuses `book.empty.searchTitle`.

## Decisions to read
1. **No migration.** The task said use number 12. `test/migrations.test.ts` asserts versions are contiguous, so a 12 without #796's 11 fails on develop. FTS creation must also never be able to stop the app opening, and Erase everything drops the table, so ADR 0028 D5 step 6 already has `ensureSearchIndex()` recreate it (not a migration). The index is therefore created by `ensureSearchIndex` (`CREATE ... IF NOT EXISTS`). If you want a version stamp anyway, take 12 after #796 lands.
2. **FTS5 on SDK 57.** `expo-sqlite` 57.0.3 `ExpoSQLite.podspec` compiles `SQLITE_ENABLE_FTS5=1` unless Podfile properties set `expo.sqlite.enableFTS` to `false`; this app never sets it (test pins both). So no config-plugin change and no native build is needed by this change as far as the repo shows. Not run on a phone.
3. Own private letters are findable (PRD R4); another person's private letter is not (view predicate on `sync.ownerId`).

## Changed since first draft
- The legal row for `docs/legal/data-policy.md` moved to #799 (founder-only merge, D-125); this PR no longer touches legal text. The README note stays.
- Below the minimum query length nothing is shown (NS-02-R3): the `hint` slot is removed and a test pins it.
- The index-not-ready line shows only when the scan fallback also fails.

## Not in this PR
Firsts label source (NS-06 not on develop; same plug-in point), sealed-letter rule (same: `visibleSql`), the fade on a cut excerpt (`ExcerptFade` takes plain text; marks need design-systems). No preflight line: the photo flag is not in the preflight on develop, so there is nothing to mirror.

Device checks (founder): NS-02-R2 (300 ms p95, 1,000 letters, iPhone SE 3), NS-02-R20 (memory 50 MB, index 10 MB), NS-02-R21 (VoiceOver, AX5, Reduce Motion, Voice Control), FTS5 present on a real build, the Back-keeps-query flow and the clear-on-tab-switch, the match mark look in both themes.

## Tests
mobile 248 files, 4694 tests pass; `tsc --noEmit` clean; content 395, core 1237, api 289, scripts/packs 79 pass.

https://claude.ai/code/session_01WsZfAr14RMFfiXXQyKD8VR


---
_Generated by [Claude Code](https://claude.ai/code)_
