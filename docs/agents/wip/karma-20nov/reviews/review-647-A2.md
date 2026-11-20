## Review A at 8763c169f6fc1ddcead0e95e55d733a10fd350e4: PASS WITH NOTES

PR 647 (QE-05), lens A (correctness and data safety), re-review. Head sha confirmed with gh api before starting; worktree pr647-A2 at the sha, main checkout untouched. Independence: this head is ONE commit on 5309d0b3 written by Karma's CTO session, not the original author session. I am independent in method (my own scratch tests and mutations, none of the author's results reused), not in identity from that commit's author.

What I read and ran
- `git diff 5309d0b3 8763c169`: 8 files (store.ts, erase.ts, README, 4 tests, DEVICE_TEST_PLAN), plus the callers (sweep.ts:75 once per process, erase.ts:56, entries.ts expiredIds `deleted_at <= cutoff`).
- Vitest: store.*, sweep*, transcribe-adts.disk, qa-kill-harness, launch-retry, sync-erase, book-shelf, shelf-strings: 20 files, all passed (per-file counts sum to 357). `tsc --noEmit` in apps/mobile: one error, the known expo-clipboard (help-fallback.tsx:11). `git merge-tree --write-tree origin/develop 8763c169`: clean (tree e3e3a519); develop changed store.ts elsewhere (review draft helpers) and added no purge callers.
- Added lines of the whole PR: 0 non-ASCII characters (no dashes, curly quotes, ellipsis, emoji). No log, analytics or crash call added; no child name or family detail.

(1) Review A must-fix: fixed, and I could not break it
- store.ts:850 now `if (!Number.isFinite(last) || nowMs < last) return 0;` and the cutoff is `last - SHELF_MS` (store.ts:852). The dead `Math.min` is gone and the comment says what the rule is.
- Scratch tests (deleted afterwards), driving the real store over node:sqlite through purgeThenRecordLaunch: no stamp, clock +40 days: 0 erased, shelf intact, no eraser call. 13 junk stamps ("garbage", "", " ", "NaN", "Invalid Date", "2026-13-45", "null", "undefined", "9999999999999", "1e9", "0000-00-00", and "0" and "-1", which Node parses as years 2000 and 2001): 0 erased every time, and the stamp is rewritten so the next launch purges. First launch after an upgrade with no stamp: 0, then the next launch erases a due letter. Restore with the settings table in the backup (settings is a table in the same SQLite file, repos/settings.ts:4-13): a letter already 30 days old at the last launch before the backup goes at the first launch on the new phone, a younger one at the second. Restore without the stamp: 0 then 1.
- Clock moved back then forward: no erase until the previous launch's own reading is 30 days past deletion. NaN: launch(NaN) leaves the stamp alone; purgeExpired(NaN) no longer throws (the old code threw RangeError) and now acts on the stamp alone, which erases only what the last real launch had already seen. Harmless; Date.now() is never NaN.
- Fuzz, 300 trials of 40 launches with random forward jumps up to 400 days, back steps up to 100 days and missing, past and future starting stamps: 3014 erasures, 0 erased unless (previous stamp readable, now not earlier than it, previous stamp minus deletion at least 30 days), and 0 letters kept that this rule says must go.

(2) Review B must-fix: fixed in the "one function both use" form
- store.ts:878-882 `purgeThenRecordLaunch` does purge, then `alsoErase`, then record. erase.ts:57 calls it with `finishServerErased`. grep over apps/mobile (src, app, test, e2e) and the repo: `recordLaunch` and `purgeExpired` appear only in store.ts (definitions and that function), tests and the README. No caller records before purging.
- Mutation 1: swapped the order inside purgeThenRecordLaunch, tests kept: 7 fail (3 in store.purge-guards, 4 in store.shelf). Restored.

(3) Edited older tests: not weakened
- `purgeSeen` = `recordLaunch(ms)` then `purgeExpired(ms)`, so the stamp equals the time and the cutoff is again time minus 30 days. I compared old and new hunk by hunk: every expected number and every time argument is unchanged (29d23h keeps, 30d erases, 1 ms before keeps, 31d, 90d, 2x shelf, the stuck-eraser pair, sync cases). The two tests that deliberately set their own stamp (moved-back guard, one ms before the recorded launch) still call purgeExpired directly.
- Mutation 2: removed the recordLaunch lines added to sweep.disk (4) and transcribe-adts.disk (1): 5 tests fail on "the letter is erased", so those lines are needed and the tests still assert the erase. Restored.

(4) Retention and recovery
- Letter deleted now: erased only when a previous launch read at least deletion + 30 days (scratch: previous launch at exactly day 30 erases at the next launch; 1 ms earlier does not). Build 9 stuck future stamp (a year ahead): the first launch returns 0 and rewrites the stamp to the real clock, the next purges as usual (the old code never recovered inside the window).

Findings (none blocking)
1. erase.ts's use of the function is not test-pinned. Mutation 3: put erase.ts back to inline code with the WRONG order (recordLaunch, then purgeExpired + finishServerErased): all 20 files pass, because the disk tests that call purgeShelfAtLaunch pre-seed the stamp. Today erase.ts is correct (read at :57). Cheap hardening: one disk test that seeds a stamp a day before, jumps the clock 40 days, calls purgeShelfAtLaunch() and expects 0.
2. DEVICE_TEST_PLAN DL-04 (c) (line 167-168): I traced the steps against the code and they run as written: year-ahead open erases nothing, correcting the date gives a skipped open then a normal one, the second letter survives the first open 31 days on and goes at the second (the first letter goes at that same open; Expected does not say so). Two wording gaps: (c) and the last part of (b) say "open the app twice" without "force quit", but the purge runs once per process (sweep.ts:54), so a foreground return gives a false FAIL; say force quit and open each time. And a jump of a year is longer than a TestFlight build's life; I did not verify that iOS enforces TestFlight expiry from the device clock, but any jump of 31 days or more exercises the same code, so use 40 days there.
3. DL-03 (line 162) is accurate: erased at the first or second launch, and with no stamp the first launch only records. The Steps do not say to open Phone B twice; add it.
4. Unchanged from round one, still accepted: a clock left ahead across TWO cold starts erases (title "never trusts" overclaims); deleted_at is stamped from the unguarded phone clock (a letter deleted while the clock is behind goes early); stale specs F08-recordings.md:260, 06-nfr.md:200, 07-quality-bar.md:200 and catalog row RT-OS-02 "Nothing erased early" still say first launch or never early. Product ruling, as the PR says.

CI at this head (16 check runs read): required, tests and content rules, typecheck, database rules, edge functions, compliance-fence, migrations unchanged all success; iOS simulator build skipped; the e2e simulator app and one store-profile Release launch were still in_progress when I read them. A PASS holds only once required CI is green at this exact head.

Not verified
- Anything on a phone or simulator (DL-03, DL-04 not run). Whether build 9 wrote the stamp (history is squashed). Sync-on behaviour (read only; servers off tonight). The full apps/mobile suite (I ran the named groups). Hermes Date.parse on odd junk strings (I used Node; the safe direction holds for any result, since a finite parse only ever yields a cutoff at or before the earlier launch). TestFlight expiry from the device clock.

Reviewer: independent of the author (CR-44).
