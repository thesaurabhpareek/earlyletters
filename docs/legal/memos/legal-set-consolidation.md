---
title: Legal set consolidation, PR #163 and PR #136 against current develop
date: 2026-10-28
reviewer: AI (Claude), legal drafting support; not a lawyer
compared: PR #163 head 53a76226 (docs/legal-v1-server), PR #136 head f0e8f696 (docs/legal-counsel-delta-m14), develop 6bfb94a9, main b8b52d5e (website only)
status: proposal for the founder and the coordinator; not legal advice
---

> **This memo is a draft prepared by an AI for the founder and, later, for counsel review. It is not legal advice, and it says nothing is compliant or lawful.** It compares drafts and checks what they say against the code and `docs/DECISIONS.md`. It edits no legal text. Every claim carries a tag: **V** (read or run in this pass, source named), **I** (inferred from what was read), **U** (could not verify).

## 0. The short answer

1. Both PRs are dirty against develop (GitHub `mergeable: false`, V) and neither has a recorded review (V, `reviews` endpoint empty). Neither can merge as is. They overlap on 8 files and collide on version numbers (section 3).
2. Both were written for one product ("server features on", D-100). The code ships that product in two builds: build 1 (profile `testflight`, servers off) and build 2 (profile `preview`, servers on, staging). In every profile `EXPO_PUBLIC_BACKUP`, `EXPO_PUBLIC_STATUS_REPORT` and `EXPO_PUBLIC_ANALYTICS` are `off` (V, `apps/mobile/eas.json`). So neither PR describes a build that exists today in full; #163 comes much closer because it says "not available yet" for backup.
3. develop's own `docs/legal/*` is still the 3 Oct text (versions 1.x; V, front matter). It is wrong on prices, analytics, the Read together gate and recordings (section 4). It is the worst of the three for the builds that exist.
4. Proposal (section 6): use **#163 as the base**, rebased on develop, and salvage specific parts of #136. Do not merge both. The base choice is the founder's and counsel's; this is a proposal only.

## 1. How the two PRs differ in approach

| | #163 `docs/legal-v1-server` (16 Oct) | #136 `docs/legal-counsel-delta-m14` (15 Oct) |
|---|---|---|
| Files (V, `gh api .../files`) | 15: rewrites the 5 published documents, in-app disclosures, packet, labels, DATA_CLASSIFICATION, ENGINEERING_REQUIREMENTS 1.3.0, POLICY_VERSIONING, register; adds BENCHMARK, delete-account-page, `packages/content/test/legal-docs.test.ts`; deletes `consumer-health-data-notice.md` | 9: redlines of packet, labels, consumer health notice, data-policy, in-app, privacy, subprocessors, subscription terms, terms. No requirements documents, no test |
| Style | Plain and short, no counsel notes inside published drafts (founder direction of 15 Oct, as the packet states, I: the direction itself is quoted from the packet, not from a decision entry) | Keeps the long 3 Oct structure, Appendix A counsel notes, and `[COUNSEL: ...]` notes inline |
| Product assumed | Option B with backup described as "not available yet" | Server-on including backup, status report, reminder emails, push, new-session email, opt-in PostHog, as if all built |
| Decision ids | Current ids (D-100 to D-108) | Old ids: D-089 to D-092 for what are now D-100 to D-103, and "D-093 proposed" for what is now D-111 item 2 (V: 136 packet header; renumbering note at `docs/DECISIONS.md` line 619) |
| Version numbers | Privacy 2.1.0, Terms 3.1.0, Subscription 3.1.0, in-app 3.1.0, providers 2.1.0 (jump; 3.0.0 retired from #81) | Privacy 1.5.0, Terms 1.6.0, Subscription 1.5.0, in-app 1.5.0, providers 1.4.0 (continues develop) |
| Packet | 190 lines, questions renumbered Q41 to Q56 plus Q32 to Q40 carried | 375 lines, Q1 to Q33, R4 order |

## 2. File by file: #163 against #136

| File | Conflict between the two | Better base | Note |
|---|---|---|---|
| `privacy-policy.md` | Total: both rewrite the whole file. 1.5.0 vs 2.1.0 (V) | #163 for structure; #136 for CCPA category table and deletion-matrix detail (I, would need counsel to decide how much to publish) | #136 keeps opt-in PostHog and push tokens as live (V, lines 64, 67, 151); #163 says no analytics, no push (V) |
| `terms-of-service.md` | Total. 1.6.0 vs 3.1.0 | #163 (175 lines against 542) | Both say neither parent can remove the other after 72 hours (V). #136's packet table row 5 says "either parent can remove the other" while its Terms 9.1 says the opposite: internal inconsistency in #136 (V) |
| `subscription-terms.md` | Total | #163 | #136 describes reminder emails and the consent record as live (V); #163 says our servers receive no purchases (V) |
| `subprocessors.md` | Total | #163 | #136 lists PostHog and Apple push; #163 lists Supabase, Cloudflare R2, Resend, Vercel, with Hugging Face and Apple as other companies |
| `in-app-disclosures.md` | Total | #163 | #163 section 3 lists strings in the repo that contradict the drafts; still true today (section 5) |
| `app-store-privacy-labels.md` | Both set 1.4.0 (version collision) with different answers | Neither as is | #136 declares Audio Data, Purchase History, Email for a build that does not exist; #163 declares what build 2 keeps and adds Audio Data "when backup ships". #163 matches the generated privacy manifest in spirit (five types, V, `docs/release/TESTFLIGHT.md` line 201) |
| `COUNSEL_PACKET.md` | Total; both 1.1.0 | #163 for currency; #136 for the full question texts | #163 refers to 1.0.0 in git history for Q1 to Q31 full text; #136 keeps them (V) |
| `consumer-health-data-notice.md` | #136 updates it to 1.3.0; #163 deletes it | Open (counsel Q32) | `packages/brand/index.ts` line 53 still has `healthPrivacy` => `/health-privacy` (V); `docs/qa/ALPHA_GO_NO_GO.md` B2-9 still lists `/health-privacy` (V) |
| `data-policy.md` | #136 updates to 1.3.0; #163 leaves 1.2.0 and lists it as a follow-up (V, packet 0) | #136 as a starting point | Not updated for either by the base |
| `ENGINEERING_REQUIREMENTS.md`, `POLICY_VERSIONING.md`, `DATA_CLASSIFICATION.md`, `compliance-register.md` | #163 only | #163 | Requirement documents: these are not this role's to edit. If #163 is the base, the changes should be proposed in the PR body and applied by their owner (I: from the role rules) |
| `BENCHMARK.md`, `delete-account-page.md`, `legal-docs.test.ts` | #163 only | #163 | See section 3 for the test |

**The test.** I overlaid #163's `docs/legal` on develop's (keeping develop's `TESTFLIGHT_TESTERS.md`, dropping the consumer notice) in a scratch copy and ran `legal-docs.test.ts` with vitest: 18 of 18 passed (V). That shows the test accepts that merged set; it does not show the texts are true (I). The test also does not exist on develop, so a rebase would carry it.

## 3. Conflicts with current develop

Develop's `docs/legal` has moved only a little since the PRs' merge bases (V, `git log`): `TESTFLIGHT_TESTERS.md` 1.0.1 (#195), `DELETION_AND_EXPORT_SPEC.md` 1.2.1, `DATA_CLASSIFICATION.md` (3 lines). Both PRs therefore conflict mostly with each other and with the code and decisions, not with a changed develop text.

| Item | #163 | #136 | develop / code |
|---|---|---|---|
| Version numbers | Skips to 2.1.0 and 3.1.0 | 1.5.0 and 1.6.0 | develop 1.4.0 to 1.5.0 (V). `POLICY_VERSIONING.md` sets the rules; whether a jump is allowed is for counsel and the founder (U: I did not re-read the numbering rule in full) |
| Decision ids | Current | Pre-renumber (D-089 to D-094 cited for D-100 to D-105) | Wrong ids in #136 would send counsel to the wrong entries (V) |
| `TESTFLIGHT_TESTERS.md` | Untouched; not in the packet's file list | Untouched | Exists on develop only; neither packet lists it (V) |
| Website | Says "the site renders `docs/legal` from main" and plans routes `/health-privacy`, `/delete-account`, `/subscription-terms` | Assumes the long drafts are published | `apps/web/src/lib/legal/pages.ts` on main: "Nothing is read from docs/legal"; only `/privacy` and `/terms` exist, as short pages (#169, merged) (V) |
| Dependencies | "Merges after #126"; backup server "on `feat/backup-server`, not merged" | Same assumption of unbuilt items | #126, #151, #162, #195, #169 are all merged (V, `gh api`). #81 closed unmerged (V) |

## 4. Statements no longer true of the shipped code or decisions

Checked against develop 6bfb94a9. "Build 1" = profile `testflight`, "build 2" = profile `preview` (V, `eas.json`; `docs/release/TESTFLIGHT.md`).

### 4.1 In develop's current `docs/legal` (3 Oct text), not fixed by either PR in full

| Statement | Why it is stale | Tag |
|---|---|---|
| Plus $3.99 / $29.99, Read together gate after 3 sessions (Terms, Subscription Terms, packet) | D-082 replaced them: $4.99 / $49.99, 2 free letters. `packages/content/src/pricing.ts` agrees. Both PRs update this | V |
| Opt-in PostHog analytics | D-095; `EXPO_PUBLIC_ANALYTICS` off in every profile. #163 says none (correct); #136 keeps PostHog (wrong for now) | V |
| "Recordings never leave the phone" | True for both builds today (BACKUP off) but contradicts D-100 and D-102 once backup is switched on. Needs a split by build, not a single statement | V |
| Counsel packet dates (package 9 Oct, submit 2 to 6 Nov) | Overtaken by D-101, D-106 and the alpha plan (`docs/release/ALPHA_PLAN.md` pointer). Exact submission date still open per D-100 | V |

### 4.2 In #163

| Statement | State | Tag |
|---|---|---|
| "Today only the founder has that access" / two-factor / quarterly seal checks / two sealed paper copies | Operational facts, not code. The packet itself says the founder confirms each | U |
| Backup "not available yet" | True of every build (BACKUP off). But the packet's "phone side not built, contract only" is stale: `apps/mobile/src/lib/backup/` (queue, keys, restore, tus) and `supabase/functions/escrow/` are on develop | V |
| "Sealed keys and encrypted recordings stored with Supabase; recovery key in a separate project" | Code for the escrow function and `entry-audio` migration exist (`20261023000000_backup_server.sql`); the separate project's existence and the paper copies are not verifiable from the repo | I / U |
| Hold of one or three days, 7 day device approval | D-108 sets the 7 day rule (V). The 24 and 72 hour holds come from the PRD, I did not read the escrow code for the values | U |
| "A parent can leave a book at any time and chooses whether to leave their letters" (Terms 4.3, Privacy 3) | D-113: Leave is hidden in build 2 (`/invite/leave` shows coming soon). So not true of build 2. Not true of build 1 either (no sharing) | V |
| "Deleting your account removes your letters from every book" (Privacy 7) | D-116 and #248: a former member's letters survive the remaining parent's book purge; the book row is tombstoned. Neither PR mentions it | V |
| Account deletion clock 30 days then 31 / 38 / 45 | The 30 day tombstone interval is in the purge migrations (V). The 31 / 38 / 45 clock and the provider erase times are policy, not verified in code here | V for 30, U for the rest |
| Held letters (Keep gate) | D-111 item: held-draft sync is on in build 2. #163 does not describe held drafts on the server (grep: none in Privacy or Terms) | V |
| Reminder emails not built, status report "shell" | Partly stale: `supabase/functions/subscription-status/handler.ts` and the app's `status-report.*` are built, but off in every profile and no email sender exists. The statement "our servers do not receive purchases" stays true for both builds | V |
| Sign-in "Apple, or an emailed link and code"; Google left out | Matches `docs/release/TESTFLIGHT.md` (no Google in either build) | V |
| "Terms 3.2 asks people to tell us" about new-device sign-ins | No `account_sessions_seen` or sender in `supabase/` or `apps/mobile/src` (grep) | V |
| Co-parent text "undo within 72 hours, then neither can remove the other" | Matches migration `20261015020000` (V). But D-099 says "either parent can see and remove family members" (v1.1 family members): a decision and the Terms read differently | V, flag |
| Email code length | Terms/Privacy do not state it. #136 says 8 digits, but the app and AUTH_SETUP default to 6 until the founder sets 8 in both places (V, `TESTFLIGHT.md` line 79) | V |

### 4.3 In #136

| Statement | State | Tag |
|---|---|---|
| Status report plus reminder emails are live in v1.0 | Report code exists, off in all profiles; no email sender | V |
| Push notifications (co-parent letter added, restore alert) | No push token table in `supabase/migrations`, no sender; `expo-notifications` is used for local reminders (D-094); TESTFLIGHT says answer No to Push Notifications | V |
| Email on every new session with "Not you?" page | Not built (grep, section 4.2) | V |
| Opt-in PostHog; Hindi and other seven languages | Analytics off (V). The alpha is English only (`EXPO_PUBLIC_ENGLISH_ONLY`, D-111 item 4) in both alpha profiles; production leaves it unset (V) | V |
| Backup "Whether free or Plus is proposed (D-093 item 2)" | Decided free: D-111 item 6 and D-104 row (V) | V |
| Sign in with Google | Not offered in either alpha build (V) | V |
| "Either parent can remove the other" (packet row 5) | Contradicts #136's own Terms 9.1 and the migration | V |
| Calendar: submit week of 3 May 2027, T-numbers | PRD V2 plan; the alpha dates in `ALPHA_GO_NO_GO.md` are proposed, not confirmed. Date still open per D-100 | V |

### 4.4 Strings in the app that contradict #163's drafts (still present on develop)

`permissions.microphone` "Your recordings stay on this phone" (true while BACKUP is off, false once on); `trust.signIn.privacy` and `stories.en.ts` "Only you and the people you invite can read your letters"; `trust.firstRecording.title` "Your voice stays here"; `sensitiveConsent.body` "the family you choose" (V, grep of `packages/content/src`). Hand-off: **content** (copy changes), after counsel answers Q43.

## 5. What would still need to be written

Build 1 (servers off: no account, no sync, no Family, no delete-account, no Plus products required, English only; V, `TESTFLIGHT.md` lines 122 and 172):

- A short notice for testers on what stays on the phone, what feedback reveals and who sees it. `TESTFLIGHT_TESTERS.md` already drafts this (V); it needs to be reconciled with the packet.
- Privacy and Terms text that fits an app that sends nothing to our servers except pack downloads (R2, Hugging Face) and tester feedback through Apple. Neither PR has a build-1 version (I). Sections of #163 that describe accounts would not apply.
- An answer for what the website `/privacy` and `/terms` (short pages, main) say, because those are what a build-1 tester can actually open (V). Who reconciles web copy with the drafts is `content` and the website owner (I).
- Labels: "no data collected" is likely the build-1 answer; `docs/legal/app-store-privacy-labels.md` 1.3.0 on develop is not that (I: not re-derived here; `privacy-manifest.test.ts` is the place to check).

Build 2 (servers on against staging, family only, backup and status report off):

- Take #163 sections on account, sync, sensitive-data consent, co-parent sharing, deletion, providers, and remove or flag what is not in build 2: backup (section 4 of the Privacy Policy), recovery-key logging, reminder emails, Leave.
- Add: held drafts on the server, the former-member rule (D-116), Leave hidden (D-113), legal holds in purge (#251, migration `20261023020000`), the invite text with the child's name (D-113 item 3).
- A pre-sign-in publication path. D-100 says legal pages describing a server product are live before sign-in. `ALPHA_GO_NO_GO.md` B2-9 is open for that and `/health-privacy`, `/subprocessors`, `/delete-account` are not on main (V).
- A clear rule on which version a family accepts if text is a draft (counsel Q44 in #163).

Later builds (backup on, status report, emails, analytics, push): the PR text for those should wait for the code, and arrive with notice under `POLICY_VERSIONING.md`.

Process note: `ENGINEERING_REQUIREMENTS.md` and `DELETION_AND_EXPORT_SPEC.md` are requirement documents. #163 edits the first. If it becomes the base, I would send that part as a proposal in the PR body (I, from role rules, not from a check of who authored the PR).

## 6. Proposal: base and salvage

**Base: #163, rebased on develop**, because it is the one whose text matches the code (backup "not available", no analytics, no push, no reminder emails), it has current decision ids, it follows the founder direction of plain, short, no internal references, and it carries a test that fails when stale prices or on-device claims return (I: the founder direction is quoted in the packet, not seen in a decision entry).

Salvage from #136:

1. The "what changed from 1.0.0" table (section 1.1) as a reading aid for counsel, with ids corrected to D-100 to D-103 and D-111.
2. Full question texts for Q1 to Q31 (kept in 1.0.0 history only by #163).
3. The long consumer health data notice, if counsel says a separate document is required (Q32); it must then be updated for D-102.
4. `data-policy.md` 1.3.0 rows for held drafts, status and consent records; to be cut to what is built.
5. The CCPA category table and the deletion matrix as an appendix for counsel only, not published text.
6. The recovery-key "honest limit" wording, which both PRs share; keep one copy.

Do not carry from #136: push, new-session email, PostHog, reminder emails, "either parent can remove", decision ids D-089 to D-094, versions 1.5.0 and 1.6.0 (they would collide with #163's numbers).

Order I would suggest to the coordinator: (a) founder decides base and the version-number question; (b) rebase #163; (c) split build 1 and build 2 text and mark the unbuilt items; (d) content fixes the app strings in 4.4; (e) a packet 1.1.1 with the dates from `ALPHA_GO_NO_GO.md`.

## 7. Questions still open for counsel (short list)

Taken from #163's packet and checked against what ships. Defaults are the drafts' defaults, not advice.

1. Publisher: individual or entity, now that children's data and (later) an escrow key sit on a server (#163 Q47). Needed before real families sign in.
2. Health details: is a separate consumer health data policy required (Washington MHMDA, RCW 19.373, text not re-read here, U), or is one section enough (Q32, Q48)? One consent or two, and does sharing with the co-parent need its own (D-050).
3. Plus notices with Apple as merchant: are phone-only reminders enough for v1.0 for a buyer who never signs in; what, if anything, must be kept after account deletion (Q41, Q-003 memo).
4. Absolute claims: approve or replace "Only you and the people you invite can read your letters", "Private by default", "Your voice stays here", and the staff-access line (Q43).
5. Real families under draft text: may the founder's family and invited friends use build 2 under drafts, with what notice (Q44)? This decides whether build 2 waits.
6. Age: Texas SB 2420 and California AB 1043 from 1 Jan 2027 (Q46); does an adults-only gate suffice.
7. COPPA and a baby's voice in a parent's recording once backup is on (Q45); breach classification for backed-up audio when we hold a key (Q42).
8. Two parents per book: enforceability of "no removal after 72 hours" for separating parents, and fiduciary access (Q49, Q53); the safety-removal standard and legal orders (Q50).
9. Deletion: kept records and periods (Q51: log retention 12 vs 24 months conflict between D-021 and the PRD), and the new D-116 rule that a former member's letters survive the book purge.
10. Liability cap and dispute terms with recordings on our servers (Q39).
11. Training-data terms behind the non-English speech models (Q9) and trademark clearance (Q10): unchanged, and the alpha is English only (D-111 item 4).
12. Whether versions can jump (privacy 2.1.0, terms 3.1.0) after a retired number (POLICY_VERSIONING).

## 8. What I could not verify

- Whether the web `main` copy (`privacy-copy.ts`, `terms-copy.ts`) matches either draft; I read only that it does not read `docs/legal`.
- The values of the escrow holds in code, the separate recovery project, paper copies, two-factor access, vendor retention pages (BENCHMARK says unverified).
- Any statute text. This memo cites none as verified. Statute and rule references above come from the packets and are U until counsel or a later pass opens them.
- Whether a review has happened off the GitHub reviews endpoint (it returned none for both PRs).
- GitHub PR bodies and comments were not read.
- I did not run the repo test suite, only `legal-docs.test.ts` in a scratch copy.

Hand-offs: copy changes in 4.4 to `content`; the Leave, held-draft and former-member gaps to `privacy`; base choice and version numbering to the founder.
