# Screenshot 7 (quiet day): findings

Status: findings only. No store text, caption or image was changed. Captions are a public promise (founder and counsel), so
any fix below is a proposal for them. Checked against `origin/develop` and the open wave C branch `fix/content-wave-c-push` (#1135), 21 Nov 2026.

## What I could not confirm

The caption and subline for frame 7 are word for word the same in all four places that hold them:

| File:line | Caption | Subline |
|---|---|---|
| `docs/store/app-store.md:91` | Quiet days are fine. | Tap Not much today. That is enough. |
| `docs/store/screenshots/captions.json:8` | same | same |
| `packages/content/src/store.en.ts:40` | same | same |
| `docs/store/screenshots/README.md:32` | same | same |

`apps/mobile/store.config.json` holds only the long description (it mentions "Not much today" once, consistent) and no screenshot
captions. The 1206x2622 and 1320x2868 `07-quiet-day.png` files carry the same headline and subline. So I found no
caption-versus-`app-store.md` text mismatch for frame 7 in the repo. I could not read the content programme note itself (it is a
project doc, not in the repo), so if it names a different pair of strings, that pair is not in these files.

## Mismatches that do exist around frame 7

1. **Describing column omits what the frame shows.** `docs/store/app-store.md:91` says the screen is `"A quiet day, kept." after Not much today`.
   `docs/store/screenshots/README.md:32` says `"A quiet day, kept." with Undo`. The PNG shows the line, the Undo link, the greeting
   "The house is quiet, Mama." and a draft card. `app-store.md` leaves out Undo. Low risk, but the two tables describe one image differently.
2. **The image bakes in in-app words that the copy lint flags.** The frame shows "A quiet day, kept." (source `packages/content/src/strings.en.ts:353`,
   also `:575`) and the greeting "The house is quiet, {name}." (`strings.en.ts:218`). The copy-tells lint (#1244) has a `slogan-kept` rule
   for lines ending in "kept." and baselines 4 hits in `strings.en.ts`. If wave C or a later pass rewords either line, the PNG becomes
   stale while `app-store.md:91` and `README.md:32` still quote the old words. Wave C (#1135) did replace the reminder variant
   "The house is quiet" (`reminders.en.ts:20`, `strings.en.ts:727` on develop) but left `strings.en.ts:218` and `:353` as they are.
3. **Row 1 and row 4 descriptions differ between the two tables** (same family of drift): `app-store.md:85` "Tonight at bedtime" vs `README.md:26` "Tonight at 9:10 pm";
   `app-store.md:88` "after Add to the book" vs `README.md:29` "after Add to Asha's book".
4. **Appearance label.** `app-store.md:91` says "dark"; `captions.json:8` says `bg: dusk`. Same thing in two vocabularies, not an error.

## Recommended fix (for founder and counsel to approve; not made here)

- Keep caption and subline as they are: no text conflict exists.
- Make `app-store.md:91` match `README.md:32` by adding "with Undo", and align rows 1 and 4 to the README wording (`app-store.md` is generated from
  `store.en.ts`, so change the generator or source first, then regenerate).
- Add a rule to the screenshot README: any change to `strings.en.ts:218`, `:353` or `:575` means frames 1 and 7 are recaptured before
  submission. A cheap guard is a test that fails when those strings change and the PNG hash in a small manifest does not.
- If the `slogan-kept` rule is to be cleared for `strings.en.ts:353`, decide the new line first, then recapture frame 7.
