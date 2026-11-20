## What and why

Write pinned its footer ("Add to Asha's book", "Keep private" and, in a store build, the standing Plus line from #668) under the page at every text size. From AX3 that footer can be taller than the room above the keyboard, so "Add to the book" could leave the screen with the keyboard open. Review and Tonight already move their footer into the scroll from accessibility sizes up (`footerPlacement`, `apps/mobile/src/lib/review-layout.logic.ts`). This makes Write use the same rule.

Council of 9 Nov 2026: design seat defect 2, design-systems finding 1 (`scratchpad/reviews/council-9nov/design.md`, `design-systems.md`).

- Default and larger sizes (below AX1): the footer is pinned under the page exactly as before (same classes).
- AX1 and up: the footer is the last thing in the scroll, after the page.
- **PROPOSED, the CPO and the founder to confirm:** the Plus line moves under the two buttons, so VoiceOver reads it last. This is the Chief Design Officer's verdict of 9 Nov; BL-560 and S1-142 had set it above them. It is a placement, not a word. If it is not confirmed, drop the reorder in `write.tsx` (`footer`) and the three pin lines it changed; the AX placement rule stands without it. The rule for when it shows (`plusLineShows`, `PLUS_ALPHA`, letters kept read once, never awaited) is untouched, and so is what the buttons do.
- One consequence that I handled: scrolling to the end of the content while typing would show the buttons and push the words being written out of sight. Inline, the page now rests at the end of the field instead (`pageEndOffset` in `review-view.logic.ts`, from the scroll's own size change). The pinned path is the same `scrollToEnd` as before. Nothing moves while the page opens (it waits until the content, the viewport and the footer are all measured).

No new words. No new copy, no new label, no new hint.

Overlap with open PRs: #701 and #703 also edit `write.tsx`, but only imports (`renderTemplate` to `fill`) and two `fill(...)` call sites; no hunk of mine is adjacent to theirs (my import is placed after `@/lib/motion`, three lines clear of theirs). `docs/qa/DEVICE_TEST_PLAN.md` is touched by many open PRs; my edits are at the one S1-142 and S1-165 anchor.

Step id: S1-165 is on neither develop nor any open PR (scanned the patches of all 149 open PRs on 9 Nov). S1-160 and S1-161 are proposed in #664 (NX-30 spec) and S1-180, S1-183 and S1-186 are reserved in #707, so I did not take them.

Device step: new **S1-165** (Write at AX3 and AX5 with the keyboard up, Plus line showing in a `production`-profile build, "Add to Asha's book" reachable, VoiceOver order). S1-142's order text is updated (the Plus line is under the buttons now; its AX5 sentence points to S1-165).

## How it was checked

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments)
- [ ] `npm run test:db` passes
- [x] `npm run typecheck` passes, including `apps/mobile` (`cd apps/mobile && npx tsc --noEmit`: only the known local errors, `expo-clipboard` and `expo-local-authentication` not installed)
- [x] New or changed tests name the requirement or rule they prove; no test was deleted or skipped without a reason here

What I ran: the whole `apps/mobile` suite (4310 tests; 61 fail, all in 7 files that need `expo config` and fail the same on a clean `origin/develop`: app-lock-wiring, capabilities, config, hosting-ios17, licences, preflight-production, privacy-manifest) and `packages/content` (367 pass). I did not run root `npm test` or `npm run test:db`.

New tests (11): `apps/mobile/test/write-footer-large-text.test.ts` (9: placement for every text size, the screen uses `footerPlacement`, footer defined once and drawn in one place at a time, pinned classes unchanged, Plus line last, no words of its own, the scroll follows the field when inline) and two in `src/components/capture/review-view.logic.test.ts` (`pageEndOffset`).

Proof they bite: with only `write.tsx` reverted to `origin/develop`, 11 tests fail (8 of the 9 new ones; the ninth, the placement rule for every text size, passes because `footerPlacement` already existed). The 3 that fail beyond the new file are existing pins I had to update, named here:
- `test/review-critics.test.ts` [S2] "Write's two destinations are stacked": the slice started at the old pinned `<View className="gap-1 border-t ...">`; it now starts at `const footer = (`. Same two-button regex.
- `test/write-plus-line.test.ts` "draws the line above the two destinations": now "under the two destinations (VoiceOver reads it last)", with the order reversed on purpose (book, private, Plus line).
- `test/review-write.test.ts` S19 "the page and both destinations sit above the keyboard": the pinned `scrollToEnd` line now begins `if (!inlineFooter && followCaretToEnd(...)`. Same call for the pinned footer.

Only a phone shows: how tall the footer is at AX3 and AX5 with the keyboard up (SE 3), that the first tap on "Add to Asha's book" keeps the letter with the keyboard up, and that the page follows the last line typed. All of that is S1-165.

## The constitution and our rules

- [x] No machine edit bypasses `verifyEdits`; nothing writes, rewrites, summarizes or "shapes" a person's words
- [x] If cleaning behaviour changed, `ENGINE_VERSION` is bumped with a dated comment (not changed: no cleaning behaviour)
- [x] Gates use `decide()` or `decideKeepLetter()` (untouched: the Keep step and the Plus line's rule are unchanged)
- [x] Copy lives in `packages/content` and a failing content rule was fixed in the copy, not the test (no copy added or changed)
- [x] No entry text, transcript, audio or child name in analytics, logs or crash reports
- [x] Tests and fixtures use the fictional family "Asha" only; no real family details anywhere
- [x] Database changes are a new migration file (none)
- [x] The public product name comes only from `packages/brand`

## Screenshots

n/a (no screenshot: Write at AX3 and AX5 is a founder device step, S1-165).

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF

---
_Generated by [Claude Code](https://claude.ai/code)_
