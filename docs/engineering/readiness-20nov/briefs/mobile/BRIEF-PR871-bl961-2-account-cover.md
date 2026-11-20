Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549` and head `4879ff5c`, 20 Nov 19:04 UTC).
Pin at develop dcbf70fc8, E1 to E82, CL-001 to CL-157 (`docs/product/prd/ENGINEERING-QUESTIONS-CLOSED-20nov.md`): E49 (CL-123): what B's screens show of A is NOTHING (FR-SEC-04); the D1 line ("anyone who opens the app can read them") is addressed to A at sign-out only and tells B nothing. The cover test must assert B sees no trace of A. E73 (CL-147): a local Days file is adopted only at the claim step; any other first sign-in deletes it and starts empty (applies when the Days store exists).
Blocked until: the founder reads the PROPOSED held-screen words (`needs:founder`): `apps/mobile/src/components/account/copy.ts` ships them in app code, outside `packages/content`, so merging before approval puts unapproved words in front of a parent (review B note 4). Device row 4 (cold-start frames before the Keychain read) goes on the Build 13 sheet. Product ruling wanted: the design names the one action "Use another account (sign out)" (`08-keeping.md:132`), the PR uses the approved word "Sign out" (review A note 3). Nothing else blocks: base develop, `mergeable_state` clean, +385 lines net (390 added, 5 removed), 11 files [V].

```
BRIEF PR-871 (BL-961 part 2 of 3: the cover)      Filled by: mobile RD-H1 for Karma, 20 Nov 2026 19:04 UTC
Agent: mobile   Lane: Pack 3 (Account and consent)   Build: 13, holds the cut (Q1 recommendation)   Wave: 1

1. GOAL: When account B signs in on a phone that holds account A's book, a cover sits over every route and deep link from B's first moment, shows nothing of A's and no email of B's,
   and offers one action: Sign out. Nothing is deleted, moved or uploaded.

2. CARD ROWS and TEST TITLES
   Rows: [X4-R1] (cover half, CR-67 AX-12), NS-10-R3, NS-10-R12's no-email rule is asserted on the cover only; the title `[NS-10-R12]` and the method-name line belong to BL-978a. Card 08 at 450bcb4a (R3 around line 479).
   Titles (catalogue A, PR #925; the PR's own titles are in `account-gate`, `account-layer`, `account-route` tests):
     [NS-10-R3] a second account never sees the first
     [X4-R1] sign out keeps the book; a second account never sees, claims or uploads it
     [X4-R1][NS-10-R3] gate never opens Tonight on another account's book   (security acceptance, SPA 3.1, PR #914)
   Red on develop: `gate.logic.ts:123-125` opens the local book for any session with a book. Mutant (SPA 3.1): replace `hasLocalBook` with the unfiltered count; (author) remove the
   `bookVisible === false` line (`gate.logic.ts:122` at the head).
   Make the titles exact: `account-layer.test.ts` pins source strings (brittle, safe direction); add the catalogue titles beside them so `node scripts/trace.mjs` finds `[NS-10-R3]`.

3. FILES  Touch (11): app/_layout.tsx (mount and import only), components/account/{account-layer.tsx,copy.ts}, lib/first-run/{gate.logic,use-first-run-route,welcome.logic}.ts,
   tests account-gate, account-layer, account-route, use-first-run-route; docs/agents/checkins/mobile-bl-961.md.
   Never: lib/store.ts reads (part 3), lib/find/**, lib/reminders/**, packages/content (words wait for the founder).
   Shared file rule: `_layout.tsx` is also edited by #895 (one line): whichever lands second merges develop. Boot wiring: Karma's BOARD row names "account layer only".

4. READING PACK: Pack 3 items 1 to 9 (PR #917); `08-keeping.md` section 3.2 (lines 96 to 172) and K8; security.md NSC-03; CR-67 AX-12 (`RULINGS.md:647`).

5. CODE ENTRY POINTS (head 4879ff5c, branch fix/mobile-bl-961-account-cover; develop 16e61549)
   develop: src/lib/first-run/gate.logic.ts:123-125 opens the book for any session; :129 `childStep` for a session with no book; src/lib/auth/account-scope.logic.ts:34 `bookVisibleTo`; src/lib/sync/ownership.ts:49 refuses sync only
   head: gate.logic.ts:122 `if (input.bookVisible === false) return result('otherAccount')`; :237 `bookVisible: bookVisibleTo({owner: args.phoneOwner ?? null, sessionUser: authUserId(s)})`
   head: src/app/_layout.tsx:244 `<AccountLayer />` beside AppLockLayer (develop :243); src/components/account/account-layer.tsx (iOS FullWindowOverlay; elsewhere a View, zIndex 999)
   Review note 1: `bookVisible?` and `phoneOwner` are optional, so `welcomeBeginAllowed` (`route.logic.ts:31-44`) still asks without the owner: make `phoneOwner` required.
   Review note 2: a stale owner on an empty phone after a kill during `signingOut` (release runs only on the signed-in to signed-out edge, `sync/index.ts:190` releaseEmptyPhone).

6. DATA AND SECURITY
   Data classes: L4 owner id already on the phone (`sync.ownerId`); the cover holds nothing of A's. New storage, send, log: none.
   Boundary: NSC-03 screen half; AB-01 to AB-04 (PR #915); D1: the book stays after sign-out. Fail closed: if the owner cannot be read, the book is hidden.
   Owner of the read: security-architect (posted B). The cover protects separation of accounts, not the phone from its holder (note 1).

7. LIBRARIES: none. `FullWindowOverlay` from react-native-screens as installed; no new dependency.

8. BUDGETS (PR #928): L-01 cold start p50 1.2 s, p90 2.0 s (device, HOLD); L-03 no awaited network before first frame; B-NFR-008 first-run screens interactive within 300 ms. The decision is pure over auth state in memory.
   Checked: by reading the call path; SE 3 is a device row (BL-929).

9. ACCEPTANCE  Experience: E-S18 second account (PR #921: foreign scope reaches no book, slip, Share, reminder); C-S10 wrongAccount and held states; EX-03, EX-04 (modal, focus on title). Test cases above.
   Done also means: red on old code and on the two mutants; one account unchanged (test).

10. PR BREAKDOWN: exists (#871, base develop). Part 1 (#869) merged 12:23; part 3 (#879) is stacked on this branch. Retarget #879 to develop when this merges. Flag-off proof: no flag; with one account nothing changes (test).

11. LENSES: A principal-architect, B security-architect; both PASS WITH NOTES at 4879ff5c (13:00 and 12:48 UTC).

12. ORDER: after #869 (merged); before #879, BL-922a, BL-978a. Blocked by: founder (words).

13. DEFINITION OF DONE
    [ ] tests red on old code; `npm test -w apps/mobile`: only the 8 baseline files red; `npx tsc --noEmit` apps/mobile: only the 5 known errors
    [ ] ASCII only; labels agent:mobile, from:agent, needs:founder; journal PATCHed; check-in line committed

14. ONLY A PHONE CAN PROVE: S1-204 on two phones (DEVICE_TEST_PLAN.md:31, :801): B's Book tab, Home, deleted and hidden lists empty; VoiceOver does not announce A's name; cold-start frames before the Keychain read; audio already playing under the cover (note 3: start Listen, then sign in as B).

15. STOP AND ASK: the cover must change `_layout.tsx` beyond mount and import; an Android cover is wanted (note 2: mark the View as the web-preview stand-in); the word "Sign out" is ruled differently.

16. HARNESS: claim row held by Karma. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-pr871 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-bl-961.md`. Branch fix/mobile-bl-961-account-cover (exists, no force). Comments start `<!-- agent:mobile -->`.
```
