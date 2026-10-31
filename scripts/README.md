# scripts

Repo-level tools: publishing packs, ops runbook scripts, release checks, guards and reports. Each script has its usage in the header comment. Read it before running.

## What is in it

| Path | What |
|---|---|
| `packs/` | Build, sign, upload and verify packs and public documents (`publish.ts`) |
| `ops/` | Staging smoke check, restore drill, deletion verification, affected-user enumeration |
| `release/` | Release doctor, GitHub settings as code, branch cleanup |
| `agents/` | The agent harness (dispatcher, checks, ledger). Owned by the founder |
| `status/` | Founder status note from the GitHub API (read only). Has its own README |
| `founder/` | Read-only check of founder steps a machine can see |
| `size/` | Measures the app against the 40 MB download budget |
| `coverage/` | Runs every workspace's coverage config and merges the table |
| `guards/`, `qa/` | Docs-leak guard, skip-count guard |
| `brand/`, `licences/`, `insights/` | Store listing, licence notices, weekly insights report |
| `trace.mjs` | Requirement traceability check. Writes `docs/TRACE.md` |

## Commands

```bash
npm test                      # includes node --test scripts/trace.test.mjs and trace.mjs --no-write
npm run test:coverage         # scripts/coverage/run.mjs
npm run test:functions        # includes scripts/ops tests (Deno via npx)
npm test -w @scribe/api       # includes the scripts/packs and scripts/size tests
node --test scripts/status/page.test.mjs
```

## Rules

Packs: `../docs/adr/0016-lean-app-and-server-driven-content.md`. Release: `../docs/adr/0026-release-automation-pipeline.md`. Hosting runbook: `../docs/ops/PACKS_HOSTING.md`.

## Do not

- Do not commit keys, tokens or passwords. The packs signing key stays outside the repo.
- Do not run `ops/` scripts against production without reading the header and its runbook.
- Do not put entry text, transcripts, audio or child names in any output or log.
- Do not edit `agents/` without the founder. It is owned by `@thesaurabhpareek` in `.github/CODEOWNERS`.
