# Design critic review 1: earlyletters.com scroll film

Reviewer role: principal designer, Apple marketing web. Scope: STORYBOARD.md, site.ts, scenes S01 to S11, and the v4 renders (1440x900, 390x844, reduced-motion). Code was read, not edited.
Date: 2026-10-03. Frames live in `/tmp/claude-0/-home-claude-earlyletters/08667071-d80c-5896-b31f-845a0d80d7e1/scratchpad/shots/v4/`. File names below drop that prefix. `k` = frame index 0..7.

## Verdict

Not ready to show. The idea is right and the first third of the film has real feeling (S01 lamp, S03 spoken captions, S07 "Said once. Heard for years."). But six defects sit on the main path of a first-time visitor, and three of them are in the first 40 seconds: a collision in the hero frame, a broken window drawing on desktop, and a blank white slab with black bars in the S03 to S04 handoff. The paper-to-dusk hinge (S06) is the muddiest frame in the film. On phones the film's two proof moments (the spoken words in S03, the playing letter in S07) are either 10 px tall or hidden behind the CTA pill.

## What is earned (and nothing more)

- Handoff discipline is real. I diffed each scene's p=1 frame against the next scene's p=0 frame: S02 to S10 boundaries are pixel-identical (mean abs diff 0.00 to 0.08), S01 to S02 is 0.41 (lamp breathing). Note this is by construction (k=7 of N is the same scroll position as k=0 of N+1), so it proves the stage swap is a hard cut and that every cut must be judged by the timelines, not the contact sheet. Two cuts do fail (items 4 and 11).
- S03 desktop captions ("You looked at us, you looked at us like we were the strange ones.") are the best idea in the film: the parent's real, unedited words become the cinema. Contrast is fine (6.7:1 measured) and the type size (clamp 22 to 32) is right.
- S04's single quiet dotted underline and the Mirror to Meera swap is on-brief and honest.
- S07's lit-phone-in-a-dusk-room composition at 1440 (`1440x900-07-years-later-5.png`) is the most "Apple" frame in the set: one warm light, one bright object, a big serif line, lots of air.
- Restraint on the rules: no faces, no stock, no AI imagery anywhere. Colour arc night, paper, dusk, night, warm end card is legible.

## Method notes and limits

- Contrast was measured from pixels (95th and 5th percentile text colour vs median local background) on the 1440 frames; numbers below are approximations, good to about 0.3.
- I could not run the page. Item 2 is a root-cause hypothesis from the render plus the code; the one-minute test is given.
- Frame k is not exactly p = k/7 (the window finishes drawing at p 0.42 yet 1440 k=3 and k=4 both show it unfinished), so I cite frames for what they show and code timelines for what to change.

---

## P0: must fix before showing anyone (6)

### 1. Hero: the "y" of "Early" runs into the tagline
- Where: S01, `1440x900-01-evening-0.png` (the first frame every visitor sees). Descender of "y" at about x 545, y 465 touches the "b" of "baby memory book" at y 475.
- Why it matters: the signature frame has a typographic collision. Apple would not ship this; it reads as unfinished at the exact moment trust is set.
- Fix: `apps/web/src/scenes/S01Evening.module.css`, `.line { margin: 0.9em 0 0 }` becomes `margin: clamp(28px, 3.4vw, 52px) 0 0` (about 49 px at 1440, 28 px at 390). The h1 is `clamp(60px, 13vw, 176px)` with `line-height: 0.95`; a 176 px Literata descender is about 0.26em (46 px) so the tagline needs at least 0.28em of clearance. Recheck 390 (`390x844-01-evening-0.png`): there the wordmark wraps and clears, no change needed.

### 2. Hero window drawing is truncated and looks broken on desktop
- Where: S01, `1440x900-01-evening-3.png` and `-4.png`. The rod stops about 60% across, the frame's right side and the bottom pane edges never close, the sill ends in a stub, and the moon floats outside the frame at x about 1195. At 390 (`390x844-01-evening-3.png`) the same drawing is complete and lovely.
- Why it matters: it is the film's first drawn object and the one that teaches the visitor the visual language. It reads as a rendering bug, not a hand-drawn window.
- Likely cause: `components/drawings/Window.tsx` combines `vectorEffect="non-scaling-stroke"` with the `pathLength` motion value. In Chromium the dash is then computed in screen space, so a stroke only reaches roughly 1/scale of its length. Window renders at `min(28vw, 46svh)` = 403 px for a 240-unit viewBox (scale 1.68, strokes end near 60%) and about 210 px at 390 (scale 0.88, nearly complete). That fits the evidence.
- One-minute test: set `.window { width: 240px }` at 1440. If the drawing completes, this is the cause.
- Fix: in `Window.tsx` (and audit `Lamp.tsx`, `Moon.tsx`, `Bed.tsx`, `Shoes.tsx`, `Envelope.tsx`, `ReadingLamp.tsx`, `Room.tsx`, which share the pattern; the S07 bed's right end also looks open in `1440x900-07-years-later-3.png`): remove `vectorEffect` from both the animated `Line` and the static `<path>`; set `strokeWidth` to `target / scale` where scale = rendered width px / viewBox width (a `ResizeObserver` on the svg, or one CSS variable `--sw` per drawing). Keep `pathLength` as is. Target weight stays 1.5 px at every size.

### 3. S03 desktop: the support line runs under the phone and onto the transcript
- Where: S03, `1440x900-03-just-talk-1.png` and `-2.png`. "Say it the way you would say it to Meera. Pauses are fine." spans x 80 to 603; the phone's bezel starts at x 560, and the word "fine." lands on the bezel, 18 px above the phone's first transcript line "Mirror, um, today you found the light".
- Why it matters: it violates film rule 3 (text never over busy motion) in the scene that is supposed to be the emotional engine, and it is the line that tells the visitor what to do.
- Fix: `scenes/S03Talk.tsx`, the `copySide` block: add `style={{ width: 'min(540px, calc(50vw - ' + width/2 + 'px - max(var(--gutter), 50vw - 640px) - 48px))' }}` on viewports 900 and up. At 1440 that is 432 px (phone half-width 160). Support then wraps to three lines, which is fine. Because that width collapses below 900 to 1100 px, switch S03 to its stacked (phone) layout up to 1100: change `const narrow = w < 900` to `w < 1100` in this file only. Also check `.captions` (`min(30vw, 420px)`) clears the phone by the same 48 px.

### 4. S03 to S04 handoff: muddy grey screen, then a blank white slab with black bars
- Where: S03, `1440x900-03-just-talk-5.png` (screen dims to flat grey #3a3836 while the mic still glows), `1440x900-03-just-talk-6.png` (a 1090 px blank paper slab with a black bezel stripe at each side, a grey scrim band across the top, wordmark half on paper), and `390x844-03-just-talk-6.png` (an empty white iPhone screen with a Dynamic Island).
- Why it matters: this is the film's biggest set piece and it is currently the most "template" moment: two blank frames in a row. The cross-fade dark to white always passes through grey. Nothing reads as "the voice became words on paper".
- Fix (match-cut push-in), all transform and opacity, `scenes/S03Talk.tsx`:
  1. Remove the opacity cross-fade between `ListeningScreen` and the paper screen (`listening` [0.70,0.78] and `paperScreen` [0.70,0.80]). Replace with a paper sheet that rises inside the screen: `paperY = useTransform(p, [0.68, 0.76], ['100%', '0%'])` on an absolutely positioned div with `background: var(--paper)`; the screen's `overflow: hidden` clips it. No grey midpoint exists.
  2. Put the real letter on that sheet: `<PaperLetter />` in a wrapper `position:absolute; left:50%; top:50%; width: <S04 letter width px>; transform: translate(-50%,-50%) scale(1/fill)`. When the phone then scales by `fill` (0.76 to 0.92) the text grows to exactly S04's reading size and position (screen is centred, so the letter lands at the viewport centre). The push-in IS the handoff; delete the separate `.paper` layer's fade-in or shorten it to [0.90, 0.94] as a cleanup cross-fade to hide raster blur.
  3. Fade the phone chrome (edge ring and #050505 bezel) 1 to 0 over [0.80, 0.88]. `PhoneFrame.tsx` needs a `chrome?: MotionValue<number>` prop; move the two ring `background`/`boxShadow` values onto absolutely positioned child layers so they can fade without fading the screen.
  4. Header tone: see item 6, Scene must switch to tone 'paper' at p 0.84 in this scene so the dark scrim band disappears.
  5. Do not render a blank paper frame at any p. Delete the `grow` range overlap with `letterIn` [0.90, 0.96].

### 5. S03 on phones: the words being spoken are about 10 px
- Where: S03, `390x844-03-just-talk-2.png`, `-3.png` (phone width = 250 px, screen 229 px, transcript at `u(18)` = 10.5 px, set at 66% grey, faded at the top). The large desktop captions are gated off (`!narrow ? <captions> : null`).
- Why it matters: the spoken letter is the product. On phones, where this audience lives, it is the smallest, faintest text in the film, and the only text in the scene.
- Fix: `scenes/S03Talk.tsx`: render `captions` on narrow too. `S03Talk.module.css`: add
  `@media (max-width: 899px) { .captions { left: var(--gutter); right: var(--gutter); width: auto; top: calc(env(safe-area-inset-top, 0px) + 13svh); height: 22svh; transform: none; } .caption { font-size: clamp(22px, 6.2vw, 28px); align-items: flex-start; text-align: left; } }`.
  The headline leaves at p 0.38 on narrow, captions start at p 0.40, so the slot is free. Change `phoneY` on narrow to hold `8svh` from 0.04 until 0.70 (not return to 0 at 0.46), and return to 0 over 0.70 to 0.76 as the grow begins. Combined with item 19 (phone width) this also clears the CTA pill.

### 6. S06 to S07 hinge: the paper-to-dusk cross-fade passes through flat grey, and the header scrim shows as a band
- Where: S06, `1440x900-06-the-book-6.png` and `390x844-06-the-book-6.png`. The whole frame is #82786f, cards and numerals (27 to 30) nearly vanish, and a pale-to-grey gradient band sits across the top 85 px.
- Why it matters: this is the film's "years pass" moment. The ugliest frame in the film lands on the emotional hinge, right before the peak.
- Causes: `.dusk` is a solid `var(--dusk)` laid over `var(--paper)` with opacity 0.7 to 0.95. Two warm neutrals at 50% make a grey. And `Header` takes `data-tone` from the Scene's static `tone`, so during S06's dusk fade the scrim stays `rgba(251,248,243,0.8)` (and the same bug in S03 gives a dark band over white).
- Fix, `scenes/S06Book.tsx` and `S06Book.module.css`:
  1. Move the colour layers behind the covers (render before `.book`) so the paper cards stay crisp and legible while the room warms around them.
  2. Add `.golden { background: linear-gradient(to top, var(--accent) 0%, var(--night-accent) 48%, var(--lamp) 100%); }` with opacity [0.62, 0.78] 0 to 1, then `.dusk` [0.76, 0.95] 0 to 1 on top. Paper to gold to brown to dusk has no grey stop (midpoints: #e9d6b8, #8a6546).
  3. Fade `PaperTexture` and the paper `Vignette` out over [0.62, 0.80] so they do not tint the gold.
  4. Keep `bookOut` [0.86, 0.95].
  5. Header: in `film/Scene.tsx` accept `toneStops?: {at: number; tone: Tone}[]` and write `section.dataset.tone` from a `useMotionValueEvent(p, 'change', ...)` (attribute write only at threshold crossings, no React state). S06: `[{at: 0.80, tone: 'dusk'}]`. S03 (item 4): `[{at: 0.84, tone: 'paper'}]`.

---

## P1: should fix (11)

### 7. S07 on phones: the playing letter is hidden, the room is tiny, the shoes are cropped
- Where: S07, `390x844-07-years-later-3.png` (lamp and bed at 15% of height, cropped by the viewport and the CTA pill, shoes not visible) and `-5.png` and `reduced2/390x844-07-years-later-0.png` (phone bottom cropped; the player bar, the evidence of "heard", sits behind the pill).
- Why it matters: "Said once. Heard for years." is the thesis, and on phones nothing visible is playing.
- Fix, `S07Years.tsx` and `S07Years.module.css`, below 768 px: phone width `Math.round(Math.min(214, w * 0.55))`; `.phoneSlot { top: 37svh }` (phone height is about 2.09 x width = 447 px, bottom at about 750, 20 px above the pill at 770); support at 16 px / 1.45 (three lines is about 70 px; copy block ends at about 240 px, phone top at 312 px). The phone's letter text becomes a decorative 9 px; that is acceptable, the player must be visible. Room: `.roomSlot { width: 150vw; margin-left: -62vw; bottom: 11svh }` so the nightstand and shoes read at 2x the current size, with `--room-lift: 0` so the shoes are never cropped. Desktop too: `1440x900-07-years-later-3.png` crops the shoes at the bottom edge while the lamp lights; set `--room-lift: 0svh` and `.roomSlot { bottom: 4svh }` at 900 and up.

### 8. S07 on desktop: the headline breaks into three lines over the lamp drawing, then greys out too early
- Where: `1440x900-07-years-later-5.png` ("Said once. / Heard / for years." with the lamp shade and nightstand lines passing between the words and under the support copy) and `-6.png` (the whole scene, headline included, is under the 40% black `.night` overlay, headline 214/208/200 on brown).
- Why it matters: "Heard" alone on a line breaks the rhythm of the film's best sentence; drawing lines behind type break film rule 3; and the thesis holds for only 0.24 of progress (about 0.5 viewport of scroll) before it is greyed.
- Fix: (a) render the headline as two block spans split on the sentence (`copy.headline.split(/(?<=\.)\s/)`), because `text-wrap: balance` could still produce "Said once. Heard / for years."; (b) `.copy { width: min(52vw, 780px) }` and `--s07-head: clamp(40px, 5.6vw, 88px)` at 900 and up (80 px at 1440, "Heard for years." is about 610 px); (c) `roomOpacity` end value 0.3 to 0.16 and keep it away from the copy by shifting `.room` right 8vw; (d) `.night { z-index: 0 }` (behind phone and copy) so the headline is never greyed by the overlay, and let the elements fade on their own opacity (already 0.86 to 0.95); (e) remove `style={{ opacity: 0.86 }}` on `Support` (measured 4.2:1 on the lamp glow, full opacity gives about 5:1); (f) lengthen the hold: `headOpacity [0.54, 0.62, 0.90, 0.95]`, `supportOpacity [0.60, 0.68, 0.90, 0.95]`, `night [0.88, 0.99]`, and set the scene to `length={3.6}` so the line holds for about 0.9 viewport of scroll.

### 9. S03: the letter's last line, "Goodnight, little one.", fades before anyone can read it
- Where: `1440x900-03-just-talk-5.png` (about 3.5:1, half faded, the phone already greying). The last sentence arrives at p 0.66 but the whole caption group fades [0.68, 0.74].
- Why it matters: it is the single most emotional line in the film and gets about 0.05 viewport of full-strength time.
- Fix, `S03Talk.tsx`: `captions` opacity `[0.40, 0.44, 0.78, 0.84]`; start the grow later: `grow [0.82, 0.94]`, paper sheet `[0.74, 0.82]` (item 4), `letterIn [0.92, 0.98]`; length 3.5 to 3.9 to keep the cadence. Set the last caption to full `--night-ink` (currently 92%) and 1.2x size.

### 10. S11: the one action is under-scaled, its small print is 2.4:1, and the phone form reads as a button inside an input
- Where: `1440x900-11-start-4.png` (a 330x48 field under an 86 px headline; button label 13 px; the note, "Your email" label measure 2.4:1 and 2.7:1 over the lamp pool), `390x844-11-start-4.png` (the stacked button sits inside the input's rounded container, so it looks like a field with a button overlapping it).
- Why it matters: it is the page's goal. Apple's end card makes the action as large as the promise.
- Fix: `NotifyForm.module.css`: `.input` and `.button` height 48 to 56, `.button` font 17 px, `.form` max-width 30rem to 36rem, `.label` 16 px, `.note` 15 px. Phone: change `@media (max-width: 420px)` to `(max-width: 560px)` and make `.row` transparent (`background: none; box-shadow: none; padding: 0; gap: 12px; backdrop-filter: none`), with `.input` carrying its own pill (`height: 54px; background: color-mix(in srgb, var(--night-raised) 90%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--night-ink) 28%, transparent); padding: 0 20px`) and `.button { height: 54px; width: 100% }`. Contrast: in `S11Start.tsx` move both the `LampLight` and `Motes` centre from `y="62%"` to `y="40%"` so the form sits on the pool's falloff (about r 0.35, background about (60,45,30), note about 6:1) while the 86 px headline stays on the warm core (large text, about 3.7:1 is enough).

### 11. S05 to S06 cut: Month 10 and 11 covers pop into existence
- Where: `1440x900-05-your-voice-6.png` (card only) versus `-7.png`/`06-the-book-0.png` (identical frames; card plus a blank Month 10 cover and Month 11 at right, none at left). Contact sheet row 5 k=6 to k=7 shows it.
- Why it matters: handoff rule 2 says the visitor never sees a break. Here two empty tiles appear at the boundary, and the layout is lopsided (right only).
- Fix: `S06Book.tsx`, `Cover`: `const arrived = n <= 9 ? e : 1` becomes `const arrived = e` (all covers gated by `enter`); keep the `y` offset for every cover (`[n <= 9 ? 40 : 0, 0]` to `[40, 0]`). S06 p=0 then equals S05 p=1 (card at 0.6, nothing else).

### 12. S02: the phone "lies in the lamp light" outside the light, as a black slab; copy sits on the lamp
- Where: `1440x900-02-a-minute-1.png`: a #000 trapezoid at x 1130 to 1280 floating in darkness; the lamp pool is at the left. And `-3.png`: the support line's second row ("sentence counts.") is 15 px above the lamp shade.
- Why it matters: the story says the phone is in the light; the picture says it is not. Pure black on #161412 reads as a hole, not an object.
- Fix, `S02Minute.tsx`: start the phone inside the pool and let the move be the story: `x = useTransform(p, [0.06, 0.30, 0.80, 0.94], narrow ? [...] : ['-26vw', '17vw', '17vw', '0vw'])`, `y [0.0, 0.30] ['16svh', '0svh']` at 900 and up, so Meera's parent "picks it up" and carries it to the copy's side. Dark overlay colour `#000` to `var(--night)` plus the rim already in `PhoneFrame` (the edge gradient). Copy: `.copySide` on desktop `transform: translateY(-62%)` in this scene so the support clears the lamp; lamp opacity target [0.1, 0.34] 1 to 0.25 and `translateY(0 to 6svh)`.

### 13. S04 and S05: dead band, reflow jump, and the proof has no drama
- Where: `1440x900-04-exactly-5.png` and `-05-your-voice-3.png`: headline and support end at y 225, the letter starts at y 475, a 250 px empty gap; the letter sits low (`down = h * 0.12`). `04-exactly-2.png` vs `-4.png`: when the false start is removed the paragraph reflows and the whole block drops about 20 px (first line y 350 to 370), contradicting "nothing else moves". The Mirror to Meera swap is 25 px type in a 1440 sea of paper.
- Fix, S04: `.copy { top: 7svh }` at 900 up becomes `11svh`; `down = h * 0.03`; scale 0.92. Target gap about 120 to 140 px. Lock the first baseline: wrap `PaperLetter` in a box with `height: calc(6 * 1.6em)` and `align-items: flex-start`, so removing a line only shortens the bottom (S03 end, S04 start and S05 start use the same component, so they still match). Give the fix a camera: while `fixes` is 0 to 1 scale the letter 1 to 1.18 with `transform-origin: 0% 0%` (first word), easing back to 1 by p 0.40; transform only.
- S05: `down = narrow ? h * 0.06 : h * 0.09`. On phones, `390x844-05-your-voice-3.png` puts the dark player pill 28 px above the brown CTA pill (two similar pills, easy to mis-tap); the 0.06 gets the player at least 90 px clear.
- S05/S06 card low-contrast text: `1440x900-05-your-voice-5.png` dateline "MONTH 9, TUESDAY NIGHT" and signature "Papa" measure 2.0:1. `film/LetterCard.module.css` lines 35 and 52 use `--ink-muted` but also an opacity; remove the opacity so they land on `--ink-muted` (5.3:1). Player time 11 px to 13 px.

### 14. S09: five checkmarks and a small envelope read as a SaaS feature slide
- Where: `1440x900-09-private-4.png`: promises at 16 px in a 1440 frame, tick marks, envelope at about 145 px, the closing flap too small to read as an event.
- Fix, `S09Private.module.css`: `.point { font-family: var(--font-serif); font-weight: 400; font-size: clamp(20px, 1.9vw, 28px); line-height: 1.45; border-top: 1px solid var(--night-line); padding: 14px 0 }` (first has none); remove `.tick` and the 30 px padding. `.envelope { width: clamp(150px, 19vw, 280px) }`; hold the closed envelope for 0.30 to 0.36 before the headline lands. On phones `390x844-09-private-5.png` is fine structurally; use `clamp(19px, 5vw, 22px)`.

### 15. S08 and S10: flat black text slides, and S08's hierarchy is inverted
- Where: `1440x900-08-languages-3.png`: headline `clamp(34px, 4.6vw, 72px)` and the sentence `clamp(30px, 4.6vw, 76px)` are the same size, on flat black with no light; the sentence is the hero but reads as secondary. `10-pricing-3.png` is a static centred text slide with no light or motion. After the S07 peak the film has two scenes (S08, S10) with no warmth.
- Fix: S08, `.text { font-size: clamp(40px, 7vw, 112px) }` (hi, ar scaled the same ratio), `.copy h2 { font-size: clamp(26px, 2.4vw, 38px) }`, language label 13 to 14 px. Add one faint pool so the arc stays warm: `<LampLight intensity={0.3} x="50%" y="64%" size="85vmax" warmth="lamp" />` before `Grain`. S10: the same pool at 0.25; and set the Plus line in `--night-ink` at 0.9 (it is currently 0.82) and 19 to 21 px so $3.99 and $29.99 are easy to read. Trim S08 from `length={2.5}` to `2.0` (7 languages at 0.11 each is 0.77 of the scene; the headline holds to 0.90).

### 16. Reduced motion, phones: S04 and S05 headlines collide with the wordmark and the support text overflows the right edge
- Where: `reduced2/grid.jpg` and `reduced2/390x844-04-exactly-0.png`, `-05-your-voice-0.png`. Headline sits at y about 20 over "Early Letters"; support copy is cut off at the right ("only clears the ums and misheard names. We nev").
- Why it matters: this is the whole experience for reduced-motion users; as built, a visitor who asked for less motion gets the broken layout.
- Fix: `S04Exact.module.css` and `S05Voice.module.css`, `[data-resting] .copy`: add `width: 100%; box-sizing: border-box; padding: calc(env(safe-area-inset-top, 0px) + 88px) var(--gutter) 0;` (clear the 64 px header plus 24). S05's reduced frame also shows the player but not the card the doc comment promises; make the reduced S05 frame the card (as `05-your-voice-7.png`).

### 17. S07, first 28%: the emotional hinge is the emptiest stretch of the film
- Where: `1440x900-07-years-later-1.png` (p about 0.14): flat dusk, a 16 px "YEARS FROM NOW" eyebrow, and unreadable stroke fragments (an ellipse and three L shapes) from the room starting to draw. This follows the grey S06 hinge (item 6), so about 0.6 viewport of scroll carries almost no information.
- Fix, `S07Years.tsx`: promote "Years from now" to display type for this beat: centred, `font-size: var(--s07-head)`, Literata 500, `top: 38svh`; in [0.03, 0.12], hold to 0.24, then move up and shrink into today's eyebrow slot (`y` to `-(38 - 9)svh`, `scale` to 0.17) over [0.24, 0.34] while the room draws. Delay the room: `roomDraw [0.16, 0.40]`, `lampDraw [0.22, 0.40]`, `shoesDraw [0.30, 0.44]`, `lamp [0.38, 0.50]`, so no stroke fragments show under the big line. Add a faint horizon to the flat `--dusk` background: `linear-gradient(to top, color-mix(in srgb, var(--night-accent) 14%, var(--dusk)), var(--dusk) 55%)`.

---

## P2: polish (3)

### 18. Type scale has eight headline sizes
- Where: hero 13vw (176), S02/S03 7.2vw (104), S07 6.4vw (92), S11 6vw (86), S04/S05/S06 5.2vw (75), S10 5vw (72), S09 5vw, S08 4.6vw (66). The paper scenes' headlines are smaller than the night ones for no reason.
- Fix: `globals.css`: `--t-hero: clamp(60px, 13vw, 176px)`, `--t-display: clamp(40px, 6.2vw, 96px)`, `--t-title: clamp(30px, 4.2vw, 64px)`. Use display on S02 to S07, S11; title on S08 to S10. `Copy.module.css` `.headline` default `clamp(40px, 7.2vw, 112px)` becomes `var(--t-display)`.

### 19. Bottom CTA pill overlaps the phone on phones; phone sizes are shared and too large
- Where: `390x844-03-just-talk-2.png` (phone bottom edge behind the pill), `-02-a-minute-3.png`, S07.
- Fix: `film/hooks.ts` `phoneWidthFor` narrow branch: `Math.round(Math.max(170, Math.min(300, w * 0.58, (h - 340) / 2.09)))` (226 px at 390x844). S02 narrow `y` '10svh' stays; S03 narrow offset 8svh (item 5). Phone bottoms then stay at or above y 750 on a 844 viewport (pill top is about 770).

### 20. Small details
- Word spaces collapse in small app serif: "The house isquiet, Papa." (`1440x900-02-a-minute-3.png`), "Anotherthought", "noticeand". Probable cause is `letter-spacing: -0.01em` and `-0.015em` on small Literata in `app-ui/screens/*.tsx` plus `optimizeLegibility`. Add `word-spacing: 0.06em` for app serif text under 16 px (inline `u(...)` styles).
- S04's support says the app "only clears the ums and misheard names", but the film's three fixes include a false start. Copy owner: "only clears ums, false starts and misheard names".
- Every capture shows the Next.js dev badge at the bottom-left. Set `devIndicators: false` for capture runs so stills and the launch reel are clean.

---

## Emotional arc (does it make a tired parent feel something?)

Yes in three places, and then it spends the credit. S01 (quiet, lamp) and S03 (their own words appearing as spoken) land. S07's line lands, once item 8 stops greying it. The weak stretch is S04 to S06 (three paper scenes explaining the same letter, with the hinge into S07 grey) and S08 to S10 (three black text slides with no warmth). The ask in S11 arrives warm, which is right, but small. Also an honest gap: S07 promises "heard for years" and the tap-to-hear control is hidden (open item in the storyboard), so the peak is a promise with no proof. Treat the voice release as a launch blocker; until then the playback bar on screen (item 7) is all the evidence there is.

CTA: findable at every point (header pill on desktop, bottom pill on phones, hidden at hero and end card). It is never pushy. Its problems are not tone but placement and scale (items 10, 13, 19).

## The 3 changes that would most raise the jaw-drop factor (inside the rules)

1. **Make S03 to S04 a true match-cut push-in.** The spoken transcript becomes the paper letter by the camera moving into the phone (item 4), no blank frames, the text landing at exactly S04's reading size. Then give the single fix a macro: after the push-in, the letter slowly zooms to the first word while "Mirror" becomes "Meera" and eases back (item 13). Today the film's thesis ("exactly as you said it") is 25 px in a big paper void; this makes it the most watchable second in the page. Transforms only, no new assets.
2. **Make "time passing" a change of light, not a cross-fade.** Replace the grey hinge with golden hour (item 6), and as the months climb let a skewed parallelogram of low sun (`rgba(255,226,180,0.3)`, `skewX(-18deg)`, `translateX(-30vw to 60vw)`, with two thin mullion shadows) sweep across the paper and covers, the S01 window coming back as light. Then land on "Years from now." in 90 px type (item 17). It closes the loop opened by the line-drawn window in S01, and it is exactly the "light and time of day" the brief allows.
3. **Make "a minute is plenty" literal.** In the app UI the status bar reads 9:41 in S02 and S03; make it tick to 9:42 while the S03 timer runs 0:00 to 1:12 (a text swap in `StatusBar.tsx` driven by the existing `words` value, no layout change). Pair it with a hero that is alive before the first scroll: the window self-draws on mount over 2.4 s (time-based, not scroll) behind the wordmark at 18% opacity, and the lamp's pool breathes at idle. The promise of the headline gets proved in the product's own UI, and the first frame stops being "type on a brown smudge".

## Appendix: contrast measurements (1440 frames, from pixels)

| Text | Frame | Approx. ratio | Verdict |
|---|---|---|---|
| S01 support, full | 01-evening-4 | 10.2 | pass |
| S02 support on lamp pool | 02-a-minute-4 | 5.1 | pass |
| S03 caption | 03-just-talk-3 | 6.7 | pass |
| S03 last caption | 03-just-talk-5 | 3.5 | fail (fading) |
| S04 support | 04-exactly-5 | 6.6 | pass |
| S04 trust note ("3 small fixes." in --accent) | 04-exactly-4 | 4.4 measured on 15 px anti-aliased text; token is 5.5 | pass |
| S05 card dateline and "Papa" | 05-your-voice-5 | 2.0 | fail |
| S06 cover meta | 06-the-book-3 | 3.1 measured on a cover still fading in; token --ink-muted is 5.3 | pass |
| S07 support on lamp glow | 07-years-later-5 | 4.2 | borderline |
| S08 support and sentence | 08-languages-3 | 10.6, 11.3 | pass |
| S11 note and label on glow | 11-start-4 | 2.4, 2.7 | fail |
