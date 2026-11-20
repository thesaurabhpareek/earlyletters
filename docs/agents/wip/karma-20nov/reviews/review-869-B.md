## Review B at 427f1feadb14fc82c8a85428bf8358700cbcec7e: PASS WITH NOTES
<!-- agent:security-architect -->

Lens B (identity, security, privacy). PR 1 of the BL-961 stack (#869 -> #871 -> #879): one pure reader `bookVisibleTo` (`apps/mobile/src/lib/auth/account-scope.logic.ts`, 38 lines), its test (13 cases) and a check-in line. Reviewed as its own delta against develop's merge base `20553b18`. Head older than 10 minutes. CI on the head: `required`, tests and content rules, typecheck, database rules, Deno all green; at 12:22 UTC the store-profile Release launch job had also finished green; one duplicate compliance-fence run cancelled beside a green one.

Must fix: none.

What I checked:
- Tests: `account-scope.test.ts` 13 of 13 pass in a worktree of the stack (the file is unchanged by #871 and #879). Mutation: making the last line `return true` fails 5 of 13, so the "hidden" half is pinned. The full mobile suite and tsc ran on the #871 head, which contains this PR (see review-871-B.md).
- The rule: no session, visible (D1); no owner, visible; owner signed in, visible; any other signed-in account, hidden. It reads the raw session (`authUserId`, `machine.logic.ts:229-231`), not `currentAuthUserId()`, so B is hidden during `checkingConsent` and `needsConsent` too. Right call: the consent-pending window is exactly when no other gate is up.
- Nothing deleted: the reader is pure; the test runs the real `takeOwnership` and `releaseEmptyOwner` over node:sqlite and shows row counts unchanged and the owner kept when the phone holds a book.
- No logging, no analytics, no network: none in the file (grep), and the test pins that it imports nothing.
- Cites, 8 sampled, 8 hold: `ownership.ts:49` (mismatch throw), `:106-118` (`releaseEmptyOwner`), `gate.logic.ts:123-125` on `20553b18` (Tonight for any session with a book), `machine.logic.ts` `authUserId`, `store.ts` `currentUserId` reads `SYNC_SETTING.owner`, `sync/index.ts:73` and `:180` (`account_mismatch`), security.md NSC-03 on #858 (line 52).

Findings (most serious first):
1. Note, fails open on a bad owner value. `!input.owner` treats an empty string as "no owner", so the book shows to anyone. `takeOwnership` only ever writes a UUID, so this needs a corrupt setting to matter. #879's `bookVisibleNow` fails closed only when the read throws. Consider: an owner that is set but is not a UUID hides the book (the safe side), with one test row.
2. Note, rule 2 (no owner, visible) is the claim design (ADR 0023): a book made before any sign-in is visible to, and claimable by, the first account that signs in after the claim screen. That is accepted. The file should say in one line that this case is about the person holding the phone, not about account separation.
3. Note, the header says every read for display goes through this answer in PRs 2 and 3. #879 keeps reads by id open on purpose, and reminders and Find are left to other owners. The header should say "every list read", or name the exceptions, so a later reader does not rely on it for a by-id path.
4. Note: ADR 0031 is cited but is not on develop (the number is reserved). Fine for now. Once the ADR lands, its number should resolve.

Not verified:
- Behaviour on a phone (nothing here is device-specific).
- Whether the founder keeps the OQ-5 / OQ-F10 default (hide, offer sign-out, no second store). That is the founder's call, and the PR leaves it to them.

Reviewer: independent of the author (CR-44).
