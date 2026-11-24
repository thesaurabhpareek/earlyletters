# stack-status: a read-only table of stacked pull requests (HARNESS-GAPS H3; BRIEF HG-H3)

Status: proposal, 21 Nov 2026. `scripts/agents/**` is the founder's path and `scripts/ops/` is run by CI's Deno job, so the script waits here until he moves it. Nothing runs it today.

## What it prints

One row per open PR whose base is not `develop`: PR, base ref, base PR, base state (`open`, `merged`, `closed`, `no PR`, `long-lived`, `unknown`), `mergeable_state`, `ahead_by`, `behind_by` and one next step (`waits for #N`, `retarget to develop, then rebuild`, or an ask to Karma). A last line counts stacks and names the oldest unmerged base. `--json` prints the same rows. A PR into `main` or `release/*` shows `long-lived` and is not counted as a stack. Anything it cannot read prints `unknown`.

`ahead_by` and `behind_by` come from `GET repos/<repo>/compare/<base>...<head>`. One real response was read on 21 Nov 2026 (`{"ahead_by":32,"behind_by":219,"status":"diverged"}` for `develop...feat/mobile-photo-3-store`) and is the shape the test fixture uses, so the fields are no longer assumed.

## Safety

GET only. The wrapper builds the `gh api` arguments itself (`-X GET` first) and refuses `-f`, `-F`, `--field`, `--raw-field`, `--input` and any other method before it spawns anything; a test feeds each one. No token, header or stderr is read or printed. Output is public repo data.

## What the founder does

1. Move it: `git mv docs/ops/proposed/stack-status/stack-status.mjs scripts/agents/stack-status.mjs` and the same for `stack-status.test.mjs` (the test imports `./stack-status.mjs`, so the pair moves together). Two reviews (security-architect and ai-eng-lead read `scripts/agents/**`).
2. Use it: `node scripts/agents/stack-status.mjs` (needs `gh` logged in; one list call, then three GETs per stacked PR).

## How to verify

`node --test docs/ops/proposed/stack-status/stack-status.test.mjs` (7 tests, from the 20 Nov photo stack #835 to #840 and the BL-952 pair). Mutant: make `assertReadOnly` stop refusing field flags and the wrapper test goes red. A live run on 21 Nov printed 9 stacks and 13 stacked PRs, with #836 to #840 each waiting on the one below.

## The way back

Delete the file. Nothing depends on it. If the founder wants it inside `merge-queue.mjs` (`--stacks`), HG-MQ owns that and this file is the starting point.
