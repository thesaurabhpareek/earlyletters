# NS-02: Find (search across the family's own letters, on the phone)

Status: Locked v1.0, 20 Nov 2026 (council round 2). Changes after lock need a PR that lists every changed id.

Author: `product` (CPO role). Rank 2 of 7 in the founder's order (closed X1). Index: `README.md`. Design source: `docs/design/specs/02-FIND-11nov.md` (PR #794). Data source: ADR 0028 D4 and D5 (PR #797, not yet on `develop`; cited as "ADR 0028 (PR #797)" until it merges). This card makes F09-REQ-015 shippable: it cites that row and F09 section 6.2 step 16, and records the founder question F09 Q4 as decided: Find is in scope (closed X1; research gap G3). Rulings applied: round-2 rulings T2, T5, D1, D2 (as n/a), D3, D5, D13 (Karma, 20 Nov 2026, council round 2).

Terms. "Find" as a header action, "index", `letter_search` and `searchable_letters` are internal; `content` names what a parent reads (BRAND.md glossary, CR-25).

Tags: [F] fact read this session in a file or PR diff (named). [A] assumption about parents. [E] estimate. PROPOSED = a number or line `product` proposes. UNVERIFIED = not read or not run this session. Nothing here was run on a phone. Code facts come from reading the diff of draft PR #798 (head `7f36031a`, +2,511 lines in 37 files) on 20 Nov 2026; "built" means "present in that diff", not "passes".

## 1. Who and when

- A parent with a book of 40 or more letters who remembers a word ("the blue boat", a nickname, a place, a word in Hindi) and not the month. [A] The need starts around the second quarter of use.
- A parent who wants one letter to read aloud to {child} tonight, or to play again.
- A parent on a plane or with no signal.
- Not a way to count, filter by feeling, or audit what was written.

## 2. Why

- Job: "I go to the Book to read the one letter I remember, found by a word I said, so I can read it or play it again without scrolling through months." Find is a mode of reading, not a second verb (design spec 06).
- What goes wrong today: the Book offers months and Go to a month only; a parent with hundreds of letters scrolls. The empty-search key `book.empty.searchTitle` exists in `packages/content/src/strings.en.ts:567` but nothing on `develop` uses it [F].
- Evidence: search appears in 3 of the 12 products the research file read (`FEATURE-GAP-AND-WEDGE-10nov.md`, table stakes; store pages read by another agent, UNVERIFIED by product). No parent evidence yet; the study in section 21 is the first. Evidence tag: [A] for demand.

## 3. What, and not in scope

**What.**
- One action on the Book header (an icon; "Find" is its VoiceOver label and Large Content Viewer title). It shows in the cover band, or in the inline bar once the band has scrolled away, never both, and only when the active book has a kept letter with words.
- Tapping it lays a Find mode over the Book (the Book stays mounted underneath). One field, autofocused. From 3 characters (1 for Chinese, Japanese or Korean script) the active book's findable letters that hold every typed word (the last as a prefix) are listed newest first: each row is the letter's date line and the sentence that holds the match, exactly as kept, with the matched word underlined and in medium weight. A tap opens the letter page; Back returns to the same query and place.
- What is searched: each letter's words as kept (`final_text`), plus words the parent typed for the letter (the Firsts label, NS-06 Part A, when built; photo words and the typed place, NS-01-R21). Nothing else.
- Works with no network, no account and analytics off. Never remembers a query.

**Not in scope.** Searching `raw_transcript`, audio or anything heard; a place or date read from a picture; the child's name field; other books (OQ-1); results counts, scores, "best match", suggestions, recent searches, "did you mean", synonyms, transliteration, "related letters", topics or moods; any search of a server; a Find on Home or Me; any way to start a letter from Find.

## 4. Happy path

1. In the Book the parent taps the magnifier in the header.
2. Find opens over the Book with the field focused and the keyboard up; nothing else is drawn.
3. The parent types "boat". From the third character, rows appear: the date line and the sentence with "boat" marked, newest first. VoiceOver says "Letters found", with no number.
4. The parent taps a row; the letter page opens.
5. Back returns to Find with "boat" and the same scroll place.
6. Cancel returns to the Book exactly where it was. Switching to Home or Me clears the query.

## 5. Unhappy paths and edge cases

| Case | Behaviour | Row |
|---|---|---|
| Fewer than 3 characters (non-CJK), or only spaces | Nothing changes and nothing is drawn; a VoiceOver-only hint exists | R3, R23 |
| No letter matches | One calm line, nothing else, no "add a letter" | R13, R39 |
| Index missing, being built, failed its check, or FTS5 absent | The scan answers with the same letters in the same order; nothing tells the parent which path ran | R19 |
| The search itself fails (even the scan cannot read) | "Find could not look just now." with Try again; the Book untouched; announced once | R37 |
| An index write fails during a save | The letter saves anyway; the index is untrusted until rebuilt; queries use the scan | R44 |
| Letter deleted, hidden, sealed, made private by its other author, or its book deleted, left or hidden | Not found at once | R16b |
| Letter restored, unhidden, opened, or made visible again | Found again | R16c |
| Letter purged | Its id never returns | R16d |
| Words still being made, a quiet day, a draft held at the Keep gate | Not found | R17, R33 |
| A word a small fix changed | Only the kept words are searched; restoring the fix makes the original word findable | R5, R16a |
| Hindi typed in Latin letters | Found by a Latin query only | R34 |
| A query with FTS operator characters (quotes, `*`, `OR`, `NEAR`) | Treated as text, never an operator, never an error | R45 |
| A very common word | All matches listed; no cap message; the list scrolls | R10 |
| App lock | The Book is not reachable while locked, so neither is Find | existing App lock |
| Find switched off after an earlier build made an index | The index is dropped at the next launch; letters untouched | R43 |

## 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | No Find action until the active book has a kept letter with words (R1). The first open builds the index off the first frame if missing; the scan answers meanwhile (R19, R35). |
| Empty | No action on an empty book: not shown, not greyed (R1). |
| Many (1,000 letters, 300 pictures) | First row within 300 ms p95 of the last keystroke at 1,000 letters on SE 3 (R2); memory and index within R20 at 1,200 letters; pictures do not matter (only typed photo words are indexed). |
| Offline | Identical to online; 0 network calls (R22). |
| Slow | The scan path answers while the index builds; no spinner; the "still getting ready" footnote shows only with the failed view (R38). |
| Failed | Failed view with Try again (R37); index failures fall back silently (R19, R44). |
| Interrupted (call, Siri, alarm, the baby) | The query and results stay when the app returns in the same process; only a tab switch or a kill clears them (R32). |
| App killed mid-flow | The query is gone after relaunch (R14); an index killed mid-write is checked and rebuilt at the next catch-up (R19). |
| App updated mid-flow | No migration; an index from an older build is checked and caught up at the next idle catch-up; until then the scan answers (R19). |
| Low storage (under 1 GB; under 50 MB) | Search reads only. Index writes happen inside letter writes; if one fails the letter still saves (R44). |
| Low Power Mode, low battery | No change; no background work; the catch-up runs only after launch, off the first frame. |
| Two books | Searches the active book only (R4, R46); a second book needs a switch first (OQ-1). |
| Two parents | The other parent's letters in the book are found; their private letters never (R4); a letter synced in or out moves the index in the sync transaction (R16a). |
| Expecting parent (due date only) | Letters written before birth are found like any other (R50). |
| Multilingual (Devanagari, RTL, CJK) | Devanagari and Arabic found by whole word in the same script (R8); CJK by substring from 1 character (R3); right-to-left snippets render right to left (R28). |
| Largest text (AX5 plus Bold Text) on SE 3 | The field grows, Cancel wraps under it, rows one column, date line never truncates, targets 44 pt (R21, R42). |
| VoiceOver | Field label and hint; "Letters found" or the no-match line, once, no number; each row one element (R11, R23, R41). |
| Voice Control and Switch Control | "Tap Find" and "Tap Cancel" work; every row reachable by item scanning (R21). |
| Reduce Motion | The overlay appears with no cross-fade; typing never animates the list (R21). |
| Dark mode and Increase Contrast | Match marked by underline and weight, never colour alone (R40). |
| Plan lapsed | Find works on every kept letter (R47). |
| Signed out | The book stays on the phone (ruling D1), so Find still finds its letters for whoever holds the phone; the sign-out sheet says the letters stay (NS-10, D1). |
| Second account on the same phone | Finds none of the first account's letters (R24; `[X4-R1]`). |
| New phone | Words arrive by sync; each pulled letter enters the index in the sync transaction; the index itself never travels (R16a, R31). |

## 7. Acceptance criteria

Priority: P0 rows carry their RR-4 reason: (a) a promise, (b) a legal or store duty, (c) the core loop. Numbers from F09-REQ-015 where it states them (300 ms p95, 1,000 letters, SE 3); others PROPOSED. The trace script cannot yet find NS ids (finding F1), so no traceability is claimed until it can.

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-02-R1 | Given the Book with `EXPO_PUBLIC_BOOK_SEARCH=on`, the pause off, and a kept letter with words in the active book, Then the header has one Find action (an icon; "Find" is its VoiceOver label and Large Content Viewer title) in the cover band or the inline bar, never both; "Find a letter" is the field's VoiceOver label; on a book with no such letter the action is absent; Home and Me have 0 search controls. | P1 | `[NS-02-R1] Find lives on the Book header only` |
| NS-02-R2 | Given 1,000 fixture letters, When the parent types 3 or more characters, Then the first result row is painted within 300 ms at p95 of the last keystroke, over 20 runs of 20 queries, on an iPhone SE 3 (F09-REQ-015). | P1 | `[F09-REQ-015][NS-02-R2] 1,000 letters, 300 ms p95 on SE 3` (device) |
| NS-02-R3 | Given a query of fewer than 3 code points (spaces not counted) in a non-CJK script, Then nothing changes on screen and nothing is drawn: no hint line, no "type three letters". Given a query containing a Han, Hiragana, Katakana or Hangul character, Then 1 character is enough and the substring path runs (F09-U24). PROPOSED: the floor is revisited per language when a pack passes its gate. Changed 20 Nov: the note about #798's withdrawn `hint` slot is removed (resolved at `6ff39d75`). | P1 | `[NS-02-R3] short queries do nothing; CJK queries use substring`; `[NS-02-R3] find.en.ts has no hint key` |
| NS-02-R4 | Given a query, Then only the active book is searched; the parent's own letters (including their private ones) and other authors' letters that are in the book are included; another author's letter that is not in the book is never found, nor a letter of a deleted, left or hidden book (F09-REQ-015; the `searchable_letters` view). | P0 (a) | `[NS-02-R4] scope is the active book and visible letters only` |
| NS-02-R5 | Given the index, Then its `body` holds each findable letter's `final_text` and its `extra` holds only parent-typed words: the Firsts label (NS-06 Part A, when built), the photo words and the typed place (NS-01-R21). It holds no `raw_transcript`, no audio-derived text, no date or place read from a picture (`NX-39-R10`), no child name and no machine tag. | P0 (a) | `[NS-02-R5] the index holds only kept words and parent-typed words` (schema test) |
| NS-02-R6 | Given a query of 2 or more words, Then a letter matches when all words appear, in any order; the last word matches as a prefix; case is ignored. | P1 | `[NS-02-R6] all words match, last word as prefix, case ignored` |
| NS-02-R7 | Given the fixture `accent-pairs` (stored as escapes so the file stays ASCII: `caf\u00e9`, `se\u00f1or`, `a\u00e7\u00e3o`), Then the unaccented query (`cafe`, `senor`, `acao`) finds each word on both the index and the scan path. Changed 20 Nov: #798 folds Latin accents in the query (`foldText`) and creates the table with `unicode61 remove_diacritics 2` [F]; the device run confirms the tokenizer (UNVERIFIED until then). | P1 | `[NS-02-R7] accents do not hide a word` |
| NS-02-R8 | Given fixtures in Devanagari and Arabic script, Then a whole-word query in the same script finds the letter, and the Devanagari vowel signs are not folded away. | P1 | `[NS-02-R8] Devanagari and Arabic words are found` |
| NS-02-R9 | Given a result, Then it shows the letter's date line and a snippet that is a contiguous slice of the field that matched (`final_text`, or the parent-typed `extra`), holding the match, cut on whole words, at most 180 UTF-16 units, with no ellipsis character (the card's fade shows a cut). Test: the snippet is a substring of the matched field for 200 random fixtures. | P1 | `[NS-02-R9] the snippet is a slice of the parent's words` |
| NS-02-R10 | Given results, Then they are ordered newest first by the letter's date (`occurred_on`, then `captured_at`, then id); no ranking score, "best match" or relevance word exists in the query or on screen. | P1 | `[NS-02-R10] results are by date, newest first` |
| NS-02-R11 | Given results or no results, Then no count is displayed or spoken; VoiceOver announces "Letters found" or the no-match line, once, with no number. PROPOSED; `design-systems` may reverse it on accessibility grounds (OQ-3). | P1 | `[NS-02-R11] no count on screen or in the VoiceOver string` |
| NS-02-R12 | Given a tap on a result, Then the letter page opens and Back returns to the same query and scroll position. | P1 | `[NS-02-R12] Back keeps the query` |
| NS-02-R13 | Given no result, Then the screen shows the no-match line (`book.empty.searchTitle`) and nothing else: no tip, no help line, no "add a letter" button. Changed 20 Nov: the line's words follow R39 (no "yet"). | P1 | `[NS-02-R13] one calm line, no prompt to write` |
| NS-02-R14 | Given the query, Then it is never saved: no recent searches, no suggestions, no history; it is cleared on a tab switch away from the Book and by a kill; the field sets autocorrect, spell check, autocomplete and content type off. | P0 (a) | `[NS-02-R14] queries are not remembered` |
| NS-02-R15 | Given a canary query typed through Find, a result tap and a forced failure, Then 0 hits in logs, breadcrumbs, crash payloads, analytics and URLs (PRIV-R10 lists "search query"). | P0 (a)(b) | `[NS-02-R15] the query never leaves the screen` (log canary) |
| NS-02-R16a | Given Keep, a Review edit, Undo of a small fix, a photo word or place edit, delete, restore, hide, unhide, a book delete or restore, and a letter synced in, out or made private by the other parent, Then the index changes in the same transaction as the letter (`reindexLetter` in the repos, `reconcileSearch` in the sync engine and book changes). Split from R16 on 20 Nov. | P0 (a) | `[NS-02-R16a] the index moves with the letter in one transaction` |
| NS-02-R16b | Given a letter deleted, hidden, sealed and not yet open (design 04 FS-R10), made private by its other author, or in a deleted, left or hidden book, Then a query finds it 0 times from that moment, whatever the index file holds (every query joins `searchable_letters`). Split from R16 on 20 Nov. | P0 (a) | `[NS-02-R16b] a hidden letter is not found at once` |
| NS-02-R16c | Given a letter restored, unhidden, made visible again, or opened by Open now, Then it is found again; a seal opening at its instant is found at the next reconcile event (launch catch-up, opening Find, a pull, a book change; ADR 0028 D4), and a foreground catch-up is a proposal for the seal build. Split from R16 on 20 Nov. | P0 (a) | `[NS-02-R16c] a restored letter is found again` |
| NS-02-R16d | Given a purged letter, Then its id never returns in a result and its map row is gone. Split from R16 on 20 Nov. | P0 (a) | `[NS-02-R16d] a purged letter never returns` |
| NS-02-R17 | Given a kept letter whose words are still being made, a letter with empty words, or a quiet day, Then none is found (D-084). | P1 | `[NS-02-R17] letters without words are not found` |
| NS-02-R18 | Given Erase everything or Delete account on this phone, Then `letter_search` and `letter_search_rows` are dropped (never row-deleted) before the rows go, the `find.*` settings are removed, and the next launch recreates an empty index (ADR 0028 D5). Changed 20 Nov: the index lives inside `scribe.db`; there are no sidecar files. | P0 (a)(b) | `[NS-02-R18] erase drops the index` |
| NS-02-R19 | Given the index is missing, fails its integrity check, was left untrusted by a failed write, or FTS5 is absent, Then search answers from a scan of `searchable_letters` with the same letters in the same order; the index is rebuilt off the first frame and never blocks Keep. Results from both paths are identical on every fixture. Changed 20 Nov: there is no migration; "older than the migration" becomes these cases. | P1 | `[NS-02-R19] fallback and index agree` |
| NS-02-R20 | Given 1,200 letters, Then one search adds no more than 50 MB of peak memory over the Book's own baseline, and the index (`letter_search` with its shadow tables and `letter_search_rows`) is no larger than 10 MB (both PROPOSED; F09 A3 and the device run set the final numbers; a miss blocks the flag in `production`, not the build). | P1 | `[NS-02-R20] 1,200 letters stay inside the memory budget` (device) |
| NS-02-R21 | Given VoiceOver, AX5 with Bold Text, Reduce Motion, Voice Control and Switch Control, Then the field and rows are labelled, reachable in order, 44 pt or more, one column at AX5; "Tap Find" and "Tap Cancel" work; every row is reachable by item scanning; with Reduce Motion the overlay appears with no cross-fade. Changed 20 Nov: Switch Control and Bold Text added. | P1 | `[NS-02-R21] Find passes VoiceOver, AX5, Reduce Motion, Voice and Switch Control` (device) |
| NS-02-R22 | Given airplane mode, Then Find behaves exactly as online and makes 0 network calls; `lib/find` and `components/find` import no network, log or analytics module. | P0 (a) | `[NS-02-R22] Find makes 0 network calls` |
| NS-02-R23 | Given under 3 characters in a non-CJK script, When VoiceOver or Switch Control is on, Then the field carries an accessibility hint (`findCopy.fieldHint`, PROPOSED words) that a few letters start a search; it is drawn nowhere; it names no number and does not claim three characters (design spec 02 FD-R13). | P1 | `[NS-02-R23][FD-R13] the short-query hint is VoiceOver-only and never drawn` |
| NS-02-R24 | Given account A signed out with its book on this phone, When account B signs in and opens Find, Then B's results hold 0 of A's letters (ruling D1; `[X4-R1]`). Added 20 Nov (r3 R24, r2 S1). | P0 (a) | `[NS-02-R24][X4-R1] a second account finds none of the first account's letters` |
| NS-02-R25 | Given a canary query, Then it never appears in a route, a route parameter, a deep link or the navigation state; Find is component state over the Book, not a route. Added 20 Nov (r3 R25). | P0 (a) | `[NS-02-R25] the query is never in a URL or route` |
| NS-02-R26 | Given the source tree, Then no letter text, snippet, query or child name is registered with Core Spotlight, `NSUserActivity` search, Siri suggestions or an App Intents entity, and no embedding or vector index of letters exists (ruling D3; `[X6-R1]`). Added 20 Nov (r2 M3). | P0 (a) | `[NS-02-R26][X6-R1] nothing from Find is donated to the system` |
| NS-02-R27 | Given any query, Then Find offers no spelling suggestion, correction, synonym, transliteration, "did you mean", suggested search or related letter; it compares the query only with the parent's own words. Added 20 Nov (r2 M3). | P1 | `[NS-02-R27] Find suggests nothing` |
| NS-02-R28 | Given a match in Arabic inside an English sentence, or in English inside an Arabic one, Then the snippet's base direction follows its first strong character, the marked word is the matched one, and the composed VoiceOver label wraps the snippet in Unicode isolates (U+2068 and U+2069) so the date and the snippet keep their order. Added 20 Nov (r1 NS-02 item 5). | P1 | `[NS-02-R28] mixed-direction snippets keep order` |
| NS-02-R29 | Given 200 generated fixtures in Devanagari and Arabic, Then the index path and the scan path return identical letters in identical order for every whole-word and prefix query. Added 20 Nov (r3 P1). | P1 | `[NS-02-R29] index and scan agree on 200 Devanagari and Arabic fixtures` |
| NS-02-R30 | Given a removal from the index, Then a merge (FTS5 `optimize`) runs at the next idle catch-up, so removed words' bytes leave the file within 24 hours of the app being used (PROPOSED), with `secure_delete` on and the FTS5 `secure-delete` option on where the SQLite build accepts it (`find.secureDelete` records which). Added 20 Nov (r2 M2, S2). | P1 | `[NS-02-R30] removed words leave the file at the next merge` |
| NS-02-R31 | Given the owner backup, the recovery export, the data export and the sync payloads, Then none names `letter_search`, `letter_search_rows` or `searchable_letters` (the index is in the iPhone backup with `scribe.db`, the same exposure as the words). Added 20 Nov (r2 M1, M2). | P0 (a) | `[NS-02-R31] the index never leaves the phone by our hand` |
| NS-02-R32 | Given results on screen, When the app goes to the background (a call, Siri, an alarm) and returns in the same process, Then the query and results are as they were; a tab switch away from the Book or a kill clears them. Added 20 Nov (r1 NS-02 item 3). | P1 | `[NS-02-R32] an interruption keeps the query` |
| NS-02-R33 | Given a draft waiting at Review or held at the Keep gate, Then it is not found until it is kept. Added 20 Nov. | P1 | `[NS-02-R33] a draft is not found` |
| NS-02-R34 | Given a letter of Hindi words typed in Latin letters, Then a Latin query finds it and a Devanagari query does not (no transliteration; PRD V2 02 section 6 item 7). Added 20 Nov. | P1 | `[NS-02-R34] no transliteration` |
| NS-02-R35 | Given a missing or untrusted index with 1,000 letters, When it is rebuilt, Then it runs off the first frame, never while a take is recording, in batches of 200 letters per transaction (PROPOSED), with no JavaScript frame over 50 ms, and completes within 3 s on an SE 3 (PROPOSED). Not met in #798: the catch-up runs 3 s after the store opens and indexes every letter in one transaction [F]. Added 20 Nov (CTO pass). | P1 | `[NS-02-R35] the index rebuilds in small batches` (device) |
| NS-02-R36 | Given 1,000 letters indexed, When a letter is kept, Then the index write adds under 20 ms at p95 to the save commit, which stays inside 06-nfr's 200 ms (PROPOSED). Added 20 Nov (r1 NS-02 item 2). | P1 | `[NS-02-R36] indexing costs a save under 20 ms` (device) |
| NS-02-R37 | Given even the scan cannot read, Then the screen shows one line (PROPOSED "Find could not look just now.") and Try again, the Book underneath is untouched, and VoiceOver announces the line once. Not met in #798: the failed view makes no announcement [F]. Added 20 Nov. | P1 | `[NS-02-R37] a failed search says so once and offers Try again` |
| NS-02-R38 | Given the index is not ready, Then a "still getting ready" line shows only while that is true and only beside the failed view; when the scan answers, nothing tells the parent which path ran. Added 20 Nov (#798 [F]). | P2 | `[NS-02-R38] the getting-ready line is true while shown` |
| NS-02-R39 | Given every Find string and the no-match line, Then none holds "yet" or another word from the appendix A gap list; `content` rewords `book.empty.searchTitle` (today "No letters with that word yet.") and adds "yet" in empty or result strings to the appendix A list. Added 20 Nov (r1 NS-02 item 1). | P1 | `[NS-02-R39] the no-match line holds no gap word` (content test) |
| NS-02-R40 | Given a result row in light, dark and Increase Contrast, Then the matched word is marked by underline and medium weight, never by colour alone (WCAG 1.4.1). Added 20 Nov. | P1 | `[NS-02-R40] the match is marked without colour alone` |
| NS-02-R41 | Given VoiceOver on a result row, Then the row is one element read as date line, sentence, and "Opens the letter." once, with no count and no second hint. Added 20 Nov. | P1 | `[NS-02-R41] a row reads once` |
| NS-02-R42 | Given any text size, Then the date line never truncates and the snippet shows whole up to its 180-unit slice: about 2 lines at the default size, up to 5 at AX5 (PROPOSED). Added 20 Nov. | P2 | `[NS-02-R42] the date line never truncates` |
| NS-02-R43 | Given `EXPO_PUBLIC_BOOK_SEARCH` off on a phone where an earlier build made an index, When the app launches, Then the index is dropped and no Find action shows; letters are untouched. Added 20 Nov (#798 `ensureFindIndex` [F]). | P1 | `[NS-02-R43] Find off drops the index` |
| NS-02-R44 | Given an index write that fails inside a letter write, Then the letter write commits, nothing is lost or refused, the index is marked untrusted, queries use the scan, and the next catch-up rebuilds it. Added 20 Nov. | P0 (c) | `[NS-02-R44] the index never costs a letter` |
| NS-02-R45 | Given queries holding `"`, `*`, `OR`, `AND`, `NOT`, `NEAR`, `-`, `:` or `(`, Then each is matched as text or ignored as punctuation, never as an FTS5 operator, and no query raises an error (terms are quoted in `ftsMatchString`). Added 20 Nov. | P1 | `[NS-02-R45] query text is never an operator` |
| NS-02-R46 | Given two books, Then Find searches only the active book; the book switcher is not reachable while Find is open; after a switch, Find searches the new active book with an empty field. Added 20 Nov. | P1 | `[NS-02-R46] Find follows the active book` |
| NS-02-R47 | Given a lapsed plan or a used allowance, Then Find finds every kept letter exactly as before (J-N25); Find calls no plan or gate function. Added 20 Nov. | P0 (a) | `[NS-02-R47] Find works after a plan lapses` |
| NS-02-R48 | Given each device row of this card (S1-205), Then it runs on a separate install signed in to a test account that holds only the fictional Asha book; no run sheet, screenshot, recording, log or trace carries a real name, letter, picture or voice (ruling D13). Added 20 Nov. | P0 (a) | `[NS-02-R48] device evidence uses Asha only` |
| NS-02-R49 | Given any sequence of searches, opens and cancels, Then `entries`, `drafts`, `entry_media` and every setting except `find.dirtyAt` and `find.secureDelete` are byte-identical before and after: Find writes nothing to a letter. Added 20 Nov. | P0 (a) | `[NS-02-R49] Find writes nothing` |
| NS-02-R50 | Given letters written before the birth date (expecting parent), Then they are found like any other. Added 20 Nov (r1 NS-02 item 3). | P2 | `[NS-02-R50] letters before birth are found` |

## 8. Non-functional budgets

Inherited from `docs/prd/v2/06-nfr.md` unless stated; SE 3 under the section 0 protocol; PROPOSED unless from F09.
- **Latency.** First row within 300 ms p95 of the last keystroke at 1,000 letters (F09-REQ-015, R2). #798 searches on every keystroke, synchronously, with no debounce [F]; if R2 misses, a 150 ms debounce counted inside the 300 ms is the first fix (O-1). Index rebuild: 1,000 letters within 3 s in batches of 200, off the first frame (R35). Index write: under 20 ms per save (R36). Reconcile on a sync transaction that changed no letter: under 20 ms at 1,000 letters (PROPOSED; #798 runs it in every sync transaction [F]).
- **Memory.** One search adds at most 50 MB over the Book baseline at 1,200 letters (R20).
- **On-device storage.** Index at most 10 MB at 1,200 letters (R20; under 10 KB per letter on average). Inside `scribe.db`; no other file.
- **Battery.** Under the measurable step; no background work; the catch-up runs once after launch and when Find opens with no index.
- **Offline.** Works identically; 0 network calls (R22).
- **Accessibility.** AX5 plus Bold Text, VoiceOver order, 44 pt, Voice Control, Switch Control, Reduce Motion (R21, R23, R41); match not by colour alone (R40).
- **Localisation.** Devanagari, Arabic, CJK (R3, R8, R28, R29, R34); Latin accents folded (R7); no sentence assembled in code except the row label's fixed template.
- **Privacy (log canary).** A canary query through typing, a result tap and a forced failure: 0 hits in logs, breadcrumbs, crash payloads, analytics, URLs and navigation state (R15, R25).

## 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Second phone, same account | Each phone builds its own index from its own letters; nothing travels | R31 |
| Second account on this phone after sign-out | Finds none of A's letters | R24 |
| Offline | Identical; 0 network calls | R22 |
| Retry after a lost answer | Find makes no call; a retried pull re-runs the reconcile in its transaction, idempotent | R16a |
| Sign out | The book stays (ruling D1); Find still works on it for whoever holds the phone | D1, NS-10 |
| Account deletion | This phone's index is dropped with the data when this phone runs the erase | R18 |
| Kill switch `serverFeaturesEnabled()` off | No change: Find is local | R22 |
| Remote pause `killSwitches.bookSearch` | Hides the Find action; the index keeps following letters; can never turn Find on | `[NS-02-R1]` with pause on |
| Plan lapse | Works | R47 |
| Erase everything | Index dropped before rows go | R18 |

## 10. Data and engineering

**Fields.** No `entries` column changes; no server change; no sync field group; no export change.
- New, phone only, created by `ensureSearchIndex` (not a migration; ADR 0028 D1, D4): FTS5 table `letter_search(body, extra)`, own content, tokenizer `unicode61 remove_diacritics 2`; map `letter_search_rows(entry_id TEXT PRIMARY KEY, row_id INTEGER UNIQUE)`; view `searchable_letters` (the one definition of "findable": not deleted, kind letter or note, words not waiting and not empty, in the book or own, book not left, deleted or hidden; each extra source may add a visibility clause, and the seal build adds `seal_opens_at IS NULL OR seal_cleared_at IS NOT NULL OR seal_opens_at <= now` in UTC, ADR 0028 D4). Settings `find.dirtyAt` (an ISO time) and `find.secureDelete` ('1' or '0').
- Extra sources are registered (`registerFindExtraSource`): `photo` reads `entry_media.photo_text` and `place` when migration 11 exists; NS-06 Part A registers the Firsts label; NS-06 Part B registers the seal clause. A source whose tables are absent contributes nothing.
- Classes: `letter_search.body`, `.extra` L4 (the parent's words; derived, rule 2); `letter_search_rows.entry_id` L3 (DATA_CLASSIFICATION rule 5; ADR 0028 says L2 and must be corrected, finding X10; `privacy` confirms); `row_id` L2; `find.dirtyAt` L2; `find.secureDelete` L1; the query L4 in memory only.
- The CTO pass named the table `entry_search` with four columns and a function `isVisibleTo(entry, reader, now)`. The code's shape (two columns, one view, registered sources) does the same job and stands; the requirement taken from the CTO pass is one visibility definition shared with seals, which the view is.

**Modules and files (#798).** `lib/find/{flag,pause,fts-index,lifecycle,query,scan-index,search,snippet,sources}.ts`; `components/find/{find-mode,find-result-row}.tsx`, `find.logic.ts`; edits to `lib/store.ts` (`ensureFindIndex`, `findLetters`, `findIndexReady`, the catch-up 3 s after open, drop before Erase everything), `lib/db/repos/{entries,children,wipe}.ts` (`reindexLetter`, `reconcileSearch`), `lib/sync/engine.ts` (reconcile in every sync transaction), `components/book/cover-band.tsx`, `app/(tabs)/book.tsx`; `packages/content/src/features/find.en.ts`; `packages/api/src/{kill-switches,remote-config,envelope,standards}.ts` and `scripts/packs/remote-config.json` (the pause key); device row S1-205 in `docs/qa/DEVICE_TEST_PLAN.md` (exists only in #798, finding F17).

**Flags and remote pause.** Build flag `EXPO_PUBLIC_BOOK_SEARCH`, on only for the value `on` (`lib/find/flag.ts`). No profile in `apps/mobile/eas.json` sets it today [F]. Remote pause `killSwitches.bookSearch`, added by #798 to `KILL_SWITCH_KEYS`, the remote-config schema (default false) and `ERROR_DETAILS`. The CTO pass named it `findPaused`; that is the function name, not the key.

**Errors and states.** Search: `idle`, `done` (path `index` or `scan`), view `failed` when even the scan throws. Index: FTS5 unavailable (probe with a temporary table) gives the scan for good on that phone; an integrity-check failure drops and rebuilds; a failed write marks the connection `degraded` until the next catch-up; `find_index_rowid` thrown only on a missing rowid. None of these is shown to the parent except `failed`; none is logged with text.

**Rollout.** Order, not dates (ruling T5): #798 (draft, +2,511 lines in 37 files) is split into at most 6 PRs inside the review limit (finding F7) in this order: content and pause key; query, snippet and sources (pure); lifecycle and repos hooks; store and sync wiring; the Find mode and header; device row S1-205. NS-36's ADR (#797) merges first. The flag goes on in `preview` and `testflight` through an `eas.json` PR, then in `production` when R2, R19 and R20 pass on an SE 3 in S1-205 and no P0 row of this card is open (gate G6). If R2 or R20 misses, the scan path ships and the index waits, or the flag stays off; Find does not ride with any other change.

**Rollback.** Flag off: the action disappears and the next launch drops the index (R43). Pause on: the action hides; the index keeps following letters. Nothing to migrate back.

## 11. Data inventory

| Field | Class | Where | Synced | Retention clock | Deletion path | Export | Log exclusion |
|---|---|---|---|---|---|---|---|
| `letter_search.body`, `.extra` | L4 (derived) | `scribe.db`; in the iPhone backup with the database | No; not in the owner backup or recovery export | as the findable letter | terms removed in the same transaction; bytes gone at the next `optimize` (within 24 h of use, PROPOSED); table dropped at Erase everything | No | never logged |
| `letter_search_rows.entry_id` | L3 (rule 5) | `scribe.db` | No | as above | as above | No | never logged |
| `letter_search_rows.row_id` | L2 | `scribe.db` | No | as above | as above | No | allowed |
| `find.dirtyAt` setting | L2 | `scribe.db` settings | No | until the next merge | removed by merge and by Erase everything | No | allowed |
| `find.secureDelete` setting | L1 | `scribe.db` settings | No | life of the index | dropped with the index | No | allowed |
| The query | L4 (PRIV-R10 "search query") | component memory only | No | until a tab switch or kill | n/a | No | R15 canary |

Rows land in the same PR in `docs/legal/data-policy.md` section 4 and `DATA_CLASSIFICATION.md` (finding X2). `privacy` confirms classes.

## 12. Door lines

Find is not an agreement and not a setting.
- **Shown:** nothing new about data; the field and results.
- **Records:** nothing. The query lives in memory only. No PRIV-R21 row, because searching is not an agreement.
- **Never:** storing, sending or logging the query; indexing audio, `raw_transcript` or anything read from a picture; a donation to Spotlight, Siri or App Intents (ruling D3).
- **Decline:** not using Find changes nothing.

## 13. Threats

| Asset | Threat | Control | Test |
|---|---|---|---|
| The index (L4 words) | Removed words recovered from free pages or a backup | `secure_delete`; FTS5 `secure-delete` option where accepted; `optimize` at idle | R30; ADR 0028 D4 lifecycle tests |
| The index | Copied off the phone by our own backup or export | Allowlists; test that no index name appears in export, backup or sync code | R31 |
| Another author's private letter | Found by a co-parent's search | One view; private-to-others excluded; every query joins the view | R4, R16b |
| A second account's letters | Found after a sign-out and new sign-in | Account mismatch rule (ruling D1) | R24 |
| The query | Leaks through a log, URL or crash report | Component state only; no route; no imports of log or analytics | R15, R25 |
| The FTS engine | Operator injection or a crash from a crafted query | Terms quoted; last term prefix only | R45 |
| System intelligence | Letter text donated | None registered; source scan | R26 |

## 14. Never lines (rulings D2, D3)

- Never: no letter text, snippet, query, child name, picture or prompt is donated to Core Spotlight, `NSUserActivity` search, Siri suggestions or an App Intents entity (ruling D3, R26).
- Writing tools (ruling D2): n/a for the Find field, because its text never becomes a letter's words; it has autocorrect and spell check off anyway (R14). The parent-typed words Find indexes are protected by D2 where they are typed (NS-01-R50, NS-06 Part A).

## 15. Design inputs

- **States to draw.** Book header with and without the action (cover band and inline bar); Find idle (nothing drawn under the field); results; no match (one line); failed with Try again and, while true, the getting-ready line; a row with an Arabic match in an English sentence (R28); the same at AX5 with Bold Text on an SE 3; light, dark and Increase Contrast for the match mark (R40).
- **Components reused.** `TextField`, `IconButton`, `Button`, `Card`, the Book's date line; `CoverBand` gains the action. No new component.
- **Layout at AX5 on SE 3.** Field full width, Cancel wraps under it; rows one column, date over the sentence; nothing truncates (R42).
- **Motion.** The overlay cross-fades in over `swapMs`; Reduce Motion removes it; typing never animates the list.
- **Dark mode.** Match marked by underline and weight (R40). **Smart Invert:** no pictures in Find; n/a.

## 16. Content inputs

- Lines as intent (`content` writes, the founder approves): the action name "Find" and its hint; the field label "Find a letter"; the placeholder naming the book; the VoiceOver-only hint (PROPOSED "A few letters are enough to start looking."); "Letters found"; the row template "{date}. {sentence}. Opens the letter."; the no-match line without "yet" (R39); the failed line and Try again; the getting-ready line.
- Banned: any count, "results", "best match", "related", "suggested", "did you mean", "search your recordings", "anything you said", "smart", "AI", "yet", "still", "missing".
- Approves: `content` drafts, founder approves. `fieldHint` is marked PROPOSED in `find.en.ts` [F].

## 17. Legal, privacy and compliance inputs

- No counsel question (CPrivO review, r2 NS-02). Counsel packet 1.5.0 needs nothing new for Find.
- PRIV-R10 lists the search query as data never logged (R15). The index is L4 derived data on the phone, in the iPhone backup with the database (the same exposure as the words; said plainly in this card, not a new parent-facing claim).
- App Review 2.5.19: the flag is off in `production` until its gates pass; a build with it off draws nothing and drops any index (R43).
- Every device row follows ruling D13 (R48).

## 18. Label effect

**Label effect.** None. The index is on the phone only, never synced, exported or sent; the query is never stored.

## 19. Claims

- Enables (once the flag is on in `production` and the claims inventory has the row): "Find a letter by a word in it, even offline."
- Forbids: "search your recordings", "find anything you said", "smart search", "AI search", any count of results. The index holds the kept words only, so a word a small fix removed, and words of letters still waiting, are not found.

## 20. Free or Plus

Free and ungated (ruling T2, 20 Nov, council round 2): Find ships free in the 1.0.x line and falls under principle 6, so it never moves behind Plus. Plus holds one paid act, keeping beyond the allowance (D-082); Find raises the value of every kept letter. Public copy says nothing either way. Find works after the allowance is used and after a plan lapses (R47). Server cost $0.

## 21. Measures with analytics off

Analytics is off for the 1.0 line (D-124 item 3). If a parent later opts in, the only event is `book_search_used` with `results_bucket` of `0`, `1_5` or `6_plus` (F18 allowlist row in F09 section 9): no query text, no length, no letter id.
- **Source:** testers' answers to fixed questions, numbers only, in the founder's private sheet, deleted 90 days after the round (ruling D5).
- **Fixed questions (versioned in `docs/research/`):** "Did you use Find this week? (yes or no)" and "Did it find the letter you were looking for? (yes or no)".
- **Reporting rule:** "x of n", never a percentage when n is under 20.
- **Study:** five parents with 40 or more letters each look for a named letter; pass line PROPOSED: 4 of 5 find it in under 20 seconds and 0 of 5 read the no-match line as a reproach. If no tester has 40 letters, a fixture book is used and the result is marked a stand-in (RR-8).

## 22. Dependencies and gates

Order and gates only (ruling T5).
- Cards: NS-36 (data follows the letter; NS-36's Find row), NS-01 (photo words and place as an extra source), NS-06 Part A (Firsts label source) and Part B (seal clause, and finding F13 for the instant), NS-22 (calm header, after Find lands), NS-10 (sign-out and new phone lines).
- ADR 0028 (PR #797) merged on `develop` (findings X11, F5).
- `expo-sqlite` 57 compiles FTS5 by default per #798's notes (UNVERIFIED on a phone); if S1-205 (f) shows it absent, the scan path ships alone (R19).
- Device run S1-205 on an SE 3 (R2, R20, R21, R35, R36), following ruling D13; also an iPhone on iOS 17 and an iPad (r3 device matrix).
- Gates: G0 (the trace script sees NS ids, finding F1), G4 (P0 device rows), G5 (claims row), G6 (no `production` flag with an open P0 row).

## 23. Open questions

| Id | Question | Owner | Default if unanswered |
|---|---|---|---|
| OQ-1 | Search across all books for a family with two children? | Founder | No. Active book only (R4, R46). |
| OQ-2 | Search `raw_transcript` too? | closed 20 Nov | No (R5). A restored small fix is searchable (R16a). |
| OQ-3 | A result count for accessibility? | `design-systems` | None (R11). |
| OQ-4 | Does the 3-character floor stay for Hindi and Arabic? | Native reviewers, `speech` | Yes, until a pack passes its gate and a reviewer says otherwise. |
| O-1 | A debounce on typing if R2 misses on the SE 3? | `mobile` | 150 ms, counted inside the 300 ms. |
| O-2 | Index the typed "From" name of NS-16? | Founder (raised in r1 NS-16) | Not indexed. |
