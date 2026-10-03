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
| `apps/mobile` | Expo SDK 57 app: iOS first, Android later (Expo Router) |
| `packages/core` | Faithful-edit engine, verifier, age math, prompt selection, safety tiers. Pure TS, no React Native |
| `packages/content` | Every word the product says (in-app, App Store, website, printed book) + 104 prompts. `VOICE.md`, `BRAND.md` |
| `packages/design-tokens` | Colours, type, spacing, motion. One source for iOS and web |
| `packages/brand` | Public name, store name, company, bundle ID |
| `supabase/migrations` | Database schema and access rules |
| `supabase/tests` | Access-rule tests (run in embedded Postgres) |
| `experiments` | Mac kit to test speech models on real recordings |
| `docs/ARCHITECTURE.md`, `docs/adr/` | System design and decision records |
| `docs/design/` | Design language, benchmark, component library, component specs |
| `packages/api` | Typed API contracts, signed manifests, latency budgets |
| `packages/analytics`, `packages/emails` | Opt-in analytics allowlist and insights loop; React Email templates |
| `packs/` | Language rule packs (data, downloaded on demand) |
| `docs/agents/` | Agent brief, coordination rules, board, debates. Read `COORDINATION.md` before working |

## Commands
```bash
npm install            # once, at the repo root
npm test               # every workspace (~1,150 tests: core, mobile, api, analytics, content, emails, tokens, experiments); Node 22+
npm run experiment     # speech-model test on your recordings (Mac; see experiments/README.md)
npm run test:db        # database: access matrix, security, sync, governance, classification, ops, insights, performance (12 files)
npm run test:functions # Edge Functions and ops scripts (Deno via npx)
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
- Safety tiers stay on the device; there is no server table for them.
- Real family details never go in code, tests or fixtures. Tests use the fictional family "Asha".

## Agents
- How the harness works, end to end: `docs/agents/HARNESS.md`. The team (19 agents), engines, models and caps: `agents/roster.json`. Rules during a run: `docs/agents/OPERATING_MODEL.md`.
- Each agent's identity is `.claude/agents/<handle>.md` and its memory `agents/<handle>/MEMORY.md`. In an interactive session, ask for one by handle ("use the mobile agent").
- Agents run through `.github/workflows/agents.yml`, on open-weight models by default (ADR 0014, ADR 0015): they never merge, never push to `develop` or `main`, and label their PRs `agent:<handle>`.

## Saving work (every session, human or AI)
- A usage limit can stop any session at any moment, and anything not pushed exists only in that session's workspace.
- Commit and push work in progress at least every 30 minutes, and always before launching parallel agents: to your branch, or to `wip/<topic>` if it is not ready for a PR.

## Branches and commits
- `main` is always releasable. Work on short branches: `feat/<area>-<what>`, `fix/<what>`, `chore/<what>`, `exp/<what>` (experiments), `docs/<what>`.
- One concern per pull request. Database changes ship as a new migration file; never edit a migration that has been applied.
- Release tags: `ios-v<major>.<minor>.<patch>`.
