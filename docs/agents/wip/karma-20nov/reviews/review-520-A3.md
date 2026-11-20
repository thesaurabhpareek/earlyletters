## Review A at ae39522a255a93f4db3d961fddb8c28541534ee1: PASS

PR #520, delta re-review (lens A) of one commit on 8a8db627, my last Review A head. Head read from gh api (ae39522a, one parent 8a8db627; `git rev-list --count 8a8db627..ae39522a` is 1). I read the diff and ran the checks below in a detached worktree at this sha. No must-fix.

### The delta is docs and comments only
- `git diff --stat 8a8db627 ae39522a`: exactly 3 files, 8 lines added and 6 removed: `apps/mobile/src/lib/README.md` (1 line), `apps/mobile/src/lib/db/repos/wipe.ts` (header comment, lines 7 to 15), `docs/qa/DEVICE_TEST_PLAN.md` (2 lines, S1-133 Needs and step (k)). No file under `apps/mobile/test`, `packages`, `scripts` or `supabase` changed.
- No behaviour change in `wipe.ts`: I stripped block and whole-line comments from both revisions and compared what is left: 91 lines each, identical. The hunk sits inside the file's opening comment block, above `import`.
- Trial merge: `git merge-tree --write-tree origin/develop ae39522a` is clean (origin/develop is still cda0ba83) and its tree 58fef8b7 equals the head's tree.
- Byte check of the 8 added lines: 0 em or en dashes, curly quotes, ellipsis characters or emoji; 0 non-ASCII characters; no carriage returns. (The one " - " hit is the list bullet before "(k)".)

### The L3 reasoning, against DATA_CLASSIFICATION.md at this sha
- Rule 1 (section 1.1): "Highest wins. A column, file or event property takes the highest level of anything it can contain." Rule 5: "Book and letter ids are L3 (`children.id`, `entries.id` and every `child_id`)". The keys `book.deletedAt.<child id>` and `book.erasing.<child id>` contain a book id (`wipe.ts:21-22, 42, 59`: key is prefix plus `children.id`), the value is an L2 time, so the row is L3. The new comments cite the right rules, in the right order.
- Precedent in 4.5, line 710: `readTogether.sessions.<book id>` is listed L2 with the note "the key holds a book id (L3), so the row is handled as L3". `speech.letterLanguage.<letter id>` (line 705) follows the same pattern at L4. The README's "like `readTogether.sessions.<book id>`" is accurate. The PR labels the two rows L3 outright instead of "L2, handled as L3"; the handling is the same.
- `erase.everything.pending` stays L2: a time under a fixed key (system timestamp, section 1 L2 definition). Right.
- The L3 handling rules (section 2: no log streams, never analytics, device sandbox only) hold. I grepped all of `apps`, `packages` and `supabase` at this sha for the three key names and their constants: they appear only in `wipe.ts` and `store.ts` (queries and the pending-mark calls), never in analytics, logging, errors or the sync outbox. "None holds a name or words, and none is logged or sent" is true.
- Not changed by this delta, so stated for completeness: DATA_CLASSIFICATION.md itself has no row for the keys yet (the PR body says a CCO ruling records the class until a docs PR adds them), and `db.secureDeleteVacuumAt` stays L2 in its `store.ts` comment.

### Step (k) in the device plan
- Reads correctly and is safer. The warning is bold and first: (d) to (f) erase everything and cannot be undone; run them only on a test phone with Asha's book, or on a real phone only after the book is exported and the copy saved outside the phone and opened. The first part (count letters on build 9, play two recordings, install over it, open, same counts) is safe on any phone; the second part is gated by the warning; the Needs line and the Record line agree with it. "Settings > Your data > Export your book" matches the row label (`strings.en.ts:1284`) and the screen the Erase page links to (`/settings/export`).
- Nit: "save it to Files" does not by itself mean "off the phone" (Files > On My iPhone is still the phone). It does survive Erase everything, which is the point; for a copy that also survives losing the phone, name iCloud Drive or another device. Not blocking.

### Ran at this head
- erase-all 40, age-gate-erase 3, reminders-erase 2: 45 passed. `qa-release-catalog` and `qa-kill-harness` (read the device plan): 58 passed.
- Nothing else rerun: the delta contains no executable line, and all other checks stand as in my Review A at 8a8db627 (Review A2).

### CI at this head
Success so far: typecheck, web (typecheck, test, build), install, edge functions, functions-deploy, migrations unchanged, sizes, native files changed. `compliance-fence`: one failure and one cancelled run (no CCO approval on this head for `age-gate.ts`; not a code finding). In progress when I looked: `tests and content rules`, `database rules`, `web e2e`, B-8, `e2e simulator app`, one `store-profile Release launch`; no `required` result yet. A PASS holds only once required CI is green at this exact head and the fence has its approval. T2 still needs two counted reviews and the Privacy Officer's view on this head.

### Not verified
No device or simulator run; the in-progress CI jobs; whether DATA_CLASSIFICATION.md should gain rows (a docs PR, outside this PR).

Reviewer: independent of the author (CR-44).
