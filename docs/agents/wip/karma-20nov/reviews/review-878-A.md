## Review A at 29a6d4db202e815f5d569fd4a867a54902cb3a23: PASS WITH NOTES
<!-- agent:principal-architect -->

Must fix: none.

Lens A (code shape and contracts), confirming at the new head. My first review was at 380fa1e7 (PASS WITH NOTES, no must-fix). Since then: one commit, 29a6d4db, with 12 lines added and 4 removed in `scripts/trace.mjs`, `scripts/trace.test.mjs` and the check-in. Total size is still under CODE-R02.

### What I checked at 29a6d4db (runs are mine, in a scratch copy)
- `node --test scripts/trace.test.mjs` at the head: 26 of 26 pass. Develop's own 21 tests run against the head's `trace.mjs`: 21 of 21 pass.
- The lock report, with the head's script in a copy of develop at 21e0341a and `--register` set to the lock's `14-test-plan.md`:
  - 636 rows, 296 P0: 1 tested, 0 partial, 0 journey, 14 device, 281 untested.
  - 269 P0 rows have no backlog row. Cross-cutting ids: 0 of 3 tested. Register drift: 0 both ways.
  - Exit 0.
  - It is unchanged from the first review, and my own independent count of 296 still matches.
- X-REQ output: develop's whole `docs/TRACE.md` is still a byte-identical prefix of the head's. `--json` without the `ns` key is still byte-identical to develop's.
- Note 1 (skip detection), fixed. The modifier test now drops the title (`trace.mjs:236`), and the node:test option form is read (`:237`). Probes:

  | Form | Result |
  |---|---|
  | `it('[..] keeps the .todo list')` | active |
  | `test('[..]', { skip: true }, f)` | skipped |
  | `test('[..]', { todo: 'later' }, f)` | skipped |
  | `{ skip: !x && 'why' }` | skipped (a conditional skip; an under-count, which is the safe direction) |
  | `it.todo`, `it.fails` | skipped |

  The planted test covers the option form and the `.todo` title (`trace.test.mjs:304-305`; skipped count 2).
- Note 3 (a parser exception fails `npm test`), fixed (`trace.mjs:741-742`). I pointed `--register` at a directory to force an error.
  - Report mode logs `trace NS skipped: EISDIR ...` and exits 0.
  - `--check` rethrows, which gives a non-zero exit (2 in my run).
  - The planted test covers both (`trace.test.mjs:340-342`).
- `describe.skip` is deferred to the ratchet PR. The PR body states this at "Update at 29a6d4db". It is acceptable, because nothing is enforced yet.
- CI at 29a6d4db, checked at 11:54 UTC when the head was 12 minutes old and had not moved: every check has completed. `required`, `tests and content rules`, `typecheck`, `database rules`, Deno, B-8, migrations, install and agent team succeeded. `compliance-fence` has two successful runs and one duplicate that was cancelled.

### Notes (open, none blocking)
1. `{ skip: false }` is still read as skipped. In `/^\s*,\s*\{[^}]*\b(?:skip|todo)\s*:\s*(?!false\b)/` (`trace.mjs:237`), the `\s*` before the lookahead can match nothing. The lookahead then sees ` false` and passes. My probe `test('[NS-01-R9]', { skip: false }, f)` came out skipped. This under-counts, which is safe. A fix: `:\s*+`, or put the `\s*` inside the lookahead, as in `(?!\s*false\b)`. The ratchet PR should fix it together with `describe.skip`.
2. The device bucket still includes rows a machine can test in part: `NS-13-R18` (`09-capture.md:156`), `NS-06-B8b` (`06:332`) and `NS-33-R8` (`11:269`). Settle this before the ratchet exempts device rows.
3. `/** Build the whole model. ... */` still sits above `shownPath` (`trace.mjs:279`), not above `collect`.
4. `ns.untestedP0` in `--json` leaves out the 3 cross-cutting ids (`14-test-plan.md:137`). Add them before G6 reads the list.
5. #819's reminders test still has no BL id or handoff.

Replacing #819 instead of reworking it is still sound. My reasons are the same as in the first review, and nothing in this commit changes them.

### Not verified
- The Maestro `tags:` path with real NS tags: develop has none.
- The workspace suites other than the trace test: I relied on CI.

Reviewer: independent of the author (CR-44).
