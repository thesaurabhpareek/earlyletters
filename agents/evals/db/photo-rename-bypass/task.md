# Task: a rename must not get around the erased-letter block

Working directory layout:
- `schema.sql`: the current storage rules for letter photos (a slice of the real schema). Applied already. Do not edit it.
- `migrations/`: add your change here as ONE new `.sql` file (name it with a timestamp after 20261029000000). The repo never edits an applied migration.

Background. When a letter is erased, its id goes into `public.purge_ledger`. A photo must never be stored again under an erased letter's path. The insert policy `entry_photos_author_insert` enforces this with `photo_entry_is_purged(name)`.

Your job. A reviewer reports that the rule can still be broken without using an insert: an author can upload a photo under another name and then move it onto an erased letter's path. Close the gap.

Requirements:
1. The author must not be able to end up with an object at `{child}/{author}/{erased letter id}.jpg`, by insert or by rename.
2. Ordinary behaviour must keep working: uploading a photo, and renaming it to a path of a letter that was not erased.
3. Ship it as a new migration with a header comment that says its purpose and its rollback. Fictional family "Asha" only; no real data.
4. Do not change `photo_entry_is_purged` behaviour for other callers.

You are done when a probe that tries the rename as the book's author gets an error and the object is not at the erased path.
