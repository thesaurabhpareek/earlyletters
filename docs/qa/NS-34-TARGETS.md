# NS-34 targets: proposed wording for 06-nfr rows 42 and 216 (BL-930)

Status: DRAFT by `qa`, 20 Nov 2026. This is a pair task (BL-930). `qa` drafted it; `product` owns `docs/prd/v2/06-nfr.md` and makes the edit there. Agents other than `product` never edit requirement files.

Two kinds of open point:
- **CONFIRM** lines read the wording, and `product` answers them.
- **FOUNDER** lines change a target on the founder-approved card, and only the founder can answer them. The card says a target changes only by the founder (NS-34-R2 at card line 416; section 5 at line 379), and so does the design (`docs/tdd/new-scope/11-foundations.md:163`). Card fixes go through the errata file CR-66 names (`docs/agents/cto/RULINGS.md:637-639`; `docs/product/prd/18-errata-after-lock.md`, which does not exist yet). `product` may recommend on each FOUNDER line.

BL-929 (the SE 3 run sheet) cites the rows once they are merged.

Sources:
- Card: NS-34 in `docs/product/prd/11-foundations.md` (lock `450bcb4a`). Its targets run from line 360 to line 367, and this file uses lines 362 to 365. Its P0 rows are R2, R5 and R6.
- Current rows: `docs/prd/v2/06-nfr.md:42` and `:216`.
- Design: `docs/tdd/new-scope/11-foundations.md` section 4 (#864). Its device rows 1 to 16 (`:146-161`) are the numbering the BL-929 sheet is expected to follow; a "row n" below means the design's row n.
- Code facts were read on `develop` at 2f2beb77.

## Row 42, proposed

| Metric | Budget | How measured | Gate | Source |
|---|---|---|---|---|
| Screen change and hand-offs (push, sheet, tab, named hand-off) | A screen change starts within 100 ms of the tap; its controls are usable by 350 ms; no UI-thread frame is over 16.7 ms while it runs or while the Book or a letter page scrolls. The named hand-offs (Home to Listen, Listen to Review, Review to the Book after Keep, a Book card to its letter page) finish within 900 ms (`tokens.motion.sequenceMaxMs`); "Review to the Book after Keep" in this list waits for FOUNDER 2. The save hand-off runs from the tap on Keep until the Book shows the new letter and takes a tap; the arrival wash after that is not part of it. It finishes within 2,000 ms (`tokens.motion.hardCeilingMs`), and the local save commit inside it stays at p95 200 ms (row 56) | Device: SE 3, iOS 17 and latest, 06-nfr section 0 protocol, Asha test install. Start and usable by 240 fps video from a second phone (frames of 4.2 ms, finger contact to the first changed frame); frames by Instruments Animation Hitches on a Release build; marked "by hand" until the `perf` profile and markers exist. Design rows 4 to 7 on the BL-929 sheet. Tripwires, not evidence (design `:133`): `apps/mobile/test/transitions.test.ts:130` (`dissolveMs <= sequenceMaxMs`) and `:214-216` (`bookAtMs`) | Yes | A-NFR-003; TDD 09 section 8.2; NS-34 |

Why it changes:
- "Completes within 350 ms" cannot hold for the built hand-offs. The tokens cap sequences at 900 ms and 2,000 ms (`packages/design-tokens/src/tokens.ts:327-328`).
- The save sequence puts the Book on screen at `sequenceMaxMs + fadeMs`, which is 1,100 ms counted from the commit, not from the tap (`apps/mobile/src/lib/transitions.logic.ts:167-175`). With the commit at p95 200 ms, Keep to the Book takes about 1,300 ms. The 1,600 ms arrival wash (`newMarkMs`, `tokens.ts:330`) ends about 2,700 ms after the commit, so the row says where the bound ends.
- The 16.7 ms frame rule combines today's row 42 (during a transition) with the card's rule (while scrolling, line 362). It is not a new number.

**FOUNDER 1 (sample counts).** 06-nfr section 0 asks for at least 200 samples per metric (`06-nfr.md:9`), and the card repeats it (line 357). By hand, design rows 1 to 6 cannot reach that (design `:169`): Speak, cold start, warm start, screen change, the hand-offs and the save hand-off. Until the counts are reached, those rows are "not measured", and under the design's rule (`:163`) an unmeasured row holds its feature.
- The question for the founder: will you accept, in writing (RR-8), a stand-in count for design rows 1 to 6 until the `perf` markers land? The proposal is 200 taps for Speak and 20 runs for each of the others, each marked stand-in in the evidence.
- This is the design's own default (`:340`; conflict P5 at `:347`).

**FOUNDER 2 (the save hand-off bound; a card target).** The card lists "Review to the Book after Keep" under 900 ms (card line 363). It then gives the same move 2,000 ms as the save hand-off (line 364). The built sequence takes about 1,300 ms, so it misses the first bound and meets the second. Under the design, a miss of the 900 ms row holds that screen's motion change (`:150`), and a miss of the 2,000 ms row holds any store build (`:151`).
- The question for the founder: should "Review to the Book after Keep" leave the 900 ms list, so that it is held to 2,000 ms only?
- Recommendation: yes. It is the same move as the save hand-off, and BL-930's scope reads it that way.
- If he agrees, the errata file records it for card line 363 and the design's row 5 (`:150`). Until he answers, the proposed row keeps the card's list.

## Row 216, proposed

| Rule | Budget | How measured | Gate | Source |
|---|---|---|---|---|
| Reduce Motion and loops | Reduce Motion is honoured everywhere: every move becomes a 200 ms fade (`tokens.motion.fadeMs`). A loop changes opacity only, runs only on the screen in front (focused, visible, app active, no sheet over it), and does not run under Reduce Motion or Low Power Mode; which moving things count as loops waits for CONFIRM 2 | Manual V6 (`docs/prd/v2/07-quality-bar.md:213`), the only existing script that covers Low Power Mode. Device: watch each screen for 10 s with Reduce Motion on, then with Low Power Mode on (design row 8 on the BL-929 sheet; journey J-N15 covers Reduce Motion only). Unit: `apps/mobile/test/lamp.test.ts` (`shouldBreathe`, `breathKeyframes`) today; new tests, owned by `mobile`, for each other loop | Yes | PRD 1.3 7.6; TDD 09 section 8.2; NS-34 |

Why it changes: "Honoured everywhere" did not say what a loop may do. Four decorative or progress loops ship today, plus the system spinner, and none of them meets every clause. Paths are under `apps/mobile/src/`.

| Loop | Opacity only | Focused screen only | App active | No sheet over it | Off under Reduce Motion | Off in Low Power Mode |
|---|---|---|---|---|---|---|
| Lamp breath, `components/ui/lamp.logic.ts:272-281` | met (`:272-274`) | met (`:280-281`) | met | met (`sheetUp`) | met | **missed** (`components/ui/lamp.tsx:40-41`: it would need `expo-battery`) |
| `Breathe`, `components/motion/breathe.tsx:13-37`; used at `components/ui/empty-state.tsx:49` and `components/ui/state-screen.tsx:112`, `:165` | met (`:35`) | met, by the caller's `paused={!focused}` | met (`:19`, `:23`) | **not checked**; met only where a sheet takes focus (unverified) | met (`:23`) | **missed** |
| `WaitingBar`, `components/family/join-ask.tsx:66-82`; used at `app/invite/index.tsx:426` | **missed**: a `translateX` sweep (`:82`), repeated without end (`:78`) | **not checked** | **not checked** | **not checked** | met (`:72`) | **missed** |
| `ListeningAura` idle breath, `components/capture/listening-aura.tsx:90-94`: after 600 ms of quiet in a take (`idleAfterMs`, `tokens.ts:372`), a 7.5 s cosine (`breathIdleMs`, `tokens.ts:315`) | **missed**: it changes scale (`idleScale` 0.05, `tokens.ts:372`) as well as opacity (`:93-94`) | runs only while a take is live or ending (`components/capture/listen-meter.logic.ts:67-68`); focus is not read | **not checked** | **not checked** | met (`listening-aura.tsx:67`; `listen-meter.logic.ts:67-68`) | **missed** |
| System spinner `ActivityIndicator`, at 6 sites: `app/(auth)/sign-in/verify.tsx:81`, `app/settings/account.tsx:264`, `app/settings/delete-account.tsx:115`, `components/settings/open-deletion.tsx:109`, `components/ui/button.tsx:163` (while loading), `lib/auth/ui.tsx:170` | **missed**: it rotates | not checked by our code (unverified whether iOS stops a hidden spinner) | not checked by our code | not checked by our code | not checked by our code (unverified whether iOS changes it under Reduce Motion) | **missed** |

**CONFIRM 2 (which moving things are loops?).** Two readings:
- (a) Every repeating motion is a loop. Then today `WaitingBar`, the `ListeningAura` idle breath and all 6 spinners miss "opacity only", and `mobile` owns the fixes: an opacity form for each, plus the screen checks.
- (b) Decoration is a loop and must follow every clause. A progress indicator (`WaitingBar`, the spinners) or a light that follows the voice (`ListeningAura`) shows that something is happening, so it is exempt from "opacity only". It must still stop under Reduce Motion and Low Power Mode, and run only while its screen is in front. The row then says so in words.

Recommendation: (b). Apple's own activity indicators move. Under (b), each of the five still needs the Low Power Mode guard, and `WaitingBar` and `ListeningAura` need the `AppState` and focus checks. If `WaitingBar` keeps its sweep, `SWEEP_MS = 1400` (`components/family/join-ask.tsx:64`) becomes a motion token when `mobile` adds the guards: no durations typed in components. If `product` reads the aura as part of the capture screen rather than a loop, it should say so in the row.

**FOUNDER 3 (Low Power Mode; a card target).** The card keeps Low Power Mode (line 365), and so does today's row 216 ("no loops in Low Power Mode"). BL-930's backlog scope leaves it out. Nothing under `apps/mobile/src` reads Low Power Mode, so every loop above misses it today. The draft keeps it because the card wins.
- The question for the founder: keep the clause, with `mobile` adding one shared guard that every loop reads (`expo-battery`, a new dependency)? Or drop it, through the errata file?
- Recommendation: keep it.
- Until it is fixed, the device row records the clause as missed. Under the design's row 8 (`:153`), a miss holds "that screen": Home and the other lamp screens, every screen that uses `empty-state` or `state-screen`, the invite screen, Listen, and the screens with a spinner. It does not hold the store build.

## What the trace sees

NS-34 P0 rows R2, R5 and R6 are untested in the BL-964 report (#878, merged as 2f2beb77). R2 is a rule for the release gate, not a test that runs on the phone; its natural test is the G6 preflight check (eval C s2.3). R5 and R6 get their tests with BL-929 and the markers. None of these rows changes here.

## Not done here

- No edit to `docs/prd/v2/06-nfr.md`, the cards, the design or the errata file. Those edits belong to `product`, after the founder's answers.
- No code change to the loops. That is `mobile`'s, after CONFIRM 2 and FOUNDER 3.
- No run sheet. That is BL-929, next.
- No device numbers. None has been measured on an SE 3 (card section 2).
