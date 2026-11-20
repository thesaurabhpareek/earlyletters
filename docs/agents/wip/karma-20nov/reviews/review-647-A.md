## Review A at 5309d0b31523915ab72297e46379aecd0a4f5d84: CHANGES

PR 647, QE-05, lens A (correctness and data safety). Head sha confirmed with gh api before starting. Worktree at the sha, main checkout untouched.

What I read and ran
- Whole diff vs merge-base 139807515 (5 files: store.ts, README, two tests, DEVICE_TEST_PLAN). Read purgeExpired/recordLaunch/eraseEntry (store.ts:761, 844, 863), purgeShelfAtLaunch (capture/erase.ts:56), sweep.ts, entries.ts expiredIds/tombstone/eraseRow.
- The two changed test files on the PR: 29 passed (shelf 18, purge-guards 11). Whole store.* group: 11 files, 153 passed. Also sweep, sweep.disk, sync-erase, book-shelf, shelf-strings, launch-retry: 98 passed; qa-kill-harness and transcribe-adts.disk: 60 passed.
- Old-code check: reverted only store.ts to the merge-base, kept the new tests: 5 failed (4 in store.shelf, 1 in store.purge-guards, which fails on the stamp-follows-clock assertion), then restored store.ts. So the new tests do prove the change.
- Scratch tests (deleted afterwards) driving the PR's purgeExpired/recordLaunch through a moving clock; results below.
- merge-tree against current origin/develop: clean (tree f3ff0a60). Added lines: no non-ASCII characters, so no dashes, curly quotes, ellipsis or emoji.

What is good (verified)
- With a readable stamp the new cutoff is last minus 30 days, which is never later than the old cutoff (now minus 30 days), because the guard at store.ts:846 already returns when now < last. On the same state the new code never erases more than the old code. Every erase still goes eraseEntry: recording file first, then row, row kept if the file will not go (store.ts:761-790). No photo column found in the entries repo or schema grep (not exhaustive).
- Upgrade with a stuck future stamp (a year ahead, as the old code could leave): launches at day 1, 2, 31 erase nothing, day 32 erases a day-0 deletion. Recovery is one skipped launch, not a year. Clock set back, then forward: the letter is erased no earlier than under the old code.
- recordLaunch ignores NaN (store.ts:864). purgeExpired(NaN) throws RangeError, same as before; Date.now() is never NaN and the throw is caught at sweep.ts:72. Only one caller: purgeShelfAtLaunch, from sweep.ts once per process (sweep.ts:54), not during a recording.
- If purge throws, recordLaunch is skipped (erase.ts:57-58); the stamp then only lags, which fails toward keeping. I found no new stall: the old code threw the same way each launch.

Must-fix
1. A missing or unreadable launch stamp still trusts the clock fully, so a letter can be erased at ONE launch. store.ts:847: `Number.isFinite(last) ? Math.min(nowMs, last) : nowMs`. Scratch run: no stamp, letter on the shelf, clock 40 days ahead: 1 letter erased (file, then row) at the first launch. Stamp set to "garbage": same, 1 erased. The unchanged test store.purge-guards.test.ts:94 pins exactly this ("an unreadable launch stamp never blocks the purge"). This contradicts the PR body ("erased only after two launches agree") and the new doc comment ("never trusted further than it has been seen before"). Reachability is low: it needs a shelf that is not empty and no usable stamp (an upgrade from a build that never wrote it, or one damaged row) and a clock 30 or more days wrong at that same launch. It is not a regression, but you asked that any path that can erase early be fixed, and the fix is two lines. Fix: when `last` is not finite, return 0 from purgeExpired (purgeShelfAtLaunch still records the launch, so the next launch purges), and change the test at :94 to expect 0 then 1 at the next launch. A restore onto a new phone is unaffected because the stamp lives in the same SQLite file (settings table, store.ts:240).

Notes (not blocking)
2. `Math.min(nowMs, last)` is dead code: after the guard nowMs >= last, so seenMs is always `last`. The real rule is "cutoff = the previous launch minus 30 days". Scratch: deleted day 1, prior launch day 0, launch at day 31 plus 1 hour erases 0, the next launch erases 1. Say that in the comment instead of "earlier of".
3. Residual, accepted by the PR and pinned by a test: a clock left ahead across two cold starts erases everything (scratch: 400 days ahead, launch 1 erased 0, launch 2 erased 2). iOS can cold-start the process minutes apart, so "two launches" is weak protection against anything but a short glitch. Cannot be fixed without a monotonic time source; fine for tonight.
4. Same bug family, pre-existing and untouched: deleted_at is stamped from the phone clock (entries.ts:316-319). A letter deleted while the clock is behind the last launch gets an early date. Scratch: deleted 60 days back, then clock corrected: erased at the second launch after correction (old code: the first). Not worse, but a follow-up could stamp max(now, last stamp).
5. Shelf copy "Kept here until {date}" (strings.en.ts:805) can now stay visible up to one launch after that day. "Wait here for 30 days" (strings.en.ts:801) still holds because nothing goes early. Worth a glance from privacy.
6. Docs the PR left: DEVICE_TEST_PLAN.md:162 (DL-03) still says the day 31 letter is erased "at the first launch", and F08-recordings.md:260 (F08-U14) says the same; PR flags this "for product" but a tester running DL-03 on a faked clock may log a false bug. DQ-R13 (04-data-quality-and-lifecycle.md:59) and F09-book item 12 do not mention the one-launch delay.

Device test plan
DL-04 (b) and (c) are the covering steps and I traced (b) by hand against the code: it matches. (c) is not runnable as written: its Expected mentions "a letter deleted 30 days before the corrected date", but the Steps never create one. A human should run DL-04 (b) tonight on a phone, and (c) once the step is fixed.

CI at this head: required, tests and content rules, typecheck, database rules, edge functions, store-profile Release launch all success; iOS simulator build skipped; one compliance-fence run cancelled and a second run succeeded. A PASS holds only once required CI is green at this exact head.

Not verified
- Anything on a device or simulator (DL-04 not run). Whether build 9 wrote lastLaunchAt (history is squashed; git log -S finds only ebd62e43 of 31 Oct). That a backup restore carries the settings table (read from code, not run). Sync-on builds (read only; servers are off). Local tsc (not run; CI typecheck is success). Full mobile suite (I ran only the groups above). Other photo or media tables beyond the grep.

Reviewer: independent of the author (CR-44).
