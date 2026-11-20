## Review A at 73a5556c994632fb156a405ed1754c9b26ad1916: PASS WITH NOTES
<!-- agent:qa -->

Lens A: correctness, and tests that fail on the old code. BL-928 slice (c): Review's fix row and the NS-33-R4 code scan. Built from the spec on `docs/design-bl-927-ns33-floor` (#867), sections 1, 5.1 and 5.2, and the locked card NS-33 at 450bcb4a (`docs/product/prd/11-foundations.md:265`).

Must fix: none.

### What I checked
- Head 73a5556c, committed 11:49 UTC on 20 Nov, more than 10 minutes old at review (12:29). Read live; it did not move.
- CI at the head: `required`, `tests and content rules`, `typecheck`, `database rules`, `edge functions`, `compliance-fence`, `install` and the rest completed with success. One duplicate `compliance-fence` run was cancelled; its sibling succeeded. The iOS simulator build was skipped. `store-profile Release launch` was still queued at 12:29; it is not part of `required`.
- The fix row (`app/review.tsx:1206-1255`, function at :1212) at every size:
  - It is still one `Pressable` (`:1228`).
  - `accessibilityRole="button"` (:1230), the label `detail ? \`${label}, ${detail}\` : label`, the hint `pendingCopy.review.editA11yHint` (:1232), `accessibilityState={{ expanded: open }}` and `testID="review.fixRow"` are unchanged lines.
  - Both className branches keep `min-h-12`, which is 48 pt (:1235).
- Below accessibility sizes nothing changes. I compared the unstacked branch with develop element by element:
  - the Pressable class string is the same;
  - the label `Text` is the same;
  - the detail `Text` is the same: `footnote`, `flex-1`, `numberOfLines={1}`, and the same strike style;
  - the chevron is the same.
  The only addition is a `useIsAccessibilitySize()` call. Review's view control already uses that hook (:1170), and `View` and the hook were already imported (:52, :166).
- At accessibility sizes, the row stacks:
  - the label (`flex-1`) and the chevron share the first line;
  - the detail follows with no line limit, still struck through where it was;
  - a `mark` row (empty detail) draws no empty line.
- Red on the old code. I copied `a11y-ax5.test.ts` onto a develop worktree (2f2beb77; no `apps/mobile` drift from the merge base bc425d2f):
  - `[NS-33-R4] no text on the four screens is cut at accessibility sizes` fails with exactly one finding, `app/review.tsx: numberOfLines={1}` (develop :1224, as spec 5.2 predicts).
  - The fix-row test fails too.
  - The scan-reach test and the 44 pt guard pass on develop, as the spec says they should.
  - At the head, 4 of 4 pass.
- The scan reaches 46 files: the four routes and 42 `@/components/` imports. Outside those, the only `numberOfLines` that is not size-gated in `src` is `components/ui/textarea.tsx`, which none of the four screens imports. So the R4 scan is not empty and not trivially green.
- Mutations on a copy of the head (a11y-ax5, review-write, review-critics):
  - Killed: `numberOfLines={stacked ? 2 : 1}`; the inverted `stacked ? 1 : undefined`; `numberOfLines={undefined}` at every size, which would change below AX; `numberOfLines={1}` on the stacked label.
  - Survived: see notes 1 to 3.
- Full `apps/mobile` suite at the head, with the worktree's own packages: 8 files and 73 tests fail. They are the known sandbox baseline, the same 8 files and 73 tests as on develop. The head has 4 more tests than develop (5096 against 5092), all passing.
- `npm run typecheck`: the 5 known mobile errors. Also one more in `test/qr.test.ts` (`qrcode-generator` is not installed in this sandbox). That file is not touched here.
- Cites held: 8 of 8.
  - Develop: `review.tsx:1219-1228` and `:1224`; `:1212-1217` (the a11y props); the hook at `:1170`; `lib/a11y.ts` exporting `useIsAccessibilitySize`.
  - Other PRs: #838 at 632 and #839 at 967 (both also have a hunk at 127, which the body omits; this PR does not touch that area).
  - The test file: `design-system-gaps.test.ts` named as the Button minimum pin.
- Merges: auto-merges cleanly with #892, and with `review.tsx` of #838 and #839.

### Findings
1. Note. The test "Review keeps the whole fix row one button at every size" has a comment that promises "the same label, hint and state". It asserts the label, the state and `min-h-12`, but not the hint or the button role. Removing `accessibilityHint` (:1232) or `accessibilityRole="button"` (:1230) passes every Review test (a11y-ax5, review-write, review-critics). The code is right today. The PR body says only "label, state and min-h-12", so the body is honest; the test comment is not. Add two lines:
   - `expect(row).toMatch(/accessibilityHint=\{pendingCopy\.review\.editA11yHint\}/)`
   - `expect(row).toMatch(/accessibilityRole="button"/)`
2. Note. Nothing proves the stacked branch shows the words. Replacing `{detail ? words : null}` (:1244) with `{null}` passes all tests. The parent's words would then be missing on screen at AX sizes and present only in the VoiceOver label, which is the opposite of R4's intent. Suggest asserting that the stacked branch renders `words` when there is a detail.
3. Note. `min-h-12` is matched once anywhere in the row. Dropping it from the stacked class only (:1235) passes. Suggest asserting both branches of the class string carry `min-h-12`.
4. Note, for the cut and not for this PR. The card row R4 is still open for the Book's inline bar (BL-928 (d), after #798) and the toast (#877). The PR says "Review's part", and the scan passes on `book.tsx` because a width failure is not visible in code. Do not let `[NS-33-R4]` tests passing in `npm test` read as R4 done in TRACE; the device row `[NS-33-R4] AX5 on SE 3` (X1) is the proof.

### Not verified
- X1 at AX5 on an SE 3. It needs a phone to show the detail wrapping whole, the chevron staying beside the label, and the row staying one VoiceOver element.
- Rendering. These are source-text tests; nothing here loads React Native.

Reviewer: independent of the author (CR-44).
