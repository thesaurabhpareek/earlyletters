# Logo round 2 brief (Oct 3 2026)

## Founder direction (verbatim intent)
A logo built on the letter "e" communicates nothing. The mark must be something parents relate to, with brand recall value: **simple, elegant, communicative, expressive, elite.**

## The emotion
One voice speaking softly to one small person, kept for years until that person can read it. The feeling the mark should leave: *"I was loved before I can remember."* Tender, intimate, unhurried, lasting. Grown-up and heirloom, never babyish. Premium benchmark: Calm, Headspace, Day One, Aesop, Apple, Penguin Classics, Airbnb's Bélo (a simple symbol people can draw from memory).

## Round 1 lessons (do not repeat)
- Letterform monograms ("e") read as publishing or fintech and carry no feeling.
- Any horizontal bar through a form reads as strikethrough (deletion), the opposite of "kept exactly".
- A wave that settles into a flat line reads as a heart-monitor flatline. Banned: no loss or death readings, ever.
- Even-weight monoline at icon size reads as a marker or a rope, not a pen.
- A concept that needs a caption to be understood has failed.

## Hard rules
- No letter "e" or "EL" monogram as the symbol. The wordmark stays typographic: reuse `packages/brand/assets/logo/a/wordmark.svg` (outlined Literata 500, joined tt) unless you can show a clearly better pairing.
- Banned motifs (docs/design/CREATIVE.md): wax seals, quills, ribbons, sparkles, confetti, faces, mascots, drawn babies, plus round 1 bans: microphones, generic soundwaves, speech bubbles, rattles, footprints, storks, prams, flatlines.
- Hearts only if the heart is an emergent negative space, never a drawn heart.
- Colours only from `packages/brand/index.ts`. Primary app icon background is sepia accent #8A5A3B with paper #FBF8F3 mark, unless the concept clearly needs otherwise.
- Must work: 16px favicon, 29/40/60px iOS home screen and Settings, 180px, 1024 App Store, single-colour emboss on a cloth book cover, email header at 28px tall, light and dark.
- Must be drawable from memory in about 5 seconds by a parent who saw it once (the recall test).
- Must not resemble an existing well-known mark. Check with image/web search (envelope logos, quote logos, moon logos, book logos) and report near matches honestly.

## The tests every candidate must pass (report each, pass or fail with notes)
1. **2am test:** a tired parent sees the icon on their home screen at night. What do they feel in one second?
2. **Caption test:** show it with no words. Can someone say what the product is about (letters, a child, voice, keeping)?
3. **Recall test:** describe it in under 8 words.
4. **Scale test:** 16px and 29px renders, magnified, still read.
5. **Misread test:** list every unwanted reading (logos of other companies, symbols, body parts, death or loss, religious symbols, political symbols).
6. **Elite test:** would it look at home next to Aesop, Calm and Apple Books?

## Deliverables per designer (in your own folder `packages/brand/assets/logo/r2/<slug>/`)
- `symbol.svg` (ink), `symbol-reversed.svg`, `symbol-accent.svg`, `symbol-small.svg` (optical cut for at most 40px), `favicon.svg` (prefers-color-scheme), `lockup-horizontal.svg`, `lockup-stacked.svg`, `app-icon-1024.png` (opaque RGB).
- `presentation.html`: the mark large on paper and on night; the 16/29/60/180 size row (with 8x magnified 16 and 29); iOS home screen mock among realistic neighbouring icons in light and dark; email header at 28px; book spine and cloth cover emboss; the six tests with honest results; and 3 sentences of rationale written for a parent, not a designer.
- `sketches/`: your rejected explorations as PNGs, with one line each on why they were rejected.
- Build from source with code (`source/build.mjs` or `.ts`), filled paths only, no strokes or live text in final SVGs, few nodes, clean beziers, optical corrections.
- Render with Playwright Chromium (`/opt/pw-browsers/chromium`; `playwright` is installed at `/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/node_modules`) and LOOK at every render with the Read tool. Iterate at least 6 rounds. Treat your first idea as a sketch.

## Rules of work
Write only in your folder. Do not install packages, commit, push or deploy. Final report under 250 words: the chosen mark in one sentence, the 3-sentence parent rationale, test results, honest weaknesses, near-match marks found.
