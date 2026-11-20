# NS-34 targets: proposed wording for 06-nfr rows 42 and 216 (BL-930)

Status: DRAFT by `qa`, 20 Nov 2026. This is a pair task (BL-930). `qa` drafted it; `product` owns `docs/prd/v2/06-nfr.md` and makes the edit there. Agents other than `product` never edit requirement files. A line marked **CONFIRM** needs `product`'s yes or a change before the row is merged. A line marked **FOUNDER** needs the founder's written yes, and nobody else can give it. BL-929 (the SE 3 run sheet) cites the rows once they are merged.

Sources:
- Card: NS-34 in `docs/product/prd/11-foundations.md` (lock `450bcb4a`). Its targets run from line 360 to line 367; this file uses lines 362 to 365. Its P0 rows are R2, R5 and R6.
- Current rows: `docs/prd/v2/06-nfr.md:42` (screen transition) and `:216` (Reduce Motion).
- Design: `docs/tdd/new-scope/11-foundations.md` section 4 (#864).
- Backlog scope: BL-930 in `docs/BACKLOG.md`.
- Code facts were read on `develop` at bc425d2f.

Where the card and the backlog scope disagree, the card wins (run rules), and this file says so at that point.

## Row 42, proposed

| Metric | Budget | How measured | Gate | Source |
|---|---|---|---|---|
| Screen change and hand-offs (push, sheet, tab, named hand-off) | A screen change starts within 100 ms of the tap; its controls are usable by 350 ms; no UI-thread frame is over 16.7 ms while it runs or while the Book or a letter page scrolls. The named hand-offs (Home to Listen, Listen to Review, a Book card to its letter page) finish within 900 ms (`tokens.motion.sequenceMaxMs`). The save hand-off runs from the tap on Keep until the Book shows the new letter and takes a tap; the arrival wash after that is not part of it. It finishes within 2,000 ms (`tokens.motion.hardCeilingMs`), and the local save commit inside it stays at p95 200 ms (row 56) | Device: SE 3, iOS 17 and latest, 06-nfr section 0 protocol, Asha test install. Start and usable by 240 fps video from a second phone (frames of 4.2 ms, finger contact to the first changed frame); frames by Instruments Animation Hitches on a Release build; marked "by hand" until the `perf` profile and markers exist. Test: `apps/mobile/test/transitions.test.ts` holds each choreography at or under its token (`:130` checks `dissolveMs <= sequenceMaxMs`, `:214-216` checks `bookAtMs`); BL-929 run sheet rows 4 to 7 | Yes | A-NFR-003; TDD 09 section 8.2; NS-34 |

Why it changes:
- "Completes within 350 ms" cannot hold for the built hand-offs. The tokens cap sequences at 900 ms and 2,000 ms (`packages/design-tokens/src/tokens.ts:327-328`).
- The save sequence puts the Book on screen at `sequenceMaxMs + fadeMs`, which is 1,100 ms counted from the commit, not from the tap (`apps/mobile/src/lib/transitions.logic.ts:167-175`). With the commit at p95 200 ms, Keep to the Book is about 1,300 ms. The 1,600 ms arrival wash (`newMarkMs`, `tokens.ts:330`) ends about 2,700 ms after the commit, so the row says where the bound ends.
- The 16.7 ms frame rule combines today's row 42 (during a transition) with the card's rule (while scrolling, line 362). It is not a new number.
- "Controls usable by 350 ms" keeps the promise that a parent can act quickly, even while a choreographed hand-off is still running.

**CONFIRM 1 (the card's list against the code).** The card's 900 ms list includes "Review to the Book after Keep" (card line 363). The card then gives the same move 2,000 ms as the save hand-off (line 364). The built sequence takes about 1,300 ms, so it fails the first bound and passes the second.
- The draft above leaves Review to the Book out of the 900 ms list and holds it to 2,000 ms only, which matches BL-930's scope.
- If `product` keeps the card's 900 ms instead, the design's row 5 holds "that screen's motion change" (`docs/tdd/new-scope/11-foundations.md:150`): the save choreography, not the store build. The design's row 6 holds any store build only when the save hand-off misses 2,000 ms (`:151`).
- Recommendation: 2,000 ms. If `product` agrees, card line 363 and the design's row 5 (`:150`) change in the same lock-change PR, listing the id.

**FOUNDER 1 (sample counts, a question for the founder).** 06-nfr section 0 asks for at least 200 samples per metric (`06-nfr.md:9`), and the card repeats it. One person filming with a second phone cannot reach 200 taps for each of the 5 hand-offs on 2 iOS versions. The design lists stand-in sample counts among the founder's open questions (`docs/tdd/new-scope/11-foundations.md`, section 12, and conflict P5 at `:347`). The question for the founder: will you accept, in writing, a stand-in count of 200 for Speak and 20 for every other hand-off, marked stand-in in the evidence until the `perf` markers land (RR-8)? Until he answers, each of those rows is "not measured" under the card's rule, and it holds what the design says it holds.

## Row 216, proposed

| Rule | Budget | How measured | Gate | Source |
|---|---|---|---|---|
| Reduce Motion and loops | Reduce Motion is honoured everywhere: every move becomes a 200 ms fade (`tokens.motion.fadeMs`). A loop changes opacity only, runs only on the screen in front (focused, visible, app active, no sheet over it), and does not run under Reduce Motion or Low Power Mode | Unit: `apps/mobile/test/lamp.test.ts` (`shouldBreathe`, `breathKeyframes`) today. New tests, owned by `mobile`, for each other loop (see the table below). Device: watch each screen for 10 s with Reduce Motion on, then with Low Power Mode on (BL-929 row 8; journey J-N15) | Yes | PRD 1.3 7.6; TDD 09 section 8.2; NS-34 |

Why it changes: "Honoured everywhere" did not say what a loop may do. Three loops ship today, and none of them meets every clause:

| Loop | Opacity only | Focused screen only | App active | No sheet over it | Off under Reduce Motion | Off in Low Power Mode |
|---|---|---|---|---|---|---|
| Lamp breath, `apps/mobile/src/components/ui/lamp.logic.ts:272-281` | met (`:272-274`) | met (`:280-281`) | met | met (`sheetUp`) | met | **missed** (`lamp.tsx:40-41`: it would need `expo-battery`) |
| `Breathe`, `apps/mobile/src/components/motion/breathe.tsx:13-37`; used at `components/ui/empty-state.tsx:49` and `components/ui/state-screen.tsx:112`, `:165` | met (`:35`) | met, by the caller's `paused={!focused}` | met (`:19`, `:23`) | **not checked**; it is met only where a sheet takes focus (unverified) | met (`:23`) | **missed** |
| `WaitingBar`, `apps/mobile/src/components/family/join-ask.tsx:66-82`; used at `app/invite/index.tsx:426` | **missed**: a `translateX` sweep (`:82`), repeated without end (`:78`) | **not checked** | **not checked** | **not checked** | met (`:72`) | **missed** |

**CONFIRM 2 (is a progress sweep a loop?).** `WaitingBar` shows that a book is still coming down. It is a progress indicator, not decoration. Two readings:
- (a) It is a loop. Then today it misses opacity only and the screen rules, and `mobile` owns the fix: an opacity pulse in place of the sweep, plus `AppState` and focus checks.
- (b) Progress indicators are exempt from "opacity only", but still stop under Reduce Motion and Low Power Mode, and still run only while their screen is in front. The row then says so in words.

Recommendation: (b). A sweep that shows something is still happening carries meaning, and Apple's own activity indicators move. It still needs the focus, `AppState` and Low Power Mode checks, owned by `mobile`.

**CONFIRM 3 (Low Power Mode, the card against the code).** The card keeps Low Power Mode (line 365), and so does today's row 216 ("no loops in Low Power Mode"). BL-930's backlog scope leaves it out. No loop in the code reads Low Power Mode (table above), so this clause is missed today by all three. The draft keeps it because the card wins. `product` chooses:
- (a) keep it, and `mobile` adds one shared guard that all three loops read (`expo-battery`, a new dependency, owner `mobile`);
- (b) drop it from the card in a lock-change PR.

Recommendation: (a). Until then the device row records the clause as missed. Under the design's row 8 (`docs/tdd/new-scope/11-foundations.md:153`), a miss holds "that screen", which here means Home and the other lamp screens, every screen that uses `empty-state` or `state-screen`, and the invite screen. It does not hold the store build. That reading needs `product`'s yes.

## What the trace sees

NS-34 P0 rows R2, R5 and R6 are untested in the BL-964 first report (#878). R2 is a rule for the release gate, not a test that runs on the phone; its natural test is the G6 preflight check (eval C s2.3). R5 and R6 get their tests with BL-929 and the markers. None of these rows changes here.

## Not done here

- No edit to `docs/prd/v2/06-nfr.md`, the cards or the design. Those edits belong to `product`.
- No code change to the loops. That is `mobile`'s, after CONFIRM 2 and 3.
- No run sheet. That is BL-929, next.
- No device numbers. None has been measured on an SE 3 (card section 2).
