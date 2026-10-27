# Release and operations

Beta, domains, the release lane and its gates, the repository, accounts and running costs.

### D-005 D-U-N-S and LLC off the critical path; domain and support email stay on it
- **Source:** `docs/DECISIONS.md` D-005 (Decided, founder, 2026-10-03)
- **Decided:** the critical path no longer waits on an entity or D-U-N-S. It still waits on the domain and a support email on that domain; domain choice due in week 1.
- **Why:** not recorded in the source; it follows D-004 (individual publisher)
- **Door:** two-way: a scheduling call
- **Reversal cost:** low
- **Revisit when:** none expected: closed by D-063
- **Review by:** on trigger
- **Status:** retired: closed by D-063, which chose the domain and made the support email live
- **As built:** `packages/brand/index.ts`

### D-011 Beta ends only when the founder says so
- **Source:** `docs/DECISIONS.md` "Earlier founder decisions carried forward" D-011 (Decided, founder, 2026-10-01/02; placement amended by D-030); PRD K-13
- **Decided:** the beta ends only when the founder says so.
- **Why:** not recorded in the source
- **Door:** two-way: the in-app label is copy
- **Reversal cost:** low
- **Revisit when:** customer: the founder judges quality ready (no measured criterion is recorded)
- **Review by:** on trigger
- **Status:** in force
- **As built:** `packages/content/src/strings.en.ts` (the in-app "early version" note)
- **Also:** where the beta label lives is D-060

### D-030 Where "beta" lives: TestFlight, plus the in-app About label
- **Source:** `docs/DECISIONS.md` D-030 (Recommended, needs founder OK, 2026-10-03; amends K-13)
- **Decided:** recommended running the beta on TestFlight, no beta paragraph or "Now in beta" text in the v1.0 listing, and keeping the in-app About label and Terms 16.4.
- **Why:** App Review Guideline 2.2: "Demos, betas, and trial versions of your app don't belong on the App Store - use TestFlight instead."
- **Alternatives:** keep the store beta line (likely rejection).
- **Door:** two-way: answered by a later decision
- **Reversal cost:** low
- **Revisit when:** none expected: answered
- **Review by:** on trigger
- **Status:** superseded by D-060
- **As built:** see D-060

### D-045 Beta cohorts before submission
- **Source:** `docs/DECISIONS.md` D-045 (Recommended, needs founder OK, proceed: yes, 2026-10-03; still listed as needing the founder, by 4 Dec)
- **Decided:** C0 internal (founding family, from week 6), then C1 external TestFlight with 15 to 25 friendly families for 3 weeks (from about 16 Dec), then App Store submission. The C2 public TestFlight link (100 to 300 testers) is optional and runs after submission.
- **Why:** C2 for 3 weeks before the store would move submission into February; C1 covers co-parents, grandparents, Hindi speakers, twins and VoiceOver users.
- **Door:** two-way: a schedule
- **Reversal cost:** low
- **Revisit when:** customer: C1 finds blocking issues; market: the founder wants the public link earlier (it is also a D-004 trigger to form an entity)
- **Review by:** 2026-12-04
- **Status:** open: recommended and proceeding, but the founder's answer is still listed as needed
- **As built:** `.github/workflows/testflight.yml`, `docs/release/TESTFLIGHT.md`

### D-060 Beta on TestFlight; the store listing never says beta; the in-app note stays
- **Source:** `docs/DECISIONS.md` D-060 (Decided, founder, 2026-10-03; answers D-030)
- **Decided:** the beta runs on TestFlight; the store listing never says "beta"; the app keeps a small "early version, can make mistakes" note.
- **Why:** not recorded in the source beyond the founder brief (decision 10); D-030 cites App Review Guideline 2.2
- **Door:** two-way: copy
- **Reversal cost:** low
- **Revisit when:** none expected
- **Review by:** on trigger
- **Status:** in force
- **As built:** `packages/content/src/store.en.ts`, `packages/content/test/rules.test.ts`
- **Also:** BRIEF-20261003-10

### D-063 Domains, email and legal URLs; universal links; bundle id
- **Source:** `docs/DECISIONS.md` D-063 (Decided, founder, 2026-10-03; closes D-005)
- **Decided:** earlyletters.com primary, earlyletters.app redirects (Porkbun); email through Resend with hello@earlyletters.com live; legal pages /terms, /privacy, /health-privacy, /subprocessors; universal links on https://earlyletters.com; the website built in a separate thread on Vercel; bundle id `com.earlyletters.scribe`.
- **Why:** not recorded in the source beyond the founder brief (decision 13); D-005 explains why the domain was on the critical path
- **Door:** one-way after launch: the bundle id cannot change after the first build is uploaded to App Store Connect (note in `packages/brand/index.ts`), and legal URLs are printed in published documents and builds
- **Reversal cost:** high after the first upload: a new bundle id means a new app record; low before it (no build has been uploaded as of 15 Oct per the Project coordination doc)
- **Revisit when:** none expected: domain and bundle id are meant to be permanent
- **Review by:** on trigger
- **Status:** in force
- **As built:** `packages/brand/index.ts`, `docs/ops/DOMAINS.md`, `docs/ops/well-known/apple-app-site-association`
- **Also:** BRIEF-20261003-13. The Project doc `infra/cost-decisions-2026-10-03.md` names Cloudflare Pages Free for the website, while D-063 says Vercel; no source decides between them.

### R-008 Release protection: an `app-store` environment, tag and branch rulesets, branch protection
- **Source:** issue #127 item 7 (founder-delegated, 14 Oct 2026); founder choice of 15 Oct for the gate form, recorded in Project doc `claude/Early-Letters-Coordination.md` (release-engineering thread) and comments on PRs #108, #110, #111, #112 (15 Oct)
- **Decided:** create a GitHub environment `app-store` with the founder as required reviewer, allowing only `ios-v*` tags and `release/*` branches and holding the store secrets (`EXPO_TOKEN`, `ASC_REVIEW_CONTACT_JSON`); add rulesets for `ios-v*` tags and `release/*` branches that only admins bypass; turn on branch protection for `develop` and `main`. The founder sets it up in FT-20, due Fri 23 Oct.
- **Why:** these are free on a public repo and close the gaps the red team found in #108 and #110 (#127). The earlier design assumed a private repository; it is public.
- **Door:** two-way: repository settings
- **Reversal cost:** low
- **Revisit when:** team: a second person with merge rights joins; platform: the repository goes private (environments and rulesets then need a paid plan)
- **Review by:** 2026-10-23
- **Status:** in force: a founder action in GitHub settings, not yet done. The environment and the tag and branch rulesets are now in the log as the 15 Oct gate amendment of D-089 (merged PR #108, ADR 0022 decision 8); branch protection for `develop` and `main` is not in the log. Checked 27 Oct 2026: the GitHub API still reports `develop` as not protected, so the review date of 23 Oct has passed with the setting not done (waits on the founder)
- **As built:** not built: agent sessions cannot change repository settings; `.github/workflows/deploy-db.yml` already uses an environment

### R-009 The repository stays public on GitHub Free
- **Source:** Project doc `infra/cost-decisions-2026-10-03.md` (founder, 13 Oct 2026); Project doc `claude/Early-Letters-Coordination.md` (platform thread)
- **Decided:** the repository stays public for now on GitHub Free.
- **Why:** Actions are free on public repos and branch protection is available on Free for public repos (cost doc).
- **Door:** one-way: everything pushed while public stays public (clones, forks, archives); going private later protects only future commits. Git history still contains real family details removed in PR #52 (cost doc)
- **Reversal cost:** medium: going private needs GitHub Pro (about $4 a month per the cost doc) for branch protection; already-published history cannot be recalled
- **Revisit when:** team: a hire or contractor needs private code; law: counsel advises on the family details in public history; cost: GitHub changes free features for public repos
- **Review by:** on trigger
- **Status:** in force
- **As built:** a repository setting; `.github/workflows/ci.yml` runs on free Actions minutes

### R-010 Two-factor authentication is optional
- **Source:** Project doc `infra/cost-decisions-2026-10-03.md` (founder, 13 Oct 2026); Project doc `claude/Early-Letters-Coordination.md` (platform thread)
- **Decided:** 2FA is optional.
- **Why:** not recorded in the source
- **Door:** two-way: an account setting
- **Reversal cost:** low
- **Revisit when:** platform: GitHub, Apple or another provider makes 2FA mandatory for the account; team: anyone else gains admin or store access
- **Review by:** on trigger
- **Status:** in force
- **As built:** account settings outside the repo

### R-011 v1.0 runs at $0 vendor cost; spend only at named triggers
- **Source:** Project doc `infra/cost-decisions-2026-10-03.md` (3 Oct, updated 13 Oct). The doc attributes the 3 Oct move of sharing, sign-in and sync to v1.1 and the 13 Oct updates to the founder; it does not say who decided each row of its table.
- **Decided:** v1.0 costs $0 beyond the $99 Apple Developer fee: Supabase project paused, staging on Free only when CI first deploys, prod on Pro only when the first real letters go on a server; agent harness off with no OpenRouter key; website on Cloudflare Pages Free; packs on Cloudflare R2 free tier; Resend Free; EAS Free; PostHog with a $0 billing limit.
- **Why:** not recorded in the source beyond the triggers in its table
- **Door:** two-way: spending can start at any trigger
- **Reversal cost:** low
- **Revisit when:** cost: v1.1 co-parent sharing puts real letters on a server (Supabase Pro from $25 a month the same day); cost: more than 15 iOS builds a month (EAS Starter $19); cost: more than 100 emails a day (Resend Pro $20); cost: R2 storage above 10 GB-month
- **Review by:** 2026-11-15
- **Status:** in force
- **As built:** `apps/mobile/eas.json`; `.github/workflows/agents.yml` (the harness runs only when the `AGENTS_ENABLED` repository variable is true, ADR 0018)
- **Also:** the cost doc's website host (Cloudflare Pages) differs from D-063 (Vercel)

### D-089 Release engineering model: two lanes, release branch, version file, RC tags
- **Source:** `docs/DECISIONS.md` D-089 (Decided, founder, 2026-10-13, recommended 3 Oct; gate amended 15 Oct, founder); ADR 0022 (Accepted, 2026-10-13; amended 15 Oct); PR #108 (merged 15 Oct 2026)
- **Decided:** a preview lane (`testflight` profile, `.preview` record) for C0, C1 and every build before freeze, and a store lane (`production` profile). `release/1.0` is cut from `main` at freeze (Mon 26 Oct) and fixes are cherry-picked from `develop`. One version in a version.json file in the app folder; build numbers only from EAS. `ios-v1.0.0-rc.<n>` tags build candidates into the production record's internal TestFlight; the candidate that passes FT-39 is submitted (FT-45); `ios-v1.0.0` is tagged after release. Store text generated from `packages/content`. Gate (15 Oct): store-lane jobs run in the GitHub environment `app-store` with the founder as required reviewer, with tag and branch rulesets only admins bypass (see R-008).
- **Why:** ADR 0022 context: there was no defined path from a frozen tree to the binary Apple reviews, no single place for the version, no store metadata the pipeline could push and no rule for what a release tag means. A release branch was chosen because v1.0.1 work and fix waves keep landing on `develop` during review, so without one the submitted code could only be protected by freezing everyone (ADR 0022 alternatives). The gate changed because the 3 Oct design assumed a private repository; it is public (D-089 text).
- **Alternatives:** release from `main` with tags only (freezes `main`); freeze on `develop` with no release branch (freezes everyone through review); one lane for C0 and C1 too (undoes the preview lane); build on every push to `release/*` (spends free builds); repository secrets and a written rule only (any workflow run on any branch can read repository secrets); EAS Workflows or fastlane (a second pipeline outside our checks). All from ADR 0022.
- **Door:** two-way: release process and tags
- **Reversal cost:** low
- **Revisit when:** team: a second engineer joins; platform: OTA updates are adopted (see D-091)
- **Review by:** on trigger
- **Status:** in force
- **As built:** `.github/workflows/testflight.yml`, `docs/release/TESTFLIGHT.md`; `docs/ops/RELEASE.md` (the release runbook, PR #111, merged 16 Oct 2026); the version file and store workflow are in open PRs #109 and #110
- **Also:** R-012; ADR-0022 (decisions 1 to 8 and 10; decision 9 is D-091)

### D-091 No OTA updates in v1.0
- **Source:** `docs/DECISIONS.md` D-091 (Decided, founder, 2026-10-13; changes the 3 Oct recommendation to ship `expo-updates`); ADR 0022 decision 9; PR #108 (merged 15 Oct 2026)
- **Decided:** no `expo-updates` in v1.0. Fixes ship as PATCH builds from the release branch, with expedited review for an S0.
- **Why:** v1.0 became on-device only (PR #54) and plans "Data Not Collected" (D-088); an update check on every launch is a new network destination for the data map and a privacy-label question for counsel, three weeks before submission (D-091 rationale).
- **Alternatives:** OTA in v1.0, the 3 Oct recommendation (ADR 0022 decision 9).
- **Door:** two-way: adding `expo-updates` later is a release
- **Reversal cost:** low
- **Revisit when:** platform: v1.1, when sign-in brings a server anyway (from the source)
- **Review by:** on trigger
- **Status:** in force
- **As built:** `apps/mobile/package.json` has no `expo-updates`
- **Also:** R-014; ADR-0022 decision 9

### D-092 EAS Free, then Starter when builds exceed it
- **Source:** `docs/DECISIONS.md` D-092 (Decided, founder, 2026-10-13; matches the cost decisions of 3 Oct); PR #108 (merged 15 Oct 2026); Project doc `infra/cost-decisions-2026-10-03.md`
- **Decided:** EAS Free (15 iOS builds a month) until builds would exceed it, then Starter ($19 a month plus usage); also move to Starter for a month if Free's low-priority queue (one concurrent build) holds up a release candidate.
- **Why:** not recorded in the sources beyond the cost posture (R-011)
- **Door:** two-way: a plan change
- **Reversal cost:** low
- **Revisit when:** cost: more than 15 iOS builds in a month; cost: queue time holds up a release candidate (both from the source)
- **Review by:** 2026-11-15
- **Status:** in force
- **As built:** `apps/mobile/eas.json`
- **Also:** R-015

### D-093 The 13 Oct integration branch is never merged
- **Source:** `docs/DECISIONS.md` D-093 (Decided, delegated by founder, 2026-10-15; the founder can reverse it); PR #122 (merged 15 Oct 2026)
- **Decided:** `auto/2026-10-13-integration` (the Line B fix wave merged onto the 4 Oct `develop`) is never merged. Line B's fixes reach `develop` one concern per PR, as mapped in the port map (PR #117). The release runbook lands through PR #111 and the device test plan rows through PR #123. The branch is kept, not deleted, so parked code can be reused.
- **Why:** not recorded in the source
- **Door:** two-way: the branch is kept, so any fix on it can still be ported
- **Reversal cost:** low: porting is per concern and nothing is deleted
- **Revisit when:** team: a fix needed for v1.0 exists only on the integration branch and is not in the port map
- **Review by:** on trigger
- **Status:** in force: the port map (#117), runbook (#111) and test plan rows (#123) all merged on 16 Oct 2026
- **As built:** `docs/agents/PORT_MAP_2026-10-13.md`, `docs/ops/RELEASE.md`, `docs/qa/DEVICE_TEST_PLAN.md`; the branch itself is a rule, not code

### D-106 Alpha in two weeks: option B as a TestFlight alpha against staging
- **Source:** `docs/DECISIONS.md` D-106 (Decided, founder, build thread, 2026-10-15); PR #128 (merged 16 Oct 2026)
- **Decided:** option B ships as an alpha: a TestFlight build with server features on against the staging project, for the founder's family and invited friends, target Thu 29 Oct 2026. App Store submission is re-planned after the alpha. The review delegation part was proposed by the coordinator and is settled by D-107.
- **Why:** not recorded in the source
- **Door:** one-way after launch: once invited friends sign in, staging holds outside families' letters and recordings
- **Reversal cost:** low before anyone outside the family signs in; high after, because their data on staging has to be kept, exported or deleted
- **Revisit when:** team: the R-17 security gate (D-100) has not passed before invited friends sign in; law: counsel has not answered the server-product packet (#163) before outside testers sign in
- **Review by:** 2026-10-29
- **Status:** in force
- **As built:** not built on `develop`: `apps/mobile/eas.json` has `EXPO_PUBLIC_SERVER_FEATURES` off in every profile; the alpha profiles are in open PR #145; the alpha plan is in open PR #152
- **Also:** R-016 (part); the delegation part is D-107

### D-111 Alpha calls resolved, 17 Oct 2026
- **Source:** `docs/DECISIONS.md` D-111 (Decided, founder, Sat 17 Oct 2026, 11:00 PM PT, by accepting the coordinator's recommendations as they stood; counsel items open); PR #229 (merged 18 Oct 2026); the founder questions on #140 and #208; #220's visual review
- **Decided:** thirteen items for the alpha. (1) Website copy on `main` uses the fictional family only, with the real-family-name guard in `main`'s CI; no history purge. (2) Vercel preview deployments off; only `main` builds. (3) Domains: D-097 for `earlyletters.app`, D-063 for everything else. (4) The alpha transcribes English only. (5) The 500-kill test runs on the hosted macOS runner, with the founder's Mac and a silent virtual microphone as fallback. (6) D-104 item 2 confirmed: backup is free for everyone in v1.0. (7) The server keeps the record that a letter was erased, and held-draft markers (ids and times, never words), until the book or the author's account is deleted (counsel reviews the policy line; open). (8) The R-17 gate on #140: limits as built and measured in the alpha, `peek_invite` returns only the inviter's sign-off and role before consent, the pull-timing residual accepted for C1, S02's option for question 1, `pack_ref` classed L4, purged ids dropped at 60 days. (9) Held-draft sync between one author's two phones ships on in build 2, unless the held-draft table is not green in `sync-two-phone` by Fri 23 Oct 2026; `app.held_sync = 'off'` turns it off without a build. (10) When a letter is kept on both phones, the first keep's raw transcript stands and the second phone's words become a conflict copy. (11) The first-run promise screen goes to 71 words and its acceptance line to about 70. (12) The name step hides the cover below 480 pt of free height (was 640 pt). (13) Which legal pages build 2 needs is counsel's call (open).
- **Why:** item 2: it stops PRs into `develop` hitting the free plan's daily deploy cap; item 4: another language needs a native reviewer first; item 7: so an offline phone cannot bring an erased letter back after the 60-day forget; item 10: the raw transcript is immutable (DATA-REQ-040) and no words are lost; item 11: #220 counted 74 words, and the recording and privacy rows are at their floor without wording counsel would need to see; item 12: measured with the keyboard up, only the iPhone SE (407 pt) hides the cover. Other items: not recorded in the source
- **Alternatives:** item 11: a 3-word hint cut without the feature name, not taken because D-074 and D-086 chose the name "Word for word"; item 8: closing the pull-timing residual, left to the sync ADR
- **Door:** one-way after launch: item 6 becomes a pricing promise once backup ships and is advertised, and item 7 a retention promise once it is in the privacy policy; the other items are two-way (settings, copy, tests and switches)
- **Reversal cost:** medium: items 6 and 7 need copy, policy and counsel changes once published; the rest are code, copy or project settings
- **Revisit when:** technology: the held-draft table is not green in `sync-two-phone` by Fri 23 Oct 2026 (item 9: build 2 ships with held sync off); law: counsel answers items 7 and 13; scale: the R-17 limits measured in the alpha (item 8)
- **Review by:** 2026-10-29
- **Status:** in force, except items 7 and 13 (counsel, open); item 3 of D-104 is not changed here. Follow-up PRs named in the source and still open on 23 Oct: #238 (item 12), #184 (the BL-322 copy in item 8), #182 and #208 (items 9 and 10), #140 (item 8)
- **As built:** item 12 not built: `apps/mobile/src/app/onboarding.tsx` still has `COVER_MIN_FREE_HEIGHT = 640`; item 2 is a Vercel project setting, applied Sat 17 Oct per the source; items 9 and 10 are in open PRs #182 and #208
- **Also:** amends D-104 (item 2) and R-007; confirms D-097 and D-063; D-106

### R-019 Staging follows `develop` only
- **Source:** PR #205 (merged by the founder 18 Oct 2026; S20 comment of 17 Oct: "implements the coordinator's decision that staging follows develop only"); `docs/ops/DEPLOY.md` ("Staging follows `develop` only (decided 17 Oct 2026)"); `docs/release/AUTOMATION.md` sections 2.0 and 2.2
- **Decided:** a push to `main` deploys nothing to a database. Staging takes `develop`'s migrations and functions (`deploy-db.yml` on `develop` and `db-v*` tags only; `deploy-functions.yml` on `develop`); production takes migrations only from a `db-v*` tag on `main`, through the `production` environment, once AF-42 sets that project up after the alpha. The `staging` environment's deployment-branch rule becomes `develop` only (a founder step).
- **Why:** before this, a push to `main` also deployed staging; with staging ahead of `main` that run could only fail `db push`, because the remote holds versions `main` lacks (`docs/ops/DEPLOY.md`)
- **Door:** two-way: workflow triggers and an environment rule
- **Reversal cost:** low: workflow and settings changes
- **Revisit when:** team: AF-42 sets up production after the alpha; team: `main` and `develop` become one lineage after the alpha (ADR 0026, proposed)
- **Review by:** on trigger
- **Status:** in force: decided by the coordinator and merged by the founder; not in `docs/DECISIONS.md`
- **As built:** `.github/workflows/deploy-db.yml`, `.github/workflows/deploy-functions.yml`, `docs/ops/DEPLOY.md`

### ADR-0026 Release automation pipeline (proposed)
- **Source:** `docs/adr/0026-release-automation-pipeline.md` (Proposed, 16 Oct 2026, revision 2; each numbered decision takes effect when the founder accepts it); PR #185 (merged 16 Oct 2026); plan in `docs/release/AUTOMATION.md`
- **Decided:** not decided. Proposed: a second GitHub approver account held only by the founder as the only required reviewer; branch protection on `main` and `develop`; `develop` as the default branch after `claude.yml` is hardened; one lineage after the alpha; eight GitHub environments; TestFlight promotion gated on R-17; App Store Connect keys split by job; pack signing never in CI; tester feedback kept private; connectors treated as production credentials; a list of what agents may start; content-free scheduled health checks.
- **Why:** agents act through the founder's own account, so GitHub cannot tell their approval from the founder's; nothing protects `main` or `develop`; workflows on `develop` cannot be dispatched while `main` is the default branch; the repository is public, so logs and issues are public (the ADR's Context).
- **Alternatives:** the founder's own account as the only reviewer; keep `main` as default and copy workflows; merge the lineages before the alpha; fastlane for all store work; EAS Workflows; a CI-held signing key; feedback in public issues (each with its reason in the ADR).
- **Door:** two-way: GitHub, EAS and App Store Connect settings the founder can change back; the second account and environment layout are cheap to undo
- **Reversal cost:** medium: settings across GitHub, EAS and App Store Connect, and workflows that depend on them
- **Revisit when:** platform: GitHub blocks `pull_request_target` by default in public repositories from 2 Nov 2026 (decision 3); team: agents stop holding the owner credential (AF-27, after the alpha)
- **Review by:** on trigger
- **Status:** proposed: each numbered decision waits for the founder's acceptance; decisions 1 to 3 are founder settings
- **As built:** `docs/release/AUTOMATION.md` (the plan and founder checklist AF-01 to AF-43); no settings changed per the ADR

### D-114 Database budgets on the nightly; plan checks on every pull request
- **Source:** `docs/DECISIONS.md` D-114 (Delegated call by the coordinator, founder may reverse, 23 Oct 2026); PR #215 and the docs PR #240 (merged 23 Oct 2026)
- **Decided:** pull requests run the deterministic plan and named-index checks at 250 families x 400 letters; the p95 budgets run on the nightly only, at 1,000 x 400 (`PERF_BUDGETS=1`); a nightly red from a missed budget alone is advisory and does not fail go/no-go row B2-22 until the budgets get their own workflow with one retry; until the default branch is `develop` (AF-05) the plan checks on every pull request are the guard.
- **Why:** shared runners make timing budgets flaky: on 23 Oct the same SQL missed 5 of 6 read budgets at a load average of 10 and passed them at 3 (source).
- **Door:** two-way: workflow and policy lines
- **Reversal cost:** low: workflow config and policy text
- **Revisit when:** technology: the budgets get their own workflow with one retry; platform: the default branch becomes `develop` so the nightly can run
- **Review by:** on trigger
- **Status:** in force
- **As built:** `supabase/tests/perf.test.mjs`, `supabase/tests/sync_perf.test.mjs`, the `perf` job in `.github/workflows/nightly.yml`, DB-R21 in `docs/engineering/03-database-and-schema.md`

### D-115 English-only pack release before build 1; other languages wait for a native reviewer
- **Source:** `docs/DECISIONS.md` D-115 (Delegated call by the coordinator, founder may reverse, 23 Oct 2026); PR #162 (merged 23 Oct 2026); PR #246 (the log entry); runbook `docs/ops/PACKS_HOSTING.md`
- **Decided:** an English-only pack release is a build 1 prerequisite, because the app loads a speech model only from the signed manifest on the D-097 host. The founder runs the key ceremony and the `release`, `upload` and `verify` steps on one computer with the private key outside the repo; no CI job reads the signing or upload secrets. `release` defaults to `--languages en`. A non-English pack ships only when a native reviewer and the founder say so. The app-side gate on the language picker is S12, a follow-up.
- **Why:** the manifest is the app's only source of models, so the release decides what build 1 can do; a draft text pack in another language would put unreviewed words in front of a family; the signing key stays with the founder (source).
- **Door:** two-way: a release flag and a host file; the signing key itself is covered by its own ceremony
- **Reversal cost:** low: publish another release
- **Revisit when:** customer: a native reviewer and the founder approve a second language; platform: the host or manifest scheme changes
- **Review by:** on trigger
- **Status:** in force; unverified from the sandbox: the real upload and the live host, so the founder's first run is the check (source)
- **As built:** `scripts/packs/` (`keygen.mjs`, `release`, `upload`, `verify`), `docs/ops/PACKS_HOSTING.md`; three docs still name the coordinator as the signer (`docs/ops/RELEASE.md` section 9, BL-335, the coordination doc section 6 under `docs/agents/`) per the source
- **Also:** builds on D-111 item 4 and D-097
