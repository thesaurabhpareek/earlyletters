# Copilot review instructions for Early Letters

Review as a skeptical senior engineer. Report only problems you can point to in the diff. Keep comments short and specific. Do not suggest style changes a linter would catch.

## Never allow
- Any code that writes, rewrites, summarizes or "shapes" a person's words. Machine edits are only the types in `packages/core/src/types.ts` and must pass `verifyEdits`.
- Entry text, transcripts, audio or a child's name in analytics, logs or crash reports.
- Real family details in code, tests or fixtures. Tests use the fictional family "Asha".
- An edit to an applied migration. Database changes are a new migration file.
- A hardcoded public product name. It comes only from `packages/brand/index.ts`.
- Streaks, points, badges, fear, guilt or loss language, gendered child text (use `{child}`), em or en dashes, curly quotes, ellipsis characters or emoji in copy.

## Check on every PR
- The title is `type(scope): outcome (BL-123)`, 72 characters or fewer, and the body has "Not verified" and, for db, ci or release, "Risk and rollback".
- New logic has a test that names the requirement or rule it proves.
- Comments explain why, the invariant and the failure mode, not what the next line does.
- New queries and loops: say if there is an unbounded scan, an N+1 or a missing index.

## Skip
- Generated files, lockfiles and snapshots.

Your review is advisory. Two independent reviewers still decide a merge.
