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

## Regenerate

```bash
npm run e2e:web:journey -w @scribe/mobile     # every flow, with screenshots (JOURNEY_SHOTS=1)
npm run e2e:web:index -w @scribe/mobile       # INDEX.md from steps/
apps/mobile/e2e-web/support/build-pdf.sh      # the PDF (ImageMagick, python3 markdown, Chromium)
npm run e2e:web:pack -w @scribe/mobile        # one zip of the record, screens and PDF
```

Commit `INDEX.md` and `steps/` when a flow or a screen changes. Never commit the screens or the PDF.
