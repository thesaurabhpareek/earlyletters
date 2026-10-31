# @scribe/content

Every word the product says, in the app, the App Store, the website, emails and the printed book. Components and screens hold no copy of their own.

## What is in it

| Path | What |
|---|---|
| `VOICE.md`, `BRAND.md` | Voice guide and brand wording |
| `src/strings.en.ts`, `src/pages.en.ts`, `src/site.en.ts` | In-app strings, pages, website copy |
| `src/store.en.ts`, `src/book.en.ts`, `src/stories.en.ts` | App Store listing, printed book, stories |
| `src/features/` | Copy per feature (auth, backup, billing, family, language, packs and more) |
| `src/emails/` | Email copy (`*.en.ts`), used by `@scribe/emails` |
| `src/prompts.ts` | Hand-written prompts, picked by rules in `@scribe/core`. Keys are stable: never reuse a key for new wording |
| `src/pricing.ts`, `src/permissions.en.ts` | Pricing and permission wording |
| `test/` | Includes `rules.test.ts`, which enforces the content rules |

## Commands

```bash
npm test -w @scribe/content
npm run typecheck -w @scribe/content
npm run test:coverage -w @scribe/content
```

## Rules

Content rules are in `CLAUDE.md` and enforced by `test/rules.test.ts`. Voice is in `VOICE.md`.

## Do not

- Do not use em dashes, en dashes, curly quotes, ellipsis characters or emoji.
- Do not write fear, guilt or loss language. Do not count gaps. No streaks, points or badges.
- Do not imply AI writes anything. We never rewrite.
- Do not gender the child. Use `{child}`.
- Do not hardcode the product name. It comes from `@scribe/brand`.
- If a content rule test fails, fix the copy, not the test.
