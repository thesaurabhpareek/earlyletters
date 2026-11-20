# Gap log: design to product (from 20 Nov 2026)

Owner: Karma (product side). The founder asked (20 Nov) that as design works and finds gaps, it passes feedback to product and the two work together so the requirements are updated where gaps are found. Every "Card gaps" row from `docs/design/e2e/*/` and `docs/design/system/` lands here with a ruling. Rulings that change a card are applied through `18-errata-after-lock.md` (cards 01 to 12) or directly in `19-from-download-to-first-letter.md` (NS-38 onward); engineering gaps go to the engineering thread on #846.

Ruling kinds: CARD (the card changes as stated), DEFAULT (design's proposed default is accepted as the requirement; the card gains it), FOUNDER (needs the founder; default stated), ENG (engineering gap, routed), NONE (no change, reason).

## Round 1 (20 Nov, from the first drafts)

| Gap | From | Card row | Ruling | Requirement now |
|---|---|---|---|---|
| B G-01 | Book design | NS-06-B2, B3 | CARD | The author's own letter page shows the words before the day, with the row "Hidden until {day}" and Open now; only other readers see no words (new row NS-06-B27, P0 (a)) |
| B G-02 | Book design | NS-22-R4 | DEFAULT | An empty book keeps "More for this book" (Quiet, Hide) |
| B G-03 | Book design | NS-22 section 15 | CARD | The book's actions use the system menu (Liquid Glass, design system COMPONENTS), not a custom sheet; fall back to a fit-to-contents sheet only where the system menu cannot carry the content |
| B G-04 | Book design | NS-22 section 16 | DEFAULT | `content` adds `children.quiet.*` as PROPOSED keys under BL-965 |
| B G-05 | Book design | NS-06-B4 | DEFAULT | The seal-opened slip shows the letter's own date and one line, no words |
| B G-06 | Book design | NS-23 section 15 | DEFAULT | Dismiss sits at the card's foot, own row at AX sizes |
| B G-07 | Book design | NS-24 section 16; frame on counts | CARD | Facts about what exists may be stated where a parent looks for them (month rows as built); never on Home, never as progress, never a count of gaps. Year rows carry no subtitle |
| B G-08 | Book design | NS-21 section 4 | DEFAULT | "Who can read it" opens a two-choice sheet |
| B G-09 | Book design | NS-01 section 3, NS-21 | DEFAULT | Photo words and place show as a footnote under the picture, verbatim |
| B G-10 | Book design | NS-02 section 3 | DEFAULT | Snippets keep the letter serif at callout size; the match is underlined and medium weight, never colour alone |
| B G-11 | Book design | NS-24 section 3 | DEFAULT | Reading a year, the year label is the title |
| B G-12 | Book design | NS-06-B15 | DEFAULT | No day preselected in the seal picker; the action stays absent until a day is chosen |
| B G-13 | Book design | NS-21 section 5, T4 | CARD | Two kinds of undo: deleting a letter keeps its built tap-to-undo with no timer; time-boxed undos (photo change, first) follow T4 |
| D G1 | Family motion | NS-05 sections 10, 15 | CARD | "System sheet" in NS-05 means the house sheet with no custom motion inside it; the iOS share sheet is the system's |
| D G2 | Family motion | NS-05 section 4 step 7 | DEFAULT | After the share sheet closes, whatever the outcome, the preview closes onto the unchanged letter page and focus returns to Share |
| D G3 | Family motion | NS-07-C5-13 | DEFAULT | "Visible within 100 ms" means mounted, announced and at least a third of full strength |
| D G4 | Family motion | NS-13 section 15 | DEFAULT | "Motion: none" means nothing travels; opacity fades allowed |
| D G5 | Family motion | NS-18 section 4 | DEFAULT | The typed-day line stays for that local day and leaves the next day with no exit animation |
| D G6 | Family motion | NS-13-R9, NS-18-R1, NS-32 | CARD | A notification tapped while a letter is being made never navigates away; it lands on what is open (new row NS-32-R17, P0 (c)) |
| D G7 | Family motion | NS-25 section 6 | DEFAULT | The built join motions stay, with their Reduce Motion forms |
| D G8 | Family motion | NS-13 section 4 step 1 | open | Where the reminder ask rises (over the Book after the saved moment, or on Home): area D design lead settles; pending |
| D G9 | Family motion | NS-32 section 15 | DEFAULT | Tapping a plan notice opens Me, Plan, directly on a cold start |
| E K-1 | System motion | NS-33-R5 | DEFAULT | Under Reduce Motion a busy control shows no spinner; its label changes to its busy words |
| E K-2 | System motion | NS-34 section 3 | CARD | Low Power Mode stops decorative loops (lamp breath and any breathing motion); new row NS-34-R8, P1 |
| E K-3 | System motion | frame section 5 | CARD | The success haptic marks only a person's own completed act: a kept letter, the book opening, Plus on, App lock on; never sign-in, restore or update |
| E K-4 | System motion | NS-10-R0 | DEFAULT | The held screen's two actions arrive into a reserved slot within 10 s |
| E K-5 | System motion | frame section 5 | CARD | App update states (available, required) are carded in NS-45; "still working" lines follow the design system timing bands |
| E K-6 | System motion | X5 rows | CARD | A paused or killed surface disappears at the next focus of its screen, never under a finger |
| E K-7 | System motion | NS-33-R15 | NONE | Already BL-954 (one helper; toast and action expire together) |

## Engineering gaps routed (round 1)

| From | Gap | Routed to |
|---|---|---|
| B E-01 | NS-22-R3 needs Quiet and Hide within 2 taps of the Book via the end menu; BL-938 and BL-985 place them elsewhere | BL-938 gains the menu slot |
| B E-02, E-04 | Local flag family; BL-969/970 seal columns | Already errata E20, E6 |
| B E-03 | Engineering proposes kill switches for Firsts and seals; cards say none | Cards win (NS-06 A9, B9); drop the proposal |
| E G-E1 | No Low Power Mode hook | New row with BL-984 (NS-34-R8) |
| E G-E2 | Button loading spinner under Reduce Motion | BL-984, design-systems |
| E G-E3, E4, E6 | Motion values typed in components | One design-systems token task |
| E G-E7, E8 | No placeholder or system line component; no update surface | New rows (design system COMPONENTS; NS-45) |

## Round 2 (20 Nov, from the finished areas and design system)

### Cross-area groups (named for Karma)

| Gap | From | Card row | Ruling | Requirement now |
|---|---|---|---|---|
| X CS-1 | A G-05, A W11, E K-E01, E CG2 (languages half) | NS-17 section 4 step 3, section 16; `languageCopy.waitingForLanguage`; `features.language.picker.englishOnly` | FOUNDER | Both keys end "Other languages are coming in a later update.", an in-app promise of future languages that no decision makes. Default: drop that sentence from both keys in every build; the built held-language line keeps its first sentence only; NS-17's set-aside path uses the new `review.otherLanguage.waiting` in every build. Why: a stand-in for a feature the build does not have is a promise it cannot keep (the D-161 reasoning; Apple 2.1(a)); NS-17-R4 names only shipped languages |
| X CS-2 | E G-E02, D WORDS section 16 last row | D-113 item 1 vs D-161 | NONE (D-161 decides) | D-161 (founder, 11 Nov) rules out any reachable "coming soon" co-parent surface in every build, which supersedes D-113 item 1's coming-soon answer on `/invite/leave`. `LeaveLater` goes; `/invite/leave` redirects Home while Leave is hidden; `family.leave.later` is deleted. D-113 gains a "superseded in part by D-161" line (Karma, its delegated decider). Routed to BL-983 |
| X CS-3 | E CG2 (co-parent half), E G-E01 | Frame section 4 last sentence; D-161 | NONE (D-161 decides) | `familyCopy.soon.status`, `familyCopy.soon.settingsRowHelp` are deleted and `flags.familyTeaser` stops defaulting to `coming_soon` (default `quiet`, or the key retired in the next schema version, with a test that no screen reads it). The content rules test gains "coming soon" and "in a later update" as banned phrases so the group cannot return (BL-965) |
| X H-1 | S MOTION section 9 and open point 3, S MOTION ENG-M10; E M K-EM3 | Round 1 E K-3 (frame section 5) | CARD (round 1 K-3 amended) | The success haptic marks only three completed acts a person caused: a letter kept (at commit), a Save a copy file finished, and joining a book (on the joiner's phone). Removed from K-3: "the book opening", "Plus on", "App lock on". Plus is confirmed by StoreKit's own system sheet, and Apple's haptics guidance is to use system feedback consistently and not double it; App lock is a setting. Never on sign-in, restore, update, settings saves, invite created, first-run finish or adding a child. Files: the round 1 K-3 row is marked superseded by X H-1; system MOTION section 9 stands as written; ENG-M10 trims the call sites |
| X NS17 | A E-03, A WORDS section 19 rows 2 and 3 | NS-17-R5, R7, R8 (P0), R9 | ENG | NS-17 has no backlog row while three P0 rows wait. New row needed (phone side): the Review mark in every build (A G-06), the Undo (A G-07), the withheld and waiting states, the held-draft push without words, "Write the words" for a take, and the part-unwritten line only if a module can report an unwritten stretch (else that state is not drawn). The server half is errata E7's row. See routed table |

### Area A: Capture

| Gap | From | Card row | Ruling | Requirement now |
|---|---|---|---|---|
| A G-01 | Capture design | NS-15 section 15; built Review header | DEFAULT | Review's header is two controls: "To {child}" on line 1 (the whose-book control, I6) and the day on line 2 (C6 Dateline, tappable, opens DateSheet) |
| A G-02 | Capture design | NS-16 section 15 | DEFAULT | On Review the top-right From is the control; the letter page keeps the signature where area B draws it |
| A G-03 | Capture design | NS-15-R1 | DEFAULT | The day line reads "Today, {date}" until changed, then the chosen day; VoiceOver "About {date}". Words in BL-965 |
| A G-04 | Capture design, A W5 | NS-14 VoiceOver and Voice Control rows | CARD | The switcher's accessibility label starts with its visible words: "For {child}. Letters go to {child}'s book."; a nameless book reads "For your child, born {date}" or "due {date}", sheet rows to match |
| A G-06 | Capture design | NS-17-R5 | DEFAULT | R5 reads "Given any build and a take": the another-language mark shows on Review whatever the spoken-language list holds |
| A G-07 | Capture design, A W8, A M-CG-8 | NS-17-R5 | DEFAULT | One tap sets the words aside, then an Undo line for the T4 window (BL-954 helper); after it the mark stands. No confirm |
| A G-08 | Capture design, A W1 | NS-01-R58, R17a | DEFAULT | The "did not come along" line also shows on Review with "Add a photo" (`features.photos.review.notStored`); R58 on the letter page as written |
| A G-09 | Capture design, A O-2 | NS-09 happy path | DEFAULT | Review offers a quiet "Let it go" as the last plain item of its content in every state that has a recording |
| A G-10 | Capture design, A M-CG-7 | NS-09 step 5 vs R4a | DEFAULT | When the delete throws, Review stays and shows only the not-removed line and Done (A-S11.notRemoved); Let it go and Keep are gone; the parent leaves by Close |
| A G-11 | Capture design | NS-01-R3, R20b | DEFAULT | Ready has two forms: with a picture, Speak and Type as the card says; doorways and plain Ready keep the red circle |
| A G-12 | Capture design | NS-14-R4 | DEFAULT | Review's "To {child}" control may move that one draft (the parent's explicit act); absent on a later-words letter, as built |
| A G-13 | Capture design | Frame section 4 slip order | CARD | Slip 1 is the whole waiting set as built (Home lists every draft); while it shows, no other slip shows |
| A G-14 | Capture design | NS-01 section 3 | DEFAULT | While recording, a still 56 pt thumbnail sits beside "To {child}"; no motion |
| A G-15 | Capture design | NS-01 section 5 | DEFAULT | With a picture pending, the microphone primer and problem screens keep it pending; Type instead carries it to Write; Close backs out and writes nothing (R4) |
| A G-16 | Capture design, A O-5 | D2; NS-35; frame section 7 | CARD | D2's list gains Write's field (its text becomes a letter's words, which frame section 7 already covers). Writing tools off on Write (BL-962) |
| A G-17 | Capture design, A E-07 | NS-06 C9 | NONE | The card wins: no remote key for doorways; plan 17 section 2.2 item 3 drops `killSwitches.quickCapture` (as round 1 B E-03) |
| A G-18 | Capture design, A E-08 | NS-16 RR-5 ("no remote key", PROPOSED) | CARD | NS-16 gains `killSwitches.signAsOther`. It only hides the From control; a draft that already carries a typed name keeps it; it never stops Keep, reading or export (ADR 0029; errata E21). Reason: another adult's words are counsel-gated (Q48), so a remote pause is worth having |
| A G-19 | Capture design | NS-01 section 3 | DEFAULT | A picture draft's waiting card on Home shows a 40 pt thumbnail and no words about the picture |
| A G-20 | Capture design, A E-14 | NS-04 H8, H9 | NONE | No card row until NS-04b finds a take needs a limit; the low-space mid-take lines stay unbuilt until `mobile` confirms the 06-nfr 11.3 behaviour in code (A WORDS section 17) |
| A G-21 | Capture design, A W14 | NS-16-R1 localisation line | DEFAULT | No visible counter on the From name; the hint says how it counts and `review.from.tooLong` shows only when over |
| A W2 | Capture words | NS-01-R20b, R20e | DEFAULT | Visible label "Change photo" on Ready, Write and Review (one Voice Control name) |
| A W3 | Capture words | NS-01-R5a | DEFAULT | When Keep is off for want of words, `features.photos.review.needsWords` says why |
| A W4 | Capture words | NS-09 section 16 | DEFAULT | The Storage line reads "A recording you let go is still on this phone." (not a count; one line however many) |
| A W6 | Capture words | NS-15 Failed row | DEFAULT | A failed day change names itself: `review.date.notSaved` |
| A W7 | Capture words | NS-16-R2 | DEFAULT | No "kept by" line on a letter spoken by someone else; the signature alone shows; the export carries the keeper |
| A W9 | Capture words, D G-D15, D M-G5 | Frame section 4; NS-18 happy path 3 | CARD | The typed-day line on Home is part of the prompt block, not a slip; `[FRAME-SLIP]` registers it as "not a slip", like the Plus line |
| A W10 | Capture words | NS-06-C2 | DEFAULT | `quickNote.widgetLabel` and `lockScreenLabel` are retired: no `{child}` on a widget or the Lock Screen (frame guardrail) |
| A W12 | Capture words | NS-35 content inputs | DEFAULT | Home's job line: "I go to Home to say something to {child}."; Book and Me lines from areas B and C, 12 words or fewer, same pattern |
| A W13 | Capture words | NS-16 section 16 | DEFAULT | From sheet title "Who is this letter from?" and the way back "Use my name" (no speaker-identification wording, NS-16-R9) |
| A M-CG-1 | Capture motion | NS-34 section 3 | NONE | The card is clear (loops change opacity only); the code differs. Engineering fix (A EG-3) |
| A M-CG-2 | Capture motion | NS-33-R6 | CARD | Start of recording for VoiceOver users: "Recording." is announced before the microphone opens, and the microphone opens on the announcement's end, at most 1 s after the tap; no speech while recording; stop is announced after the recorder stops. `a11y` confirms on a device |
| A M-CG-3, A M-CG-4, C M-1 | Capture and keeping motion | Frame section 5 undo rule (T4) | DEFAULT | T4 detail: the seconds start when the undo line has finished entering; the clock pauses while the app is in the background; the window never closes while VoiceOver focus rests on Undo (it closes N seconds after focus leaves, or by the T4 clock, whichever is later); "moves on" for Switch Control means leaves the screen, activates any other control, or locks the phone |
| A M-CG-5 | Capture motion | none (design brief cap) | NONE | No card speaks to the quiet-day dim or the cold-launch lamp; both are design system named exceptions (S MOTION section 5), opacity only, off under Reduce Motion and Low Power Mode. CDO decides |
| A M-CG-6 | Capture motion | NS-01 section 5 | NONE | The card holds: no sound and no haptic on a picture that failed. SOUND.md is retired (card 12 refuses paper sounds; AUDIT 4.14) |
| A O-1 | Capture design vs v2 A2 | NS-35 largest-text row; NS-14-R5 | NONE (card holds; COMPONENTS A2 changes) | At accessibility sizes the capture actions sit inline under the prompt, rendered solid in the content layer, as NS-35 says. COMPONENTS A2's "stays in the bottom third at AX5" is replaced by its own reconciliation line (inline solid twins from AX3). Apple's guidance has glass only on floating controls, so inline solid is consistent with it |
| A O-2 | Capture design vs v2 N3 | NS-09 happy path (Let it go on Review) | NONE (card holds; COMPONENTS N3 changes) | Review's toolbar holds Keep (prominent) and Keep private (plain) only; Let it go stays in content (A G-09). COMPONENTS N3 drops Let it go from Review's `split` toolbar. Keeping a destructive action apart from the primary one follows Apple's guidance |
| A O-3 | Capture design vs v2 A3 | NS-33-R6; glossary ("Tap the red circle and talk") | NONE (glossary holds; COMPONENTS A3 changes) | The record control's words are "Finish" and the glossary phrase, not "Stop" and "Speak". At Ready the glass is a ring around the red disc, so "red circle" stays true. COMPONENTS A3 changes its labels |
| A O-4 | Capture design vs v2 | none | NONE | Review with the Keep sheet stays within three glass surfaces; nothing to change |
| A O-6 | Capture design | none | NONE | FOUNDATIONS and tokens landed after the pass; the prototype re-keys to `tokens.v2.json` when it exists. No requirement |

### Area B: Book and reading

Round 1 ruled B G-01 to G-13 and B E-01 to E-04. These are the remaining rows from MOTION.md, WORDS.md and the v2 conflicts.

| Gap | From | Card row | Ruling | Requirement now |
|---|---|---|---|---|
| B M-G1 | Book motion | NS-06-B4, B24 | DEFAULT | No timer at the instant a seal opens; the letter opens at the next render cause (focus, launch, store change), in one frame, no wash |
| B M-G2 | Book motion | NS-06-B4; frame slip order | DEFAULT | The seal-opened line is exempt from Home's cold-launch enter and renders complete |
| B M-G3 | Book motion | NS-37-R3 | DEFAULT | A regenerated list copy appears at the card's next mount, never into a card on screen |
| B M-G4 | Book motion | NS-01-R10a, R12; NS-06-A3 | DEFAULT | Lens switch: the month jump's 200 ms out-and-in list fade; Months keeps its place for the session; Photos and Firsts open at their top; a lens that goes away falls back to Months with the same fade and no message |
| B M-G5 | Book motion | NS-01-R48 | DEFAULT | No haptic on the lens choice (a way of reading, not an outcome) |
| B M-G6 | Book motion | NS-23-R14 | DEFAULT | "Not today": the card fades over `exitMs` and the rest closes up; Reduce Motion: 200 ms fade, close-up at once; no haptic |
| B M-G7 | Book motion | NS-23 Reduce Motion row | NONE | The card holds: under Reduce Motion the past letter renders complete, no fade |
| B M-G8 | Book motion | NS-02 section 15 | DEFAULT | Find result to letter page and back: the 200 ms hand-off both ways |
| B M-G9 | Book motion | NS-24 section 3 | DEFAULT | Year row to Read together: one dissolve over the closing sheet |
| B M-G10, C R-2 | Book motion; keeping design | NS-22 Reduce Motion row; NS-22-R7 | DEFAULT | In the Book's end menu, Quiet confirms with a toast ("{child}'s book is quiet for you.", the visible change that carries the `tap`); in Me, Quiet is a switch whose position is the change, no toast |
| B M-G11 | Book motion | NS-06-A5 | DEFAULT | Unmarking a first shows an Undo toast under T4 |
| B W-G1 | Book words | NS-22 section 16 | DEFAULT | Round 1 B G-04 stands; the Quiet words never call what the app sends "notes" (glossary). F12's review with a perinatal loss and NICU organisation before C1 stands |
| B W-G2, C W6 | Book and keeping words | NS-22-R7 | DEFAULT | "Turn Quiet off" replaces "Unquiet"; R7's test checks the key, not the word |
| B W-G3, S AUDIT 4.20 | Book words; audit | NS-21-R7a (D-085) vs NS-06-B5 table, B25 ("default Cancel") | CARD | One delete confirm for every letter, sealed or not: the safe action is the default and reads "Keep it" (D-085). NS-06-B5 and B25 change. COMPONENTS F6 `simple` keeps the safe choice as default; its label for a letter delete is "Keep it" |
| B W-G4 | Book words | NS-23 section 16 | DEFAULT | The Me footer states the rule without "on this day": "When today's date matches a letter from an earlier month or year, Home can show it." |
| B W-G5 | Book words | NS-24 section 4 step 4; appendix A | DEFAULT | End of the whole book: "That is every letter in the book."; a year ends on its own `endOfYear` line; Read together keys join the appendix A scan |
| B W-G6 | Book words | NS-06 B12 | DEFAULT | `seal.limitStored`: "Hiding keeps it out of sight. It is stored like every other letter." (no "locked"); counsel reads it under Q43 as B12 already requires |
| B W-G7 | Book words | NS-06-A5, A15 | DEFAULT | The Firsts label field has an always-present helper (`firsts.labelHelp`), and every marked card carries a small "A first" kicker, never colour alone |
| B W-G8 | Book words | NS-02-R39 | DEFAULT | `find.notReady` reads "Find is getting ready on this phone." |
| B W-G9 | Book words | NS-24 section 16 | DEFAULT | Year names: keyed ordinals for years 1 to 5, "{child}'s year {n}" after, "Year {n}" with no name |
| B W-G10 | Book words | NS-02 section 16 | DEFAULT | The Find row template keeps `{label}` (built); `{sentence}` is not an allowed placeholder |
| B W-G11 | Book words | NS-23-R14 | DEFAULT | Keep "Not today"; the NS-33 device run checks "Tap Not today" and "Tap Not much today" both land; if not, "Hide for today" |
| B W-G12 | Book words | NS-01-R11; NS-06-A4 | DEFAULT | Month openers inside the Photos and Firsts lenses show no count line (round 1 B G-07) |
| B W-G13 | Book words | NS-06-B4 | DEFAULT | The seal-opened slip has a "Not now" button (`en.common.notNowButton`); every slip has a button for gesture-free use |
| B W-G14 | Book words | NS-22 section 5 | DEFAULT | A hidden book opened from Hidden books says it is read-only (`en.book.hiddenNote`) |
| B V-1 | Book design vs v2 F1 | NS-21 section 5, R7b; round 1 B G-13 | CARD | Round 1 B G-13 holds: "Letter deleted." keeps Undo by tap, no timer. NS-21-R7b's "(T4 applies)" is corrected to "Undo by tap, never a timer (B G-13)". COMPONENTS F1 changes: its "every Undo follows T4" excludes the delete Undo |
| B V-2 | Book design vs v2 C2 | NS-21-R3a; NS-21 section 3 row order | NONE (card holds; COMPONENTS C2 changes) | Share is a separate button above the list; there is no From row (the From name shows in the dateline, NS-16). COMPONENTS C2 removes Share and From from "This letter" |
| B V-3 | Book design vs v2 C1 | NS-23-R10 (4 lines PROPOSED) | DEFAULT | Design confirms: the past-letter fragment is at most 2 lines at default size and at most 4 at accessibility sizes; R10 loses PROPOSED. COMPONENTS C1 gains this for the `past letter` variant; other Book cards follow C1 |
| B V-4 | Book design vs v2 C2 | NS-21-R5 | NONE (card holds; COMPONENTS C2 changes) | v2's 52 pt row is the default-size value; at AX5 with Bold Text on an SE 3 every row is at least 56 pt. COMPONENTS C2 states the AX5 floor |

### Area C: Keeping and trust

| Gap | From | Card row | Ruling | Requirement now |
|---|---|---|---|---|
| C G1, C W5 | Keeping design and words | NS-08-R8 | CARD | No keep-safe card on Home (it would be an unregistered slip, and it was never built). One permanent line on Where your letters live, under "If you get a new phone" (`en.whereLive.keepLine`); "shown once" means "said in one place" |
| C G2 | Keeping design (named for Karma) | D1; NS-08-R6; built Erase everything row | CARD | D1 tells the parent to use Erase everything, so it must be there: the row shows whenever no one is signed in, not only on a phone that never signed in. Its body "We hold no copy" is false on a phone that synced, so a phone that synced gets a true variant (the account's copy stays until the account is deleted). The sign-out sheet is an F6 `explained` sheet with three choices: Stay signed in (safe, default), Sign out, Sign out and erase this phone. D1's sentence reads "Anyone who can open the app here can read them" (C W8, App lock). The D1 line ships in the same PR as the row (C W9, BL-961). Whether erase also removes other accounts' books is E K-E04 below |
| E K-E04 | Foundations design | D1; Erase everything with a second account | FOUNDER | Erasing a phone that holds books of two accounts removes the other account's recordings, which with backup off are the only copy. Default: Erase everything is offered only while no one is signed in; it erases every book on the phone; the confirm says "every book on this phone" without naming any and is the F6 `typed` confirm |
| C G3 | Keeping design | NS-11-R14 | DEFAULT | The twins slip opens Save a copy directly (one file holds every book); the chooser (C-S07) serves only the printable book |
| C G4 | Keeping design | NS-11-R3, R16 | DEFAULT | "Saved" means the share sheet reported completion; cancel or failure marks nothing; "Last prepared" stays a courtesy date. If completion cannot be read, nothing is marked saved |
| C G5 | Keeping design | NS-22 content inputs | NONE | Round 1 B G-04 |
| C G6 | Keeping design | NS-22-R3 | DEFAULT | With one book: Quiet present, Hide absent |
| C G7, C W1 | Keeping design and words | NS-11 section 3; 14 J-N8 | DEFAULT | One name everywhere: "Save a copy"; the Me section is "Keeping your book"; J-N8 reads "the copy equals the one from Save a copy in Me" |
| C G8, C W3 | Keeping design and words | NS-07 C28 4.2 | DEFAULT | The ZIP's PDF row becomes "The book to read on screen, for each child, by month"; "printable" names only C28's file; README line follows in the same PR |
| C G9 | Keeping design | NS-08-R7; frame section 7 (no hint of a later version) | CARD | While backup is off, Where your letters live has no "Encrypted backup" row |
| C G10, C W13 | Keeping design and words | NS-08 door lines; D12 | DEFAULT | Built `offBody` and `sheetNotIncluded` are rewritten before any flip (`backup.withdrawBody`), counsel Q43; the flip is gated on it |
| C G11, C M-4 | Keeping design and motion | NS-12 section 4 | DEFAULT | Restore: no confirm, a toast, no Undo (it adds a version and deletes nothing). Remove: confirm with "Keep it" as default, no Undo |
| C G12 | Keeping design | NS-08 design inputs | DEFAULT | Five provenance states, including the built co-parent one |
| C G13 | Keeping design | NS-10-R4b | DEFAULT | The declined screen carries "Save a copy" and Delete account |
| C G14 | Keeping design | NS-11-R2 | DEFAULT | The slip window is the 7 days after the birthday (the card's default; the open point closes) |
| C M-2 | Keeping motion | NS-11 section 15; C28 4.6 | DEFAULT | Progress eases by `scaleX` over 200 ms, never backwards, steps under Reduce Motion, no indeterminate animation |
| C M-3 | Keeping motion | Frame section 4 slip rule | CARD | After a slip is dismissed, the next slip in the order shows at the next Home visit, never in the same visit |
| C M-5, C W12 | Keeping motion and words | NS-09 table ("Remove now fails again"); NS-09 section 5 | DEFAULT | VoiceOver re-reads the line and a short in-place line says the app will try again; no "we" ("The app will finish removing it.") |
| C M-6 | Keeping motion | NS-10 sections 4, 6 | DEFAULT | Letters that arrive while the parent reads appear in place: no entrance, no wash, scroll anchored, no count |
| C M-7 | Keeping motion | Frame section 4 (Me) | NONE | Whether Me is a lit room is a design call (CDO); no requirement |
| C M-8 | Keeping motion | NS-11 VoiceOver row | DEFAULT | One start line, announced once, from `content` |
| C W2 | Keeping words | C28 4.4 step 1 | DEFAULT | The printable section sits on Save a copy (C-S04), not "Me, then Export" |
| C W4 | Keeping words | NS-01-R32; registered `auth.sheet.bodies.*` | FOUNDER | The registered sign-in and consent bodies would change wording ("recordings and pictures") with photos on; they are agreement texts. Default: unchanged until counsel reads the new values; they change in the first build with photos on, never before (the label rule) |
| C W7 | Keeping words | NS-07 C28-18 | CARD | The printable book leaves private letters out, the same as the ZIP's PDF |
| C W10 | Keeping words | NS-10 section 5 "Declined" | DEFAULT | Declined lines say the book "stays in your account" and recordings are "on the phone that made them" (there may be no other phone) |
| C W11 | Keeping words | NS-10-R9 | CARD | "Account deleted on the other phone" shows the scheduled-deletion words with Cancel deletion during the 30 days, and the executing words once it runs; never "deleted" while it can be cancelled |
| C R-1 | Keeping reconciliation | NS-11 content inputs | DEFAULT | No export nudge card in Me; the nudge stays the footer on Save a copy, as built (one place, C G1) |

### Area D: Family, sharing and reminders

Round 1 ruled D G1 to G9 (MOTION). G-D01 equals D G2 and G-D22 equals D G6; both stand.

| Gap | From | Card row | Ruling | Requirement now |
|---|---|---|---|---|
| D G8 (round 1, open) | D design 12.2 item 8; S AUDIT 4.12 | NS-13 section 4 step 1 | DEFAULT | Closed: the reminder ask rises over the Book after the saved moment lands, as built |
| D G-D02 | Family design | NS-05 section 5 | DEFAULT | Sharing one's own private letter shows the same preview, no extra line |
| D G-D03 | Family design | NS-05 section 5 `share_temp_write_failed` | DEFAULT | Stay on the preview, show the line, turn the picture toggle off; the next Continue sends words only |
| D G-D04, D W-G2 | Family design and words | NS-13 section 12 | NONE (card holds) | Two equal answers, "Yes, evenings" and "No reminders"; "Change the time" is a quiet control on the rhythm line, not an answer. The build follows (BL-943) |
| D G-D05, D G-D08 | Family design | NS-13-R31, R13 | DEFAULT | The two-showings cap is per account on this phone |
| D G-D06 | Family design | NS-13 section 15 | DEFAULT | Me, Reminders hides the "Next" line when nothing of these classes is pending |
| D G-D07 | Family design and words | NS-13-R14; D1 | NONE | The sign-out sheet carries no reminders line: D1 fixes its words. Reminders still stop at sign-out |
| D G-D09 | Family design | NS-18 section 4 step 2 | DEFAULT | A typed day comes at the stored reminder time, default 20:30, even if reminders were never set |
| D G-D10, D W-G6 | Family design and words | NS-18 section 5 | DEFAULT | Today can be chosen while today's reminder time is still ahead; local codes `typed_day_empty`, `typed_day_past`, `typed_day_too_long` |
| D G-D11 | Family design | NS-18 section 5 | DEFAULT | With notifications not allowed, Save still works and one line says so, with no promise of delivery |
| D G-D12 | Family design | NS-25 section 5 | DEFAULT | Invite expiry shows in the app at peek (D-S15.error-expired); the static web page never claims it |
| D G-D13 | Family design | NS-18-R5 | DEFAULT | No counter; a paste over 80 is kept and Save shows one line ("That is as much as fits here.") |
| D G-D14, D W-G18 | Family design and words (named for Karma) | NS-18 section 10 (`typedDay.showWords`, PROPOSED) | DEFAULT | One switch per day, in that day's sheet, off by default; key `typedDay.<date>.showWords`. It matches the happy path, protects each day by default and costs only the key shape (BL-982) |
| D G-D16 | Family design | NS-25 section 4 step 5 | FOUNDER | Where the parent agrees to the shared book is an agreement step (Q48, Q49). Default: a separate agreement step whenever an agreement is recorded; Join alone only where no agreement row is required; counsel confirms before NS-25 ships |
| D G-D17 | Family design | NS-25-R4 | DEFAULT | After an undo, the other parent reads one neutral line once (D-S20) |
| D G-D18 | Family design | NS-18-R3; D3 | DEFAULT | Typed words stay hidden on the Lock Screen by default; the switch's help says the words show as typed and makes no claim about system summaries; counsel and CAIO read it. Whether iOS lets an app keep its notifications out of summaries is UNVERIFIED (`mobile`, BL-987) |
| D G-D19, D W-G1, E CG1 | Family design and words | NS-32 section 16 | DEFAULT | One neutral placeholder for every budgeted class, "Something for the book, whenever you have a minute."; plan notices "A reminder about your plan." No "note", no "tonight" |
| D G-D20 | Family design | NS-13 section 4 step 3 | DEFAULT | "Silent" means we set no sound; iOS settings decide |
| D G-D21, D W-G3 | Family design and words (named for Karma) | NS-13-R6a; NS-32-R12; NS-05-R6a reasoning | FOUNDER | The founder-approved title "A birthday today" tells anyone at the Lock Screen that it is the child's birthday, which NS-05 treats as an L4 fact. Default: with names off, the birthday notification uses the neutral title "Something for the book today"; the birthday wording shows only when the parent turned names on. CPrivO reads it |
| D W-G4 | Family words | NS-13 section 16 | DEFAULT | The birthday body no longer says "A year of letters" (a count-like claim); WORDS section 11's line |
| D W-G5 | Family words | NS-13-R10 | DEFAULT | Every evening line is tagged "before birth: yes or no"; when every included book is expecting, only "yes" lines are planned |
| D W-G7 | Family words (named for Karma) | NS-18 section 5 (PROPOSED) | DEFAULT | Typed days still come with Reminders off (the parent's own ask); Me, Reminders keeps "Days to remember" visible with the switch off and shows `remindersOffNote`. The PROPOSED tag drops |
| D W-G8 | Family words | NS-18 section 19 | DEFAULT | No "can come late" caveat on typed days |
| D W-G9 | Family words | NS-13 section 4 step 5, section 15 | NONE | Back-off stays silent (card); the tester question in NS-13 section 21 decides whether a static help line is ever added |
| D W-G10 | Family words | NS-25-R4 | DEFAULT | The undo sheet reuses `family.leave.cantTakeBack`, if engineering confirms against `undo_parent_join` and the pull path that letters already on the other phone stay; if the pull removes them, the line goes |
| D W-G11 | Family words | NS-25-R13; Q50 | NONE | No line on the Family page after 72 hours (card); the support runbook owns it (Q50) |
| D W-G12 | Family words | NS-05 OQ-6 | DEFAULT | The verb is "Share this letter"; `legal` reads it |
| D W-G14 | Family words | NS-07 C5 section 3.5 | DEFAULT | A quiet day's save error uses `notMuch.saveFailed`, not the "your words are safe" line (a quiet day has no words) |
| D W-G15 | Family words | NS-32-R12 | NONE | NS-32 already allows it: plan notices name Plus and nothing else of the plan (no price, allowance or Keep) and never merge with a reminder. The design brief's "no Plus in any reminder" covers the budgeted classes only |
| D W-G16 | Family words | NS-03 section 7 | DEFAULT | `{app}`, rendered from `packages/brand` |
| D W-G17 | Family words | NS-25 section 5 row 1 | DEFAULT | The link page says "{app} works on iPhone." (no "for now"); a claims inventory row |
| D V-1 | Family design vs v2 F1 | NS-07 C5 section 3.4, C5-6 | NONE (card holds; COMPONENTS F1 changes) | "A quiet day, kept." with Undo stays inline in place of the link, no timer, while Home stays. COMPONENTS F1 drops D-S21 from "Used by" |
| D V-2 | Family design vs v2 S1 | NS-13-R33; NS-32-R13 | NONE (card holds; COMPONENTS S1 changes) | Hidden previews show our neutral `hiddenPreviewsBodyPlaceholder` per category, not "Notification"; COMPONENTS S1 adds it. S1's grouping by book (`threadIdentifier`) is accepted |

### Area E: Foundations and system states

Round 1 ruled E K-1 to K-7 (from the motion file, K-EM1 to K-EM6). These are DESIGN.md K-E01 to K-E16, WORDS.md CG1 to CG14 and the reconciliation points.

| Gap | From | Card row | Ruling | Requirement now |
|---|---|---|---|---|
| E K-E02 | Foundations design | X4-R1; NS-10-R3 | DEFAULT | A signed-out phone holding books of two accounts shows the book of the account that signed out last; the other returns when its account signs in |
| E K-E03 | Foundations design | NS-35 and NS-10 low storage rows | CARD | Storage messages live on Listen (built full state) and in Me, Storage; never on Home or the Book (they would be unregistered slips) |
| E K-E05, E K-E15, E CG7 | Foundations design and words (named for Karma) | Round 1 E K-5 (NS-45); remote config `minSupportedVersion`; LEGAL-REQ-040 | CARD | No blocking update screen. "Update available" is one line in Me (`system.update.line`, `storeButton`), never on Home. "Update required" pauses only what needs the newer app: that feature hides itself (absent rule) and its row says "Needs the latest version of the app"; recording, reading and export never stop. Round 1 K-5 reads this way in NS-45. Files: COMPONENTS F2 drops "update required (becomes C8)"; E MOTION E-M56 is withdrawn (as E DESIGN 12 already says); S MOTION follows |
| E K-E06 | Foundations design and words | `errors.crash.body` | DEFAULT | Keep "safe on this phone" only when a book is on the phone; a fresh install gets `crash.bodyNoBook`; CCO checks the claims row |
| E K-E07, E WORDS G6 | Foundations design and words | `killSwitches.sync` (NS-10, NS-06, NS-09) | DEFAULT | While sync is paused, Me, Account, Sync reads "Paused for now", never "Waiting for a connection" |
| E K-E08 | Foundations design | NS-33-R4, R7 | DEFAULT | E-S02, E-S03, E-S08 and E-S10 join the AX5 device rows (BL-948) |
| E K-E09, E CG9 | Foundations design and words | F01, F14 cited rows | NONE | Only NS-10, NS-17-R1, NS-33, NS-35, D1, T2 and NS-38 to NS-45 (BL-994) change first run and Plus; any other F01 or F14 change needs a card. Product re-keys E's steps to NS ids when file 19 lands |
| E K-E10, E CG10 | Foundations design and words | none (C44 cites a region check) | DEFAULT | No in-app region check; availability stays an App Store Connect setting. If counsel names a list, the HOLD lines in E-S03.region are the draft; nothing is built now |
| E K-E11, E CG11 | Foundations design and words | F02 (cited) | DEFAULT | Send link and the code's Continue stay tappable; a tap says why (`authCopy.email.needEmail`, `authCopy.code.sixDigits`), shown and announced |
| E K-E12 | Foundations design | F01 (cited) | DEFAULT | The child's name is optional on every path; the cover reads "Letters to your child" until a name is added. Twins still need names to tell books apart |
| E K-E13 | Foundations design | NS-13 door lines ("Never: a second ask") | DEFAULT | Whichever notification ask comes first asks iOS; the other then shows only the result, never a second ask |
| E K-E14 | Foundations design | none (founder's "information collected") | DEFAULT | First run collects only: age yes or no and the agreement (phone), Apple identifier or email (server, verified by Apple or the link or code), acceptance rows (server), child name (optional), date, signs-as (phone, then synced). No phone number, password or parent's birth year. Privacy checks it against the label rows (D-157); no label change |
| E K-E16 | Foundations design (named for Karma) | NS-10 second-account row | NONE (card holds) | No block screen: account B lands on its own book (C-S10) or "No book here yet" with Start a book. E MOTION E-M57 is withdrawn (E DESIGN 12 already says so) |
| E CG3 | Foundations words | Registered consent and sign-in privacy lines | FOUNDER | "The family you invite" and "the people you invite" describe invites a store build does not offer while NS-25 is gated. These are registered agreement texts. Default: counsel replaces both with a line that names no invitation (draft: "Only you can read your letters, until you choose to share one.") |
| E CG4 | Foundations words | NS-10 Claims; `trust.signIn.why` | DEFAULT | Narrowed to the NS-10 claim (words follow you to a new phone); if `trust.signIn.why` is a registered line, counsel reads it under Q43 |
| E CG5 | Foundations words | VOICE "safe" rule; `billingCopy.plan.retry` | DEFAULT | "safe" leaves the billing retry line; if the line is an in-app disclosure row, `legal` reads the change |
| E CG8 | Foundations words | T1; site FAQ `site.en.ts:109` | FOUNDER | "Reading, playing your recordings, Read together and export are never locked away" is an open-ended public "never" that T1 forbids for Read together. Default: "Reading, playing your recordings, Read together and export are free." after counsel Q40 |
| E CG12 | Foundations words | glossary | DEFAULT | One door, the glossary verb "sign in" only; never "Sign up", "Create account" or "Log in" |
| E CG13 | Foundations words | none | DEFAULT | Google leaves `auth.noEmailHelp` while Google sign-in is off |
| E CG14 | Foundations words | LEGAL-REQ-002 | NONE | "I answered by mistake" stays, as built; counsel confirms under the existing gate |
| E R-1 | Foundations motion 11 item 1; S MOTION open 1 | NS-10, NS-34 (waiting states) | DEFAULT | Waiting states are still: they read by their words and the 10 s way forward; `Breathe` is retired. The lamp breath stays a named ambient exception, off under Reduce Motion and Low Power Mode (NS-34-R8), until the CDO decides |
| E R-2 | Foundations motion 11 item 2; S MOTION `m.progress.wait` | NS-33-R5; round 1 E K-1 | DEFAULT | A busy control shows its busy words at every setting and no indicator (one rule, one test). Round 1 K-1 widens from "under Reduce Motion" to every setting; S MOTION `m.progress.wait` changes |
| E R-3 | Foundations motion 11 item 3 | none | NONE | The first-run lamp dim and rise are a design system timing call (CDO): within the cap, or named in S MOTION section 5 |

### Design system v2 (system files)

| Gap | From | Card row | Ruling | Requirement now |
|---|---|---|---|---|
| S C-G1 | COMPONENTS 12 | VOICE.md; content rules | NONE | Sentence case stays for every parent-facing word, list section headers included |
| S C-R1 | COMPONENTS 9 (lens control) vs AUDIT G9 | NS-01-R48 (ChoiceGroup or ChipGroup) | NONE (card holds) | The lens choice is the house `ChoiceGroup segmented`: it stacks at AX sizes and has radio semantics; no native segmented control |
| S C-R2 | COMPONENTS 9 vs S MOTION T-ALERT | D1; C E12 | DEFAULT | Sign-out and Erase everything are `explained` sheets (a sentence and up to three choices); Delete and Let it go stay `simple` |

Design-system questions that carry no requirement and go to the CDO, not product: FOUNDATIONS Q1 (clear glass dim over bright photos), Q2 (radius change), Q3 (Bold Text in Devanagari), Q4 (Home tab symbol), Q5 (`material.solid` in dark and its Increase Contrast edge; also the 0.5 pt vs 1 pt hairline in D's reconciliation), Q6 (SF Symbols in content); S MOTION open 2 (`spring.standard` 0.30 s); COMPONENTS 12 G3 (tab bar on pushed Book screens) and G4, G5.

## Engineering gaps routed (round 2)

No new BL ids are allocated here. "New row needed" rows are taken in the next backlog PR (after errata E7, E9, E16's rows).

| From | Gap | Routed to |
|---|---|---|
| X NS17; A E-03; A WORDS 19 rows 2, 3 | NS-17 phone side: mark in every build, Undo, withheld and waiting states, push without words, Write the words, part-unwritten line only if a module reports it | New row needed (beside errata E7's server row) |
| X CS-2; E G-E02; D WORDS 16 last row | `LeaveLater` and `family.leave.later` (D-161) | BL-983 |
| X CS-3; E G-E01 | `familyCopy.soon.*` deleted; `flags.familyTeaser` default; "coming soon" and "in a later update" banned in the rules test | BL-983 (keys), BL-958 (flag), BL-965 (test) |
| X H-1; S ENG-M10; C M-E6; D M-E5, E6 | Trim `success` call sites to X H-1's three; `warning` on the confirming tap, not on open (`erase.tsx:78`, `recently-deleted.tsx:82, 104`); cancel invite takes `warning`; a test lists allowed call sites | New row needed (mobile) |
| A E-01 | Review's day line needs C6 Dateline (COMPONENTS R11) before BL-945 | BL-945 depends on the R11 row |
| A E-02 | Let it go on Review outside the short-take card | BL-926 |
| A E-04 | Review's photo-not-stored line | BL-931 slice 4c (#839) |
| A E-05; A EG-9 | Thumbnail while recording and on Home's waiting card; fixed box, fade on decode, fit not crop | BL-931 (#838), BL-956 |
| A E-06; B E-13; D E-D06; S COMPONENTS R10 | Writing tools off on Write, the words sheet, Firsts label, photo words, place, typed-day field | BL-962 |
| A E-08 | `killSwitches.signAsOther` (A G-18) | BL-980 and the ADR 0029 key list |
| A E-09 | Error catalogue has no code for a busy microphone | New row needed (mobile, error catalogue) |
| A E-10 | NS-01-R17b iCloud progress and Cancel: the plan's P-1 / BL-950 is not in BACKLOG | New row needed |
| A E-11; A EG-1; B E-10; B WORDS 22 BL-954 | Undo helper serves NS-17 and Firsts unmark too; toast and action expire together | BL-954 (scope gains NS-17-R5) |
| A EG-2; C M-E1; S COMPONENTS R2 | Switch Control state and `announcementFinished` for T4 (native read of `UIAccessibility.isSwitchControlRunning`) | BL-954, BL-984 |
| A E-12; A EG-10 | Switcher label (A G-04) and its 150 ms in-place cross-fade | BL-941 |
| A E-13 | `signAs.recent` and the draft's typed-name column | BL-980 |
| A E-14 | A take length limit | NS-04b only if the spike finds one is needed |
| A EG-3 | Listening idle breath opacity only | Round 1 design-systems token task |
| A EG-4; C E6; D M-E10; E G-EM1; S ENG-M8 | Low Power Mode hook (`expo-battery`) | Round 1 row with BL-984 (NS-34-R8); dependency size measured against D-065 in that PR |
| A EG-5, EG-6 | Pause and start glow fades | BL-984 |
| A EG-7, EG-8 | Another thought timing (`index.tsx`); Listen primer hand-off (`listen.tsx`) | New row needed (one small motion-fixes row, mobile) |
| A WORDS 19 row 1 | Voice Control input labels (`accessibilityUserInputLabels`, UNVERIFIED in RN) | BL-984 |
| A WORDS 19 | `sign_as_too_long` before Keep, counted as the database counts | BL-980, BL-957 |
| A WORDS 19 | Low-space and mid-recording space lines not traced to code | BL-958 |
| A WORDS 19 | `doorways` content group and SURFACES row | BL-971 |
| A WORDS 19; B WORDS 22; C W-E2; D WORDS 16 | Every PROPOSED and CHANGE key, one content PR, founder approvals listed | BL-965 |
| B E-05 | No route reads a hidden book (Hidden books list, read-only) | New row needed (with area C's C-S16), unless BL-985 takes it within size |
| B E-06, E-07, E-17; B M-E7 | BL-947 covers R1 to R3 only; R4 to R10; keep-awake 5-minute grace (errata E19); year ordinals; Read together presented as the sheet closes | BL-947 |
| B E-08; E G-E09 | `killSwitches.bookSearch` only on #798; `reminders` and the other proposed keys with tested hidden states | BL-952 PR 6; ADR 0029 rows |
| B E-09 | Lens choice is a tab list of Buttons in #840 | BL-956 |
| B E-11 | Past-letter slip needs the registry and the #721 reconcile | BL-963, BL-946 |
| B E-12 | `ListRow` stacked trailing value at AX sizes | BL-937 with design-systems |
| B E-14, E-15; B M-E1, M-E2 | `ChoiceGroup` no-haptic option; one list-swap helper with Months' place saved | BL-938, BL-956, BL-968 |
| B E-16; B WORDS 22 | `features/firsts.en.ts`, `features/seal.en.ts` with surface rows; appendix A scan in the rules test | BL-968, BL-970, BL-965 |
| B M-E3; B WORDS 22 | Find overlay motion; `find.en.ts` registered; drop duplicate retry and cancel keys | BL-952 |
| B M-E4 | Thumbnail fade only after mount; reserved box | BL-932, BL-956 |
| B M-E5 | Seal instant: no timer, no wash, slip exempt from enter | BL-970, BL-963 |
| B M-E6; B WORDS 22 | "Not today" exit and focus; no midnight swap; `tonight.resurfaced.*` deleted with the flag | BL-946 |
| B M-E8; B WORDS 22 | Value swaps in "This letter"; one row failure line (`en.letter.rows.saveFailed`) | BL-937 |
| B M-E9 | Firsts label field appears without `entering` | BL-968 |
| B WORDS 22 | `photos.en.ts` registered; missing iCloud and missing-picture keys | BL-931, BL-956 |
| B WORDS 22; C W-E1 | `children.quiet.*` keys before Quiet ships; `bookCopy` into `en.book`; "Go to a month" | BL-938, BL-985, BL-965 |
| C E1, E12; C W-E4 | Erase everything after sign-out on a synced phone; sign-out as an `explained` sheet; `signOutPictures` only with a picture | BL-961 |
| C E2 | `shareExport` must report completed vs cancelled (native activity result) | BL-942 |
| C E3 | Storage stuck-recording row (NS-09-R6) | BL-977 (scope gains NS-09-R6) |
| C E4 | NS-12 has no wave; `killSwitches.earlierVersions` | BL-979; ADR 0029 |
| C E5 | Print flag and kill switch not in the registry | BL-973; ADR 0029 |
| C E7 | `setChildQuiet` returns nothing; NS-22 failed row needs a result | BL-985 |
| C E8 | Delete account reachable in a declined-Terms session | BL-978 |
| C E9, E10 | `newPhoneLine.dismissed` and `copySlip.<child>.<year>` account-scoped | BL-978, BL-942, BL-961 |
| C E11; C W-E6 | Disk-full screens need the size as a formatted number, never logged | BL-942, BL-973 |
| C E13 | Provenance "not on this phone" clause for a pulled own spoken letter | BL-978 |
| C E14; E G-E07, G-E08; S COMPONENTS R11 | SlipCard, SystemLine, StateScreen `note` slot, Progress, Dateline | New row needed (design-systems), from COMPONENTS R11 |
| C M-E2; E G-EM2 | Moving spinners Reduce Motion does not stop; busy words (E R-2) | BL-984 |
| C M-E3 | Save a copy start announcement and eased progress | BL-942, BL-973 |
| C M-E5 | Book keeps the reader's place while letters arrive; no wash for a new phone's own letters | BL-978 |
| C W-E3 | Photo deletion paragraphs and the R32 key set with the first photos-on build | BL-931 |
| C W-E5 | Per-surface rule row for `backupCopy` before the flip | New row needed (at the NS-08 flip) |
| D E-D01 | Planner never reads `Child.quiet` | Already errata E16 (new row, lands with BL-985) |
| D E-D02, E-D03; D WORDS 16 | `hiddenPreviewsBodyPlaceholder` per category (support UNVERIFIED); thread ids; placeholders under the paths the rules test reads | BL-987 (fact), then BL-966 |
| D E-D04, E-D12, E-D14; D M-E9; D WORDS 16 | Tap router lands `typedDay` on Home; per-day `showWords` key; "Days to remember" visible with reminders off; typed-day line enters once | BL-982 |
| D E-D05; D M-E1, E2, E11; D WORDS 16 | Ask card on the system sheet, two answers and Change the time; cold-start read of the last notification response; opacity-only settings motion; evening pool tags; `notifications.birthdays`; `quietHelp` with R27 | BL-943, BL-965 |
| D E-D07, E-D09, E-D11, E-D15; D WORDS 16 | Undo-join control and keys; R16 scope line; link page App Store link and "{app} works on iPhone."; `joinFailed` mapping; `site.ts` is outside the rules test | BL-983 (and a rules-test scan of `site.ts` in BL-965) |
| D E-D08 | Share has no kill switch (export path); ADR 0029 must list the exception | ADR 0029; BL-939 |
| D E-D10, E-D13 | `ListRow` without `onPress` still has the button role; `NotificationPreview` into `components/ui` | design-systems, with BL-939 |
| D M-E3; D M-E12 | Plan notice cold start lands on Me, Plan with no visible push; no navigation while capturing (round 1 D G6) | BL-966, BL-943 |
| D M-E4 | `SWEEP_MS` typed in `join-ask.tsx` | Round 1 design-systems token task |
| D M-E7 | Quiet day hand-off timing (C5-13) and `tap` on Undo | BL-974 |
| D M-E8 | Preview stays mounted under the iOS share sheet (device check) | BL-939 |
| D WORDS 16 | `share.en.ts` registered | BL-939 |
| E G-E03; E WORDS G3 | `minSupportedVersion` consumer and the Me update line (E K-E05) | New row needed (platform, NS-45) |
| E G-E04; E WORDS G4, G5 | Under-1 GB line on Listen; stop reason when the phone fills mid-recording | New row needed (mobile); BL-929 records the run |
| E G-E05; E WORDS G2 | Every list filters by owner; the first-run gate never opens A's book for B | BL-961 |
| E G-E06 | `needsConsent` with no local book reaches the child step | BL-922 |
| E G-E10 | Bold Text faces | BL-984 (with FOUNDATIONS DS2-05) |
| E G-E11 | `accessibilityIgnoresInvertColors` on pictures and the lockup | BL-956, BL-984 |
| E G-E12; E WORDS G6 | Sync row has no paused value | BL-978 |
| E G-E13 | Plus gate decision local; StoreKit status cached | BL-929, mobile |
| E WORDS G7 | `SCSEL` not in `SQLSTATE_RULES` or chapter 02 | BL-969 |
| E WORDS G8 | Fresh-install variants of the crash and not-found bodies | New row needed (small, mobile with content) |
| E G-EM8, G-EM10 | Reduce Transparency not read; glass surfaces fade whole-view opacity | Design system v2 rows (S MOTION ENG-M2, ENG-M4, ENG-M7) |
| S AUDIT ES-A1 to A15; FOUNDATIONS DS2-01 to 15; S MOTION ENG-M1 to M15; COMPONENTS R1 to R13 | Design system v2 build rows, overlapping (for example DS2-10 = ENG-M3 = R1 = ES-A3) | New rows needed: product folds the four lists into one de-duplicated set under BL-993's follow-up in the next backlog PR |

## Errata rows these rulings need (if Karma accepts)

CARD rows on cards 01 to 12 and the frame, for `18-errata-after-lock.md` from E23: X H-1 (frame section 5), A G-04 (NS-14), A G-13 and A W9 and C M-3 (frame section 4), A G-16 (D2 list), A G-18 (NS-16 RR-5), A M-CG-2 (NS-33-R6), B W-G3 (NS-06-B5, B25), B V-1 (NS-21-R7b), C G1 (NS-08-R8), C G2 (D1 sheet; Erase everything), C G9 (NS-08-R7), C W7 (C28-18), C W11 (NS-10-R9), E K-E03 (NS-35, NS-10 low storage rows). E K-E05/K-E15 goes into `19-from-download-to-first-letter.md` (NS-45). DEFAULT rows add the stated default to their card row in the same errata PR.

Files outside product that change with these rulings (owner `design-systems` or the area leads): COMPONENTS A2, A3, N3, C1, C2, F1, F2, F6, S1; S MOTION `m.progress.wait`; E MOTION E-M56, E-M57; the GAP-LOG round 1 K-1, K-3 and D G8 rows.

product (for Karma)

### Karma's review of the round 2 draft (20 Nov)

Accepted as drafted, including the two changes to round 1 (K-1 busy words at every setting; K-3 success haptic only for a kept letter, a finished Save a copy and joining a book). FOUNDER rows go to the founder in one list with their defaults; until answered, the default is the requirement for design and build, never for a public text or a store submission. Further rulings taken while the design system finished:

- E motion decisions ruled by Karma: waiting states still (retire Breathe); busy words at every setting, no spinner; first-run lamp 280 ms (lamp.returnMs); tokens: loading.heldAfterMs 10000.
- Foundations rulings: Q2 radii approved; Q3 Devanagari letter text keeps Tiro Regular under Bold Text, UI Mukta SemiBold, stage 2 heavier serif; Q4 Home symbol house; Q5 dark fallback surfaceRaised, IC edge controlBorder, 1 pt; Q6 SF Symbols everywhere on iOS; Q1 clear glass contrast is a device row, symbols only until measured. Component conflicts from D: F1 drops quiet-day line and delete Undo timer; S1 own placeholder.
- COMPONENTS rulings: keep ChoiceGroup for the lens (radio semantics, stacks at AX sizes; NS-33-R3); confirmation split approved (native action sheet for simple, sheet for sign-out/erase and typed confirms); token names: target.md exists (48), layout.rowMin = size.row (52) in tokens.v2.json; components use size.row.

Karma

## Area D motion rulings (20 Nov)
- D-motion 1: no cover opening on joining a book. The system MOTION retires cover openings; use `cover.dissolveMs` and the plain arrival. The 800 ms move is dropped.
- D-motion 2: the waiting bar sweep (1400 ms) stays as the named `m.progress.wait` loop, off under Reduce Motion and Low Power Mode. The token is `progress.sweepMs`, not `motion.waitSweepMs`. Waiting states otherwise stay still.
- D-motion 3: no haptic on Continue in the share preview (outcome haptics only; NS-05-R22). D DESIGN D-S02 drops the `tap` line. Invite link sent: no haptic. Cancel invite: `warning`. Quiet-day Undo: `tap`. "No reminders" matches "Yes" (`tap`).
- D-motion 4: state names follow D DESIGN.md section 3; WORDS.md is renamed to match (mechanical).
- D-motion 5: engineering rows for BL-943 (reminder ask into `ui/sheet.tsx`, cold-start notification response), BL-966 (plan notice cold start, tap while Listen/Review/Write open), BL-974 (quiet-day timing readable by 100 ms), `progress.sweepMs` token.

Karma

## Area A motion rulings (20 Nov)
- A-motion 1 (CG-1, P-1): the idle breath changes opacity only, no scale (NS-34 wins over the built 1.05x). Engineering row with the lamp token work.
- A-motion 2 (CG-2): the record start tick is the start cue and VoiceOver's "Recording" announcement is made before the microphone opens; the stop is announced after it closes. Nothing is spoken while recording (NS-33-R6 read as before and after).
- A-motion 3 (CG-9): quiet-day Undo stays while Home stays (card C5 wins over the 10 s window in the standard). The standard's line is amended in the next MOTION pass.
- A-motion 4 (CG-6): a failed photo is silent, no sound and no error haptic; SOUND.md is amended.
- A-motion 5 (P-2 to P-5): accepted: name the VoiceOver wait in Keep; quiet-day lamp dim 280 ms (`lamp.returnMs`); list the remaining selection haptics; no glass morph from Home's buttons into the record control.
- Engineering rows: undo toast window (BL-954), Switch Control read (unverified in React Native, spike first), Low Power Mode read (ENG-M8), Another thought 360 ms to 150 ms cross-fade, microphone-blocked screens 200 ms fade, Listen's picture loads before a take can start.

Karma

## Area B motion rulings (20 Nov)
- B-motion 1: the lens plays `H-select` (system standard); gap G5 withdrawn, DESIGN E-14 dropped. Settings stay without a haptic, so the Quiet toast gets no `tap` (G10 withdrawn; DESIGN section 10 line changes).
- B-motion 2: the seal-opened line (B-S18) is drawn complete with no enter; DESIGN B-S18 layout line is corrected to match section 10 (G2).
- B-motion 3: the Book header settle and the end-of-book moon draw are retired; the moon is drawn complete. NS-24 wording "the existing end of the book" stays (card gap G12 logged for the errata).
- B-motion 4: proposals P1 (named list swap), P2 (picture viewer as a full-screen cover), P3 (Read together dusk on the 280 ms lamp timing), P4 (tint also covers the other parent's letters seen first time), P5 (inline bar on a scroll threshold): accepted into the system MOTION in its next pass.
- B-motion 5: `letter/[id].tsx` changeDate `haptic('tap')` removed (engineering row E9).

Karma

## Area C motion rulings (20 Nov)
- C-motion 1: system MOTION v2 accepted for area C: the breathing moon and Erasing drawings become still; the Book header does not settle; no haptic on starting an export, on Show again or on cancelling deletion.
- C-motion 2: busy states use a static label and never a spinner, in every area (stricter than v2; matches round 2 ruling "busy words at every setting"). v2 COMPONENTS drops the in-button system spinner.
- C-motion 3: card gaps accepted with their defaults: an undo window does not close while VoiceOver focus is on Undo; after the parent dismisses the Save a copy slip the next one waits for the next Home visit; letters arriving on a new phone appear in place with the scroll anchored; "Remove now fails again" gives a visible sign the tap landed (the line changes its words).
- C-motion 4: NS-10 wins over the 10 Nov new-phone spec: land on the Book with one line that more are on the way.
- Engineering rows: E2 spinners not stopped by Reduce Motion (account.tsx:264, delete-account.tsx:115; BL-984), E1 undo helper reads VoiceOver finish and Switch Control (BL-954, native read to be spiked), E5 Book keeps the reader's place while letters arrive (BL-978), E6 warning haptic after the choice, not on open (erase.tsx:78, recently-deleted.tsx:82 and :104).

Karma
