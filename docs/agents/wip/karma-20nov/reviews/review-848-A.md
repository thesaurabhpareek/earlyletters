## Review A at 5e5c901f43944f171e53b8b924f1d7fec182e38f: PASS WITH NOTES

Lens A (accuracy: every changed line true against its cited source; nothing breaks the harness). Round 3 on PR #848: the delta from 0264066f4cfaa554628fb46a050193c9ba63445c (my round-2 review, CHANGES) to this head, one commit, 3 files, +6 / -6. Judged against `develop` 1513b265907b14b8f2818b88ef00ecdac00d98ff; `merge-queue.mjs` there is unchanged since #845 (4f89d659). Reviewer: `principal-architect` steward session. I wrote none of this PR.

### Read

- `git diff 0264066f 5e5c901f`.
- Sources:
  - `scripts/agents/merge-queue.mjs:19-26, 58, 75-90, 101-104` on `develop`.
  - #828 `merged_at` 2026-11-19T22:40:39Z (squash 5f5dfaf4); 8a026397's commit date 2026-11-19T22:46:37Z; `git merge-base --is-ancestor a80648d4 origin/develop` is false.
  - Every merge commit whose message mentions a rebuild, across all branches fetched from origin, with its first parent checked against `develop`.
  - `git apply --3way` behaviour, tried in a throwaway repo with git 2.43.0: the clean file shows `M`, the new file `A`, the conflicted file `UU`.

### Ran (scratch worktree, removed after)

- At the head: `node scripts/agents/check.mjs` exit 0 ("agent team is consistent"); `node --test scripts/agents/*.test.mjs` 149 pass, 0 fail.
- Head plus `develop` 1513b265 (scratch merge, no conflicts): check.mjs exit 0; 149 pass. `git merge-tree` against `develop`: clean.
- Real-family-data scan: 11 pass. Delta lines are ASCII only. All three front matters parse with js-yaml 4.3.2 and yaml 2.9.1.
- CI at this head, re-read just before posting: required `applied migrations unchanged`, `required` and `compliance-fence` all success, and every other check-run success; `mergeable_state: clean`.

### Round-2 findings: status

- Item 1 (`stacked-prs/SKILL.md:62`, the 8a026397 example) is closed and true. 8a026397 is described as built on #828's branch head a80648d4, never on `develop`, six minutes after #828 squash-merged as 5f5dfaf4 (22:40:39Z against 22:46:37Z). It is no longer offered as the unmerged-base example.
- Item 2 (`review-gate/SKILL.md:26, 28`) is closed and true. The queue reads the header and verdict only from line 1 (`parseReview`, `merge-queue.mjs:101-104`) and reads the body for the `Must fix:` check (`:80-90`). A `<!-- agent:<handle> -->` line on line 2 does not match `MUST_FIX_LINE` (`:80`), so it does not change the verdict.
- Note 3 (line drift) is closed. `review-gate:15` "lines 19 to 26 and 75 to 90" and `expo-native-module:46` "WATCH-RED, line 58" match `develop`.
- Note 6 (staging) is closed. `stacked-prs:55` no longer uses `git add -A`. Its claim that `git apply --3way` "has already staged what applied cleanly" holds on git 2.43.0. `git write-tree` needs the resolved files added by name, as the step says.

### Findings

Must fix: none.

Notes (do not block):

1. `stacked-prs/SKILL.md:62` ends "No rebuild onto an unmerged base is on record yet." Read in context, it means no single-commit rebuild in this shape (new base first, old head second), and that is true. Taken alone it is not: 5e896fed (13 Nov, on #764's branch `feat/mobile-s17-new-phone-tier0-10nov`) merges "the S17 rebuild ... on #738's head 034b71c0" while #738 was still open (it merged 19 Nov). That rebuild had the other shape, with old head 8c7be045 as first parent and the re-created chain ending dfaaaeea second. Say "No single-commit rebuild in this shape onto an unmerged base is on record; 5e896fed did one the other way round" on the next touch.
2. `review-gate/SKILL.md:26` says the body is read "only for a `Must fix:` line". The tool also accepts a few written-out forms of "no must-fix" (`NO_MUST_FIX`, `merge-queue.mjs:82, 88`). These can let a `PASS WITH NOTES` count without a `Must fix:` line. The tool's own header (`:23`) simplifies the same way, and the skill tells reviewers to write `Must fix: none.`, the stricter form, so nothing here misleads.
3. Round-2 notes still open by the author's choice, none blocking: the "no lane may run" gate at `review-gate:29` has no D or CR behind it, and `review-gate:51`'s commissioner and merger clause is stricter than its cites.

Not verified:

- That the REST pull-request update accepts `base` (`stacked-prs/SKILL.md:34`). docs.github.com is not reachable from this session.

This PASS WITH NOTES holds at this exact head. Re-read if the head moves.

Reviewer: independent of the author (CR-44).
