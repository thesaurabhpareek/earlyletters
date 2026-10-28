# Diff sanity gate (owner: ai-eng-lead)

Module: `scripts/agents/gates.mjs`. Tests: `scripts/agents/gates.test.mjs` (fixtures, no network).
Status: built, not wired. It is pure (no I/O) and nothing in `dispatch.mjs` calls it yet; the integrator wires it.

Problem: in PR #297, commit `00134a04` emptied `docs/agents/hardening/scope-and-drift.md`
(4153 bytes to 0; `git show --numstat` reads `0 32`) through a bad script. The message did not say so.
The coordinator caught it by hand, and `8cb16a95` restored the file. A diff-shape check catches
this without reading the content.

## Input and output

- `checkDiff(files, opts)`: `files` is the array from `gh api repos/{o}/{r}/pulls/N/files --paginate`
  (`filename`, `status`, `additions`, `deletions`, `changes`, `patch`, `previous_filename`). Returns
  `[{ kind, file, detail }]`, empty when clean. `file` is `null` for `mass_delete`.
- `explain(flags)`: one line per flag, passed through `oneLine`, safe for a board or review body.

## Flags and thresholds

| kind | fires when | default |
|---|---|---|
| `deleted` | `status` is `removed` | always |
| `emptied` | the patch has a `+0,0` hunk header, or the base size is known and base + additions - deletions is 0 or less | always |
| `shrunk` | modified file loses more than `shrinkShare` of its lines (needs `baseLines`) | 0.5 |
| `rename_rewrite` | renamed and deletions are at least `renameRewriteShare` of the base lines; with no base, `changes` at least `renameFallbackChanges` | 0.5, 100 |
| `binary` | extension in the binary list, or the patch says `Binary files` | always |
| `mass_delete` | more than `massDeleteFiles` files removed | 10 |

`emptied` is also reported for a file that is both emptied and would count as shrunk; it is
never reported twice. `baseLines` is `{ [path]: lines }` at the PR base; a renamed file is looked up
by `previous_filename` first. Without it, only `emptied` (via the patch), `deleted`, `binary`,
`mass_delete` and the rename fallback can fire. `shrunk` is never guessed.

## Allow-list rule

`opts.allow` is `[{ path, reason, flags? }]`. `path` is an exact path or a glob (`*` within a folder,
`**` across folders). An entry with an empty `reason` waives nothing. With no `flags`, an entry waives
`shrunk`, `deleted` and `rename_rewrite` only. `emptied` and `binary` are waived only when the entry
lists them, so a deliberate blanking is a visible, named choice. `mass_delete` cannot be waived.
Source the list from the PR body or a file in the repo, not from a comment by an untrusted author
(AIE-R22).

## How the integrator wires it

1. In the PR facts step, after the existing `files` call, run
   `checkDiff(files, { baseLines, allow })`. Build `baseLines` only for `modified` and `renamed` files
   with `gh api repos/{o}/{r}/contents/<path>?ref=<base sha>` (count newline-separated lines), and
   skip it when the file list is long; the other flags work without it.
2. Put `explain(flags)` on the board next to the PR and in the red-team brief. A flag is a prompt to
   look, not a verdict: the reviewer decides, and the merge rule is unchanged.
3. Treat `emptied`, `deleted` and `mass_delete` as blocking on an agent PR until a founder or
   reviewer comment says it is intended.
4. Add a `check.mjs` entry and a line in `HARNESS.md` modules.

## Limits

- Lines, not bytes: the API gives line counts. A file reduced to blank lines would not be `emptied`.
- A very large diff has no `patch` from GitHub; then only the base size can detect emptying.
- A missing patch is not treated as binary (huge text diffs and mode changes also lack one).
- A file mode change alone reports `changes: 0` and is not flagged.
- Not measured: cost of fetching base sizes on large PRs.
