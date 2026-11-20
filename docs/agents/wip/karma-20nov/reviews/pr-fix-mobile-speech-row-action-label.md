## What and why

The word a tap does on the language row (Stop, Download, Remove) was hidden from VoiceOver and was not in the row's label. It lived only in the hint. So Voice Control could not say "Tap Stop" (WCAG 2.5.3, Label in Name), and VoiceOver with hints off never learned that a tap stops a download. This is the Stop that #661 added. The design systems audit of 9 Nov names it rows 2 and 3 (high); this branch is the "Mine" fix the audit asked for, done by `mobile` because it also touches `speech-row.tsx`.

- `ListRow` takes an `actionWord`. The label becomes the title, the subtitle, the value, then the action word: "English, Getting ready, 40%, Stop". The rule is a pure function, `rowLabel` in `components/ui/list-row.logic.ts`. A row nothing can press, or a disabled one, names no action. The hint is kept unchanged and is not repeated in the label.
- `SpeechRow` passes the word it already draws (`row.trailing`) as the `actionWord`. The visible word and the ring stay hidden from VoiceOver by their own wrappers, so the word is read once, in the label.
- A trailing node (the ring and the word) now stacks under the title block at accessibility text sizes, inside the same column a string value uses. Before, only a string value moved; a node stayed right of a `flex-1` title and "Download" (about 200 pt at AX5) sat beside "English". The choice is a pure function, `trailingNodePlacement` (`none`, `beside`, `under`). The speech row is the only `ListRow` that passes a node, so no other row changes.
- No new words. The strings are the ones the row already used (`packsCopy.stopButton`, `speechSettingsCopy.downloadButton` and `confirmButton`, and the three hints).
- `components/ui/list-row.tsx` is a `design-systems` file. The task named it, and the change is small and additive (one optional prop, one new placement); other `ListRow` callers get the same label and layout as before. Please have `design-systems` look at it.
- Device plan: S1-97b gains step (e) (AX5 layout and Voice Control "Tap Stop"), its Needs, Record and the (d) expected line now say the label ends with the action word; S1-31's VoiceOver line says the same. No new step id.

## How it was checked

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments)
- [ ] `npm run test:db` passes
- [ ] `npm run typecheck` passes, including `apps/mobile`
- [x] New or changed tests name the requirement or rule they prove; no test was deleted or skipped without a reason here

Run in a worktree on origin/develop at 6cd2223b:

- New: `src/components/ui/list-row.logic.test.ts` (+6 tests, 18 in the file: the label with and without an action word, not pressable, disabled, empty parts; the placement beside, under, none) and `test/speech-row-action-label.test.ts` (9 tests: the label for each of the six speech row states, the word equals the word on the row and is an existing string, the hint is kept and not repeated, and source pins for `SpeechRow`, both label branches of `ListRow`, and the AX stacking). 27 pass.
- Reverting only the two `.tsx` files (keeping the new tests): 3 source-pin tests fail (`SpeechRow` passes the action word, `ListRow` builds both labels with `rowLabel`, `ListRow` stacks the node); restored, all pass. Making `rowLabel` drop the action word: 5 tests fail. Making `trailingNodePlacement` always return `beside`: 1 test fails. Each restored.
- Related groups pass: `settings-p6b` (including the existing `onPress` pin on the speech row), `download-wait-line`, `where-live`, `speech-consent`, `theme-leaks`, `qa-release-catalog`.
- Full `apps/mobile` vitest: 4253 pass, 61 fail, all in the same 7 files (config, privacy-manifest, app-lock-wiring, capabilities, hosting-ios17, licences, preflight-production). I ran those 7 files on an unchanged origin/develop worktree too: the same 61 failures (they need `expo-local-authentication` and a generated licences file that this environment lacks). `tsc --noEmit` in `apps/mobile` shows only the known missing `expo-clipboard` and `expo-local-authentication` errors (5).
- Not run: the other workspaces, `test:db`, the root typecheck (this PR changes only `apps/mobile` and one doc).
- Only a phone shows: whether Voice Control offers "Tap Stop" on this label, what VoiceOver says, and how the ring and word sit at AX5. That is S1-97b (d) and (e).

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

n/a (the label is read, not seen; the AX5 layout is checked on a phone in S1-97b (e) in `docs/qa/DEVICE_TEST_PLAN.md`)

Generated with [Claude Code](https://claude.com/claude-code)
https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
