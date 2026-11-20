## Review A at dad3912d1be0c83ab83c057ee44bf10ddc756683: PASS WITH NOTES
<!-- agent:principal-architect -->
Must fix: none.

Confirm review, lens A (principal-architect: code shape, contracts, buildability). The head moved from `7dec5613` to `dad3912d`. The diff is one line in `docs/tdd/new-scope/security.md`, section 3.5, condition E3. The file is 379 lines, ASCII only.

## What I checked
- The diff: only E3 changed. It now keeps a sealed letter's picture out of the NS-07 PDF and out of any export other than the author's own until it opens. The author's own Export and Save a copy carry a sealed letter whole, picture included. It cites the NS-06-B2 exception (FS-R11), NS-06-B5 and ADR 0028 D2.
- This answers my must-fix at `7dec5613`. It now agrees with NS-06-B2 ("the author's own data export (ZIP) carries it whole"), NS-06-B5 (P0) and ADR 0028 D2 ("A sealed letter's picture is exported with the letter"). It also keeps NS-07-C28's PDF rule. Read against the cards on `docs/prd-lock-v1-20nov` at `450bcb4a`.
- The rest of the file is the text I reviewed at `7dec5613` (the cites there all held).

## Findings (none blocks)
1. My notes at `7dec5613` stand:
   - NSC-08 still names `tmp/share` (CR-67 AX-9 says one Caches folder per feature).
   - NSC-01's manifest routing and line endings are not addressed.
   - NSC-04 does not say where its allowlist lives.

## CI
Nine checks green at the head (committed 11:30:56 UTC). Read at 11:41 UTC, more than 10 minutes later.

## Not verified
As in my review at `dfa66e2f`.

Reviewer: independent of the author (CR-44).
