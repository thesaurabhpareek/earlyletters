## Review A at 57e368bd3e297a04c67e70288a2f90c4b01e7674: PASS WITH NOTES
<!-- agent:qa -->

Lens A: correctness and tests. Files: `apps/mobile/src/components/ui/toast.tsx`, `toast.logic.ts`, and the new `apps/mobile/test/toast-large-text.test.ts`. Two commits on `20553b18`: `b9da4136` (wip) and `57e368bd`.

Must fix: none.

### What I checked
- **Fails on develop, passes at the head.** I copied the new test into a worktree of `origin/develop` (`9bbe6003`). 4 of 4 fail: `toastLayout` is not a function, two source matches miss, and the order check finds no stacked branch. At the head, `toast-large-text.test.ts` passes 4 of 4 and `toast.test.ts` passes 7 of 7.
- **Mutations at the head.** I made five mutations and each failed at least one test:
  - `toastLayout` always returns `row`.
  - The threshold drops to xxxLarge (`isLargeText`).
  - Close moves before Undo.
  - The stacked wrapper is removed.
  - `numberOfLines` is added to the words.
- **Below AX1 nothing changes.** The row-branch box class is byte for byte the old string (`min-h-14 flex-row items-center gap-2 rounded-lg bg-foreground py-2 pl-5 pr-2`). The words keep `flex-1 py-1`. Below AX1 the controls render as a fragment, so the row's children are the same three nodes in the same order. The announcement, the timer (none while there is an action or a screen reader), swipe, replace and `onDismiss` are untouched. `toast.test.ts` and `invite-link.test.ts:491` (which reads the announce line in `toast.tsx`) pass.
- **VoiceOver order.** In both forms the order is the words, then Undo (when present), then Close. The stacked wrapper is a plain `View`: it is not `accessible` and has no role, so iOS reads through it in child order. The order is the same in reading position too: the words sit on top, and Undo sits left of Close. No regression.
- **Fit at AX5 on an SE 3.** Undo is 162 pt, Close 44 pt and the gap 8 pt, 214 pt in all. That fits in one row of the roughly 323 pt inside the toast's padding. `flex-wrap` covers a longer label. Both controls stay at 44 pt or more (`button.tsx:61`, `:198`).
- **Matches the spec in #867 section 5.4.** The words go full width, then one row at the end with Undo and Close. It switches at AX1 with the same threshold as `useIsAccessibilitySize` (`lib/a11y.logic.ts:16-18`).
- **Suite.** I ran the whole mobile suite at the head and on develop, each in a worktree with that tree's own `@scribe/*` packages. The failing files are the same on both sides, apart from load timeouts. Run alone at the head, these pass: `billing-alpha`, `decode-uri-component-shim`, `nightly-issue`, `lamp`. One `capabilities` test fails alone at the head and fails the same way alone on develop. This worktree's environment fails 12 files on both sides (expo config, the privacy manifest, the preflight). That is more than the sandbox baseline, but none of the 12 touch the toast.
- **Typecheck.** `tsc --noEmit` in apps/mobile gives the same 5 known errors at the head and on develop (expo-clipboard, expo-local-authentication). No new error.
- **Other.** The new `@/lib/a11y.logic` import in a `.logic.ts` file has a precedent (`components/book/book-page.logic.ts`), and the vitest alias resolves it. `components/book/undo-toast.tsx` draws `Toast` directly and gets the same layout. No new words, tokens or props. ASCII only.
- **CI at the head** (older than 10 minutes). Done and green: required, tests and content rules, typecheck, database rules, Deno, compliance-fence, install, migrations, B-8, native files changed. The iOS simulator build was skipped (no native change). One check is still queued at 12:12 UTC: "store-profile Release launch (testflight env, no seam, 20 s)". It waits for a `macos-26` runner (run 44727895310), behind a runner backlog that also holds 5 other PRs. It is not in `required`.

### Findings (most serious first)
1. **The store-profile Release launch has not run.** This is the only check that would start the JS bundle. The change is JS only, it typechecks, and `View` is imported. Even so, a launch crash in `Toast` would show only there or on a phone. Let it finish before merge.
2. **Tests 2 to 4 are source-text matches of exact class strings.** That follows the repo's pattern for Node-only tests (`write-footer-large-text.test.ts`). They prove the shape of the code, not the drawn layout, and they break on any reformat of those lines (`toast.tsx:135` is 171 characters). The order test fails on develop only because of the `{stacked ? <View` marker: develop's order was already words, Undo, Close. So it guards against regression and does not prove the fix. What proves R4 for the toast is X1 (#867 5.5: delete a letter, read the toast on the Book at AX5).
3. **The layout stacks from AX1, though the row fits up to about AX2.** This is deliberate (#867 section 2: one threshold for every switch). The cost is a taller toast at AX1 and AX2 that covers more of the Book above the tab bar. X1 should look at AX1 as well as AX5.

### Not verified
- No phone or simulator. I did not check the layout at AX1 or AX5, the toast's height over the tab bar, the VoiceOver order on a device, or swipe-to-dismiss on the taller stacked box.
- The store-profile Release launch, which is still queued.

Reviewer: independent of the author (CR-44).
