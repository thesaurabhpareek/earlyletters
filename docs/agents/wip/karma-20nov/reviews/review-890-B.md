## Review B at d1952369d67b6d8aeeebd9780dd7aec10840c31c: CHANGES
<!-- agent:security-architect -->

Lens B (independent method, coverage and correctness of row citations). Rule applied: ruling T1 on P-8. A test cites a row only if it proves the whole row; a set that proves a row together each cite it, the first with a one-line comment naming the others; a partial test cites nothing.

Must fix:
1. The NS-25-R4 set leaves out the check that proves "stay theirs". Row (`10-reading-and-family.md:769`): after the undo, "the second parent's letters leave the book and stay theirs". The cited `supabase/tests/v1_gate_coparent.test.mjs:139` reads `bool_or(in_book)` and `bool_and(deleted_at is null)` over the rows still authored by N (`:135`). It has no count. A hard delete of one of N's three letters, or a change of its author, would still pass `:139`. The check that closes this is `:140`: N still reads all 3 letters of that book, and `entries` reads are author-only (`entries_select`, `20261002020000_data_governance.sql:203-204`), so all 3 are still N's. Without `:140` the set proves "leave the book and are not soft-deleted", not "stay theirs". Fix: add `[NS-25-R4]` to the title at `:140` and name it in the set comment at `:136`. Then the body's table needs the same line.

## What I checked
Each cited id against the locked card (`10-reading-and-family.md` at `450bcb4a`). I read each check with its setup, and the SQL it drives.

- NS-25-R2, whole: `supabase/tests/v1_gate_limits_peek_pepper.test.mjs:126`. A signed-in adult with no consent and no membership peeks a parent invite. The answer has exactly the keys `inviter` and `role`, with values `Mama` and `parent`. With only those two fixed values there is no child name, id or letter in it. `peek_invite` (`20261015010000_v1_gate_peek_invite_consent_pepper.sql`) builds only those two keys, plus `joined` once a member, so consent does not change the shape. The invite link carries only the token (`src/lib/family/invite-link.logic.ts`). `:128` and `:129` add views of the same fact; they are not needed for the row.
- NS-25-R4, set, incomplete: `v1_gate_coparent.test.mjs:137` (undo inside 72 hours returns `undone`, the membership is gone), `:139` (N's remaining letters are out of the book and not soft-deleted), `supabase/tests/sync_engine.test.mjs:300` (a non-member's next pull reports the book gone as `not_member`, drops it from `books`, sends only the caller's own rows). The "stops receiving at next sync" half holds by composition: `sync_pull` picks `not_member` from membership alone (`20261016000000_sync_v1_server.sql:1618-1622`), and `undo_parent_join` deletes the membership row (`20261015020000_v1_gate_coparent_invites_undo.sql`). The "stay theirs" half needs `:140`, see Must fix.

Review A's must-fix at `39529593` (NS-25-R3 set incomplete) is fixed: all four NS-25-R3 ids and the old set comment are gone, and the body lists the row as blocked on #26 and #32 with the full set.

Other checks:
- Diff from merge base `bc425d2f`: 3 files, +5 -4. Titles gain only the NS id; one `//` set comment at `:136`. No check expression changed.
- Added lines are ASCII.
- Check titles are unique in the three files. No test on develop cited these ids before.
- Tests at the head, in a worktree: `npm run test:db -- v1_gate_limits_peek_pepper` 57 checks, `-- sync_engine` 96, `-- v1_gate_coparent` 62; all passed. `packages/content` `no-real-family-data.test.ts`: 11 passed. Fixtures use Asha only.
- No check-in file in this PR (the P-8 check-in is in #888).
- CI at the head (committed 12:29 UTC, checked 12:51 UTC, 22 minutes old): finished and green for required, database rules, supabase start, reset, lint, tests and content rules, typecheck, Deno, compliance-fence, applied migrations unchanged. Superseded compliance-fence runs were cancelled.

## Findings (notes, not blocking)
1. NS-25-R4: `sync_engine.test.mjs:300` reaches non-membership by leaving (`request_book_deletion`), not by an undo, and its title says "a book the caller left". The set holds only through the code fact above. One pull after the undo in `v1_gate_coparent.test.mjs` would prove the row in one place and let the set shrink.
2. The PR body is out of date. "Globs touched" and "How it was checked" still name six files; only three change. The NS-25-R2 line says one test proves the row but its reason leans on `:128` and `:129`; `:126` is enough on its own.

## Not verified
- The trace counts in the body.
- The body's partial and blocked list, row by row (I did not re-check the NS-25-R3 line numbers).

Reviewer: independent of the author (CR-44).
