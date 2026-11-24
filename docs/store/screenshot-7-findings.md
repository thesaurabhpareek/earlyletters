# Screenshot 7 (quiet day): findings

Status: findings only. No store text, caption or image was changed. Captions are a public promise, so any fix below is a proposal for the people who own the store text.
As read on `e5171dc1f` (develop), 23 Nov 2026. First written 21 Nov against develop and the then-open wave C branch (#1135); re-anchored and corrected on 23 Nov after two counted reviews found the 21 Nov line pointers and the central claim wrong. Line numbers drift: if develop has moved, find each one again by its quoted text.

## What holds

The caption and subline for frame 7 are word for word the same in all four places that hold them:

| File:line | Caption | Subline |
|---|---|---|
| `docs/store/app-store.md:99` | Quiet days are fine. | Tap Not much today. That is enough. |
| `docs/store/screenshots/captions.json:8` | same | same |
| `packages/content/src/store.en.ts:42` | same | same |
| `docs/store/screenshots/README.md:32` | same | same |

`apps/mobile/store.config.json` holds only the long description and no screenshot captions. So there is no caption-versus-`app-store.md` text mismatch for frame 7. I could not read the content programme note (a project doc, not in the repo).

## The screen text is stale (the central finding)

Frame 7's screenshot shows the in-app line "A quiet day, kept." (I opened `docs/store/screenshots/iphone-medium-1206x2622/07-quiet-day.png`; the `ios-6.9in` copy was not opened). The app no longer says that:

- `packages/content/src/strings.en.ts` has no "A quiet day, kept." On develop the line is `copy.notMuch.savedToast`, "Marked as a quiet day." (`strings.en.ts:360`; the book's accessibility label is `:598`, "{date}. Marked as a quiet day."). #1136 (merged 21 Nov, "capture and review copy, plain wording for toasts") changed it.
- The old words survive only in a code comment (`apps/mobile/src/components/tonight/quiet-day-inline.tsx:3`), in fixtures (`apps/mobile/test/lamp.test.ts:312` and `:382`, `apps/mobile/test/settings-p6b.test.ts:370-371`) and in `packages/content/WRITING-GUIDE.md:194`, which uses it as an example of a slogan rhythm to avoid.
- The current app text is asserted by `apps/mobile/e2e-web/j08-quiet-day.flow.ts:31` and `apps/mobile/test/draft-card.test.ts:351`.

What is now out of step with the app:

1. The frame 7 PNGs (`docs/store/screenshots/*/07-quiet-day.png`, last changed 1 Nov in #567) show words the app no longer displays.
2. The docs that describe the PNG quote the old line: `docs/store/app-store.md:99`, `docs/store/screenshots/README.md:32` and `docs/store/SCREENSHOT-COPY-AUDIT.md:42`.
3. The capture script waits for the old line: `docs/store/screenshots/tools/capture.mjs:119` does `getByText('A quiet day, kept.').waitFor()`. Run against the current app it cannot find that text, so frame 7 cannot be recaptured until the script is changed.

Frame 1 also shows the greeting "The house is quiet, Mama." That line is still `strings.en.ts:218` ("The house is quiet, {name}."), so frame 1 is not stale on that count.

## Other mismatches around frame 7

1. **Describing column omits what the frame shows.** `docs/store/app-store.md:99` says the screen is `"A quiet day, kept." after Not much today`; `docs/store/screenshots/README.md:32` says `"A quiet day, kept." with Undo`. The PNG shows the line and an Undo link. `app-store.md` leaves out Undo.
2. **Rows 1 and 4 differ between the two tables.** `app-store.md:93` (row 1) says "Tonight at bedtime" and `README.md:26` says "Tonight at 9:10 pm"; `app-store.md:96` (row 4) says "after Add to the book" and `README.md:29` says "after Add to Asha's book".
3. **Appearance label.** `app-store.md:99` says "dark"; `captions.json:8` says `bg: dusk`. Same thing in two vocabularies, not an error.

## The copy-tells baseline

The copy-tells lint (`scripts/content/copy-tells.mjs`, rule `slogan-kept`) carries a baseline of 4 hits in `strings.en.ts`, 1 in `site.en.ts` and 1 in `features/reminders.en.ts` (`packages/content/copy-tells-baseline.txt`). On 23 Nov `node scripts/content/copy-tells.mjs` reports no `slogan-kept` finding at all, so the baseline is looser than the code. I did not identify which lines the old baseline counted, and I did not change it (it may only shrink; that is a separate change). The earlier claim that #1135 replaced the reminder line is withdrawn: #1135 is closed and was not merged. I did not find "The house is quiet" in `packages/content/src/features/reminders.en.ts` on develop.

## Recommended fix (for the store text owners; not made here)

- Keep the caption and subline: no text conflict exists.
- Decide what frame 7 should show: recapture it from the current app (the line "Marked as a quiet day." with Undo), after `capture.mjs:119` waits for the current text. Until then the frame shows words the app does not use.
- Then change the describing text in `app-store.md:99`, `README.md:32` and `SCREENSHOT-COPY-AUDIT.md:42` to the new line. `app-store.md` is generated from `store.en.ts`, so change the generator or source first, then regenerate. Add "with Undo" while there, and align rows 1 and 4 to the README wording.
- Add a rule to the screenshot README: a change to the strings a frame shows (for frame 7 `strings.en.ts:360`, for frame 1 `:218`) means that frame is recaptured before submission. A cheap guard is a test that fails when those strings change and the PNG hash in a small manifest does not; the capture script's own wait on the old text is the failure that caught this one.
