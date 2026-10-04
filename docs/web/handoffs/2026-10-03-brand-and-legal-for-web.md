# Handoff to the web lane: brand, legal pages and email assets (2026-10-03)

From: the email and brand coordinator session (archive branch `archive/brand-explorations-2026-10-03`). To: the web coordinator (`docs/web/TEAM.md`; owners BR2, E1, E3).

The founder wants one standardised brand across every touchpoint. earlyletters.com is the Next.js scroll film only. An earlier Astro prototype from this lane is not part of any release; it stays on the archive branch for reference. Here is what the web lane needs to pick up.

1. **Brand assets come from the registry.**
   - Resolve them with `import { assetFor } from '@scribe/brand/registry'` and a context id: `web.header`, `web.footer`, `web.favicon`, `web.apple-touch`, `web.og-image`.
   - Never copy or redraw the mark. The wordmark is artwork and is never retyped (`docs/brand/BRAND_SYSTEM.md`).
   - BR2 owns `apps/web/src/components/brand/**`, the icons and the OG images.

2. **Email images: optional now** (changed 3 Oct 2026, email library merge).
   - Emails no longer load anything from the site: the logo is attached inline (`cid:`), and nothing in an email loads from a server (docs/brand/EMAIL_IDENTITY.md 4.6).
   - Serving `packages/brand/assets/email/*.png` at `/email/` is still useful for the remote fallback (`logo: 'remote'`, off by default) and for the press kit. Registry contexts `email.header.light`, `email.header.dark` and `email.avatar`.

2a. **Brand fonts at `/fonts/`** (added 2026-10-03, review BRD-03; for the website now, since emails dropped web fonts in the merge of 3 Oct 2026 unless the founder decides otherwise, EMAIL_IDENTITY 4.5).
   - Emails used to declare `@font-face` for Literata (400, 500, 400 italic) and Mukta (400, 600) from `https://earlyletters.com/fonts/<file>.woff2`. Registry context `email.type`; ids `font.reading.web`, `font.reading.web.500`, `font.reading.web.italic`, `font.ui.web`, `font.ui.web.600`. Files: `packages/brand/assets/fonts/{literata,mukta}/`, each with its `OFL.txt`.
   - `apps/web/scripts/sync-brand-assets.mjs` already copies every registry asset with a `url`, so the five files land in `public/fonts/` with no code change. Check the build output lists `fonts` among the served folders.
   - Headers for `/fonts/*` (E3, `vercel.json`): `Content-Type: font/woff2`, `Access-Control-Allow-Origin: *` (webmail clients fetch fonts cross-origin), `Cache-Control: public, max-age=31536000, immutable`. No cookies, no redirects, no query strings.
   - The site may use the same files for its own Literata and Mukta instead of a second copy.
   - Emails use Georgia and the system UI font; nothing depends on `/fonts/` being live.

3. **Legal pages.**
   - Legal text comes from `docs/legal/` (cleaned up in PR #81). This PR does not carry web copies of the legal documents; the site builds its legal pages from `docs/legal/`.
   - Routes, per Brief decision 13: `/terms`, `/privacy`, `/health-privacy`, `/subprocessors`, plus `/subscription-terms`.
   - While frontmatter says `status: draft`, the page shows a visible "Draft, pending legal review" banner and carries `noindex`. That stays until counsel signs off.
   - Also needed: `/delete-account` (D-042), and `/about`, `/why` and `/contact`, whose copy is in `packages/content/src/pages.en.ts`.

4. **Security headers.**
   - A reviewed header set is in `docs/web/handoffs/2026-10-03-security-headers.vercel.json`: strict CSP, HSTS, Permissions-Policy, and `frame-ancestors` set to none. The reasoning is in `docs/emails/SECURITY.md`.
   - E3 owns `apps/web/vercel.json`. Adapt the CSP to Next.js, using nonces or hashes for inline scripts.

5. **Landing page for email sign-in links.**
   - Sign-in links go to `https://earlyletters.com/auth/callback#token_hash=...` (see `docs/emails/SECURITY.md` and `supabase/auth-email.md`).
   - The page must never verify the token itself. It only hands off to the app through the universal link, so a mail scanner that opens the link cannot use it up.
   - This page and the AASA file are E1's routes.

6. **Copy decisions** (founder, Oct 3 evening, recorded in `docs/DECISIONS.md`):
   - The price is shown as "$3.99 a month or $29.99 a year", with the free trials.
   - Family at v1.0 is co-parent only.
   - Recordings back up for their owner only; family listening comes in v1.1.
   - The edit feature is called "Word for word".
   - The paid tier is called "Plus".
