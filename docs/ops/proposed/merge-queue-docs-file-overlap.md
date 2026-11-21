# Proposal: merge-queue NEEDS-UPDATE for docs-only PRs by file overlap, not by workspace

Status: proposal, 21 Nov 2026. This pull request is docs only. It does not edit `scripts/agents/merge-queue.mjs`, any workflow or `agents/roster.json`. The code change below is a sketch for a separate pull request, once Karma agrees.

## Problem

The rule added in #1356 (merged 21 Nov 2026 19:41 UTC) marks an otherwise ready PR NEEDS-UPDATE when the base commits since its merge-base touch a workspace the PR touches. `workspaceOf` maps `docs/<x>/...` to `docs/<x>` and a file directly in `docs/` to `docs`. So two PRs that edit different files in `docs/engineering/`, or `docs/BACKLOG.md` and `docs/DECISIONS.md`, count as overlapping. A new commit voids both reviews (the note text says so), so each update restarts review and CI, and meanwhile develop moves again.

## What I measured (GitHub REST, 21 Nov 2026)

- Develop took 281 commits dated 21 Nov (00:01 to 22:19 UTC, `GET /commits?sha=develop&since=...`). Gap between consecutive commits: median 1.5 min, p90 11.0 min. Matches the figures in the brief. At a 1.5 minute median gap, a 4 to 5 minute CI plus review cycle almost always sees a newer base commit before it finishes.
- `unit` ("tests and content rules") duration: 182 to 308 s on success in the newest runs I could read (below).
- #1302 (merged 15:58 UTC, commit 8d0be6819) did raise `unit` from `timeout-minutes: 5` to 10; `.github/workflows/ci.yml` on develop now shows 10 on that job (line 95).

## What I could not reproduce

- "21 docs-only open PRs, 15 would be NEEDS-UPDATE". At 22:3x UTC, 188 PRs were open, 181 into develop. Of those, 122 have every file under `docs/` (66 ready for review, 56 draft). I did not reproduce 21, so either that count used a narrower filter (reviews at head, green) or an earlier moment. I did not recompute the 15. Treat 15 of 21 as the brief's figure, an upper bound with no ready-state filter, not as something I verified.
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

`shared` then holds file paths for docs-only PRs and workspace names otherwise. `verdictFor` (`row.staleBase?.shared.length`) and the two notes (lines 417 to 419) need no change. Update the header comment for "Stale base" to say so, and in the note cap the printed list (for example `.slice(0, 5)` plus a count), since file paths are longer than workspace names. The base file list cap (`COMPARE_FILE_CAP`, 300, NEEDS-REVIEW when hit) stays, so a cut-off list still cannot read as "no overlap".

### Test cases to add (`scripts/agents/merge-queue.test.mjs`)

Using the existing `verdict({ ...stalePr, behindBy, baseFiles, files })` helper and the pure functions:

1. Docs-only PR `docs/engineering/a.md`, base changed `docs/engineering/b.md`: READY (was NEEDS-UPDATE), and the "none in a workspace this PR touches" note path still prints the count (adjust the note wording to "none of the files this PR changes").
2. Docs-only PR `docs/BACKLOG.md`, base changed `docs/BACKLOG.md`: NEEDS-UPDATE, shared `["docs/BACKLOG.md"]`.
3. Docs-only PR with a rename `docs/old.md` to `docs/new.md`, base changed `docs/old.md`: NEEDS-UPDATE (previous_filename counts). Reverse case: base renamed `docs/x.md` to `docs/y.md`, PR edits `docs/x.md`: NEEDS-UPDATE.
4. Mixed PR `docs/a.md` plus `scripts/x.mjs`, base changed `docs/b.md`: NEEDS-UPDATE (workspace rule `docs` shared). Code PR `apps/mobile/src/a.ts` with the existing base cases: unchanged.
5. Docs-only PR, base changed `scripts/x.mjs` only: READY with the count note.
6. `isDocsOnly`: `[]` is false; `["docs/a.md"]` true; `["docs/a.md", "README.md"]` false; `[{filename:"docs/a.md", previous_filename:"apps/x"}]` false.
7. Docs-only PR, base file list of 300: still NEEDS-REVIEW "base compare failed" (existing cap test with a docs-only PR).
8. Existing `staleBase` pure test (`docs/n.md` renamed from `supabase/a.sql`) must still return `["supabase"]`: it is mixed, so it takes the workspace path.

## Risk

- Semantic overlap between different docs files is no longer caught by the queue. Examples: two PRs claiming the same BACKLOG id in different files, a rule in `docs/engineering/*` and a spec that cites it, a renamed doc that another PR links to. Two same-file edits still trip the rule, and git conflicts on overlapping lines show as DIRTY.
- The checks that remain: `scripts/agents/id-collisions.mjs` (it reads ids already on develop, per its own header) and `check.mjs` run in CI on the PR. I did not verify whether they run against the PR head alone or against the merge with current develop. If head alone, two PRs that are each green could still land the same id, and it would show on the next develop run, not before merge. I did not measure how often that happens.
- Docs that feed generated or tested output (for example content or copy tests reading `packages/content`) are outside `docs/` and keep the workspace rule. A docs-only PR cannot change them.

## Way back

Revert the code PR. `staleBase` returns to the workspace rule for every PR and nothing else depends on the new helper. No data, workflow or roster change to undo.

## What stays unmeasured

- The real count of docs-only ready PRs that the current rule holds back (21 and 15 are the brief's numbers; I counted 122 docs-only open PRs, 66 not draft).
- CI queue time, and the cancel causes after #1302 beyond a 15 minute window.
- How often two docs PRs with different files collide semantically; a follow-up count of `id-collisions.mjs` failures on develop after this lands would show it.
