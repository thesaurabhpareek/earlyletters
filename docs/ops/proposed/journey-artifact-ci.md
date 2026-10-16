# Proposed: a CI job that builds the journey record and uploads it as a workflow artifact

Status: proposal, 15 Oct 2026. Written by the repo hygiene pass; `.github/` is owned by the CI owner, who decides whether and where to add this. Nothing here has been run in GitHub Actions.

## Why

`docs/release/journey` held 196 screenshots and a 9.4 MB PDF (44 MB in all) that every feature PR regenerated, so the repo grew by tens of megabytes per wave and PRs conflicted on binary files (PR #106 is one). From 15 Oct 2026 the screens and the PDF are gitignored; only `INDEX.md`, `steps/*.json` and `critiques/` are tracked. Reviewers still need the screens, so something has to build and publish them. A workflow artifact does that without a commit: it is attached to the run, downloadable for a set number of days, and gone afterwards.

## What exists already

- `npm run e2e:web:journey -w @scribe/mobile`: exports the app for web twice (plain and seeded), serves both, runs every `*.flow.ts` in Chromium and writes `steps/*.json` and `screens/*.png` (`JOURNEY_SHOTS=1`).
- `npm run e2e:web:index -w @scribe/mobile`: rebuilds `INDEX.md` from `steps/`.
- `apps/mobile/e2e-web/support/build-pdf.sh`: the PDF, from steps, screens and critiques (ImageMagick, python3 `markdown`, Chromium).
- `npm run e2e:web:pack -w @scribe/mobile`: `apps/mobile/e2e-web/support/pack-journey.sh` zips the whole folder into `apps/mobile/e2e-web/.results/journey-<sha>.zip`.
- `apps/mobile/e2e-web/playwright.config.ts` launches Chromium from `PLAYWRIGHT_CHROMIUM_PATH`, defaulting to `/opt/pw-browsers/chromium` (the agent container). In Actions, point it at the browser Playwright installs.

## The job

One job, `journey`, not part of `required`. Suggested triggers: `workflow_dispatch` (any branch), the nightly schedule (`nightly.yml`), and pull requests that carry a `journey` label. Running it on every PR is too slow for the 10 minute CI budget (two `expo export` builds plus 55 flows took about 6 to 8 minutes locally).

```yaml
  journey:
    name: journey record (web e2e, screens, PDF)
    if: github.event_name != 'pull_request' || contains(github.event.pull_request.labels.*.name, 'journey')
    runs-on: ubuntu-24.04
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@<sha> # v4, pinned per CI-06
        with:
          persist-credentials: false
      - uses: ./.github/actions/setup
      - name: Browser and PDF tools
        run: |
          npx playwright install --with-deps chromium
          sudo apt-get install -y --no-install-recommends imagemagick python3-markdown
          echo "PLAYWRIGHT_CHROMIUM_PATH=$(node -e "console.log(require('@playwright/test').chromium.executablePath())")" >> "$GITHUB_ENV"
      - name: Flows, steps and screenshots
        run: npm run e2e:web:journey -w @scribe/mobile
      - name: INDEX.md and the PDF
        run: |
          npm run e2e:web:index -w @scribe/mobile
          apps/mobile/e2e-web/support/build-pdf.sh
      - name: Tracked files must match what the flows wrote
        run: git diff --exit-code -- docs/release/journey/INDEX.md docs/release/journey/steps
      - name: Pack
        run: npm run e2e:web:pack -w @scribe/mobile
      - uses: actions/upload-artifact@<sha> # v4, pinned per CI-06
        if: always()
        with:
          name: journey-${{ github.sha }}
          path: |
            apps/mobile/e2e-web/.results/journey-*.zip
            apps/mobile/e2e-web/.results/report
          retention-days: 30
          if-no-files-found: error
```

Notes for the CI owner:

- `@playwright/test` is already a dependency of `@scribe/mobile` (it runs the flows) and ships the `playwright` CLI, so `npx playwright install` picks the matching browser build. `--with-deps` installs the system libraries Chromium needs on the runner.
- The `git diff --exit-code` step turns a stale `INDEX.md` or `steps/` into a red run rather than a silent drift: a PR that changes a screen must commit the regenerated steps and index (small text), nothing else.
- `if: always()` on the upload keeps the Playwright HTML report (`.results/report`) when a flow fails; `if-no-files-found: error` catches a packing failure.
- Retention: 30 days covers a review wave. The nightly run gives a fresh record every day; a release should download the run's zip and attach it to the release notes if the record is wanted for longer.
- Cost: the two web exports dominate. If the job is too slow, cache `apps/mobile/e2e-web/.web-dist*` keyed on the mobile source tree, and set `E2E_WEB_REBUILD=1` only when the key misses.
- The `*.pdf` gitignore rule is repo-wide. If a workflow ever needs to commit a PDF (none does today), it must `git add -f` it on purpose.

## Not proposed

- A bot that commits the screens back: that is what this change stops.
- Git LFS for the screens: adds a tool, a quota and a second place to lose files, for output a job can rebuild in minutes.
- A history rewrite to drop the old screens from `develop` and `main`: 44 MB in history is a founder decision (every clone and open branch would need to be refreshed), not a hygiene change.
