# Task: the erased-letter path check only knows one file name shape

Working directory layout:
- `schema.sql`: the current storage rules for letter photos (a slice of the real schema). Applied already. Do not edit it.
- `migrations/`: add your change as ONE new `.sql` file (timestamp after 20261029000000).

Background. When a letter is erased its id goes into `public.purge_ledger`, and a photo must never be stored under that letter again. Both the insert and the update (rename) policies call `photo_entry_is_purged(name)`. A reviewer found that function recognises only the exact shape `{child}/{author}/{uuid}.{ext}`.

Your job. Make the rule hold for any object path that carries an erased letter's id under the author's own folder, for example `{id}.x.jpg`, `{id}` with no extension, `{id}-1.jpg`, and `sub/{id}.jpg`. Cover both upload and rename. You may fix the helper, the policies, or both.

Requirements:
1. None of those shapes may be stored by insert or reached by rename.
2. A photo for a letter that was not erased still uploads, using the normal `{child}/{author}/{uuid}.jpg` shape.
3. A new migration with a header comment: purpose and rollback. Fictional family "Asha" only.
4. If your fix adds a query that runs on every upload, say in a comment what you measured, or write `not-measured`.
