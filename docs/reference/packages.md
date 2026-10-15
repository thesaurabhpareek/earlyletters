---
title: Packages and workspaces
owner: reference-docs
covers: [package.json, apps/mobile/package.json, packages/*/package.json, packages/*/src/index.ts, packages/brand/index.ts, packages/content/src/**, packages/design-tokens/**, packages/emails/**, packages/analytics/**, experiments/package.json]
verified_at: d74e860
verified_on: 2026-10-15
---

# Packages and workspaces

The repo is one npm workspace (`package.json` at the root: `apps/*`, `packages/*`, `experiments`). Every package is TypeScript source with `main` pointing at `src/index.ts` (or `index.ts` for brand), so nothing is built before it is imported.

## Workspaces

<!-- facts:workspaces -->
| Workspace | Package | What it is |
|---|---|---|
| `apps/mobile` | `@scribe/mobile` |  |
| `packages/analytics` | `@scribe/analytics` | Opt-in, content-free product analytics: typed event allowlist, consent gate, provider adapter, insights engine. Pure TypeScript, no React Native. See docs/analytics/TRACKING_PLAN.md. |
| `packages/api` | `@scribe/api` | Typed, versioned contracts shared by the app, Edge Functions and scripts: pack manifest, remote config, content blocks, response envelope and errors, plus the integrity helpers (canonical JSON, Ed25519, SHA-256). Pure TypeScript, no React Native. See docs/adr/0016 and 0017. |
| `packages/brand` | `@scribe/brand` | The product's public identity. Rename the product here only. |
| `packages/content` | `@scribe/content` | Every word the product says, in app and out. Rules in VOICE.md are enforced by test/rules.test.ts. |
| `packages/core` | `@scribe/core` | Faithful-edit engine, prompts, age math. Pure TypeScript, no React Native. |
| `packages/design-tokens` | `@scribe/design-tokens` | Design tokens for Early Letters (colors, type, spacing, radii, elevation, motion, targets) and the bundled OFL fonts. Zero runtime dependencies; consumable by React Native and web. |
| `packages/emails` | `@scribe/emails` | Email template library. React Email components, light and dark, mobile first, plain-text twin for every email. Nothing loads from a server: the logo is an inline attachment, no web fonts, no tracking. Copy lives in @scribe/content. |
<!-- /facts:workspaces -->

The facts block covers `apps/` and `packages/`. The root also lists `experiments` (`@scribe/experiments`: speech-model experiments on real recordings, Mac only, depends on `@scribe/core`; see `experiments/README.md`).

## What each exports and who imports it

Who imports what was read from `import ... from '@scribe/...'` lines and, for Edge Functions, relative imports of `packages/*` (counted 15 Oct 2026).

| Package | Main exports | Imported by |
|---|---|---|
| `@scribe/core` | Edit types and `faithfulClean`, `verifyEdits`, `ENGINE_VERSION`, language rules and pack validation, age math (`ageOn`, `dateline`, `chapterOf`), prompt selection, safety tiers (`classify`), the plan rules (`decideKeepLetter`, `DEFAULT_FREE_LETTERS`), domain value sets (`ENTRY_KINDS`, `MEMBER_ROLES`) | `apps/mobile`, `@scribe/content`, `@scribe/analytics`, `experiments`, `scripts/packs` |
| `@scribe/api` | Pack manifest, remote config and content bundle schemas and parsers, response envelope, API standards, canonical JSON, Ed25519 and SHA-256 helpers, `TRUSTED_SIGNING_KEYS` | `apps/mobile` (`lib/remote`, `lib/packs`, root layout), Edge Functions (`envelope.ts`, `standards.ts`), `scripts/packs` |
| `@scribe/content` | Every string: `en` (in-app strings), prompts, `storeListing`, `site`, `book`, `permissions`, `pages`, emails, onboarding stories, feature copy, and `PLUS_PRICE` for public copy | `apps/mobile`, `@scribe/emails`, `purge-worker` (email copy), `scripts/packs` (content bundle) |
| `@scribe/brand` | `brand` (name, store name, subtitle, publisher, web addresses, support, email identity, colours, scheme, codename) and `bundleId()` | `apps/mobile` (also loaded by `app.config.ts` at config time), `@scribe/content`, `@scribe/emails`, `purge-worker` |
| `@scribe/design-tokens` | `tokens` (colours light and dark, high contrast, `atmosphere` (the lamp colour and peak opacity per scheme, #99), type, spacing, radii, elevation, motion including `lamp`), generated CSS (`tokens.native.css`, `tokens.web.css`), `fonts` | `apps/mobile`, `@scribe/emails` |
| `@scribe/emails` | React Email components and templates, `renderForResend`, logo attachments | No other workspace imports it; its own `packages/emails/scripts/export-supabase.ts` generates `supabase/templates`. Email copy comes from `@scribe/content` |
| `@scribe/analytics` | Event allowlist, consent gate, `createAnalytics`, PostHog adapter, insights engine (not exported from the index) | `apps/mobile/src/lib/analytics` (inert while `ANALYTICS=off`), `scripts/insights` |
| `@scribe/mobile` | The app; exports nothing | nobody |

`apps/mobile` imports `@scribe/analytics` but does not list it in `apps/mobile/package.json` dependencies; it resolves through the workspace.

## Dependency rules

What the code shows today, from each package's own imports:

```
core            (imports no other package)
brand           (imports no other package)
design-tokens   (imports no other package)
api             (no runtime import of another package; content and core only in its tests)
content      -> brand, core
analytics    -> core
emails       -> brand, content, design-tokens
mobile       -> api, brand, content, core, design-tokens, analytics
```

Rules written down in the repo:

- **The public name lives only in `packages/brand/index.ts`** (`CLAUDE.md`). The package description of `@scribe/design-tokens` and the Keychain item name in `apps/mobile/src/lib/billing/letter-ledger.logic.ts` also contain the name; both are noted for their owners.
- **`core`, `api` and `analytics` are pure TypeScript with no React Native** (their `package.json` descriptions), so they run in Node tests, in Edge Functions and on the phone.
- **`api` does not import `core`**: the free-letter numbers are mirrored in both (`BUNDLED_FREE_LETTERS` in `packages/api/src/remote-config.ts`, `DEFAULT_FREE_LETTERS` in `packages/core/src/plan.ts`). No test compares them: `packages/api/test/remote-config.test.ts` and `packages/core/test/plan.test.ts` each pin their own copy to 2.
- **Every word comes from `@scribe/content`**; screens never hardcode user-facing text (`apps/mobile/src/lib/copy.ts`). Content rules are enforced by `packages/content/test/rules.test.ts` (`VOICE.md`, `BRAND.md`).
- **Prices appear only in `packages/content/src/pricing.ts`** for public copy (website, store listing) and never in app copy ([plus-and-billing.md](plus-and-billing.md)).
- **Edge Functions import only dependency-free modules** from `packages/api`, `packages/brand` and `packages/content`, by relative path, and deploy with `--use-api` (`supabase/functions/*/index.ts`).

## Commands

From `CLAUDE.md` and the root `package.json`:

| Command | Runs |
|---|---|
| `npm test` | `test` in every workspace that has one |
| `npm run typecheck` | `typecheck` in every workspace |
| `npm run test:db` | `supabase/tests/run.mjs` (PGlite access rules) |
| `npm run test:functions` | Deno tests for `purge-worker`, `analytics-forget`, the shared logger and `scripts/ops` |
| `npm run mobile` | `expo start` in `apps/mobile` |
| `npm run experiment` | The speech-model experiment kit (Mac) |
