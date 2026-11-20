## Review A at 307b56b2cf03c1a802f30b4ae47e08af45c2443d: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A: correctness, tests that fail on the old code, code shape. Second review; the first (at `b117bfcf`) had two must-fixes. 2 files, +396 against develop (the script 212 lines, the test 184; under the CODE-R02 limit of 400).

Must fix: none.

### My earlier must-fixes
1. `public.children` (was `label-effect.mjs:32`): fixed. It is gone from `CONTENT`; `CHILD_TABLE` (`:34`) matches only `create` or `alter table [public.]children` with a `name`, `nickname`, `date_of_birth` or `due_date` word in the same statement. My probes now pass: a new table with `child_id uuid references public.children(id)`, `alter table public.children add column archived_at timestamptz`, and a re-created `public.can_read_entry_photo(p_name text)`. New 1a fixtures (children `due_date`, children table with `name`) and 1c fixtures (a child-scoped table, a children metadata column, the re-created predicate) cover both sides.
2. The precision claim: fixed. Replaying all 31 develop migrations with this head gives 14 hits in 5 files, as the body now says. I read each: `children`, `entries`, `entry_versions`, `dictionary_terms`, `held_drafts`, `audio_blobs`, two storage buckets, children `nickname`, `due_date`, `photo_path`, `machine_edits`, `author_edits`, and `sync_private.keep_check(..., p_final_text text, ...)`. Each is a content table, column, bucket or function taking content.

### What I checked
- Delta `b117bfcf..307b56b2` in full (script +27 -8, test +75 -15).
- `npx vitest run test/label-effect.test.ts` in a worktree of the head: 27 pass.
- Ten mutants, all killed (each fails at least one test): DECISIONS.md read from the head (my old note 3), entitlement version bump not filtered (old note 4), `CHILD_TABLE` dropped (4 fail), function names kept in the SQL head, the `: false` permission filter dropped (old note 1), the quoted-header throw dropped, renames turned back on, statements starting at a blank line (old note 5), `core.quotePath` dropped.
- History: 117 first-parent develop commits touching shipped code give 1 hit (bc3b8209, `faceIDPermission`). The photo stack top (#839 `279ba898`), #835 `447611c2` and #798 `7f36031a` give 0. The closed-branch `photosPermission: false` line now passes.
- Fail-loud: a diff header holding `"` throws inside `parseDiff`, which `main` catches, so the exit is 2 (test added). A bad head ref still exits 2.

### Notes
1. Low. `--no-renames` makes a moved shipped file count as all added, so a pure move of a file that holds a fetch and a content name anywhere fails until recorded. The README in #898 says "A moved file counts as all added". It is the safe direction and it closes the move-in gap. Accepted.
2. Low. `CHILD_TABLE` uses whole words, so a children column such as `first_name` or `display_name` would not match (`_` is a word character). No such column exists; if one comes, add it.
3. Low, still open from the first review. Trailing comments, a new file that both fetches and names `recordingState`, and a `package.json` script named `sentry:*` still FAIL. The README in #898 now lists the first two. A `sentry:*` script name is rare.
4. Info. `due_date` and `date_of_birth` count as child data (DATA_CLASSIFICATION.md section 1.1, rule 6). The card says "a child name". This is a reasonable widening, and it is stated in the code comment.

### Not verified
- Full apps/mobile suite locally (load average above 50); relied on CI.

CI at this head (12:40 UTC): `required`, `tests and content rules`, `typecheck`, `database rules`, Deno, B-8 all success; `store-profile Release launch` (macOS) queued. The head was more than 10 minutes old when I finished.

Reviewer: independent of the author (CR-44).
