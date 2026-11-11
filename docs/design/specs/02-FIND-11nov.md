# 2. Find

Status: DRAFT, 11 Nov 2026 (UTC). Docs only. Author: `design-systems`. Index, tags and the 12-line review: `NEW-SCOPE-INDEX-11nov.md`. Requirement source: F09-REQ-015 "Search on this device" (P1, `docs/prd/v2/features/F09-book.md` line 231; WP-F09-11 "Not built; P1, recommended cut from v1.0", EVIDENCE). Capability C13 in NX-42, classed LENS in NAV-TAB-ROLES section 3.

## 1. Job

One sentence: I find a letter by a word I remember. (9 words.) Verb "find" belongs to Read: it is a way to look at kept letters, so it lives in the Book and nowhere else.

## 2. Where it lives

- One magnifier button in the Book header (44 pt, labelled "Find"), right of the title. Not on Home (Home lists no kept letters), not in Me (Me has no letters). Settings search is a different job and is not designed here.
- Tapping it turns the Book's header into a `FindBar` and the list below into results. Back (the keyboard's Cancel) returns to the Book exactly where it was (scroll position kept).
- It is a mode of the Book screen, not a new screen or tab, so the Book stays one object (letters) and there is nothing to name in the tab bar.

## 3. Layout

```
 [ Find in Asha's book ........ ] Cancel      <- FindBar, 48 pt, autofocus
 ( Months )  Photos                            <- LensRow hidden while finding

 Type three letters to start.                  <- before 3 characters (slot)

 -- after 3 characters --
 SAT 14 OCT
 "We went to the park and she laughed at the
  [ducks] by the water, the way she does."     <- match marked, words whole
 Hear Mama                                      <- only if a recording exists

 SUN 3 SEP
 "the ducks again, another day"                     <- (no ellipsis char; fade, see 5)
```

- Results are `LetterCard` variants (`FindResultRow`): date line, then the matching sentence of the letter exactly as kept, with the matched word marked by an underline plus medium weight (not colour alone; `accent` on `bg` 5.50 : 1 light, 8.37 dark).
- Order: newest first. No relevance score, no "best match", no count ("12 results" is not shown; a count of what the parent searched for is not a gap, but VoiceOver and the screen stay quiet about numbers; open question Q4).
- Scope: the active book (F09-REQ-015). With two books the placeholder names the book; the book switcher is not inside Find.

## 4. What is searched (PROPOSED; open question Q1)

| Searched | Yes or no | Why |
|---|---|---|
| A letter's words as kept (final text) | Yes | The job |
| The parent's first label (spec 4, only if Firsts ship) | Yes | The parent's own words |
| The parent's typed photo description (ML-S7) | Yes | The parent's own words |
| The parent's typed place on a photo | Yes | Typed by them. A derived place (from the file) is not searched: it was never their word |
| `raw_transcript` ("Exactly as said" text) | No | F09-REQ-015 scopes search to what the Book shows; searching hidden text would surface words the letter does not show (UNVERIFIED: F09 does not say) |
| Quiet-day marks | No | They have no words (D-084) |
| Recordings still waiting for words | No | No words exist; the Book already shows the waiting card |
| Another parent's private letter | Never | F09-REQ-015 |
| Deleted letters, hidden books | Never | |
| Sealed letters (spec 4) | No, until opened | The words are hidden from the Book; the seal row is not matched by content |

Matching: case-folded, accent-folded for Latin script, Devanagari matched as written; CJK uses the substring path (F09-REQ-015). Whether the planned index folds diacritics is UNVERIFIED (not built).

## 5. Components and tokens

| Part | Component | Tokens |
|---|---|---|
| Magnifier | `IconButton` with a text label for VoiceOver | `target.min` |
| Field | `FindBar` (NEW, a `TextField` preset: leading Phosphor `MagnifyingGlass`, clear button, return key = Search) | `controlBorder`, `radius.pill`, type `body` |
| Result | `FindResultRow` (NEW, a `LetterCard` variant) | `surfaceRaised`, `radius.md`, `letterDateline`, `letterBody` |
| Cut of a long letter | `ExcerptFade` (existing on cards; `text-trim.logic.ts` cuts on whole words) | none new |
| Empty and error | `EmptyState`, `InlineState` | existing |

Long letters: the row shows the sentence that holds the match, cut on whole words. A fade, never an ellipsis glyph (content rule). The full letter is one tap away and VoiceOver reads the whole matched sentence plus the date. The match marking stays when the letter opens (the page scrolls to it, once; Reduce Motion: jumps).

## 6. States

| State | Behaviour |
|---|---|
| Idle, before typing | Field focused, the line "Type three letters to start." (slot). No recent searches (Q2) |
| Fewer than 3 characters | Same line. No results. (CJK may match on fewer; F09 sets 3 for the rest) |
| Results | Rows as above, p95 300 ms on an SE 3 with 1,000 letters (F09-REQ-015; UNVERIFIED, nothing built). Results appear without a spinner; if over 300 ms the previous list stays, no flash |
| No match | Existing `book.empty.searchTitle` "No letters with that word yet." (EVIDENCE). One quiet line under it (slot): try another word. No "Write a letter" button (the Book starts nothing) |
| Empty book | Find is not offered when there is no kept letter (the magnifier is absent, not greyed) |
| Index not ready (after a restore or a new phone) | `InlineState`: "Find is still getting ready on this phone." (slot), with the Book list still usable. When ready, it clears without a toast. Uses "getting ready" as Book's word for words being made; a content decision whether that clashes (NAV-TAB-ROLES R6) |
| Offline | Identical. Find reads the phone only (Truth line) |
| Error | Index failed: `ErrorLine` plus "Try again" (slot). The Book list is untouched |
| App locked | The field and results sit behind the lock cover like the Book; no result text in the app switcher |
| Hidden or deleted mid-search | Row disappears at the next keystroke; no error |
| Two books | Placeholder names the active book; switching book clears the field |

## 7. Motion

| Moment | Motion | Reduce Motion |
|---|---|---|
| Header becomes the FindBar | cross-fade `swapMs` 150 | same |
| Results enter | `enter` for the first six rows, `staggerMs` 30 | `fadeMs` for all, no stagger |
| Match opens its letter | existing card-to-page transition (`cardToPage`) | fade `fadeMs` |
| Clear text | none | none |

Typing never animates the list. Rows do not reorder while typing settles within a keystroke; the list swaps in one frame.

## 8. Dynamic Type and VoiceOver

- AX5: the FindBar grows with text (min 48 pt), Cancel moves under it. Each result row stacks date over words; words are whole in the row up to the fade, and the fade only occurs where the full sentence is read by VoiceOver. Dates are `letterDateline`, 14 pt base, scale cap 2.4 per `tokens.type` (EVIDENCE).
- VoiceOver: the magnifier is "Find, button". Focus lands in the field on open. The result list is one container; each row reads "{date}. {matching sentence}. Opens the letter." Matches are not announced as a count. On no match the empty line is read once, politely. The keyboard return key is Search, 44 pt.
- Voice Control: "Tap Find" works because the label is real text.
- Dictation into the field is the system's; Find never records audio.
- Reduce Motion, Reduce Transparency, light and dark: the bar is solid `surfaceRaised`, 1 pt `line` edge under Reduce Transparency.

## 9. Copy slots (for `content`)

Existing (EVIDENCE): `book.empty.searchTitle` = "No letters with that word yet."

| Slot | Intent | Limits and rules |
|---|---|---|
| `book.find.button` | VoiceOver and visible name of the magnifier | One word: Find |
| `book.find.placeholder` | "Find in {child}'s book" | Names the book; `{child}` with the nameless fallback |
| `book.find.hint` | Before three characters | One sentence; no number words other than "three" if kept |
| `book.find.noMatchHelp` | Under the existing no-match title | One short line, suggests another word; no gap language |
| `book.find.notReady` | Index still being made | Plain; true only while it is true |
| `book.find.error` and `book.find.retry` | Index failed and Try again | Says what to do |
| `book.find.rowA11y` | "{date}. {sentence}. Opens the letter." | No count |
| `book.find.clear` | VoiceOver name of the clear button | |
| `book.find.cancel` | Cancel | |

Door lines. Not a consent screen, but it reads the whole book:
- Shown: the placeholder naming the book.
- Records: nothing. The index is a phone-only table built from letters the phone already holds (ADR-level question for `data-architect`: where the index file lives and whether the app-lock cover and backup rules apply to it; UNVERIFIED).
- Never: search terms, results or index content in analytics, logs, crash reports, push or URLs (PRINCIPLES 12). No new analytics event (NAV-R12). No recent-search list by default.
- Decline: nothing to decline; not using Find costs nothing.

## 10. Requirements (Given, When, Then; working ids FD-R#)

| Id | Requirement | Proof |
|---|---|---|
| FD-R1 | Where. Given the Book with at least one kept letter, Then a Find control is in its header; Given Home or Me, Then none | navigation test; device |
| FD-R2 | Scope. Given a search, Then only the active child's letters the viewer may see appear, never another parent's private letter, a deleted letter or a hidden book (F09-REQ-015) | unit tests on the query; `supabase/tests` access matrix if any part is server-side (it is not designed to be) |
| FD-R3 | Speed. Given 1,000 letters on an SE 3, When 3 or more characters are typed, Then results show within 300 ms p95 | perf test on device (F09) |
| FD-R4 | Faithful. Given a result, Then the words shown are the letter's words as kept, cut on a whole word, with no rewriting, summary or highlight text written by the app | unit test on the excerpt function |
| FD-R5 | Starts nothing. Given no match or an empty book, Then there is no button that starts a letter in Find | navigation test |
| FD-R6 | Quiet. Given any use of Find, Then no term enters analytics, logs or crash reports | catalog review; log test |
| FD-R7 | Accessibility. Given VoiceOver, AX5, Reduce Motion, both themes, Then section 8 holds and the match is not signalled by colour alone | device |
| FD-R8 | Works with no network and no account | device, airplane mode |

## 11. The 12-line job-clarity review

| # | Result | Reason |
|---|---|---|
| J1 | Pass | "I find a letter by a word I remember." |
| J2 | Pass | Find is a Read act; Read belongs to Book only |
| J3 | Pass | No starter in Find, including empty results |
| J4 | Pass | The object is a kept letter |
| J5 | Pass | The bar says what it searches (placeholder names the book) |
| J6 | Pass | One field; results are the only other thing |
| J7 | Pass | Find is not on Home; Home shows no list |
| J8 | Pass | An empty book has no Find (absent); not an empty box |
| J9 | Pass | Section 6 |
| J10 | Open | Slots are new |
| J11 | Open | Device pass |
| J12 | Pass | Without it a parent scrolls months; no other place finds by word |

## 12. Open design questions, each with a default

| # | Question | Default |
|---|---|---|
| Q1 | Search first labels and typed photo text too? | Yes, they are the parent's words |
| Q2 | Keep a list of recent searches? | No. A recent word on a shared phone could be a private word |
| Q3 | Filter by month or by who wrote it? | No in this scope; the Book's months already filter by time |
| Q4 | Show a count of results? | No |
| Q5 | Search by date ("June")? | No; words only |

## 13. UNVERIFIED

Everything about the index (not built; WP-F09-11 says "Not built; P1, recommended cut from v1.0"); the 300 ms figure on a device; diacritic folding; whether F09 allows searching `raw_transcript`; that the open stack's `book.tsx` can host the header swap without a layout jump.
