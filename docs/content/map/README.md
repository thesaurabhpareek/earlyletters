# Content map

One row per customer-visible string in the checked-out tree, as `content-map.json` and `content-map.csv`. Built by
`scripts/content/export-content-map.mjs`; never edit the two files by hand. Owner: content.

## Read it
Columns: `id` (file#key path, or the prompt key), `surface` (app screen, error, push, email, store, site, book, prompt,
a11y, legal, safety), `channel`, `file`, `line`, `locale`, `text`, `chars` (code points), `hold` (`protected`, `held`, `build-dependent` or
empty) with `hold_reason`, `tone`, `day_id`, `layer` (filled only where the source object carries `tone`, `dayId` or `day`,
`layer` or `tradition`; none does yet), `owner` (content, cmo, clo, cco, privacy), `status` and `source`.

- `protected`: D-133 promise line, the D-061 privacy promise (`en.trust.promise` and every line that carries its last sentence), helpline names, numbers and instructions. Never reword without the owner.
- `held`: D-144 erase lines, consent text, App Review notes, counsel-header emails, Supabase templates (D-041), prompt keys,
  OS permission strings, price and trial.
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

Wiring (proposal; root `package.json` is founder-listed): add `"content:map": "node scripts/content/export-content-map.mjs"`
and add `scripts/content/export-content-map.test.mjs` to the root `test` node:test list. Until then the check runs by hand.
Once wired, every content PR must regenerate the map.

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
