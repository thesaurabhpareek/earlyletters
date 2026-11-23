# Proposal: merge-queue NEEDS-UPDATE for docs-only PRs by file overlap, not by workspace

Status: proposal, 21 Nov 2026. This pull request is docs only. It does not edit `scripts/agents/merge-queue.mjs`, any workflow or `agents/roster.json`. The code change below is a sketch for a separate pull request, once Karma agrees.

## Problem

The rule added in #1356 (merged 21 Nov 2026 19:41 UTC) marks an otherwise ready PR NEEDS-UPDATE when the base commits since its merge-base touch a workspace the PR touches. `workspaceOf` maps `docs/<x>/...` to `docs/<x>` and a file directly in `docs/` to `docs`. So two PRs that edit different files in `docs/engineering/`, or `docs/BACKLOG.md` and `docs/DECISIONS.md`, count as overlapping. A new commit voids both reviews (the note text says so), so each update restarts review and CI, and meanwhile develop moves again.

## What I measured (GitHub REST, 21 Nov 2026)

- Develop took 281 commits dated 21 Nov in my first count (00:01 to 22:19 UTC, `GET /commits?sha=develop&since=...`); a recount later gave 283 and the reviewer got 282, so the day total depends on when you count, and the median and p90 are from the 281. Gap between consecutive commits: median 1.5 min, p90 11.0 min. Matches the figures in the brief. At a 1.5 minute median gap, a 4 to 5 minute CI plus review cycle almost always sees a newer base commit before it finishes.
- `unit` ("tests and content rules") duration: 182 to 308 s on success in the newest runs I could read (below).
- #1302 (merged 15:58 UTC, commit 8d0be6819) did raise `unit` from `timeout-minutes: 5` to 10; `.github/workflows/ci.yml` on develop now shows 10 on that job (line 95).

## What I could not reproduce

- "21 docs-only open PRs, 15 would be NEEDS-UPDATE". Recount at about 23:00 UTC: 192 PRs open, 184 into develop. For each I listed its files (`GET /pulls/N/files`, filename and previous_filename) and counted a PR as docs-only when every path starts with `docs/`: 78 docs-only, 46 not draft and 32 draft. The reviewer got 190 open, 80 docs-only, 46 not draft, which agrees on the 46. My first count in this thread (122 docs-only, 66 not draft) was wrong and is withdrawn; I did not find the cause. I did not reproduce 21, so that count used a narrower filter (reviews at head, green) or another moment. I did not recompute the 15. Treat 15 of 21 as the brief's figure, an upper bound with no ready-state filter, not as something I verified.
- "CI queue bursts of 10 to 15 minutes". The jobs API gave no queue time I could use (`created_at` is null on cancelled jobs). Not verified.
- Whether the 5-minute cancels stopped after #1302. The newest 100 `ci.yml` runs only reach back to 22:16 UTC, a 15 minute window: 17 `unit` jobs, 9 success (182 to 308 s) and 8 cancelled. Cancelled durations were 0 or unstarted for most, then 159 s, 231 s and 360 s. None is near 600 s, so none looks like the new timeout, and 360 s is past the old 300 s limit, so it was not the old timeout either. That is concurrency cancels of superseded runs. Fifteen minutes is thin evidence; a wider window is unchecked.

## Proposal

For a PR whose files are all under `docs/` (counting `previous_filename` of renames), NEEDS-UPDATE only when a base commit since the merge-base changed one of the same files (file level, including base renames). Any PR with a file outside `docs/` keeps the workspace rule unchanged. A mixed PR is a code PR for this purpose.

### Code change sketch (`scripts/agents/merge-queue.mjs`)

Keep `workspaceOf` and `workspacesOf` as they are. Add a helper and branch in `staleBase`:

```js
const pathsOf = (files) => files.flatMap((f) => [f?.filename ?? f, f?.previous_filename]).filter((n) => typeof n === "string");
/** Pure: true when every path (renames count both sides) is under docs/. An empty list is not docs-only. */
export const isDocsOnly = (files) => { const p = pathsOf(files); return p.length > 0 && p.every((n) => n.startsWith("docs/")); };

export function staleBase({ behindBy, prFiles, baseFiles }) {
  if (behindBy <= 0) return { behindBy, shared: [] };
  if (isDocsOnly(prFiles)) {
    const mine = new Set(pathsOf(prFiles));
    return { behindBy, shared: [...new Set(pathsOf(baseFiles).filter((n) => mine.has(n)))].sort() };
  }
  const mine = new Set(workspacesOf(prFiles));
  return { behindBy, shared: workspacesOf(baseFiles).filter((w) => mine.has(w)).sort() };
}
```

`shared` then holds file paths for docs-only PRs and workspace names otherwise. `verdictFor` (`row.staleBase?.shared.length`) and the two notes (lines 417 to 419) keep their wording, so the verbatim assertion at `merge-queue.test.mjs:539` is unaffected. Add `isDocsOnly` to the test import on line 5 of `merge-queue.test.mjs`. Update the header comment for "Stale base" to say so. Optional: the NEEDS-UPDATE note prints every entry of `shared`, and file paths are longer than workspace names, so cap it (for example `.slice(0, 5)` plus a count) and add one test for the cap. The base file list cap (`COMPARE_FILE_CAP`, 300, NEEDS-REVIEW when hit) stays, so a cut-off list still cannot read as "no overlap".

### Test cases to add (`scripts/agents/merge-queue.test.mjs`)

Using the existing `verdict({ ...stalePr, behindBy, baseFiles, files })` helper and the pure functions:

1. Docs-only PR `docs/engineering/a.md`, base changed `docs/engineering/b.md`: READY (was NEEDS-UPDATE). Leave the note wording unchanged ("none in a workspace this PR touches") so the verbatim assertion at `merge-queue.test.mjs:539` keeps passing; a docs-only PR's note then reads slightly loosely, which is acceptable. Changing the wording would mean updating that assertion in the same PR.
2. Docs-only PR `docs/BACKLOG.md`, base changed `docs/BACKLOG.md`: NEEDS-UPDATE, shared `["docs/BACKLOG.md"]`.
3. Docs-only PR with a rename `docs/old.md` to `docs/new.md`, base changed `docs/old.md`: NEEDS-UPDATE (previous_filename counts). Reverse case: base renamed `docs/x.md` to `docs/y.md`, PR edits `docs/x.md`: NEEDS-UPDATE.
4. Mixed PR `docs/a.md` plus `scripts/x.mjs`, base changed `docs/b.md`: NEEDS-UPDATE (workspace rule `docs` shared). Code PR `apps/mobile/src/a.ts` with the existing base cases: unchanged.
5. Docs-only PR, base changed `scripts/x.mjs` only: READY with the count note.
6. `isDocsOnly`: `[]` is false; `["docs/a.md"]` true; `["docs/a.md", "README.md"]` false; `[{filename:"docs/a.md", previous_filename:"apps/x"}]` false.
7. Docs-only PR, base file list of 300: still NEEDS-REVIEW "base compare failed" (existing cap test with a docs-only PR).
8. Existing `staleBase` pure test (`docs/n.md` renamed from `supabase/a.sql`) must still return `["supabase"]`: it is mixed, so it takes the workspace path.

## Risk

This weakens a merge-gate rule. Today the workspace rule is the only cross-PR guard on docs content in the queue, and nothing else replaces it. Who decides: Karma (merge supervisor) or the founder, not ops.

- Semantic overlap between different docs files stops being caught by the queue. Examples: two PRs adding the same BACKLOG id, a rule in `docs/engineering/*` and a spec that cites it, a renamed doc that another PR links to. Same-file edits still trip the rule, and git conflicts on overlapping lines show as DIRTY.
- BL ids are defined in both `docs/BACKLOG.md` and `docs/backlog/*.md` (`id-collisions.mjs` accepts either). Two PRs adding the same id in different files share no file, so the file-level rule would not flag them, and the workspace rule flags them only because both are under `docs`.
- What exists today, verified in the repo: `scripts/agents/id-collisions.mjs` is not run by any workflow or by the merge queue (I found its only callers are `next-id.mjs` and its own tests). It is a manual tool. Its header says it reports an id that two open PRs both add, or that an open PR adds although develop already has it, and `--pr N` exits 1 if PR N is in a collision. `scripts/agents/check.mjs` runs in `agents-check.yml` (line 34) and has no duplicate-BL or status-conflict check. So the remaining automatic guard against a duplicate id is none; I am not claiming the existing scripts would catch it in CI.
- Docs are read by tests and tools, so "docs-only" does not mean "cannot change tested output". The comment in `.github/workflows/ci.yml` (lines 33 to 38) records that `apps/mobile/test/qa-release-catalog.test.ts` reads every `.md`, `.csv`, `.ts` and `.json` under `docs/` for requirement ids, that `scripts/trace.mjs` reads `docs/prd`, `docs/backlog` and `docs/BACKLOG.md`, and that `scripts/agents/board-check.test.mjs` reads `docs/agents/checkins/README.md`. A docs PR can change what those read, and two docs PRs can interact through them without sharing a file.

### Mitigation options (pick one before the code PR)

1. File-level overlap plus an id and status trigger: for a docs-only PR, also NEEDS-UPDATE when a base commit since the merge-base touches `docs/BACKLOG.md` or `docs/backlog/*.md` and the PR does too (either file), or both touch a file `id-collisions.mjs` defines ids in (`docs/DECISIONS.md`, `docs/adr/`, `docs/agents/cto/RULINGS.md`, `docs/qa/DEVICE_TEST_PLAN.md`). Cheap, no network, keeps the loop short for pure prose PRs.
2. File-level overlap plus a queue-side check: run `id-collisions.mjs --pr N` inside the queue for docs-only PRs and make a collision NEEDS-REVIEW. Catches the real problem (same id) rather than a proxy, at the cost of more REST calls per PR and a new dependency of the queue on that script.
3. Keep the workspace rule (do nothing).

My recommendation is option 1, because it needs no new calls; option 2 is stronger. This is a recommendation, not a decision.

## Way back

Revert the code PR. `staleBase` returns to the workspace rule for every PR and nothing else depends on the new helper. No data, workflow or roster change to undo. A revert does not undo what landed in the meantime: a merged duplicate id or a broken citation stays on develop until someone fixes it. The check that would find one after the fact is `node scripts/agents/id-collisions.mjs --ref origin/develop` for duplicate ids (run by hand, since nothing runs it automatically), and `apps/mobile/test/qa-release-catalog.test.ts` plus `scripts/trace.mjs` for broken requirement references. Suggested follow-up if this ships: run `id-collisions.mjs` on develop for the first week and count hits.

## What stays unmeasured

- The real count of docs-only ready PRs that the current rule holds back (21 and 15 are the brief's numbers; I counted 78 docs-only open PRs into develop, 46 not draft).
- CI queue time, and the cancel causes after #1302 beyond a 15 minute window.
- How often two docs PRs with different files collide semantically; a follow-up count of `id-collisions.mjs` failures on develop after this lands would show it.
