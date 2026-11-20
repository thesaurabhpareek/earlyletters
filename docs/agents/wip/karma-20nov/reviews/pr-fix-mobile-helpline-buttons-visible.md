## What and why

On "If you are struggling" and "Lines in other countries" the Call and Text buttons were `secondary` buttons (an accentSoft fill) on a flat card (the `muted` surface). Fill against card is 1.08:1 in light and 1.33:1 in dark (found in the design-systems review of 9 Nov 2026, which is not in the repository; the numbers are #F1E6DC on #F5EFE7 and #3A2E25 on #1B1917, and I recomputed them from the tokens), so the shape of the button disappeared on the page people open on their worst nights. The label was never the problem (it is the text colour, 12.98:1 light and 14.94:1 dark on the card), but a button you cannot see the edge of is not a button (WCAG 1.4.11 Non-text Contrast, 3:1).

**The change is one prop:** `HelplineCard` draws Call and Text as `variant="outline"` instead of `variant="secondary"`. All words, VoiceOver labels and hints, the `tel:` and `sms:` targets, the test ids and the press handler are unchanged.

**Token chosen: `input`, which is the `controlBorder` colour** (Button's `outline` is `border border-input bg-transparent`, label in `foreground`).

- On the card's surface it is 3.36:1 in light and 4.27:1 in dark. With Increase Contrast it becomes ink (light) or paper (dark), well above that.
- It is the token the design system already names for "the boundary of a control" (build-css.ts: `input` maps to controlBorder, 3:1 by design), so it needs no new colour, no hex literal and no change in `theme-leaks.test.ts`.
- Why outline and not the primary fill (the audit offered both): there are many cards on these pages (the other-countries page lists every line we hold, with Call on each and Text where the line has a text number). If every Call were a filled accent button, the emergency button at the top ("Call 911") would no longer be the one filled button on the page, and the quietest page in the app would become loud. Outline keeps one clear primary action on the page and gives each line two equal, visible, quiet buttons.
- The label colour does not change: it was already the text colour (`secondary-foreground` maps to `text`), 12.98:1 light and 14.94:1 dark on the card.
- The emergency button stays the one filled button on "If you are struggling". "Lines in other countries" has no emergency button, so it has no filled button.
- Size is not touched: `sm` is 44 pt and `md` (48 pt) would not reach the 56 pt rule in DESIGN_LANGUAGE principle 2 either. Proposed backlog row for `product` to number (not added here): decide the Call and Text button size for the crisis page with the CDesO. Changing size in this PR would make S1-150 (g) impossible to attribute.

Not changed, same weakness elsewhere: the "Read together" button on the Book's cover band (audit row 4 names it). That is a separate surface and a separate decision, so it is not in this PR.

Device plan: S1-150 gains step (g): look at Call and Text in light and dark, then with Increase Contrast on in dark and in light, on the main page and on Lines in other countries. No new step id. Only a phone shows whether the outline alone carries the cue now that the label is not accent-coloured (it never was).

## How it was checked

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments)
- [ ] `npm run test:db` passes
- [ ] `npm run typecheck` passes, including `apps/mobile`
- [x] New or changed tests name the requirement or rule they prove; no test was deleted or skipped without a reason here

Run in a worktree on origin/develop at 6cd2223b:

- New: `test/helpline-buttons-visible.test.ts`, 10 tests, all pass (the tenth, added after review, pins the line in `provider.tsx` that applies the high-contrast control border; with that line deleted it fails). It reads the real class names from `card.tsx` and `button.tsx` and the token mapping from `packages/design-tokens/src/build-css.ts`, so a change to the card's tone or to the outline's edge fails it. It proves: the card is flat (`bg-muted`); the old pair (secondary on the card) is 1.08:1 and 1.33:1; the variant the card uses draws a fill or an edge of at least 3:1 in light, dark and Increase Contrast (outline: 3.36 and 4.27); the label is at least 4.5:1; the card uses `outline` and nothing on it or on either page is `secondary`; no colour literal on the card; and the labels, hints, press, test ids, and the `tel:` and `sms:` targets of every held line are unchanged.
- Reverting only `helpline-card.tsx` to `secondary` (new test kept): 2 tests fail (the 3:1 shape test and the choice pin). Making the card `primary` instead: the choice pin fails, so the pin holds the outline decision. Changing the card tone or the outline edge token: 3 and 1 tests fail. Each restored.
- Related groups pass: `settings-help` (17), `struggling-regions` (22), `theme-leaks` (4), `qa-release-catalog` (8).
- Full `apps/mobile` vitest (run before the tenth test was added; not re-run at this head): 4247 pass, 61 fail, in the same 7 files as an unchanged origin/develop (config, privacy-manifest, app-lock-wiring, capabilities, hosting-ios17, licences, preflight-production: they need `expo-local-authentication` and a generated licences file that this environment lacks; I ran the same 7 files on an unchanged develop worktree: the same 61). `tsc --noEmit` in `apps/mobile`: only the known missing `expo-clipboard` and `expo-local-authentication` errors (5).
- Not run: the other workspaces, `test:db`, the root typecheck (this PR changes one component and one doc).
- Only a phone shows how the outline looks: S1-150 (g), in light, dark and Increase Contrast.

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

n/a here (a device check in light, dark and Increase Contrast is S1-150 (g) in `docs/qa/DEVICE_TEST_PLAN.md`)

Generated with [Claude Code](https://claude.com/claude-code)
https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
