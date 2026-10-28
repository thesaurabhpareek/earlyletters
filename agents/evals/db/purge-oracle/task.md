# Task: the erased-letter helper tells strangers who was erased

Working directory layout:
- `schema.sql`: the current erasure records and storage rules for letter photos (a slice of the real schema). Applied already. Do not edit it.
- `migrations/`: add your change as ONE new `.sql` file (timestamp after 20261029000000).

Background. `public.photo_entry_is_purged(path)` is a security definer helper that the photo insert and update policies call. It is executable by every signed-in user and reads `public.purge_ledger` for every caller and every path. Any signed-in person can pass it a path, with any book and author folder, and learn whether that letter id was erased. Letter ids are unguessable, but "was this letter erased" is an answer a non-author should not get.

The records (all readable by definer code only):
- `public.purge_ledger(entity_type, entity_id, purged_at)`: ids of purged things. It has NO author column.
- `sync_private.entry_erasures(entry_id, child_id, author_id, erased_at)`: one row per erased letter, with its author.
- `public.held_drafts_gone(id, author_id, child_id, gone)`: `gone = 'erased'` marks an erased held draft, with its author.
- `sync_private.letter_id_taken(id, author)`: true when the id belongs to another author's letter, held draft, marker or erasure.

Your job. Make the helper answer `true` only to the author of the erased letter, and only for a path in the author's own folder (`{book}/{author}/{file}`). A stranger or a co-parent must get `false` for another author's erased letter, whichever folder they put in the path.

Requirements:
1. The insert and update (rename) policies keep blocking the author from storing a photo on an erased letter's path, including a letter erased as a held draft.
2. A photo for a letter that was not erased still uploads.
3. One person's erasure never refuses another person's upload: the co-parent may use that id as a file name in their own folder.
4. Keep `search_path` pinned to `pg_catalog, public, pg_temp` on anything you create or replace. Keep the helper unexecutable by `public` and `anon`.
5. A path with no uuid file name answers `false` and raises no error.
6. A new migration with a header comment: purpose and rollback. Fictional family "Asha" only.

Known residual (you may accept it and must say so in the header): an id that is only in `purge_ledger`, with no author trail anywhere (a restore replay of a letter the restored database never held), has no author to check. The grader does not fail either answer for that case; it only checks the author is still refused on upload.
