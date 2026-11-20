## Review A at 3efce390ebaee1babc6f8878531b6f96cfe72609: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A: correctness of every fact, and code shape. Docs only: one new file, `docs/tdd/new-scope/engineering-facts-bl-987.md` (53 lines). This re-review follows Review A at aae7da79 (PASS WITH NOTES) and Review B's must-fixes.

Must fix: none.

### What changed since aae7da79, checked
- S1: the two keep-the-row exceptions now have different owners. The later-edit exception (`:782-783`) goes to product. The legal-hold exception (`:782`, `held_on_hold` at `:633`) goes to `legal` and the founder. Both cites hold. The file decides neither.
- S2 now says what the pull serves:
  - The caller's own rows, plus other members' letters read through `book_entries` (`20261016000000_sync_v1_server.sql:1498, 1542, 1553, 1563`). All four lines read `book_entries` with `author_id <> v_uid`, or `own: false` at :1498.
  - The view at its latest definition (`20261015030000_v1_wire_contract_columns.sql:229-248`, the only redefinition after `20261003000000:563`) filters on non-anonymous, membership, `family_can_read` and `in_book`/approval. It has no consent filter.
  - So "a session with consent outstanding can read other people's letters" is true at the server.
- My earlier note 1 is resolved: the opinion that a server consent check "would be a contract change, not a fix" is gone. The file now "proposes no fix".
- New G1, owner `security-architect`, with `data-architect` for any migration. It states the gap and leaves the decision with its owner. The note that old app builds also call `sync_pull`, so a server gate is a contract change, is a fair constraint (API-R11).
- All the S1, S3 and D2 cites from my first pass are unchanged and hold at 1400718b, the merge base and the commit the file names. That is 35 cites in all, 35 holding, 1 imprecise (note 1).
- Boundaries: no founder or counsel question is decided and no date is set. G1 and the legal-hold line route to their owners.
- Format: ASCII only (non-ASCII grep: 0), 53 lines.
- Head 3efce390, committed 12:23 UTC on 20 Nov, more than 10 minutes old at review. CI at the head: every check completed with success, including `required`, `tests and content rules` and `typecheck`. Two `compliance-fence` runs were cancelled; a third succeeded.

### Findings (notes, most serious first)
1. Still open from my first pass: S2 cites `auth-store.ts:88` for `syncAllowed()`. Line 88 is the body of `released()`; `syncAllowed()` is at `:101-102`. The fact is true. Cite `:87-89, 101-102`.
2. G1 is a security gap that the file records but nothing tracks yet. Open it as a `handoff` to `security-architect` (or a BACKLOG row), so it does not live only in a facts note. Until it is decided, the phone's `canSync` is the only control on other members' letters before consent.
3. Still open: the trigger's three effects (`:555-568`) are conditional on no `entries` row having taken the id, and on the book and author existing. On the let-go path the outcome is as written. One clause would stop a reader generalising it.
4. Still open: `#860` and `#861` are merged. Cite `docs/tdd/new-scope/data-and-sync.md` and `08-keeping.md` by path.

### Not verified
- Whether production runs `20261016000000` with `app.held_sync` on (the file's own Unverified line).
- The uncommitted S3 run.

Reviewer: independent of the author (CR-44).
