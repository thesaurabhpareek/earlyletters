Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549`, 20 Nov 20:40 UTC).
Blocked until: #879 merged for case 1 (the first-run gate belongs to BL-961 until then; #904 left `lib/first-run/**` alone). Case 2 needs Karma's answer on one input: whether any build that carried reminders reached a tester before #904 (handoff #910: "a one-time launch rule, or a line in the release notes that it is accepted pre-release; your call which; say which in the PR"). Source read: no `ios-v*` tag exists (#835 review A), but S1-204 names "Build 12 (PR #764)" on TestFlight [V DEVICE_TEST_PLAN.md:31]: so testers may hold reminders. Do not guess; ask. Handoff issue: #910 (karma to mobile).

```
BRIEF HO-910 (end reminders on account gone and on the upgrade path)  Filled by: mobile RD-H1 for Karma, 20 Nov 2026 20:40 UTC
Agent: mobile (reminders owner)   Lane: Pack 4 (Reminders)   Build: 13   Wave: 1

1. GOAL: When an account is purged on another phone, or a parent upgrades from a build older than #904 and is signed out, no reminder of the earlier session survives to the next account.

2. CARD ROWS and TEST TITLES
   Rows: NS-13-R13, R14, R15 (a second account starts with none; sign out and deletion remove reminders). Card 09 at 450bcb4a.
   Titles (catalogue C, PR #926, exact; the first two cite `reminders-session.test.ts:210` and `:87`):
     [NS-13-R13] a second account starts with none
     [NS-13-R14] sign out removes reminders
     [NS-13-R15] deletion removes reminders
   Add two cases under R13 (PROPOSED titles): `[NS-13-R13] an account purged elsewhere ends the reminders here` and `[NS-13-R13] a phone upgraded from a build with no session mark ends its reminders at launch (if the code option is chosen)`.
   Red on develop: `endReminderSession()` (`lib/reminders/session.ts:51`) is called only from `settleReminderSession` on the user id change or the mark; a purged account that ends with `SIGNED_OUT` is Unverified (design 1.3), and a phone with reminders on and no mark never ends.
   Mutants: remove the new call in the account-gone branch; ignore the "phone has held an account" fact in the launch rule.

3. FILES  Touch: lib/account-deletion/first-run-gate.logic.ts or use-first-run-gate.ts (the "account gone" branch: locate with `git grep -niE "accountGone|deleted|gone" apps/mobile/src/lib/account-deletion` [U exact line]),
   lib/reminders/session.ts (the one-time launch rule, case 2 only), test/reminders-session.test.ts (extend), docs/qa/DEVICE_TEST_PLAN.md (a BL-948 row, by `qa`).
   Never: lib/first-run/gate.logic.ts, lib/auth/**, lib/store.ts, planner or scheduler logic.
   Shared file rule: `session.ts` is #904's file (merged); `lib/account-deletion/**` is BL-961's area.

4. READING PACK: Pack 4 items 3, 5; `09-capture.md` (design) section 1.3 "The session ends, reminders end" and OQ-13.4 (upgraders); handoff #910 text; #904 review A.

5. CODE ENTRY POINTS (develop 16e61549)
   apps/mobile/src/lib/reminders/session.ts:27-48   `settleReminderSession(previousUserId, userId)`; mark `reminders.session` (prefs.ts:52); `endReminderSession()` at :51 clears settings then `await forgetReminders()`
   apps/mobile/src/lib/auth/session-provider.tsx:24 imports it; :198 the launch settle comment; :218-227 SIGNED_OUT handling (the Unverified purge case)
   apps/mobile/src/lib/erase-everything.ts:39 import, :84 `await forgetReminders()`: Erase everything (the other end)
   apps/mobile/test/reminders-session.test.ts:87, :151, :210   the existing R13 to R15 tests

6. DATA AND SECURITY
   Data classes: L2 reminder settings; L4 child name on a lock screen if names on. New storage, send, log: none (the launch rule reads a flag that exists: `reminders.session`, plus one "this phone has held an account" fact that needs a source, e.g. `sync.ownerId` present; re-open `lib/sync/ownership.ts`).
   Boundary: NSC-03; AB-04. Owner of the read: security-architect (posted lens on #904). Open legal handoff #907: `reminders.session` classification (L2) is `legal`'s; not here.

7. LIBRARIES: none.

8. BUDGETS (PR #928): L-03 the launch rule is local and not awaited before first frame; L-09 unchanged. Checked: unit.

9. ACCEPTANCE  Experience: C-S01 Me (`sessionEnded`, `deletedElsewhere` states, PR #921); D-S06. Test cases above. Done also means: red on old code and mutants; the choice for case 2 written in the PR body.

10. PR BREAKDOWN: PR 1 case 1 (about 100 lines) after #879; PR 2 case 2 (about 120 lines) or a release-notes line by `ops`, branch `fix/mobile-ho-910-{1-account-gone,2-upgrade}`. Flag-off proof: none; with a normal session nothing changes (existing tests).

11. LENSES: A principal-architect, B compliance-engineer (as #904).

12. ORDER: case 1 after #879; case 2 any time after Karma answers. Blocked by: #879, Karma (which builds shipped).

13. DEFINITION OF DONE
    [ ] tests red on old code and mutants; `npm test -w apps/mobile`: only the 8 baseline files red; `npx tsc --noEmit` apps/mobile: only the 5 known errors
    [ ] ASCII only; labels agent:mobile, from:agent; journal PATCHed; check-in line committed; comment on issue #910 with the PR link and the choice (start `<!-- agent:mobile -->`)

14. ONLY A PHONE CAN PROVE: BL-948 device row: purge the account on phone 2, relaunch phone 1, no pending reminder remains; upgrade from the older TestFlight build with reminders on, signed out.

15. STOP AND ASK: the purged-account path ends in something other than `SIGNED_OUT` (Unverified); "has held an account" has no reliable source on the phone; counsel is needed on retention of the mark.

16. HARNESS: claim row held by Karma. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-ho910 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-ho910.md`. Comments start `<!-- agent:mobile -->`.
```
