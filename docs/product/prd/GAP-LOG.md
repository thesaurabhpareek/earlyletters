# Gap log: design to product (from 20 Nov 2026)

Status: CURRENT | 20 Nov 2026 | Owner: Karma | Replaces: none | Load when: you need the ruling for an open question id (K, RV, CL, D, T, X ids).

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

## Function conflict rulings K1 to K10 (20 Nov, from FUNCTION-TRACE section 3a)
- K1: child name, birthday, due date, letter languages, first letter are L4 (DATA_CLASSIFICATION.md). The compliance input rows 13, 14, 16, 18 are corrected.
- K2: one Plus line string reusing the pinned "Reading, listening and your copy stay free"; the design WORDS "Recording, reading and export stay free" is withdrawn (not on the Terms 8.2 list).
- K3: pricing allowance rule fires at 500 first-time downloads with the 95% interval shown (D-125); F14 6.9's 1,000 is superseded.
- K4: deletion texts: legal's scope (four texts and a build-truth rule), privacy's retained-list on C-S20, support's Me-first entry; one key family in `packages/content`. The Free-plan restore line is ruled by counsel Q-note; default: say it plainly in Privacy 7.
- K5: store nothing on the Texas age signal until counsel Q46 answers (FR-CMP-15 over FR-PRV-25).
- K6: re-read the age rating at NS-05 Level 1 (cheap check), full re-answer at NS-25 and NS-05 Levels 2 and 3.
- K7: gate names: G0 to G6 stay the release gates (ops list); compliance evidence gates are renamed CG0 to CG6.
- K8: paid-tier triggers: ask the founder at 60% of a limit, move at 80%.
- K9: support's E-S27 and E-S28 are taken; use C-S23 and E-ST47.
- K10: country counts: privacy's storage rule is the source (daily count, 2 years); data's weekly k=10 view reads from it.
- FR-SEC-13 has no row: the security author fills or retires it in the next pass.
Karma

## IA audit rulings R-IA-1 to R-IA-6 (20 Nov, from docs/design/e2e/IA-AUDIT.md on docs/e2e-ux-20nov)
- R-IA-1: one age function with two named precisions (Home exact, Book months). What a parent sees does not change; the four wrappers and the duplicated month arithmetic (`chapters.ts:182`, `lib/reminders/tz.ts:131`) move into `packages/core` (engineering row).
- R-IA-2: one "Days" page for NS-18 typed days and the NS-46 library, in Me under a new "Notes and days" group. No second list.
- R-IA-3: slip, not strip. NS-50 is one more rank in the single Home slip slot (COMPONENTS C9); a strip of several items is a feed and is refused. The picture suggestion lives in the capture cluster. This amends section 5 of 20-founder-direction ("a strip").
- R-IA-4: the Me regroup (Notes and days; Storage under Keeping your book; App lock and Privacy under On this phone; Erase and Delete account last) is adopted for design, built only after tree test T1.
- R-IA-5: the religion and country question is a slip rank after the first letter and a row in Me > Days, pending founder Q-FD-2.
- R-IA-6: "Quiet this book" silences every budgeted note for that book (F12-REQ-011), its Home slips and its prompts. Audit says no reader of `setChildQuiet` was found in the planner (inference); mobile confirms, then a quiet-enforcement test (T6). Also confirm where NS-32's one-a-day budget is enforced before NS-46 and NS-48 add classes.
- Tests T1 to T6 (Me tree test, Save-a-copy confusion, slip vs strip, age line, month-arithmetic table, quiet enforcement) go into the research plan and test plan.
Karma

## Notification catalogue rulings (20 Nov, from functions/notification-catalogue.md)
- N-1 (Q-NTC-1): 6 variants per grid cell (one plan holds at most 11 evening nudges, each cell is visited about once); the founder's 8 to 12 applies to the day, season and last-letter layers. Launch floor about 128 variants, filled later in content drops.
- N-2: `occasion` returns only as a source of typed days, never as a new class (Q-FD-6 first half ruled yes). No class is added to the NS-32 registry.
- N-3 (Q-NTC-2): only public days (seasons, civic) may name themselves in a lock-screen title; family and faith days need "names in notifications" on.
- N-4 (Q-NTC-3): a visible body may mention the kind of the last letter; a title never does.
- N-5 (Q-NTC-7): zero exclamation marks. VOICE.md line 70 is corrected to match line 160 and the checker.
- N-6: the axis is days between the fire date and the newest made letter, not hours (every input must be known at plan time, iOS schedules up to 35 days ahead). Depends on NS-13's anchor and back-off, not yet built.
- N-7: content mines the existing 87 rows and 174 variants in docs/design/NOTIFICATIONS.md and docs/design/notifications/COPY_INVENTORY.md first; one text per variant with a `{child}` slot, one names switch (the separate "Show celebration names" switch is refused).
- N-8: evening-worded variants are dropped before 17:00 (day-part filter).
- Engineering: string `key` in the planner, untie name rotation from the 8 variants, a `lastMadeLetter()` reader; picture and first kinds fall back to the grid until NS-01 and NS-06 supply flags.
Karma

## Cultural background data rulings (20 Nov, from functions/cultural-background-data.md)
- CB-1: all of it is L4 (religion, country a family is from, the ticked days). Apple's label and GDPR Article 9 name religion and origin; counsel must confirm how they apply to data that never leaves the phone.
- CB-2: a chosen day is NOT a typed day. NS-18 says "Not in scope: recurring days, days the app suggests, syncing typed days" and deletes a typed day after delivery. This amends 20-founder-direction section 3.1: the library uses a separate yearly store that feeds the same planner slot and the same one-a-day budget (`libraryDay` source, not a new class; N-2 stands).
- CB-3: a library-day note opens a generic prompt, never a day-specific prompt key (`entries.prompt_key` syncs to the server at L2). A test compares the synced row to a control.
- CB-4: sign-out clears the store (as NS-13 and NS-18 do); the list is not in Save a copy, with a test that no phone-settings key leaks into the export.
- CB-5: lock screen: every library-day note shares one neutral body; the day's name shows only behind its own switch, default off and forced off while App lock is on, separate from `notifications.lockScreenNames`.
- CB-6: ask never in first run; after the first kept letter but not in the same sitting; once, "Not now" final for Home, Me > Days stays reachable. No "Eastern" option: "Another tradition" and "Not now" only; several traditions allowed; never prefilled from locale or storefront; country and tradition never suggest each other.
- FOUNDER (defaults): CUL-Q2 store only the ticked days and treat tradition and country as a browse filter forgotten when the sheet closes (recommended; if the founder wants stored fields every rule in the file still applies); CUL-Q4 keep this store out of the iPhone backup so "only on this phone" is true (else a longer call-out); CUL-Q10 when to ask; Q-FD-1 meaning of "East East".
- COUNSEL (need numbers from legal): export (Q5), GDPR Article 9 and US state rules for device-only data (Q6), Apple label answer (Q7), whether 4.5.4 applies to local notifications (Q11). App Review's view of an optional faith or origin question (5.1.1(iii)) found no source; fallback is a plain browse-and-tick list with no question.
Karma

## Days library rulings (20 Nov, from functions/days-library.md)
- DL-1 (R-FD-3): Memorial Day and Veterans Day are offered with the quiet tone, name only, never pre-ticked.
- DL-2 (Q-DAY-5): a birthday wins over a library day on the same date (amends the NS-32 priority list: birthday, then library day, then month, then evening; a typed day the parent typed still ranks first). Two ticked library days on one date give one note naming both after the tap.
- DL-3: authorities disagree on the same festival (Eid al-Fitr 2026: 20 or 21 Mar; Diwali 2027: 28 or 29 Oct; Buddha's birthday 2026 has four dates), so the data carries one row per authority and the parent picks or moves the date. Years no authority has published are not shipped; the picker says so calmly. No date is written from memory.
- DL-4: rule-based dates are computed on the phone, not copied from third-party tables; astronomical days are stored as a UTC instant and shown in local time, with Southern Hemisphere season names. Source licences: counsel must confirm before any table ships (FR-DAY-23).
- DL-5 (amends N-1): 4 variants per day and 3 per season (a day recurs once a year).
- DL-6 (Q-DAY-3): 09:00 local for a library day; one budgeted note a day still holds.
- DL-7 (Q-DAY-4): US-only national days at first, others when the founder names a country field in scope (founder).
- DL-8 (Q-DAY-9): a member of each tradition reviews its rows before ship.
- DL-9 (Q-DAY-12): "East East" may mean East Asian, a culture or origin group, not a religion; the founder confirms (Q-FD-1). The library offers Lunar New Year, Mid-Autumn and Norooz as culture-led days.
- DL-10 (Q-DAY-6): a tradition day's name on the lock screen only with its own names switch on (CB-5); privacy and counsel decide beyond that.
- Process note: the days agent's WebFetch was not approved, so it read sources with curl through the session proxy. The sources are public statutes, observatories and calendars, and no restricted site was bypassed, but the founder is told so he can say if he wants that route closed.
Karma

## Trace conflict rulings K11..K17 (20 Nov, proposed by product from FUNCTION-TRACE section 3a, adjusted by the ten NS-46..50 reviews; Karma decides, the founder only where marked)
- K11 (re-plan triggers and the recency anchor; partly ruled by N-6): rebuild the plan on first launch after a restore, on a time zone change and on a clock change; a rebuild on the same inputs gives the same set of (id, date, time, class). Adjustment from `mobile` (X7, FR-REL-54): the anchor is the newest made letter's `captured_at` date in the phone's zone, clamped so it is never after the plan date, not the letter's editable day, so a letter written today for an earlier day does not read as a long gap. Test rows: NS-48-R3 and NS-48-R23. N-6 stands. Decides: Karma. Founder: no.
- K12 (days library against the calendar pin; partly ruled by DL-3, DL-4): compatible if scoped. FR-LOC-11 and FR-LOC-12 govern display and age arithmetic (Gregorian, Western digits); the days module may use other arithmetic inside, every date it shows is Gregorian in Western digits (NS-48-R34 pins `{weekday}`, `{day}`, `{date}`), and the question is about which date, never a calendar conversion or the family's belief: "Dates differ by country. Which date should we use?" (`content` review F8). FR-LOC-11's `en-u-ca-*` test is scoped to display. DL-3 and DL-4 stand. Decides: Karma; the words are the founder's to approve (Q-FD-26).
- K13 (photos against privacy): (1) the in-memory suggestion title and date are class L4 until `privacy` rules otherwise (a title can name a place or a person), not L3; (2) the app deletes only its own copy of the suggestion file, and the suggestion folder joins the FR-PRV-34 Erase scan and the FR-PRV-10 canary; (3) the premise "only the chosen picture reaches the app" is wrong (see RV-12): the label and Notes for Review reasoning becomes "received in memory only, one photo kept, nothing sent"; (4) the title is stored only when the parent taps "Use this". Decides: Karma for (1), (2); the founder for the policy and Notes wording in (3), (4) (Q-FD-30), with counsel.
- K14 (print against finance and legal): take the earlier timing, the accountant settled before the first order; finance owns the run-cost register and adds print rows only when a partner quote exists; print publishes no price before then (FR-PRT-23); legal drafts a one-line Terms note for the free file now and the Print Terms only when FR-PRT-34 is true. Nothing here ships in 1.0 (FR-PRT-01). Decides: Karma for the order; the founder decides who sells (Q-PRT-2) and the money path (founder-only). No NS-46..50 review touched it.
- K15 (lifecycle against back-office on deletion, claim and hand acts): (1) a sole parent's book is exported only by the account holder's own phone or by a counsel-read process that hands over the Save a copy file the person already holds; no staff tool exports a book (FR-LCY-27 says so); (2) a deleted-elsewhere phone (FR-LCY-19) and a suspended account (FR-BKO-26) get two lines and two states; (3) a claim after deletion (FR-LCY-11) is parent-driven and never done by staff. Counsel confirms the death runbook (RUFADAA, none read). Decides: Karma; the founder only for Q-BKO-1 (default stays no hand merge).
- K16 (quality's 552 P0 rows against the register): 552 is stale. `qa` regenerates `14-test-plan.md` section 7 from all 23 function files and every card, prints the total, and does not publish 552. After this review round card 21 holds 87 P0 rows (counted by script in its Trace table), so the id total moves again. The 27 rows whose priority cell mentions P0 without starting with it are settled by their owners first. Decides: Karma and `qa`. Founder: no.
- K17 (two proposals for NS-17-R11): keep both. LOC-7 (no distress claim for another language until FR-LOC-18(a) holds) is NS-17-R11; AIS C03 (a compact-tier phone does not offer a language that passed only on the full tier) is NS-17-R12; FR links updated when card 10 is edited. Decides: Karma. Founder: no.
- Needing the founder among K11..K17: only the wording and policy sentences in K12 and K13 (what users are promised) and the seller question in K14.

## Review round 20 Nov (RV-1..RV-17; from the ten expert reviews of NS-46..50 in `tools/review/ns46-50/`)
Rule applied: GAP-LOG rulings stay binding. Where two or more reviews independently showed one too wide, ambiguous or factually wrong, it is not edited; the entry says what, why, evidence, the default applied in card 21 and who decides. Where reviews conflict the safer-for-privacy and simpler option is the default. "Karma" decides technical items; "founder" decides what users are promised, public words, analytics, money and one-way doors (Karma's founder-only list, `early-letters-cto` section 3). Every default holds until answered.
- RV-1 (N-3, public titles): what: "seasons, civic" lets some days name a family on a lock screen. Why and evidence: privacy F6, security F12, compliance C-02 (5 U.S.C. 6103 lists Christmas Day and Columbus Day; Apple lists religious belief as Sensitive Info). Default: `publicTitleOk` is a hand-listed allowlist (seasons, New Year's Day, Thanksgiving, Independence Day, Labor Day); every quiet day, observance and contested name is neutral; with App lock on every title is neutral (NS-46-R36). Decides: Karma; the founder for which days (Q-FD-18).
- RV-2 (N-4, last-letter kinds on a lock-screen body): what: kinds `small`, `first`, `picture` describe how a day went or what was attached. Why and evidence: privacy F16 (DATA_CLASSIFICATION rule 7 and item 4), marketing F4 (conflicts with NS-49-R3), content F1 (nine sample titles name a kind). Default: `spoke` and `typed` in the body only; `picture` dropped; `first` and `small` only with names on and App lock off; titles are generic (NS-48-R5, R29). Decides: Karma; the founder (Q-FD-29).
- RV-3 (R-IA-2 and R-IA-4 name the group "Notes and days"): what: "note" is the glossary word for what a person makes, never for what the app sends. Why and evidence: content F6, marketing F1, qa F-02 (BRAND.md lines 18, 92 to 93). Default: working title "Days and reminders" for tree test T1, "reminder" in every parent-facing string. Decides: the founder approves the words; `content` writes them (Q-FD-26).
- RV-4 (N-6, "iOS schedules up to 35 days ahead"): what: the sentence states a platform limit; the 35-day horizon is NS-13's own policy and the code schedules 92 days. Why and evidence: `mobile` M-22 (one review, with `scheduler.ts` and `planner.ts` evidence; Apple pages read did not state it). The ruling's decision (axis in days, known at plan time) stands. Default: cards say "NS-13's policy". Decides: Karma.
- RV-5 (conflict 7, rank of the Days ask): what: the ask above Save a copy puts an Attractive ask above a trust slip. Why and evidence: product PR-05 (frame principle 2), design-systems F47-7. Default: order (1), (2), (2b), (3) Save a copy, (3b) the Days ask, (4) past letter; capped at two showings (NS-50-R5, NS-47-R31). Decides: Karma; T3 may move it (Q-FD-23).
- RV-6 (conflict 5, one way or two for a library day on Home): reviews conflict: product PR-19 keeps two renderings, `mobile` M-08 and design-systems F50-1 want one. Default (simpler and carries no arrival state): the slip, however the parent arrives; the cost, a higher slip hides the day until the next visit, is accepted (NS-50-R4). Decides: Karma (Q-FD-25).
- RV-7 (quiet day on Home): NS-46-R13 showed an ordinary prompt under a quiet line while NS-50 showed none; design-systems F50-5. Default: the quiet line replaces the prompt block (NS-46-R13, NS-50-R15). Decides: the founder (Q-FD-24).
- RV-8 (CB-5 covers library days only): a faith day typed through "Add a day" would follow the child-name switch. Evidence: compliance C-04 (NS-18-R3, `09-capture.md:999`), content F4. Default: all day words follow `notifications.dayNames` (NS-47-R37); needs an NS-18-R3 errata row. Decides: Karma.
- RV-9 (reminders off, first permission ask, E K-E13): reviews converge on a day-only gate plus one ask at the first tick (marketing F3, `mobile` M-05, product PR-16, compliance C-01) but differ on the denied case. Default: day sources have their own gate, the one iOS ask follows the first tick after one sentence, a denied phone sees no Days ask. Decides: Karma confirms K-E13; the founder for the consent wording (Q-FD-20, Q-FD-21).
- RV-10 (DAY-R remote pause): reviews conflict: marketing F5 wants a per-layer pause, product PR-04 and `mobile` M-09 show it is not deliverable servers-off and needs wiring. Default (simpler): one boolean `killSwitches.libraryDays`, fail-open, outside `mayRun`, vocabulary and ADR 0029 change; per-layer hold waits for Drop C. Decides: Karma (Q-FD-15).
- RV-11 (R-IA-6, "confirm where the one-a-day budget is enforced"): answered by `mobile` M-01, qa F-05, product PR-03: nowhere; `budget.ts` is a hard prerequisite (NS-46-R30). Decides: Karma.
- RV-12 (FR-PHS-54 and K13, "only the chosen picture reaches the app"): wrong. Evidence: privacy F19, security F1, compliance C-13 (Apple: the system shares the chosen suggestion with its items). Default: "The phone makes the list. Only the suggestion you choose goes to the app, and the app uses only its picture" (NS-49-R16). Decides: the founder, with counsel, because it is a user promise.
- RV-13 (placement of the day-name switch): on the Days page rather than Reminders. Evidence: product PR-10, design-systems F47-6. Default: Days page (NS-47-R14). Decides: Karma.
- RV-14 (NS-48 "last chosen key" setting): removed; the variant is a pure function of the cell and `slotOrdinal`. Evidence: `mobile` M-02 (churn on every store write), security F14 (backup holds an occasion key). Decides: Karma.
- RV-15 (priorities): reviews conflict: product wants fewer P0, qa wants more. Default: legal or store duties and promises are P0 (NS-47-R17, R18, R25, R10, R24, NS-46-R26, NS-49-R17 go to P0 (b) or (a)); NS-48-R8 and NS-46-R13's latency half are P1; NS-46-R28 stays P1. Decides: Karma.
- RV-16 (measures): the tester sheets asked per-tradition dates, per-variant retirement and tester-run level 2 trials, which the research rules and five parents cannot support (product PR-11 to PR-13, analytics A-46-1, A-48-2, qa). Default: stop lines not pass lines, one report retires a variant, level 2 by a founder device walk (NS-46 section 21, NS-48-R17, NS-49 section 21). Decides: Karma with `user-research`.
- RV-17 (release cut): the pack had no line between 1.0, build 13 and 1.x (product PR-01). Default: drops A, B, C in card 21 "Release line and cut". Decides: the founder (Q-FD-7).
- Process note: the compliance review fetched the Apple Developer Program License Agreement (a 640,000 character public page) and 5 U.S.C. 6103 with curl through the session proxy because the fetch tool reads only the first 100,000 characters; both pages are public and no restricted site was bypassed. Three other fetches (gdpr-info.eu, eur-lex.europa.eu, opm.gov) were not approved and not retried. The founder is told so he can say if he wants that route closed, as for the days agent's earlier note.

## Round 2 founder direction 20 Nov (RV-18..)
Source: `26-founder-direction-photos-library-and-media.md` (the founder's words, 20 Nov, second round). Cards: `27-photo-moments-and-media.md` (NS-51, NS-52). Rule applied: an earlier ruling is not edited; each reversal is recorded here with evidence and who decides. "Founder only" marks what Karma may not decide (promises, money, one-way doors). Every default holds until answered; none is a decision in `DECISIONS.md`.
- RV-18 (level 3, library read access, was closed in 1.x): what changes: `20-founder-direction-20nov.md` 6.1 and Q-FD-4 ("level 3 never in 1.x"), NS-49 section 3 item 3, NS-49-R25 and R26, the NS-01 never-line about the photo library, `12-parked-and-not-built.md`. Now: specified in full as NS-51, flag off, drop C, spike first. Evidence: `26` section 1 table, row 1. What does not change: dates only (default), on the phone, no faces, no upload, no count. Decides: the founder (it changes what we promise about the library); Karma and `security` for the module and scans. Founder only: Q-PM-1, Q-PM-7, Q-PM-9.
- RV-19 (video, was refused: NS-01-R22 and OPP-16 "not recommended"): evidence: `26` section 1 row 2; `functions/feature-opportunities.md:107` gave the reasons (heaviest data, label, counsel, storage), which become rows and gates of NS-52 rather than a refusal. Decides: the founder for limits, Plus and sync (Q-PM-2, Q-PM-3, Q-PM-4, Q-PM-10); counsel for any path that leaves the phone (X2, Q45, Q48, Q54). Founder only: Q-PM-2, Q-PM-3, Q-PM-4.
- RV-20 (one picture per letter): evidence: `26` section 1 row 3. Now: up to 6 pictures and 2 videos as proposed defaults, a local migration 12 for `entry_media.kind` and order. Decides: the founder on the numbers; Karma on the schema.
- RV-21 (the honest-wording rule RV-12 and the label reading "not collected"): holds only while NS-52 Variant A (phone only) holds; under Variant B the label becomes Photos or Videos collected and the where-it-lives lines change in the same build. Decides: the founder with counsel (a promise to parents).
- RV-22 (the lock-screen words, founder example against RV-2): the founder's example "Some pictures from the weekend are here" names pictures on a lock screen; RV-2 and DATA_CLASSIFICATION rule 7 argue against describing what was attached. Default: neutral words that never mention pictures on the lock screen; the picture wording inside the app, or with names on and App lock off (NS-51-R11, Q-PM-9). Decides: the founder. Founder only.
- RV-23 (X2 and E23 for media under Variant B): a child's picture or video leaving the phone still needs the `security` read and the counsel read first; no own-share-sheet exception is written. Decides: unchanged (founder only to grant an exception; not asked).
- RV-24 (new classes): none. The moment nudge is a ranked source inside `evening` (NS-32-R5 still has no `occasion` class); the ticked-day store of NS-46 is read in memory only. Decides: Karma.
product (for Karma)

## Closures 20 Nov (council pre-kickoff debate; one line per closure group)

Status: CURRENT | Owner: Karma | Replaces: none | Load when: you need the ruling for an open question id. Source of truth: Project doc `infra/exec-rulings-2026-11-20-pre-kickoff-debate.md` (Part 2 closure table; 113 grouped rows, CL-001 to CL-113: 79 RULED, 32 FOUNDER, 2 EVIDENCE; CL-114 to CL-134 were added the same day for engineering's pack delta, quality, design delta and the 37 questions, each pointing to its errata row). This section points; it does not restate the debate. Founder, 20 Nov: "Go with all default answers. Focus on what's best for customer experience. And proceed to lock all requirements and once done inform harness and engg leads working on architecture" (`FOUNDER-MESSAGES-VERBATIM.md` item 33). So every FOUNDER row is FOUNDER-ANSWERED: default accepted; where the default needs his hands the decision is made and the action is pending (listed once, in `22-final-holistic-spec.md` section 7). Where two defaults conflict, customer experience wins (his tie-break).

Overlap rule: where an id sits in a wider and a narrower group (for example Q-NTC-12 in CL-040 and CL-054, PQ-6 in CL-081 and CL-082, RQ-2 in CL-073 and CL-074, Q-A2 in CL-035 and CL-104), the narrower group governs. Part 1 prose of the source says Drop A holds cards 46, 47, 48 floor and 50; the closure row and card 21 govern (A is NS-48 phase 1; NS-49 level 1 moved to B, CL-015, errata E31).

- CL-001 (OQ-1..4 (02-find); Search scope, raw_transcript, result count, 3-char floor): CLOSED 20 Nov: Active book only; no raw_transcript search; no count; floor stays until a pack passes its gate. Applied: card 02 (already closed 20 Nov).
- CL-002 (OQ-1..3 (04-spike); Spike engineer, phones, plist change): CLOSED 20 Nov: mobile for 5 days; lab phone plus SE 3 on Asha account; no plist or entitlement change. Applied: card 04; founder sets start date (not a question).
- CL-003 (OQ-1 (01-photo); Date chip in first photo release): CLOSED 20 Nov: No; waits for BL-843 spike. Applied: card 01.
- CL-004 (OQ-2..4 (01-photo); Second phone, photo start, lens place): CLOSED 20 Nov: Closed 20 Nov as written. Applied: none.
- CL-005 (OQ-1,2,3 (07); Proof-book spend, label guard, branch cites): FOUNDER-ANSWERED 20 Nov, default accepted: No spend (money is his); label guard built by security-architect; cites replaced next backlog PR. Applied: card 07 sec OQ.
- CL-006 (OQ-4 (07); Page size before proof books): CLOSED 20 Nov: 8.5 x 8.5 in, marked provisional. Applied: card 07 C28-16.
- CL-007 (OQ-1..6 (05-share); Level 1 timing, footer, version, picture default, tab, verb): CLOSED 20 Nov: Level 1 after NS-01 on TestFlight and Q45 read; no footer; Book version; picture off; no tab; "Share this letter". Applied: card 05.
- CL-008 (OQ-1..4 (03-pilot); Pilot principle, reads, thank-you, notes retention): CLOSED 20 Nov as a default that stands (founder acceptance pending, in the digest in 22 section 7): Accept principle; no pilot before reads; thank-you message only; notes 30 days, consent records 12 months. Applied: card 03.
- CL-009 (Q-FD-1; East East): FOUNDER-ANSWERED 20 Nov, default accepted: No such option; Add a day and Not now; show in plain words first (departure from 842). Applied: card 21; shown to founder in Q7 ask.
- CL-010 (Q-FD-2; When Days ask shows): FOUNDER-ANSWERED 20 Nov, default accepted: Later sitting after first kept letter, once; Not now final (departure from 842). Applied: card 21 NS-47; same ask.
- CL-011 (Q-FD-3; Mother, Father, Memorial, Veterans Day): CLOSED 20 Nov: Offer all four never pre-ticked; Memorial and Veterans quiet. Applied: card 21, days-library.
- CL-012 (Q-FD-4; Level 2 now, level 3 never 1.x): FOUNDER-ANSWERED 20 Nov, default accepted: Reversed by direction 26; see Q2: spike in Build 13 behind flag, ship 1.1. Applied: cards 49 and 51.
- CL-013 (Q-FD-5; Faith and country on phone, ticked days only): FOUNDER-ANSWERED 20 Nov, default accepted: Yes phone only, ticked only; part of 842 departures ask. Applied: card 21 NS-46.
- CL-014 (Q-FD-6; Reopen occasion and on this day): CLOSED 20 Nov: occasion as source only; on this day stays with NS-23 and NS-31. Applied: card 21.
- CL-015 (Q-FD-7; Which drop ships when): CLOSED 20 Nov as a default that stands (founder acceptance pending, in the digest in 22 section 7): A with Build 13; B only if gates close before freeze; C after 1.0 approved; NS-49 L1 moves to B because it depends on NS-01 which stays dark. Applied: card 21 release line; card 22 sec 4.
- CL-016 (Q-FD-8; More opportunity cards): CLOSED 20 Nov: None before S2 first-run evidence; OPP-01 is NS-49, OPP-03 cheapest next. Applied: card 21; feature-opportunities.
- CL-017 (Q-FD-9; Tradition reviewers): CLOSED 20 Nov: Nothing ships without a recorded reviewer; no "all traditions" claim. Applied: card 46; days-library.
- CL-018 (Q-FD-10; Owner of October date review): CLOSED 20 Nov: Founder accountable on paper, content reads, scheduled issue in September. Applied: card 46 NS-46-R24.
- CL-019 (Q-FD-11; Journaling Suggestions entitlement approval): FOUNDER-ANSWERED 20 Nov, default accepted: Account step: mobile enables on test App ID, founder files if Apple needs a request; approval UNVERIFIED; decision made, action pending founder hands (Apple entitlement request if the portal needs one). Applied: card 49; Q7 hands batch.
- CL-020 (Q-FD-12..14; Sign-out clear, backup exclusion, day-name switch): CLOSED 20 Nov: Clear with one calm line; exclude from backup and read back; separate switch on Days page, cannot return by itself. Applied: card 46 NS-47.
- CL-021 (Q-FD-15; Remote pause for library): CLOSED 20 Nov: One boolean killSwitches.libraryDays, fail-open; ADR 0029 vocabulary change by mobile. Applied: kill-switches.ts, ADR 0029.
- CL-022 (Q-FD-16, Q-DAY-4; Countries after US): CLOSED 20 Nov: US only in first release; second country named by founder later. Applied: card 46; days-library.
- CL-023 (Q-FD-17, Q-DAY-8; Regional days in first release): CLOSED 20 Nov: Not in first drop; after tradition review exists. Applied: card 46.
- CL-024 (Q-FD-18; Days naming themselves on lock screen): CLOSED 20 Nov: Hand-list of seasonal days only; neutral under App lock. Applied: card 48 publicTitleOk.
- CL-025 (Q-FD-19, Q-DAY-3; Day reminder time): CLOSED 20 Nov: Fixed 09:00 local; listing words fixed. Applied: card 46.
- CL-026 (Q-FD-20, Q-FD-21; iOS ask on first tick; reminders off): CLOSED 20 Nov: Ask once after one sentence; ticked days send with consent line. Applied: card 46, area D.
- CL-027 (Q-FD-22; Planning horizon): CLOSED 20 Nov: 366 days within the 60 note ceiling; say plainly app opens once a year for far days. Applied: card 46.
- CL-028 (Q-FD-23; Rank of Days ask): CLOSED 20 Nov: After Save a copy, before past letter, retired after two showings; T3 measures. Applied: card 47, area A.
- CL-029 (Q-FD-24; Quiet day Home): CLOSED 20 Nov: Quiet line replaces prompt block; Speak and Type stay. Applied: card 50; Q-D-7.
- CL-030 (Q-FD-25; One slip one place): CLOSED 20 Nov: Yes. Applied: card 50.
- CL-031 (Q-FD-26; Words): CLOSED 20 Nov: reminder not note; Days and reminders; Days you added / chose. Applied: WORDS.md.
- CL-032 (Q-FD-27; Catalogue playfulness): CLOSED 20 Nov: Yes Fri and Sat; Mon and Sun small. Applied: card 48.
- CL-033 (Q-FD-28; No marketing shows faith day): CLOSED 20 Nov: Yes; ask never called a religion question. Applied: store and site copy.
- CL-034 (Q-FD-29; Last-letter kinds on lock screen): CLOSED 20 Nov: spoke and typed in body not title; picture dropped; first and small only with names on. Applied: card 48.
- CL-035 (Q-FD-30, Q-PHS-5, Q-A2, Q-B2; Apple title saved without tap): CLOSED 20 Nov: Never without Use this; once taken it is the parent's own words, no marker; privacy may reverse. Applied: card 49-R9.
- CL-036 (Q-FD-31; Picture start menu): CLOSED 20 Nov: Menu only where level 2 exists. Applied: card 49.
- CL-037 (Q-FD-32, Q-PHS-1, Q-PHS-2; iOS floor, level 2 timing): CLOSED 20 Nov: Keep 17.0 and hide below 17.2; level 2 after NS-01 on TestFlight. Applied: card 49.
- CL-038 (Q-FD-33; Phones for device rows): FOUNDER-ANSWERED 20 Nov, default accepted: Borrow; waive only what is missing, never for a lost letter; founder's device time; decision made, action pending founder hands (borrow phones). Applied: card 49 device sheet.
- CL-039 (Q-FD-34; journal word vs DPLA 3.3.3(H)): CLOSED 20 Nov: Keep BRAND ban; store name carries it (D-139); 3.3.3(H) read this session applies to Journaling Suggestions API only. Applied: card 49; tools/review/ns46-50 C-14.
- CL-040 (Q-NTC-1..13; Notification catalogue grid): CLOSED 20 Nov: 6 variants per cell; public days only; kind in body not title; one names switch; zero exclamation marks; floor at freeze; moment nudge in evening pool, 1 in 7 days, none after day 35. Applied: notification-catalogue.md.
- CL-041 (Q-NTC-5, Q-NTC-8, Q-NTC-9; Variant effect, floor, corrected age): CLOSED 20 Nov: Hypothesis only; floor at freeze; age the Book shows. Applied: card 48.
- CL-042 (Q-PHS-3; Entitlement need): FOUNDER-ANSWERED 20 Nov, default accepted: Same as Q-FD-11; decision made, action pending founder hands (Apple entitlement request if the portal needs one). Applied: card 49.
- CL-043 (Q-PHS-4, Q-PHS-6, Q-PHS-7; Apple notifications, places, level 3 spike): CLOSED 20 Nov: Second step P2; no places or workouts; spike in Build 13 only per Q2 ruling. Applied: card 49.
- CL-044 (Q-PHS-8..11; Limited library, Live Photo, cellular, screenshots): CLOSED 20 Nov: Limited first; still only; follow phone setting; not filtered. Applied: photos-and-suggestions.md.
- CL-045 (Q-QA-3, Q-QA-4, Q-AN-3, Q-AN-5, Q-AN-6; Stale table, 60 cap, ask order, analytics narrowing, Home seconds): CLOSED 20 Nov: Scheduled September issue; nearest 60 kept; reminder prime then Days ask then analytics; narrowing yes; median under 1 s. Applied: card 46, 47, 50.
- CL-046 (Q-PM-1; Limited or full library): CLOSED 20 Nov: Limited first; full only if parent picks it. Applied: card 51.
- CL-047 (Q-PM-2; Caps 6 pictures 2 videos 60 s 100 MB): FOUNDER-ANSWERED 20 Nov, default accepted: ASSUMED, no price read; all free while phone-only (cost $0); Plus gate only if Variant B. Applied: card 52; finance.md.
- CL-048 (Q-PM-3, LQ-13, PQ-13, Q-SUP-15, Q-FIN-P1, Q-FIN-P2, Q-A11 base; Do media sync): FOUNDER-ANSWERED 20 Nov, default accepted: Variant A phone only; B only after X2 security read plus counsel read; other parent sees no pictures. Applied: card 52; privacy label unchanged under A.
- CL-049 (Q-PM-4, AQ-13, Q-B16; Transcribe video sound; captions): CLOSED 20 Nov: No; compliance reads WCAG point. Applied: card 52.
- CL-050 (Q-PM-5, AQ-14, Q-LOC-10; Place names): CLOSED 20 Nov: Off; no place read. Applied: card 51.
- CL-051 (Q-PM-6, AQ-12; Image analysis beyond metadata): CLOSED 20 Nov: None; date and count only. Applied: card 51.
- CL-052 (Q-PM-7; Release drop for photo moments): CLOSED 20 Nov as a default that stands (founder acceptance pending, in the digest in 22 section 7): Drop C; spike first. Applied: card 21.
- CL-053 (Q-PM-8, Q-MSG-13, Q-REL-P3; Background refresh): CLOSED 20 Nov: No; moments appear when app opens. Applied: card 51.
- CL-054 (Q-PM-9, Q-MSG-11, Q-NTC-12, Q-D-R2; Lock-screen wording for moments): FOUNDER-ANSWERED 20 Nov, default accepted: Founder's example vs neutral; default neutral line, revisit with App lock off and names on. Applied: card 51; area D.
- CL-055 (Q-PM-10, Q-PRT-P1; QR to video page): CLOSED 20 Nov: No; counsel, finance, print partner answer in writing first. Applied: card 52.
- CL-056 (Q-PM-11, Q-PRT-P3; Trim or pick a still): CLOSED 20 Nov: No trim in 1.x; parent-chosen still for print only, parked with print. Applied: card 52.
- CL-057 (Q-PM-12; Pause empties index): CLOSED 20 Nov: Yes. Applied: card 51.
- CL-058 (OQ-1 (feat-opp); Which two of five opportunities): CLOSED 20 Nov: OPP-01 and OPP-03; OPP-02 after NS-04 result. Applied: feature-opportunities.
- CL-059 (OQ-2, OQ-3, OQ-5, OQ-6 (feat-opp); Doorway study, OPP-04, OPP-09, slot rule): CLOSED 20 Nov: Demand question only; prompt set only; hold; separate rule same one-slip limit. Applied: feature-opportunities.
- CL-060 (OQ-4 (feat-opp); Child voice in a letter): FOUNDER-ANSWERED 20 Nov, default accepted: Counsel Q45 and Q48; parked until read; decision made, action pending founder hands (counsel engagement). Applied: counsel batch.
- CL-061 (OQ-7..9 (feat-opp); OPP-20 23 24, OPP-21 22, year file): CLOSED 20 Nov: OPP-20 and 23 as row changes; OPP-24 with NS-52; park 21 and 22; file only, print parked. Applied: feature-opportunities.
- CL-062 (Q-MSG-1, Q-MSG-2, Q-MSG-8, Q-MSG-9; DMARC, reply provider, email fonts, Time Sensitive): FOUNDER-ANSWERED 20 Nov, default accepted: dmarc@ stage 1; provider that signs; fonts off; no Time Sensitive; liveness UNVERIFIED; decision made, action pending founder hands (DMARC record and hello@ and dmarc@ mailboxes). Applied: Q7 hands batch.
- CL-063 (Q-MSG-3, Q-MSG-5; Invite email, deletion page): FOUNDER-ANSWERED 20 Nov, default accepted: No invite email; build /delete-account from counsel's draft; counsel must confirm; decision made, action pending founder hands (counsel engagement). Applied: counsel batch.
- CL-064 (Q-MSG-4, Q-MSG-12, Q-MSG-14; Billing push, moment Home slip, share extension): CLOSED 20 Nov: Dropped for v1 local notice only; no; no. Applied: messaging doc.
- CL-065 (Q-MSG-6, Q-MSG-7, Q-MSG-10; Reply time, marketing URL, clipboard): FOUNDER-ANSWERED 20 Nov, default accepted: Within 2 working days only if a person reads daily; home page once claims checked; paste on tap only; UNVERIFIED. Applied: Q7 hands batch.
- CL-066 (Q-BKO-1, Q-BKO-2, Q-BKO-3, Q-BKO-4, Q-BKO-5, Q-BKO-6, Q-BKO-7, Q-BKO-8; Back office accounts, keys, safety): FOUNDER-ANSWERED 20 Nov, default accepted: No manual merge; no published time; no second person; counsel second reader; two offline key copies; alias abuse@; decision made, action pending founder hands (two offline key copies, abuse@ alias, counsel second reader). Applied: Q7 hands batch and counsel batch.
- CL-067 (Q-BKO-P1..P3; Hosted-media hold, quota line, duty to report): FOUNDER-ANSWERED 20 Nov, default accepted: No hold; quota yes or no; hosted media waits for counsel; decision made, action pending founder hands (counsel engagement). Applied: counsel batch.
- CL-068 (Q-S1, Q-S2; Hidden book Save a copy; owner check): CLOSED 20 Nov: Owner check then Save a copy only; keep as built; export never gated. Applied: risk-security.md.
- CL-069 (Q-S3, Q-S10; Pen test spend): FOUNDER-ANSWERED 20 Nov, default accepted: Yes before first non-family person stores letters on server; scope incl storage if B; decision made, action pending founder hands (pen test spend). Applied: Q7 money.
- CL-070 (Q-S4; Bot check on email send): CLOSED 20 Nov: Turnstile before public TestFlight link. Applied: risk-security.md.
- CL-071 (Q-S5, Q-S6, Q-S7; Breach notice law, wrong adult join, co-parent removal): FOUNDER-ANSWERED 20 Nov, default accepted: Support case with 72 h undo; Terms 72 h only; counsel must confirm; decision made, action pending founder hands (counsel engagement). Applied: counsel batch.
- CL-072 (Q-S8, Q-S9; Signed URL life; video metadata): CLOSED 20 Nov: 5 minutes; refuse video in share and print until spike lists fields. Applied: risk-security.md.
- CL-073 (RQ-1..RQ-11; Research recruiting, incentive, recording, sequence): CLOSED 20 Nov: Warm intros no paid tool; thank-you only; no recording; relay via parent; moderated on founder phone Asha only until G0; sessions run by founder or named human. Applied: research-validation.md.
- CL-074 (RQ-2, RQ-7; Incentive spend, payment duty): FOUNDER-ANSWERED 20 Nov, default accepted: Thank-you only; counsel and accountant must confirm any payment; decision made, action pending founder hands (counsel and accountant engagement). Applied: counsel batch.
- CL-075 (RQ-3..RQ-6, RQ-12, RQ-14; Recording, relative, retention, expecting parent, diary, consent text): FOUNDER-ANSWERED 20 Nov, default accepted: Defaults stand; counsel must read before any contact; decision made, action pending founder hands (counsel engagement). Applied: counsel batch.
- CL-076 (RQ-8, RQ-13, RQ-15; Review marking, founder library, image stand-ins): CLOSED 20 Nov: Excluded from studies; his choice; generated set with test licence (counsel confirm). Applied: research-validation.md.
- CL-077 (LQ-1; Alpha families move or stay): FOUNDER-ANSWERED 20 Nov, default accepted: Default: tell them before build; founder gift decision; decision made, action pending founder hands (tell the alpha families, gift decision). Applied: lifecycle doc; Q7 hands batch.
- CL-078 (LQ-2, LQ-3, LQ-4, LQ-5, LQ-6, LQ-11, LQ-12, LQ-14, LQ-16, LQ-17; Import, export split, iPad, iOS floor, window, rewrap, Apple-only email, video backup, iPad moments): CLOSED 20 Nov: No import; split before pictures on; iPhone only; iOS 17 floor; current plus previous wire; byte for byte; ask security later; not excluded until measured; absent until a device row passes. Applied: lifecycle-and-platforms.md.
- CL-079 (LQ-7, LQ-8, LQ-9, LQ-10; Alpha overage, hand-on, death, inactive accounts): FOUNDER-ANSWERED 20 Nov, default accepted: Defaults stand; counsel must confirm; decision made, action pending founder hands (counsel engagement). Applied: counsel batch.
- CL-080 (LQ-15; Removed parent and pictures): FOUNDER-ANSWERED 20 Nov, default accepted: No in-app access after removal; counsel Q48; decision made, action pending founder hands (counsel engagement). Applied: counsel batch.
- CL-081 (PQ-1..PQ-12; Privacy open points): FOUNDER-ANSWERED 20 Nov, default accepted: Defaults stand (writes stop on withdrawal; keep due date with Clear; counsel items PQ-1 2 3 4 5 7 8 9 10 11 12); decision made, action pending founder hands (counsel engagement). Applied: counsel batch.
- CL-082 (PQ-6; Clear due date): CLOSED 20 Nov: Keep with Clear control in Me. Applied: C-S15 spec 13.1 (OQ-10 area C).
- CL-083 (PQ-14, PQ-16, PQ-17; Video backup, library fields, other parent pictures): CLOSED 20 Nov: Videos excluded only if size becomes support issue; date and type only; no, letter says picture exists only on author phone. Applied: privacy.md.
- CL-084 (PQ-15, PQ-18; Hosted media clock, child video leaving phone): FOUNDER-ANSWERED 20 Nov, default accepted: Same clock as letters; flag off until counsel reads; decision made, action pending founder hands (counsel engagement). Applied: counsel batch.
- CL-085 (Q-DAY-1, Q-DAY-5, Q-DAY-7, Q-DAY-13, Q-DAY-14; Tones, birthday clash, variants, line, label): CLOSED 20 Nov: Stand; birthday wins; 4 per day 3 per season; no picture line; date label only. Applied: days-library.md.
- CL-086 (Q-DAY-2; Memorial and Veterans Day): CLOSED 20 Nov: Offer both quiet, never pre-ticked. Applied: days-library.md.
- CL-087 (Q-DAY-6, Q-DAY-9; Day name with names on; religion reviewer): CLOSED 20 Nov: One switch and one plain line; no tradition without member reviewer. Applied: days-library.md.
- CL-088 (Q-DAY-10, Q-DAY-11; Source licence, ticked days as special category): FOUNDER-ANSWERED 20 Nov, default accepted: Compute dates; phone only; counsel must confirm; decision made, action pending founder hands (counsel engagement). Applied: counsel batch.
- CL-089 (Q-DAY-12; East East as East Asian): FOUNDER-ANSWERED 20 Nov, default accepted: Culture group not religion; same plain-words ask as Q-FD-1. Applied: Q7 ask.
- CL-090 (Q-REL-1, Q-REL-2, Q-REL-4, Q-REL-5, Q-REL-6; Recovery time, backup copy, status host, second contact, phone): FOUNDER-ANSWERED 20 Nov, default accepted: Accept days; monthly second copy; static page on second provider; second route; borrow; decision made, action pending founder hands (monthly second backup copy, second-provider status page, second contact route, borrow a phone). Applied: Q7 hands batch.
- CL-091 (Q-REL-3, Q-REL-7, Q-REL-8, Q-REL-9; Key holder, restore notice, Vercel plan, age stop clock): FOUNDER-ANSWERED 20 Nov, default accepted: One adult sealed sheet; incident message only; confirm plan (UNVERIFIED); compliance reads; counsel must confirm; decision made, action pending founder hands (sealed key sheet holder, Vercel plan check, counsel engagement). Applied: counsel batch.
- CL-092 (Q-REL-P1, Q-REL-P2, Q-REL-P4; Codec, Live Photo motion, cellular upload): CLOSED 20 Nov: H.264 with cap from Q-PM-2; still only; no unless parent allows. Applied: reliability.md.
- CL-093 (AQ-1, AQ-3, AQ-4; Speech bars, whisper stop, Check this mark): CLOSED 20 Nov: Accept F05 bars; not numeric until measured; no Check this mark in 1.0. Applied: ai-and-speech.md.
- CL-094 (AQ-2, AQ-10, AQ-11; Languages, server transcription, model mirror): CLOSED 20 Nov: English only until gate; no server path (X2); mirror yes, cost inside budget. Applied: ai-and-speech.md.
- CL-095 (AQ-5..AQ-9, AQ-15; Model terms, EU AI Act, biometric law, child test voice, accuracy claim, face groups): FOUNDER-ANSWERED 20 Nov, default accepted: No child in test sets; no accuracy claim; face groups not built; counsel must confirm; decision made, action pending founder hands (counsel engagement). Applied: counsel batch.
- CL-096 (AQ-16; Around a birthday label): CLOSED 20 Nov: Calendar fact, wording by content, tested by RT-10. Applied: ai-and-speech.md.
- CL-097 (Q-PRT-1..Q-PRT-13, Q-PRT-P2, Q-PRT-P4; Printed book): CLOSED 20 Nov as a default that stands (founder acceptance pending, in the digest in 22 section 7): No print in 1.0; file free; entity, partner, price, tax, Mail Order Rule parked until go/no-go; counsel and accountant must confirm each then. Applied: print-and-fulfilment.md; no ask now.
- CL-098 (Q-LOC-1..Q-LOC-9; Languages and localisation): CLOSED 20 Nov: Spanish first then one at a time; Devanagari for Hindi; English prompts until reviewed set; English frame; native reviewer per language; clinician gate per language; permission string English; Gregorian only. Applied: languages-and-localisation.md.
- CL-099 (Q-SUP-1, Q-SUP-2, Q-SUP-3, Q-SUP-4, Q-SUP-12, Q-SUP-16; Support reads, time, language, retention, subject, restore): CLOSED 20 Nov as a default that stands (founder acceptance pending, in the digest in 22 section 7): Support never reads; no public time; English only; 12 months; no version in subject; no restore. Applied: support.md.
- CL-100 (Q-SUP-5..Q-SUP-11, Q-SUP-13, Q-SUP-14, Q-SUP-17, Q-SUP-18; Emergency, co-parent evidence, UGC, non-user removal, executors, billing, age stop, 0.9.0 pages): FOUNDER-ANSWERED 20 Nov, default accepted: Defaults stand; counsel must confirm; 0.9.0 pages not live until sentences changed; decision made, action pending founder hands (counsel engagement). Applied: counsel batch.
- CL-101 (Q-DAT-P1..P3, Q-NS-1; Analytics permission state, tester question, cost totals, C1 week): CLOSED 20 Nov: Never in analytics; one fixed question; totals only; extend C1 under 10 families. Applied: data-and-measurement.md.
- CL-102 (Q-OPS-P1, Q-OPS-P2, Q-OPS-P3; Media backup, pause drill, reporting duty): CLOSED 20 Nov: None until decided; drill once per key; blocks hosted media until counsel reads. Applied: operations.md.
- CL-103 (Q-FIN-P3, Q-FIN-P4, Q-FIN-P5; Spend cap, iCloud line, accountant A10): CLOSED 20 Nov as a default that stands (founder acceptance pending, in the digest in 22 section 7): Cap on uploads wait; one plain line; before storage-linked Plus change. Applied: finance.md.
- CL-104 (Q-A1..Q-A12; Area A capture): CLOSED 20 Nov: Defaults stand (ask above prompt unless SE 3 check fails; fold waiting set; accept; one card shape; three thumbnails; 6/2/60; added order). Applied: A-capture/DESIGN.md sec 13.
- CL-105 (Q-B1..Q-B18; Area B book): CLOSED 20 Nov: Defaults stand; Q-B15 resolved by Q-PM-3 Variant A (file held on phone). Applied: B-book-and-reading/DESIGN.md.
- CL-106 (OQ-1..OQ-14 (area C); Area C trust): CLOSED 20 Nov: Defaults stand; OQ-13 and OQ-14 follow Q-PM-1 and Q-PM-3 defaults. Applied: C-keeping-and-trust/DESIGN.md.
- CL-107 (X1..X7 (area C); Contradictions): CLOSED 20 Nov: Cards win on behaviour (CR-66); X2 no block screen per K-E16 and FR-SEC-04, counsel reads naming-method wording. Applied: C DESIGN sec 15; FR-LCY-10 errata.
- CL-108 (Q-D-1..Q-D-10, Q-D-R1..R4; Area D reminders): CLOSED 20 Nov: Defaults stand; Q-D-4 neutral lock title; Q-D-R2 follows Q-PM-9 (founder). Applied: D-family-sharing-reminders/DESIGN.md sec 15.
- CL-109 (X-1, X-10; Level 3 permission string and E-S28 guard): CLOSED 20 Nov: Guard gets photos string only when NS-51 ships behind flag; E-S28 stays until then. Applied: E DESIGN; card 51.
- CL-110 (X-2..X-9; Area E contradictions): CLOSED 20 Nov: Follow cards (first Keep haptic per system MOTION, refused-region as StateScreen, name optional, F2 variant removed, slip above prompt, K2 Plus line, E-S30/31 assigned, E-ST67). Applied: E DESIGN sec contradictions.
- CL-111 (X-11; killSwitches vocabulary): CLOSED 20 Nov: mobile adds libraryDays and signIn to kill-switches.ts and ADR 0029. Applied: kill-switches.ts.
- CL-112 (K11..K17 (ns46-50); Leftovers): EVIDENCE checked 20 Nov (grep of K11..K17 against cards 46..50): K11 and K13 are carried in card 21 (re-plan anchor and the photo-title class), CLOSED. K12 (Gregorian and Western digits pin for days), K14 (print timing), K15 (deletion and hand acts), K16 (stale 552 P0 count) and K17 (NS-17-R11 and R12 are absent from card 09, which stops at R10) were ruled above in this file and are now carried into the cards in place (20 Nov): K12 in NS-48-R34 (card 21), K14 in NS-30 (card 10), K15 after NS-45-R18 (card 19) with a pointer after NS-10-R14 (card 08), K16 in `14-test-plan.md` section 7, K17 as NS-17-R11 and R12 (card 09); CLOSED. No locked-card statement was wrong, so no errata row (highest stays E32). Applied: GAP-LOG.md.
- CL-113 (22 master list (rest); Items not repeated above): EVIDENCE checked 20 Nov (diff of card 22 section 7 against the closure table): every Q id in the old master list is in a closure row above; the only unmatched row was the counsel list, which is F6. CLOSED. Section 7 is now the F1..F8 residue plus the founder hands list. Applied: card 22 sec 7.
- CL-114 (engineering pack delta, #931 to #933, section 4 items 1 to 12; 20 Nov): RULED 20 Nov by product, Karma for class D: one answer per item in `18-errata-after-lock.md` E34 to E42 (reversal scoping, migration after 11 per CR-64, six-rank slip order, NS-51-R6 index file, one flag set, deny-list scope, R20b order, writing-tools default branch, R16 layer) and in place for the rest (NS-48-R11 already says the migrated eight keep named titles; NS-47-R6 against R7 B1; typed days stay in `settings` with one list on screen; paths and ids; card 19, 21 and 27 status lines). Founder items unchanged, defaults kept (Q-PM-1 to Q-PM-12 are FOUNDER-ANSWERED defaults). Applied: cards 01, 06, 08, 10, 11, 21, 27, handoff 24, function files.
- CL-115 (engineering quality items, 20 Nov): RULED 20 Nov by product: NS-36-R4 and R6 titles added; NS-09-R4b title fixed; NS-32-R4b, R7 and the ceiling line say 60 in total (E13 applied); NS-33-R14 reads E17 (applied); NS-33-R16 layer stated honestly (E42); writing-tools rows testable (E41); the 23 quality-catalogue P0 GAP rows and the perf profile have proposed backlog rows BL-129, BL-132, BL-138, BL-139, BL-162, BL-163, BL-168, BL-254, BL-287, BL-290, BL-299, BL-327, BL-329. Applied: cards 08, 11, 01, 10, 06; `docs/BACKLOG.md`.
- CL-116 (engineering design delta C-01 to C-10, `docs/engineering/readiness-20nov/experience/DESIGN-DELTA.md` section 1; 20 Nov): RULED 20 Nov by product with the customer-experience tie rule: C-01 the picture sits above the words (cards 01 and 10 already say so; engineering's TDD 10 C2 and #839 change, not the card); C-02 timed undo windows as the cards say (T4, NS-01-R38a to c, NS-33-R15), one clock owned by the toast that removes the control and refuses Undo at the same moment; C-03 busy words at every setting, no spinner; C-04 first run E-S08 keeps the cover opening as one 280 ms dissolve with no hold beat, and joining a book has none; C-05 Tiro stays Regular under Bold Text (E17); C-06 six slip ranks (E36); C-07 the toast keeps its Close control; C-08 "Start from a photo" is third and quiet; C-09 "Go to a month" stands (card NS-22 s3 and the area B words already say it); C-10 the area flags follow the cards (pass-through list answered where product owns it). Applied: design area files and system files on `docs/e2e-ux-20nov`.
- CL-117 (NS-38 drop for first-run; engineering question on #934, errata E43): RULED 20 Nov by Karma with product, founder-only default that stands (release content), in the founder digest: Drop D, its own stack after wave 1 and Drop A, before any family outside the founder's signs in. Applied: card 21 drop table, card 19, `22` section 4, `23` section 1b.
- CL-118 (NS-52-S10 names; NS-52-R10 room check; engineering question on #934, errata E44): RULED 20 Nov by Karma with product: `position` and a poster name derived from the media id (B1); 200 MB floor before the copy and twice the smaller of the video's bytes and 100 MB plus 50 MB after the size is known, both PROPOSED; nothing partial remains. Applied: card 27.
- CL-119 (NS-47-R38, R37, R14 (days on the lock screen); engineering question on #934, errata E45): RULED 20 Nov by Karma with product, reading B on all three: one fixed neutral body with no `{child}` (key `days.lock.body.neutral`, PROPOSED); all day words follow `notifications.dayNames` (NS-18-R3 edited); the day-name switch shows whenever a ticked or typed day exists, default off. Applied: cards 21 and 09.
- CL-120 (FR-CMP-16 withdrawal control; engineering question on #934, errata E46): RULED 20 Nov as a default that stands (counsel-adjacent, in the founder digest): `mobile` reads `privacy.tsx` before the first-run consent PR merges; product's read says no withdrawal yet, so one P0 row (NS-42-R17) is added. Must be true before anyone outside the family signs in. Applied: card 19.
- CL-121 (NS-40-R9 region hook outage; engineering question on #934, errata E47): COUNSEL-ONLY default that stands, in the founder digest: File 28 as written (fail open, counted); the hook stays off until counsel and the CCO answer; a refusal is never shown as an outage or the reverse. Applied: card 19.
- CL-122 (NS-01-R36 sweep; NS-01-R61 bucket; engineering question on #934, errata E48): RULED 20 Nov by Karma with product: R36 holds until NS-52 ships, then "unless NS-52-R40" (a missing file keeps its row); the refusal migration and bucket test are a new row owned by `data-architect`; R61 reads "closed once BL-870 merges". Applied: card 01.
- CL-123 (X4-R1 what B sees; engineering question on #934, errata E49): RULED 20 Nov by Karma with product: B's screens show nothing about A; the D1 sign-out line is addressed to A at sign-out only; both built as written. Applied: card 08 and the frame.
- CL-124 (NS-40-R7 age signal; engineering question on #934, errata E50): RULED 20 Nov by Karma with product: the card wins (CR-66); no `age_signal` is stored or sent. Applied: FR-PRV-25 and the last criterion of BL-577.
- CL-125 (NS-42 notice at collection; engineering question on #934, errata E51): RULED 20 Nov by Karma with product: one new P0 row (NS-42-R18), words PROPOSED and founder approves; until then the first-run build ships the links (R14) and no notice text. Applied: card 19.
- CL-126 (NS-37 budgets and video; engineering question on #934, errata E52): RULED 20 Nov by Karma with product: NS-37 stays as locked until NS-52 ships; dependent rows marked "if NS-52 ships"; 150 MB (Book with 300 pictures) and 120 MB (without) are two named numbers; no budget loosened. Applied: card 11.
- CL-127 (NS-34 sample count and text; engineering question on #934, errata E53): RULED 20 Nov by Karma with product: hand runs record 20 samples per metric marked `[stand-in]` and never green; 200 samples once markers exist; the run uses invented text only (B1). Applied: card 11.
- CL-128 (FR-SEC-06 owner check; engineering question on #934, errata E54): RULED 20 Nov by Karma with product: Delete account has no owner check (typed word, 30-day undo, emails are the guards); Erase everything has it. Applied: `functions/risk-security.md`.
- CL-129 (FR-QAL-02 trace ratchet target; engineering question on #934, errata E55): RULED 20 Nov by Karma with product: the locked cards first (00 to 16 at the merged pack), then card 19, 21, 27 and the function files as each merges. Applied: `functions/quality.md`.
- CL-130 (NS-40-R8 a No at the age step; engineering question on #934, errata E56): RULED 20 Nov as a default that stands (legal text is the founder's; in the founder digest): a No sends nothing, writes no server row and takes no policy act (the phone keeps ageGate.stoppedAt, NS-40-R3); BL-580 stays deferred; Terms 2.1 and Privacy 8 aligned later. Applied: card 19.
- CL-131 (Days ask flag; NS-46-R25 pause; engineering question on #934, errata E57): RULED 20 Nov by Karma with product: no new flag, the ask rides on `EXPO_PUBLIC_DAYS` and is absent when rank 3b is not registered; a paused family gets no day notes. Applied: card 21.
- CL-132 (NS-45-R13, R14, R17 and Built today; engineering question on #934, errata E58): RULED 20 Nov by Karma with product: R13 and R14 as written, the feature-hiding hook exists and nothing reads it; both deletion emails are sent by the purge worker (B1 on the Built-today text) and R17 is a test and a deployment check. Applied: card 19.
- CL-133 (NS-44 O-13 allowance per phone; engineering question on #934, errata E59): RULED 20 Nov as a default that stands (a promise to a user; in the founder digest): per phone, as the card; FR-LCY-13 edited. Applied: card 19 and `functions/lifecycle-and-platforms.md`.
- CL-134 (Engineering's other asks (3b to 3e); engineering question on #934, errata E60): RULED 20 Nov by Karma with product: the product layer carries no tactical ids; BL ids for new rows use four digits from BL-1000 only after PR #912 merges, until then none; E34 to E42 already carry Plan delta lines and new rows do; one counsel list at `docs/engineering/readiness-20nov/security/SECURITY-OPEN-QUESTIONS.md` (PR #915); the founder says which devices he holds. Applied: `18-errata-after-lock.md`.
