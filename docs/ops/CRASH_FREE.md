# Measuring crash-free sessions without a crash SDK (RB-04, A21)

Status: proposal for the founder and `privacy`/`legal` review, 28 Oct 2026. Changes no code and no privacy label.
Marks: **V** = read from the cited source or file in this session. **I** = inferred. **U** = could not verify.

## 1. The number and where it is defined

- `docs/qa/ALPHA_GO_NO_GO.md` does **not** define crash-free sessions. Its only crash text is about kill-during-save drills and "no crash seen on build 2" (B2-18) (V, grep).
- The C1 exit number is defined in these places (V):
  - `docs/ROADMAP.md` line 41: "C1 exit criteria (Thu 29 Oct): ... crash-free sessions 99.8% or more".
  - `docs/qa/DEVICE_TEST_PLAN.md` TF-09: "crash-free sessions 99.8% or more" for C1 to submission, and for C0 to C1 "99.5% or more (App Store Connect and TestFlight crash data, not only consenting users)".
  - `docs/prd/PRD.md` 7.5: "Crash-free sessions 99.8% or more", and "Crash-free users (7-day) 99.5%".
  - `docs/prd/v2/06-nfr.md` section 6: source "App Store Connect and Xcode Organizer for the build (all users who share diagnostics)", gate only as G5 post-release, "read after 1,000 sessions".
- None of these defines "session" or "crash" or the arithmetic. The numerator, denominator and population are undefined in the repo (V: no definition found in the files above).
- The v2 PRD already disagrees with ROADMAP and TF-09: `docs/prd/v2/03-goals-and-principles.md` line 75 says that in C1 the gate is zero unresolved crash signatures on the candidate build, and 99.8% is the G5 post-release gate. `docs/prd/v2/reviews/R2-architect.md` AR-26 says one crash in about 500 sessions moves the rate 0.2 points, so a few families cannot read it (V). ROADMAP/TF-09 still say 99.8% at C1. That conflict is for the founder, not resolved here.

## 2. What the repo has today (all V)

- No crash SDK: `apps/mobile/app.config.ts` only mentions "a later Sentry" in a comment; `docs/legal/app-store-privacy-labels.md` row Diagnostics > Crash Data is **No**, with the reason "Apple's own crash reports reach us through App Store Connect and Xcode Organizer ... that is Apple's collection, not ours". Section 1.5 checklist: "No Sentry or other crash SDK in the build (otherwise Crash Data becomes Yes ...)". Line 209 lists as unverified whether Apple's crash reports need any declaration by us ("we believe not").
- The label is **not** "Data Not Collected". It declares Yes for User ID, Usage Data (Product Interaction), Performance Data (`app_cold_start`), Other Diagnostic Data (error codes, sync errors), Purchases (analytics), and others, all analytics ones after opt-in. Any option below is judged against that real label, not a "nothing collected" label.
- Analytics is opt-in, SDK not constructed before consent (label section 1.5 item 5; `docs/prd/v2/features/F18-analytics.md`).
- `packages/analytics/src/catalog.ts` has `app_cold_start`, `app_opened` (session = cold start or return after 30 minutes away, `packages/analytics/src/lifecycle.ts`), `error_shown {code}`, `sync_failed {reason}`. There is **no** crash, unclean-exit or session-count event (V). Nothing in `apps/mobile` or `packages` references MetricKit (V, grep).
- `docs/tdd/06` P-7 assumes about 40% of users consent to analytics (labelled an assumption A in the repo), which is why the gate source was moved to Apple (V that the repo says so; the 40% is U).
- Data classification: scrubbed crash reports are L2 (`docs/legal/DATA_CLASSIFICATION.md` line 44); content never in crash reports (`docs/legal/data-policy.md` rule 5).

## 3. What Apple provides without an SDK

| Claim | Status | Source |
|---|---|---|
| App Store Connect App Analytics defines **Crashes** as "the total number of crashes on devices running a minimum of iOS 8 ..." (a count) and **Sessions** as "used for at least two seconds; returning from the background counts as another session". | V | [App Store Connect: app metrics](https://developer.apple.com/help/app-store-connect/reference/app-metrics), [Performance metrics](https://developer.apple.com/help/app-store-connect/reference/reporting/performance-metrics/) |
| Those pages define **no crash rate and no crash-free metric**. | V (absence on the two pages fetched) | same |
| Usage totals "are based on App Store users who opt-in to share their data with you"; usage needs at least five active devices in range. | V | [App usage](https://developer.apple.com/help/app-store-connect-analytics/engagement/app-usage) |
| The Crashes row states an OS floor; the Sessions row does not. Whether crash and session counts cover the same devices is not stated. | V that it is not stated | app-metrics page above |
| Organizer shows crashes from both App Store and TestFlight builds, a year of history, filtered by version/build and TestFlight vs App Store; TestFlight testers can send crash feedback with comment, build, device model, battery, disk, network. The talk shows absolute device counts, **no crash rate**. | V (summary of the talk) | [WWDC21 10203](https://developer.apple.com/wwdc21/10203) |
| Sharing for App Store builds is opt-in per phone (Settings > Privacy > Diagnostics & Usage > Share With App Developers); TestFlight sends crash data automatically. | V, but from an Xcode 8.3 help page, so possibly dated | [Share user crash data with developers](https://help.apple.com/xcode/mac/8.3/en.lproj/deve2819c518.html) |
| TestFlight build page: Sessions (last 7 days, all testers), Crashes, Feedback counts; no crash rate; testers "automatically share" crash logs. | V | [View build status and metrics](https://www.developer.apple.com/help/app-store-connect/test-a-beta-version/view-build-status-and-metrics) |
| TestFlight crash feedback: crash report plus comments, downloadable for 120 days; tester email shown for email-invited testers (applies to crash feedback: not confirmed). | V / U as stated | [View tester feedback](https://www.developer.apple.com/help/app-store-connect/test-a-beta-version/view-tester-feedback) |
| MetricKit: daily metric payloads (at most once a day per source) and diagnostic payloads delivered immediately on iOS 15+, to the app, on device. It is an in-app API: data stays on the phone unless our code sends it. | V | [MXMetricManager](https://developer.apple.com/documentation/metrickit/mxmetricmanager.md) |
| `MXCrashDiagnostic` holds call stack tree, exception type/code, signal, termination reason, and contains no user content. | **U**. The Apple page did not render; this is from model knowledge only | [MXCrashDiagnostic](https://developer.apple.com/documentation/metrickit/mxcrashdiagnostic) |
| Developer-forum report that ASC crash numbers may include background terminations and differ from Organizer and Crashlytics. One unanswered post, not Apple. | V that it was posted; its claim is U | [forum 816758](https://developer.apple.com/forums/thread/816758) |

**No source I found confirms that Apple's data yields the same metric as the C1 definition.** Apple publishes a crash count and a session count, not a "crash-free sessions" rate. Dividing one by the other is our own calculation (I). Known gaps in that calculation (I, from the V facts above): both counts cover only users who share with developers; the crash row has an OS floor the session row lacks; Apple's session is "at least two seconds, background return counts", unlike our 30-minute `app_opened` session; a session with two crashes counts twice; ASC "crashes" may include non-crash terminations (U, forum). Apple's Organizer pages I could fetch also gave no rate (the Xcode "high-impact crashes" page failed to load: U whether Organizer shows a rate).

## 4. Options

### Option A: Apple only (ASC, Organizer, TestFlight), rate computed by hand
- Do: read Crashes and Sessions for the build in ASC App Analytics (and TestFlight build page for C0/C1), compute `1 - crashes / sessions`; state the formula and the opt-in population in the evidence file. Treat Organizer signatures as the diagnostic list.
- Code: none. Matches D-003, TF-09 and F18-REQ-026.
- Label consequence: **none**. Crash Data stays No; Apple's collection, not ours (the repo's belief, with counsel confirmation still open, label line 209).
- Weakness: the number is Apple's opt-in population, not all users; at C1 volumes (a few hundred sessions) it is a signal, not a rate (AR-26). Usage data needs 5 active devices.

### Option B: A plus our own content-free "unclean exit" counter, opt-in
- Do: on launch write a sentinel in local settings, clear it on a clean background; on next launch, if the sentinel is still set, queue one allowlisted event `prior_session_ended_uncleanly` (no stack, no text). Denominator is the existing `app_opened`.
- Code: new catalog event in `packages/analytics` (owner `analytics`) and a lifecycle hook; no SDK. Needs a test that the event has no free-text property.
- Label consequence (I): Other Diagnostic Data is already Yes (Analytics, opt-in). A counter of unclean exits probably fits it; whether Apple would call it "Crash Data" is **U** (I did not fetch Apple's data-type definitions); `legal` must decide before shipping. If it is Crash Data, the row flips to Yes and the consent copy must name it (label line 190).
- Weakness: it cannot tell crash from jetsam/force-quit/battery death, so it over-counts; consenting users only (about 40%, an assumption); it is a different metric from Apple's, so it cannot silently replace the gate.

### Option C: A plus MetricKit forwarded as counts, opt-in
- Do: a small native Expo module subscribes to `MXMetricManager`; for consenting users forward only integer counts of crash diagnostics per day. Never forward call stacks (they are not proven content-free here: U).
- Code: native module (no first-party Expo MetricKit module was checked: U), a rebuild, and review of the native fingerprint (RC-equivalence rule in 06-nfr).
- Label consequence (I): sending crash counts is plausibly "Crash Data = Yes" (linked per Q-005 default), a label change plus consent-copy change and a privacy-policy edit. Needs `legal` and the founder.
- Weakness: MetricKit's ASC-equivalent denominator is not provided; no gain over A for the C1 gate, and the most label and policy churn of the three. A Sentry-style SDK is the same label outcome plus a third-party processor, and is excluded by the brief.

## 5. Recommendation

Option A for the gate, now, with the formula and population written into the TF-09 evidence file. It needs no code and no label change. Do not claim it equals "crash-free sessions" as defined by Apple (they define none). Say in the evidence file: "computed as 1 - ASC Crashes / ASC Sessions for the build, opt-in sharers only".

For C1 specifically, follow v2 03 line 75 and AR-26: gate on zero unresolved Organizer/TestFlight crash signatures over a minimum session count, and keep 99.8% as G5. The founder should reconcile ROADMAP line 41 and TF-09 with that (founder decision, not mine).

Hold B in reserve if the founder wants a rate from all consenting users; it needs `analytics` and a `legal` ruling on the Crash Data label. Not C.

## 6. Verified versus inferred

Verified (V): the repo locations and quotes in sections 1 and 2; Apple's definitions of Crashes, Sessions, opt-in scope, the TestFlight build and feedback pages, the WWDC21 summary, the MetricKit manager delivery behaviour, and the absence of a crash rate on the Apple pages fetched.

Inferred (I): that crashes/sessions approximates crash-free sessions; the gaps listed in section 3; the label outcome of B and C; MetricKit and native-module effort.

Unverified (U): `MXCrashDiagnostic` contents; Apple's definition of "Crash Data" for labels; whether Organizer shows a crash rate; whether ASC crashes include non-crash terminations; whether the Xcode 8.3 help-page sharing rules still hold; the 40% consent figure; whether `ALPHA_GO_NO_GO.md` should carry a crash-free row (it has none today).
