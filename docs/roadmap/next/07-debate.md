# Next: the council debate (phase 3, file 07)

Status: draft for the "next set of requirements" programme, 8 Nov 2026. Docs only. This file changes no decision, sets no price, merges nothing and edits no other file. It feeds `00-stack-rank.md`.

## 0. How to read this, and its limits

1. **One Claude session wrote every voice below.** No executive here is a person. Each speaks in its own lane, as `docs/agents/exec/COUNCIL.md` section 2 asks, and none is a lawyer, accountant or auditor. Where a line needs counsel, it says so and does not answer. I (the author) read the decision-rights and voice sections of the role skills and the whole of COUNCIL.md; I did not read every section of every skill (UNVERIFIED for the rest).
2. **Evidence is the phase 1 and 2 files and a few repo files I opened on 8 Nov 2026.** They are `01-customer-needs.md`, `02-benchmark.md`, `03-requirements/*`, `04-feasibility.md`, `05-compliance-risk.md`, `06-roi.md` and `docs/release/BUILD12-GAP-MAP-2026-11-08.md` (cited as "gap map"). I also opened `packages/content/src/pricing.ts`, `docs/DECISIONS.md` (D-082, D-088, D-100, D-121, D-124), `docs/legal/app-store-privacy-labels.md`, `docs/legal/DATA_CLASSIFICATION.md`, `docs/prd/v2/features/F21-store-web.md`, `packages/analytics/src/catalog.ts` and `docs/agents/exec/RULINGS.md`. Those files are drafts. I re-verified no Apple page, statute or vendor price.
3. **Not read, so possibly missing:** the Project docs (for example `infra/cto-rulings-2026-11-08*.md`, `infra/exec-rulings-2026-11-08*.md`, `claude/Karma-release-session-status-2026-11-08.md`, `product/qe-bug-hunt-2026-11-08.md`). They may hold rulings or alpha facts that change a tie-break below. For disagreement (b) I rely on the programme brief's statement that Karma recommended staging first.
4. **Karma is a party in disagreement (b).** The founder should read Karma's tie-break there as a recommendation from an interested side, not as a neutral ruling.
5. **RULED, FOUNDER, NOT A QUESTION.** RULED means Karma may decide it (CTO skill section 2: lanes, order of agent work, architecture inside existing ADRs). FOUNDER means money, accounts, hosted migrations, legal promises, scope, dates, pricing, analytics or a change to a founder decision (CTO skill section 3); the text gives a recommended default and the founder decides. NOT A QUESTION means the record already answers it.
6. **No invented numbers.** Figures come from the cited files. Anything else says ASSUMPTION.

Each disagreement has the same shape: positions (one line each, with evidence), a challenge from a stakeholder role, Karma's tie-break, and the way back.

---

## (a) What comes first: the ROI ranking, or the server, sign-in and security

**The question.** `06-roi.md` ranks recording reliability first (risk-adjusted 94.2) and reminders second. The requirements (`03-requirements/00-index.md`) rank hosted backend, sign-in, age and consent, deletion and the store pack first. The founder chose a public App Store release with build 12 on production servers (gap map section 0), which reverses D-121 item 1.

| Role | Position | Evidence |
|---|---|---|
| Chief Product Officer (Claude role) | Recording and Listen that never lose a letter come first. It is the top customer need and the top ROI item, in the top ten in 100% of the random draws. | `01` section 2 rank 1 (41 of 104 negative or mixed reviews are bugs, crashes, sync or lost work); `06` section 3 rank 1, section 4 |
| Karma | Server first. Nothing server-side can be proven without a hosted project, and the founder chose a public release. | Gap map section 0 item 2 (S-50 to S-54 FAIL; `DEPLOY.md` line 36 says `scribe-prod` "does not exist yet"); `03-requirements/01-hosted-backend.md` |
| Chief Information Security Officer (Claude role) | The key and session PRs land before any family signs in. They rank 8th on ratio but 2nd on WSJF. | `06` section 3.2 (T05 WSJF 176.2); gap map 1.2 (#602 gates the legacy-key switch, CR-47) |
| Chief Design Officer (Claude role) | The first minute is the product: date picker, consent links and the speech-file wait, readable at the largest text size. | `01` rank 2; `06` T02 ratio rank 6; `03-requirements/03` NX-03-R1 (AX5, 0 clipped lines) |
| Chief Business Officer (Claude role) and Chief Financial Officer (Claude role) | Nothing earns before a public release. 27 payers cover the fixed floor of $99.25 a month at the repo prices. The release obligations are constraints, so rank them beside features and not against them. | `06` section 5.3 and section 3.3 item 3 |
| Chief Marketing Officer (Claude role) | The public listing cannot promise seven languages or co-parent sharing, so listing and claims work sits on the path. | Gap map 1.9, 1.12 (D-121 risks) |

**Challenge.** The Chief Financial Officer (Claude role) to the Chief Product Officer (Claude role): "ratio scoring favours cheap items" is the ROI file's own warning (`06` 3.3 item 1), its cost inputs are uncalibrated (`06` 0 item 2), and the production backend ranks 24th on ratio while nothing can be sold without it. The Chief Product Officer (Claude role) back to Karma: if the server work eats the founder's hours for three weeks, recording gets no iPhone SE 3 sessions, and the Family group meets the same bugs on a server build.

**Karma's tie-break. RULED for the agent lanes; FOUNDER for the founder's own hours.**
- Two lanes, not one list. Agents work Tier 0 (server, security, accounts, deletion, store pack) and Tier 1 recording and first-run PRs at the same time. They touch different paths (`supabase/**` and `lib/auth` against `lib/capture`), and the gap map already has recording PRs in flight (#617, #618, #619, #615, rank 15). Tier 0 is a constraint lane, as `06` recommendation 4 says, and is not scored against features.
- The founder's hours go Tier 0 first (the production bring-up is about 7 hours, gap map section 3.3 citing `TESTFLIGHT.md` line 139). Recording's device sessions ride the same SE 3 sessions as the real-phone rows (gap map rank 40) so one session proves both. This ordering of his time is a recommended default marked **FOUNDER**.
- The ROI ranking stays useful for what comes after Tier 0. Its first eight are stable under my own cost error (`06` section 4).

**Way back.** The lanes are an assignment, not code. Re-rank after the alpha measures in `00-stack-rank.md` section 6. If measured founder cost per PR comes in near twice the assumed 45 minutes, the long Tier 2 rows fall further (`06` section 7 item 1).

---

## (b) Staging first, or production directly

**The question.** The founder chose production directly for build 12 and has not answered the final "staging first or production directly" confirmation. Karma recommended staging first. Both are laid out with their cost so he can answer once.

| Option | What it is | Cost | What it removes or leaves |
|---|---|---|---|
| A. Staging first (Karma's earlier recommendation) | Create `scribe-staging`, run build 12 as a `preview` build, rehearse everything, then repeat for production | A second project, a second auth setup (Apple provider on the `.preview` bundle id, Resend), EAS `preview` variables (gap map section 2, S-50 to S-53), then the production pass again. No source gives the extra hours or days. ASSUMPTION: the same steps run twice, so a few days to a week more on the Family date, and about 3 to 4 more founder hours (half of the 7 hours, because the steps are known by then). Supabase plan cost UNVERIFIED | Removes the first-run-on-production risks and leaves a standing environment for every later migration (`DEPLOY.md` lines 16 to 23: `develop` goes to staging in CI, production only from a `db-v` tag) |
| B. Production directly, plus one throwaway rehearsal (the gap map's default) | A free throwaway hosted project runs all migrations, the R-17 checklist and the synthetic smoke; then the production tag | The gap map says "costs a day" and "a few hours of work" (section 6 question 1). Plan cost of a throwaway UNVERIFIED | Removes the largest risk in gap map section 5 (27 migrations plus 3 drafts applied for the first time, hosted-only grant differences, setup traps, no restore ever run). Leaves: no standing staging for later changes |
| C. Production directly, no rehearsal (the founder's literal answer, which the gap map plans) | Apply to production once | No extra days | Leaves every risk in gap map section 5 open: forward-only migrations on live data, a pepper or policy-version slip that stops every sign-up ("We couldn't finish setting up your account"), a code-length mismatch that refuses every typed code, RLS tests never run on hosted, no restore drill (DL-03 "not run") |

| Role | Position | Evidence |
|---|---|---|
| Karma | Staging first was the earlier recommendation. The throwaway rehearsal (B) meets most of the concern; the part it does not meet is every migration after the first set. | Programme brief; gap map section 6 |
| Chief Information Security Officer (Claude role) | Not C. The R-17 gate was defined against staging and has never been run; hosted differences (default privileges reset since `20261023060000`) show up only on a hosted project. | `docs/release/1.0.0.md` line 39 as cited in gap map 1.2; gap map section 5 "RLS tests" |
| Chief Privacy Officer (Claude role) | The first hosted run should not hold real letters. Letters can hold health details, and Q44 (real families under draft texts) is unanswered, so Family only either way. | Gap map section 5 "Legal exposure"; `05` section 3 |
| Chief Financial Officer (Claude role) | The scarce resource is the founder's hours, not dollars. A costs the most hours; B costs about a day. I cannot price the Supabase plan: UNVERIFIED. | `06` sections 0 and 1 (FH unit); gap map section 6 question 3 |
| Chief Product Officer (Claude role) | Dates: Family is the only audience until Q44 is answered, so B or C does not move the public date, which waits on counsel (mid-Dec comments, about 4 Jan 2027 sign-off at the earliest). | Gap map section 3.3 |

**Challenge.** The Chief Financial Officer (Claude role) to Karma: "You recommended A and you are now a party. What does A buy that B does not?" Karma's answer: a standing environment. With production only, every migration after the first set is first run on production, and the repo's pipeline assumes staging (`DEPLOY.md`; the gap map notes a hosted smoke is documented for staging and none for production). B protects the first set only. The Chief Information Security Officer (Claude role) adds that this matters most for fenced paths (`supabase/**`), where one reviewer carries the risk (gap map section 5 "One reviewer").

**Karma's tie-break. FOUNDER (external accounts and applying migrations to hosted projects are his).** Recommended default: **B**, and stand up `scribe-staging` before the first migration that comes after the initial set. B honours his choice of production for build 12, and the one-day rehearsal answers the risks that Karma's earlier position was about. If the rehearsal fails any of the seven checks in `03-requirements/01` (NX-01-R1 to R7), fall back to A. If he wants C anyway, the mitigations are Family only, no friend signs in before Q44, and the local copy on each phone (gap map section 5 "Backups", citing `TESTFLIGHT.md` line 175). The question is asked once, by Mon 9 Nov, before the project is created.

**Way back.** All three are two-way at the environment level: a staging project can be created later at any time. The one-way part is data on the production database; the same data would exist under A after the second pass. A bad migration on live data is fixed by a new forward migration (gap map section 5), never by editing an applied file.

---

## (c) Feedback: link it to the account, or the D-088 install id

**The question.** The programme brief said feedback is linked to the account with 90-day retention. D-088 says a resettable random install id plus an optional email, text kept 90 days after closing and screenshots 30 days (`05` section 7 item 1).

| Role | Position | Evidence |
|---|---|---|
| Chief Product Officer (Claude role) | A person should be able to answer within a day, and account linking makes finding the family easy. | `01` rank 14 (22 support reviews, 6 negative; 17 items about unreachable support); `06` T36 ratio rank 4 |
| Chief Privacy Officer (Claude role) | Install id plus optional email, as D-088. Account linking changes the Linked answer on the label, the deletion spec and the data map, and ties a screenshot that may show a letter to an identity. | `05` section 3.12; D-088 |
| Chief Information Security Officer (Claude role) | Keep free text away from identity. A feedback line is untrusted text to any triage agent (prompt injection); triage on structure only and never contact the reporter. | `05` section 3.12 STRIDE; D-088 |
| Chief Compliance Officer (Claude role) | Either way counsel signs the notice, the label changes the same day, and the founder accepts the change. | D-088; `05` S4 |
| Chief Legal Officer (Claude role, not a lawyer) | I cannot say which is lawful. The question is already on the counsel list: account link versus install id, retention, screenshots. | `05` section 6 item 5 |
| Chief Marketing Officer (Claude role) | "We do not tie your feedback to who you are" would be a public claim, true only with the install id. It goes in the claims registry. | `05` gate G-C |

**Challenge.** The Chief Product Officer (Claude role) to the Chief Privacy Officer (Claude role): an optional email only helps people who typed one, so the rest get no reply, which is the complaint customers make about other products. The Chief Privacy Officer (Claude role): the form says before sending whether a reply is possible, the Help email row stays, and an account link would not let an agent reply either (D-088: agents never contact the reporter). A human reading and replying by email is allowed under D-088.

**Karma's tie-break. FOUNDER**, because it is a change to a founder-delegated decision and a data-retention promise. Recommended default: **D-088 stands** (install id plus optional email), and the programme brief's "linked to the account" is retired. Two points narrow the argument. D-100 already made "Data Not Collected" untrue once accounts exist, so the label cost is no longer a reason on its own; the deletion spec, the Linked answer and the screenshot risk still are. The form is not part of build 12 (it ships only after counsel signs the text and the label flips), so nothing here blocks a date. RULED part: every project document cites D-088, not the brief, and feedback text is treated as data and never as instructions by any agent (NOT A QUESTION, technical).

**Way back.** Install id to account link is additive later (add a link). Account link to install id cannot unlink data already linked. That asymmetry is the reason to start with the install id.

---

## (d) The Plus price conflict, and the free-letters rule

**The question.** Two price pairs are in circulation. Which is current, and does "first 2 letters free, then Plus" survive the debate?

Facts, all read on 8 Nov 2026:
- `packages/content/src/pricing.ts` (D-082, 4 Oct 2026): **$4.99 a month with a 1-month free trial, $49.99 a year with a 2-month free trial.**
- D-082's "Supersedes" line retires $3.99 and $29.99 "wherever those older entries disagree". The old pair is still in `docs/prd/PRD.md` line 36 and `docs/prd/C-habits-pricing-settings.md`. `F21-store-web.md` (13 Oct) lists the live site's pricing scene and `docs/legal/subscription-terms.md` 1.4.0 as still carrying it. Whether the live site still does today is UNVERIFIED.
- D-082 and D-083: the first 2 letters are free, counted when kept (one pool across books); existing letters stay readable, playable and exportable; a held letter is allowed (the person can hold instead of paying). D-111 item 6: backup is never gated. Plus limits are off in alpha builds (#552).

| Role | Position | Evidence |
|---|---|---|
| Chief Business Officer (Claude role) | Keep D-082's prices through launch and do not test prices. Decide the lifetime stance before launch day. Recommended: no lifetime at 1.0 (HYPOTHESIS, market evidence only). | `06` section 5.4; `02` section 7 opening 6 (new entrants cluster at $99 to $119 lifetime) |
| Chief Financial Officer (Claude role) | The old pair is the weaker business. Net per payer-month at 60% annual share, 15% commission and 3% refunds: $3.71 now against about $2.55 on the old pair, so about 27 payers cover the $99.25 floor against about 39. Arithmetic on the ROI formula (`06` 5.3); the 60% and 3% are the PRD's assumptions. | `06` section 5.3 |
| Chief Marketing Officer (Claude role) | Every price on every surface must come from `pricing.ts` or it is a claim that does not hold. Retire the old pair from briefs and pages. | `F21` rows 1 and 15; F21-REQ-015 |
| Chief Legal Officer (Claude role, not a lawyer) | Changing a price for existing subscribers is a stop-rated change until a notice plan exists. Before anyone subscribes it is cheap. The "Free, always" promise in the Terms is a separate item for counsel. | `05` section 3.11 and Q41 |
| Chief Product Officer (Claude role) | "First 2 free, then Plus" is untested with parents, and the fear it meets is real: 10 of 10 reviews about a new paywall on old features are negative. Hold-a-letter and export-always are the defence. | `01` rank 5; `02` opening 2 |

**Challenge.** The Chief Financial Officer (Claude role) to the Chief Product Officer (Claude role): the alpha cannot tell you whether the gate is fair, because limits are off (#552) and purchases are sandbox, so no money-funnel measure exists until App Store Connect shows real trials after release (`06` 5.4, M3 and M7). The Chief Product Officer (Claude role): then the comprehension study (`01` G7, 150 to 200 parents) is the only read before launch, and it costs recruiting only.

**Karma's tie-break. NOT A QUESTION for which price is current; FOUNDER only to confirm.** D-082 and `pricing.ts` answer it: $4.99 and $49.99. Every brief uses `pricing.ts` and the older pair is retired. Free-letters rule, recommended default **FOUNDER**: keep D-082 and D-083 as written, no lifetime plan at 1.0, no price test, read the App Store Connect funnel first. Before the public build ships, the alpha ceiling (#552, BL-604) must be replaced by the decided gate, and the Plus sandbox decision S-35 run on a `production`-profile build (gap map 1.8; `03-requirements/08`).

**Way back.** Before any subscriber exists, a price change is `pricing.ts`, the StoreKit file, App Store Connect and the Terms table together. After subscribers exist it needs the notice plan (`05` 3.11). A lifetime plan added later is additive; a lifetime plan removed later is not.

---

## (e) The three architecture decisions that block most work

From `04-feasibility.md` part 2: AD-1 guest and web identity, AD-2 media pipeline and keys, AD-3 update channel before the freeze.

| Role | Position | Evidence |
|---|---|---|
| Karma | AD-1: scoped write-only token minted from an invite code, with "write one letter, read nothing" as the first web release. AD-2: wrap each child key to each member's device for parents, per-play unwrap only for web reads with a hard limit. AD-3: server-driven only now (option c). Write AD-1 and AD-2 as ADRs now. | `04` AD-1, AD-2, AD-3 and section 2.1 |
| Chief Information Security Officer (Claude role) | AD-1: a guest should not become an account with its own data rights, but a bearer token needs revocation and abuse limits. AD-3: whether Expo update signing meets SEC-R10 is NOT VERIFIED, so no update channel should ship on an assumption. | `04` AD-1, AD-3; `05` risk 2 |
| Chief Privacy Officer (Claude role) | AD-1: every guest account is an account for deletion and data rights; a token with no account is less to delete. AD-2: per-play unwrap puts the escrow function on the hot path and changes the "under 1 unwrap an hour" assumption. | `04` AD-1, AD-2; `05` gate G-E |
| Chief AI Officer (Claude role) | Whatever the update channel is, it must not be able to change the edit verifier, the models or what a model sees. The constitution says no bypass of `verifyEdits`. Server-driven content and flags cannot change collection or the paywall (BRIEF decision 16). | `CLAUDE.md`; `04` AD-3 (c) |
| Chief Legal Officer (Claude role, not a lawyer) | A dormant `expo-updates` module has to be described to App Review and may touch Apple's hot-code rule. I have not read that rule this session: UNVERIFIED. | `04` AD-3; gap map 3.1 (2.5.19 read, 2.5.2 not) |
| Chief Product Officer (Claude role) | Neither AD-1 nor AD-2 is needed for the first public release: no web writing, no shared voice, no photos. Do not spend founder reading hours on them before Tier 0 is done. | `03-requirements/00-index.md` waves |

**Challenge.** The Chief Information Security Officer (Claude role) to Karma on AD-3: without an update channel, every fix to a public build waits for App Review (turnaround UNVERIFIED), and a public build cannot be expired like a TestFlight build (gap map section 5 "Kill switch"). Karma's answer: that is a real cost of option c. Against it, an update channel adds a supply-chain path and a dormant-code paragraph in the Notes for Review, and installs that lack it stay without it. The Chief Design Officer (Claude role) adds that a fix that cannot ship quickly is a design cost too, since a broken first minute stays broken for days.

**Karma's tie-break.**
- **RULED:** write AD-1 and AD-2 as ADRs now (docs, reversible, lane W0 in `04` section 4). Build nothing for them before the public release. Everything that depends on them stays in Tier 2.
- **FOUNDER (AD-3):** recommended default is option c (server-driven only) for build 12, with the disabled `expo-updates` option decided by `security-architect` and the founder before the first build that goes to App Review. Deadline note: the feasibility file called AD-3 "the only one with a deadline this week". That was written against the on-device build of 9 Nov. With the founder's route, build 12 goes to the internal group and the build that goes to App Review is later, so I read the deadline as the release-candidate freeze. That is my inference; confirm it. Native changes are cheaper batched: the backup client (`scribe-keys` is excluded from autolinking, `04` R7 and AD-8), a disabled `expo-updates`, the age-range API (`05` S3 says it needs the iOS 26 SDK family; my inference that it needs a native rebuild) and `expo-store-review` all want one planned native build, not four.

**Way back.** AD-1: tokens are additive and revocable per book; unwinding is a flag, not a migration. AD-2: wraps are additive rows; dropping them returns to v1.0 behaviour. AD-3: remove the dependency in the next native build; installs that took an update keep it until replaced.

---

## (f) Analytics off for the whole 1.0 line, against the measurements the ROI needs

**The question.** D-124 item 3 keeps in-app analytics off for the whole 1.0 line (`EXPO_PUBLIC_ANALYTICS` is `off` in every profile of `apps/mobile/eas.json`). `06` section 6 lists measurements M1 to M10 and says the allowlisted events "measure nobody" until it is on.

| Role | Position | Evidence |
|---|---|---|
| Chief Product Officer (Claude role) | I cannot see where first-run people stop, or which reminders get muted, without device events. | `06` M1, M5 |
| Chief Financial Officer (Claude role) | The money questions (trial start, trial to paid, annual share, refunds, commission tier) come from App Store Connect, which needs no consent and counts every user. The most valuable measurement, founder cost per PR and per device session, is available today. | `06` M7, M9, section 8 recommendation 1 |
| Chief Privacy Officer (Claude role) | Opt-in, content-free, allowlisted only; no child name, free text or per-family tracking. It also needs the consent sheet and a label that matches. | `06` section 6 rules; `CLAUDE.md` privacy rules |
| Chief Compliance Officer (Claude role) | Turning it on changes the label and the consent copy and needs counsel Q54 first. Apple lets us change label answers without an app update. | `06` section 6; `05` S4 |
| Chief Information Security Officer (Claude role) | D-095 says no analytics SDK in v1.0; a profile flag baked into the build means "on" is a new build with a new SDK in it. | D-095; `apps/mobile/eas.json`; D-124 |
| Chief AI Officer (Claude role) | Speech and edit quality is judged on recordings in the `experiments/` gate and the kill harness, not on product analytics. | `04` R13 (FB-02 harness) |
| Chief Marketing Officer (Claude role) | Any public line about tracking must match the build state; with analytics off the line is simple and true. | `05` gate G-C |

**Challenge.** The Chief Product Officer (Claude role) to the Chief Financial Officer (Claude role): consented device events are biased toward engaged families, but that is still better than nothing for first-run drop-off. The Chief Financial Officer (Claude role): the ROI file's own sensitivity result is that the weights on activation, retention, conversion and referral do not change what to do next (`06` section 4, "Not a flip"); the first eight items are trust and reliability under any weighting, so a missing measurement does not change the next build. The Chief Data Officer's lane (not in this debate) would add that device events cannot see letters kept only on the phone.

**Karma's tie-break. FOUNDER (analytics on or off is on the founder-only list).** Recommended default: **analytics stays off for build 12 and the first public submission** (D-124 stands). Measure instead from: App Store Connect and TestFlight crash reports; server aggregates for signed-in families once servers are on (`06` M4, M8); the founder cost log (M9, start now); the first-run study with 5 to 8 strangers (`01` G1); three questions in tester notes for reminders (M5). Revisit in a 1.0.x release after counsel answers Q54, because an "on" build needs the SDK, the consent sheet, the label change and a dormant-feature line for review. Two events the catalog lacks (a playback failure code and a bounded first-run summary) are requests to the analytics owner, not additions here (`06` section 6).

**Way back.** Additive. The SDK, consent sheet and label change can ship in a later build. The decision to turn it on is the founder's, and the label can be corrected without an app update.

---

## (g) The photos label conflict

**The question.** `docs/legal/app-store-privacy-labels.md` line 54 says Photos or Videos: No, "No photo feature in v1.0". `docs/legal/DATA_CLASSIFICATION.md` lines 589 and 590 list a live private `entry-photos` bucket and a v1.0 `child-photos` bucket, and the purge worker covers both (`supabase/migrations/20261004200000_ops_deletion_worker.sql` line 422, `20261016000000_sync_v1_server.sql` line 1750). `05` section 7 item 2 raised it and did not inspect the client.

My check on 8 Nov: a search of `apps/mobile/src` and `apps/mobile/package.json` for `photo_path`, `entry-photos`, `child-photos`, `avatars`, `image-picker`, `expo-camera` and `ImagePicker` found no match. So I found no client path to the buckets. A server bucket with an author insert policy is still reachable by any signed-in client that calls the API directly. Whether that counts as "collected" is a label question, not mine.

| Role | Position | Evidence |
|---|---|---|
| Chief Privacy Officer (Claude role) | The label describes what the app collects. If no build can upload a photo, "No" is true of the product; but a live insert policy is a door, and a door nobody uses should be closed or listed. | Label line 54; `DATA_CLASSIFICATION.md` 589 to 590 |
| Chief Compliance Officer (Claude role) | The label, the manifest and the policy must match the build (gate G-D). I have evidence for the client side only; I do not yet have evidence for the server policy. | `05` gate G-D, section 7 item 2 |
| Chief Information Security Officer (Claude role) | An unused upload path on a public production project is surface for nothing. Close it for build 12 if nothing uses it. | `05` risk 10 (abuse content arriving with no report route) |
| Chief Legal Officer (Claude role, not a lawyer) | The label is a representation to Apple. Counsel Q54 owns the answer; photos of a baby are personal information in the FTC's reading, and 18 U.S.C. 2258A is a reporting duty I have not read. | `05` S5, section 3.8 |
| Chief Marketing Officer (Claude role) | No "photos" promise anywhere in the listing or site until the feature ships; the claims registry holds the line. | `05` gate G-C |

**Challenge.** The Chief Information Security Officer (Claude role) to the Chief Privacy Officer (Claude role): "No" is only as true as the weakest policy on the project. The Chief Privacy Officer (Claude role): then the evidence is a test, not an opinion: a test that fails if any client code references the two buckets, and a policy check on the hosted project.

**Karma's tie-break.**
- **RULED (technical, reversible):** add the test described above to the pre-submission checks; confirm on the throwaway rehearsal project which roles can insert into `entry-photos` and `child-photos`; if no build 12 feature needs them, propose a new migration (never an edit) that closes insert for build 12. Migrations to hosted projects remain the founder's step. Reopen the policy when photos ship (Tier 3, `06` T21, `05` "go slow").
- **FOUNDER with counsel (Q54):** the label answer itself. Recommended default: keep "No" only after the test and policy check pass; otherwise disclose. Enter nothing in App Store Connect until then.

**Way back.** App Privacy answers can be changed without an app update (`05` S4). A closed bucket policy reopens by a new migration.

---

## (h) Other disagreements that surfaced

| Topic | Positions in one line | Tie-break | Way back |
|---|---|---|---|
| Ratio against total value for family features | `06` ranks shared voice, relatives' hello and contributors 26th to 31st on ratio but they carry the highest absolute business value and referral scores (`06` 3.3 item 2). The Chief Business Officer (Claude role) wants them as real bets; the Chief Compliance Officer (Claude role) rates them go slow (`05` section 5). | **RULED:** sequence by dependency, not ratio: they follow Tier 0, the two-phone proof (item 11 in the stack rank), the threat models and the counsel answers. | Re-rank when G4 to G6 study results land (`06` section 7 item 3). |
| Google sign-in in build 12 | The Chief Product Officer (Claude role) notes the PRD calls Google P0 (gap map 1.1). The Chief Information Security Officer (Claude role) and Karma want it out: no client IDs ship, and Apple sign-in plus email keeps guideline 4.8 simple. | **FOUNDER**, default: out of build 12, code length 6. | Additive later; needs a Google Cloud project (about 1 hour, gap map rank 36). |
| Co-parent sharing in the first public release | The Chief Design Officer (Claude role) and the Chief Product Officer (Claude role) note the free family promise is "half true" without shared voice (`01` rank 8). The Chief Compliance Officer (Claude role) and Karma want the Family tab hidden so review covers one parent (D-126; Q53 two-parent cap). | **FOUNDER**, default: hidden at first public release, on in 1.0.1 behind the existing switch (gap map section 6 question 5). | Switch on later; hiding is the reversible side. |
| Who may sign in to build 12 | The Chief Privacy Officer (Claude role): Family only until Q44 is answered and 0.9.0 is live at a permanent URL. The Chief Product Officer (Claude role): friends widen the evidence. | **FOUNDER**, default: Family, then Friends after Q44 and R-17 sign-off, then public after counsel sign-off (gap map section 6 question 2). | A group can be widened any time; it cannot be un-widened once data exists. |
| Print and Android | The Chief Business Officer (Claude role) sees demand signals (Mother's Day 9 May 2027, mixed-platform couples); the Chief Compliance Officer (Claude role) rates both stop (entity, vendor, Play billing). | **RULED:** parked. A print-ready file (on-device, allowed now) is the only slice; promote it only if keepsake demand shows by early 2027 (ASSUMPTION on the trigger). | Go/no-go on print is June 2027 per the re-baseline; entity decision D-125. |

---

## What would reopen this debate

1. The founder's answer to the staging question (b) and to the Project docs I did not read (limit 3 above).
2. Counsel's answers on Q44, Q46, Q54 and Q57 (`05` section 6; `06` section 7 item 2).
3. The first measured founder cost per PR and per device session (`06` M9).
4. Apple's response on the Small Business Program, and any rejection under 5.1.1(ix) (`06` section 7 item 5).
5. Results of the first-run study and the relatives, couples and mixed-platform studies (`01` section 4, G1 and G4 to G6).
