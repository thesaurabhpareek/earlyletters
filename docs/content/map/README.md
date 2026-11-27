# Content map

One row per customer-visible string in the checked-out tree, as `content-map.json` and `content-map.csv`. Built by
`scripts/content/export-content-map.mjs`; never edit the two files by hand. Owner: content.

## Read it
Columns: `id` (file#key path, or the prompt key), `surface` (app screen, error, push, email, store, site, book, prompt,
a11y, legal, safety), `channel`, `file`, `locale`, `text`, `chars` (code points), `hold` (`protected`, `held`, `build-dependent` or
empty) with `hold_reason`, `tone`, `day_id`, `layer` (filled only where the source object carries `tone`, `dayId` or `day`,
`layer` or `tradition`; none does yet), `owner` (content, cmo, clo, cco, privacy), `status` and `source`.

- `protected`: D-133 promise line, the D-061 privacy promise (`en.trust.promise` and every line that carries its last sentence), helpline names, numbers and instructions. Never reword without the owner.
- `held`: D-144 erase lines, consent text, App Review notes, counsel-header emails, Supabase templates (D-041), prompt keys,
  OS permission strings, price and trial.
- The `hold` column is a convenience for readers, not the lock list. `docs/reviews/2026-10-31/COUNSEL_LOCKED.md` stays authoritative for counsel-locked rows (including `story.private.v1`), and an empty `hold` here never means a line is free to edit: check that file first.
- `build-dependent` marks a line that is true only for one build: `servers off`
  (nothing leaves the phone) or `servers on` (letters sync); `hold_reason` says which. A row that is also protected or held keeps
  that hold and gains the same note in `hold_reason`. Named keys sit in `BUILD_KEYS`; any other line that says "our servers",
  "not sent to us" or "servers on/off" is found by pattern. Check the list when either build's wording changes.
- `status` is always `live on develop`: the map reads only the tree it runs in, so regenerate on a `develop` checkout. It
  knows nothing about open PRs.
- Surface, owner and hold are rules in the script (`classify`, `HELD`), not tags in the source. Check them when adding files.
- Placeholders stay as written (`{child}`, `${brand.name}`). A word whose hash is in the family-data guard test is written
  `[redacted]`, so the map never spells a real name.

## Regenerate and check
```
node scripts/content/export-content-map.mjs            # rewrite the two files
node scripts/content/export-content-map.mjs --check     # exit 1 if they are stale
node --test scripts/content/export-content-map.test.mjs # same check, plus sanity tests
```
Output is sorted and has no timestamps, so a clean regenerate gives an empty diff. Run it after the content waves merge, in
the same PR as any content change you want mapped.

CI: `scripts/content/export-content-map.test.mjs` is in the root `npm test` list (BL-1880), so a stale map fails the build.
Every content PR must regenerate the map.

## When two content PRs conflict in the map (BL-1992)
Since CR-242 (27 Nov 2026) the map has no `line` column and no counts in `meta`, and the JSON holds one row per line, like
the CSV. A line number moved whenever any string above it changed, and both files carried counts that every new row
changed, so every content PR conflicted with every other and each update voided its reviews. Rows are still in source
order, so a string is found by `file` and the key path in `id`. To count rows, use `countBy(map.rows, 'surface')` from the
script, or `jq '[.rows[].surface] | group_by(.) | map({(.[0]): length}) | add' docs/content/map/content-map.json`. Two PRs
that add or change different rows now merge without a conflict; the helper below is for the rarer case of the same or
neighbouring rows.

Choice: option (a) of the row, a helper script, with the files still committed. The two files are pure output, so a
conflict in them is noise and the only correct resolution is to regenerate. Cost: one command per rebase, run by the author.
Not chosen: (b) a CI step that commits the files needs a workflow change and a bot push to PR branches, which agents do not
make, and Karma owns merge-queue settings; (c) not committing the files would stop reviewers reading the map in the diff
and would need a CI generate step. If Karma wants (b) or (c) later, this helper stays useful for local rebases.

In the middle of the conflicted `git merge origin/develop` or `git rebase origin/develop`:
```
node scripts/content/merge-content-map.mjs
```
Fix every other conflicted file first; the helper refuses while any remain, because the generator would read conflict
markers. It takes either side of the two map files, regenerates them from the tree, and stages them. Then continue the
merge or rebase. Git can also merge the two files cleanly but wrongly; if the stale-map test fails after a clean merge, run
`node scripts/content/export-content-map.mjs`. After regenerating, the helper runs the generator's `--check` and stops
with an error if it fails. A modify/delete conflict on a map file (one side deleted it) also fails with an error from git,
because there is no side to take; restore or delete the file yourself, then run the helper. The stale-map test is unchanged and still fails on a stale map.

## Walked
`packages/content/src/**`, copy files under `apps/mobile/src` (most only re-export content, so they add few rows),
`apps/web/src/content`, `packages/emails/src/templates` (they read content, so they add none today),
`supabase/templates/*.html`, `docs/store/listing/listing.json`, `docs/store/screenshots/captions.json`,
`apps/mobile/store.config.json`, `docs/store/notes-for-review-1.0.txt`.

## Not covered
- Strings in `apps/web` outside `src/content` (page components, `app/**`), and in mobile screens that are not in a copy file.
- The help centre (PR #41) and any content on an open PR.
- Text baked into images: screenshots, store art, app icon, the Open Graph image.
- `docs/` prose (guide, policies, legal text) and the `supabase/templates/management-api.json` subjects.
- The DAY library and notification catalogue as design docs (`docs/design/notifications`); tags fill once they are in code.
- Lint blind spots: the map lists a string, it does not judge it. `npm run lint:copy` and `rules.test.ts` read the same
  files but miss tone, rhythm and lines assembled at run time. Short lowercase words with no space or punctuation, and
  strings outside an object or variable, are treated as identifiers and skipped. Computed text (`${...}`) is shown as written.
- Locale: English only; the script writes `en` for every row.
