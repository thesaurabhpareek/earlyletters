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

Karma
