# PermissionAsk (the ask card and the primer sheet)

Owner: `design-systems`. Status: PROPOSED, not built. Sources: G-04, G-05, G-06, DC-6, R71, R72, R73, R155, R213, R218, PRD 8.2, 8.5, EXP 2.2, 7. Shared rules: `README.md`.

## 1. Purpose
In ACC-0 one plain card asks whether the parent wants days shown from their pictures; the yes opens a primer sheet with one sentence, then Apple's own alert. The no is final and equal in weight. Nothing here is a permission request until the primer's Continue (R70).

## 2. Anatomy
Ask card (inline in the tab's scroll, below the real cards, C-2 in `README.md`):
- One container, `Card variant="outlined"` on `surface`, no lamp scene (O-25), no picture.
- The one plain statement from `copy.moments.ask.statement` (PLACEHOLDER key), visible without a gesture, `body`, `text`.
- Two buttons of equal size, width and outline: the yes (`copy.moments.ask.yes`) and Not now (`copy.moments.ask.no`), both `Button variant="outline" size="md"`. Neither filled, neither coloured as the wrong choice (R71). Outline, not `secondary`: the `secondary` fill is about 1.08:1 against a card in light (COMPONENTS, HelplineCard note).
- No menu, no Not-this-one verb: Not now here is the primer's Not now (R73), not the card set-aside effect (C-5).
- Placement of the door row is `08-door-row.md`: below this card, never beside it, never inside it.

Primer sheet (G-05): rises over the tab as a sheet (`Sheet`, `dismissible={false}` for the buttons' sake, see states); grabber hidden; content scrolls:
1. Title (`copy.moments.primer.title`, PLACEHOLDER), heading.
2. The one sentence (variant A, R192; `content` and counsel own it).
3. The policy link (versioned, from `content`).
4. One disclosure, collapsed by default, always in the accessibility tree, holding Shown, Records, Never and Decline from PRD 8.5 as content keys (R218). It opens in place.
5. Continue and Not now, equal in size and weight, `target.primary` tall.

## 3. States
| State | What shows |
|---|---|
| ACC-0 | Ask card as above |
| Reading too slow (over 1 s, ASSUMED) | The card is replaced in place by one static line from `content` (R213); spoken once; no spinner, no count, no "found"; leaves when the first day arrives |
| Primer open | Sheet as above |
| Primer, disclosure open | The disclosure grows in place; sheet scrolls |
| Continue | Apple's alert, once, from `requestAuthorization(for: .readWrite)` |
| Not now or swipe-down | Final: the tab shows ACC-1 with the EM-16 move (590 ms in all; Reduce Motion a `motion.fadeMs` cross-fade). Swipe-down equals Not now; Apple's alert is never shown by any gesture other than Continue |
| iOS already holds an answer | No primer, no alert; straight to the state (R74) |
| Locked or inactive while open | The primer cannot be open; a result returning while locked is discarded (D2-R19, T2-R30) |
| Not now chosen once | No card, primer or timer returns on a later day (R73) |

## 4. Tokens
Colours `surface`, `line`, `controlBorder`, `text`, `textMuted`, `accent` (link), `focus`; `space[4]`, `space[2]`, `layout.gutter`; `radius.lg`; `target.min`, `target.primary`; `stroke.control`; `Text` `body`, `title2`, `subhead`; motion `motion.swapMs`, `motion.fadeMs`, `motion.standard`, `motion.enter`. Haptics: none (Allow and Not now are silent: PRD 14.3).

## 5. Dynamic Type
- Default and up to AX0: buttons side by side.
- From AX1: the two buttons stack, the yes first, each full width, same height (G-05, R71). The ask card is never more than one card from the top (G-06, R211).
- Primer at AX5 on an iPhone SE 3: full-height scroll; Continue and Not now sit at the end of the scroll, not pinned, so no pinned bar covers more than 25 percent of the screen (PRD 15); every line wraps, none truncates; the disclosure opens in place.
- Default size on an iPhone SE 3: the ask card's two buttons are visible after at most one real card (G-06).

## 6. VoiceOver and order
Ask card: one container; elements in order: statement, yes, Not now. Names are the visible words (WCAG 2.5.3); the container is not itself actionable. The G-04 text names them "Show days" and "Not now" as intents; the real words are the content keys.
Primer: modal; the title takes focus on open and is a heading; reading order: title, the sentence, the policy link, the disclosure (spoken as "<name>, collapsed" or "expanded"), Continue, Not now. The `Sheet` escape gesture equals Not now. On close, focus goes to the tab heading (ACC-1 state) or, if the parent continued, to the first day heading once days arrive (spoken once, R155).

## 7. Motion
Primer rise: the `Sheet`'s spring (`useSheetMotion`). Result move: EM-16, 590 ms total, one cross-fade for grant and Not now, same length for both (no signal that one is preferred); Reduce Motion `motion.fadeMs`. Controls are opaque from the first frame.

## 8. Targets
Ask card buttons at least `target.min` (use `Button size md`, which grows with text); primer buttons `target.primary`; 8 pt (`space[2]`) apart; the disclosure row at least `target.min`.

## 9. Words
All from `packages/content`: statement, yes, no, primer title, sentence, link label, disclosure label, the four door lines, the slow-read line. Rules: no "allow", "access" or "settings" outside the ACC-4 line and Me (the test lists the exact allowed keys); `{app}` not "we"; no on-device-only claim (D5-F4).

## 10. Shown, Records, Never, Decline (PRIV-R21)
Shown: the one sentence and the policy link, then the four lines behind the disclosure. Records: on the phone only, that the primer was shown and answered (so the ask card does not return); no server row, no analytics. Never: a picture, id, date, album, place or count; the permission result; any event (O-18). Decline: Not now and Don't Allow leave every feature working; Turn off in Me removes on-phone data at once. Text lives in PRD 8.5; this component draws it, `content` writes it.

## 11. Test list
- PA-T1 L2: Not now and the yes have identical measured size, width and style props at default and AX5.
- PA-T2 L2: no PhotoKit authorization call before Continue (an L1 scan plus a mock: R70).
- PA-T3 L2: swipe-down equals Not now; no alert follows.
- PA-T4 L2: after Not now, the ask card and primer do not mount on a later (fake) day; no timer or counter exists.
- PA-T5 L3: default, AX3, AX5, light and dark; at AX1 buttons stack, yes first; nothing truncates; no pinned bar.
- PA-T6 L3: iPhone SE 3 default: both buttons visible after at most one real card.
- PA-T7 L4: primer order title, sentence, link, disclosure with state, Continue, Not now; disclosure always in the tree.
- PA-T8 L2: slow-read line replaces the card, announces once, no spinner.
- PA-T9 L1: content test for the allowed keys containing "allow", "access", "settings"; no string literal in the files.
- PA-T10 L5: DM-07 at AX5 with Bold Text.

## 12. Android later
Same layout; the system permission dialog differs and is Android's work later.
