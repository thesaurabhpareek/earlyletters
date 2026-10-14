# 08. Delivery: the plan to submission, 20 work streams, waves and the first dispatch

Status: Draft V2.1, 13 Oct 2026. Re-planned after critique round 1 (`reviews/R1` to `R6`) and the founder's answers M15 to M17 (`_AUTHORING.md` section 3b): keep the full v1.0 scope and move the date (M15), recoverable backup with plain copy (M16), and the new free-letter count (M17). Every finding this file handled or rejected is in `reviews/DISPOSITION-A.md`. Owner: delivery lead (the architect partner to the PM). The founder merges every pull request except the delegated classes in section 6.2, if the founder approves them.

**This file is the only place in PRD V2 that carries calendar dates.** Section 2.1 holds every date in one table, each with an id `T01` to `T40`. Other V2 files name the id and point here. `07-quality-bar.md` governs the gates; where 07 sections 4 and 5.2 still show an older calendar, section 2.1 governs the dates and the 07 owner updates them. `docs/ROADMAP.md` 2.1 sections 2 and 3 are superseded for v1.0.

Labels follow `_AUTHORING.md` section 6: **[F]** fact with a source, **[A]** assumption with how we check it, **[E]** estimate, **[D]** founder decision, **[R]** recommendation.

## 0. How to read this file

- **Founder:** section 2 (dates, the submission week and what it depends on, your hours by week), section 6.1 and 6.2 (the merge budget and the two answers it needs from you), section 10 (devices and what only you, Apple or counsel can do).
- **Architect:** sections 3 to 8: streams and files, waves, the budget and the v1.0 list, the fence, and which decisions need an ADR.
- **Agent:** your stream in section 3.3, your brief in section 9. Stay inside your files. Anything outside goes in the PR body as a request (section 4).

## 1. Where we are on 13 Oct 2026

Checked against `origin/develop` at ed16ca3 (13 Oct, after PRs #86, #91, #100, #103 and #104 merged that day) and the GitHub API.

| Area | State on 13 Oct | Source |
|---|---|---|
| Founder setup (FT-01 to FT-20) | No FT box is ticked in `docs/FOUNDER_TASKS.md`. `TRUSTED_SIGNING_KEYS` in `packages/api/src/keys.ts` is empty (FT-16); `apps/mobile/app.config.ts` has no `extra.eas.projectId` (FT-17); `.github/migrations-applied.txt` lists 2 of the 12 migration files. Whether Apple enrolment (FT-01) is Active is not recorded anywhere this session can read | [F] files named |
| First build on a real iPhone | None made (`docs/release/TESTFLIGHT.md`, merged 13 Oct in #100) | [F] |
| Server switch | All four `apps/mobile/eas.json` profiles set `EXPO_PUBLIC_SERVER_FEATURES=off`; `apps/mobile/src/lib/capabilities.ts` still describes v1.0 as on-device | [F] |
| Security gate (R-17) | The BACKLOG gate row names six items: BL-330, BL-347, BL-322, BL-331, BL-332, BL-349. BL-330, BL-347, BL-322 and BL-349 are `ready`, not built; BL-331 and BL-332 are `in-progress` (review M1, M5 and L1 open) | [F] `docs/BACKLOG.md` on develop, line 62 and the task entries |
| Recording backup (D-073) | Not built. WP-F08-B1 to B6 all "Not built". The key model in F08 fails with two parents (R2 AR-05); an ADR amendment is owed | [F] F08 section 12; R2 |
| Status report and reminder emails (D-080) | BL-357 and BL-358 `ready`, BL-359 `blocked` | [F] BACKLOG M8 |
| On-device plan reminders | BL-342 `ready` | [F] BACKLOG |
| Free-letter ledger | Counts every letter on the phone, including the other parent's synced letters (R2 AR-04). M17 changes the rule; not built | [F] `apps/mobile/src/lib/db/repos/ledger.ts`; R2 |
| Journey review backlog | M-JR: 65 tasks (5 blocker, 45 major, 15 minor) | [F] BACKLOG M-JR |
| Open pull requests | 34, the oldest #2 (`develop` to `main`, 3 Oct) | [F] GitHub API, 13 Oct (R5) |
| Decisions not yet logged | M14 (proposed as D-089), M15, M16 and M17 have no `docs/DECISIONS.md` entry; develop ends at D-088. D-085 amends D-073 to "no backup in v1.0", D-087 hides "I was invited", D-088 keeps the "Data Not Collected" label: M14 reverses the first two and makes the third untrue once accounts exist | [F] `docs/DECISIONS.md` on develop, read 13 Oct |

**What this means.** Code is ahead and much of the server half is written, but none of it has run on a phone or against a configured project. The old plan asked for about 250 work packages against about 100 merge slots (R1 PL-01, R5 EQ-24). M15 keeps backup, co-parent, sign-in and sync in v1.0, so the date moves instead of the scope. Section 6.3 is a v1.0 list that fits the slots; the date in section 2.2 comes from that list.

## 2. The plan

### 2.1 Every date in one table

Owners are roles from section 3.2 or people (founder, counsel, Apple, the device operator in section 10.1). "Needs" names the T ids that must be done first.

| ID | Date | Milestone | Owner | Needs |
|---|---|---|---|---|
| T01 | Tue 13 Oct 2026 | This re-plan; critique dispositions in `reviews/DISPOSITION-A.md` | PM lane, delivery lead | none |
| T02 | Wed 14 Oct | Founder answers Q1 (Apple status), Q2 (review hours), Q2b (delegated merge classes, section 6.2), Q3 (agents push their own branches), Q4 (data-map rows by request) | Founder | T01 |
| T03 | Wed 14 Oct | Wave 0 ends; first dispatch of 13 streams (sections 5.2, 9) | Coordinator | T02 |
| T04 | Fri 16 Oct | Apple enrolment Active (FT-01); `eas init` and a development build on the SE 3 (FT-17); two signing keys made (FT-16, R2 AR-28) | Founder, Apple | T02 |
| T05 | Fri 16 Oct | COUNSEL_PACKET 1.1.0 with the M14 and M16 delta sent to counsel (FT-18; R4 PT-05) | S17, founder | T03 |
| T06 | Fri 16 Oct | Website hotfix live on `main`: prices from `packages/content/src/pricing.ts`, Plus contents per F14 section 1, sample child Asha (R4 PT-04) | S20, founder | none |
| T07 | Fri 16 Oct | Founder answers F08 Q2 (backup free or Plus), DR-13 (link plus code), DR-14 (pack host) | Founder | none |
| T08 | Fri 16 Oct | Study 2 fielded: Keep gate fairness plus faithful against polished (02 section 7) | PM lane, founder | budget approved |
| T09 | Mon 19 Oct | Last day for T04 before every device date moves day for day | Founder | none |
| T10 | Wed 21 Oct | C0: internal TestFlight with the switch off (FT-25) | Founder, Apple | T04 |
| T11 | Fri 23 Oct | Device spikes round 1 (FT-22): speech per language on the SE 3, StoreKit D-1 to D-12, three sign-ins, deletion, size; WP-F08-B1 backup spike verdict | Founder, S05, S08 | T04 |
| T12 | Fri 23 Oct | Device operator named (Q9); second SE 3 for iOS 17 ordered (section 10.1) | Founder | none |
| T13 | Fri 23 Oct | Five ADR drafts opened: sync protocol v1, owner backup v1.0 (per-author key, recovery-key access log), subscription status report, account deletion across systems, capabilities and kill switches (section 8.1) | S03, S05, S06, S07 | T03 |
| T14 | Mon 26 Oct | Second dispatch: the other 7 streams (section 5.2) | Coordinator | T03 |
| T15 | Fri 30 Oct | ADRs decided, or the spec default stands; DR-11 publisher decided with counsel (R4 PT-30); Study 2 read-out; DR-09 listening copy confirmed from S1-19 | Founder | T08, T11, T13 |
| T16 | Fri 6 Nov | R-17 gate passes: the six items merged; `npm run test:db` green against staging; every migration on staging through the `develop` staging workflow (R2 AR-21) | S01, S02, S04, S20, founder | T03 |
| T17 | Fri 6 Nov | Counsel comments on the M14 and M16 delta (FT-33), including DR-10, AB 1043 and F14 Q-C1 to Q-C11 | Counsel | T05 |
| T18 | Fri 6 Nov | Per-language go or no-go (DR-01, FT-34) | Founder, native reviewers | T11 |
| T19 | Mon 9 Nov | Switch-on internal TestFlight to the founding family; G3 items for C1 that week: kill during save on the SE 3 (DL-01), deletion in staging, kill-switch drill, server restore drill BL-247 | Founder, device operator, S19 | T16 |
| T20 | Wed 11 Nov | Production on Supabase Pro (FT-23); legal pages live as versions marked draft (FT-31; R4 PT-31); AASA served on Apple's CDN | Founder, S20 | T16, T17 |
| T21 | Thu 12 Nov | Beta App Review submitted: switch on for sign-in, sync, co-parent and plan reminders; `capabilities.backup` off | Founder | T19, T20 |
| T22 | Mon 16 Nov | C1 starts (FT-32); Study 1 diary runs inside C1 for its first two weeks | Founder, PM lane | T21 |
| T23 | Fri 20 Nov | Backup client merged with `capabilities.backup` off: B2 keys, B3 bucket and tables, B4 recovery function, B5a upload queue, B5c restore | S05, S02, S07 | T15 |
| T24 | Mon 30 Nov | Study 3 paired co-parent sessions start (to T28); scoped external security test on staging starts if the founder approves it at T15 [R] (R4 PT-21) | PM lane, founder | T22 |
| T25 | Tue 1 to Thu 3 Dec | WP-F08-B6 restore drill, round 1, on two iPhones | Founder, device operator, S05 | T23 |
| T26 | Fri 4 Dec | Study 1 read-out (feeds DR-12, the Tonight speak or type default, the `stillHere` threshold) | PM lane | T22 |
| T27 | Mon 7 Dec | Backup on for C1 families who opt in (build with `capabilities.backup` on); the age-signal work (WP-F01-07, proposed in R4 PT-11) is in this and every later build | Founder, S20, S12 | T25 |
| T28 | Fri 11 Dec | Last feature merge | Coordinator | section 6.3 list |
| T29 | Mon 14 Dec | Feature freeze: fixes only | Coordinator | T28 |
| T30 | Fri 18 Dec | Counsel sign-off; 1.0.0 policy versions published; privacy label final (FT-41) | Counsel, founder | T17 |
| T31 | Mon 21 Dec | 14-day reminder delivery lab run starts on the second SE 3 (ends with T33) | Device operator | T29 |
| T32 | Fri 1 Jan 2027 | California AB 1043 in force | n/a | T27 |
| T33 | Mon 4 to Wed 6 Jan | Release-candidate device run (FT-39): full suite on the SE 3 with iOS 17, smoke on the current iPhone; B6 round 2 on the candidate build | Device operator, founder | T29 |
| T34 | Thu 7 Jan | C1 exit review (FT-40); DR-12 cohort read; DR-15 decided for v1.1 planning | Founder | T22 |
| T35 | Fri 8 Jan | Tag `ios-v1.0.0`; listing, privacy answers, age rating 18+, review notes with a demo account (FT-43, FT-44; R4 PT-35) | Founder, S16, S20 | T30, T33, T34 |
| T36 | Mon 11 to Wed 13 Jan | **Submit to App Review** (FT-45); answer App Review within a day | Founder | T35 |
| T37 | Mon 25 Jan | Planned release on approval; buffer for one rejection to Fri 29 Jan | Founder | T36 |
| T38 | Each Friday from Fri 16 Oct | Delivery review: merges this week against section 6.1, confidence in 2.2 re-read, next week's slots by stream | Delivery lead, founder | none |
| T39 | Mon 22 Mar 2027 (week 8 after a 25 Jan release) | Membership review: the pre-committed allowance rule in F14 section 6.9 | Founder | ASC data |
| T40 | When the 200th annual trial ends | Price review per F14 section 6.9 (R3 section 7 item 3) | Founder | ASC data |
| W0 | Tue 13 to Fri 16 Oct | Week 0: set up, first dispatch | | |
| W1 | Mon 19 to Fri 23 Oct | Week 1 | | |
| W2 | Mon 26 to Fri 30 Oct | Week 2 | | |
| W3 | Mon 2 to Fri 6 Nov | Week 3 | | |
| W4 | Mon 9 to Fri 13 Nov | Week 4 | | |
| W5 | Mon 16 to Fri 20 Nov | Week 5 | | |
| W6 | Mon 23 to Fri 27 Nov | Week 6: US Thanksgiving on Thu 26 Nov, reduced merge sessions | | |
| W7 | Mon 30 Nov to Fri 4 Dec | Week 7 | | |
| W8 | Mon 7 to Fri 11 Dec | Week 8: last feature week | | |
| W9 | Mon 14 to Fri 18 Dec | Week 9: freeze | | |
| W10 | Mon 21 to Fri 25 Dec | Week 10: holiday, about 4 fix merges [A] | | |
| W11 | Mon 28 Dec to Fri 1 Jan | Week 11: holiday, about 4 fix merges [A] | | |
| W12 | Mon 4 to Fri 8 Jan | Week 12: release candidate | | |
| W13 | Mon 11 to Fri 15 Jan | Week 13: submission | | |

Sections 2.6, 6.1 and 10.2 use the W ids; every other section uses T ids.

### 2.2 The submission week

**Submit in the week of Mon 11 Jan 2027 (T36). Release on approval, planned for T37.**

Confidence: **about 50% [A]** for T36; **about 80% [A]** for a submission by the end of the T37 buffer. These are judgement numbers. Nothing has run on a phone, the founder's real review hours are unknown (Q2), and the backup estimate has no device evidence behind it. The delivery review re-reads them every Friday (T38).

What the date rests on, and what a slip costs:

| # | Dependency | Due | If it slips |
|---|---|---|---|
| 1 | **Merge budget.** About 16 merges a week in normal weeks, which needs the founder's 6 review hours plus the delegated classes in section 6.2 (Q2, Q2b) | Every T38; first hard read at T16 | Each 16 slots short moves submission about one week. Without Q2b (founder-only merges, about 12 a week) the slots in section 6.3 run out about four weeks later, and submission moves about four weeks (section 6.1) |
| 2 | **Apple and a real iPhone** (T04), then device spikes and the backup spike verdict (T11) | T04, T11 | Past T09, day for day on the backup chain (section 2.4) |
| 3 | **R-17 gate** (T16) | T16 | C1 moves day for day. C1 runs from T22 to T34, more than twice D-045's 21 days, so C1 can start up to about 4 weeks late without moving submission, unless backup then gets under 3 weeks of C1 use |
| 4 | **Counsel**: comments (T17), sign-off (T30) | T17, T30 | Comments late: legal pages and C1 move together (no outside family signs in before counsel has commented, R4 PT-31). Sign-off later than T35 moves submission day for day |
| 5 | **Backup chain**: B1 verdict (T11), ADR (T15), client merged (T23), drill round 1 (T25), on in C1 (T27) | as listed | The longest chain. A failed B1 means fix and re-spike (section 2.5); M15 keeps backup in v1.0, so the date moves |
| 6 | **Device operator** named and the second SE 3 ordered (T12) | T12 | Without an operator the founder carries about 76 more device hours (section 10.2); the G3 items (T19) and the candidate run (T33) slip by the hours missing |

### 2.3 Why this week

- **Budget arithmetic.** Section 6.3 lists 128 merges to the last feature merge (T28): 115 named and 13 reserve. At 16 a week in normal weeks, 10 in W6 and 6 in W0, the slots run out in W8. The four weeks after the freeze give about 30 fix slots, which C1 and the candidate run will need [A] (the old plan gave 30 in two weeks).
- **The holidays are not build weeks.** About 4 merges a week in W10 and W11 [A], and App Review slows in the last two weeks of December [U] (`docs/backlog/FUTURE.md`). Submitting after New Year keeps both off the critical path.
- **Backup gets real use.** Backup reaches C1 families at T27 and runs about 4 weeks before the candidate (R2 AR-19).
- **C1 is long enough.** T22 to T34 is 52 days, against D-045's 21 (R5 EQ-16).
- **Two counsel rounds fit.** Comments about 3 weeks after the packet [A], sign-off about 6 weeks after comments [A].
- **AB 1043 is in force before launch** (T32), so its work is v1.0 (R4 PT-11).

### 2.4 The critical path

```
T02-T03  founder answers; wave 0; first dispatch (13 streams)
T04      Apple Active, first build on the SE 3          T05  counsel gets 1.1.0
T11      device spikes; WP-F08-B1 verdict
T13-T15  five ADRs drafted, then decided                T14  second dispatch (7 streams)
T16      R-17 gate passes; staging has every migration
T17      counsel comments                               T18  language go or no-go
T19      switch-on internal build; G3 items for C1
T20-T21  production, legal pages (draft), Beta App Review
T22      C1 starts (Study 1 inside)
T23      backup client merged, flag off
T24      Study 3; security test [R]
T25      restore drill round 1
T27      backup on for C1 families; age-signal work in every build
T28-T29  last feature merge; freeze
T30      counsel sign-off, 1.0.0 policies
T33      release-candidate device run; drill round 2
T34-T35  C1 exit; tag
T36      submit
```

Two chains meet at the release candidate. The **backup chain** (T04, T11, T15, T23, T25, T27, T33) is the longest. Between T23 and T25 it has about one working week of slack, which W6 (Thanksgiving) already uses in part. The **trust chain** (T16, T17, T20, T21, T22, T30) has about two weeks of slack. Agents shorten the code links. They cannot shorten Apple, counsel, C1 days or a two-phone drill.

### 2.5 If a dependency fails

Each option is the founder's call. M15 sets the default: the date moves; only the P1 extras in section 6.4 are cut.

| Red signal | By | Options |
|---|---|---|
| T04 not done | T09 | Slip day for day. There is no substitute for a phone |
| WP-F08-B1 fails (Keychain item does not sync between phones, or encryption is too slow on the SE 3) | T11 | A. Fix and re-spike; slip a week. B. Ship backup with the server recovery key only (no iCloud Keychain path), which M16 already allows; the ADR records it. Both keep backup in v1.0 (M15) |
| R-17 gate not passed | T16 | A. Run the switch-off build in C1 until it passes, then switch on (C1 has slack). B. Slip C1 and, past about 4 weeks, submission |
| Counsel silent | T17 | Slip the legal pages and C1. No outside family signs in on policies counsel has not commented on (R4 PT-31) |
| StoreKit sandbox not green | T11, re-checked at T19 | Fix and re-test; slip if needed. The old cut "ship v1.0 free, add Plus in 1.0.1" is removed: it is the take-back that 03 principle 6 forbids (R1 PL-22) |
| Merges under 14 a week at two T38 reviews running | T38 | A. Cut P1 extras in section 6.4 order. B. Move the freeze a week per 16 slots short. C. The founder adds review hours |

The never-cut list in `05-feature-map.md` section 5 holds, with one line from M14: no outside tester and no reviewer signs in before the R-17 gate passes (09 R-17).

### 2.6 Founder hours by week

Hours are [A]. ROADMAP 2.1 assumes 15 to 20 founder hours a week. Merges assume 6 hours (three 2-hour sessions) in normal weeks. Device work moves to the device operator from W2 (section 10.2); without one, add those hours here.

| Week | Founder tasks (FT ids from `docs/FOUNDER_TASKS.md`) | Hours [A] |
|---|---|---|
| W0 | T02 answers; T07 answers; FT-01 status; triage of the 34 open PRs with the coordinator's list (2 h); FT-20 branch protection and the `approve-migration` label; FT-03, FT-18 counsel packet 1.1.0 (T05); FT-16 two keys and FT-17 first build (T04); FT-10, FT-11, FT-12 staging and Auth; website hotfix merge (T06); Study 2 budget (T08); merges | about 17 |
| W1 | FT-22 device spikes with S08 and S05 (T11); FT-13, FT-14 Resend and DNS; FT-15 Google; FT-25 C0 (T10); FT-26 recruit C1 (at least 15 families: 4 co-parent pairs, 4 Hindi and 2 Arabic speakers [R], R3 DX-26); hire the device operator (T12); merges | about 19 |
| W2 | Decide the five ADRs (T15); DR-11 with counsel; Study 2 read-out; FT-24 PostHog; FT-27 native reviewers; FT-28 to FT-30; label on the R-17 batch; merges | about 16 |
| W3 | Counsel comments (T17); DR-01 with reviewers (T18); staging checks for T16; merges | about 12 |
| W4 | G3 items (T19): BL-247 restore drill (3 h), deletion in staging, kill-switch drill; FT-23 production and FT-31 pages (T20); Beta App Review (T21); merges | about 15 |
| W5 | C1 onboarding (T22); C1 triage 15 minutes a day; merges | about 10 |
| W6 | Two merge sessions; C1 triage | about 6 |
| W7 | B6 round 1 with the operator (T25); Study 1 read-out (T26); security test scope if approved (T24); merges | about 12 |
| W8 | Backup on for C1 (T27); Study 3 notes; FT-38 screenshots review; merges | about 10 |
| W9 | Freeze (T29); counsel sign-off and 1.0.0 publication (T30); FT-43 listing draft; fix merges | about 10 |
| W10, W11 | One fix session a week; C1 triage | about 3 a week |
| W12 | Release-candidate run with the operator (T33, about 6 h); B6 round 2 (3 h); C1 exit (T34); FT-43 privacy answers and review notes; FT-44 approve; tag (T35); fix merges | about 18 |
| W13 | FT-45 submit (T36); answer App Review within a day | about 3 |


## 3. The 20 work streams

A stream is one long-lived agent role with a fixed set of files. Thirteen streams start at T03 and seven at T14 (section 5); a stream with no slot in a week does not open PRs that week (section 6.3). It takes work packages (WP-F##-##, from section 12 of each spec) and backlog tasks (BL-###, `docs/BACKLOG.md`) in order, one pull request each. Streams map to the owner roles the specs already name (mobile engineer, speech engineer, data architect and so on); the role names in 09's risk register map to streams as listed in section 3.2.

Rules for the "Owns" column: globs never overlap between streams (the moves in section 5.7 removed the overlaps R2 AR-17 found); "(new)" means the file or folder does not exist on `develop` today; files any stream needs to change but only one may edit are listed in section 4. A stream may create a throwaway spike folder `experiments/<name>-spike/` when its WP names one.

### 3.1 Summary

| ID | Stream | Skills | Specs | On the critical path |
|---|---|---|---|---|
| S01 | Auth and account security | Security, iOS/React Native, Supabase Auth | F02, F01 links | Yes: BL-347, BL-330 gate outside sign-in |
| S02 | Database and access rules | Postgres, RLS, SECURITY DEFINER review | F11, F16, F17 server parts | Yes: BL-331, `peek_invite`, staging |
| S03 | Local store and sync | React Native, expo-sqlite, offline data | F16 client, local schema for all | Yes: two-phone sync |
| S04 | Co-parent sharing | React Native, deep links, APNs client | F11, F03 invitee | Yes: C1 needs 4 pairs |
| S05 | Encrypted recording backup | Swift, Keychain, CryptoKit, Storage | F08 6.5 | Yes: the longest chain (T23, T25) |
| S06 | Plus, plan reminders and status report | StoreKit 2, Swift bridge, Edge Functions, email | F14 | Yes: BL-342, D-080 |
| S07 | Platform: contracts, Edge Functions, remote config | TypeScript, Deno, Ed25519 signing, CDN | F19, `packages/api` | Partly: kill switches, contracts |
| S08 | Speech and language packs | Speech/ML (whisper.cpp), native audio, scripts | F05, F07 packs | Yes: DR-01 at T18 |
| S09 | Faithful-edit engine | TypeScript, Unicode, property tests | F06, F07 core | No (pure TS), but a launch gate (R-01) |
| S10 | Capture and Tonight | React Native audio, iOS session handling | F04 | Device runs DL-01, DL-02 |
| S11 | Review and names | React Native, accessibility | F06 UI, F07 UI | No |
| S12 | First run and entry | React Native, accessibility, Swift (age range) | F01, F03 | No |
| S13 | Book, Read together, children and export | React Native, PDF and ZIP, RTL text | F09, F10, F12, F15 | Export is never-cut |
| S14 | Settings, reminders, help and deletion | React Native, notifications, privacy | F13, F17, F20 app | Deletion is never-cut |
| S15 | Design system and accessibility | Design systems, VoiceOver, Dynamic Type | Cross-cutting, M-JR design | No |
| S16 | Content and claims | Product writing, `packages/content` rules | All copy, F21 listing | Yes: M14 copy delta |
| S17 | Legal drafting and privacy disclosures | Legal drafting (not legal advice), data mapping | `docs/legal`, labels | Yes: counsel delta |
| S18 | Analytics and learning loop | Analytics engineering, consent | F18 | No (cut 4 exists) |
| S19 | QA automation, device evidence and performance | Maestro, vitest, k6, device scripts, perf | 07, all specs | Yes: evidence for G3, G4 |
| S20 | Release, CI and the website | EAS, GitHub Actions, Next.js web | F21 web, release | Yes: switch, AASA, pages |

### 3.2 Role names used in the specs

Mobile engineer: S10, S11, S12, S13, S14 by area. Speech engineer: S08. Core owner: S09 (S13 for `age.ts`, S14 for `prompts.ts`). Data architect: S02. Sync owner: S03. Security engineer: S01 (S02 for SQL). Payments engineer: S06. Platform engineer: S07. Privacy engineer: S14 (app) and S17 (documents). Design systems: S15. Content: S16. Legal lane: S17. Analytics engineer: S18. QA engineer: S19. Release owner and web engineer: S20.

### 3.3 Stream detail

**S01 Auth and account security**
- Owns: `apps/mobile/src/lib/auth/**`, `apps/mobile/src/lib/supabase/**`, `apps/mobile/src/app/(auth)/**`, `apps/mobile/src/app/+native-intent.tsx`, `apps/mobile/src/lib/links.ts` (new), `apps/mobile/src/app/settings/account.tsx`, `supabase/functions/apple-token/**` (new), `supabase/templates/**`, `docs/ops/AUTH_SETUP.md`, `docs/security/**` (new), `packages/content/src/features/auth.en.ts`, `apps/mobile/test/auth-*.test.ts`.
- Takes: BL-347 (review H1), BL-330 (review H3, the rest of WP-F02-03), BL-362, BL-360 (pair), review M4 and L3 (gaps G-05, G-06) with the `new-device-sign-in` email sent before any use of the recovery key on a new device (R4 PT-19, R2 AR-06); WP-F19-12a; WP-F02-01, -02, -05 to -09 (most built under BL-050, BL-051, BL-052, BL-054, BL-170: verify against F02 section 7 and close gaps); WP-F02-04 Google (cuttable, ROADMAP 2.1 cut 2); WP-F01-05; WP-F18-04; WP-F19-12 auth part.
- Starts when: T03. Deploying `apple-token` waits on FT-11 secrets.
- Done when: the H1 proof of concept (security review appendix) is a regression test that fails on today's code and passes after; `[A-REQ-033]`, `[F02-REQ-004]`, `[A-REQ-018]`, `[F02-REQ-003]` green; a second independent review signed; device rows S1-06 to S1-08 and S2-14 recorded.
- Must not decide alone: the auth flow type (PKCE) and when a link is accepted (ADR); code length and expiry (FT-04); invite link format (BL-348); turning passkeys on; where session tokens live.

**S02 Database and access rules**
- Owns: `supabase/migrations/**` inside the timestamp ranges the coordinator assigns to S02, `supabase/tests/**` except files starting `audio_backup` or `subscription_status`, `supabase/APPLY.md`, `supabase/cron/**`, `supabase/config.toml`.
- Takes: BL-331 remainder with review M1, M5, L1 and gaps G-08 to G-14; BL-332; BL-334; BL-244; BL-326 (= WP-F18-11); the `peek_invite` RPC for BL-322; WP-F11-01 (72-hour undo, device-made invite ids); the WP-F16-03 fix (op receipts keyed by person, review L1); WP-F16-04; WP-F16-10; WP-F16-13 server part; WP-F17-10 extended to every M14 system (R2 AR-22); the v1.0 wire-contract columns in one migration (WP-F04-14 `occurred_precision`, WP-F07-04 dictionary forms, nullable author-layer columns, R2 AR-31 and AR-32); the compare-and-set rule for the words group from the sync ADR (R2 AR-02); WP-F11-09s push tables; the WP-F06-07 server columns (`author_edits`, `locked_spans`, `pack_ref`); the held-draft table or columns (WP-F14-22 server part, R3 DX-01); the per-person hide column (WP-F12-09 server part, R3 DX-12); WP-F11-10 with S19. S02 owns every SQL function that more than one feature changes (`purge_due`, `prepare_account_purge` and any other function first defined in another range; R2 AR-16). Not in v1.0: WP-F16-02 `book_access` (BACKLOG BL-175 deferred to v1.2 by D-055; R2 AR-03).
- Starts when: T03.
- Done when: `npm run test:db` green; every new table, view and function has an access-matrix row; each file has an APPLY.md section with a check and a rollback; the staging run of `deploy-db.yml` is green.
- Must not decide alone: who can read what; any new SECURITY DEFINER function (second review); deleting or rewriting stored rows; the order of files (ranges come from the coordinator).

**S03 Local store and sync**
- Owns: `apps/mobile/src/lib/db/**`, `apps/mobile/src/lib/store.ts`, `apps/mobile/src/lib/sync/**`, `apps/mobile/test/{migrations,store.*,sync-*}.test.ts`, `apps/mobile/test/helpers/{node-db,store-fixture}.ts`.
- Takes: WP-F16-05 to -09, WP-F16-13 client part, WP-F16-11 with S19; WP-F02-09; WP-F03-01; WP-F04-03; WP-F07-03 local table; WP-F12-02; WP-F12-06 move function; WP-F13-07 table; the M17 ledger query (only rows this person authored, on request from S06 for WP-F14-20, R2 AR-04); the held-draft sync op (WP-F14-22 client part); the words-group conflict copy (R2 AR-02); WP-F06-07 local part (local v10); WP-F19-12s; BL-412; the remainders of BL-134 and BL-136; gap G-26. Every other stream's local schema change comes here as a request, numbered per section 4. 
- Starts when: T03 for local work and the sync ADR draft; two-phone runs need a switch-on development build and staging (T16).
- Done when: fixture databases from v0 migrate with row counts and hashes unchanged; kill during push 500 of 500; `[F16-REQ-001]`, `[F16-REQ-009]`, `[F16-REQ-013]` green; S1-22 on two phones recorded.
- Must not decide alone: sync op shapes or protocol (D-023); local schema version numbers (one version per PR, numbered by the coordinator); anything that changes what uploads.

**S04 Co-parent sharing**
- Owns: `apps/mobile/src/lib/family/**`, `apps/mobile/src/components/family/**`, `apps/mobile/src/app/invite/**`, `apps/mobile/src/app/join/**` (new), `apps/mobile/src/app/(tabs)/family.tsx`, `apps/mobile/src/app/(tabs)/_layout.tsx`, `packages/core/src/{invite,family-rules}.ts` (new) with their tests, `packages/content/src/features/family.en.ts`, `apps/mobile/test/{invite-link,coparent-soon}.test.ts`.
- Takes: BL-322 app part (with gaps G-02, G-07); WP-F11-03, -05, -06, -07 with -16 (the leave sheet preselects nothing, R4 PT-14), -08, -12, -15 app part; WP-F19-12f; WP-F11-09c (`lib/family/push.ts`); WP-F03-06; WP-F12-06 join part; BL-391 rescoped by M14 (hide only what v1.0 still lacks); turn-on checks 3, 4, 9 and 10 in `docs/backlog/future/06-coparent-sharing-v1-1.md` section 3. Cut from v1.0: WP-F11-13 (QR, P1).
- Starts when: T03. BL-322 needs `peek_invite` from S02; WP-F11-05 needs the family contracts from S07 (WP-F11-04).
- Done when: Maestro flows F11-invite and F11-join pass; `[F11-REQ-006]`, `[F11-REQ-011]`, `[F11-REQ-019]` green; S1-09 and S1-22 recorded on device.
- Must not decide alone: who is covered by Plus (DR-16, answered by M17 for counting; Apple Family Sharing for coverage); D-050 second consent (counsel); what the other parent can see; push payload content (LEGAL-REQ-054).

**S05 Encrypted recording backup**
- Owns: `apps/mobile/modules/scribe-keys/**` (new), `apps/mobile/src/lib/backup/**` (new), `apps/mobile/src/app/settings/{backup,recordings}.tsx` (`backup.tsx` new; `storage.tsx` moved to S08, R2 AR-17), `supabase/functions/escrow/**` (new), the migration range the coordinator assigns to backup, `supabase/tests/audio_backup*.test.mjs` (new), `packages/content/src/features/backup.en.ts` (new).
- Takes: WP-F08-B1 to B6 and B7 (claims, with S16, S17, S20), with B5 split into B5a upload queue (including the audio of held letters, R3 DX-01), B5b Settings row and the backup consent act (R4 PT-22, request to S14), B5c restore, B5d turn off and delete with "bring them to this phone first" (R2 AR-09, AR-18); WP-F17-13 (moved from S11 because it edits `recordings.tsx`); WP-F19-12b; WP-F08-B8 is the founder's key ceremony (section 10.4); WP-F08-02 copy revisit for M14 and M16. The ADR 0006 amendment carries R2 AR-05 to AR-11, AR-33 to AR-35 and M16: a key per (child, author), a device key pair, the recovery-key access log and who can unwrap.
- Starts when: T03 for B1 and the ADR. B1 needs the first development build and two iPhones on one Apple Account; B2 needs the ADR 0006 amendment for the owner-only scope accepted (section 8); B5 needs sign-in from S01 in a build.
- Done when: `[F08-REQ-020]` to `[F08-REQ-026]` green; zero plaintext audio bytes in any request across the E2E suite (07 section 5.2 item 9); B6: 20 of 20 recordings restored with equal hashes, with and without iCloud Keychain, and erase reaches the server.
- Must not decide alone: algorithms and the key hierarchy; who can use the recovery key and how each use is logged (M16); backup retention and purge; Plus or free and on or off by default (F08 Q2, T07); any backup copy (M16: encrypted, recovery key held by us under logged access, never read, sold or used to train models; no "only your family's keys" claim).

**S06 Plus, plan reminders and status report**
- Owns: `apps/mobile/src/lib/billing/**`, `apps/mobile/modules/scribe-store/**`, `apps/mobile/storekit/**`, `apps/mobile/src/components/plus/**` (new; the Keep sheet moves here from `components/child/plus-gate.tsx` in WP-F14-21, and S06 owns that one file in `components/child/` until it moves), `apps/mobile/src/app/settings/plus.tsx`, `packages/core/src/plan.ts`, `packages/core/src/plan-notices.ts` (new), `packages/core/test/plan*.test.ts`, `packages/content/src/features/billing.en.ts`, `packages/content/src/emails/billing.en.ts`, `packages/content/src/pricing.ts`, `supabase/functions/subscription-status/**` and `supabase/functions/plan-reminders/**` (new; names [R]), the migration range the coordinator assigns to the status table, `supabase/tests/subscription_status*.test.mjs` (new), `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md`, `apps/mobile/test/billing-*.test.ts`.
- Takes: BL-342 (WP-F14-02, -06, -07); WP-F14-20 the M17 ledger (own letters, words seen; R2 AR-04; the same work as F11's WP-F11-14, one PR with F14 as its home); WP-F19-12r `statusReport` consumer; WP-F14-21 Keep sheet move, one held-letters row and the Tonight line request to S10 (R1 PL-07, R3 DX-03, DX-22); WP-F14-22 held letters durable (requests to S02, S03, S05, S13); WP-F14-09 with S16 and counsel; BL-358 and BL-357 as WP-F14-15a client, -15b tables (in S06's migration range, S02 review), -15c endpoint (R2 AR-18, R5 EQ-21); BL-359 (WP-F14-16, with renewal projection and the production-only rule, R4 PT-08, R2 AR-13); WP-F14-13, -17, -19; BL-344 (Redeem a code, PRD-REQ-027 Rev); BL-373, BL-374 (their FT-53 question is answered by D-082 and D-083 [R]); BL-416 (pair); BL-430; BL-324 Swift part (gap G-16). BL-407 and BL-429 count Read together sessions, which M2 removed: superseded [R]. WP-F14-12 is the founder's device run.
- Starts when: T03. WP-F14-15a to c need sign-in (S01) and the D-080 contract in `packages/api` (S07).
- Done when: `[PRD-REQ-003]` over a synthetic year; `[C-REQ-025]`, `[C-REQ-026]`, `[F14-REQ-032]`, `[F14-REQ-033]` green; `[F14-REQ-014]` zero purchase data in any request; D-1 to D-12 signed on device with date and build.
- Must not decide alone: any change to `plan.ts` (founder, CODEOWNERS); what the status report carries (D-080, D-081, counsel); reminder and email wording (counsel); the free allowance; price display (D-083).

**S07 Platform: contracts, Edge Functions, remote config**
- Owns: `packages/api/**`, `supabase/functions/{_shared,config,content,purge-worker,analytics-forget}/**` (sole owner of `purge-worker`: S05 and S14 send requests, R2 AR-17), `supabase/functions/{invite-redeem,push-send}/**` (new), `apps/mobile/src/lib/remote/**`, `apps/mobile/src/components/content-blocks/**`, `packages/content/src/features/content-blocks.en.ts`, `scripts/packs/**`, `scripts/ops/**`, `docs/ops/**` except `AUTH_SETUP.md`, `APP_STORE_CONNECT_SUBSCRIPTIONS.md`, `DEPLOY.md`, `APP_SIZE.md`, `RELEASE.md` and `well-known/**`.
- Takes: WP-F19-02, -05 (BL-325), -06, -07, -08, -10, -11, -14, -16 schema part; WP-F11-02, -04, -09a, -09f, -15 contract part; WP-F16-01; WP-F17-11 and WP-F08-B3p, the purge-worker steps for every M14 system (R2 AR-22); WP-F05-03 remainder; BL-335 agent half after FT-16; the frozen v1.0 sync wire contract (R2 AR-31); the D-080 contract for S06 with the R2 AR-13 fields; the recovery-key contract for S05; kill switches `backupUploads`, `escrow` and `statusReport` in the ADR 0016 vocabulary (R2 AR-12); gaps G-17, G-18, G-20 (SQL part with S02).
- Starts when: T03.
- Done when: `npm run test:functions` green; `[F19-REQ-008]`, `[F19-REQ-009]`, `[F19-REQ-013]` green; the staging kill test (WP-F19-13 with S19) passes; every endpoint meets the ADR 0017 list (p95 budget, auth check, idempotent, rate limit, request id, content-free logs).
- Must not decide alone: a new endpoint class; keys and signing; a remote-config key that changes behaviour (ADR 0016; B14 never list); the push provider and its keys; any flow where a server could see content.

**S08 Speech and language packs**
- Owns: `apps/mobile/src/app/settings/storage.tsx` (pack management; moved from S05), `apps/mobile/src/lib/transcribe*.ts`, `apps/mobile/src/lib/model-files.ts`, `apps/mobile/src/lib/{transcription-queue,models,packs,language,audio-enhance}/**`, `apps/mobile/modules/scribe-audio/**`, `apps/mobile/src/components/{speech,language}/**`, `apps/mobile/src/app/settings/language.tsx`, `experiments/**` (except spike folders other streams create), `packs/**`, `packages/content/src/features/{speech,language,packs}.en.ts`, `apps/mobile/test/{transcribe-*,transcription-queue,models-catalog,speech-consent}.test.ts`.
- Takes: WP-F05-01 clamp (review L9), -02, -05, -10, -11 (pair), -12 (human); the scorer half of WP-F06-04 (`experiments/score.ts`); BL-337 agent half; WP-F07-02 (pair); BL-375; BL-376 with S11; BL-382; BL-432; BL-324 audio part; WP-F03-04 dictionary seeding (orphan, R5 EQ-07).
- Starts when: T03 for harness and gate tooling; device runs need T04 and FT-21.
- Done when: a gate report per language (`[F05-REQ-002]` to `[F05-REQ-006]`) and the FT-34 record exist; `[F05-REQ-040]` numbers recorded on SE 3, iPhone 12 and iPhone 15 (S1-17); S1-15, S1-16, S1-18, S1-19 recorded.
- Must not decide alone: which languages ship (founder, DR-01 at T18); the model per language (ADR 0015); publishing packs (coordinator with the founder's OK); anything that sends audio off the phone.

**S09 Faithful-edit engine**
- Owns: `packages/core/src/{verify,meaning,protect,types,pipeline,rules,punctuation,text,repeats,model-edits,edit-provider,frozen,domain,index}.ts`, `packages/core/src/lang/**`, `packages/core/src/{author-edits,review-state,dictionary}.ts` (new), `packages/core/test/**` except the test files section 4 gives to other streams.
- Takes: WP-F06-01 (pair, Hermes on SE 3), WP-F06-02 to -06 (scorer part of -04 goes to S08; WP-F06-06 is the author-layer core that DATA-REQ-041 needs), WP-F07-01, WP-F07-08 core part, BL-148; R-01 open items D4, D6, D7, D9, D10, D13, D14, D15.
- Starts when: T03.
- Done when: `[F06-REQ-019]` zero accepted meaning changes per language in Node, then under Hermes (WP-F06-01); `[F06-REQ-021]` 10k cases on a fixed seed; the golden master changed only where a case asserted a defect, each listed in the PR; `ENGINE_VERSION` 6 with a dated comment.
- Must not decide alone: `EditType`, `verify.ts`, `meaning.ts`, `types.ts`, `pipeline.ts` (founder approval, CODEOWNERS); sign-off of a pack's word tables (native reviewer and founder); an engine change that alters saved letters (WP-F06-12 audit first).

**S10 Capture and Tonight**
- Owns: `apps/mobile/src/app/{listen,write}.tsx`, `apps/mobile/src/app/(tabs)/index.tsx`, `apps/mobile/src/lib/capture/**`, `apps/mobile/src/components/capture/**` except `transcript.tsx`, `apps/mobile/src/{lib,components}/resilience/**`, `apps/mobile/src/lib/{audio-mode,permission-copy}.ts`, `apps/mobile/src/lib/haptics*.ts`, `apps/mobile/src/widgets/**` (new), `packages/core/src/{capture,backdate}.ts` (new) with tests, `packages/content/src/permissions.en.ts`, `apps/mobile/test/{sweep,keep-awake,resilience}.test.ts`.
- Takes: WP-F04-01 (pair, device), -02, -04, -05, -06, -08, -10, -11 with S19; BL-370 with S15; BL-378, BL-379, BL-380, BL-381, BL-417, BL-420; the Tonight slot line of WP-F19-09; the standing Plus line on Tonight and one row for held letters (requests from WP-F14-21); no VoiceOver announcement during a take after "Listening" (R3 DX-06); the microphone purpose string true for every user under M14 and M16 (R2 AR-24, R4 PT-01). Cut from v1.0: WP-F04-12 widget (F04 Q4).
- Starts when: T14.
- Done when: `[F04-REQ-001]`, `[F04-REQ-003]`, `[F04-REQ-006]`, `[F04-REQ-008]`, `[F04-REQ-010]` green; `[F04-REQ-024]` kill runs DL-01 and DL-02 (500 Simulator plus 50 SE 3, zero loss); S1-10 to S1-14 recorded.
- Must not decide alone: anything that could drop audio; background audio and keep-awake modes (App Review); the 30-minute cap; the microphone purpose string (counsel).

**S11 Review and names**
- Owns: `apps/mobile/src/app/review.tsx`, `apps/mobile/src/components/review/**` (new), `apps/mobile/src/components/capture/transcript.tsx`, `apps/mobile/src/components/dictionary/**` (new), `apps/mobile/src/lib/review/**` (new), `apps/mobile/src/lib/dictionary-store.ts` (new), `apps/mobile/src/lib/{review-layout.logic,read-it-back,read-it-back.logic,provenance}.ts`, `apps/mobile/src/app/settings/words.tsx` (new), `packages/content/src/features/words.en.ts`, `apps/mobile/test/provenance.test.ts`.
- Takes: WP-F04-07 (typed text exact: today `review.tsx` passes typed text through `normalizeChars`, breaking F04-REQ-012 and B5); WP-F06-08a, -08b, -09; WP-F06-14 with S16; WP-F07-05, -06; BL-377, BL-395, BL-406, BL-413, BL-433; BL-376 with S08; the gate call change in `review.tsx` for M17 when S06 requests it. Cut from v1.0: WP-F06-10, -11 and -12 (lock, unsure marks and the engine audit; F06 section 11 lists them as capacity-dependent), WP-F06-13 (BL-146 deferred), WP-F07-07 (v1.1). WP-F17-13 moved to S05.
- Starts when: T14.
- Done when: `[F04-REQ-012]` byte equality; `[F06-REQ-035]` to `[F06-REQ-037]`, `[F06-REQ-028]`, `[F06-REQ-034]`, `[F06-REQ-038]` green; VoiceOver script and AX5 snapshots; S1-23 recorded.
- Must not decide alone: how edits are shown, counted and undone (D-086); the "Exactly as said" default; any write to `final_text` outside the author layer.

**S12 First run and entry**
- Owns: `apps/mobile/src/app/{onboarding,welcome,+not-found}.tsx` (welcome new), `apps/mobile/src/lib/age-gate*.ts`, `apps/mobile/src/lib/{bootstrap,age-range}.ts` (new), `apps/mobile/src/components/gate/**`, `apps/mobile/src/components/first-run/**` (new), `apps/mobile/modules/age-range/**` (new), `apps/mobile/test/age-gate.test.ts`.
- Takes: WP-F01-01, -02 (pair), -03 (wiring line in `_layout.tsx` by S20), -04, -06 with S20; WP-F01-07 the AB 1043 age signal (R4 PT-11; pair, in builds from T27); WP-F03-02, -03, -05, -07 (human); BL-383, BL-385, BL-386, BL-419, BL-423, BL-424, BL-425, BL-426, BL-427.
- Starts when: T14.
- Done when: `[F01-REQ-001]` to `[F01-REQ-006]`, `[A-REQ-002]` airplane test, `[B-REQ-001]`, `[F03-REQ-001]` to `[F03-REQ-006]` green at default and AX5; `[F03-REQ-008]` median recorded on SE 3.
- Must not decide alone: 18+ gate behaviour (legal duty; DR-10 counsel); Declared Age Range use; what first run asks for (D-087); any new permission ask.

**S13 Book, Read together, children and export**
- Owns: `apps/mobile/src/app/(tabs)/book.tsx`, `apps/mobile/src/app/letter/**`, `apps/mobile/src/app/read-together.tsx`, `apps/mobile/src/app/settings/{children/**,export.tsx}`, `apps/mobile/src/components/{book,read-together,child,player,export}/**` (except `components/child/plus-gate.tsx`, S06's until WP-F14-21 moves it), `apps/mobile/src/lib/{player,export}/**`, `apps/mobile/src/lib/dates.ts`, `apps/mobile/modules/scribe-files/**`, `packages/core/src/{age,child}.ts`, `packages/core/src/{book,read-together}.ts` (new), `packages/core/test/{child,book,read-together}.test.ts`, `packages/book/**` (new, needs the decision in section 8), `packages/content/src/book.en.ts`, `packages/content/src/features/{export,player}.en.ts`, `apps/mobile/test/{dates,player-logic,export-*,quiet-day-book}.test.ts`, `apps/mobile/test/__golden__/**`, `apps/mobile/test/helpers/asha-export.ts`.
- Takes: WP-F09-01 to -06, -08 to -10 (WP-F09-05 `LetterText` with S15 review); WP-F10-01, -02, -04, -05, -07, -08, -10; WP-F12-04, -05, -07, -08, -09 client part; WP-F15-01 to -08, -10 with S19; held letters in "Export everything" under `waiting/` (WP-F14-22 request, R3 DX-01); WP-F08-06 keep-safe card; WP-F08-07 original-unaltered test (orphan, R5 EQ-07); BL-323, BL-388, BL-401, BL-421, BL-422, BL-431. Cut from v1.0: WP-F09-11 search (P1, F09).
- Starts when: T14.
- Done when: the `[F09-REQ-*]`, `[F10-REQ-*]` and `[F15-REQ-*]` tests named in each WP green; `[DATA-REQ-050]` to `[DATA-REQ-056]` green; export kill test 20 of 20; S1-20 and S1-21 (ZIP opens on a Mac and on Windows) recorded.
- Must not decide alone: the export format version and contents; a new package; what Read together plays from another parent (D-073: nothing in v1.0); the 90-day pledge text.

**S14 Settings, reminders, help and deletion**
- Owns: `apps/mobile/src/app/settings/{index,_layout,privacy,appearance,reminders,delete-account,recently-deleted}.tsx`, `apps/mobile/src/app/settings/{consents,about,help-legal}.tsx` (new), `apps/mobile/src/components/settings/**`, `apps/mobile/src/lib/{reminders,account-deletion}/**`, `apps/mobile/src/lib/{privacy,notifications}/**` (new), `apps/mobile/src/lib/shelf-days.ts`, `packages/core/src/{prompts,safety,followups}.ts`, `packages/core/src/{reminder-plan,deletion-flow}.ts` (new), their tests in `packages/core/test/`, `packages/content/src/features/{reminders,account-deletion,licences}.en.ts`, `apps/mobile/test/{reminders-planner,shelf-strings}.test.ts`.
- Takes: WP-F13-01, -02, -04 to -06, -08 to -10, -12 (birth well before the due date asks once about reminders, R3 DX-18), -13 (App Store rating request, R1 PL-29), -07 with S03; WP-F12-07 and the planner input for "Quiet this book" (WP-F12-08, R3 DX-05); WP-F17-00 (pair), -01 to -07, -09 with S19, -12, -14 with S16, -15 (P1); WP-F20-01 to -03; BL-387, BL-404, BL-405, BL-428; BL-389 with S16. Cut from v1.0: WP-F17-08 app lock (P1).
- Starts when: T14.
- Done when: `[C-REQ-001]` to `[C-REQ-009]` and the F13 planner property test over 24 zones and both DST changes green; `[C-REQ-016]`, `[C-REQ-019]`, `[DATA-REQ-019]` and the `[F17-REQ-*]` tests named in each WP green; `[F20-REQ-004]` to `[F20-REQ-008]` green; S2-13 and S2-15 recorded.
- Must not decide alone: deletion semantics and timings (DATA-REQ, counsel); consent withdrawal modes (counsel); the helpline list (FT-36); lock-screen notification wording.

**S15 Design system and accessibility**
- Owns: `packages/design-tokens/**`, `apps/mobile/src/components/{ui,motion,platform}/**`, `apps/mobile/src/lib/{motion,a11y,a11y.logic,navigation.logic,utils}.ts`, `apps/mobile/src/global.css`, `apps/mobile/assets/**`, `docs/design/**`, `apps/mobile/test/{design-system-gaps,theme-leaks}.test.ts`.
- Takes: WP-F00-01 the component render harness (new, pair, first in wave 1; R5 EQ-04); BL-394, BL-396, BL-397, BL-398, BL-400, BL-402, BL-418 (the shared components; each screen owner adopts them in its own PRs); the four named quiet components (QuietLine, SoftCard, NoticeRow, Toast) in `docs/design/COMPONENTS.md` that specs cite instead of "quiet" and "calm" (R3 DX-24); BL-354 (pair), BL-355, BL-409 with S19; accessibility review of every UI PR.
- Starts when: T03.
- Done when: token and component tests green; AX5 snapshots and contrast checks for every component; no screen file edited outside `components/ui` in this stream's PRs.
- Must not decide alone: a new UI library (ADR 0101); brand changes (D-071, D-072); Dynamic Type limits (D-027).

**S16 Content and claims**
- Owns: `packages/content/**` except the feature files section 4 gives to other streams, `packages/brand/**`, `packages/emails/**`, `apps/mobile/src/lib/copy.ts`, `scripts/brand/**`, `docs/store/**`, `docs/emails/**`, `docs/support/**` (new).
- Takes: the M14 and M16 copy delta (accounts, sync, co-parent, backup; remove the D-085 "no backup" lines and the coming-soon copy where M14 ships the feature; backup lines say recordings are encrypted and that we hold a recovery key under logged access, never "only your family's keys"; `sensitiveConsent.body` co-parent wording, gap G-21); the Keep vocabulary and held-letter lines from F14 section 6.2 (R3 DX-08, R4 PT-13); WP-F15-09 (orphan, R5 EQ-07); BL-356, BL-372 (FT-52 answered by D-084 [R]), BL-390 (FT-55 answered by M14 [R]), BL-393 (FT-54 answered by D-074 and D-086 [R]), BL-411; WP-F13-03; WP-F18-07 with S18; WP-F19-11; WP-F20-04, -05, -07; WP-F21-01 to -04; BL-340 and BL-341 with the founder.
- Starts when: T14.
- Done when: `npm test -w @scribe/content` green (rules and no-real-family-data); every privacy, durability, security or "free" claim registered (LEGAL-REQ-044); `[F21-REQ-002]` to `[F21-REQ-004]` green.
- Must not decide alone: any claim (counsel); store listing and subtitle (founder); the brand name (`packages/brand`, D-076).

**S17 Legal drafting and privacy disclosures**
- Owns: `docs/legal/**` (including `DATA_CLASSIFICATION.md`).
- Takes: COUNSEL_PACKET 1.1.0 for T05 with a one-page "what M14 and M16 changed" table and the R4 counsel questions in R4's order; the delta covers the Privacy Policy, Terms of Service 6.2 and 12.4, Consumer Health Data notice, in-app disclosures, subprocessors, data policy, Subscription Terms, ENGINEERING_REQUIREMENTS 1.3.0, DATA_CLASSIFICATION (`entry-audio` is v1.0), DELETION_AND_EXPORT_SPEC and a privacy label 1.4.0 draft (R4 PT-01, PT-05, PT-06, PT-24); BL-338 with the founder; a draft superseding entry for D-088's label for the coordinator; WP-F21-08, -09 with S20, -11; WP-F18-08 with S20; data-map rows on request from every stream; BL-365 (counsel, human).
- Starts when: T03.
- Done when: documents ASCII-only; every changed statement has a claims entry; counsel's tick recorded per document (FT-41); `DATA_CLASSIFICATION.md` rows match the migrations (S02 checks).
- Must not decide alone: legal text going public (founder, COORDINATION section 1); anything counsel has not seen. This lane drafts; it is not legal advice.

**S18 Analytics and learning loop**
- Owns: `packages/analytics/**`, `apps/mobile/src/lib/analytics/**`, `apps/mobile/src/components/consent/**`, `docs/analytics/**`, `docs/insights/**`, `scripts/insights/**`, `scripts/analytics/**` (new), `scripts/ci/sdk-guards.mjs` (new), `apps/mobile/test/analytics-contract.test.ts` (new).
- Takes: WP-F18-01, -03 and -05 in v1.0; the events behind "letters made" and "letters kept" (03 section 4.1); -02 and -06 if slots allow; -09 (pair), -10, -14, -15 are 1.0.x (section 6.4); catalogue rows requested by WP-F04-13, WP-F06-15, WP-F08-08, WP-F10-09, WP-F13-11, WP-F14-14; BL-251; BL-252.
- Starts when: T14.
- Done when: catalogue tests green; `[LEGAL-REQ-017]` allowlist; `[F18-REQ-003]` both ways; `[F18-REQ-007]` and `[F18-REQ-010]` fail on a planted import; `[F18-REQ-012]` emitter script exits 0.
- Must not decide alone: a new event or property (L2 only; counsel when available); any SDK (pair; privacy label); anything sent before consent; ROADMAP 2.1 cut 4.

**S19 QA automation, device evidence and performance**
- Owns: `apps/mobile/e2e/**`, `apps/mobile/e2e-web/**`, `apps/mobile/src/dev/**`, `docs/qa/**`, `docs/release/journey/**`, `scripts/trace.mjs` (new), `scripts/leak-surfaces.mjs` (new), `scripts/load/**` (new), `docs/TRACE.md` (new, ADR 0011).
- Takes: BL-002 (report mode, and it fails on a requirement id defined in two specs' section 7, R5 EQ-05); a nightly Maestro run of 5 P0 flows (the workflow line from S20, R5 EQ-10); BL-110, BL-275 to BL-279, BL-408, BL-409 with S15, BL-410, BL-414 with S07, BL-415; WP-F04-11, WP-F14-11 (BL-221), WP-F15-10, WP-F16-11 with S03, WP-F17-09, WP-F19-13, WP-F11-10 with S02; WP-F16-12 as a 1-hour 1x smoke unless the founder keeps the full load test (Q8); the evidence template per device session; the run sheets for the device operator (section 10.2); testID requests to screen owners.
- Starts when: T03.
- Done when: `scripts/trace.mjs` runs in `npm test` and reports P0 IDs with no test; the Maestro suite is green nightly; one evidence file per device session (`docs/qa/evidence/<date>-<build>-<device>.md`).
- Must not decide alone: whether the trace check blocks merges (07 Q8); weakening any test (never); where Maestro runs and what it costs (07 Q6).

**S20 Release, CI and the website**
- Owns: `.github/**`, `apps/mobile/eas.json`, `apps/mobile/app.config.ts`, `apps/mobile/package.json`, root `package.json` and `package-lock.json`, `apps/mobile/src/app/_layout.tsx`, `apps/mobile/src/lib/{capabilities,build-env}.ts`, `apps/mobile/src/lib/README.md`, `apps/mobile/test/{capabilities,config}.test.ts`, `apps/mobile/scripts/**`, `scripts/size/**`, `docs/release/**` except `journey/**`, `docs/ops/{DEPLOY,APP_SIZE,RELEASE}.md` (RELEASE new on `develop`), `docs/ops/well-known/**`; on `main`: `apps/web/**`, `docs/web/**`.
- Takes: the website hotfix on `main` (T06, R4 PT-04); staging deploys from `develop` by `workflow_dispatch` with the `approve-migration` label, production only on a `db-v*` tag (R2 AR-21, R5 EQ-15); PR template headings `Satisfies`, WP or BL id, `Data classes touched`, `Requests to other owners`, switch off and on, kill-switch consumer (R5 EQ-22); `migration-guard`, `expo lint` and docs lint in `required` (R5 EQ-09); the M14 switch (per profile, with `capabilities.ts` and `capabilities.test.ts`, per check 7 in `06-coparent-sharing-v1-1.md` section 3) plus build flags `backup` and `statusReport` (R2 AR-12); the entitlement requests published in wave 0 (`aps-environment`, Keychain sharing, increased memory limit; R2 AR-17, AR-29); WP-F14-18 CI grep for purchase data (orphan, R5 EQ-07); BL-349 privacy manifest (gap G-23); BL-336 after Q-002; BL-339 after FT-17; BL-392; BL-117; BL-283; rebase and land PR #30 (CI hardening and the fence workflow); WP-F19-02 with the founder; WP-F01-06; WP-F02-10 `/auth/confirm`; WP-F11-11 `/j` and the AASA paths; WP-F20-09 `security.txt`; WP-F21-05, -06, -07, -10, -13; BL-243, BL-363, BL-364.
- Starts when: T03.
- Done when: CI `required` green; the fence workflow fails a planted `supabase/**` change without the label; `npm run preflight:testflight -w @scribe/mobile` clean except founder items; IPA under 40 MB (TF-01); the AASA file served with no redirect (P-05) and legal pages live.
- Must not decide alone: turning the switch on in a store profile (founder, after the R-17 gate); a new native module or SDK (pair); `main` and tags (coordinator and founder); DNS (founder).

## 4. Files one stream owns for everyone

Some files every feature needs. Each has one owner; everyone else changes it by request. A request is a section "Requests to other owners" in the PR body: file, exact change, why, WP id. The owner lands it within one working day or says why on `docs/agents/BOARD.md`; past that the coordinator escalates. This costs about a day per cross-stream change [A] and is the price of no two streams editing one file.

| File | Owner | How others change it |
|---|---|---|
| `apps/mobile/src/lib/db/migrations.ts`, `apps/mobile/src/lib/store.ts` | S03 | Send the schema step and the store function signature. One local schema version per PR. Numbers are fixed now (R5 EQ-23): v6 WP-F04-03 with G-26 `entries.language`; v7 WP-F12-02 per-person child prefs; v8 WP-F14-22 held-draft sync fields; v9 WP-F13-07 prompt history; v10 WP-F06-07 author layer; v11 and later in request order. Every migrator test runs from v0 to head, never from a fixed fixture version |
| `apps/mobile/src/app/_layout.tsx`, `apps/mobile/app.config.ts`, `apps/mobile/eas.json`, `apps/mobile/package.json`, root `package.json` and `package-lock.json` | S20 | Send the wiring line or plugin entry. A new package is pair mode with the founder (BACKLOG rule 8) |
| `packages/content/src/strings.en.ts`, `packages/content/src/features/index.ts`, `packages/content/test/rules.test.ts` | S16 | Send key, text and screen. Feature files listed in section 3.3 stay with their stream |
| `packages/analytics/src/catalog.ts`, `docs/analytics/TRACKING_PLAN.md` | S18 | Send event, L2 properties and the question it answers |
| `packages/core/src/index.ts` | S09 | Send the export line |
| `packages/api/**` (contracts, standards, remote-config keys) | S07 | Send the contract shape; S07 checks it against ADR 0017 |
| `supabase/APPLY.md` | S02 | S05 and S06 send the APPLY section for their migration files |
| Migration file names under `supabase/migrations/` | Coordinator | Timestamps are given at merge, not at dispatch: before the founder merges, the coordinator renames the file to the next free timestamp after the newest applied file, so the migration guard and `supabase db push` never see a file out of order (R5 EQ-14). A file never redefines a function first defined in another stream's file; S02 owns those (R2 AR-16) |
| Requests to S03, S16 and S20 | Those streams | Each keeps one standing "requests" PR a day that batches every request received by 15:00 UTC; it merges as one slot in the next session (R5 EQ-33) |
| `docs/legal/DATA_CLASSIFICATION.md` | S17 | Put the rows under "Data classes touched" in the PR body; S17 lands them within a working day. This departs from 07 section 1.2 item 4 ("same PR") to keep one writer; the founder confirms [R] |
| `docs/BACKLOG.md` | PM lane | Each PR may change only its own task's Status line (ADR 0011) |
| `docs/DECISIONS.md`, `docs/agents/**` | Coordinator | `BOARD.md` is append-only except your own claim line (COORDINATION section 3) |
| `CLAUDE.md`, `.github/CODEOWNERS` | Founder | Propose in a PR body |
| `docs/prd/v2/**` | PM lane | Propose in a PR body (ADR 0011: agents never edit requirement documents) |
| `docs/adr/**` | Coordinator for edits to an existing ADR | A stream proposing a decision adds a new ADR file in its PR (section 8.1) |
| `docs/qa/evidence/**` | S19 for the template | Any stream may add a new evidence file for its own spike or device run; nobody edits another stream's evidence file |

Test files under `packages/core/test/`: S06 owns `plan*`; S13 `child*`, `book*`, `read-together*`; S14 `prompts*`, `reminder-plan*`, `deletion-flow*`; S04 `invite*`, `family-rules*`; S10 `capture*`, `backdate*`; S09 owns the rest. New test files in `apps/mobile/test/` start with the owning stream's area name so the owner is plain from the name.

Shared components: S15 builds them in `components/ui`; the stream that owns a screen adopts them in its own PR. S15 never edits a screen.

## 5. Waves and dependencies

Streams run in parallel inside their files (section 3.3). Waves set what merges first. Slots per wave come from section 6.1; the list that fills them is section 6.3.

| Wave | From, to | Slots | Fenced cap | Goal |
|---|---|---|---|---|
| 0 | T01 to T03 | none | none | Set up; no feature PRs |
| 1 | T03 to T16 (W0 to W3) | 54 | 14 | Gate the server (R-17), decide the ADRs, harnesses, pure-core and contract work, BL-342, the M17 ledger, the counsel delta |
| 2 | W4 to W6 | 42 | 11 | Server features in a build; C1 from T22; backup client by T23 |
| 3 | W7 to T28 | 32 | 8 | Backup to C1 families (T27); last features; reserve for C1 findings and M-JR |
| 4 | T29 to T36 (W9 to W13) | 30 fix slots | as needed | Freeze, prove, submit |

### 5.1 Wave 0: set up (T01 to T03)

No feature PRs. The coordinator:
1. Drafts `docs/DECISIONS.md` entries for M14 (proposed as D-089, with the D-085, D-087 and D-088 consequences), M15, M16 and M17 for the founder.
2. Edits COORDINATION section 6 to match the founder's Q3 answer before the first dispatch (R5 EQ-11).
3. Closes every `active` claim from 3 Oct on `BOARD.md` with a pointer to this file, writes one claim line per stream, and adds the rule that a claim older than 48 hours with no check-in lapses (R5 EQ-12).
4. Applies the PR close rule (R5 EQ-13): close every PR whose base is not `develop` or `main`, every docs PR written for an on-device v1.0, and every agent-operating-system PR, each with one comment pointing here; keep #30, #2 and the web PRs on `main`.
5. Publishes the local schema numbers and the migration rename rule (section 4), and the requests that must land early: `supabase/config.toml` entries for new functions (S02) and `app.config.ts` entitlements (S20) (R2 AR-17).
6. Starts the review agents (section 6.2) and splits the unmerged work on `auto/2026-10-05-fixes` by the globs in section 3.3.

The founder: the T02 answers, branch protection on `develop` and `main` requiring `required`, the `approve-migration` label (FT-20, BL-005, BL-122).

### 5.2 Wave 1: gate the server, decide the hard designs (T03 to T16)

First dispatch at T03, 13 streams: S01, S02, S03, S04, S05, S06, S07, S08, S09, S15, S17, S19, S20. Second dispatch at T14, 7 streams: S10, S11, S12, S13, S14, S16, S18. Splitting the dispatch keeps the open-PR queue under about two weeks of slots (R5 verdict).

| Priority | What merges | Streams | Why first |
|---|---|---|---|
| P1 | PR #30 CI and fence, then the R-17 six (BL-347, BL-330, BL-331 with BL-332, `peek_invite` with BL-334, BL-322 app part, BL-349) as one batch in W2 with one shared security review (R5 EQ-01) | S20, S01, S02, S04 | 09 R-17: nobody outside the family signs in before these |
| P2 | Staging from `develop` (R2 AR-21); the component harness WP-F00-01 (R5 EQ-04); BL-002 trace | S20, S15, S19 | Every later gate and UI test depends on them |
| P3 | The five ADRs (T13, T15) and the contracts they freeze | S03, S05, S06, S07 | R2's P0 rows: sync protocol, per-author keys, status report, deletion, kill switches |
| P4 | BL-342 and the M17 ledger | S06, S03 | Subscription Terms promise the reminders; M17 changes what the gate counts |
| P5 | Counsel delta (T05); copy delta for the pages (T20) | S17, S16 | Pages and copy must match a server build before T20 |
| P6 | Launch-gate tails: WP-F05-02, WP-F06-02 and -03, WP-F08-B1 evidence | S08, S09, S05 | Spikes and gates with long tails |
| P7 | The rest of each brief in section 9 | all | |

Exit: the R-17 gate passes (T16); a development build runs on the SE 3; the T11 rows are recorded; the five ADRs are decided or their defaults stand (T15).

### 5.3 Wave 2: server features in a build (W4 to W6)

| Work | Streams | Needs |
|---|---|---|
| Backup B2 keys, B3 bucket and tables, B4 recovery-key function, B5a upload queue, B5c restore, all behind `capabilities.backup` off (T23) | S05; S02 reviews the migration; S07 the contract | B1 verdict (T11); backup ADR (T15); sign-in in a build |
| Status and consent tables, endpoint and client (WP-F14-15a to c) | S06; S07 contract; S02 review | Sign-in; counsel's comments (T17) |
| Invite, join, leave, push; the shared-book states | S04, S07, S02, S03 | `peek_invite`; family contracts |
| Held letters durable: server table, sync op, export folder (WP-F14-22) | S02, S03, S13 | Sync ADR |
| Words-group compare-and-set and the conflict copy (R2 AR-02) | S02, S03 | Sync ADR |
| Switch on in `preview`, then `testflight` after T16; build flags `backup` and `statusReport` | S20 | T16; founder approval |
| Planner, selector, hide and "Quiet this book" inputs (F13, F12) | S14, S13 | none |
| Fold counsel comments (T17) into copy and drafts | S16, S17 | T17 |

Exit: C1 running with sign-in (T22); backup client merged with the flag off (T23).

### 5.4 Wave 3: backup to families, last features (W7 to T28)

Backup B5b and B5d, the drill (T25), then backup on for C1 families who opt in (T27). Google sign-in and the reminder email scheduler use the fenced slots. Ten slots go to M-JR blockers and criticals by priority, two to server fixes from C1. Exit: last feature merge (T28).

### 5.5 Wave 4: freeze and prove (T29 to T36)

Freeze at T29. Only fixes for S0 and S1 findings and gate failures merge. S19 runs the G4 evidence with the device operator; S05 and the founder run drill round 2 (T33); S16 and the founder finish screenshots (BL-340), review notes (BL-341) and the listing; S17 hands the 1.0.0 texts to the founder after counsel's tick (T30).

### 5.6 Key edges

```
S02 peek_invite ----------------> S04 BL-322 app part
S02 BL-331+332, S01 BL-347+330, S04 BL-322, S20 BL-349 -> R-17 gate (T16) -> switch on in testflight -> Beta App Review (T21) -> C1 (T22)
S07 family contracts ------------> S04 WP-F11-05
S05 B1 (T11) -> backup ADR (T15) -> S05 B2 -> B3 (S02 review), B4 (S07 contract) -> B5a, B5c (T23) -> drill (T25) -> on in C1 (T27)
S01 sign-in + S07 D-080 contract -> S06 WP-F14-15b -> -15c -> -15a -> WP-F14-16
S06 WP-F14-20 (M17) <- S03 ledger query; S11 gate call in review.tsx
S03 sync ADR (T15) -> S02 compare-and-set + held-draft table -> S03 sync op -> S13 export waiting/
S09 WP-F06-02 -> -03 -> -05
S08 gate tool + FT-21 recordings + T11 device runs -> per-language go (T18)
```

### 5.7 File-fence changes that remove the overlaps

| File or folder | Was | Now | Why |
|---|---|---|---|
| `components/child/plus-gate.tsx` (Keep sheet) | Inside S13's `components/child/**` | S06, until WP-F14-21 moves it to `components/plus/` | R2 AR-17 |
| `app/settings/storage.tsx` | S05 | S08 (pack management) | R2 AR-17 |
| `app/settings/backup.tsx` | none | S05 (new) | R2 AR-17 |
| `app/settings/recordings.tsx` | S05, edited by S11's WP-F17-13 | S05, and WP-F17-13 moves to S05 | R2 AR-17 |
| `supabase/functions/purge-worker/**` | S07, claimed by WP-F08-B3 and WP-F17-11 | S07 only; S05 and S14 send requests | R2 AR-17 |
| `app/review.tsx` gate call | S11 file, S06 logic | S11 edits on S06's request | R2 AR-17 |
| Shared SQL functions | Last file wins | S02 owns every function more than one feature changes | R2 AR-16 |
| Migration timestamps | Ranges handed out at dispatch | Given at merge (section 4) | R5 EQ-14 |
| WPs that span two streams (WP-F11-09, WP-F14-15, WP-F08-B5, WP-F19-12 and others) | One WP | One WP per stream with a contract PR first (section 6.3 names the parts) | R2 AR-18, R5 EQ-21, EQ-27 |

## 6. Merge budget and review

### 6.1 The budget

Assumptions [A]: the founder reserves **6 hours a week for merges** in three 2-hour sessions in normal weeks, 4 hours in W6, 2 hours in W10 and W11 (Q2 confirms). Founder time per PR, with an independent review agent's verdict read first: 15 minutes unfenced, 30 minutes fenced; with change requests, assume 1.5 founder passes per PR (R5 EQ-24), so 22 and 45 minutes. Fenced PRs are capped at 4 a week, 6 in W2 for the R-17 batch.

Arithmetic for a normal week, founder only: 4 fenced x 45 = 180 minutes; the other 180 minutes take 8 unfenced at 22. That is **12 merges a week**.

Section 6.2 raises it to a planning number of **16** without the founder giving up any server, auth, payments or migration merge. Measure it: the coordinator counts merges on `BOARD.md` each day, and T38 compares them with this table.

| Week | Founder merges [A] | Raised by 6.2 [A] | Planned slots | Fenced cap | Wave |
|---|---|---|---|---|---|
| W0 | 6 | 0 | 6 | 0 | 0, 1 |
| W1 | 12 | 4 | 16 | 4 | 1 |
| W2 | 12 | 4 | 16 | 6 | 1 |
| W3 | 12 | 4 | 16 | 4 | 1 |
| W4 | 12 | 4 | 16 | 4 | 2 |
| W5 | 12 | 4 | 16 | 4 | 2 |
| W6 | 8 | 2 | 10 | 3 | 2 |
| W7 | 12 | 4 | 16 | 4 | 3 |
| W8 | 12 | 4 | 16 | 4 | 3 |
| **To T28** | **98** | **30** | **128** | **33** | |
| W9 | 9 | 3 | 12 | fixes | 4 |
| W10 | 3 | 1 | 4 | fixes | 4 |
| W11 | 3 | 1 | 4 | fixes | 4 |
| W12 | 8 | 2 | 10 | fixes | 4 |

If 6.2 is not approved, the 30 missing slots take W9 to W12 at the founder-only rate, the freeze moves about four weeks, and submission with it (section 2.2 row 1).

### 6.2 How review agents raise the budget

What review agents do on every PR:
1. **One independent review agent per PR**, never from the author's stream. It runs the checklist in section 8.3, re-runs `npm test`, `npm run typecheck`, `npm run test:db` and `npm run test:functions`, diffs the changed paths against the stream's globs, and iterates with the author until it can post **ready** as a commit status (`review/ready`), so the founder sees one pass in most cases instead of 1.5 [A] (R5 EQ-32).
2. **A second review agent on fenced, payments and backup paths**, focused on access rules, secrets and data flow (D-041). It posts `review/security`. Branch protection requires both statuses plus the founder's label on fenced paths.
3. **A daily digest** from the coordinator: ready PRs sorted by critical path, each with a three-line summary (what, tests, risk), so a 2-hour session covers 6 to 8 PRs.
4. **Device and human items** go in evidence PRs under `docs/qa/evidence/`, so a code review never waits on a phone.

What the founder may delegate (Q2b, answer due T02) [R]: the coordinator merges a PR when all three hold: (a) it touches only `docs/qa/**`, `docs/design/**`, `docs/analytics/**`, `docs/adr/**` with status Proposed, `experiments/**`, `scripts/trace.mjs`, `scripts/load/**`, or only adds or changes test files; (b) two `review/ready` statuses from two agents outside the author's stream; (c) `required` is green. The founder gets the list each Friday (T38) and may revert any of them.

**Never delegated, never auto-merged:** anything under `supabase/**`; `apps/mobile/src/lib/{auth,supabase,billing,backup,sync,db}/**`; `apps/mobile/src/app/(auth)/**`, `+native-intent.tsx`; `apps/mobile/modules/**`; `packages/api/**`; `packages/core/src/{plan,verify,meaning,types,pipeline}.ts`; `packages/content/**` (claims); `docs/legal/**`; `.github/**`; `app.config.ts`, `eas.json` and any `package.json`. Server, auth, payments and migrations stay with the founder.

### 6.3 The v1.0 work-package list, sized to the budget

128 slots to T28: **115 named merges and 13 reserve** (5 for wave 1 carry-over and verify-first closures, 2 for server fixes from C1, 6 for M-JR blockers and criticals no named item covers). Order inside a row is merge order. **F** marks a fenced PR. A stream does not start work for a later wave until its row for the current wave has merged or been handed back.

**Wave 1 (54 slots: 49 named, 5 reserve; 9 fenced)**

| Stream | Items | Slots (F) |
|---|---|---|
| S20 | PR #30 CI and fence, with `migration-guard`, `expo lint`, docs lint in `required` and the PR template headings (F); staging from `develop` (F); website hotfix on `main` (T06); BL-349 privacy manifest | 4 (2) |
| S01 | BL-347 (F); BL-330 with `apple-token` (F) | 2 (2) |
| S02 | BL-331 rest with BL-332 (F); `peek_invite` with BL-334, one file (F); WP-F11-01 (F); one migration with the v1.0 wire-contract columns (F) | 4 (4) |
| S07 | WP-F19-05; WP-F11-04 family contracts; contracts as types: sync v1 wire contract, D-080 status report with the R2 AR-13 fields, recovery key; WP-F11-02 `invite-redeem` (F, only if DR-13 keeps codes) | 4 (1) |
| S04 | BL-322 app part; WP-F11-03 | 2 |
| S05 | WP-F08-B1 evidence; ADR 0006 amendment | 2 |
| S06 | WP-F14-02 planner; WP-F14-20 M17 ledger; WP-F14-07 scheduling and cards; WP-F14-06 acknowledgment sheet with Save a copy | 4 |
| S08 | WP-F05-02 gate tooling; WP-F05-01 clamp | 2 |
| S09 | WP-F06-02; WP-F06-03 | 2 |
| S15 | WP-F00-01 component harness (pair); BL-398 StateScreen | 2 |
| S17 | COUNSEL_PACKET 1.1.0 and the delta (T05); ENGINEERING_REQUIREMENTS 1.3.0 and label 1.4.0 drafts | 2 |
| S19 | BL-002 trace; run sheet and evidence template | 2 |
| ADRs | Sync protocol v1 (S03 with S02), status report (S06), account deletion (S07 with S14's input), capabilities and kill switches (S07) | 4 |
| S03 | WP-F04-03 local v6 with G-26; the M17 ledger query | 2 |
| S10 (T14) | WP-F04-02 capture reducer; BL-370; no VoiceOver speech during a take (R3 DX-06) | 3 |
| S11 (T14) | WP-F04-07; BL-433 with BL-406 | 2 |
| S12 (T14) | WP-F01-01 | 1 |
| S13 (T14) | BL-323 | 1 |
| S14 (T14) | WP-F17-05; WP-F20-03 | 2 |
| S16 (T14) | M14 and M16 copy delta with build-state variants | 1 |
| S18 (T14) | WP-F18-01 with WP-F18-03 | 1 |

**Wave 2 (42 slots: 42 named; 11 fenced)**

| Stream | Items | Slots (F) |
|---|---|---|
| S02 | Held-draft table or columns (F); WP-F11-09s push tables (F); WP-F17-10 with WP-F16-13 server erase, reaching every M14 system (F); per-person hide column (F); words-group compare-and-set (F) | 5 (5) |
| S07 | WP-F11-09f `push-send` (F); WP-F19-16 kill-switch keys `backupUploads`, `escrow`, `statusReport`; WP-F08-B3p purge-worker steps for M14 systems | 3 (1) |
| S05 | B2 keys (per author, device key pair); B3 bucket, tables and byte quota (F); B4 recovery-key function with step-up, unwrap email and access log (F); B5a upload queue with held letters' audio; B5c restore | 5 (2) |
| S06 | WP-F14-15b status and consent tables (F); WP-F14-15c endpoint (F); WP-F14-15a client with the signed-out queue; WP-F14-21 Keep sheet move and held row | 4 (2) |
| S01 | Review M4 code rules and `new-device-sign-in` before any recovery-key use (F); WP-F19-12a `forceReauthEpoch` consumer | 2 (1) |
| S20 | M14 switch with build flags `backup` and `statusReport`; WP-F02-10 `/auth/confirm` and AASA paths on `main` | 2 |
| S03 | Held-draft sync op; words-group conflict copy; WP-F12-02 local v7 | 3 |
| S04 | WP-F11-05; WP-F11-06; WP-F11-07 with WP-F11-16; WP-F11-09c push client | 4 |
| S13 | WP-F09-02; held letters in export under `waiting/`; WP-F12-08 Quiet this book with WP-F12-09 client | 3 |
| S14 | WP-F13-02 planner; WP-F13-01 selector; WP-F13-10 hide, quiet and due-date inputs | 3 |
| S10 | Tonight Plus line and one held-letters row; microphone purpose string | 2 |
| S12 | WP-F01-07 AB 1043 age signal (pair) | 1 |
| S19 | Maestro nightly of 5 P0 flows; S1-22 two-phone evidence | 2 |
| S09 | WP-F06-05; WP-F06-06 author-layer core | 2 |
| S16 | Counsel comments folded into copy (T17) | 1 |

**Wave 3 (32 slots: 24 named, 8 reserve; 5 fenced)**

| Stream | Items | Slots (F) |
|---|---|---|
| S01 | WP-F02-04 Google sign-in (F) | 1 (1) |
| S06 | WP-F14-16 reminder email scheduler with renewal projection and production-only sends (F); WP-F19-12r | 2 (1) |
| S02 | WP-F06-07 server columns (F) | 1 (1) |
| S05 | B5b Settings row and the backup consent act; B5d turn off and delete; WP-F19-12b; B6 evidence | 4 |
| S13 | WP-F10-10 Read together skip, night surface, letter language for VoiceOver | 1 |
| S14 | WP-F13-12; WP-F13-07 prompt history with S03 v9 | 2 |
| S15 | QuietLine, SoftCard, NoticeRow, Toast in `docs/design/COMPONENTS.md` | 1 |
| S18 | Letters made and letters kept events (03 section 4.1) | 1 |
| S16 | BL-340 screenshots; BL-341 review notes | 2 |
| S17 | 1.0.0 policy texts after counsel | 1 |
| S11 | WP-F06-08a Review default state and the save vocabulary (R3 DX-08, DX-09); WP-F06-08b | 2 |
| S03, S04 | WP-F06-07 local part (S03); WP-F19-12s (S03); WP-F19-12f (S04); client fixes from C1 (1) | 4 |
| S19 | Release-candidate run sheets | 1 |
| S20 | Release workflow: IPA size and preflight | 1 |
| Reserve | M-JR blockers and criticals no named item covers (6); server fixes from C1 (2, F) | 8 (2) |

**Wave 4 (30 fix slots, W9 to W12).** S0 and S1 fixes from C1, gate failures from T33, counsel edits from T30. Nothing else merges.

Everything in a spec's section 12 that is not on this list is either built (verify inside a fix slot only if a gate fails), human or device work (section 10), cut (6.4), or 1.0.x.

### 6.4 Cuts: the P1 extras out of v1.0 now

M15 keeps every P0 feature. These P1 extras are out of v1.0 today, not when a chain slips; each moves to 1.0.x and returns through `05-feature-map.md` section 3 ranking:

| Cut | Spec | Why it is P1 |
|---|---|---|
| WP-F04-12 widget | F04 | Capture works without it |
| WP-F09-11 search | F09 | Month chapters cover finding a letter at v1.0 |
| WP-F06-10, -11, -12: lock a phrase, unsure marks, the engine audit | F06 | F06 section 11 lists them as capacity-dependent. The author-layer core (WP-F06-06, -07) stays in v1.0 because DATA-REQ-041 needs hand edits to replay (F06 section 1) |
| WP-F06-13 offered fillers; WP-F07-07 say the name three times | F06, F07 | Already P1 |
| WP-F11-13 QR invite | F11 | Link and code cover joining |
| WP-F17-08 app lock; WP-F17-15 delete everything on this phone | F17 | Account deletion covers erase in a sync build (F14-REQ-026 is P1) |
| WP-F18-02, -06, -09, -10, -14, -15: analytics extras and the automated learning loop | F18 | Consent, the guard and the letters-made events stay (03 section 4); the loop can start on 1.0.x data |
| Picking which evenings for reminders | F13 | Already "P1 if time allows" |
| WP-F16-02 `book_access` | F16 | v1.2 (D-055); R2 AR-03 |
| WP-F16-12 full load test at 2x the 1k targets | F16, 07 | Replaced by a 1-hour 1x smoke unless the founder keeps it (Q8) |

WP-F13-13, Apple's rating request, is also cut now (P1, F13); it returns in 1.0.x. If slots still run short, cut in this order before moving the date: WP-F18 letters-made events beyond `letter_kept` and `letter_held`; M-JR majors not named by a gate. After that, the date moves (M15). Two P0 cuts already approved in ROADMAP 2.1 stay available to the founder but are not the default: cut 2 (Apple and email sign-in only, no Google) and cut 4 (build without the PostHog key).

## 7. The agent fence for `supabase/**` and auth (D-041)

D-041: unattended agent runs pause for `supabase/**` and auth code until CI and branch protection are on; any PR touching them needs an independent review run and the founder's "approve migration" label. Migrations reach hosted projects only through `.github/workflows/deploy-db.yml`. After S20's wave 1 change: staging by `workflow_dispatch` from `develop` with the `approve-migration` label, production only on a `db-v*` tag through the GitHub Environment `production` (R2 AR-21). `main` stays releasable.

| Rule | Detail |
|---|---|
| Fenced paths | `supabase/**`; `apps/mobile/src/lib/auth/**`, `apps/mobile/src/lib/supabase/**`, `apps/mobile/src/app/(auth)/**`, `apps/mobile/src/app/+native-intent.tsx`; `.github/**`. Proposed additions [R]: `apps/mobile/modules/scribe-keys/**` and `apps/mobile/src/lib/backup/**` (keys), `packages/core/src/{verify,meaning,types,pipeline,plan}.ts` (already founder-approval in CODEOWNERS) |
| Who may edit | Only the owning stream: S01 (auth paths, `apple-token`, templates), S02 (migrations in its ranges, tests, APPLY), S05 and S06 (their function folders and migration ranges), S07 (the shared functions), S20 (`.github/**`) |
| Review | Two independent review agents (one security-focused) post `review/ready` and `review/security` commit statuses; branch protection requires both, then the founder's `approve-migration` label (R5 EQ-32). The fence workflow in PR #30 fails a PR on these paths without the label; S20 lands it first in wave 1. Never delegated (section 6.2) |
| Migrations | A new file; the coordinator gives it the next free timestamp at merge (section 4); never an edit to a file in `.github/migrations-applied.txt` (migration guard, which S20 adds to `required`). Never redefine a function first defined in another stream's file (S02 owns those). Every new object has an access-matrix row and an APPLY section with a check and a rollback |
| Never | Apply a migration to a remote project, set or read a secret, deploy a function, publish packs or config (COORDINATION section 6; BACKLOG rule 8) |
| Until branch protection is on | Unattended runs take only `packages/*` and `docs/` work (BACKLOG rule 9). Interactive streams may still open fenced PRs; nothing fenced merges without the label |
| Server features | No build with the switch on goes to anyone outside the founding family until R-17 passes (T16), and no outside family signs in before counsel has commented on the M14 policies (T17; R4 PT-31) |

## 8. Working with the architects

"Architect" here means the reviewers who shape how: the delivery lead (this file), area review agents for data, security, mobile and platform, and the founder, who decides. Agents build the spec default while a decision is open (09 section 1).

### 8.1 What needs an architecture review and an ADR

| ADR (drafts at T13, decided at T15) | Closes | Author stream | Existing record |
|---|---|---|---|
| Sync protocol v1, as built: ops and results, the `sync_xid` watermark with `statement_timeout` and the oldest-transaction alert, removal digest, restore epochs, op receipts keyed by person, API versioning and N-1 support, compare-and-set for the words group, the frozen v1.0 wire contract, held drafts as author-only rows | R2 AR-01, AR-02, AR-14 (watermark), AR-31, AR-32; R3 DX-01 | S03 with S02 | Supersedes ADR 0004 |
| Owner backup v1.0: key per (child, author), a device key pair per install, recovery-key re-wrap rules and step-up (session under 10 minutes old, email on every unwrap, 24 h hold on a new device unless an enrolled device approves, at most 3 unwraps a month), recovery-key custody (generated offline, two sealed copies apart, `kek_version`, rotation runbook), object envelope with the wrapped key and a keyed hash, upload ordering and no move after upload, byte quota, lapse and retention, disaster recovery for Storage and the secret; the access log M16 promises (who can unwrap, how, every use logged, release check that only the recovery function reads the secret) | R2 AR-05 to AR-11, AR-33 to AR-35; R4 PT-02, PT-03, PT-19; M16 | S05 | Amends ADR 0006 |
| Subscription status report: fields, `sub_ref` as a salted hash of the original transaction id, an `environment` field with emails only in production, store by (profile, `sub_ref`), renewal projection while not cancelled, the signed-out queue, a minimal billing-notice record kept after account deletion while Apple still bills (counsel), consent record retention (counsel) | R2 AR-13; R4 PT-08, PT-09, PT-10 | S06 with S07 | Amends ADR 0013 |
| Account deletion across systems: one matrix (system, data, step, owning stream, test) including `audio_blobs`, `child_keys`, unwrap logs, device keys, status and consent records, push tokens, notify outbox, op receipts; Keychain keys removed on each device at next launch; what book deletion, leave and Erase everything each do | R2 AR-22, AR-23; R4 PT-28, PT-29, PT-34 | S14 with S07 | New |
| Capabilities and kill switches: build flags `backup` and `statusReport`, remote switches `backupUploads`, `escrow`, `statusReport`, a cache policy that meets the kill-switch bar, two signing keys and rotation | R2 AR-12, AR-27, AR-28 | S07 with S20 | Amends ADR 0016 |
| Email links: PKCE and when a link is accepted | BL-347; R4 PT-20 | S01 | AUTH_SETUP; must merge before the recovery function deploys |
| Push from Edge Functions: APNs key custody, payload rules, token lifecycle, entitlement | WP-F11-09a | S07 | New, after the spike |
| ADR 0017 accepted with deltas: classes and budgets for the recovery function, uploads, status report and push | R2 AR-15 | S07 | ADR 0017 |

Other changes that still need an ADR or a decision entry: a new SDK, native module or vendor (ADR 0101, ADR 0016 for size); a remote-config key that changes behaviour (ADR 0016; B14 never list); edit engine semantics (ADR 0014, founder approval); visibility of letters between parents (F11 section 8, 09 R-09); a new package or top-level folder (ADR 0010).

ADR numbers: 0018 and 0019 are already used on agent branches (commit 97c2c7d); the next ADR on `develop` takes 0020 or later [R], checked against open branches first.

### 8.2 Cadence

| When | What | Who |
|---|---|---|
| Tuesdays and Thursdays, 30 minutes [R] | Architecture review: open ADR PRs (label `adr`), cross-stream requests older than a day, fence findings | Delivery lead, area review agents; founder for decisions |
| Within 2 working days of an ADR PR | Decide, or the spec default stands and the PR says so | Founder |
| T38 (each Friday) | Delivery review: merges against section 6.1, critical path against section 2.4, confidence in 2.2 re-read, next week's slots by stream, P1 cuts proposed if a chain slips | Delivery lead, founder |
| After each wave | The coordinator mirrors `BOARD.md` and decisions into the Project doc (COORDINATION section 7) | Coordinator |

### 8.3 The checklist a PR must pass

Everything in `07-quality-bar.md` section 1 (tests with requirement IDs in titles, lint, content rules and the constitution, accessibility, review, reporting) and `.github/pull_request_template.md`, which S20 extends with the headings below (R5 EQ-22). M14 to M17 add these lines:

1. The change works with `EXPO_PUBLIC_SERVER_FEATURES` off and on; a test covers both where the code branches on `capabilities`.
2. Every server call has a kill switch consumer and fails to a working local state (LEGAL-REQ-040; F19-REQ-011).
3. Nothing reaches a server before the consent that covers it (sensitive-data consent, `SCCON`; analytics opt-in).
4. Paths stay inside the stream's globs; any request to another owner is listed in the PR body.
5. Fenced paths carry two review verdicts and the founder's label.
6. The PR body names the WP or BL id and `Satisfies:` requirement ids; CI fails a body without them.
7. No copy claims more than the system does: backup copy follows M16 (encrypted; we hold a recovery key under logged access; never read, sold or used to train models; no "only your family's keys"), and held-letter copy follows F14 section 6.2.
8. A UI change has an AX5 component test once WP-F00-01 merges; until then the Done when says "AX5 by device script" and the evidence file is linked.


## 9. Wave 1 dispatch briefs

The coordinator pastes the common header, then the stream's row. Each row is one agent run of one to four PRs, matching that stream's wave 1 items in section 6.3. Where a row says "verify first", the backlog status may be stale against code merged on 13 Oct (PRs #94, #103, #104) or the WIP branch: check, and close with evidence if the work is done.

**Common header (paste first, replace `Sxx`):**

```
You are stream Sxx of Early Letters, repo thesaurabhpareek/earlyletters. Branch from origin/develop.
Read: CLAUDE.md; docs/agents/COORDINATION.md; docs/prd/v2/_AUTHORING.md sections 3b, 6, 7;
docs/prd/v2/08-delivery.md sections 3.3 (your row), 4, 6.2, 6.3 (your items), 7 and 8.3;
docs/prd/v2/07-quality-bar.md section 1; the spec sections named in your brief.
Then add your claim line to docs/agents/BOARD.md.
Rules: edit only the files your stream owns (08 section 3.3). One WP or BL per pull request.
Branch <type>/<area>-<wp-or-bl>-<slug>. PR title "WP-F##-##: ..." or "BL-###: ...". PR body:
Satisfies (requirement IDs), WP or BL id, Data classes touched, Requests to other owners,
Switch off and on, How it was checked.
Test titles start with the requirement ID in brackets. Fixtures use the fictional family Asha only.
If COORDINATION section 6 allows agents to push (founder answer Q3), push only your own branch
and open a PR; if it does not, stop at a local commit and attach the patch to your report.
Never push to develop or main, apply a migration, set or read a secret, deploy, publish packs or
config, or edit a requirement document. Migration files get their timestamp at merge.
If your work is on branch auto/2026-10-05-fixes, start from your files there.
Finish with a report: files changed, tests with counts, what needs a real iPhone,
what the founder must do, requests to other owners, what is unfinished, facts versus assumptions.
```

| Stream | Dispatch | Scope | Files | WPs and tasks | Tests | Done when |
|---|---|---|---|---|---|---|
| S01 | T03 | Close security review H1 and H3. H1: email links use PKCE; a link is accepted only while this phone has a pending request, else route to "type the code"; local letters move to an account only after a screen that shows the masked account email and a tap; a link is refused while another account is signed in (R4 PT-20). H3: capture the Apple refresh token after Apple sign-in through a new `apple-token` function so deletion can revoke it. Draft the PKCE ADR note | `apps/mobile/src/lib/auth/**`, `lib/supabase/**`, `app/(auth)/**`, `app/+native-intent.tsx`, `supabase/functions/apple-token/**` (new), `docs/ops/AUTH_SETUP.md`, `apps/mobile/test/auth-*.test.ts` | BL-347, BL-330 (WP-F02-03 rest); review appendix PoC steps; F02 sections 7 and 11 | The H1 proof as a regression test that fails on today's code; `[A-REQ-033]`, `[F02-REQ-004]`, `[A-REQ-018]`; Deno tests for `apple-token` in `npm run test:functions` | `review/ready` and `review/security`, the founder's label; deploy steps for FT-11 in AUTH_SETUP; no change outside the globs |
| S02 | T03 | Finish BL-331 with BL-332: review M1 (members read birth year and due date from `children`), M5 (`sync_pull` digest reveals a private write), L1 (op receipts keyed by person and op id), M3 rate limits; `peek_invite(token)` showing only the inviter's sign-off name before consent, with BL-334 pepper failing closed, in one file; then WP-F11-01; then the wire-contract columns once the sync ADR draft exists (T13) | New migration files (timestamp at merge); `supabase/tests/**`; `supabase/APPLY.md` | BL-331, BL-332, BL-334, `peek_invite` (G-13), G-08 to G-12, WP-F11-01; security review sections 3 to 5 | Each review PoC rewritten as a regression test; access-matrix rows for every new object; `npm run test:db` and `npm test` (mobile sync-e2e runs this SQL) | APPLY section with check and rollback; both statuses and the label; error codes listed for S04 and S03 |
| S04 | T03 | BL-322 app part: an invite asks before it joins and never switches the open book by itself; map `SCCAP` to "parents full"; Family uses `leave_child` and `remove_child_member`; one idempotency key per user action (G-07). WP-F11-03: pure invite and permission rules in core. Code against the `peek_invite` contract with a stub until S02 merges | `apps/mobile/src/lib/family/**`, `components/family/**`, `app/invite/**`, `app/(tabs)/family.tsx`, `packages/core/src/{invite,family-rules}.ts` (new) and tests, `packages/content/src/features/family.en.ts` | BL-322, WP-F11-03, G-02, G-07; F11 sections 6 and 7 | `[F11-REQ-006]`; `canDo` matrix equals F11 table 6.2; code normalisation (case, dash, O and 0); invite-link tests | Works with the switch off and on; `review/ready`; requests to S07 for family contracts |
| S05 | T03 | WP-F08-B1 spike on a spike branch: a synchronizable Keychain item made on phone A appears on phone B (same Apple Account) and deletes from both; AES-GCM time for a 15 MB file on the SE 3; an upload that resumes after a kill. Draft the ADR 0006 amendment with the R2 AR-05 to AR-11 and AR-33 to AR-35 decisions and the M16 access log (who can use the recovery key, how, every use logged) | `apps/mobile/modules/scribe-keys/**` (new), a new evidence file `docs/qa/evidence/<date>-F08-B1.md`, a new ADR file | WP-F08-B1; F08 section 6.5; ADR 0006; R2 ADR list item 2 | Module unit tests for wrap, unwrap and wrong-key refusal; the device steps as a checklist | Evidence with numbers, or what failed; ADR draft opened by T13; nothing merged from the spike branch except the evidence and the ADR |
| S06 | T03 | BL-342: WP-F14-02 pure reminder planner keyed on the free period and offer type (R4 PT-10); WP-F14-07 scheduling and in-app cards; WP-F14-06 acknowledgment sheet with Save a copy and the Plan terms row. WP-F14-20: the M17 ledger in `lib/billing` (own letters only; a letter counts at a Keep where its words are on screen; never heal upward from another author's rows) and the query request to S03. Draft the status report ADR (T13) | `apps/mobile/src/lib/billing/**`, `components/plus/**` (new), `app/settings/plus.tsx`, `packages/core/src/plan-notices.ts` (new), `packages/core/test/plan*.test.ts`, `packages/content/src/features/billing.en.ts` | BL-342 (WP-F14-02, -06, -07), WP-F14-20; F14 sections 6 and 7 | `[PRD-REQ-003]` over a synthetic year; `[C-REQ-025]`, `[C-REQ-026]`, `[F14-REQ-008]`, `[F14-REQ-010]`, `[F14-REQ-011]`, `[F14-REQ-020]`, `[F14-REQ-036]`, `[F14-REQ-037]`, `[F14-REQ-044]` | No change to `plan.ts` without the founder's approval; copy marked for counsel; `review/ready` and `review/security` (payments) |
| S07 | T03 | WP-F19-05 (BL-325): ignore a same-version document with a different body; treat kill-switch config older than the staleness limit as stale. WP-F11-04: family contracts (`parents_full` for `SCCAP`, leave and remove endpoints, G-17). Draft the capabilities ADR and, with S14's input by request, the account deletion ADR (T13). Contracts as types only: the sync v1 wire contract with every column (R2 AR-31), the D-080 status report with `sub_ref`, `environment` and the signed-out queue (R2 AR-13), the recovery-key contract for S05. | `apps/mobile/src/lib/remote/**`, `packages/api/**` | WP-F19-05, WP-F11-04, G-17, G-18; F19 section 11; ADR 0016, ADR 0017 | `[F19-REQ-008]`; `documents.test.ts`; type tests; error enums equal the migration's codes | Contracts reviewed by S04, S05 and S06; `npm test` green |
| S08 | T03 | WP-F05-02: harness fixes and gate tooling (Devanagari tokens with `\p{M}`, Chinese CER, per-phrase language, report JSON, `experiments/gate.ts` new). WP-F05-01: clamp and `isFinite` checks in the decode module (review L9). Write the S1-17 run sheet for the T11 device session with S19 | `experiments/**`, `apps/mobile/modules/scribe-audio/**`, `apps/mobile/test/transcribe-*.test.ts` | WP-F05-02, WP-F05-01 rest, BL-324 audio part; F05 sections 7.1 and 11 | `score.test.ts` cases for Devanagari and Chinese CER; `[F05-REQ-003]` report schema test | A gate report can be produced from a recordings folder; run sheet handed to S19 |
| S09 | T03 | WP-F06-02: invisible-character guard (D4), remaining quote styles (D7), closed agreement table with no noun plurals (D9); then WP-F06-03 | `packages/core/src/{meaning,verify,protect,types}.ts`, `packages/core/test/verify*.test.ts` | WP-F06-02, WP-F06-03; F06 section 7.1; 09 R-01 | `[F06-REQ-003]`, `[F06-REQ-006]`, `[F06-REQ-007]`; golden master changed only where a case asserted a defect, each listed | Founder approval in the PR (CODEOWNERS); `ENGINE_VERSION` comment if behaviour changed |
| S15 | T03 | WP-F00-01 (pair): one component render harness for React Native screens in `apps/mobile`, library chosen with the founder, with one example AX5 test. BL-398: one StateScreen for empty, error and loading, and one inline caution card | `apps/mobile/src/components/ui/**`, `apps/mobile/test/{design-system-gaps,theme-leaks}.test.ts`, the harness files; the package line goes to S20 as a request | WP-F00-01, BL-398; `docs/design/` component specs; ADR 0101 | The example AX5 test runs in CI; component tests at default and AX5; VoiceOver labels and roles | Adoption requests posted to S10 to S14; harness usage note in `docs/design/` |
| S17 | T03 | COUNSEL_PACKET 1.1.0 for T05: a one-page table of what M14 and M16 changed (recordings backed up with a recovery key we hold under logged access, letters held on our server, status report and emails, co-parent sharing, accounts and deletion) and the R4 counsel questions in R4's order; redlines for the Privacy Policy, Terms of Service 6.2 and 12.4, Consumer Health Data notice, in-app disclosures, subprocessors, data policy, Subscription Terms; ENGINEERING_REQUIREMENTS 1.3.0, DATA_CLASSIFICATION, DELETION_AND_EXPORT_SPEC and a privacy label 1.4.0 draft | `docs/legal/**` | M14, M16, D-073, D-080, D-081, BL-338; R4 PT-01, PT-05, PT-06, PT-24; F17 section 8, F14 section 13 | Docs lint; ASCII-only check | A package the founder can send at T05; every change cites its decision; marked "not legal advice" |
| S19 | T03 | BL-002: `scripts/trace.mjs` checks every cited ID exists, fails on a requirement id defined in two specs' section 7, writes `docs/TRACE.md` in report mode. Update the evidence template for M14 rows (S1-06 to S1-09, S1-22, WP-F08-B1). Write the T11 device session as an ordered run sheet with times | `scripts/trace.mjs` (new), `docs/qa/**`, `docs/TRACE.md` (new) | BL-002, BL-279; ADR 0011; `docs/qa/DEVICE_TEST_PLAN.md`; R5 EQ-05 | Trace script unit tests; `npm test` runs it in report mode | Run sheet reviewed by S08 and S05 and in the founder's hands before T11 |
| S20 | T03 | The website hotfix on `main` (T06). Rebase and land PR #30 with `migration-guard`, `expo lint` and docs lint added to `required` and the PR template headings. Staging deploys from `develop` by `workflow_dispatch` with the label. BL-349 privacy manifest (from G-23). Prepare, but do not merge, the M14 switch PR with build flags `backup` and `statusReport` | `.github/**`, `apps/mobile/{eas.json,app.config.ts}`, `apps/mobile/src/lib/capabilities.ts`, `apps/mobile/test/{capabilities,config}.test.ts`, `apps/mobile/scripts/**`; on `main`: `apps/web/**` | BL-349, BL-117, M14 switch, R2 AR-12, AR-21; R4 PT-04; R5 EQ-09, EQ-22 | Privacy-manifest test; capabilities test expects `on` only where flipped; the fence workflow fails a planted `supabase/**` change without the label | Switch PR waits for T16 and the founder; preflight output attached; `review/ready` and `review/security` |
| S03 | T03 | WP-F04-03: local v6 (draft kind, occurred date, precision, language) and its store functions; G-26: local `entries.language` and its sync mapping (upsert, `changed`, ALL_GROUPS). The M17 ledger query for S06: rows authored by this person or with no author. Draft the sync protocol ADR with S02 (T13) | `apps/mobile/src/lib/db/**`, `lib/store.ts`, `lib/sync/**`, `apps/mobile/test/{migrations,store.*,sync-*}.test.ts` | WP-F04-03, G-26, WP-F14-20 query; F04 section 11, F16 section 11 | Migrator test from v0 to v6 with counts and hashes unchanged; `[DATA-REQ-044]` retry; sync-outbox and sync-e2e green; `[F14-REQ-036]` query case | Data-map rows sent to S17; `review/ready` |
| S10 | T14 | WP-F04-02: the pure capture reducer and constants in `packages/core/src/capture.ts` (new). BL-370 app part: a crash is never a blank page, using S15's state screen; root wiring line to S20. No VoiceOver announcement after "Listening" during a take; elapsed time on demand (R3 DX-06) | `packages/core/src/capture.ts` (new) and test, `apps/mobile/src/lib/capture/**`, `lib/resilience/**`, `components/resilience/**`, `app/listen.tsx` | WP-F04-02, BL-370, BL-380; F04 sections 6 and 7 | `[F04-REQ-001]`, `[F04-REQ-003]`, `[F04-REQ-006]`, `[F04-REQ-007]`, `[F04-REQ-008]`, `[F04-REQ-010]`; `resilience.test.ts`, `keep-awake.test.ts` | Verify first against PR #93 and #104; `review/ready` |
| S11 | T14 | WP-F04-07 typed part: typed text is saved byte for byte (no `normalizeChars` on the typed path in `review.tsx`). BL-406: Write and Review buttons say what they do. BL-433: "Nothing was changed" only when true | `apps/mobile/src/app/review.tsx`, `components/capture/transcript.tsx`, `components/review/**` (new), `packages/content/src/features/words.en.ts` | WP-F04-07, BL-406, BL-433; F04 section 7, F06 section 6 | `[F04-REQ-012]` byte equality with Arabic, Devanagari and emoji fixtures; `[F06-REQ-037]` | Verify first against PR #103; `review/ready` |
| S12 | T14 | WP-F01-01: on No, the gate deletes any pending invite token; brand placeholder in the stop copy; re-ask wording. BL-383 calm not-found screen; BL-426 the under-18 stop mentions the way back. Verify BL-385 and BL-386 against PR #94 | `apps/mobile/src/lib/age-gate*.ts`, `components/gate/**`, `app/+not-found.tsx`, `apps/mobile/test/age-gate.test.ts` | WP-F01-01, BL-383, BL-426; F01 sections 6 and 7 | `[F01-REQ-001]`, `[F01-REQ-002]`; existing gate tests green; AX5 by device script until WP-F00-01 merges | `review/ready`; BL-385 and BL-386 closed with evidence or scoped |
| S13 | T14 | BL-323: export carries the person's consent history and dictionary terms (review L4), from the export changes on `auto/2026-10-05-fixes` | `apps/mobile/src/lib/export/**`, `apps/mobile/test/{export-*}.test.ts`, `apps/mobile/test/__golden__/**` | BL-323; F15 section 7 | `[DATA-REQ-050]`, `[DATA-REQ-051]` schema tests; export golden test | Format version bumped and documented; `review/ready` |
| S14 | T14 | WP-F17-05: a pure delete-flow reducer (`packages/core/src/deletion-flow.ts`, new) for subscriber, Family Sharing, co-parent book, sole book, offline, no passcode. WP-F20-03: one crisis resource list in `packages/core/src/safety.ts`. | `packages/core/src/deletion-flow.ts` (new), `packages/core/src/safety.ts`, their tests | WP-F17-05, WP-F20-03; F17 section 6, F20 section 7 | `[F17-REQ-018]`, `[F17-REQ-022]`; `[F20-REQ-004]` | Strings requested from S16; `review/ready` |
| S16 | T14 | WP-F21-01: a build-state claim set (`packages/content/src/claims.ts`, new) and `SHIPPING_LANGUAGES`. The M14 and M16 delta: every string that says letters or recordings stay only on this phone, that there is no backup, that co-parent sharing is coming soon, or that we never email about Plus gets a server-on variant chosen by build state; backup lines follow M16; `sensitiveConsent.body` names the co-parent (G-21) | `packages/content/src/{strings.en,store.en,site.en}.ts`, `packages/content/src/claims.ts` (new), `packages/content/test/**` | WP-F21-01, G-21, BL-390; F21 section 7; M16 | `[F21-REQ-002]`, `[F21-REQ-003]`, `[F21-REQ-004]`; content rules and no-real-family-data green | Each changed claim listed for counsel; `review/ready` |
| S18 | T14 | WP-F18-01: with no provider key there is no consent sheet and no switch. WP-F18-03: guard tests (no analytics keys in remote config, one-file SDK imports, ad SDK denylist), from the consent changes on `auto/2026-10-05-fixes` (G-24) | `apps/mobile/src/lib/analytics/**`, `components/consent/**`, `packages/analytics/**`, `scripts/ci/sdk-guards.mjs` (new) | WP-F18-01, WP-F18-03, G-24; F18 section 7 | `[F18-REQ-003]` both ways; `[F18-REQ-007]`, `[F18-REQ-010]` and `[LEGAL-REQ-016]` fail on a planted import | CI line requested from S20; `review/ready` |

## 10. Devices, and what only a real iPhone, Apple, counsel or the founder can do

### 10.1 Devices and who keeps each

| Device | Have it? | iOS | Keeper | Runs |
|---|---|---|---|---|
| iPhone SE (3rd gen) A | Owned (07 section 2.7) | Latest | Founder | Daily development build; backup phone A (founder's Apple Account); speech per language; StoreKit sandbox |
| Current iPhone | Owned (07 section 2.7); model not recorded | Latest | Founder | Backup phone B (same Apple Account); candidate smoke; co-parent phone A |
| iPhone SE (3rd gen) B | Not owned. Buy used, about US $150 to $250 [A] (`docs/FOUNDER_TASKS.md` costs); order at T12 | iOS 17, never updated (iOS does not downgrade, R5 EQ-03) | Device operator | Full candidate suite at the iOS floor (if Q-002 keeps iOS 17); kill runs; the reminder lab run (T31); co-parent phone B on a second Apple Account |
| iPhone 12 | Not owned. Borrow, or buy used about US $250 to $350 [A] | Latest | Device operator | Speech speed row S1-17 only. If none by T15, the row is recorded "not measured" and the speed gate uses the SE 3 [R] |
| iPhone 15 class | Unverified: the owned current iPhone may be one | Latest | Founder | Speech speed row S1-17 |
| A second Apple Account in the founder's Apple Family | Sandbox testers in App Store Connect (FT-09) [A] | n/a | Founder | S-7 Family Sharing; F14-U08 and F14-U21 (co-parent inside and outside the payer's Apple Family) |

The **device operator** is a paid person who runs scripted device sessions from S19's run sheets and files the evidence (07 Q5, Q9). Cost is unknown; the founder sets it at T12. Without one, the hours in 10.2 fall on the founder.

### 10.2 Device hours by week [E]

| Week | Device work | Devices | Founder h | Operator h |
|---|---|---|---|---|
| W0 | First build installed; DEVICE_TEST_PLAN P-01 to P-03 | SE 3 A | 3 | 0 |
| W1 | FT-22 spikes (T11): speech per language (S1-15 to S1-19), StoreKit D-1 to D-12, three sign-ins, deletion, size; WP-F08-B1 on two phones, one Apple Account | SE 3 A, current | 8 | 0 |
| W2 | Speech speed S1-17; WP-F06-01 Hermes fixtures; WP-F10-01 playback interruptions; WP-F13-08 notifications | SE 3 A, iPhone 12 | 1 | 8 |
| W3 | DL-01 and DL-02 (50 kills each on the SE 3), typed and Review kills, VoiceOver V1 and V4, WP-F04-01 | SE 3 B | 1 | 10 |
| W4 | G3 for C1 (T19): deletion in staging, kill-switch drill, S1-22 two-phone sync on two Apple Accounts | current, SE 3 B | 2 | 6 |
| W5 | Co-parent flows S1-09 and push; C1 build smoke | current, SE 3 B | 0 | 6 |
| W6 | Regression of C1 fixes | SE 3 B | 0 | 3 |
| W7 | B6 round 1 (T25): 20 recordings, with and without iCloud Keychain | SE 3 A, current | 3 | 6 |
| W8 | Backup-on build smoke; S2-13 account deletion; S2-14 Apple revocation | SE 3 A, current | 1 | 6 |
| W9 | Regression on fixes; S2-15 reminders set-up | SE 3 B | 0 | 8 |
| W10, W11 | Start and check the 14-day reminder lab run (T31) | SE 3 B | 0 | 3 |
| W12 | Candidate run (T33): full suite on SE 3 B (about 20 h), smoke on the current iPhone (2 h), B6 round 2 (3 h), TF-01 size, TF-03 update over an older build, TF-05 iPad, TF-06 oldest iOS | all | 6 | 20 |
| **Total** | | | **25** | **76** |

### 10.3 The candidate suite, cut to what a phone must prove [R]

R5 estimates 35 to 45 device hours per candidate if every line runs on two phones (EQ-03). Recommendation for the 07 owner (R5 EQ-03, EQ-31): run the full `[manual]` suite once per candidate on SE 3 B at the iOS floor; run a 2-hour smoke on the current iPhone on the latest iOS; do not re-run `[auto]` lines on a phone unless they are tagged E2E. That is the about 22 hours in W12 above.

### 10.4 Human-only items not already in 2.1

| Item | Who | When | Evidence | Unblocks |
|---|---|---|---|---|
| FT-07 key, FT-08 record (the `.preview` id first, per `docs/release/TESTFLIGHT.md`) | Founder, Apple | With T04 | DEVICE_TEST_PLAN P-01 to P-03 | All device work |
| APNs key for push | Founder | Before WP-F11-09a, wave 2 | Key in the secret store | `push-send` |
| WP-F08-B8 recovery-key ceremony: key made offline, two sealed copies kept apart, public key to S07 (R2 AR-07) | Founder | Before B4 deploys, before T23 | Checklist in the evidence file | The recovery function |
| Founder approval of the signed config publish | Founder | Before the T19 kill-switch drill | Publish log | Kill-switch drill |
| `develop` staging run with every migration | Founder (label), S20 | For T16 | Deploy run | R-17 gate |
| DR-10 (18+ gate meets SB 2420), AB 1043 handling, F14 Q-C1 (both reminder channels meet 17602) | Counsel | T17 | Counsel notes | T20, T30 |
| D-004 publisher hedge (DR-11) | Founder with counsel | T15 | DECISIONS entry | First published policy names the right controller (R4 PT-30) |

## 11. Open questions for this plan

| Q | Who answers, by when | What changes |
|---|---|---|
| Q1 Is Apple enrolment Active, and since when? | Founder, T02 | Every device date moves day for day past T09 |
| Q2 How many founder hours a week are really available for reviews, including W6, W10 and W11? | Founder, T02 | Section 6.1 slots and therefore the date |
| Q2b May the coordinator merge the delegated classes in section 6.2? | Founder, T02 | 4 slots a week; without it, submission moves about four weeks |
| Q3 COORDINATION section 6 says agents never push and the coordinator commits, while recent work reached `develop` as pull requests (#96, #103, #104). May agents push their own branches and open PRs? | Founder, T02; coordinator edits COORDINATION before T03 | Section 9 header |
| Q4 Data-map rows by request to S17 instead of "same PR" | Founder, T02 | 07 section 1.2 item 4 |
| Q5 C1 length: accepted as T22 to T34 | Answered by this plan (D-045's 21 days met) | None |
| Q6 PR #2 (`develop` to `main`) was blocked by the migration guard on 3 Oct. With staging from `develop` (S20), PR #2 can close or wait for the release | S20, T03 | Staging path |
| Q7 Supabase Pro from T20 (about $25 a month per project [U], FOUNDER_TASKS costs) and the GitHub plan for branch protection on a private repo | Founder, T15 | T20; the fence |
| Q8 WP-F16-12 load test: BACKLOG defers BL-282 to after launch; 07 G4 asks for 2x the 1k targets. Recommendation: a 1-hour 1x smoke as the G4 item [R] | Founder with S19, T15 | G4 list (07 owner) |
| Q9 Who is the device operator, at what cost? | Founder, T12 | Section 10.2 |
| Q10 Approve a scoped external security test on staging (auth, access rules and pull parity, invites, recovery key, deletion) as a submission gate? Cost unknown [R] (R4 PT-21) | Founder, T15 | T24; G4 (07 owner) |

## 12. Sources

- Decisions: `_AUTHORING.md` sections 3 and 3b (M1 to M17); `docs/DECISIONS.md` on `develop` D-023, D-041, D-045, D-055, D-069, D-073, D-080 to D-088; `09-decisions-and-risks.md` DR-01, DR-07, DR-10, DR-11, DR-13, DR-16, DR-17, R-01, R-04, R-09, R-11, R-16, R-17.
- Critique round 1: `reviews/R1-product-leader.md`, `R2-architect.md`, `R3-design-research.md`, `R4-privacy-trust.md`, `R5-eng-qa.md`, `R6-fact-check.md`, `STALE-OUTSIDE-PRD.md`; dispositions in `reviews/DISPOSITION-A.md`.
- Plans: `docs/ROADMAP.md` 2.1 sections 0 to 9; `docs/FOUNDER_TASKS.md` (FT-01 to FT-57, hours, costs at a glance); `docs/BACKLOG.md` on `develop` (rules, status at a glance, line 62 gate row, M5, M8, M12, M-JR, BL ids as cited); `docs/backlog/FUTURE.md` (OPEN-02 estimate, December review slowdown [U]); `docs/backlog/future/06-coparent-sharing-v1-1.md` section 3.
- Specs: section 12 of every file in `features/`; `05-feature-map.md` sections 2, 4, 5; `06-nfr.md`; `07-quality-bar.md` sections 1, 2.7, 4, 5, Q5, Q6.
- Operating system: `CLAUDE.md`; `docs/agents/COORDINATION.md`; `docs/agents/BOARD.md`; `docs/adr/0004`, `0006`, `0011`, `0013`, `0016`, `0017`; `.github/CODEOWNERS`; `.github/pull_request_template.md`; `.github/workflows/{ci,migration-guard,db-cli,deploy-db,nightly,testflight}.yml`; `supabase/APPLY.md`; `docs/ops/DEPLOY.md`.
- Evidence: `docs/qa/DEVICE_TEST_PLAN.md`; `docs/reviews/2026-10-04-security-privacy.md`; `docs/release/TESTFLIGHT.md`; `apps/mobile/eas.json`; `apps/mobile/src/lib/capabilities.ts`; `apps/mobile/src/lib/db/repos/ledger.ts`; `packages/api/src/keys.ts`; `.github/migrations-applied.txt`; branch `auto/2026-10-05-fixes`; GitHub open-PR list (13 Oct, via R5); calendar weekdays checked with `date` on 13 Oct.
