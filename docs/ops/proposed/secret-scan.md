# Proposal: a secret scan step in `unit` (SEC-R02, SEC-R03, CR-71 A5; BRIEF CI-SECRET)

Status: proposal, 20 Nov 2026. Nothing under `.github/` is changed here. Apply after `docs/ops/proposed/ci-pins.md` (pins first, then scanning, CR-71 A5), so the new step's checkout is already a sha.

## The exact change

1. This pull request extends `scripts/packs/secret-scan.mjs` to twelve rules and adds `apps/mobile/test/secret-scan.test.ts`, which runs in `unit` through `npm test`. So the scan runs on every pull request without any workflow edit; the step below only makes it a named, separate line in the run page.
2. Paste `docs/ops/proposed/workflows/secret-scan-step.yml` into `ci.yml`, job `unit`, after the last step. No new action, no permission.

Option A (this) against Option B (a third-party scanner such as gitleaks):

| | A: own scanner | B: third-party scanner |
|---|---|---|
| New dependency | none | a new action or binary, approved by the founder (AIE-R21), pinned by sha |
| History | not scanned | scanned |
| Formats | the twelve named rules | hundreds, maintained by others |
| Value in output | never | only if configured to redact; a mistake leaks the match into a public log |
| Cost | 10 seconds | one more supply-chain trust |

The agent writes A and does not pick B. GitHub secret scanning with push protection covers history and many formats and is a repository setting (founder).

## Recorded default (BL-2124, 24 Nov 2026): Option A, pending the exec-team read

Option A is the default: the own scanner (`scripts/packs/secret-scan.mjs`, tested by `apps/mobile/test/secret-scan.test.ts`, which runs in `npm test` and so in `unit`) is the secret scan, and gitleaks is not added. This is a default pending the exec-team read (CTO and CISO), not a ruling. It holds unless that read picks Option B. What A leaves open is history: a secret committed and removed before the scanner ran is not found; GitHub secret scanning with push protection (a repository setting) covers that.

## How to verify

- `node scripts/packs/secret-scan.mjs` prints `no known secret in tracked files` on a clean tree.
- Planted key: in a scratch branch add a line `SUPABASE_SERVICE_ROLE_KEY=` followed by 40 random letters to a tracked file and push; the step and the test fail with `SECRET <file>:<line>: service role key value` and the value appears nowhere in the log.
- Mutant: delete the `private key block` rule; `[SEC-R03] a private key block is found` goes red.

## The way back

Delete the step. The scanner and its test stay; to drop the test too, revert this pull request.
