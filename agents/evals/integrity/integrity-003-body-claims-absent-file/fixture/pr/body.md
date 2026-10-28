## What and why

**Status: fixed, in the test harness only.** The engine keeps the ADR 0016 guarantee, so it is unchanged. **Ask:** coordinator review and merge under D-107 (tests only: two reviews and green CI).

**The failure.** On Sat 17 Oct, 3:52 AM PT, one full `npm test` failed in the `@scribe/api` consumers pass: `interrupted install > [ADR-0016] a kill at 'remove' #9`, `expected { ok: false, reason: 'storage_error' } to match object { ok: true, version: 2 }` at `engine.test.ts:315`. The rerun passed. The file took 5.2 s against 2.9 s on a quiet run, so the machine was under load.

**Root cause.** The crash matrix ran on the shared host disk. Its temp folders come from `tempRoot()` (`node-ports.ts:187`), which the file-wide hooks at `engine.test.ts:59-67` created for every test. At 3:53 AM PT another agent measured that disk at 100% full with 18 MB free, about 15 s after this case ran. In this case the restarted manager makes no network request and one write, `pack.json.tmp` (`engine.ts:661`, through `node-ports.ts:59`). That write failed with ENOSPC. The engine then returned `storage_error` (`engine.ts:671-672`), which ADR 0016 lists as a valid failure (line 103). v1 stayed intact, which is why the case's earlier checks passed and only line 315 failed. So the planned kill met a second, unplanned fault from the host, and the case reported it as a broken update.

**Fix.** The `interrupted install` describe now runs on in-memory ports, in the new `memory-ports.ts`:
- `MemoryDisk` holds the files.
- `MemoryFs` is `NodeFs` over that disk, with the same crash injection.
- `MemoryHttp` answers Range requests from memory.

A case touches no disk and no socket, so the kill it plans is the only fault it can meet. The other 20 tests keep the real disk and the real Range server. Their temp folder is now made per describe (`useTempRoot()`), so the matrix makes none. No assertion, crash plan or accepted outcome changed, and nothing was skipped or retried.

## How it was checked

Failure rate before and after:

| Mode | Before (develop 01d4972) | After (this branch) |
|---|---|---|
| The file alone, mobile config | 0 of 200 runs failed | 0 of 200 runs failed |
| The file in a loop while the full mobile suite loops in parallel, mobile config | 0 of 79 runs failed (9 suite runs alongside) | 0 of 50 runs failed (7 suite runs alongside) |
| Same, `@scribe/api` consumers config (the 17 Oct command) | 0 of 76 runs failed | 0 of 50 runs failed |
| Temp folders on a 64 MB volume filled to 100% for 40 ms in every 440 ms | 29 of 30 runs had a matrix failure (183 of 1,470 matrix cases); the 17 Oct message appeared in 5 runs | 0 of 100 runs failed (matrix tests) |
| Temp folders on a volume held at 100% | 49 of 49 matrix tests failed (ENOSPC) | 49 of 49 passed; 0 files written |

Other checks:
- **The exact case, made deterministic.** I ran "kill at remove #9", then filled a real tmpfs to 100% before the restart. The restart returns `{ ok: false, reason: 'storage_error' }` with 0 HTTP requests, and the only file error is ENOSPC writing `pack.json.tmp`. That matches 17 Oct.
- **Not an engine bug.** I tried 56 kill plans against 9 patterns of dropped requests, 504 combinations in all. Every one leaves v1 or v2 and ends on v2. So a retried request that shifts the op count never reaches a broken state.
- **The memory ports match the real ones.** For all 56 plans, real and memory ports make the same file operations in the same order, return the same results and leave the same tree after the install, the kill and the restart. A planted difference (folder listings reversed) fails all 56.
- `SCRIBE_FUZZ_SEED`: this file does not read it.
- `npm test` passes: 2,810 vitest tests in 138 files plus 19 `node:test`, 0 failed. `npm run typecheck` passes.

**Not covered.** The other 20 real-disk tests in this file still fail when the disk fills. Under the same filler, 9 of 10 runs had a failure (30 failed tests, none of them in the matrix). Every test that writes to disk does the same. The remedy is free space on the shared agent machine. Today it sits at 92 to 100% full, and 12 of 35 worktrees hold a node_modules folder of about 0.9 GB each.

Files touched: `apps/mobile/src/lib/packs/__tests__/engine.test.ts`, `apps/mobile/src/lib/packs/__tests__/memory-ports.ts` (new), `docs/agents/BOARD.md` (one check-in line).

- [x] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments)
- [ ] `npm run test:db` passes (not run: no database change)
- [x] `npm run typecheck` passes, including `apps/mobile`
- [x] New or changed tests name the requirement or rule they prove; no test was deleted or skipped without a reason here

## The constitution and our rules

- [x] No machine edit bypasses `verifyEdits`; nothing writes, rewrites, summarizes or "shapes" a person's words
- [x] If cleaning behaviour changed, `ENGINE_VERSION` is bumped with a dated comment (not changed)
- [x] Gates use `decide()` or `decideKeepLetter()` from `packages/core/src/plan.ts`; read, play, export, delete, restore and family authorship stay ungated, and capturing and typing never are: only the Keep step of a letter is (D-082) (not touched)
- [x] Copy lives in `packages/content` and a failing content rule was fixed in the copy, not the test (no copy)
- [x] No entry text, transcript, audio or child name in analytics, logs or crash reports
- [x] Tests and fixtures use the fictional family "Asha" only; no real family details anywhere
- [x] Database changes are a new migration file; no applied migration was edited (the migration guard checks this) (none)
- [x] The public product name comes only from `packages/brand`

## Screenshots

None: no UI change.

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF

---
_Generated by [Claude Code](https://claude.ai/code)_