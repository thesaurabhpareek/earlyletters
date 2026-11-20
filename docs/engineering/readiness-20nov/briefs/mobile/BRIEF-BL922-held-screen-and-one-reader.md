Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549`, 20 Nov 19:04 UTC).
Pin at develop 55574906c, E1 to E83, CL-001 to CL-158 (`docs/product/prd/ENGINEERING-QUESTIONS-CLOSED-20nov.md`): Council C10 (DECISIONS-20nov.md on PR #1013, pending merge, PROPOSED): the line "We will sign that device out" (`packages/content/src/emails/auth.en.ts:199`, an email) has no lever behind it; build the lever or remove the line (words PROPOSED); not part of this brief, file it as its own row if ruled. E54: Delete account on the held screen needs no owner check. E58: the update-required line (R13, R14) is in Me, nothing for a newer non-required version. E76 (CL-150), E77 (CL-151): no other new account-security email is built for 1.0 and none is sent after "Sign out other devices" or wrong codes. Council C10: the line "We will sign that device out" stays out of the app until the lever and the stop page exist (E83, CL-158 builds both before the first outside family), words PROPOSED, `content`'s. E78 (CL-152, CL-155) is closed by E83 (CL-158): the founder's answer holds. The new-device sign-in email is built, tested and read by security-architect before the first outside family; the "Not you?" link opens a confirm page that signs one session out only on a button press. This email is NOT in any mobile brief's scope: it is a server sender, a device table and a web page (sync, security-architect, content).
Blocked until: #871 AND #879 merged (#871 edits the same two gate files: `gate.logic.ts` and `welcome.logic.ts`); the founder approves the held screen's words (two homes, one each: #871's cover words live in app code `components/account/copy.ts`; this brief's `finishSetup` and `exportElsewhere` lines are PROPOSED keys in packages/content; `content` later moves #871's) (PROPOSED keys, `finishSetup` screen and the `exportElsewhere` line; BL-965 words, #870). Plan correction for Karma: plan 2.3 says "922b is #869". It is not: #869 is `bookVisibleTo` (BL-961 part 1). BL-922's second half, "the consent sheet stops calling `readAccountBooks`", is NOT built: `app/(auth)/sign-in/consent.tsx:134` and `:151` still call it, and `first-run-new-account.test.ts:152-156` pins two calls [V at 16e61549]. No open PR names BL-922 [V `gh api pulls`].

```
BRIEF BL-922 (held screen and one account reader)  Filled by: mobile RD-H1 for Karma, 20 Nov 2026 19:04 UTC
Agent: mobile   Lane: Pack 3 (Account and consent)   Build: 13, holds the cut (Q1 recommendation)   Wave: 1

1. GOAL: When a returning account with no local book has consent outstanding, the app shows the consent sheet or a held screen with a way forward within 10 seconds, never the child step;
   deletion and export stay reachable without agreeing; and the account's books are asked for once, not twice.

2. CARD ROWS and TEST TITLES
   Rows: NS-10-R0, R4a, R4b (R4 withdrawn); NX-36-S17 Tier 0; CR-61. Card 08 at 450bcb4a. Backlog BL-922 (lock BACKLOG line 3139): "Done when" below.
   Titles (catalogue A, PR #925, exact):
     [NS-10-R0] a returning account never meets the child step
     [NS-10-R4a] deletion works without agreeing
     [NS-10-R4b] export reachable after declining
   Tests (design 3.5): gate unit `needsConsent` with no book gives `finishSetup`, never `childStep` (red on old code: `gate.logic.ts:129` answers `childStep` for any session without a book);
   route hook test; pinned beside the hold cases in `test/new-phone-route.test.ts` and `test/use-first-run-route.test.ts`; one `sync_books` read per launch.
   Mutants (catalogue A): remove the no-book-with-account branch in the boot gate so first-run shows (R0); require Terms before the delete route mounts (R4a); hide export behind the Terms gate (R4b).

3. FILES  Touch: lib/first-run/{gate.logic,welcome.logic,use-first-run-route,use-new-phone}.ts, components/onboarding/new-phone-screens.tsx, app/(auth)/sign-in/consent.tsx (the two reads only),
   lib/first-run/account-books.ts, tests first-run-gate, first-run-new-account, use-first-run-route, new-phone-route; `docs/qa/DEVICE_TEST_PLAN.md` S1-204 (k) (by `qa`).
   Never: app/_layout.tsx, lib/auth/account-scope*, store.ts reads, supabase/**, packages/content words (PROPOSED keys only through `content`).
   Shared file rule: `gate.logic.ts` and `welcome.logic.ts` are #871's: this lands after it; the same PR removes the "Known gap" clause at `gate.logic.ts:187`.

4. READING PACK: Pack 3 items 1 to 3, 5, 9; `08-keeping.md` section 3.1 (facts) and 3.2 (design: R0, R4a, R4b, then 922b), K11; docs/design/e2e area C C-S10 "Opening your book" (PR #921).

5. CODE ENTRY POINTS (develop 16e61549)
   apps/mobile/src/lib/first-run/gate.logic.ts:129      `if (input.hasSession) return result('childStep', ...)` for a session with no book
   apps/mobile/src/lib/first-run/gate.logic.ts:183-199  `heldNewPhoneView` returns undefined for `needsConsent`; :187 the "Known gap" comment
   apps/mobile/src/lib/first-run/use-first-run-route.ts:146   `newPhone: np.view ?? held ?? 'new'`
   apps/mobile/src/app/(auth)/sign-in/consent.tsx:296 "Not now" closes the sheet and leaves `needsConsent`; :134 and :151 two `readAccountBooks(auth.client)` calls
   apps/mobile/src/lib/first-run/use-new-phone.ts:58  Try again restarts the 10 s clock (R11, BRIEF-BL978A)
   apps/mobile/src/app/settings/account.tsx:226        Settings > Account pushes `/sign-in/consent`: the held screen's Finish setup does the same

6. DATA AND SECURITY
   Data classes: none new (auth state in memory; `sync_books` and `request_account_deletion` exist today). Nothing sent that was not before; no email on a shared screen (R12); no name of A's.
   Boundary: NSC-03; the held screen must never be a dead end (App Review 2.1): Try another way and Delete account never depend on the consent route.
   `request_account_deletion` checks only `require_user()` (`supabase/migrations/20261005000000_family_cap_language_idempotency.sql:408-456`): E29 says find the latest definition by search, not by this line.
   Owner of the read: security-architect (plan lens B).

7. LIBRARIES: none. Existing `StateScreen`, `ConfirmSheet`, `Sheet`; no new route modal (a pushed modal reopens every launch and races the age gate: design 3.2).

8. BUDGETS (PR #928): R0's 10 s limit holds by construction (pure over auth state); L-03 no awaited network before first frame; B-NFR-008 first-run screens interactive within 300 ms (B-NFR-008, from the mobile charter).
   Checked: by reading the call path; SE 3 by S1-204.

9. ACCEPTANCE  Experience: C-S10 (loading, noBook, offline, wrongAccount, held; no spinner, busy words stand still; PR #921); E-S18; EX-03 EX-04 EX-05 (two stacked actions of at least 44 pt).
   Test cases above. Done also means: red on old code and on mutants; `sync_books` read once per launch (a count assertion).

10. PR BREAKDOWN
    PR 922a: the held screen (cut line if it passes 400 lines: (i) gate step, `OpeningView` and welcome mapping with tests; (ii) the screen, its links and the S1-204 text) (new step `finishSetup`, `OpeningView` `consent`) | about 350 lines, 9 files | base develop after #871 | flag-off proof: none needed (no flag; with a book nothing changes)
    PR 922b: the consent sheet stops reading books when the route will ask | about 150, 4 | base develop (rewrite the pins at `first-run-new-account.test.ts:152-156`)

11. LENSES: A principal-architect, B security-architect (plan 2.3). `design-systems` reads the screen.

12. ORDER: after #871, #879 (cover and data half); before BL-978a. Blocked by: #871, founder (words).

13. DEFINITION OF DONE
    [ ] a `needsConsent` session with no local book never answers `childStep` (red on old code); `sync_books` once per launch; S1-204 (k) rewritten by `qa` to expect the sheet or the held screen
    [ ] `npm test -w apps/mobile`: only the 8 baseline files red; `npx tsc --noEmit` apps/mobile: only the 5 known errors; `npm test -w packages/content` if keys added
    [ ] ASCII only; labels agent:mobile, from:agent, needs:founder; journal PATCHed; check-in line committed

14. ONLY A PHONE CAN PROVE: S1-204 (a) to (k) on two phones (DEVICE_TEST_PLAN.md:31, :801): consent sheet or held screen inside 10 s, never the child step; VoiceOver, Larger Text, Reduce Motion; JOURNEYS row 3.4 (J-N2, PR #925).

15. STOP AND ASK: the held screen needs the consent route to open (a dead end); the child step is wanted for a returning account; a word is needed; `_layout.tsx` must change.

16. HARNESS: claim row held by Karma. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-bl922 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-bl922.md`. Branches `feat/mobile-bl-922a-held-screen`, `fix/mobile-bl-922b-one-reader`. Comments start `<!-- agent:mobile -->`.
```
