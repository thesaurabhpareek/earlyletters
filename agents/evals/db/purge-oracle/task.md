# Task: the erased-letter helper tells strangers who was erased

Working directory layout:
- `schema.sql`: the current storage rules for letter photos (a slice of the real schema). Applied already. Do not edit it.
- `migrations/`: add your change as ONE new `.sql` file (timestamp after 20261029000000).

Background. `public.photo_entry_is_purged(path)` is a security definer helper that the photo policies call. It is executable by every signed-in user and reads `public.purge_ledger` across all authors. Any signed-in person can pass it a path and learn whether that letter id was erased. Letter ids are unguessable, but "was this letter erased" is an answer a non-author should not get.

Your job. Make the helper answer `true` only to the author of the erased letter (the ledger has `author_id`). A stranger, a co-parent, or someone who puts their own id in the path's author folder must not get `true`.

Requirements:
1. The insert and rename policies keep blocking the author from storing a photo on an erased letter's path.
2. A photo for a letter that was not erased still uploads.
3. Keep `search_path` pinned to `pg_catalog, public, pg_temp` on anything you create or replace.
4. A new migration with a header comment: purpose and rollback. Fictional family "Asha" only.
