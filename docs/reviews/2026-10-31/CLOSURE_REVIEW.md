# Closure review: comms validation fixes (31 Oct 2026)

Reviewer: independent, wrote none of this work. Branch `fix/comms-validation-2026-10-31` at `2b473a39`, diffed against `origin/develop` `42abcfe5` (merge base `ca02e820`). I judged the final tree and every claim against the code, not against the fixers' notes. The fixers' lane reports are not in the repo. So when a finding has no fix and no record in the tree, it is marked Open.

## Runs (clean worktree `/home/claude/wt-closure`)

| Command | Result |
|---|---|
| `npm ci` | exit 0 |
| `npm test` | exit 0. Mobile: 173 files, 3413 passed, 1 skipped. Every other workspace passed. |
| `npm run typecheck` | exit 0 |
| `npm run build -w @scribe/emails` | exit 0, 43 emails, tree still clean |
| `npm run test:db`, `npm run test:functions`, `supabase start` with the new `config.toml` | **not run here** (no Deno or Supabase CLI). This branch changes `supabase/**`, so D-041 still needs these before merge. |

Status key: **Fixed** / **Reason** (not fixed, with an acceptable reason) / **Deferred** (recorded) / **Partial** / **Open**.

## Closure table

### Sign-in (SIGN)

| ID | Status | Evidence |
|---|---|---|
| SIGN-01 | Fixed | `email_wait` vs `rate_limited` at `errors.logic.ts:50-53,75`. 60 s per-address cooldown at `session-provider.tsx:382-389`. Copy at `features/auth.en.ts:87,126-127`, with no "hour" and no provider named. Pinned in `server-surfaces-auth.test.ts`. |
| SIGN-02 | Fixed (repo) | `supabase/config.toml:29-130` adds site_url, the redirect list, `otp_length` 6, `otp_expiry` 900, `max_frequency` 1m, `[auth.rate_limit]` and the templates. Pinned by `supabase/tests/auth_config.test.mjs`. Recording the hosted values in `docs/legal/evidence/` is still a founder step. |
| SIGN-03 | Fixed | `fetch-otp.js:31-34,85-87`. `E2E-12...yaml:79-80` uses the mailpit default. |
| SIGN-04 | Fixed (app) | `links.logic.ts:31,72,87`, tested in `auth-links.test.ts`. The website side is on `main` and is not recorded anywhere in this tree. |
| SIGN-05 | Fixed | `CATALOG.md:45,47`, `SECURITY.md:120`, `supabase/templates/README.md:36-52`, and the comments in `auth.en.ts:36,118`. |
| SIGN-06 | Fixed | `session-provider.tsx:468`, `verify.tsx:33,58-60`, copy at `auth.en.ts:139`. |
| SIGN-07 | Fixed | `emails/auth.en.ts:79-84`, tested in `validation-2026-10-31.test.ts:129`. |
| SIGN-08 | Open | Website copy on `main`. Out of lane by the brief, but no record exists in the tree. |
| SIGN-09 | Open | `docs/ops/AUTH_SETUP.md:169` and `DOMAINS.md:145` still list `scribe://auth/callback`. |
| SIGN-10 | Fixed | Same work as TPL-04. |
| SIGN-11 | Fixed | `SECURITY.md:100`. |

### First-run setup (SET)

| ID | Status | Evidence |
|---|---|---|
| SET-01 | Fixed | `lib/asks/next-ask.logic.ts`, `review.tsx:431,424-428`, `test/next-ask.test.ts`. `review-write.test.ts` was updated to match the new order, and no assertion was dropped. |
| SET-02 | Fixed | `components/asks/reminder-prime-ask.tsx`, mounted at `(tabs)/_layout.tsx:76`. Cap of 2 at `next-ask.logic.ts:21`. Analytics schema 7. |
| SET-03 | Fixed | `eas.json:68`, allowed before the freeze by D-124 item 1. `capabilities.test.ts` and `config.test.ts` now expect three profiles. The suggested preflight check exists only as a checklist line in `scripts/brand/store-listing.ts:84`. |
| SET-04 | Fixed | `onboarding.tsx:403-407`, copy at `strings.en.ts:100-103`. |
| SET-05 | Fixed | `onboarding.tsx:129,242,331,353`, using `strings.en.ts:66`. |
| SET-06 | Open | `onboarding.tsx:467-478` still shows the language row when `englishOnly` is on. |
| SET-07 | Reason | D-126 says the code change lands after the go/no-go on Mon 9 Nov. |
| SET-08 | Fixed (differently) | The "Tell me when it's here" button was removed (`coparent-soon.tsx`) instead of being added to the backlog checklist. This is a product change the founder should know about. |

### Subscriptions (SUB)

| ID | Status | Evidence |
|---|---|---|
| SUB-01 | Partial | Fixed in Terms `:237`, Subscription Terms, `compliance-register.md:40`, `COUNSEL_PACKET.md` and `config.ts:36` (`4.0.0`; the version jump is explained in `CHANGES-2026-10-31.md`). Still open: `docs/adr/0013...md:20-21` and `.claude/agents/payments.md:22` still say $3.99 and $29.99, and the price test that scans the legal docs was not added. |
| SUB-02 | Partial | Terms 14.1 and 14.11 and the Subscription Terms are rewritten. The test that "What Plus adds" equals `billingCopy.store.features` was not added. |
| SUB-03 | Reason | Founder and counsel decision, recorded in `CHANGES-2026-10-31.md` item 1. Terms 14.6 now matches what the app does. |
| SUB-04 | Reason | Founder and counsel, recorded in `CHANGES-2026-10-31.md` item 2. |
| SUB-05 | Fixed | `plan.logic.ts:119-120,228`, tested in `billing-plan.test.ts` and `billing-plan-reminders.test.ts`. |
| SUB-06 | Partial | `ROADMAP.md:121`, `FUTURE.md:23,82`. Neither a `codeOffers` entry nor ASC D-10 is done, though both are listed as pre-submission steps. |
| SUB-07 | Open | `settings/plus.tsx:104` is unchanged. |
| SUB-08 | Open | Manage is still shown for `familyShared`. |
| SUB-09 | Reason | Held for counsel in P6 (`billing.en.ts:96-98`, `plan.logic.ts` HELD). |
| SUB-10 | Deferred | `CATALOG.md:207`. The `config.ts` comment and the store sheet link are unchanged. |
| SUB-11 | Open | `EarlyLetters.storekit:3,21` is unchanged. |
| SUB-12 | Open | `ScribeStoreModule.swift:82` and `actions.ts:67,121` still cite D-081. |
| SUB-13 | Fixed | `emails/billing.en.ts:3`. |

### Email templates (TPL)

| ID | Status | Evidence |
|---|---|---|
| TPL-01 | Fixed | `wrap` in `text.tsx` and `footer.tsx`. `policy-update` no longer prints raw URLs (`account.en.ts:252`). Tested in `validation-2026-10-31.test.ts:19-47`. |
| TPL-02 | Fixed | `purge-worker/emails.ts:50` uses `generated/resend.ts`. `lib/resend.ts:50-51` sends `html` and `attachments`. Escrow and Supabase documented in `CATALOG.md` section 14. |
| TPL-03 | Reason | No sender in build 1 (D-121). Recorded in `CHANGES-2026-10-31.md` item 1, and `{manageUrl}` now goes to Apple. |
| TPL-04 | Fixed | `links.logic.ts:38-39`, `email-link.logic.ts:85,103`, `session-provider.tsx:444-458`, `verify.tsx:44-46`. |
| TPL-05 | Fixed (differently) | No off-catalog email is sent. The step fails with `config` and raises an alert (`purge-worker/account.ts:228-231`). `contributorNotice` is deleted. `worker.test.ts` was rewritten to match this decision. |
| TPL-06 | Deferred | Route contract in `packages/emails/src/links.ts`, with a test. Pages still needed are listed in `CATALOG.md:200-210`. |
| TPL-07 | Fixed | Same work as SIGN-05. |
| TPL-08 | Fixed | `generated/resend.ts:428` uses `dateStyle: 'full'`, tested in `lib.test.ts`. |
| TPL-09 | Fixed | `billing.en.ts:182`, `backup.en.ts:32`. 90-character test at `validation...test.ts:91`. |
| TPL-10 | Reason | Accepted. Recorded in `templates/README.md` and `CATALOG.md` section 14. |
| TPL-11 | Fixed | `fixtures.ts:70`, tested at `validation...test.ts:111`. |
| TPL-12 | Fixed | `config.toml:96-123`. CLI load not run here. |

### Language (LNG)

| ID | Status | Evidence |
|---|---|---|
| LNG-01, 02, 03 | Fixed | `strings.en.ts:666-694`. |
| LNG-04 | Partial | `saving` and `errors.generic` are fixed. `billing.en.ts:94` `plan.retry` still says "safe". |
| LNG-05 | Fixed | `strings.en.ts:331`, `auth.en.ts:130`. |
| LNG-06 | Partial | The help text changed. The "Every evening" option is still offered (`strings.en.ts:823`). |
| LNG-07, 08 | Fixed | `strings.en.ts:626-632`, `reminders.en.ts:15-21`. |
| LNG-09 | Partial | `strings.en.ts:430,944` still say "Please have a read". |
| LNG-10, 11 | Fixed | `strings.en.ts:183`, `billing.en.ts:51`. |
| LNG-12 | Partial | `confirmation.title` is fixed. `plan.restored` is still "Plus is on." (`billing.en.ts:111`). |
| LNG-13, 14 | Fixed | `auth.en.ts:38-39,58,209`, plus the BRAND glossary. |
| LNG-15 | Partial | Site and Family are fixed. Still open: `strings.en.ts:874,1212`, `stories.en.ts:57`, `auth.en.ts:149`. |
| LNG-16 | Reason | Same as SUB-09 (held until P6 and counsel). |
| LNG-17 | Fixed | `billing.en.ts:141,150`. |
| LNG-18 | Partial | Three phrasings remain, and the store's "Fix a word if the microphone slipped" (`store.en.ts:71`) is still there. |
| LNG-19 to 25 | Fixed | Email copy diff, tested in `validation...test.ts:90-186`. |
| LNG-26 to 32 | Fixed | `pages.en.ts:117-152`, `site.en.ts:43-109`. |
| LNG-33, 34 | Fixed | `store.en.ts:51-88`. Store rules test at `rules.test.ts:581-597`, replacing the D-056 assertion because D-121 supersedes it. |
| LNG-35 | Fixed | `docs/store/app-store.md:102`. |
| LNG-36 | Fixed | `privacy-policy.md:18`. |

## Sweep results (all clean unless listed under new problems)

- **Banned characters.** Added lines have no em or en dashes, curly quotes, ellipsis characters or emoji. That covers `generated/resend.ts` and the escrow templates too.
- **AI-writing claims and gendered child.** Added copy has no AI-writes wording and no gendered child.
- **Prices and plan names.** No $3.99 or $29.99 in product, legal or email files, apart from ADR 0013 and the payments agent file (SUB-01). Plan names are consistent ("Monthly" is held, SUB-09).
- **Privacy.** No child name or letter text reaches emails, logs or analytics (`reminder_prime_shown` sends `source` only).
- **Migrations.** None touched.
- **Auth paths.** `/auth/callback` is the only redirect, and `/auth/confirm` is now also accepted by the app.
- **Build 1.** The new asks (`askAfterSave` `signInOffered` needs `auth.configured`) and `email_change` (needs a signed-in session) do not reach server features in build 1.
- **Tests.** Every changed test was updated to a recorded decision. I found no assertion simply dropped.

## New problems introduced

| # | Sev | Problem | Exact fix |
|---|---|---|---|
| N1 | Medium | About 200 `docs/release/journey/steps/*.json` were committed from a partial run without screenshots. `"shot"` was dropped from 202 files and 4 new partial-run files were added. `docs/release/journey/README.md` says a feature PR never commits `steps/`. | `git checkout origin/develop -- docs/release/journey/steps && git rm docs/release/journey/steps/{J13-05,J13-06,J13-07,J22-22}.json` |
| N2 | Medium | `packages/core/src/plan.ts` and its tests remove "another parent's Plus covers the book" (`plus_book`). That is an entitlement rule change outside the brief, made with no D- record and inside a commit titled `fix(emails)`. App behaviour does not change, because `family-rules.ts:144` already returns false. But `CHANGES-2026-10-31.md` item 3 still calls it an open founder choice and describes the old code. The new TDD 08 note points at `apps/mobile/src/lib/billing/plan.ts`, which does not exist. | Split it into its own PR with a decision record, or keep it and update CHANGES item 3 to "resolved: plan.ts now follows 14.12". Fix the TDD 08 path to `packages/core/src/plan.ts`. |
| N3 | Medium | Legal text changes go beyond the brief. Terms 13.1 removes co-parent writing from the free-forever list, and 14.6 now promises the contents of future reminder emails. Both are flagged inside `CHANGES-2026-10-31.md`, but neither was asked for. | Founder: approve explicitly at merge (D-125 item 5), or revert 13.1 to keep co-parent writing pending Q14. |
| N4 | Low | Stale or broken references added by the fixes: `config.toml:39` says "/auth/confirm is not listed until the app accepts it" (the app accepts it now). `templates/README.md:59-61` says the app does not accept `email_change` (it does now). `CATALOG.md:71` says `contributorNotice` "should be removed by the server lane" (it has been). `emails/billing.en.ts:12` cites `packages/emails/test/billing-notices.test.ts`, which does not exist. | Reword each line. The test reference should be `validation-2026-10-31.test.ts`. |
| N5 | Low | LNG-18 is now worse in one way: there are three phrasings, and the store keeps "the microphone slipped". | Use the BRAND.md sentence on every surface, and in `store.en.ts:71` write "Fix a word if one is wrong." |

The partially fixed items and the open SUB-07, SUB-08, SUB-11, SUB-12, SET-06, SIGN-08 and SIGN-09 are each small. Fix them or record a backlog id for each before merge.

## Verdict

**Fix first.** Tests, typecheck and the email build are green. Content, privacy and price checks are clean. Before founder merge:

1. Revert N1.
2. Resolve N2.
3. Get the founder's explicit sign-off on N3.
4. Close or record the 7 open and 9 partial findings.
5. Run `test:db`, `test:functions` and `supabase start` (D-041).

## Second pass (head `aeb248c4`)

Same reviewer. Checked out `aeb248c4` with `git fetch` and a detached checkout. The lockfile is unchanged, so `npm ci` was not needed. `supabase/**` is unchanged since `2b473a39`. The coordinator reports that `test:db` (35/35) and `test:functions` passed there; I did not run them.

**Runs:** `npm test` exit 0 (mobile: 176 files, 3424 passed, 1 skipped; emails: 231 passed; every other workspace passed). `npm run typecheck` exit 0.

### Items re-checked against the code

| ID | Now | Evidence |
|---|---|---|
| N1 | Fixed | `git diff origin/develop HEAD -- docs/release/journey` is empty. The four partial-run files are gone. |
| N2 | Fixed | `packages/core/src/plan.ts:9-16` cites D-053 ("A co-parent gets Plus through Family Sharing", `DECISIONS.md:367`) and Terms 14.12. `CHANGES-2026-10-31.md` item 3 is marked resolved. The TDD 08 note now points at `packages/core/src/plan.ts`. |
| N3 | Founder's call, recorded | `CHANGES-2026-10-31.md` has a new section, "Needs explicit founder sign-off at merge", covering Terms 13.1 and 14.6, with a revert path for each. |
| N4 | Fixed or deferred | The `billing.en.ts:12` test reference is fixed, and so is the `CATALOG.md` family-book-closing row. The two `supabase/` comments are deferred to BL-516; supabase was frozen for the DB run. |
| N5, LNG-18 | Fixed or locked | Every surface not registered with counsel now uses the BRAND.md sentence: `strings.en.ts:847`, `stories.en.ts:41`, `store.en.ts:46`, `site.en.ts:35,59,97`, `pages.en.ts:61,117`, `auth.en.ts:105`. The store and site steps now read "Fix a word if one is wrong." `review.firstNote.body` is counsel-locked. |
| SIGN-08 | Deferred | BL-509 (website, `main`). |
| SIGN-09 | Fixed | `AUTH_SETUP.md:169-172`, `DOMAINS.md:145`, `TESTFLIGHT.md`. |
| SET-06 | Fixed | `onboarding.tsx:469` uses `language-row.logic.ts`, tested in `onboarding-language-row.test.ts`. |
| SUB-01 | Fixed | `pricing.test.ts:63-77` scans both legal bodies for `PLUS_PRICE`. ADR 0013 has a status note and keeps the old table as history. `payments.md:22` gives the D-082 prices and marks the old ones superseded. |
| SUB-02 | Fixed | `pricing.test.ts:79`: the Subscription Terms "What Plus adds" equals `billingCopy.store.features`. |
| SUB-06 | Fixed or deferred | The `codeOffers` entry is added and tested in `storekit-config.test.ts`. The device pass D-10 is BL-526. |
| SUB-07 | Fixed | `plan.logic.ts` `ownSubscription`, used at `plus.tsx:105`, tested in `settings-plan-rows.test.ts`. |
| SUB-08 | Fixed | `planScreen` `manage` excludes `familyShared`, tested. |
| SUB-11 | Fixed | `EarlyLetters.storekit`: grace on, one code offer, Terms named. Tested. |
| SUB-12 | Fixed | The Swift and `actions.ts` comments now cite D-053 and ADR 0013 (D-081 is kept only for consent records). A test pins it. |
| LNG-04, 09, 12, 15 | Counsel-locked | `COUNSEL_LOCKED.md`, BL-527. I confirmed every locked string is pinned by `experience-pass.test.ts` or `server-surfaces-auth.test.ts`, or quoted in `in-app-disclosures.md`. Changing one is a counsel change, not a copy fix. |
| LNG-06 | Reason | `strings.en.ts:823-824`: PRD C-REQ-002 (P0) lists "Every evening" as an option the person chooses, and the help text no longer sets a rhythm. |
| BL-509 to BL-527 | Present | `docs/BACKLOG.md:2246-2375`. Each item has an owner, a gate and a done-when line. BL-520 to BL-525 concern #306, not this review. |

### `language-picker-english-only.test.ts`

The only change is to the allowlist of files that may read the English-only switch. It adds `app/onboarding.tsx` and `components/onboarding/language-row.logic.ts`, and renames the test title to match. No assertion was removed. The guard's purpose still holds: both new entries are screen code, and no store, sync, rules or pack code reads the switch. A new test, `onboarding-language-row.test.ts`, pins the row to that rule. This widens the guard because a decision needs it. It does not weaken the guard.

### Sweeps on the second-pass diff

- **Banned characters:** none.
- **Prices:** $3.99 and $29.99 now appear only as marked history (ADR 0013 note and table, CHANGES, changelogs, the payments agent file).
- **Removed test lines:** only the test title above.
- **Privacy:** no new data in analytics or emails.
- **Build 1:** the language row is hidden there, and nothing new reaches server features.
- **Migrations:** none.

### Final verdict

**Ready for founder merge.** At merge the founder still needs to:

1. Approve or revert Terms 13.1 and 14.6 (N3, `CHANGES-2026-10-31.md`).
2. Give the D-041 `supabase/**` review and `approve-migration` sign-off.

Before submission these stay open: BL-509 to BL-527, including counsel on the locked strings (BL-527) and SUB-03 and SUB-04.
