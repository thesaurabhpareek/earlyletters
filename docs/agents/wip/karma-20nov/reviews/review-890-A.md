## Review A at d1952369d67b6d8aeeebd9780dd7aec10840c31c: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A (accuracy). Task P-8: card ids added to test titles on develop. Rule: a test cites a row only if it proves the whole row; a set that proves a row together each cite it, the first with a one-line comment naming the others (ruling T1); a partial test cites nothing. Re-review after the fix for my earlier must-fix (the NS-25-R3 set at 39529593).

Must fix: none.

## What I checked
- Diff from merge base `bc425d2f` to head, 3 files: `v1_gate_limits_peek_pepper.test.mjs:126` and `sync_engine.test.mjs:300` gain only an NS id plus a space; `v1_gate_coparent.test.mjs` gains the ids on `:137`, `:139` and one `//` set comment at `:136`. All four NS-25-R3 ids and the old set comment are gone; `sync_v1_server`, `v1_wire_contract` and `v1_gate_hardening` are back to develop's text. No check expression changed. Added lines are ASCII.
- Each id against the locked card (`10-reading-and-family.md` at `450bcb4a`):
  - NS-25-R2 (`v1_gate_limits_peek_pepper.test.mjs:126`, row `:767`): holds alone. A signed-in adult with no consent peeks an invite; the answer's keys are exactly `inviter` and `role` (`Mama`, `parent`), so it carries no child name or letter; peeking joins nothing.
  - NS-25-R4 (set `v1_gate_coparent.test.mjs:137`, `:139`, `sync_engine.test.mjs:300`; row `:769`): holds together. The undo inside 72 hours ends the membership; the removed parent's letters in that book are all out of the book and live; a pull for a book the caller is no longer a member of reports it gone, sends only the caller's own rows and drops it from `books`. The gone reason depends only on membership (`20261016000000_sync_v1_server.sql:1618-1622`). The set comment's line numbers are right at the head.
- The body lists NS-25-R3 as blocked on #26 and #32 with the full set (`sync_engine.test.mjs:206`, `v1_wire_contract.test.mjs:55`, `sync_v1_server.test.mjs:234`, `v1_gate_hardening.test.mjs:231`, `data_governance.test.mjs:58`, `access_matrix.test.mjs:161`, `:191`, `:194`, and `rls.test.mjs:87` as possible). I checked the line numbers: they hold.
- Open PRs into develop touching the three files: none but #890.
- Tests: in a worktree at the head, `npm run test:db -- <name>`: v1_gate_limits_peek_pepper 57, sync_engine 96, v1_gate_coparent 62 checks; all passed.
- CI at the head (12:46 UTC, head 17 minutes old): finished, all green: required, database rules, supabase start, reset, lint, tests and content rules, typecheck, Deno, compliance-fence, applied migrations unchanged (superseded compliance-fence runs cancelled).

## Notes
- NS-25-R4: `sync_engine.test.mjs:300` reaches non-membership by the parent leaving, not by an undo. The composition holds, but one pull after the undo in `v1_gate_coparent.test.mjs` would prove "stops receiving the book at its next sync" directly.

## Not verified
- The trace counts in the body.
- The rest of the body's partial and blocked list, row by row.

Reviewer: independent of the author (CR-44).
