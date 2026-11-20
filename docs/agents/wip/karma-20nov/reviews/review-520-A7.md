## Review A at a28a64e26273ff9232e063d5bc6e3fd29b4fafc1: PASS WITH NOTES

PR #520, lens A (correctness and data safety) on the merge of develop 461b9645 (#614, Settings home regrouped) into 3ae9eab2. Head read from gh api: a28a64e2, parents 3ae9eab2 and 461b9645 (develop is still 461b9645 after a fresh fetch). I read it in a detached worktree (removed after). No must-fix. The merge is faithful; one gap in test cover (note 1) is worth a six-line fix.

### The merge, against both parents
- `git diff 461b9645 a28a64e2 -- apps/mobile/src/app/settings/index.tsx` is exactly three things: `localDeletionAllowed` added to the `@/lib/store` import, `erase: '/settings/erase'` in `ROUTES`, and the Erase row. The row is `localDeletionAllowed() ? <ListRow title={copy.settings.erase.rowLabel} variant="destructive" trailing="chevron" onPress={go(ROUTES.erase)} testID="settings.erase" /> : null`, the same gate, variant and testID as before. Nothing of #614 is lost.
- Files changed by the merge versus 3ae9eab2 in `apps/mobile` and `packages`: 42, which are develop's own 41 (merge base caba0215 to 461b9645) plus `erase.tsx`. For 39 of the 41 the diff is byte-identical to develop's own; `strings.en.ts` is identical on its changed lines (only hunk offsets differ); `index.tsx` is develop's version plus the three PR additions. `git show --remerge-diff` lists only `erase.tsx` (header comment: Your data to Your letters), `index.tsx` and `DEVICE_TEST_PLAN.md`.
- Against develop the PR's own file set is still 33 files (no develop-only file in it). The device plan: one S1-133, one S1-95, no conflict markers, 19 lines added and 1 changed against develop; S1-95 (a) now ends the Your letters list with "and, in red, last, Erase everything on this phone on a phone that has never signed in: PR #520, S1-133"; S1-133 (d), (k), (l) say Settings > Your letters.
- `git merge-tree --write-tree origin/develop a28a64e2` is clean and its tree (290e62a2) equals the head tree.

### The row's place and the #614 pins
- In `index.tsx` the Letters group reads Where your letters live, Export your book, Recently deleted, Backup (only in a build with it), Storage, then Erase everything on this phone, then the Privacy and security group. Drawn order is tree order, so VoiceOver reaches the red row last in its group, before the next group's heading. Same relative place as before the regroup (last row of the old data group).
- #614's own pin (`settings-home.test.ts:156-157`) takes the slice between `h.sections.letters` and `h.sections.privacy` and checks five rows with `toContain`; it does not pin an exact list, so the Erase row does not break it (14 tests pass). The e2e-web `j16-settings.flow.ts` asserts the group titles and testIDs, not a row count; "web e2e (Chromium)" is green at this head.

### Ran at this head (apps/mobile unless noted)
- Targeted, 17 files, 250 passed: `erase-all` 51, `age-gate-erase` 3, `reminders-erase` 2, `billing-alpha` 16, `settings-home` 14, `settings-p6b` 21, `settings-back` 11, `settings-help` 16, `settings-plan-rows` 6, `children-settings` 12, `sync-erase` 4, `download-wait-line` 15, `plain-screen` 23, `where-live` 12, `privacy-page` 10, `account-deletion-switch` 26, `qa-release-catalog` 8.
- Whole suite: 226 files, 4183 passed, 61 failed in the same 7 files as before (config 34, privacy-manifest 21, licences 2, app-lock-wiring, capabilities, hosting-ios17, preflight-production 1 each). `packages/content`: 13 files, 309 passed.
- `tsc --noEmit`: the 5 known errors (expo-clipboard; `app-lock/controller.ts` 10, 107, 109, 117).
- Added lines versus develop have no em or en dash, curly quote, ellipsis or emoji; the only non-ASCII hits are three box-drawing section rules in `store.ts` comments that predate this merge.

### Notes
1. Nothing pins the Erase row on Settings home, at this head or any earlier one. I deleted the row from `index.tsx` in a scratch copy: `settings-home`, `erase-all`, `billing-alpha`, `settings-back`, `settings-p6b` and `account-deletion-switch` all stayed green (139 tests). This merge had to re-add it by hand, and the PR will meet more settings conflicts; a dropped row leaves the feature unreachable while the store listing promises "delete everything, any time, from Settings" (CCO-6). Suggested pin in `settings-home.test.ts`: the Erase row sits in the slice between `h.sections.letters` and `h.sections.privacy`, after `h.storageLabel`, gated by `localDeletionAllowed()`, `variant="destructive"`, testID `settings.erase`.
2. `e2e-web/j16-settings.flow.ts:33` (the `step()` prose) lists "Your letters (Where your letters live, Export your book, Recently deleted, Storage)" with no Erase row. It is journey text, not an assertion, and does not fail; on a signed-out phone the row shows, so the prose is incomplete. Not verified whether the web preview shows the row.
3. `lib/erase-everything.ts:88` still says "Settings > Your data > Erase everything on this phone, after the typed confirm" (both halves stale: the group is Your letters, and there is no typed confirm). Comment only.
4. Not verified: the row's place against the design record. `settings-ia.md` and `design.md` are Project documents, not in the repository; `EXPERIENCE_PASS_2026-10.md:1637` only says Erase takes the Recently deleted page's layout.

### CI at this head
Success: `required`, typecheck, tests and content rules, database rules, edge functions, functions-deploy, B-8, web (typecheck, test, build), web e2e, install, sizes, migrations unchanged, native files changed, agent team consistent. Queued when I looked: `e2e simulator app` and one `store-profile Release launch` (the other is skipped). `compliance-fence`: failure plus a cancelled run (no approval line yet; expected). A PASS holds only once the store-profile Release launch is green at this exact head and the fence has its approval line.

### Not verified
Any device or simulator run; the two queued CI jobs; the web preview showing the Erase row; the design record; counsel's reading of the absolutes and Terms 8.1.

Reviewer: independent of the author (CR-44).
