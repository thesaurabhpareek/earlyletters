# 08. Delivery: the re-plan, 20 work streams, waves and the first dispatch

Status: Draft V2, 13 Oct 2026. Written after M14 (server features on for v1.0, `_AUTHORING.md` section 3b). Owner: delivery lead (the architect partner to the PM). The founder merges every pull request. This file replaces the calendar in `docs/ROADMAP.md` 2.1 sections 2 and 3 for v1.0; ROADMAP keeps its risks, cuts and "cannot be compressed" table until the PM lane updates it. Where `07-quality-bar.md` sections 4 and 5.2 still carry the older calendar (C0 from 9 Nov, C1 from 14 Dec, submission 11 Jan 2027), this file governs the dates and 07 governs the gates.

Labels follow `_AUTHORING.md` section 6: **[F]** fact with a source, **[A]** assumption with how we check it, **[E]** estimate, **[D]** founder decision, **[R]** recommendation.

## 0. How to read this file

- **Founder:** read section 1 (where we are), section 2 (the new date, what it depends on, your tasks by week) and section 10 (what only you, Apple, counsel or a real iPhone can do).
- **Architect:** read sections 3 to 8: who owns which files, the waves, the merge budget, the fence and which decisions need an ADR.
- **Agent:** find your stream in section 3, then your brief in section 9. Stay inside your files. Anything outside goes in the PR body as a request (section 4).

## 1. Where we are on 13 Oct 2026

Checked against `origin/develop` at ed16ca3 (13 Oct, after PRs #86, #91, #100, #103 and #104 merged that day) and the GitHub API. The V2 feature specs were checked at 6482cd3 (4 Oct); five merges landed since.

| Area | State on 13 Oct | Source |
|---|---|---|
| Founder setup (FT-01 to FT-20) | No FT box is ticked in `docs/FOUNDER_TASKS.md`. Repo-visible outputs of founder steps are absent: `TRUSTED_SIGNING_KEYS` in `packages/api/src/keys.ts` is empty (FT-16), `apps/mobile/app.config.ts` has no `extra.eas.projectId` (FT-17), and `.github/migrations-applied.txt` lists 2 of the 12 migration files (FT-10, FT-23 not recorded). Whether Apple enrolment (FT-01) is Active is not recorded anywhere this session can read | [F] files named |
| First build on a real iPhone | None made. `docs/release/TESTFLIGHT.md` (dated 4 Oct, merged 13 Oct in #100) says no build has been made and nothing uploaded | [F] |
| Server switch | All four `apps/mobile/eas.json` profiles (development, preview, production, testflight) set `EXPO_PUBLIC_SERVER_FEATURES=off`; `apps/mobile/src/lib/capabilities.ts` still describes v1.0 as on-device | [F] |
| Security fixes M14 names | BL-330 (Apple token capture), BL-347 (email-link hijack, review H1) and BL-322 (invite asks first, H2 app part) are `ready`, not built. BL-331 is `in-progress`: `supabase/migrations/20261005000000_family_cap_language_idempotency.sql` holds the parent cap and invite fixes; review M1, M5 and L1 are open (gaps G-08 to G-10 on branch `auto/2026-10-05-fixes`, a 13 Oct snapshot of agents "interrupted by weekly limit" that changes no file under `lib/auth` or `supabase/`) | [F] `docs/BACKLOG.md`; `git diff --stat` of that branch |
| Recording backup (D-073) | Not built. WP-F08-B1 to B6 all "Not built" | [F] F08 section 12 |
| Status report and reminder emails (D-080) | BL-357 and BL-358 `ready`, BL-359 `blocked` | [F] BACKLOG M8 |
| On-device plan reminders | BL-342 `ready` | [F] BACKLOG |
| Journey review backlog | M-JR: 65 tasks (5 blocker, 45 major, 15 minor); 56 ready, 8 wait on FT-52 to FT-57 | [F] BACKLOG M-JR |
| Open pull requests | 34, the oldest #2 (`develop` to `main`, 3 Oct) | [F] GitHub API, 13 Oct |
| Decisions M14 changes | D-085 amends D-073 to "no backup in v1.0"; D-087 hides "I was invited" and the "Family can read" switch; D-088 keeps the "Data Not Collected" label. M14 reverses the first two and makes the third untrue once accounts exist. None is logged yet; next free id is D-089 | [F] `docs/DECISIONS.md` on develop |

**The honest read.** Code is ahead and the server half is mostly written, but none of it has run on a phone or against a configured project. The week-1 founder steps that ROADMAP 2.1 put on 5 to 9 Oct are not recorded as done, so the old calendar has already slipped by at least a week before M14 adds anything. M14 then adds four things that cannot be compressed: the security fixes before any outside sign-in, migrations on staging and production, the encrypted backup with a two-iPhone restore drill, and counsel on privacy text for server-stored letters.

## 2. The re-plan with M14

### 2.1 What moves

| Milestone | ROADMAP 2.1 | V2 re-plan | Why |
|---|---|---|---|
| First development build on a real iPhone (FT-17) | Fri 9 Oct | Fri 16 Oct, Mon 19 Oct at the latest | Not recorded as done; needs FT-01 Active |
| Device spikes (FT-22) | 12 to 16 Oct | 19 to 23 Oct | Follow the first build. M14 adds three sign-ins, two-phone sync and the backup spike (WP-F08-B1) on two iPhones on one Apple Account |
| Staging with every migration (FT-10) | Thu 8 Oct | Fri 23 Oct, after the security migration merges | 2 of 12 files applied [F]; staging deploys only on a push to `main` (`.github/workflows/deploy-db.yml`) |
| Production database on Supabase Pro (FT-23) | Tue 13 Oct | Wed 28 Oct, empty until the R-17 gate passes | 09 R-17: no real family data before the four fixes |
| Legal pages live (FT-31) | Wed 14 Oct | Wed 28 Oct, with accounts, sync, backup and billing-email text at beta versions (Q-009) | Sign-in needs the pages first (M14) |
| C0 internal TestFlight (FT-25) | Wed 14 Oct | Wed 21 Oct with the switch off; switch-on build to the founding family from Fri 30 Oct | Internal testers need no Beta App Review (07 section 4.1) |
| Beta App Review | Thu 15 Oct | Thu 29 Oct | The build must carry the four fixes and the pages must be live |
| C1 external families (FT-32) | Mon 19 to Thu 29 Oct (10 days) | Mon 2 to Wed 18 Nov (16 days) | Still short of D-045's 21 days; accepted or the founder slips a week |
| Counsel comments (FT-33) | Fri 23 Oct | Fri 30 Oct | The M14 delta goes to counsel Fri 16 Oct; about 3 weeks per review round (ROADMAP 2.1 section 4) [A] |
| Per-language go or no-go (FT-34, DR-01) | Fri 23 Oct | Fri 30 Oct | DR-01's own date; needs the SE 3 numbers from 19 to 23 Oct |
| Feature freeze | Mon 26 Oct | Mon 9 Nov, with one named exception: the backup client (WP-F08-B5) by Fri 13 Nov | Backup is 3 to 4 person-weeks [E] (`docs/backlog/FUTURE.md` OPEN-02) and starts from a spike |
| Counsel sign-off, 1.0.0 policy versions (FT-41) | Thu 29 Oct | Fri 13 Nov | Follows comments by 2 weeks [A] |
| Backup restore drill (WP-F08-B6) | not in 2.1 | Mon 16 to Wed 18 Nov | Release gate for backup (F08) |
| Release candidate tag `ios-v1.0.0` | Fri 30 Oct | Fri 20 Nov | After C1 exit (Thu 19) and B6 |
| Submit to App Review (FT-45) | Week of Mon 2 Nov | **Week of Mon 23 Nov** | Section 2.2 |
| Release | Planned Mon 16 Nov | Planned Mon 7 Dec; buffer for one rejection to Fri 11 Dec | Same 2-week gap as 2.1 |
| v1.0.1 | By Mon 7 Dec | Re-planned after submission | It sat on the old release date; App Review slows in the last two weeks of December [U] (`docs/backlog/FUTURE.md`) |

### 2.2 The new submission week

**Submit in the week of Mon 23 Nov 2026 (Mon 23 at the earliest, Wed 25 at the latest). Release on approval, planned Mon 7 Dec.**

Confidence: **about 40% [A]** for the week of 23 Nov; **about 75% [A]** for a submission by Fri 11 Dec. These are judgement numbers, not measured: the Apple status is unknown, the backup estimate has no device evidence behind it, and none of the server path has run on a phone. Revisit them every Friday (section 8.2).

It depends on three things:

1. **Apple and a real iPhone, by Fri 16 Oct.** Apple enrolment Active (FT-01), `eas init` and a development build installed on the SE 3 (FT-17), and with it the two-iPhone backup spike (WP-F08-B1) done by Fri 23 Oct. Every device spike, TestFlight build and the backup design wait on this. A slip moves submission day for day.
2. **The four security fixes merged by Fri 23 Oct, and the database live by Wed 28 Oct.** BL-347, BL-330, BL-322 and BL-331 (with review M1, M5 and L1) merged and green in `npm run test:db`; every migration on staging, then production on Supabase Pro. Without this no outside tester signs in (09 R-17) and C1 cannot start on Mon 2 Nov.
3. **Counsel on the M14 delta: package out Fri 16 Oct, sign-off by Fri 13 Nov.** The Privacy Policy, Consumer Health Data notice, subprocessors and privacy label for server-stored letters and the encrypted backup; the D-080 billing emails (F14 Q-C1); beta policy versions (Q-009, BL-338). Silence past Fri 30 Oct moves submission.

### 2.3 The critical path

```
Tue 13 Oct  M14 logged as D-089; FT-04 decisions; PR backlog triaged; FT-20 branch protection and label
Fri 16 Oct  FT-01 Active, FT-17 first build on the SE 3; FT-16 signing key; counsel gets the M14 delta
Fri 23 Oct  BL-347, BL-330, BL-322, BL-331 merged; staging has every migration; device spikes done;
            WP-F08-B1 backup spike passes on two iPhones
Wed 28 Oct  production on Pro; legal pages live (beta versions)
Thu 29 Oct  Beta App Review submitted (switch on, fixes in)
Fri 30 Oct  counsel comments; per-language go or no-go (DR-01)
Mon 2 Nov   C1 starts (sign-in, sync, co-parent; backup lands mid-C1)
Mon 9 Nov   feature freeze (backup client by Fri 13 Nov)
Fri 13 Nov  counsel sign-off; 1.0.0 policy versions published
Mon 16 Nov  WP-F08-B6 restore drill (two iPhones), release-candidate device checks
Thu 19 Nov  C1 exit review
Fri 20 Nov  tag ios-v1.0.0; listing and privacy answers complete
Mon 23 Nov  submit
```

Two chains meet at the release candidate. The **device chain** (Apple, first build, spikes, backup B1 to B6) is the longest: about 5 weeks from today with no slack in the backup drill. The **trust chain** (security fixes, staging, production, pages, Beta App Review, C1, counsel) has about 2 days of slack. Agents can shorten the code links in both. They cannot shorten Apple, counsel, C1 days or a drill on two phones.

### 2.4 If a dependency fails

Each option is the founder's call; none is decided here.

| Red signal | By | Options |
|---|---|---|
| FT-01 or FT-17 not done | Mon 19 Oct | A. Slip day for day. There is no substitute for a phone |
| WP-F08-B1 fails (Keychain item does not sync between phones, or encryption is too slow on the SE 3) | Fri 23 Oct | A. Fix and re-spike, slip a week. B. Ship v1.0 with sign-in, sync and co-parent but backup off until 1.0.x; copy must then promise no backup (D-085 strings exist). B reverses part of M14 |
| Security fixes not merged | Fri 23 Oct | A. C1 starts with the switch off and moves to sign-in when the fixes land (shorter server C1). B. Slip C1 and submission by the same days |
| Counsel silent | Fri 30 Oct | A. Slip. B. Submit the switch-off build (the kill path M14 keeps): legal pages, label and copy must then describe that build. B reverses M14 for v1.0 |
| StoreKit sandbox not green | Fri 30 Oct | ROADMAP 2.1 cut 3: v1.0 free, Plus in 1.0.1. The Keep gate needs a build-time switch for this (05 section 5) |

The never-cut list in 05 section 5 and 07 section 5.3 still holds. With M14 it gains one line: no outside tester and no reviewer signs in before BL-330, BL-347, BL-322 and BL-331 are merged (09 R-17).

### 2.5 Founder-only tasks by week

Hours are [A], from `docs/FOUNDER_TASKS.md` "Hours by week" moved forward and widened for M14. ROADMAP assumes 15 to 20 founder hours a week [A]; weeks 1 and 2 below run over. If short, use the FOUNDER_TASKS "if short" order (FT-15 Google first).

| Week | Founder tasks (FT ids from `docs/FOUNDER_TASKS.md`) | Hours [A] |
|---|---|---|
| Tue 13 to Fri 16 Oct | Confirm FT-01 (Apple) status today; approve D-089 (M14) text; FT-04 decisions (Q-001 host, Q-002 iOS 17, which project is production, invite link format BL-348, email code length, Q-009 beta policy versions); answer F08 Q2 (backup Plus or free, due 16 Oct) and DR-13 (link plus code, due 16 Oct); confirm FT-52 to FT-57 are answered (FT-52 by D-084, FT-53 by D-082 and D-083, FT-54 by D-074 and D-086, FT-55 by M14, FT-56 and FT-57 by D-087) [R]; triage the 34 open PRs with the coordinator's list (2 hours); FT-20 branch protection and the `approve-migration` label; FT-03 and FT-18 counsel package plus the M14 delta; FT-16 signing key; FT-17 `eas init` and the first build; FT-10 and FT-11 staging project and secrets; FT-12 Auth; merges | about 28 |
| Mon 19 to Fri 23 Oct | FT-22 device spikes (speech per language on SE 3, StoreKit sandbox, three sign-ins, two-phone sync, deletion, kill test, size); WP-F08-B1 with two iPhones on one Apple Account; FT-21 recordings; FT-07 to FT-09 if not done; FT-13, FT-14 Resend and DNS; FT-15 Google (cuttable); FT-25 C0 internal Wed 21 (switch off); FT-26 recruit C1 (at least 2 co-parent pairs); FT-27 reviewers; DR-16 answer Fri 23; `approve-migration` on the security PRs; merges | about 30 |
| Mon 26 to Fri 30 Oct | Merge `develop` to `main` so `deploy-db.yml` applies staging; FT-23 production on Pro; FT-31 legal pages live Wed 28; FT-24 PostHog; Beta App Review Thu 29; FT-33 counsel comments Fri 30; FT-34 language go or no-go Fri 30; FT-28 trademark, FT-29 Small Business Program, FT-30 DPAs; merges | about 20 |
| Mon 2 to Fri 6 Nov | FT-32 C1 from Mon 2, triage 15 minutes a day; FT-42 D-031 Hindi script; FT-36 helpline check; switch-on TestFlight builds; merges | about 12 |
| Mon 9 to Fri 13 Nov | Freeze Mon 9; FT-41 counsel sign-off and 1.0.0 policy versions Fri 13; FT-38 screenshots review; merges (fixes only) | about 10 |
| Mon 16 to Fri 20 Nov | WP-F08-B6 restore drill Mon 16 to Wed 18; FT-39 release-candidate device checks; FT-40 C1 exit Thu 19; FT-43 listing, privacy answers (label no longer "Data Not Collected" once accounts exist, D-088 needs a superseding entry), age rating 18+, review notes; FT-44 approve the release; tag Fri 20 | about 16 |
| Mon 23 to Fri 27 Nov | FT-45 submit Mon 23; FT-46 Q-003 settled; FT-48 D-004 hedge (27 Nov per ROADMAP 2.1 section 9); answer App Review within a day | about 3 |
| Mon 30 Nov to Fri 11 Dec | Buffer for one rejection; FT-47 AB 1043 and SB 2420 answer; release on approval, planned Mon 7 Dec; FT-49 launch switches | about 4 |

## 3. The 20 work streams

A stream is one long-lived agent role with a fixed set of files. It takes work packages (WP-F##-##, from section 12 of each spec) and backlog tasks (BL-###, `docs/BACKLOG.md`) in order, one pull request each. Streams map to the owner roles the specs already name (mobile engineer, speech engineer, data architect and so on); the role names in 09's risk register map to streams as listed in section 3.2.

Rules for the "Owns" column: globs never overlap between streams; "(new)" means the file or folder does not exist on `develop` today; files any stream needs to change but only one may edit are listed in section 4. A stream may create a throwaway spike folder `experiments/<name>-spike/` when its WP names one.

### 3.1 Summary

| ID | Stream | Skills | Specs | On the critical path |
|---|---|---|---|---|
| S01 | Auth and account security | Security, iOS/React Native, Supabase Auth | F02, F01 links | Yes: BL-347, BL-330 gate outside sign-in |
| S02 | Database and access rules | Postgres, RLS, SECURITY DEFINER review | F11, F16, F17 server parts | Yes: BL-331, `peek_invite`, staging |
| S03 | Local store and sync | React Native, expo-sqlite, offline data | F16 client, local schema for all | Yes: two-phone sync |
| S04 | Co-parent sharing | React Native, deep links, APNs client | F11, F03 invitee | Yes: C1 needs 2 pairs |
| S05 | Encrypted recording backup | Swift, Keychain, CryptoKit, Storage | F08 6.5 | Yes: the longest chain |
| S06 | Plus, plan reminders and status report | StoreKit 2, Swift bridge, Edge Functions, email | F14 | Yes: BL-342, D-080 |
| S07 | Platform: contracts, Edge Functions, remote config | TypeScript, Deno, Ed25519 signing, CDN | F19, `packages/api` | Partly: kill switches, contracts |
| S08 | Speech and language packs | Speech/ML (whisper.cpp), native audio, scripts | F05, F07 packs | Yes: DR-01 by 30 Oct |
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
- Takes: BL-347 (review H1), BL-330 (review H3, the rest of WP-F02-03), BL-362, BL-360 (pair), review M4 and L3 (gaps G-05, G-06); WP-F02-01, -02, -05 to -09 (most built under BL-050, BL-051, BL-052, BL-054, BL-170: verify against F02 section 7 and close gaps); WP-F02-04 Google (cuttable, ROADMAP 2.1 cut 2); WP-F01-05; WP-F18-04; WP-F19-12 auth part.
- Starts when: now. Deploying `apple-token` waits on FT-11 secrets.
- Done when: the H1 proof of concept (security review appendix) is a regression test that fails on today's code and passes after; `[A-REQ-033]`, `[F02-REQ-004]`, `[A-REQ-018]`, `[F02-REQ-003]` green; a second independent review signed; device rows S1-06 to S1-08 and S2-14 recorded.
- Must not decide alone: the auth flow type (PKCE) and when a link is accepted (ADR); code length and expiry (FT-04); invite link format (BL-348); turning passkeys on; where session tokens live.

**S02 Database and access rules**
- Owns: `supabase/migrations/**` inside the timestamp ranges the coordinator assigns to S02, `supabase/tests/**` except files starting `audio_backup` or `subscription_status`, `supabase/APPLY.md`, `supabase/cron/**`, `supabase/config.toml`.
- Takes: BL-331 remainder with review M1, M5, L1 and gaps G-08 to G-14; BL-332; BL-334; BL-244; BL-326 (= WP-F18-11); the `peek_invite` RPC for BL-322; WP-F11-01 (72-hour undo, device-made invite ids); the WP-F16-03 fix (op receipts keyed by person, review L1); WP-F16-04; WP-F16-10; WP-F16-13 server part; WP-F17-10; WP-F06-07 server part; WP-F04-14; WP-F11-09 migration part; WP-F11-10 with S19. Not in v1.0: WP-F16-02 `book_access` (BACKLOG BL-175 deferred to v1.2 by D-055) [R].
- Starts when: now.
- Done when: `npm run test:db` green; every new table, view and function has an access-matrix row; each file has an APPLY.md section with a check and a rollback; the staging run of `deploy-db.yml` is green.
- Must not decide alone: who can read what; any new SECURITY DEFINER function (second review); deleting or rewriting stored rows; the order of files (ranges come from the coordinator).

**S03 Local store and sync**
- Owns: `apps/mobile/src/lib/db/**`, `apps/mobile/src/lib/store.ts`, `apps/mobile/src/lib/sync/**`, `apps/mobile/test/{migrations,store.*,sync-*}.test.ts`, `apps/mobile/test/helpers/{node-db,store-fixture}.ts`.
- Takes: WP-F16-05 to -09, WP-F16-13 client part, WP-F16-11 with S19; WP-F02-09; WP-F03-01; WP-F04-03; WP-F06-07 local part; WP-F07-03 local table; WP-F12-02; WP-F12-06 move function; WP-F13-07 table; BL-412; the remainders of BL-134 and BL-136; gap G-26. Every other stream's local schema change comes here as a request.
- Starts when: now for local work; two-phone runs need a switch-on development build and staging.
- Done when: fixture databases from v0 migrate with row counts and hashes unchanged; kill during push 500 of 500; `[F16-REQ-001]`, `[F16-REQ-009]`, `[F16-REQ-013]` green; S1-22 on two phones recorded.
- Must not decide alone: sync op shapes or protocol (D-023); local schema version numbers (one version per PR, numbered by the coordinator); anything that changes what uploads.

**S04 Co-parent sharing**
- Owns: `apps/mobile/src/lib/family/**`, `apps/mobile/src/components/family/**`, `apps/mobile/src/app/invite/**`, `apps/mobile/src/app/join/**` (new), `apps/mobile/src/app/(tabs)/family.tsx`, `apps/mobile/src/app/(tabs)/_layout.tsx`, `packages/core/src/{invite,family-rules}.ts` (new) with their tests, `packages/content/src/features/family.en.ts`, `apps/mobile/test/{invite-link,coparent-soon}.test.ts`.
- Takes: BL-322 app part (with gaps G-02, G-07); WP-F11-03, -05, -06, -07, -08, -12; WP-F11-09 app part (`lib/family/push.ts`); WP-F03-06; WP-F12-06 join part; BL-391 rescoped by M14 (hide only what v1.0 still lacks); turn-on checks 3, 4, 9 and 10 in `docs/backlog/future/06-coparent-sharing-v1-1.md` section 3. Cut from v1.0: WP-F11-13 (QR, P1).
- Starts when: BL-322 needs `peek_invite` from S02; WP-F11-05 needs the family contracts from S07 (WP-F11-04).
- Done when: Maestro flows F11-invite and F11-join pass; `[F11-REQ-006]`, `[F11-REQ-011]`, `[F11-REQ-019]` green; S1-09 and S1-22 recorded on device.
- Must not decide alone: DR-16 (whose kept letters count; founder by Fri 23 Oct); D-050 second consent (counsel); what the other parent can see; push payload content (LEGAL-REQ-054).

**S05 Encrypted recording backup**
- Owns: `apps/mobile/modules/scribe-keys/**` (new), `apps/mobile/src/lib/backup/**` (new), `apps/mobile/src/app/settings/{storage,recordings}.tsx`, `supabase/functions/escrow/**` (new), the migration range the coordinator assigns to backup, `supabase/tests/audio_backup*.test.mjs` (new), `packages/content/src/features/backup.en.ts` (new).
- Takes: WP-F08-B1 to B6; WP-F08-02 copy revisit for M14.
- Starts when: B1 needs the first development build and two iPhones on one Apple Account; B2 needs the ADR 0006 amendment for the owner-only scope accepted (section 8); B5 needs sign-in from S01 in a build.
- Done when: `[F08-REQ-020]` to `[F08-REQ-026]` green; zero plaintext audio bytes in any request across the E2E suite (07 section 5.2 item 9); B6: 20 of 20 recordings restored with equal hashes, with and without iCloud Keychain, and erase reaches the server.
- Must not decide alone: algorithms and the key hierarchy; escrow (who can unwrap); backup retention and purge; Plus or free and on or off by default (F08 Q2, founder by 16 Oct).

**S06 Plus, plan reminders and status report**
- Owns: `apps/mobile/src/lib/billing/**`, `apps/mobile/modules/scribe-store/**`, `apps/mobile/storekit/**`, `apps/mobile/src/components/plus/**` (new), `apps/mobile/src/app/settings/plus.tsx`, `packages/core/src/plan.ts`, `packages/core/src/plan-notices.ts` (new), `packages/core/test/plan*.test.ts`, `packages/content/src/features/billing.en.ts`, `packages/content/src/emails/billing.en.ts`, `packages/content/src/pricing.ts`, `supabase/functions/subscription-status/**` and `supabase/functions/plan-reminders/**` (new; names [R]), the migration range the coordinator assigns to the status table, `supabase/tests/subscription_status*.test.mjs` (new), `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md`, `apps/mobile/test/billing-*.test.ts`.
- Takes: BL-342 (WP-F14-02, -06, -07); WP-F14-09 with S16 and counsel; BL-358 and BL-357 (WP-F14-15); BL-359 (WP-F14-16); WP-F14-13, -17, -19; BL-344 (Redeem a code, PRD-REQ-027 Rev); BL-373, BL-374 (their FT-53 question is answered by D-082 and D-083 [R]); BL-416 (pair); BL-430; BL-324 Swift part (gap G-16). BL-407 and BL-429 count Read together sessions, which M2 removed: superseded [R]. WP-F14-12 is the founder's device run.
- Starts when: BL-342 now. WP-F14-15 needs sign-in (S01) and the D-080 contract in `packages/api` (S07).
- Done when: `[PRD-REQ-003]` over a synthetic year; `[C-REQ-025]`, `[C-REQ-026]`, `[F14-REQ-032]`, `[F14-REQ-033]` green; `[F14-REQ-014]` zero purchase data in any request; D-1 to D-12 signed on device with date and build.
- Must not decide alone: any change to `plan.ts` (founder, CODEOWNERS); what the status report carries (D-080, D-081, counsel); reminder and email wording (counsel); the free allowance; price display (D-083).

**S07 Platform: contracts, Edge Functions, remote config**
- Owns: `packages/api/**`, `supabase/functions/{_shared,config,content,purge-worker,analytics-forget}/**`, `supabase/functions/{invite-redeem,push-send}/**` (new), `apps/mobile/src/lib/remote/**`, `apps/mobile/src/components/content-blocks/**`, `packages/content/src/features/content-blocks.en.ts`, `scripts/packs/**`, `scripts/ops/**`, `docs/ops/**` except `AUTH_SETUP.md`, `APP_STORE_CONNECT_SUBSCRIPTIONS.md`, `DEPLOY.md`, `APP_SIZE.md`, `RELEASE.md` and `well-known/**`.
- Takes: WP-F19-02, -05 (BL-325), -06, -07, -08, -10, -11, -14; WP-F11-02, -04, -09a, -09 function part; WP-F16-01; WP-F17-11; WP-F05-03 remainder; BL-335 agent half after FT-16; the D-080 contract for S06 and the escrow contract for S05; gaps G-17, G-18, G-20 (SQL part with S02).
- Starts when: now.
- Done when: `npm run test:functions` green; `[F19-REQ-008]`, `[F19-REQ-009]`, `[F19-REQ-013]` green; the staging kill test (WP-F19-13 with S19) passes; every endpoint meets the ADR 0017 list (p95 budget, auth check, idempotent, rate limit, request id, content-free logs).
- Must not decide alone: a new endpoint class; keys and signing; a remote-config key that changes behaviour (ADR 0016; B14 never list); the push provider and its keys; any flow where a server could see content.

**S08 Speech and language packs**
- Owns: `apps/mobile/src/lib/transcribe*.ts`, `apps/mobile/src/lib/model-files.ts`, `apps/mobile/src/lib/{transcription-queue,models,packs,language,audio-enhance}/**`, `apps/mobile/modules/scribe-audio/**`, `apps/mobile/src/components/{speech,language}/**`, `apps/mobile/src/app/settings/language.tsx`, `experiments/**` (except spike folders other streams create), `packs/**`, `packages/content/src/features/{speech,language,packs}.en.ts`, `apps/mobile/test/{transcribe-*,transcription-queue,models-catalog,speech-consent}.test.ts`.
- Takes: WP-F05-01 clamp (review L9), -02, -05, -10, -11 (pair), -12 (human); the scorer half of WP-F06-04 (`experiments/score.ts`); BL-337 agent half; WP-F07-02 (pair); BL-375; BL-376 with S11; BL-382; BL-432; BL-324 audio part.
- Starts when: harness and gate tooling now; device runs need FT-17 and FT-21.
- Done when: a gate report per language (`[F05-REQ-002]` to `[F05-REQ-006]`) and the FT-34 record exist; `[F05-REQ-040]` numbers recorded on SE 3, iPhone 12 and iPhone 15 (S1-17); S1-15, S1-16, S1-18, S1-19 recorded.
- Must not decide alone: which languages ship (founder, DR-01 by 30 Oct); the model per language (ADR 0015); publishing packs (coordinator with the founder's OK); anything that sends audio off the phone.

**S09 Faithful-edit engine**
- Owns: `packages/core/src/{verify,meaning,protect,types,pipeline,rules,punctuation,text,repeats,model-edits,edit-provider,frozen,domain,index}.ts`, `packages/core/src/lang/**`, `packages/core/src/{author-edits,review-state,dictionary}.ts` (new), `packages/core/test/**` except the test files section 4 gives to other streams.
- Takes: WP-F06-01 (pair, Hermes on SE 3), WP-F06-02 to -06 (scorer part of -04 goes to S08), WP-F07-01, WP-F07-08 core part, BL-148; R-01 open items D4, D6, D7, D9, D10, D13, D14, D15.
- Starts when: now.
- Done when: `[F06-REQ-019]` zero accepted meaning changes per language in Node, then under Hermes (WP-F06-01); `[F06-REQ-021]` 10k cases on a fixed seed; the golden master changed only where a case asserted a defect, each listed in the PR; `ENGINE_VERSION` 6 with a dated comment.
- Must not decide alone: `EditType`, `verify.ts`, `meaning.ts`, `types.ts`, `pipeline.ts` (founder approval, CODEOWNERS); sign-off of a pack's word tables (native reviewer and founder); an engine change that alters saved letters (WP-F06-12 audit first).

**S10 Capture and Tonight**
- Owns: `apps/mobile/src/app/{listen,write}.tsx`, `apps/mobile/src/app/(tabs)/index.tsx`, `apps/mobile/src/lib/capture/**`, `apps/mobile/src/components/capture/**` except `transcript.tsx`, `apps/mobile/src/{lib,components}/resilience/**`, `apps/mobile/src/lib/{audio-mode,permission-copy}.ts`, `apps/mobile/src/lib/haptics*.ts`, `apps/mobile/src/widgets/**` (new), `packages/core/src/{capture,backdate}.ts` (new) with tests, `packages/content/src/permissions.en.ts`, `apps/mobile/test/{sweep,keep-awake,resilience}.test.ts`.
- Takes: WP-F04-01 (pair, device), -02, -04, -05, -06, -08, -10, -11 with S19; BL-370 with S15; BL-378, BL-379, BL-380, BL-381, BL-417, BL-420; the Tonight slot line of WP-F19-09. Cut from v1.0: WP-F04-12 widget (F04 Q4).
- Starts when: now.
- Done when: `[F04-REQ-001]`, `[F04-REQ-003]`, `[F04-REQ-006]`, `[F04-REQ-008]`, `[F04-REQ-010]` green; `[F04-REQ-024]` kill runs DL-01 and DL-02 (500 Simulator plus 50 SE 3, zero loss); S1-10 to S1-14 recorded.
- Must not decide alone: anything that could drop audio; background audio and keep-awake modes (App Review); the 30-minute cap; the microphone purpose string (counsel).

**S11 Review and names**
- Owns: `apps/mobile/src/app/review.tsx`, `apps/mobile/src/components/review/**` (new), `apps/mobile/src/components/capture/transcript.tsx`, `apps/mobile/src/components/dictionary/**` (new), `apps/mobile/src/lib/review/**` (new), `apps/mobile/src/lib/dictionary-store.ts` (new), `apps/mobile/src/lib/{review-layout.logic,read-it-back,read-it-back.logic,provenance}.ts`, `apps/mobile/src/app/settings/words.tsx` (new), `packages/content/src/features/words.en.ts`, `apps/mobile/test/provenance.test.ts`.
- Takes: WP-F04-07 (typed text exact: today `review.tsx` passes typed text through `normalizeChars`, breaking F04-REQ-012 and B5); WP-F06-08 to -12; WP-F06-14 with S16; WP-F07-05, -06; WP-F17-13; BL-377, BL-395, BL-406, BL-413, BL-433; BL-376 with S08. Cut from v1.0: WP-F06-13 (BL-146 deferred), WP-F07-07 (v1.1).
- Starts when: WP-F04-07 now; WP-F06-08 needs WP-F06-07 (S03 local, S02 server).
- Done when: `[F04-REQ-012]` byte equality; `[F06-REQ-035]` to `[F06-REQ-037]`, `[F06-REQ-028]`, `[F06-REQ-034]`, `[F06-REQ-038]` green; VoiceOver script and AX5 snapshots; S1-23 recorded.
- Must not decide alone: how edits are shown, counted and undone (D-086); the "Exactly as said" default; any write to `final_text` outside the author layer.

**S12 First run and entry**
- Owns: `apps/mobile/src/app/{onboarding,welcome,+not-found}.tsx` (welcome new), `apps/mobile/src/lib/age-gate*.ts`, `apps/mobile/src/lib/{bootstrap,age-range}.ts` (new), `apps/mobile/src/components/gate/**`, `apps/mobile/src/components/first-run/**` (new), `apps/mobile/modules/age-range/**` (new), `apps/mobile/test/age-gate.test.ts`.
- Takes: WP-F01-01, -02 (pair), -03 (wiring line in `_layout.tsx` by S20), -04, -06 with S20; WP-F03-02, -03, -05, -07 (human); BL-383, BL-385, BL-386, BL-419, BL-423, BL-424, BL-425, BL-426, BL-427.
- Starts when: now.
- Done when: `[F01-REQ-001]` to `[F01-REQ-006]`, `[A-REQ-002]` airplane test, `[B-REQ-001]`, `[F03-REQ-001]` to `[F03-REQ-006]` green at default and AX5; `[F03-REQ-008]` median recorded on SE 3.
- Must not decide alone: 18+ gate behaviour (legal duty; DR-10 counsel); Declared Age Range use; what first run asks for (D-087); any new permission ask.

**S13 Book, Read together, children and export**
- Owns: `apps/mobile/src/app/(tabs)/book.tsx`, `apps/mobile/src/app/letter/**`, `apps/mobile/src/app/read-together.tsx`, `apps/mobile/src/app/settings/{children/**,export.tsx}`, `apps/mobile/src/components/{book,read-together,child,player,export}/**`, `apps/mobile/src/lib/{player,export}/**`, `apps/mobile/src/lib/dates.ts`, `apps/mobile/modules/scribe-files/**`, `packages/core/src/{age,child}.ts`, `packages/core/src/{book,read-together}.ts` (new), `packages/core/test/{child,book,read-together}.test.ts`, `packages/book/**` (new, needs the decision in section 8), `packages/content/src/book.en.ts`, `packages/content/src/features/{export,player}.en.ts`, `apps/mobile/test/{dates,player-logic,export-*,quiet-day-book}.test.ts`, `apps/mobile/test/__golden__/**`, `apps/mobile/test/helpers/asha-export.ts`.
- Takes: WP-F09-01 to -06, -08 to -10 (WP-F09-05 `LetterText` with S15 review); WP-F10-01, -02, -04, -05, -07, -08; WP-F12-04, -05, -07; WP-F15-01 to -08, -10 with S19; WP-F08-06 keep-safe card; BL-323, BL-388, BL-401, BL-421, BL-422, BL-431. Cut from v1.0: WP-F09-11 search (P1, F09).
- Starts when: now.
- Done when: the `[F09-REQ-*]`, `[F10-REQ-*]` and `[F15-REQ-*]` tests named in each WP green; `[DATA-REQ-050]` to `[DATA-REQ-056]` green; export kill test 20 of 20; S1-20 and S1-21 (ZIP opens on a Mac and on Windows) recorded.
- Must not decide alone: the export format version and contents; a new package; what Read together plays from another parent (D-073: nothing in v1.0); the 90-day pledge text.

**S14 Settings, reminders, help and deletion**
- Owns: `apps/mobile/src/app/settings/{index,_layout,privacy,appearance,reminders,delete-account,recently-deleted}.tsx`, `apps/mobile/src/app/settings/{consents,about,help-legal}.tsx` (new), `apps/mobile/src/components/settings/**`, `apps/mobile/src/lib/{reminders,account-deletion}/**`, `apps/mobile/src/lib/{privacy,notifications}/**` (new), `apps/mobile/src/lib/shelf-days.ts`, `packages/core/src/{prompts,safety,followups}.ts`, `packages/core/src/{reminder-plan,deletion-flow}.ts` (new), their tests in `packages/core/test/`, `packages/content/src/features/{reminders,account-deletion,licences}.en.ts`, `apps/mobile/test/{reminders-planner,shelf-strings}.test.ts`.
- Takes: WP-F13-01, -02, -04 to -06, -08 to -10; WP-F12-07; WP-F17-00 (pair), -01 to -07, -09 with S19, -12, -14 with S16, -15 (P1); WP-F20-01 to -03; BL-387, BL-404, BL-405, BL-428; BL-389 with S16. Cut from v1.0: WP-F17-08 app lock (P1).
- Starts when: now.
- Done when: `[C-REQ-001]` to `[C-REQ-009]` and the F13 planner property test over 24 zones and both DST changes green; `[C-REQ-016]`, `[C-REQ-019]`, `[DATA-REQ-019]` and the `[F17-REQ-*]` tests named in each WP green; `[F20-REQ-004]` to `[F20-REQ-008]` green; S2-13 and S2-15 recorded.
- Must not decide alone: deletion semantics and timings (DATA-REQ, counsel); consent withdrawal modes (counsel); the helpline list (FT-36); lock-screen notification wording.

**S15 Design system and accessibility**
- Owns: `packages/design-tokens/**`, `apps/mobile/src/components/{ui,motion,platform}/**`, `apps/mobile/src/lib/{motion,a11y,a11y.logic,navigation.logic,utils}.ts`, `apps/mobile/src/global.css`, `apps/mobile/assets/**`, `docs/design/**`, `apps/mobile/test/{design-system-gaps,theme-leaks}.test.ts`.
- Takes: BL-394, BL-396, BL-397, BL-398, BL-400, BL-402, BL-418 (the shared components; each screen owner adopts them in its own PRs), BL-354 (pair), BL-355, BL-409 with S19; accessibility review of every UI PR.
- Starts when: now.
- Done when: token and component tests green; AX5 snapshots and contrast checks for every component; no screen file edited outside `components/ui` in this stream's PRs.
- Must not decide alone: a new UI library (ADR 0101); brand changes (D-071, D-072); Dynamic Type limits (D-027).

**S16 Content and claims**
- Owns: `packages/content/**` except the feature files section 4 gives to other streams, `packages/brand/**`, `packages/emails/**`, `apps/mobile/src/lib/copy.ts`, `scripts/brand/**`, `docs/store/**`, `docs/emails/**`, `docs/support/**` (new).
- Takes: the M14 copy delta (accounts, sync, co-parent, backup; remove the D-085 "no backup" lines and the coming-soon copy where M14 ships the feature; `sensitiveConsent.body` co-parent wording, gap G-21); BL-356, BL-372 (FT-52 answered by D-084 [R]), BL-390 (FT-55 answered by M14 [R]), BL-393 (FT-54 answered by D-074 and D-086 [R]), BL-411; WP-F13-03; WP-F18-07 with S18; WP-F19-11; WP-F20-04, -05, -07; WP-F21-01 to -04; BL-340 and BL-341 with the founder.
- Starts when: now.
- Done when: `npm test -w @scribe/content` green (rules and no-real-family-data); every privacy, durability, security or "free" claim registered (LEGAL-REQ-044); `[F21-REQ-002]` to `[F21-REQ-004]` green.
- Must not decide alone: any claim (counsel); store listing and subtitle (founder); the brand name (`packages/brand`, D-076).

**S17 Legal drafting and privacy disclosures**
- Owns: `docs/legal/**` (including `DATA_CLASSIFICATION.md`).
- Takes: the M14 counsel delta (Privacy Policy, Consumer Health Data notice, subprocessors for Storage and push, data policy, Subscription Terms lines that say we do not email about Plus, COUNSEL_PACKET questions for server-stored letters and the D-080 emails); BL-338 with the founder; a draft superseding entry for D-088's label for the coordinator; WP-F21-08, -09 with S20, -11; WP-F18-08 with S20; data-map rows on request from every stream; BL-365 (counsel, human).
- Starts when: now.
- Done when: documents ASCII-only; every changed statement has a claims entry; counsel's tick recorded per document (FT-41); `DATA_CLASSIFICATION.md` rows match the migrations (S02 checks).
- Must not decide alone: legal text going public (founder, COORDINATION section 1); anything counsel has not seen. This lane drafts; it is not legal advice.

**S18 Analytics and learning loop**
- Owns: `packages/analytics/**`, `apps/mobile/src/lib/analytics/**`, `apps/mobile/src/components/consent/**`, `docs/analytics/**`, `docs/insights/**`, `scripts/insights/**`, `scripts/analytics/**` (new), `scripts/ci/sdk-guards.mjs` (new), `apps/mobile/test/analytics-contract.test.ts` (new).
- Takes: WP-F18-01 to -03, -05, -06, -09 (pair), -10, -14 (only if F18 Q2 says v1.0), -15 (only if Q3 is yes); catalogue rows requested by WP-F04-13, WP-F06-15, WP-F08-08, WP-F10-09, WP-F13-11, WP-F14-14; BL-251; BL-252.
- Starts when: now.
- Done when: catalogue tests green; `[LEGAL-REQ-017]` allowlist; `[F18-REQ-003]` both ways; `[F18-REQ-007]` and `[F18-REQ-010]` fail on a planted import; `[F18-REQ-012]` emitter script exits 0.
- Must not decide alone: a new event or property (L2 only; counsel when available); any SDK (pair; privacy label); anything sent before consent; ROADMAP 2.1 cut 4.

**S19 QA automation, device evidence and performance**
- Owns: `apps/mobile/e2e/**`, `apps/mobile/e2e-web/**`, `apps/mobile/src/dev/**`, `docs/qa/**`, `docs/release/journey/**`, `scripts/trace.mjs` (new), `scripts/leak-surfaces.mjs` (new), `scripts/load/**` (new), `docs/TRACE.md` (new, ADR 0011).
- Takes: BL-002, BL-110, BL-275 to BL-279, BL-408, BL-409 with S15, BL-410, BL-414 with S07, BL-415; WP-F04-11, WP-F14-11 (BL-221), WP-F15-10, WP-F16-11 with S03, WP-F17-09, WP-F19-13, WP-F11-10 with S02; an evidence template per device session; testID requests to screen owners.
- Starts when: now.
- Done when: `scripts/trace.mjs` runs in `npm test` and reports P0 IDs with no test; the Maestro suite is green nightly; one evidence file per device session (`docs/qa/evidence/<date>-<build>-<device>.md`).
- Must not decide alone: whether the trace check blocks merges (07 Q8); weakening any test (never); where Maestro runs and what it costs (07 Q6).

**S20 Release, CI and the website**
- Owns: `.github/**`, `apps/mobile/eas.json`, `apps/mobile/app.config.ts`, `apps/mobile/package.json`, root `package.json` and `package-lock.json`, `apps/mobile/src/app/_layout.tsx`, `apps/mobile/src/lib/{capabilities,build-env}.ts`, `apps/mobile/src/lib/README.md`, `apps/mobile/test/{capabilities,config}.test.ts`, `apps/mobile/scripts/**`, `scripts/size/**`, `docs/release/**` except `journey/**`, `docs/ops/{DEPLOY,APP_SIZE,RELEASE}.md` (RELEASE new on `develop`), `docs/ops/well-known/**`; on `main`: `apps/web/**`, `docs/web/**`.
- Takes: the M14 switch (per profile, with `capabilities.ts` and `capabilities.test.ts`, per check 7 in `06-coparent-sharing-v1-1.md` section 3); BL-349 privacy manifest (gap G-23); BL-336 after Q-002; BL-339 after FT-17; BL-392; BL-117; BL-283; rebase and land PR #30 (CI hardening and the fence workflow); WP-F19-02 with the founder; WP-F01-06; WP-F02-10 `/auth/confirm`; WP-F11-11 `/j` and the AASA paths; WP-F20-09 `security.txt`; WP-F21-05, -06, -07, -10, -13; BL-243, BL-363, BL-364.
- Starts when: now.
- Done when: CI `required` green; the fence workflow fails a planted `supabase/**` change without the label; `npm run preflight:testflight -w @scribe/mobile` clean except founder items; IPA under 40 MB (TF-01); the AASA file served with no redirect (P-05) and legal pages live.
- Must not decide alone: turning the switch on in a store profile (founder, after the R-17 gate); a new native module or SDK (pair); `main` and tags (coordinator and founder); DNS (founder).

## 4. Files one stream owns for everyone

Some files every feature needs. Each has one owner; everyone else changes it by request. A request is a section "Requests to other owners" in the PR body: file, exact change, why, WP id. The owner lands it within one working day or says why on `docs/agents/BOARD.md`; past that the coordinator escalates. This costs about a day per cross-stream change [A] and is the price of no two streams editing one file.

| File | Owner | How others change it |
|---|---|---|
| `apps/mobile/src/lib/db/migrations.ts`, `apps/mobile/src/lib/store.ts` | S03 | Send the schema step and the store function signature. One local schema version per PR; the coordinator hands out version numbers in request order |
| `apps/mobile/src/app/_layout.tsx`, `apps/mobile/app.config.ts`, `apps/mobile/eas.json`, `apps/mobile/package.json`, root `package.json` and `package-lock.json` | S20 | Send the wiring line or plugin entry. A new package is pair mode with the founder (BACKLOG rule 8) |
| `packages/content/src/strings.en.ts`, `packages/content/src/features/index.ts`, `packages/content/test/rules.test.ts` | S16 | Send key, text and screen. Feature files listed in section 3.3 stay with their stream |
| `packages/analytics/src/catalog.ts`, `docs/analytics/TRACKING_PLAN.md` | S18 | Send event, L2 properties and the question it answers |
| `packages/core/src/index.ts` | S09 | Send the export line |
| `packages/api/**` (contracts, standards, remote-config keys) | S07 | Send the contract shape; S07 checks it against ADR 0017 |
| `supabase/APPLY.md` | S02 | S05 and S06 send the APPLY section for their migration files |
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

Streams run in parallel inside their files. Waves set what merges first. Priority inside a wave decides who gets the merge slots in section 6.

### 5.1 Wave 0: set up (Tue 13 to Wed 14 Oct)

No feature PRs. The coordinator: drafts D-089 for M14 (with the D-085, D-087 and D-088 consequences) for the founder; lists every open PR with merge, rebase or close; writes one claim line per stream on `BOARD.md`; assigns migration timestamp ranges to S02, S05 and S06 and local schema version numbers to requesters; starts one independent review agent per area (section 6.2); splits the unmerged work on `auto/2026-10-05-fixes` by the globs in section 3.3, so each stream starts from its own part (its 47 changed files touch S03, S04, S07, S08, S11, S13, S18 and S20 globs: among them the export schema and golden files, remote documents, `packages/api` standards, the app privacy manifest, the local `entries.language` column and the consent sheet; it touches nothing under `lib/auth` or `supabase/`). The founder: branch protection on `develop` and `main` requiring `required`, the `approve-migration` label (FT-20, BL-005, BL-122), the triage list.

### 5.2 Wave 1: gate the server, make the first build honest (Wed 14 to Fri 23 Oct)

| Priority | What merges | Streams | Why first |
|---|---|---|---|
| P1 | BL-347, BL-330; BL-331 rest with review M1, M5, L1; `peek_invite`; BL-334; BL-322 app part | S01, S02, S04 | 09 R-17: nobody outside the family signs in before these |
| P2 | BL-349 privacy manifest; PR #30 CI hardening and fence; BL-370 crash screen; WP-F04-07 typed text exact | S20, S10, S11 | The first TestFlight upload and C0 |
| P3 | M14 copy delta; counsel delta drafts | S16, S17 | Pages and copy must match a server build before Wed 28 Oct |
| P4 | BL-342 plan reminders and Save a copy | S06 | Subscription Terms 1.4.0 promise them (never-cut list) |
| P5 | WP-F08-B1 spike evidence; WP-F05-02 gate tool; WP-F06-02 verifier | S05, S08, S09 | Spikes and launch gates with long tails |
| P6 | The rest of each brief in section 9 | all | |

Exit: the R-17 gate passes (four fixes merged, `npm run test:db` green against staging); a development build runs on the SE 3; the FT-22 rows are recorded; WP-F08-B1 has a verdict.

### 5.3 Wave 2: server features in a build (Mon 26 Oct to Fri 6 Nov)

| Work | Streams | Depends on |
|---|---|---|
| Backup B2 (keys), B3 (bucket, tables, access rules), B4 (escrow function), then B5 (queue, Settings row, restore) | S05; S02 reviews the migration; S07 the escrow contract | B1 verdict; ADR 0006 amendment accepted; S01 sign-in in a build |
| Status table, report, then reminder emails (BL-358, BL-357, BL-359) | S06; S07 contract; S02 review | Sign-in; counsel's view on F14 Q-C1 |
| Invite, join, leave and the shared-book reading states | S04, S03 | `peek_invite`; family contracts; DR-16 answer (Fri 23 Oct) |
| Sync device fixes, restore epoch, erase op for synced letters | S03, S02 | Two-phone run on staging |
| Switch on in `preview`, then `testflight` | S20 | R-17 gate for `testflight`; founder approval |
| Invite-redeem and push-send functions | S07, S02 | APNs key (founder) and the WP-F11-09a spike |
| Staging kill-switch test; Maestro co-parent flow on two simulators | S19, S07 | Signed config publish (founder OK) |
| Fold counsel comments (Fri 30 Oct) into copy and drafts | S16, S17 | FT-33 |
| M-JR majors and remaining v1.0 WPs, by priority | S10 to S15, S18 | Merge slots |

Exit: C1 running with sign-in from Mon 2 Nov; the language go or no-go recorded (Fri 30 Oct); backup B2 to B4 merged.

### 5.4 Wave 3: freeze and prove (Mon 9 to Fri 20 Nov)

Feature freeze Mon 9 Nov. Only fixes for S0 and S1 findings, gate failures and the one exception (WP-F08-B5 by Fri 13 Nov) merge. S19 runs the G3 and G4 evidence with the founder; S05 and the founder run B6 (Mon 16 to Wed 18); S16 and the founder finish screenshots (BL-340), review notes (BL-341) and the listing; S17 publishes nothing, but hands the 1.0.0 texts to the founder after counsel's tick.

### 5.5 Key edges

```
S02 peek_invite ----------------> S04 BL-322 app part
S02 BL-331 + S01 BL-347, BL-330 -> R-17 gate -> S20 switch on in testflight -> Beta App Review -> C1
S07 family contracts ------------> S04 WP-F11-05
S03 WP-F06-07 local + S02 server -> S11 WP-F06-08 Review shell
S05 B1 -> ADR 0006 amendment -> S05 B2 -> B3 (S02 review), B4 (S07 contract) -> B5 -> B6 drill
S01 sign-in + S07 D-080 contract -> S06 BL-358 -> BL-357 -> BL-359
S09 WP-F06-02 -> -03 -> -05 -> -06 -> S03/S02 WP-F06-07 -> S11 WP-F06-10, -11
S08 gate tool + FT-21 recordings + FT-22 device runs -> FT-34 per-language go (Fri 30 Oct)
```

## 6. Merge budget and review

### 6.1 The budget

Assumptions [A]: the founder has 15 to 20 hours a week (ROADMAP 2.1; `docs/backlog/FUTURE.md` cites TDD 10 6.2). Section 2.5 already asks for about 28 and 30 hours in the next two weeks, so review time is the first thing squeezed. Reserve **6 hours a week for merges**, in three 2-hour sessions (Mon, Wed, Fri) [R]. A WP is sized for a 30-minute review (07 section 1); with an independent review agent's verdict read first, assume 15 minutes for an unfenced PR and 30 minutes for a fenced one [A].

| Week | Merge slots [E] | Note |
|---|---|---|
| Tue 13 to Fri 16 Oct | 12 | 2 hours go to triaging the 34 open PRs |
| Mon 19 to Fri 23 Oct | 20, at most 4 fenced | P1 and P2 first |
| Mon 26 to Fri 30 Oct | 20, at most 4 fenced | |
| Mon 2 to Fri 6 Nov | 20, at most 4 fenced | |
| Mon 9 to Fri 13 Nov | 20, fixes only | Freeze |
| Mon 16 to Fri 20 Nov | 10, fixes only | Release candidate |

That is about **100 merges** to the release candidate [E]. Demand is larger: the 21 specs list 250 WPs, and in the 10 specs that record a status (F04 to F09, F11, F15 to F17; 129 WPs) 21 are built, 45 partly built, 50 not built and 13 are device or human runs [F, counted 13 Oct]; M-JR adds 65 tasks, many overlapping those WPs. So the budget, not the number of agents, sets what ships. The rule: a slot goes first to work a G3 or G4 gate names, the never-cut list (05 section 5), M14 and an M-JR [Critical]; P1 features already marked for cutting stay cut (WP-F04-12 widget, WP-F09-11 search, WP-F06-13 offered fillers, WP-F07-07 say the name three times, WP-F11-13 QR invite, WP-F17-08 app lock). Each Friday the coordinator publishes next week's slots by stream.

### 6.2 How review agents lower the load

1. **One independent review agent per PR**, never the author's stream. It runs the checklist in section 8.3, re-runs `npm test`, `npm run typecheck`, `npm run test:db` and `npm run test:functions`, diffs the changed paths against the stream's globs in section 3.3, and posts one verdict: ready, or changes with line references. The founder opens only PRs marked ready (07 section 1.5 item 2).
2. **A second review agent for fenced paths** (section 7), focused on access rules, secrets and data flow (D-041).
3. **A daily digest** from the coordinator: ready PRs sorted by critical path, each with a three-line summary (what, tests, risk), so a 2-hour session covers 6 to 8 PRs.
4. **Device and human items are split out** of code PRs into evidence PRs under `docs/qa/evidence/`, so a code review never waits on a phone.
5. **Docs-only PRs** (`docs/legal/**` drafts, `docs/qa/**`) still need the founder's merge but no second review; they cost about 5 minutes each [A].

## 7. The agent fence for `supabase/**` and auth (D-041)

D-041: unattended agent runs pause for `supabase/**` and auth code until CI and branch protection are on; any PR touching them needs an independent review run and the founder's "approve migration" label. Migrations reach hosted projects only through `.github/workflows/deploy-db.yml` (staging on a push to `main`, production on a `db-v*` tag through the GitHub Environment `production`).

| Rule | Detail |
|---|---|
| Fenced paths | `supabase/**`; `apps/mobile/src/lib/auth/**`, `apps/mobile/src/lib/supabase/**`, `apps/mobile/src/app/(auth)/**`, `apps/mobile/src/app/+native-intent.tsx`; `.github/**`. Proposed additions [R]: `apps/mobile/modules/scribe-keys/**` and `apps/mobile/src/lib/backup/**` (keys), `packages/core/src/{verify,meaning,types,pipeline,plan}.ts` (already founder-approval in CODEOWNERS) |
| Who may edit | Only the owning stream: S01 (auth paths, `apple-token`, templates), S02 (migrations in its ranges, tests, APPLY), S05 and S06 (their function folders and migration ranges), S07 (the shared functions), S20 (`.github/**`) |
| Review | Two independent review agents (one security-focused), then the founder's `approve-migration` label. The fence workflow in PR #30 fails a PR on these paths without the label; S20 lands it in wave 1 |
| Migrations | A new file in the stream's timestamp range; never an edit to a file in `.github/migrations-applied.txt` (migration guard). Every new object has an access-matrix row and an APPLY section with a check and a rollback |
| Never | Apply a migration to a remote project, set or read a secret, deploy a function, publish packs or config (COORDINATION section 6; BACKLOG rule 8) |
| Until branch protection is on | Unattended runs take only `packages/*` and `docs/` work (BACKLOG rule 9). Interactive streams may still open fenced PRs; nothing fenced merges without the label |
| Server features | No build with the switch on goes to anyone outside the founding family until R-17 passes (section 2.4) |

## 8. Working with the architects

"Architect" here means the reviewers who shape how: the delivery lead (this file), area review agents for data, security, mobile and platform, and the founder, who decides. Agents build the spec default while a decision is open (09 section 1).

### 8.1 What needs an architecture review and an ADR

| Change | Why it needs an ADR | Existing record to amend or follow |
|---|---|---|
| The owner-only backup key hierarchy, algorithms, escrow and retention (WP-F08-B2 to B4) | Hard to reverse once ciphertext exists | Amend ADR 0006 (Accepted, 1 Oct) for the v1.0 owner-only scope |
| Email links: PKCE flow and when a link is accepted (BL-347) | Changes sign-in for every account | AUTH_SETUP; new ADR or ADR 0017 note |
| A new endpoint class: status report, escrow, invite-redeem, push-send | Data flow, budgets, abuse limits | ADR 0017 checklist; a new ADR only if it departs from it |
| Push notifications from an Edge Function (APNs keys, payload rules) | New vendor path and key custody | New ADR after WP-F11-09a |
| A new SDK, native module or vendor | Privacy label, size budget, data map | ADR 0101 for UI libraries; ADR 0016 for size |
| Sync op shapes or protocol | Every device and the server | D-023; ADR 0004 status note |
| A remote-config key that changes behaviour | App Review 2.3.1; B14 never list | ADR 0016 |
| Edit engine semantics (`EditType`, verifier rules) | The constitution | ADR 0014; founder approval |
| Visibility of letters between parents | Privacy promise | F11 section 8; 09 R-09 |
| A new package (for example `packages/book`, `packages/export` in F15) or top-level folder | Repo layout (COORDINATION section 8) | Decision entry; ADR 0010 for package rules |

ADR numbers: 0018 and 0019 are already used on agent branches (commit 97c2c7d); the next ADR on `develop` takes 0020 or later [R], checked against open branches first.

### 8.2 Cadence

| When | What | Who |
|---|---|---|
| Tue and Thu, 30 minutes [R] | Architecture review: open ADR PRs (label `adr`), cross-stream requests older than a day, fence findings | Delivery lead, area review agents; founder for decisions |
| Within 2 working days of an ADR PR | Decide, or the spec default stands and the PR says so | Founder |
| Fri | Delivery review: critical path against section 2.3, confidence numbers in 2.2 updated, next week's merge slots by stream, cuts proposed if a chain slips | Delivery lead, founder |
| After each wave | The coordinator mirrors `BOARD.md` and decisions into the Project doc (COORDINATION section 7) | Coordinator |

### 8.3 The checklist a PR must pass

Everything in `07-quality-bar.md` section 1 (tests with requirement IDs in titles, lint, content rules and the constitution, accessibility, review, reporting) and `.github/pull_request_template.md`. M14 adds five lines:

1. The change works with `EXPO_PUBLIC_SERVER_FEATURES` off and on; a test covers both where the code branches on `capabilities`.
2. Every server call has a kill switch consumer and fails to a working local state (LEGAL-REQ-040; F19-REQ-011).
3. Nothing reaches a server before the consent that covers it (sensitive-data consent, `SCCON`; analytics opt-in).
4. Paths stay inside the stream's globs; any request to another owner is listed in the PR body.
5. Fenced paths carry two review verdicts and the founder's label.

## 9. Wave 1 dispatch table

The coordinator pastes the common header, then the stream's row. Each row is sized for one agent run of one to three PRs. Where a row says "verify first", the backlog status may be stale against code merged on 13 Oct (PRs #94, #103, #104) or the WIP branch: check, and close with evidence if the work is done.

**Common header (paste first, replace `Sxx`):**

```
You are stream Sxx of Early Letters, repo thesaurabhpareek/earlyletters. Branch from origin/develop.
Read: CLAUDE.md; docs/agents/COORDINATION.md; docs/prd/v2/_AUTHORING.md sections 3b, 6, 7;
docs/prd/v2/08-delivery.md sections 3.3 (your row), 4, 7 and 8.3; docs/prd/v2/07-quality-bar.md section 1;
the spec sections named in your brief. Then add your claim line to docs/agents/BOARD.md.
Rules: edit only the files your stream owns (08 section 3.3). One WP or BL per pull request.
Branch <type>/<area>-<wp-or-bl>-<slug>. PR title "WP-F##-##: ..." or "BL-###: ...". PR body:
Satisfies (requirement IDs), Data classes touched, Requests to other owners, How it was checked.
Test titles start with the requirement ID in brackets. Fixtures use the fictional family Asha only.
Push only your own branch and open a PR; never push to develop or main, apply a migration,
set or read a secret, deploy, publish packs or config, or edit a requirement document.
If your work is on branch auto/2026-10-05-fixes, start from your files there.
Finish with a report: files changed, tests with counts, what needs a real iPhone,
what the founder must do, requests to other owners, what is unfinished, facts versus assumptions.
```

| Stream | Scope | Files | WPs and tasks | Tests | Done when |
|---|---|---|---|---|---|
| S01 | Close security review H1 and H3. H1: email links use PKCE; a link is accepted only while this phone has a pending request, else route to "type the code"; local letters are claimed only after consent, behind a screen that shows the account email; a link is refused while another account is signed in. H3: capture the Apple refresh token after Apple sign-in through a new `apple-token` function so deletion can revoke it. Draft the ADR note for the PKCE change | `apps/mobile/src/lib/auth/**`, `lib/supabase/**`, `app/(auth)/**`, `app/+native-intent.tsx`, `supabase/functions/apple-token/**` (new), `docs/ops/AUTH_SETUP.md`, `apps/mobile/test/auth-*.test.ts` | BL-347, BL-330 (WP-F02-03 rest); review appendix PoC steps; F02 sections 7 and 11 | The H1 proof as a regression test that fails on today's code; `[A-REQ-033]`, `[F02-REQ-004]`, `[A-REQ-018]`; Deno tests for `apple-token` in `npm run test:functions` | Two review verdicts and the founder's `approve-migration` label; deploy steps for FT-11 written in AUTH_SETUP; no change outside the globs |
| S02 | Finish BL-331: review M1 (family members read birth year and due date from `children`), M5 (`sync_pull` digest reveals a private write), L1 (op receipts keyed by person and op id); add `peek_invite(token)` that shows only the inviter's sign-off name before consent; BL-334 pepper fails closed | New migration file in your assigned range; `supabase/tests/**`; `supabase/APPLY.md` | BL-331, BL-334, `peek_invite` (G-13), G-08 to G-12; security review sections 3 to 5 | Each review PoC rewritten as a regression test asserting the fix; access-matrix rows for every new object; `npm run test:db` and `npm test` (mobile sync-e2e runs this SQL) | APPLY section with check and rollback; two review verdicts and the label; error codes listed for S04 and S03 |
| S03 | WP-F04-03: local migration 6 (draft kind, occurred date, precision, language) and its store functions; gap G-26: local `entries.language` and its sync mapping (upsert, `changed`, ALL_GROUPS). Send S17 the data-map rows | `apps/mobile/src/lib/db/**`, `lib/store.ts`, `lib/sync/**`, `apps/mobile/test/{migrations,store.*,sync-*}.test.ts` | WP-F04-03, G-26; F04 section 11, F16 section 11 | Fixture DBs v0 to v5 migrate to v6 with counts and hashes unchanged; `[DATA-REQ-044]` retry; sync-outbox and sync-e2e green | Version 6 reserved with the coordinator; `npm test` green; request to S17 sent |
| S04 | BL-322 app part: an invite asks before it joins and never switches the open book by itself; map `SCCAP` to "parents full"; Family uses `leave_child` and `remove_child_member`; one idempotency key per user action (G-07). WP-F11-03: pure invite and permission rules in core. Code against the `peek_invite` contract with a stub until S02 merges | `apps/mobile/src/lib/family/**`, `components/family/**`, `app/invite/**`, `app/(tabs)/family.tsx`, `packages/core/src/{invite,family-rules}.ts` (new) and tests, `packages/content/src/features/family.en.ts` | BL-322, WP-F11-03, G-02, G-07; F11 sections 6 and 7 | `[F11-REQ-006]`; `canDo` matrix equals F11 table 6.2; code normalisation (case, dash, O and 0); invite-link tests | Works with the switch off (coming-soon path unchanged) and on; review verdict; requests to S07 for family contracts |
| S05 | WP-F08-B1 spike on a spike branch: a synchronizable Keychain item made on phone A appears on phone B (same Apple Account) and deletes from both; AES-GCM time for a 15 MB file on the SE 3; an upload that resumes after a kill. Build the module and a dev screen; the founder runs it on two iPhones. Draft the ADR 0006 amendment for the owner-only v1.0 scope | `apps/mobile/modules/scribe-keys/**` (new), a new evidence file `docs/qa/evidence/<date>-F08-B1.md`, a new ADR file | WP-F08-B1; F08 section 6.5; ADR 0006 | Module unit tests for wrap, unwrap and wrong-key refusal; the device steps written as a checklist | Evidence recorded with numbers, or a list of what failed; ADR draft opened; nothing merged to `develop` from the spike branch except the evidence and ADR |
| S06 | BL-342: WP-F14-02 pure reminder planner (`packages/core/src/plan-notices.ts`, new); WP-F14-07 scheduling and in-app cards; WP-F14-06 acknowledgment sheet with Save a copy and the Plan terms row. Schedule through the existing reminders scheduler; ask S14 if it needs a change | `apps/mobile/src/lib/billing/**`, `components/plus/**` (new), `app/settings/plus.tsx`, `packages/core/src/plan-notices.ts` (new), `packages/core/test/plan*.test.ts`, `packages/content/src/features/billing.en.ts` | BL-342 (WP-F14-02, -06, -07); F14 sections 6 and 7; Q-003 memo | `[PRD-REQ-003]` over a synthetic year; `[C-REQ-025]`, `[C-REQ-026]`, `[F14-REQ-008]`, `[F14-REQ-010]`, `[F14-REQ-011]`, `[F14-REQ-020]` | No change to `plan.ts` without the founder's approval; copy marked for counsel; review verdict |
| S07 | WP-F19-05 (BL-325): ignore a same-version document with a different body; treat kill-switch config older than the staleness limit as stale. WP-F11-04: family contracts (`parents_full` for `SCCAP`, leave and remove endpoints, gap G-17). Draft the D-080 status report contract (types only) for S06 | `apps/mobile/src/lib/remote/**`, `packages/api/**` | WP-F19-05, WP-F11-04, G-17, G-18; F19 section 11; ADR 0016, ADR 0017 | `[F19-REQ-008]`; `documents.test.ts`; type tests; error enums equal the migration's codes | Contracts reviewed by S04 and S06; `npm test` green |
| S08 | WP-F05-02: harness fixes and gate tooling (Devanagari tokens with `\p{M}`, Chinese CER, per-phrase language, report JSON, `experiments/gate.ts` new). WP-F05-01: clamp and `isFinite` checks in the decode module (review L9). Write the S1-17 run sheet for the founder's first device session with S19 | `experiments/**`, `apps/mobile/modules/scribe-audio/**`, `apps/mobile/test/transcribe-*.test.ts` | WP-F05-02, WP-F05-01 rest, BL-324 audio part; F05 sections 7.1 and 11 | `score.test.ts` cases for Devanagari and Chinese CER; `[F05-REQ-003]` report schema test | A gate report can be produced from a recordings folder; run sheet handed to S19 |
| S09 | WP-F06-02: invisible-character guard (D4), remaining quote styles (D7), closed agreement table with no noun plurals (D9) | `packages/core/src/{meaning,verify,protect,types}.ts`, `packages/core/test/verify*.test.ts` | WP-F06-02; F06 section 7.1; 09 R-01 | `[F06-REQ-003]`, `[F06-REQ-006]`, `[F06-REQ-007]`; golden master changed only where a case asserted a defect, each listed | Founder approval in the PR (CODEOWNERS); `ENGINE_VERSION` comment if behaviour changed |
| S10 | WP-F04-02: the pure capture reducer and constants in `packages/core/src/capture.ts` (new). BL-370 app part: a crash is never a blank page, using S15's state screen; send the root wiring line to S20. BL-380: the recorder keeps the screen awake while live | `packages/core/src/capture.ts` (new) and test, `apps/mobile/src/lib/capture/**`, `lib/resilience/**`, `components/resilience/**`, `app/listen.tsx` | WP-F04-02, BL-370, BL-380; F04 sections 6 and 7 | `[F04-REQ-001]`, `[F04-REQ-003]`, `[F04-REQ-006]`, `[F04-REQ-007]`, `[F04-REQ-008]`, `[F04-REQ-010]`; `resilience.test.ts`, `keep-awake.test.ts` | Verify first against PR #93 (resilience) and #104 (awake only while recording); review verdict |
| S11 | WP-F04-07 typed part: typed text is saved byte for byte (no `normalizeChars` on the typed path in `review.tsx`). BL-406: Write and Review buttons say what they do. BL-433: "Nothing was changed" only when true | `apps/mobile/src/app/review.tsx`, `components/capture/transcript.tsx`, `components/review/**` (new), `packages/content/src/features/words.en.ts` | WP-F04-07, BL-406, BL-433; F04 section 7, F06 section 6 | `[F04-REQ-012]` byte equality with Arabic, Devanagari and emoji input fixtures; `[F06-REQ-037]` | Verify first against PR #103 (Word for word); review verdict |
| S12 | WP-F01-01: on No, the gate deletes any pending invite token; brand placeholder in the stop copy; re-ask wording. BL-383: unknown links open a calm not-found screen. BL-426: the under-18 stop mentions the way back. Verify BL-385 and BL-386 against PR #94 | `apps/mobile/src/lib/age-gate*.ts`, `components/gate/**`, `app/+not-found.tsx`, `apps/mobile/test/age-gate.test.ts` | WP-F01-01, BL-383, BL-426; F01 sections 6 and 7 | `[F01-REQ-001]`, `[F01-REQ-002]`; existing gate tests green; AX5 component test | Review verdict; BL-385 and BL-386 closed with evidence or scoped |
| S13 | BL-323: export carries the person's consent history and dictionary terms (review L4), starting from the export changes on `auto/2026-10-05-fixes`. WP-F09-02: age and chapter helpers in `packages/core/src/book.ts` (new) with empty ranges and month precision | `apps/mobile/src/lib/export/**`, `apps/mobile/test/{export-*}.test.ts`, `apps/mobile/test/__golden__/**`, `packages/core/src/age.ts`, `packages/core/src/book.ts` (new), `packages/core/test/book.test.ts` (new) | BL-323, WP-F09-02; F15 section 7, F09 section 7 | `[DATA-REQ-050]`, `[DATA-REQ-051]` schema tests; export golden test; `[F09-REQ-001]`, `[F09-REQ-002]`, `[F09-REQ-003]`, `[F09-REQ-005]` | Format version bumped and documented; review verdict |
| S14 | WP-F17-05: a pure delete-flow reducer (`packages/core/src/deletion-flow.ts`, new) for subscriber, Family Sharing, co-parent book, sole book, offline, no passcode. WP-F20-03: one crisis resource list in `packages/core/src/safety.ts` | `packages/core/src/deletion-flow.ts` (new), `packages/core/src/safety.ts`, and their tests | WP-F17-05, WP-F20-03; F17 section 6, F20 section 7 | `[F17-REQ-018]`, `[F17-REQ-022]`; `[F20-REQ-004]` | Strings requested from S16; review verdict |
| S15 | BL-398: one StateScreen for empty, error and loading, and one inline caution card. BL-396: one ScreenHeader and one Sheet pattern. Components only; screen owners adopt them | `apps/mobile/src/components/ui/**`, `apps/mobile/test/{design-system-gaps,theme-leaks}.test.ts` | BL-398, BL-396; `docs/design/` component specs; ADR 0101 | Component tests at default and AX5; VoiceOver labels and roles; dark and light token tests | Adoption requests posted to S10 to S14 with the screens named in each M-JR task |
| S16 | WP-F21-01: a build-state claim set (`packages/content/src/claims.ts`, new) and `SHIPPING_LANGUAGES`. The M14 delta: every string that says letters or recordings stay only on this phone, that there is no backup, that co-parent sharing is coming soon, or that we never email about Plus gets a server-on variant chosen by build state; `sensitiveConsent.body` names the co-parent (G-21) | `packages/content/src/{strings.en,store.en,site.en}.ts`, `packages/content/src/claims.ts` (new), `packages/content/test/**` | WP-F21-01, G-21, BL-390 (M14 answers FT-55 [R]); F21 section 7 | `[F21-REQ-002]`, `[F21-REQ-003]`, `[F21-REQ-004]`; content rules and no-real-family-data green | Each changed claim listed for counsel; review verdict |
| S17 | The M14 counsel delta: a redline list for the Privacy Policy, Consumer Health Data notice, subprocessors (Storage for encrypted audio, push), data policy, Subscription Terms (the "we do not email you about Plus" lines) and in-app disclosures; new COUNSEL_PACKET questions; a draft D-088 successor for the privacy label once accounts exist; a proposal for BL-338 beta policy versions | `docs/legal/**` | M14, D-073, D-080, D-081, BL-338; F17 section 8, F14 section 13 | Docs lint; ASCII-only check | A package the founder can send on Fri 16 Oct; every change cites its decision; marked "not legal advice" |
| S18 | WP-F18-01: with no provider key there is no consent sheet and no switch. WP-F18-03: guard tests (no analytics keys in remote config, one-file SDK imports, ad SDK denylist). Start from the consent changes on `auto/2026-10-05-fixes` (G-24) | `apps/mobile/src/lib/analytics/**`, `components/consent/**`, `packages/analytics/**`, `scripts/ci/sdk-guards.mjs` (new) | WP-F18-01, WP-F18-03, G-24; F18 section 7 | `[F18-REQ-003]` both ways; `[F18-REQ-007]`, `[F18-REQ-010]` and `[LEGAL-REQ-016]` fail on a planted import | CI line requested from S20; review verdict |
| S19 | BL-002: `scripts/trace.mjs` checks every cited ID exists and writes `docs/TRACE.md` in report mode. Update the evidence template for M14 rows (S1-06 to S1-09, S1-22, WP-F08-B1). Write the founder's first device session as an ordered run sheet with times for Mon 19 Oct | `scripts/trace.mjs` (new), `docs/qa/**`, `docs/TRACE.md` (new) | BL-002, BL-279; ADR 0011; `docs/qa/DEVICE_TEST_PLAN.md` | Trace script unit tests; `npm test` runs it in report mode | Run sheet reviewed by S08 and S05; the founder has it by Fri 16 Oct |
| S20 | BL-349: the app privacy manifest (start from G-23 on the WIP branch). Rebase and land PR #30 (CI hardening and the fence workflow). Prepare, but do not merge, the M14 switch PR: `preview` profile on, `testflight` and `production` unchanged until the R-17 gate, `capabilities.ts` comments and `capabilities.test.ts` updated. Then WP-F02-10 `/auth/confirm` and the AASA paths on `main` | `.github/**`, `apps/mobile/{eas.json,app.config.ts}`, `apps/mobile/src/lib/capabilities.ts`, `apps/mobile/test/{capabilities,config}.test.ts`, `apps/mobile/scripts/**`; on `main`: `apps/web/**` | BL-349, BL-117, M14 switch, WP-F02-10; `docs/backlog/future/06-coparent-sharing-v1-1.md` section 3 item 7 | Privacy-manifest test; capabilities test expects `on` only where flipped; the fence workflow fails a planted `supabase/**` change without the label | Switch PR waits for the founder; preflight output attached; review verdict |

## 10. What only a real iPhone, Apple, counsel or the founder can do

| By | Who | What | Evidence | Unblocks |
|---|---|---|---|---|
| Tue 13 Oct | Founder | Say whether Apple enrolment is Active (FT-01); approve D-089 (M14); FT-04 decisions; F08 Q2 and DR-13 by Fri 16 | Project doc line; DECISIONS entry | Every Apple step; S05 scope; S01 code length |
| Fri 16 Oct | Apple, founder | FT-07 key, FT-08 record (the `.preview` id first, per `docs/release/TESTFLIGHT.md`), FT-16 signing key, FT-17 `eas init` and a development build on the SE 3 | DEVICE_TEST_PLAN P-01 to P-03 | All device work |
| Fri 16 Oct | Counsel | Receives the M14 delta (FT-18) | Sent email | Comments Fri 30 Oct |
| Mon 19 to Fri 23 Oct | Real iPhones (SE 3, iPhone 12, iPhone 15, a current phone) | DEVICE_TEST_PLAN part 1 (S1-01 to S1-25) and part 2 S2-01 to S2-12 (StoreKit); WP-F06-01 (R-01 fixtures under Hermes); WP-F04-01 (kill while recording); WP-F09-01 (chapter render); WP-F15-01 (export throughput); WP-F10-01 (playback interruptions); WP-F13-08 (notifications); WP-F17-00 (switcher snapshot) | One evidence file per session | DR-01; R-02; backup design; cuts in section 2.4 |
| Mon 19 to Fri 23 Oct | Two iPhones on one Apple Account | WP-F08-B1 backup spike | Evidence file | Backup B2 onward |
| Mon 19 to Fri 23 Oct | Two iPhones on two accounts | S1-22 two-phone sync on a switch-on development build against staging | Evidence file | C1 with co-parents |
| Wed 21 Oct | Apple | Internal TestFlight (C0, switch off) | TestFlight build number | C0 |
| Fri 23 Oct | Founder | DR-16; `develop` merged to `main` so staging gets every migration; FT-26 C1 families recruited | Deploy run; Project doc | R-17 gate; C1 |
| Wed 28 Oct | Founder | FT-23 production on Supabase Pro; FT-31 legal pages live; AASA visible on Apple's CDN (about a day, ROADMAP 2.1 section 4) | P-05 URLs | Sign-in for testers |
| Thu 29 Oct | Apple | Beta App Review (about a day [A]) | Approval email | C1 |
| Fri 30 Oct | Counsel; founder with native reviewers | FT-33 comments; FT-34 per-language go or no-go (FT-27 reviewers) | Counsel notes; FT-34 record | Copy freeze; listing languages |
| Mon 2 to Wed 18 Nov | C1 families on their own phones | Real evenings with sign-in, sync and co-parents | TestFlight feedback, triage log | C1 exit |
| Mon 9 to Fri 13 Nov | Founder with the SE 3 and a second phone | DL-01 and DL-02 (500 kills each), DL-03 restore to a second phone, DL-04, DL-05; S2-13 account deletion; S2-14 Apple revocation; S2-15 reminders | Evidence files | G3 and G4 |
| Fri 13 Nov | Counsel, founder | FT-41 sign-off; 1.0.0 policy versions published | Counsel ticks | G4 item 3 |
| Mon 16 to Wed 18 Nov | Two iPhones | WP-F08-B6 restore drill: 20 of 20 with equal hashes, with and without iCloud Keychain | Evidence file | Backup ships |
| Mon 16 to Thu 19 Nov | SE 3 and a current iPhone | FT-39 release-candidate checks: 07 section 3 lines, VoiceOver scripts, TF-01 size, TF-03 update over an older build, TF-05 iPad, TF-06 oldest iOS | Evidence files | G4 |
| Thu 19 Nov | Founder | FT-40 C1 exit review against 07 section 4.4 | Review note | Tag |
| Fri 20 Nov | Founder | FT-43 listing, privacy answers, age rating 18+, review notes; FT-44 approve; tag `ios-v1.0.0` | App Store Connect | Submit |
| Mon 23 Nov | Apple, founder | FT-45 submit; answer App Review within a day (1 to 3 days per round [A]) | Submission | Release |
| Fri 27 Nov | Founder | FT-48 D-004 hedge | DECISIONS | 5.1.1(ix) fallback |
| Before submission | Counsel | DR-10 (18+ gate meets SB 2420), FT-47 (AB 1043), F14 Q-C1 (both reminder channels meet 17602) | Counsel notes | G4 |

## 11. Open questions for this plan

| Q | Who answers, by when | What changes |
|---|---|---|
| Q1 Is Apple enrolment Active, and on what date did it become so? | Founder, Tue 13 Oct | Section 2 dates move day for day |
| Q2 How many founder hours a week are really available for reviews in the next two weeks? | Founder, Wed 14 Oct | Merge slots (section 6.1) and therefore scope |
| Q3 COORDINATION section 6 says agents never push and the coordinator commits, while recent work reached `develop` as pull requests (for example #96, #103, #104). This plan has agents push their own branches and open PRs that the founder merges. Confirm, and the coordinator updates COORDINATION | Founder, Wed 14 Oct | Section 9 header |
| Q4 Data-map rows by request to S17 instead of "same PR" (section 4) | Founder, Wed 14 Oct | 07 section 1.2 item 4 |
| Q5 C1 of 16 days instead of D-045's 21: accept, or slip submission a week | Founder, Fri 23 Oct | Section 2.1 |
| Q6 PR #2 (`develop` to `main`) was blocked by the migration guard on 3 Oct (architecture review CI-02). Staging deploys only from `main`; is the block cleared? | S20 checks, Wed 14 Oct | Staging date (Fri 23 Oct) |
| Q7 Supabase Pro from Wed 28 Oct (about $25 a month per project [U], FOUNDER_TASKS costs) and GitHub plan for a private repo with branch protection | Founder, Fri 23 Oct | Production date; fence |
| Q8 WP-F16-12 load test: BACKLOG defers BL-282 to after launch, 07 G4 requires it at 2x the 1k targets | Founder with S19, Fri 30 Oct | G4 list or scope |
| Q9 Who runs the device scripts with the founder (07 Q5) | Founder, Fri 16 Oct | Device hours in section 2.5 |

## 12. Sources

- Decisions: `_AUTHORING.md` sections 3 and 3b (M1 to M14); `docs/DECISIONS.md` on `develop` D-023, D-041, D-045, D-069, D-073, D-080 to D-088; `09-decisions-and-risks.md` DR-01, DR-07, DR-10, DR-13, DR-16, DR-17, R-01, R-04, R-09, R-11, R-16, R-17.
- Plans: `docs/ROADMAP.md` 2.1 sections 0 to 9; `docs/FOUNDER_TASKS.md` (FT-01 to FT-57, hours and costs); `docs/BACKLOG.md` on `develop` (rules, status at a glance, M5, M8, M12, M-JR, BL-ids as cited); `docs/backlog/FUTURE.md` (OPEN-02 estimate, person-weeks per release, December review slowdown [U]); `docs/backlog/future/06-coparent-sharing-v1-1.md` section 3.
- Specs: section 12 of every file in `features/` (WP ids, status 13 Oct); `05-feature-map.md` sections 4 and 5; `06-nfr.md`; `07-quality-bar.md` sections 1, 4, 5.
- Operating system: `CLAUDE.md`; `docs/agents/COORDINATION.md`; `docs/agents/BOARD.md`; `docs/adr/0011-requirements-and-agent-workflow.md`; `.github/CODEOWNERS`; `.github/pull_request_template.md`; `.github/workflows/{ci,migration-guard,db-cli,deploy-db,nightly,testflight}.yml`; `supabase/APPLY.md`; `docs/ops/DEPLOY.md`.
- Evidence: `docs/qa/DEVICE_TEST_PLAN.md`; `docs/reviews/2026-10-04-security-privacy.md`; `docs/release/TESTFLIGHT.md`; `apps/mobile/eas.json`; `apps/mobile/src/lib/capabilities.ts`; `packages/api/src/keys.ts`; `.github/migrations-applied.txt`; branch `auto/2026-10-05-fixes` (`docs/agents/GAPS.md` there); GitHub API open-PR list (13 Oct); the Project doc `infra/architecture-review-2026-10-03-findings.md` (CI-01, CI-02).
