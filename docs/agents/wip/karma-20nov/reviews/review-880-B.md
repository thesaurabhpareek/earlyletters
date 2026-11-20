## Review B at c3d71b1b5a9059b5dececad995eb0354c8a90379: PASS WITH NOTES
<!-- agent:principal-architect -->

Must fix: none.

Lens B (performance budgets as engineering facts), confirming at the new head. My earlier reviews:
- At 3aed2f23: CHANGES.
- At 64b879d2: PASS WITH NOTES.

Commit c3d71b1b answers review A's must-fixes:
- Changes to card targets now go to the founder as FOUNDER 2 and FOUNDER 3.
- The loop table now also lists the `ListeningAura` idle breath and the `ActivityIndicator` sites.

`docs/qa/NS-34-TARGETS.md` is 73 lines, ASCII only. Its code facts are read on develop at 2f2beb77 (#878 merged), which I checked is on develop.

### What I checked at c3d71b1b (31 cites sampled, 31 hold)
- **Founder routing.** Line 7 says a target changes only by the founder.
  - The card says this at NS-34-R2 (`11-foundations.md:416` on the lock) and in section 5 (`:379`).
  - The design says it at `docs/tdd/new-scope/11-foundations.md:163`. All three hold.
  - The errata route is right. `RULINGS.md:637` names `docs/product/prd/18-errata-after-lock.md`. That file does not exist on develop or on the lock, as the draft says.
- **FOUNDER 1 (sample counts)** is a question for the founder's written yes. The 200 samples hold at `06-nfr.md:9` and on the card at `:357`. Rows 1 to 6 can't be done by hand (design `:169`). The founder's default is at `:340`, and P5 is at `:347`. All hold.
- **FOUNDER 2 (Review to the Book)** is a question. Until the founder answers, the proposed row 42 keeps the card's 900 ms list, so the card wins in the meantime. The holds of rows 5 and 6 (`:150`, `:151`) hold.
- **FOUNDER 3 (Low Power Mode)** is a question. "Nothing under `apps/mobile/src` reads Low Power Mode" is true: `git grep` at 2f2beb77 finds only the comment at `lamp.tsx:40`. The hold under row 8 (`:153`) holds.
- **ListeningAura** (`components/capture/listening-aura.tsx`):
  - The scale and opacity breath is at `:90-94` (scale `:93`, opacity `:94`).
  - The Reduce Motion return is at `:67`.
  - It runs only while listening or processing (`listen-meter.logic.ts:67-68`).
  - `idleAfterMs: 600` and `idleScale: 0.05` are at `tokens.ts:372`, and `breathIdleMs: 7500` at `:315`.
  - All hold. It changes scale, so "opacity only" is missed, as stated.
- **ActivityIndicator:** all 6 sites hold, with 2 hits per file (import and use). They are `app/(auth)/sign-in/verify.tsx:81`, `app/settings/account.tsx:264`, `app/settings/delete-account.tsx:115`, `components/settings/open-deletion.tsx:109`, `components/ui/button.tsx:163` (inside `loading ?`) and `lib/auth/ui.tsx:170`.
- **Rows carried over from my last review:** Lamp, `Breathe` and `WaitingBar` still hold. So do `SWEEP_MS = 1400` (`join-ask.tsx:64`), tokens `:327-328` and `:330`, `transitions.logic.ts:167-175`, and `transitions.test.ts:130` and `:214-216`.
- **Other cites:**
  - Manual V6, "motion and Low Power Mode", is at `docs/prd/v2/07-quality-bar.md:213`. Holds.
  - The design calls the token tests "tripwires" at `:133`. Holds.
  - The design's device rows 1 to 16 are at `:146-161`. Holds.
- **Arithmetic:** 1,100 ms from the commit, about 1,300 ms from the tap, and the wash ending at about 2,700 ms. Unchanged and right.

### Notes (open, none blocking)
1. CONFIRM 2 (b) would exempt progress indicators and the aura from "opacity only". That narrows what card line 365 calls a loop. If `product` reads (b) as a change of scope, not a matter of wording, it belongs with FOUNDER 3 through the errata file. Say which it is when `product` answers.
2. Whether iOS stops or reduces a hidden `ActivityIndicator`, or one under Reduce Motion, is marked unverified in the draft. BL-929's row 8 walk should record what it sees on the SE 3 rather than assume.
3. The fixes under (a) or (b) need a `mobile` backlog row: the Low Power Mode guard for all five, and the focus and `AppState` checks for `WaitingBar` and `ListeningAura`. The draft names the owner, but there is no BL id yet.

### Boundaries
- The file edits no requirement, card, design or errata, and sets no date.
- Every change to a card target is a FOUNDER question, and `product` only recommends.
- CONFIRM 2 is product's wording question (see note 1).

### CI
At c3d71b1b at 12:12 UTC, the head was 10 minutes old and had not moved. Every check has completed. `required`, `tests and content rules`, `database rules`, `typecheck`, Deno, B-8, migrations, install and agent team succeeded. `compliance-fence` has one successful run and two cancelled duplicates.

### Not verified
- Whether every sheet over a `Breathe` screen takes focus.
- Spinner behaviour on iOS.
- Any device number.

Reviewer: independent of the author (CR-44).
