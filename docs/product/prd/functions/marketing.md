# Function review: marketing (MKT)

Owner: `marketing` (growth and marketing lead), using the evidence rules of the Chief Marketing Officer skill (`.claude/skills/early-letters-cmo/SKILL.md`). Backlog row BL-998. Written 20 Nov 2026 under `docs/product/prd/functions/BRIEF.md`. Drafts only: nothing here is published, posted, emailed or sent, and no string here is final. `content` writes final words, the founder approves every public promise, and `legal` takes every claim.

This is a Claude role, not a lawyer, regulator or licensed marketing professional. Every legal reading below is marked "counsel must confirm". Apple and FTC facts were read this session on 20 Nov 2026 at the URLs in section 1c; anything not read this session is marked UNVERIFIED.

The fictional family is Asha. No real family, name, letter, picture or voice appears in this file. The founder's child's name, which D-118 allows in one website file only, is called "the D-118 name" here and is never written out.

## 1. What I reviewed, and what I did not

### 1a. Read in full or in the sections named

| Source | Head or date | What I read |
|---|---|---|
| `docs/product/prd/functions/BRIEF.md` | branch `docs/locked-pack-inputs-20nov` at `7d0446d02` | all |
| `docs/product/prd/README.md`, `00-product-frame.md` | same head | all |
| `16-council-review-round-2.md`, `18-errata-after-lock.md`, `GAP-LOG.md` | same head | all |
| Cards `01` to `11` (NS-01 to NS-37) | same head | for every card: Claims, Label effect, Free or Plus; plus the rows and sections a grep for store, website, screenshot, rating, offer code, marketing, share wrapper and notification classes found. NS-05 rows R15 to R19; NS-32 sections 1 to 5; NS-26 to NS-31 decision records; NS-07 C28 scope and rows C28-1, C28-6 |
| `12-parked-and-not-built.md`, `14-test-plan.md` (gates G0 to G6, store candidate row), `13-engineering-plan.md` (grep) | same head | as named |
| `docs/BACKLOG.md` | same head | BL-109, BL-976 to BL-999 |
| `docs/DECISIONS.md` | same head | D-160, D-161, D-162 in full; index rows D-158 to D-162 |
| `packages/content/src/store.en.ts` | last changed `3e517c82f` (10 Nov) | all (listing source) |
| `packages/content/src/site.en.ts` | same head | all (reference copy, not rendered) |
| `packages/content/src/pages.en.ts` | same head | lines 1 to 110 (/about, /why) |
| `packages/brand/index.ts` | same head | store name, subtitle, tagline lines |
| `apps/web/src/content/site.ts` | last changed `d5a0b432e` (11 Nov) | all (the live website copy) |
| `apps/web/src/lib/support/copy.ts` | same head | all (/support) |
| `docs/reviews/2026-10-claims-inventory.md` | last changed `959cc0e65` (10 Nov) | sections 1, 2, 3a |
| `docs/legal/COUNSEL_PACKET.md` | version 1.5.0 | Q40 to Q57 and the carried table (Q10, Q16, Q17, Q22, Q32 to Q40) |
| `docs/legal/app-store-privacy-labels.md` | same head | User Content rows, build table |
| `docs/legal/compliance-register.md` | same head | grep for store, listing, claims (CR-002, CR-010, CR-012) |
| `docs/store/app-store-connect-1.0.md` | same head | section 2 (age rating) |
| `docs/store/screenshots/README.md`, `docs/store/preview/CAPTURE_GUIDE.md` | same head | heads of both |
| Design branch `docs/e2e-ux-20nov` | `1057f8ca4` (read in the worktree at that head, which matches `origin/docs/e2e-ux-20nov`) | screen id lists of all five `DESIGN.md`; E-S02, E-S10, E-S26, E-S27 in full; claims-check sections of A, B, C and D `WORDS.md`; E `WORDS.md` section 5.14 rows 1 to 6 |
| `docs/marketing/LAUNCH_PLAN.md` | only on `origin/agent/marketing/launch-plan` at `fde5be389` (15 Oct); there is no `docs/marketing/` on this branch | grep for share, beta, recruit, offer code, screenshot |

### 1b. Not reviewed

- `docs/product/prd/19-from-download-to-first-letter.md` (NS-38 to NS-45): not on any branch when I started. Near the end of this review an untracked, in-progress copy appeared in the working tree (591 lines, "Locked v1.0 candidate", needs Karma's ruling). I read its path table and NS-38 (App Store page and install) rows R1 to R9 and Claims, and the Claims, Label and Plan sections of NS-39 and NS-40. NS-41 to NS-45 had no body yet. `docs/product/prd/inputs/` did not exist. Section 2 marks NS-38 to NS-40 against that draft and NS-41 to NS-45 as missing; re-check when the file is committed.
- The prototypes and motion files (`PROTOTYPE.html`, `MOTION*.md`), `docs/design/system/*` beyond file names, and the full body of each card beyond the sections named above.
- No keyword volume research: I ran no keyword tool and read no volume data, so no keyword in this file carries a volume. Any volume claim later needs a source.
- I did not open App Store Connect, the live website, or any build. Statements about what the live site shows are readings of `apps/web/src/content/site.ts` on this branch, not of `main` or of the deployed site.

### 1c. Outside sources read this session (20 Nov 2026)

| Id | Source | What it says that this file relies on |
|---|---|---|
| A1 | Apple App Review Guidelines, https://developer.apple.com/app-store/review/guidelines/ ("Last Updated: October 16, 2026") | 2.2: betas "don't belong on the App Store - use TestFlight instead", and TestFlight apps "cannot be distributed to testers in exchange for compensation of any kind". 2.3: metadata "including privacy information, your app description, screenshots, and previews" must "accurately reflect the app's core experience" and be kept up to date. 2.3.3: screenshots "show the app in use". 2.3.4: "previews may only use video screen captures of the app itself". 2.3.7: keywords that "accurately describe your app", no "pricing information, or other irrelevant phrases". 2.3.8: metadata adheres to a 4+ rating; "For Kids" and "For Children" are reserved for the Kids Category. 2.3.10: no names, icons or imagery of other mobile platforms. 2.3.12: What's New must describe significant changes. 3.2.2(x): apps must not force users to rate or review to access functionality. Section 3 intro: manipulating reviews with "paid, incentivized, filtered, or fake feedback" may lead to expulsion. 5.6.1: "Use the provided API to prompt users to review your app ... we will disallow custom review prompts." 5.6.3: manipulating "charts, search, reviews, or referrals" is not permitted |
| A2 | Apple, Creating your product page, https://developer.apple.com/app-store/product-page/ | Name and subtitle up to 30 characters; promotional text up to 170, changeable without a new version, does not affect search ranking; description: "avoid including specific prices in your app description"; keywords 100 characters, no competing app names, no irrelevant terms; up to 10 screenshots, the first one to three show in search when no preview exists; up to 3 previews of up to 30 seconds "captured on the device"; What's New appears on the product page and the Updates tab (no character limit stated on that page) |
| A3 | Apple, App privacy details, https://developer.apple.com/app-store/app-privacy-details/ | "Collect" means transmitting data off the device beyond real-time servicing; data processed only on device is not collected; "Photos or Videos: The user's photos or videos"; "Audio Data: The user's voice or sound recordings"; answers may be updated at any time without an app update |
| A4 | Apple, Age ratings reference, https://developer.apple.com/help/app-store-connect/reference/age-ratings (no page date shown; refers to iOS 26) | Capability definitions for User-Generated Content ("broad distribution of content created by users"), Messaging and Chat, Parental Controls, Age Assurance, Unrestricted Web Access. The rating values table was cut off in my read: the values 4+, 9+, 13+, 16+, 18+ are UNVERIFIED this session |
| F1 | FTC, "FTC's Endorsement Guides: What People Are Asking", https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking (page shows published 7 Sep 2017, modified 15 Jul 2025) | A free or discounted product received to review "should be disclosed everywhere you endorse the product"; referring to early access alone does not disclose payment; asking only likely-happy customers for reviews "would be misleading" if it skews favourability; relatives and employees should disclose the relationship |
| F2 | 16 CFR Part 465 (consumer reviews rule) | eCFR fetch failed this session. Cited only through the CMO skill's reading of 31 Oct 2026: UNVERIFIED this session |

## 2. Coverage verdict per card, for marketing

"Covered" means the card's Claims section, with the frame, already tells marketing what it may and may not say, and nothing public is touched beyond it. "Partly" means the claims are there but a public surface the feature changes (store, site, What's New, screenshots, preview, label, rating, keywords) is not named. "Missing" means no basis to review.

| Card | Verdict | Why (marketing view) |
|---|---|---|
| NS-01 Photo with a letter | partly | Claims and screenshot rule present (s19). Missing: What's New line, keyword stance ("photo" not added), picture art provenance for screenshots, description and site sections that change at the flag, preview re-shoot |
| NS-02 Find | partly | Claims present. Missing: What's New line, screenshot rule (no counts), keyword stance ("search" not added) |
| NS-03 Pilot | covered | Nothing public; no participant quotes; no code before read-out (R7) |
| NS-04 Hands-free spike | covered | Nothing public; driving and "nothing leaves your phone" near Siri forbidden |
| NS-05 Share one letter | partly | Share loop rule is right (no brand, no reach assumption). Missing: no referral incentive or post-share "tell a friend" prompt; screenshot rule for the iOS share sheet (third-party app icons); What's New line |
| NS-06 A Firsts | partly | Claims present. Missing: keyword ban on "milestone" restated for keywords; screenshot shows no count |
| NS-06 B Sealed letter | partly | Claims present. Missing: screenshot imagery rule (no lock, wax or vault) restated for store art |
| NS-06 C Quick capture | partly | Claims present. Missing: screenshot or preview of a doorway only after it ships; no driving imagery |
| NS-07 C5 Quiet days | covered | Already in the listing ("Not much today") and site; claims match |
| NS-07 C28 Printable book | covered | "Printable", no order, partner, QR or links (C28-1, C28-6). The export's existing colophon carries the brand name inside the family's own file; that is not marketing |
| NS-07 G11 Label guard | covered | Forbids "verified automatically" |
| NS-08 Backup readiness | partly | NS-08-R7 covers app, listing, site and Save a copy. Missing: the waitlist welcome email and /support page by name |
| NS-09 Let it go | covered | Enabled line is in-app; no public use proposed |
| NS-10 New phone | covered | Forbids "everything moves" while backup is off |
| NS-11 Save a copy | covered | Site "Yours to take with you" and listing "Take it with you" already consistent |
| NS-12 Earlier versions | covered | Nothing public until built |
| NS-13 Reminders | partly | Claims present and consistent with the listing ("none comes after 9:30 at night" matches the 21:30 clamp). Missing: an explicit rule that no notification ever carries marketing |
| NS-14 Whose book | covered | n/a |
| NS-15 Another day | covered | Forbids "understands dates" |
| NS-16 Someone else speaks | covered | Forbids "invite grandparents" |
| NS-17 Second language | partly | NS-17-R4 covers the store listing only. Missing: website (`site.ts` s08, `pages.en.ts`), keywords, any custom product page |
| NS-18 Typed days | covered | None public |
| NS-19 Add more | covered | Forbids "edit what you said" |
| NS-20 Two books | covered | Forbids "one letter for all your children" |
| NS-21 Letter page | covered | Forbids "edit your letter", "rewrite" |
| NS-22 Calm header | covered | n/a |
| NS-23 One past letter | covered | Forbids machine-chosen memories |
| NS-24 Read the year back | partly | T1 is applied to the card. Missing: the existing FAQ line that says Read together is "never locked away" (`packages/content/src/site.en.ts:109`) is not named as drift to fix |
| NS-25 Other parent | partly | Claims gated and BRAND.md line 40 named. Missing: age rating re-answer at the build that turns it on; screenshot and What's New lines; the live website's Family tab drawing (D-161 open item) |
| NS-26 to NS-31 parked | covered | Decision records; NS-30 forbids "order", "printed", "hardcover" |
| NS-32 Notification budget | partly | Claims present. Missing: a rule that the registry never admits a marketing, announcement, offer or rating class |
| NS-33 Accessibility | covered | Accessibility Nutrition Labels: declare nothing until the walk passes |
| NS-34 Speed | covered | No "fast" or numbers in public |
| NS-35 One start | covered | n/a |
| NS-36 Data follows the letter | covered | "Delete a letter and everything with it goes" after R1a to R1d |
| NS-37 Book stays fast | covered | Forbids "unlimited photos" |
| NS-38 App Store page and install (draft) | partly | Strong: 18+ override, US only, Lifestyle (R1); no "no account" sentence (R2); label matches build (R4); review notes (R5); screenshots from the release build, Asha only (R7). Missing: R2's phrase list does not catch the live listing line "Without an account, your book stays on your phone." (FR-MKT-08); keywords, promotional text, What's New and the preview video are not named (FR-MKT-09, 11, 15); "Not in scope: the website" leaves the site and welcome email to no card (FR-MKT-05, 06) |
| NS-39 First launch, NS-40 Age and region (draft) | partly | Claims present ("Works without a connection" for recording and typing only; "For adults 18 and over"; forbids "age verified", "safe for kids"). Missing: no marketing in first run (FR-MKT-21) |
| NS-41 to NS-45 | missing | No body in the draft read (section 1b). Provisional needs: FR-MKT-21, FR-MKT-22, FR-MKT-33; NS-45 (app update) needs FR-MKT-09 |
| Pack-wide: Apple rating prompt (F13-REQ-020) | missing | No card owns when the rating request may and may not appear (FR-MKT-23) |

## 3. Function requirements

| Id | Requirement (Given, When, Then where testable) | Links (card rows, e2e screen ids, backlog rows) | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-MKT-01 | Given a card's enabled claim (NS-01 s19, NS-02 s19, NS-05 s18, NS-06 A18, B18, C18, NS-07 3.18 and 4.18, NS-09, NS-10, NS-11, NS-13, NS-24, NS-25, NS-32, NS-36), When any public surface carries it (store description, promotional text, What's New, screenshot caption, website, /support, email), Then the claims inventory has its row (words, every surface, decision of record, code evidence, profiles where false, verdict "true") and the card's `production` flag is on in the candidate being submitted; otherwise the line is held | Frame s7 (claims list); `14-test-plan.md` G5, G6; E-S27 | P0 (a)(b) | marketing (CMO keeps the inventory), qa (CCO check per candidate) | Frame s7; CMO skill s7 step 2; A1 2.3 |
| FR-MKT-02 | Given the union of every card's Forbids list (appendix A), When a test reads the public surfaces (`packages/content/src/store.en.ts`, `docs/store/app-store.md`, `docs/store/screenshots/captions.json`, `apps/web/src/content/site.ts`, `apps/web/src/lib/support/copy.ts`, `packages/content/src/site.en.ts`, `packages/content/src/pages.en.ts`, `packages/emails` templates), Then no forbidden phrase matches, except an allow-listed line with a written reason | All s19 Claims sections; README appendix A; `packages/content/test/rules.test.ts` | P0 (b) | content (test), marketing (list) | A1 2.3, 2.3.7; CMO skill s12 |
| FR-MKT-03 | Given Read together in any public copy, Then it may be called free only in the words the current listing uses; no "never locked away", "forever", "never limited", "no limit" or "unlimited" is applied to it. The FAQ answer at `packages/content/src/site.en.ts:109` ("Reading, playing your recordings, Read together and export are never locked away") is rewritten before any page renders it | NS-24 s19, s20; ruling T1; B-S19, B-S20 | P0 (a)(b) | content, marketing | `16-council-review-round-2.md` T1; counsel Q40 (Terms 8.4 lists Read together as free today, not in the permanent list); counsel must confirm |
| FR-MKT-04 | Given a public line about what stays free (reading, playing recordings, export), Then it uses the Terms 8.2 permanent list in substance, speaks of letters a family kept, and says nothing about the future of any other capability (ruling T2). Lines to check: `pages.en.ts:80` "/about What it costs"; `apps/web/src/lib/support/copy.ts` "Reading, listening and your copy stay free" ("listening" must mean playing a kept letter's recording, not Read together); `site.ts` s10 `promise` says "made" where D-082 says "kept" | Frame s7 (open-ended promises); T2; E-S10, E-S11 | P1 (a) | content, legal | Counsel Q40, Q16; counsel must confirm |
| FR-MKT-05 | Given the website draws the app (`apps/web/src/content/site.ts` scenes s02 to s07), Then the drawn tab bar reads Home, Book, Me and nothing draws a Family tab or a co-parent surface; today `s02.appTabs` is `['Tonight', 'Book', 'Family']` | D-161 "Open" (website copy and store screenshots still show the old bar); D-162; NS-25 s19 | P0 (a) | web owner (coordinator), founder merges to `main` | D-161 text on this branch; CMO skill s7 step 4 (net impression) |
| FR-MKT-06 | Given the waitlist welcome email (`site.ts` `welcomeEmail`), When Build 12 requires sign-in and syncs letter text (D-160), Then the promise "Your letters and recordings stay on your iPhone" is removed or replaced with registered wording ("Recordings are kept on the phone that made them" family), the sign-off follows VOICE.md, and the email is not sent again until counsel classifies it and a postal address exists if it is commercial | NS-08-R7; E-S27; counsel Q34, Q43 | P0 (a)(b) | content, marketing; founder merges to `main` | D-160; `site.ts` comment on `comingSoon.trust` already says the phone-only claim "is false once a person signs in"; CMO skill s9 (welcome email); counsel must confirm CAN-SPAM classification |
| FR-MKT-07 | Given a privacy promise on any public surface, Then it is `en.trust.promise` word for word (D-061) or a registered subset; `site.ts` s09 "Your letters are never used to train AI." is replaced, because it differs from the promise and names AI | Frame s7; NS-02 s19 ("AI search" forbidden) | P0 (a) | content, marketing | D-061; claims inventory section 3c; counsel Q16, Q43 |
| FR-MKT-08 | Given the store listing submitted with Build 12 (sign-in required, D-160), Then every description line is true of that profile. The line "Without an account, your book stays on your phone." in `store.en.ts` (PRIVATE BY DEFAULT) is checked against the servers-on build: if no accountless path exists except the outage "start on this phone" path, it is rewritten, and NS-38-R2's phrase list gains "without an account". NEEDS EVIDENCE: which listing variant is submitted (open branches `fix/content-store-copy-sign-in-flip-10nov` and related were not read) | NS-38-R2 (draft); E-S02, E-S14, E-S27 | P0 (b) | content, marketing, release | A1 2.3; D-160; `store.en.ts` header (each line must be true of a servers-on build) |
| FR-MKT-09 | Given a release that turns a card's `production` flag on, When What's New is written, Then it names that feature using only the card's enabled claim, names nothing whose flag is off, says nothing is "coming soon", never says "beta", "early access" or "preview", and gives no count. Intent lines per feature are in section 3a | Every card s19, s22; NS-45 (app update) when written; E-S16 | P0 (b) | content, marketing | A1 2.3.12, 2.2; D-060; D-161 |
| FR-MKT-10 | Given a listed feature is hidden by its remote pause or kill switch in `production`, Then within one working day the promotional text stops mentioning it, and the next submitted version's description and What's New drop it unless the pause has ended; a pause longer than 14 days is raised to the founder as a listing change | Each card's flag and pause key (s10); E21 errata (a switch hides, never turns on); E-S27 | P1 (b) | marketing, release | A1 2.3 ("keep them up-to-date"); A2 (promotional text changes without a version) |
| FR-MKT-11 | Given the keyword field (100 characters), Then it holds only words true of the submitted build: no "kids", "milestone", "tracker", "photo book", "album", "smart", "AI", "share", "grandparents", "backup", competitor or other-app names, prices, or a language name before that language ships; no keyword is added for NS-01, NS-02 or NS-05 at their release without a written reason in the claims inventory | NS-01 s19, NS-02 s19, NS-05 s18, NS-06 A18, NS-17-R4; E-S27 | P0 (b) | marketing (draft), content (field), founder (as submitted) | A1 2.3.7, 2.3.8; A2 keywords; D-004 |
| FR-MKT-12 | Given any store screenshot, preview or website image of the app, Then it is captured from the build being submitted (or the build that site copy describes), shows only the fictional Asha book on a separate install (D13), and shows no real person, child, name, letter, picture or voice. A picture inside a letter (NS-01) is an illustration or licensed photography with a model release kept on file in `docs/store/art/`, never a family's own photo, and never an AI-generated photo of a child (recommended default; founder may reverse) | NS-01 s19 (licensed or illustrated Asha images only), NS-01-R62; D13; A-S03, B-S04, B-S11, E-S27 | P0 (b) | design-systems (frames), marketing (storyboard), founder (spend if licensed) | A1 2.3.3, 2.3.8; CLAUDE.md privacy rules |
| FR-MKT-13 | Given a marketing frame (screenshot, preview, website scene), Then no count, streak, progress figure or gap is legible: the Book's month rows either show no letter count in the frame or the frame is cropped above them; Find shows no result count; Firsts shows no number | B G-07 (facts allowed in-app where a parent looks, never as progress); NS-02-R11; NS-06 A18; B-S01, B-S05, B-S06 | P1 (a) | design-systems, marketing | CLAUDE.md content rules; frame guardrails |
| FR-MKT-14 | Given a frame for Share one letter, Then it shows our preview sheet (D-S02) with the words row and the version line, not the iOS share sheet with third-party app icons; the picture toggle is off and no child picture is shown while counsel Q45 is open; no frame shows a recipient's view | NS-05-R4b, R5b, R16a, R16b, R19; D-S01, D-S02, D-S03 | P1 (b) | design-systems, marketing | A1 2.3.10 (other platforms' imagery; third-party app icons are a trademark risk, counsel must confirm); counsel Q45 |
| FR-MKT-15 | Given the app preview video, Then it is re-captured on device from the submitted build after D-161 (Home, Book, Me; no Family tab), with the Asha book only, and shows no feature whose flag is off; `docs/store/preview/CAPTURE_GUIDE.md` is updated (it still says "Tonight", "Settings" and refers to the D-126 Family tab check) | D-161; E-S27; every card whose feature appears | P0 (b) | marketing (storyboard), founder (capture) | A1 2.3.4; A2 previews ("captured on the device") |
| FR-MKT-16 | Given a card's Label effect line changes the App Privacy answers, Then in the same release the store description privacy paragraph, screenshot 6 subline, the website privacy points (`site.ts` s09) and /support change with it, and no public line states a data practice the label contradicts. Table in section 3b | Frame s7 (label in the same build as the behaviour); each card s18; G5; C-S08, C-S21 | P0 (b) | marketing, privacy, content | A1 2.3 (privacy information is metadata); A3; counsel Q54 |
| FR-MKT-17 | Given a release that ships NS-25 (two parents in one book), NS-05 Level 2 or 3, or NS-28, Then the age rating questionnaire (User-Generated Content, Messaging and Chat) is re-answered and recorded in `docs/store/app-store-connect-1.0.md` before submission; NS-01, NS-02, NS-05 Level 1 and NS-06 are proposed as no change, because nothing is distributed inside the app (Share leaves through the parent's own share sheet) | NS-05 s3, NS-25, NS-28; E-S27 | P1 (b) | compliance, marketing | A4 (capability definitions); current answers in `app-store-connect-1.0.md` s2 (calculated 4+, override 18+); counsel must confirm; rating values UNVERIFIED this session |
| FR-MKT-18 | Given Apple's Accessibility Nutrition Labels and any public accessibility line, Then nothing is declared or said until the NS-33 device walk passes; then only the passed items, and the website and listing say no more than the label | NS-33 s19; BL-984; E-S27 | P1 (b) | compliance, marketing | NS-33 s19 (founder default: declare nothing) |
| FR-MKT-19 | Given Share one letter, Then the shared text carries no brand, link or "sent from" line (NS-05-R16b); the app shows no "tell a friend", referral, reward or rating ask after a share; and no launch plan, forecast or goal counts on shares for installs. Acquisition comes from App Store search, parent communities within their rules, and later offer codes | NS-05 s18, R16b; D-S01 to D-S03; frame s3 measures | P0 (a) | marketing, mobile | Karma ruling 11 Nov (no footer); A1 5.6.3 (referrals); CMO skill s9 (channels) |
| FR-MKT-20 | Given the notification registry (NS-32 `lib/reminders/budget.ts`), Then no class exists for announcements, new features, offers, win-back, Plus promotion or rating requests; a test fails the build when a class id outside the registered list (`plan`, `typedDay`, `birthday`, `monthAge`, `evening`, and later rows each with a card) is added; plan notice bodies name dates and where to change them, never a feature pitch | NS-32 s3, R-rows; NS-13; NS-18; D-S10, D-S11 | P0 (a) | mobile (test), marketing | Listing promise "Reminders, only if you want them"; frame guardrails (no guilt lines) |
| FR-MKT-21 | Given first run (E-S01 to E-S09, E-S24, E-S28, E-S29), Then it carries no marketing: no What's New sheet, rating prompt, testimonial, social proof, feature tour beyond the built cards (C-34 is parked), and no price or trial beyond `membership.line` said once | E-S02 (no price, no trial); `12-parked-and-not-built.md` C-34; NS-35; NS-38 to NS-45 when written | P1 (c) | design-systems, content | Frame guardrail "zero paywalls before a parent has seen their words" |
| FR-MKT-22 | Given the Keep gate (E-S10) and the Home Plus line (E-S26), Then neither shows a testimonial, rating, review count, "most popular", discount, countdown, comparison or price; the Plus line is one static string (no rotation, no A/B copy); offer codes are redeemed only through Apple's Redeem a code; no rating prompt is requested in a session in which the gate sheet was shown | E-S10, E-S26, E-S11; F13-REQ-020; D-082, D-083 | P0 (b) | mobile, content, marketing | A1 5.6.1, 3.2.2(x); D-083 (no prices or "free trial" in app copy) |
| FR-MKT-23 | Given Apple's rating request (F13-REQ-020, not built), When it is built, Then it uses Apple's API only; it may be requested only on the Book after a letter was kept by the parent's own act (A-S13 saved), not the first kept letter; and never in first run, in a session where the Keep gate was shown, on a notification landing, during capture or Review, after Let it go, deletion, erase, sign-out or a plan lapse, on a seal-opened day (B-S18), during Read together (B-S19), or after any error line; nothing is offered or unlocked for rating | F13-REQ-020; A-S13, B-S18, B-S19, E-S10, C-S19, C-S20 | P1 (b) | mobile, marketing | A1 5.6.1, 3.2.2(x), section 3 intro; PRD v2 03 s4.5 |
| FR-MKT-24 | Given the Home slip registry (`[FRAME-SLIP]`), Then no promotional, What's New, rating or "try this feature" slip type is ever registered; a feature is introduced by its own screen when the parent reaches it, never by a Home slip | Frame s4 (one slip, fixed order); A-S01, B-S17, B-S18, C-S06 | P1 (a) | mobile, product | Frame s4; NS-23 |
| FR-MKT-25 | Given any endorsement or review: no testimonials at launch; any later testimonial needs written permission, the person's own words, and the connection disclosed; no participant in the pilot (NS-03), the five-parent studies (BL-981) or TestFlight receives a code, gift or Plus before their read-out, and any later code carries a disclosure line; no review is solicited from relatives, friends or testers without the relationship disclosed; no review gating | NS-03-R7; BL-981; BL-109; D-S23 | P0 (b) | marketing, legal | F1; A1 2.2, section 3 intro; F2 (UNVERIFIED this session); counsel must confirm |
| FR-MKT-26 | Given beta recruitment materials (BL-109), Then they recruit for TestFlight only, offer no compensation, promise only what the build being tested does, and use the store-build scope: English only (D-121, NS-17), no co-parent pairs for store-build testing (co-parent is alpha-only, D-162), a VoiceOver or large-text user, one set of twins, an expecting parent; answers live outside the repo and sessions (D5); any example image is Asha-only. BL-109's coverage line (co-parent pairs, Hindi and Spanish speakers) is rewritten | BL-109; NS-17; NS-25; D-162; D5 | P1 (b) | marketing (drafts), founder (sends) | A1 2.2; frame s3 (hand-sent measures) |
| FR-MKT-27 | Given the launch plan, Then a current one exists on `develop` under `docs/marketing/` (the only plan is on `origin/agent/marketing/launch-plan`, 15 Oct, pre-D-121 and pre-D-161), ordered by the gates G0 to G6 and the claims order of this file, with no dates in the cards (T5) and timing taken from the roadmap | `14-test-plan.md` gates; T5; ROADMAP | P1 | marketing | Branch read 20 Nov |
| FR-MKT-28 | Given a spoken language, Then every public surface names it only once it ships in the submitted build: store listing (NS-17-R4), keywords, website (`site.ts` s08; `pages.en.ts` "/about", which names seven languages today), any custom product page, and emails | NS-17-R4, s19; A-S10 | P0 (b) | content, marketing | A1 2.3, 2.3.7; D-121; D-125 item 2 |
| FR-MKT-29 | Given recording backup is off, Then NS-08-R7's check also reads the welcome email, /support and the reference FAQ (`site.en.ts` "What happens to my recordings?"); at the flip, every surface (listing, site, /support, email, screenshot 3 subline, label) changes in the same release and no line says "backed up", "safe in the cloud" or "never lose" | NS-08-R7, s19; C-S08, C-S21 | P0 (a)(b) | marketing, content, qa | Frame s7 ("no public surface may imply a recording survives a lost phone") |
| FR-MKT-30 | Given the store description, Then a founder decision records whether the specific prices in its PLUS section stay (Apple advises against prices in the description; D-075 puts prices on the website; the auto-renewal paragraph stays either way) | E-S27; D-075, D-083 | P1 (b) | founder, legal | A2 ("avoid including specific prices in your app description"); counsel Q37, Q41; counsel must confirm |
| FR-MKT-31 | Given a feature ships, Then the website page map (section 3c) is updated in the same release window: the home film scenes, /support, and the unrendered /about, /why and FAQ sources; no web page describes a feature before its `production` flag is on | Section 3c; every card s19 | P1 (a) | web owner, content, marketing | CMO skill s7 step 3 (test against the build that ships) |
| FR-MKT-32 | Given any marketing material (store, preview, screenshots, emails, posts, recruitment), Then the D-118 name appears nowhere except the one website file D-118 allows; the welcome email, which renders text from that file into a separate surface, uses Asha unless the founder says otherwise | D-118; D13 | P0 (a) | marketing, content | CLAUDE.md privacy rules; CMO skill s9 |
| FR-MKT-33 | Given NS-38 to NS-45 (download to first letter), When the cards land, Then the Welcome descriptor (E-S02) and the store subtitle and first screenshot tell the same story in five seconds ("a book you fill by talking"), the listing does not imply no account is needed when sign-in is required, and App Review notes carry the demo sign-in | E-S02, E-S27; NS-38 to NS-45 | P1 (b) | marketing, content | A1 2.3, 2.3.1; D-160 |
| FR-MKT-34 | Given launch measurement with analytics off (D-124), Then the website, emails and store links carry no tracker, pixel or tracked link; attribution comes only from App Store Connect and Apple's own custom product page or campaign links; any number reported from them is "x of n" when n is under 20 | Frame s3; D-124 | P0 (a) | marketing | Frame s3; CMO skill s9 (measurement) |

### 3a. What's New and listing intent per feature (PROPOSED intent; `content` writes; founder approves)

| Card | What's New intent (only when the flag is on in `production`) | Description section | Screenshot or preview need |
|---|---|---|---|
| NS-01 | "Add a picture to a letter. It stays on your phone." | A short section; no "memories", "album", "photo book" | One frame: Review or the letter page with an illustrated or licensed picture (A-S03 ready with picture, B-S11); preview may show it |
| NS-02 | "Find a letter by a word in it, even offline." | One line under the book section | Optional frame: B-S06 with matches underlined, no count |
| NS-05 Level 1 | "Send one letter to someone you love, as text, from your own messages." | One line; no "share your voice", no "private link" | Optional frame: D-S02 preview, picture off (FR-MKT-14) |
| NS-06 A | "Mark a letter as a first, in your own words." | One line; no "milestones" | Optional frame: B-S12, no count |
| NS-06 B | "Keep a letter for a day you choose." | One line; no "locked", "time capsule" security words | Optional frame: B-S13; no lock or wax imagery |
| NS-06 C | "Start a letter from your Lock Screen" (or the doorway that ships) | One line; no "hands-free", no Siri with "nothing leaves your phone" | No frame until shipped; never a car |
| NS-07 C28 | "A free printable PDF of the book." | Added to TAKE IT WITH YOU | None needed |
| NS-11 | "Save a copy of the year, in open formats, yours to keep." | Already covered by TAKE IT WITH YOU | None |
| NS-13, NS-32 | "Gentle reminders at the hour you choose"; "at most one a day" only after NS-32-R1 passes on a device | REMINDERS section kept; no "smart" | Optional: D-S06; never a lock screen with a child's name |
| NS-17 | Names the language that shipped | IN ENGLISH section becomes a language list | Custom product page per language only after it ships |
| NS-24 | "Read a year of letters together" | Under READ TOGETHER; "free" only as T1 allows | Frame 5 subline stays true ("One letter at a time, oldest first") |
| NS-25 | "Both parents in one book, each letter signed." only after its gates | New section; BRAND.md line 40 fixed first | New frame of two signatures (Asha's book, "Mama" and a second fictional signer) |
| NS-08 flip | Words set at the flip with counsel | PRIVATE and VOICE sections change | Screenshot 3 subline re-checked |
| NS-09, NS-10, NS-12, NS-14 to NS-16, NS-18 to NS-23, NS-33 to NS-37 | None public, or a generic "Small improvements" when nothing significant ships | none | none |

### 3b. Privacy label consistency by card

| Card | Label effect (card s18) | Public lines that must move with it |
|---|---|---|
| NS-01 | None while pictures stay on the phone ("Photos or Videos: not collected"); changes only if pictures leave (C-32, parked) | Description and site may say "Pictures stay on this phone" only while R15, R26, R61 hold (A3: on-device data is not collected) |
| NS-08 | At the flip: Audio Data collected and linked; Device ID if `backup_devices` exists (Q54) | PRIVATE BY DEFAULT, YOUR VOICE KEPT, `site.ts` s09 point 1, /support "Your recordings", screenshot 3 subline |
| NS-16 | Possibly Contact Info for a typed non-user name (Q54); flag off in `production` until answered | No public line until counsel answers |
| NS-25 | Read against the build that turns it on (Q54) | New section, site, /support; "Only you" lines (`site.en.ts` FAQ "Who can see my letters? Only you.") must not render, as it is already false with D-102 and sync |
| NS-26 | Push tokens may need a row (Q54(d)) | Parked; nothing |
| NS-28, NS-30 printed | Audio Data collected if built | Parked; nothing |
| All others | None | None |

### 3c. Website pages and lines each feature changes

| Surface (file) | Line today | Feature or ruling | Change |
|---|---|---|---|
| Home film, `apps/web/src/content/site.ts` s02 `appTabs` | Tonight, Book, Family | D-161 | Home, Book, Me (FR-MKT-05) |
| s08 Languages | English only, "more follow one at a time" | NS-17 | Add a language only when it ships (FR-MKT-28) |
| s09 Private | "never used to train AI"; "recordings are kept on the phone that made them" | D-061; NS-08 | Promise wording (FR-MKT-07); recordings line changes at the flip (FR-MKT-29) |
| s10 Pricing `promise` | "Every letter you have made stays yours to read, play and export" | D-082; T2 | "made" to "kept" (FR-MKT-04) |
| `welcomeEmail.promises`, `signoff` | "stay on your iPhone"; "The ... team" | D-160; VOICE.md | FR-MKT-06 |
| `/support`, `apps/web/src/lib/support/copy.ts` | "Reading, listening and your copy stay free." | T1, T2 | "listening" means a kept letter's recording; no Read together permanence (FR-MKT-04) |
| Reference FAQ, `packages/content/src/site.en.ts` (not rendered today) | "never locked away" incl. Read together; "Only you"; languages | T1; D-102; NS-17 | Must change before any page renders it (FR-MKT-03) |
| `/about`, `packages/content/src/pages.en.ts` (not rendered today) | seven languages; co-parent invite; "never locked away" | D-121; NS-17; NS-25; T1 | Must change before it renders |
| New lines at each flag | none | NS-01, NS-02, NS-05, NS-06, NS-24, NS-25 | Only the card's enabled claim, after FR-MKT-01 |

## 4. Design needs

| Screen id | Need | For |
|---|---|---|
| E-S27 App Store page | A storyboard of up to 10 frames, ordered so frames 1 to 3 tell the five-second story in search ("talk", "your words, every change marked", "your voice kept"); each frame names its source screen id, build, flag state and claims row; one dark-mode frame | FR-MKT-01, 12, 13 |
| A-S01 Home | Frame 1 recaptured with the Home tab label (not Tonight); no Plus line (E-S26) and no slip in the frame | FR-MKT-05, 15, 24 |
| A-S07 Review | Frame 2 as today; letter words in Asha's fixture only | FR-MKT-12 |
| A-S03 and B-S11 Picture | New frame at NS-01: an illustrated or licensed picture; no face of a real child; rights record in `docs/store/art/` | FR-MKT-12 |
| B-S01 The Book | Frame 4 without legible letter counts (crop or a state without month meta) | FR-MKT-13 |
| B-S06 Find | Optional frame: underline plus medium weight, no count | FR-MKT-13 |
| B-S12, B-S13 | Optional frames: no count; no lock, wax or vault imagery | FR-MKT-13, NS-06 B18 |
| B-S17, B-S18 Home slips | No promotional slip type; no rating ask on a seal-opened day | FR-MKT-23, 24 |
| B-S19, B-S20 Read together | Frame 5 dark; year title "Asha's first year" allowed; no "year in review" | FR-MKT-03, NS-24 s19 |
| C-S08 Where your letters live | Source for the privacy frame (frame 6); its words follow the label in force (section 3b) | FR-MKT-16, 29 |
| D-S01 to D-S03 Share | Frame from D-S02 only; picture toggle off; no third-party app icons; no "tell a friend" after the sheet closes (D G2: focus returns to Share) | FR-MKT-14, 19 |
| D-S06, D-S10 Reminders | If a reminders frame is used, the lock screen shows the neutral placeholder, never a child's name | FR-MKT-20, NS-13 s19 |
| D-S10, D-S11 Notifications | No class or body that announces a feature, offer or rating | FR-MKT-20 |
| E-S02 Welcome | Descriptor matches the store subtitle's promise; no price, no trial, no tour (as designed) | FR-MKT-21, 33 |
| E-S10 Keep gate, E-S26 Plus line | No testimonial, rating, count, discount or countdown (as designed); a note that a rating request is never made in a session where E-S10 showed | FR-MKT-22, 23 |
| E-S16 App update line, NS-45 | The update line never lists features; What's New lives on Apple's page | FR-MKT-09, 21 |
| New: rating moment | A state on B-S01 after A-S13.saved where Apple's request may be called, with the exclusion list of FR-MKT-23 drawn as a state table (new screen state needed) | FR-MKT-23 |
| Website (no e2e id) | `site.ts` scenes redrawn with three tabs; any drawn letter uses words from the sample letter, no new real names | FR-MKT-05, 32 |

## 5. Card changes I propose (for Karma to rule)

| Card row | Change | Why |
|---|---|---|
| Frame s7 (claims) | Add: "Read together is free" as a claims row (T1 words only); add the website welcome email and /support to the surfaces every claims check reads | T1 is in the cards but the existing FAQ drift is not named; the email is a public surface that is not in any card |
| Frame s3 or s4 | Add a guardrail: no marketing in notifications, slips, first run or the Keep gate (FR-MKT-20 to 24) | No card owns these moments for marketing |
| Frame (new section) or a card in `19` | Give F13-REQ-020 (Apple rating request) a home with FR-MKT-23's rules and a P1 row | No card specifies the rating moment |
| NS-05 s18 | Add: no referral, reward or "tell a friend" prompt after a share; screenshot rule of FR-MKT-14 | Keeps Share a trust act; A1 5.6.3 |
| NS-08-R7 | Name the waitlist welcome email and /support among the surfaces checked | The email promises recordings and letters "stay on your iPhone" today |
| NS-17-R4 | Extend from "the store listing" to "every public surface, keywords and custom product pages" | `pages.en.ts` names seven languages |
| NS-24 s19 | Name `packages/content/src/site.en.ts:109` as drift to fix under T1 | The line puts Read together in a "never locked away" list |
| NS-25 s22 | Add the age rating re-answer (FR-MKT-17) and the website tab drawing (FR-MKT-05) to the gates | Metadata must match the build (A1 2.3) |
| NS-32 s3 | Add a row: the registry admits no announcement, offer, win-back, Plus or rating class; a test fails on an unknown class id | Turns a promise ("only if you want them") into a test |
| NS-01 s19 | Add: a rights record for every picture used in store art, kept in `docs/store/art/` | Licensed or illustrated images need provenance |
| BL-109 | Rewrite coverage to the store-build scope (FR-MKT-26) | It still asks for co-parent pairs and Hindi and Spanish speakers |
| NS-38 (draft) R2 and s3 | Add "without an account" to R2's phrase list; name keywords, promotional text, What's New and the preview video in scope (or point to FR-MKT-09, 11, 15); give the website and welcome email a card owner, since NS-38 puts the website out of scope | The listing line in FR-MKT-08 passes R2 as drafted; no card owns the site |

## 6. Engineering needs (backlog rows to add or change)

Note: `scripts/agents/lib.mjs` reads only three-digit ids, so these are proposed without numbers; Karma allocates.

| Proposed row | Scope | Owner |
|---|---|---|
| Public-surface forbid scan | Extend `packages/content/test/rules.test.ts` (or a new test) with the appendix A list over every file in FR-MKT-02, with an allow-list that needs a written reason | content |
| Claims-capability map for new flags | Extend `packages/content/test/claims-capabilities.test.ts` so a public line about photos, Find, Share, Firsts, seals, doorways, printable PDF or a language fails while that feature's `production` flag (local flag family, errata E20) is off | content, mobile |
| Website three tabs and claim fixes | `apps/web/src/content/site.ts`: `s02.appTabs`, s09 promise line, s10 "made" to "kept", welcome email promises and sign-off; founder merge to `main` | web owner |
| Reference FAQ and /about fixes | `packages/content/src/site.en.ts` FAQ (T1, "Only you", languages) and `pages.en.ts` (/about languages, co-parent, "never locked away") before any route renders them | content |
| Notification class allow-list test | NS-32 registry test fails on any class id not in the registered list (FR-MKT-20) | mobile |
| Rating request (F13-REQ-020) | Apple API only, with FR-MKT-23's exclusions as pure logic with unit tests | mobile |
| Store art pipeline | Asha seeding script for screenshots and preview under the three tabs; a slot for illustrated or licensed pictures with rights records; `CAPTURE_GUIDE.md` and `docs/store/screenshots/README.md` updated for Home and Me | design-systems, marketing |
| Store candidate claims diff | The G5 step produces a diff of listing, screenshots captions, label and website against the claims inventory per candidate | qa, release |
| BL-109 rewrite | Coverage and recruitment drafts (FR-MKT-26) | marketing |

## 7. Founder and counsel questions (each with a recommended default)

| # | Question | Recommended default | To |
|---|---|---|---|
| MQ-1 | The FAQ answer in `site.en.ts:109` lists Read together as "never locked away". Replace it? | Yes: list only what the Terms 8.2 permanent list covers (reading kept letters, playing their recordings, export) and say "Read together is free" with no time word | Founder; counsel Q40 |
| MQ-2 | The welcome email says letters and recordings "stay on your iPhone", false once sign-in syncs letters (D-160). Remove now? | Yes: remove the line in one PR to `main` (removing a false claim promises less); classify the email before any further send | Founder; counsel Q34, Q43 |
| MQ-3 | The site says "Your letters are never used to train AI." Replace with the D-061 promise words? | Yes | Founder; counsel Q16, Q43 |
| MQ-4 | Keep specific prices in the store description (Apple advises against it)? | Remove the prices from the description; keep the subscription and auto-renewal paragraph; prices stay on Apple's page and the website (D-075) | Founder; counsel Q37, Q41 |
| MQ-5 | Which listing variant goes with Build 12, given "Without an account, your book stays on your phone" and sign-in required? | The servers-on variant, re-checked line by line against the Build 12 binary | Founder; counsel Q43 |
| MQ-6 | Pictures in NS-01 store art: illustration or licensed photography? | Illustration (no likeness, no release, no spend); never an AI-generated photo of a child | Founder (spend if licensed) |
| MQ-7 | Rating request: when may Apple's prompt be called? | FR-MKT-23 as written; first request no earlier than the second kept letter | Founder |
| MQ-8 | Age rating at NS-25: does two parents reading one book change User-Generated Content or Messaging answers? | No change for NS-01 to NS-06; re-answer at NS-25 with counsel's view | Counsel: needs a number from legal |
| MQ-9 | Offer codes to pilot, study or TestFlight families after their read-outs: is a free Plus period a material connection that each family must disclose if they post or review? | Treat it as one: no code before the read-out, and any code carries a disclosure line (F1) | Counsel: needs a number from legal (Q41(f) covers only what an offer code must say) |
| MQ-10 | The welcome email renders the D-118 name from `site.ts` into a separate surface. Does D-118 cover the email? | No: the email uses Asha | Founder |
| MQ-11 | Add any keyword for photos, Find or Share when they ship? | No keyword added for them; language names only when shipped | Founder (keyword field as submitted) |
| MQ-12 | Trademark: the name is not cleared (D-121 note). Hold paid placement and permanent printed uses until cleared? | Yes | Counsel Q10 |

## Appendix A. Union of forbidden public phrases (from the cards' Claims sections and rulings)

For the FR-MKT-02 scan; `content` owns the final list. Case-insensitive.

- Pictures (NS-01): backed up (of pictures), safe forever, memories, photo book, photo album, find your photos, any count of pictures, any line that the app describes or understands a picture; unlimited photos (NS-37).
- Find (NS-02): search your recordings, find anything you said, smart search, AI search, any count of results.
- Pilot and family listening (NS-03, NS-05): share your voice, family can hear, family can listen, private link, share with grandparents in the app, any participant quote, any claim that the recipient sees every change, any count of shares.
- Hands-free and doorways (NS-04, NS-06 C): hands-free, while driving, voice-activated, always listening, "nothing leaves your phone" next to any Siri trigger.
- Firsts and seals (NS-06 A, B): milestones, track firsts, never miss a first, typical, time capsule (security sense), locked, secure, sealed forever, delivered to your child, for when they turn 18.
- Quiet days and reminders (NS-07 C5, NS-13, NS-32): never miss a day, stay on track, any streak word, smart reminders, any promise about what the lock screen shows beyond what we send; "at most one a day" before NS-32-R1 passes.
- Printable (NS-07 C28, NS-30): order, printed, hardcover, print-ready, photo book, any partner name.
- Label (NS-07 G11): verified automatically.
- Keeping (NS-08 to NS-12, NS-36): backed up, never lose a recording, safe in the cloud, only you can restore, free backup, instantly deleted everywhere, deleted everywhere instantly, everything moves, recordings move, nothing is ever lost, backup (of Save a copy), in case you lose your phone, protect your memories, full history, undo anything forever.
- Capture (NS-15, NS-16, NS-19, NS-20): any line that the app understands dates in what was said, invite grandparents, family can add letters, add to any letter, edit what you said, one letter for all your children.
- Languages (NS-17): understands any language, translates; any unshipped language name.
- Reading (NS-21, NS-23, NS-24): edit your letter, rewrite, memories that come back to you, we pick your best letters, your year in review, highlights, any count; free forever, never limited (T1).
- Family (NS-25): share with family, grandparents can join, coming soon, BRAND.md line 40 as written.
- Quality (NS-33, NS-34): accessible to everyone, fully accessible, works with VoiceOver (before the walk), fast, instant, any speed number.
- Standing (CLAUDE.md, VOICE.md, CMO skill s12): beta, early access, kids, for children, AI (as writer), end-to-end, 100% private, military-grade, free forever, exactly as you said it (store, held by D-125 item 9).

Growth and Marketing Lead (Claude role)
