## Review B at dad3912d1be0c83ab83c057ee44bf10ddc756683: PASS WITH NOTES
<!-- agent:security-architect -->

Lens B: identity and security (chapters 05 IAM, 06 SEC). File: `docs/tdd/new-scope/security.md` (379 lines). The head was committed at 11:30:56 UTC and read again live at 11:41 UTC, so it is more than 10 minutes old. CI on the head: complete, 9 of 9 checks pass. This head differs from `7dec5613` by one line, E3 in section 3.5 (Review A's must-fix).

Independence: Karma ruled on 20 Nov that this review counts under CR-44. CR-44 asks for independence of method. I am a separate session with my own context and brief.

Must fix: none.

## What I checked
I reviewed the round from my review of `dfa66e2f`, which was CHANGES with two must-fixes. The diff to this head touches this one file (35 lines added, 13 removed).

Must fix 1, the lock screen and notifications, is closed:
- B2 now names the lock screen and Notification Center, and lists NS-13, NS-18 and NS-32 as crossings.
- Those three cards have left the list of cards with no threat table.
- New section 3.11 models the lock screen (NS-32-R12, R13, J-N24), the reminder planned under account A that would show to account B (NSC-03, NS-10-R3) and notification identifiers (NSC-06).
- NSC-03 now covers notifications that are planned and those still scheduled, plus `accessibilityViewIsModal` on the cover. Its test cannot pass while a reminder names A's child.
- Risk 3 now cites the gate. `gate.logic.ts:122-125` holds: line 122 is blank and lines 123 to 125 open Tonight.

Must fix 2, X2, is closed:
- Section 3.5 states the rule for a child's voice or picture and cites `00-product-frame.md:85`.
- The table adds three picture paths: NS-05 Level 1, the 1.7.0 export through Export or Save a copy (BL-933), and the NS-07 PDF.
- My read for those paths is E1 to E3, and each condition can be tested.
- E3 at this head: a sealed letter's picture stays out of the NS-07 PDF and out of any export but the author's own until it opens; the author's own Export and Save a copy carry it whole. That matches the card (NS-06-B2 names the PDF book, with the FS-R11 exception for the author's own export) and ADR 0028 D2 (`:76`, `:103`). Save a copy is the same export code path (`08-keeping.md` section 5), so the exception covers it. Another person's export never holds a letter they cannot read.
- NS-07-C28-2, NS-07-C28-12, NS-11-R11, NS-11-R23 and NS-06-B2 exist in the locked pack as cited.

Notes taken:
- B8 to B10 follow eval C TB6 to TB8, matching CR-67 AX-17.
- B11 covers the server to the escrow project and a second storage provider, for the NS-08 flip.
- NSC-04 now says "partly enforced" and bans the App Intents tokens by presence, with an allowlist that I approve.
- The marker cite now reads `lib.mjs:253`.
- K-8 now cites `OPERATING_MODEL.md:58` (the agent marker) and `:83` (the red-team marker). Both hold.

Facts: the 29 cites that held at `dfa66e2f` are unchanged. The 2 that were slightly off are fixed. I checked 9 new cites, plus 3 for E3 at this head (NS-06-B2, ADR 0028 `:76`, `:103`), and all hold. Total: 43 of 43.

Boundaries:
- No founder or counsel question is decided.
- The counsel line for export and PDF pictures is a stated default ("the same act as Export") pending Q45. It is not a ruling.

## Findings (most serious first)
1. The X2 counsel default in 3.5 for Export, Save a copy and the PDF should read "until Q45 is answered", as OQ-S4 does. That way nobody reads it as counsel's answer. Wording only.
2. Section 3.11 says notification identifiers are opaque. The planner should use one random id per notification, not a letter id or child id. Under rule 5, a child id in an identifier is L3, and identifiers can surface in system logs. Add that to the 3.11 row when the planner PR is reviewed.
3. Section 1 notes that NS-26 (push) is parked. When it is unparked, a push sender is a new B3 crossing and needs its own table.
4. Format: ASCII only, 379 lines, TDD 01 tags, and card rows cited rather than copied.

## Buildability
Each NSC row has a test and an owner. S-1 to S-8 give owner, lenses, size and order. The test for NSC-03 now has the reminder case.

## Not verified
- Writing Tools behaviour.
- The file protection class of copied pictures.
- FTS5 `secure-delete` and WAL residue.
- M4A atoms.
- `CLIENT_IP_HEADER`.
- Whether a replaced view keeps its grants on hosted Postgres.
- Nothing was run on a phone or a database.

Reviewer: independent of the author (CR-44).
