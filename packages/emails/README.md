# @scribe/emails

Email component library, tokens and renderer. Quiet UI, loud letters: a warm paper sheet on a slightly deeper desk, one action per email, generous space, and nothing loaded from a server: the logo is an inline attachment (`cid:`), there are no web fonts and no tracking (docs/brand/EMAIL_IDENTITY.md 4.5 and 4.6).

- Components: `src/components` (lane D1). Tokens: `src/tokens.ts`.
- Templates: `src/templates` (lane D2). Words: `@scribe/content` (`src/emails/*.en.ts`). Components contain no copy of their own; the footer and signature read `chrome.en.ts` (B3) and `legal.en.ts` (L2).
- Logos: `packages/brand/assets/email` (B3), attached inline. Senders call `renderForResend(element)` (`src/send.ts`) and pass its `attachments` to Resend; `logo: 'text'` sends no image (Supabase Auth templates), `logo: 'remote'` loads the hosted copy from `https://earlyletters.com/email/` (off by default).
- Supabase Auth templates: `npm run export:supabase -w @scribe/emails` writes `supabase/templates/` (text wordmark); a test fails if the committed files drift.

```bash
npm run build -w @scribe/emails          # render src/templates to out/
npx tsx scripts/render.ts --fixtures     # (in this folder) also render test/fixtures
npx vitest run && npx tsc --noEmit       # tests and types
open out/index.html                      # gallery: 375px light and dark frames side by side
```

## Adding an email

1. Copy goes in `@scribe/content` first (`EmailCopy`, see `src/emails/types.ts`). Content rules apply: no em or en dashes, curly quotes, ellipsis characters or emoji; no fear, guilt or AI-writing language.
2. Add `src/templates/<area>/<id>.tsx`. The file name is the output name and must be unique.
3. Export the component as `default` and a `PreviewProps` object (fictional family "Asha" only). Optionally export `subject` to show it in the gallery. Modules without `PreviewProps` are treated as helpers and skipped.
4. Build from the components only:

```tsx
<EmailLayout preheader="Adds to the subject, 40 to 90 characters.">
  <EmailHeader />
  <Heading>The one line that matters</Heading>
  <Paragraph>UI sans, 17px.</Paragraph>
  <Paragraph variant="letter">Reading serif, 18px, for mail written like a letter.</Paragraph>
  <KeyFacts facts={[{ label: 'Price', value: '{newPrice} a year' }, { label: 'Renews on', value: '{date}' }]} />
  <Button href="{signInUrl}">Sign in to my book</Button>
  <CodeBox label="Or enter this code in the app" code="{code}" />
  <Divider />
  <LinkFallback href="{signInUrl}" label="Button not working? Copy and paste this link:" />
  <Note tone="safety">Did not ask for this? You can ignore it.</Note>
  <Signature />                {/* defaults to emailChrome.signature */}
  <EmailFooter kind="transactional" />   {/* lifted out of the sheet onto the desk */}
</EmailLayout>
```

5. Render with `renderEmail()` / `renderEmailText()` from this package, never `@react-email/render` directly: `renderEmail` unwraps the Outlook conditional comments (`src/components/mso.tsx`). The plain-text part keeps heading case and skips decoration.
6. `npm run build`, check both frames in `out/index.html`, run the tests. Before launch, run each email through Litmus or Email on Acid (see "Not verified" below).

Placeholders such as `{signInUrl}` stay literal in the HTML for the sender to fill (or for D2's Supabase export to swap for Go variables). `EmailFooter` fills `{helpUrl}` and `{privacyUrl}` with `https://earlyletters.com/contact` and `/privacy` unless `values` overrides them; `{preferencesUrl}`, `{unsubscribeUrl}` and `{postalAddress}` stay literal.

## Components

| Component | Notes |
|---|---|
| `EmailLayout preheader theme? title? lang?` | html/head/body; `color-scheme` and `supported-color-schemes` metas; reset, responsive and dark CSS; 600px sheet, fluid below, Outlook ghost table; preheader via React Email `Preview` (padded so body text does not leak into the inbox preview). `theme`: `auto` (default, ship this), `light`, `dark` (gallery). |
| `EmailHeader alt?` | Light logo 154x32 (2x PNG) on a paper plate that survives Gmail's forced dark, dark logo swapped in where supported (hidden from classic Outlook). Alt text in Georgia when images are blocked. Not a link. |
| `EmailFooter kind whyText? values?` | Lines from `emailChrome.footer[kind]` with `{whyYouGotThis}`, `{unsubscribe}`, `{postalAddress}` from `emailLegal`; link row; name line. Unsubscribe renders as a link when L2's `unsubscribeLink` exists. |
| `Heading` | Serif 26px (24px on phones), weight 500, `text-wrap: balance` (no one-word orphan). |
| `Paragraph variant?` | `ui` sans 17/1.6 (default), `letter` serif 18/1.65. |
| `Button href label?` | Label as `label` or plain-text children. Filled `<td bgcolor>` plus padded link, 48px tall, pill, full width at 480px and below. Classic Outlook gets a VML `v:roundrect` pill instead (`arcsize="50%"`, width from the label length); the HTML button is hidden from it. `top` sets the space above. |
| `CodeBox code label` | Monospace 30px, tabular, `user-select: all`, digits read one by one by screen readers. The accent wash is reserved for it. |
| `KeyFacts facts` | The two to five facts a notice turns on (price, renewal date, trial end), as label/value rows: label muted 14px, value ink 17px semibold, hairlines between. Repeats the sentences, never replaces them; words from `@scribe/content`. Plain text: `Label: value`. Use in price-increase, trial-ending-*, annual-renewal-*, account-deletion-scheduled, book-deletion-scheduled. |
| `LinkFallback href label` | Full URL as visible text, breaking only after `/ ? & =`. Skipped in plain text (the button line already has the URL). |
| `Letter signoff? action? fallback? note? actionPlacement?` | Letter-email body: paragraphs, the one action, sign-off, hairline, fallback, quiet note. `actionPlacement`: `before-signoff` (default; keeps the action above the fold on a 375px phone) or `after-signoff` (a postscript, no hairline above it). |
| `Divider` | Table-cell hairline (Outlook safe). Decorative only. |
| `Signature text?` | Serif italic; `\n` becomes a line break. |
| `Note tone` | `quiet`: small muted sans. `safety`: 15px ink with a 3px `line` rule on the left, no fill. Never red, never an icon. |

Tokens: colours come from `@scribe/brand`; the dark `accentSoft` (#3A2E25) and `onAccent` (#1E1612) and the light desk (#F5EFE7) come from `docs/design/DESIGN_LANGUAGE.md`, where their contrast ratios are computed. No pure white or pure black is used anywhere; text on the light button is paper (#FBF8F3, 5.5:1).

## Dark mode strategy

Three layers, because no single technique reaches every client:

1. **Inline light palette everywhere.** Clients that strip `<style>` (Gmail with non-Google accounts) or ignore dark targeting still get a finished, readable email.
2. **Our own dark palette** under `@media (prefers-color-scheme: dark)` with `el-*` classes and `!important` (Apple Mail, Outlook for Mac/iOS/Android, Thunderbird, Proton). `<meta name="color-scheme" content="light dark">` and `supported-color-schemes` tell Apple Mail we handle dark ourselves, so it does not auto-darken.
3. **Outlook rewrite markers.** The same rules repeated under `[data-ogsc]` (text) and `[data-ogsb]` (backgrounds), the attributes Outlook.com and the Outlook apps add when they recolour an email.
4. **Forced inversion we cannot target** (Gmail iOS and Android apps, classic Outlook for Windows). The light palette is chosen to survive it: warm mid-tones, no #FFFFFF or #000000, button text that is not pure white. The light logo sits on a **paper plate**: its cell sets the paper colour both as `background-color` and as `background-image: linear-gradient(paper, paper)`. Gmail inverts colours but not background images, so the plate stays paper and the ink logo stays legible on a small chip; in light mode the plate is invisible, and every dark rule (`el-logo-plate`) removes it. Classic Outlook ignores background images, so the logo PNG also keeps its 0.7px paper halo. Simulated with an inversion render (colours inverted, images and background images untouched); confirm on Gmail iOS/Android before launch.

Dark CSS and responsive CSS are separate `<style>` blocks: Gmail drops a whole block it cannot parse, so dark rules can never take the responsive rules down with them.

Logo swap: the dark logo sits in a `div` with `display:none; max-height:0; overflow:hidden; mso-hide:all` and is shown by the dark rules. It is also wrapped in `<!--[if !mso]><!-->` and its `img` carries `mso-hide:all`, so classic Outlook (where `display:none` does not inherit to inner tables, source 5) never shows both logos.

Mobile first: the inline sheet padding (24px) and gutter (12px) are the phone layout, so clients that strip `<style>` still fit a phone. `@media (min-width:601px)` raises them to 40px and 16px; classic Outlook gets 40px from a conditional style in `MsoHead`.

Gallery: `out/gallery/<name>.dark.html` is rendered with `theme="dark"`, which emits the dark rules unscoped, so the dark frame shows our dark palette in any browser. Gallery variants load the logos from `out/email/` (copied from `packages/brand/assets/email`), since a browser cannot resolve a Content-ID; the shipped `out/<name>.html` keeps `cid:el-logo-light` and `cid:el-logo-dark`.

Web fonts: off (`EmailAssets.webFonts`, default false). A font loaded from our server would tell us the email was opened, like a pixel, so every client uses the fallback stacks: Georgia (or a local Literata) and the platform UI font. The self-hosted `@font-face` set (registry context `email.type`) is still wired and turns on only if the founder decides so (EMAIL_IDENTITY 4.5).

## Client support matrix

Status: Yes / Partial / No / UNVERIFIED (not confirmed from a primary or test-based source as of 2026-10-03). "Ours" says what this library does about it.

| Client | `prefers-color-scheme` | `color-scheme` meta | Dark behaviour without our CSS | `<style>` in head | Ours |
|---|---|---|---|---|---|
| Apple Mail macOS / iOS | Yes [1] | Partial [2] | Auto-darkens transparent or #FFFFFF backgrounds [4] | Yes [6] | Full dark palette, logo swap |
| Gmail web | No [1] | Partial; only `light only` honoured per caniemail's Google IssueTracker note [2] | No change [3][4] | Head only, 16KB limit [6] | Light palette; style blocks kept small (tested < 16KB) |
| Gmail iOS / Android | No [1] | Partial, as above [2] | Full invert [3]; Android when the email is not already dark [4] | Head only [6] | Inversion-safe light palette; logo on a background-image paper plate |
| Gmail with non-Google accounts (IMAP) | No [1] | UNVERIFIED | UNVERIFIED | UNVERIFIED (commonly reported as stripped) | Everything essential is inline |
| Outlook Windows (classic, Word engine) | No [1][4] | No [2] | Full invert [3][4] | Buggy, declare before use [6] | Ghost table, `bgcolor` cells, VML pill button, `mso-hide`, DPI fix, desktop padding via conditional style, no web fonts |
| New Outlook for Windows | UNVERIFIED | No [2] | UNVERIFIED | UNVERIFIED | Same as Outlook.com, assumed |
| Outlook.com | Partial, via data attributes [1] | No [2] | Partial invert [3][4] | Partial [6] | `[data-ogsc]` / `[data-ogsb]` rules; image swap works here [4] |
| Outlook iOS / Android | Partial, via data attributes [1] | No [2] | Partial invert [3][4] | Partial [6] | Media query and data-attribute rules |
| Outlook macOS | Partial [1]; supports the media query [4] | No [2] | Partial [3][4] | Partial [6] | Media query rules |
| Yahoo Mail / AOL | No [1] | No [2] | No change [3][4] | Yes [6] | Light palette |
| Thunderbird | Yes (macOS 60.8+) [1] | UNVERIFIED | UNVERIFIED | UNVERIFIED | Media query rules |
| Proton Mail | Yes [1] | UNVERIFIED | UNVERIFIED | Head only [6] | Media query rules |
| Fastmail | Partial [1] | UNVERIFIED | UNVERIFIED | UNVERIFIED | Media query rules |
| HEY | No (rewritten to `@media (false)`) [1] | UNVERIFIED | UNVERIFIED | UNVERIFIED | Light palette |
| Samsung Email | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | Light palette |

Other limits the tests enforce:

| Limit | Source | Test |
|---|---|---|
| Gmail clips messages over about 102KB ("[Message clipped]") | Industry-documented [7]; Google publishes no number: UNVERIFIED against a Google source | HTML under 102 x 1024 bytes |
| Gmail ignores a `<style>` block over 16KB | caniemail [6] | each block under 16KB |
| `@media` width queries work in Gmail (not nested) | caniemail [8] | responsive rules are flat `max-width` queries |
| Classic Outlook: `display:none` does not inherit to inner tables | caniemail [5] | dark logo uses `mso-hide:all` on the wrapper and holds only an image |

Not verified here (no rendering farm in this environment): actual screenshots in Outlook for Windows, Gmail iOS/Android inversion of our exact palette, Outlook.com logo swap, Samsung Email. Run Litmus or Email on Acid before launch and record results in this table.

### Sources (fetched 2026-10-03)

1. caniemail, `@media (prefers-color-scheme)`, last tested 2023-03-08: https://www.caniemail.com/features/css-at-media-prefers-color-scheme/
2. caniemail, `color-scheme` meta, last tested 2026-09-16: https://www.caniemail.com/features/html-meta-color-scheme/
3. Litmus, "The Ultimate Guide to Dark Mode for Email Marketers" (modified 2026-03-20): https://www.litmus.com/blog/the-ultimate-guide-to-dark-mode-for-email-marketers
4. Email on Acid, "Dark Mode for Email" (2025-10-02): https://www.emailonacid.com/blog/article/email-development/dark-mode-for-email/
5. caniemail, `display`, last tested 2021-12-01: https://www.caniemail.com/features/css-display/
6. caniemail, `<style>` element, last tested 2023-07-27: https://www.caniemail.com/features/html-style/
7. Gmail clipping at ~102KB, secondary sources only, e.g. https://mxtoolbox.com/dmarc/email/email-clipping and https://help.activecampaign.com/hc/en-us/articles/115001060524
8. caniemail, `@media`, last tested 2023-12-13: https://www.caniemail.com/features/css-at-media/

caniemail data for several clients is two to three years old; treat "Yes/No" as a starting point, not a guarantee.

## Tests (`test/emails.test.ts`)

Run over every template in `src/templates` plus `test/fixtures/` (`pipeline-sample`, every component once; `letter-sample`, the `Letter` layout):
colour-scheme metas and dark rules present; non-empty preheader kept out of the plain text; nothing loaded from a server (images only `cid:el-logo-light` / `cid:el-logo-dark`, no CSS `url()`, no `@font-face`, `@import`, stylesheet links, scripts or frames); Outlook conditionals balanced; one well-formed VML pill per button with the same href and label, HTML button hidden from mso; the light logo on the background-image plate, removed by the dark and `[data-ogsb]` rules; component checks (KeyFacts plain text, Letter order, URL printed once in plain text, `<wbr>` breaks); links only to `earlyletters.com`, `mailto:`, `{placeholders}` or the allowlist (`apps.apple.com`, Apple's subscription page); no tracking pixels (only the two inline logos, never 0 or 1px), no UTM or click-tracking URLs; no em or en dashes, curly quotes or ellipsis characters in HTML or text; HTML under 102KB and each style block under 16KB; `lang`, viewport, presentation tables and alt text; no Outlook marker spans left; a real plain-text part. Plus: every develop email is ported (sign-in, welcome, co-parent invite, deletion receipts, export) with every placeholder filled and the action link in both parts; `renderForResend` returns PNG attachments whose Content-IDs match the HTML; text mode has no image; the remote fallback loads only from `earlyletters.com/email/`; the committed Supabase templates match the export and load nothing.
