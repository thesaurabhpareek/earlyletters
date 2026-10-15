# Privacy and legal

Who the publisher is, age rules, consent, analytics, retention, what others may see, deletion, the privacy promise and the App Store privacy label.

### ADR-0008 Analytics and crash reporting: PostHog (allowlisted events, no replay) and Sentry (scrubbed)
- **Source:** `docs/adr/0008-analytics-and-crash-reporting.md` (Accepted, 2026-10-01)
- **Decided:** PostHog with session replay, touch and screen capture off, a typed event catalogue in `packages/analytics` whose props are enums, counts and durations only, and a random analytics id. Sentry with `sendDefaultPii: false` and scrubbing of breadcrumbs, bodies and any text-like field. Both behind `packages/analytics`; a lint rule bans importing them elsewhere.
- **Why:** funnels and retention without ever sending entry content, names or audio; crashes must be visible.
- **Alternatives:** autocapture and session replay (would capture letter text on screen); Firebase Analytics (SDK weight, less control; not researched).
- **Door:** two-way: the SDKs sit behind one package and a consent switch
- **Reversal cost:** low: swap or remove behind `packages/analytics`; data already sent stays with the vendor under its deletion terms
- **Revisit when:** scale: events per family per month push PostHog past its free tier (the ADR plans about 50 per family at 100k families); law: counsel changes the consent reading
- **Review by:** on trigger
- **Status:** in force
- **As built:** `packages/analytics/src/catalog.ts`, `packages/analytics/src/posthog.ts`, `apps/mobile/src/lib/analytics/posthog-sdk.ts`

### D-003 Full opt-in product analytics and opt-in crash reports at launch
- **Source:** `docs/DECISIONS.md` D-003 (Decided, founder, 2026-10-03; restates 2 Oct)
- **Decided:** PostHog with the typed, content-free catalogue, opt-in per Apple 5.1.1(ii), shown as the third ask; Sentry crash reports ride the same consent switch; business totals come from server aggregates; App Store Connect and Xcode Organizer crash rates are the release-gate source.
- **Why:** founder decision; the package was already built and tested (39 tests).
- **Alternatives:** no third-party SDKs at v1.0 (TDD 10 risk 15; rejected).
- **Door:** two-way: consent-gated and behind one package
- **Reversal cost:** low: a build switch
- **Revisit when:** law: counsel approves or changes `analyticsConsent.*`
- **Review by:** on trigger
- **Status:** amended by D-062. Code shipped ahead of the log: merged PR #118 turns analytics off in every v1.0 build profile under D-095, which is logged in open PR #122 as Decided (delegated by founder) but is not in `docs/DECISIONS.md`.
- **As built:** `packages/analytics/src/consent.ts`, `apps/mobile/src/components/consent/analytics-consent-sheet.tsx`. Note: PR #118 (merged) turns analytics off in every v1.0 build profile through `EXPO_PUBLIC_ANALYTICS`, under D-095, which is logged in open PR #122 as Decided (delegated by founder) but is not in `docs/DECISIONS.md`.

### D-004 Publish as an individual Apple Developer account; no LLC for now
- **Source:** `docs/DECISIONS.md` D-004 (Decided, founder, 2026-10-03); restated as D-064 (Decided, founder, 2026-10-03)
- **Decided:** the founder enrolls in the Apple Developer Program as an individual. `packages/brand` holds an individual-publisher placeholder (no real name in code). Terms, Privacy Policy, Subscription Terms and the Consumer Health Data policy name the individual as the provider. Re-evaluate before scale.
- **Why:** founder decision; removes D-U-N-S and LLC lead time from the launch path.
- **Alternatives:** LLC before submission (compliance register line 41, Terms counsel note, TDD 10 M0; deferred by the founder).
- **Door:** one-way after launch: Apple shows the individual's name as seller once an app is released; moving to an organisation later needs Apple's app transfer, which requires a released version, Sign in with Apple transfer identifiers and re-created keys, and may need a new app record (source: D-004 points 1, 4 and 5)
- **Reversal cost:** high after launch: an app transfer with user re-sign-in, or a new app record and bundle id; low before the first release
- **Revisit when:** scale: 1,000 families, or $2,000 a month in proceeds (D-004 point 3); market: the public TestFlight link or paid marketing; team: the first hire or contractor with data access; platform: Android, or an App Review rejection under guideline 5.1.1(ix)
- **Review by:** 2026-11-27
- **Status:** in force
- **As built:** `packages/brand/index.ts` (publisher placeholder); `docs/legal/terms-of-service.md`, `docs/legal/privacy-policy.md`
- **Also:** D-064, BRIEF-20261003-14. D-004's hedge (start an entity in parallel) is still listed as a founder decision due 27 Nov.

### D-006 Adults only: 18+ entry gate, no local-only mode, only a boolean stored
- **Source:** `docs/DECISIONS.md` "Earlier founder decisions carried forward" D-006 (Decided, founder, 2026-10-01/02); PRD-REQ-019, K-07
- **Decided:** 18+ entry gate before first run, invites and sign-in; No shows a stop screen for 24 hours; no local-only mode; only a boolean is stored.
- **Why:** not recorded in the source
- **Door:** one-way after launch: the age rating, privacy label and legal documents are built on an adults-only product
- **Reversal cost:** high: admitting minors would bring children's privacy law (for example COPPA for under-13 users) and new legal text
- **Revisit when:** law: counsel advice or a new age-assurance law (for example state app-store age laws) changes what the gate must do
- **Review by:** on trigger
- **Status:** in force
- **As built:** `apps/mobile/src/lib/age-gate.ts`, `apps/mobile/src/components/gate/age-gate-screen.tsx`

### D-020 Invite and return-link hashes deleted 90 days after use, revocation or expiry
- **Source:** `docs/DECISIONS.md` D-020 (Recommended, proceed: yes, 2026-10-03)
- **Decided:** invite token and code hashes, and later web return-link hashes, are deleted 90 days after `coalesce(revoked_at, accepted_at, expires_at)`. Co-parent invites expire in 7 days, Family invites in 14.
- **Why:** matches K-18, DATA-REQ-060, the data policy, the draft Privacy Policy and the migration's `purge_due`; keying on use or revocation fixes TDD 02 C16 and TDD 05 X-14. A hash is not content.
- **Alternatives:** 30 days (LEGAL-REQ-033 as first drafted).
- **Door:** one-way after launch: a retention period promised in the published Privacy Policy
- **Reversal cost:** medium: a migration plus a Privacy Policy change
- **Revisit when:** law: counsel changes the retention reading
- **Review by:** on trigger
- **Status:** in force: applies once invites exist (v1.1)
- **As built:** `supabase/migrations/20261004000000_plus_on_device_only.sql` (`purge_due`)

### D-021 Two log clocks: audit events 24 months; ops, security and escrow logs 12 months
- **Source:** `docs/DECISIONS.md` D-021 (Recommended, counsel confirms, proceed: yes, 2026-10-03)
- **Decided:** `audit_events` keep 24 months; `ops_audit_log`, `security_events` and escrow-unwrap logs keep 12 months. Both clocks are listed in Privacy Policy section 10.
- **Why:** different purposes; TDD 04 X-8 and TDD 05 X-27 agree.
- **Alternatives:** one 12-month clock (loses dispute evidence); one 24-month clock (longer than LEGAL-REQ-033 promises).
- **Door:** one-way after launch: retention periods published in the Privacy Policy
- **Reversal cost:** medium: a migration plus a Privacy Policy change
- **Revisit when:** law: counsel answers TDD 05 OQ-L9
- **Review by:** 2026-12-01
- **Status:** in force: applies to server logs (v1.1)
- **As built:** `supabase/migrations/20261002020000_data_governance.sql`, `supabase/migrations/20261004200000_ops_deletion_worker.sql`

### D-025 Lock-screen child names off by default
- **Source:** `docs/DECISIONS.md` D-025 (Recommended, proceed: yes, 2026-10-03)
- **Decided:** reminder and family notifications do not show the child's name on the lock screen unless the user turns "Show names on the lock screen" on; server-sent pushes never carry the child's name.
- **Why:** the child's name is L4 (PRD 7.10); DATA_CLASSIFICATION open issue 4 says the default must be off.
- **Alternatives:** names on by default (warmer, but shows L4 data to anyone near the phone).
- **Door:** two-way: a default the user and remote config can flip
- **Reversal cost:** low: a default change
- **Revisit when:** customer: families ask for names by default
- **Review by:** on trigger
- **Status:** in force
- **As built:** `apps/mobile/src/lib/reminders/prefs.ts`, `apps/mobile/src/app/settings/reminders.tsx`

### D-026 What the 18+ gate stores
- **Source:** `docs/DECISIONS.md` D-026 (Recommended, implementing founder decision D-006, proceed: yes, 2026-10-03)
- **Decided:** the device stores `ageGate.passed = 1` after Yes; after No only `ageGate.stoppedAt`; never an age, birth date or `ageAttestedAt`. The server records `age_attested: true` inside the terms acceptance. The instant retry is removed; the gate is a root-level boot gate.
- **Why:** PRD-REQ-019 says boolean only; DATA_CLASSIFICATION 4.6 allows the stop timestamp.
- **Door:** two-way: what is stored on the device can change in code
- **Reversal cost:** low: code, plus a privacy review if more is stored
- **Revisit when:** law: an age-assurance law requires keeping proof of age
- **Review by:** on trigger
- **Status:** in force
- **As built:** `apps/mobile/src/lib/age-gate.logic.ts`

### D-039 Contributors see the child's name, nickname and birthday month and day only
- **Source:** `docs/DECISIONS.md` D-039 (Recommended, counsel confirms, proceed: yes, 2026-10-03)
- **Decided:** contributors read the child's name, nickname and birthday month and day; never the due date or birth year. Parents see everything.
- **Why:** the due date is health data (K-25); minimisation.
- **Door:** one-way after launch: once contributors have seen data, it cannot be unseen
- **Reversal cost:** medium: an access-rule change; showing more later needs counsel
- **Revisit when:** law: counsel answers K-25 and DATA_CLASSIFICATION open issue 3
- **Review by:** on trigger
- **Status:** parked: contributors are later than v1.0 (D-055)
- **As built:** not built in the app

### D-042 Web deletion page at v1.0 is a static page plus an email route
- **Source:** `docs/DECISIONS.md` D-042 (Recommended, counsel confirms, proceed: yes, 2026-10-03)
- **Decided:** `/delete-account` at v1.0 is a static page explaining in-app deletion plus a support-email route handled by a runbook; the full magic-link web flow ships before Android.
- **Why:** LEGAL-REQ-030's source is Google Play (CR-091); Apple requires in-app deletion, which ships.
- **Door:** two-way: a web page
- **Reversal cost:** low
- **Revisit when:** platform: Android work starts (Google Play needs the web flow)
- **Review by:** on trigger
- **Status:** in force
- **As built:** `packages/brand/index.ts` (`deleteAccount` URL); `apps/mobile/src/app/settings/delete-account.tsx`

### D-050 Second consent at first family share (Washington)
- **Source:** `docs/DECISIONS.md` D-050 (Open, 2026-10-03; decides: counsel)
- **Decided:** not decided. Default if unanswered: no second consent; the sensitive-data consent text already names family sharing; the product can add one tap the first time a parent invites family.
- **Why:** not recorded in the source
- **Door:** two-way: one extra tap can be added or removed
- **Reversal cost:** low
- **Revisit when:** law: counsel answers Lawyer 2 HN-4 (PRD 9 Q10, TDD 02 OQ-B12)
- **Review by:** on trigger
- **Status:** open
- **As built:** not built

### D-061 Privacy and trust: letters never doubted as private, never sold, never used for ads, training or voice imitation
- **Source:** `docs/DECISIONS.md` D-061 (Decided, founder, 2026-10-03)
- **Decided:** letters are never sold, never used for ads, never used to train models and never used to imitate a voice; said calmly in a few set places and backed by real controls (VOICE.md "How we talk about privacy"). The `en.trust` strings are used word for word across app, listing, website and welcome email.
- **Why:** not recorded in the source beyond the founder brief (decision 11)
- **Door:** one-way: a public promise on the website, store listing and in the app; withdrawing it would break faith with every family who relied on it
- **Reversal cost:** high: legal exposure and loss of trust; letters collected under the promise stay bound by it
- **Revisit when:** none expected: a founding promise
- **Review by:** on trigger
- **Status:** in force
- **As built:** `packages/content/src/strings.en.ts` (`trust`); `packages/content/test/rules.test.ts`
- **Also:** BRIEF-20261003-11

### D-062 Analytics: opt-in PostHog plus server aggregates, feeding a self-learning loop
- **Source:** `docs/DECISIONS.md` D-062 (Decided, founder, 2026-10-03; extends D-003)
- **Decided:** opt-in PostHog plus server aggregates; agents regularly read the data, write findings and propose backlog items.
- **Why:** not recorded in the source beyond the founder brief (decision 12)
- **Door:** two-way: consent-gated and behind a build switch
- **Reversal cost:** low: code and configuration
- **Revisit when:** scale: no threshold is set for how many consenting families make the findings meaningful; the decision-science agent should propose one (no source names it); law: counsel changes the consent reading
- **Review by:** on trigger
- **Status:** in force for the log; code shipped ahead of the log: merged PR #118 keeps analytics off in every v1.0 build profile (`EXPO_PUBLIC_ANALYTICS`) under D-095, which is logged in open PR #122 as Decided (delegated by founder) but is not in `docs/DECISIONS.md`
- **As built:** `packages/analytics/src/insights/engine.ts`, `supabase/migrations/20261004300000_insights_aggregates.sql`. Note: PR #118 (merged) keeps analytics off in every v1.0 profile under D-095, which is logged in open PR #122 as Decided (delegated by founder) but is not in `docs/DECISIONS.md`; the log still says opt-in PostHog at launch.
- **Also:** BRIEF-20261003-12

### D-088 In-app feedback: v1.0 keeps "Data Not Collected"; Help email row
- **Source:** `docs/DECISIONS.md` D-088 (Decided, delegated by the founder to the CTO, 2026-10-04; debate Q-016)
- **Decided:** v1.0 submission keeps the "Data Not Collected" label and uses the Help email row with a content-free block (version, build, screen). The feedback form is built behind a build switch and ships only after counsel signs the text and the founder accepts the label change. Agents triage on structure only. Screenshots only after a preview with Remove, on settings and error screens, by email. A resettable random install id identifies the person. Retention: text 90 days after closing, screenshots 30.
- **Why:** not recorded in the source beyond debate Q-016
- **Door:** one-way after launch: the App Store privacy label is a public statement; moving to "Data Collected" needs counsel and a label change
- **Reversal cost:** medium: a label update plus counsel review
- **Revisit when:** law: counsel signs the feedback text; customer: support volume makes email triage unworkable
- **Review by:** on trigger
- **Status:** in force
- **As built:** `apps/mobile/src/app/settings/index.tsx` (Help row); `docs/legal/app-store-privacy-labels.md`

### R-004 Purged-letter retention stays at the published 60 days
- **Source:** issue #127 item 3 (founder-delegated, 14 Oct 2026); Project doc `claude/Early-Letters-Coordination.md` (item 4)
- **Decided:** purged-letter retention stays at the published 60 days. In the server release, the device keeps its own record of deleted letter ids and never uploads one again; that is a new task for the server release, not a database change.
- **Why:** 60 days is the published, counsel-facing number; keeping ids forever would need a requirement edit and new counsel review; the day-61 re-insert case can only happen once sync exists, and the device-side record closes it (#127).
- **Door:** one-way after launch: a published, counsel-facing retention number
- **Reversal cost:** medium: a migration plus Privacy Policy and counsel review
- **Revisit when:** law: counsel asks for a different period; platform: v1.1 sync design starts
- **Review by:** on trigger
- **Status:** in force
- **As built:** `supabase/migrations/20261004000000_plus_on_device_only.sql` (`purge_ledger` 60 days); the device-side record is not built
