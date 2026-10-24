# Home page layout, scroll nudge and share: design proposal

Status: PROPOSAL for founder approval. Nothing here is built. Owner: brand and design systems agent. Words: the content agent (`docs/web/HOME_COPY_PROPOSAL.md`, branch `docs/web-home-copy`); every string below is a slot, and the words shown are today's copy used as placeholders. Motion system: the engineer's `fix/web-scroll-effects` (`PinScene`, `Beat`, `SceneText`, `Rise`, `usePin` in `apps/web/src/components/landing/`). Companion sketch: `docs/web/home-layout-sketch.html` (open it in a browser; pricing, nudge and share, drawn with the site's own tokens).

Founder request, verbatim: "For the page, this content is too long and a para, organise this beautifully ... Also - see if we add a scroll button on right bottom corner and that would do soft nudge to scroll at the bottom where early access is listed. Also find a way to also have a subtle, clean, elegant share with fellow parents."

Coordinator follow-up: the block meant by "too long and a para" is the pricing paragraph (75 words, one block). It gets its own design in section 2.8: two plan cards, a short list, one reassurance line.

---

## 0. What I measured

Method: production build of `origin/main` (`14ec2f7`) in coming-soon mode (what earlyletters.com serves; the live site was not reachable from the sandbox, a proxy 403), Playwright Chromium at 1440x900 and 390x844, reduced motion for the full-page shot and normal motion for scrolled frames. Whole page: 8,737 px desktop, 7,487 px phone, before the engineer's longer pinned scenes.

| Section | Words | Longest paragraph, lines at 1440 / 390 | Verdict |
|---|---|---|---|
| Pricing (`#price`) | 81 | 75 words, **6 / 10 lines**, one block | The problem. Four ideas in one paragraph: the free start, what Plus does, two prices, a promise. |
| Hero | 50 | lead 29 words, 3 / **5 lines**, then a 15-word trust line | Long on a phone. Keep the lead to one sentence, move the promises into a short row. |
| Proof letter (`#exact-title`) | 110 | 61-word letter card, 10 / 10 lines | Is a card already; the prose beside it is 20 words (4 lines at 442 px). Fine. |
| Book | 57 | 21 words, 2 / 3 lines, then 3 month cards | Fine. |
| Voice and "Years later" | 52 | 18 and 21 words, 4 / 3 lines | Fine. |
| Languages | 66 | 14 words, then 7 script cards | Fine, but the grid leaves one empty cell on desktop (4 + 3). Fix in 2.6. |
| Private | 49 | five bullets, each 3 to 5 lines on a phone at 18 px | Long and flat on a phone. Two columns on desktop, tighter on phone (2.7). |
| Early access | 55 | 21 words, 2 / 3 lines | Fine; carries the share link. |

So the page is mostly well organised already. The two real fixes are pricing (a wall of text at the exact moment a person decides) and the hero lead on a phone. The rest is polish and one rhythm rule.

---

## 1. Principles: reuse the scroll system, add nothing that fights it

1. **Layout lives in markup and classes inside a `Beat`.** The engineer's `PinScene` owns pinning, hand-off, the fit rule and the `Rise` fallback. Every pattern below is a class on the content inside it. No new scroll listeners, no new motion values, no `will-change`.
2. **The fit rule is a design constraint.** A scene pins only if its content fits in `100svh - 120px` (`PINNED_PADDING`). At 1440x900 that is 780 px of content. Every desktop layout below is drawn to fit; phones do not fit one screen and fall back to `Rise`, exactly as today. Measured: the new pricing layout is 567 px tall at 1440 (487 px of content), so it pins with room to spare.
3. **Each new block is its own `Beat`**, staggered the same way the month cards and language cards already are (`from = 0.3 + i * 0.12`). Cards rise in turn; nothing else is invented.
4. **Brand rules that shape the choices.**
   - The mark is never a bullet, list marker, pattern or site divider (BRAND_SYSTEM section 9), and one logo per page section. So the "opening-quote device" on this page is the accent rule plus Literata, the existing `.pull` (2 px `--night-accent` left border, 22 px padding). I do not place the two-quote symbol beside quotes. If the founder wants the symbol itself used once, the only sanctioned warm moment on a page is `logo.symbol.accent` alone, once; I recommend the header stays as is.
   - No new fonts: Literata for headings and quoted lines, Mukta for UI and body. No new files, images or icon packs.
   - Content rules: no em or en dashes, curly quotes, ellipsis characters, emoji. No counts of gaps, no streaks, no "best value" badges.
5. **Performance and CLS unchanged.** No images added, no layout shift (every block is static markup; the nudge is `position: fixed`; the share status line already reserves its height). One small `backdrop-filter` surface is added (the nudge), the same recipe the cards already use.

### Tokens used (all exist today in `globals.css` and `Landing.module.css`)

| Role | Value |
|---|---|
| Section h2 | Literata 500, `clamp(42px, 6.6vw, 96px)` / 1.04, `-0.028em` |
| Compact h2 (split sections, new for pricing) | `clamp(40px, 4vw, 56px)` / 1.08 |
| Lead (`.sub`) | Mukta, `clamp(20px, 2.1vw, 30px)` / 1.42; `clamp(20px, 2.1vw, 26px)` when beside a card |
| Pull line | Literata, `clamp(21px, 2vw, 27px)` / 1.32 inside a split; today's `.pullTitle` `clamp(30px, 3.5vw, 50px)` stays in "How" |
| Card text | Mukta, `clamp(18px, 1.6vw, 22px)` / 1.55, `--night-ink-muted` |
| Kicker | Mukta 600, 13 px, `0.14em`, caps, `--night-accent` |
| Spacing rhythm | 4 pt scale as in DESIGN_LANGUAGE section 4: 8, 12, 14, 18, 22, 28, 36, 48; gutter `--gutter`; stage padding top 84, bottom 36 when pinned |
| Cards | radius 20 (`--radius-lg`), `--night-raised` at 62 percent, inset 1 px `--night-ink` at 11 percent, `blur(10px)` |
| Rule (list dividers) | 1 px `--night-ink` at 12 percent |

---

## 2. Section by section

Sketch notation: `[ ]` a block, `(Beat n)` its reveal order inside the scene, measurements in tokens or px at 1440 wide unless noted.

### 2.1 Hero (`HeroStage`)

Problem: lead (29 words) plus trust (15 words) is two paragraphs, 5 lines on a phone.

```
            [h1  Early Letters]                  display clamp(58, 12.5vw, 176)
            [lead: ONE sentence, max 2 lines]    clamp(21, 2.3vw, 32), max-width 27em, balance
            [promises: 3 short phrases in a row] Mukta 500, 16 to 17px, ink-muted
               .  Private on your phone   .  Exactly as you said it   .  Never rewritten
            [pill: Coming soon to iPhone]        as today
```

- `.promises`: a `ul`, flex, wrap, centred, `gap: 8px 22px`, 14 px margin above. Each `li` has a 6 px accent dot before it (the `.point::before` recipe, scaled, no glow on the hero). On a phone it wraps to two lines at most.
- The trust sentence becomes these three phrases (content agent writes them; max 4 words each). The hero then reads: name, one line, three promises, one pill.
- Nothing pinned changes; `.title`, `.lead` and `.actions` keep their staggered `rise`.

### 2.2 How it works ("A minute is plenty" then "Just talk")

Already short (33 words) and the pull device is right. Keep: kicker, h2, one-line lead (`FillText`/`SceneText`), then the existing `.pull` with the "Just talk." line. Only change: lead capped at 14 words and `max-width: 26em` so it never exceeds two lines on a tablet. No new component.

### 2.3 Exactly as you said it (`ProofScene`)

Unchanged. The long text is the proof letter card, which is the product. Constraint for content: the lead beside it stays at or under 20 words so the left column is at most 4 lines at 442 px.

### 2.4 Your voice and "Years later" (`.split`)

Unchanged structure (left h2 and lead, right `.years` card). Lead at or under 18 words. Optional: switch the left h2 to the compact h2 (`clamp(40px, 4vw, 56px)`) so a four-line headline in a 442 px column becomes two or three. Not required.

### 2.5 The book

Unchanged: lead, then three month cards, the last with the "Filed in" chip and accent glow. Lead at or under 20 words. On phones the cards stay stacked.

### 2.6 Languages

Same cards, one fix to the grid so it has no orphan cell.

```
 wide (60rem+): 12-column grid, gap 12
   row 1:  [English  4][Hindi    4][Spanish  4]
   row 2:  [Mandarin 3][French   3][Arabic   3][Portuguese 3]
 phone: 2 columns, gap 12; first card (English) spans both
   [English                  ]
   [Hindi     ][Spanish      ]
   [Mandarin  ][French       ]
   [Arabic    ][Portuguese   ]
```

CSS: `.langs { grid-template-columns: repeat(12, 1fr) }`, `.langs li:nth-child(-n+3) { grid-column: span 4 }`, `.langs li:nth-child(n+4) { grid-column: span 3 }` at 60rem and up; below, `repeat(2, 1fr)` with `li:first-child { grid-column: 1 / -1 }`. Cards keep `height: 100%`; `lang` and `dir` attributes stay on the script line (Arabic remains right to left inside its card). Section height on phone drops from 1,173 px to about 700 px.

### 2.7 Private by default

Five flat bullets at 3 to 5 lines each on a phone. Keep the accent-dot list (it is the page's list device) and make it a two-column list when wide.

```
 wide:   kicker, h2 (left, compact)   |  [. point 1] [. point 3]
                                      |  [. point 2] [. point 4]      font clamp(18, 1.7vw, 22), rows divided by the 12% rule
 phone:  one column, font 19px / 1.45, row padding 12px
```

Design for four points (a 2 by 2). If the content agent keeps five, the fifth spans both columns. Hairline between rows, dot left (`left: 4px`, 8 px, glow as today). No icons per row (would add art for no gain).

### 2.8 Pricing: a clear pricing moment (the founder's block)

Today: kicker, h2 and one 75-word `FillText` paragraph. New: four small parts, each one idea. Words are placeholders; the content agent removes claims that are not true for v1.0 (backup through us, whole family adding letters, a Read together limit).

```
 wide (60rem+), pinned, 567px tall at 1440, fits 780px
 +-----------------------------------------+---------------------------------------+
 | PRICING                       (Beat 1)  | [ MONTHLY      ] [ YEARLY       ] (B3, B4)
 | Two letters free.                       | [ $3.99        ] [ $29.99       ]
 | Then Plus.                              | [ a month      ] [ a year       ]
 | (compact h2, 2 lines)                   | [ 1-month free ] [ 2-month free ]
 | Your first two letters are free,        |                                       |
 | so you can try it.   (one sentence, B2) | PLUS INCLUDES                  (Beat 5)
 |                                         | . Keep adding letters
 | | Every letter you have made stays      | . Every child's book
 | | yours to read, play and export,       | . (item 3, 4 to 6 words)
 | | even if you stop.    (pull, Beat 6)   | . (item 4, optional)
 +-----------------------------------------+---------------------------------------+
   columns 1.1fr : 1fr, gap clamp(32px, 5vw, 72px)        (reuses .split, columns changed)

 phone (390): one column, rises block by block (not pinned)
   PRICING / h2 (2 lines at 40px) / one sentence
   [ MONTHLY  $3.99 a month   1-month free trial ]   card, 18px padding
   [ YEARLY   $29.99 a year   2-month free trial ]
   PLUS INCLUDES  . . .
   | the reassurance line (pull)
```

Measurements (verified by injecting this markup into the built page with the real fonts): desktop 567 px (padding 84 + 36 included); phone 1,005 px for the whole section including every block, against 570 px for the paragraph today. It is taller on a phone because the information is now structured, not longer: about 8 short lines instead of 10 dense ones, each separated, scannable and at body size.

Plan card (`.planCard`): kicker-style plan name (13 px caps accent), price in Literata `clamp(38px, 3.4vw, 48px)` / 1, the period on its own line (17 px muted, so "a year" never wraps beside the price; I tested the one-line version and it wrapped at 234 px), the trial line (17 px muted). Cards are not buttons and carry no CTA: the sign-up is below and the App Store is where the purchase happens. They are `li`s in a `ul` with the heading "Two letters free. Then Plus." above; keep the text in DOM order (name, price, period, trial) so a screen reader hears "Monthly, $3.99, a month, 1-month free trial".

Equal weight for both plans, no "best value" ribbon, no strike-through, no percentage saved. Calm, honest, and consistent with "we never steer". The only emphasis available is a softer accent wash on the yearly card (the `.monthNow` recipe); I recommend not using it (open question 4).

The reassurance line uses the existing pull device (accent rule, Literata). It is the emotional last line of the section, so on a phone it closes the section instead of leading it. Optional fine print (`.fine`, 15 px muted): the content or legal agent's subscription terms line (renewal, cancel in iPhone Settings), as the App Store requires it near the price. Placeholder slot; I have not written any.

One small drawing is available if wanted: `Envelope` (existing line drawing, `currentColor`, 40 px) above "MONTHLY"? I recommend none here and one only on `/signup/thanks` (section 4.4). The pricing is clearer without art.

### 2.9 Early access (`#early-access`)

Keep the centred closing. Spacing: h2, 20 px, lead (max 2 lines), 28 px, form row (30rem), 14 px, consent note (15 px), 20 px, quiet share link (section 4), 20 px reserved status line. Bottom padding stays. This is the scroll nudge's destination and the only place the page asks for an email.

### 2.10 Page rhythm

Between pinned scenes the engineer's hand-off governs. For unpinned fallbacks (phones) one rule: section vertical padding `clamp(64px, 11vw, 128px)` instead of `clamp(72px, 12vw, 148px)`, because the short sections (How, Voice) were adding up to 150 px of empty space either side of 20 words. This shortens the phone page by roughly 600 px with no loss; it is a single custom-property change and can be deferred.

---

## 3. The scroll nudge

### 3.1 Behaviour

- **Where.** Fixed, bottom right: `right: calc(var(--gutter) + env(safe-area-inset-right))`, `bottom: calc(16px + env(safe-area-inset-bottom))`. `viewport-fit=cover` is already set in `layout.tsx`, so the insets are real on a notched iPhone.
- **Look.** A calm pill, 44 px tall, about 140 px wide: label, then a 16 px chevron down. Surface: `--night-raised` at 80 percent with `blur(10px)`, inset 1 px `--night-ink` at 22 percent, a soft shadow. Label Mukta 600 15 px `--night-ink` (about 15:1), chevron `--night-accent` (8.4:1). On `prefers-reduced-transparency` it is solid `--night-raised`, no blur. Same family as the cards and the quiet form row; it does not shout.
- **Label and icon.** Label: "Early access" (slot `site.nudge.label`; the content agent may prefer "Keep me informed", which is the form's own button wording). Icon: Phosphor Regular `CaretDown` as an inline SVG, 16 px, `currentColor` (Phosphor is the repo's icon set, MIT, DESIGN_LANGUAGE section 7; copy the path inline, add no package to `apps/web`; verify the path against the Phosphor source when building). Accessible name: the visible label plus "sign-up" through `aria-label` only if it still contains the visible text (WCAG 2.5.3): `aria-label="Early access sign-up"`.
- **Appears** once the person has scrolled a little: when a sentinel placed at 60 percent of the viewport height has left the top (an `IntersectionObserver`, no scroll listener). Never on first paint. Fade and 8 px lift over 240 ms with `--ease-standard`.
- **Disappears** when `#early-access` has risen into the upper 75 percent of the viewport (observer with `rootMargin: '0px 0px -25% 0px'` on the section), or when the email field takes focus. It does not come back if the person scrolls up, until they are again above that line; it simply follows the same rule, so it is never a surprise.
- **Soft animation.** The chevron drifts 4 px down and back over 2.6 s, three times after the pill appears, then rests. It never loops forever. **Reduced motion:** no drift, no lift; opacity only, 200 ms (matches MOTION.md reduce rule, and `globals.css` already clamps durations).
- **Action.** It is a real `<a href="#early-access">` (works if script is slow). On click: `preventDefault`, `section.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })`. This honours the `scroll-margin-top` that `PinScene` sets inline, so it lands exactly where an in-page link to the section lands today (first lines arrived, not the empty first frame of the hand-off). The URL hash is not changed (no history entry). Then, once the scroll ends (`scrollend` event; fallback timer of 1,000 ms, as `goToStart` uses 900 ms): if the section is still in view, move focus.
  - **Pointer device (hover, fine):** focus the email field with `preventScroll: true`. `PinScene showOnFocus` already brightens the section when something inside takes focus.
  - **Touch device (`pointer: coarse`):** do not focus the field. Focusing opens the keyboard, which covers the form and jumps the layout. Focus the section heading (`tabindex="-1"`, `preventScroll`) instead; a screen reader announces "Tell Meera about today" and the field is next. (Decision for the founder: this deviates from "focus moves to the field" on phones on purpose.)
- **Does not hijack scroll.** No wheel, touch, keyboard or scroll-snap handlers; no automatic scrolling; the programmatic scroll starts only from a click, tap or Enter, and any touch, wheel or key press during a smooth scroll cancels it natively (the browser default). If the person scrolls away before it ends, focus is not stolen.
- **Does not cover things.** There is no cookie or consent banner on the site today (checked: none in `src/`; analytics are off unless `NEXT_PUBLIC_ANALYTICS=vercel` and honour Do Not Track and Global Privacy Control). The pill is hidden before the sign-up section arrives, so it never sits on the form. For any future banner: the pill's `bottom` reads `--overlay-clearance` (default `0px`) so a banner can lift it with one variable. On a phone the pill is about 140 by 44 px at the bottom right, over the translucent page, leaving the left 230 px and the whole centre free. `html { scroll-padding-bottom: 76px }` keeps a keyboard-focused item from landing underneath it (WCAG 2.2 focus not obscured, 2.4.11).
- **z-order.** `z-index: 18`: below the header (20), above `main` (1), the aurora and the rail.
- **DOM position.** First element after the header, before `main`, so a keyboard user who has scrolled and presses Tab reaches it first, and it is `hidden` (display none) when not showing, so it is neither focusable nor read.
- **Analytics.** None added. The allowlist in `src/lib/analytics/events.ts` has `cta_click`, `notify_submit` and `scene_reached`; the nudge sends no new event, and the existing `scene_reached` for `start` still fires when the section is reached. Nothing is stored, no cookie, no `localStorage`.
- **Not rendered** when `SITE_MODE` is film (the film has its own header action `goToStart`).

### 3.2 States

| State | Pill |
|---|---|
| Hidden (top of page, or sign-up reached) | `hidden`, opacity 0 |
| Showing | opacity 1, lifted into place, chevron drifting (3 times) |
| Hover or focus | border to `--night-accent`; focus ring 2 px `--night-ink`, offset 3 |
| Pressed | `scale(0.97)` 160 ms, as the form button |
| Scrolling to the section | unchanged; fades out as the section arrives |

---

## 4. Share with a fellow parent

### 4.1 What is already there

`ShareButton` (in the closing section) already does the right thing technically: native share sheet if present, otherwise copies the link, with `Link copied` in a polite live region. It shares `origin + '/'`, no tracking. Two things to change: it is an outlined pill (35 px tall, below the 44 px target, and visually louder than the sign-up note above it), and its words are for "friends and family" (the founder asked for fellow parents).

### 4.2 Decisions

- **Placement.** Two: (1) the closing section under the consent note, always visible; (2) `/signup/thanks`, after a no-JavaScript sign-up, the moment of most goodwill. After a JavaScript sign-up the success line replaces the form and the same link is already beneath it, so nothing extra is needed. **Not in the footer:** the footer sits one short scroll below the closing section, so two share links within a screen would feel needy; the footer stays legal and contact only.
- **Visual.** A quiet text button, not a pill: 18 px share glyph (Phosphor `Export`, inline SVG) and the label, Mukta 500 15 px, `--night-ink-muted`, underlined with a 1 px 28 percent rule and a 5 px offset; hover to `--night-ink` with an accent underline and the glyph lifting 1 px; 44 px minimum height from padding. Centred, 20 px below the consent note. See sketch 3.
- **What is shared.** The plain address of the page the person is on (`location.origin + '/'`), no query string, no hash, no tracking or referral parameter, no per-person code. Title: `site.comingSoon.shareTitle` ("Early Letters, the baby memory book"). Text, short and honest: one sentence on what it is and that it is coming soon to iPhone, never a claim that it is available now (content agent; the existing text says what it does but not that it is not out yet). The link preview a recipient sees is the existing Open Graph card (title, description, 1200x630 image), already tested.
- **No** social-network buttons, counters, referral rewards, or "X people shared" anywhere. No data collected; no analytics event for sharing (not in the allowlist, and the privacy rule is no new fields). The page never learns whether a share happened.

### 4.3 States

| State | Behaviour |
|---|---|
| Idle | quiet link as above; status line reserved (20 px) so nothing shifts |
| Native sheet open | nothing on the page changes; closing it (AbortError) is silent |
| Copied | status line shows "Link copied" in `--night-accent`, polite live region, for 3 s; the label does not change (a button that renames itself is announced badly) |
| Copy not allowed (no clipboard, not secure context) | status "Copy the link below" and a read-only field with the address, auto-selected (today this fails silently, which strands the person) |
| Reduced motion | no glyph lift; nothing else animates |

### 4.4 `/signup/thanks`

```
  [Envelope drawing, 44px, currentColor, muted]     (optional; existing drawing, drawn complete)
  Thank you.                                         h1 as today
  Thank you, you are on the list. ...                body as today
  ------ 28px ------
  [ share glyph  Share with a fellow parent ]        same component, centred
  Back to Early Letters                              as today (kept last: the person's way home)
```

The page uses `Unsubscribe.module.css` (`.page`, `.line`, `.body`, `.home`); the share link sits between `.body` and `.home` with a 28 px top margin. `/signup/sorry` gets no share link (the person is mid-error).

---

## 5. Accessibility and performance checklist

Accessibility
- [ ] Nudge: real link, visible text label, accessible name contains the visible label (2.5.3), 44 by 44 minimum (2.5.8), focus ring 2 px with at least 3:1 against the surface (2.4.13), not obscuring focus (2.4.11 via `scroll-padding-bottom`).
- [ ] Nudge hidden means not in the tab order and not read (`hidden`).
- [ ] After activation focus is placed (field on a fine pointer, heading on touch), and only if the person did not scroll away.
- [ ] Reduced motion: no drift, no lift, no smooth scroll (`behavior: 'auto'`); `prefers-reduced-transparency`: solid surface.
- [ ] Contrast: label on `--night-raised` about 15:1; chevron accent 8.4:1; share link muted 8.0:1 on night, ink on hover.
- [ ] Share: live region for the status; manual-copy field is labelled and focusable; 44 px target.
- [ ] Pricing list is a real `ul`; plans are list items with readable order (name, price, period, trial); h2 then content in DOM order; no information in colour only.
- [ ] Languages: `lang` and `dir` kept on every script line.
- [ ] Zoom to 200 percent and text spacing: pricing cards reflow to one column at 40rem and below; nothing clips.
- [ ] VoiceOver and TalkBack walk-through: pricing, nudge, share.

Performance
- [ ] No new image, font or package. Two inline SVGs (under 1 KB each).
- [ ] No scroll listener; two `IntersectionObserver`s in one small client component. No state updates per frame.
- [ ] CLS stays 0: nudge is fixed, share status height reserved, pricing blocks are static grid items.
- [ ] One extra `backdrop-filter` surface of about 140 by 44 px; off under reduced transparency.
- [ ] Pinned fit: pricing 487 px of content at 1440x900, under the 780 px budget; phones fall back to `Rise`.

---

## 6. Playwright cases to add (`apps/web/e2e/`)

New file `home-nudge-share.e2e.ts` (and edits to `landing.e2e.ts` for the renamed share copy). Desktop 1440x900 unless noted.

1. Nudge is absent at load and appears after scrolling 60 percent of a viewport.
2. Nudge disappears once `#early-access` is in the upper 75 percent of the viewport, and when the email field is focused.
3. Click scrolls to `#early-access` (section top within the viewport, `scrollY` increased, URL hash unchanged) and focuses `#notify-email` on a fine pointer.
4. Touch (`hasTouch`, `isMobile`, 390x844): tap scrolls and focuses the heading, not the field; no keyboard-triggering focus on the input.
5. Reduced motion (`reducedMotion: 'reduce'`): the nudge has no chevron animation (`getComputedStyle(...).animationName === 'none'`) and the scroll is instant.
6. Keyboard: after scrolling with the keyboard, the first Tab reaches the nudge; Enter activates it; `hidden` when not showing (`toBeHidden`).
7. Geometry: on 390x844 with `env(safe-area-inset-bottom)` emulated (CSS `padding` check), the pill is at least 44 px tall and wide, fully inside the viewport, does not intersect the form, the consent note or the footer links at any scroll position where it is visible.
8. No network or storage: the nudge triggers no request (route listener) and writes nothing to `localStorage`, `sessionStorage` or cookies.
9. Share: quiet link has height at least 44 px; with `navigator.share` stubbed, one call with `{ title, text, url }` where `url` equals `origin + '/'` and contains no `?` or `#`; with no share and clipboard granted, the clipboard holds the plain address and "Link copied" shows; with clipboard denied, the manual field shows and is selected.
10. Share on `/signup/thanks`: link present between the body and "Back to" link; no share link on `/signup/sorry`.
11. No social buttons or counters: the page has no links to known social share URLs (`twitter.com/intent`, `facebook.com/sharer`, `wa.me`, `linkedin.com/share`).
12. Pricing: `#price` has an `h2`, a `ul` of two plan items, a `ul` of included items and the reassurance line; no paragraph longer than 40 words in `#price`; at 390 and 1440 no horizontal overflow (`scrollWidth <= clientWidth`); the per-period text never shares a line with the price (price element has a following block sibling).
13. Languages: seven cards, at 1440 the second row has four cards that fill the row (no empty grid track); `dir="rtl"` on the Arabic line.
14. Existing a11y spec (axe) still passes on `/` and `/signup/thanks`; `copy-rules` unit test passes on any new strings.
15. Regression: with JavaScript disabled the page renders, the nudge is not in the DOM or is `hidden`, and the sign-up still posts.

---

## 7. Implementation change list

Build only after the founder approves the layout and the content agent's words are merged. Order: copy, then CSS and markup, then nudge, then share, then tests. The scroll-effects PR (`fix/web-scroll-effects`) should merge first; the layout then lands as classes inside its `Beat`s.

Files (all under `apps/web/`)
1. `src/content/site.ts` (content agent): add `nudge: { label, aria }`; share keys (`shareButton`, `shareText`, new `shareManual`); pricing structure `s10: { support, plans: [{ name, price, period, trial }], includes: string[], reassurance, fine? }`; hero `promises: string[]`; keep `copy-rules.test.ts` green.
2. `src/components/landing/Landing.tsx`: hero promises `ul`; pricing scene rebuilt as `.split` with plan `ul`, includes `ul`, pull; private list classes; render `<ScrollNudge />` after `<header>` when the early-access section exists. Each new card or row is a `Beat` with staggered `from`/`to`.
3. `src/components/landing/Landing.module.css`: add `.promises`, `.priceSplit` (1.1fr 1fr), `.h2Compact`, `.plans`, `.planCard`, `.planName`, `.price`, `.per`, `.trial`, `.includes`, `.fine`, `.pullSplit`; change `.langs` to the 12-column version; `.points` two columns at 48rem; tune `.section` padding (2.10). The sketch's `<style id="sketch">` is the starting CSS for the pricing and nudge; rename `pl-` to the module names.
4. New `src/components/landing/ScrollNudge.tsx` and `ScrollNudge.module.css`: client component, two observers, the click handler described in 3.1, `hidden` toggling, no timers except the 1,000 ms `scrollend` fallback, cleans up on unmount.
5. `src/app/globals.css`: `html { scroll-padding-bottom: 76px }` and `:root { --overlay-clearance: 0px }`.
6. `src/components/site/ShareButton.tsx` and `.module.css`: quiet text variant (glyph, underline, 44 px), manual-copy fallback field, `variant` prop only if the thanks page needs a different margin; keep the share data exactly `{ title, text, url: origin + '/' }`.
7. `src/app/signup/thanks/page.tsx` and `src/components/site/Unsubscribe.module.css`: optional `Envelope` drawing, share link between body and home link.
8. `e2e/landing.e2e.ts` (rename the share button label in the two share tests), new `e2e/home-nudge-share.e2e.ts` (section 6), `e2e/signup-regressions.e2e.ts` untouched.

Not changed: `packages/*`, analytics allowlist, `PinScene`, `scrub.tsx`, the form, the API, the film.

---

## 8. Key decisions

1. Pricing becomes two equal plan cards, a short list and one reassurance line in the existing pull style; it pins on desktop and rises block by block on a phone.
2. No two-quote symbol as a decoration: the brand forbids it as a marker or divider, so the pull-quote device is the accent rule plus Literata.
3. Scroll nudge: a calm "Early access" pill with a chevron, bottom right, appears after about 60 percent of a screen, goes away when the sign-up arrives, drifts three times then rests; it only scrolls on click and focuses the field (desktop) or the heading (touch).
4. Share: a quiet text link "Share with a fellow parent" under the sign-up note and on `/signup/thanks`, not in the footer; shares the plain address through the native sheet or copies it, no tracking, no social buttons, no counts, no events.
5. No new fonts, images, packages, analytics or storage; CLS stays 0.
6. The page is mostly fine; the real fixes are pricing, the hero lead on a phone, the languages grid orphan and the private list on a phone.

## 9. Open questions

1. Nudge label: "Early access" (the founder's words) or "Keep me informed" (the form's button)? Content agent to decide.
2. On a phone, focus the section heading rather than the email field so the keyboard does not open over the form. Approve this deviation from "focus the field"?
3. Is the nudge labelled (about 140 px wide) or icon-only (44 px circle) on phones? I chose labelled for clarity; icon-only covers less text.
4. Pricing emphasis: equal weight (recommended) or a soft accent wash on Yearly? Also may we show the yearly price as about $2.50 a month (29.99 / 12 = 2.499)? Pricing debate branch owns this.
5. Subscription terms line near the price (renewal, how to cancel): who supplies the wording, legal or content?
6. Share text: may it say "coming soon to iPhone" (honest, recommended)? Include the hero line or only one sentence?
7. Do we want the share on the legal pages' footer after launch (when the App Store badge replaces the form)? Not now.
8. Should the section padding change (2.10) ship with this work or after the scroll-effects PR settles?
