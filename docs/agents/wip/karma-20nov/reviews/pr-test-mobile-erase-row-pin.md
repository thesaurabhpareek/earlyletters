## What and why

Follow-up to #520 (Delete this book / Erase everything on this phone). BL-387; F17 6.2 F; DATA-REQ-024.

Review A of #520 deleted the Erase everything row from `apps/mobile/src/app/settings/index.tsx` and 139 tests across settings-home, erase-all, billing-alpha, settings-back, settings-p6b and account-deletion-switch stayed green. Merging #614 had to re-add the row by hand. A silent drop would leave the feature unreachable while the store listing promises it.

This adds one small describe block to `apps/mobile/test/erase-all.test.ts`, next to the other source pins in that file. It reads `src/app/settings/index.tsx` and asserts:

- the row exists once: title `copy.settings.erase.rowLabel`, `variant="destructive"`, `testID="settings.erase"`, `onPress={go(ROUTES.erase)}`;
- it is the body of `localDeletionAllowed() ? ( ... ) : null` (only a phone that never signed in sees it), and `localDeletionAllowed` is imported from `@/lib/store`;
- it sits inside the Your letters group (between `h.sections.letters` and `h.sections.privacy`) and after the Storage row;
- `ROUTES.erase` is `'/settings/erase'` and `src/app/settings/erase.tsx` exists.

Two stale comments are fixed, comment text only, no behaviour and no assertion changed:

- `apps/mobile/src/lib/erase-everything.ts`: `Settings > Your data > Erase everything on this phone, after the typed confirm.` is now `Settings > Your letters > Erase everything on this phone, after the confirm alert.` The confirm is `Alert.alert(...)` in `erase.tsx` (`eraseConfirmDialog`), with no typed word.
- `apps/mobile/e2e-web/j16-settings.flow.ts`: the `step()` prose for the Settings screen listed the Your letters group without the Erase row. It now ends the group with "and, on a phone that has never signed in, Erase everything on this phone". `docs/qa/DEVICE_TEST_PLAN.md` already says this (S1-133, from #520), so no plan change is needed.

Based on the head of #520 (a28a64e2) so the row and the screen the test pins exist; it will be rebased onto `develop` once #520 merges.

## How it was checked

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments)
- [ ] `npm run test:db` passes
- [ ] `npm run typecheck` passes, including `apps/mobile`
- [x] New or changed tests name the requirement or rule they prove; no test was deleted or skipped without a reason here

What was run, in `apps/mobile`:

- `npx vitest run` on erase-all (55 tests, 4 new), settings-home, billing-alpha, settings-back, settings-p6b, account-deletion-switch, settings-plan-rows, settings-help, children-settings, app-lock-wiring, backup-gate, billing-f5-lines, early-version-note, hidden-books, where-live: all pass except `app-lock-wiring > NSFaceIDUsageDescription`, which fails the same way without this change (`expo-local-authentication` is not installed in this environment).
- `npx tsc --noEmit`: only the known environment errors (`expo-clipboard` in `help-fallback.tsx`; `expo-local-authentication` and what follows from it in `app-lock/controller.ts`). Nothing else.
- Mutation check on a scratch worktree (source edited, new tests kept, source restored with `git checkout` after each run). Every mutation fails the new block and nothing else, except the last, which also trips the existing erase-screen pins:
  - delete the whole row (Review A's mutation): 3 fail ("one row names the Erase everything label: expected 1 to have a length of 2")
  - remove the `localDeletionAllowed()` gate: 1 fails ("the row opens a localDeletionAllowed() branch")
  - drop `variant="destructive"`: 1 fails
  - drop `testID="settings.erase"`: 1 fails
  - change `ROUTES.erase` to `/settings/erase-all`: 1 fails
  - move the row into Privacy and security: 1 fails ("the Erase everything row is in the Your letters group")
  - move the row above Storage: 1 fails ("expected 977 to be greater than 1204")
  - remove `src/app/settings/erase.tsx`: the new route pin fails, with 6 existing erase-screen pins
- Added lines contain no byte at or above 0x80.

## The constitution and our rules

- [x] No machine edit bypasses `verifyEdits`; nothing writes, rewrites, summarizes or "shapes" a person's words (test and comments only)
- [x] If cleaning behaviour changed, `ENGINE_VERSION` is bumped with a dated comment (n/a: no behaviour changed)
- [x] Gates use `decide()` or `decideKeepLetter()` from `packages/core/src/plan.ts` (n/a: no gate touched)
- [x] Copy lives in `packages/content` and a failing content rule was fixed in the copy, not the test (n/a: no copy added or changed)
- [x] No entry text, transcript, audio or child name in analytics, logs or crash reports
- [x] Tests and fixtures use the fictional family "Asha" only; no real family details anywhere
- [x] Database changes are a new migration file; no applied migration was edited (n/a: none)
- [x] The public product name comes only from `packages/brand`

## Screenshots

n/a

## Also in this PR

`docs/BACKLOG.md`: BL-387 goes from `ready` to `done in code (PR #520, 73fcc1ea)`, and says the phone check (S1-133) is the founder's and has not been run. This is the "merge follow-up" D-144 promised: with BL-387 done, BL-775 and BL-781 are no longer blocked by it. `node scripts/agents/check.mjs` is consistent, `node --test scripts/agents/*.test.mjs scripts/trace.test.mjs` passes (136), `node scripts/trace.mjs --no-write` exits 0.

This branch is on top of develop at 73fcc1ea (#520 is merged): the pin commit (cherry-picked from the branch based on #520's head, `054cfa09`), the BL-387 commit, and a second docs commit after Review B. That commit corrects the BL-387 block to what #520 built (Delete this book is a 30-day hold, restorable; Erase everything sits in Your letters and uses a confirm alert; the journeys J03 and J16 and `store.repos.test.ts` were not extended), adds BL-782 for the device owner authentication that #520 defers to the 1 Dec build (its only repository record), and removes the stale 'waits for #520' sentences in the BL-775 to BL-781 rows and in D-144's follow-ups.

Generated with [Claude Code](https://claude.com/claude-code)
https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
