## What and why

Delete this book has two steps on one screen (`settings/children/delete-book.tsx`). Continue swaps step 1 for step 2 under the same page title and the same heading text. Nothing moved accessibility focus, so VoiceOver stayed on a Continue button that was gone, and the dimmed "Delete the book" said nothing about what turns it on (design-systems audit of 9 Nov 2026, row 5).

- **Focus.** When step 2 appears, accessibility focus moves to its title ("Delete the whole book?", a heading) with `useFocusOnMount`, the same hook and the same shape account deletion's step 2 already uses (`delete-account.tsx`, `useFocusOnMount(confirmHeading, step === 'confirm', step)`). Reading on from the title reaches the body and the "Type delete to confirm" field. No separate announcement is added: focus landing on the title is what makes VoiceOver read it, and an announcement on top would say it twice. The hook sits above the screen's early `return null`, so the order of hooks never changes.
- **Hint.** Until the typed word matches, the dimmed confirm button carries the hint "Type delete to confirm", through a small pure rule, `confirmHint(ready, text)` in `components/settings/wipe.logic.ts`. Once the word matches there is no hint. VoiceOver reads: "Delete the book, dimmed, button. Type delete to confirm."

**No new words in this PR; the one alternative below is not built.** The hint is the string `settings.delete.bookTypeToConfirmLabel` ("Type delete to confirm"), which the field right above the button already shows. I chose to reuse it because the task said to add a string only if a hint needs one, and this one says what to do to turn the button on. If the founder would rather the hint say it as a reason ("Turns on when you type delete above"), that is a one-sentence content change that I did not make; it would be new wording for approval. **PROPOSED WORDING (not built, only if the founder prefers it):** "Turns on when you type delete above".

Left alone on purpose: both steps use the same title ("Delete the whole book?"). Moving focus to a title that reads the same as step 1 is what the audit asked for, and it re-anchors VoiceOver at the top of the new page. Whether step 2 should have its own heading is a design and copy question, not a code fix. The same disabled-confirm pattern on account deletion has no hint either; that is a separate screen and a separate PR.

Device plan: S1-133 (a) now says what VoiceOver must read when step 2 appears and on the dimmed button.

## How it was checked

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments)
- [ ] `npm run test:db` passes
- [ ] `npm run typecheck` passes, including `apps/mobile`
- [x] New or changed tests name the requirement or rule they prove; no test was deleted or skipped without a reason here

Run in a worktree on origin/develop at 6cd2223b:

- New: `test/delete-book-step2-a11y.test.ts`, 7 tests, all pass: the hint is the existing string while the word is not typed and absent once it matches (the same rule as the button, for "", "delet", "Asha", "delete" and " Delete "); and source pins that the screen imports and calls `useFocusOnMount(confirmTitle, step === 'confirm', step)`, that the ref is on step 2's heading and not step 1's, that the hook is above the early return, that the button gets `confirmHint(ready, d.bookTypeToConfirmLabel)` and keeps its label, disabled state and press, and that there is no `autoFocus` (it would take focus from the title) and no extra announcement.
- With only the screen reverted to develop (new tests kept): 3 tests fail. Hook moved below the early return: 1 fails. `confirmHint` made to always return nothing: 2 fail. Ref taken off the title: 1 fails. Each restored. `erase-all.test.ts` (55, which runs Delete this book against a real store) passes.
- Full `apps/mobile` vitest: 4245 pass, 61 fail, in the same 7 files as an unchanged origin/develop (config, privacy-manifest, app-lock-wiring, capabilities, hosting-ios17, licences, preflight-production: they need `expo-local-authentication` and a generated licences file that this environment lacks; the same 7 files give the same 61 on an unchanged develop worktree). `tsc --noEmit` in `apps/mobile`: only the known missing `expo-clipboard` and `expo-local-authentication` errors (5).
- Not run: the other workspaces, `test:db`, the root typecheck (this PR changes one screen, one pure rule and one doc).
- Only a phone shows that focus really moves and what VoiceOver reads: S1-133 (a). The 350 ms delay in `useFocusOnMount` is the app's existing one.

## The constitution and our rules

- [x] No machine edit bypasses `verifyEdits`; nothing writes, rewrites, summarizes or "shapes" a person's words
- [x] If cleaning behaviour changed, `ENGINE_VERSION` is bumped with a dated comment (not applicable: no cleaning change)
- [x] Gates use `decide()` or `decideKeepLetter()` from `packages/core/src/plan.ts`; read, play, export, delete, restore and family authorship stay ungated, and capturing and typing never are: only the Keep step of a letter is (D-082) (not applicable: no gate touched)
- [x] Copy lives in `packages/content` and a failing content rule was fixed in the copy, not the test (no new copy)
- [x] No entry text, transcript, audio or child name in analytics, logs or crash reports
- [x] Tests and fixtures use the fictional family "Asha" only; no real family details anywhere
- [x] Database changes are a new migration file; no applied migration was edited (not applicable: no database change)
- [x] The public product name comes only from `packages/brand`

## Screenshots

n/a (nothing new is drawn; a device check with VoiceOver is S1-133 (a) in `docs/qa/DEVICE_TEST_PLAN.md`)

Generated with [Claude Code](https://claude.com/claude-code)
https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
