# Proposal: a PR-size check, 400 lines and 20 files (CODE-R02, CODE-G1; BRIEF CI-PRSIZE)

Status: proposal, 21 Nov 2026. This pull request adds the script and its tests and wires the tests into root `npm test`. The job is a workflow edit and stays a proposal.

## What is measured

`git diff --numstat -M <base>...HEAD`: added plus deleted lines, and files. Binary files count 0. Docs text counts; only images under `docs/` are excluded. Excluded by exact rule, and printed: `package-lock.json`, any `__fixtures__` folder, the golden corpora listed in `GOLDEN_DIRS`, any `generated` folder. Apart from the lockfile, excluded lines are capped at 2,000; above that they count again. Run on the real branches (21 Nov): #835 prints `lines 783 / 400, files 15 / 20` and fails; #840 against its own base prints `lines 342 / 400, files 12 / 20` and passes.

## The proof of an exception (CODE-R02: only the founder accepts one)

Pass over the limit needs both: the label `size:accepted`, whose newest `labeled` event on the pull request was made by the repository owner (read from `repos/<repo>/issues/<n>/events`; an agent's label is ignored and printed), and a body line `Size exception: <reason>`. A body line alone is forgeable, so it never passes alone. Question `CI-3` on the pull request: under CR-73 Karma applies labels; if that is a different login from the owner, the owner check must name it. Default built: the repository owner login only.

## What the founder (or Karma, per CR-73) pastes

1. `cp docs/ops/proposed/workflows/pr-size.yml .github/workflows/pr-size.yml`, two reviews (security-architect reads `.github/**`).
2. Leave it advisory. Make `pr size` required only when the founder decides.
3. `.github/pull_request_template.md` is not edited here (a founder-owned path): a line `Size exception: <reason>` can be added by him later.

## How to verify

- `node --test scripts/guards/pr-size.test.mjs` (14 tests; also in root `npm test`). Mutant: set `MAX_LINES` to 401 and the 401-line test and three more go red.
- After the paste: the job prints the two numbers on every pull request; a throwaway PR over 400 lines is red; adding the owner's label and the body line turns it green (only a person can prove the label path on GitHub).

## The way back

Delete `.github/workflows/pr-size.yml`. The script and tests are inert without it.
