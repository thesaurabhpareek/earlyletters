# Brand review: feat/email-brand-library

Reviewer: independent brand review (no stake in the work). Date: 2026-10-03.
Scope: BRAND_SYSTEM.md, `packages/brand/registry.ts` and assets (primary mark, icons, email logos, favicons, OG image, viewed as rendered PNGs), EMAIL_IDENTITY.md, DESIGN_LANGUAGE 2a, CREATIVE.md, `packages/content/BRAND.md`, DECISIONS D-051 to D-060, the 36 built emails (rendered with Playwright at 375 and 600 px, light, dark, forced dark, images blocked), and `docs/brand/logo-r3/early-letters-mark.html`. `apps/web` ignored as instructed.

## Verdict

**Approve the mark and the registry; fix four things before any public surface ships.**

The mark is excellent. Two opening quotes, parent and child, carry the product promise without a word. The EB Garamond wordmark with the `tt` ligature reads as a book, not an app. The sepia icon is distinctive among quote-mark apps. The registry (80 ids, 22 contexts, 17 passing tests) is more disciplined than most funded consumer brands manage. The emails are calm, warm and recognisable, and dark mode and the halo work as specified.

What stops it from being one brand everywhere:
1. The store creative promises v1.1 features.
2. One string implies the machine writes.
3. Emails fall back to Georgia and system sans, so they do not look like the app.
4. The hand-tuned small icon cut never reaches the sizes it was drawn for.

The rest is drift between documents and renders. That is normal for a system one day old.

## Scores (1 to 10)

| Dimension | Score | Why |
|---|---|---|
| Consistency | 7 | Mark, colour and email chrome are uniform. Type and the tagline change by surface, and the docs disagree in 6 places. |
| Premium | 8 | The mark, the restraint and the palette are at the Aesop/Calm bar. The fallback serif in email and the ASCII "(c)" pull it down. |
| Personal | 8 | "Warmly", "A person reads every one", sign-off rituals. Two template families (serif letter vs sans notice) are well judged but undocumented. |
| Clarity | 7 | The registry and do/don't table are very clear. The record control has three names, and the store frames have no specification. |

## Findings

Severity: **High** = breaks the constitution, a public promise or brand recognition; **Medium** = visible inconsistency or missing touchpoint; **Low** = doc hygiene or polish.

### BRD-01 Store creative promises v1.1 features (High)
- **Where:** `docs/design/CREATIVE.md:80`, `:83`, `:84`, `:82`, `:96-99`.
- **Problem:** the screenshots and the preview video are the highest-reach brand surfaces, and they show things v1.0 does not do:
  - Shot 1 is a Hinglish letter, but Hindi and English in one sentence is v1.1 (BRAND.md:28, glossary :88).
  - Shot 4 shows "From Nani, from Papa, from everyone", but family beyond the co-parent is v1.1 (D-057).
  - Shot 5 is a letter from Dadi (v1.1).
  - Shot 3 and video 18 to 24 s show the Read together highlight, but word highlighting is v1.1 (BRAND.md:33, :78).
  - Video 13 to 18 s shows "From Nani".
- This breaks BRAND.md "Proof discipline" (:57) and CREATIVE's own rule "never show a promise the product cannot keep" (:9).
- **Fix:** tag CREATIVE section 4 "v1.0 set" and rewrite it:
  - Shot 1: a single-language Hindi or English letter.
  - Shot 3: Read together without the highlight (letter on the page, audio playing).
  - Shot 4: "From Mama, from Papa." with the subline "Two voices, one book."
  - Shot 5: a Devanagari letter from a parent.
  - Video: replace the Nani beat with the co-parent's letter.
- Move the current frames to a "v1.1 set" table.

### BRD-02 Copy implies the machine writes (High, constitution)
- **Where:** `packages/content/src/strings.en.ts:411` ("We write down your words exactly as you said them."); `docs/design/CREATIVE.md:81` (subline "It becomes a letter.").
- **Problem:** "We write" makes the company or software the writer. "It becomes a letter" makes the transformation the hero, not the person. Both breach CLAUDE.md "Never imply AI writes anything" and BRAND_SYSTEM 1 "Smart, never the author".
- **Fix:**
  - strings.en.ts:411 becomes "Your words are kept exactly as you said them." (this matches welcome-family email line 4).
  - CREATIVE.md:81 subline becomes "Your words, on the page."
  - Add "we write", "becomes a letter" and "turns into" to the banned list in BRAND.md and to `rules.test.ts`.

### BRD-03 Email type does not match the app (High, recognition)
- **Where:** `packages/emails/src/tokens.ts:63-70`; `docs/brand/EMAIL_IDENTITY.md:15` (principle 4: "no remote fonts").
- **Problem:** Literata and Mukta are installed on almost no reader's device.
  - Verified in render: the heading and sign-off fall back to Georgia/Times and the body to system sans. They sit under an outlined EB Garamond logo, so every email shows two unrelated serifs.
  - The app, OG image and print use Literata and Mukta, so email is the one touchpoint in another face.
  - The "no remote fonts" rule does not protect privacy here: the logo PNG already loads from the same host (`earlyletters.com/email/`), so a font from that host reveals nothing new.
- **Fix:**
  - Self-host `literata-latin-400/500` and `mukta-latin-400/600` woff2 at `https://earlyletters.com/email/fonts/`. Register them as `font.reading.email` and `font.ui.email` with a `url`, and add them to a new `email.type` context.
  - Load them with `@font-face` in the head. Apple Mail and iOS Mail honour it; Gmail falls back.
  - Amend principle 4 to "no fonts or images from any host but earlyletters.com, no per-recipient URLs".
  - Keep Georgia as the documented fallback.

### BRD-04 Small icon cut never reaches the phone; no notification-icon context (High)
- **Where:** `packages/brand/registry.ts:165` (`app.icon` rule "Ship the 1024 masters only; iOS scales"); `:86-89`; `docs/brand/logo-r3/early-letters-mark.html` ("It only reaches a phone if the app ships an asset catalog with all sizes").
- **Problem:** the small cut exists for notification, Settings and Spotlight sizes (40, 58, 60, 80, 87, 120 px). With masters-only, iOS downsamples the large-cut 1024, so the most frequent brand impression (every push notification) uses the wrong drawing.
  - The registry has 16, 29, 32, 40, 60, 180, 192 and 512, but not 58, 80, 87 or 120.
  - There is no `app.notification` context, so nobody owns this.
- **Fix:**
  - Add context `app.notification` with the rule: "iOS draws the app icon; the 20 pt @2x/@3x (40/60 px) and 29 pt (58/87 px) must be small-cut PNGs".
  - Generate `icon.app.{58,80,87,120}` (+ `.dark`).
  - Change the `app.icon` rule to "1024 masters plus the small-cut asset catalog (or Icon Composer `.icon` with a small-size variant)". Track it in BRAND_SYSTEM 10.

### BRD-05 Registry is missing touchpoints the creative already specifies (Medium)
- **Where:** `packages/brand/registry.ts:164-187` against `docs/design/CREATIVE.md:76-100`, `:115-121`, `:141`, `:153`; BRAND.md:34 (free PDF export).
- **Missing contexts:**
  - **`appstore.screenshot.frame`:** caption band height, paper/paperDark ground, headline Literata 500 size, safe areas for 1260x2736 and 1080x1920, badge placement. Today only the badge exists (`:180`).
  - **`play.feature-graphic`:** 1024x500, described in CREATIVE:88, with no asset or id.
  - **`video.endcard`:** the 24 to 25 s brand line and lockup, CREATIVE:100.
  - **`social.post`, `social.story`, `social.cover`:** CREATIVE:153 lists "three social templates". Only `social.avatar` exists.
  - **`export.pdf`:** the free PDF is the most-used printed artefact in v1.0. Its cover, running header/footer and colophon need the lockup and type rules.
  - **`book.title-page`, `book.colophon`, `book.back-cover`.**
  - **`app.notification`** (BRD-04) and **`app.widget`** (if planned).
- **Fix:** add each context with assets and rule. Contexts may reference rule-only assets (colours, fonts) as `email.footer` already does. Then update the tables in BRAND_SYSTEM 2 and DECISIONS D-052 "Effects".

### BRD-06 The tagline has no typographic specification (Medium)
- **Where:** `packages/brand/scripts/build-touchpoints.mjs:168` (OG: Literata italic, inkMuted); `packages/content/src/emails/chrome.en.ts:56` (email footer: Mukta 13 regular); `docs/design/CREATIVE.md:88` (Play graphic: Literata upright); BRAND_SYSTEM.md:179 fixes only the words.
- **Problem:** the one line that defines the brand is set three ways.
- **Fix:** add a "Tagline" row to BRAND_SYSTEM 5:
  - Display: Literata 400 italic, inkMuted, 0.42x the wordmark cap height when locked up.
  - Running text: inherits the surrounding style.
  - Register `logo.lockup.stacked.tagline.{ink,reversed}` (artwork) and use it for OG, the Play graphic and the video end card.

### BRD-07 Book cover type contradicts the brand system (Medium)
- **Where:** `docs/design/CREATIVE.md:141` ("child's first name in Literata, 'Year One' below") vs `docs/brand/BRAND_SYSTEM.md:138` and `docs/design/DESIGN_LANGUAGE.md:80` (EB Garamond for "book covers and title pages").
- **Fix:** pick one. Recommended: EB Garamond for cover title and year (brand display), and Literata for interior pages. Edit CREATIVE.md:141 to match and reference the new `book.title-page` context.

### BRD-08 The logo is used as a bullet and divider (Medium)
- **Where:** `docs/design/CREATIVE.md:38`.
- **Problem:** "a bullet in lists, a section divider in the book and on the site".
  - This turns the logo into a glyph and contradicts "One logo per screen or page section" (BRAND_SYSTEM.md:177).
  - It also confuses names: `logo.symbol.small.*` is the small-size cut of the pair, not "the small mark" (the child quote).
- **Fix:**
  - Delete the bullet use.
  - Allow the small-cut symbol as a divider only in the printed book and PDF, at most once per page, as a registered context `book.divider`.
  - Everywhere else use a plain rule or spacing.

### BRD-09 "Opening quotes only" vs "closing flourish" (Low)
- **Where:** `docs/brand/BRAND_SYSTEM.md:13` ("Opening quotes, never closing ones: the letters are still being written") vs `:181` and `docs/design/CREATIVE.md:38` ("a closing flourish at the foot of a printed page").
- **Fix:** rename it to "end-of-letter mark" and keep it opening. Or drop it, since it contradicts the brand story ("still being written").

### BRD-10 Email spec and render have drifted (Medium)
Verified in `packages/emails/out/*.html`:
- **(a) Layout.** The render is a paper sheet with a 1 px line border on a tinted desk (`tokens.ts:41-42`, `theme.ts:58-59`). The EMAIL_IDENTITY 8 mocks (:161-198) show a flat page. The render is better: document it.
- **(b) Sign-off.** It renders italic at 17 px (`packages/emails/src/components/text.tsx:114`, `fontSize: type.body.size`). The spec says Literata 400 18/27 upright, second line 500 (EMAIL_IDENTITY.md:102). Choose one; italic suits the letter feeling. Update the spec or the code.
- **(c) Body font.** `LetterEmail` sets the body in the reading serif (welcome, welcome-family, welcome-coparent). The registry (`registry.ts:134`) and BRAND_SYSTEM.md:140 say "email body Mukta". Document the two families: "letter emails (serif body)" and "notice emails (sans body)".
- **(d) Link lifetime.** The examples say "works once, for 1 hour" (EMAIL_IDENTITY.md:45, :169). The shipped copy says 15 minutes. Align the examples.
- **Fix:** bump EMAIL_IDENTITY to v0.3 with the sheet layout, the two template families and the sign-off decision. Regenerate the six mocks from `packages/emails/out`.

### BRD-11 The record control has three names; its colour is outside the brand table (Medium)
- **Where:** "red circle" in `packages/content/VOICE.md:73`, `packages/content/src/emails/auth.en.ts:100`, `lifecycle.en.ts:28` and CREATIVE.md:55, :124. "Tap the microphone" in `packages/content/src/strings.en.ts:410`. The colour is `recording` #B5473A in `packages/design-tokens/src/tokens.ts:29`, which is absent from BRAND_SYSTEM 4.
- **Problem:** the red circle is the product's signature gesture and appears in brand copy and print (the invite card), yet the brand system does not know it exists.
- **Fix:**
  - Glossary row: "Record control: the red circle. Banned: microphone button, record button."
  - Change strings.en.ts:410.
  - Add `color.recording` (UI state, never a brand fill) to the registry and the BRAND_SYSTEM 4 table.

### BRD-12 OG image: undocumented device and missing descriptor (Medium)
- **Where:** `packages/brand/scripts/build-touchpoints.mjs:173` (a 10 px accentDeep bar across the foot of `og-image.png`); `registry.ts:98` (background documented as plain paper).
- **Problem:**
  - The bar is a new brand device that appears nowhere else and is not in the system.
  - The OG card is a first contact with new audiences, so BRAND.md:12 requires the descriptor. It carries only the tagline.
- **Fix:**
  - Remove the bar. A flat paper ground matches every other surface.
  - Under the tagline, add the descriptor "The baby memory book you fill by talking." in Mukta 400, inkMuted, about 26 px, from `brand.name` and content.
  - Update the registry title.

### BRD-13 Alt-text styling contradicts the wordmark rule (Low)
- **Where:** `docs/brand/EMAIL_IDENTITY.md:71` and `registry.ts:175` ("alt = brand name styled as a serif wordmark") vs `docs/design/DESIGN_LANGUAGE.md:79` ("Never retype the name in a font to stand in for the logo, not even as a fallback").
- **Problem:** in the images-blocked render, the alt shows in Times next to a broken-image icon. It is not a wordmark.
- **Fix:** reword both. "alt = brand name; styled in the email serif so the header line keeps its weight". Remove "styled as a serif wordmark" and the EB Garamond family from the alt style (`font-family: Georgia, serif`).

### BRD-14 "(c)" in the website footer reads as unfinished (Low, premium)
- **Where:** `docs/DECISIONS.md:403` (D-059).
- **Problem:** premium brands set ©. ASCII "(c)" looks like a placeholder.
- **Fix:** either allowlist U+00A9 in `packages/content/test/rules.test.ts` (it is text-presentation by default, not emoji), or drop the copyright line as the emails do (EMAIL_IDENTITY 5.2). Supersede D-059.

### BRD-15 Unregistered duplicate brand file (Low)
- **Where:** `packages/brand/assets/logo/primary/favicon.svg` is byte-identical to `packages/brand/assets/favicon/favicon.svg`, but only the latter is in the registry (`registry.ts:92`). `assetForPath` returns null for the former.
- **Fix:** stop `primary/source/build.mjs` emitting it, or register it as a source.
- Add a test: every file under `packages/brand/assets/` resolves through `assetForPath`.

### BRD-16 Banned glossary phrase in copy (Low)
- **Where:** "in any language" in `packages/content/src/emails/lifecycle.en.ts:29`, `packages/content/src/strings.en.ts:403`, `:410`; banned by BRAND.md:88.
- These are v1.1 strings, but they will ship eventually.
- **Fix:** "in the language you speak". Add the phrase to `rules.test.ts`.

### BRD-17 Token names drift in creative docs (Low)
- **Where:** `docs/design/CREATIVE.md:39`, `:46` use `textMuted`. The brand token is `inkMuted` (`packages/brand/index.ts`, registry `color.inkMuted`).
- **Fix:** rename it to `inkMuted` in CREATIVE.md.

## What is already at the bar (keep)
- The mark, its small cut, the stacked and horizontal lockups, and the three icon appearances.
- The registry design: permanent ids, primary/deprecated status, contexts, path lookup, and the tests.
- The email chrome:
  - Fixed From name.
  - Logo not a link.
  - Halo for Gmail forced dark (verified: it reads as outline lettering, acceptable).
  - A footer that tells you why it came.
  - "A person reads every one."
- BRAND_SYSTEM 9 do/don't table, and the "Smart, never the author" rule.
