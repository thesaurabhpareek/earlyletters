# Design rulings of 20 Nov 2026 (rulings 25 to 37) and how the area files carry them

Source: Karma with product, on engineering's 37 questions, standing founder delegation ("go with all default answers, focus on what's best for the customer"). Rulings 1 to 24 are product-card rulings; this file records the 13 design ones (25 to 37) and the three product rulings that area D draws (3, 13, 21). Rule used: where the proposed answer shows less, stores less or can be undone, take it.

Author: `design-systems`. Changes no card. Every value below is a ruling default that stands until the Chief Design Officer (CDesO) or the founder says otherwise; none is a founder-final word. Timing and token numbers are not set by any prototype in this folder (ruling 37).

How to read the table: Owner is who builds or approves. Revert is the smallest step that undoes it. Screens are the area screen ids whose drawing or numbers it touches.

## 1. Design rulings 25 to 37

| No | Question | Ruling | Owner | Revert | Area screens touched |
|---|---|---|---|---|---|
| 25 | DS2-03 radii | Approve the v2 radii. One token PR with before and after screenshots (Home, Book, letter page, first run, light and dark) for the CDesO to approve on the PR. | `design-systems` (token PR), CDesO approves, `mobile` builds DS2-01 to DS2-11 on it | Revert the one token file | Every screen that draws a card, sheet or button corner. Named in the screenshot set: A-S01, B-S01, B-S08, E-S01 to E-S08. The prototypes keep today's 14 and 20 as layout references only |
| 26 | MOTION-OPEN-2 spring | Adopt 0.30 s for `spring.standard` (439 / 38.5). Re-run the timeline tests. One device clip of the card-to-page carry. | `design-systems` (token), `mobile` (ENG-M1) | Revert one constant (back to 0.40 s, 260 / 30) | Every `m.move`, `m.zoom` growth, `m.pageTurn` arrival and own sheet: A-S01 slip close-up (MA-48), B-S01 to B-S08 (B-M24 card to page), B-M39, B-M57, E-M list close-ups. Nothing in this pack moves over 300 ms on a spring now |
| 27 | NS-01-R41 frame | Add one semantic token `mediaFrame`: dark `#716A62`, light keeps `line`. Pair tests. Contrast 3:1 or better. R41 names the token; no card word changes. | `design-systems` (token and tests), `mobile` (PhotoFrame) | Remove the token; the frame falls back to `line` | A-S06 thumbnail (Ready with a picture), A-S07 and A-S16 thumbnails, B-S02 list thumbnails, B-S08 letter page pictures, B-S11 viewer, D-S02 share preview thumbnail |
| 28 | FOUNDATIONS-Q1 glass dim | Build `GlassSurface` with the dim as a token at 35 percent. DS2-12 measures on the Asha set and the CDesO picks 35 or 45 from the numbers. | `design-systems`, `mobile` (DS2-07), CDesO decides the number | Change the token value (35 to 45) | Every control that floats over a picture: A-S06, A-S07, B-S08 viewer, B-S11, B-S26, A-S16 sheet |
| 29 | NS-33-R1 heading level | Ship the heading trait and reading order, assert the trait in a unit test, record the level from a VoiceOver rotor read on a device marked [stand-in]. The row stays partial until that read. | `mobile`, `design-systems` (reads the rotor on a device) | None needed (no behaviour change for VoiceOver users) | B-S08 (dateline heading 1, "This letter" heading 2) and every screen whose reading order names a heading |
| 30 | FOUNDATIONS-Q5 fallback | `glassFallback` `#282421`, `line` high-contrast edge, 1 pt hairline. Contrast pair tests in `tokens.test.ts` decide. | `design-systems`, `mobile` (DS2-07, DS2-11) | Swap the token to `surfaceRaised` with `controlBorder` HC | Every glass surface under Reduce Transparency, iOS earlier than 26 or Increase Contrast (all five areas' glass tables) |
| 31 | MOTION-OPEN-1 lamp | Keep the lamp as the one named ambient exception: opacity only, off under Reduce Motion, Reduce Transparency, Increase Contrast and Low Power Mode. Retire `Breathe` in waiting states (they are still). | `design-systems`, `mobile` (ENG-M13 retirements, ENG-M1) | Retire the lamp loop in the same token file (`lamp.*`) | A-S01 (Home), A-S05 to A-S07 (lamp leaves and returns), B-S01 cover band, B-S19, C-S01 (Me, unlit), C-S10 and C-S19 (still drawing), E-S08 first run, E-M09 and E-M10 |
| 32 | COMPONENTS-G3 tab bar | No change from today. Tab screens keep the bar; the letter page is a pushed route and hides it as built (apps/mobile/src/app/_layout.tsx:229). The T-MIN device spike decides minimising. No bottom toolbar (N3) is drawn on the letter page. | `design-systems`, `mobile` (ENG-M3) | Hide it later with the toolbar, one layout PR | B-S08 letter page and the Book; every screen on a tab root |
| 33 | MOTION-OPEN-3 haptic | Trim the success haptic to the call sites MOTION section 9 allows, with a test that lists them. The first Keep keeps its single success (NS-44-R12). | `mobile` (ENG-M10, 1 to 2 PRs), `design-systems` (the list) | Restore a call site by adding it to the test list | A-S13 (Keep), C-S04 and C-S05 ready, E-S08 (open book: none), E-S10 (Plus on: none), E-S18 lock offer (none), C-S16 Show again (none), C-S20 cancel (none) |
| 34 | FOUNDATIONS-Q4 Home glyph | Keep `moon.stars` for Home behind one mapping-table entry. Re-test whether people find Home in first-run testing. | `design-systems` | Change the one table row | The tab bar on every tab root (Home, Book, Me) and E-S08 |
| 35 | FOUNDATIONS-Q6 icons | Chrome only, as v2 COMPONENTS says. Content keeps its own marks. Phosphor stays as the fallback behind the `Icon` wrapper. | `design-systems`, `mobile` (DS2-09) | Keep Phosphor everywhere; no code change | Every screen glyph. Area files that name a Phosphor glyph (D-S01 Export, E-S14 info line) stay valid |
| 36 | OQ-H1 slip height | No reserved height. The slip enters with `m.enter.group`. A device row on an iPhone SE 3 decides; if the prompt block jumps, reserve the height. | `mobile` (Days PR B14), `design-systems` (device row) | Reserve the height in one layout change | A-S01.dayToday, .dayTodayTwo, .dayTodayQuiet (MA-01, MA-48), D-S11 |
| 37 | MOTION-ACCEPTANCE-8 timing source | `docs/design/system/MOTION.md` and `tokens.v2.json` are the only timing source. The `MOTION-PROTOTYPE.html` pages and `PROTOTYPE.html` pages here are layout references. | `design-systems` | None | All five MOTION.md and MOTION-PROTOTYPE.html files. The E lamp loop (9000 ms) and spinner (800 ms) in the E prototype are layout stand-ins and are not specs |

## 2. Product rulings area D draws

| No | Ruling | Where area D draws it |
|---|---|---|
| 3 (NS-47-R38) | Reading B. The neutral lock-screen body for a title with a day name is a fixed string with no `{child}` in any switch state. PROPOSED key `days.lock.body.neutral`. Test stays P0. | D DESIGN G-D26 and open conflict 4; D WORDS `days.lock.body.neutral`; section 5.4 `libraryDay-neutral` and `libraryDay-named`; D-S10 lock-screen rows |
| 13 (NS-47-R14) | Reading B. The day-names switch shows on the Days page whenever a ticked or typed day exists. Default off. | D DESIGN G-D24 and the switch table; C-S24 |
| 21 (NS-46-R25) | A paused family gets no day notes. | D DESIGN J-D66 and J-D67 |

## 3. What changed in the area files

- A: `MOTION.md` (spring 0.30 s, lamp as the named exception, haptic list), `DESIGN.md` (frame token, Home glyph, slip height row).
- B: `DESIGN.md` (frame token in every hairline line, tab bar line, heading trait row), `MOTION.md` (spring and lamp lines).
- C: `MOTION.md` (lamp, `Breathe`, haptic lines).
- D: `DESIGN.md` and `WORDS.md` (no `{child}` in the neutral body; switch and pause lines), `MOTION.md` (frame token).
- E: `DESIGN.md` section 14a (all 13 rulings, one line each), `MOTION.md` (lamp, `Breathe`, spring).
- Prototypes: layout references only (ruling 37). Public-name, quote and radius fixes are in section 4.

## 4. Review fixes from the two counted reviews on PR #935 (should-fix items)

Done in this branch:
- INDEX row ids keep their letter suffix (`NS-21-R7a`, `NS-01-R10a`, `NS-36-R1b`): `NS_RE` in `tools/build-index.py` now takes one trailing lowercase letter.
- `NS-06-B27` is marked as early: card 06 ends at `NS-06-B26`, so the cite waits for the card edit (B DESIGN, rulings line).
- A DESIGN `DoorNote` list now reads "never dismissible, never behind an info glyph, never glass".
- Photo-moment tap state has one owner: D-S11 `.photoMoment`; the lock-screen renderings stay D-S10 (INDEX 6.3 item 8 says so).
- The public name is not typed in prototype copy: A and E `PROTOTYPE.html` use the `{app}` placeholder the WORDS files use (OS-owned lines show the placeholder too).
- `&rsquo;` in A `PROTOTYPE.html` is now `&#39;` (two lines).
- A-S16 and A-S17 VoiceOver say "Picture 2", no total; one rule stated in A DESIGN, matching E-ST75.
- `IA-AUDIT.md` header no longer says "Not committed" or names a worktree.
- Round 2 accessibility tables (VoiceOver, 44 pt, AX5, contrast and signals) per state: C section 17 (C-S27, C-S18.media) and D section 16.3a.
- The 11 real motion-key mismatches are fixed (state names added to DESIGN or motion keys renamed to the DESIGN names); the two false positives (`A-S07.markOpen`, `A-S07.playing`) are now written dotted in A DESIGN. INDEX 6.1 item 3 reads 0 keys in 0 rows.
- INDEX rebuilt; `--check` passes. The family-data guard was mirrored by a hash scan of every tracked file under `docs/design/e2e` (names, ISO dates, paths): 0 hits.

Not done: Review B must-fix 1 (photo-moment default) was already closed in D by NS-51-R11 (plain is the default) and is unchanged here. Review B item 6 (Round 2 states not in the prototypes) stays open: the prototypes were not extended; say so in the PR description. The vitest test itself was not run (no `node_modules`, disk is low).
