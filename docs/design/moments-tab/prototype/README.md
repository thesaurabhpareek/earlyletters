# Moments prototype (Asha examples)

File: `moments-prototype.html`. One self-contained file, no network, no build. Open it in a browser. On a phone it fills the screen and the controls sit behind the "Controls" link at the top. On a desktop it shows an iPhone-sized frame and a side panel.

Status: PROPOSED design prototype. It changes no token, component or screen in the repo.

Founder ruling of 21 Nov applied: the first Moments release ships with the photo library read. So the prototype's main path is the library path: value view, ask on tap (primer, then the phone's own alert), Not now, Limited, denied. No state is drawn as a later phase. Rules kept: no machine titles, no place, no counts, no people or scene guesses.

## What is real
- Colours (light and dark), radii, spacing, type sizes and line heights, elevation, and every duration, spring and curve value are copied from `packages/design-tokens/src/tokens.ts`. The two springs are sampled from the token stiffness and damping into a CSS `linear()` easing.
- Words come from D5 (`wip/moments-d5`), with the tab named Moments. No machine title, no count, no streak, no guilt, no brand name typed.
- Behaviour: all state changes, the For you and Recent switch with each part keeping its place, set aside with Undo, "Another question", example cards that settle once and open in place, pick pictures with check badges, the capture handoff, Keep, and the return mark on the source card.
- Settings that work: Reduce Motion (also read from the phone's setting), Reduce Transparency, dark theme, text size (Default, Large, AX5 style scaling), live glass counter (max three).
- Contrast is the token pairs. Targets are at least 44 pt (56 pt for the ask and the primer buttons).

## What is placeholder
- Every picture is a drawn SVG (sun, hills, a tree, a kite, a bench). No photograph, no face. The family is the fictional Asha. The dates are invented and carry no year.
- Fonts: Literata and Mukta are not bundled, so Georgia and the system sans stand in.
- The iOS permission alert is simulated and labelled. Its button words are UNVERIFIED and Apple's, not ours.
- Home, Book and Me are stubs. "Read it" and "Open Settings" show a plain note.
- PROPOSED values not yet in `tokens.ts`: `glassFallback`, `highlight` (design language v2 4.1), the `kicker` style, the video pill alpha 0.68 (A2 R12 asks for 0.6 or more), `heroEnter` (dy 12, 420 ms), `momentCarry` 320 ms.
- The four primer lines (what it reads, keeps, never does, if you say not now) are drafts for `content` and counsel.
- Nothing is stored or sent. Reload resets everything.

## Motions and sources
Each play is also written in the live "Motion that just played" list in the panel, with the row id. "RM" is the Reduce Motion form.

| Motion | Value | RM | Source row |
|---|---|---|---|
| Cold launch, first six cards enter | opacity, y 8, 280 ms, 30 ms stagger | one 200 ms fade, no travel | MT-A1-R2, MT-A2-R27, MT-A3-R12 |
| Value view opening block | dy 12, 420 ms, standard | 200 ms fade | MT-A3-R1 |
| Examples settle once, one at a time | frames rise 12 pt, crescent draws 1200 ms, question fades 200 ms | shown complete | MT-A3-R4 |
| Example opens in place | height 280 ms, content after 80 ms | instant, 200 ms fade | MT-A3-R5 |
| Press | cards 0.98, controls 0.97, snappy | opacity 0.9 only | MT-A4 M1, M2, MT-A1-R4 |
| Primer sheet rises, swipe down is Not now | standard spring, scrim 200 ms | 200 ms fade | MT-T2-R3, D2 S2 |
| Continue to the alert | nothing of ours moves | same | MT-A3-R8 |
| Allow, Limited, Don't Allow, Not now | leave 160, gap 280, list from 160, 590 ms in all | 200 ms cross-fade | MT-A3-R10, R16, MT-T2 |
| Limited: choose more | day inserts, 280 ms | 200 ms fade | MT-A3-R17 |
| Picture arrives | 200 ms opacity from the paper tile, once per picture | same (opacity) | MT-A2-R8, MT-A3-R13 |
| For you and Recent switch | cross-fade 150 ms in place | same | MT-A1-R10 |
| Another question | words cross-fade 150 ms, height on standard | height at once | MT-A1-R10, MT-A2-R23, R24 |
| Set aside | fade 160 ms, gap closes on standard | 200 ms fade, gap at once | MT-T4-R15, MT-A1-R14 |
| Undo | returns to its slot with enter 280 ms | 200 ms fade | MT-T4-R16 |
| Card tap opens pick pictures | sheet rises on standard | 200 ms fade | D3 7.1 |
| Pick, Add: capture opens | talk dissolves 280 ms; write rises on standard | 200 ms fade | MT-A4 M3, M4, R9 |
| Picture carried into capture | 320 ms, bezier (option B, spike) | none, picture in place at frame 1 | MT-A4 M10, MT-A4-R8, R9 |
| Write lamp returns | 280 ms | none | MT-A4 M7 |
| Keyboard: picture goes compact | standard layout move | instant | MT-A4 M9 |
| Talk and write swap | 150 ms in place, picture still | same | MT-A4 M6 |
| Listening glow | one 7500 ms breath loop | static | MT-A1-R15, tokens `breathIdleMs` |
| Keep, the saved moment | scale 0.9, chip at 250, leaves at 550, done by 900 | chip fade, one cross-fade | MT-A4 M14, MOTION 5e |
| Return mark on the card | 200 ms fade | same | MT-A4 M16 |
| Empty state breath | 8000 ms, the only loop on the tab | off | MT-A1-R15, tokens `emptyBreathMs` |
| Tab swap | the platform's cut | same | MT-T1-R7 |
| Tab bar preview toggle | 150 ms fade, prototype only | same | none (prototype aid) |

## Where the source docs disagree, and what I chose
- Primer: a sheet (D2, T2, concept) rather than an inline card (A3).
- Cold launch stagger: first six cards (A2, A3, T4), not three (A1).
- Switch and prompt cross-fade: 150 ms (A1, T4), not 200 ms (D1) or 120 out and 160 in (A2).
- Video marker shows the length (A2, D3). Concept and D1 say no length until security and counsel clear the read.
- Set aside is in a More menu, and also on long press (D1, D3, T4). Swipe is not built.
- After Keep the prototype returns to Moments (concept, brief). The current ruling lands on the Book (A4-R20, MT-T1-R15).
- Tab position: Home default and Moments second, per D1. The side switch only reorders the bar.

## Not verified
Device frame budgets, VoiceOver on a phone, real iOS alert wording, Safari spring easing. The page was loaded in a headless Chrome and the console had no errors; screenshots were reviewed by eye.
