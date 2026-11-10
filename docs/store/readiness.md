# Store submission readiness and gap audit

> **Lineage note (1 Nov 2026, PR #497).** This audit was written on `main` before `main` was merged into `develop`. Two files it cites, `docs/ops/OFFER_CODES.md` and `docs/legal/memos/pricing-change-2026-10-04.md`, came from `main`'s 3 to 4 Oct work and were not carried onto `develop`, which decided the same ground later (D-051 (main), D-052 (main), D-082 to D-085). Rows that cite them read as history; the current plan is `docs/prd/v2/` and `docs/release/`.

Prepared 2026-10-28 by product operations. Scope: first submission to the Apple App Store (iOS, US only), then Google Play later.
Plan of record for dates: `docs/ROADMAP.md` (submit Mon 11 Jan 2027, release week of 18 Jan 2027, buffer to 29 Jan).

## How to read this file

Status words are assigned from what the repo shows, nothing else.

| Status | Meaning |
|---|---|
| DONE | The repo shows it finished (code, config or decision), with the file named. |
| READY | The repo holds a prepared draft or a decision, and nothing in the repo stops the next step. A human action may still be owed. |
| BLOCKED | The repo shows a dependency, defect or placeholder that stops it. The blocker is named. |
| UNKNOWN | The repo has no evidence either way (store consoles, Vercel, DNS and vendor accounts live outside it). Someone must check and report. |

Limits of this audit (read first):
- Nothing here was checked against App Store Connect, Play Console, Vercel, DNS or Apple's current guideline text. Where an Apple or Google rule is named, it is a pointer to re-read at submission, not a verified quote. Apple rules the repo itself quotes are cited to that file.
- `docs/BACKLOG.md` was last re-planned 3 Oct 2026. Its `ready` and `blocked` statuses are therefore stale, and only 5 tasks say `done`. A `ready` human task there is read as UNKNOWN here, because the file cannot show whether the founder did it since.
- The project documents `release-engineering-plan` and `cost-decisions` are not on disk in this repo (no file by either name exists under `/home/claude/earlyletters`), so nothing below draws on them. Fee amounts and budget lines are therefore not stated in this file.
- Plus prices and trial lengths below come only from `apps/web/src/content/pricing.ts`: Monthly $4.99 with a 1-month free trial, Yearly $49.99 with a 2-month free trial.

---

## 1. Summary

The website side is well ahead of the app side. The app is a local-only recorder: no sign-in, no sync, no purchase code, no export, no account deletion, no family invites, no analytics, and a placeholder bundle id. Every store-facing prerequisite (enrolment, bundle id, URLs, legal documents, products) is either unevidenced or blocked by the placeholder domain in `packages/brand/index.ts` (`example.com`).

M0 in the roadmap (domain, enrolment, Paid Applications Agreement, App Store Connect, products) was due in weeks 1 to 3 (5 to 23 Oct). Today is week 4. The repo shows none of those as finished.

The top 10 blockers are in section 14.

---

## 2. Accounts and enrolment

| # | Line | Status | Evidence and gap | Owner |
|---|---|---|---|---|
| 2.1 | Apple Developer Program, individual enrolment | UNKNOWN | D-004 decides individual. BL-101 says `ready`, human, as of 3 Oct. No team id anywhere in the repo (`APPLE_TEAM_ID` is a Vercel variable only). | Founder |
| 2.2 | D-U-N-S number and organisation account | DONE (decided not needed) | D-004, D-005: off the critical path. Residual risk is guideline 5.1.1(ix), see 10.9. Transfer to an organisation account has conditions (D-004 point 5), including at least one released version. | Founder |
| 2.3 | Legal entity (LLC) | DONE (decided deferred) | D-004. Triggers to reconsider are listed in D-004 point 3 (public TestFlight link, paid marketing, 1,000 families, $2,000 a month, first hire with data access, Android). The public TestFlight link is itself a trigger, so decide before D-045's optional public link. | Founder |
| 2.4 | Seller name is the founder's personal legal name | READY | Stated plainly in D-004. Needs a mailing address that is not the family home (D-004 point 1; counsel to confirm). The address is not in the repo. | Founder, counsel |
| 2.5 | Paid Applications Agreement, tax, banking | UNKNOWN | BL-102 `blocked (BL-101)` as of 3 Oct. Small Business Program enrolment is listed in its scope. Without it no sandbox or production purchase works. | Founder |
| 2.6 | Apple Account 2FA and console access record | UNKNOWN | BL-106 (2FA on every console with evidence). No evidence file; `docs/qa/evidence/` does not exist. | Founder |
| 2.7 | EAS account and credentials | UNKNOWN | BL-108 `blocked (BL-101)`. `apps/mobile/app.config.ts` has no `extra.eas.projectId`, so the project is not linked to an EAS project in the repo. | Founder |
| 2.8 | Google Play Console developer account | UNKNOWN | Android is deferred to v1.2 and beyond (`docs/ROADMAP.md` section 6, BL-311). No Play account trace in the repo. Google's current requirements for new developer accounts (identity checks, any testing minimums before production) are not in the repo; check them before planning Android dates. | Founder |
| 2.9 | Apple Declared Age Range and Texas age-assurance obligations | UNKNOWN | `docs/legal/compliance-register.md` CR-004 says developers must handle Apple's age signals for Texas users; D-026 says results are used in memory only. No code for it in `apps/mobile/src` (searched for age-range APIs; only the local 18+ gate exists). US-only still includes Texas. Counsel to confirm what is required. | Mobile engineer, counsel |
| 2.10 | Counsel engaged | UNKNOWN | BL-104: engage in wk 1, package out by wk 5, sign-off by wk 14. No engagement trace in the repo. | Founder |
| 2.11 | Trademark clearance of "Early Letters" | UNKNOWN | `packages/brand/index.ts`: "Not yet trademark-cleared". The project IP memos were not readable here. App name availability in App Store Connect is also unchecked. | Founder, counsel |

---

## 3. Bundle id and signing

| # | Line | Status | Evidence and gap | Owner |
|---|---|---|---|---|
| 3.1 | Real domain in `packages/brand` | BLOCKED | `publisher.domain` is `'example.com'`, `supportEmail` is `support@example.com`, `privacyUrl` is `https://example.com/privacy`. BL-100 is the fix (one PR, the founder supplies values). The web side already uses `earlyletters.com` (`apps/web/src/lib/legal/origin.ts`, `site-url.ts`). | Founder (values), any agent (PR) |
| 3.2 | Production bundle id | BLOCKED | `bundleId()` derives it from the domain, so today it would be `com.example.scribe`. `brand/index.ts` and `app.config.ts` both warn that it cannot change after the first upload to App Store Connect. The AASA route's own example id is `com.earlyletters.scribe`, which is what the domain suggests; founder to confirm. Do not run an App Store Connect upload of the production profile until 3.1 is merged. | Founder |
| 3.3 | Dev and preview ids | DONE | `app.config.ts` adds `.dev` and `.preview` from `EXPO_PUBLIC_APP_ENV`, driven by `eas.json` profiles. | Mobile engineer |
| 3.4 | App Store Connect app record for each id TestFlight will carry | UNKNOWN | TestFlight needs an app record for the bundle id it distributes. If preview builds go to TestFlight, `<id>.preview` needs its own record (own name, own SKU) or preview must be dropped. The repo does not say which. `docs/release/TESTFLIGHT.md` is cited by `apps/web/src/app/.well-known/apple-app-site-association/route.ts` but does not exist. | Founder, QA engineer |
| 3.5 | Signing credentials (distribution certificate, provisioning profile, push key if used) | UNKNOWN | EAS-managed signing is implied by `eas.json` but nothing is generated in the repo; blocked on 2.1 and 2.7. | Founder |
| 3.6 | Capabilities and entitlements in `app.config.ts` | BLOCKED | Missing today: Sign in with Apple (D-044 requires it), Associated Domains for `applinks:earlyletters.com` (the AASA file serves `/auth/confirm`, `/auth/callback`, `/j`), In-App Purchase. Push is not needed yet (`expo-notifications` is not installed; reminders are local per ROADMAP M4). Each needs the plugin or `ios` key plus the capability on the App ID. | Mobile engineer |
| 3.7 | AASA file and its variables | READY | Route exists with tests. Serves 404 until `APPLE_TEAM_ID` and `IOS_BUNDLE_ID` are set in Vercel production (`docs/ops/WEBSITE_RUNBOOK.md` section 3 and 8). Both values come from 2.1 and 3.2. | Web release owner (E3) |
| 3.8 | Minimum iOS version (D-040: iOS 17) | UNKNOWN | D-040 is "Recommended". `app.config.ts` sets no deployment target and no `expo-build-properties` plugin is installed, so the effective floor is whatever Expo SDK 57 defaults to. Not verified here. | Mobile engineer |
| 3.9 | Export compliance (encryption) answers | UNKNOWN | `app.config.ts` does not set `ios.infoPlist.ITSAppUsesNonExemptEncryption`, so App Store Connect will ask on every build. The product uses HTTPS and plans client-side encryption of backups (store listing text, D-032), so the answer needs a decision. Counsel or founder to decide; not guessed here. | Founder, counsel |
| 3.10 | Privacy manifest (`PrivacyInfo.xcprivacy`) | BLOCKED | The needed reason codes are drafted in `docs/legal/app-store-privacy-labels.md` section 3. Nothing in `app.config.ts` (`ios.privacyManifests`) or a file applies them. BL-231 renders them from the data map and is `blocked (BL-016)`. | Privacy engineer |
| 3.11 | Third-party SDK privacy manifests | UNKNOWN | PostHog, Sentry and `expo-iap` are not installed yet, so their manifests cannot be checked. Re-check when added. | Mobile engineer |
| 3.12 | Over-the-air updates | READY (decision only) | TDD 01 3.10 sets the OTA policy (no OTA for anything that changes collection, destinations, consent text or Plus disclosure text). `expo-updates` is not installed and there is no `runtimeVersion` in `app.config.ts`. If OTA is wanted for v1.0, add it before the first store build, because it changes the binary. | Mobile engineer |

---

## 4. Build, TestFlight and version numbering

| # | Line | Status | Evidence and gap | Owner |
|---|---|---|---|---|
| 4.1 | `eas.json` with three profiles | DONE | `apps/mobile/eas.json`: development (dev client, internal), preview (internal), production (`autoIncrement: true`). `appVersionSource: "remote"`. | Mobile engineer |
| 4.2 | Preview profile reaches TestFlight | BLOCKED | `preview.distribution` is `internal`, which produces ad hoc builds for registered devices, not a TestFlight upload. TDD 01 3.10 says preview is "internal TestFlight for the founding family", and D-045/ROADMAP M12 plan C0 TestFlight from week 6. Either preview moves to store distribution, or a separate TestFlight profile is added. | Mobile engineer |
| 4.3 | Build number auto-increment | BLOCKED | Only `production` sets `autoIncrement`. App Store Connect rejects a repeated build number per version, so any profile uploaded to TestFlight needs it too. | Mobile engineer |
| 4.4 | `eas submit` configuration | BLOCKED | `submit.production` is `{}`. No `ascAppId`, and no API key or Apple id reference. Needs 2.1, 3.4. | Founder |
| 4.5 | Marketing version | READY | `version: '1.0.0'` in `app.config.ts` and `1.0.0` in `apps/mobile/package.json`. Two places to keep equal; with a remote app version source only the build number is remote. | Mobile engineer |
| 4.6 | Release tags | READY (rule only) | `ios-v<major>.<minor>.<patch>` in `CLAUDE.md`. `git tag` is empty. No tag-driven release workflow exists; BL-283 (`docs/ops/RELEASE.md` plus workflow) is `blocked (BL-275)`. `.github/workflows` has `ci.yml`, `migration-guard.yml`, `web.yml`, `web-e2e.yml` only. | QA engineer |
| 4.7 | App icon and splash | BLOCKED | `app.config.ts` comments: "TODO(design, A-REQ-001): the envelope mark does not exist yet; these are the scaffold icons" and "scaffold Icon Composer file; replace with the brand icon". The web site has the approved brand mark (commit `fix(web): the approved brand mark replaces the envelope`), but it is not in `apps/mobile/assets`. App Store Connect needs a 1024 px icon with no transparency. | Design |
| 4.8 | Device test of a release build | UNKNOWN | BL-044, BL-135, BL-030 are human device runs on an iPhone SE 3. No evidence. The transcription spike (BL-043, due 30 Oct per ROADMAP) decides whether the app can ship its core promise. | Founder, speech engineer |
| 4.9 | Speech model delivery | BLOCKED | Whisper model (574 MB per `docs/legal/app-store-privacy-labels.md` section 3.2) is downloaded at first use. No download URL exists in `apps/mobile/src/lib/model-files.ts`; the model manager is BL-143; the host is D-046 "Recommended (founder picks the host)". If the reviewer's device cannot get the model, transcription fails during review (see 10.2). | Founder, speech engineer |
| 4.10 | Internal TestFlight (C0) | UNKNOWN | Planned from week 6 (9 to 13 Nov). Needs 3.2 to 3.5 and 4.2 to 4.4. | QA engineer |
| 4.11 | Beta App Review for external C1 build | UNKNOWN | Planned to be sent by Fri 11 Dec. Needs the external-testing metadata (see 8.6) and the privacy URL (5.2). | QA engineer |

---

## 5. Required URLs on earlyletters.com

Facts: the site is `apps/web`, hosted on Vercel project `earlyletters-web`, DNS at Porkbun, per `docs/ops/WEBSITE_RUNBOOK.md`. That runbook was written 3 Oct and says nothing in it was applied then. Whether the domain is attached and live today is UNKNOWN from the repo (`infra/website-status-2026-10-28.md` exists in the project but could not be read here). Routes found in `apps/web/src/app`: `/`, `/privacy`, `/terms`, `/j`, `/auth/confirm`, `/auth/callback`, `/signup/*`, `/unsubscribe`, `/api/notify`, `/api/unsubscribe`, `/.well-known/apple-app-site-association`, `robots.txt`, `sitemap`.

| # | URL | App Store use | Status | Evidence and gap | Owner |
|---|---|---|---|---|---|
| 5.1 | `https://earlyletters.com/` | Marketing URL (optional field) | READY | Home page exists. Production defaults to the holding page (`site-mode.ts`). Live state UNKNOWN. | E3 |
| 5.2 | Privacy Policy URL | Required in App Information, in the paywall, in Settings | BLOCKED | `/privacy` exists but its own copy says it covers only the website and email list, and "the app is not out yet. It will have its own privacy policy when it launches" (`apps/web/src/lib/legal/privacy-copy.ts`). The app policy is `docs/legal/privacy-policy.md`, status `draft-for-counsel`, unpublished. In the app, Settings opens `brand.company.privacyUrl`, which is `example.com/privacy`. | Counsel, E1 |
| 5.3 | Terms of Use (licence agreement) | Custom EULA field, or Apple's standard EULA; linked from paywall | BLOCKED | `/terms` is website-only (`terms-copy.ts`: "The app will have its own terms when it launches"). Terms 2.0.0 and Subscription terms 2.0.0 are drafts for counsel. The Terms row in app Settings is `disabled`. Decide: custom terms (needs publishing) or Apple's standard EULA (Terms must still be linked from the paywall). | Counsel, E1 |
| 5.4 | Subscription terms page | Linked next to the purchase button | BLOCKED | `docs/legal/subscription-terms.md` draft; no route in `apps/web`. Its price table still says US $3.99 and $29.99 (lines 44 and 45). | Counsel, E1 |
| 5.5 | Support URL | Required field | BLOCKED | No `/support` route. The footer has only `mailto:hello@earlyletters.com` (`apps/web/src/content/site.ts`). Apple wants a URL with real contact information; a bare mailto is a risk. BL-100 wants `support@` and `privacy@` mailboxes; the repo uses `hello@`. Pick one address and use it everywhere (also `brand.publisher.supportEmail`). | Founder, E1 |
| 5.6 | Account and data deletion page | Play Console requires a web URL; Apple requires in-app deletion for apps with accounts | BLOCKED | No `/delete-account` route. BL-243 `blocked (BL-100)`. D-042: static page plus email route for v1.0, full web flow before Android (BL-310). `apps/web/src/lib/legal/delete-account-copy.ts` is mentioned in the pricing memo but not found under `apps/web/src/lib/legal` today. | Privacy engineer |
| 5.7 | `/privacy-choices` | Optional Privacy Choices URL | BLOCKED | Not built; same task BL-243. | Privacy engineer |
| 5.8 | Universal-link paths `/j`, `/auth/confirm`, `/auth/callback` | Needed by invites and sign-in links | READY | Pages and tests exist. AASA needs 3.7. | E3 |
| 5.9 | Production domain, TLS, redirects (`www`, `.app`) | All of the above | UNKNOWN | Runbook section 4 is a plan. Vercel plan is Hobby per runbook open item 4 ("Hobby is non-commercial: move to Pro before launch"). | Founder |
| 5.10 | Production environment variables | All of the above | UNKNOWN | `APPLE_TEAM_ID`, `IOS_BUNDLE_ID`, `PUBLISHER_LEGAL_NAME`, `NEXT_PUBLIC_APP_STORE_URL`, `NEXT_PUBLIC_APPLE_PROVIDER_TOKEN`, `RESEND_*` live in Vercel, not the repo. `PUBLISHER_LEGAL_NAME` unset makes the pages say "run by its founder", which is acceptable for the website but not for a seller-name match with the store. | E3 |

---

## 6. In-app purchase and subscription setup

Prices and trials (from `apps/web/src/content/pricing.ts` only): Plus Monthly $4.99, 1-month free trial. Plus Yearly $49.99, 2-month free trial. US dollars, App Store only (ADR 0013).

| # | Line | Status | Evidence and gap | Owner |
|---|---|---|---|---|
| 6.1 | Price source of truth | DONE for the website | `pricing.ts`; `apps/web/test/pricing.test.ts` fails on any other dollar amount or trial length under `apps/web/src`, and on the old prices. | E1 |
| 6.2 | Stale prices outside the guarded folder | BLOCKED (partly fixed on main after this audit: `packages/content/src/store.en.ts` and `site.en.ts` now carry $4.99 and $49.99) | The old figures $3.99 and $29.99 still appear in `packages/content/src/store.en.ts` (App Store description, line 53), `packages/content/src/site.en.ts` (FAQ, line 94), `docs/legal/subscription-terms.md`, `docs/legal/terms-of-service.md` (14.2), `docs/DECISIONS.md` D-012, `docs/adr/0013`, `docs/tdd/08`, `docs/prd/C-habits-pricing-settings.md` and others. The store description is what Apple and users read; a mismatch with the price in App Store Connect is a metadata-accuracy and consent problem. Needs an owner to update, plus a test that scans `packages/content` the way the web test scans `apps/web/src`. | Content |
| 6.3 | Product ids | BLOCKED (decision) | BL-103 and TDD 08 name `el_plus_monthly_399` and `el_plus_annual_2999`, which encode the old prices. Apple product ids are permanent once created (re-check Apple's rule before creating). Decide the ids against $4.99 and $49.99 before anyone creates them, and update `docs/tdd/08`, BL-103 and `docs/ops/OFFER_CODES.md` in the same change. | Founder, payments engineer |
| 6.4 | Subscription group and products in App Store Connect | UNKNOWN | BL-103 `blocked (BL-100, BL-101, BL-102)`. Scope: group "Plus", monthly with 1-month free intro offer, annual with 2-month free intro offer, Family Sharing off, territory US only, Billing Grace Period 16 days (D-048), experiment-arm products created but not offered. Whether Apple offers the exact $4.99 and $49.99 price points in the US is not in the repo; check when creating. | Founder |
| 6.5 | Introductory offer eligibility wording | READY (draft) | `docs/legal/in-app-disclosures.md` keeps "2 free letters" and "free trial" apart. Must be re-read against Apple 3.1.2 at submission (flagged in `docs/legal/memos/pricing-change-2026-10-04.md` section 4 as unverified). | Counsel |
| 6.6 | Client purchase code (`expo-iap`, StoreKit 2) | BLOCKED | Not in `apps/mobile/package.json`. `useIap`, purchase, restore, manage subscription and the Plus sheet are BL-213 to BL-221 (M8, weeks 3 to 12). `docs/ROADMAP.md` marks the `expo-iap` spike on SDK 57 as week 3; no result recorded. | Payments engineer |
| 6.7 | Server side: notifications endpoint, `sync_plan`, reconcile | BLOCKED | No `supabase/functions` directory exists. App Store Server Notifications V2 URLs (production and sandbox) cannot be entered in App Store Connect until BL-214 deploys. Conflict to resolve: `docs/agents/BRIEF-2026-10-03.md` item 3 says no notifications endpoint and no server Plus enforcement, which contradicts ADR 0013 (noted in the ADR itself). | Payments engineer, founder |
| 6.8 | In-App Purchase key (.p8) and shared secret | UNKNOWN | BL-103 scope. Secrets must go to Edge secrets, never the repo. | Founder |
| 6.9 | Restore purchases, manage subscription link, price and trial disclosure, Terms and Privacy links on the paywall | BLOCKED | No paywall screen exists. Settings has no Plan row. Required content is specified in `docs/legal/in-app-disclosures.md` and TDD 08. | Payments engineer, content |
| 6.10 | Free allowance gate (2 free letters, then Plus) | BLOCKED | Decided in D-051; eight edges still open (family letters, second child, what happens mid-recording at the limit, etc., pricing memo section 5). LEGAL-REQ-062 (never discard what was just said) is "pending founder". | Founder |
| 6.11 | Sandbox test sign-off (S-1 to S-10) | BLOCKED | BL-222 `blocked (BL-215, BL-218)`; signed evidence goes in `docs/qa/evidence/`, which does not exist. | Founder, payments engineer |
| 6.12 | Review screenshot and review notes for each subscription | UNKNOWN | Apple asks for a screenshot of the purchase screen per product. Cannot exist until 6.9. | Payments engineer |
| 6.13 | Offer codes | READY (runbook) | `docs/ops/OFFER_CODES.md`. Needs 6.4 and the Redeem a code row (BL-213 scope). Free-period lengths Apple allows are unverified in the repo. | Founder |
| 6.14 | Auto-renewal notices (acknowledgement, trial, renewal windows) | BLOCKED | D-022 table, counsel to confirm. Scheduler is M8, weeks 9 to 12. | Payments engineer |

---

## 7. Release engineering gates before any external build

| # | Line | Status | Evidence and gap | Owner |
|---|---|---|---|---|
| 7.1 | `npm test`, `npm run typecheck`, `npm run test:db` green | UNKNOWN | CLAUDE.md requires it before every commit. Not run for this audit. CI exists in `.github/workflows/ci.yml`. | QA engineer |
| 7.2 | Branch protection on `main` (BL-005, BL-004) | UNKNOWN | `ci.yml` present; protection setting is outside the repo. | Founder |
| 7.3 | Supabase staging and production projects (BL-107) | UNKNOWN | `supabase/migrations` has 7 files; none applied remotely per BL-015 text. Production migrations only from CI on a tag (D-041). | Founder |
| 7.4 | Sync engine decision D-023 (answer was due 16 Oct) | UNKNOWN | `docs/DECISIONS.md` index still shows "Recommended (needs founder OK)". | Founder |
| 7.5 | Shared voice decision D-032 (answer was due 23 Oct) | UNKNOWN | Same; still "Recommended". Drives the privacy label and the microphone string. | Founder |
| 7.6 | Safety classifier or static resources row (D-034, clinician by Fri 20 Nov) | UNKNOWN | BL-105. | Founder |
| 7.7 | Hindi script default (D-031, by 30 Oct) | UNKNOWN | Needs the 14-recording experiment (`npm run experiment`, Mac). | Speech engineer |
| 7.8 | Beta label decision (D-030) | UNKNOWN | Recommended: no beta label in the store listing (Apple 2.2 keeps betas on TestFlight, per TDD 10 item 4). Today `store.en.ts` ends with a beta paragraph and `promotionalTextBeta` exists. The Settings screen shows a "beta" card (`settings.about.beta`). | Founder |

---

## 8. App Store Connect field-by-field inventory

"Value today" quotes the repo. Limits are the ones written in `packages/content/src/store.en.ts`; confirm in App Store Connect.

### 8.1 App Information

| Field | Value today | Status | Gap |
|---|---|---|---|
| Name | "Early Letters: Memory Book" (26 of 30) from `brand.storeName` | READY | Availability in App Store Connect and trademark clearance UNKNOWN (2.11). |
| Subtitle | "Baby memory book in your voice" (30 of 30) | READY | At the limit; any edit must shrink it. |
| Bundle ID | placeholder `com.example.scribe` | BLOCKED | 3.1, 3.2. |
| SKU | none | UNKNOWN | Founder picks; cannot change later. |
| Primary language | English (US) implied | READY | Only `*.en.ts` content exists. |
| Primary category | Lifestyle | READY | Decided in `docs/ROADMAP.md` and LEGAL checklist (not Health). Secondary category not decided. |
| Content rights declaration | not in repo | UNKNOWN | Answer about third-party content (fonts, photos in `assets/photos`, sounds). Licences for those assets are not recorded in the files read. |
| Age rating questionnaire | not in repo | UNKNOWN | Product is 18+ only via an in-app gate (D-006), not Kids category (LEGAL checklist line 726). The questionnaire answers and resulting rating are not recorded. Apple's current rating and age-assurance rules should be re-read at the time. |
| Privacy Policy URL | `example.com/privacy` | BLOCKED | 5.2. |
| Privacy Choices URL (optional) | none | BLOCKED | 5.7. |
| License Agreement | none | BLOCKED | 5.3. |
| Availability / territories | United States only | READY (decision) | LEGAL-REQ-058; evidence screenshot required by the release checklist. |
| App price | Free with in-app subscriptions | READY | Plus is the only paid path (ADR 0013). |
| Tax category | not in repo | UNKNOWN | Founder with accountant. |
| Trader status (EU) | not in repo | UNKNOWN | Relevant only if distributed in the EU; the plan is US only. |

### 8.2 Version page (1.0.0)

| Field | Value today | Status | Gap |
|---|---|---|---|
| Promotional text | 154 of 170 | READY | Contains no price. Safe to edit after release without a new build. |
| Description | 3,369 of 4,000 | BLOCKED | Contains $3.99 and $29.99 (6.2); ends with an "in beta" paragraph (D-030); describes features not in the current build (see 10.3). |
| Keywords | 95 of 100 | READY | `journal,diary,keepsake,newborn,parents,milestones,family,grandparents,audio,bilingual,scrapbook`. |
| Support URL | none | BLOCKED | 5.5. |
| Marketing URL | `https://earlyletters.com` | READY | Live state UNKNOWN. |
| What's New | 213 characters (`whatsNewV1`) | READY | Promises "invite family", "export as a PDF", which the build cannot do today (10.3). |
| Copyright | none | UNKNOWN | Year plus owner; the owner is the founder's legal name, entered only in the console and legal documents (D-004), never in code. |
| Screenshots | 6 captions written (26 to 34 characters; limit 40) | BLOCKED | No screenshot files exist in the repo. Required device sizes are not recorded here; read App Store Connect's current requirements. `supportsTablet: false` in `app.config.ts`. Real screens depend on the feature freeze (7 to 11 Dec). Use only the fictional family "Asha" (CLAUDE.md privacy rules). |
| App preview video (optional) | none | READY | Optional. |
| Build | none uploaded | BLOCKED | Section 4. |
| Version release method | not decided | READY | Recommendation in 12: manual release, so the website flip can be timed. |
| Phased release | not decided | UNKNOWN | Founder. |

### 8.3 App Review Information

| Field | Value today | Status | Gap |
|---|---|---|---|
| Contact name, phone, email | none | UNKNOWN | Founder. |
| Sign-in required / demo account | none | BLOCKED | Sign-in is Sign in with Apple plus email link and code (D-044). A reviewer cannot receive an email code; a demo account that works without one is needed, and the mechanism is not designed. BL-283 owns the template; it is `blocked (BL-275)`. |
| Review notes | none | BLOCKED | Must cover: what the app does; 2 free letters then Plus; how to reach the paywall; the sandbox account; microphone use; the model download (size, host); positioning against 5.1.1(ix) (individual publisher, no health service, Lifestyle category, no health claims in metadata). ROADMAP M13 and BL-286 list the same. |
| Attachment | none | UNKNOWN | Optional walkthrough video. |

### 8.4 App Privacy (nutrition label)

| Field | Value today | Status | Gap |
|---|---|---|---|
| Tracking | No | READY | `docs/legal/app-store-privacy-labels.md` 1.1: no ad SDK, no IDFA, no ATT prompt. Confirm `NSUserTrackingUsageDescription` stays absent. |
| Data types | Drafted in the same file, section 1.2, version 1.2.1, `draft-for-counsel` | BLOCKED | Must match the binary submitted. Draft claims collected: Name, Email, Sensitive Info (pregnancy), Photos, Audio, Other User Content, User ID, Purchase History, Product Interaction, Crash, Performance, Other Diagnostics. The current build collects none of it off the device (no network code; no SDKs). BL-231 should render the label from the data map for the exact build; it is `blocked (BL-016)`. Photo upload is in the draft but photos under per-book keys are listed as later work in ROADMAP section 6 (BL-314): reconcile. Mid-way changes (OTA, new SDK) must follow the OTA policy. |
| Privacy Policy URL | see 8.1 | BLOCKED | |

### 8.5 Subscriptions (inside the app record)

| Field | Value today | Status | Gap |
|---|---|---|---|
| Group reference name and group display name | "Plus" (name from `packages/brand`) | READY | TDD 08 section on products. |
| Product reference names, product ids | `el_plus_monthly_399`, `el_plus_annual_2999` in docs | BLOCKED | 6.3. |
| Duration | 1 month, 1 year | READY | |
| Price (US) | $4.99, $49.99 | READY (figures) | Price point availability unchecked (6.4). |
| Introductory offer | 1 month free (monthly), 2 months free (yearly), new subscribers | READY (decision) | Created in console: UNKNOWN. |
| Localised display name and description | not in repo | UNKNOWN | `docs/legal/in-app-disclosures.md` holds the sheet copy; store description of each product is not written. |
| Review screenshot | none | BLOCKED | 6.12. |
| Family Sharing | Off | READY (decision) | BL-103. |
| Billing Grace Period | 16 days | READY (decision, D-048 Recommended) | |
| Server Notifications V2 URLs | none | BLOCKED | 6.7. |
| Offer codes | planned | READY | 6.13. |

### 8.6 TestFlight

| Field | Value today | Status | Gap |
|---|---|---|---|
| Beta App Description, feedback email, what to test | none | UNKNOWN | BL-280. Welcome note must not include letter screenshots. |
| Beta App Review contact and demo account | none | BLOCKED | Same demo-account gap as 8.3. |
| Internal testers (C0) and external groups (C1) | plan only | UNKNOWN | D-045: founding family, then 15 to 25 families for 3 weeks. Public link optional, after submission. A public link is a D-004 entity trigger. |
| Export compliance | not set | UNKNOWN | 3.9. |

### 8.7 Agreements, Sign in with Apple, other

| Field | Status | Gap |
|---|---|---|
| Paid Applications Agreement | UNKNOWN | 2.5. |
| Sign in with Apple Services ID, key, rotation date | UNKNOWN | BL-053 `blocked (BL-100)`. |
| SMTP for email sign-in links (SPF, DKIM, DMARC) | UNKNOWN | Resend is wired for the website list on `send.earlyletters.com`; the auth mailer is a separate Supabase SMTP task (BL-053). The runbook warns never to touch the Resend records. |
| Apple Search Ads / campaign provider token `pt` | UNKNOWN | Optional; generated by Apple on the first campaign link (`launch.ts` comment). |

---

## 9. Google Play Console inventory (later; not on the v1.0 critical path)

Android is out of v1.0 (ROADMAP section 6; BL-311 for billing; BL-288 parity build, `blocked (BL-031)`). Nothing below should delay iOS.

| Field | Status | Evidence and gap |
|---|---|---|
| Developer account and identity verification | UNKNOWN | 2.8. |
| Package name | BLOCKED | `app.config.ts` uses the same id as iOS (`android.package`), so it inherits 3.1. Cannot change after first upload. |
| App signing (Play App Signing) and upload key | UNKNOWN | Not in repo. |
| Build format and version code | UNKNOWN | No Android build in CI (BL-288). `versionCode` is not set in `app.config.ts`; the remote version source in `eas.json` would manage it, not verified. |
| Adaptive icon | BLOCKED | Files are scaffold (`android-icon-*.png`), same as 4.7. |
| Store listing text and graphics (feature graphic, screenshots) | UNKNOWN | `store.en.ts` is iOS-worded: it avoids other platforms' names by design (App Review 2.3.10 per the file header), and a Play listing needs its own copy. |
| Data safety form | READY (draft) | `docs/legal/app-store-privacy-labels.md` section 2. Needs the same reconciliation as 8.4. |
| Target audience and content: adults 18+, not Families program | READY (decision) | Section 2.1 of the same file; marked unverified there. |
| Account deletion URL | BLOCKED | 5.6; Play needs the web page, and BL-310 (full web flow) is "before Android". |
| Google Play Billing | BLOCKED | ADR 0013 is Apple-only; BL-311 decides direct integration or RevenueCat for both stores. Plus prices on Play are not decided in the repo. |
| Testing track requirements for new accounts | UNKNOWN | Not in the repo; check Google's current rules. |
| Org vs personal account | UNKNOWN | D-004 transfer triggers include "Android". |

---

## 10. Review-risk list

Ranked by likelihood times impact for the first submission. Rule numbers are Apple App Review Guidelines as cited in the repo's own documents; re-read the current text at submission.

| # | Risk | Rule | What the repo shows | Mitigation and owner |
|---|---|---|---|---|
| 10.1 | Unfinished controls visible in the build | 2.1 completeness, 4.2 minimum functionality | `apps/mobile/src/app/settings/index.tsx` renders Export, Delete account and Terms rows as `disabled` with "not yet" subtitles, and a signed-out account row. The Family tab invite is disabled ("Invites need sign-in"). A reviewer sees a local-only recorder with stubs. | Do not submit until M5 (accounts), M6 (family), M9 (deletion), M4 (export) land, or hide unbuilt rows and cut the claims. Mobile engineer. |
| 10.2 | Core feature depends on a first-run 574 MB model download from an undecided host | 2.1, 4.2 | `model-files.ts` has directories only; host is D-046 open; BL-143 not done. Review devices and networks are not ours. | Decide host; test on cellular and slow Wi-Fi; give a clear state when the download is pending; review notes explain it. Speech engineer. |
| 10.3 | Metadata describes things the binary does not do | 2.3.1 accurate metadata | `store.en.ts` promises family invites from the app, encrypted optional backup with a recovery key, export to ZIP and PDF, cloud-free transcription on device. Current build has none of the first three. | Write final listing from the C1 build, not from the PRD. Content. |
| 10.4 | Microphone purpose string mentions features that do not exist | 5.1.1 purpose strings; permission copy accuracy | `apps/mobile/src/lib/permission-copy.ts`: "...unless you choose to back them up, share them with family, or use cloud transcription." Server transcription is out of v1.0 (ROADMAP section 6). Text is "counsel review pending". Speech recognition permission is deliberately not requested (LEGAL-REQ-007: microphone only, whisper on device); the plugin config sets `enableBackgroundRecording: false` and `enableBackgroundPlayback: false`, so no `UIBackgroundModes audio`. | Align the string to v1.0 behaviour after D-032; inspect the built `Info.plist` for stray `NSSpeechRecognitionUsageDescription` or background modes. Legal, mobile engineer. |
| 10.5 | Subscription presentation | 3.1.1, 3.1.2 | No paywall exists. Rules the repo itself flags: describe what the subscription gives before asking, show price and trial end and what it renews to, restore purchases, Terms and Privacy links, no own unlock mechanism (offer codes only through Apple). A freemium gate at letter 3 is the product's core action, flagged unverified in the pricing memo. | Build the paywall to `docs/legal/in-app-disclosures.md`; sandbox S-1 to S-10; state the 2-letter limit near the buy button. Payments engineer, counsel. |
| 10.6 | Account creation without in-app deletion | 5.1.1(v) | Delete row disabled. D-042 allows a static page plus email route at v1.0 for the web, but the in-app flow (30-day undo, export first) is in M9 (no single task id was confirmed). | In-app deletion working before any build with sign-in goes to review. Privacy engineer. |
| 10.7 | Privacy label does not match the binary | 5.1.1, 5.1.2 | Draft label (section 8.4) lists collection the current build lacks, and analytics and crash SDKs with opt-in consent are not installed (D-003). Apple compares the label to behaviour; OTA changes can drift it (TDD 01 R-04). | Render the label from the data map for the exact build (BL-231). Network-capture test proving zero requests before consent (M10). Privacy engineer. |
| 10.8 | Consent for analytics | 5.1.1(ii) | D-003: opt-in only, third ask; nothing queued before consent. Code not wired. | Ship only with the capture test passing. Analytics engineer. |
| 10.9 | Individual developer submitting an app that holds sensitive information about children | 5.1.1(ix) | D-004 point 4 rates it medium likelihood, high impact, quoting the guideline. The label declares Sensitive Info (due date). Metadata must avoid health language. | Lifestyle category; review notes framing; prepared reply; fall-back is entity plus organisation account (2 to 6 weeks, unverified). Founder, counsel. |
| 10.10 | Sign in with Apple and login rules | 4.8, 5.1.1(v) | D-044 offers Sign in with Apple and email link plus code, so the equivalent-login rule is met on paper. Not built (BL-171, BL-051). | Test email-link return on a clean device via universal links (3.6, 3.7). Mobile engineer. |
| 10.11 | Beta wording in the store listing | 2.2 | `store.en.ts` ends "Early Letters is in beta"; Settings shows a beta card. | D-030: keep betas on TestFlight, drop the paragraph for 1.0. Founder, content. |
| 10.12 | Age assurance and an adult-only app with a child's data | Age rating, Texas SB 2420 and Declared Age Range, per CR-004 | Local 18+ gate exists (`age-gate.ts`, boolean only). No Declared Age Range code. | Counsel to say what is required; set rating accordingly. |
| 10.13 | Crash or hang on review devices | 2.1 | No device runs recorded (BL-044, BL-135). Crash visibility rests on Xcode Organizer and TestFlight before consent (TDD 01 R-07). | Release gate: crash-free sessions 99.8 percent or more in C1 (ROADMAP M12). QA. |
| 10.14 | Name and trademark | 5.2 intellectual property, 2.3.7 | "Not yet trademark-cleared" in brand file. | Counsel. |
| 10.15 | Reviewer cannot sign in | 2.1 | Email-code sign-in has no demo path (8.3). | Demo account or a reviewer bypass that is not a dev shortcut: `devShortcutsAllowed` is false outside the development profile by design (`build-env.ts`), so a reviewer path must be a real account. Mobile engineer. |
| 10.16 | Placeholder or scaffold assets in the binary | 2.1, 4.1 | Scaffold icon files, `assets/images/react-logo*`, `expo-badge*`, `tutorial-web.png` still in `apps/mobile/assets/images`. | Remove unused scaffold images; ship the brand icon. Design. |

---

## 11. Screenshot and metadata deadlines

The repo gives these dates (`docs/ROADMAP.md`). Anything else is a proposal, marked P.

| Item | Date | Source or note |
|---|---|---|
| Hindi script decision and 14-recording experiment | Fri 30 Oct 2026 | D-031 |
| Counsel receives the full document package | week 5 (2 to 6 Nov) | BL-104 |
| Go or cut checkpoint | week 6 (9 to 13 Nov) | ROADMAP section 3 |
| Clinician answer on safety copy | Fri 20 Nov | D-034 |
| Cohorts recruited | Fri 4 Dec | D-045 |
| Feature freeze, external C1 build to Beta App Review | Fri 11 Dec (week 10) | ROADMAP M12. Apple's year-end closure dates are not in the repo (marked U in ROADMAP). |
| C1 beta | 14 Dec to 8 Jan | ROADMAP M12 |
| Screenshots capture (P) | 14 to 18 Dec, from the frozen C1 build | UI is frozen after 11 Dec, so captures cannot go stale. |
| Store beta-line decision D-030 | before the listing is final, week 14 | ROADMAP section 3 |
| Listing text final, privacy labels with evidence, review notes, counsel sign-off | 4 to 8 Jan | BL-286, ROADMAP M13 |
| Submit | Mon 11 Jan 2027 | ROADMAP |
| Buffer for one rejection cycle | 18 to 29 Jan | ROADMAP |

---

## 12. Launch-day sequence

Source: `docs/ops/WEBSITE_RUNBOOK.md` section 6 and `apps/web/src/lib/launch.ts`. The flip is a Vercel redeploy, not a toggle: `NEXT_PUBLIC_*` values are inlined at build time.

How the switch works (verified by reading `launch.ts`): `launch.mode` is `live` only when `NEXT_PUBLIC_APP_STORE_URL` is a valid `https://apps.apple.com/.../id<digits>` link. A TestFlight link, a typo or a look-alike host is ignored and the site stays on the email form; the build log prints `[launch] NEXT_PUBLIC_APP_STORE_URL is set but ignored`. `appStoreHref(placement)` adds `pt` and `ct=web-<placement>` when a provider token exists.

Recommended release method: choose "manually release" in App Store Connect, so approval and the website change happen together (a proposal; the repo does not decide it).

| Step | When | Action | Check | Owner |
|---|---|---|---|---|
| L-7 | A week before | Confirm 2.5, 6.4, 5.2 to 5.7 are live; update `/privacy` and `/terms` (they currently say the app is not out, `privacy-copy.ts`, `terms-copy.ts`) or replace them with the app versions; confirm Vercel plan is Pro (runbook open item 4). | `curl` each URL returns 200. | E1, E3 |
| L-3 | Three days before | Approval received. Verify the price shown in the website pricing section equals `pricing.ts` and equals the price in App Store Connect. Prepare the launch email in Resend (segment `RESEND_SEGMENT_ID`); send from Resend, not from the site. | Visual check. | E3, content |
| L-1 | Day before | AASA check (runbook section 8): 200 JSON, no redirect, both app ids, three paths. Apple's CDN copy can lag up to 24 hours, so do this early. | `curl` as in the runbook. | E3 |
| L0 a | Release | Press "Release this version". Wait until the product page opens on an iPhone. The runbook's precondition: the app is released, not only approved. | Open `https://apps.apple.com/us/app/<name>/id<digits>` on a device. | Founder |
| L0 b | Right after | Copy the product link. Optionally create a campaign link in App Store Connect and note the `pt` digits. | | Founder |
| L0 c | | In Vercel set `NEXT_PUBLIC_APP_STORE_URL` (Production only) and, if used, `NEXT_PUBLIC_APPLE_PROVIDER_TOKEN`. Redeploy production without build cache. | Build log has no `[launch] ... ignored` line. | E3 |
| L0 d | | Live check (runbook section 9 part E): the home page shows the badge and every App Store link begins `https://apps.apple.com/`; no email form. Click the badge on an iPhone. | | E3 |
| L0 e | | Run the link-page checks for `/j`, `/auth/confirm`, `/auth/callback` (200, long-press offers to open in app). | | E3 |
| L0 f | | Send the launch email to the Resend segment. | | Content |
| L0 g | | Watch Xcode Organizer crashes and App Store Connect metrics; sandbox-free live purchase test with a real account if the founder agrees. | | QA, payments engineer |
| Rollback | Any time | Unset `NEXT_PUBLIC_APP_STORE_URL` and redeploy, or Vercel Instant Rollback to the last prelaunch build (runbook section 7). Note a rollback does not undo env vars. | | E3 |
| Day 2 to 7 | | Decide the `/j` button behaviour (the runbook says the PRD wants copy-then-App-Store; not built). Reply to App Review within a day if contacted. | | Founder |

Open gap: the repo has no test that the home page uses only `appStoreHref()` after the flip beyond the unit tests of `launch.ts` and the e2e in `apps/web/e2e`; the runbook relies on the manual check in L0 d.

---

## 13. Dated plan with owners

Dates marked R come from `docs/ROADMAP.md`; P is a proposal that keeps the R dates. Today is Wed 28 Oct (week 4). M0 items that were due in weeks 1 to 3 are overdue on paper.

| Date | What | Owner | Source |
|---|---|---|---|
| Thu 29 Oct | Confirm in writing the state of: Apple enrolment, domain and mailboxes, Paid Applications Agreement, EAS account, Supabase projects. Record each in `docs/qa/evidence/` or this file. | Founder | P |
| Fri 30 Oct | Merge the BL-100 PR: real domain, support email, privacy URL into `packages/brand`. Founder confirms the bundle id `com.earlyletters.scribe` (or states another). Single support address chosen (`hello@` or `support@`). | Founder, mobile engineer | R (BL-100 wk 1), P |
| Fri 30 Oct | D-031 answer after the 14-recording experiment. | Speech engineer | R |
| Fri 30 Oct | Answer D-023, D-032, D-030 (all past due or imminent). | Founder | R (16 and 23 Oct), P |
| Mon 2 Nov | Decide product ids for $4.99 and $49.99 (6.3). Update docs. | Founder, payments engineer | P |
| Wed 4 Nov | Update `store.en.ts` and `site.en.ts` to the `pricing.ts` figures; add a guard test for `packages/content`. | Content | P |
| Fri 6 Nov | Counsel package out (Terms 2.0.0, Privacy 1.4.0, CHD notice, Subscription terms 2.0.0, in-app disclosures 2.0.0, claims registry). | Founder, counsel | R |
| Fri 6 Nov | App Store Connect: app record, subscription group, two products, intro offers, grace period, US only, Paid Applications Agreement accepted. | Founder | R (wk 3 plan, late) |
| Fri 6 Nov | Add `/support`, `/delete-account`, `/privacy-choices` pages (BL-243) and the pricing-aware Subscription terms route; add the icon set. | E1, privacy engineer, design | P |
| Fri 6 Nov | Fix `eas.json`: store distribution for the TestFlight profile, `autoIncrement` on it, `ascAppId`, EAS project id; add Sign in with Apple and Associated Domains to `app.config.ts`. | Mobile engineer | P |
| 9 to 13 Nov | Go or cut checkpoint. Start C0 internal TestFlight on the founding family's phones. Set `APPLE_TEAM_ID` and `IOS_BUNDLE_ID` in Vercel. | Founder, QA | R |
| Fri 20 Nov | Clinician answer (D-034). | Founder | R |
| 23 to 27 Nov | Paywall and Plus sheet built to disclosures (M8); sandbox checklist begins. | Payments engineer | R/P |
| Fri 4 Dec | Beta cohorts recruited (D-045). | Founder | R |
| Mon 7 to Fri 11 Dec | Feature freeze. Sandbox S-1 to S-10 signed. External C1 build to Beta App Review by Fri 11 Dec. Demo account and review-notes template ready. | Founder, QA | R |
| 14 to 18 Dec | Capture screenshots from the frozen build (fictional family "Asha"). | Design, content | P |
| 14 Dec to 8 Jan | C1 beta. Exit: zero open S0/S1, crash-free sessions 99.8 percent or more. | QA | R |
| 4 to 8 Jan | C1 exit review. Counsel sign-off. Listing final (D-030 applied). Privacy labels entered with evidence. Review notes written. Territories = US evidence saved. | Founder, content, counsel | R |
| Mon 11 Jan | Submit to App Review. | Founder | R |
| 12 to 15 Jan | Answer any reviewer message within a day. | Founder | R |
| Week of 18 Jan | Release on approval; launch-day sequence (section 12). | Founder, E3 | R |
| 18 to 29 Jan | Buffer for one rejection cycle. | | R |
| After release | Entity decision before public TestFlight link, paid marketing, 1,000 families, Android (D-004). Play Console work starts after that decision. | Founder | D-004 |

Slip risk, from the roadmap itself: moderate confidence; the most likely slip is 2 to 4 weeks (early February), from transcription performance or family plus shared voice. The overdue M0 items and unanswered D-023 and D-032 put the Monday 11 Jan date at risk unless the first two rows of the plan above close this week.

---

## 14. Top 10 blockers

1. Placeholder identity in `packages/brand`: domain `example.com`, support email and privacy URL placeholders, so the production bundle id would be `com.example.scribe`, which cannot be changed after the first upload (BL-100, 3.1, 3.2).
2. No evidence of Apple Developer enrolment, Paid Applications Agreement, EAS account or an App Store Connect app record. The roadmap had these due 5 to 23 Oct (2.1, 2.5, 2.7, 3.4).
3. The app build is not reviewable: no sign-in, sync, purchase, export, account deletion or family invites; Settings shows disabled "not yet" rows (10.1, 10.6).
4. No app privacy policy or app terms are published. `/privacy` and `/terms` cover the website only, the app documents are unreviewed drafts, and counsel sign-off is pending (5.2 to 5.4, BL-104).
5. Required store URLs missing: `/support`, `/delete-account`, `/privacy-choices`; the in-app privacy link goes to `example.com` (5.5 to 5.7).
6. Pricing disagreement: `store.en.ts`, `site.en.ts` and the legal drafts still say $3.99 and $29.99 against `pricing.ts` at $4.99 and $49.99; the documented product ids encode the old prices and cannot be reused once created (6.2, 6.3).
7. Open founder decisions that gate scope and copy: D-023 (sync, due 16 Oct), D-032 (shared voice, due 23 Oct), D-030 (beta label), D-031 (30 Oct), D-034 (20 Nov), D-046 (model host), and the eight D-051 open edges (7.4 to 7.8, 6.10, 4.9).
8. Purchase stack does not exist: no `expo-iap`, no `supabase/functions`, no notifications endpoint, no paywall, no sandbox evidence; the agents brief contradicts ADR 0013 on the endpoint (6.6, 6.7, 6.9, 6.11).
9. EAS and TestFlight path is not workable as configured: preview is `internal` (ad hoc), no `autoIncrement` outside production, no `ascAppId`, no EAS project id, no Sign in with Apple or Associated Domains capability, no privacy manifest, no export-compliance answer, no release workflow (4.2 to 4.4, 3.6, 3.9, 3.10, 4.6).
10. Review package is missing: scaffold app icon, no screenshots, no demo account for an email-code sign-in, no review notes, and the 5.1.1(ix) individual-publisher positioning is only a plan; store description promises features and a beta paragraph that conflict with Apple 2.2 and 2.3.1 (4.7, 8.2, 8.3, 10.3, 10.9, 10.11).

---

## 15. Conflicts found in the repo that need one answer

| Topic | Place A | Place B | Needed |
|---|---|---|---|
| Plus prices | `apps/web/src/content/pricing.ts`: $4.99 and $49.99 | `store.en.ts`, `site.en.ts`, Terms 14.2, Subscription terms, D-012, ADR 0013, TDD 08: $3.99 and $29.99 | One decision recorded in `docs/DECISIONS.md` (new dated entry) and all copy updated. |
| Support address | `apps/web`: `hello@earlyletters.com` | BL-100: `support@` and `privacy@`; `brand`: `support@example.com` | One address per purpose, in `packages/brand` and the site. |
| Notifications endpoint | ADR 0013 and BL-214: yes | `docs/agents/BRIEF-2026-10-03.md` item 3: no endpoint, no server enforcement | Pick one. |
| TestFlight distribution | TDD 01 3.10: preview is internal TestFlight | `eas.json`: `distribution: internal` | Align config to the plan. |
| Photos | Privacy label draft: photos uploaded to `entry-photos` | ROADMAP section 6: photos under per-book keys later (BL-314) | Align label and scope for 1.0. |
| Microphone string | Mentions cloud transcription | ROADMAP: server transcription out of v1.0 | Align after D-032. |
| Beta label | `store.en.ts`, Settings card: beta | D-030 recommends none in the store listing | Founder. |

---

## 16. Known issues in the store art and screenshots

Every PNG under `docs/store/art` and `docs/store/screenshots` was viewed before this pack was opened for review. No wrong prices, clipped text or placeholder text were found. The text of the listing, captions and compliance pages has no dashes, curly quotes, ellipsis characters or emoji, and the only family name is the fictional Asha. Remaining cosmetic points, not fixed:

| Item | Where | Note |
|---|---|---|
| Large empty lower half | `03-review` (all sizes) | The phone screen is about 40 percent blank below the letter text. A fuller review screen (the "put it back" control, the confirm button) would carry more of the story. |
| Empty space inside cards | `04-book` (all sizes) | Month cards have blank space under the count line, where a cover or first line would sit. |
| One-word last line | `promo-story-1080x1920-night.png` | The subline wraps so "talking." sits alone. |
| Fixed fictional data | all screenshots | "Papa", "Mama" and Asha, month 9, letter counts 12, 11, 9. These are mock data and must match the build that is submitted. |
| Screenshots show an app that is not built | all screenshots | Superseded 1 Nov 2026: the frames are now captured from the real app (`docs/store/screenshots/README.md`). |
