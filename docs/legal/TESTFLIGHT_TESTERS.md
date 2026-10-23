---
title: TestFlight testers, who sees their feedback, and what they are told
version: 1.0.1
status: draft-for-counsel
last_updated: 2026-10-23
owner: founder
prepared_by: AI (Claude), legal drafting support (stream S17); not legal advice
package: RA-17-04 (docs/release/AUTOMATION.md section 5), with S16's RA-16-01; due Mon 19 Oct 2026 for AF-09 and AF-11
---

# TestFlight testers: who sees their feedback, and what they are told

Version 1.0.1. Drafting support, not legal advice. This file covers the alpha on TestFlight (D-106; builds 1 and 2 of `docs/release/ALPHA_PLAN.md` on #152) and stays valid for C1. It does three things:
- states, from Apple's own pages, who can see a tester's identity and feedback;
- sets out the founder's choices for the "Family" and "Friends" groups (AF-09, AF-11), with a recommendation;
- lists what the tester notice must say. The words are S16's (`packages/content/src/release/testflight.en.ts`, RA-16-01); section 5 gives a draft for S16 to adopt or rewrite.

Real names of family members or friends never go in this repository (CLAUDE.md). The written record in section 4.4 is kept outside it.

## 1. Apple's facts (read on developer.apple.com on 16 Oct 2026)

| # | Fact | Source | Verified |
|---|---|---|---|
| A1 | Internal testers are App Store Connect users: up to 100 "members of your development team who hold the Account Holder, Admin, App Manager, Developer, or Marketing role" | developer.apple.com/testflight ("Add internal testers"); App Store Connect Help, "Add internal testers" ("App Store Connect users with access to your content") | **Yes** |
| A2 | Viewing tester feedback (screenshots, crash comments, general comments) needs one of the same five roles | Help, "View tester feedback" ("Required role: Account Holder, Admin, App Manager, Developer, or Marketing") | **Yes** |
| A3 | So every internal tester can read every piece of TestFlight feedback for each app they have access to, from internal and external testers alike | A1 and A2 together (Apple does not say it in one sentence) | **Yes, by inference from A1 and A2** |
| A4 | The tester list shows each tester's name and email when invited by email, and has filters for device, sessions, crashes and feedback; a CSV download holds first name, last name and email. Same five roles | Help, "View and manage tester information" | **Yes** |
| A5 | "When a tester is invited by an invitation email, their email address is displayed in the detailed feedback view"; public-link testers appear anonymous unless they type their email | Help, "View tester feedback" | **Yes** |
| A6 | A crash or screenshot submission carries: `comment`, `email`, `deviceModel`, `deviceFamily`, `osVersion`, `locale`, `timeZone`, `batteryPercentage`, `connectionType`, `diskBytesAvailable`, `diskBytesTotal`, `pairedAppleWatch`, screen size, architecture, app uptime, build bundle id, created date; screenshot submissions add `screenshots` | App Store Connect API, `BetaFeedbackCrashSubmission.Attributes` and `BetaFeedbackScreenshotSubmission.Attributes` (JSON documentation data) | **Yes** |
| A7 | Feedback can be turned off per tester group: "You can disable the ability for tester groups to take screenshots and submit feedback directly from your beta app, including details about crashes ... All testers can still send email feedback using the TestFlight app." A tester in several groups cannot send in-app feedback if any of those groups has it off | Help, "View tester feedback", "Disable feedback" and its FAQ | **Yes**. This answers PRD V2 `07-quality-bar.md` Q3 |
| A8 | Feedback and testers can be deleted ("Delete Feedback"; "Delete Tester & Feedback" also removes the tester); crash reports can be downloaded for 120 days | Help, "View tester feedback" | **Yes** |
| A9 | The Feedback Email in Test Information is where testers write from the TestFlight app and "the reply-to address in email invitations to testers"; the Beta App Description is required for external testing | Help, "Provide test information" | **Yes** |
| A10 | The Developer role has full access to "Manage internal TestFlight groups and add builds" and read-only access to builds and external groups; it cannot edit App Store details, create versions or submit apps, and its access can be limited to certain apps. Marketing has the same TestFlight rights and can also edit App Store details, create versions and manage promo codes. Every role can "View Users and Access" | Apple Developer Help, "Role permissions" table | **Yes** |
| A11 | External testers are "people you invite to test your app who aren't App Store Connect users"; they have no App Store Connect access | Help, "Invite external testers" | **Yes** |
| A12 | "Apps downloaded from TestFlight will automatically operate in a sandbox environment" for purchases | Help, "Testing subscriptions and In-App Purchases in TestFlight" | **Yes** |
| A13 | What Apple itself tells a tester, when they accept, about the data it shares with the developer | apple.com legal pages and testflight.apple.com | **Unverified**: both hosts were blocked here (403) |
| A14 | Whether TestFlight crash logs also reach Xcode Organizer for a group with feedback off, and whether Organizer shows who sent them | Apple's crash-reporting pages | **Unverified**; Organizer's crash and energy logs are visible to every role (A10 table) |

## 2. Who can see what during the alpha

The alpha plan puts every group on one app record, "Early Letters Preview" (`com.earlyletters.scribe.preview`; #152 F08). "Founder" and "Family" are internal groups, "Friends" is external (AUTOMATION.md 2.4, AF-09).

| What | Apple | Founder (Account Holder) | Family members (internal, Developer role, Preview only) | Friends (external) | Public repository |
|---|---|---|---|---|---|
| Every tester's name and email (tester list, CSV) | Yes | Yes | **Yes** (A4) | No (A11) | Never |
| Each tester's devices, sessions and crash counts | Yes | Yes | **Yes** (A4) | No | Never |
| Screenshots, comments and crash reports sent through TestFlight, from any group with feedback on | Yes | Yes | **Yes** (A2, A3, A5) | No | Never (AUTOMATION.md 2.7: content-free pointers only, after the alpha) |
| Device details in each submission (A6) | Yes | Yes | **Yes** | No | Never |
| Email to the TestFlight Feedback Email (A9) | Not in App Store Connect [U] | Yes | No | No | Never |
| Email from the app's Help row | No | Yes (it goes to `hello@`, which reaches the founder's inbox) | No | No | Never |
| The list of App Store Connect users and their roles | Yes | Yes | **Yes** (A10: "View Users and Access") | No | Never |

What this means:
- A family member who tests can read what friends send through TestFlight, and see friends' names and email addresses, unless Friends' in-app feedback is off. Even then, the tester list still shows friends' names and emails (A4).
- A screenshot shows whatever is on the screen, which in this app can be a letter and a child's name. Through TestFlight it reaches Apple, the founder and every family member who tests.
- Friends cannot see anyone else's feedback or identity.
- The automation plan's line "other testers on the team can see feedback you send through TestFlight" is right for Family and too narrow for Friends (section 6, request to S16 and S20).

## 3. The rule for feedback content

No tester text, email address, screenshot, locale or time zone reaches a public issue, a public log, or a prompt sent to a model provider (AUTOMATION.md 2.7; ADR 0026 decision 9). For the alpha nothing is automated: the founder reads feedback in App Store Connect and in the feedback mailbox by hand.

One gap to close: the app's Help row writes to `hello@` (`packages/brand` `supportEmail`), which reaches the founder's inbox. If an agent session has a mail connector on that inbox, Help email from testers is readable by it. Either the alpha builds' Help row points at the dedicated feedback mailbox, or the notice must not promise that only the founder reads Help email (request to S20 and S16, section 6).

## 4. The founder's choices (AF-09, AF-11)

### 4.1 Family members' role [Rec: Developer, Preview only]

Of the five roles that can be internal testers (A1), Developer and Marketing give the least. Developer cannot edit App Store details, create versions or manage promo codes; Marketing can (A10). Give family members **Developer**, with access limited to "Early Letters Preview". This resolves the "[U: which role that is]" in AUTOMATION.md 2.7 and AF-09.

What Developer still allows: adding builds to internal groups (A10). Rule for the founder to state when inviting: family members never add or remove builds. The servers-on rule of D-100 depends on it.

### 4.2 In-app feedback for "Friends" [Rec: off during the alpha]

| Option | What friends' feedback looks like | Who sees it | Cost |
|---|---|---|---|
| **Off (recommended)** | Friends email the Feedback Email (A9), a dedicated mailbox no connector reads (AUTOMATION.md 2.7) | The founder | No in-app screenshots or crash comments from friends; crash counts still show (A4); A14 open |
| On | Screenshots, comments and crash reports in App Store Connect | Apple, the founder and every family member who tests | The friends' notice must say family members can read it |

Either way, friends' names and email addresses are visible to family members in the tester list (A4); the notice says so.

### 4.3 In-app feedback for "Family" [Rec: on]

Family are the C0 crash signal. Their feedback is visible to the founder and to the other family members who test, and they are told so. A tester in several groups cannot send in-app feedback if any of them has it off (A7), so the founder tests from "Founder" only.

### 4.4 The written record (AF-09), kept outside the repository

> On [date], the internal testers of Early Letters Preview are [names], each with the Developer role and access to that app only. I told each of them, before adding them, that internal testers can see in App Store Connect every tester's name and email address, devices, sessions and crash counts, and every screenshot, comment and crash report sent through TestFlight for this app, including friends' if Friends' feedback is on. I asked them never to add or remove builds. Friends' in-app feedback is [off or on]. Signed, the founder.

### 4.5 After the alpha [Rec]

- Delete each TestFlight feedback item once it is handled, and all of them within 30 days after the alpha ends (A8). Keep nothing from it in the repository.
- Remove testers who leave with "Delete Tester & Feedback" (A8).
- C1 (15 to 25 families): every outside family is an external tester. Internal testers stay the founder and the founder's own household, so no outside family sees another's identity or feedback.

## 5. What the tester notice must say (requirements for S16, RA-16-01)

Where it appears: the beta app description (required for Friends, shown in the TestFlight invitation, A9), the What to Test text of each build, the invitation email or message the founder sends family, and the feedback line. Content rules apply (no dashes, curly quotes, ellipsis characters or emoji; no fear or loss language).

### 5.1 Must say, every build

1. It is an early test version; it can make mistakes and will change.
2. You must be 18 or older.
3. Purchases in the test build use Apple's test system and cost nothing (A12).
4. What TestFlight sends with feedback: your name and email address, and details about your phone (model, iOS version, battery, free space, network type, language and time zone) (A5, A6).
5. A screenshot shows whatever is on your screen: choose a screen without your letters, and leave your child's name and your letters' words out of what you write.
6. Who can see it, by group (5.3).
7. How to send feedback by email, and to which address.
8. You can stop testing at any time in TestFlight, and ask us to delete your feedback.

### 5.2 Must say, by build

| Build | Also say | Never say |
|---|---|---|
| Build 1 (`testflight`, servers off) | There is no account in this build; your letters stay on this phone | "Everything stays on your phone" (feedback and crash reports leave it); anything about sync or backup |
| Build 2 (`preview`, servers on, staging) | If you sign in, your letters and your child's details are stored on our test server so they reach your other phone and your co-parent; the Privacy Policy and Terms you agree to in the app apply to this test; recordings are not uploaded in this test (recording backup is not in build 2: the build flag `EXPO_PUBLIC_BACKUP` is off in `apps/mobile/eas.json`, #145); what happens to letters on the test server when the test ends (founder fact, below); export a copy now and then (Settings, Your data); delete your account and its letters in Settings, Delete account (its own row, below Your data) | "Stays only on this phone"; that letters will carry over to the App Store version, unless the founder decides they will |

Founder fact the build 2 text needs: what happens to the test server's letters at the end of the alpha (default for the draft: we tell testers before the test server is closed, and Export keeps a copy). The recovery key question (the alpha plan names a drill escrow key on Mon 26) applies only to a build with backup on; build 2 has none today. If a later test build turns backup on and its key is not held the way Privacy Policy section 4 describes, that build's text says the test uses a test recovery key.

### 5.3 Who can see it, by group

| Group | Line (draft) |
|---|---|
| Family (internal) | "Everyone on the testing team can see what you send through TestFlight, and the name and email address of every tester. The team is the founder and the family members who test." |
| Friends (external), feedback off | "Please send feedback by email to [feedback address]. Only the founder reads it. The founder's family members who test the app can see your name and email address in Apple's list of testers." |
| Friends (external), feedback on | "What you send through TestFlight, and your name and email address, can be seen by the founder and by the founder's family members who test the app." |

### 5.4 Draft text for S16 (to adopt or rewrite)

**Beta app description (Friends):**
> Early Letters is a memory book you fill by talking to your child. This is an early test version for a small group of family and friends. It can make mistakes, and it will change. You must be 18 or older to take part. Purchases in this test cost nothing.

**Feedback line (every build):**
> When you send feedback through TestFlight, Apple sends us your name, your email address and details about your phone, such as its model, iOS version, battery, free space, network type, language and time zone. A screenshot shows whatever is on your screen, so please pick a screen without your letters, and leave your child's name and your letters' words out of what you write. You can stop testing at any time in TestFlight, and ask us to delete your feedback.

**Build 1 opening (What to Test):**
> Thank you for testing. This build has no account: your letters stay on this phone.

**Build 2 opening (What to Test):**
> Thank you for testing. This build can sync. If you sign in, your letters and your child's details are stored on our test server, so they reach your other phone and your co-parent. The Privacy Policy and Terms you agree to in the app apply to this test. Recordings are not uploaded in this test. Please export a copy of your book now and then in Settings, Your data.

Each text then adds the group line from 5.3 and S16's list of what to try.

## 6. Requests to other owners

- **S16 (RA-16-01):** the strings in section 5, with the group lines of 5.3 in place of the single line "other testers on the team can see feedback you send through TestFlight". #145's What to Test copy ("Everything stays on your phone: there are no accounts and no sync") is replaced by the build 1 opening.
- **S20 (`docs/release/AUTOMATION.md` 2.4 and 2.7, `docs/release/TESTFLIGHT.md`):** the internal-tester role is Developer, limited to the Preview app (4.1); internal testers also see every tester's name and email and external testers' feedback (A3, A4); feedback can be turned off per group (A7). For the alpha builds, consider pointing Help at the feedback mailbox (section 3).
- **Founder (AF-09, AF-11):** the choices in 4.1 to 4.3; the record in 4.4, outside the repository; the Feedback Email set to the dedicated mailbox; the founder fact in 5.2 (and the recovery key, only for a build with backup on).
- **S19 (B1-11, B2-20 in `docs/qa/ALPHA_GO_NO_GO.md` on #176):** evidence is the adopted strings plus the founder's statement of each group's feedback setting.
- **S17 (after #163 merges):** fold the questions in section 7 into COUNSEL_PACKET as Q57 to Q59, and add a line to the App Privacy answers that TestFlight feedback is Apple's collection, not the app's (A13 open).

## 7. Questions for counsel (Q57 to Q59, to join COUNSEL_PACKET after #163)

- **Q57 (A, before Friends get build 1).** Is the notice in section 5 adequate notice for what TestFlight passes to us about a tester (A6)? Does showing friends' names and email addresses to the family members who test (A4) need the friends' consent, or is notice enough? **Default:** notice as in 5.3; Friends' in-app feedback off.
- **Q58 (A, before Friends get build 2).** Is an external TestFlight group a public launch for LEGAL-REQ purposes (PRD V2 `07-quality-bar.md` Q4)? With Q44 (draft texts for real families), may friends sign in on build 2 under texts counsel has not commented on? **Default:** PRD V2's rule, R4 PT-31: no.
- **Q59 (B).** How long may we keep TestFlight feedback and the feedback mailbox, and must we delete a departing tester's feedback on request? **Default:** delete on request, and within 30 days after the alpha ends (4.5).

## 8. Sources

Read on 16 Oct 2026 unless marked:
- developer.apple.com/testflight/ ("Add internal testers", "Invite external testers").
- App Store Connect Help, Test a beta version: "TestFlight overview", "Add internal testers", "Invite external testers", "Provide test information", "View and manage tester information", "View tester feedback", "Testing subscriptions and In-App Purchases in TestFlight".
- Apple Developer Help, "Role permissions" (developer.apple.com/help/account/access/roles).
- App Store Connect API documentation data: `betafeedbackcrashsubmission/attributes-data.dictionary`, `betafeedbackscreenshotsubmission/attributes-data.dictionary`.
- Blocked (403): www.apple.com legal pages and testflight.apple.com (A13).
- In this repository: `docs/release/AUTOMATION.md` 2.4, 2.7, 4 and 5 and `docs/adr/0026-release-automation-pipeline.md` (develop c9a192d); `docs/prd/v2/07-quality-bar.md` section 4.2 and Q3, Q4; `docs/release/ALPHA_PLAN.md` and `TESTFLIGHT.md` on #152; `docs/qa/ALPHA_GO_NO_GO.md` B1-11 and B2-20 on #176; `packages/brand/index.ts` (`supportEmail`).

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0.1 | 2026-10-23 | Matched to develop 8d2d3dc before merge: build 2 has no recording backup (`EXPO_PUBLIC_BACKUP` off in the `preview` profile, #145), so 5.2 and the 5.4 build 2 opening say recordings are not uploaded, and the recovery key fact applies only to a build with backup on; Delete account is its own Settings row, not inside Your data (`apps/mobile/src/app/settings/index.tsx`). No change to Apple's facts, the recommendations or the counsel questions. |
| 1.0.0 | 2026-10-16 | First version (RA-17-04): Apple's facts on tester identity and feedback visibility, the alpha's who-sees-what table, the founder's choices for Family and Friends with recommendations, the tester notice requirements and draft text for S16, and three counsel questions. |
