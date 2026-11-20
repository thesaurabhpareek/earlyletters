## Review A at c3d71b1b5a9059b5dececad995eb0354c8a90379: PASS WITH NOTES
<!-- agent:design-systems -->

Lens A: are the numbers and cites correct? This is a re-review after my CHANGES at 64b879d2. I checked against develop at 2f2beb77 (the merge of #878, still the tip of develop), the locked card NS-34 (`docs/product/prd/11-foundations.md` at 450bcb4a), and the merged design `docs/tdd/new-scope/11-foundations.md` on develop.

Must fix: none.

### Both earlier must-fixes are fixed
1. Target changes now go to the founder. FOUNDER 2 (Review to the Book after Keep) and FOUNDER 3 (Low Power Mode) are written as questions for the founder. Line 7 cites NS-34-R2 (card :416), section 5 (:379), design :163 and CR-66 (`RULINGS.md:637-639`). All of these hold. The proposed row 42 keeps the card's four-item 900 ms list and says it is waiting for FOUNDER 2. Card fixes now go through the errata file, which the file correctly says does not exist yet. `product` is left with CONFIRM 2 only.
2. The loop table now has the `ListeningAura` idle breath and the six `ActivityIndicator` sites. The table cites hold: `listening-aura.tsx` :67 and :90-94 (scale and opacity at :93-94), `idleAfterMs`, `idleScale` 0.05 and `breathIdleMs` 7500 (`tokens.ts:372` and `:315`), and `listen-meter.logic.ts:67-68`. All six spinner lines hold, and `button.tsx:163` shows its spinner only while loading. "Four loops plus the system spinner" is now correct.

### What I checked (61 cites: 60 hold, 1 holds in part)
- Unchanged from my first review, and still holding on 2f2beb77: 36 cites. These are the card's lines 357 and 360-367, 06-nfr :9, :42, :56 and :216, the tokens at :317, :327-328 and :330, `transitions.logic.ts:167-175` with its arithmetic (1,100, 1,300 and 2,700 ms), `transitions.test.ts` :130 and :214-216, the Lamp, `Breathe` and `WaitingBar` lines, `lamp.test.ts`, BL-930, RR-8, eval C s2.3, and #878. No cited code file changed between bc425d2f and 2f2beb77.
- New, all holding (24):
  - Design: rows 1 to 16 at :146-161, the stand-in risk for rows 1 to 6 at :169, the "not measured" rule at :163, the default at :340, P5 at :347, rows 5, 6 and 8 at :150, :151 and :153, and tripwires at :133.
  - Manual V6, "motion and Low Power Mode", at `docs/prd/v2/07-quality-bar.md:213`.
  - `SWEEP_MS = 1400` at `join-ask.tsx:64`.
  - 2f2beb77 is the #878 merge.
- Holds in part (1): J-N15 covers Reduce Motion only, and the file now says so.
- My earlier notes are all taken up. FOUNDER 1 now cites the design's rule (:163), covers design rows 1 to 6, and is a question. V6 is back in row 216. The test lines are labelled tripwires. "Row n" is tied to the design's numbering. Paths are under `apps/mobile/src/`. `SWEEP_MS` is raised as a token.
- Every open point reads as a question: CONFIRM 2, and FOUNDER 1, 2 and 3. Each recommendation is labelled as one. Nothing is presented as decided by `product` or the founder.
- Format: ASCII only, 73 lines.

### Notes (most serious first)
1. FOUNDER 3's last bullet says a Low Power Mode miss holds "that screen", including Listen and the screens with a spinner, and "does not hold the store build". That follows the design's row 8 (:153). But Listen is the capture screen, and `Button` shows a spinner on any screen with a loading button. Holding those screens holds the core loop, which NS-34-R2 marks as P0 for exactly that reason ("c: the core loop must feel safe"). In practice that comes close to holding the store build. My first draft had "that reading needs product's yes", and the new text drops it. Please put that consequence in front of the founder with FOUNDER 3, or bring the question back.
2. CONFIRM 2 (b) says the five items still need the Low Power Mode guard, and `WaitingBar` and `ListeningAura` need the `AppState` and focus checks. In the table, the spinners are also "not checked by our code" for focus, app active and sheet. Under (b) they must still run only on the screen in front. Please say that the spinners need the same checks, or that iOS covers them (unverified).
3. FOUNDER 2 says "If he agrees". The rest of the file says "the founder". This is a style point only.

CI: green on c3d71b1b. `required`, tests and content rules, typecheck, database rules, the Deno functions, the B-8 seam, install, team consistency and migrations all succeeded, and `compliance-fence` succeeded. Two earlier `compliance-fence` runs show as cancelled; they were superseded by the run that succeeded. The head is more than 10 minutes old (12:01:55 UTC; read at 12:12:25 UTC).

### Not verified
- Whether iOS stops or slows a hidden `ActivityIndicator`, or changes it under Reduce Motion (the file marks both as unverified).
- Whether `ui/sheet.tsx` takes focus from the screen under it, which decides whether `Breathe` meets "no sheet over it".
- Any device timing. Nothing was run on a phone.

Reviewer: independent of the author (CR-44).
