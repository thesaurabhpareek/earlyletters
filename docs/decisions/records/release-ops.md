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
- **Status:** in force: a founder action in GitHub settings, not yet done
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
- **As built:** `apps/mobile/eas.json`; `agents/roster.json` (harness off unless the `AGENTS_ENABLED` variable is set, ADR 0018)
- **Also:** the cost doc's website host (Cloudflare Pages) differs from D-063 (Vercel)

### R-012 Release engineering model: two lanes, release branch, version file, RC tags
- **Source:** Project doc `infra/release-engineering-plan.md` (lists D-089 as Decided, founder); open PR #108 (D-089 text, ADR 0022); comment on #108 (15 Oct 00:41 UTC): "The founder replied 'Approved' in the release-engineering thread on 14 Oct, after reviewing #108 to #112"; comment on #79 (14 Oct): "The founder approved D-089 on 13 Oct"
- **Decided:** a preview lane (`testflight` profile, `.preview` record) for C0, C1 and every build before freeze, and a store lane (`production` profile). The branch release/1.0 is cut from `main` at freeze (Mon 26 Oct) and fixes are cherry-picked. One version in a version.json file in the app folder; build numbers from EAS. `ios-v1.0.0-rc.<n>` tags build candidates; the candidate that passes FT-39 is submitted; `ios-v1.0.0` is tagged after release. Store text generated from `packages/content`.
- **Why:** not recorded in the sources read
- **Door:** two-way: release process and tags
- **Reversal cost:** low
- **Revisit when:** team: a second engineer joins; platform: OTA updates are adopted (see R-014)
- **Review by:** on trigger
- **Status:** in force: the log entry D-089 is in open PR #108, not merged
- **As built:** `.github/workflows/testflight.yml`, `docs/release/TESTFLIGHT.md`; the version file and store workflow are in open PRs #109 and #110

### R-014 No OTA updates in v1.0
- **Source:** Project doc `infra/release-engineering-plan.md` (D-091, "Decided (founder, 13 Oct)"); open PR #108 (D-091 text); founder approval of #108 to #112 on 14 Oct (comment on #108)
- **Decided:** no `expo-updates` in v1.0. Fixes ship as PATCH builds from the release branch, with expedited review for an S0.
- **Why:** v1.0 became on-device only (PR #54) and plans "Data Not Collected" (D-088); an update check on every launch is a new network destination for the data map and a privacy-label question for counsel, three weeks before submission (D-091 text in #108).
- **Door:** two-way: adding `expo-updates` later is a release
- **Reversal cost:** low
- **Revisit when:** platform: v1.1, when sign-in brings a server anyway (from the source)
- **Review by:** on trigger
- **Status:** in force: the log entry D-091 is in open PR #108, not merged
- **As built:** `apps/mobile/package.json` has no `expo-updates`

### R-015 EAS Free, then Starter when builds exceed it
- **Source:** Project doc `infra/release-engineering-plan.md` (D-092, Decided, founder); open PR #108 (D-092 text: "Decided (founder, 13 Oct 2026; matches the cost decisions of 3 Oct)"); Project doc `infra/cost-decisions-2026-10-03.md`
- **Decided:** EAS Free (15 iOS builds a month) until builds would exceed it, then Starter ($19 a month plus usage); also move to Starter for a month if Free's low-priority queue holds up a release candidate.
- **Why:** not recorded in the sources beyond the cost posture (R-011)
- **Door:** two-way: a plan change
- **Reversal cost:** low
- **Revisit when:** cost: more than 15 iOS builds in a month; cost: queue time holds up a release candidate (both from the source)
- **Review by:** 2026-11-15
- **Status:** in force: the log entry D-092 is in open PR #108, not merged
- **As built:** `apps/mobile/eas.json`
