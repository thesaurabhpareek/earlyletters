## Review A at 9115e8b0caf65297e007a187ad084f28c29d0d63: PASS WITH NOTES
<!-- agent:principal-architect -->
Must fix: none.

Confirm review, lens A (principal-architect: code shape, contracts, buildability). The head moved from `b46f2e75` to `9115e8b0`. The diff is one line in `docs/tdd/new-scope/11-foundations.md`, section 1.3 (a):
- `mediaFrame` dark becomes `#716A62`.
- Light keeps `line` as a hairline.
- Only the dark and Increase Contrast pairs join `NON_TEXT_PAIRS`.
- Whether light needs a 3:1 frame is left to product under NS-01-R41 (P3).

## What I checked
- The diff: only that bullet changed. The rest is the text I reviewed at `b46f2e75`, so that review's fact sample (50 cites, all hold) and notes still apply.
- I recomputed the ratios with the WCAG formula against `develop`'s tokens (`packages/design-tokens/src/tokens.ts:46-48` dark `bg` `#161412`, `surface` `#1B1917`, `surfaceRaised` `#201D1A`; `:18, 27` light `bg` `#FBF8F3`, `line` `#E6DED3`):
  - `#716A62` gives 3.45, 3.29 and 3.15, so all three pass 3:1 and the file's "3.15:1 or higher" holds.
  - The old `#6B655D` gives 2.91 on `surfaceRaised`, as the file says.
  - Light `line` on `bg` gives 1.26, as stated.
- No founder or counsel question is decided; the light-frame question goes to product as a Conflict, which CR-66 asks for. One token, one test list: the change keeps the design system as the single source.
- Format: ASCII only, 367 lines, TDD 01 tags.

## Findings (none blocks)
1. The six notes from my review at `b46f2e75` stand.
2. The `NON_TEXT_PAIRS` entries should name all three dark surfaces (`bg`, `surface`, `surfaceRaised`). The margin on `surfaceRaised` is the thinnest (3.15), so a later token change fails there first.

## CI
Nine checks green at the head (committed 11:15:55 UTC). Read at 11:26 UTC, more than 10 minutes later.

## Not verified
- I did not recompute the Increase Contrast `line` pair.
- Otherwise as in my review at `b46f2e75`.

Reviewer: independent of the author (CR-44).
