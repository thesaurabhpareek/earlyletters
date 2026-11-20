# TDD new scope 08: Keeping (NS-08 to NS-12)

Status: Proposed, 20 Nov 2026. Author: `mobile` (Claude Code session, for Karma). Target path: `docs/tdd/new-scope/08-keeping.md`.
Read this session: the locked pack on `docs/prd-lock-v1-20nov` at `450bcb4a` (#846, unchanged at start): `README.md`, `00`, `08-keeping-and-trust.md`, `13`, `14`, `16`, and `docs/BACKLOG.md` at that head (BL-922, BL-925, BL-926, BL-942, BL-961 to BL-965, BL-976 to BL-979, BL-987); #847 at `de44b839`; `develop` at `d5d12178`: the files cited, `docs/tdd/01` and `02`, ADR 0024 and 0025, `PRINCIPLES.md`. Nothing was run on a phone. Line numbers are at `d5d12178`.
Tags as in TDD 01: Fact (file:line), Assumption, Rec, Risk, OQ (owner, default; section 9), Conflict (K-numbered, section 8), Unverified (section 10). Card rows are cited by id, never restated. Words a parent reads are content keys, PROPOSED for `content`; the founder approves them. No dates.

## 0. Summary
1. NS-09 is mostly built. Beyond #832 (R1 to R3), the code already queues the held discard (R7), drops it on a second phone (R8), keeps it through a kill switch (R10), never sends it under another account (R11), waits for it at sign-out (R12), and the server deletes the held row at acknowledgement (R14). None of that has an NS-titled test. What is missing is BL-926 (R4a, R4b), the failure counter (R15), the stuck row (R6) and the R9 wording.
2. Two server rules built for two phones meet NS-09 head on: a later edit on another phone wins over a let-go, and a legal hold keeps the row. When the server keeps a let-go row, the draft comes back as keepable (K2). Product must rule.
3. NS-10's gap (BL-922) closes with a pure held screen for `needsConsent`, not a re-pushed sheet. The screen offers Finish setup, Try another way, Delete account and the export. It needs no network, so R0's 10 s limit holds by construction.
4. NS-10-R3 fails today. A second account signed in on a phone that holds the first account's book still sees that book: sync stops, but the gate opens the local book for any session. Fixing it (BL-961) puts an account layer next to the app-lock layer in `_layout.tsx`, which is boot wiring. The card's "offer B their own book" cannot work while the phone has one owner (K8).
5. NS-10-R7 is built [Amended 12-A7; was "fails today"]: one idempotency key per consent answer (`lib/auth/consent.ts:88`, `lib/auth/consent-key.logic.ts`); it needs only its NS-titled test.
6. NS-08 readiness is mostly documents (`sync` and others, BL-976). Mobile owns three things: the `[NS-08-R6]` test, which must exist before the Build 13 cut under #847 Q1's default; the R5 retitle; and the R8 line. The existing claims rule would fail an R8 line that names iCloud (K6).
7. The flip build already has three code facts against it. The crypto module is excluded from autolinking. The object key has no sha256 (K5). Sign-out waits for sync ops only, not backup jobs.
8. NS-11 (wave 3) reuses the export as it is. It adds one pure slip rule, a settings key and a flag. Risk: the system share sheet may not report whether the copy was saved (R3, R16).
9. NS-12 changes the sync contract in three places: a read RPC, restore as an ordinary words upsert, and a new queued remove op. The schema detail belongs to `data-and-sync.md`. My assumptions about it are OQ-DS1 to OQ-DS5.

## 1. Cards, waves and depth

| Card | Wave (13 section 4 / #847) | Depth here | Built on `develop` |
|---|---|---|---|
| NS-09 | 1 / 1 (#832 done; BL-925, BL-926, P-4, BL-977) | open rows only, full | R1 to R3 (#832, `5dc025d3`); R7, R8, R10 to R12, R14, R16 in code, untested by NS id |
| NS-10 | 1 / 1 (BL-922, BL-978) | full | NX-36-S17 Tier 0 (#764), R8 in the gate |
| NS-08 | none / 1 for reads (P-6, BL-976) (K1) | readiness rows full; flip rows one paragraph | R5 test and preflight; backup claims rule |
| NS-11 | 3 / 3 (BL-942) | outline | export, keep-awake, temp ZIP sweep at launch |
| NS-12 | none / none (BL-979 blocked on counsel) | gated paragraph plus the contract change | `entry_versions` table and trigger; no reader |

## 2. NS-09 Let it go always finishes (wave 1, open rows)

### 2.1 What is built (not redesigned)
- Fact: let-go happens in three steps, in pure code (`lib/capture/let-it-go.logic.ts:28-38`). Review and Listen both use it (`app/review.tsx:415`, `app/listen.tsx:435`). After the first frame, the launch sweep finishes any draft left `discarding` (`lib/capture/sweep.ts:152-153, 166-176`; `sweep.logic.ts:152`). Its tests are titled `[BL-923]` and `[BL-924]` (`test/sweep.disk.test.ts`, `test/listen.test.ts`), and P-8 (`qa`) retitles them.
- Fact (R7): a held draft queues `held.discard` in the same transaction as its mark (`lib/store.ts:1274-1288`; `lib/sync/outbox.ts:547-559`). The op stays queued until the server answers (`outbox.ts:6-10`).
- Fact (R14, code): the server deletes the held row under a row lock, writes an ids-only `discarded` marker and forgets the row's backup (`supabase/migrations/20261016000000_sync_v1_server.sql:353-362, 538-575, 763-788`). It keeps the row (`{kept:true}`) when the words changed after the phone's base (final review B-2) or when a legal hold applies (K2). This answers BL-987's `sync` line as far as code goes. Whether production runs this file is Unverified (U3).
- Fact (R8): on a second phone, the pull's gone marker marks the draft `discarding` (`lib/sync/merge.ts:567-575`), and the next launch sweep removes the row and its audio. Two exceptions: that phone has its own ops queued for the draft (`merge.ts:566`), or the server kept the row, which returns the draft as `ready` (`merge.ts:584-596`).
- Fact (R10, R11, R12): a paused engine keeps its queue (`lib/sync/types.ts:393`), and the let-go itself is local. A phone owned by A never pushes under B (`lib/sync/ownership.ts:49`), and its owner is never released while any op waits (`ownership.ts:106-117`). Sign-out waits on `pendingCount` (`lib/auth/session-provider.tsx:529-534`), which counts held ops once the server takes them (`outbox.ts:773-791`). If the parent signs out anyway, the op stays queued and bound to A.
- Not built:
  - R4a and R4b (BL-926): `review.tsx:415` ignores the result of `letItGo`.
  - R6 and R15: no counter exists.
  - R9 wording: `strings.en.ts:302-304` says the take "will be removed from this phone", not that it cannot be brought back.
  - NS-titled tests for R7 to R17.

### 2.2 Design of the open rows
- R4a, R4b (BL-926). Rec: add a pure `letGoOutcome(id, ok, getDraft)` to `let-it-go.logic.ts`. It returns `gone`, `stuck` (the row is still `discarding`) or `absent`. Review goes back only on `gone` or `absent`. On `stuck`, Review stays on screen:
  - Keep and Let it go are hidden, because the draft can never be kept again.
  - The BL-925 line shows under the transcript in the muted footnote style.
  - `announce()` (`lib/a11y`) runs after `InteractionManager.runAfterInteractions`, so VoiceOver reads the line once the alert has closed (U1).

  The line shows once per take: after leaving, the draft is off every list (`db/repos/drafts.ts:95`). Leaving Review uses the existing back control.
- R15. Rec: store the count under `discard.failures.<draft id>` in the existing `settings` table (`db/migrations.ts:63`). One store function, `noteDiscardFailure(id)`, writes it, at most once per process per id (a module `Set`), so the count is "launches that failed". Callers are Review and Listen on `stuck`, and `finishLetGo` when the delete throws. The key is removed in the same transaction as the row, in three places: `drafts.finishDiscard`, `deleteDraft`, and the un-discard in `merge.ts:584-596`. Erase everything already clears every setting.
- R6. Rec: a pure `stuckRecordings(drafts, readCount)` selects drafts that are `discarding` with a count of at least 3 (OQ-9). Each gets one row and a Remove now action. Remove now calls the sweep's `finishLetGo` once (exported for this) and then re-reads. Placement is K3; the default follows the card, which puts the row on `app/settings/storage.tsx` below Downloaded. No count of letters and no error word.
- R9. Rec: keep `Alert.alert` (standard). Mark the keep action as preferred if React Native 0.86 offers that on iOS (U2). Change `listen.discardBody` to say the take cannot be brought back (a PROPOSED edit under BL-925). Test: a source check that both screens list keep first with the `cancel` style, and that no Undo path follows `letItGo`.
- R14: no server change if K2 is ruled "as built". A stricter ruling is a `sync` and `data-architect` migration, outside this file.
- R17: a source scan checks that `let-it-go.logic.ts`, `sweep.ts` and the store's discard functions import nothing from `lib/remote` and read no kill switch.

### 2.3 Data, contract, native, flags
- Local: no table and no local migration; one settings key (id L3, count L2; card sections 10 and 11).
- Server and contract: none (`held.discard` is protocol v1 in `packages/api/src/server/sync.ts`).
- Native: none. Flags: none, and no remote pause, on purpose (R17).

### 2.4 Privacy, security, performance
- Nothing new leaves the phone; `held.discard` carries the id only. The counter key is never logged, and the sweep returns counts only (`sweep.ts:40`).
- Performance: a failure costs one settings write. The sweep still runs after the first frame and is not awaited (`sweep.ts:2-3`), so A-NFR-001 and A-NFR-002 are unchanged.
- R5 and R13 are SE 3 rows on BL-929's sheet. CI cannot measure them.

### 2.5 How each P0 row is tested

| Row | Test |
|---|---|
| R1 to R3 | existing disk tests, retitled (P-8); journey J-N1 with a kill |
| R4a, R4b | unit on `letGoOutcome`; screen test with a delete that throws (`test/helpers/expo-fs-standin.ts`, undeletable set); VoiceOver row on the device sheet |
| R7 | integration on the `test/sync-held-v8.test.ts` stand-in: op queued, kept after a lost answer, removed only on an answer |
| R8 | `test/sync-two-phone.test.ts` stand-in: A lets go, B pulls, B's sweep removes row and file; then the two-phone device row (D13) |
| R9 | source check; device VoiceOver row |
| R10 | engine `paused_server` and switch off: local delete done, op kept |
| R11 | two seeded accounts: A's op never appears in a push made under B |
| R12 | in the style of `auth-sign-out-wait.test.ts`: a queued discard makes sign-out wait; signing out anyway keeps the op and the owner |
| R14 | `supabase/tests/sync_v1_server.test.mjs` already covers `held.discard` (27 mentions); `sync` adds the `[NS-09-R14]` title once K2 is ruled |
| R15 | disk test: delete throws, relaunch with a new module instance, count persists, then goes with the row |

### 2.6 PRs, in merge order

| # | PR | Owner | Lenses A / B | Size |
|---|---|---|---|---|
| 1 | BL-925: Review line, stuck-recording line, Remove now, discard body (PROPOSED) | content | design-systems / compliance-engineer | about 40 lines, 2 files |
| 2 | BL-926: Review says so (R4a, R4b) | mobile | principal-architect / design-systems | about 200, 5 |
| 3 | P-4a: counter and stuck row (R6, R15, R16, R17) | mobile | principal-architect / data-steward | about 320, 8 |
| 4 | P-4b: sync rows as tests (R7, R8, R10 to R12) and R9 | mobile | principal-architect / data-steward | about 300, 4 (tests) |
| 5 | P-8: retitles | qa | as in #847 | small |

Dependencies: the founder approves BL-925's words (#847 Q4); `sync` confirms production (BL-987, U3); rulings on K2 and K3.

### 2.7 Risks
- Risk: a transient file-system error makes the line show although the next launch finishes the job quietly. Accepted: the line says only what is true at that moment. Way back: revert PR 2; the sweep still finishes.
- Risk: R7 and R8 pass on the stand-in while production never takes held ops (`app.held_sync` off, U3). The op then waits on the phone forever. That is safe (nothing is sent), but the server half is untested. Way back: none needed. The founder's Q1 decides whether the rows hold the cut.

## 3. NS-10 A new phone: close the last gap (wave 1, full)

### 3.1 What is built, and the gaps found
- Fact: NX-36-S17 Tier 0 is built (`lib/first-run/new-phone.logic.ts:58-74`; `use-new-phone.ts`; `components/onboarding/new-phone-screens.tsx`). It includes the arrival line, shown once (`new-phone.logic.ts:85-101`; `app/(tabs)/book.tsx:122-133`).
- Fact (BL-922): for `needsConsent`, `heldNewPhoneView` returns undefined (`gate.logic.ts:183-199`). The route then passes `new` (`use-first-run-route.ts:146`), and the gate answers `childStep` for any session without a book (`gate.logic.ts:129`). Terms "Not now" closes the sheet and leaves `needsConsent` in place (`app/(auth)/sign-in/consent.tsx:296`).
- Fact (R8): with `serverFeatures` off the gate returns `unchanged` (`gate.logic.ts:110`). With a local book, every session opens that book (`gate.logic.ts:123-125`).
- Fact (the card's NEEDS EVIDENCE line): the phone never pulls while consent is outstanding, because canSync is false (`gate.logic.ts:186`). That answers the client side. The server side stays with `sync` (BL-987).
- Fact (R4a): `sync_books` answers before consent (`account-books.logic.ts:11-13`). `request_account_deletion` checks only `require_user()` (`20261005000000_family_cap_language_idempotency.sql:408-456`), so deleting the account needs no agreement on the server side.
- Fact (R7, built [Amended 12-A7; this bullet read "gap", with a key minted per call at `consent.ts:117`]): `recordConsent` holds one key per answer (`lib/auth/consent.ts:88`, `heldAnswers`; `lib/auth/consent-key.logic.ts`). The server de-duplicates by that key, with a fingerprint that leaves out client time (`20261005000000...:165-194, 517-519`). A second tap after a lost answer therefore writes a second row (K11).
- Fact (R3 gap): with A's book on the phone and B signed in, sync stops on the mismatch (`ownership.ts:49`; `lib/sync/index.ts:180`), but the gate still opens the local book for B (`gate.logic.ts:123-125`).
- Fact (R11 gap): Try again restarts the 10 s clock (`use-new-phone.ts:58`). An unreadable answer shows No book here yet at once while online (`new-phone.logic.ts:67`), and Start a book is one tap from there.

### 3.2 Design
- R0, R4a, R4b (BL-922a). Rec: `heldNewPhoneView` returns a new `OpeningView`, `consent`, for `needsConsent`. The gate maps it to a new step, `finishSetup`, and `welcome.logic.ts` maps that to a screen of the same name. `new-phone-screens.tsx` draws the screen:
  - Finish setup pushes `/sign-in/consent`, exactly as Settings > Account does (`app/settings/account.tsx:226`).
  - Try another way runs the same sign-out-then-sign-in flow as `consent.tsx:200-208`.
  - The two actions are stacked, each at least 44 pt.
  - Two quiet links: Delete account (`/settings/delete-account`) and the export (`/settings/export`). With nothing on the phone, the export shows a PROPOSED `exportElsewhere` line (R4b).

  The screen is decided from auth state alone, with no network, so R0's 10 s limit holds by construction. Why not re-push the sheet at launch: a modal pushed from a route effect reopens on every relaunch and races the root age gate. The held screen is pure and testable, and the sheet is one tap away. The same PR removes the "Known gap" comments, as BL-922's done line asks.
- BL-922b (one reader). Rec: the consent sheet stops calling `readAccountBooks` when the route is going to ask (first run, no book). It closes on `ready`, which leaves `useNewPhone` as the only caller. The pins at `test/first-run-new-account.test.ts:152-156` are rewritten.
- R11 (BL-978a). Rec:
  - Keep `began` across retries within one mount; only `baseline` refreshes.
  - Read `unknown` as `opening` until 10 s have passed, with one automatic re-ask inside that window.
  - Fall back to `noBook` only after the window. Council A's fail-safe direction stands.

  Books arrive once because the pull upserts by id.
- R7 (BL-978a): built [Amended 12-A7], only the title remains. Original Rec: `recordConsent` takes the idempotency key as an argument. The sheet makes one key per (step, answer) when the step mounts and reuses it for every retry. No server change.
- R12 (BL-978a). Rec: the slow, no-book and finishSetup screens carry one PROPOSED line that names the sign-in method, read from `auth.lastMethod` (`session-provider.tsx:113`). Never the email.
- R9. Assumption: an account deleted on the other phone is only scheduled for deletion, so this phone's session may live through the grace window. This phone then sees either a revoked session (the Welcome with its existing line) or `sync_books` with no book (No book here yet). OQ-6 asks `sync` which. No code until then.
- R2, R13 (BL-978b). Rec: one Book-level slot driven by a pure `arrivalLine(...)` in `new-phone.logic.ts`. It picks one of three lines:
  - `more` while the first pull since arrival is still paging (engine `syncing`, arrival pending);
  - `recordingsHere` (PROPOSED) when backup is off and at least one of the parent's own spoken letters has no `audioUri`;
  - otherwise the existing `arrivedPlain`.

  The line stays until dismissed: the existing `newPhone.arrival` key gains the value `dismissed`, instead of the card's PROPOSED second key (L2, phone only). At 10 s the route already answers `arrived` when a page has landed (`new-phone.logic.ts:65`), so R2 needs only the `more` line. `provenanceLine` (`lib/provenance.ts:41-47`) gains a PROPOSED "not on this phone" clause for the parent's own spoken letter with no `audioUri`. No per-card warning (K9).
- R3, R5 (BL-961, `[X4-R1]`). Rec: a pure `bookVisibleTo({owner, sessionUser})`. The book is visible with no session (D1), and when the owner is null or equals the session user; otherwise it is hidden. When hidden, an account layer covers every route, deep links included. It is mounted next to `AppLockLayer` (`app/_layout.tsx:243`), shows no name of A's, and offers one action: Use another account (sign out). Because `_layout.tsx` is boot wiring, BL-961's scope must name it (OQ-8). See K8.

### 3.3 Data, contract, native, flags
- No new table and no local or server migration. One settings value: `newPhone.arrival` (L2) gains `dismissed`.
- Contract: none. `record_policy_act` is unchanged; only the client's key handling changes.
- Native: none.
- Flags: none (as the card says). Without a flag a PROPOSED key would ship, so BL-978b merges only after the founder approves its BL-965 keys.

### 3.4 Privacy, security, performance
- Nothing new is sent: `sync_books` and `record_policy_act` exist today. No email appears on a shared screen (R12). The account layer holds nothing of A's.
- Performance: every new decision is pure, over auth state already in memory. No launch waits on the network (A-NFR-002), and the held screen is live from its first frame (B-NFR-008). Cold-start numbers stay with BL-929 on SE 3.

### 3.5 How each P0 row is tested

| Row | Test |
|---|---|
| R0 | gate unit: `needsConsent` with no book gives `finishSetup`, never `childStep` (red on old code); route hook test; J-N2; S1-204 (k) rewritten by `qa` |
| R1 | two-phone device row S1-204 (D13) |
| R3, R5 | `[X4-R1]` integration with two seeded Asha accounts: the layer is up, no list returns A's rows to B, no push under B |
| R4a | held screen offers Delete account; `data-architect` adds a deletion-RPC case with Terms outstanding |
| R4b | the export is reachable; an empty phone shows the elsewhere line |
| R6 | two-phone device row: device restore, then sign-in |
| R8 | gate unit with `serverFeatures` false; the route hook reads nothing |
| R10 | pull stand-in with a lapsed plan: every letter arrives |

### 3.6 PRs, in merge order

| # | PR | Owner | Lenses A / B | Size |
|---|---|---|---|---|
| 1 | BL-922a: the held screen (R0, R4a, R4b entry points) | mobile | principal-architect / security-architect | about 350, 9 |
| 2 | BL-922b: one account reader | mobile | principal-architect / security-architect | about 150, 4 |
| 3 | BL-961: account layer (`[X4-R1]`, R3, R5) | mobile | principal-architect / security-architect | about 380, 10 |
| 4 | BL-978a: R11, R12; R7, R8 and R10 titles [Amended 12-A7: R7 removed from the build] | mobile | principal-architect / security-architect | about 300, 8 |
| 5 | BL-978b: Book-level line and provenance clause (after BL-965 words) | mobile | principal-architect / design-systems | about 300, 8 |
| 6 | S1-204 (k), plus two-phone rows R1, R6, R14 (BL-948) | qa | design-systems / principal-architect | docs |

### 3.7 Risks
- Risk: the held screen becomes a dead end if the consent route cannot open. That is an App Review rejection under guideline 2.1. Control: Try another way and Delete account never depend on the consent route. Way back: revert PR 1, which restores today's route, gap included.
- Risk: the account layer is boot wiring, and `security-architect` has 2 runs a day (#847 4.5). Way back: revert the layer. D1 still holds: the book stays and sync stays stopped.
- Risk: R2's `more` line keys off engine `syncing` and could stay on a stalled pull. Way back: the line clears when the parent dismisses it.

## 4. NS-08 Recording backup readiness (reads wave 1 per #847; the flip is gated)

### 4.1 What is built, and what mobile owns
- Fact (R5): backup is off in every profile (`apps/mobile/eas.json:16, 34, 48, 62, 78`). `test/backup-gate.test.ts:56` pins it, and so does `scripts/preflight-production.mjs:178-188`. The testflight preflight only warns on `on` (`preflight-testflight.mjs:172-179`), so the unit test is the hard stop.
- Fact (R6): sign-out is local scope and deletes no file (`session-provider.tsx:293-307`). Today's sheet body is `auth.en.ts:297`, which is not the D1 line.
- Fact (R7): the backup claims rule exists (`packages/content/test/claims-capabilities.test.ts:206-211`). Its only allowed truth is "your iPhone's own backup".
- Fact (R8): the nearest built surface is the Where your letters live nudge (`components/settings/where-live.logic.ts:43`), shown until the first export. F08 records the keep-safe card itself as not built (K6).
- Client facts for the R1 read note (the mobile section of BL-976):
  - `lib/backup/` is 16 files and 4,128 lines.
  - `scribe-keys` is excluded from autolinking (`apps/mobile/package.json:96`), so no store build carries the crypto module.
  - The object path is `{child}/{author}/{entry}.m4a.enc` (`lib/backup/contract.ts:19-21`), and begin is idempotent on the entry id (`lib/backup/queue.ts:20-23`) (K5).
  - Sign-out waits for sync ops only, not backup jobs (`lib/auth/auth-store.ts:188-194`); this is R15 at the flip.
  - The kill switches exist (`packages/api/src/remote-config.ts:57-75`; `capabilities.ts:241-246`).
- Server side: owned by `sync` (TDD 02 section 4.6, the `entry-audio` row). Its standing Rec of a nightly ciphertext copy to a second provider (`docs/tdd/02-sync-backend.md:405`) is the natural input to R9.

### 4.2 Design of the readiness rows
- R5: retitle the existing test `[NS-08-R5]` and add a case: every profile with `distribution: store` writes `off` explicitly.
- R6: a `[NS-08-R6]` test. It seeds Asha drafts and letters with files on the expo-fs stand-in, then runs the sign-out reducer and the provider's finishing effect against a stub client. Every file and row must remain. A source pin checks that `lib/auth/**` imports no erase function and calls no `File.delete`. The D1 sheet line is a BL-965 key, wired by BL-961 or by PR 3 below, whichever merges first.
- R7: add the card's banned forms to the backup rule. That covers "never lose", "safe in the cloud", "only you can restore", "free backup", and wording that a recording survives the loss of the phone. Title `[NS-08-R7]`. Save a copy keys join the scan when they exist. It runs in `npm test`, and the candidate checklist names it.
- R8: Rec: the line uses the nudge slot of Where your letters live and shows once (`keepSafe.shown`, L2, phone only). It names Save a copy and the phone's own iCloud Backup, with a PROPOSED key. It needs a new truth pattern in the claims rule, or R7 fails it (K6).
- R1 to R4 and R9 are documents (BL-976), written by `sync` with `security-architect`, `privacy`, `ops` and the CFO role. Mobile supplies the client facts above.

### 4.3 PRs, in merge order

| # | PR | Owner | Lenses A / B | Size |
|---|---|---|---|---|
| 1 | P-6a: R5 retitle, `[NS-08-R6]` test (before the Build 13 cut, #847 Q1 default) | mobile | security-architect / compliance-engineer | about 180, 3 |
| 2 | P-6b: R7 claim patterns, iCloud truth pattern | content | compliance-engineer / qa | about 80, 1 |
| 3 | P-6c: R8 line; D1 sheet wiring if BL-961 has not landed (after BL-965 words) | mobile | design-systems / compliance-engineer | about 150, 5 |
| 4 | BL-976 notes: R1 to R4, R9 | sync | security-architect / compliance-engineer | docs |

Privacy: none of this sends anything. X2 applies only at the flip.
Risk: R6 is a loss row, and the cut waits on its test. Way back: none needed; it is a test.

### 4.4 The flip (R10 to R20): gated, one paragraph
The flip rests on ADR 0024 (still Proposed), the client already in `lib/backup/`, and the server migration `20261023000000_backup_server.sql` with the escrow function. Before any build work: the seven conditions and the founder's decision; counsel on the label and policy (Q42, Q45, Q51, Q54); and, because a child's voice leaves the phone, the X2 reads by `security-architect` and counsel first. Engineering work already known for that build:
- linking `scribe-keys`, with a `security-architect` read of any entitlement or plist delta;
- reconciling the object key (K5);
- counting backup jobs in the sign-out wait (R15);
- the four provenance states as an NS-21 row;
- the PRIV-R21 consent row.

## 5. NS-11 Save a copy of the year (wave 3, outline)
- Decisions:
  - The copy is the existing export, one code path: the slip routes to `/settings/export` (R6a; `lib/export/`).
  - The Me row is the existing Export row (`app/settings/index.tsx:161`), renamed by `content`, never a second row (K13).
  - The slip is entry 3 in the BL-963 registry (`[FRAME-SLIP]`).
  - The file name already carries no account data (`lib/export/device.ts:295`, R11).
  - A temporary ZIP left by a kill is already swept at launch (`app/_layout.tsx:119`, R23). The screen stays awake only while exporting (`app/settings/export.tsx:96-103, 115`, R19).
- Interface: a pure `copySlipDue({books, today, states, keptLetters})` in `lib/save-a-copy/slip.logic.ts`. It covers the window (OQ-10), 29 February, twins, two birthdays in one week, due-date-only books, quiet or hidden books, and the need for one kept letter. Its state lives under `copySlip.<child id>.<year>`, with values `shown`, `dismissed` or `saved` (child id L3, value L2; phone only; never synced or exported).
- Data and contract: no migration, no server change, no contract change. Export 1.7.0 with pictures comes from BL-933 (R10). Flag: `EXPO_PUBLIC_SAVE_A_COPY` (PROPOSED), off in every profile. Adding it updates the env list pinned in `test/capabilities.test.ts:243` and the preflights.
- Privacy: nothing new leaves the phone. The copy goes only where the parent sends it through the system sheet, as today's export does (F15). X2 is not triggered because we send nothing. `security-architect` confirms this at review.
- PRs, coarse:
  1. BL-963 registry (`mobile`, principal-architect / design-systems).
  2. BL-942a: slip logic, state and flag (`mobile`, principal-architect / compliance-engineer).
  3. BL-942b: the row rename and the screen's lines, after the founder's words.
  4. R10 rides BL-933.
- Risks:
  - `expo-sharing` may not report whether the copy was actually saved (U5). If it cannot, "saved" is never recorded, only "dismissed", and R3 and R16 need RN `Share` results instead.
  - R17 needs a Low Power Mode read the app does not have. Reuse the engineering-only Low Power guard (13, section 3E). `expo-battery` (MIT) is the standard candidate (U6).

## 6. NS-12 Earlier versions of my own words (no wave; gated)
- What it rests on (Facts):
  - `public.entry_versions` exists (`20260930000000_scribe_core.sql:155-161`), with `machine_edits` and `superseded_by` added later (`20261002020000_data_governance.sql:172-173`).
  - A trigger writes the old words on every change to `final_text`, `in_book` or `machine_edits` (`data_governance.sql:175-185`; trigger `scribe_core.sql:221`).
  - An author-only select policy exists (`scribe_core.sql:271-272`), but `authenticated` holds no grant on the table (`20261023060000_explicit_grants.sql:49-51`). So a definer RPC is the only way to read it (K12).
- Contract change, named here; the detail belongs to `data-and-sync.md`:
  1. Read: a new author-only definer RPC, called when a letter opens and never part of `sync_pull`. Its versions live in memory for the open letter only.
  2. Restore: an ordinary `entry.upsert` of the words group, with a compare-and-set base (ADR 0025). It carries the version's `final_text` and its stored `machine_edits`. The existing trigger then records the replaced words as a new version (R2), so no new op type is needed. Nothing runs `verifyEdits` or the engine, because no machine edit is made (R3).
  3. Remove: a new queued push op, id only. It is additive and sent only once the server advertises it, the same way `outbox.ts:773-779` holds held ops. It ships with its own grant migration and a `supabase/tests/grants.mjs` line (R6).
- To decide first: counsel Q51, Q32 and Q48, via the BL-949 packet the founder sends; NS-21 built; and answers to OQ-DS1 to OQ-DS5.
- Flag: `EXPO_PUBLIC_EARLIER_VERSIONS` (PROPOSED), plus the remote `flags.versions`, which can only hide. Export: no change until `data-architect` and `privacy` decide (the card's default).

## 7. Shared files and merge order across the cards
- `app/settings/where-letters-live.tsx` (P-6c) and `app/settings/storage.tsx` (P-4a): serial if K3 moves the stuck row.
- `components/onboarding/new-phone-screens.tsx` and `lib/first-run/*`: BL-922a, then BL-922b, then BL-978a. [Amended 12-A7] NS-41 PR FP-6 goes after BL-922a, BL-922b and BL-978a; FP-2 goes before any other `consent.ts` change.
- `app/(tabs)/book.tsx`: BL-978b collides with NS-21 (BL-937), NS-22 and #798. It merges after BL-937.
- `packages/content` keys: BL-925 and BL-965 come first; BL-926, BL-978b and P-6c wait on the founder's approval.
- Order under #847 Q1's default: P-6a, BL-925, BL-926 and BL-922a/b hold the Build 13 cut; P-4a/b, BL-961, BL-978a/b and P-6b/c follow.

## 8. Conflicts

### For product (card gaps)
- K2 (NS-09-R14, section 5 and the Never line): the server keeps a let-go row when its words changed after the phone's base (final review B-2), and under a legal hold (`20261016000000:771-788`). The phone then returns the draft as `ready` (`merge.ts:584-596`), so it becomes keepable again. R14 says no row survives acknowledgement. Default: as built; R14 names the two exceptions.
- K3 (NS-09-R6): the card says "Storage in Me", but Storage says letters and recordings never appear there (`storage.tsx:24-28`). Recording states live in Where your letters live (`where-letters-live.tsx:16-27, 78-80`). Default: the card.
- K5 (NS-08-R13): the card keys the object on "entry id plus sha256". The built key is the entry id path, with the hash checked rather than keyed (`contract.ts:19-21`; `queue.ts:20-23`).
- K6 (NS-08-R8): the card calls the keep-safe card "existing", but F08 records it as not built. The nearest surface shows until the first export, not once. Naming iCloud also trips the claims rule (`claims-capabilities.test.ts:206-211`).
- K8 (NS-10 section 5, R3, R5): "the app offers B their own book" cannot work while a phone has one owner (`ownership.ts:49`) and D1 forbids deleting A's book. Default: hide A's book from B and offer sign-out; B's book stays on the server and B's other phone.
- K9 (NS-10-R13): "once, until dismissed" differs from the built line, which is shown on the first Book visit and then marked shown when the Book is left (`book.tsx:122-133`). `auth.en.ts:146-147` also calls the recording sentence counsel-read, and the card names no counsel gate for it.
- K12 (NS-12 section 10): the card lists five columns. The table also has `machine_edits` and `superseded_by`; a toggle of `in_book` alone writes a version with the same words; and the table has no grant.
- K13 (NS-11-R1): Me's sub-page Where your letters live has its own Export row (`where-letters-live.tsx:64`), so "exactly one row" depends on whether that sub-page counts.

### For Karma (engineering decisions)
- K1: NS-08 has no wave in 13, section 4, while #847 (D3) puts its reads in wave 1. This file uses wave 1 for the readiness rows.
- K4: BL-977 satisfies NS-09-R9 to R17, but R6 to R8 have no locked backlog row (P-4 exists only in #847). BL-976 still reads "blocked (PR #622 merged)" although #622 has merged.
- K7: NS-08-R15's sign-out wait reads the sync outbox only (`auth-store.ts:188-194`). Recorded here for the flip build.
- K10: 13, section 3, sizes NS-09 as "S (3 changes)". The open rows take 4 PRs, P-4 among them, which #847 sizes M.
- K11: NS-10-R7 makes the row idempotent "on document, version and client time". The server de-duplicates on the request key, with a fingerprint that leaves out client time (`20261005000000:165-194, 517-519`). Rec: a client key per answer, as in 3.2.

## 9. Open questions
Founder or counsel:
- OQ-1 (NS-08): which storage path. Owner: founder. Default: none; no flip.
- OQ-2 (NS-08): who runs the production drill. Owner: founder with `ops`. Default: founder.
- OQ-3 (NS-08-R9): the backup of the backup. Owner: founder with the CFO role. Default: no flip until answered.
- OQ-4 (NS-08-R8, NS-10-R13): whether the iCloud line and the recording sentence need counsel (Q43). Owner: founder, through counsel. Default: yes; until then only `arrivedPlain`, and no R8 line.
- OQ-5 (K8, D1): a second account on a phone that holds the first account's book. Owner: founder (D1 is founder-class). Default: hide and offer sign-out; no second store on the phone.
- OQ-7 (K2, D7): the later-edit and legal-hold exceptions to the purge on acknowledgement. Owner: Karma with the CPO role; founder if D7 is reopened. Default: as built.
- NS-12 gates: counsel Q51, Q32, Q48. Owner: founder (BL-949). Default: not built.

Other owners:
- OQ-6 (NS-10-R9): what this phone sees when the account is deleted elsewhere. Owner: `sync`. Default: whatever the session-ended or no-book path already shows.
- OQ-8 (BL-961): may it change `_layout.tsx`? Owner: Karma. Default: yes, named in its scope.
- OQ-9 (NS-09-R6): the 3-launch threshold. Owner: CPO role. Default: 3.
- OQ-10 (NS-11): the slip window, and a first copy before any birthday. Owner: CPO role. Default: 7 days after; Me row only.
- OQ-11 (U3): is `20261016000000` applied in production, and is `app.held_sync` on? Owner: `sync`. Default: treat R7, R8 and R14 as stand-in only until confirmed.
- OQ-DS1: read versions by RPC on letter open, never in the pull. Owner: `data-architect`. Default: yes.
- OQ-DS2: remove as a queued push op, not a direct RPC. Owner: `sync`. Default: queued op, gated on a server flag.
- OQ-DS3: versions whose words equal the next version's (an `in_book` toggle). Owner: `data-architect` with `product`. Default: hidden from the list.
- OQ-DS4: removing a version under a legal hold. Owner: `data-architect` with `legal`. Default: refused, and the version stays.
- OQ-DS5: a restore carries `author_edits` null, as every phone write does today (`outbox.ts:461`). Owner: `data-architect`. Default: accepted.

## 10. Unverified
- U1: when VoiceOver reads an `announce()` after `Alert.alert` closes on iOS 17 and later (R4b). Device row.
- U2: whether React Native 0.86's `Alert` takes a preferred-action flag on iOS, and which button VoiceOver lands on first (R9).
- U3: whether production runs `20261016000000` with `app.held_sync` on (OQ-11).
- U4: whether the Keychain session survives an iCloud device restore (NS-10-R6). Device row.
- U5: whether `expo-sharing` 57 reports completion versus cancel (NS-11-R3, R16).
- U6: the `expo-battery` Low Power Mode API on SDK 57 (NS-11-R17).
- U7: the cost of 50 synchronous `File.delete()` calls on the JS thread on an SE 3 (NS-09-R13). BL-929 row.
- U8: storage and egress prices (NS-08-R2); BL-976 reads them with a date.
