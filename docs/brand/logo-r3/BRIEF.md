# Logo round 3 brief: refine the quotation mark (Oct 3 2026)

## Why this round
Five neutral critics reviewed six round 2 concepts blind (docs/brand/logo-r2/neutral-review/, key in KEY.md). They agreed:
- None of the six meets the founder's bar yet.
- **B, "two voices"** (a large and a small opening quotation mark, parent and child) is the strongest idea, ranked first or near it by 4 of 5. It is the only mark that carries the tagline "Exactly as you said it", the voice, and the parent and child bond at once.
- B's drawing fails as drawn:
  - The curled tails read as tadpoles, sperm or cherries, which is unacceptable for a baby product.
  - The small mark is drawn differently from the large one, not as a true scaled pair.
  - Hard notches where the tails meet the bowls, and mismatched terminals.
  - The large mark's hooked arch thins out and disappears at 29px.
- Two critics independently proposed combining the quote pair with a plain letter (sheet or envelope) so that "letters" reads instantly to grandparents. Risk: clutter and generic document icons.
- Colour: the flat sepia tile reads a little muddy or flat. Proposals: deepen it to about #7F4F30, or use a subtle vertical gradient from #94603F to #7C4F33, and test a paper tile with a sepia mark. The dark appearance was the best-looking icon. Light sepia on paper (2.07:1) is never used for the mark.
- Wordmark: the identity critic picked W4 (`packages/brand/assets/logo/r2/wordmark/d-garamond`, EB Garamond, warmer, bookish), with about 15 percent wider word spacing and a small cut below 20px. W1 (`a-signature`, Literata) was the designer's pick and is the fallback.
- Rejected for good reasons:
  - moon (Islamic and Eid crescent reading, sleep or mail app);
  - heart split by a fold (reads as a broken heart for separated co-parents);
  - mobile (babyish, breaks below 40px);
  - rings (an eye or a baby monitor);
  - book (Apple Books).

## The founder's bar (verbatim intent)
Simple, elegant, communicative, expressive, elite. Something parents relate to, with brand recall. Empathy. Clean colours. A very high quality bar. Not the letter "e".

## Non-negotiables for the quote mark
1. It must read unmistakably as an opening quotation mark ("66" shape) in one glance, and as parent and child through scale and lean. Never as tadpoles, sperm, cherries, commas, notes, a 6 or a 9, or a 69.
2. Tails are short, thick and blunt, ending in a calm teardrop or a flat cut that matches a great serif's quote glyph, studied from EB Garamond, Literata and classic book faces. Draw it custom, not as a font glyph.
3. The small mark is the large mark scaled (one drawing) and placed with a deliberate relationship: nestled, leaning in, sharing a baseline or an optical centre. Document the ratio.
4. G2-smooth joins, no notches, few nodes, optical overshoot, and weight that holds at 16 and 29px (a dedicated small cut is allowed).
5. Colours only from the brand family (packages/brand/index.ts), plus the tile refinements above if they are tested and win.
6. All earlier bans still apply (docs/brand/LOGO_R2_BRIEF.md).

## Tests (report honestly, with renders you have looked at)
The six tests from LOGO_R2_BRIEF.md (2am, caption, recall, scale, misread, elite), plus:
- the "show a stranger" test: describe what you see without context;
- use the icon bench: `node packages/brand/assets/logo/r2/icon-craft/bench.mjs` (read its header or BENCH_INDEX.md for usage) for home screen, sizes and appearances.

## Rules
- Write only in your own folder under `packages/brand/assets/logo/r3/<slug>/`.
- No installs, commits, pushes or deploys.
- `playwright` lives at `/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/node_modules`; Chromium is at `/opt/pw-browsers/chromium`.
- Look at every render with the Read tool.
- Deliverables are as in LOGO_R2_BRIEF.md, plus `presentation.html` and `DONE` (a one-line summary).
