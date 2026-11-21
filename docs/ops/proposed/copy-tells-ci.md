# Proposal: run the copy-tells lint and the content map in CI

Status: proposal, text only. Nothing here edits `.github/**` or the root `package.json`; both are founder/ops-listed (CR-73).
Pairs with #1244 (copy tells lint) and #1245 (content map generator). Neither is merged yet, so everything below describes
those branches as they stand on 21 Nov 2026.

## What the PRs contain

- #1244, head `chore/copy-tells-lint-clean`, base `docs/content-guide` (not develop). Files: `scripts/content/copy-tells.mjs`,
  `scripts/content/copy-tells.test.mjs`, `packages/content/copy-tells-baseline.txt`. The script is not under `packages/content/scripts`.
  It scans `packages/content/src` and the `copy.ts` files under `apps/mobile/src`, with ten rules (uncontracted, softener, oops-voice, and so on).
- #1245, head `chore/content-map-generator`, base `develop`. Files: `scripts/content/export-content-map.mjs` (+ test), `docs/content/map/README.md`.
  It writes `content-map.json` and `.csv`; `--check` fails if the committed map is stale.

## How the lint behaves

`node scripts/content/copy-tells.mjs --check` exits 1 when any (file, rule) count is higher than `packages/content/copy-tells-baseline.txt`, or a
pair is new. The baseline is shrink-only: `--update-baseline` refuses to write a higher number, and `--check` also compares the baseline file
itself with the one committed at `HEAD` and at `COPY_TELLS_BASE_REF`, failing if any entry or the total went up. That second check stops a PR from
raising the baseline by hand. Without `COPY_TELLS_BASE_REF` only the `HEAD` comparison runs, which in CI is the PR's own merge commit, so it
proves nothing. The variable is what makes the shrink-only rule real.

## Proposed workflow step (text only)

In `.github/workflows/ci.yml`, job `unit`, after "Content rules (VOICE.md, BRAND.md)". The checkout must contain the base commit, so that job's
`actions/checkout@v4` needs `fetch-depth: 0` (or an explicit fetch of the base, as below).

```yaml
      - name: Copy tells (shrink-only baseline)
        env:
          # The PR's base branch; on push to develop/main, the previous commit.
          COPY_TELLS_BASE_REF: ${{ github.event_name == 'pull_request' && format('origin/{0}', github.base_ref) || 'HEAD^' }}
        run: |
          if [ "${{ github.event_name }}" = "pull_request" ]; then
            git fetch --no-tags --depth=1 origin "${{ github.base_ref }}"
          fi
          npm run lint:copy
```

Notes:
- `COPY_TELLS_BASE_REF` points at the PR's base (`origin/develop` for most PRs, `origin/docs/content-guide` for #1244 itself). On a push
  event `HEAD^` needs `fetch-depth: 2`; if that is not wanted, drop the env on push and let the `HEAD` check stand.
- If `git show <ref>:packages/content/copy-tells-baseline.txt` fails (no file at the base, as for #1244's first merge), the script treats the base as
  absent and skips that comparison. No special case is needed for the first PR.
- Runtime: one TypeScript parse of the content files, not measured here, expected to fit the `unit` job's 5 minute budget.
- Not `continue-on-error`. A red step means a line got worse; the fix is to fix the line, never to raise the baseline (CLAUDE.md content rules).
- Lock the gain: when the count falls, `--check` prints "Under baseline". The author runs `npm run lint:copy -- --update-baseline` and commits the lower file.

Optional second step for #1245, once it is merged:

```yaml
      - name: Content map is current
        run: npm run content:map -- --check
```

## Proposed root `package.json` lines (text only)

Add to `scripts`:

```json
    "lint:copy": "node scripts/content/copy-tells.mjs --check",
    "content:map": "node scripts/content/export-content-map.mjs",
```

CLAUDE.md already names `npm run lint:copy`, so this makes the document true. Tests: add `scripts/content/copy-tells.test.mjs` and
`scripts/content/export-content-map.test.mjs` to the root `test` script's `node --test` list (that list is explicit, not a glob).

## Order of work

1. #1244 merges into `docs/content-guide`, then that branch into `develop` (or #1244 is retargeted).
2. Founder/ops applies the workflow step and the two script lines in one PR.
3. Content map step only after #1245 merges and a first `content:map` regeneration is committed.

## Rollback

Delete the "Copy tells" step (and the `lint:copy` line); the script and baseline are inert files and can stay. No data, migration or release is touched.
