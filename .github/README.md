# .github

CI, review rules and branch protection for `thesaurabhpareek/earlyletters`.

| File | What it does |
|---|---|
| `workflows/ci.yml` | On every pull request and every push to `develop` and `main`: install (cached by `package-lock.json`), then in parallel: content rules plus `npm test`, `npm run test:db`, and typecheck for every workspace (`apps/mobile` with `npx tsc --noEmit`). A `required` job sums them up. Every job has a timeout; the longest path is 9 minutes. |
| `workflows/migration-guard.yml` | Fails a change that edits, renames or deletes a migration listed in `migrations-applied.txt`, removes a line from that list, or adds a migration that sorts before the newest applied one. |
| `workflows/agents.yml` | The agent team (ADR 0014, ADR 0015). Every 30 minutes `scripts/agents/dispatch.mjs` assigns work; up to six agents run, by default OpenCode on open-weight models through OpenRouter acting as the agents GitHub App, optionally Claude Code, and open PRs into `develop`. Needs `OPENROUTER_API_KEY`, `AGENTS_APP_CLIENT_ID` and `AGENTS_APP_PRIVATE_KEY`; pause with the variable `AGENTS_PAUSED=true`. Everything else: `docs/agents/HARNESS.md`. |
| `workflows/claude.yml` | `@claude` in an issue or PR comment, for the repository owner only (`ANTHROPIC_API_KEY` or the owner's `CLAUDE_CODE_OAUTH_TOKEN`). |
| `workflows/agents-check.yml` | Roster, charters and memory files consistent; dispatcher tests. |
| `migrations-applied.txt` | The migrations applied to the live database. Add a line in the same PR that records applying one (see `supabase/APPLY.md`). |
| `scripts/migration-guard.mjs` | The guard itself. Run it locally with `node .github/scripts/migration-guard.mjs origin/develop`. |
| `actions/setup` | Node 22 plus the cached `node_modules`, or `npm ci` on a cache miss. |
| `CODEOWNERS` | Review routing. One placeholder owner today; comments name the reviewer each area needs later. |
| `pull_request_template.md` | The checklist from `CLAUDE.md`. |

The verifier fuzz test runs with a fixed seed in CI (`SCRIBE_FUZZ_SEED`). To replay a failure, run
`SCRIBE_FUZZ_SEED=<seed> SCRIBE_FUZZ_RUNS=<n> npm test -w @scribe/core` with the values the failure printed.

## Branch protection (to apply once the workflows are on GitHub)

The check names below only appear in the settings after each workflow has run once. Open a pull request that adds this folder, let it run, then apply the rules.

Apply to both `main` and `develop`:

1. Require a pull request before merging.
2. Require status checks to pass, and require branches to be up to date before merging. Required checks:
   - `required` (from the CI workflow)
   - `applied migrations unchanged` (from the Migration guard workflow)
3. Require conversation resolution before merging.
4. Require linear history.
5. Block force pushes and branch deletion.
6. Approvals: 1 required. Agent PRs are authored by the Claude GitHub App, so the founder can approve them; agents cannot merge without that approval. The founder's own PRs can still be merged as an administrator because "Do not allow bypassing" is off (item 7). Leave "Require review from Code Owners" off while one person owns every area.
7. Leave "Do not allow bypassing the above settings" off for now, so the owner can recover from a broken CI. Turn it on before the first external contributor.

The same settings through the API (run once per branch, replacing `BRANCH`):

```bash
gh api -X PUT repos/thesaurabhpareek/earlyletters/branches/BRANCH/protection --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "checks": [{ "context": "required" }, { "context": "applied migrations unchanged" }]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "require_code_owner_reviews": false,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "required_linear_history": true,
  "required_conversation_resolution": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

Check it took: `gh api repos/thesaurabhpareek/earlyletters/branches/BRANCH/protection --jq '.required_status_checks.checks'`.

## Keeping CI under 10 minutes

- Timings on 3 Oct 2026 (2-core container): `npm test` about 12 s, `npm run test:db` about 41 s, typecheck about 20 s. `npm ci` cold is 1 to 1.5 minutes; with the `node_modules` cache, seconds.
- If a job nears its timeout, split it rather than raising the timeout. The `db` job can shard by file (`npm run test:db -- perf` alone).
- Nightly and release workflows (Maestro, random-seed fuzz, integration stack) are separate and not required for merging (TDD 07 section 10).
