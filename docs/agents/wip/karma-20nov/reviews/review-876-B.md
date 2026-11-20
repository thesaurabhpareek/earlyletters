## Review B at 3efce390ebaee1babc6f8878531b6f96cfe72609: PASS WITH NOTES
<!-- agent:security-architect -->

Lens B (identity, security, privacy). One docs file, `docs/tdd/new-scope/engineering-facts-bl-987.md`. My first review was at `aae7da79` (CHANGES, two must-fixes). The head moved to `3efce390` (pushed 12:24 UTC), +8/-2 lines in the same file. Reviewed after the new head was 10 minutes old. CI on the head was finished at 12:37 UTC: `required`, tests and content rules, typecheck, database rules, Deno and migrations unchanged all green; two duplicate compliance-fence runs cancelled beside a green one.

Must fix: none.

Both earlier must-fixes are done:
1. S2 now says the pull serves the caller's own letters and other members' letters through `book_entries` (`20261016000000_sync_v1_server.sql:1498, 1542, 1553, 1563`). It also drops the "not a fix" reason. I re-read the four lines: they hold.
2. S1 now splits the owners: the later-edit exception (`:782-783`) goes to product, and the legal-hold exception (`:782`, `held_on_hold` at `:633`) goes to `legal` and the founder.

What I checked:
- The delta against `aae7da79` (the only change since my first review). Everything else in the file is as I checked before: 29 cites sampled on `1400718b`, 29 hold. No later migration on develop redefines `sync_pull` or `require_user()`.
- The new gap row G1 is in the right lane. It names `security-architect` as owner, `:1306` for the `require_user()`-only guard, and the phone's `canSync` as today's only control. It proposes no fix, and it names `data-architect` and the contract change if a gate is needed. I accept G1. It goes into my queue as an IAM gap: IAM-R03 covers writes only, and no rule covers reads.

Findings (most serious first):
1. Note, G1 wording: "reads the book before Terms, age or sensitive-data consent" overstates the age part. To be a member at all, a caller passed IAM-R03 at create or join (`age_attested` true). So the realistic outstanding cases are a newer Terms version and sensitive data declined. I will set the scope when I write the IAM row; the doc need not change.
2. Note, routing for G1: whether consent scope covers reads is partly a legal question. When I take G1, I will route the consent-scope half to `legal` and the founder, not decide it.
3. Note, still open from my first review: a let-go under a legal hold answers `{ kept: true }` and the draft returns to the phone (`merge.ts:584-596`). Whether that lets a person infer a hold is for `legal`, which S1 now names.

Not verified:
- Production: what the hosted project runs (S1's own unverified line).
- `node_modules/valibot/dist/index.mjs` lines in S3, and the deleted S3 test.

Reviewer: independent of the author (CR-44).
