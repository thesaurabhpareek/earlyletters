# Theme 4: Someone outside the team tries to break in before outside families sign in

Readiness: 21 of 28. Author's score (`security-architect`), `qa` to confirm. Remains: the vendor, the spend and the dates are the founder's and no quote exists (R9); the scope list cannot be frozen until a hosted project exists (backlog rank 5, theme 1); whether Friends counts as outside is a founder decision (F18, R8). Everything else in this file is finished.

| | |
|---|---|
| Working label | NX-04 (working id, see `_CONVENTIONS.md`); backlog rank 4 in `../08-ranked-backlog.md` |
| Refines | D-125 item 10 (Q10: "an external security test is required before server features open to anyone outside the first families, not for the first binary, which has no server. Its cost is unknown and the spend is the founder's"); LEGAL-REQ-024 (access control is tested); `docs/tdd/04-security-identity.md` section 8.7 (pen test plan) and 8.8 (release gate); SEC-15 in that TDD; BL-313 / T5-03 (external pen test, before paid marketing, the public link or 1,000 families); `docs/security/REVIEW_R17_CHECKLIST.md` (the internal gate this test sits after, not instead of) |
| Tag | EVIDENCE that the need exists (D-125 item 10 is a decision; TDD 04 section 8.7 is a written plan). HYPOTHESIS that one test of a few weeks is enough to open Friends; the vendor's report is the only evidence that can answer it |
| Size | S to book; weeks to run (ASSUMPTION; no quote exists, UNVERIFIED) |
| Gate | Founder: vendor, spend, dates, and whether Friends counts as outside (F18). Needs theme 1 (a hosted project to test) and theme 2 (sign-in on that project). No code gate |
| Order | 4 (backlog 08) |

## What the parent will see and do

Nothing. A parent never takes part in this test and no family's letters are ever used in it. What the parent gets is the reason to trust the next step: before anyone outside the first families signs in and their letters go to a server, a person who does not work for us has tried, with our permission, to read another family's letters, to sign in as someone else, to keep a deleted account's letters, and to break the servers' rules. We fix what they find, they check the fixes, and the founder reads the result before the door opens.

## Scope (what is tested)

The vendor tests the product as built on the hosted project, grey-box (they are given the design and persona sign-ins, section "What the tester is given"). Each area names what the tester tries and where the thing lives in the tree today (searched 8 Nov 2026 on branch `docs/next-roadmap-8nov`).

| Area | What the tester tries | Where it lives (today) |
|---|---|---|
| 1. Sign-in | Sign in as another person; reuse or guess an email code; replay an Apple identity token; get a session without the 18+ answer or the agreement; tell known from unknown addresses by wording or timing | Hosted Supabase Auth settings; `supabase/functions/apple-token`; app sign-in code under `apps/mobile/src/lib/auth/`; NX-02 |
| 2. Sessions | Keep a session after sign-out, after "Sign out other devices" and after the forced sign-out switch; steal a session from a backup or a copied storage file | `apps/mobile/src/lib/supabase/secure-storage.ts` (Keychain class); `forceReauthEpoch` in `packages/api/src/remote-config.ts`; NX-02 |
| 3. Access rules (RLS and RPC) | With persona sign-ins, read or change another book's rows; use a view or function to get around a table rule; write columns a contributor must not write; call a database function without the right role; abuse the anonymous role | `supabase/migrations/**`; the matrix is `supabase/tests/access_matrix.test.mjs`, `rls.test.mjs`, `security_family.test.mjs`, `function_rpc_contract.test.mjs`, `explicit_grants.test.mjs` |
| 4. Edge Functions | Missing or forged token, wrong role, injection in parameters, server-side request forgery in any call out, secrets or letter text in an error or a log line, repeated calls past a limit | The folders `supabase/functions/` lists today: `apple-token`, `escrow`, `invite-redeem`, `purge-worker`, `analytics-forget`, `subscription-status`, `config`, `content`. TDD 04 section 8.7 also names `contrib-gateway`, `ai-gateway` and `rc-webhook`; no folder of those names exists in this tree, so they are out of scope until built |
| 5. Storage | Read, list, overwrite or delete an object in another family's path; upload past the size or type limit; guess a path; read after the owner left or erased | Buckets the migrations create (`ops-ledger`, `entry-photos` named in `ENGINEERING_REQUIREMENTS.md` and migrations; the audio bucket names in TDD 04 (`entry-audio`, `inbox`) are UNVERIFIED against the migrations); the storage policies in `supabase/migrations/` |
| 6. Purge | Keep readable data after a deletion request is processed; make the worker delete someone else's data; make it skip a deletion; read the worker's alert or log for content | `supabase/functions/purge-worker/`; `supabase/tests/ops_deletion_worker.test.mjs`, `purge_batching.test.mjs`, `purge_legal_holds.test.mjs` |
| 7. Erase (account and former member) | After "Erase everything on this phone" and after account deletion, find any copy: a row, an object, a backup, a token that still works, a pseudonymised consent row that points back to a person | `supabase/tests/former_member_purge.test.mjs`; the delete-account theme (`04-delete-account-and-erase-phone.md`); the consent and audit chain (#634, #636, #637) |
| 8. Keys and backup (when on) | Obtain a key, an unwrapped escrow value or a restore without the founder's approval; abuse the ten `escrow_*` entry points | `supabase/functions/escrow/`; `supabase/tests/audio_backup_escrow.test.mjs`. In scope only if server audio backup is switched on in the build under test; otherwise listed as "not on" in the report |
| 9. The app on a phone | Read the Keychain item, the local database, the logs and the crash reports of a test phone for tokens or letter text; fuzz the links the app opens | TDD 04 section 8.7 item 4. Optional in the first test (R1), because the 1.0 store build has no server; recommended once servers are on |

Out of scope, as in TDD 04 section 8.7: denial of service, social engineering of the vendor's own people or ours, physical attacks beyond a lost unlocked phone. Also out of scope: Apple, Supabase, Vercel and Resend themselves (the vendor tests our configuration of them, never their platforms; each provider's own testing terms are UNVERIFIED and the vendor confirms them in writing, R3).

## The check

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-04-R1 | EVIDENCE | Given the area table above, When the founder books the vendor, Then the scope sent to the vendor lists all 8 server areas (1 to 8) with an owner agent for each fix lane and marks area 9 as "included" or "later" in writing, and every area cites the project it runs on. A scope that omits any of the 8 does not go out. | No scope document exists (backlog 08 row 4: "none written"). TDD 04 section 8.7 is a plan from 3 Oct that names 3 functions this tree does not have. | D-125 item 10; TDD 04 8.7 |
| NX-04-R2 | EVIDENCE | Given the test environment, When the tester is given access, Then they receive a scoped copy (a throwaway hosted project, or the production project before any outside family exists; the founder chooses, R9), 4 test personas (owner, co-parent, former member, a person with no book) plus one anonymous path, and 0 rows of real family data. Proof: a scan of the environment shows every book name, child name and email address in the copy matches a seed list of fictional names (the family "Asha" and its personas), and the count of non-seed accounts is 0 on the day the tester starts. | No hosted project exists to give anyone (stack rank 5; S-50 to S-54 fail in the gap map). No seed list or non-seed account check exists. | CLAUDE.md privacy rules; `no-real-family-data.test.ts` rule |
| NX-04-R3 | EVIDENCE | Given a signed rules-of-engagement page, When the test starts, Then it states: the dates (start and end, UTC); the allowed targets (only the project ids and URLs the founder lists); the forbidden acts (denial of service, social engineering, touching any real family, any provider's own platform, keeping data after the test); the stop-and-call rule (the tester stops and calls the founder within 1 hour of finding anything that exposes a real person's data, or any critical finding, before going further); a named contact for each side; and that no finding is published by the vendor without the founder's written leave. Both sides signed before the first request. | Nothing exists. | Standard practice; proposed |
| NX-04-R4 | EVIDENCE | Given the access the tester is handed, Then it is the publishable key and persona sign-ins only: 0 service keys, 0 database passwords, 0 Apple or Resend credentials, 0 account-wide tokens (SEC-R04); every credential expires at the end date, is rotated within 1 working day after, and the test environment's logs are kept for the report. The tester sees source and design documents by read access to a copy, never write access to the repository. | Credentials for a hosted project do not exist yet. SEC-R04 is a rule with no hosted environment to prove it on. | SEC-R04; `docs/engineering/06-security-engineering.md` |
| NX-04-R5 | EVIDENCE | Given the vendor's report, When the founder reads it, Then the test passes only if all four hold: 0 open critical and 0 open high findings; each medium has a dated fix or a founder-signed acceptance; the vendor retested every critical and high fix and says so in a dated note; the report lists which of the 9 areas it covered. A report that skips an area marks that area "not tested" and the founder decides whether the door opens for it. | Nothing defines pass. | TDD 04 8.7 "Exit"; 8.8 |
| NX-04-R6 | EVIDENCE | Given `red-team`, When the scope is sent, Then the vendor also receives the retest list: every access, sign-in, purge and erase finding the team has already closed, each with the commit that closed it and the check that proves it (2 columns plus the area), so the vendor tries to reopen each one. The list is built from red-team reviews on merged PRs and from the R-17 checklist rows marked fixed. A closed finding the vendor reopens counts as a new finding at its original severity. | No retest list exists. The R-17 checklist (`docs/security/REVIEW_R17_CHECKLIST.md`) has evidence rows but its section 9 sign-off is not done (`docs/qa/ALPHA_GO_NO_GO.md`, 8 Nov: R-17 has not passed). | `red-team` charter; REVIEW_R17_CHECKLIST |
| NX-04-R7 | EVIDENCE | Given a vendor finding, When it is received, Then within 2 working days (proposed) `product` opens exactly 1 backlog row for it (the id comes from `node scripts/agents/next-id.mjs`, never guessed), carrying: severity, area number, affected path or function, the vendor's reference number, fix owner, a regression test requirement named in the row, and `Gate: retest by vendor`. No vendor text goes into the row if it holds a live secret, a real token or a person's data; the report itself stays in the founder's private store, not the repo. | There is no intake path from an outside report to a backlog row. | Backlog conventions; `docs/engineering/06-security-engineering.md` |
| NX-04-R8 | EVIDENCE | Given each fix for a critical or high finding, When it merges, Then it ships with a regression test whose title carries the finding's row id, and that test fails on the pre-fix code. 100% of critical and high rows have one before the vendor retests. | No findings exist to fix. This row exists so a fix cannot merge without proof. | RR-2 style rule: one behaviour, one test |
| NX-04-R9 | EVIDENCE | Given the definition below, When a build or a person would put server features in front of someone who is not in the first families, Then the independent test has passed (R5) first. In practice: 0 outside users hold a server account on any project on the day the test starts, and the only people with server accounts when it passes are the founding family and the named test personas. | No gate is written. The Friends dates in `00-stack-rank.md` section 4 do not include the test. | D-125 item 10; F18 |
| NX-04-R10 | EVIDENCE | Given the test ends, Then within 5 working days (proposed) the 4 personas and every object the tester created are removed through the same delete path families use (this also exercises area 7 once more), credentials are rotated (R4), the tester's access list is empty, and the founder records the date and what was removed in the ops log. 0 tester-created rows remain; a count query written in the rules of engagement shows it. | Nothing runs after any test. | LEGAL-REQ-021 to -027; `docs/ops/SECRETS.md` rotation rule |

**Shown / Records / Never / Decline:** no parent, relative or other person agrees to anything in this theme. The only parties who agree are the vendor (a written engagement and R3) and the founder (spend, dates, the decision on Friends). Test personas are fictional and take part in nothing a person signs, so there are no door lines. If a later version asked real families to take part in a test, it would need door lines under COORDINATION section 10 first. It does not.

## What "outside the first families" means (F18)

D-125 item 10 uses the phrase and does not define it. The repo names two earlier groups: the founding family (the founder's own, `COUNSEL_PACKET.md` line 71 "founding family (T19)") and "the first outside families (T22)" (same line). It names the external TestFlight group "Friends" (Beta App Review) in `00-stack-rank.md` section 4.

Recommended definition, for the founder to confirm in a decision entry:

- **Inside:** the founder's household, people in it, and the named test personas.
- **Outside:** everyone else, including Friends, including the first outside families, including a friend or relative who is only trusted socially. What matters is that their letters go to a server we run and a stranger's mistake could expose them.
- **Rule:** no server account for an outside person on any project until R5 passes. A Friends build without server features (the store 1.0 shape: no sign-in, letters stay on the phone, D-125 item 10 "the first binary has no server") is not blocked by this test.

Why recommend this: the data is a baby's name, voice and a parent's private writing. A friend is the person most likely to be hurt by a failure and least able to say no. The cost of counting them as outside is a vendor lead time on the Friends dates; the cost of not counting them is an untested door. The test shields the first friends, which is the point of it.

If the founder prefers to open Friends before the test, he narrows D-125 item 10 in a new decision entry in his own words (this file does not do it, and an agent cannot). The entry should say exactly which server features the group gets, for how long, and how many accounts; that is a decision, not a drafting choice.

## Founder booking steps and spend

All steps are the founder's hands. No agent contacts a vendor, signs, pays, or sets up an environment (COORDINATION section 6, Never list).

| Step | Who | What | When |
|---|---|---|---|
| 1 | Founder | Decide F18 (does Friends count as outside), recommended: yes | Before booking, Mon 9 Nov or soon after |
| 2 | Founder | Decide the spend ceiling in dollars and write it in a decision entry. Cost: UNVERIFIED. No quote, rate or vendor price has been read; this file does not state one. D-125 item 10 says the cost is unknown and the spend is the founder's. | Before step 3 |
| 3 | Founder | Ask 3 vendors for a written quote against this file's scope. Vendor names: none verified; `security-architect` has not checked any firm's references, insurance, rates or availability, and names none here. Ask each for: price for the scope, estimated days, earliest start, whether a retest of fixes is in the price, their report format, and their written position on testing a hosted Supabase project (UNVERIFIED: Supabase's own testing terms were not read). | After step 2 |
| 4 | Founder | Choose one vendor. Check that the engagement letter covers confidentiality, data handling and deletion, liability, and that the vendor carries cover for the work (UNVERIFIED for any firm). Counsel reads the engagement letter if it says anything about the data or liability (route to `legal`; this file gives no legal view) | After step 3 |
| 5 | Founder | Hand the vendor: this file, `docs/tdd/04-security-identity.md`, the persona sign-ins (R2), the retest list (R6), the rules of engagement (R3) | When theme 1 and theme 2 are green on the test project |
| 6 | Founder | Sign R3. Pick the start date | Before the first request |
| 7 | Founder | Read the report; decide pass under R5; record the decision with the date | After the retest |
| 8 | Founder | Tell `ops` the test is complete so the R10 clean-up and rotation run | After step 7 |

The Friends dates move by the vendor's lead time, which is also UNVERIFIED. Until a quote gives a date, `00-stack-rank.md` section 4 stays conditional.

## Edge cases

The vendor finds a live real person's data (R3 stop-and-call; this should be impossible under R2 and is the reason R2 exists). The vendor needs a persona the list lacks (the founder adds it; the new persona is fictional). A fix changes the access rules after the vendor has started (the vendor is told which commit, and retests that area). The vendor finds an issue in a provider outside our config (we report it to the provider through its own route, which is the founder's act; the vendor does not). The vendor finds nothing (a report that says so is still the evidence; R5 still needs the area list). The test project is the production project (R2 requires the non-seed count to be 0 first, and the test runs before any outside signup). Two findings are the same root cause (one row, with both references listed). A finding is disputed (the founder decides; the dispute and the reason are written in the row).

## Offline behaviour

Not a phone feature. A phone used in area 9 stays in the vendor's hands and holds fictional data only.

## What we never do

Give the tester a service key, a database password or a real person's data. Test with a real family's account "to be realistic". Let a tester run a tool against a live service we did not list in R3. Pay or sign anything by an agent. Publish the report, or any text from it, without the founder's written leave. Name a vendor or a price in this repo that nobody has verified. Close a finding by editing the row; the retest closes it.

## Copy needs

None for parents. Operator text only: the rules of engagement and the scope go in `docs/security/` (proposed paths `docs/security/PENTEST_SCOPE.md` and `docs/security/PENTEST_RULES_OF_ENGAGEMENT.md`; neither exists). The Privacy Policy and the Subscription Terms say nothing about the test. Counsel decides whether the policy may later say "independently tested" (a claim; route to `legal`, and use it only after R5 passes).

## Analytics events

None. Analytics are off in every 1.0 profile (D-124 item 3).

## Device rows

None in `docs/qa/DEVICE_TEST_PLAN.md`. Area 9 (the app on a phone) is the vendor's test, not a Maestro row.

## Dependencies

Theme 1 (hosted project; the test cannot start before it, and the scope is frozen when it exists). Theme 2 (sign-in on that project; areas 1 and 2). The delete-account and erase-phone theme (areas 6 and 7; file `04-delete-account-and-erase-phone.md`). The internal R-17 review (`REVIEW_R17_CHECKLIST.md` section 9) should pass first so the vendor's days go on hard problems, not on rows our own tests already catch (recommended order, not a gate). Consent withdrawal (rank 8, D-128) before any friend signs in is a separate gate this file does not replace.

## Engineering block (G-31 to G-37)

| Line | This theme |
|---|---|
| API contract (`packages/api`) | None. |
| Budget (`06-nfr.md`) | None for the product. The test adds load only by the vendor's requests; denial of service is out of scope, so the rules of engagement set a request-rate ceiling (proposed: set with `ops` from the plan's limits). |
| Accessibility | Not applicable. The report and the rules are documents for the founder; plain language summary on the first page. |
| Switch, off behaviour, noticed by | Switch: the vendor's credentials are revoked (R4), and the test project's sign-in can be turned off by the founder at once. Noticed by: the alert route in theme 17 (an auth or limit alert during the window is checked against the vendor's log before it is treated as an incident). |
| Data class and retention | Test data is fictional and L1 to L4 in shape but not in fact. The report is private to the founder; the vendor deletes their copies of environment data at the end (R3, R10). |
| Schema and grants | None. If a fix needs a migration, it follows the usual rule: its own file, its grants in `supabase/tests/grants.mjs`, `approve-migration` from the founder. |
| Analytics events | None. |

## Trace and tests

Id convention: `_CONVENTIONS.md`. Most rows are done by a person and proved by a dated record, not a unit test. The records are what `qa` checks. Paths marked proposed do not exist.

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-04-R1 | D-125 item 10; TDD 04 8.7 | doc check (proposed `scripts/docs/pentest-scope.test.mjs`); `[NX-04-R1] scope names all 8 server areas and each owner` | ops: founder sends scope; dated copy kept |
| NX-04-R2 | CLAUDE.md privacy rules | script (proposed `scripts/ops/pentest-seed-check.mjs`, run on the project); `[NX-04-R2] every account, book, child and address matches the seed list and non-seed accounts are 0` | ops: run on the start date; output kept |
| NX-04-R3 | D-125 item 10 | none, signed document | ops: signed page, both sides |
| NX-04-R4 | SEC-R04 | none, record of what was handed over (and a grep that no service key is in the handout folder; proposed `[NX-04-R4] handout holds no service-key shape`) | ops: key list at start and revoke list at end |
| NX-04-R5 | TDD 04 8.7 exit | none, founder's dated decision | ops: decision entry |
| NX-04-R6 | `red-team` review record | doc check (proposed `docs/security/PENTEST_RETEST_LIST.md`); `[NX-04-R6] each closed finding has a commit and a check` | none |
| NX-04-R7 | backlog conventions | none, `product` records | ops: row per finding |
| NX-04-R8 | RR-2 | a regression test per row, named `[<row id>] ...`; fails on pre-fix code | none |
| NX-04-R9 | D-125 item 10; F18 | script (proposed, same file as R2); `[NX-04-R9] 0 outside accounts when the test starts` | ops: count on start date and again on pass date |
| NX-04-R10 | LEGAL-REQ-021 to -027 | same script as R2, run after; `[NX-04-R10] 0 tester-created rows remain` | ops: clean-up record |

Trace: NX-04-R1..R10 -> D-125 item 10, LEGAL-REQ-024, TDD 04 sections 8.7 and 8.8, BL-313 (T5-03), SEC-R04.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| F18: does Friends count as "outside the first families" | Yes (counts as outside). Book now; Friends gets server features only after the test passes. A Friends group without server features is unaffected. To open Friends earlier, record a narrowing of D-125 item 10 in a decision entry in his own words |
| Vendor | Ask 3 for a written quote (step 3). No name is recommended here because none is verified |
| Spend ceiling | None recommended: no price is verified. The founder sets the ceiling after the quotes arrive. Cost: UNVERIFIED |
| Test on production or a copy | A copy (a throwaway hosted project seeded with fictional data) if the quote differs by little; production only before any outside account exists, and only with R2's check on the day |
| Area 9 (the phone) in the first test | Later, unless servers are on in the build under test. The 1.0 store build has no server |
| Whether to publish a summary | Not decided here. A public summary (T5-03 in `FUTURE.md`) is a trust and marketing choice, and counsel decides the wording of any claim |

## Not verified

No vendor, price, lead time, insurance, or provider testing terms were looked up; all are UNVERIFIED and no figure for them appears here. The two storage bucket names in TDD 04 (`entry-audio`, `inbox`) were not matched to a migration (only `ops-ledger` and `entry-photos` were seen in the migration text, and only by a grep, not a read). Whether any `storage` policy is complete was not read. The 8 server areas were assembled from TDD 04 section 8.7, `supabase/functions/` and `supabase/tests/` listings, not from a read of each function. The checklist rows in `REVIEW_R17_CHECKLIST.md` were read to section 1 only. `docs/qa/ALPHA_GO_NO_GO.md` was read on one line. The definition of "first families" is the author's reading of `COUNSEL_PACKET.md` line 71 and `00-stack-rank.md`; D-125 does not define it. The 2 working days (R7) and 5 working days (R10) and the 1 hour (R3) are proposed targets. No other agent has reviewed this file; `red-team`, `security`, `ops` and `product` should read the rows that name them.
