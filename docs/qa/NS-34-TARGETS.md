# NS-34 targets: proposed wording for 06-nfr rows 42 and 216 (BL-930)

Status: DRAFT by `qa`, 20 Nov 2026, for `product` to confirm. This is a pair task (BL-930). `qa` drafted it; `product` owns `docs/prd/v2/06-nfr.md` and makes the edit there. Agents other than `product` never edit requirement files. Each line marked **CONFIRM** needs `product`'s yes or a change before the row is merged. BL-929 (the SE 3 run sheet) cites the rows once they are merged.

Sources:
- Card: NS-34 in `docs/product/prd/11-foundations.md` (lock `450bcb4a`). Its targets are at lines 362 to 365; it has P0 rows R2, R5 and R6.
- Current rows: `docs/prd/v2/06-nfr.md:42` (screen transition) and `:216` (Reduce Motion) on `develop` at 20553b18.
- Backlog scope: BL-930 in `docs/BACKLOG.md`.

Where the card and the backlog scope disagree, the card wins (run rules), and this file says so at that point.

## Row 42, proposed

| Metric | Budget | How measured | Gate | Source |
|---|---|---|---|---|
| Screen change and hand-offs (push, sheet, tab, named hand-off) | A screen change starts within 100 ms of the tap; its controls are usable by 350 ms; no UI-thread frame is over 16.7 ms while it runs or while the Book or a letter page scrolls. The named hand-offs (Home to Listen, Listen to Review, a Book card to its letter page) finish within 900 ms (`tokens.motion.sequenceMaxMs`). The save hand-off (Keep to the Book showing the letter) finishes within 2,000 ms (`tokens.motion.hardCeilingMs`); the local save commit inside it stays at p95 200 ms (row 56) | Device: SE 3, iOS 17 and latest, 06-nfr section 0 protocol, Asha test install. Start and usable by 240 fps video from a second phone (frames of 4.2 ms, finger contact to the first changed frame); frames by Instruments Animation Hitches on a Release build; marked "by hand" until the `perf` profile and markers exist. Test: `apps/mobile/test/transitions.test.ts` holds each choreography at or under its token (it exists today and checks `dissolveMs <= sequenceMaxMs` and `bookAtMs`); BL-929 run sheet rows 4 to 7 | Yes | A-NFR-003; TDD 09 section 8.2; NS-34 |

Why it changes:
- "Completes within 350 ms" cannot hold for the built hand-offs. The save-to-Book sequence puts the Book at `sequenceMaxMs + fadeMs`, which is 1,100 ms (`apps/mobile/src/lib/transitions.logic.ts:175`). The tokens cap sequences at 900 ms and 2,000 ms (`packages/design-tokens/src/tokens.ts:327-328`).
- "Controls usable by 350 ms" keeps the promise that a parent can act quickly, even while a choreographed hand-off is still running.

**CONFIRM 1 (card list against the code).** The card's 900 ms list includes "Review to the Book after Keep" (card line 363). The card then gives the same move, as the save hand-off, 2,000 ms (line 364). The built sequence takes 1,100 ms, so the first bound fails and the second passes. The draft above leaves Review to the Book out of the 900 ms list and holds it to 2,000 ms only. This matches BL-930's scope. If `product` keeps the card's 900 ms, the save hand-off becomes a miss and holds the store build under NS-34-R2. Recommendation: 2,000 ms. Product should correct card line 363 in a lock-change PR that lists the id.

**CONFIRM 2 (samples).** The card asks for 200 samples per metric (06-nfr section 0). One person filming with a second phone cannot reach 200 taps for each of the 5 hand-offs on 2 iOS versions. Recommendation (the wave-1 foundations design, open question P5, not merged): Speak 200; every other hand-off 20, marked stand-in until the markers land, as the founder accepts in writing (RR-8).

## Row 216, proposed

| Rule | Budget | How measured | Gate | Source |
|---|---|---|---|---|
| Reduce Motion and loops | Reduce Motion is honoured everywhere: every move becomes a 200 ms fade (`tokens.motion.fadeMs`). A loop changes opacity only, runs only on the screen in front (focused, visible, app active, no sheet over it), and does not run under Reduce Motion or Low Power Mode | Unit: `apps/mobile/test/lamp.test.ts` (`shouldBreathe`, `breathKeyframes`), plus a token test that every loop keyframe holds only `opacity`. Device: watch each screen for 10 s with Reduce Motion on, then with Low Power Mode on (BL-929 row 8; journey J-N15) | Yes | PRD 1.3 7.6; TDD 09 section 8.2; NS-34 |

Why it changes:
- "Honoured everywhere" did not say what a loop may do. The built rule already does what is proposed: `shouldBreathe` (`apps/mobile/src/components/ui/lamp.logic.ts:277-280`) returns true only when the scene breathes, is visible, the app is active, the screen is focused, Reduce Motion is off and no sheet is up. The keyframes are opacity only (`lamp.logic.ts:272-274`).

**CONFIRM 3 (Low Power Mode, the card against the code).** The card keeps Low Power Mode (line 365), and so does today's row 216 ("no loops in Low Power Mode"). BL-930's backlog scope leaves it out. The code does not read Low Power Mode: `apps/mobile/src/components/ui/lamp.tsx:40-41` says it would need `expo-battery`, which is a new dependency. Under the card, this part of the row is a miss today. The draft keeps Low Power Mode because the card wins. `product` decides between two ways forward:
- (a) keep it, and `mobile` adds the guard (new dependency, owner `mobile`);
- (b) drop it from the card in a lock-change PR.

Recommendation: (a). Until then, the device row records it as missed, and it holds only the screens that loop (Home's lamp), not the store build. That last point needs `product`'s yes.

## What the trace sees

NS-34 P0 rows R2, R5 and R6 are untested in the BL-964 first report (#878). R2 is a rule for the release gate, not a test that runs on the phone; its natural test is the G6 preflight check (eval C s2.3). R5 and R6 get their tests with BL-929 and the markers. None of these rows changes here.

## Not done here

- No edit to `docs/prd/v2/06-nfr.md` or the cards. That is `product`'s edit.
- No run sheet. That is BL-929, next.
- No device numbers. None has been measured on an SE 3 (card section 2).
