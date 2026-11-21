# Proposal: turn on the privacy label guard (NS-07-G11-5, BL-975; BRIEF BL-975-ACT)

Status: proposal, 20 Nov 2026. The scripts and tests merged earlier (#897, #898, #906). Only the copy below is left, and it is the founder's: agents cannot edit `.github/workflows/` (`docs/agents/OPERATING_MODEL.md:95`). This pull request adds a test of the job file and the notes below; it changes no workflow.

## Do not copy yet: the dry run is red on every pull request

I ran the guard (`scripts/release/label-effect.mjs`) over the 12 newest merged pull requests into `develop`, each with its own base (the commit before the merge), head (the merge) and body:

```
for n in <12 newest merged>; do sha=$(gh api repos/thesaurabhpareek/earlyletters/pulls/$n --jq .merge_commit_sha)
  gh api repos/thesaurabhpareek/earlyletters/pulls/$n --jq '.body // ""' > body.txt
  node scripts/release/label-effect.mjs --base "$sha^" --head "$sha" --body-file body.txt; done
```

| PR | Would have been | Why |
|---|---|---|
| #1048, #1050, #1049, #1045, #1046, #1055, #1062, #1047, #1033, #1054, #1051, #1042 (all 12) | red | G11-2 at the head: 7 cards have no `**Label effect.**` line |

The 7 cards: NS-46 to NS-50 in `docs/product/prd/21-days-cultural-photos-home.md` (lines 187, 419, 626, 818, 1025) and NS-51, NS-52 in `docs/product/prd/27-photo-moments-and-media.md` (lines 70, 273). G11-2 reads the whole tree, not the diff, so no author could clear it. None of the 12 would have been red for G11-1a or G11-3 (no SDK, entitlement, usage string or content-carrying call). The fix is the card owner's (product): one `**Label effect.**` line per card. Question raised on the pull request as `CI-2`.

## The exact change, when the cards are fixed

1. One command: `cp docs/ops/proposed/workflows/label-guard.yml .github/workflows/label-guard.yml`, commit, two reviews (security-architect reads `.github/**`).
2. One decision: leave `label guard` advisory (recommended: two weeks green, as #806 does for its scan), then add it to the required checks on `develop`. Never required on day one.
3. Nothing else: `apps/mobile/test/label-guard-workflow.test.ts` finds the copied file by itself.

## How to verify

- Before the copy: `npx vitest run test/label-guard-workflow.test.ts` in `apps/mobile` is green (the job runs the base copy of the guard, on `opened`, `synchronize`, `reopened` and `edited`, with `contents: read` only, the body through `PR_BODY`, every action pinned, no way to pass on a guard error). Each rule has a mutant in the test.
- After the copy: the job `label guard` appears on the next pull request. A throwaway PR that adds an SDK to `apps/mobile/package.json` with no decision id makes it red (only a person can prove this, on GitHub).

## The way back

Delete `.github/workflows/label-guard.yml`. If it was made required, remove it from the required checks first.

## Not done here

The optional `Native-size:` rule (follow-up (b), Rec, not decided) is not built: it touches `scripts/release/label-effect.mjs` and waits for CI-SIZEGATE.
