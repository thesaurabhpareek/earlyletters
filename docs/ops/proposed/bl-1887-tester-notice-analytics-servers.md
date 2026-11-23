# Proposed tester notice for usage analytics and accounts in the preview and testflight builds (BL-1887, D-170)

Status: proposed draft for exec-team review. Not applied. Drafted by Legal Drafting (Claude, `legal`). I am not a lawyer, and nothing here is legal advice or a statement that anything is compliant. "Counsel" in this file means the exec team's own review (CLO, CCO, Chief Privacy Officer; Claude roles, not licensed lawyers) under D-172. Every applicability call below is marked "exec-team counsel must confirm". Karma and the exec team decide and merge (D-168).

## Why this is in `docs/ops/proposed/` and not in place

- `docs/legal/beta/privacy-0.9.0.md` is a published, hash-pinned text. `packages/content/test/legal-beta.test.ts` pins its sha256, and says "Do not update the hash: publish 0.9.1 (or 1.0.0) as a new file instead" (POLICY_VERSIONING 2.4: a published version is immutable). So line 26 is not edited here. The replacement lines for a 0.9.1 are in section 3, as a proposal.
- The tester notice strings belong in `packages/content/src/release/testflight.en.ts`, which `content` owns, and `testflight.test.ts` pins today's text ("no account" for build 1; the default build 2 text promises no other way to delete an account). Section 1 is the exact text for `content` to adopt in the same PR that BL-1867 depends on.
- The two tester documents that are not hash-pinned are edited in place in this PR: `docs/legal/TESTFLIGHT_TESTERS.md` (legal text) and `docs/release/TESTFLIGHT.md` (release doc, not under `docs/legal/`).

## The gate this text sits behind

D-170 item 1 and the BL-1867 and BL-1887 rows say the analytics switch goes on in preview and testflight only when the SDK and adapter exist (BL-1235 P5 to P8) and the notice is shown. Today `EXPO_PUBLIC_ANALYTICS` is `off` in every profile of `apps/mobile/eas.json`, and `posthog-react-native` is not a dependency. So no tester text in force today may say a build collects usage. Every sentence in section 1 is therefore written to go live per build, only in the What to Test of a build made with the switch on. The in-place edits to the two tester documents state the rule and the per-build states; they do not claim any build collects usage today.

## 1. The tester notice (exact text)

Voice follows `packages/content/WRITING-GUIDE.md`. No dashes, curly quotes, ellipsis characters or emoji. Words the app itself shows are quoted exactly from `packages/content/src/strings.en.ts` (`settings.privacy.analyticsLabel`, `analyticsHelp`, `analyticsOffNote`; `analyticsConsent`).

### 1.1 Usage analytics paragraph (a build with the analytics switch on; goes in What to Test, after the sync or no-account paragraph)

> This test build can count how the app is used, so we can fix what is confusing. It counts things like which screens open, which buttons are tapped and how long a step takes. It never includes your letters, your recordings, your child's name or anyone's names. The counts go to PostHog, a service we use for this. Nothing is shared unless you say yes when the app asks "Help us make it better?". Saying no changes nothing else. To change your answer, open Settings, Privacy, and use "Share usage and crash reports". Turning it off stops sharing right away.

Notes for the reviewers (not tester text):
- "Only what the registry allows" is `packages/analytics/src/registry.ts`: a named event list, enums, booleans and bounded integers, with no row for entry text, transcripts, audio, photos, child name or dates. The notice says "which screens open, which buttons are tapped and how long a step takes" because those are the registry's `basics` and timed-step rows. If the registry grows a row the sentence no longer describes, the sentence changes first.
- The switch is named "Share usage and crash reports" in the app today. The notice says "usage" only, because whether crash capture is on is one of the items D-163 and D-170 leave open. If crash capture is on in the test builds, add: "It also sends a report if the app crashes, without anything you wrote." If it is off, the app's switch label and this notice disagree and `content` and `privacy` should hear of it (question for the Chief Privacy Officer, section 5).
- The PostHog region, account and key are not named and not decided here (founder hands, FH-1; D-163, D-170 item 2). The notice names the provider and no region.
- The consent default is kept exactly as the app has it today: nothing is shared until the tester answers yes (`ConsentStatus` `unknown` sends nothing, `packages/analytics/src/consent.ts`; the sheet text "Nothing is shared unless you say yes."). D-163's second instruction ("not opt in" for page-view, click and impression collection) and D-170 item 2 leave the default open; this notice does not settle it. If the exec team later rules the default differently, the sentence "Nothing is shared unless you say yes" must change first, and the 0.9.1 lines in section 3 with it.

### 1.2 Account paragraph for the testflight build (once its servers switch is on)

> This build has an account now. If you sign in, your letters and your child's details are stored on our test server, so they reach your other phone and your child's other parent. The Privacy Policy and Terms you agree to in the app apply to this test. Recordings are not uploaded in this test.

(This is the first sentences of the existing `whatToTest.build2` text, with "This build can sync." replaced by "This build has an account now." for the build that used to say there is none.)

### 1.3 Deleting an account, by build (pick the one that matches the build; the D-129 pattern)

- Delete account row on in the build (`EXPO_PUBLIC_ACCOUNT_DELETION` on): "To delete your account and its letters, use Settings, Delete account." (`testflightCopy.deleteAccountLine`, unchanged.)
- Row hidden (today's `preview` in `eas.json`; the EAS "preview" environment can set it, TESTFLIGHT.md step 9): "To delete your account, email hello@earlyletters.com from the address on your account and we will start it by hand." This is the route privacy 0.9.0 section 7 already states. The BL-1887 row asks the text to say what a tester can do in each build before BL-1867 lands.
- Today's `testflight` build has no account, so there is nothing to delete; its text keeps "This build has no account" until the switch goes on.

### 1.4 Turning analytics off, and what Erase does (one short paragraph for What to Test, same builds as 1.1)

> To stop sharing, open Settings, Privacy, and turn off "Share usage and crash reports". The Erase row, the last row of Your letters in Settings, removes every book, letter and recording from this phone, and your settings, and also stops sharing and forgets this phone's random sharing ID. Erase sends nothing anywhere, so it does not ask PostHog to delete counts already sent, and because the ID is forgotten, we could not tell which counts were yours. The Erase row shows only on a phone that never signed in. If you signed in, use Delete account (or email us, section 1.3): that asks PostHog to delete the counts sent under your sharing ID if you had turned sharing on.

Checked against code on `origin/develop` (863d10b41): `apps/mobile/src/lib/erase-everything.ts` step 1 calls `stopAnalyticsForErase` (revoke if granted, then `forgetIds`), and the module says "Nothing here uses the network." `apps/mobile/src/lib/store.ts` `localDeletionAllowed` shows Erase only when no sync owner is set. `apps/mobile/src/lib/account-deletion/index.ts` and `supabase/functions/analytics-forget/` carry the id-deletion request, and `packages/content/src/pages.en.ts` (the deletion page) says "If you turned analytics on, we ask our analytics provider to delete the events sent under your analytics ID." I did not run the app or confirm that PostHog completes a deletion; that is unverified.

### 1.5 Beta App Description (external testers)

No change proposed. It "says only what both builds do" (`testflightCopy.betaAppDescription`) and says nothing about usage. Whether an external TestFlight group needs the notice in the invitation as well as in What to Test is part of Q58 (section 5).

## 2. What changes in `docs/legal/TESTFLIGHT_TESTERS.md` and `docs/release/TESTFLIGHT.md` (done in this PR)

- `TESTFLIGHT_TESTERS.md` 1.1.0: 5.1 gains a "when the build's usage switch is on" requirement; 5.2 is keyed to the build's switch state instead of "build 1 / build 2" alone, says today's `testflight` has no account and that the account sentence is only for a build with the servers switch on, and says what a tester can do about deleting an account in each build; 5.4 carries the text of 1.1, 1.2 and 1.4 as draft strings; Q58 and Q44 notes added to section 7.
- `TESTFLIGHT.md`: the table (line 12 area) says analytics is off today in both builds and when that changes; the preflight bullet (line 218 area) points to section 4 below.

## 3. Proposed `docs/legal/beta/privacy-0.9.1.md` lines (not created here)

A new file and a new version, not an edit of 0.9.0. It also needs: `docs/legal/POLICY_VERSIONING.md` a changelog row; `packages/content/test/legal-beta.test.ts` a new pinned hash and a relaxed `NOT_USED` list (that test forbids the word "PostHog" in any served test text, and the 0.9.1 line below names it); `apps/web/src/lib/legal/versions.ts` and its routes a 0.9.1 entry; `docs/legal/subprocessors.md` a PostHog row (it has none today). Those are not in this PR.

Line 26 ("Not in the app yet") would read:

> **Not in the app yet.** None of these is in any test build: recording backup, buying Plus, a check of your country at sign-up, sign-in with any service other than Apple or email, and a switch in the app to withdraw your agreement to sync. If one of them is added, we will update this policy first.

(The words "usage analytics or crash reporting by the app" leave this list. Crash reporting stays out of the list only if the exec team confirms crash capture is off in test builds; otherwise it stays on the list.)

Section 2, "What we do not collect", sentence "The app sends us no usage analytics or crash reports of its own." would read:

> In a test build that says so, the app can send us counts of how it is used, if you say yes when it asks: which screens open, which buttons are tapped and how long a step takes. These counts carry a random sharing ID that is not your email, your account ID or your phone's ID. They never include your letters, recordings, your child's name or anyone's names. You can turn this off at any time in Settings, Privacy, and we do not use the counts to build a profile of you or your child.

Section 6 table gains one row:

> | PostHog | Receives the counts above, only from test builds that send them and only if you said yes |

Section 7, "Your account", gains: "If you had turned on sharing, deleting your account also asks PostHog to delete the counts sent under your sharing ID." and "Erasing everything on your phone stops sharing and forgets the sharing ID; it does not ask PostHog to delete anything."

POLICY_VERSIONING 2.1 item 1 reads "collecting a new category of personal data" as major for the real policy. Whether the same applies to a 0.9.x test version, and whether testers must be told or must re-agree, is a call for the exec team: exec-team counsel must confirm.

## 4. What `docs/release/TESTFLIGHT.md` line ~218 and its neighbours need when BL-1867 lands (nothing changed in preflight here)

Line 218 says: "a FAIL unless the profile sets `EXPO_PUBLIC_ANALYTICS=off`." Today that is `apps/mobile/scripts/preflight-testflight.mjs:373`. When BL-1867 turns the switch on in `preview` and `testflight`:

1. `preflight-testflight.mjs:373` must stop failing a profile that sets analytics `on`. It should require `on` or `off` written explicitly, and for `on` check the other conditions (item 3). Keep the production guard, which is `store-flags` plus the production check at lines 197 to 210 (analytics must stay off in `production`, BL-1886).
2. `preflight-testflight.mjs:229-231` calls `storeFlagProblems(eas)`; BL-1867 adds the separate exported analytics list there, so the preflight passes the new list too.
3. New checks when analytics is on: the notice text for the build includes section 1.1 (`whatToTest` for that build); no PostHog key or host in `eas.json` (line 371 already forbids `EXPO_PUBLIC_POSTHOG_KEY` there; the key comes from the EAS environment, FH-1); an UNVERIFIED line that the EAS environment holds the key and region, because the script cannot read it; the generated `PrivacyInfo.xcprivacy` and App Store Connect's App Privacy answers for the preview record list the usage data types the build then collects (today the PASS names five server-kept types only; LEGAL-REQ-043 test, still missing per D-170 item 4).
4. The build notes at `preflight-testflight.mjs:674` and `:677` say "Analytics is off ... no consent sheet, no PostHog client". They must say what the build does, per profile.
5. `TESTFLIGHT.md`: line 10 (Server features, build 1 "off: no accounts"), line 12 (Analytics), line 13 (Delete account row), the "Preflight" row, and line 187 ("Build 1 only: no accounts ... no delete-account"), and the go/no-go rows B1-9 and B2-17 in `docs/qa/ALPHA_GO_NO_GO.md`.
6. Content tests that pin today's text: `packages/content/test/testflight.test.ts` lines 146 to 152 (build 1 says "no account") and 183 to 201 (the default build 2 text promises no other way to delete an account). `content` changes them in the same PR as the strings.
7. `apps/mobile/test/analytics-off-v1.test.ts` and `apps/mobile/test/config.test.ts` (D-170 item 3) keep production off; they need the preview and testflight expectations updated.

## 5. Review: which exec roles, and the lines to read

All roles are Claude roles, not licensed lawyers (D-172). No role is asked to approve in this file; Karma merges (D-168).

### CLO
- `docs/legal/TESTFLIGHT_TESTERS.md` section 5.1 item 9, section 5.2 (the three rows), section 7 (Q58 and Q44 notes). Karma's merge also needs the CLO's reading of the founder's-merge line on `docs/legal/**`.
- Q58: is an external TestFlight group a public launch for LEGAL-REQ purposes, and so may friends receive a build with accounts and analytics under the 0.9.0 and 0.9.1 test texts? Does an external friend need the notice in the invitation as well as What to Test? Default if unanswered: friends keep build 1 only until answered (D-100, R4 PT-31). Exec-team counsel must confirm.
- Q44: real families under draft texts, with analytics added. Exec-team counsel must confirm.
- Is publishing a new 0.9.1 (section 3) the right route, rather than leaving 0.9.0 and covering analytics only in What to Test? Is the 0.9.1 change "material" under POLICY_VERSIONING 2.1 item 1, and does it need testers to be told or to re-agree? Exec-team counsel must confirm.

### CCO
- `docs/legal/TESTFLIGHT_TESTERS.md` 5.2 "Analytics on" row and section 5.4 draft strings; this file's sections 1.1, 1.3, 1.4 and 4.
- Claims check: each sentence in 1.1 and 1.4 against the code named in 1.4. The gaps I found: the switch label in the app says "crash reports" while the notice says "usage"; `docs/legal/subprocessors.md` has no PostHog row; the PostHog region is not chosen, so the notice cannot say where counts are kept.
- Does the existing consent sheet ("Nothing is shared unless you say yes") satisfy what a tester must be told, with the default kept, or does the exec team want a different default for test builds (D-163 second instruction, left open by D-170 item 2)? Exec-team counsel must confirm.
- The preview record's App Store Connect App Privacy answers and the privacy manifest when analytics is on (section 4 item 3). Exec-team counsel must confirm.

### Chief Privacy Officer
- This file's sections 1.1 (the content-free sentence against `packages/analytics/src/registry.ts`), 1.4 (Erase and Delete account behaviour) and 3 (0.9.1 lines).
- Is crash capture on in test builds (D-163 open item)? That decides the "crash reports" wording in 1.1 and 3.
- A phone that never signed in, shared usage, then used Erase: its sharing ID is forgotten and PostHog is not asked to delete. Section 1.4 says so plainly. Is that acceptable, or does the exec team want a route (for example, delete by an email request)? Exec-team counsel must confirm.
- A tester who signed in on a phone that earlier erased, or the other way round (the testflight and preview profiles share a bundle id, so a phone moves between the two builds): confirm the Erase row, the sharing ID and the deletion request behave as 1.4 says. I did not run the app.
- Whether "random sharing ID" is the right plain name for the analytics ID (the app's own screens do not name it).

## 6. What I could not verify

- That PostHog completes an id deletion request (the `analytics-forget` function exists; I did not call it).
- Anything about PostHog's region, account or key (founder hands, FH-1).
- What Apple says to a tester about data it shares (A13 in TESTFLIGHT_TESTERS, still blocked from here).
- That the consent sheet appears in a preview or testflight build once the switch is on: the SDK and adapter are not built (BL-1235 P5 to P8).
