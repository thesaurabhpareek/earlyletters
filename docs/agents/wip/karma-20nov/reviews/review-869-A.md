## Review A at 427f1feadb14fc82c8a85428bf8358700cbcec7e: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A: correctness, tests that fail on the old code, code shape. PR 1 of the BL-961 stack (#869, then #871, then #879). This is the delta against develop: `apps/mobile/src/lib/auth/account-scope.logic.ts` (38 lines, new), `apps/mobile/test/account-scope.test.ts` (141 lines, new) and a check-in line. Within CODE-R02 (180 lines, 3 files).

Must fix: none.

### What I checked
- Head 427f1fea, committed 05:54 UTC on 20 Nov, hours old. Merge base with develop is 20553b18.
- CI at the head: every check completed with success, including `required`, `tests and content rules`, `typecheck` and `store-profile Release launch`. The iOS simulator build was skipped (no native change). One `compliance-fence` run was cancelled; its sibling run succeeded.
- I ran it in a worktree of the head:
  - `npx vitest run test/account-scope.test.ts`: 13 passed.
  - `tsc --noEmit` at the top of the stack (#879 head 9a6956df, which contains this file): only the 5 known sandbox errors (expo-clipboard, expo-local-authentication and the three app-lock follow-ons).
- Old code: the file is new, so its test cannot meet the old code. The red test for the leak is in #871. I copied #871's `account-gate`, `account-route` and `account-layer` tests onto this head. 5 tests fail here with `expected 'openTonight' to be 'otherAccount'` and the `Begin the book` assertion; `account-layer` fails because its module does not exist. All of them pass on #871's head. So the reader is exercised by a red-then-green test within the stack.
- The rule against the sources:
  - CR-67 AX-12 (`docs/agents/cto/RULINGS.md:663` on develop): one `bookVisibleTo` check. This is it, by that name.
  - `08-keeping.md:132` on develop: visible with no session (D1), visible when the owner is null or equals the session user, hidden otherwise. The four lines match, in the same order.
  - `authUserId` (`machine.logic.ts:229-231`) is the raw session for `checkingConsent`, `needsConsent`, `ready` and `signingOut` (`isSignedIn`, `:225-227`). So "hidden before consent" holds, and the test walks every status.
- Cites in the body and the header: `ownership.ts:49` (the mismatch throw), `ownership.ts:106-118` (`releaseEmptyOwner`), `gate.logic.ts:123-125` (Tonight for any session), `sync/index.ts:73, 180` (the `account_mismatch` phase and `mismatchUser`). All hold on develop.
- Shape: pure, no imports (pinned by the last test), one input type, one boolean. No domain type duplicated (CODE-R13): the input is two account ids, not a domain enum. No logging. The `.logic.ts` suffix matches the repo's Node-tested pure modules.

### Findings (notes, most serious first)
1. The test "the second account signs out: the book is the phone holder's again (D1); the first signs in: it is theirs" never involves the second account. It checks A's book as `signedOut` and as `ready(A)`. Add the step its title names: hidden for `ready(B)`, then visible for `signedOut`. Otherwise the title overstates what is proved. #879's `account-store.test.ts` covers this at store level, so this is wording plus one line.
2. A phone whose owner is stale: an empty phone that never ran `releaseEmptyOwner`, for example after a kill during sign-out. On it, a second account is hidden, and #871's cover then tells B "This phone has a book from another account" when there is none. The test at `account-scope.test.ts` "a phone that held nothing" names this case. The release on the next sign-out clears it, so B gets out by signing out. Worth one line in the reader's header: hidden can mean "owner not yet released", not only "a book is here".
3. The header comment cites "security.md NSC-03". It exists (`docs/tdd/new-scope/security.md:52` on develop) and agrees with the rule. Give the full path, because `security.md` is also the name of an agent file (`.claude/agents/security.md`).

### Not verified
- Founder default OQ-5 / OQ-F10 (hide, offer sign-out, no second store) is the founder's to change. This PR builds the default and says so. I did not judge the default.

Reviewer: independent of the author (CR-44).
