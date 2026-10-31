# F21 App Store listing, website and legal pages

| | |
|---|---|
| Release | v1.0 gate |
| Priority and rank | P0, rank 21 (`05-feature-map.md` section 2) |
| Personas | P1 Evening parent and P3 Expecting parent (finding us), P4 Multilingual family; App Review and counsel as readers |
| Existing IDs | LEGAL-REQ-041 to LEGAL-REQ-045, LEGAL-REQ-051, LEGAL-REQ-052, LEGAL-REQ-058, K-13, K-32, D-004, D-030, D-042, D-060, D-061, D-063, D-072, D-075 to D-078, D-082, D-083, DR-08, DR-11, BL-100, BL-118, BL-286, BL-340, BL-341, BL-349; COUNSEL_PACKET Q1, Q3, Q7, Q10, Q17, Q24, Q31 |
| Depends on | F14 (membership facts for review notes), F17 (in-app legal rows), F18 (privacy label inputs), F19 (flag list for review notes; pack host for the subprocessor page), F20 (support address, `/delete-account` route), `packages/brand`, `packages/content` (`store.en.ts`, `pricing.ts`, `site.en.ts`), the website app (`apps/web`, on `origin/main` only) |
| Status | Draft V2, 13 Oct 2026. Code checked on `docs/prd-v2` rebased on `origin/develop` at 6482cd3, `origin/main` at f30084d, and the live site on 13 Oct. Revised 14 Oct 2026 after critique round 1: every public claim that is false today, with its fix and owner (6.6); the listing and notes checked against M1 to M17 (6.7); dates as milestones (disposition in `reviews/DISPOSITION-C.md`) |

> **Not legal advice.** Items marked **[Counsel]** wait on a licensed attorney.

> **Build state.** Server features are on for v1.0 (M14, founder, 13 Oct 2026), reversing commit c1764f9: account, sync, co-parent and the owner's encrypted recording backup ship. On 13 Oct every build profile still sets `EXPO_PUBLIC_SERVER_FEATURES` to `off` (`apps/mobile/eas.json`) until the release profiles flip. The listing on develop (`packages/content/src/store.en.ts`) describes co-parent invites (now true for v1.0), says the original recording stays "on your phone and in your iPhone's own backup" with a source comment citing D-085 for no backup of our own (out of date once backup ships), and says "the book holds both your voices" (read as family listening, which is v1.1), and the live website describes backup and family writing (`reviews/STALE-OUTSIDE-PRD.md`). App Review 2.3.1 forbids promoting what the app lacks (R1-S49). This spec requires the listing, review notes, privacy label and website to describe the build being submitted: server features on, unless the founder uses the kill path.

## 1. Why

- [D] earlyletters.com is primary and earlyletters.app redirects to it; legal pages are /terms, /privacy, /health-privacy and /subprocessors; universal links use earlyletters.com (B11, D-063). The website shows the Plus price (D-075), now $4.99 a month with a 1-month free trial and $49.99 a year with a 2-month free trial (D-082, M3; `packages/content/src/pricing.ts`).
- [D] The listing never says beta (B8, D-060). Membership: the first 2 letters kept are free; after that, Keep needs Plus; capturing, typing, reviewing, reading, playing, exporting, deleting and restoring are never gated; letters already made always stay readable, playable and exportable (M1, M2).
- [F] "Voice memory book" is taken: FirstChapter lists "Voice Memory Book for Newborns" and Tiny Treasures "Baby memory book you can hear" (R1 F21, R1-S4, R1-S67). Baby memory apps cluster in Lifestyle (9 of 11 in R1 F21).
- [F] Apps outside the Kids Category may not use "For Kids", "For Children" or child-targeting language in name, subtitle, icon, screenshots or description (5.1.4, R4 section 5, R4-S55). Every feature must be described in the review notes, and remote flags may only switch reviewed features (2.5.19, 2.3.1(a)). Auto-renewing subscriptions must give ongoing value and work across the person's devices (3.1.2(a)).
- [F] An individual publishing an app that "requires sensitive user information" risks 5.1.1(ix) (R4 C6, D-004, DR-11). The mitigation is a Lifestyle listing with no health language and review notes that describe a family memory journal (ROADMAP 2.1 section 10).
- [F] The live site on 13 Oct serves drafts: each legal page carries a "This document is being finalised" banner and the AI drafting notice, and /privacy's body says version 1.1.0 while `docs/legal/privacy-policy.md` on main says 1.4.0 in its front matter (fetched 13 Oct). The home page states $3.99 and $29.99, recording backup, "Read together after the free sessions" and "the whole family adding letters" (`apps/web/src/content/site.ts` line 201 on main). Each conflicts with D-082, D-083, the v1.0 no-backup rule in `rules.test.ts`, or B1.
- [F] The claims registry `docs/legal/claims-registry.yaml` named by LEGAL-REQ-044 and VOICE.md does not exist; BL-118 defers it to v1.1. The content rules test blocks known overclaims in `packages/content` only (`packages/content/test/rules.test.ts`, "brand name and v1.0 claims").

## 2. Who

| Who | Moment | What they hold | What F21 must do |
|---|---|---|---|
| P1, P3 searching the App Store | A late feed, a search for "baby journal" | A thumb, 3 seconds per result | Name, subtitle and first 3 screenshots say: talk, kept exactly, your voice |
| P4 Multilingual family | Reading the description | A language question | The seven languages named only if each ships |
| A parent checking privacy | Before download, or after | The privacy label, /privacy | A label with no tracking section, a plain policy that matches the app |
| App Review | Reviewing the v1.0 submission (the week of Mon 3 May 2027, M15; T36 in `08-delivery.md` section 2.1) | Review notes, a demo account, a build | Membership explained, every flag listed, how to reach the Keep gate, sign-in, backup and the co-parent path, no hidden features |
| Counsel | Signing off before submission (FT-41) | Drafts | One set of final documents that match the build |

## 3. What we are solving

**Outcome:** every public word about Early Letters (listing, website, legal pages, review notes, privacy label) matches the build Apple reviews, and nothing in them overclaims.

| Metric | Target | How measured | Consent caveat |
|---|---|---|---|
| App Review rejections for metadata, 2.3.1 or 5.1.1 | 0 | Resolution Center | None |
| Claims in listing or website that the submitted build cannot keep | 0 | Claims check per release (F21-REQ-028) | None |
| Live public claims that are false (6.6) | 0, starting with a website hotfix this week, not at launch (R4 PT-04) | 6.6 table re-checked against the live site each week until launch | None |
| Legal pages live with a drafting notice or a placeholder at submission | 0 | Fetch each page; grep for "Drafting notice", `{`, "being finalised" | None |
| Search-to-install conversion | Watch only | ASC App Analytics | None (Apple data) |
| Website pages failing WCAG 2.2 AA critical checks | 0 | axe in CI (LEGAL-REQ-051) | None |

## 4. Scope

**In v1.0**
- App Store Connect: name, subtitle, promotional text, keywords, description, What's New, 6 screenshots in 2 sizes, Lifestyle category, age rating overridden to 18+, United States only, support and marketing URLs, privacy policy URL, App Privacy answers, both subscriptions attached, export compliance, review notes and how a reviewer passes the 18+ gate.
- earlyletters.com: one page in prelaunch mode until the App Store link exists, then the App Store badge (`apps/web/src/lib/launch.ts`); the legal pages; /delete-account; `/.well-known/security.txt`; earlyletters.app redirecting.
- Legal pages rendered at build time from `docs/legal/*.md` (`apps/web/src/lib/legal/load.ts`), final versions after counsel sign-off (FT-41; date in `08-delivery.md` section 2.1).
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

**A. Listing (FT-43; date in `08-delivery.md` section 2.1).**
1. Content regenerates `docs/store/app-store.md` from `store.en.ts` for the build state set by M14 (server features on), and the rules test passes.
2. The founder enters the fields in ASC, uploads screenshots rendered from the release build with the fictional family "Asha" (BL-340), sets Lifestyle, overrides the age rating to 18+, sets availability to the United States only, attaches `plus.monthly` and `plus.annual`, and pastes the review notes (6.4).
3. The founder enters App Privacy answers from the label for that build state (6.6) and checks them against the archived `.ipa` manifest (LEGAL-REQ-042, -043).

**B. Website at launch.**
1. After counsel sign-off (FT-41), legal Markdown moves to `status: final` with version and effective date; the site rebuilds; banners and drafting notices disappear because `isFinalStatus` is true (`apps/web/src/lib/legal/render.ts`).
2. On approval, the founder sets `NEXT_PUBLIC_APP_STORE_URL` in Vercel and redeploys; the email form becomes the App Store badge (`launch.ts`).
3. One email goes to the prelaunch list (`apps/web/src/lib/notify/`), with one-click unsubscribe.

### 6.3 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F21-U01 | A language misses its gate in week 2 (ROADMAP cut) | Remove it from the description, keywords and screenshots before submission; the rules test today requires all 7 names | Listing names only shipping languages | Next release adds it | Rules test reads a shipping-languages list (F21-REQ-006) |
| F21-U02 | The founder uses the kill path and submits with server features off (M14 keeps the switch) | Listing, What's New, screenshot 3 and the trust lines drop co-parent and "people you invite" claims; label drops account data | Accurate listing | n/a | F21-REQ-005 |
| F21-U03 | Counsel has not signed off before the submission week | Submission moves (ROADMAP 2.1 risk 5); drafts are never published as final | n/a | Founder decides the date | n/a |
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
| F21-U15 | Someone emails asking to delete their data | F20 S-7 (the deletion runbook; v1.0 holds accounts, M14) | A human reply | n/a | F20 |
| F21-U16 | Trademark conflict found for "Early Letters" (Q10) | Rename before launch is cheap; the name lives only in `packages/brand` (D-076) | n/a | Counsel | n/a |
| F21-U17 | Listing and website drift from the app copy | Trust promise must match `en.trust.promise` word for word (D-061) | Same words everywhere | n/a | Rules test extended to `apps/web` |

### 6.4 Notes for Review (draft, replaces `APP_STORE_CONNECT_SUBSCRIPTIONS.md` step 8 and F14 6.7)

Plain text for App Store Connect. Values in braces come from the build.

> Early Letters is a family memory journal for adults. A parent speaks or types a short letter to their child; it is written down on the phone and kept with the parent's own recording, filed by the child's month of age.
>
> To start: answer "Yes, 18 or older", create a book (a name is enough), then record or type a letter and save it. A demo account is provided below for sign-in, sync, the co-parent path and backup.
>
> Plus membership: the first 2 letters a parent keeps are free, counted once their words are on screen (a recording still waiting for its words does not count; the other parent's letters never count). To keep a third letter, the save step shows Apple's own subscription view (StoreKit) with Plus Monthly ($4.99, 1-month free trial) and Plus Annual ($49.99, 2-month free trial). Nothing else ever needs Plus: recording, typing, reviewing, reading, playing recordings, Read together, starting more books, exporting everything and deleting are free. A letter waiting at that step stays on the phone, syncs privately for a signed-in parent, and is included in Export everything. Every letter a parent keeps stays theirs to read, play and export, with or without Plus. Settings > Plan has Restore purchases, Manage subscription, Request a refund and Redeem a code, all Apple's sheets. Family Sharing is on.
>
> Ongoing value: each month the family keeps adding letters to a book that grows by month. Plus works on every device signed in to the purchaser's Apple Account. With an account, letters sync to the family's book on every signed-in device, and one co-parent (at most two parents per book) can write in it.
>
> Accounts: Sign in with Apple, Sign in with Google or an email link, offered after the first letter; nothing needs an account to start. Recordings: an optional encrypted backup of the parent's own recordings; we hold a recovery key under strict, logged access so a parent can restore on a new phone, and we never read, sell or use recordings to train models. With an account, the app reports subscription status only (plan, trial end, renewal date, cancelled) so we can email the California renewal reminders; no receipts or payment details. Speech is written down on the device; no recording or letter is sent to any AI service. Usage analytics are off unless the person says yes to a later question. [Drafted for a build with `EXPO_PUBLIC_ANALYTICS` on; while it is off, as on `develop` (PR #118, F18 Q9), the notes say the build collects no usage analytics.]
>
> Demo account: {reviewer email} receives a 6-digit sign-in code at {reviewer inbox instructions}; it opens a pre-seeded two-parent book for the fictional child Asha, with backup on (R4 PT-35).
>
> Remote settings: the app reads a signed configuration that can only: pause downloads of language packs {and sync and invites, server-on}, switch between the reviewed wording variants {list from F19 6.5}, show a gentle update card, and raise the number of free letters. It cannot turn on any feature not in this build.
>
> Language packs for {languages} download when a parent picks that language. They are data (word lists and speech model weights), not code.

Rules: the notes name every flag the build reads (F19-REQ-024); they never say "beta"; they describe a journal, never a health or tracking service (D-004); every sentence in them is a row in the claims list (6.5) with counsel's tick (F21-REQ-028). A kill-path build (server features off) replaces the Accounts, sync and backup sentences with "Letters stay on the phone that made them in this version; there is no sign-in."

### 6.5 Claims list for v1.0 (until `claims-registry.yaml` exists)

| Claim | Where | Fact behind it | Status for v1.0 (server features on, M14) |
|---|---|---|---|
| "Your letters and recordings are private. We never sell them, never use them for ads and never use them to train machine learning models." (`en.trust.promise`) | App, listing, website | LEGAL-REQ-016; no ad SDK; on-device transcription | Holds; website uses different words today (D-061 asks word for word) **[Counsel]** Q17 |
| "Only you and the people you invite can read your book" (`store.en.ts`) and "Only you and the people you invite can read your letters" (`trust.signIn.privacy`) | Listing "Private by default"; sign-in screen | Invites; but letter text is not end-to-end encrypted and backup has a recovery key we hold (M16) | Does not hold as an absolute (R4 PT-25). Replace with "Your book is shared only with the co-parent you invite. We don't read it." **[Counsel]** |
| "Invite your co-parent to the same book" | Listing "Write it together", What's New | F11 | Holds once the release profiles turn server features on (M14); does not hold in a kill-path build |
| "The original recording stays with each letter, on your phone and in your iPhone's own backup if you use one" | Listing | D-033; Application Support excluded only for packs | Holds if letters and audio are in the iPhone backup [U: confirm on device] |
| "Backs up every recording" | Website pricing (live; see 6.6 row 2) | No backup of our own in v1.0: `store.en.ts` header and `rules.test.ts` say backup needs sign-in and a server and cite "D-085", while commit 6482cd3 and `_AUTHORING.md` M11 use D-085 for Recently deleted; M7 (D-073) and M14 say backup ships in v1.0 | Holds only once the owner backup is built and turned on (not built 13 Oct, F08); "every" overclaims if backup is opt-in (F08 Q2 default) [R]: reword with counsel |
| "Opens Read together after the free sessions" | Website pricing (live) | D-083: Read together is free, no sessions | Does not hold |
| "With the whole family adding letters" | Website pricing (live) | B1: co-parent only; contributors v1.1 | Does not hold |
| "$3.99 a month ... $29.99 a year" | Website (live) | D-082: $4.99 and $49.99 | Does not hold |
| "Your first two letters are free" | App, listing, website | M1, D-082 | Holds |
| "Every letter you keep stays yours to read, play and export, with or without Plus" | Listing, app | M1 | Holds |
| "Export your memory book any time, for free" | Listing | F15, never gated | Holds |
| "We never rewrite your words" | App, listing, website | Constitution, `verifyEdits` | Holds |
| "Speak your letters in English, Hindi, Spanish, Mandarin Chinese, French, Arabic or Portuguese" | Listing, website | B4; per-language gates (DR-01) | Misleading for a record-and-type language (R3 DX-27). Split it: "Your words written down in {passed languages}. Record in any of them." A language without a passed gate is never named next to "written down" or "transcribed" (F21-REQ-032) |
| "Transcription runs on your phone by default" | Website (live) | On-device only at v1.0 | Holds; "by default" implies another mode exists, which v1.0 lacks [R]: drop "by default" |
| "{app} uses the microphone to record the letters you speak to your child. Your recordings stay on this phone." (`permissions.en.ts`) | iOS permission prompt, every user | Backup uploads ciphertext when the owner turns it on (M7, M14) | Second sentence does not hold for backup users; delete it (F04-REQ-047) |
| "Your voice stays here" and "the recording stays with your letter" (`trust.firstRecording.*`) | App, first recording | As above | Title does not hold for backup users; reword with counsel, for example "Your voice, kept as you made it" **[Counsel]** |
| "We never imitate your voice" (`trust.voice`) | App, listing | No voice synthesis in the product | Holds |
| The staff-access line in Settings > Privacy (`settings.privacy.staffAccess`, F17) | App | Dashboard reads are not logged today (R4 PT-03) | Does not hold until F17's database audit lands; F17 owns the replacement |
| "This letter is safe on your phone" (`keepGate.heldNote`, F14) | App, Keep sheet | Held letters are drafts; with this revision they are exported (F15-REQ-018) but not synced or backed up | F14 owns it; R4 PT-13 proposes "This letter is waiting on this phone." |
| Backup sheet lines (`backup.*`, F08) | App | M16 | Must say: encrypted on this phone; we keep a recovery key under strict, logged access so you can restore on a new phone; never read, sold or used to train models. Never "only your family's keys" (M16) |
| "Nothing is sent to an AI service" | Notes for Review (6.4) | On-device transcription; no AI endpoint in v1.0 (F05-REQ-038) | Holds |

### 6.6 Public claims that are false today, with the fix and the owner

Every row is a sentence a parent, App Review or counsel can read today, or one that ships unchanged at submission. "Live" means on earlyletters.com when `reviews/STALE-OUTSIDE-PRD.md` and section 1 above were checked (13 Oct 2026, page fetch); this revision did not re-fetch the site (no web access on 14 Oct). "Repo" means in the repo and published as written unless fixed. Owner lanes follow STALE and `08-delivery.md` section 3.3. Sources: STALE rows 1 to 7, R4 PT-01, PT-03, PT-04, PT-13, PT-24, PT-25, R3 DX-27, and the claims list in 6.5.

| # | Where | What it says today | Why it is false | Fix | Owner | By |
|---|---|---|---|---|---|---|
| 1 | Live: home page pricing scene (`apps/web/src/content/site.ts` on `main`) | "$3.99 a month with a 1-month free trial, or $29.99 a year with a 2-month free trial" | Prices are $4.99 and $49.99 (D-082, M3) | Import `plusPriceLine` from `packages/content/src/pricing.ts` (F21-REQ-015) | Web | Hotfix this week (WP-F21-14) |
| 2 | Live: same scene | Plus "backs up every recording" | Backup is not built (F08 section 12), is opt-in, and is not a Plus feature until F08 Q2 says so; M16 sets its wording | Remove now; after WP-F08-B6 passes, a counsel-approved line per M16 | Web; content | Hotfix this week |
| 3 | Live: same scene | Plus "opens Read together after the free sessions" | Read together is free with no sessions (M2, D-083) | Remove | Web | Hotfix this week |
| 4 | Live: same scene | Plus "covers every child's book" | Every book is free (M2); Plus is keeping letters after the first 2 (M1) | Replace with the M1 line: "Plus lets you keep adding letters after your first two." | Web; content | Hotfix this week |
| 5 | Live: same scene | "with the whole family adding letters" | Family at v1.0 is one co-parent (B1, M8) | "with your co-parent" | Web | Hotfix this week |
| 6 | Live: sample letter on the home page | A child name that matches a hash in the real-family guard (F21-REQ-017) | Real family details never appear (CLAUDE.md) | The fictional child Asha; add the guard to `main` | Web; founder (Q2) | Hotfix this week |
| 7 | Live: private scene | Trust wording that differs from `en.trust.promise` | D-061 asks for the same words everywhere | Use `en.trust.promise` word for word (F21-REQ-018), as revised by counsel | Web | With the hotfix |
| 8 | Live: home page | "Transcription runs on your phone by default" | v1.0 has no other mode | Drop "by default" | Web | With the hotfix |
| 9 | Live and repo: home page; `store.en.ts` description | "Speak your letters in English, Hindi, Spanish, Mandarin Chinese, French, Arabic or Portuguese" | Arabic, and Hindi until its gate passes, are record and type (DR-01 A); "speak your letters" reads as "written down" (R3 DX-27) | Split per F21-REQ-032 after FT-34 | Content; web | Before submission |
| 10 | Live: /terms, /privacy, /health-privacy, /subprocessors | Drafting banner and AI drafting notice; /privacy body says version 1.1.0 while the repo says 1.4.0 | Drafts presented as the policy | Final, counsel-approved versions for the M14 build (F21-REQ-012, -013) | Legal lane; counsel | Before the first outside family signs in (R4 PT-31) |
| 11 | Repo: `docs/legal/privacy-policy.md` (lines 23, 188, 249 per R4 PT-01) | "We do not upload, back up or transcribe recordings on our servers"; "never on our servers"; CCPA table "Audio: None" | Backup uploads ciphertext with a recovery key we hold (D-073, M14, M16) | Describe opt-in encrypted backup, the recovery key and who can use it; declare audio | Legal lane; counsel | M14 counsel delta (FT-33) |
| 12 | Repo: `docs/legal/terms-of-service.md` 6.2 and 12.4 (R4 PT-01) | "Your recordings stay on your phone, so we cannot listen to them" | As row 11 | Delete the clause; describe backup | Legal lane; counsel | M14 counsel delta |
| 13 | Repo: `docs/legal/consumer-health-data-notice.md` section 3 (R4 PT-01) | Recordings never leave the phone | As row 11 | Same rewrite | Legal lane; counsel | M14 counsel delta |
| 14 | Repo, shown by iOS to every user: `packages/content/src/permissions.en.ts`, `apps/mobile/src/lib/permission-copy.ts` | "Your recordings stay on this phone." | False for anyone who turns on backup | Delete the sentence (F04-REQ-047) | Content; mobile | Before the first build with backup |
| 15 | Repo: `docs/legal/subscription-terms.md` 1.4.0 (STALE row 4) | $3.99 and $29.99; Plus adds Read together after free sessions and books for more children; "We do not email you about Plus" | M1, M2, M3; the status report sends reminder emails (M6, D-080) | Rewrite for M1 to M3 and M6 | Legal lane; counsel | M14 counsel delta |
| 16 | Repo: `packages/content/src/store.en.ts` (STALE row 2) | "the book holds both your voices"; header comment "no backup of our own in v1.0" | Hearing the other parent is v1.1 (D-073, M7); backup is v1.0 (M14) | "You each sign your own letters"; header cites M14 | Content | Before the listing is entered (FT-43) |
| 17 | Repo: `store.en.ts` "Private by default" paragraph; `trust.signIn.privacy` | "Only you and the people you invite can read your book" | Not end to end; recovery key held by us (M16; R4 PT-25) | "Your book is shared only with the co-parent you invite. We don't read it." **[Counsel]** | Content; counsel | Before FT-43 |
| 18 | Repo: `trust.firstRecording.title` and `.body` | "Your voice stays here"; "the recording stays with your letter" | Not true for backup users | Reword with counsel (6.5) | Content; counsel | Before the first build with backup |
| 19 | Repo: `docs/legal/app-store-privacy-labels.md` 1.3.0 (R4 PT-24) | Audio Data "No"; Purchases "Analytics only"; Email "No subscription emails" | Backup audio with our recovery key; the status report; reminder emails (M6, M7, M14) | Label 1.4.0 for the M14 build; manifest to match (F21-REQ-007) | Legal lane; mobile; counsel | Before ASC privacy answers (FT-43) |
| 20 | Repo: `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` line 57 (STALE row 6) | Annual display name `Plus Yearly` | D-077, M3: `Plus Annual` | Change in ASC and the doc | Founder (ASC) | Before FT-43 |
| 21 | Repo: same doc, step 8 review notes (STALE row 7) | Add a child and Read together as the Plus gates | M1, M2 | Replace with 6.4 | QA; content (WP-F21-03) | Before FT-43 |
| 22 | Repo, in app: `settings.privacy.staffAccess` (F17; R4 PT-03) | Every access to letters "is logged" | Dashboard reads are not logged today | F17's replacement line until the database audit lands | F17 owner; counsel | Before the first outside family signs in |
| 23 | Repo, in app: `keepGate.heldNote` (F14; R4 PT-13, R3 DX-01) | "This letter is safe on your phone" | Lost with the phone; not synced or backed up | F14 adopted "This letter is waiting on this phone." and private sync of held letters (F14-REQ-039, 14 Oct); export includes them (F15-REQ-018) | F14 owner | Before C1 |

Re-check: each row is closed with a link to the merged change, and the live rows are re-fetched weekly until launch (F21-REQ-030).

### 6.7 Listing, notes and website against M1 to M17

| M | What the public words must say, or never say | Where it is checked | State on 14 Oct |
|---|---|---|---|
| M1 | The first 2 letters kept are free; after that Plus is needed to keep new letters; nothing else is gated; no counters; every letter you keep stays yours to read, play and export | 6.4 notes; `plus.promise`; listing; website pricing scene | Notes and `plus.promise` hold; website false (6.6 rows 3, 4) |
| M2 | Read together and books for more children are free | Same | Website false (6.6 rows 3, 4) |
| M3 | $4.99 a month, 1-month free trial; $49.99 a year, 2-month free trial; display names per D-077 | `pricing.ts`; ASC; website; Subscription Terms | Website and Subscription Terms false (6.6 rows 1, 15); ASC name (row 20) |
| M4 | Never promise "one membership covers the family": whether a co-parent's letters count toward the 2 free is an open edge (DR-16) | Listing, website, notes | Website "covers every child's book" (row 4) removed by the hotfix |
| M5 | Offer codes only through Apple's Redeem a code | Notes | Holds |
| M6 | With an account, the app reports subscription status for reminder emails; no receipts or payment data | Notes; Subscription Terms; privacy label | Notes hold after this revision; Terms and label false (rows 15, 19) |
| M7 | Owner backup of recordings is v1.0; no backup claim before WP-F08-B6 passes; never a promise of hearing the other parent | Website; listing; in-app | Website false (row 2); listing row 16 |
| M8 | At most two parents per book | Notes; listing ("your co-parent") | Holds |
| M9 | "Word for word"; no "tidy" in any public string | Listing; website | Holds in `packages/content` (rules test) |
| M10, M11 | No public claim needed; marks and Recently deleted are never counted in public copy | n/a | n/a |
| M12 | Notes list every flag the build reads; config cannot turn on unreviewed features | Notes (F19 6.5) | Holds once F19's list is pasted |
| M13, M15 | No date in public words; the submission week is in 08 | n/a | n/a |
| M14 | Listing, label and legal pages describe accounts, sync, co-parent sharing, backup and the status report | All | Legal pages and label false (rows 10 to 13, 19) |
| M16 | Backup copy says encrypted, a recovery key we hold under strict logged access, never read, sold or used to train models; never "only your family's keys" | Backup sheet, legal pages, notes, listing | Notes hold; legal pages and in-app lines false (rows 11 to 14, 17, 18, 22) |
| M17 | Free letters count your own letters once their words exist and you have seen them; the other parent's letters never count | Notes; any public line about free letters | Notes hold after this revision |

## 7. Requirements and acceptance criteria

Status: **Built** (file), **Partly built**, **Not built**, checked 13 Oct. **[server]** needs our server and is v1.0 (M14); built code behind the switch is "Built, switch off in release profiles" until the profiles flip.

| ID | P | Requirement | Acceptance criteria | Status | Source |
|---|---|---|---|---|---|
| F21-REQ-001 | P0 | App name from `brand.storeName` | Given ASC, Then the name equals `Early Letters: Memory Book` (26 of 30) | Built (`packages/brand/index.ts`; not yet in ASC) | D-076 |
| F21-REQ-002 | P0 | Subtitle distinct from competitors' "voice memory book" | Given `brand.subtitle`, Then it is 30 characters or fewer and a test fails if it contains "voice memory book" or "memory book you can hear" (case-insensitive) | Partly built: subtitle "Baby journal in your own voice" in `packages/brand/index.ts`; no test | R1 F21 |
| LEGAL-REQ-045 | P0 | No "kids" or child-directed phrases in listing, screenshots, website | Given the rules test over `store.en.ts`, screenshot captions and the website copy, Then 0 matches | Partly built: `packages/content/test/rules.test.ts` covers `store.en.ts` and `site.en.ts`; the live site's copy lives in `apps/web/src/content/site.ts` on main, whose test covers characters, fear, machine-writing and gender only | CR-001 to CR-003 |
| F21-REQ-034 | P0 | No beta-like word in the listing (listing slice of K-13 Rev; home F17) | Given the listing, Then 0 matches for the D-060 pattern | Built (`rules.test.ts` "[K-13] has no beta wording") | D-060 |
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
| F21-REQ-028 | P0 | A v1.0 claims list with counsel approval exists before submission, covering the app, permission strings, listing, review notes, website and legal pages | Given 6.5 moved to `docs/legal/claims-v1.md` (new), Then each row has a counsel tick, and a content test fails on any privacy or durability sentence in `packages/content`, `apps/web/src/content` or `permissions.en.ts` that has no row (R4 PT-26) | Not built | LEGAL-REQ-044, Q17; R4 PT-26 |
| F21-REQ-030 | P0 | The live website carries no false claim, now | Given the live home page and legal pages, Then every row in 6.6 marked "live" is fixed or removed; the sample child is Asha; re-checked weekly until launch | Not built (6.6 rows 1 to 8 live on 13 Oct) | R4 PT-04; STALE row 1 |
| F21-REQ-031 | P0 | Notes for Review match the build and M1 to M17 | Given the notes, Then each M row in 6.7 that touches the notes is covered, a demo account with a pre-seeded two-parent book is given, and no sentence says "No account is needed" for a server-on build | Not built | R4 PT-35; M1 to M17 |
| F21-REQ-032 | P0 | Language claims split by gate | Given `SHIPPING_LANGUAGES` and a `TRANSCRIBED_LANGUAGES` list (new, from FT-34), Then a rules test fails if a language not in the transcribed list appears in a sentence with "written down" or "transcribed" in `store.en.ts`, `site.en.ts` or `apps/web/src/content` | Not built | R3 DX-27 |
| F21-REQ-033 | P2 | Apple's review request after a good moment | Given the 5th letter kept or a finished Read together, Then `SKStoreReviewController`-style request through Expo's store review module runs at most once per Apple's yearly limit, never after a Keep sheet, a deletion, a support contact or a quieted book [A: module name checked before build] | Not built | R1 PL-29 |
| F21-REQ-029 | P1 | Consumer Health Data policy linked from website footer, App Store description and Settings (Q3 default) | Given each place, Then a link to /health-privacy | Partly built: website footer and Settings > Privacy link it; listing does not | Q3 **[Counsel]** |

### 7.1 Test map (P0)

| ID | Test file or run | Exists? |
|---|---|---|
| F21-REQ-001, F21-REQ-002, F21-REQ-009 | `packages/brand/test/brand.test.ts`; `packages/content/test/rules.test.ts` (subtitle guard new) | Exist |
| LEGAL-REQ-045, F21-REQ-034, F21-REQ-003, F21-REQ-004, F21-REQ-032 | `packages/content/test/rules.test.ts` (build-state claim set and language lists new) | Exists |
| F21-REQ-005, F21-REQ-010 | ASC screenshots in release evidence | Human |
| F21-REQ-006, F21-REQ-031 | Notes checklist in `docs/store/review-notes.md` against 6.7; TestFlight walk-through | New |
| F21-REQ-007 | `apps/mobile/test/permissions-manifest.test.ts` (manifest types) and a diff against the label file | New |
| F21-REQ-008 | `scripts/brand/screenshots.mts` run on the release build | Exists; run owed |
| F21-REQ-011 | `apps/web/test/redirects.test.ts` | Exists (on `main`) |
| F21-REQ-012, F21-REQ-013, F21-REQ-014 | `apps/web/test/` legal page fetch test for banner, version and placeholders (new); counsel sign-off | New |
| F21-REQ-015, F21-REQ-016, F21-REQ-018, F21-REQ-019, F21-REQ-030 | `apps/web/test/copy-rules.test.ts` (extended) | Exists (on `main`); rules new |
| F21-REQ-017 | Guard over `apps/web/**` (port of `packages/content/test/no-real-family-data.test.ts`) | New |
| F21-REQ-020 | `apps/web/test/notify.test.ts`, `unsubscribe.test.ts` (rate limit number to add, R5 sample item 40) | Exist |
| F21-REQ-021 | `apps/web/test/launch.test.ts` | Exists |
| F21-REQ-022 | `apps/web/test/analytics.test.ts` | Exists |
| F21-REQ-024 | Fetch test for the AASA file and both pages (new) | New |
| F21-REQ-025 | axe in CI (new) | New |
| F21-REQ-027 | Coordinator record | Human |
| F21-REQ-028 | `docs/legal/claims-v1.md` with counsel ticks; `packages/content/test/rules.test.ts` unregistered-claim case | New |

### Inherited requirements whose home is this spec (round 2)

These IDs were cited in V2 with no definition row (R9 R2D-06). The text is taken from the source named in the last column; that source still governs the full wording. Each P0 row has a work package and a test in section 12.

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| LEGAL-REQ-042 | P0 | Store disclosures rendered from the data map and confirmed per release | Given a release build, When the checklist runs, Then the evidence folder for that version exists and matches the rendered output | `docs/legal/ENGINEERING_REQUIREMENTS.md` on `develop` LEGAL-REQ-042 |
| LEGAL-REQ-058 | P0 | Launch geography: United States storefront only | Given App Store Connect, When the release checklist runs, Then availability equals the United States and the evidence is saved | `docs/legal/ENGINEERING_REQUIREMENTS.md` on `develop` LEGAL-REQ-058 |
| LEGAL-REQ-060 | P1 | No health-feature drift: no HealthKit or structured health logs without re-running the register rows | Given entitlements, When CI runs, Then no HealthKit entitlement exists | `docs/legal/ENGINEERING_REQUIREMENTS.md` on `develop` LEGAL-REQ-060 |
| PRD-REQ-023 | P0 | Publisher identity, domain, support and privacy contacts come only from `packages/brand` | Given the repo, Then no publisher name or contact is written outside `packages/brand` | `docs/prd/PRD.md` 1.3 PRD-REQ-023 |

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

`08-delivery.md` section 3.3 governs file ownership: a path below owned by another stream is a request to that stream (R5 EQ-08).

Only for what is missing or partly built.

| WP | Scope | Owner | Owns files or folders | Depends on | Done when | Mode |
|---|---|---|---|---|---|---|
| WP-F21-01 | Build-state claim set, `SHIPPING_LANGUAGES`, subtitle guard | Content | `packages/content/src/store.en.ts`, new `packages/content/src/claims.ts`, `test/rules.test.ts` | M14, FT-34 | `[F21-REQ-002]`, `[F21-REQ-003]`, `[F21-REQ-004]` | Agent |
| WP-F21-02 | Listing copy for the chosen build state; regenerate `docs/store/app-store.md` | Content | `store.en.ts`, `docs/store/app-store.md` | WP-F21-01 | `[F21-REQ-003]`; rules test green; `[F21-REQ-009]`, `[F21-REQ-034]` | Agent |
| WP-F21-03 | Notes for Review and the reviewer demo account | QA, content, founder (account) | `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` step 8, new `docs/store/review-notes.md` | F19 6.5; a staging or production seed of the Asha two-parent book | `[F21-REQ-006]`, `[F21-REQ-031]` | Agent, then founder |
| WP-F21-04 | Screenshots from the release build | Content, founder | `scripts/brand/screenshots.mts` captions in `store.en.ts` | Release build | `[F21-REQ-008]` | Pair |
| WP-F21-05 | Website prices from `pricing.ts`, claims fixed, trust promise word for word | Web | `apps/web/src/content/site.ts` (main) | none | `[F21-REQ-015]`, `[F21-REQ-016]`, `[F21-REQ-018]` | Agent |
| WP-F21-06 | Fictional sample family on the website and the guard over `apps/web` | Web | `apps/web/src/content/site.ts`, scenes that import it, guard test | Founder Q2 | `[F21-REQ-017]` | Agent |
| WP-F21-07 | Website copy test extended | Web | `apps/web/test/copy-rules.test.ts` | WP-F21-01 | `[F21-REQ-019]`, `[LEGAL-REQ-045]`; `[F21-REQ-020]`, `[F21-REQ-021]`, `[F21-REQ-022]` | Agent |
| WP-F21-08 | Legal pages for the build state; /delete-account rewrite | Legal lane, counsel | `docs/legal/*.md`, `apps/web/src/lib/legal/delete-account-copy.ts` | M14, M16, counsel (FT-33, FT-41) | `[F21-REQ-012]`, `[F21-REQ-013]`, `[F21-REQ-014]`; `[PRD-REQ-023]` | Agent then counsel |
| WP-F21-09 | Privacy label for the build state and manifest | Legal lane, mobile | `docs/legal/app-store-privacy-labels.md`, `apps/mobile/app.config.ts` | F18 WP-F18-08 | `[F21-REQ-007]`; `[LEGAL-REQ-042]` | Pair |
| WP-F21-10 | security.txt, footer line, axe in CI | Web | `apps/web/src/app/.well-known/`, footer component, CI config | none | `[F21-REQ-023]`, `[F21-REQ-026]`, `[F21-REQ-025]`; `[F21-REQ-011]` | Agent |
| WP-F21-11 | Claims list with counsel ticks, and the content test that fails on an unregistered claim | Legal lane, content | `docs/legal/claims-v1.md` (new), `packages/content/test/rules.test.ts` | WP-F21-02, WP-F21-05 | `[F21-REQ-028]`, `[F21-REQ-032]` | Agent then counsel |
| WP-F21-14 | Website hotfix this week, separate from launch work: prices from `pricing.ts`, the four false pricing-scene claims removed, the sample child switched to Asha, the guard added to `main` (6.6 rows 1 to 8) | Web | `apps/web/src/content/site.ts` (main), guard test | none | `[F21-REQ-030]`, `[F21-REQ-015]`, `[F21-REQ-017]` | Agent, founder merges |
| WP-F21-12 | ASC entry: fields, rating, availability, subscriptions, export compliance, privacy answers | Founder | App Store Connect | All above | `[F21-REQ-005]`, `[F21-REQ-010]`; `[F21-REQ-001]`, `[LEGAL-REQ-058]` | Human |
| WP-F21-13 | Branch reconciliation for `apps/web` | Coordinator | Repo | none | `[F21-REQ-027]` | Human |

## 13. Open questions and assumptions

| Q | Who, by when | What changes |
|---|---|---|
| Q1 Which build state is submitted (F18 Q1)? **Answered by M14 (founder, 13 Oct 2026): server features on** | Founder (decided) | Listing, notes, label, legal pages, /delete-account follow the on state |
| Q2 The website's sample letter uses a child name that the repo's real-family guard lists; `site.ts` says it was the founder's choice. CLAUDE.md and `_AUTHORING.md` 7 say real family details never appear. Keep or switch to "Asha"? Default [R]: switch, in the hotfix (WP-F21-14) | Founder; this week | WP-F21-14 |
| Q3 Does a subscription in a server-off app meet 3.1.2(a) "work across the user's devices"? Mostly moot after M14 (v1.0 syncs); still relevant if the kill path is used. Default: yes, the entitlement works on every device of the Apple Account; notes say so | Founder; before submission | Notes |
| Q4 Linked or Not linked for usage (Q-005) **[Counsel]** | Counsel; with the M14 delta (default Linked) | Label |
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
