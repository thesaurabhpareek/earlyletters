# NS-02: Find (search across the family's own letters, on the phone)

Status: Draft v1.1, 11 Nov 2026 (UTC), aligned to design spec `docs/design/specs/02-FIND-11nov.md` (PR #794, head `3d3d7aac`). Docs only. Author: `product`. Rank 2 of 7 (closed X1). Index: `README.md`.
Terms: "lens", "Find" as a header action and "index" are internal terms; `content` names the parent-facing words (BRAND.md glossary, CR-25).
Build target: Build 13, behind `EXPO_PUBLIC_BOOK_SEARCH` (name proposed; check `capabilities.ts` for the house style).
This PRD makes F09-REQ-015 shippable: it cites that row and the Search item in F09 section 6.2 (step 16), adds the states and the privacy rules they lack, and turns the founder question F09 Q4 into a decision: Find is in scope (closed X1; research gap G3).

Tags: EVIDENCE = repo file read this session. HYPOTHESIS = about parents. UNVERIFIED = not read or not run. Not run: FTS5 behaviour in `expo-sqlite` on SDK 57, and the diacritic setting of the default tokenizer (F09 cites SQLite docs opened 3 Oct 2026; I did not re-open them).

## 1. Job to be done

I go to the Book to read the one letter I remember, found by a word I said, so that I can read it or play it again without scrolling through months. (Find is a mode of reading, not a second verb: design spec 06.)

## 2. Who and when

- A parent with a book of 40 or more letters who remembers a word ("the blue boat", a nickname, a place) and not the month. HYPOTHESIS: the need starts around the second quarter of use. No parent evidence exists; the research file lists search in 3 of the 12 products it read (`FEATURE-GAP-AND-WEDGE-10nov.md`, 10 Nov 2026, table stakes; UNVERIFIED: store pages read by another agent, no product run).
- A parent who wants a letter to read aloud to {child} tonight.
- Not a way to count, filter by feeling, or audit what was written.

## 3. The single capture entry rule

Find never creates, changes or counts anything. Its entry is the Book header (a search action), as `NAV-TAB-ROLES-10nov.md` classifies it: a lens action on the Book, not a lens of its own and not a tab. Home has no search. A result opens the letter page. Nothing in Find starts a letter.

## 4. User stories

| Id | Story |
|---|---|
| S1 | As a parent, I type "boat" and see the letters where I said it, with the words around it, newest first. |
| S2 | As a parent who speaks Hindi, Spanish or Mandarin, I search in my own script and find my letters. |
| S3 | As a parent on a plane, I search with no network and it works the same. |
| S4 | As a parent who finds nothing, I see one calm line and the Book as it was. |
| S5 | As a parent sharing a phone, I know my searches are not remembered. |

## 5. Acceptance criteria

Numbers come from F09-REQ-015 where it states them (300 ms p95, 1,000 letters, SE 3). Others are proposed and marked PROPOSED.

| Id | Given, When, Then | Test title |
|---|---|---|
| NS-02-R1 | Given the Book with `EXPO_PUBLIC_BOOK_SEARCH` on, Then the header has one action labelled for VoiceOver "Find a letter"; Home and Me have 0 search controls. | `[NS-02-R1] Find lives on the Book header only` |
| NS-02-R2 | Given 1,000 fixture letters, When the parent types 3 or more characters, Then the first result row is painted within 300 ms at p95 of the last keystroke, over 20 runs of 20 queries, on an iPhone SE 3 (F09-REQ-015). | `[F09-REQ-015][NS-02-R2] 1,000 letters, 300 ms p95 on SE 3` (device) |
| NS-02-R3 | Given a query of fewer than 3 characters in a non-CJK script (a spaces-only query counts as under 3), Then nothing changes on screen and no message appears: no hint line, no "type three letters" text. PR #798's `find.en.ts` still carries a `hint` slot ("Type three letters to start.") that contradicts this row; the slot leaves #798 (Karma told `mobile`; design spec 02 no longer has it). Given a CJK query, Then 1 character is enough and the substring path runs (F09-U24). PROPOSED: the 3-character floor is revisited per language when a pack passes its gate. | `[NS-02-R3] short queries do nothing and show no hint; CJK queries use substring`; plus a content test that `find.en.ts` has no `hint` key |
| NS-02-R4 | Given a query, Then the search covers the active child's book only; own letters, own private letters and other visible letters are included, another person's private letters never (F09-REQ-015). | `[NS-02-R4] scope is the active book and visible letters only` |
| NS-02-R5 | Given the index, Then it holds each letter's `final_text` (the words as kept), the parent-typed Firsts label when it exists (NS-06 Part A), and the parent-typed photo text and typed place when they exist (NS-01-R21). Decision (12): a typed place on a photo is IN, because the parent typed it (design spec 02). A place read from the file is OUT: it was never the parent's word. It holds no `raw_transcript`, no audio-derived text, no date or place from a picture (`NX-39-R10`), no child name field, no machine tag. | `[NS-02-R5] the index holds only final_text and the typed label` (schema test) |
| NS-02-R6 | Given a query of 2 or more words, Then a letter matches when all words appear, in any order; the last word matches as a prefix while typing. Case is ignored. | `[NS-02-R6] all words match, last word as prefix, case ignored` |
| NS-02-R7 | Given the fixtures "cafe" and "cafe with an accent" in French, Spanish and Portuguese text, Then the unaccented query finds the accented word. UNVERIFIED that the default tokenizer does this; if it does not, a folded copy of the text is indexed instead. | `[NS-02-R7] accents do not hide a word` |
| NS-02-R8 | Given fixtures in Devanagari and Arabic script, Then a whole-word query in the same script finds the letter. Right-to-left results render with the match marked and are readable in VoiceOver. | `[NS-02-R8] Devanagari and Arabic words are found` |
| NS-02-R9 | Given a result, Then it shows the letter's date line and a snippet that is a contiguous slice of `final_text` containing the match, with the match emphasised. The snippet is cut on a word boundary and shown with the existing fade, not an ellipsis character. Test: snippet is a substring of `final_text` for 200 random fixtures. | `[NS-02-R9] the snippet is a slice of the parent's words` |
| NS-02-R10 | Given results, Then they are ordered newest first by the letter's date; no ranking score, "best match" or relevance word is shown. | `[NS-02-R10] results are by date, newest first` |
| NS-02-R11 | Given results or no results, Then no result count is displayed or spoken. VoiceOver announces "Letters found" or the empty line, with no number. PROPOSED; `design-systems` may reverse it on accessibility grounds. | `[NS-02-R11] no count on screen or in the VoiceOver string` |
| NS-02-R12 | Given a tap on a result, Then the letter page opens in the Book and Back returns to the same query and scroll position. | `[NS-02-R12] Back keeps the query` |
| NS-02-R13 | Given no result, Then the screen shows `book.empty.searchTitle` ("No letters with that word yet.") and nothing else: no tip, no "add a letter" button. | `[NS-02-R13] one calm line, no prompt to write` |
| NS-02-R14 | Given the query, Then it is never saved: no recent searches, no suggestions, no history; it is cleared when the parent leaves the Book. The text field sets autocorrect off and spell check off. | `[NS-02-R14] queries are not remembered: no recent searches` |
| NS-02-R15 | Given a canary query typed through search, a result tap and a forced error, Then 0 hits in logs, breadcrumbs, crash payloads, analytics and URLs. | `[NS-02-R15] the query never leaves the screen` (log canary) |
| NS-02-R16 | Given Keep, Review edit, Undo of a small fix, delete, restore, hide, and a synced letter from the other parent, Then the index changes in the same transaction as the letter. A deleted, hidden or sealed letter is not found at once (a sealed letter contributes nothing until it opens, design 04 FS-R10); a restored, unhidden or opened letter is found again; a purged id never returns. | `[NS-02-R16] the index moves with the letter` |
| NS-02-R17 | Given a kept letter whose words are still being made, and a quiet day, Then neither is found (no words yet; a quiet day has none, D-084). | `[NS-02-R17] letters without words are not found` |
| NS-02-R18 | Given Erase everything or Delete account, Then the index and its sidecar files are deleted with the data. | `[NS-02-R18] erase removes the index` |
| NS-02-R19 | Given the index is missing or older than the migration, Then search falls back to a substring scan of `final_text` with the same results, and the index rebuilds off the first frame and without blocking Keep. Results from both paths are identical on the fixtures. | `[NS-02-R19] fallback and index agree` |
| NS-02-R20 | Given 1,200 letters, Then, over the Book screen's own baseline, one search adds no more than 50 MB of peak memory and the index file is no larger than 10 MB (both PROPOSED defaults; F09 A3 and the BL-044 device run set the final numbers, and a miss blocks the flag, not the build). | `[NS-02-R20] 1,200 letters stay inside the memory budget` (device) |
| NS-02-R21 | Given VoiceOver, AX5, Reduce Motion and Voice Control, Then the field and results are labelled, reachable in order, 44 pt or more, one column at AX5. | `[NS-02-R21] Find passes VoiceOver, AX5, Reduce Motion` (device) |
| NS-02-R22 | Given airplane mode, Then Find behaves exactly as online and makes 0 network calls. | `[NS-02-R22] Find makes 0 network calls` |

## 6. Edge cases, empty and error states

| Case | Behaviour |
|---|---|
| Empty book | The header action is present. A query shows the empty line (R13). No other copy. |
| Query with only spaces | Treated as fewer than 3 characters (R3). |
| Same word in raw and final text | Only `final_text` is searched (R5). If the parent restores a small fix, the index updates (R16). |
| A letter in two scripts | Both parts are searchable; no language is detected or labelled. |
| Hidden book or hidden letter | Not found, same as not shown in the Book (F12/B-REQ-014). |
| Another child's book | Not searched. A second book needs a switch of the active book first (OQ-1). |
| App lock | The Book is not reachable while locked, so neither is Find. |
| Index corrupt | Fallback scan (R19). No error to the parent. |
| Very common word | Results list as normal; no cap message; paging is by the list's own scroll. |
| Photo text, typed place or Firsts label | Found once they exist; a date or place read from the file is not (R5). A result that matched photo text shows that text, not the letter's words, as its snippet. |

## 7. Privacy and constitution check

- Read only. Find writes nothing to a letter and sends nothing anywhere. The snippet is the parent's own words, cut at a word, never summarised or rephrased. Nothing is added: no suggested searches, no "related letters", no topic or mood.
- The index is derived data of level L4 on the phone only (F09 data table), under iOS Data Protection with the rest of `scribe.db`, rebuilt from `entries`. It never syncs and is not in the export.
- No child name, transcript, audio or entry text in analytics, logs or crash reports (CLAUDE.md privacy rules; R15).
- Door lines: Find is not a consent. No Shown/Records line is needed. Never: store the query, send it, or index audio. Decline: not using it changes nothing.
- No gap counting: no "you have not written about X", no counts, no suggestions to fill.
- Content strings pass the rules test. The empty-state key `book.empty.searchTitle` exists (EVIDENCE: `packages/content/src/strings.en.ts`, line 543 at `da83fb1ee`) and is reused.

Label effect: none. The index is on the phone only and never syncs or exports.

## 8. Free vs Plus

Free and ungated in Build 13; not promised as forever. Find reads letters that exist; what a family kept stays theirs to read, hear and export, so Find works after the allowance is used and after Plus lapses. It adds no gate (D-082 stays the one gate; planned raise 2, 5, 10). Capture is never blocked and Find does not touch capture.

## 9. Metrics (content-free)

- Opt-in analytics is off for the 1.0 line. If on: `book_search_used` with `results_bucket` of `0`, `1_5` or `6_plus` only (F18 allowlist row in F09 section 9). No query text, no length, no letter id.
- A study decides whether Find stays: 5 parents with 40 or more letters each look for a named letter; pass line PROPOSED: 4 of 5 find it in under 20 seconds and 0 of 5 read the empty line as a reproach.

## 10. Dependencies

- `expo-sqlite` with `enableFTS` in the config plugin (F09 data section). This changes native config, so it needs a new EAS build, not an update over the air. UNVERIFIED that FTS5 is present on SDK 57.
- A local migration for `entries_fts` and triggers (`apps/mobile/src/lib/db/migrations.ts`); a new migration file, never an edit of an applied one.
- F09's Book header (NX-42 says shipped in #674; UNVERIFIED by me).
- NX-44 and NS-01-R21 only for the label and photo text (later and Build 13).
- Packs: CJK and non-Latin behaviour depends on the language gates; Build 13 ships English only (D-121; UNVERIFIED for Build 13), so R8 and R3's CJK half are proven on fixtures, not on a shipped pack.

## 11. Risks

| Risk | Mitigation |
|---|---|
| FTS5 missing or slow on SE 3 | R19 fallback; R2 and R20 are the gate; if both fail, ship the scan path alone and re-measure. |
| Index leaks into backup, export or analytics | R5, R15, R18 and the data table; schema test. |
| Cutting the snippet looks like editing | R9: the slice test; the fade is a visual treatment only. |
| A result count nudges comparison | R11: none shown. |
| Mandarin two-character words | Substring path (R3); native reviewer on the pack (F09 A2). |

## 12. Open questions (every one has a default)

| Id | Question | Owner | Default if no answer | By |
|---|---|---|---|---|
| OQ-1 | Search across all books for a family with two children? | Founder | No. Active book only. | Fri 20 Nov 2026 |
| OQ-2 | Search `raw_transcript` as well, so a word a small fix changed is still found? | `product`, `content` | No. The Book shows `final_text`; a restored fix is searchable (R16). | Build 13 design freeze |
| OQ-3 | Result count for accessibility | `design-systems` | None (R11). | Design spec |
| OQ-4 | Does the 3-character floor stay for Hindi and Arabic? | Native reviewers, `speech` | Yes, until a pack passes its gate and a reviewer says otherwise. | Per pack |

## 13. Rollout

- Flag: `EXPO_PUBLIC_BOOK_SEARCH`, on in `preview` and `testflight` first, on in `production` when R2, R19 and R20 pass on an SE-class device.
- Target: Build 13, alongside NS-01. If the native FTS build is not ready, Find moves to Build 14 alone; it does not ride with a tab change.
- Kill: the remote pause hides the header action; letters and the index are untouched.
- Backlog row: WP-F09-11 exists; a Find task cites this file in the next `product` backlog PR.

## 14. Not fully testable

- R2, R20 and R21 need real devices (SE 3, VoiceOver). There is no stand-in; per RR-8 the row stays "partly built" until a device run passes.
- R7 and R8 depend on tokenizer behaviour that is UNVERIFIED until run.
- The study pass lines in section 9 are proposals the founder may reset before the study.
