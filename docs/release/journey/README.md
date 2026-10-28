# The journey record

What the v1.0 app really renders, step by step, captured by the web end-to-end flows in `apps/mobile/e2e-web/*.flow.ts` (Chromium emulating an iPhone 17 Pro, the fictional family Asha only, never a real letter). `INDEX.md` is the map; `critiques/` holds the product, design and quality reviews of it, keyed by step id.

## What is tracked and what is generated

| Path | In git | Made by |
|---|---|---|
| `INDEX.md` | yes | `npm run e2e:web:index -w @scribe/mobile` (reads `steps/` only) |
| `steps/<id>.json` | yes | the flows: one small text file per recorded step (id, journey, kind, title, note, route, visible text) |
| `critiques/*.md`, `critiques/*.json` | yes | hand-written reviews |
| `screens/<id>.png`, `screens/<id>-full.png` | no (gitignored) | the flows, with `JOURNEY_SHOTS=1` |
| `Early-Letters-iOS-Journey.pdf` | no (gitignored) | `apps/mobile/e2e-web/support/build-pdf.sh` |

The screenshots and the PDF were 44 MB of generated output that feature PRs kept regenerating, so since 15 Oct 2026 they are not committed. They travel as one zip instead: `npm run e2e:web:pack -w @scribe/mobile` (`apps/mobile/e2e-web/support/pack-journey.sh`) packs this whole folder into `apps/mobile/e2e-web/.results/journey-<sha>.zip`, which a CI job can upload as a workflow artifact (`docs/ops/proposed/journey-artifact-ci.md`) or a reviewer can open locally. The `Screen` links in `INDEX.md` resolve inside that zip or after a local run, not on GitHub.

The screens committed before 15 Oct 2026 stay in git history. Rewriting history to drop them is a founder decision and was not done.

## Regenerate safely

**Only the journey-record pull request commits `steps/` and `INDEX.md`** (experience pass package P7, item P7-6). A feature PR never does, even when its flow changed: the record is one run of every flow on one commit, and a partial run corrupts it in two ways.

- A run without `JOURNEY_SHOTS=1` rewrites that flow's step files without `shot` and `full`. An `INDEX.md` built from them has no Screen links. That is how 144 links were lost in the run committed on 13 Oct 2026.
- A branch runs only its own flows, so every other journey's steps stay as they were and `INDEX.md` is rebuilt from that stale text. The recorder also never deletes a step file, so a step a flow no longer writes (a renumbered id, a removed screen) stays in `steps/` for ever.

If you ran a flow locally on a feature branch, throw the step files away before you commit: `git restore --source=HEAD --staged --worktree docs/release/journey/steps docs/release/journey/INDEX.md && git clean -fd docs/release/journey/steps`.

The generator now enforces the first rule. `build-index.mjs` exits 1, names the steps and writes nothing when any step it reads has no `shot`. `--text-only` writes anyway, under a "do not commit" banner, for reading the text of a local run. The second rule is the procedure below.

### The procedure (the journey-record PR only)

Start on a new branch from the head of `develop` after every screen PR has merged, with `npm ci` done at the repo root.

```bash
git rm -q docs/release/journey/steps/*.json                      # the recorder never deletes: stale ids would survive
rm -rf apps/mobile/e2e-web/.web-dist apps/mobile/e2e-web/.web-dist-seed apps/mobile/e2e-web/.results docs/release/journey/screens
E2E_WEB_REBUILD=1 npm run e2e:web:journey -w @scribe/mobile -- --workers=2
npm run e2e:web:index -w @scribe/mobile                          # refuses if any step has no shot
grep -c 'A-REQ-030' docs/release/journey/INDEX.md                # expect 0
npm run e2e:web:pack -w @scribe/mobile                           # the zip for reviewers (not committed)
git add docs/release/journey/INDEX.md docs/release/journey/steps # never screens/ or the PDF
```

- **`JOURNEY_SHOTS=1`** is already in the `e2e:web:journey` script. It is the only reason a step gets `shot`. `npm run e2e:web` does not set it: use it to check a flow, never to make the record.
- **A fresh web export** (`E2E_WEB_REBUILD=1`). The flows run against three exports (`apps/mobile/e2e-web/support/global-setup.ts`): server features off, server features off with the seeded family Asha, and server features on against the mock server. Each is built only when it is missing, so without `E2E_WEB_REBUILD=1` an export left over from another branch is reused without a word.
- **Every flow must pass.** A failing test leaves a partial journey. Fix or report the file, then run it alone with shots (`npm run e2e:web:journey -w @scribe/mobile -- j01-first-run.flow.ts`; the existing exports are reused, so leave `E2E_WEB_REBUILD` off) before you build the index.
- **Two workers.** Three workers with shots on have pushed a long flow past its 90 s limit; it passes alone.
- **Before you push**: the step count equals the number of files in `steps/`, every file has `shot`, and the ids the design spec cites (`docs/design/EXPERIENCE_PASS_2026-10.md`) still point at the screens it means. Step ids are positional: a flow that adds a step renumbers every later one.

The PDF (`apps/mobile/e2e-web/support/build-pdf.sh`) is optional and is never committed.
