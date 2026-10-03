# Handoff to the web lane: brand, legal pages and email assets (2026-10-03)

From: the email and brand coordinator session (archive branch `feat/email-brand-library`). To: the web coordinator (`docs/web/TEAM.md`; owners BR2, E1, E3).

The founder wants one standardised brand across every touchpoint. earlyletters.com is the Next.js scroll film only. An earlier Astro prototype from this lane is not part of any release; it stays on the archive branch for reference. Here is what the web lane needs to pick up.

1. **Brand assets come from the registry.**
   - Resolve them with `import { assetFor } from '@scribe/brand'` and a context id: `web.header`, `web.footer`, `web.favicon`, `web.apple-touch`, `web.og-image`.
   - Never copy or redraw the mark. The wordmark is artwork and is never retyped (`docs/brand/BRAND_SYSTEM.md`).
   - BR2 owns `apps/web/src/components/brand/**`, the icons and the OG images.

2. **The site must serve the email images.**
   - Every transactional email loads `https://earlyletters.com/email/<file>`. The registry contexts are `email.header.light`, `email.header.dark` and `email.avatar`.
   - At build, copy `packages/brand/assets/email/*.png` to `apps/web/public/email/`. Otherwise every email logo returns 404 once mail is live.

2a. **The site must serve the brand fonts at `/fonts/`** (added 2026-10-03, review BRD-03).
   - Every email declares `@font-face` for Literata (400, 500, 400 italic) and Mukta (400, 600) from `https://earlyletters.com/fonts/<file>.woff2`. Registry context `email.type`; ids `font.reading.web`, `font.reading.web.500`, `font.reading.web.italic`, `font.ui.web`, `font.ui.web.600`. Files: `packages/brand/assets/fonts/{literata,mukta}/`, each with its `OFL.txt`.
   - `apps/web/scripts/sync-brand-assets.mjs` already copies every registry asset with a `url`, so the five files land in `public/fonts/` with no code change. Check the build output lists `fonts` among the served folders.
   - Headers for `/fonts/*` (E3, `vercel.json`): `Content-Type: font/woff2`, `Access-Control-Allow-Origin: *` (webmail clients fetch fonts cross-origin), `Cache-Control: public, max-age=31536000, immutable`. No cookies, no redirects, no query strings.
   - The site may use the same files for its own Literata and Mukta instead of a second copy.
   - Until `/fonts/` is live, emails fall back to Georgia and the system UI font; nothing breaks.

3. **Legal pages.**
   - Web-ready drafts are in `packages/content/legal/`: `terms.md`, `privacy.md`, `subscription-terms.md`, `health-privacy.md` and `subprocessors.md`. `REVIEW_NOTES.md` is not a page.
   - Routes, per Brief decision 13: `/terms`, `/privacy`, `/health-privacy`, `/subprocessors`, plus `/subscription-terms`.
   - While frontmatter says `status: draft`, the page shows a visible "Draft, pending legal review" banner and carries `noindex`. That stays until counsel signs off.
   - Also needed: `/delete-account` (D-042), and `/about`, `/why` and `/contact`, whose copy is in `packages/content/src/pages.en.ts`.

4. **Security headers.**
   - A reviewed header set is in `docs/web/handoffs/2026-10-03-security-headers.vercel.json`: strict CSP, HSTS, Permissions-Policy, and `frame-ancestors` set to none. The reasoning is in `docs/emails/SECURITY.md`.
   - E3 owns `apps/web/vercel.json`. Adapt the CSP to Next.js, using nonces or hashes for inline scripts.

5. **Landing page for email sign-in links.**
   - Sign-in links go to `https://earlyletters.com/auth/confirm#token_hash=...` (see `docs/emails/SECURITY.md` and `supabase/auth-email.md`).
   - The page must never verify the token itself. It only hands off to the app through the universal link, so a mail scanner that opens the link cannot use it up.
   - This page and the AASA file are E1's routes.

6. **Copy decisions** (founder, Oct 3 evening, recorded in `docs/DECISIONS.md`):
   - The price is shown as "$3.99 a month or $29.99 a year", with the free trials.
   - Family at v1.0 is co-parent only.
   - Recordings back up for their owner only; family listening comes in v1.1.
   - The edit feature is called "Word for word".
   - The paid tier is called "Plus".
