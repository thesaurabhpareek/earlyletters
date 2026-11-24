---
title: Held items packet for counsel and the founder
version: 0.1.1 (draft)
status: draft-for-counsel
date: 2026-11-21
read_on: origin/develop 1054a200dc31096d089b398d594a1593cdba4cdf (refreshed twice on 22 Nov 2026; line citations in the items were last re-read at 6e24e3bcb43b1acb8227bf70ae2763508e3d4e3c, and the commits after it touch no cited file; first cut read at 4b8b467eebc2e4f20059da57c54898139f470fcf)
refresh_24_nov: develop 448f2bbb9f9f7c03d24c225e4ba131059e781133, scoped to the statements listed in the 24 Nov refresh paragraph below; every other statement is still the 21 to 22 Nov snapshot
owner: founder
---

# Held items packet, 21 Nov 2026

Drafts only. Prepared by a Claude role (Sonnet 5.5), which is not counsel and gives no legal advice. Every "Question" is for counsel. Every "Founder default" is a proposal for the founder to confirm or replace; none is a recorded decision. Nothing here edits any held text.

**How to read it.** Each item gives: current text with `file:line` read on `origin/develop` at the sha above; what changed or is proposed; why it is held; the question; the default if no answer. Open questions already in `docs/legal/COUNSEL_PACKET.md` (read live, 1.8.0 plus section 9) are cited by Q number and not restated. Facts about law are not asserted here. Anything not verified is marked **[U]**.

**Refresh, 22 Nov 2026.** Every `file:line` below is re-read at `origin/develop` `6e24e3bcb43b1acb8227bf70ae2763508e3d4e3c` (the sha in the header) unless a line names another sha. Several lines moved since the first cut (4b8b467eeb), and PR #1431 (c8c3d03e6, merged 22 Nov 00:01 UTC) closed the first-run title question in item 1b. Line numbers drift; re-grep before quoting.

**Second refresh, 22 Nov 2026 (after the founder approved this PR, 21 Nov).** Merged into develop since the first cut, and now marked done in the index: #1431 (first-run promise line, item 1b), #1410 (Moments checked facts, `docs/legal/checked-facts-moments.md`) and #1387 (held Moments launch copy, `docs/marketing/moments-launch-drafts.md`; the copy stays HELD, only the draft file merged). New on develop and cited below, not invented: D-165 (`docs/DECISIONS.md:1209`, 21 Nov 2026) and the exec rulings CR-144 and CR-146 in `docs/agents/exec/RULINGS.md`. The three Project docs named in item 1 (`infra/exec-rulings-2026-11-21-...`) are not in this repo and I still could not read them. The index now names, for every item, the owner of the next step and the file the held text lives in on develop.

**Third refresh, 24 Nov 2026 (develop `448f2bbb9f9f7c03d24c225e4ba131059e781133`).** The rest of this file is still the 21 to 22 Nov snapshot. Only the statements below were corrected, each against a merged PR or a recorded ruling; where an item text below still reads as of 22 Nov, the item carries a "Superseded 24 Nov" line. The rulings are Claude-role exec rulings recorded under D-168 and D-172 (`infra/exec-rulings-2026-11-23-held-customer-text.md`, `infra/exec-rulings-2026-11-24-legal-1-0-texts.md`, `infra/exec-rulings-2026-11-24-held-prs.md` in the Project docs; local copies were read). They are not the founder's words and not counsel's view; every legal question they touch stays counsel's. This refresh decides no open legal question.
- Item 1a: the sign-in line on develop is no longer the 22 Nov line. #1644 (merged 22 Nov 23:46 UTC) reworded it, then `0a5e0c17b` (23 Nov 21:45 UTC, "as ruled 23 Nov") set it to "Your letters are yours. We never sell them and never use them for ads." (`strings.en.ts:1593`, `stories.en.ts:58`).
- Item 1: #1286 is closed, not open (closed unmerged; the 23 Nov ruling item 1d said close it as superseded and keep the branch). The held rows it would have removed are gone on develop: `HELD_CAP = 0` (`build12-untrue-copy.test.ts:72`).
- Item 3: the 23 Nov ruling item 4 answers Other Data Types "Yes" (exec ruling, Claude role; entering label answers stays the founder's). Counsel's confirmation is still open. The label file of record (`app-store-privacy-labels.md`, 2.2.0) still says No (`:65`), and #1782 (open draft) proposes labels 2.3.0.
- Item 6: "Terms 4.2.0" in Q128 (`COUNSEL_PACKET.md:688`, `:733`) is the Moments draft. #1782's "Terms 4.2.0" is a different draft; the two share a number only (see item 6).
- Item 7: the founder default there is superseded by the 23 Nov pledge ruling (item 5) and by #1855 (merged 24 Nov 16:18 UTC).
- Item 10: #1408 is merged (22 Nov 2026, 23:20 UTC), not open.

**Who merges what.** `docs/legal/**` and every registered or counsel-locked line is the founder's merge (CLAUDE.md, CR-73; D-163 items 6 and 7). This PR is a draft and adds one new file only.

## Index

| # | Item | Status on 22 Nov 2026 | Owner of the next step | Lives in, on develop | Packet Q | Blocks |
|---|---|---|---|---|---|---|
| 1a, 1c, 1d | PR #1286: sign-in privacy line, `story.private.v1`, two HELD rows | Superseded 24 Nov. #1286 is closed unmerged (was open draft, head `1df4631e18`); develop carries the 23 Nov ruled lines (`0a5e0c17b`) and `HELD_CAP = 0`. Counsel still confirms the wording. | Counsel (confirm the ruled wording); no #1286 merge remains | `packages/content/src/strings.en.ts`, `packages/content/src/stories.en.ts`, `packages/content/test/build12-untrue-copy.test.ts`, `docs/legal/in-app-disclosures.md` | Q43, Q16 | none from #1286 |
| 1b | First-run title and `story.exact` | DONE, #1431 merged (22 Nov 00:01 UTC). Q-NEW-B withdrawn. | none | `packages/content/src/strings.en.ts:82`, `packages/content/src/stories.en.ts:39` | none | none |
| 2 | Privacy Policy 3.0.0 | HELD. Still draft, effective date and legal name placeholders. | Founder (merge); counsel (Q-NEW-A, Q123(d), Q130) | `docs/legal/privacy-policy.md` | Q43, Q20, Q32, Q123(d), Q130, section 6 item 9 | Any build that links it |
| 3 | App Privacy label rows | HELD. Label of record unchanged (2.2.0, Other Data Types still No in the file). The 23 Nov exec ruling says Yes; counsel confirms; #1782 (open draft) proposes 2.3.0. | Founder (merge); counsel (Q54, Q123, Q-NEW-A) | `docs/legal/app-store-privacy-labels.md` | Q54, Q6, Q7, Q123 | Store submission |
| 4 | Analytics consent sheet and Settings switch | HELD. D-163 (`DECISIONS.md:1188`) leaves wording, region and counsel's view open. | Founder (wording, with counsel); `content` drafts | `packages/content/src/strings.en.ts` (`analyticsConsent`, `settings.privacy`) | Q6, Q7 (deferred), Q-NEW-A | Production analytics flip |
| 5 | Delete-account line | HELD. | Founder (merge); counsel (Q51, Q-NEW-A) | `packages/content/src/pages.en.ts:242`, `docs/legal/delete-account-page.md` | Q51, Q6, Q7 | Production analytics flip |
| 6 | Moments library read, photo permission, usage string | HELD. D-165 item 6 records O-44 and the switcher cover as ON (founder, counsel confirms the wording); photos flag in a store build waits on CR-146. | Founder (what users are promised, O-48); counsel (Q119 to Q130) | `docs/legal/COUNSEL_PACKET.md` section 9; spec `docs/product/prd/28-moments-tab.md`; `docs/legal/ENGINEERING_REQUIREMENTS.md:573` | Q119, Q122, Q123, Q126, Q128, Q129, Q130 | Photo flag in `production` |
| 7 | The 90-day pledge | Ruled 23 Nov (exec ruling item 5, "plan to close" wording); #1855 aligned the store-1.0 drafts (merged 24 Nov). Published Terms 4.1.0 and Privacy 3.0.0 still say "ever close". Counsel confirms (Q16, Q40). | Counsel (Q16, Q40); founder | `strings.en.ts:997`, `pages.en.ts:87`, `privacy-policy.md:159`, `terms-of-service.md:25` and `:156` | Q16, Q40 | None; change in all places together |
| 8 | Engineering doc amendments for D-163 | HELD. Not in any merged PR. | Founder and the engineering stewards (not counsel); requirement docs are changed by PR | `docs/engineering/PRINCIPLES.md`, `07-privacy-engineering.md`, `10-logging-and-observability.md`, `docs/ARCHITECTURE.md` | none | D-163 gate |
| 9 | Store listing as submitted | HELD. Submitted text not confirmed [U]. | Founder (store text); counsel (Q43, Q127, Q37) | `packages/content/src/store.en.ts` | Q43, Q127, Q37 | Any listing edit |
| 10 | Moments launch copy, checked facts, value-prop pair | Draft file DONE, #1387 merged, copy still HELD. Checked facts DONE, #1410 merged. #1408 (Moments pictures privacy drafts, O-44, O-52) is merged (22 Nov 23:20 UTC). | Founder (O-48 approval, what users are promised); counsel (Q130, G2 Q1 and Q8); the O-47 dated line is the founder's own words, due Fri 27 Nov 2026 (D-165 item 2) | `docs/marketing/moments-launch-drafts.md`, `docs/legal/checked-facts-moments.md`, `docs/DECISIONS.md:1209` | Q123, Q130, Q132 | Any Moments line in store page, website, first run or ads |

## Cross-item facts counsel will want once

- **D-163 (founder, 20 Nov 2026)** (`docs/DECISIONS.md:1188`, read at 6e24e3bcb): analytics page-view, click and impression events are collected for every user, not behind an opt-in; supersedes D-095 and D-124 item 3 for the `production` build only (`:1194`). It does not decide the consent wording, region, counsel's view, or the privacy-manifest test (the open items, `:1197` to `:1204`). The gate before the production flip names counsel's answer and the Privacy Policy, label and in-app disclosure "updated and merged by the founder" (`:1205`). Effects are at `:1206`. (At the first-cut sha 4b8b467eeb these were one line lower, and the first cut cited them four to five lines too high.)
- Items 2 to 5 and 8 all turn on the same open point: what must be said, and whether a consent ask is needed, for events collected without opt-in. That is the "no-consent basics" answer D-163 waits for. The packet defers analytics to v1.1 (Q6, Q7, `COUNSEL_PACKET.md:160`); D-163 item 4 says that deferral needs reopening. **I did not find a packet question that asks it directly. Proposed new question: see "Q-NEW-A" at the end.**
- **Three different wordings of the sign-in privacy line exist** (item 1): the live text, the counsel-locked recommended wording (`docs/reviews/2026-10-31/COUNSEL_LOCKED.md:15`), the registered target (`in-app-disclosures.md:25`), plus the #1286 proposal.

---

## 1. PR #1286 (draft; head `1df4631e186370723a7ea4cff3c2af06d61cae30` when refreshed, 22 Nov 2026, base `develop` at 6e24e3bcb; the head was `43c9fa15cf...` in the first cut)

**Superseded 24 Nov 2026.** #1286 is closed, not open (closed unmerged). The 23 Nov exec ruling (items 1a, 1c, 1d) replaced its lines, #1644 (merged 22 Nov) had already reworded the sign-in line, and `0a5e0c17b` (23 Nov) put the ruled text on develop. The sub-items below describe the 22 Nov state and are kept as the record of what counsel was asked; where they say "open", "proposed by #1286" or "founder default", read the Superseded line in each. The exec ruling is a Claude-role ruling, not counsel's view; counsel confirms.

**Why held.** Registered disclosure text and counsel-locked row (LNG-15). The PR body says it is "HELD for the founder and counsel. Not for merge." The rulings behind it are Karma's with a council read (Project docs `infra/exec-rulings-2026-11-21-open-decisions.md` and `...-council-challenge.md`, not in this repo; I could not read them). They are not the founder's or counsel's. Review B found it not mergeable because `in-app-disclosures.md:59` is not updated and the ruling is not in the repo.

### 1a. Sign-in privacy line

- **Current.** `packages/content/src/strings.en.ts:1528` (`en.trust.signIn.privacy`): "Only you and the people you invite can read your letters. We never sell them or use them for ads." Read by `packages/content/src/features/auth.en.ts:62` (`features.auth.sheet.privacy`).
- **Registered.** `docs/legal/in-app-disclosures.md:59`: key `trust.signIn.privacy`, today "Only you and the people you invite can read your letters.", must say instead "Section 1, sign-in privacy line". That is `in-app-disclosures.md:25`: "Your book is shared only with the co-parent you invite; we don't read it; never sold or used for ads. Not an absolute 'only you and the people you invite can read'" (basis: Privacy Policy 3; R4 PT-25).
- **Counsel-locked recommendation.** `COUNSEL_LOCKED.md:15`: "Only you, and your co-parent if you invite them, can read your letters. We never sell them or use them for ads."
- **Proposed by #1286** (read from the PR patch at head `1df4631e18`): "Private by default. You decide what goes in the book." The "We never sell them or use them for ads." sentence is dropped from the sign-in line, not kept (the PR body's wording is easy to misread on this).
- **What it does.** Drops the who-can-read statement. It adds a claim ("You decide what goes in the book"). Privacy Policy 3 (`privacy-policy.md:49` and `:55`) says letters on our servers are not end-to-end encrypted and we could read them; whether "private by default" sits beside that is Q43.
- **Question.** Q43 already asks counsel to approve or replace the sign-in line and "Private by default". New for counsel: choose among four wordings (live; COUNSEL_LOCKED; in-app-disclosures section 1; #1286). Does "You decide what goes in the book" make a claim that needs a Privacy Policy sentence behind it?
- **Founder default.** Keep the live line (no change; note #1286 would also remove the never-sell sentence from the sign-in sheet) and keep #1286 draft. Registered text moves only with a disclosures version bump (COUNSEL_LOCKED.md:5).
- **Superseded 24 Nov.** The "Current" line above is no longer live. On develop `en.trust.signIn.privacy` (`strings.en.ts:1593`) reads "Your letters are yours. We never sell them and never use them for ads.", set by `0a5e0c17b` per the 23 Nov exec ruling item 1a (after #1644 had first reworded it). The ruling says it needs no invite or who-can-read claim; "never sell" and "never ads" rest on the Privacy Policy and Terms, with no code check. The default above is replaced by that ruling. Whether the line is acceptable, and whether it still needs a Privacy Policy sentence behind it (Q43), is counsel's; this refresh does not answer it. Whether `in-app-disclosures.md:59` and `:25` were brought into line is not checked here **[U]**.

### 1b. First-run promise title and story.exact: closed by #1431

- **Current (read at 6e24e3bcb).** `strings.en.ts:82` (`en.onboarding.promise.title`): "It stays in your words." Body (`:86`, `body2`): "Every change is marked, and your original recording is kept unchanged. We never rewrite your words, shorten them or write for you." The packaged first-run card is now `story.exact.v3` (`stories.en.ts:39`): headline "It stays in your words.", line "Every change is marked, and your original recording is kept unchanged. We never rewrite your words." The brand tagline in `packages/brand/index.ts:86` reads "It stays in your words." A case-insensitive `git grep -i "exactly as you said it"` over `packages/content/src`, `packages/brand/index.ts` and `apps/mobile/src` finds only a comment (`store.en.ts:17`, lowercase; a case-sensitive grep finds nothing there, which Review A noted). One more place carries the old line and is outside those paths: `packages/brand/assets/email/source/mock.html:63` ("Early Letters. Exactly as you said it."), an email design source file. I did not check whether anything sends it **[U]**; flagged for `content` and the founder.
- **What closed it.** #1431 (`c8c3d03e6`, merged 22 Nov 00:01 UTC, "D-133 true promise line in first run and review") changed the title and `body2`, replaced `story.exact.v2` with `story.exact.v3` (ids are never reused), and removed the two `KNOWN_VIOLATIONS` rows for `en.onboarding.promise.title` and `stories.story.exact.v2.headline` (cap 16 to 14, `claims-capabilities.test.ts:337`).
- **What #1286 still has to change.** Its current patch (head `1df4631e18`) no longer touches the title and has no `story.exact` hunk. It changes: `strings.en.ts` `trust.signIn.privacy` (1a); `stories.en.ts` `story.private.v1` headline and line (1c); in `build12-untrue-copy.test.ts` the two HELD rows and `HELD_CAP` 8 to 6 (1d); in `claims-capabilities.test.ts` the `story.private.v1` BL-557 row; and `j22-sign-in.flow.ts`, `experience-pass.test.ts`, `server-surfaces-auth.test.ts` (one line each). I did not run its tests. Its `mergeable_state` read "blocked" (draft).
- **Why it was held, and what is left.** The hold was D-125 item 9 (`DECISIONS.md:955`: "Exactly as you said it." stays in the alpha, not in the listing, until counsel clears it at T30) against D-133 (`:1038`, `:1044`: the listing and the store build's first run use the true line). The build now follows D-133 and says "Every build uses it, the alpha included (founder, 31 Oct 2026)" in the `strings.en.ts` comment above `promise`. The first-run headline is therefore no longer a question for counsel. **[U]** whether T30 was ever answered; it no longer gates this line.
- **Related wording still in the app, not changed by #1431.** The view control "Exactly as said" (`strings.en.ts:417`, also `:834` and `:1457`) and the label "Exactly what you said" (`:427`). I did not check whether counsel has looked at these or whether the `exactWords` rule in `claims-capabilities.test.ts` is meant to cover them; listed as an observation, not a proposed question.
- **Question.** None. Q-NEW-B is withdrawn (see the end).
- **Founder default.** Nothing to release for the title; #1286 needs no title hunk. Confirm that D-125 item 9 is superseded in practice by D-133 (`:1044` already says "Amends: D-125 item 9").

### 1c. story.private.v1 (LNG-15, counsel-locked)

- **Current.** `packages/content/src/stories.en.ts:55` to `:59`: id `story.private.v1`, headline (`:57`) "Private to your family.", line (`:58`) "Only you and the people you invite can read these letters. We never sell them or use them for ads." Alternate card `story.private.v2` at `:74` to `:79`: "Private by default." / "Shared only with the other parent, if you invite them. Never sold, never used for ads." (the founder's words per `docs/design/EXPERIENCE_PASS_2026-10.md:1881`).
- **Proposed by #1286.** Headline "Private by default."; line "You decide what goes in the book. We never sell your letters or use them for ads." Removes BL-557 row `stories.story.private.v1.line` (`claims-capabilities.test.ts:315`). Ids are never reused.
- **Why held.** Counsel-locked (LNG-15). The PR body says counsel must choose between editing v1 and serving `story.private.v2` (which already exists).
- **Question.** Which card, v1 reworded or v2, may the first-run deck serve under D-066 (server-side choice) with servers on and no working invite door (B12-5)? Q43.
- **Superseded 24 Nov.** The 23 Nov exec ruling item 1c kept v1 and set it to headline "Private by default." and line "Your letters are yours. We never sell them and never use them for ads." (`stories.en.ts:55` to `:59` on develop, `0a5e0c17b`); `story.private.v2` is not served while no store build can invite. Counsel confirms; Q43 stays open for counsel.
- **Founder default.** Serve `story.private.v2` rather than reword v1 **[proposal; v2 carries the founder's own words but says "invite" while production cannot invite, BL-557]**; so the real default is: leave v1 and the BL-557 violation row in place.

### 1d. The two HELD_FOR_COUNSEL rows

- **Current.** `packages/content/test/build12-untrue-copy.test.ts:71` (`features.auth.sheet.privacy`, rule coParent, claim "invite") and `:75` (`en.trust.signIn.privacy`, same); `HELD_CAP = 8` at `:80`. Remaining rows `:72` to `:78` (sheet.why "keeps your book safe", consent.terms.body "family you" and "invite", sensitiveConsent.body "share it with" and "family you") stay held.
- **Proposed.** Delete `:71` and `:75`; cap 8 to 6.
- **Why held.** They exist because the lines say "invite" while Build 12 cannot invite. Removing them is only honest if 1a lands.
- **Question.** None new; follows 1a. The four other rows are the same Q43 and Q48 family; `sensitiveConsent.body` is `strings.en.ts:1073` ("share it with the family you choose"), registered in `in-app-disclosures.md:61` as needing "share it with your co-parent" (gap G-21).
- **Superseded 24 Nov.** No held rows remain on develop: `HELD_CAP = 0` (`build12-untrue-copy.test.ts:72`; the comment names the 23 Nov ruling, D-168 and D-172). The rows named above as staying held were replaced by the same ruling (items 1a2, 2a, 2c); the comment says all six are replaced.
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
- **Stale cross-reference (checked).** The Privacy Policy has only sections 1 to 14 (`privacy-policy.md:139` is section 10, `:155` section 13 "Changes to this policy", `:161` section 14 "Contact"; the pledge is at `:159`, under section 13). `DELETION_AND_EXPORT_SPEC.md:392` says "Privacy Policy section 18", and the comment at `strings.en.ts:995` says "Privacy Policy 18" (and "Terms 17"; the Terms pledge is at `terms-of-service.md:156`). Both are stale references to a section the policy does not have. Not edited here (legal and registered text).

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

- **What changes if D-163 and Moments ship.** Usage Data (Product Interaction; and Other Usage Data if used) flips to Yes for Analytics **[U]**, and the Linked answer needs a decision (Q7); Diagnostics stays No unless crash capture gets its own founder yes (D-163 item 8). Photos or Videos and the Location rows depend on Q123(a). I draft no answers, since "collected" is Apple's definition and I have not verified it **[U]**.
- **Version note, corrected.** The first cut said the header (2.2.0, `:3` and `:13`) and the changelog's newest row (2.1.0, `:136`) disagreed. On re-read the changelog's newest row is 2.2.0 (`:135`, dated 2026-11-10) and 2.1.0 is the row below it (`:136`), so they agree; that finding is withdrawn.
- **Superseded 24 Nov (Other Data Types).** This item treated Other Data Types as undecided. The 23 Nov exec ruling item 4 says Yes: linked to the user, not tracking, App Functionality, because the app sends a consent record (document, version, method, app version, platform, locale) and keeps deletion and audit records linked to the account; it also proposes adding the type to the privacy manifest for server-feature builds. That is a Claude-role exec ruling. Counsel's confirmation is open, and entering label answers in App Store Connect stays the founder's. On develop the file of record still reads No (`app-store-privacy-labels.md:65`, version 2.2.0) and #1782 (open draft) proposes 2.3.0. The ruling's IP-address row is "needs evidence" (request IPs in Supabase and Cloudflare logs), which is not answered; Q54 stays open for counsel.
- **Question.** Q54 and Q123 as in the packet. New: Q-NEW-A (label answers for analytics collected without opt-in, linked or not).
- **Founder default.** Label stays as written (analytics No) for every build until the flag is on; update label, policy and in-app disclosure in one founder merge before the flip (D-163 gate).

---

## 4. Analytics consent sheet and Settings switch (strings, protected consent text)

- **Consent sheet.** `strings.en.ts:1087` to `:1094` (`analyticsConsent`): title "Help us make it better?"; body "Share how you use the app, like which screens you open and when something crashes. Never your letters, recordings, photos or anyone's names."; detail "Nothing is shared unless you say yes. Saying no changes nothing else."; changeLater "You can change this any time in Settings, Privacy."; buttons "Share usage" and "Don't share".
- **Settings switch.** `strings.en.ts:1015` to `:1017` (`settings.privacy`: `analyticsLabel`, `analyticsHelp`, `analyticsOffNote`): label "Share usage and crash reports"; help "Which screens you open and when something breaks. Never your letters, recordings, photos or anyone's names."; off note "Turning this off stops sharing right away. Nothing else changes." Footer for builds with no switch: `:1051` "This version collects no usage or crash reports."
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
- **What is proposed (not live).** `COUNSEL_PACKET.md` section 9.1 (`:657` to `:675`) lists the before and after promise text and the primer variants A to C. The purpose string (date, time and place named, no claim about analysing content) is Q123(b). The spec is PROPOSED, nothing in it is decided (`COUNSEL_PACKET.md:649` and the 9.1 heading at `:657`). Spec on `wip/moments-prd-v3` at b31a389b8afb3e747f61d19e098f2bc22a65800d, not read by me.
- **Why held.** Gates the library read and the label for `production` (`COUNSEL_PACKET.md:760`, Q123). Founder-only: what users are promised (O-48).
- **Questions (by number, not restated).** Q119 (collection and notice), Q122 (App Review 5.1.1(iii), licence 3.3.3(H); Apple quotations **[U]** in the packet itself), Q123 (label, string, consent record), Q125 and Q126 (place and location), Q128 (Terms 4.2.0, the Moments draft; not the same draft as #1782's, see the next bullet), Q129 (iPhone backup copy versus deletion promise), Q130 (policy mechanics).
- **Two drafts share the number "4.2.0" (24 Nov).** Q128 (`COUNSEL_PACKET.md:688`, `:733`, `:787`) means the Terms draft that `legal` writes for the Moments library read (spec R266), not published. #1782 (open draft) also bumps `TERMS_DOC_VERSION` to 4.2.0 for the store-build drafts; develop has `4.1.0` (`agreements.logic.ts:19`). The 24 Nov exec ruling (CLO-B, C3) says those numbers are internal revisions and the published number is 1.0.0, and that the two are not to be read as one document. Which Terms text counsel reviews, and the Variant A or B question for 0.9.0 rows, are counsel's and not ruled here. Do not cite Q128 as if it covered #1782's Terms.
- **Founder default.** As the packet states: F2 stays dark; label, policy and in-app text unchanged; no usage string added; Terms 4.2.0 unpublished (`COUNSEL_PACKET.md` Q123, Q128).

---

## 7. The 90-day pledge

**Superseded 24 Nov 2026.** The 23 Nov exec ruling (item 5) approved the in-app wording "If we ever plan to close, we will tell you at least 90 days ahead and keep export working the whole time." and set the other places to match; the 24 Nov ruling (C1) says the 23 Nov text wins on any difference. On develop: the Help screen string is `strings.en.ts:1037`; the About page `pages.en.ts:87` reads the same sentence (changed by `8236a04b4`, 24 Nov); the store-1.0 drafts say "plan to close" (`privacy-1.0.0.md:160`, `terms-1.0.0.md:148`, aligned by #1855, merged 24 Nov 16:18 UTC). The published Privacy Policy 3.0.0 (`privacy-policy.md:159`) and Terms 4.1.0 (`terms-of-service.md:25` and `:156`) still say "ever close". The table and the founder default below are the 22 Nov record. The ruling is a Claude-role exec ruling; whether 90 days and "plan to close" are right (Q16, Q40) is counsel's, and is not decided here. The website text deploys from `main`, which is the founder's merge.

Same promise in five places, which `strings.en.ts:994` to `:995` says must change together or not at all.

| Where | Line | Text |
|---|---|---|
| Help screen | `packages/content/src/strings.en.ts:997` | "If we ever plan to close, we will tell you at least 90 days ahead and keep export working the whole time." |
| Website About | `packages/content/src/pages.en.ts:87` | "If Early Letters ever closes, you will hear at least 90 days ahead, and export will keep working the whole time." (brand name interpolated) |
| Privacy Policy | `docs/legal/privacy-policy.md:159` | "If we ever close Early Letters, we will tell you at least 90 days ahead and keep export working the whole time." |
| Terms summary | `docs/legal/terms-of-service.md:25` | "... at least 90 days' notice and a way to take everything with you." |
| Terms section | `docs/legal/terms-of-service.md:156` | "... at least 90 days ahead, stop new charges, and keep export working the whole time, including recordings in backup. If someone else takes over the Service, they must keep sections 5.3, 8.3 and this section, or ..." (cut at 240 chars; read the file for the rest) |

- **Why held.** An open-ended binding promise (Q16, listed in the packet's "four open-ended promises", `COUNSEL_PACKET.md:439`); the strings comment says "counsel to confirm". I found no D-number for the pledge **[U]**. The wording differs across the five places ("plan to close" versus "closes"; backup recordings only in the Terms).
- **Question.** Q16 (binding promises) and Q40 (how a buyer of the business is bound, Terms 19). Is a 90-day figure right, and should the five wordings be made identical? Also `COUNSEL_PACKET.md:411` (c): does a 25-year-ahead day create a longer duty?
- **Founder default (22 Nov, superseded).** Keep 90 days and the current five wordings; change none until counsel answers Q16. Replaced by the 23 Nov ruling above; counsel still answers Q16.

---

## 8. Engineering doc amendments for D-163

Not for counsel. Founder and engineering stewards. D-163's own "Effects" list (`DECISIONS.md:1206`) names erratum E95, backlog rows and a roadmap date check, but no edit to these docs. Each line below now contradicts D-163 for the `production` build only; D-095 and D-124 stand for other profiles (`:1194`). Proposed text keeps the rule as written and adds the production exception, citing D-163, and does not loosen the LEGAL-REQ-043 test (D-163 item 6).

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
  - Description "PRIVATE BY DEFAULT" block: `en.trust.promise` (`strings.en.ts:1520`) "Your letters and recordings are private. We never sell them, never use them for ads and never use them to train machine learning models." then "Without an account, your book stays on your phone."
  - "YOUR VOICE, KEPT": "on your phone and in your iPhone's own backup if you use one." plus `en.trust.voice` (`:1524`).
  - Screenshot frame 6 (`:39`): caption "Your book is private." subline "Private by default. Never sold, never used for ads." (the `en.trust.short` line, `:1522`).
- **Conflicts found.** (a) The header comment (`store.en.ts:6` to `:7`) says server features and analytics are off, while `:14` to `:16` says Build 12 runs with servers on; the `reviewNotes` text says "there is no account to create and no server copy of letters", true only with servers off (the `:102` to `:106` comment says a servers-on build must send `appReviewCopy.notesServersOn` instead, `release/app-review.en.ts`, protected). (b) "Private by default" in the listing and screenshot is the same phrase Q43 asks counsel to approve. (c) The listing avoids "exactly as you said it" per D-125 item 9 (`DECISIONS.md:955`) and `store.en.ts:17`. (d) If analytics ships (item 4), the listing's privacy paragraph and the App Privacy label must still agree.
- **Why held.** Q43 (privacy claims, "Private by default"), Q127 (trademark: "Moments" label; the section 9 index row is `COUNSEL_PACKET.md:685`, section 9.7 at `:721`; it was `:696` at 4b8b467eeb, and `:697` is Q128 there), Q37 (subscription terms beside Apple's price), D-125 item 9 (`DECISIONS.md:955`, T30). Store text is founder-only (what users are promised).
- **Question.** Q43: may the listing, the screenshot caption and the first-run line all say "Private by default" in a servers-on build? Does the Plus paragraph meet the Q37 and Q41 notice questions as written?
- **Founder default.** Listing text unchanged; no edit in response to #1286 until Q43 is answered.

---

## 10. Moments launch copy, checked facts and the D-165 rulings (added 22 Nov 2026)

- **What merged.** #1387 added `docs/marketing/moments-launch-drafts.md` (owner `marketing`, status DRAFT, UNPUBLISHED, HELD; its section 0 lists three conditions before anything ships: the founder approves O-48, counsel answers Q130 and G2 Q1 with Q123, and `legal` confirms label, policy and Notes for Review match the build). #1410 added `docs/legal/checked-facts-moments.md` (owner `regulatory-affairs`; rows marked VERIFIED or UNVERIFIED; its 2.6 and several Apple rows stay UNVERIFIED). Neither file decides anything. I read the first 80 lines of the first and the first 40 of the second only; the rest is not read by me.
- **What D-165 records** (`DECISIONS.md:1209` to `:1240`, founder words only the two quotes there; section 1 of the entry is council recommendations he approved as a set): the O-48 value-prop pair stays unpublished (store page, website, first-run screen, ads) until counsel answers Q130 and G2 Q1 and Q8 (item 1); O-47 option C with a dated line in the founder's own words by Fri 27 Nov 2026 and an accountant before the first payout, counsel and accountant to confirm (item 2); O-44 and the switcher cover ON, with the iPhone-backup disclosure in one plain policy line that counsel confirms (item 6). D-165 says it does not decide the final value-prop text, the tab name (D-164, #1281) or anything in `docs/legal/**`. I do not repeat the held lines here; read them in D-165 item 1 and the marketing file.
- **What the exec rulings add.** CR-146 (`RULINGS.md:364`) is a twelve-row table that must be green before `EXPO_PUBLIC_PHOTOS` is on in any store build; rows 1, 4, 8, 9, 10 and 11 need the founder's hands or approval (the ruling's own words). CR-144 (`RULINGS.md:291`) says the founder's chat approval does not cover any future legal merge: `docs/legal/**` merges stay founder-only (CR-73, D-125). The exec rulings are Karma's with a council, not the founder's words, and not counsel's view.
- **Still open for counsel.** Q130, Q123, G2 Q1 and Q8, Q132 (place dataset), in `COUNSEL_PACKET.md` section 9. Nothing in this item is a new question.
- **Founder default.** Keep every Moments line unpublished; no label, policy or listing change in response to #1387 or #1410.

---

## New questions this packet proposes (not yet in COUNSEL_PACKET.md)

Numbers are not assigned; the repo's id check does not cover packet Q numbers, and open drafts claim Q58 to Q106 and Q107 and up per `COUNSEL_PACKET.md:211` and section 9. Counsel packet owner to number them.

- **Q-NEW-A (D-163; items 2 to 5).** For a `production` build that collects page-view, click and impression events from every user with no opt-in, no content in any event, no autocapture, replay or tracking prompt (D-163 item 5): which regions and which events may run without a consent ask; what the Privacy Policy, App Privacy label (linked or not), in-app disclosure and deletion page must say; and does the CCPA or any state rule change the answer. Default if silent: flag stays off (D-163 gate).
- **Q-NEW-B (item 1b): WITHDRAWN on 22 Nov 2026.** It asked whether "Exactly as you said it." may be the first-run headline and the `story.exact.v2` headline in a servers-on store build. #1431 already changed both to the D-133 true line (item 1b), so there is nothing to ask. No replacement question is proposed.
- **Q-NEW-C (item 1a, 1c), narrowed 24 Nov.** The exec ruling chose one sentence and one card (items 1a and 1c, now on develop), so counsel's task is to confirm or replace those, not to choose among four. Original text: choose one sign-in privacy sentence and one first-run privacy card from the four candidates; is "You decide what goes in the book" a claim that needs a Privacy Policy sentence? Extends Q43.

## What I did and did not do

- Read live: first cut at `origin/develop` 4b8b467eebc2e4f20059da57c54898139f470fcf; refreshed on 22 Nov 2026 at `origin/develop` 6e24e3bcb43b1acb8227bf70ae2763508e3d4e3c, with the #1431 diff (`git show c8c3d03e6`) and PR #1286 files and patches via `gh api` (head `1df4631e18`). Searched with `git grep`. Every cited line was re-read at the refresh sha; the few I did not re-read are `docs/store/readiness.md:204` (re-read, same) and the Apple or legal facts marked **[U]**.
- Second refresh, 22 Nov 2026: fetched `origin/develop` (`1054a200dc31096d089b398d594a1593cdba4cdf`), merged it into this branch (clean, no conflicts; the commits after the packet's last re-read touch only `docs/design/**` files), re-checked PR states through the REST API (#1286 open draft; #1387, #1410, #1431 merged; #454 and #1408 open), and read D-165, CR-144, CR-146 and the two Moments files named in item 10. Cited lines in items 1 to 9 were not all re-read a third time; the commits since the last re-read touch no cited file. Fixed from Review A at 0f0757b4 (PASS WITH NOTES, no `Must fix: none` line in the form the gate counts): note 1 (grep wording, item 1b). Notes 3 and 4 are unverifiable by me or not load-bearing, and are left as stated; note 2 was already fixed.
- Not read: Project docs (`infra/exec-rulings-...`), `wip/moments-prd-v3`, Apple pages, the app.config permission strings beyond the grep, full `terms-of-service.md`, full `COUNSEL_PACKET.md` (read sections 1, 5, 6 item 9, 7 index, 8.12, 8.15 and 9). No tests run (docs only). Refresh: a character scan of this file only (no non-ASCII, no dashes, curly quotes or ellipsis characters).
- Third refresh, 24 Nov 2026: fetched `origin/develop` `448f2bbb9f9f7c03d24c225e4ba131059e781133`; read PR states through the REST API (#1286, #1408, #1431, #1644, #1778, #1855 closed or merged as stated, #1782 open draft); read `git grep` hits for the sign-in line, the pledge, Other Data Types, `HELD_CAP` and the doc-version pins; read the three exec ruling files named above (local copies). Corrected only the statements listed in the 24 Nov paragraph near the top. Not re-read: any other cited line, so other `file:line` citations may have drifted. Not run: tests other than the content tests (see the PR comment). I did not decide any legal question and I did not check Apple's pages.
- Line numbers drift: develop moves many times an hour; re-grep before quoting. Lines marked `~` are approximate.
