# Early Letters store compliance pack: v1.0.0 (App Store first, Google Play prepared)

Prepared 28 Oct 2026 against repo HEAD `3ce511e`. Owner: founder. Drafted by an AI release manager, for the founder and outside counsel to review. This is not legal advice. Every answer here is a representation to Apple or Google once entered, so re-check each file against the exact build before you press Submit.

Public name, store name and bundle id come only from `packages/brand/index.ts`. Prices and trial lengths come only from `apps/web/src/content/pricing.ts` (Plus $4.99 monthly with a 1-month free trial; $49.99 yearly with a 2-month free trial; first two letters free). Nothing in this folder invents a number.

## Files

| File | What it holds |
|---|---|
| `README.md` | This page: the central finding, blockers, the OPEN register |
| `release-notes.md` | v1.0.0 text for both stores, plus the template for later releases |
| `app-review-notes.md` | What Apple and Google reviewers need: main flow, sign-in or demo path, permissions, subscription test notes |
| `privacy-labels-apple.md` | App Privacy (nutrition label) answers |
| `data-safety-google-play.md` | Google Play Data safety answers |
| `age-rating.md` | Apple age rating and Google Play content rating and target audience |
| `export-and-content-rights.md` | Export compliance (encryption) and content rights |
| `permissions.md` | Permissions list with exact usage-description strings, Android permissions, privacy manifest reasons |
| `subscription-metadata.md` | Plus subscription metadata for App Store Connect and Play Console |
| `data-and-account-deletion.md` | The deletion paths each store requires, and what the code does today |

## The central finding: the code and the design describe two different apps

Everything in `docs/` (PRD, ADRs, the draft privacy labels `docs/legal/app-store-privacy-labels.md`, the store listing copy) describes a v1.0 with accounts, sync, family sharing, Plus purchases, opt-in analytics, backup and export. The code at HEAD builds a smaller app. Verified in `apps/mobile`:

| Capability | In the code today | Evidence |
|---|---|---|
| Sign-in or accounts | No. Settings shows "Not signed in" | `store.ts` `currentUserId()` returns null; `settings/index.tsx` |
| Network calls from the app | None. No Supabase client, no fetch, no model download | grep of `apps/mobile/src` and `modules` finds no network code |
| Purchases | No. `hasPlus()` is hard-coded false; the Plus button is disabled; no `expo-iap` | `store.ts`, `plus-gate.tsx`, `package.json` |
| Free-letter limit (first two letters) | Not enforced anywhere. Only "a second book needs Plus" exists, in the app and in `create_child` | `newChildNeedsPlus()`; migration `20261003010000` |
| Family invite, sharing | Disabled ("needs an account") | `(tabs)/family.tsx` |
| Analytics, crash reports | No PostHog or Sentry in dependencies (`packages/analytics` exists, unused by the app) | `apps/mobile/package.json` |
| Notifications / reminders | Choice saved, nothing scheduled; no notifications package | `settings/reminders.tsx` |
| Export | Disabled row ("arrives in a coming beta update") | `settings/index.tsx` |
| Backup | Disabled button | `settings/recordings.tsx` |
| Account deletion | Disabled row; copy says deleting the app removes data from the phone | `settings/index.tsx`, `strings.en.ts` `settingsMore` |
| Speech to text | Does not work in a release build: no M4A decoder, no model download (BL-065). Speaking records and keeps audio; words cannot be made | `transcribe-whisper.ts` returns `decoder-missing`; `review.tsx` shows "Your voice is kept" |
| Typed letters, local book, reading, 18+ gate, onboarding, child profiles | Work, stored in on-device SQLite | `store.ts`, `age-gate.logic.ts` |

So each file gives answers for two profiles:

- **Profile A, "build as coded today".** Local-only app. This is what you would submit if you uploaded `apps/mobile` now.
- **Profile B, "v1.0 as designed".** The scope in `docs/DECISIONS.md` (D-001, D-002, D-003, D-044) and `docs/ARCHITECTURE.md`. Valid only after those features are built and the Supabase migrations in `supabase/APPLY.md` steps 3 to 7 are applied (APPLY.md, dated 2 to 3 Oct, shows them pending; I cannot see the live project, so that is OPEN-26).

A label that claims more data than the build collects is a lesser problem than one that claims less, but both are inaccurate representations. Pick the profile that matches the binary you upload.

## Blockers found (nothing can be submitted until these are closed)

1. **No usable privacy policy URL.** The live `/privacy` page (`apps/web/src/lib/legal/privacy-copy.ts`, last updated 2026-10-16) says it covers only the website and email list and that "the app is not out yet". `packages/brand` still has `privacyUrl: https://example.com/privacy` and `domain: example.com`. Apple and Google both require a policy that covers the app. The app-level drafts in `docs/legal/` are marked draft-for-counsel and unpublished. (OPEN-02)
2. **Bundle id is derived from a placeholder domain** (`example.com.scribe`). It cannot be changed after the first upload to App Store Connect (`packages/brand/index.ts` warning; `app.config.ts` header). (OPEN-02)
3. **No support URL and no deletion page.** `apps/web/src/app` has no `/support` and no `/delete-account`. `docs/store/listing/listing.json` already points to `https://earlyletters.com/support`. D-042 calls for the deletion page at v1.0. (OPEN-04, OPEN-05)
4. **Store copy promises features the build lacks** (invite family, export a PDF, backup, words from speech on the phone, seven languages). `packages/content/src/store.en.ts` `whatsNewV1` and `description`. Guideline 2.3.1 and 2.1 risk. (OPEN-11, OPEN-12)
5. **Stale prices remain in shipped content.** `packages/content/src/store.en.ts` (description) and `packages/content/src/site.en.ts` still say $3.99 and $29.99. `ADR 0013` and `DECISIONS.md` D-001/D-012 do too, and the ADR's product ids `el_plus_monthly_399` and `el_plus_annual_2999` bake the old prices into permanent ids. (OPEN-08, OPEN-10)
6. **Scaffold icon and splash** (`app.config.ts` TODO(design, A-REQ-001)). Not a policy block, but do not submit with the Expo scaffold icon.
7. **`ITSAppUsesNonExemptEncryption` is not set** in `app.config.ts`, so App Store Connect will ask on every build. (OPEN-15)
8. **No `ios.privacyManifests` block** in `app.config.ts`. The proposal in `docs/legal/app-store-privacy-labels.md` section 3.3 was never applied. (OPEN-19)

## OPEN register (every item that code and docs do not settle)

Each item says who must answer. "Founder" means the product owner and account holder; "Counsel" means outside privacy or consumer-law counsel. Items are referenced by number in the other files.

| # | Question | Needed for | Who |
|---|---|---|---|
| OPEN-01 | Which build is v1.0.0: Profile A (local-only, today's code) or Profile B (accounts, sync, Plus, analytics)? D-006 says "no local-only mode" and D-001 says Plus ships in v1.0, but neither exists in code. Do you submit A now, or hold for B? | Every file | Founder |
| OPEN-02 | What is the real domain and what are the published, app-level Privacy Policy and Terms URLs? (`brand.publisher.domain`, `privacyUrl`, `supportEmail` are all `example.com` placeholders; the website policy excludes the app.) Is counsel's review of `docs/legal/privacy-policy.md` and `terms-of-service.md` complete? | Both stores, bundle id | Founder, Counsel |
| OPEN-03 | You publish as an individual (D-004). Do you accept the Guideline 5.1.1(ix) risk (apps that require sensitive information should come from a legal entity) given the app stores a due date (pregnancy information) and children's names and birthdays? What name and address appear as seller, and is a P.O. box or other non-home address available? | Apple review, seller name, Terms | Founder |
| OPEN-04 | Support URL and the mailbox behind it. `hello@earlyletters.com` is the only contact in `site.ts`; is it monitored, and is it the App Review contact email? Who is the named App Review contact (name and phone are entered only in App Store Connect, never in the repo)? | Both stores | Founder |
| OPEN-05 | Who builds `/delete-account` (D-042: static page plus email route at v1.0), and what email and response time does it promise? | Google Play (required if accounts exist); good practice for Apple | Founder, Counsel |
| OPEN-06 | Account deletion backend: `request_account_deletion` exists in the pending migrations, but `supabase/` contains no Edge Functions (no `purge-worker`, no Apple token revoke, no Resend/PostHog deletion). Is any of it built elsewhere? | Apple 5.1.1(v) once sign-in ships | Founder |
| OPEN-07 | Reviewer sign-in (Profile B). Sign in with Apple cannot be given to a reviewer, and email link plus code needs an inbox they cannot read. Choose: a Supabase test phone/OTP-style fixed code, a password account, or a reviewer bypass. Who creates the fictional "Asha" account in the production project? | Apple review notes | Founder |
| OPEN-08 | In-app purchase product ids. ADR 0013 names `el_plus_monthly_399` and `el_plus_annual_2999`; ids are permanent once created. Use price-free ids (suggested `el_plus_monthly`, `el_plus_annual`)? Group and reference names? | App Store Connect, `expo-iap`, Edge Function | Founder |
| OPEN-09 | What happens at the paywall in the build you ship? The two-free-letters limit is not enforced in code or the database, `hasPlus()` is always false and the purchase button is disabled. Which of the D-051 open edges are decided (do family letters count; second child's book; what happens to a letter being recorded at the limit)? Apple reviewers will test a gate with no purchasable product as a defect (2.1, 3.1.1). | Review notes, subscription metadata | Founder, Counsel |
| OPEN-10 | Who fixes the stale $3.99/$29.99 in `store.en.ts`, `site.en.ts`, DECISIONS, ADR 0013, `subscription-terms.md`, `terms-of-service.md` and others? (I was told to write only in this folder.) | Listing accuracy | Founder |
| OPEN-11 | Which listing claims stay for v1.0.0? Claims not backed by the build: invite family, export PDF, backup, "transcription happens on your phone", seven languages, read together in the writer's voice (the reader screen exists; family voices do not). | Apple 2.3.1 | Founder |
| OPEN-12 | Speech to text does not work in a release build (M4A decoder and model download missing; D-046 model host not chosen; D-031 Hindi script open). Ship without it (typed letters plus recording kept), or hold? If shipped, the reviewer's "Speak" path ends at "Your voice is kept". | Review notes, listing | Founder |
| OPEN-13 | Analytics and crash reporting. D-003 says PostHog and Sentry, opt-in, at launch; not in the app. If added, the "not linked" conditions in section 1.3 of `docs/legal/app-store-privacy-labels.md` need engineering verification (IDFV, IP capture, `identify`, `setUser`). | Privacy labels, Data safety | Founder, Engineer |
| OPEN-14 | Does v1.0.0 offer cloud transcription (ADR 0002), backup, or family sharing of recordings (D-032)? None exists in code. The microphone string currently says recordings stay on the phone "unless you choose to back them up, share them with family, or use cloud transcription". Keep it, or use the shorter Profile A string in `permissions.md`? | Permission string accuracy | Founder |
| OPEN-15 | Export compliance. Profile A needs no encryption beyond the OS. Profile B adds app-level encryption of recordings (ADR 0006 / D-032 per-file keys), which is not covered by Apple's exempt categories. Confirm the answer and whether an annual self-classification report to BIS is required; set `ITSAppUsesNonExemptEncryption` explicitly. | App Store Connect upload | Founder, Counsel |
| OPEN-16 | Open-source notices. whisper.rn (MIT), the Whisper model files (MIT), React Native, Expo and the planned fonts (SIL OFL) require licence text to travel with the app. There is no licences screen in Settings. Add one, or rely on App Store licence listing? | Content rights | Founder |
| OPEN-17 | Age rating. D-006 says adults only (18+ gate). Do you set the App Store age rating override to 18+ (recommended), and do you want Apple's Declared Age Range API (mentioned in D-040) at all? When family sharing ships, is it "user-generated content" for Apple's questionnaire? | Age rating | Founder, Counsel |
| OPEN-18 | Entitlements and capabilities for Profile B are not in `app.config.ts`: Sign in with Apple, In-App Purchase, Associated Domains (invite universal links), and `expo-iap`, `expo-notifications`, Supabase client packages. | Build config | Engineer |
| OPEN-19 | Privacy manifest. `app.config.ts` has no `ios.privacyManifests`. Required-reason API declarations for the app and for whisper.rn (no manifest found in `node_modules`) must be merged after a real `expo prebuild` and checked against Apple's upload warnings. | Apple upload | Engineer |
| OPEN-20 | Is the Google Play release in scope for v1.0? D-013 says iOS only at launch; Android has no `ScribeFiles` native side (`model-files.ts` TODO), `predictiveBackGestureEnabled` is false, the actual merged Android manifest permissions are unverified. A personal Play account created recently may need a closed test (verify current Play rule) before production. | Google Play | Founder |
| OPEN-21 | D-030: remove the beta paragraph and promotional text from the listing, keep the quiet "Beta" label in Settings (founder OK pending). The label says "in beta"; Apple Guideline 2.2 treats betas as TestFlight material. | Review notes, listing | Founder |
| OPEN-22 | Is the Washington My Health My Data notice (`docs/legal/consumer-health-data-notice.md`) published and linked, given the due date is treated as health data (PRD K-25)? Needed only for Profile B. | Privacy | Counsel |
| OPEN-23 | Children's data. The app is adult-only but stores a child's name, birthday and recordings of the parent's voice. Confirm "Not Made for Kids", no Families Program (Play), and counsel's COPPA reading (`docs/legal/`). | Age rating, Data safety | Counsel |
| OPEN-24 | Pregnancy: Apple lists pregnancy or childbirth information as Sensitive Info. Confirm that due-date mode ships in v1.0.0 (the code has the field; the label row depends on it). | App Privacy | Founder |
| OPEN-25 | Retention that must be disclosed with deletion: the purchase ledger is kept pseudonymised (the schema comment says 7 years), audit events 24 months, consent records 3 years. Confirm these appear in the published policy. | Deletion pages, Google rule | Counsel |
| OPEN-26 | Live Supabase state. I could not see the live project. `supabase/APPLY.md` shows migrations 3 to 7 pending as of 3 Oct; `safety_events` still exists live until migration 4 runs. | Profile B labels | Founder |
| OPEN-27 | Photos on letters. Migrations have an `entry-photos` bucket but the mobile app has no photo picker. Does v1.0.0 ship photo attach? | Labels, permission strings | Founder |
| OPEN-28 | Which Project docs were meant to be consulted? The attached Project lists IP and infra memos (`ip/L2-copyright-licence.md`, `infra/...`); this session had no Project read tool, so they were not read. Anything in them that changes content rights or privacy answers should override this pack. | Content rights | Founder |
| OPEN-29 | On-device deletion does not erase anything: `deleteEntry` only sets `deleted_at`, the text and recording stay in SQLite and Documents, and there is no Recently deleted screen or local 30-day purge, while `settings.delete.entryBody` promises "undo for 30 days from Recently deleted". Build the local purge, or change the copy and the policy to match | Privacy policy accuracy, Apple 5.1.1 | Founder |

## Method and limits

- Sources read: `CLAUDE.md`, `docs/ARCHITECTURE.md` (status table and sections), ADR 0006 and 0013, `docs/DECISIONS.md` (index and D-001 to D-014, D-030 to D-052), `docs/legal/app-store-privacy-labels.md`, `subscription-terms.md`, `in-app-disclosures.md`, `DELETION_AND_EXPORT_SPEC.md` (sections 0 to 2), all seven migrations (structure; deletion, entitlement and purge functions in full), `supabase/APPLY.md`, `apps/mobile` source and `app.config.ts`, `eas.json`, `packages/brand`, `packages/content/src/store.en.ts`, the web `/privacy` and `/terms` copy, `apps/web/src/content/pricing.ts`.
- Not run: the tests, a prebuild, the iOS build. Android permission lists come from reading the `expo-audio` config plugin, not from a merged manifest.
- Apple and Google form wording was checked at category level only: Apple's age-rating update (four question groups: in-app controls, capabilities, medical or wellness topics, violent themes; tiers 4+, 9+, 13+, 16+, 18+; https://developer.apple.com/news/?id=ks775ehf) and Google's account-deletion policy (https://support.google.com/googleplay/android-developer/answer/13327111). Exact question text changes; confirm in the consoles.
- Content rules from `CLAUDE.md` were applied to every file here: no em or en dashes, curly quotes, ellipsis characters or emoji; no fear or guilt language; nothing implies a machine writes or rewrites a letter; the child is never gendered; the only family named is the fictional Asha.
