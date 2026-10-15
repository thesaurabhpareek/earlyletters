# Design review: email brand library (`feat/email-brand-library`)

Reviewer: independent design lead (product, email, accessibility). Date: 2026-10-03.
Scope: `packages/emails/src/components/*`, the two template shells (`CopyEmail`, `LetterEmail`), built output in `packages/emails/out` (36 emails), primary mark in `packages/brand/assets/logo/primary`, email logos in `packages/brand/assets/email`.

Method: `npm run build -w @scribe/emails`; Playwright Chromium renders of 14 emails at 375 and 600 px (plus 1024 desktop), light and dark via `prefers-color-scheme`, logo URLs swapped to local `packages/brand/assets/email/*`. Extra simulations: images blocked (`*-imgoff`), all `<style>` stripped (`*-nostyle`, Gmail non-Google account / GANGA), and Gmail app forced inversion (page inverted, images not: `*-gmaildark`). Every screenshot was viewed. Shots: `docs/reviews/2026-10-03/design-shots/`.

## Verdict

**Ship after two medium fixes (DSN-01, DSN-02).** No blockers. The system is calm, warm and coherent: one sheet on a desk, one action, generous measure, correct own-palette dark mode, every text pair passes AA, alt text styled as a wordmark when images are off. What keeps it from feeling fully premium is (a) the logo's look in Gmail's forced-inversion dark mode, the single largest dark-mode audience, (b) Outlook Windows getting a square button, and (c) long notice emails (price, deletion) burying the two facts that matter in paragraph six.

| Dimension | Score |
|---|---|
| Hierarchy | 6 |
| Dark mode | 7 |
| Accessibility | 8 |
| Consistency | 7 |
| Premium feel | 7 |

## Contrast (computed, WCAG 2.x)

| Pair | Light | Dark |
|---|---|---|
| ink on sheet | 14.00 | 14.29 |
| inkMuted on sheet | 5.51 | 7.32 |
| inkMuted on desk (footer) | 5.11 | 8.01 |
| accent link on sheet | 5.50 | 7.64 |
| button text on accent | 5.50 (paper on #8A5A3B) | 8.11 (#1E1612 on #D9A47E) |
| ink on accentSoft (code, safety) | 12.07 | 11.20 |
| line on sheet (decorative) | 1.26 | 1.28 |
| sheet edge vs desk (decorative) | 1.08 | 1.10 |
| **light logo fill on Gmail-inverted sheet** | **~1.28** (legible only via the 0.7 px halo) | n/a |

All text passes AA (4.5:1); body, headings and buttons pass AAA. Button is 48 px tall (14 + 20 + 14) and full width under 480 px. Footer links are inline in text (WCAG 2.5.8 inline exception) with ~40 px between centres; fine.

## Findings

### DSN-01 (Medium) Gmail app forced inversion turns the logo into a hairline outline
`packages/emails/src/components/header.tsx:59`, asset `packages/brand/assets/email/logo-light.png` (halo 0.7 px, `manifest.json` `haloPx`).
Gmail iOS/Android ignore `prefers-color-scheme`, invert backgrounds and text, and leave images alone. The ink (#2B2722) logo then sits on a near-black sheet at ~1.28:1 and reads only through its 0.7 px paper halo, which looks like an embossed outline rather than the brand (see `design-shots/zoom-logo-gmail-inverted.png`, `sign-in-link-375-gmaildark.png`, `welcome-375-gmaildark.png`). This is the first thing every Gmail-dark reader sees.
Fix: give the light logo cell a background Gmail does not invert, so the logo always sits on paper there, and let real dark-mode clients override it:
```tsx
// header.tsx, wrap the light <img> (line 59) in:
<table role="presentation" cellPadding={0} cellSpacing={0} border={0} className="el-logo-plate"
  style={{ backgroundColor: light.sheet, backgroundImage: `linear-gradient(${light.sheet},${light.sheet})`, borderRadius: 6 }}>
  <tbody><tr><td style={{ padding: 0 }}>{/* existing light <img> */}</td></tr></tbody>
</table>
```
Gmail does not invert `background-image` gradients, so the plate stays paper (#FBF8F3) on the inverted sheet; in non-Gmail light mode it is invisible (same colour as the sheet). Add `.el-logo-plate{background-image:none !important;background-color:transparent !important;}` to `darkDeclarations` and `outlookDeclarations` in `theme.ts:55-86`. Then drop `haloPx` to 0 in the brand build (the halo is no longer needed and adds a faint fringe on retina light mode). Re-check with the `gmaildark` simulation.

### DSN-02 (Medium) No VML button: Outlook for Windows renders a square block
`packages/emails/src/components/actions.tsx:16-61`. The button is React Email's `<Button>` inside a `bgcolor` cell. Word ignores `border-radius`, so classic Outlook (and new Outlook in some tenants) shows a rectangular brown slab while every other client shows a pill: the one moment of brand in the email is the inconsistent one. `grep v:roundrect out/*.html` returns 0.
Fix: emit a VML pill for `mso` and hide the HTML button from it:
```tsx
<Mso html={`<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="50%" stroke="f" fillcolor="${light.accent}"><w:anchorlock/><center style="color:${light.onAccent};font-family:Segoe UI,Arial,sans-serif;font-size:17px;font-weight:600;">${escapeHtml(label)}</center></v:roundrect><![endif]-->`} />
<Mso html="<!--[if !mso]><!-->" />{/* existing table + ReButton */}<Mso html="<!--<![endif]-->" />
```
Compute width from label length (e.g. `Math.max(200, label.length * 10 + 56)`), and add `xmlns:v="urn:schemas-microsoft-com:vml"` to `<Html>` in `layout.tsx:33`. Children must become a string prop (`label`) for the VML copy.

### DSN-03 (Medium) Long notices bury the facts; no key-facts component
`packages/emails/src/templates/CopyEmail.tsx:46-48`; seen in `price-increase-375-light.png`, `account-deletion-scheduled-600-light.png`, `trial-ending-final-375-dark.png`.
Price increase is seven equal 17 px paragraphs; the old price, new price and date appear only inside sentences. Account deletion: the deletion date is in paragraph two of seven. Every paragraph has identical weight, so the eye has nowhere to land.
Fix: add a `FactList` component (two-column table, label in `inkMuted` 14 px, value in `ink` 17 px/600, rows separated by `line`, same `accentSoft`-free sheet background, `role="presentation"`) rendered by `CopyEmail` between body and button when `copy.facts` is present (e.g. `[{label:'Today', value:'{oldPrice} a year'},{label:'From {date}', value:'{newPrice} a year'}]`). Content stays in `@scribe/content`; the facts repeat, never replace, the sentences, so no words are invented. Apply to price-increase, trial-ending-*, annual-renewal-*, account-deletion-scheduled, book-deletion-scheduled.

### DSN-04 (Medium) Letter emails put the only action below the sign-off and the fold
`packages/emails/src/templates/LetterEmail.tsx:35-41`. Order is body, signature, divider (12 + 32 px), button. On a 375 px phone the button lands at ~745 px (`welcome-375-dark.png`, `welcome-family-375-light.png`), below the visible area of Mail on iPhone SE/mini, and it reads as a postscript.
Fix: keep the letter feel but move the action up: body, `Button`, `Signature`, then `Divider` + fallback + quiet note. If the signature-then-action order is a deliberate brand decision, at minimum remove the `Divider` at line 38 (it puts 44 px plus a rule between the last words and the action) and set `Button top={space[6]}`.

### DSN-05 (Low) Code box and safety note share one treatment, so they compete
`actions.tsx:95` and `text.tsx:86` both use the `accentSoft` wash with `radiusSmall`. In `reauthenticate-code-375-light.png` and `sign-in-link-375-light.png` the safety note is a larger box of the same colour below the code, pulling the eye away from the code.
Fix: make the safety note quieter: no fill, `borderLeft: 3px solid ${light.line}` (dark: `line`), `padding: 4px 0 4px 16px`, text 15 px ink. Keep the wash exclusive to the code.

### DSN-06 (Low) Code box optical imbalance from trailing tracking
`actions.tsx:110` (`letterSpacing: 6` from `tokens.ts:84`) adds 6 px after the last digit, so the right inset reads ~26 px vs 20 px left (`reauthenticate-code-600-dark.png`). Fix: `paddingRight: space[5] - type.code.tracking` on the `<td>` at `actions.tsx:99`, or `marginRight: -type.code.tracking` on the span.

### DSN-07 (Low) Dark logo hidden from Outlook only by `display:none` + `mso-hide`
`header.tsx:60-65`. Word honours `mso-hide:all` inconsistently on a `<div>`; if it fails, Outlook Windows shows both logos stacked. Fix: wrap the dark-logo div in `<Mso html="<!--[if !mso]><!-->" />` ... `<Mso html="<!--<![endif]-->" />` and also add `msoHide: 'all'` to the inner `<img>` style.

### DSN-08 (Low) Plain-text versions print the action URL twice and a meaningless "Button not working?"
`packages/emails/src/components/render.ts:26-33`; see `out/sign-in-link.txt` (URL on the button line and again under "Button not working? Copy and paste this link:").
Fix: give `LinkFallback`'s outer `Block` a wrapper `<div className="el-fallback">` (`actions.tsx:131-166`) and add `{ selector: 'div.el-fallback', format: 'skip' }` to the selectors; add `{ selector: 'a.el-btn', options: { linkBrackets: false } }` and render the button as its own paragraph so text reads `Sign in to my book:\nhttps://...`. Also put a blank line around the code so it stands alone (it already does; keep).

### DSN-09 (Low) Webfonts are named but never loaded
`tokens.ts:65,67` name Literata and Mukta "if installed"; no `<link>`/`@font-face` is emitted (`grep -c fonts.googleapis out/welcome.html` = 0), so every reader gets Georgia + system UI and the `weight: 500` heading (`tokens.ts:74`) falls back to Georgia Regular. The wordmark is Garamond, the headings Georgia: close, but not one voice.
Fix: in `layout.tsx` `<Head>` add `<link href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,400;7..72,500&family=Mukta:wght@400;600&display=swap" rel="stylesheet" />` inside `<!--[if !mso]><!-->...<!--<![endif]-->` (Apple Mail, iOS Mail, Outlook macOS load it; others fall back as today). If the privacy stance rules out Google-hosted fonts, self-host on `earlyletters.com/email/fonts/` and set heading `weight: 400` so the fallback is honest.

### DSN-10 (Low) Style-stripped clients keep desktop padding on phones
`layout.tsx:49` and `layout.tsx:68` (`tokens.ts:94` `pad: 40`). With `<style>` removed (`sign-in-link-375-nostyle.png`) the measure on a 375 px phone drops to ~263 px and the button stops being full width. Fix: inline the mobile values (`pad: 28`, outer `16px`) and raise to 40 with a `min-width:601px` media query instead (mobile-first), so the fallback is the phone layout.

### DSN-11 (Low) Template choice inconsistent for family mail
`templates/family/family-book-closing.tsx:11` uses `CopyEmail` (sans, safety layout) while `welcome-family` uses `LetterEmail` (serif letter). Both go to the same relatives; closing is the more emotional of the two (`family-book-closing-375-dark.png` vs `welcome-family-375-light.png`). Fix: render family-book-closing and family-book-restored with `LetterEmail`.

### DSN-12 (Low) Headings orphan a single word on phones
`text.tsx:13-27`. "Everything you made is still / here" (`plus-ended-375-dark.png`). Fix: add `textWrap: 'balance'` to the `h1` style (Apple Mail/iOS honour it; others ignore it harmlessly).

### DSN-13 (Low) Fallback URL breaks mid-word with a one-letter orphan
`actions.tsx:152,160` `wordBreak: 'break-all'` gives `.../subscription` / `s` (`price-increase-375-light.png`). Fix: drop `break-all`, keep `overflowWrap: 'anywhere'`, and insert `<wbr />` after each `/`, `?`, `&` and `=` when rendering the href text.

## What is good (keep)
- Own dark palette is correct in every honouring client: reversed logo swaps in, button flips to light accent with dark text (8.11:1), code box and note retain hierarchy (`*-dark.png`).
- `data-ogsc`/`data-ogsb` duplication for Outlook.com, separate `<style>` blocks so Gmail does not drop the responsive rules, ghost table, DPI fix, `x-apple-data-detectors` reset.
- Images-off: alt text renders as a serif wordmark in ink (`*-imgoff.png`).
- 17 px body, 1.6 line height, 13 px floor, 48 px full-width button on phones; numeric code gets a digit-by-digit `aria-label`.
- Primary mark (`design-shots/primary-mark-sheet.png`, `app-icon-*.png`): the paired open-quote symbol is well drawn, optically centred (sits slightly high on the tile, correct for a bottom-heavy form), reads at 16 px, and the favicon switches to `accentDark` in dark tabs. Horizontal lockup spacing and cap alignment are clean. Note only: the symbol is close to a stock Garamond open quote, so its ownability rests on the colour and the lockup, not the shape.
- Superseded `assets/email/a` and `assets/email/b` are marked deprecated in the registry; consider deleting them before release so they are not deployed to `/email/`.
