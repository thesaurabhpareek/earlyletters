## Review A at ca3b0595454b26987633b209d514b901206dcba4: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A: correctness, tests that fail on the old code, code shape. Head read live (`gh api pulls/884 .head.sha`): `a6f06f75`, a merge of #882's fix (11:48 UTC) onto `b1f15601`. This PR's own delta is unchanged by the merge.

This round (12:41 UTC): the head moved from `a6f06f75` to `ca3b0595`, a merge of #881's R9 fix (`82ac6516`). `git diff a6f06f75 ca3b0595` touches only `lib/find/snippet.ts` and `test/find-query.test.ts`, which is exactly #881's fix; this PR's own delta against its base is unchanged, so everything below still holds. Find tests at `ca3b0595`: 54 (find-query 16, find-scan 17, find-index 8, find-search 13), all pass. The base branch moved in the same way, so the PR's diff against its base is the same as before.

### What I checked
- The delta `git diff origin/feat/mobile-bl-952-3-index...origin/feat/mobile-bl-952-4-search`: 4 files, +350/-0 (`search.ts`, `fts-index.ts`, `debounce.ts`, `test/find-search.test.ts`). Inside CODE-R02. 0 non-ASCII bytes added.
- `ftsSearch` joins the map and the view, so a stale index row never returns a hidden letter (R16b), and selects no rank (R10). `searchLetters`: idle under the floor, index only for words and only when `searchIndexExists`, CJK always scans, any index error drops the index and answers from the scan (R19).
- The debounce (`debounce.ts:26`), by hand: `push` keeps the latest text and restarts one timer; a query that cannot run applies at once and clears the timer; `flush` runs what is pending (nothing if the timer already ran it); `dispose` clears and every later `push` is ignored; a timer that fires after `dispose` runs nothing. No leak, no double run. The three O-1 tests pin these under fake timers.
- Body cites: `search.ts:39`, `:29` (comment fixed), `fts-index.ts:13`, `debounce.ts:26`, `:9`. 5 of 5 hold.
- Tests in a worktree at this head: find-query 14, find-scan 17, find-index 8, find-search 13 pass (52). `tsc --noEmit`: the 5 known errors only (checked at #881 and #885 heads). Every test fails on develop.
- Privacy (R14, R15, R22, the brief's log question): `lib/find` imports only `../db/sql`, `../capture/busy` (in #885) and its own files; no `console.`, `fetch`, analytics or Sentry in any Find file (grep at #885's head). The R14 test reads every table after a canary query; R15 spies on every console channel through a forced failure; R22 stubs `fetch` and `XMLHttpRequest` across both paths and a build: 0 calls.
- CI at this head, read 12:46 UTC: `required`, `tests and content rules` and `typecheck` succeeded. `store-profile Release launch` was still running; it is not required.

### Findings, most serious first
1. Note. The debounce is on by default, the card's order reversed. Card O-1 (line 294) and section 8 (line 155) make 150 ms the first fix "if R2 misses on the SE 3"; the body says the opposite, that it can drop to 0 if S1-205 shows R2 met without it. Both are defensible (a synchronous search on every keystroke also queues input), but the card wins (CR-66): either keep 0 until the device run, or add a Conflict line for the founder. Nothing is wired until slice 8, so this costs nothing yet.
2. Note. The agreement list has no term made only of marks. `harbour \u0301` and `\u0928\u093e\u0935 \u093e` give scan 0, index 1 (measured with `scanSearch` and `ftsSearch` at #885's first head, where `query.ts`, `scan-index.ts` and `fts-index.ts` are the same as here). The fix is in #881's `prepareQuery` (review-881-A note 2); add one such query here so the list holds it. R29's 200 Devanagari and Arabic fixtures are still owed, as the body says.
3. Note. A failing index query drops the index whatever the error (`search.ts:47`), including a transient one such as a busy lock. It is rebuilt at the next catch-up and the scan answers meanwhile, so it costs speed, not letters. A sentence in the comment would make that a choice on record.
4. Note. R15 and R22 are met at the library edge only (console, imports, fetch). The screen, breadcrumb and URL halves are slice 8's; the body's "Satisfies" line could say "library half".
5. Note. The scan path does not read `listIndexableBooks` (see review-883-A note 2); R24 for search rests on #895's `bookVisibleNow()` in `findLetters`.

Must fix: none.

### Not verified
- R2 (first row within 300 ms p95 at 1,000 letters, debounce included) on an SE 3: S1-205 (b).
- The full `apps/mobile` suite at this exact head. It ran at #885's first head `a6d6c7ad`, which holds this slice's own delta (the later view fix touches only Find files, rerun above): 8 failing files and 73 tests, the sandbox baseline, no Find file.

Reviewer: independent of the author (CR-44).
