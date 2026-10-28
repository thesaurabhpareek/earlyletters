# Task: find the stale count

`CLAUDE.md` in the working directory is the rulebook every human and AI contributor reads first. Some of its numbers describe the repository (how many files, how many agents, how many prompts). At least one of them is out of date.

Audit every countable claim in `CLAUDE.md` against the tree and fix each one that is wrong. The tree in the working directory is the source of truth for:

- the database test files that `npm run test:db` runs (`supabase/tests/run.mjs` runs every `*.test.mjs` in that folder),
- the agents on the roster (`agents/roster.json`),
- the prompts in the content package (`packages/content/src/prompts.ts`, one entry per `key:`).

Rules:
- Change only `CLAUDE.md`. Never add, remove or rename a test file, an agent or a prompt to make the prose true.
- Fix the number; keep the claim and its wording. Do not delete a claim because it is awkward to count.
- Leave alone any figure you cannot check from this tree (for example the Expo SDK version), and any figure marked approximate with `~`.
- Do not add new claims.
- Content rules for anything you write: no em dashes, en dashes, curly quotes, ellipsis characters or emoji.
