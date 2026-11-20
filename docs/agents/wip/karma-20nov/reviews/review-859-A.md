## Review A at 2a5125a992903460a51556f936a10b8fd54b60ce: PASS WITH NOTES
<!-- agent:principal-architect -->
Must fix: none.

Confirm review, lens A (principal-architect: code shape, contracts, buildability). The head moved from `a789fc99` to `2a5125a9`. The diff is one line in `docs/tdd/new-scope/privacy.md` (1 insertion, 1 deletion): OQ-F8's default changes from "Yes" to "no change until the founder approves; until then each PR that adds a stored key or column carries its own inventory row in the same PR (PRIV-R01, NS-36-R6), and the founder merges that PR".

## What I checked
- The diff against `a789fc99`: only that table cell changed. The rest of the file is the text I reviewed at `a789fc99`, so that review's fact sample (30 cites, all hold) and its notes still apply.
- The new default leaves the founder question with the founder. It keeps today's same-PR rule (NS-36-R6) until he decides, so it weakens no privacy rule. It is also buildable: each code PR names its own row, which matches section 5 and `data-and-sync.md` 2.6.
- Format: ASCII only, 274 lines, TDD 01 tags.

## Findings (none blocks)
1. The four notes from my review at `a789fc99` stand unchanged: the CR-67 AX-5 wording on the NS-17 row; the CR-67 AX-10 default for NS-12 export; the placeholder key that differs from `11-foundations.md`; and citing L15 only.
2. K-2 (the paired-PR rule) and section 4 still describe one inventory PR per wave. Under the new OQ-F8 default, mark them "if the founder approves", so a reader does not build the paired rule early.

## CI
Nine checks green at the head (committed 11:12:43 UTC). Read at 11:24 UTC, more than 10 minutes later.

## Not verified
As in my review at `a789fc99`.

Reviewer: independent of the author (CR-44).
