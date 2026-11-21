# Moments tab, animation lead A3: value-prop view, primer, grant, decline and limited motion

Status: PROPOSED, 21 Nov 2026. Branch `wip/moments-a3`. Docs only. Author: animation lead A3 of 5. Everything here waits for the founder's signature on the reversals listed in the brief (J4, K-02, BL-1305, ML-6, the three-tab ruling).

## 1. Purpose and scope

The Moments tab is the default landing tab. Before a parent has said anything about photos, it shows what the tab will do, using our own drawn examples of the fictional family Asha. Then it asks, plainly. A parent can say Not now. Whatever they say, the tab shows real things.

This document specifies the motion for six states and the moves between them:

| Id | State | When |
|---|---|---|
| V0 | Value view with the ask | Photo access never decided, route B (our own read). |
| P1 | The ask, opened | The parent opens "How this works" inside the ask. |
| G1 | The grant moment | iOS returns Full access. |
| G2 | First real moments appear | Right after G1, and on every later cold launch with access. |
| L1 | Limited access | iOS returns Limited. |
| D1 | Not now | The parent chooses Not now. |
| D2 | Denied or restricted | iOS says no, or the phone does not allow it. |

Out of scope, owned elsewhere: how a moment card opens into a letter (transition leads); the capture flow and the attach step (other animation leads, A1, A2, A4, A5; I did not read their docs, UNVERIFIED); the words (content, intents only below); the Recent list scroll behaviour; Route A's system sheet, which we do not animate.

The rule that shapes every row: **no reward for yes, no cost for no.** Yes and Not now end in the same kind of calm change, of the same length, with no sound, no haptic and no celebration. Nothing on this tab moves to hurry or please a parent into granting access.

## 2. Inputs read

| Path or source | What I took from it |
|---|---|
| `/home/claude/moments-brief.md` | Founder direction, decisions of record, constitution, privacy, how to work. |
| `docs/design/MOTION.md` v0.2 | Principles 1 to 6; tokens in section 3; Reduce Motion mechanism (section 4); signature moments (a), (e), (h), (i), (j), (k), (l); performance rules (section 7); Lottie, Rive or Reanimated (section 9). |
| `docs/design/DESIGN-LANGUAGE-V2-21nov.md` | R1 to R5 (paper content, glass only on navigation, closed book as the one illustration); T6 proposed `motion.heroEnter` `{ dy: 12, durationMs: 420 }`; glass limit; `glassFallback`; minimum iOS 17.0 (D-098). |
| `packages/design-tokens/src/tokens.ts` (read in this clone) | Existing: `fadeMs` 200, `exitMs` 160, `enter` `{ dy: 8, durationMs: 280 }`, `staggerMs` 30, `staggerMax` 6, `hardCeilingMs` 2000, `emptyBreathMs` 8000, `newMarkMs` 1600, springs `snappy`, `standard`, `gentle`. `heroEnter` is NOT in the file yet (grep found none); it is a proposal from the v2 doc. |
| `docs/design/specs/MEMORY-LIBRARY-CONSENT-AND-SURFACING-10nov.md` (CS-S1) | The existing `PermissionPrimer` shape: equal buttons, no timer, no pre-selected option, no Close glyph, "Not now" holds and is reachable again only from Settings. I reuse its rules; I make it inline on this tab (R-3). |
| `docs/agents/COORDINATION.md` section 10 | Requirement shape; the Shown, Records, Never, Decline lines. |
| Apple, `developer.apple.com/documentation/photos/phauthorizationstatus.md`, read 21 Nov 2026 | Five states: notDetermined, restricted, denied, authorized, limited. Limited is described as "The user authorized this app for limited photo library access." |
| Open PRs list, 21 Nov 2026 | PR #1264 (Home engagement wheel) and PR #1251 (v2 tokens T1 to T6) are open. The three companion docs (privacy, feasibility, concept) were not among the open PRs I read, so I state assumptions in section 9. |

## 3. Tokens used (no new duration is typed in a screen)

Every duration below is an existing token or a named proposal. Screens never type a number.

| Name | Value | Status |
|---|---|---|
| `fadeMs` | 200 ms | exists |
| `exitMs` | 160 ms | exists |
| `enter` | dy 8 pt, 280 ms, easing bezier(0.2,0,0,1) | exists |
| `staggerMs`, `staggerMax` | 30 ms, 6 items | exists |
| `sequenceMaxMs` | 900 ms | exists |
| `hardCeilingMs` | 2000 ms | exists |
| `springs.standard`, `snappy`, `gentle` | as in tokens.ts | exists |
| `drawMs` | draw-once line drawings, 1200 ms in MOTION 5h | exists (value read from MOTION.md; confirm the token value, UNVERIFIED) |
| `heroEnter` | dy 12 pt, 420 ms, on `standard` | PROPOSED in v2 T6, not in tokens.ts |
| `moments.exampleSettleMs` | 340 ms (= `enter` 280 + two staggers of 30) | derived, no new token needed; listed so tests can check it |

## 4. Motion principles for this tab (what we do and do not do)

1. **Controls are there from frame 1** (MOTION principle 2). "Allow photo access" and "Not now" are opaque and hittable from the first frame. Neither fades in, nothing is gated behind watching an example.
2. **Equal doors.** Same size, weight, type, press feedback and position logic for both buttons. Neither pulses, glows, bounces, grows or is highlighted by motion. The primary fill is the app's one prominent action (v2 R, accent on one control), so we keep its colour; we add no motion to it.
3. **No timers.** No countdown, no auto-advancing carousel, no "still waiting" nudge, no animation that starts after the parent has been still. If a parent does nothing, nothing moves.
4. **Show, do not loop.** Examples move once, when first seen in a session, and rest. No loop on this tab (principle 1: continuous motion comes only from a real signal; there is none here). The existing 8 s breath in empty states (MOTION 5j) is not used on this tab.
5. **No reward for yes.** No success haptic, no sound, no wash, no light change when access is granted. The `success` haptic in the app means "your words are kept" (MOTION 5e); using it for a grant would blur that.
6. **No loss pictures for no.** Declined and limited are quiet states. No shake, no caution colour, no sad drawing, no greyed-out look, no "locked" glyph.
7. **Our content stays paper.** No glass anywhere in these states, so no glass fallback is needed here. The tab bar is the navigation layer and is not ours to animate (MOTION 5i).
8. **Photos never zoom or pan.** No Ken Burns, no parallax, no blur (MOTION benchmark M4 verdict: avoid).
9. **Machine does not write.** No motion types text out, no word-by-word reveal of any title for a photo day. A day's label appears only if the parent typed it; motion never suggests the machine is composing.
10. **Interruptible.** Any tap lands on the end state (MOTION principle 4); a state change during a move re-targets from the current value.

## 5. Requirements

Test layers: U = unit test of the plan data (`lib/*.logic.ts` style, ms by ms); C = component test on web build; D = device check (iPhone SE 3 and a large iPhone, both themes); A = accessibility check with the setting on. Press timing is checked on a phone, not the web build (MOTION 9b).

### 5.1 The value view (V0)

**MT-A3-R1. First paint is complete; only the opening block eases in.**
- Given the app has just cold-launched with photo access not decided,
- When the Moments tab, the default tab, first renders,
- Then the header, the one-line promise and the ask card are fully drawn on frame 1, and only the first example card uses `heroEnter` (opacity 0 to 1, y 12 to 0, 420 ms, `standard`), finished before 600 ms; on a warm resume or a tab return, nothing re-enters (MOTION 5l rule 2).
- Reduce Motion: one `fadeMs` (200 ms) opacity fade of the first example card, no travel.
- Layers: U, D, A. Door lines: not applicable (no consent here).

**MT-A3-R2. The ask is in the same place and at full strength from the start.**
- Given V0 on any phone,
- When the screen is first drawn,
- Then both buttons are at opacity 1, full size, 44 pt or larger (target 56 pt per CS-S1), and have no enter, pulse, glow, scale loop or colour animation at any time; their press feedback is the shared press (controls 0.97, `snappy`) and is identical for both.
- Reduce Motion: press feedback is a 120 ms opacity dip to 0.85 instead of scale (proposal; the shared press already has a Reduce Motion form, confirm it, UNVERIFIED).
- Layers: U (both buttons share one press config), C, D.

**MT-A3-R3. Three drawn examples show what the tab will do.**
- Given V0,
- When the parent scrolls,
- Then exactly three example cards sit above the ask, each tagged "Example" in text (not colour alone), each a paper card with a single-weight line drawing, no photograph, no face, no machine-written title; the three are (1) a day gathered from pictures, (2) a day that belongs to {child} (an age day), (3) a letter from a year ago beside a new one. All use fictional Asha content only.
- Reason: our own illustrations keep the constitution (nothing machine-made is shown as if it were the parent's) and the privacy rule (no real family detail).
- Layers: C (content key present, "Example" tag present), D.

**MT-A3-R4. Each example settles once, when it is first mostly in view.**
- Given an example card has at least 60 percent of its height on screen for the first time in this session,
- When that happens,
- Then its drawing settles once: example 1, three line-drawn frames rise from dy 12 to 0 with opacity 0 to 1, 30 ms stagger, `standard` (340 ms total); example 2, a crescent draws on via `strokeDashoffset` over 1200 ms, then its text fades in over `fadeMs`; example 3, the two letter cards fade in over `fadeMs` with a 30 ms stagger; only one example animates at a time (the next waits for the previous to finish); nothing repeats on scroll back or tab return in the same session.
- Total for any example is at most 1400 ms, under `hardCeilingMs`. Example 2 exceeds `sequenceMaxMs` (900 ms) on purpose, the same exception as milestone drawings (MOTION 5h); flagged for the CPO in section 8.
- Reduce Motion: every drawing is shown complete at once; text present from frame 1; no fade at all except a single `fadeMs` opacity on the card.
- Layers: U (plan data), D, A.

**MT-A3-R5. Tapping an example opens it in place, and nothing starts.**
- Given an example card,
- When the parent taps it,
- Then it expands in place (height by `LinearTransition` on `standard`, 280 ms; content fades in after 80 ms) to show the same example one step further: the pictures with a few spoken words attached to them (words by content, intent only); one example is open at a time, a second tap on it or a tap on another closes it; the expanded card has no Speak, Start, Allow or Continue control inside it.
- Reason: an example that offers to start something would be a button that does not do what it says (J5), and a shortcut around the ask.
- Haptic: none. Reduce Motion: instant height, 200 ms content fade.
- Layers: U, C, D, A (expanded state read by VoiceOver as one element: label, then body).

**MT-A3-R6. No auto-advance and no carousel.**
- Given V0 at any Dynamic Type size,
- When the screen is shown for any length of time,
- Then the three examples stay in a vertical stack that the parent scrolls; nothing slides sideways, auto-advances or cycles; at AX5 each card is full width and its text is never truncated (D-027).
- Layers: C, D (AX5 on iPhone SE 3), A.

### 5.2 The primer (P1)

The ask on V0 is the primer. I recommend it is an inline card at the end of the stack, not a sheet, so there is no sheet on a tab and no extra step before iOS's own alert (open question 1). It uses the CS-S1 rules: equal buttons, no pre-selected option, no timer, no Close glyph.

**MT-A3-R7. The ask card shows its plain statement without a gesture.**
- Given V0,
- When the ask card is on screen,
- Then it states, in parent words, what is read, what is never read, when it looks, where the result lives and that the app works either way; the statements are visible text, not hidden behind a tap; a "How this works" row opens longer detail in place (height `LinearTransition` on `standard`, 280 ms, content fades in after 80 ms; Reduce Motion: instant height, 200 ms fade) and has no effect on the buttons above or below it.
- Door lines, per COORDINATION section 10:
  - Shown: the ask card words, by `packages/content` key (content owns the keys; the iOS usage string is counsel's), and the versioned privacy link if content includes one.
  - Records: the parent's choice (Continue or Not now) as a phone-only flag, plus the iOS status as iOS reports it; whether a server row is written is for `privacy` and `data-architect` (PRIV-R21; UNVERIFIED that it applies to a photo-library permission). Nothing about motion is recorded: no "watched example" or "opened How this works" event.
  - Never: no photo, filename, album, place, date or example-view count in analytics, logs or crash reports; no timing of how long a parent hesitated.
  - Decline and withdraw: Not now closes the ask and holds; the tab still works; the choice can be changed later in a Settings row; export and deletion are unaffected.
- Layers: C, A. Review by `privacy`, `compliance-engineer`.

**MT-A3-R8. Continue goes straight to iOS and nothing moves around it.**
- Given the ask card,
- When the parent taps Continue,
- Then iOS's own alert appears with no animation of ours before it (no dim, no fade of the card, no haptic from us); our screen stays exactly as it is until iOS returns; no timer, no progress indicator.
- Layers: D.

### 5.3 The grant moment (G1) and the first real moments (G2)

**MT-A3-R10. Grant: same calm change as Not now, in the same time.**
- Given iOS returns Full access and the app is active again,
- When the result is read,
- Then (a) nothing moves until `AppState` is active and the Moments tab is focused; (b) the ask card and the example cards leave together: content fades over `exitMs` (160 ms) with no travel, then the space closes by `LinearTransition` on `standard` (starts at 160 ms, 280 ms long); (c) the first real list enters as in R12 starting at 160 ms; the whole is under 900 ms (`sequenceMaxMs`) and ends at 160 + 280 + 5 x 30 = 590 ms; (d) no haptic, no sound, no wash, no light change, no check mark, no "Thank you" motion; the examples do not come back.
- Reduce Motion: the leaving content and the arriving list cross-fade over `fadeMs` (200 ms); no height travel; the list is in place at 200 ms.
- Layers: U (plan data identical in length to R16 within 0 ms of difference), D, A.

**MT-A3-R11. Real things never wait on the library.**
- Given the parent has not decided, said Not now, or said no,
- When the tab is shown after the first decision,
- Then the list shows real For you items from sources that need no photo access (typed occasions, Days, month and age days from the date of birth, a year ago from our own letters, written prompts); the value view with examples is shown only while photo access is undecided and Not now has not been chosen.
- Layers: C. (The list content is owned by product and the concept doc; I only fix when the examples stop.)

**MT-A3-R12. First real moments arrive quietly.**
- Given the first read returns moments,
- When they are placed,
- Then the first six cards `enter` (opacity 0 to 1, y 8 to 0, 280 ms, 30 ms stagger, `staggerMax` 6); every later card is present with no motion; list headers and the For you and Recent switch are present from frame 1 (principle 2); the sequence ends within 430 ms of its start; it plays once per cold launch and once at the grant, never on tab return, scroll or pull to refresh.
- Reduce Motion: all cards in place with one `fadeMs` opacity fade, no travel, no stagger.
- Layers: U, D, A.

**MT-A3-R13. Pictures fade in as they load, and do not move.**
- Given a card has thumbnails or a collage,
- When each image decodes,
- Then it fades from the card's own tone to the image over `fadeMs` (200 ms), opacity only, once per image per session (a memory-only set, never stored, never logged); no scale, pan, zoom, blur, shimmer or crossfade of the whole card; if a thumbnail is ready before the card enters, it is drawn with the card.
- Reduce Motion: the same 200 ms opacity fade is allowed (it is an opacity fade, not movement; MOTION section 4); if the parent prefers none, thumbnails are drawn on arrival.
- Layers: C, D.

**MT-A3-R14. A slow read shows a still, honest wait.**
- Given the library read has not returned 300 ms after the grant,
- When the wait continues,
- Then the For you items from other sources are already on screen (R11), and the Recent section shows one static paper placeholder row with one plain line (content owns it); there is no spinner, no shimmer, no breathing, no progress or count; VoiceOver is told once that photos are being looked at; if the read returns within 300 ms, no placeholder is shown at all (no flash).
- Reason: no continuous motion without a real signal (principle 1); a spinner on a person's photos reads as work being done on their memories.
- Layers: U (the 300 ms rule), C, A.

**MT-A3-R15. Focus after the grant or the answer.**
- Given VoiceOver is on and the ask had focus,
- When G1, D1 or a state change removes the ask,
- Then VoiceOver gets one announcement of the result (words by content) and focus moves to the first item of the list or to the tab heading, but only if focus is still inside the removed card; if the parent has moved elsewhere, focus is not taken.
- Layers: A (device, VoiceOver on).

### 5.4 Declined, limited, denied

**MT-A3-R16. Not now ends with the same move and the same length as the grant.**
- Given the parent taps Not now,
- When the choice is stored,
- Then the sequence of R10 plays, with the same timing (160 ms exit, 280 ms close, list at 160 ms, 590 ms total), the For you list of R11 enters as in R12, and one quiet row stays at the end of the list (words by content, intent: you can turn photos on any time; one plain link to the Settings row); no toast, no Toast stack, no second ask, no "Are you sure"; the ask does not return from a note, a notification or a timer.
- Reduce Motion: as R10.
- Layers: U (equal-length test between R10 and R16 plan data), D, A.

**MT-A3-R17. Limited access is a normal, full state.**
- Given iOS returns Limited (the parent chose some photos; PHAuthorizationStatus has a distinct limited case, Apple page read 21 Nov 2026),
- When the tab is shown,
- Then the sequence of R10 plays and moments from the chosen photos are listed as in R12; one quiet row at the end of Recent says photos can be added (a link, not a button with colour or motion; it calls Apple's limited-library picker, the method name `presentLimitedLibraryPicker` seen in a search result title, behaviour UNVERIFIED); the row never pulses, never badges the tab and never reappears as a banner; there is no word such as "only", "missing" or "limited" in a tone of loss (content decides the words).
- When the parent adds photos and returns, new moments insert with `LinearTransition` (`standard`, 280 ms) and a `fadeMs` opacity fade, no stagger over 6, no scroll jump (anchor on the item at the top of the screen). Reduce Motion: in place with a `fadeMs` fade.
- Layers: U, D, A.

**MT-A3-R18. Denied and restricted are still, not red.**
- Given iOS says denied, or restricted (the phone does not allow the parent to choose),
- When the tab is shown,
- Then the For you list of R11 is shown; one quiet row at the end says photos are off; for denied, the row opens iOS Settings for this app; for restricted, the row is plain text with no link (the parent cannot change it; do not offer a control that cannot work, J5); the row uses the muted text style, not `caution`, `destructive` or `recording` colour, has no icon that animates, and no shake, haptic or sound at any time.
- Layers: C, D, A.

**MT-A3-R19. Coming back from Settings re-reads once and moves once.**
- Given the parent changed the setting in iOS Settings and returns,
- When the app becomes active,
- Then the status is read once; if it moved to Full or Limited, the sequence of R10 plays from wherever the screen is (re-targeted, not restarted); if it moved to denied, the Recent photo list fades out over `fadeMs` and the quiet row of R18 appears with it, height by `LinearTransition`, no message of loss; if nothing changed, nothing moves. If iOS ends the app on a permission change (UNVERIFIED), the next cold launch draws the final state with no sequence (R1 rule: first paint complete).
- Layers: U, D.

**MT-A3-R20. Cold launch into a known state draws that state complete.**
- Given the app cold-launches after any earlier answer,
- When the tab first renders,
- Then it draws complete: no example, no ask unless access is still undecided with no Not now; and only the header and first card use the R1 enter of `enter` (280 ms), never a sequence longer than 430 ms.
- Layers: U, D.

### 5.5 Settings that change motion, and the lamp

**MT-A3-R21. Reduce Motion, one mechanism.**
- Given Reduce Motion is on,
- When any state above plays,
- Then it uses `useMotion()` only (`reduced`, `fade()`), each movement has a paired `fadeMs` fade with `ReduceMotion.Never` on the fade, and the draw-on examples are shown complete; components never read the setting themselves (MOTION section 4); a change of the setting while the tab is open takes effect at the next move.
- Layers: U, A.

**MT-A3-R22. Reduce Transparency, Increase Contrast, Bold Text.**
- Given any of the three settings,
- When V0 to D2 are shown,
- Then nothing changes in motion; no state here uses glass, so no fallback is needed; line drawings of the examples draw at `line` strength under Increase Contrast with 3:1 against their card; "Example" is text, not colour alone.
- Layers: A, D.

**MT-A3-R23. The lamp stays as the tab left it.**
- Given the tab lamp (`persistKey="tabs"`, MOTION 5k),
- When any state changes,
- Then the lamp neither brightens on a grant nor dims on a no; it follows the tab's own scene only. The lamp rule "never on a screen that sells or reports a problem" is read here as: V0 and D2 are not selling or errors, because they are an inline note and a quiet ask; the lamp owner confirms (open question 3).
- Layers: C.

**MT-A3-R24. Performance and one loop at most.**
- Given any state above,
- When it plays on iPhone SE (3rd gen),
- Then only `transform` and `opacity` animate, except height by `LinearTransition`; no frame over 16.7 ms; no per-frame gradient, no Skia; no `setState` per frame; draw-on runs in a worklet; at most one animation plays at a time (the example queue of R4); everything cancels on blur and when the app goes to the background.
- Layers: D (profiling run).

**MT-A3-R25. Nothing about the motion is measured.**
- Given analytics are opt-in and allowlisted,
- When any state plays,
- Then no event, log or crash breadcrumb records that an example was viewed, expanded, skipped or how long the parent stayed; the only fact kept is the permission result, and where it is kept is for `privacy` to rule.
- Layers: C (a source scan for new event names in these components), review.

## 6. Timeline summary (all values from tokens or derived)

| Moment | Start | Move | End | Notes |
|---|---|---|---|---|
| V0 cold launch | 0 | first example `heroEnter` 420 ms | under 600 ms | Header and ask static. RM: 200 ms fade. |
| Example 1 settles | 0 on 60 percent in view | 3 frames, 30 ms stagger, `standard` | 340 ms | Once per session. RM: complete. |
| Example 2 settles | after example 1 ends | crescent draws 1200 ms; text 200 ms | 1400 ms | Over 900 ms, under 2000 ms. RM: complete. |
| Example 3 settles | after example 2 ends | two cards fade 200 ms, 30 ms stagger | 230 ms | RM: 200 ms fade. |
| Example expand | tap | height 280 ms; content after 80 ms | 360 ms | RM: instant, 200 ms fade. |
| Ask: How this works | tap | as expand | 360 ms | RM as expand. |
| Grant, or Not now | iOS returns, or tap | cards leave 160 ms, close 280 ms from 160 ms, list enters from 160 ms | 590 ms | Same for both. RM: 200 ms cross-fade. |
| First real moments | 160 ms into the above | first 6 enter, 30 ms stagger | 590 ms | Later cards static. |
| Thumbnail | decode | opacity 200 ms | 200 ms | Once per image per session. |
| Slow read | 300 ms after grant | still placeholder | on result | No motion. |
| Limited add | return from picker | inserts 280 ms | 280 ms | No stagger over 6. |
| Denied after Settings | app active | fade 200 ms, row | 280 ms | No message of loss. |

## 7. Edge and unhappy paths

- **The parent taps Not now before the first example has settled.** The in-flight move is cancelled and lands on its end state; R16 plays.
- **The parent grants while an example is expanded.** The expanded card closes as part of R10; no state is left half open.
- **App goes to background during the iOS alert.** Nothing of ours is running, so nothing resumes wrongly; on return, R19 reads once.
- **Read returns zero moments after the grant.** The For you list of R11 stays; Recent shows one still line (content owns it) and no drawing or promise. Never "no moments yet" in a tone of gap; counts and gaps are banned.
- **Library is huge or slow.** R14 applies; entries are placed as the first screenful is ready, the rest silently with no motion; no progress or counts shown.
- **Route A (Apple's picker, no permission).** There is no ask and no grant moment. V0 shows the same value view; the button opens Apple's sheet, with no animation of ours before or after it; what the parent picks attaches by the capture flow's own motion (other leads). Apple's titles are never shown or stored by us (brief). R10 to R19 do not apply to Route A; R1 to R6 do.
- **Reduce Motion changes mid-sequence.** The current move finishes; the next uses the new setting.
- **Low Power Mode.** Not read (needs a new dependency, D-065; MOTION 5k). Nothing here loops, so there is nothing to switch off.
- **Dark mode and light mode.** Drawings use text and `line` tokens; no gradient; no light-only asset.
- **iPhone SE 3 at AX5.** Examples stack, the ask is below them, the page scrolls; no clipped text; the scroll does not auto-move at any point. Reaching Not now needs scrolling past three examples at AX5; see open question 2.
- **VoiceOver.** Example drawings are decorative (hidden); each card is one element: "Example", then its body. The ask card's buttons are separate elements in reading order, Continue first, Not now second, equal labels in length (content).
- **Fast tab switching.** A move in progress finishes on blur or lands on its end state; no replay on return.

## 8. Constitution, privacy and accessibility checks

| Check | Result |
|---|---|
| Machine never writes | Motion types nothing out. No title for a photo day is shown or animated unless the parent typed it. Examples are our own fixed Asha content, labelled Example, so they cannot be mistaken for the parent's words. |
| No counts, gaps, streaks, points, badges | None. No counts in the slow-read or limited rows; no badge on the tab for "more photos" or a new grant. |
| Never imply AI writes | Examples show a person speaking and pictures attached; no wand, sparkle, magic or "made for you" motion (also no sparkle symbol). |
| Never gender the child | `{child}` and Asha in examples; content owns the words. |
| Pressure to grant | Rows R2, R8, R10, R16 and R25 together: equal buttons, no timers, no pulse, no reward, no loop, no measure of hesitation, no re-ask. |
| Privacy | No library fact, filename, album, place or date in any event or log. Thumbnail "seen" set is memory only. |
| Dynamic Type to AX5, letter text never truncated | Vertical stack; full-width cards; no horizontal scroll (R6). |
| VoiceOver | Order and one-announcement rule (R15). |
| 44 pt | Both ask buttons 56 pt target (CS-S1 value, UNVERIFIED that CS-S1 is built); "How this works" row at least 44 pt. |
| Reduce Motion, Reduce Transparency, Increase Contrast, Bold Text | R21, R22. |
| Colour never the only signal | "Example" text; denied row differs by words, not colour. |
| No glass | Content is paper; the only glass is the system tab bar. |
| Contrast | Not newly introduced; all colours are existing tokens. The line-drawing stroke is `line` or `textMuted`, to be tested at 3:1 against the card by `design-systems` before ship. |
| Sound | None, on any state (`docs/design/SOUND.md` rule is silence for non-voice moments; I did not re-read it this session, UNVERIFIED). |

## 9. Open questions (recommended default, deadline)

Deadlines are by the day the integrator opens PRs for this work.

1. **Is the primer inline or a sheet?** Default: inline card, because a sheet on top of the default tab adds a step before iOS's own alert and a second place to dismiss. If the founder prefers the existing `PermissionPrimer` sheet, the motion is the sheet's own (rise on `standard`, Reduce Motion fade at `fadeMs`, MOTION 5i) and R7 and R8 move onto it unchanged. Owner: CPO and design lead. Before the concept doc is final.
2. **Should Not now be above the examples at AX5?** Default: no; one ask card after three examples, because the founder asked to show the value first. Risk: at AX5 Not now is far down. Mitigation under review: the tab bar lets a parent leave at any time, and nothing is blocked. Alternative: put a compact two-button ask above the fold and the same card again below. Owner: design lead and `content`. Before the concept doc is final.
3. **Does the lamp stay on V0?** Default: yes, still at the tab's level, as V0 is a calm showing and D2 is a note, not an error. Owner: lamp owner (design-systems). Before ship.
4. **The 1400 ms example 2 draw.** Default: allowed, as the milestone drawing (MOTION 5h); alternative is to shorten to 900 ms. Owner: CPO. Before ship.
5. **Does a parent who said Not now ever see the examples again?** Default: no; the Settings row is the only way back, and the row opens the ask, not a re-ask by timer. Owner: product. Before the first TestFlight build with this tab.
6. **Does a grant or a decline write a consent row (PRIV-R21)?** Default: a phone-only flag, server write only if `privacy` rules it needed; the iOS status itself is not ours to record. Owner: `privacy`. Before R7's Records line is final.
7. **Does the first grant lead into a letter at once?** Default: no; the list appears and the parent chooses. No auto-opened day, no "start with this one" motion. Owner: product. Before ship.

## 10. Dependencies

- `packages/design-tokens`: `motion.heroEnter` (T6, PR #1251 family; not in the file I read); a `moments` block is not needed because every duration is derived.
- `design-systems` (me): a `ValuePropCard` (paper card, tag, drawing slot, in-place expand) and an inline `PermissionPrimer` variant; confirm `drawMs`; a draw-on asset set for three examples (single-weight, no faces).
- `content`: the ask card words (reads, never, when, where, next, Continue, Not now), "Example" tag, the three example titles and bodies, the quiet rows for declined, limited and denied, the slow-read line; all in parent words, no PROPOSED words in a shipped screen.
- `mobile`: a `momentsEntryPlan()` in `lib/transitions.logic.ts` style so the R10 and R16 timelines are data and tested equal; `useMotion()` only.
- Feasibility doc (route A or B): decides whether R10 to R19 exist at all in the first build (Route A has no permission).
- Concept doc: the For you sources that fill R11; the list shape that R12 enters.
- Transition leads: how a moment card opens into a letter and how the tab swap shows the lamp (MOTION 5f, 5l).
- Other animation leads: the attach step and capture entry from a moment.
- `privacy`, `compliance-engineer`, `regulatory-affairs`: review of the Records and Never lines (R7, R25).
- Counsel: the iOS usage-description string and any promise in the ask.

## 11. What is verified, unverified, a guess

**VERIFIED (read this session):**
- Token values and names in `packages/design-tokens/src/tokens.ts` listed in section 3 (grep of the clone, 21 Nov 2026); `heroEnter` absent from that file.
- MOTION.md v0.2 content cited (principles, signature moments, Reduce Motion mechanism, performance rules).
- DESIGN-LANGUAGE-V2 rules R1 to R5 and T6 `heroEnter` proposal; minimum iOS 17.0.
- CS-S1 primer rules in `MEMORY-LIBRARY-CONSENT-AND-SURFACING-10nov.md`.
- COORDINATION section 10 shape.
- Apple, PHAuthorizationStatus (`https://developer.apple.com/documentation/photos/phauthorizationstatus.md`): the five cases and the limited description.

**UNVERIFIED:**
- That `presentLimitedLibraryPicker(from:)` behaves as described (a search result title only; the page was not read).
- That iOS ends the app when the photo permission changes in Settings.
- That the shared press has a Reduce Motion form as I describe; that `drawMs` is 1200 ms; that CS-S1's 56 pt is built.
- That SOUND.md says silence for non-voice moments.
- The content of the three companion documents (privacy, feasibility, concept) and of the other animation leads' documents; I assumed: the tab has For you and Recent; an inline ask is acceptable; Route B is the likely first build.
- PRIV-R21 applying to a photo-library permission.
- Whether Apple's own journaling suggestions picker is what the founder's screenshots show (brief says unverified); I viewed no screenshot and copied nothing from them.

**A guess (design judgement, to be tuned on a device):**
- The 300 ms slow-read threshold; the 60 percent in-view trigger; the 120 ms Reduce Motion press dip; example 2's 1200 ms draw as acceptable; that equal-length sequences for yes and no are enough to remove pressure; that a vertical stack of three examples is the right number (one fewer would shorten the path to Not now).
