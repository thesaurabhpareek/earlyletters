# Status audit 2 of ready rows, 10 Nov 2026

Written by `product`, docs only. It decides nothing and changes no requirement. It continues `docs/backlog/STATUS-AUDIT-2026-11-09.md` (PR #734), which covered the 54 ready rows with Severity S0 or S1, or `[Critical]` or `[High]` in the title. This one covers the other 91 of the 145 ready rows.

## Method and limits

- Universe: every `#### BL-###` heading in `docs/BACKLOG.md` on `develop` at 3ef55558 whose status line reads `ready` (145), minus the 54 in audit 1. Rows that live only in tables (for example BL-272, BL-273) are not in the 145.
- Evidence: `git grep` and `git log` on `develop` (history deepened to 521 commits), merged and open PR metadata over REST (155 open PRs read by hand, three pages). Nothing was built or run, and no device was used.
- A path or string match shows code exists, not that every Done-when line holds. Confidence is marked high (the cited line or PR settles it), medium (matches the scope, one or more Done-when lines unchecked) or low (a search found nothing decisive).
- File line numbers are on `develop` at 3ef55558. Commits before 3 Oct are one snapshot (9be06dbe, no PR number).
- Only two statuses were changed in `docs/BACKLOG.md`, because a merged PR names the row: BL-002 (PR #176) and BL-496 (PR #400). BL-465 is DONE in effect (both PRs it names merged) but no merged PR names the row, so its owner sets it.
- Stacked on PR #734: this branch is based on that branch (8b096a98), so it carries #734's four status changes and its audit file until #734 merges. The base of this PR is `develop`; review the last commit only.

## Counts

| Class | Meaning | Rows |
|---|---|---|
| DONE | merged code satisfies the Done-when | 7 |
| PARTLY | some of it is built; the remainder is named | 12 |
| CLAIMED | an open PR or branch holds it | 1 |
| REAL-FREE | nothing found; free to pick up (or founder-only) | 37 |
| UNKNOWN | no decisive evidence | 34 |
| Total | | 91 |

Combined with audit 1 (4 stale-fixed, 1 claimed, 8 real-free, 8 likely-done, 33 unknown), 145 ready rows are now accounted for: 19 are done or likely done (4 corrected in #734, 2 corrected here, 8 likely-done in audit 1 that owners still confirm, 5 more done in code), 12 are partly built, 2 are claimed, 45 are free (8 + 37), and 67 need their owner to run the Done-when (33 + 34).

Of the 37 REAL-FREE rows here, 4 are founder-only (BL-365, 366, 368, 369), 5 need a device, a Mac or the founder (BL-343, 354, 360, 468, 484), 1 is product work (BL-483) and 3 are web-lane rows (BL-509, 510, 512). The rest are agent work.

## Notes for owners

- 34 UNKNOWN rows are mostly the follow-up rows of waves 2 to 6 (BL-453 to BL-508). Each is a list of 3 to 8 small points; a search cannot settle a list. Their owners should tick points off in the row or split them. This is the main reason the ready count stays high.
- BL-251, BL-252 and BL-278 have a title and an owner but no scope or Done-when. Product will write them from the TDD before they are dispatched; until then an agent cannot pick them up honestly.
- BL-423, 424, 425 and 427 sit on screens the Build 12 first-run rebuild (#724, #728, #737, all draft) is rewriting. Re-check them after those merge; some may be superseded.
- BL-325 is split: the `forceReauthEpoch` part is open PR #657 (BL-597). Split the row when #657 merges.
- The `web lane` rows (BL-363, 364, 509, 510, 512, 515) are an external lane in `agents/roster.json`; the dispatcher never assigns them. They stay ready until the website thread picks them up.

## Rows

| Row | Class | Confidence | Evidence |
|---|---|---|---|
| BL-001 Point CLAUDE.md at the backlog | REAL-FREE | high | CLAUDE.md on develop has no Work selection section and no -bl-###- branch pattern. CLAUDE.md is coordinator-owned, so the PR proposes the lines. Lane: qa. |
| BL-002 Traceability check | DONE | high | scripts/trace.mjs and scripts/trace.test.mjs exist, docs/TRACE.md is written, and package.json `test` ends with `node scripts/trace.mjs --no-write`. PR #176 (5a1f5c4d, merged 16 Oct) names BL-002. Status set to done in this PR. |
| BL-110 Requirement ids in test titles; database harness sections | REAL-FREE | medium | No JUnit output and no named sections in supabase/tests (41 files, no runner section markers found). The first half (ids in test titles) is a style rule with no single check. Lane: qa. |
| BL-148 Author edits keep the version-replay invariant | REAL-FREE | medium | TDD 01 X-8 asks the core owner to model author edits. packages/core has no author-edit or replay code; only the column `author_edits` in supabase/migrations/20261015030000_v1_wire_contract_columns.sql. Lane: speech (core). |
| BL-324 Native modules never crash or hang on bad input (review L9) | DONE | medium | ScribeAudioModule.swift `samples()` and `frame()` guard with isFinite and clamp (lines 158 to 170, comment cites review L9); PlusStoreSheet.swift resumes once and tears down when UIKit refuses (lines 72 to 84). First in 9be06dbe (3 Oct snapshot, no PR number). The device check is FT-22, not in git. |
| BL-325 Remote documents cannot be held stale (review L10) | PARTLY | medium | Stale kill-switch config rule is in packages/api/src/remote-config.ts:152 to 170 and a same-version document check in packages/api/src/integrity.ts:119. Left: acting on `forceReauthEpoch` by signing out locally (schema only; no use under apps/mobile). Open PR #657 (BL-597) holds that part. |
| BL-326 Insights increments each pass k (review L12) | REAL-FREE | medium | insights.first_letter_conversion in supabase/migrations/20261004300000_insights_aggregates.sql:138 to 140 still publishes the cumulative d1, d7, d30 counts each through k_part; no later migration changes them. Needs the `approve-migration` label. Lane: analytics. |
| BL-251 Consent version and pending acts | UNKNOWN | low | The row has no scope or Done-when, so there is nothing to check against. packages/analytics/src/consent.ts exists. Product should rewrite the row from TRACKING_PLAN before dispatch. |
| BL-252 Analytics contract test with the real SDK | UNKNOWN | low | No scope or Done-when. No real-SDK contract test found (packages/analytics/test mocks posthogBeforeSend only). Product should scope it or retire it; apps/mobile/src/lib/analytics/posthog-sdk.ts is the SDK seam. |
| BL-278 Component test harness | REAL-FREE | medium | No render harness: apps/mobile uses vitest on .logic.ts files only; no testing-library or react-test-renderer in package.json. apps/mobile/test/helpers/mini-react.ts is a hook stand-in, not a component harness. BL-269 waits on this row. No scope text, so product should add one. Lane: qa. |
| BL-341 App Review notes and demo account (new) | PARTLY | medium | Review notes drafted: docs/store/compliance/app-review-notes.md (superseded 1 Nov) and docs/store/app-store-connect-1.0.md (PR #567). Left: the demo account on production seeded with Asha (OPEN-07, founder enters). |
| BL-343 Review request at a meaningful moment (new) | REAL-FREE | high | expo-store-review is not in apps/mobile/package.json and nothing calls a review request. Mode pair (adds a native dependency). Lane: mobile with founder. |
| BL-344 Redeem an offer code (new) | PARTLY | medium | Native side is built: ScribeStoreModule.swift:89 `presentOfferCodeRedeemSheet` and modules/scribe-store/index.ts:33. No Settings > Plan Redeem a code row in apps/mobile/src or packages/content. Left: the row, its words, its test. Lane: payments. |
| BL-354 App icon and splash from the registry | REAL-FREE | medium | No Icon Composer file under apps/mobile or packages/brand (only favicon PNGs). Mode pair, needs a Mac. Lane: mobile with founder. |
| BL-355 Brand fonts and type scale in the app | UNKNOWN | low | expo-font is a dependency, but no useFonts, Literata or Mukta match in apps/mobile/src/app/_layout.tsx. BL-258 says the fonts are done; the loading path was not found by search. Owner to run the Done-when. |
| BL-356 Move app strings into packages/content and wire new keys | PARTLY | low | `pendingCopy` is still defined in apps/mobile/src/lib/copy.ts:60 and used by listen.tsx:101, so the move into packages/content is not finished. The `tidy` keys were renamed (only comments remain in strings.en.ts). Other keys not checked. |
| BL-357 App reports subscription status to the server | DONE | medium | apps/mobile/src/lib/billing/status-report.ts (WP-F14-15a) sends the D-080 report behind the `statusReport` kill switch. PR #178 (7285004c, merged 23 Oct). Live behaviour on a device is not in git. |
| BL-358 Subscription status table and endpoint | DONE | medium | supabase/migrations/20261016001000_subscription_status.sql and supabase/functions/subscription-status (WP-F14-15b/c). PR #178. Whether it is applied to production is a founder step, not in git. |
| BL-360 Supabase Auth sends through Resend | REAL-FREE | medium | supabase/config.toml:77 to 81 has the Resend SMTP block commented out; docs/ops/AUTH_SETUP.md has the runbook. Needs the founder's sending-only Resend key. Lane: security with founder. |
| BL-362 Sign-in providers removed at account deletion | PARTLY | medium | Apple revoke is built: supabase/functions/purge-worker/lib/apple.ts (POST appleid.apple.com/auth/revoke). No Google unlink and no 10-minute reauthentication check found under supabase/functions or the delete screen. Google sign-in is v1.1 (D-054), so only the reauth part may remain. Owner to confirm. Lane: security. |
| BL-363 Website serves brand assets, email images and fonts | PARTLY | low | apps/web/public/email/ has the logo PNGs. No /fonts/* files and no CORS header for them found in apps/web/next.config.ts. Lane: web lane (external). |
| BL-364 Website legal and account routes | PARTLY | medium | apps/web has /terms, /privacy, /legal/[doc]/0.9.0, /auth/confirm, /auth/callback and the AASA route. Missing: /health-privacy, /subprocessors, /subscription-terms, /delete-account, /delete-account/confirm, /cancel, and the Android note on /open. Lane: web lane (external). |
| BL-365 Counsel review of the legal drafts | REAL-FREE | high | Founder-only (Mode human): counsel review. Nothing in git can show it done; ask the founder. Not a pickup for any agent. |
| BL-366 Trademark clearance for the name and the mark | REAL-FREE | high | Founder-only (Mode human): trademark clearance. Ask the founder. Not a pickup for any agent. |
| BL-368 Email DNS hardening for both domains | REAL-FREE | medium | Founder-only (Mode human): DNS. PR #736 (draft, BL-788) adds a mail preflight runbook and a DNS check script, which helps but does not do it. |
| BL-369 Five-second parent test of the mark | REAL-FREE | high | Founder-only (Mode human): parent test of the mark. Ask the founder. Not a pickup for any agent. |
| BL-420 Layout shifts are reserved or animated: prompt swap, Private | UNKNOWN | low | Layout-shift reservations cannot be found by search; the Done-when is a web-run measurement. Owner to run it. Build 12 first-run work (#724, #728, #737) may change these screens. |
| BL-421 Book list: the month placeholder is one quiet line, voice le | UNKNOWN | low | No match for the one-line month placeholder or a play glyph in apps/mobile/src/components/book. Not enough to call it free or done. |
| BL-422 "Private" versus "in the book" is explained once, with what | UNKNOWN | low | strings.en.ts:91 has a privateNote line but the single explanation and the Export and Read together check were not confirmed. |
| BL-423 First run ends ready to speak | UNKNOWN | low | onboarding.tsx still ends on The book is open (line 179). The Build 12 first-run rebuild (#724, #728, #737, all draft) is changing this flow, so check overlap before dispatch. |
| BL-424 Promise screen: plain button label, equal weight for the thr | REAL-FREE | medium | strings.en.ts:92 still reads cta: That sounds right. Overlaps the Build 12 first-run rebuild (#724, #728), so check before dispatch. Lane: content. |
| BL-425 Disabled buttons say why: Continue, Export everything, Sign | PARTLY | low | Helper for the name step exists (strings.en.ts:115 and :1210, Add a name to continue). No match for Write a letter first or an Export everything / Sign my letters helper. Not checked per screen. |
| BL-426 Under-18 stop: the way back is mentioned, layout stays put, | REAL-FREE | medium | No come back tomorrow line in packages/content/src. The register note about device limits was not found. Lane: content with security. |
| BL-427 Names and signature: duplicate warning, cut at a character n | PARTLY | medium | packages/core/src/child.ts:62 to 75 NFC-normalises and cuts by code point (Array.from). Left: no grapheme-safe cut for ZWJ sequences, no case-insensitive duplicate warning found, no counter. |
| BL-428 The reminders switch shows the true state, and absence behav | REAL-FREE | low | No Waiting for permission row; apps/mobile/src/lib/reminders/planner.ts:52 says the OS permission is checked separately. The long-absence planner case was not found. Lane: mobile (reminders owner). |
| BL-429 Read together counts a free session only after a page is rea | UNKNOWN | low | No free-session counter for Read together found in apps/mobile/src (only remote config `readTogetherFreeSessions`). The alpha made plans free per book, so the row may be moot. Owner to confirm. |
| BL-430 Failed store load and restore show their own calm states wit | REAL-FREE | medium | No We could not reach the App Store string or a distinct failed-load state in packages/content or apps/mobile/src. Lane: payments. |
| BL-431 A letter's date can be corrected and warns before the child' | PARTLY | medium | Change a letter's date is built: components/book/date-sheet.tsx and date-change.logic.ts (PR #513, 7660ca49, merged 1 Nov). Left: the calm warning for a date before the birth (the range allows 3 years before, with no warning text found). |
| BL-432 Very long takes: soft warning at 30 minutes and a memory run | REAL-FREE | low | No 30 minute soft warning found in the capture code. The memory run on iPhone SE 3 is a device step (BL-043). |
| BL-433 Review says "Nothing was changed" only when that is true | REAL-FREE | low | strings.en.ts:547 still has showOriginal (Show exactly what I said); no Word for word. Nothing was changed line in Review copy. Lane: content. |
| BL-434 Tonight and Book read only what they show | UNKNOWN | low | No perf.sql test (BL-408 not found), and the Tonight and Book queries were not traced. Needs the owner. |
| BL-441 `decide()` honours own Plus on an account-level surface | REAL-FREE | high | packages/core/src/plan.ts:217 still allows own Plus only when roleInBook is parent, and packages/core/test/plan.edges.test.ts:184 is still `it.fails`. Lane: payments. Needs npm install (core tests). |
| BL-442 Ten tests that assert too little | UNKNOWN | low | Ten tests; only the capabilities.test.ts one was looked at (still checks docsBaseFor, no sync_outbox assertion found). Owner to go through the list. |
| BL-443 Slow tests that flake under load | REAL-FREE | medium | SCRIBE_FUZZ_RUNS exists as a count knob in verify.fuzz.test.ts:51, but the fuzz tests are not split into blocks, billing-plan-reminders.test.ts has no stride knob, and vitest.coverage.config.ts:29 still carries the workaround. Lane: qa. |
| BL-450 An Apple revocation noticed at launch waits for unsynced let | UNKNOWN | low | No decisive match for a revoked-at-launch case with queued letters. Owner to run the Done-when. |
| BL-452 Sign-in error words match the cause | UNKNOWN | low | No VOICE.md Error row found; the four-miss scan was not checked. Owner to run the Done-when. |
| BL-453 Database photo policy follow-ups after #311 | UNKNOWN | low | Database photo policy follow-ups: six points, none verifiable by search. Owner to check each. |
| BL-454 Keep sheet and Settings follow-ups from #312 | UNKNOWN | low | plus-gate.test.ts:360 to 369 tests storedWords outputs, but the order-swap failure and the V-06 double-tap row were not confirmed. |
| BL-455 Delete account page clean-up from the #358 review | PARTLY | medium | Point 1 is not done: `accountScheduledBody` is still defined at packages/content/src/strings.en.ts:872. The other points (test ids, the held-as-cancelled test) were not checked. #358 (8301ac88) only cites the row. |
| BL-456 Backup tests' plaintext-leak scans see only the start of a r | REAL-FREE | medium | No shingle scan in apps/mobile/test or supabase/tests; PR #362 (a6519a4c) fixed the header match only. Lane: sync. |
| BL-457 Pin the See Plus note effect's dependency array, and use `an | UNKNOWN | low | Not confirmed by search; a source-pin test. Owner to run. |
| BL-458 Pins for the refused-Save line and the shelf after a refused | UNKNOWN | low | Three pins; the mutants are not in the repo. Owner to run. |
| BL-459 Pin that a join wait started with no name does not inherit t | REAL-FREE | medium | apps/mobile/test/join-wait.test.ts:92 to 111 covers a second book but always with a name (Ravi); no start('book-other', null) case. Lane: sync (family owner). |
| BL-460 Join wait and invite residuals from the #375 review | UNKNOWN | low | Eight residual points from the #375 review; each needs the owner. |
| BL-461 Spec and test nits after the P7-7 corrections (#381): cover | UNKNOWN | low | Spec and test nits; the 96 pt cover assertions were not checked. |
| BL-462 Content rules guard: follow-ups to the fold into `rules.test | UNKNOWN | low | Six follow-ups to the content rules guard; not checked. |
| BL-463 After #383 retired `en.plus.promise`: the guard's case-sensi | UNKNOWN | low | Case-insensitive guard regex and stale docs; not checked. |
| BL-464 Find the cause of the web e2e boot flake `local_db_migration | REAL-FREE | medium | No error.cause or unhandledrejection logging in apps/mobile/e2e-web, so the flake still cannot name its cause. Lane: qa with sync. |
| BL-465 Rebase #161 (export consent history) and #163 (server-produc | DONE | high | Both PRs it names have merged: #161 (31 Oct) and #163 (1 Nov), per REST. The rebase is moot. Left for the owner to set the status; the merged PRs do not name BL-465. |
| BL-466 Repo hygiene in the journey scripts and `.gitignore` | PARTLY | medium | `.gitignore` lines 4 to 5 now match a symlinked node_modules and line 101 ignores INDEX.text-only.md. The third point (build-index prints its own message for a steps file) was not checked. Lane: qa. |
| BL-467 Pins and guards: recovery export re-entrancy, DrawingBoundar | UNKNOWN | low | No re-entrancy guard found in the recovery export by name search; five points, owner to check. |
| BL-468 Device and layout checks: a deep arrival on a cold Book, and | REAL-FREE | medium | Mode pair: a device plan row and a decision on the stacking threshold. Nothing in git yet. Lane: qa with design-systems and a phone. |
| BL-469 The leave sheet has no way to close in the sheet when the si | REAL-FREE | medium | The leave flow is not offered yet (LEAVE_BOOK_OFFERED comments, see BL-444 in the first audit), so this waits on BL-444. Lane: sync (family owner). |
| BL-472 A baby born early can leave the before-birth state only afte | REAL-FREE | medium | No is here row or key in packages/content/src/strings.en.ts. F09-REQ-021 not built. Lane: mobile. |
| BL-473 The Family tab's dateline for a book that is not born yet | REAL-FREE | medium | `tonightStageLabel` is used by (tabs)/index.tsx:211 only; (tabs)/family.tsx does not call it. Lane: mobile. |
| BL-476 Sign-in code step: say when the pause ends, and give a way t | UNKNOWN | low | machine.logic.ts has a code_paused state, but the pause-end line and the way to Apple and Google were not found by search. |
| BL-478 The sign-out wait: a stale poll, a false "ended early", and | UNKNOWN | low | Three points in the sign-out wait; tests in account-view.test.ts not checked. |
| BL-479 The Account page's sign-out wait: the early-end line's home | UNKNOWN | low | Four points on the Account page wait; not checked. |
| BL-480 Journey record hygiene: a duplicate-id lint, run-day dates, | UNKNOWN | low | Journey record hygiene, five points; not checked. |
| BL-482 Spec and doc fixes after the sign-in and journey work: SECUR | UNKNOWN | low | Doc fixes in four places; not checked. |
| BL-483 Re-check the backlog entries that cite journey step ids the | REAL-FREE | medium | Mode pair; qa proposes the id re-pointing in a PR body and product applies it. Product-side work, so it sits in this lane's queue, not an engineer's. Many cited steps changed after the 203-step record. |
| BL-484 A device walk of the 5.8 transitions: does any unlit frame s | REAL-FREE | medium | Mode pair: a device walk. No S1 row for it found. Lane: qa with a phone. |
| BL-489 The sign-in code step and Account: notes VoiceOver does not | UNKNOWN | low | Three points; announce() calls in the sign-in code step were not found by search. |
| BL-492 Launch-recovery and Delete account Later items from the 30 O | UNKNOWN | low | Five Later items from the critics' pass; not checked. |
| BL-493 Open-deletion gate edge cases left after #393: an offline fr | UNKNOWN | low | Five edge cases of the open-deletion gate; the hook stand-in exists but the cases were not checked. |
| BL-494 The deletion screen after #393: the sign-in sheet's words, T | UNKNOWN | low | Six points on the deletion screen; not checked. |
| BL-495 Launch recovery after #394: a render that opens the store ag | UNKNOWN | low | Seven points on launch recovery; #617 (BL-568, open) touches the same area. |
| BL-496 Two defects from #393's round-3 delta review: a late answer | DONE | high | PR #400 (23455808, merged 30 Oct) names BL-496 and fixes both points; tests tagged [BL-496] are in apps/mobile/test/account-deletion-gate-hook.test.ts and open-deletion-press.test.ts. Status set to done in this PR. |
| BL-503 Auth machine: answering Terms or the age line again turns sy | REAL-FREE | medium | apps/mobile/src/lib/auth/machine.logic.ts has no memory of a declined sensitive-data gate (sensitiveDeclined exists only in lib/auth/consent.ts). The failing reducer test is not written. Lane: security (auth owner) with qa. |
| BL-506 The preflight's .env* guard is pinned by source regexes only | REAL-FREE | low | account-deletion-switch.test.ts runs the preflight with execFile (line 263) and lists .env files (line 214), but no planted .env.local case was found. Lane: qa. |
| BL-507 QA docs after D-129 and D-130: the S1-35 row's build, how B2 | UNKNOWN | low | Doc edits and one script change; not checked. |
| BL-508 The test that the session provider registers the Privacy row | UNKNOWN | low | A regex test of the session provider; not checked. |
| BL-509 Website `authConfirm.expired` names an error the app never s | REAL-FREE | high | apps/web/src/content/site.ts:323 still reads: If the app says the code has expired, tap Send a new email. The row asks for If the code does not work, tap Send a new email in the app. Lane: web lane (external, not dispatched). |
| BL-510 Website `/open` page and AASA path (TPL-06) | REAL-FREE | high | No /open page under apps/web/src/app, and the AASA route test (route.test.ts:72) lists /auth/confirm, /auth/callback and /j only. Lane: web lane (external). |
| BL-512 Website `/subscription-terms` page (TPL-06, SUB-10) | REAL-FREE | high | No /subscription-terms page. The row waits for the founder to merge the legal text (D-125 item 5; draft in PR #672). Lane: web lane with legal. |
| BL-515 Website `/auth/confirm` handling matches the app (SIGN-04, w | DONE | medium | apps/web/src/app/auth/callback/page.tsx renders the same AuthConfirm as /auth/confirm, which never reads the token (AuthConfirm.tsx:7), and apps/web/e2e/auth-confirm.e2e.ts:25 runs both paths. Words matching the app are BL-509. |
| BL-516 Two stale comments under `supabase/` (closure review N4) | UNKNOWN | low | Two stale comments under supabase/; the two lines were not identified. |
| BL-518 The second reminder prime (after the first month chapter) | REAL-FREE | high | next-ask.logic.ts:7 to 8 says the second prime after the first month chapter is not built. Lane: mobile (asks). |
| BL-519 Keep the book re-offer after the third letter when the perso | REAL-FREE | high | next-ask.logic.ts:10 says the re-offer after the third letter is not built. Lane: mobile (asks). |
| BL-776 A person with one book can reach Recently deleted after a co | CLAIMED | high | Open draft PR #720 (feat/mobile-family-tab-servers-on, BL-776 and NX-36 S0, stacked on #699). Specs merged in #719 and CPO-10 in #723. Also named in #707 and #726. |
| BL-781 The claims inventory records the four Erase everything lines | REAL-FREE | medium | No erase.* lines in a claims registry yet; BL-637 is in open #599 (registry rows, legal owner, founder merges). #722 mentions the row only in passing. Lane: content. |

## Pickup queue of REAL-FREE rows

Order: severity tier first (5 consent, privacy, a false statement or a lost word; 4 data integrity, High or S1; 3 a user-visible defect or store risk; 2 a gap that costs little to wait; 1 hygiene), then cost of delay over duration, with tier as the cost of delay and size as the duration (XS 1, S 2, M 3). Ties break by row id. This is a judgement, not a measurement. It combines the 8 REAL-FREE rows of audit 1 (marked `audit 1`) with those of this audit. Agent names are handles in `agents/roster.json`. `Install` says whether the work needs `npm install` (engineering: tests run) or not (docs only).

| # | Row | Agent | Install | Tier | Size | Source | Why now |
|---|---|---|---|---|---|---|---|
| 1 | BL-509 | web lane (external, not dispatched) | yes | 5 | XS | this audit | Published page names an error the app never shows; one line and its copy test. |
| 2 | BL-389 | content, privacy | yes | 5 | S | audit 1 | Consent sheet says it shares when something crashes while the app has no crash SDK: a false statement on the consent screen. |
| 3 | BL-503 | security (auth owner), qa | yes | 5 | S | this audit | Declining sensitive-data consent can be undone by answering Terms or the age line again; the reducer turns sync on (LEGAL-REQ consent gate). |
| 4 | BL-816 | mobile | yes | 5 | S | audit 1 | S1 proposed (S0 by the legend): no maximum wait in Review's typed-text writer, a crash can lose a word. |
| 5 | BL-326 | analytics (needs approve-migration) | yes | 5 | M | this audit | Cumulative first-letter counts each pass k, so differences can reveal a small cohort (security review L12). |
| 6 | BL-412 | mobile, data-architect | yes | 5 | M | audit 1 | [High] raw_transcript immutability is enforced by a trigger on the server only; the phone has none (constitution). |
| 7 | BL-119 | speech (core) | yes | 4 | S | audit 1 | [High] no child-input flag in the prompt selector, and no test that together prompts never show. |
| 8 | BL-426 | content, security | yes | 4 | S | this audit | Under-18 stop does not mention the way back; the device limits are not recorded in the register. |
| 9 | BL-775 | mobile | yes | 4 | S | audit 1 | S1: a failed Erase everything that the person keeps using erases only what existed at the start. |
| 10 | BL-148 | speech (core) | yes | 4 | M | this audit | Author edits break the version-replay invariant (DATA-REQ-041, TDD 01 X-8). |
| 11 | BL-244 | data-architect (needs approve-migration) | yes | 4 | M | audit 1 | [High] no value-free validation trigger on content tables. |
| 12 | BL-391 | mobile, content | yes | 4 | M | audit 1 | Doors to nowhere in v1.0. Check overlap with #665, #699, #707 (Build 12 tab work) before dispatch. |
| 13 | BL-428 | mobile (reminders owner), design-systems | yes | 3 | S | this audit | The reminders switch can read On with the OS permission denied. Low confidence: verify first. |
| 14 | BL-430 | payments | yes | 3 | S | this audit | A failed store load shows no calm state of its own, so it reads like not available. |
| 15 | BL-433 | content | yes | 3 | S | this audit | Review may say Nothing was changed when fixes were reverted. Low confidence: verify first. |
| 16 | BL-510 | web lane (external) | yes | 3 | S | this audit | No /open page and no AASA path for it; emails link to it (TPL-06). |
| 17 | BL-512 | web lane (external) with legal | yes | 3 | S | this audit | No /subscription-terms page. Blocked by the founder merging the legal text (D-125 item 5). |
| 18 | BL-781 | content | no (docs/registry only; check how the claims test runs) | 3 | S | this audit | Claims inventory lacks the four Erase everything lines. Take with BL-637 in #599. |
| 19 | BL-444 | sync (family owner) | yes | 3 | M | audit 1 | Needed before build 3 (D-113): a left book stays readable. Leave is still not offered. |
| 20 | BL-472 | mobile | yes | 3 | M | this audit | A baby born early has no way to leave the before-birth state (F09-REQ-021). |
| 21 | BL-441 | payments | yes | 2 | XS | this audit | Latent: own Plus on an account-level surface is offered Plus. Flip the it.fails test. |
| 22 | BL-424 | content | yes | 2 | S | this audit | Continue label and promise-screen weights. Overlaps the Build 12 first-run rebuild (#724, #728): check first. |
| 23 | BL-432 | speech | yes | 2 | S | this audit | 30 minute soft warning; the iPhone SE 3 memory run is a device step. |
| 24 | BL-455 | mobile | yes | 2 | S | this audit | Unused accountScheduledBody string remains; test ids and the held-as-cancelled test to add. |
| 25 | BL-456 | sync | yes | 2 | S | this audit | Backup leak scans see only the start of a recording. |
| 26 | BL-473 | mobile | yes | 2 | S | this audit | Family tab dateline for a book not yet born. |
| 27 | BL-518 | mobile (asks) | yes | 2 | S | this audit | Second reminder prime after the first month chapter is not built. |
| 28 | BL-519 | mobile (asks) | yes | 2 | S | this audit | The book re-offer after the third letter is not built. |
| 29 | BL-278 | qa | yes | 2 | M | this audit | Component test harness; unblocks BL-269. Row needs a scope first. |
| 30 | BL-464 | qa, sync | yes | 2 | M | this audit | Web e2e boot flake cannot name its cause yet. |
| 31 | BL-001 | qa | no (CLAUDE.md lines proposed in the PR body) | 1 | XS | this audit | Work selection lines for CLAUDE.md; coordinator-owned, so propose only. |
| 32 | BL-459 | sync (family owner) | yes | 1 | XS | this audit | One join-wait pin. |
| 33 | BL-110 | qa | yes | 1 | S | this audit | JUnit output and named sections in the database harness. |
| 34 | BL-506 | qa, mobile | yes | 1 | S | this audit | Planted .env.local test for the preflight. Low confidence: verify first. |
| 35 | BL-443 | qa | yes | 1 | M | this audit | Slow tests that flake under load. |

Not in the queue, because an agent cannot take them alone:

- Founder only: BL-365, BL-366, BL-368, BL-369 (also BL-360 needs the Resend key, BL-341 the production demo account).
- Pair, needs a Mac, a phone or a native dependency: BL-343, BL-354, BL-468, BL-484.
- Product: BL-483 (re-point journey ids), and the scope for BL-251, BL-252, BL-278.
- Waiting: BL-469 (on BL-444), BL-512 (on the founder merging legal text).
- Claimed: BL-776 (open draft PR #720).
- Open Build 12 plans in #707 may re-order BL-391, BL-444 and BL-775 to BL-781. Check that PR's merge order before dispatching them.

## Founder decisions

None needed to merge this PR. Questions for the founder: have BL-365, 366, 368 and 369 been done? Git cannot show it. If so, say which and product will set them from FOUNDER_TASKS.
