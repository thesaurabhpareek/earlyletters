# Engine regression corpus (RB-20)

The faithful-edit engine may remove and repair, never add meaning. This corpus checks that on every `npm test`, and tells a reviewer exactly which items changed when the engine does.

## What exists, and what this adds

| Layer | Where | What it proves |
|---|---|---|
| Golden corpus | `packages/core/test/golden*` | The engine's output for about 65 Asha cases is pinned per ENGINE_VERSION (`engine-v5..v8.json`). It records what the engine did. |
| Verifier fuzz | `verify.fuzz.test.ts`, `verify.r01.fuzz.test.ts` | Seeded hostile-model edits never produce a word that was not said, nor lose a negation, number or kinship word. |
| Per-language R-01 | `test/regression/{en,es,fr,pt,ar,hi,zh}.test.ts` | Each launch language refuses the known meaning changes. |
| Single-edit differential | `engine.differential.ts` | Edits one engine accepts and another refuses. A report, not a gate. |
| Experiments | `experiments/` | Speech models on real recordings, on a Mac. Not run in CI. |
| **This corpus** | `test/regression/engine-*.ts` | What the engine MUST do, written from the constitution, one item per EditType and per known way to change meaning. |

The golden files pin behaviour but are re-recordable; the hand-written expectation on each corpus item is not copied from engine output, so a regression cannot be hidden by re-recording.

## What it checks

1. Each of 41 items against its hand-written expectation (final text, accepted edits as `type:source`, refused edits as `type:reason`).
2. For every item: no applied edit outside the seven EditTypes; no word in the final text that was not said (only a dictionary term via `stt_fix`, or an `agreement` replacement, may be new); no negation or number added or lost; a correctly spelled dictionary name stays; every applied edit's offsets match the raw text.
3. The whole output against `snapshots/engine-v<ENGINE_VERSION>.json`. If output changes and ENGINE_VERSION does not, the test fails. It also fails if `pipeline.ts` has no `// <N> (YYYY-MM-DD):` comment for the current version, or if there is no snapshot for it.
4. The EditType list in the test equals the one in `src/types.ts`, so a new type forces a human to add an item.

Adversarial groups: `neg-` (negation flips), `num-` (number changes), `add-` (added content, types outside the allowlist, stale offsets), `fix-` (plural, tense, pronoun, question to statement), `name-` (child, nickname and stranger names mangled). Every model edit in these must be refused and the text must stay as said.

## Changing the engine

1. Edit `src`, bump `ENGINE_VERSION`, add the dated comment in `pipeline.ts`.
2. Run the drift report and put it in the PR:
   `npx tsx packages/core/test/regression/drift-report.ts --from <old> --to current`
3. Record: `SCRIBE_REGRESSION_RECORD=1 npx vitest run test/regression/engine-regression.test.ts` (run from `packages/core`). It refuses to overwrite an existing version's file. Do the same for `test/golden.test.ts` (`SCRIBE_GOLDEN_RECORD=1`).
4. If an item's hand-written `expect` is now wrong, that is a constitution question: a founder-code-owner decision, not a test edit.

Compare another copy of the engine (for example a branch exported to a folder): `SCRIBE_ENGINE_SRC=/abs/path/to/src`, for the test and for the drift report.

## What the corpus cannot prove

- It is text only. It says nothing about how well speech recognition hears a real voice, accent, noise or a toddler. Audio quality is measured separately in `experiments/` on real recordings, which never enter the repo.
- 41 hand-picked items are a floor. They catch a regression in the cases we thought of. Unknown cases are the job of the fuzz tests and of review.
- The model edits are written by us. A real model may propose edits we did not imagine; the verifier and fuzz tests carry that.
- English rules and dictionary only. The other launch languages are covered by their own R-01 files and golden cases.
- Whether a repair is wanted (for example `false_start` at the start of a sentence leaves `she` lowercase, item `type-false-start`) is a product question; the corpus only pins that no meaning was added.
