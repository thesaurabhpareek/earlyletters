# F18 Analytics and the learning loop

| | |
|---|---|
| Release | v1.0 gate (the learning loop runs from the first beta cohort; its absence never blocks a release) |
| Priority and rank | P0, rank 19 (`05-feature-map.md` section 2) |
| Personas | P1, P2 (as people who choose to share or not); the founder and agents as readers |
| Existing IDs | PRD-REQ-001, PRD-REQ-016, PRD-REQ-017, PRD-REQ-018, C-REQ-034, C-NFR-005, C-NFR-009, B-NFR-001, A-NFR-002, A-NFR-012, LEGAL-REQ-003, LEGAL-REQ-012, LEGAL-REQ-014, LEGAL-REQ-015, LEGAL-REQ-016, LEGAL-REQ-017, LEGAL-REQ-029, LEGAL-REQ-031, LEGAL-REQ-033, DATA-REQ-004, DATA-REQ-033, DATA-REQ-062, K-01, D-003, ADR 0008, BL-020, BL-021, BL-023, BL-024, BL-235, BL-239, BL-250, BL-251, BL-252, BL-319 |
| Depends on | F17 (Privacy switch, account deletion hook), F02 (ask sequencer `nextAsk`, queued consent acts), F14 (on-device purchase events, ASC as purchase source), F16 (sync health counts), F19 (remote config for sampling), every feature that fires events (their section 10) |
| Status | Draft V2, 3 Oct 2026 |

> **Not legal advice.** Items marked **[Counsel]** wait on a licensed attorney.

## 1. Why

- [D] The founder decided full opt-in PostHog analytics at launch, Sentry crash reports on the same consent, and server aggregates for business totals (D-003, B10). B10 adds a learning loop: agents read the data, write findings and propose backlog items.
- [F] App Review 5.1.1(ii) requires consent before collecting usage data "even if anonymous", forbids making paid features depend on it, and requires easy withdrawal (R4 section 5, R4-S55; CR-082 in LEGAL-REQ-003).
- [F] Most category leaders declare "Data Used to Track You" on their App Store labels; Dearest and Apple Journal declare nothing linked (R1 section 0 item 9, R1 F18). A label without tracking and with usage "not linked" is visible proof of B9 (`03-goals-and-principles.md` PS4).
- [D] B2 removes every server purchase table, so server aggregates can no longer count trials, conversions or churn. App Store Connect (ASC) is the only purchase source (`03-goals-and-principles.md` section 4; F14-REQ-012).
- [F] `packages/analytics` already implements the catalogue (68 events), fail-closed validation, consent with a random id, a 1 MB in-memory queue and a 60 s flush, with 39 tests (`packages/analytics/src/*.ts`, `README.md`, read 3 Oct). It is not wired into the app (BL-250).
- [A] About 40% of users will consent (PRD 7.8 assumption). Device numbers describe consenting users only and lean towards the engaged (`docs/analytics/TRACKING_PLAN.md` 1.4).

## 2. Who

| Reader or actor | Moment | What they hold | What F18 must do |
|---|---|---|---|
| P1 Evening parent | A later session after the first letter, the consent sheet | A phone, a tired evening | One calm question, two equal buttons, nothing preselected, no effect on anything else |
| P2 Co-parent | Their own install | Their own choice | Their own consent and id; never joined to the other parent |
| Founder | Monday morning, 15 to 20 hours a week for the product (ROADMAP assumption, R-04) | No time for dashboards | One weekly findings page with numbers, sources and at most 3 proposals |
| Agents (insights role) | Weekly scheduled run | Aggregates only | Read-only inputs, a fixed output, a human gate |
| Analytics engineer | Adding an event | The catalogue and plan | One process, tests that fail on drift (TRACKING_PLAN 6.5) |

## 3. What we are solving

**Outcome:** the founder learns what helps families keep letters, every week, from content-free numbers that only consenting people send, without one feature depending on consent and without a single purchase or letter reaching our analytics.

| Metric | Target | How measured | Consent caveat |
|---|---|---|---|
| Requests to PostHog or Sentry before consent | 0 | Network capture E2E (BL-239) | None |
| Events or files queued on disk before consent | 0 | Container scan after a fresh install through first letter (BL-252) | None |
| Fixture strings ("Asha", fixture letter, dictionary words) in any analytics or crash payload | 0 | Log canary (LEGAL-REQ-014) | None |
| Feature difference by consent | 0 | QA matrix: every feature with consent declined (03 section 4.3) | None |
| Analytics consent rate among signed-in accounts | Watch only; 40% assumed (PRD 7.8) | Server aggregate of `analytics` acceptances | Signed-in only |
| Weekly findings page delivered | 1 per week from beta C1 | `docs/insights/` PR merged or closed by the founder | n/a |
| Proposals accepted into the backlog | Watch only | Count of proposals copied into `docs/BACKLOG.md` | n/a |
| Events per active consenting user per month | 150 or fewer (PRD 7.7) | PostHog monthly total / consenting MAU | Consenting only |

## 4. Scope

**In v1.0**
- Opt-in PostHog analytics and Sentry crash reports behind one consent (`analytics` document), asked as the third ask after the first letter (PRD-REQ-001), changeable in Settings > Privacy (F17).
- Nothing constructed, queued or written before consent: the PostHog and Sentry SDKs are not even initialised until the person says yes (BL-250 "lazy PostHog only after consent").
- The typed, content-free catalogue in `packages/analytics`, extended with the events sibling specs ask for (section 6.4), every property L2.
- Volume caps: per-id daily cap (new), 1 MB queue, 60 s flush, deterministic sampling from remote config, PostHog billing limit.
- Withdrawal within the session; a new id on re-grant; deletion of the analytics ids at account deletion request time through `analytics-forget` (BL-235); the device-after-deletion path.
- Server aggregates of counts with no purchase data (PRD-REQ-017 Rev B2), cells under 10 suppressed.
- ASC and Xcode Organizer as the source for installs, purchases, crash-free rate (D-003, TDD 06 P-7).
- Metric definitions for every metric in `03-goals-and-principles.md` section 4 (section 6.5).
- The learning loop: a weekly snapshot job, an insights agent run with fixed inputs and outputs, guardrails, and the founder's gate (section 6.6).

**Later**
- On-device MetricKit summaries for consenting users (TDD 06 450): v1.1 candidate.
- Pricing tests with arms (`plus_offer_viewed.arm` b and c): not at v1.0 (F14, arm always `a`).
- Web page analytics: none until the web page has a consent design (TRACKING_PLAN 8 item 5; F37 v1.1).
- Agents reading Sentry stack traces to propose fixes: v1.1, after a month of clean scrub evidence.

**Never**
- Session replay, autocapture, screen capture, touches, heatmaps, surveys (ADR 0008, LEGAL-REQ-017).
- Person properties beyond the random id; email, Supabase user id, device id, IDFA or IDFV as the id (LEGAL-REQ-016, -017).
- A server table that stores an analytics id next to a profile (app-store-privacy-labels 1.3 condition 2; TDD 05 X-02).
- Purchase data in any server aggregate or analytics event beyond the device purchase events already in the catalogue (B2, F14-REQ-014).
- Any event timed by a child's birthday or due date (TRACKING_PLAN 6.4).
- Agents changing remote config, sampling, flags, code or backlog order on their own; agents reading per-person rows.
- Using analytics to target messages at a person (no person-level actions exist).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| Dearest | Label: no tracking; only data not linked (purchases, identifiers) [F] R1-S3 | 5.0 (1) | n/a | **Match** a label with nothing linked for usage [R] |
| Apple Journal | Label: no tracking; identifiers and usage not linked [F] R1-S5 | 4.8 | n/a | **Match** [R] |
| The Days We Keep | Label: no tracking; contact and content not linked [F] R1-S35 | n/a | n/a | Neutral |
| Rosebud, FirstChapter, Notabli | No tracking; usage or identifiers linked [F] R1-S33, R1-S4, R1-S7 | n/a | n/a | **Avoid** linked usage [R] |
| Qeepsake | Declares Usage Data used to track [F] R1-S1 | 4.9 | n/a | **Avoid** [R] |
| Day One, Tinybeans, 23snaps, Calm and others | Declare "Data Used to Track You" [F] R1 section 0 item 9 | n/a | Privacy is the top reason to choose (36% of positive baby-app reviews) [S] R2 section 0 item 2 | **Avoid**; the clean label is our proof [R] |
| Calm | Published habit data from its own analytics: 40% set a reminder when asked after the first session; those users retained 3x better [F] R1-S57 | Published result | n/a | **Match** the practice of measuring ask timing (DR-12), with opt-in data only [R] |
