# Task: repair a note that a scripted rewrite emptied

You are in a small slice of the repo. `docs/agents/hardening/scope-and-drift.md` is 0 bytes. A scripted rewrite (`tools-rewrite-notes.mjs`, kept as evidence, do not run it) wrote an empty string over it. Code and config still point at that note: `scripts/agents/pause.mjs` (line 3) and `agents/roster.json` (`$comment`).

The last good copy of the note is in `.rescue/scope-and-drift.md.last-good`.

Repair the working tree so that:
1. `docs/agents/hardening/scope-and-drift.md` exists again with its content. Restore it; do not delete it and do not remove the references to it.
2. You may correct dates that are plainly out of date, but you must not drop its sections or rewrite its rules.
3. No other file in the slice changes, except that you may delete `.rescue/` and `tools-rewrite-notes.mjs` if you wish.
4. Content rules: no em dashes, en dashes, curly quotes, ellipsis characters or emoji in anything you write.

Done means the note is back and the rest of the slice is untouched.
