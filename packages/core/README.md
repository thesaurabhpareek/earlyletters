# @scribe/core

The faithful-edit engine: it cleans a transcript with typed edits, checks every edit, and picks prompts. Pure TypeScript.

The rule: the machine may remove and repair. It may never add meaning.

## What is in it

| Path | What |
|---|---|
| `src/types.ts` | `EditType`, the only edits the engine may make |
| `src/verify.ts` | `verifyEdits`. Every machine edit goes through it |
| `src/pipeline.ts`, `src/rules.ts`, `src/text.ts` | The edit pipeline and its rules |
| `src/model-edits.ts`, `src/edit-provider.ts` | Edits proposed by a model, then checked by the verifier |
| `src/lang/` | Language rule engine. It reads the text-rules packs in `packs/text-rules/` |
| `src/prompts.ts`, `src/age.ts` | Prompt selection and age math |
| `src/safety.ts` | Safety tiers |
| `src/family-rules.ts`, `src/invite.ts`, `src/child.ts` | Family and child rules |
| `test/` | Unit tests, fuzz tests, regression harness |

## Commands

```bash
npm test -w @scribe/core
npm run typecheck -w @scribe/core
npm run differential -w @scribe/core     # runs test/engine.differential.ts
npm run test:coverage -w @scribe/core
```

## Rules

`CLAUDE.md` (the constitution). Edit-pass strategy: `docs/adr/0003-edit-pass-model-strategy.md`. Languages as data: `docs/adr/0014-languages-and-phonetics.md`.

## Do not

- Do not import React Native or Expo here. This stays pure TypeScript.
- Do not bypass `verifyEdits`. There are no bypass flags.
- Do not add an edit type that writes, rewrites, summarizes or "shapes" a person's words.
- Do not change `raw_transcript` handling. It is immutable.
- Do not put real family details in tests. Use the fictional family "Asha".
