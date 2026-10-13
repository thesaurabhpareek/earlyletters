# F21 App Store listing, website and legal pages

| | |
|---|---|
| Release | v1.0 gate |
| Priority and rank | P0, rank 21 (`05-feature-map.md` section 2) |
| Personas | P1 Evening parent and P3 Expecting parent (finding us), P4 Multilingual family; App Review and counsel as readers |
| Existing IDs | LEGAL-REQ-041 to LEGAL-REQ-045, LEGAL-REQ-051, LEGAL-REQ-052, LEGAL-REQ-058, K-13, K-32, D-004, D-030, D-042, D-060, D-061, D-063, D-072, D-075 to D-078, D-082, D-083, DR-08, DR-11, BL-100, BL-118, BL-286, BL-340, BL-341, BL-349; COUNSEL_PACKET Q1, Q3, Q7, Q10, Q17, Q24, Q31 |
| Depends on | F14 (membership facts for review notes), F17 (in-app legal rows), F18 (privacy label inputs), F19 (flag list for review notes; pack host for the subprocessor page), F20 (support address, `/delete-account` route), `packages/brand`, `packages/content` (`store.en.ts`, `pricing.ts`, `site.en.ts`), the website app (`apps/web`, on `origin/main` only) |
| Status | Draft V2, 13 Oct 2026. Code checked on `docs/prd-v2` rebased on `origin/develop` at 6482cd3, `origin/main` at f30084d, and the live site on 13 Oct |

> **Not legal advice.** Items marked **[Counsel]** wait on a licensed attorney.

> **Build state.** Server features are on for v1.0 (M14, founder, 13 Oct 2026), reversing commit c1764f9: account, sync, co-parent and the owner's encrypted recording backup ship. On 13 Oct every build profile still sets `EXPO_PUBLIC_SERVER_FEATURES` to `off` (`apps/mobile/eas.json`) until the release profiles flip. The listing on develop (`packages/content/src/store.en.ts`) describes co-parent invites (now true for v1.0), says the original recording stays "on your phone and in your iPhone's own backup" with a source comment citing D-085 for no backup of our own (out of date once backup ships), and says "the book holds both your voices" (read as family listening, which is v1.1), and the live website describes backup and family writing (`reviews/STALE-OUTSIDE-PRD.md`). App Review 2.3.1 forbids promoting what the app lacks (R1-S49). This spec requires the listing, review notes, privacy label and website to describe the build being submitted: server features on, unless the founder uses the kill path.

## 1. Why

- [D] earlyletters.com is primary and earlyletters.app redirects to it; legal pages are /terms, /privacy, /health-privacy and /subprocessors; universal links use earlyletters.com (B11, D-063). The website shows the Plus price (D-075), now $4.99 a month with a 1-month free trial and $49.99 a year with a 2-month free trial (D-082, M3; `packages/content/src/pricing.ts`).
- [D] The listing never says beta (B8, D-060). Membership: the first 2 letters kept are free; after that, Keep needs Plus; capturing, typing, reviewing, reading, playing, exporting, deleting and restoring are never gated; letters already made always stay readable, playable and exportable (M1, M2).
- [F] "Voice memory book" is taken: FirstChapter lists "Voice Memory Book for Newborns" and Tiny Treasures "Baby memory book you can hear" (R1 F21, R1-S4, R1-S67). Baby memory apps cluster in Lifestyle (9 of 11 in R1 F21).
- [F] Apps outside the Kids Category may not use "For Kids", "For Children" or child-targeting language in name, subtitle, icon, screenshots or description (5.1.4, R4 section 5, R4-S55). Every feature must be described in the review notes, and remote flags may only switch reviewed features (2.3.1(a)). Auto-renewing subscriptions must give ongoing value and work across the person's devices (3.1.2(a)).
- [F] An individual publishing an app that "requires sensitive user information" risks 5.1.1(ix) (R4 C6, D-004, DR-11). The mitigation is a Lifestyle listing with no health language and review notes that describe a family memory journal (ROADMAP 2.1 section 10).
- [F] The live site on 13 Oct serves drafts: each legal page carries a "This document is being finalised" banner and the AI drafting notice, and /privacy's body says version 1.1.0 while `docs/legal/privacy-policy.md` on main says 1.4.0 in its front matter (fetched 13 Oct). The home page states $3.99 and $29.99, recording backup, "Read together after the free sessions" and "the whole family adding letters" (`apps/web/src/content/site.ts` line 201 on main). Each conflicts with D-082, D-083, the v1.0 no-backup rule in `rules.test.ts`, or B1.
- [F] The claims registry `docs/legal/claims-registry.yaml` named by LEGAL-REQ-044 and VOICE.md does not exist; BL-118 defers it to v1.1. The content rules test blocks known overclaims in `packages/content` only (`packages/content/test/rules.test.ts`, "brand name and v1.0 claims").

## 2. Who

| Who | Moment | What they hold | What F21 must do |
|---|---|---|---|
| P1, P3 searching the App Store | A late feed, a search for "baby journal" | A thumb, 3 seconds per result | Name, subtitle and first 3 screenshots say: talk, kept exactly, your voice |
| P4 Multilingual family | Reading the description | A language question | The seven languages named only if each ships |
| A parent checking privacy | Before download, or after | The privacy label, /privacy | A label with no tracking section, a calm policy that matches the app |
| App Review | Reviewing the 2 Nov submission | Review notes, a build | Membership explained, every flag listed, how to reach the Keep gate, no hidden features |
| Counsel | Signing off by 29 Oct | Drafts | One set of final documents that match the build |

## 3. What we are solving

**Outcome:** every public word about Early Letters (listing, website, legal pages, review notes, privacy label) matches the build Apple reviews, and nothing in them overclaims.

| Metric | Target | How measured | Consent caveat |
|---|---|---|---|
| App Review rejections for metadata, 2.3.1 or 5.1.1 | 0 | Resolution Center | None |
| Claims in listing or website that the submitted build cannot keep | 0 | Claims check per release (F21-REQ-030) | None |
| Legal pages live with a drafting notice or a placeholder at submission | 0 | Fetch each page; grep for "Drafting notice", `{`, "being finalised" | None |
| Search-to-install conversion | Watch only | ASC App Analytics | None (Apple data) |
| Website pages failing WCAG 2.2 AA critical checks | 0 | axe in CI (LEGAL-REQ-051) | None |

## 4. Scope

**In v1.0**
- App Store Connect: name, subtitle, promotional text, keywords, description, What's New, 6 screenshots in 2 sizes, Lifestyle category, age rating overridden to 18+, United States only, support and marketing URLs, privacy policy URL, App Privacy answers, both subscriptions attached, export compliance, review notes and how a reviewer passes the 18+ gate.
- earlyletters.com: one page in prelaunch mode until the App Store link exists, then the App Store badge (`apps/web/src/lib/launch.ts`); the legal pages; /delete-account; `/.well-known/security.txt`; earlyletters.app redirecting.
- Legal pages rendered at build time from `docs/legal/*.md` (`apps/web/src/lib/legal/load.ts`), final versions after counsel sign-off (Thu 29 Oct, ROADMAP 2.1).
- A claims list for v1.0 (section 6.5): every privacy, AI, free and price claim, where it appears, the fact behind it, and counsel's approval.
- One source for public prices and trial wording: `packages/content/src/pricing.ts`.
- `/j` invite page, `/auth/confirm`, and a working AASA file **[server]** (F11, F02): v1.0 now that sign-in and co-parent ship (M14).

**Later**
- A published help centre (F20 content).
- Accessibility statement page (LEGAL-REQ-052, P1).
- The full `claims-registry.yaml` with a content-test hook (LEGAL-REQ-044; BL-118 defers it to v1.1, merged into T5-08).
- Product Page Optimization tests in ASC.
- Localised listings (F44).

**Never**
- "Beta", "early access", "preview" or "demo" in the listing (D-060, 2.2).
- "Kids", "for children" or any child-directed phrase in listing, screenshots or website (5.1.4, LEGAL-REQ-045).
- "Voice memory book" as the subtitle or the lead phrase (R1 F21).
- AI as a selling word; "rewrite", "polish" or "improve" applied to a person's words (constitution; R1 F21).
- Health, development-tracking or medical words in metadata (D-004, LEGAL-REQ-060).
- A promise of a v1.1 feature (grandparents, web page, family listening, word highlight, print) (R1 F21; rules test).
- A real family's details in any public asset (CLAUDE.md; `_AUTHORING.md` 7).
- Third-party trackers on the website; analytics on `/j` or `/auth` paths (`docs/ops/DOMAINS.md` 5; F11-REQ-005).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| FirstChapter | Subtitle "Voice Memory Book for Newborns"; "AI Baby Journal" [F] R1-S4 | No US rating shown | n/a | **Avoid** the phrase and AI words [R] |
| Tiny Treasures | Subtitle "Baby memory book you can hear" [F] R1-S67 | 5.0 (7) | n/a | **Avoid** the phrase [R] |
| From, Mama | Subtitle "Write letters to your children"; Lifestyle [F] R1-S20 | 4.9 (48) | n/a | Neutral; "letters" is shared ground |
| Qeepsake, Tinybeans, BabyPage, FamilyAlbum | Lifestyle; subtitles on milestones and photos [F] R1-S1, R1-S2, R1-S9, R1-S12 | 4.8 to 4.9 | n/a | **Match** Lifestyle [R] |
| Day One, Apple Journal, Calm | Health and Fitness [F] R1-S5, R1-S6, R1-S48 | 4.8 | n/a | **Avoid** Health and Fitness: it signals wellness and raises 5.1.1(ix) risk [R] |
| Dearest | Productivity; label with nothing linked [F] R1-S3 | 5.0 (1) | n/a | **Match** the clean label where counsel allows (F18 Q6) |
| Sproutbook | "AI recaps" in subtitle [F] R1-S8 | 5.0 (3) | n/a | **Avoid** [R] |

Our subtitle "Baby journal in your own voice" (`brand.subtitle`, 30 of 30 characters) leads with "journal" and "your own voice", not "voice memory book". [R] Keep it.

## 6. Experience

### 6.1 Entry points

| Where | What | Built? |
|---|---|---|
| App Store search and product page | Listing fields and screenshots | Copy built (`packages/content/src/store.en.ts`, `docs/store/app-store.md`, generated by `scripts/brand/store-listing.ts`); not entered in ASC |
| earlyletters.com | Home, prelaunch form, legal pages, /delete-account | Live (Vercel); source `apps/web` on `origin/main` only |
| Settings > Help and legal, Settings > Privacy | Links to /terms, /privacy, /health-privacy, /subprocessors | Built (`brand.web.*` in `packages/brand/index.ts`) |
| App Review | Notes for Review, demo data | Not built (draft in `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` step 8 is stale) |

### 6.2 Happy path

**A. Listing (by Fri 30 Oct, FT-43).**
1. Content regenerates `docs/store/app-store.md` from `store.en.ts` for the build state set by M14 (server features on), and the rules test passes.
2. The founder enters the fields in ASC, uploads screenshots rendered from the release build with the fictional family "Asha" (BL-340), sets Lifestyle, overrides the age rating to 18+, sets availability to the United States only, attaches `plus.monthly` and `plus.annual`, and pastes the review notes (6.4).
3. The founder enters App Privacy answers from the label for that build state (6.6) and checks them against the archived `.ipa` manifest (LEGAL-REQ-042, -043).

**B. Website at launch.**
1. After counsel sign-off (29 Oct), legal Markdown moves to `status: final` with version and effective date; the site rebuilds; banners and drafting notices disappear because `isFinalStatus` is true (`apps/web/src/lib/legal/render.ts`).
2. On approval, the founder sets `NEXT_PUBLIC_APP_STORE_URL` in Vercel and redeploys; the email form becomes the App Store badge (`launch.ts`).
3. One email goes to the prelaunch list (`apps/web/src/lib/notify/`), with one-click unsubscribe.

### 6.3 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F21-U01 | A language misses its gate in week 2 (ROADMAP cut) | Remove it from the description, keywords and screenshots before submission; the rules test today requires all 7 names | Listing names only shipping languages | Next release adds it | Rules test reads a shipping-languages list (F21-REQ-006) |
| F21-U02 | The founder uses the kill path and submits with server features off (M14 keeps the switch) | Listing, What's New, screenshot 3 and the trust lines drop co-parent and "people you invite" claims; label drops account data | Accurate listing | n/a | F21-REQ-005 |
| F21-U03 | Counsel has not signed off by 29 Oct | Submission moves (ROADMAP 2.1 risk 5); drafts are never published as final | n/a | Founder decides the date | n/a |
| F21-U04 | App Review rejects under 5.1.1(ix) | Resolution Center reply per D-004 positioning; entity hedge if started (FT-48) | n/a | 2 to 6 weeks (ROADMAP 0) | n/a |
| F21-U05 | App Review asks how Plus gives ongoing value with no sync in a kill-path build (server features off) | Notes say: each month Plus lets the family keep adding letters to a book that grows by month; Plus works on every device signed in to the purchaser's Apple Account; letters stay on the phone that made them | n/a | Reply within a day | Review notes check |
| F21-U06 | Reviewer cannot pass the 18+ gate | Notes say to answer "Yes, 18 or older" | n/a | n/a | Notes check |
| F21-U07 | Reviewer needs to reach the Keep gate | Notes: keep 2 letters, start a third, tap Keep; StoreKit sandbox sheet appears | Apple's subscription sheet | n/a | Notes walk-through on TestFlight |
| F21-U08 | A legal page fails to build (docs/legal not readable by Vercel) | `next build` fails loudly (`load.ts`) | Previous deployment stays | Fix `LEGAL_DOCS_DIR` | Build test |
| F21-U09 | `NEXT_PUBLIC_APP_STORE_URL` typo or a TestFlight link | Ignored; site stays prelaunch; build log warns | Email form | Fix and redeploy | `apps/web/test/launch.test.ts` |
| F21-U10 | Price changes in ASC | `pricing.ts`, the StoreKit file and ASC change together; website rebuilds | New price | n/a | Test that `pricing.ts` equals the StoreKit file |
| F21-U11 | Visitor with Do Not Track or Global Privacy Control | Web analytics (if ever on) send nothing | Page works | n/a | `apps/web/test/analytics.test.ts` |
| F21-U12 | Visitor with JavaScript off | Notify form still saves the address (fix 14ec2f7) | Thanks page | n/a | Playwright |
| F21-U13 | Screen reader, 200% zoom, reduced motion on the website | Scroll scenes respect reduced motion; legal pages readable | Accessible page | n/a | axe and Playwright (F21-REQ-025) |
| F21-U14 | A visitor on earlyletters.app | 308 to earlyletters.com (verified 13 Oct) | Home | n/a | Redirect test (`apps/web/test/redirects.test.ts`) |
| F21-U15 | Someone emails asking to delete their data, server-off build | F20 S-7 | A human reply | n/a | F20 |
| F21-U16 | Trademark conflict found for "Early Letters" (Q10) | Rename before launch is cheap; the name lives only in `packages/brand` (D-076) | n/a | Counsel | n/a |
| F21-U17 | Listing and website drift from the app copy | Trust promise must match `en.trust.promise` word for word (D-061) | Same words everywhere | n/a | Rules test extended to `apps/web` |

### 6.4 Notes for Review (draft, replaces `APP_STORE_CONNECT_SUBSCRIPTIONS.md` step 8 and F14 6.7)

Plain text for App Store Connect. Values in braces come from the build.

> Early Letters is a family memory journal for adults. A parent speaks or types a short letter to their child; it is written down on the phone and kept with the parent's own recording, filed by the child's month of age.
>
> To start: answer "Yes, 18 or older", create a book (a name is enough), then record or type a letter and tap Keep.
>
> Plus membership: the first 2 letters kept on this Apple Account's phone are free. To keep a third letter, the Keep step shows Apple's own subscription view (StoreKit) with Plus Monthly and Plus Annual. Nothing else ever needs Plus: recording, typing, reviewing, reading, playing recordings, Read together, starting more books, exporting everything and deleting are free. A letter waiting at the Keep step stays on the phone. Letters already kept always stay readable, playable and exportable, with or without Plus. Settings > Plan has Restore purchases, Manage subscription, Request a refund and Redeem a code, all Apple's sheets. Family Sharing is on.
>
> Ongoing value: each month the family keeps adding letters to a book that grows by month. Plus works on every device signed in to the purchaser's Apple Account. {server-off: Letters stay on the phone that made them in this version.} {server-on: letters sync to the family's book and a co-parent can write in it.}
>
> No account is needed. {server-off: There is no sign-in in this version.} Speech is transcribed on the device; nothing is sent to an AI service. Usage analytics are off unless the person says yes to a later question.
>
> Remote settings: the app reads a signed configuration that can only: pause downloads of language packs {and sync and invites, server-on}, switch between the reviewed wording variants {list from F19 6.5}, show a gentle update card, and raise the number of free letters. It cannot turn on any feature not in this build.
>
> Language packs for {languages} download when a parent picks that language. They are data (word lists and speech model weights), not code.

Rules: the notes name every flag the build reads (F19-REQ-024); they never say "beta"; they describe a journal, never a health or tracking service (D-004).

### 6.5 Claims list for v1.0 (until `claims-registry.yaml` exists)

| Claim | Where | Fact behind it | Status for v1.0 (server features on, M14) |
|---|---|---|---|
| "Your letters and recordings are private. We never sell them, never use them for ads and never use them to train machine learning models." (`en.trust.promise`) | App, listing, website | LEGAL-REQ-016; no ad SDK; on-device transcription | Holds; website uses different words today (D-061 asks word for word) **[Counsel]** Q17 |
| "Only you and the people you invite can read your book" | Listing "Private by default" | Invites | Holds once the release profiles turn server features on (M14); does not hold in a kill-path build |
| "Invite your co-parent to the same book" | Listing "Write it together", What's New | F11 | Holds once the release profiles turn server features on (M14); does not hold in a kill-path build |
| "The original recording stays with each letter, on your phone and in your iPhone's own backup if you use one" | Listing | D-033; Application Support excluded only for packs | Holds if letters and audio are in the iPhone backup [U: confirm on device] |
| "Backs up every recording" | Website pricing (live) | No backup of our own in v1.0: `store.en.ts` header and `rules.test.ts` say backup needs sign-in and a server and cite "D-085", while commit 6482cd3 and `_AUTHORING.md` M11 use D-085 for Recently deleted; M7 (D-073) and M14 say backup ships in v1.0 | Holds only once the owner backup is built and turned on (not built 13 Oct, F08); "every" overclaims if backup is opt-in (F08 Q2 default) [R]: reword with counsel |
| "Opens Read together after the free sessions" | Website pricing (live) | D-083: Read together is free, no sessions | Does not hold |
| "With the whole family adding letters" | Website pricing (live) | B1: co-parent only; contributors v1.1 | Does not hold |
| "$3.99 a month ... $29.99 a year" | Website (live) | D-082: $4.99 and $49.99 | Does not hold |
| "Your first two letters are free" | App, listing, website | M1, D-082 | Holds |
| "Every letter you keep stays yours to read, play and export, with or without Plus" | Listing, app | M1 | Holds |
| "Export your memory book any time, for free" | Listing | F15, never gated | Holds |
| "We never rewrite your words" | App, listing, website | Constitution, `verifyEdits` | Holds |
| "Speak your letters in English, Hindi, Spanish, Mandarin Chinese, French, Arabic or Portuguese" | Listing, website | B4; per-language gates (DR-01) | Holds only for languages that pass week 2 |
| "Transcription runs on your phone by default" | Website (live) | On-device only at v1.0 | Holds; "by default" implies another mode exists, which v1.0 lacks [R]: drop "by default" |

## 7. Requirements and acceptance criteria

Status: **Built** (file), **Partly built**, **Not built**, checked 13 Oct. **[server]** needs our server and is v1.0 (M14); built code behind the switch is "Built, switch off in release profiles" until the profiles flip.

| ID | P | Requirement | Acceptance criteria | Status | Source |
|---|---|---|---|---|---|
| F21-REQ-001 | P0 | App name from `brand.storeName` | Given ASC, Then the name equals `Early Letters: Memory Book` (26 of 30) | Built (`packages/brand/index.ts`; not yet in ASC) | D-076 |
| F21-REQ-002 | P0 | Subtitle distinct from competitors' "voice memory book" | Given `brand.subtitle`, Then it is 30 characters or fewer and a test fails if it contains "voice memory book" or "memory book you can hear" (case-insensitive) | Partly built: subtitle "Baby journal in your own voice" in `packages/brand/index.ts`; no test | R1 F21 |
| LEGAL-REQ-045 | P0 | No "kids" or child-directed phrases in listing, screenshots, website | Given the rules test over `store.en.ts`, screenshot captions and the website copy, Then 0 matches | Partly built: `packages/content/test/rules.test.ts` covers `store.en.ts` and `site.en.ts`; the live site's copy lives in `apps/web/src/content/site.ts` on main, whose test covers characters, fear, machine-writing and gender only | CR-001 to CR-003 |
| K-13 Rev (B8) | P0 | No beta-like word in the listing | Given the listing, Then 0 matches for the D-060 pattern | Built (`rules.test.ts` "[K-13] has no beta wording") | D-060 |
| F21-REQ-003 | P0 | The listing describes only the submitted build | Given the build's `EXPO_PUBLIC_SERVER_FEATURES`, Then the rules test checks `store.en.ts` against a claim set for that state: off means no "invite", "co-parent", "people you invite", "sync" | Not built (`store.en.ts` promises co-parent invites; `docs/store/app-store.md` What's New mentions the co-parent) | 2.3.1, B1 |
| F21-REQ-004 | P0 | Listing names only shipping languages | Given a `SHIPPING_LANGUAGES` list (new, set after FT-34), Then the description and keywords name exactly those | Partly built: the test requires all 7 (`rules.test.ts` "names the seven v1.0 languages") | DR-01, ROADMAP 6 |
| F21-REQ-005 | P0 | Category Lifestyle; age rating 18+; United States only; both subscriptions attached; Family Sharing on | Given ASC before submission, Then each is set; screenshot in release evidence | Not built (FT-43, BL-286) | D-004, LEGAL-REQ-058 |
| F21-REQ-006 | P0 | Notes for Review per 6.4, filled for the build state, listing every flag the build reads | Given the notes, Then they explain 2 free letters then Plus at Keep, every never-gated action, letters always open, how to reach the gate, the 18+ answer, and each F19 key | Not built (step 8 draft describes the second book and 3 Read together sessions as Plus) | M1, M2, 2.3.1(a), BL-341 |
| F21-REQ-007 | P0 | App Privacy answers match the build state and the manifest | Given the v1.0 build (server features on, M14), Then the label declares what the server holds (account, letters, encrypted recordings, the D-080 status facts per F14 Q-C9) plus opt-in analytics types (per Q-005), as counsel answers; the manifest's collected types match. A kill-path build declares only opt-in analytics types | Partly built: `docs/legal/app-store-privacy-labels.md` 1.3.0 describes a signed-in app, without backup or the status report; manifest `NSPrivacyCollectedDataTypes` is empty (`apps/mobile/app.config.ts`) | LEGAL-REQ-042, -043 |
| F21-REQ-008 | P0 | Screenshots from the release build with the fictional family "Asha" | Given the 6 frames, Then each is captured from the release build's web preview by `scripts/brand/screenshots.mts`; frame 3 may show a co-parent letter (v1.0, M14) but never implies the other parent's voice plays on this phone (D-073) | Partly built (script and captions exist; BL-340 blocked; caption 3 shows "A letter from Mama") | BL-340, B1 |
| F21-REQ-009 | P0 | Field limits | Given `store.en.ts`, Then name 30, subtitle 30, promotional 170, keywords 100 with no word from name or subtitle, captions 40 | Built (`store.en.ts` header, rules test) | ASC limits |
| F21-REQ-010 | P0 | Export compliance answered | Given ASC, Then the answer matches COUNSEL_PACKET Q24 | Not built | Q24 **[Counsel]** |
| F21-REQ-011 | P0 | earlyletters.app redirects to earlyletters.com | Given `https://earlyletters.app/`, Then 308 to `https://earlyletters.com/` | Built (verified 13 Oct) | B11 |
| F21-REQ-012 | P0 | Legal pages live and final at submission | Given /terms, /privacy, /health-privacy, /subprocessors, Then each returns 200, shows a version and effective date, and contains no "Drafting notice", no "being finalised", no `{PLACEHOLDER}` and no "Appendix A. Notes for counsel" | Partly built: all 4 return 200; each shows the banner and drafting notice; /privacy body says 1.1.0 | 5.1.1(i) (R4 section 5), Q31 |
| F21-REQ-013 | P0 | Legal pages describe the submitted build | Given the v1.0 build (server features on, M14), Then the Privacy Policy, Terms, Subscription Terms and subprocessor page describe the account, sync, co-parent sharing, the owner's encrypted recording backup and the status report with reminder emails, and name Supabase, Resend, the pack host and PostHog | Not built: drafts on `origin/docs/web-legal-v1` (version 2.0.0, unmerged) describe the on-device v1.0 that M14 reverses | LEGAL-REQ-041 **[Counsel]** |
| F21-REQ-014 | P0 | /delete-account matches the build | Given the v1.0 build (server features on, M14), Then the page describes in-app account deletion exactly as F17 builds it and the email route for mailing-list and support data. A kill-path build explains deleting letters and books in the app, "Erase everything" if built, and no account undo text | Partly built: live page describes account deletion with a 30-day undo and Sign in with Apple | D-042, 5.1.1(v) |
| F21-REQ-015 | P0 | Website prices come from `packages/content/src/pricing.ts` | Given the built site, Then the pricing scene shows `$4.99 a month` and `$49.99 a year` with their trial wording, and no other price string exists in `apps/web/src` | Not built (hardcoded $3.99 and $29.99 in `apps/web/src/content/site.ts` on main) | D-075, D-082 |
| F21-REQ-016 | P0 | Website claims match 6.5 | Given the site copy, Then 0 claims marked "Does not hold" | Not built | 2.3.1, LEGAL-REQ-044 |
| F21-REQ-017 | P0 | No real family details on the website | Given `apps/web/**`, Then the hashed-name guard (`packages/content/test/no-real-family-data.test.ts` logic) finds 0 matches, and the sample letter uses the fictional family | Not built: the sample child name on the live site and in `apps/web/src/content/site.ts` matches a hash in the guard's name list; the guard is not on main | CLAUDE.md, `_AUTHORING.md` 7 |
| F21-REQ-018 | P0 | The trust promise is word for word on the website | Given the private scene, Then it contains `en.trust.promise` exactly | Partly built: live wording differs | D-061 |
| F21-REQ-019 | P0 | Website copy runs the same overclaim rules as `packages/content` | Given `apps/web/test/copy-rules.test.ts`, Then it also checks beta, kids, v1.1 features, backup, prices and the trust promise | Partly built (characters, fear, machine-writing, gender only) | LEGAL-REQ-044, -045 |
| F21-REQ-020 | P0 | Prelaunch form: one email at launch, one-click unsubscribe, rate-limited, works without JavaScript | Given the Playwright suite, Then each passes | Built on main (`apps/web/src/lib/notify/`, `apps/web/test/notify.test.ts`, `unsubscribe.test.ts`) | LEGAL-REQ-053 |
| F21-REQ-021 | P0 | App Store badge only with an official App Store URL | Given a TestFlight or look-alike link, Then prelaunch mode stays | Built (`apps/web/src/lib/launch.ts`, `test/launch.test.ts`) | 2.2 |
| F21-REQ-022 | P0 | Website analytics off unless set; if on, cookieless, DNT and GPC respected, allowlisted events only, disclosed in the Privacy Policy and subprocessors **[Counsel]** | Given the live home, Then no analytics script loads while `NEXT_PUBLIC_ANALYTICS` is unset | Built (`apps/web/src/lib/analytics/`; live home loaded no analytics script on 13 Oct) | B9 |
| F21-REQ-023 | P1 | `/.well-known/security.txt` served | Given the site, Then 200 with contact and an `Expires` before 2027-09-30 | Not built live (404 on 13 Oct; file in `docs/ops/well-known/`) | DOMAINS.md 8 |
| F21-REQ-024 | P0 | AASA, `/j` and `/auth/confirm` **[server]** | Given a server-on build, Then the AASA file lists the app's paths and both pages exist with no analytics | Not built live (AASA 404; route exists in `apps/web/src/app/.well-known/apple-app-site-association/route.ts` on main) | F11-REQ-005, F02 |
| F21-REQ-025 | P0 | WCAG 2.2 AA on the website and legal pages | Given axe in CI, Then 0 critical violations on home, 4 legal pages and /delete-account | Partly built: Playwright suite on main (176 tests per commit 14ec2f7); axe coverage Unverified | LEGAL-REQ-051 |
| F21-REQ-026 | P1 | Footer reads "(c) 2026 Early Letters" with the name from `brand.name` | Given the footer, Then the line exists in ASCII | Not built (live footer has no copyright line) | D-078 |
| F21-REQ-027 | P0 | Website source is on the release line | Given `origin/develop`, Then `apps/web` exists (today only on main) or the coordinator records which branch deploys the site | Not built | Repo hygiene |
| F21-REQ-028 | P0 | A v1.0 claims list with counsel approval exists before submission | Given 6.5 moved to `docs/legal/claims-v1.md` (new), Then each row has a counsel tick | Not built | LEGAL-REQ-044, Q17 |
| F21-REQ-029 | P1 | Consumer Health Data policy linked from website footer, App Store description and Settings (Q3 default) | Given each place, Then a link to /health-privacy | Partly built: website footer and Settings > Privacy link it; listing does not | Q3 **[Counsel]** |

## 8. Data, privacy and security

| Data | Level | Where | Who reads | Retention | Never |
|---|---|---|---|---|---|
| Prelaunch email addresses | L3 | Resend | Founder | Until unsubscribe; one launch email | Shared, sold, used for app messages |
| Website analytics (if turned on) | Aggregate, allowlisted enums | Vercel | Founder | Vercel's | Personal data, free text |
| Listing and legal text | Public | ASC, Vercel, repo | Anyone | Versioned in git | Real family details |
| Review demo data | Fictional "Asha" | TestFlight build | App Review | n/a | Real letters |

- The website sets no cookie for analytics and loads no third-party script on `/j` or `/auth/` paths (`docs/ops/DOMAINS.md` 5).
- The subprocessor page lists every processor the submitted build and site use: Apple, Vercel, Resend, the mail forwarder, PostHog (opt-in), the pack host and mirrors (F19), and Supabase (server features are on for v1.0, M14; drop it only for a kill-path build).

## 9. Non-functional requirements

| Item | Budget | Source |
|---|---|---|
| Website LCP on mobile | 2.5 s or less [A: no measurement in repo] | 06-nfr.md |
| Legal pages | Static at build, no runtime file reads (`dynamic = 'error'`) | `apps/web/src/app/(legal)/privacy/page.tsx` |
| Accessibility | WCAG 2.2 AA; reduced motion honoured by scroll scenes | LEGAL-REQ-051 |
| Listing assets | 1320 x 2868 and 1242 x 2688 PNG, no alpha | `docs/store/app-store.md` |

Shared budgets: `06-nfr.md`.

## 10. Analytics

| Source | Events | Question |
|---|---|---|
| ASC App Analytics | Impressions, product page views, installs, conversion, campaign tokens from `launch.ts` placements | Does the listing convert, and which website placement sends installs? |
| Website (only if `NEXT_PUBLIC_ANALYTICS=vercel`) | `cta_click {mode, placement}`, `notify_submit {result}`, `scene_reached {id}` (`apps/web/src/lib/analytics/events.ts`) | Where do visitors stop on the page? |
| App | None for F21 | n/a |

## 11. How we build it (with the architect)

- **Listing.** `packages/content/src/store.en.ts` holds every field; `scripts/brand/store-listing.ts` writes `docs/store/app-store.md`; the rules test fails on drift. Add a build-state claim set and a `SHIPPING_LANGUAGES` constant in `packages/content` (new), both read by the test.
- **Website.** Next.js on Vercel, `apps/web` on main. Prices import `plusPriceLine` from `@scribe/content` instead of literals; the sample letter moves to the fictional family; the copy test gains the overclaim rules; legal Markdown from the counsel-approved set. Reconcile branches: `integration/develop-plus-main` exists; the coordinator decides.
- **Legal pages.** Markdown in `docs/legal/`, rendered at build; `status: final` removes banners. Counsel signs the versions that match the build state set by M14 (server features on); legal pages are live before sign-in (M14).
- **Label.** The label for the server-on v1.0 (1.3.0 describes a signed-in app; add backup and the status report), a server-off section only if the kill path is used, and the manifest's collected types filled to match when a PostHog key is present (F18 WP-F18-08).
- **Riskiest unknown.** That App Review accepts the subscription as ongoing value across devices (3.1.2(a)). With sync in v1.0 (M14) letters reach every signed-in device, which answers the cross-device part; a kill-path build has no sync. Mitigation: the 6.4 notes; a reply ready within a day.

## 12. Work packages

Only for what is missing or partly built.

| WP | Scope | Owner | Owns files or folders | Depends on | Done when | Mode |
|---|---|---|---|---|---|---|
| WP-F21-01 | Build-state claim set, `SHIPPING_LANGUAGES`, subtitle guard | Content | `packages/content/src/store.en.ts`, new `packages/content/src/claims.ts`, `test/rules.test.ts` | M14, FT-34 | `[F21-REQ-002]`, `[F21-REQ-003]`, `[F21-REQ-004]` | Agent |
| WP-F21-02 | Listing copy for the chosen build state; regenerate `docs/store/app-store.md` | Content | `store.en.ts`, `docs/store/app-store.md` | WP-F21-01 | `[F21-REQ-003]`; rules test green | Agent |
| WP-F21-03 | Notes for Review | QA, content | `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` step 8, new `docs/store/review-notes.md` | F19 6.5 | `[F21-REQ-006]` | Agent |
| WP-F21-04 | Screenshots from the release build | Content, founder | `scripts/brand/screenshots.mts` captions in `store.en.ts` | Release build | `[F21-REQ-008]` | Pair |
| WP-F21-05 | Website prices from `pricing.ts`, claims fixed, trust promise word for word | Web | `apps/web/src/content/site.ts` (main) | none | `[F21-REQ-015]`, `[F21-REQ-016]`, `[F21-REQ-018]` | Agent |
| WP-F21-06 | Fictional sample family on the website and the guard over `apps/web` | Web | `apps/web/src/content/site.ts`, scenes that import it, guard test | Founder Q2 | `[F21-REQ-017]` | Agent |
| WP-F21-07 | Website copy test extended | Web | `apps/web/test/copy-rules.test.ts` | WP-F21-01 | `[F21-REQ-019]`, `[LEGAL-REQ-045]` | Agent |
| WP-F21-08 | Legal pages for the build state; /delete-account rewrite | Legal lane, counsel | `docs/legal/*.md`, `apps/web/src/lib/legal/delete-account-copy.ts` | M14, counsel 29 Oct | `[F21-REQ-012]`, `[F21-REQ-013]`, `[F21-REQ-014]` | Agent then counsel |
| WP-F21-09 | Privacy label for the build state and manifest | Legal lane, mobile | `docs/legal/app-store-privacy-labels.md`, `apps/mobile/app.config.ts` | F18 WP-F18-08 | `[F21-REQ-007]` | Pair |
| WP-F21-10 | security.txt, footer line, axe in CI | Web | `apps/web/src/app/.well-known/`, footer component, CI config | none | `[F21-REQ-023]`, `[F21-REQ-026]`, `[F21-REQ-025]` | Agent |
| WP-F21-11 | Claims list with counsel ticks | Legal lane | `docs/legal/claims-v1.md` (new) | WP-F21-02, WP-F21-05 | `[F21-REQ-028]` | Agent then counsel |
| WP-F21-12 | ASC entry: fields, rating, availability, subscriptions, export compliance, privacy answers | Founder | App Store Connect | All above | `[F21-REQ-005]`, `[F21-REQ-010]` | Human |
| WP-F21-13 | Branch reconciliation for `apps/web` | Coordinator | Repo | none | `[F21-REQ-027]` | Human |

## 13. Open questions and assumptions

| Q | Who, by when | What changes |
|---|---|---|
| Q1 Which build state is submitted (F18 Q1)? **Answered by M14 (founder, 13 Oct 2026): server features on** | Founder (decided) | Listing, notes, label, legal pages, /delete-account follow the on state |
| Q2 The website's sample letter uses a child name that the repo's real-family guard lists; `site.ts` says it was the founder's choice. CLAUDE.md and `_AUTHORING.md` 7 say real family details never appear. Keep or switch to "Asha"? Default [R]: switch | Founder; 16 Oct | WP-F21-06 |
| Q3 Does a subscription in a server-off app meet 3.1.2(a) "work across the user's devices"? Mostly moot after M14 (v1.0 syncs); still relevant if the kill path is used. Default: yes, the entitlement works on every device of the Apple Account; notes say so | Founder; before submission | Notes |
| Q4 Linked or Not linked for usage (Q-005) **[Counsel]** | Counsel; 29 Oct (default Linked) | Label |
| Q5 Consumer Health Data policy link in the App Store description (Q3 default yes) **[Counsel]** | Counsel; 23 Oct | Description length |
| Q6 Trademark clearance (Q10) **[Counsel]** | Counsel; 23 Oct | Name |
| Q7 Does Vercel Web Analytics, cookieless, need consent or only disclosure? **[Counsel]** | Counsel; before turning it on | F21-REQ-022 |

| A | Assumption | How we validate |
|---|---|---|
| A1 | Letters and recordings sit in the iPhone backup (only packs are excluded) | Device restore test (DEVICE_TEST_PLAN) |
| A2 | Lifestyle plus journal wording lowers 5.1.1(ix) risk | Review outcome |

## 14. Sources

- Brief and rulebook: `docs/agents/BRIEF-2026-10-03.md` items 9 to 11, 13, 14; `_AUTHORING.md` 3 (B1, B8, B9, B11, B12), 3b (M1 to M3, M13), 7.
- Decisions: D-004, D-030, D-042, D-060, D-061, D-063, D-072, D-075 to D-078 in `docs/DECISIONS.md` on develop; D-082, D-083, D-085 as carried in `packages/content/src/pricing.ts` and `packages/content/test/rules.test.ts`; commit c1764f9.
- Listing: `packages/content/src/store.en.ts`; `docs/store/app-store.md`; `packages/brand/index.ts`; `scripts/brand/`; `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` steps 1 to 8; `docs/FOUNDER_TASKS.md` FT-43; `docs/BACKLOG.md` BL-118, BL-286, BL-340, BL-341.
- Website: `origin/main` `apps/web/` (`src/content/site.ts`, `src/lib/launch.ts`, `src/lib/legal/`, `src/lib/analytics/`, `src/lib/notify/`, `test/`); `origin/docs/web-legal-v1`; live earlyletters.com, /privacy, /terms, /health-privacy, /subprocessors, /delete-account, /robots.txt, /sitemap.xml, /.well-known/*, earlyletters.app, fetched 13 Oct 2026.
- Legal: `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-041 to -045, -051, -052, -053; `docs/legal/app-store-privacy-labels.md` 1.3.0; `docs/legal/privacy-policy.md`; `docs/legal/COUNSEL_PACKET.md` Q1, Q3, Q7, Q10, Q17, Q24, Q31; `packages/content/VOICE.md` "How we talk about privacy".
- Ops: `docs/ops/DOMAINS.md` sections 4, 5, 8, 9; `docs/ROADMAP.md` 2.1 sections 0, 2, 5, 6, 10.
- Research: R1 F21 (R1-S1 to R1-S12, R1-S20, R1-S48, R1-S49, R1-S67); R4 sections 5 and 10 (R4-S55, C6).
- Siblings: F11-REQ-005, F14 6.7, F18 Q1 and Q6, F19 6.5 and F19-REQ-024, F20 S-7.
