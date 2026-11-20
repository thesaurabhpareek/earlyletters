Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549` and #879 head `e27d104e`, 20 Nov 19:04 UTC). The handoff cites `use-account-deletion.ts:53` and `open-request.ts:144-157`; both hold on develop. It also names an `ownersNote` check: that name is NOT on develop (it arrives with #879's `account-note.test.ts`); re-open #879 before copying the shape.
Pin at develop 4d33978f (errata E1 to E73, CL-001 to CL-147; E74 to E82 and CL-148 to CL-157 NOT yet applied; `docs/product/prd/ENGINEERING-QUESTIONS-CLOSED-20nov.md`): E54 (CL-128): Delete account has NO owner check (passcode or biometric); its guards are the typed word, the 30-day undo and the emails. Erase everything keeps the owner check. This brief's guard is on the deletion NOTE (the owner of the note), not an added owner check on Delete account. E49: B sees nothing of A.
Blocked until: #879 merged (the handoff's own condition; `bookVisibleNow()` does not exist on develop). Handoff issue: #911 (karma to mobile). Nothing for the founder. The note is a cache the server rewrites at A's next sign-in, so this is a P1-class fix, not a must-fix on #879.

```
BRIEF HO-911 (Delete account under a second account)  Filled by: mobile RD-H1 for Karma, 20 Nov 2026 19:04 UTC
Agent: mobile   Lane: Pack 3 (Account and consent)   Build: 13 (rides with BL-961, which holds the cut)   Wave: 1

1. GOAL: When account B opens Settings, Delete account (by deep link, or a screen left mounted) on a phone that holds A's book, A's local deletion note is left exactly as it was.

2. CARD ROWS and TEST TITLES
   Rows: NS-10-R3, [X4-R1]; CR-67 AX-12. Card 08 at 450bcb4a.
   Title (PROPOSED, no catalogue row; follow the catalogue's pattern, PR #925): `[NS-10-R3][X4-R1] Delete account under a second account leaves the owner's note`
   Fixture: Asha-A's book and a scheduled deletion note for A on a `node:sqlite` store; B signed in; B's server status is `none`; run `refresh` (mount, and a `userId` change); assert the note is byte-identical.
   Red on develop: `noteAfterRead` (`open-request.ts:144-157`) returns null for A's note when B's status is `none`, and `recordStatus(s.value, userId)` at `use-account-deletion.ts:53` writes that away.
   Second test (fail closed): when the owner cannot be read, nothing is written. Mutant: delete the new `bookVisibleNow()` (or owner) guard in `refresh`.

3. FILES  Touch: apps/mobile/src/lib/account-deletion/use-account-deletion.ts (the guard in `refresh`), one test beside `test/account-deletion-note-store.test.ts`.
   Never: lib/account-deletion/open-request.ts logic (a pure function that is right for A), lib/store.ts, app/_layout.tsx, the deletion RPC, supabase/**.
   Shared file rule: none open.

4. READING PACK: Pack 3 items 1 to 3, 6; `08-keeping.md` section 3; #879 review B note 1.

5. CODE ENTRY POINTS (develop 16e61549)
   apps/mobile/src/lib/account-deletion/use-account-deletion.ts:44-58   `refresh`: loads status and books, then `recordStatus(s.value, userId)` at :53
   apps/mobile/src/lib/account-deletion/use-account-deletion.ts:60-62   `useEffect(() => void refresh(), [refresh])`: runs on mount and when `userId` changes
   apps/mobile/src/lib/account-deletion/open-request.ts:144-157          `noteAfterRead(current, status, phone)`: "mine" is the signed-in account's note only
   apps/mobile/src/lib/account-deletion/note-store.ts:47                 the caller that writes the result
   #879 head: apps/mobile/src/lib/store.ts:446 `bookVisibleNow()`

6. DATA AND SECURITY
   Data classes: L2 deletion note, phone only. New storage, send, log: none. Boundary: NSC-03, AB-01 and AB-04 (PR #915). Owner of the read: security-architect (plan lens A for BL-961).
   Fail closed: when the owner cannot be read, do not write.

7. LIBRARIES: none.

8. BUDGETS (PR #928): none (one boolean read per refresh). Not measured.

9. ACCEPTANCE  Experience: C-S20 Delete account and E-S18 (PR #921): B still sees B's own deletion screen and can delete B's account (do not hide the whole screen: test it). Test case above. Done also means: red on old code and on the guard mutant.

10. PR BREAKDOWN: one PR, about 80 lines (S), base develop, branch `fix/mobile-ho-911-delete-account-second-account`. Flag-off proof: with one account `refresh` writes as before (test).

11. LENSES: A security-architect, B compliance-engineer (as BL-961).

12. ORDER: after #879; independent of BL-922. Blocked by: #879.

13. DEFINITION OF DONE
    [ ] test red on old code and on the mutant; `npm test -w apps/mobile`: only the 8 baseline files red; `npx tsc --noEmit` apps/mobile: only the 5 known errors
    [ ] ASCII only; labels agent:mobile, from:agent; journal PATCHed; check-in line committed; comment on issue #911 with the PR link (start `<!-- agent:mobile -->`)

14. ONLY A PHONE CAN PROVE: two phones or two sign-ins: A's note survives B's visit to Delete account (S1-204 second-account rows, PR #925).

15. STOP AND ASK: the fix needs a change to `open-request.ts` semantics; B must be blocked from deleting B's own account.

16. HARNESS: claim row held by Karma for lib/reminders/** only; lib/account-deletion/** has none yet (Karma adds it). Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-ho911 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-ho911.md`. Comments start `<!-- agent:mobile -->`.
```
