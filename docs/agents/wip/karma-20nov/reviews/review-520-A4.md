## Review A at 366f856410c8c1bba2a46d0969ac9a58e7e84f63: PASS WITH NOTES

PR #520, lens A (correctness and data safety), full delta `git diff ae39522a 366f8564` (my last Review A was A3 at ae39522a). Head read from gh api: 366f8564, equal to the sha I was given. I read the code in detached worktrees at this sha (three scratch worktrees, all removed). No must-fix.

### The delta, as read
- Five commits on ae39522a: e5609b78 (wording), merge 80379343 of develop caba0215 (#661), 52ae4f0a (Family Sharing guard), 366f8564 (CCO-6 in `docs/agents/exec/RULINGS.md`). `git diff --stat ae39522a 366f8564`: 14 files, 388 added, 52 removed. Source under `src/lib` is untouched by this PR's own commits in the delta; `store.ts`, `erase-everything.ts`, `wipe.ts` and `age-gate.ts` are byte-identical to ae39522a.
- Added lines have no non-ASCII character, so no em or en dash, curly quote, ellipsis character or emoji. (A test title contains three ASCII dots, "If you wait ... that erases"; not the character, nit only.)

### The three strings, against the PR body
- `strings.en.ts` at this sha: `backups` is "Exports you already saved, and backups of this phone such as iCloud Backup, are not changed."; `failed` is "Erasing did not finish. Try again now. If you wait, the app finishes it the next time it opens, and that erases anything you add before then."; new `plusStays` is "Erasing does not cancel Plus. Billing continues through Apple until you cancel." All three are exactly as the body states, and a test pins `plusStays` against `accountDeletionCopy.subscription.body` (same sentence, first word changed). `body`, `onThisPhone`, `freeLetters`, `bookBodyThisPhone`, `bookEraseNowBody`, `bookEraseFailedToast` are unchanged. No stale copy of the old `backups` or `failed` text remains anywhere in the tree (grep). None of the changed keys is in a registered map (`REGISTERED` appears only in `features/account-deletion.en.ts`, not touched).

### Is the failed sentence true of the code
- "Try again now": after `eraseEverythingLocal` returns `incomplete` the mark `erase.everything.pending` stays (`store.ts:1032-1040`), the page keeps its button (`erase.tsx:117-120`), and a second press runs the same call with the mark already set, skips the signed-in check, re-reads `allAudioRows` fresh and removes every row (`store.ts:1030-1048`). True.
- "the next time it opens ... erases anything you add before then": `Root` calls `resumeEraseAtLaunch()` once per process before the lock and the gate read the store (`_layout.tsx:147`, `erase-everything.ts:124-141`); it runs `eraseEverythingLocal` again over every row then present, so a letter or typed note added after the failure goes too. True for a cold start. Note a return from the background does not run it (once per process), so "opens" means a cold start; the error is on the safe side (data stays longer, never shorter).
- The two new behaviour tests pass on the old source on purpose. I mutated the final source: launch resume ignoring the mark fails 5 tests including the "letter written after the failed erase" test; a second press refusing a pending erase fails 6 including "Try again now". So each half of the sentence is pinned.

### Gating and order
- `eraseNoteKeys` gives backups, onThisPhone, speechStays, then plusStays, then freeLetters (`wipe.logic.ts:56-64`); the page draws one `.map` in the muted style (`erase.tsx:97-102`), so drawn order is VoiceOver order. `usePlan()` is called before the early returns (hook order intact).
- `erasePlusLineShows` = not alpha, `showSubscriptionNotice` (not none, expired, revoked or refunded, and not known to be ending: `account-deletion/logic.ts:113-116`) and `ownership !== 'familyShared'`. `lib/billing/plan.logic.ts:115,270` maps any value except `familyShared` to `purchased` and ranks the person's own purchase above a shared one, so a person with both sees the line; `settings/plan.logic.ts:150,176` reads `familyShared` the same way. `PLUS_ALPHA` is true for the `preview` app env, which is what the `testflight` profile in `eas.json` sets, so tonight's TestFlight build shows neither the Plus line nor the free-letters line. Mutations on the final source: guard removed fails 1 test, alpha check removed fails 2.

### Merge of develop
- `git show --remerge-diff 80379343` is empty (no manual edit). Diff of the merge against e5609b78 equals develop's own diff cda0ba83..caba0215 exactly (8 files, `index` lines stripped); against caba0215 it is this PR's own files. #661 touches the speech row, the pack engine and `speech.en.ts` only; no erase path. DEVICE_TEST_PLAN has one S1-133 and one S1-97b, no conflict markers.
- `git merge-tree --write-tree origin/develop 366f8564` against current develop 1189fdff (which now also holds #616 and #652, 20 web and legal files, none in this PR) is clean.

### Ran at this head (apps/mobile unless noted)
- `erase-all` 51, `age-gate-erase` 3, `reminders-erase` 2, `billing-alpha` 16, `settings-p6b` 21, `settings-home` 10, `settings-back` 11, `settings-help` 16, `settings-plan-rows` 6, `children-settings` 12, `sync-erase` 4, `download-wait-line` 15, `plain-screen` 23: 13 files, 190 passed. `packages/content`: 12 files, 281 passed.
- Whole `apps/mobile` suite: 221 files, 4113 passed, 61 failed in 7 files (config 34, privacy-manifest 21, licences 2, app-lock-wiring, capabilities, hosting-ios17, preflight-production 1 each). On develop 1189fdff I ran the same seven files: 57 failed in config, privacy-manifest and licences (PluginError, `expo-local-authentication` cannot be resolved) and 4 in the other four: 61 again. The claim holds.
- `tsc --noEmit`: the 5 known errors only (`help-fallback.tsx:11` expo-clipboard; `app-lock/controller.ts:10,107,109,117`).
- New tests against ae39522a source (`erase.tsx`, `wipe.logic.ts`, `strings.en.ts` reverted, tests kept): 8 of 67 in `erase-all` and `billing-alpha` fail, as the body says.

### Earlier open items
- Sole-book Recently deleted after a cold start, and the failed-erase hazard (new letters after a failed erase are erased at the next launch): no code in this delta touches either; both are named as open, not blocking, in CCO-6. Follow-ups, not regressions. The new `failed` line is the only mitigation, and only where the page is still on screen.

### Notes
1. CCO-6 "Why" says "two counted reviews at the head, CI green" (RULINGS.md). At 366f8564 that is not yet true, so the founder's `## CCO approval at <sha>` line must go on the final head only after two counted reviews and green CI there. Edits to fix review findings change the head and the line.
2. "Billing continues through Apple until you cancel" is read during an unbilled free trial too; it is the same sentence as the Delete account card, so accepted, but worth a counsel glance.
3. The failed line is not a Try again button; the plan's "Not covered" says it cannot be shown on a phone. Tests read the page source, not a render.

### CI at this head
Success: typecheck, tests and content rules, database rules, edge functions, functions-deploy, B-8, web, web e2e, install, sizes, migrations unchanged, agent team, `required`. `compliance-fence`: failure plus a cancelled run (no approval line yet; expected). Still open when I looked: `e2e simulator app` in progress and one `store-profile Release launch` queued (the other is skipped). A PASS holds only once required CI and the store-profile Release launch are green at this exact head and the fence has its approval line.

### Not verified
Any device or simulator run; a render of the Erase page, the Plus line, or Apple reporting `familyShared` for every shared Plus (taken from `plan.logic.ts`); the Apple guideline quotes in CCO-6 (not fetched); the two unfinished CI jobs; counsel's reading of "We hold no copy" and "Nothing is sent anywhere".

Reviewer: independent of the author (CR-44).
