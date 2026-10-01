# CLAUDE.md: rules for anyone (human or AI) changing this repo

Product: **Early Letters**, a baby memory book families fill by talking. Internal codename: `scribe`.
The public name lives only in `packages/brand/index.ts`. Never hardcode it elsewhere.

## The constitution
The machine may remove and repair. It may never add meaning.
- Transcription is cleaned only by the edit types in `packages/core/src/types.ts` (`EditType`).
- Every machine edit goes through `verifyEdits` in `packages/core/src/verify.ts`. No exceptions, no bypass flags.
- `raw_transcript` is immutable (database trigger enforces it). Every edit is stored and reversible.
- No feature may write, rewrite, summarize or "shape" a person's words. Say no to "make it nicer" requests.

## Where things live
| Path | What |
|---|---|
| `apps/ios` | Expo SDK 57 iOS app (Expo Router) |
| `packages/core` | Faithful-edit engine, verifier, age math, prompt selection, safety tiers. Pure TS, no React Native |
| `packages/content` | Every word the product says (in-app, App Store, website, printed book) + 104 prompts. `VOICE.md`, `BRAND.md` |
| `packages/design-tokens` | Colours, type, spacing, motion. One source for iOS and web |
| `packages/brand` | Public name, store name, company, bundle ID |
| `supabase/migrations` | Database schema and access rules |
| `supabase/tests` | Access-rule tests (run in embedded Postgres) |
| `experiments` | Mac kit to test speech models on real recordings |
| `docs/ARCHITECTURE.md`, `docs/adr/` | System design and decision records |
| `docs/design/` | Design language, benchmark, component library, component specs |

## Commands
```bash
npm install            # once, at the repo root
npm test               # engine (37) + content rules (16)
npm run test:db        # database access rules (36)
npm run typecheck
npm run mobile         # start the iOS app
```
All tests must pass before any commit. If a content rule test fails, fix the copy, not the test.

## Content rules (enforced by `packages/content/test/rules.test.ts`)
- No em dashes, en dashes, curly quotes, ellipsis characters, or emoji.
- No fear, guilt or loss language. Legacy is about love and time, never endings.
- Never imply AI writes anything. We never rewrite.
- Never gender the child; use `{child}`.
- Celebrate what exists; never count gaps. No streaks, points or badges, ever.

## Privacy rules
- No entry text, transcript, audio or child name in analytics, logs or crash reports.
- Safety events store tier and time only, never the text.
- Real family details never go in code, tests or fixtures. Tests use the fictional family "Asha".

## Branches and commits
- `main` is always releasable. Work on short branches: `feat/<area>-<what>`, `fix/<what>`, `chore/<what>`, `exp/<what>` (experiments), `docs/<what>`.
- One concern per pull request. Database changes ship as a new migration file; never edit a migration that has been applied.
- Release tags: `ios-v<major>.<minor>.<patch>`.
