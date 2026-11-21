Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549`, 20 Nov 19:04 UTC). Already stale in the design: `consent.ts:117` minted a new key per call; #903 fixed it (R7 done; `consent.ts:113` now holds an answer).
Pin at develop 55574906c, E1 to E83, CL-001 to CL-158 (`docs/product/prd/ENGINEERING-QUESTIONS-CLOSED-20nov.md`): E49 (CL-123): B sees nothing of A; the D1 line is for A at sign-out only. E58 (CL-132): the update-required line in Me; a newer version that is not required shows nothing. E59 (CL-133, founder's promise, default stands): the free allowance is per phone, no account id.
Blocked until: BL-922 merged (this builds on it, backlog line 3908); the PROPOSED method line for R12 read by the founder. Open for `sync` (not mine): whether `sync_pull` serves rows while consent is outstanding (G1, issue #909) and OQ-6 (what the other phone sees after a deletion elsewhere, R9: no code until `sync` answers). The R7 half of this design PR is done and merged as #903 [V].

```
BRIEF BL-978a (new phone: R8, R10, R11, R12)      Filled by: mobile RD-H1 for Karma, 20 Nov 2026 19:04 UTC
Agent: mobile   Lane: Pack 3 (Account and consent)   Build: 13 (Q1: founder decides which P0 rows hold the cut)   Wave: 1

1. GOAL: When a returning account arrives on a new phone, a lost "which books" answer is re-asked inside the same 10 seconds without restarting the clock, the kill switch shows the local book,
   and a wrong-account screen names the sign-in method, never the address.

2. CARD ROWS and TEST TITLES
   Rows: NS-10-R8, R10, R11, R12 (R7 done: #903; R9 waits on `sync`). Card 08 at 450bcb4a.
   Titles (catalogue A, PR #925, exact):
     [NS-10-R8] kill switch at sign-in shows the local book
     [NS-10-R10] a lapsed plan still brings the book
     [NS-10-R11] retry after a lost books answer
     [NS-10-R12] wrong account names the method
   Red on develop: R11 `use-new-phone.ts:58` restarts the clock (`setWait({began: Date.now(), ...})`) and `new-phone.logic.ts:67` answers `noBook` at once for an unreadable answer while online; R12 has no line.
   R8 and R10 are title-only (the behaviour is built; catalogue: "none"): add titled tests. Mutants (catalogue A): check the switch after the held-screen decision (R8); gate pulled rows on plan state (R10);
   reset the cursor on retry (R11); interpolate the full email (R12).

3. FILES  Touch: lib/first-run/{use-new-phone,new-phone.logic,gate.logic}.ts (R8 only), components/onboarding/new-phone-screens.tsx (one PROPOSED line), tests new-phone-route, first-run-wait, first-run-gate,
   a new `new-phone-retry.test.ts`.
   Never: lib/auth/consent*.ts (done), lib/sync/** (R10's proof is a stand-in on the pull; the server side is `sync`'s), packages/content words except PROPOSED keys through `content`.
   Shared file rule: with BL-922 and #871 on the gate files.

4. READING PACK: Pack 3 items 1 to 3, 5, 7; `08-keeping.md` section 3.2 (R11, R12, R9 bullets).

5. CODE ENTRY POINTS (develop 16e61549)
   apps/mobile/src/lib/first-run/use-new-phone.ts:58            `setWait({ began: Date.now(), baseline: getSyncStatus().lastSyncedAt })`: keep `began` across retries within one mount; only `baseline` refreshes
   apps/mobile/src/lib/first-run/new-phone.logic.ts:58-74         `openingView`; :67 unknown while online gives noBook; read `unknown` as `opening` until 10 s (OPENING_WAIT_MS) with one automatic re-ask
   apps/mobile/src/lib/first-run/gate.logic.ts:110                with `serverFeatures` off the gate returns `unchanged` (R8)
   apps/mobile/src/lib/auth/session-provider.tsx:113-115, :174   `auth.lastMethod` (key `auth.lastMethod`): the source for the method name
   apps/mobile/test/consent-retry-one-key.test.ts:79, :168       the R7 tests, as a model for "one key"

6. DATA AND SECURITY
   Data classes: none new. The method name is not personal data; the email is never shown on a shared screen (R12). New storage, send, log: none (no email, no method in a log).
   Boundary: NSC-03; AB-01. Owner of the read: security-architect (plan lens B).

7. LIBRARIES: none. `expo-network` as installed for the online read (LD-32, PR #920).

8. BUDGETS (PR #928): R11's window is the existing 10 s (A-NFR-002, no awaited network at launch); L-03. Checked: unit with an injected clock.

9. ACCEPTANCE  Experience: C-S10 (loading, noBook, offline, wrongAccount; PR #921), EX-09 stable testIDs. Test cases above. Done also means: red on old code and on mutants; "Books arrive once because the pull upserts by id".

10. PR BREAKDOWN: one PR, about 300 lines, 8 files (design 3.6 PR 4), base develop after BL-922, branch `fix/mobile-bl-978a-new-phone-retry`. Flag-off proof: no flag; R8 test covers `serverFeatures` off.

11. LENSES: A principal-architect, B security-architect (plan 2.3).

12. ORDER: after BL-922; before BL-978b. Blocked by: BL-922, founder (the R12 line).

13. DEFINITION OF DONE
    [ ] tests red on old code and mutants; `npm test -w apps/mobile`: only the 8 baseline files red; `npx tsc --noEmit` apps/mobile: only the 5 known errors; `npm test -w packages/content`
    [ ] ASCII only; keys PROPOSED; labels agent:mobile, from:agent, needs:founder; journal PATCHed; check-in line committed

14. ONLY A PHONE CAN PROVE: S1-204 on two phones; slow and blocked first pull; R14 "both phones keep receiving" p95 under 30 s over 20 runs (D, two phones; JOURNEYS rows 3.4 and the two-phone rows, PR #925).

15. STOP AND ASK: `sync` answers OQ-6 or G1 with a contract change; a word is needed; the 10 s window needs another number.

16. HARNESS: claim row held by Karma. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-bl978a agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-bl978a.md`. Comments start `<!-- agent:mobile -->`.
```
