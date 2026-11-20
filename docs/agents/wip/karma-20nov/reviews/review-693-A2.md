## Review A at 0c2370b6aec9c7a6460f9f82e86a59e176498362: PASS WITH NOTES

Delta Review A, 12034706 to 0c2370b6, on PR 693. No must-fix. The code and the test are unchanged; the delta is two docs files and the BACKLOG edits parse and behave as intended. One real gate remains outside the code: CI is not green at this head yet (see below), and the store-profile Release launch check must be green before merge.

### Head and delta
- `gh api .../pulls/693 --jq .head.sha` is 0c2370b6aec9c7a6460f9f82e86a59e176498362; one commit on top of 12034706 ("docs: BL-387 block says what #520 built; BL-782 ...").
- `git diff 12034706 0c2370b6 --stat`: docs/BACKLOG.md (+19 -11) and docs/DECISIONS.md (+1 -1), nothing else. `git diff ... --stat -- apps packages supabase` is empty, so no source, test, package or migration change. My earlier code findings (the four pins, the mutation results, the comment fixes) stand unchanged and I did not re-run the mutations.
- Banned characters: 0 bytes at or above 0x80 in the added lines and in the commit message; no em or en dash, curly quote, ellipsis or emoji.

### Ran at this head (fresh worktree)
- `node scripts/agents/check.mjs`: "26 agents, 395 backlog tasks ... agent team is consistent", exit 0 (394 before, +1 is BL-782).
- `node --test scripts/agents/*.test.mjs scripts/trace.test.mjs`: 136 of 136 pass.
- `node scripts/trace.mjs --no-write`: exit 0 (same 5 undefined IDs in a file this PR does not touch).
- parseBacklog and eligibility (scripts/agents/lib.mjs) on the head BACKLOG, no duplicate ids:
  - BL-387: status done (not eligible, as it should be).
  - BL-775: status ready, mode agent, eligible {ok:true}. BL-781: status ready, eligible {ok:true}. Both were "blocked (BL-387)" before; the status lines now say "ready (BL-387 is done in code)" instead of leaning on the parser's blocker rule, which is cleaner.
  - BL-776, BL-777: needs-decision, not eligible (unchanged). BL-782 (new): status needs-decision, mode agent, owner mobile engineer, not eligible, so the dispatcher will not pick it up before the ruling. Its status text parses whole despite the backticked `erase.tsx` inside the parenthetical.
  - BL-778 (pair), BL-779 (ready, eligible), BL-780 (needs-founder, human): untouched by the delta, same as before.
- `npx vitest run test/erase-all.test.ts test/settings-home.test.ts` in apps/mobile: 71 passed (55 + 16).
- `git merge-tree --write-tree origin/develop 0c2370b6`: clean, exit 0 (develop still 73fcc1ea).

### CI at this head (read just now): NOT green yet
13 check runs. Complete and green or skipped: typecheck, edge functions and ops scripts, compliance-fence, applied migrations unchanged, agent team consistent, native files changed?, install, iOS simulator build (skipped, no native change). In progress: tests and content rules, database rules, no e2e seam in store bundles (B-8), and store-profile Release launch (testflight env, no seam, 20 s). The `required` job had not reported yet; mergeable_state was "blocked". A PASS holds only once `required` and the store-profile Release launch are green at this exact head. Please re-read before merge.

### Checks on the new BACKLOG text
- BL-387 Status/Scope/Done when/Test: matches what #520 built. Verified: the Erase confirm is an alert and Delete this book has the typed word (delete-book.tsx:42, erase.tsx:73-83); the row is last in Your letters; erase-all.test.ts has 55 cases; age-gate-erase.test.ts and reminders-erase.test.ts exist; `git show --stat 73fcc1ea` (33 files) touches no journey file and not store.repos.test.ts, so "#520 adds no erase steps to J03 or J16 and no erase cases to store.repos.test.ts" is true. "Follow-ups BL-775 to BL-777, BL-781 and BL-782" is consistent with the rows.
- One claim is supported by code but not by any test: "gone from ... the reminders at once" after Delete this book. The scheduler re-plans on any store change (scheduler.ts:247) and plans from `listChildren()` (prefs.ts:115), which excludes deleted books (children.ts:33), so it should hold. reminders-erase.test.ts covers Erase everything's reminders, not Delete this book's. Not run on a phone.
- BL-782 (new): the facts check out. erase.tsx:27-29 says device owner authentication is deferred to the 1 Dec build "by the CTO ruling of 8 Nov", and docs/agents/cto/RULINGS.md has no such ruling (the only "authentication" hit there is the unrelated GitHub 2FA line), so the row is the repository's only record, as it says. F17-settings-privacy.md:209 lists device owner authentication before the wipe. "Design 2.12" is cited from the erase.tsx header; I did not find that design document under docs/, so that half is not verified. F17 line 209 also says "type delete", while #520 built an alert; that spec drift is not this PR's.
- DECISIONS.md D-144 follow-ups line (1120): now correct (#520 merged, BL-775 and BL-781 ready, BL-782 the one deferral).

### Notes (none blocks merge)
1. Stale future tense remains in four places the delta did not reach: docs/BACKLOG.md:2880, last sentence of the preamble ("exist on `develop` only after it merges"); BACKLOG.md:2953 (BL-781 Problem: "PR #520 ... merges first"); BACKLOG.md:2954 (BL-781 Requirement: "while #520 as written still says Your data"); docs/DECISIONS.md:1115 ("CCO-6, in PR #520, not on `develop` until it merges"). The PR body says the stale 'waits for #520' sentences are removed from BL-775 to BL-781; BL-781's Problem still has one.
2. Layout of BL-782: two blank lines before it, and no blank line between its last bullet and the `### Speed, size and release evidence` heading. Harmless to the parser (that heading line simply becomes the last line of BL-782's block, as it was BL-781's before) and Markdown still renders it; one blank line would be tidier.
3. PR body: the tail now says the branch is on develop at 73fcc1ea, but the middle paragraph still says "Based on the head of #520 (a28a64e2) ... it will be rebased onto `develop` once #520 merges", and the three `npm test`, `test:db`, `typecheck` boxes are still unticked.
4. Earlier notes 2 to 4 (row text not pinned; settings-home.test.ts:156 list omits Erase; stale "Languages and speech" at erase-everything.ts:25 and "Your data" at export/index.ts:6) are unchanged and still optional.

### Not verified
- Required CI and the store-profile Release launch result (in progress). Full `npm test`, `test:db`, `test:functions`. Anything on a phone: S1-95(a) and S1-133 remain the human steps. Whether "design 2.12" says what BL-782 says.

Reviewer: independent of the author (CR-44).
