---
title: Held items packet for counsel and the founder
version: 0.1.0 (draft)
status: draft-for-counsel
date: 2026-11-21
read_on: origin/develop 4b8b467eebc2e4f20059da57c54898139f470fcf
owner: founder
---

# Held items packet, 21 Nov 2026

Drafts only. Prepared by a Claude role (Sonnet 5.5), which is not counsel and gives no legal advice. Every "Question" is for counsel. Every "Founder default" is a proposal for the founder to confirm or replace; none is a recorded decision. Nothing here edits any held text.

**How to read it.** Each item gives: current text with `file:line` read on `origin/develop` at the sha above; what changed or is proposed; why it is held; the question; the default if no answer. Open questions already in `docs/legal/COUNSEL_PACKET.md` (read live, 1.8.0 plus section 9) are cited by Q number and not restated. Facts about law are not asserted here. Anything not verified is marked **[U]**.

**Who merges what.** `docs/legal/**` and every registered or counsel-locked line is the founder's merge (CLAUDE.md, CR-73; D-163 items 6 and 7). This PR is a draft and adds one new file only.

## Index

| # | Item | Packet Q | Blocks |
|---|---|---|---|
| 1 | PR #1286: sign-in privacy line, first-run promise title, story.private.v1, two HELD rows | Q43, Q16 | #1286 merge |
| 2 | Privacy Policy 3.0.0 | Q43, Q20, Q32, Q123(d), Q130, section 6 item 9 | Any build that links it |
| 3 | App Privacy label rows | Q54, Q6, Q7, Q123 | Store submission |
| 4 | Analytics consent sheet and Settings switch | Q6, Q7 (deferred) | Production analytics flip |
| 5 | Delete-account line (`pages.en.ts:242`) | Q51, Q6, Q7 | Production analytics flip |
| 6 | Moments library read, photo permission, usage string | Q119, Q122, Q123, Q126, Q128, Q129, Q130 | Photo flag in `production` |
| 7 | The 90-day pledge | Q16, Q40 | None; change in all places together |
| 8 | Engineering doc amendments for D-163 | none (not for counsel) | D-163 gate |
| 9 | Store listing as submitted | Q43, Q127, Q37 | Any listing edit |

## Cross-item facts counsel will want once

- **D-163 (founder, 20 Nov 2026)** (`docs/DECISIONS.md:1187`): analytics page-view, click and impression events are collected for every user, not behind an opt-in; supersedes D-095 and D-124 item 3 for the `production` build only (`:1195`). It does not decide the consent wording, region, counsel's view, or the privacy-manifest test (`:1198` to `:1206`). The gate before the production flip names counsel's answer and the Privacy Policy, label and in-app disclosure "updated and merged by the founder" (`:1208`).
- Items 2 to 5 and 8 all turn on the same open point: what must be said, and whether a consent ask is needed, for events collected without opt-in. That is the "no-consent basics" answer D-163 waits for. The packet defers analytics to v1.1 (Q6, Q7, `COUNSEL_PACKET.md:158`); D-163 item 4 says that deferral needs reopening. **I did not find a packet question that asks it directly. Proposed new question: see "Q-NEW-A" at the end.**
- **Three different wordings of the sign-in privacy line exist** (item 1): the live text, the counsel-locked recommended wording (`docs/reviews/2026-10-31/COUNSEL_LOCKED.md:15`), the registered target (`in-app-disclosures.md:25`), plus the #1286 proposal.

---

## 1. PR #1286 (draft; head `43c9fa15cfddba25b476f9647a41e5b199db8235`, read live; base `develop`)

**Why held.** Registered disclosure text and counsel-locked row (LNG-15). The PR body says it is "HELD for the founder and counsel. Not for merge." The rulings behind it are Karma's with a council read (Project docs `infra/exec-rulings-2026-11-21-open-decisions.md` and `...-council-challenge.md`, not in this repo; I could not read them). They are not the founder's or counsel's. Review B found it not mergeable because `in-app-disclosures.md:59` is not updated and the ruling is not in the repo.

### 1a. Sign-in privacy line

- **Current.** `packages/content/src/strings.en.ts:1527` (`en.trust.signIn.privacy`): "Only you and the people you invite can read your letters. We never sell them or use them for ads." Read by `packages/content/src/features/auth.en.ts:62` (`features.auth.sheet.privacy`).
- **Registered.** `docs/legal/in-app-disclosures.md:59`: key `trust.signIn.privacy`, today "Only you and the people you invite can read your letters.", must say instead "Section 1, sign-in privacy line". That is `in-app-disclosures.md:25`: "Your book is shared only with the co-parent you invite; we don't read it; never sold or used for ads. Not an absolute 'only you and the people you invite can read'" (basis: Privacy Policy 3; R4 PT-25).
- **Counsel-locked recommendation.** `COUNSEL_LOCKED.md:15`: "Only you, and your co-parent if you invite them, can read your letters. We never sell them or use them for ads."
- **Proposed by #1286** (read from the PR patch at the head sha): "Private by default. You decide what goes in the book." The "We never sell them or use them for ads." sentence is dropped from the sign-in line, not kept (the PR body's wording is easy to misread on this).
- **What it does.** Drops the who-can-read statement. It adds a claim ("You decide what goes in the book"). Privacy Policy 3 (`privacy-policy.md:49` and `:55`) says letters on our servers are not end-to-end encrypted and we could read them; whether "private by default" sits beside that is Q43.
- **Question.** Q43 already asks counsel to approve or replace the sign-in line and "Private by default". New for counsel: choose among four wordings (live; COUNSEL_LOCKED; in-app-disclosures section 1; #1286). Does "You decide what goes in the book" make a claim that needs a Privacy Policy sentence behind it?
- **Founder default.** Keep the live line (no change; note #1286 would also remove the never-sell sentence from the sign-in sheet) and keep #1286 draft. Registered text moves only with a disclosures version bump (COUNSEL_LOCKED.md:5).

### 1b. First-run promise title

- **Current.** `strings.en.ts:82` (`en.onboarding.promise.title`): "Exactly as you said it." Body line `:86`: "We never rewrite your words, shorten them or write for you." (the D-133 second sentence, kept).
- **Proposed.** "It stays in your words." Removes its `KNOWN_VIOLATIONS` row at `packages/content/test/claims-capabilities.test.ts:313`.
- **Why held.** D-125 item 9 (`DECISIONS.md:954`): "Exactly as you said it." stays in the alpha, not in store listing until counsel clears it at T30; D-133 and `DECISIONS.md:656` give the public promise as "It stays in your words." The brand tagline in `packages/brand/index.ts` still reads "Exactly as you said it." (`DECISIONS.md:1046`). Not a counsel-locked row on its own; held because the two docs disagree on whether the in-app title is covered. **[U]** whether T30 has been answered.
- **Question.** May the first-run headline, and the packaged `story.exact.v2` card (`claims-capabilities.test.ts:~314`), stay "Exactly as you said it." in a servers-on store build, given the default view removes ums and the speech model can mishear (D-133, `DECISIONS.md:1037`)? Not a numbered packet question; propose Q-NEW-B.
- **Founder default.** Change the title to "It stays in your words." when the founder releases #1286; keep the `story.exact.v2` row open.

### 1c. story.private.v1 (LNG-15, counsel-locked)

- **Current.** `packages/content/src/stories.en.ts:54` to `:59`: id `story.private.v1`, headline (`:57`) "Private to your family.", line (`:58`) "Only you and the people you invite can read these letters. We never sell them or use them for ads." Alternate card `story.private.v2` at `:73` to `:78`: "Private by default." / "Shared only with the other parent, if you invite them. Never sold, never used for ads." (the founder's words per `EXPERIENCE_PASS_2026-10.md:1881`).
- **Proposed by #1286.** Headline "Private by default."; line "You decide what goes in the book. We never sell your letters or use them for ads." Removes BL-557 row `stories.story.private.v1.line` (`claims-capabilities.test.ts:318`). Ids are never reused.
- **Why held.** Counsel-locked (LNG-15). The PR body says counsel must choose between editing v1 and serving `story.private.v2` (which already exists).
- **Question.** Which card, v1 reworded or v2, may the first-run deck serve under D-066 (server-side choice) with servers on and no working invite door (B12-5)? Q43.
- **Founder default.** Serve `story.private.v2` rather than reword v1 **[proposal; v2 carries the founder's own words but says "invite" while production cannot invite, BL-557]**; so the real default is: leave v1 and the BL-557 violation row in place.

### 1d. The two HELD_FOR_COUNSEL rows

- **Current.** `packages/content/test/build12-untrue-copy.test.ts:71` (`features.auth.sheet.privacy`, rule coParent, claim "invite") and `:75` (`en.trust.signIn.privacy`, same); `HELD_CAP = 8` at `:80`. Remaining rows `:72` to `:78` (sheet.why "keeps your book safe", consent.terms.body "family you" and "invite", sensitiveConsent.body "share it with" and "family you") stay held.
- **Proposed.** Delete `:71` and `:75`; cap 8 to 6.
- **Why held.** They exist because the lines say "invite" while Build 12 cannot invite. Removing them is only honest if 1a lands.
- **Question.** None new; follows 1a. The four other rows are the same Q43 and Q48 family; `sensitiveConsent.body` is `strings.en.ts:1072` ("share it with the family you choose"), registered in `in-app-disclosures.md:61` as needing "share it with your co-parent" (gap G-21).
- **Founder default.** Land the rows' deletion only with 1a.

**Same-change rule.** If any of 1a to 1d lands, `in-app-disclosures.md:59` (and `:25` if the wording changes) is updated in the same change, with a disclosures version bump. Not done here.

---

## 2. Privacy Policy 3.0.0 (`docs/legal/privacy-policy.md`, status `draft-for-counsel`, effective date TBD)

**Why held.** Founder's merge; not yet published; effective date and legal name are placeholders (`:13`, `:27`). Counsel row: Q43 (staff line), Q20, Q32, Q108, Q123(d), Q130.

| Line | Current text (verbatim, trimmed) | Conflicts with |
|---|---|---|
| `:21` | "Build 1 ... and the first App Store build. Servers are off. You do not sign in, sync or share a book ..." | `app-store-privacy-labels.md:84`: Build 12, the first store build, has servers on with sign-in required (D-157, D-160). Packet section 6 item 9 says the founder corrects the build list. |
| `:24` | "Analytics. There are none in any build." | D-163: events for every user in the `production` build once the flag is on. |
| `:45` | "We do not collect your location ..., contacts, photos, advertising ID or payment details. In no current build does the app send us usage analytics or crash reports." | D-163; and Moments (item 6): Q123(d) asks whether a stored picture copy changes "photos". |
| `:159` | "If we ever close Early Letters, we will tell you at least 90 days ahead and keep export working the whole time." | Item 7. |

- **Proposed.** None drafted here. Edits wait for: the build list correction (founder), counsel's answers to Q-NEW-A, Q123(d), Q130. I did not write replacement policy text because the facts it must state (what events, which vendor and region, retention) are D-163 items 2 and 3, still open.
- **Question.** Q43 (staff line and "Private by default"), Q20 (is the short California paragraph a sufficient notice at collection), Q32 (no separate health notice), Q123(d), Q130 (material change; absolute sentences). New: Q-NEW-A.
- **Founder default.** Do not publish 3.0.0 and do not link it from a servers-on store build until the build list and the analytics lines are made true; the `production` analytics flag stays off (D-163 gate).
- **Not verified.** The "section 18" cross-references to this policy in `strings.en.ts:995` and `DELETION_AND_EXPORT_SPEC.md:392` against the file's actual section numbers.

---

## 3. App Privacy label rows (`docs/legal/app-store-privacy-labels.md`)

**Why held.** Founder and counsel; must match the binary submitted (`docs/store/readiness.md:204`, BLOCKED). Packet Q54 (label 1.4.0), Q6 and Q7 (Linked or not, deferred), Q123 (photo and location rows).

| Row | Line | Current |
|---|---|---|
| Photos or Videos | `:54` | "No ... No photo feature in v1.0" |
| Usage Data | `:62` | "No (changed in 1.4.0) ... No analytics SDK in any current build (D-095, D-124): `posthog-react-native` is not a dependency of `apps/mobile`, and `EXPO_PUBLIC_ANALYTICS` is `off` in every `eas.json` profile" |
| Diagnostics | `:63` | "No ... No crash SDK and no analytics in v1.0." |
| Section 3 lead | `:41` | "Every row is App Functionality only: there is no analytics, advertising or personalization purpose in v1.0." |
| Later build | `:85` | "A later build with opt-in analytics (v1.1): Add Usage Data and Diagnostics for Analytics ...; the Linked or Not linked question (Q7) returns" |
| Not used | `:117` | "Photos, camera, speech recognition, location, contacts, tracking: Not used" |
| Checklist | `:123`, `:127` | analytics SDK not constructed; "No photo picker, no new SDK since the last review" |

- **What changes if D-163 and Moments ship.** Usage Data (Product Interaction; and Other Usage Data if used) flips to Yes for Analytics, and the Linked answer needs a decision (Q7); Diagnostics stays No unless crash capture gets its own founder yes (D-163 item 8). Photos or Videos and the Location rows depend on Q123(a). I draft no answers, since "collected" is Apple's definition and I have not verified it **[U]**.
- **Also found.** The header says version 2.2.0 (`:13`) while the changelog's newest row is 2.1.0 (`:136`); one of the two is stale **[U]** which.
- **Question.** Q54 and Q123 as in the packet. New: Q-NEW-A (label answers for analytics collected without opt-in, linked or not).
- **Founder default.** Label stays as written (analytics No) for every build until the flag is on; update label, policy and in-app disclosure in one founder merge before the flip (D-163 gate).

---

## 4. Analytics consent sheet and Settings switch (strings, protected consent text)

- **Consent sheet.** `strings.en.ts:1086` to `:1093` (`analyticsConsent`): title "Help us make it better?"; body "Share how you use the app, like which screens you open and when something crashes. Never your letters, recordings, photos or anyone's names."; detail "Nothing is shared unless you say yes. Saying no changes nothing else."; changeLater "You can change this any time in Settings, Privacy."; buttons "Share usage" and "Don't share".
- **Settings switch.** `strings.en.ts:1014` to `:1016` (`settings.privacy`): label "Share usage and crash reports"; help "Which screens you open and when something breaks. Never your letters, recordings, photos or anyone's names."; off note "Turning this off stops sharing right away. Nothing else changes." Footer for builds with no switch: `:1050` "This version collects no usage or crash reports."
- **What conflicts.** "Nothing is shared unless you say yes" is false for events collected for every user (D-163 second instruction). "crashes" and "crash reports": crash capture is a separate founder yes (D-163 item 8; `docs/ARCHITECTURE.md:18` says no Sentry).
- **Why held.** D-163 item 1: consent wording and its Shown, Records, Never and Decline lines (PRIV-R21) are the founder's with counsel; `content` drafts. Consent strings are protected text. The LEGAL-REQ-043 test stays built.
- **Proposed.** No wording drafted. Three shapes for the founder to choose among, each needing counsel: (i) keep the sheet for a consent-required region and apply D-163 elsewhere; (ii) replace the sheet with a notice plus the Settings switch (D-163 item 5e: "A visible off switch in Settings is recommended; the founder decides it"); (iii) keep the sheet everywhere and treat D-163 as satisfied by the opt-in default. Option (iii) is not what the founder's instruction says; listed for completeness.
- **Question.** Which regions and which events may run without a consent ask, and what must the notice say (D-163 item 5b)? Q-NEW-A. Q6 and Q7 are the packet's deferred analytics items.
- **Founder default.** Sheet and switch text unchanged; the `production` analytics flag stays off until items 1 to 4 of D-163 close.

---

## 5. Delete-account line

- **Current.** `packages/content/src/pages.en.ts:242`: "Your profile, your family memberships and your account itself are deleted. We revoke your Sign in with Apple token, remove your Sign in with Google link, and delete the status of your Plus plan that the app reported to us. If you turned analytics on, we ask our analytics provider to delete the events sent under your analytics ID." Related: `:240` "Your letters, recordings and photos are removed from every book ..."; `:73` "Analytics never include letter text, recordings, photos, names or birthdays."
- **Counterpart.** `docs/legal/delete-account-page.md` (version 1.1.0) has no analytics sentence at all (grep, 0 hits); the web copy in `pages.en.ts` and the legal draft differ. Deletion pages are protected text.
- **What conflicts.** "If you turned analytics on" assumes opt-in. Under D-163 every user has events. "Analytics ID" is not defined in the policy.
- **Why held.** Protected deletion/legal page; depends on item 4 and on the deletion drill (D-163 gate: "staging deletion drill").
- **Question.** Q51 (deletion exceptions and retention) plus Q-NEW-A: what must the deletion page say about analytics events for a user who never opted in, and what is the analytics provider's retention (`DELETION_AND_EXPORT_SPEC.md:491` says PostHog 12 months, console-set **[U]** not verified in a console).
- **Founder default.** No change until the flag turns on; then the sentence becomes unconditional ("we ask our analytics provider to delete the events sent under your analytics ID") **[proposal]**, merged with items 2 and 3.

---

## 6. Moments: library read, photo permission, usage string

- **Current state on develop.** No photo permission string exists: `git grep NSPhotoLibraryUsageDescription` over `apps/mobile` and `packages/content` returns nothing, and `packages/content/src/permissions.en.ts:11` has only the microphone string. The rule "no photo-library usage string, no PhotoKit authorisation call ..." is in `docs/legal/ENGINEERING_REQUIREMENTS.md:573` (NS-01-R22, NS-49-R25) and becomes per-profile when NS-51 ships. Status there (`:578`): not built.
- **What is proposed (not live).** `COUNSEL_PACKET.md` section 9.1 (`:668` to `:686`) lists the before and after promise text and the primer variants A to C. The purpose string (date, time and place named, no claim about analysing content) is Q123(b). The spec is PROPOSED, nothing in it is decided (`COUNSEL_PACKET.md:~660`). Spec on `wip/moments-prd-v3` at b31a389b8afb3e747f61d19e098f2bc22a65800d, not read by me.
- **Why held.** Gates the library read and the label for `production` (`COUNSEL_PACKET.md:771`, Q123). Founder-only: what users are promised (O-48).
- **Questions (by number, not restated).** Q119 (collection and notice), Q122 (App Review 5.1.1(iii), licence 3.3.3(H); Apple quotations **[U]** in the packet itself), Q123 (label, string, consent record), Q125 and Q126 (place and location), Q128 (Terms 4.2.0), Q129 (iPhone backup copy versus deletion promise), Q130 (policy mechanics).
- **Founder default.** As the packet states: F2 stays dark; label, policy and in-app text unchanged; no usage string added; Terms 4.2.0 unpublished (`COUNSEL_PACKET.md` Q123, Q128).

---

## 7. The 90-day pledge

Same promise in five places, which `strings.en.ts:994` to `:995` says must change together or not at all.

| Where | Line | Text |
|---|---|---|
| Help screen | `packages/content/src/strings.en.ts:996` | "If we ever plan to close, we will tell you at least 90 days ahead and keep export working the whole time." |
| Website About | `packages/content/src/pages.en.ts:87` | "If Early Letters ever closes, you will hear at least 90 days ahead, and export will keep working the whole time." (brand name interpolated) |
| Privacy Policy | `docs/legal/privacy-policy.md:159` | "If we ever close Early Letters, we will tell you at least 90 days ahead and keep export working the whole time." |
| Terms summary | `docs/legal/terms-of-service.md:25` | "... at least 90 days' notice and a way to take everything with you." |
| Terms section | `docs/legal/terms-of-service.md:156` | "... at least 90 days ahead, stop new charges, and keep export working the whole time, including recordings in backup. If someone else takes over the Service, they must keep sections 5.3, 8.3 and this section, or ..." (cut at 240 chars; read the file for the rest) |

- **Why held.** An open-ended binding promise (Q16, listed in the packet's "four open-ended promises", `COUNSEL_PACKET.md:437`); the strings comment says "counsel to confirm". I found no D-number for the pledge **[U]**. The wording differs across the five places ("plan to close" versus "closes"; backup recordings only in the Terms).
- **Question.** Q16 (binding promises) and Q40 (how a buyer of the business is bound, Terms 19). Is a 90-day figure right, and should the five wordings be made identical? Also `COUNSEL_PACKET.md:409(c)`: does a 25-year-ahead day create a longer duty?
- **Founder default.** Keep 90 days and the current five wordings; change none until counsel answers Q16.

---

## 8. Engineering doc amendments for D-163

Not for counsel. Founder and engineering stewards. D-163's own "Effects" list (`DECISIONS.md:1210`) names erratum E95, backlog rows and a roadmap date check, but no edit to these docs. Each line below now contradicts D-163 for the `production` build only; D-095 and D-124 stand for other profiles (`:1195`). Proposed text keeps the rule as written and adds the production exception, citing D-163, and does not loosen the LEGAL-REQ-043 test (D-163 item 6).

| File:line | Current | Proposed amendment (draft) |
|---|---|---|
| `docs/engineering/PRINCIPLES.md:26` | "13. Nothing is collected or sent before consent; analytics and crash reports are opt-in and checked on the server. (PRIV-R05, PRIV-R08)" | Add: "Exception, `production` profile only: page-view, click and impression events are collected for every user (D-163), with no content (PRIV-R01 to R03 stay). Crash reports stay opt-in until their own founder yes (D-163 item 8)." |
| `docs/engineering/07-privacy-engineering.md:23` | "3. Off until asked. Analytics and crash reports send nothing until an explicit yes. Why: D-003, BRIEF decision 12, LEGAL-REQ-003." | Same exception; D-003 and LEGAL-REQ-003 remain for every other profile. |
| `docs/engineering/07-privacy-engineering.md:43` | "PRIV-R05 (MUST) No PostHog or Sentry event leaves the device, or is queued, before the user grants analytics consent ... asserting `REQUIRED_POSTHOG_OPTIONS.defaultOptIn === false`" | Needs the owner of the test to change it through review in the same PR that needs it; never skipped (D-163 item 6). **Draft cannot say how** until counsel answers D-163 item 5b. |
| `docs/engineering/10-logging-and-observability.md:41` | "OBS-R06 (MUST) Crash reporting (Sentry) is initialised only after analytics consent ..." | Stale already: `docs/ARCHITECTURE.md:18` says no Sentry (founder, 20 Nov). Align to "PostHog crash capture off until its own founder yes". |
| `docs/engineering/10-logging-and-observability.md:45` | "OBS-R08 (MUST) Analytics events are not logs: they go only through the typed catalogue in `packages/analytics` after opt-in ..." | Replace "after opt-in" with "after the consent state for the profile (opt-in, or D-163 for `production`)". |
| `docs/engineering/10-logging-and-observability.md:69` | "Device (release): ... consenting analytics events; scrubbed crashes: PostHog, Sentry (opt-in): Sentry 90 days (TDD 06 5.1)" | Same Sentry stale point; PostHog retention per D-163 follow-up. |
| `docs/ARCHITECTURE.md:18` | "... PostHog and Sentry, opt-in only, at launch. Amended 20 Nov 2026 by the founder: PostHog Cloud is the only vendor ... In-app analytics is off in every build until the founder turns it on (D-124)" | Append "D-163 (20 Nov 2026): collected for every user in the `production` build, built before that build; flag stays off until its gate closes." Cell says "Not yet a DECISIONS.md row"; D-163 and ADR 0036 now exist. |

- **Why held.** The rule text is enforced by tests and by ADR 0036 (PROPOSED); the consent default is not decided by D-163 (item 5a). Changing a MUST to match an instruction that has open legal gates could read as the docs promising what counsel has not cleared.
- **Question.** None for counsel beyond Q-NEW-A. Founder: confirm that these amendments follow the `production`-only scope.
- **Founder default.** Make the amendments with the "production profile only, flag off until the D-163 gate closes" wording above; no weakening of any test.

---

## 9. The store listing as submitted

- **What I could verify.** The listing source is `packages/content/src/store.en.ts` on develop (`promotionalText` `:47`, `keywords` `:50`, `description` `:51` onward, `reviewNotes` `:107`, `whatsNewV1` `:111`). **[U]** I could not confirm that this text is what was actually submitted to App Store Connect: `docs/store/app-store-connect-1.0.md` and `readiness.md` give readiness, not a submission record. The founder should confirm the submitted version and build.
- **Lines that make a claim**, all current on develop:
  - `:47`: "Tell your child about today in a minute. It stays in your words. Every change is marked, and your original recording is kept unchanged."
  - Description "PRIVATE BY DEFAULT" block: `en.trust.promise` (`strings.en.ts:1519`) "Your letters and recordings are private. We never sell them, never use them for ads and never use them to train machine learning models." then "Without an account, your book stays on your phone."
  - "YOUR VOICE, KEPT": "on your phone and in your iPhone's own backup if you use one." plus `en.trust.voice` (`:1523`).
  - Screenshot frame 6 (`:39`): caption "Your book is private." subline "Private by default. Never sold, never used for ads." (the `en.trust.short` line, `:1521`).
- **Conflicts found.** (a) The header comment (`store.en.ts:6` to `:7`) says server features and analytics are off, while `:14` to `:16` says Build 12 runs with servers on; the `reviewNotes` text says "there is no account to create and no server copy of letters", true only with servers off (the `:102` to `:106` comment says a servers-on build must send `appReviewCopy.notesServersOn` instead, `release/app-review.en.ts`, protected). (b) "Private by default" in the listing and screenshot is the same phrase Q43 asks counsel to approve. (c) The listing avoids "exactly as you said it" per D-125 item 9 and `:17`. (d) If analytics ships (item 4), the listing's privacy paragraph and the App Privacy label must still agree.
- **Why held.** Q43 (privacy claims, "Private by default"), Q127 (trademark: "Moments" label, `COUNSEL_PACKET.md:697`), Q37 (subscription terms beside Apple's price), D-125 item 9 (T30). Store text is founder-only (what users are promised).
- **Question.** Q43: may the listing, the screenshot caption and the first-run line all say "Private by default" in a servers-on build? Does the Plus paragraph meet the Q37 and Q41 notice questions as written?
- **Founder default.** Listing text unchanged; no edit in response to #1286 until Q43 is answered.

---

## New questions this packet proposes (not yet in COUNSEL_PACKET.md)

Numbers are not assigned; the repo's id check does not cover packet Q numbers, and open drafts claim Q58 to Q106 and Q107 and up per `COUNSEL_PACKET.md:209` and section 9. Counsel packet owner to number them.

- **Q-NEW-A (D-163; items 2 to 5).** For a `production` build that collects page-view, click and impression events from every user with no opt-in, no content in any event, no autocapture, replay or tracking prompt (D-163 item 5): which regions and which events may run without a consent ask; what the Privacy Policy, App Privacy label (linked or not), in-app disclosure and deletion page must say; and does the CCPA or any state rule change the answer. Default if silent: flag stays off (D-163 gate).
- **Q-NEW-B (item 1b).** May "Exactly as you said it." be the in-app first-run headline and the packaged `story.exact.v2` headline in a servers-on store build (D-125 item 9, D-133)? Default if silent: change the title to "It stays in your words." only after the founder releases #1286.
- **Q-NEW-C (item 1a, 1c).** Choose one sign-in privacy sentence and one first-run privacy card from the four candidates; is "You decide what goes in the book" a claim that needs a Privacy Policy sentence? Extends Q43.

## What I did and did not do

- Read live: `origin/develop` 4b8b467eebc2e4f20059da57c54898139f470fcf (sparse worktree), PR #1286 metadata, body and patches via `gh api` (head sha above). Searched with `git grep`.
- Not read: Project docs (`infra/exec-rulings-...`), `wip/moments-prd-v3`, Apple pages, the app.config permission strings beyond the grep, full `terms-of-service.md`, full `COUNSEL_PACKET.md` (read sections 1, 5, 6 item 9, 7 index, 8.12, 8.15 and 9). No tests run (docs only).
- Line numbers drift: develop moves many times an hour; re-grep before quoting. Lines marked `~` are approximate.
