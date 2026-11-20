# Pack delta 1: cards NS-38 to NS-45, from App Store download to the first kept letter

Status: v2 (re-based), 20 Nov 2026, `principal-architect`, RD-A. Part of `PACK-DELTA.md` (legend and verdicts there). Source: `docs/product/prd/19-from-download-to-first-letter.md` on `docs/locked-pack-inputs-20nov` at `a3806f74` (1,768 lines; PR #934 open, not merged). Status line 3 reads "CURRENT (LOCKED rev 2)"; line 5 still reads "Locked v1.0 candidate ... needs Karma's ruling" (stale detail, `19:3-5` @a3806f74). Rev 2 changed the card by 26 lines: backlog ids were stripped from the product layer (BL-340, BL-488, BL-922, BL-347, BL-579, BL-962, BL-965 no longer appear in the rows) and one new rule K15 was added to NS-45 (no staff tool exports a book; a deleted-elsewhere phone and a suspended account get a defined handling; `GAP-LOG.md` K15). No row id was added or removed. Line cites `19:n` below are at `bee01360`; at `a3806f74` they are +2 up to NS-44 and +4 from NS-45 section 10 (`19:1601`). No re-base changes a verdict. Cite form `19:n` means that file at that line. [V] verified, [E] estimate, [U] not verified.

What changed for engineering, in one paragraph: the locked pack treated first run, sign-in and Plus as built and only cited them (card 19's own "Why this file exists" paragraph, rows C25, C44, C45, C46 of `07-remaining-capability-rows.md`). Card 19 turns them into eight cards with 96 P0 rows, 94 of which have no backlog row (`23:48`, from `p0.py`). Our eight designs cover none of NS-38 to NS-45, except the new-phone path of NS-10 (`08-keeping.md:96-170`) which shares `lib/first-run/*` with NS-39 [V: `grep -c "NS-3[89]\|NS-4[0-9]"` over the eight design files returns 0 in each].

Most of what the cards ask for is already built; the work is the listed gaps. Each card's "Built today" section was read at head `7d0446d02` of the inputs branch, not at develop `16e61549`; I re-checked six of its claims on develop and all six held (list in `PACK-DELTA.md` section 6).

## 1. Card by card

Size and wave are [E] using `13-engineering-plan.md:9-13` (S one change, M two to four or one local migration, L five or more or a native module, a server schema change, a new entitlement, or a counsel gate). Wave numbers are the pack's own (`13:106-112`); card 19 sets no wave, so I place them by dependency. Gate letters: F founder, C counsel, D device, W words.

### NS-38 The App Store page and install
- P0 rows: 8 (R1 to R5, R7 to R9). Section 10 (`19:138-150`): no phone fields, no migration, no flag. Files: `packages/brand/index.ts`, `packages/content/src/store.en.ts`, `packages/content/src/release/app-review.en.ts`, `packages/content/test/rules.test.ts`.
- Delta to build: `app-review.en.ts:4` still cites D-160's "coming soon" half, D-161 supersedes it (`19:149`) [V on develop]. `app-review.en.ts:32` says "a link and a 6-digit code", which changes if NS-41 O-6 (8 digits) lands (`19:148`). F21 text still names "Memory Book"; D-139 wins (`19:147`).
- Design files touched: none of ours. Verdict: NO DESIGN YET, but a paragraph in the release design is enough (content and release only). Size S, wave 1 (it holds the store candidate) [E]. Gates C (counsel Q24), W, F (App Store Connect fields are founder steps).

### NS-39 First launch and the first interaction
- P0 rows: 10. Section 10 (`19:318-335`): `app/_layout.tsx`, `lib/first-run/gate.logic.ts`, `use-first-run-route.ts`, `welcome-sign-in.tsx`, `outage-screen.tsx`, `speech-consent-card.tsx`, `launch-recovery.tsx`, `app/listen.tsx`.
- Delta to build: remove the app-lock offer from the end of first run (NS-39-R9; `onboarding.tsx` mounts `<LockOffer child={child} />` [V on develop, `onboarding.tsx` around line 578]); fix the stale header of `lib/capabilities.ts:1-12`, which says store profiles keep server features off while `eas.json` `production` sets them on (D-157) [V: header text read]; `LOCAL_START_FALLBACK` stays a compiled constant (D-066, D-068).
- Design files touched: `08-keeping.md` section 3 (NS-10 first-run gate, BL-922a and BL-922b both edit `lib/first-run/*`). Verdict: NO DESIGN YET; amend `08-keeping.md` section 3.2 and the merge-order list at `08-keeping.md:246-250` so NS-39 rows queue behind BL-922a, BL-922b, BL-978a. Size M, wave 2 [E]. Gates D (device first-run walk), W.

### NS-40 Age and region checks
- P0 rows: 11. Section 10 (`19:502-518`). New: native module `modules/age-range` (Swift, iOS 26.2 SDK, entitlement `com.apple.developer.declared-age-range`) behind `lib/age-range.ts`; server tables `ops.restricted_jurisdictions` and `ops.compliance_check_counts` and a `before user created` hook from File 28 on `origin/feat/db-compliance-gates` (PR #424); a new `AuthErrorKind` `region_refused` (PROPOSED) that must not be treated as an outage.
- Not built (card): Declared Age Range anywhere under `apps/mobile`; the region check is not on develop; BL-553's refusal screen is open (`19:515-517`) [V: `git ls-tree` shows no `modules/age-range`].
- Interactions with merged work: the privacy-label guard (BL-975, #897 and #898) fails builds that add entitlements or usage strings without a declared label effect (commit titles on develop). Adding an entitlement is therefore a labelled change in the same PR [V: commit subjects; guard behaviour [U], not read].
- Design files touched: `security.md` (new section, no age or region threat model), `data-and-sync.md` section 2.3 (server migration register lacks File 28), `architecture.md` section 2.3 (contract changes) and `privacy.md` section 3 (label). Verdict: NO DESIGN YET. Size L (native module, entitlement, server migration, red-team review of `supabase/**`, D-041) [E]. Gates C, F (O-2, O-4), D. Sent to product: none. To `security-architect` and `red-team`: the hook is a sign-up gate on `auth.users`.

### NS-41 Sign up and sign in
- P0 rows: 18, the largest of the eight. Section 10 (`19:768-791`). Existing: `lib/auth/*`, `app/(auth)/sign-in/*`, `welcome-sign-in.tsx`, `lib/sync/ownership.ts`.
- Gaps listed by the card (all "Backlog need"): code length 6 vs 8 (`supabase/config.toml:71`, `email.ts:28-29`; O-6 changes both ends in one release); pending-link note lives 1 hour against a 15-minute token (`email-link.logic.ts:36`); wrong-code pause is in memory only (`pending.ts:72`); no bot control on send (O-7); email is trimmed but not lower-cased (`[NS-41-R24]`); Apple requests full name and email while NX-31-R9 says email only (`apple.ts:51`, O-8); Apple revocation checked only when a user id first appears, no foreground check and no `credentialRevokedNotification` listener; Send and Continue disabled silently (no reason text); `auth.noEmailHelp` names Google; `killSwitches.signIn` PROPOSED (O-19); second account "never sees" not built (BL-961, ADR 0031, O-5).
- Config the card puts on the founder's Supabase dashboard: `otp_length`, `otp_expiry 900`, `max_frequency 1m`, rate limits, JWT 900 s, refresh rotation, anonymous off, manual linking off, exact redirect allowlist `https://earlyletters.com/auth/callback` (`19:770`). These are production settings, not code. They need an owner and a record (D-041 spirit; `ops`).
- Design files touched: `security.md` (add NS-41 threat rows; section 3.x covers NS-10-R3 only), `architecture.md` AC table (`:112-114`, add `signIn` key or record why not), `08-keeping.md` section 3. Verdict: NO DESIGN YET. Size L [E]. Gates F (O-5, O-6, O-7, O-20), D, C.
- `killSwitches.signIn`: v1 raised it as an open question against the rule that a switch only hides (`packages/api/src/kill-switches.ts:2-6` [V]). Rev 2 settles it: CL-111 says mobile adds `libraryDays` and `signIn` to `kill-switches.ts` and ADR 0029 (`GAP-LOG.md` CL-111 @a3806f74). The ADR text, not me, defines what a sign-in pause hides; `security-architect` reads it.

### NS-42 Agreements and notices at collection
- P0 rows: 13. Section 10 (`19:997-1016`). Built: local agreements table (schema v10), `record_policy_act`, `policy_versions`, consent builder partly (`apps/mobile/src/lib/auth/consent.ts:92-119`).
- Gaps: PRIV-R21 fields missing on the phone's consent rows (`rendered_sha256`, `app_build`, `os_major`) and locale hard-coded `'en'` (`apps/mobile/src/lib/auth/consent.ts:124`; the card says `:113`, which is the answer hold); BL-577 is the app half, deferred; BL-579 uploads the local rows, deferred. The server migration `20261108000000_consent_record_fields.sql` exists on develop [V: `git ls-tree`], but when `app.consent_fields_required` turns on a row without the fields is refused (23502), so the builder must land first (`19:999`). Whether that migration is applied to production is [U] (card: "pending apply, UNVERIFIED").
- Content defects the card calls false in a store build: `authCopy.consent.terms.body` and `en.trust.signIn.privacy` say letters are private to "the people you invite" (CG3). Legal-adjacent words: founder merges.
- Legal links open unversioned `/terms` and `/privacy` while the phone records 4.1.0 and 3.0.0 (`19:1012`, D-144); needs a pinning test and versioned links.
- Design files touched: `privacy.md` section 2 (it says "No card adds a new consent except NS-08 and NS-25", `privacy.md:104`), `data-and-sync.md` section 2.3. Verdict: DESIGN NEEDS AMENDMENT (privacy.md 2 is wrong for first run) plus NO DESIGN YET for the builder order. Size M, wave 1 (it gates every store build that writes consent rows) [E]. Gates C (Q-D, Q20, Q41, Q44), F, W; CG3, CG4.

### NS-43 Setting up the first book
- P0 rows: 11. Section 10 (`19:1205-1223`). Built: optional name, date rules on phone (`packages/core/src/child.ts:104-122`) and server (`20261109000000_child_name_optional.sql:79-82`).
- Gaps: one shared date for all first-run children against F03-REQ-001; one transaction per book, not per first run (`store.ts:338-346`); lock offer at the last step (see NS-39-R9); dictionary seed from names not found in `addChild` ([U]); writing tools on the signs-as field (BL-962 checks RN support).
- Design files touched: `data-and-sync.md` section 6 (F4: staging and production never migrated by CI; the card needs `20261109000000` applied before store builds send empty names, `19:1207`). Verdict: NO DESIGN YET. Size M [E], wave 2. Gates F (O-14), D.

### NS-44 The first letter and the allowance
- P0 rows: 10. Section 10 (`19:1400-1416`). Built: two free letters, counted only with words (`keep-step.ts`, `letter-ledger.logic.ts`, `BUNDLED_FREE_LETTERS = 2` at `packages/api/src/remote-config.ts:36`).
- Gaps: ledger per phone (Keychain this-device-only), not per account (O-13); under-1-GB line on Listen not built (G-E04; `GAP-LOG.md:334` routes it to a new mobile row); `freeLettersAllowance` raise-only remote value.
- Design files touched: `09-capture.md` (Listen primer), `11-foundations.md` NS-34 rows 1 and 15 (spot runs under 1 GB free, `11-foundations.md:160`). Verdict: NO DESIGN YET. Size S to M, wave 2 [E]. Gates F (O-13), D.

### NS-45 Account life after first run (sign out, Delete account, update line)
- P0 rows: 15. Section 10 (`19:1597-1616`). Built: local sign-out, wait for uploads, `session_expired`, forced-reauth epoch, deletion request with 30 days and cancel.
- Gaps: Apple revocation foreground check (O-18); no step-up and no email on request or cancel (security G5, O-17); account deleted elsewhere keeps letters (O-15); deletion copy says "v1.0 makes no photos" (`packages/content/src/features/account-deletion.en.ts:15-16`) and must name pictures on the phone; D6 sealed-letter line not built; `minSupportedVersion` has no consumer (`packages/api/src/remote-config.ts:99`, G-E03; FUNCTION-TRACE rows NR-16 and NR-119) [V: the schema field exists, a consumer is [U] by grep of `packages/api` only].
- Design files touched: `security.md` section 3.9 and NSC-03 (second account), `08-keeping.md` section 3, `data-and-sync.md` (deletion and purge: E8 says `held_discard` deletes words; deletion RPCs `20261005000000:405-469` cited by card). Verdict: NO DESIGN YET; amend `security.md` and `data-and-sync.md` deletion section. Size L [E] (BL-961 dependency, step-up, update reader, server email on request). Gates F (O-15 to O-18), D, C.

## 2. What the eight cards need as a set

1. One backlog row set. 94 of 96 P0 rows have no row (`23:48`); BL-994 is the requirement row only ("queued behind the agent limit", `23:1b`). The harness cannot pick rows with ids above BL-999 (`23:21` and the BL-999 note at `BACKLOG.md:4058`).
2. A first-run design file, `docs/tdd/new-scope/12-first-run.md` (name PROPOSED), owned by `mobile` with `security-architect` and `privacy` sections, covering NS-38 to NS-45 in the 08 to 11 shape.
3. A production settings register for Supabase Auth (NS-41 section 10) and for File 28. It needs an owner (`ops`) and a founder step.
4. Device rows for first run on a clean install (NS-39) belong on the run sheets of the builds that carry them (`11-foundations.md` NS-34 run sheet pattern).
5. Read order: NS-42 builder first (it blocks server flag), NS-41 config and code length together, then NS-40 (native module and region hook), then the rest (card 23 F38 to F45 order, `23:46-58`).

## 3. Conflicts and questions

- None of NS-38 to NS-45 contradicts a locked card (they add scope the locked pack treats as built). One tension: locked `07-remaining-capability-rows.md` rows C25, C44 to C46 "cite" these areas as built; card 19 says several parts are not (Declared Age Range, region check, step-up, update reader). No conflict line to product; the lock's rows are compatible.
- Card 19's header says LOCKED rev 2 and `22:153` names it in the lock; its line 5 still says candidate (header drift, PACK-DELTA section 4 item 8). The "is it in the lock" question of v1 is answered by `22:153`; whether the branch tip binds engineering before #934 merges is Karma's.
