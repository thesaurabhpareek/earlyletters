# Security and privacy acceptance for the newest scope (part 1 of 2: frame, data classes, findings, function areas)

Task RD-D. Author: `security-architect`, 20 Nov 2026, docs only. Nothing here was run on a phone, a hosted project or a Swift toolchain. Part 2 (`SECURITY-PRIVACY-ACCEPTANCE-2-CARDS.md`) holds the per-card rows NS-46 to NS-52. The other three files are `SECURE-CODING-CHECKLIST.md`, `ABUSE-AND-FAILURE-CASES.md`, `SECURITY-OPEN-QUESTIONS.md`.

This file decides no founder or counsel question and weakens no rule. Words a parent reads are PROPOSED keys only. Where the newer material (unlocked, `docs/locked-pack-inputs-20nov` at `bee01360`) disagrees with the locked pack (`450bcb4a`), the locked pack stands and the disagreement is a Conflict line in `SECURITY-OPEN-QUESTIONS.md` for product.

Tags: [V] verified this session (file:line on `origin/develop` at `16e61549`, or the named branch file), [E] estimate with basis, [U] unverified. Ids: card rows `NS-nn-Rn`; my controls `NSC-nn` (`docs/tdd/new-scope/security.md` section 2); boundaries B1 to B11 (same file, section 1); adversaries A1 to A11.

## 0. What I read, and what I did not

Read in full: `docs/tdd/new-scope/security.md`, `privacy.md`; cards NS-46 to NS-50 (`21-days-cultural-photos-home.md`: sections 10, 11, 12, 13, 18 of NS-46 to NS-50 and the NS-47, NS-46, NS-48, NS-49, NS-50 acceptance rows I cite); NS-51 and NS-52 acceptance rows (`27-photo-moments-and-media.md`); `26-founder-direction-photos-library-and-media.md`; the risk-security function file (all, including its 20 Nov addendum); `docs/ops/LABEL_GUARD.md`; `docs/legal/DATA_CLASSIFICATION.md` sections 1 and 2; chapters 05 and 06 rule heads; issues #909 and #868.

Read in part (headings, requirement tables, grep for security terms): function files for ai-and-speech, languages-and-localisation, lifecycle-and-platforms, messaging-and-entry-points, operations, notification-catalogue, days-library, cultural-background-data, privacy.

Not read: `docs/product/prd/tools/**`; function files for finance, marketing, support, back-office, research-validation, quality (800 lines), data-and-measurement (bodies), print-and-fulfilment, feature-opportunities; the e2e design branch; eval A, B, C; NS-51 and NS-52 sections 4 to 6 and 8 to 23 beyond the rows quoted; `07-remaining-capability-rows.md`. Where a conclusion depends on those, it says so.

## 1. Method

STRIDE per card that crosses a boundary (infosec skill section 2). Each row in part 2 has: the threats (one STRIDE letter each), the control, the acceptance test (`[id] title`, level, and a mutant: the one-line change that must turn it red), the data class and level, whether anything leaves the phone, the App Store label effect, and the retention and deletion path.

Test levels: `unit` (vitest, pure), `db` (`npm run test:db`, embedded Postgres), `scan` (source or plist or lockfile scan), `e2e` (app test harness), `device` (a phone row, `qa` and founder), `review` (a named human read on record). A device row cannot be replaced by a unit test; the card says so where it matters (NS-52-R39).

Mutant rule (Rec): every P0 row in part 2 names a mutant. A test with no mutant that goes red is not accepted as proof by this reviewer (my Rec, not yet a rule). Mutants are described, not committed, except where an existing mutant corpus exists (`photos-device.test.ts` holds 98 per `security.md` 3.1 [U: count not re-run]).

## 2. New data the newest scope introduces, and its class

Levels per `docs/legal/DATA_CLASSIFICATION.md` section 1 [V: lines 42-61]. Rule numbers R1 to R9 are section 1.1. Data-policy classes (A, C, S, T) are `docs/legal/data-policy.md:46` [V].

| Data | Card | Level | Why | Where it lives | Leaves the phone |
|---|---|---|---|---|---|
| Ticked day ids, moved dates, hemisphere (the whole days store) | NS-46, NS-47-R1 | L4 | A ticked tradition day implies a faith or origin. DATA_CLASSIFICATION names neither religion nor ethnicity [V: grep 20 Nov, 0 hits for religion or ethnic]. It is L4 by R1 (highest wins), by the L4 definition "sensitive data about a person" (`DATA_CLASSIFICATION.md:49`) and by precedent: `data-policy.md:46` already puts "languages spoken (proxy for ethnicity)" in class S | Application Support file outside `scribe.db`, excluded from backup (NS-47-R6) | No (NS-47-R4) |
| Tradition and country picked while browsing | NS-47 | L4 in memory only | Same | Component state; never a route parameter or setting (NS-47-R2) | No |
| `culture.asked` flag | NS-47 | L2 | One value for both answers, so it cannot say "chose days" (NS-47-R2) | `settings`, keyed by account | No |
| `notifications.dayNames` switch | NS-47-R12 | L3 | A setting about whose name may show; cleared when App lock turns on | `settings` | No |
| Library-day notification body and identifier | NS-46-R32, NS-48 | L3 in the iOS pending list; neutral by default | A note on a fixed date repeats yearly; the date alone can hint at a day | iOS notification store | No |
| Public day name in a title | NS-46-R36 | L2 only for the hand-listed `publicTitleOk` days | Seasonal and shared days, never a faith day | iOS notification store | No |
| Photo moments index (30 moments, 6 ids each) | NS-51-R6 | L4 | Derived from a child's pictures (R2, R6) | Phone database, excluded from backup | No |
| Chosen album ids | NS-51-R14 | L4 | Stored as ids, never names | Phone database | No |
| Library asset ids and creation dates read | NS-51-R5 | L4 in memory | Read for date only | Memory | No |
| Thumbnails of library pictures in the moment sheet | NS-51-R9, R25 | L4 transient | A child's picture | Memory, `Caches` | No |
| Suggestion title and date (Apple's picker) | NS-49 | L4 in memory | A title can name a place or person (NS-49 section 10) | Memory | No |
| Suggestion file copy | NS-49-R7, R19 | L4 transient | The picture | `Caches`, deleted once read | No |
| Stored picture, 512 and 1,280 px copies | NS-01, NS-37 | L4 | Child's picture (R6) | `Application Support/photos`; stored copy in the iPhone backup, the copies excluded | No (Variant A) |
| Stored video, poster frame | NS-52-R5 | L4 | Child's voice and picture | `Application Support/media/` | No under Variant A; Variant B is X2 and founder-gated |
| Video container metadata (location, device, creation tags) | NS-52-R5 | L4 until stripped | Phone video carries fields we have not listed [U: FR-SEC-30 says unverified] | Memory, temp | Must never leave; stripped on re-encode |
| Alt text ("Describe this picture") | NS-52-R28 | L4 | Free text (R3) | Phone database | No |
| Language pack and model files | FR-AIS-12, -13 | L1 (public files) | Public files; the request reveals the language picked (`DATA_CLASSIFICATION.md:768`, L3 request log) | Phone files | A download request leaves; no content |
| Withheld machine output (NS-17) | NS-17 | L4 | Derived from a voice (R2) | Phone database | No |

Special-category handling for days and cultural background (not a legal answer):
- What I can set: the engineering class (L4), the controls in part 2, and the rule that nothing about a tradition, country or day id may reach a server, a log, analytics, a URL, a crash report, an export, a backup or a notification title (NS-47-R4, R8, R9, R10, R12).
- What I cannot set: whether this is GDPR Article 9 or a state "sensitive data" category when it never leaves the phone, and whether a recorded act (PRIV-R21) is owed. The cards route this to counsel (CUL-Q5, Q6, Q7, Q11; NS-46 section 17). The register lists Article 9 for health only [V: `docs/legal/compliance-register.md` CR-100 line 163]; religion is a gap in the register, to file with `legal`. The flag stays off until counsel answers (NS-47 section 13, risk checks). I do not default a counsel answer.
- The residual I will not hide: the reminder date repeats yearly, so a person with the phone and time can infer the day. No claim may say "nobody can tell" (NS-47-R22).

## 3. Findings of today's reviews, each with an acceptance row

### 3.1 Second account on one phone (`[X4-R1]`, NS-10-R3, FR-SEC-01 to 04, FR-SEC-34)
State: the pure reader landed (`apps/mobile/src/lib/auth/account-scope.logic.ts`, `bookVisibleTo`; test `apps/mobile/test/account-scope.test.ts`; #869, BL-961 PR 1 of 3) [V]. The gate still opens Tonight for any session with a local book (`apps/mobile/src/lib/first-run/gate.logic.ts:123-125`) [V]; I found no caller of `bookVisibleTo` in the gate [U: grep of `apps/mobile/src` showed `account-scope.logic.ts` only as its own file; PR 2 and 3 are not on develop]. `takeOwnership` still only refuses to sync on a mismatch (`apps/mobile/src/lib/sync/ownership.ts:49`) [V].

| Id | Acceptance (Given, When, Then) | Level | Mutant | Class |
|---|---|---|---|---|
| `[X4-R1][NS-10-R3] gate never opens Tonight on another account's book` | Given owner A and session B, When the gate runs, Then B lands on the no-book route and no screen names A | unit on `gate.logic.ts` | Replace `hasLocalBook` with the unfiltered count: red | L4 |
| `[X4-R1] every surface and the planner return 0 rows for B` | Given Asha seeded as A and a fixture B, When B is signed in, Then Book, Find, Photos lens, share, seals, versions cache, names list, Days store, moments index, planned reminders and delivered notes show or hold none of A's data | e2e, one assertion per surface | Remove one surface from the enumeration: red (the test must list surfaces from a registry, so a new store fails by default) | L4 |
| `[X4-R1] sign-out clears the Days store and the moments index, keeps the book` | Given A signs out, Then the library-day notes are cancelled and dismissed, the store and the moments index are empty, the book stays (D1) | e2e | Skip the clear in sign-out: red | L4 |
| `[X4-R1] a system-ended session clears the same` | Given the session is revoked by the system, Then the same | unit | As above | L4 |

Leaves the phone: no. Label effect: none. Fix owner: `mobile`, lens B `security-architect` (auth path, `.claude/agents/security-architect.md` review paths) [V: roster `review_paths` includes `**/auth/**`].

### 3.2 Consent retry (NS-10-R7, PRIV-R21)
State: fixed on develop. `recordConsent` now holds one answer id per `[userId, document, version, accepted, step, context]` (`apps/mobile/src/lib/auth/consent.ts:110-117`, `consent-key.logic.ts`, #903) [V]. The privacy design's "mints a new key per call" (`privacy.md` 1.10) is stale; I record it as closed.

| Id | Acceptance | Level | Mutant |
|---|---|---|---|
| `[NS-10-R7] a retry after a lost answer writes one row` | Given the first `record_policy_act` answer is lost, When the step retries with the same answer, Then the server holds one `policy_acceptances` row for it | unit (key) and `db` (idempotency on the server) | Make the key `crypto.randomUUID()` per call: red |
| `[NS-10-R7b] a changed answer ends the earlier hold` | Given accept then decline for one document, Then two rows, in order | unit | Key on document only: red |

Class L3 (acceptance row). Leaves: yes by design (consent record, declared). Retention: PRIV-R21 fields; 3 years (`DATA_CLASSIFICATION.md` section 2 "consent 3 years").

### 3.3 G1: the server does not gate `sync_pull` reads on consent (issue #909)
Fact [V]: `sync_pull` starts with `public.require_user()` only (`supabase/migrations/20261016000000_sync_v1_server.sql:1306`). The phone's `canSync` is the only control before consent (`docs/tdd/new-scope/engineering-facts-bl-987.md:44`). IAM-R03 covers account, invite and content writes only (`docs/engineering/05-identity-and-access.md:33`) [V]. PRIV-R08 says consent that gates a server feature is checked on the server (`07-privacy-engineering.md:49`) [V].

My answer to the ask (a recommendation for the RFC; the rule text is not changed here):
- Decide: yes, a server gate is needed for reads of OTHER members' letters. Rationale: those reads are L4 of a third party served to a caller who has not accepted current terms with `age_attested`. A caller reading only their own rows needs no gate: PRIV-R09 says a consent version change never gates export or deletion, and a parent must not be locked out of their own words by a newer Terms version.
- Proposed row (PROPOSED id `IAM-R26`, text for the RFC to principal-architect, data-steward, compliance-engineer, ai-eng-lead; founder approves any MUST): "`sync_pull` serves rows from `book_entries` (other authors) only to a caller whose latest `terms` acceptance carries `age_attested: true` (and, for sensitive data declined, per PRIV-R21); otherwise it serves the caller's own rows and returns a named SQLSTATE flag for the rest. Own-row reads, export and deletion are never gated (PRIV-R09)."
- Contract: older builds call `sync_pull` (API-R11). The gate must degrade by omission (fewer rows plus a flag the old build ignores), never by a new error that old builds treat as a crash. `data-architect` owns the migration and `api` the contract.
- Open for the founder: whether "newer Terms version" blocks others' rows at once or after a grace window (POLICY_VERSIONING sections 5 and 6). Default: grace as POLICY_VERSIONING says; I do not read that file's numbers here [U].

| Id | Acceptance | Level | Mutant |
|---|---|---|---|
| `[G1] sync_pull omits others' rows without current age-attested terms` | Given a co-parent persona with no acceptance, When `sync_pull` runs, Then 0 rows of the other author come back and own rows do; with acceptance, both | `db` (access matrix cell, deny and allow) | Remove the check: red |
| `[G1b] export and deletion work without current consent` | Given a stale acceptance, Then export and `request_account_deletion` succeed (PRIV-R09) | `db` | Add the gate to those RPCs: red |
| `[G1c] an old build still pulls its own rows` | Given a frozen v1 contract fixture, Then the response parses | `unit` on `packages/api` fixture | Return an error shape: red |

Status: not yet. Handoff reply owed on #909 once this file merges.

### 3.4 Writing tools (D2, #868, NSC-05)
Fact [V, from #868 body lines 38-47]: React Native 0.86.3 and `@expo/ui` 57.0.21 expose no writing-tools switch (0 files for `writingtools` in `node_modules/react-native`). The platform has `UITextInputTraits.writingToolsBehavior` and SwiftUI `.writingToolsBehavior(_:)` from iOS 18; the app targets iOS 17 (D-098). Whether writing tools send text off the phone is [U]. NS-01-R50 stays open; NS-06-A22 waits on the founder (#868 item 1).

Acceptance (all P0 until the founder decides, `[NS-01-R50]`):
| Id | Acceptance | Level | Mutant |
|---|---|---|---|
| `[NS-01-R50][NSC-05] source pin: every field whose text becomes a letter's words sets writing tools off` | Given the native text-view setting module (under NSC-01), Then each listed field passes the setting; the list lives in one file | scan | Add a field without the setting: red |
| `[NSC-05] device row: writing tools are absent on Review, photo words, place, From, Firsts label, Add a day, Move a date` | Given iOS 18 or later, Then the system menu offers none | device | Remove the setting: row fails |

New fields from NS-46 and NS-52 join the list: the Add a day field and move-a-date field (NS-46 section 14, ruling D2), and the alt-text field (NS-52-R28). Class L4. Leaves: unknown [U].

## 4. Function areas (the addenda), what each adds for security and privacy

Each row: the area's new or changed requirement ids, the control I accept, the test, class, leaves the phone, label effect, retention. Only ids I read are cited.

| Area | Requirement ids (file) | Control and test | Class | Leaves | Label | Retention or delete |
|---|---|---|---|---|---|---|
| Trust and risk | FR-SEC-27 to 35, RSK-27 to 32 (`functions/risk-security.md` addendum) | Variant B only: private bucket, signed URL at most 5 minutes (Q-S8), membership checked in an Edge Function, delete or move on revoke because one URL cannot be revoked (Supabase doc read 20 Nov per the file). Variant A: no upload. Tests `[FR-SEC-27]` access matrix for non-member, left member, second account | media L4; URL L4 secret | Variant B only (X2) | Photos or Videos Yes under B (NS-52-R23) | Variant B purge ledger (NS-52-R22) |
| Trust: abuse | FR-SEC-09 to 12, 23 | Invite brake alert, invite page shows no child name; token in fragment | tokens L4, hash L3 | existing | none new | 90-day hash |
| Data | FR-PRV-30 to 46 (label, registry, canary) via `functions/privacy.md` addendum [U: privacy addendum read in part] | One registry row per store; the `[X4-R1]` enumeration is built from the registry; `classification.test.mjs` `mustBeL4` for server columns | per row | none new | G11 guard | per row |
| Ops | FR-OPS-02, -06, -07, -08, -15, -16 (`functions/operations.md`) | A pause key ships before it is needed (`killSwitches.libraryDays`, `photoMoments`, `photos`); restore drill compares every new column; a restore never reveals a seal (FR-OPS-08, P0 on a scratch project, Asha only); Route 1 rehearsed before server-held additions | none new | none | none | per runbook |
| AI and speech | FR-AIS-01 to 06, 09 to 13, 16 to 19 (`functions/ai-and-speech.md`) | The constitution tests (the `EditType` union pin, `verifyEdits` only path, 15 percent ceiling, `raw_transcript` immutable). Model files trusted only when SHA-256 and size equal the signed manifest, signature checked before any download, mismatch deletes the file (FR-AIS-13). No server transcription in v1.0 (FR-AIS-17); any later path needs my read and counsel's (X2). Tests `[FR-AIS-13] a tampered model file is deleted and never loaded` (unit; mutant: skip the hash compare) and `[FR-AIS-01] EditType union pinned` | model files L1; transcripts L4 | model download requests only | none | model files deleted with Erase |
| Languages | FR-LOC-30 to 37 [U: addendum headings only], FR-AIS-11, -12 | A pack or model comes from our host or a mirror we control; a mirror is listed in the signed manifest; the hash mismatch falls back, never loads. Strings in packs pass the content rules test. Test `[FR-AIS-12] mirror fallback on hash mismatch` | L1 | request only | none | n/a |
| Lifecycle | FR-LCY-35 to 43 (`functions/lifecycle-and-platforms.md`) | Per phone and per account: the moments index is never shared (FR-LCY-40); account deletion removes every picture, video, poster, thumbnail cache and index file first then row (FR-LCY-41, NS-01-R16c); sign-out keeps the book and media but clears the opt-in, index and album choice (FR-LCY-42, NS-51-R17); closure: Save a copy works with no server and includes media (FR-LCY-43) | L4 | no | none | as listed |
| Messaging and entry points | FR-MSG-23, -24, -27, -30, -34, -36, -44 (`functions/messaging-and-entry-points.md`) | AASA lists exact paths only; no page that carries a token loads a third-party script or sends a referrer (FR-MSG-36); the clipboard is read only after a tap (FR-MSG-30); a widget, share extension or Photos extension needs its own card and my read (FR-MSG-44). Tests: `[FR-MSG-23] AASA paths exact` (release gate), `[FR-MSG-36] token pages load no third party` (web test) | tokens L4 | link opens only | none | token expiry |
| Notification catalogue | NS-48-R2, R9, R11, R21; NTC addendum | One pure key function; no new class, no new note; neutral lock-screen text for family, tradition, culture-led and national days; no category sets `hiddenPreviewsShowTitle` (NS-47-R36) | L3 bodies | no | none | until re-plan |

## 5. Cross-cutting acceptance that every new store must meet

A new store (file, setting, column, cache) merges only with all of these, each by id in the checklist file:

1. A registry row with level, scope per account, sign-out, Erase, export, backup, sync (NS-47-R1 pattern; FR-PRV-07).
2. It is in the `[X4-R1]` enumeration (3.1).
3. It is in the Erase scan: `apps/mobile/test/erase-all.test.ts` is extended per store [V: file exists]; a kill mid-erase resumes (NS-47-R16).
4. It has a canary row in the log harness (J-N18; `supabase/functions/_shared/log/canary.test.ts` is the server half [V: file exists]).
5. It is excluded from backup where L4 and derived (NS-47-R6, NS-51-R6) with a read-back, or the where-it-lives line says it is in the iPhone backup.
6. A blank switcher snapshot for any screen that shows it (FR-SEC-22, FR-SEC-33; E18).
7. Its label effect is written in the PR (`docs/ops/LABEL_GUARD.md`; part 2 per card).

## 6. The App Store label guard, what it will do to this scope

`scripts/release/label-effect.mjs` (BL-975) [V: file exists, 249 lines] and `docs/ops/LABEL_GUARD.md` [V]. Checks: G11-1a (added lines that call the network and name letter text, a recording, a picture or a child name; new server tables, columns, buckets or functions), G11-3 (a new analytics, crash or ads SDK in `apps/mobile/package.json`, a new entitlement, a new usage string in `app.config.ts`), G11-2 (a `Label effect:` line on every card), and a record check (the PR body names a D-id, that D-id is a decision on the base branch whose section names the privacy label, and `docs/legal/app-store-privacy-labels.md` changes in the same PR).

Consequences I expect [E, from the guard's rules]:
- NS-49 adds an entitlement and NS-51 adds a photo-library usage string: both trip G11-3 and need a D-id plus a label file edit in the same PR. Plan the D-id before the module PR.
- NS-52 Variant B adds a bucket: trips G11-1a.
- NS-46, NS-47, NS-48, NS-50 add no network call, SDK, entitlement or usage string: expected to pass G11-1a and G11-3; each still needs its `Label effect:` line (G11-2). The guard cannot see data that leaves through a helper elsewhere (residual risk, `LABEL_GUARD.md`); the founder's merge is the real gate.
- The guard never decides the label (counsel does, Q54).
