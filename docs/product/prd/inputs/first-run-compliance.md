# First run: compliance and risk-check input (download to first letter)

Status: WORKING-INPUT | 20 Nov 2026 | Owner: `regulatory-affairs` | Replaces: none | Load when: a compliance or risk check of the first run (NS-38 to NS-45).

Status detail: input for design and the locked pack, 20 Nov 2026. Author: `regulatory-affairs` (engineering reading, confirm with counsel). Reviewed by: nobody yet; the CCO role signs any change to a fenced path. Not legal advice. Every legal reading below is "counsel must confirm". Counsel numbers are COUNSEL_PACKET 1.5.0 (`docs/legal/COUNSEL_PACKET.md`, dated 2026-11-01); a new question is marked "new, needs a number from legal".

Repo read: `/home/claude/earlyletters`, branch `docs/locked-pack-inputs-20nov` at 543516611. "Built" means present on that branch. Whether a migration is applied to the production project (`scribe-prod`) is not recorded in the repo: `.github/migrations-applied.txt` lists only files 1 and 2 for the older `early-letters` project, so every server control below is "in code, production apply UNVERIFIED" unless stated.

How to read the tags: [B] built, with file:line; [C] what the cards (PRD v2 F01, F02, F03, F12, F17, F21, and the locked frame) say; [L] what a law or store rule needs, from a source read today; [R] my recommended default.

---

## 1. Launch countries and storefronts (as decided)

| Item | Decision | Source | Status |
|---|---|---|---|
| Storefront | United States App Store only | D-006 to D-014 (US-only), LEGAL-REQ-058, F21-REQ-005, Privacy 12 ("offered only on the United States App Store") | [B] not checkable in repo; F21-REQ-005 marks ASC setting "Not built (FT-43, BL-286)"; founder sets it in App Store Connect |
| Data location | United States (Supabase, one US region) | D-067, Privacy 12 | Founder confirms the project region in the dashboard (UNVERIFIED here) |
| Age rating | Overridden to 18+ in App Store Connect; Lifestyle | F21-REQ-005 | Founder step, not built |
| EU, UK, India, Canada | Not offered. Full GDPR programme before any EU/UK launch | Register CR-100, launch geography note (register line 23), Q22 | GDPR/UK not read this session; nothing in this pack serves those regions |
| Blocked places at sign-up | KP, IR, CU, SY, RU, BY at the auth hook; Crimea, Sevastopol, Donetsk, Luhansk on the web contribution page only | D-131, D-136 (disclosure), D-137 (no name screening) | [B] not on `develop`: the migration lives only on `origin/feat/db-compliance-gates` (ed190f4cf, 1 Nov), APPLY.md "File 28" |
| Android, Google Play | Later (D-059, C-39 parked) | frame section 9 | Out of scope |
| Web contribution page | Later (D-055) | D-131 | Out of scope; when it ships it must pass every check in section 2 |

What the storefront does and does not do [L]: Apple's help says the customer's Apple Account country "determines the App Store country or region where they can purchase apps"; deselecting a country removes the app there, but people who already downloaded keep receiving updates and can redownload. Source: https://developer-rno.apple.com/help/app-store-connect/manage-your-apps-availability/manage-availability-for-your-app-on-the-app-store (read 20 Nov 2026, primary). Engineering reading: the US-only storefront restricts by account country, not by where the phone is. A US Apple Account used abroad can install. The only place control that looks at location is the D-131 sign-up check, which is not built. Counsel must confirm (Q57 (c)).

OFAC program list, read 20 Nov 2026 (https://ofac.treasury.gov/sanctions-programs-and-country-information, primary): 36 programs; Cuba (updated 5 Nov 2026), Iran (9 Nov 2026), North Korea (28 Oct 2026), Belarus (21 Oct 2026), Russian Harmful Foreign Activities (19 Nov 2026), Ukraine-/Russia-related (9 Oct 2026), Venezuela (4 Nov 2026). No Syria program is listed (consistent with checked-facts, 31 Oct). The page gives names and dates only; I did not open the program pages, so whether any November update changes a general licence that touches consumer internet services is UNVERIFIED. Action for `regulatory-affairs`: open the Cuba and Iran updates before the D-131 revisit (D-131 says "before each store submission").

---

## 2. Every risk check in the journey

Order on the phone today (Build 12, server features on in the `production` profile, `apps/mobile/eas.json:55-67`): install, Before you begin (age question plus agreement box), Welcome, sign in (Apple, Google or email), consent sheet (Terms line with 18+ confirmation, sensitive-data consent), claim screen if the phone already holds letters, child step, signature, first letter. The cards (F01, F02) still describe the older letter-first order; section 6 lists that drift.

### 2.1 Adults only: the 18+ question (every install)

| | |
|---|---|
| Legal or store basis | Founder decision D-006 (adults only, no local-only minor mode), D-026, LEGAL-REQ-002, Terms 2.1. Store: 5.1.4 asks care with kids' data; 2.3.8 keeps "For Kids" metadata for the Kids Category (read 20 Nov, https://developer.apple.com/app-store/review/guidelines/). COPPA turns on "directed to children" or "actual knowledge" of collection from under-13s (Federal Register 2025-05904, read 20 Nov); an 18+ gate is the evidence we do not knowingly collect from children. Counsel must confirm |
| Must collect | Nothing about age except the answer |
| Must not collect | Age, birth date, age range, time of a Yes (D-026, PRIV-R21 "never" list) |
| Where it runs | Phone only. Root layout renders `AgeGateScreen` instead of any route until pass, so invites and deep links wait behind it |
| Pass | Yes plus ticked box: one transaction writes `ageGate.passed = '1'` and two local agreement rows (Terms 4.1.0, Privacy 3.0.0) [B] `apps/mobile/src/lib/age-gate.ts:89-98`, `apps/mobile/src/lib/agreements.logic.ts:189-205`. Welcome follows |
| Fail | No, then Continue: stop screen, one line "{app} is currently for adults 18 and over" (`packages/content/src/strings.en.ts:1522`); `ageGate.stoppedAt` written; pending invite token deleted [B] `apps/mobile/src/lib/age-gate.ts:72-82`. "I answered by mistake" shows only after 24 h [B] `age-gate-screen.tsx:176-181`, `age-gate.logic.ts:15,35-42` (clock set back never shortens the stop) |
| Nothing selected | [B] `age-gate-screen.tsx:74-75`; Continue never disabled, gives a reason line instead (`agreements.logic.ts:189-195`) |
| Retention | `ageGate.passed`: install lifetime; removed by Erase everything. `ageGate.stoppedAt`: until the next Yes. Reinstall clears both (accepted residual, F01-U05) |
| Shown in export | `account.json` says whether the person answered yes on this phone (`packages/content/src/features/export.en.ts:122`) |
| Server side | The consent sheet records `terms` accept with `context.age_attested: true` [B] `apps/mobile/src/lib/auth/consent.ts:92-119`; the server refuses `age_attested` false and refuses content writes until Terms with the attestation and sensitive-data consent exist (`require_content_consent`, `supabase/migrations/20261003000000_security_and_family.sql:190-201`; allowlist re-stated in `20261108000000_consent_record_fields.sql:143`, pending apply). A No at the sheet's age step ends the session (`session-provider.tsx:311`) |
| Tests | `apps/mobile/test/age-gate.test.ts`, `age-gate-screen.test.ts`, `agreements.test.ts`, `age-gate-erase.test.ts` |
| Not built | The confirm step after No (BL-561, held PR #521, founder and counsel), which F01-REQ-002 still requires |

### 2.2 Store age signal: Apple Declared Age Range (Texas now; California, Alabama, Utah, Louisiana next)

| | |
|---|---|
| Legal or store basis [L] | Apple's age-assurance Q&A, read 20 Nov 2026 (https://developer.apple.com/support/age-assurance, primary): for apps rated 18+, "In regions where legally required, you need to check the age of the people using your app with the Declared Age Range API"; build against the iOS 26.2 SDK or later with Xcode 26.2; when a parent revokes consent Apple blocks launch and sends `RESCIND_CONSENT`. Apple news 3 Jun 2026 (https://developer.apple.com/news/?id=sg176nne, primary): Texas SB 2420 applies to new Apple Accounts in Texas from 4 Jun 2026; developers request age category through Declared Age Range. Texas SB 2420 text (https://capitol.texas.gov/tlodocs/89R/billtext/html/SB02420F.htm, read 20 Nov, primary): Sec. 121.054 developer must verify age category and consent using app-store data; Sec. 121.055 use only for age restrictions, legal compliance or safety, and "shall delete" app-store personal data once verification is done; Sec. 121.056(c) good-faith reliance safe harbor. Status and other states from a secondary source, Privacy World, 19 Nov 2026 (https://www.privacyworld.blog/2026/11/app-store-age-verification-laws-your-questions-answered-updated/): Texas enforceable since 4 Jun 2026, Fifth Circuit decision pending after 4 Aug 2026 argument; California AB 1043 as amended by AB 1856 effective 1 Jan 2027 (devices and apps before that date have until 1 Jul 2027), developer must request the signal at download and launch, treat it as the primary indicator, and is deemed to have actual knowledge from it; Alabama 1 Jan 2027 (CCIA suit filed 28 Oct 2026, injunction motion pending); Utah 6 May 2027 (developer not subject to the private action); Louisiana 1 Jul 2027. California primary text did not load (leginfo client error): UNVERIFIED from primary. Counsel must confirm all of it (Q46) |
| Must collect | Nothing stored. The signal is read in memory for the gate decision |
| Must not collect | The age range, category, method, or response object, anywhere (F01-REQ-003; PRIV-R21; Texas 121.055 deletion duty fits a memory-only design) |
| Where it runs | Phone, at launch, before the 18+ question, where `isEligibleForAgeFeatures` is true (iOS 26.2+). On iOS 17 to 26.1 (our floor is iOS 17, `apps/mobile/app.config.ts:44`) no signal exists; our question decides |
| Pass | Adult signal: still show our one-tap question (F01 6.2a) |
| Fail | Minor signal: stop screen at once, no question, no confirm step; only `ageGate.stoppedAt` written (F01-U20). Signed-in account later signalled minor: actual knowledge, run `docs/ops/runbooks/underage-account.md` |
| Declined, error, timeout over 3 s | Our question decides; declined is not proof of adulthood |
| Retention | None |
| Built status | [B] not built: no Declared Age Range code, module or entitlement anywhere under `apps/mobile` (grep for `DeclaredAgeRange`, `isEligibleForAgeFeatures`, `declared-age-range`: no hits). F01 WP-F01-02 and WP-F01-07 open. Skill check 2 reads `not yet` |
| Engineering reading | This is a live gap, not a future one: Build 12 is on the US storefront (Texas included) with server features on, and Apple's Q&A says 18+ apps must check in regions where legally required. Counsel must confirm whether an 18+ app that never serves minors still has a Texas duty, and whether good-faith reliance needs the call at all (Q46) |

### 2.3 Region and sanctions (sign-up)

| | |
|---|---|
| Basis | D-131 (founder rule, CCO list), D-136 (Privacy 12 disclosure), D-137 (no name screening), Terms 2.4 (confirm not in an embargoed country and not on a US restricted-party list), register CR-121; OFAC and EAR readings in `.claude/skills/regulatory-compliance/references/sanctions.md`. Counsel Q57 |
| Must collect | Nothing kept. The server reads the sign-up request's IP in memory, maps it to a country with DB-IP Lite (CC BY 4.0, attribution required), and decides |
| Must not collect | The IP address, the country of an allowed sign-up, a name for screening, any ID |
| Kept | Daily counts by result, with the country code for refusals only, for 2 years (D-136, Privacy 12) |
| Where it runs | Server: Supabase "before user created" auth hook (planned). The phone does nothing |
| Pass | Nothing visible |
| Fail | Sign-up refused; the app shows the hook's message (copy not written; must not name a list or accuse). Support never asks where the person is (Privacy 12) |
| Name match path | On a report only: `docs/ops/runbooks/sanctions-match.md` (suspend, never delete, counsel same day). Gap: no way to suspend one account without deleting it (runbook "Gaps") |
| Built status | [B] not on `develop`. `ops.restricted_jurisdictions` and the hook are on `origin/feat/db-compliance-gates` only. Privacy 3.0.0 says the check "takes effect only when it ships" (`docs/legal/privacy-policy.md:25`). Q57's own deadline: "before any sign-in outside the family (T22)" |
| Known limits | VPNs; IP geolocation errors; regions (Crimea etc.) cannot be resolved by country data, so the hook relies on Terms 2.4 there. Supabase docs (read 31 Oct, checked-facts) do not say which sign-in methods trigger the hook: Apple and Google ID-token sign-ups must be tested, not assumed |

### 2.4 Device integrity

| | |
|---|---|
| Basis | No law or store rule found that requires it for this product. Not a D-row |
| Built status | [B] none: no App Attest, DeviceCheck or captcha in `apps/mobile/src` (only transitive pods named in `src/lib/privacy-manifest.ts:64-69`, not used) |
| [R] | None for 1.0.x. It would add a device identifier to the privacy label and data inventory for little gain at this size. Revisit if the abuse job (BL-248) pages, or if a free tier is abused. Engineering reading only |

### 2.5 Account abuse limits

| Control | Built | Card or rule |
|---|---|---|
| One sign-in email per address per 60 s | [B] client `RESEND_WAIT_MS = 60_000` (`apps/mobile/src/lib/auth/email.ts:32`); server `max_frequency = "1m"` (`supabase/config.toml:70`, local config; production dashboard value UNVERIFIED) | A-REQ-025 |
| At most 5 emails per address per hour | Not found as a server setting; project-wide `email_sent = 100` per hour (`config.toml:54`) | A-REQ-025, F02-U13: gap |
| Wrong-code pause: 5 wrong in 15 min, pause 15 min | [B] client only, in memory (`apps/mobile/src/lib/auth/errors.logic.ts:80-94`); a reinstall or another phone resets it | A-REQ-027 |
| Server verification limit | `token_verifications = 30` per IP per 5 min; `sign_in_sign_ups = 30` per IP per 5 min (`config.toml:55-56`, local; production UNVERIFIED) | TDD 04 3.1.4 |
| Per-address failure alert (above 20 per hour) | Not built (BL-248, WP-F02-11) | A-REQ-027 |
| Enumeration safety | [B] `shouldCreateUser: true` from every entry (`email.ts:34-39`), so new and returning look the same | F02-REQ-005 |
| Anonymous sign-in off; manual identity linking off | [B] `config.toml:46-47` | K-08 |
| New-device sign-in email | Not built (F02-REQ-017, -025; counsel packet table "planned, not built") | F02 |

Side effect to note: Supabase's passwordless docs (https://supabase.com/docs/guides/auth/auth-email-passwordless, read 20 Nov 2026, primary) say a user who has not signed up "is automatically signed up by default" on an OTP request. So a mistyped address creates an unconfirmed `auth.users` row holding that email, and the D-131 hook (when built) would run at that moment. No purge of never-confirmed users is defined in the repo that I found. See gap G11.

### 2.6 A second account on the same phone

| | |
|---|---|
| Basis | Frame section 7 "Sign-out (ruled 20 Nov)": sign-out keeps the book on the phone; a second account "never sees, claims or uploads the first account's letters" (`[X4-R1]`); privacy (another adult's data, Q48) |
| Must collect | Nothing new |
| Where it runs | Phone |
| Built | [B] claim and upload are blocked: the first account to claim owns the phone's rows (`sync.ownerId`, `apps/mobile/src/lib/sync/ownership.ts:93`, `outbox.ts:14`); another account gets `account_mismatch` and nothing moves (`apps/mobile/src/lib/sync/types.ts:391`; `apps/mobile/src/lib/auth/account-claim.logic.ts:13-17`). Claim needs consent plus a tap on a screen showing the masked email (BL-347) |
| Not built or not proven | "Never sees": the book stays readable on the phone after sign-out by design, so account B signed in on that phone can read account A's local letters unless something hides them. No `[X4-R1]` test exists under `apps/mobile/test`. UNVERIFIED what B sees today |
| [R] | Design must choose one of two honest states and say it on the sign-out sheet: (a) the phone's book stays visible to whoever holds the unlocked phone, signed in or not (true today, matches "sign-out keeps the book"); or (b) a different account sees an empty Home with one line pointing to the first account. (b) is what X4-R1 says. Product and privacy decide; this is not a legal question unless (a) is chosen, then Q48 |

### 2.7 Under-18 or under-13 learned after sign-up (actual knowledge)

| | |
|---|---|
| Basis | LEGAL-REQ-002 last scenario; Terms 2.1 ("If we learn that an account belongs to someone under 18, we will close it"); COPPA actual-knowledge standard; AB 1043 deems the signal actual knowledge (secondary, above) |
| Built | Runbook exists: `docs/ops/runbooks/underage-account.md` (under 13: delete within 10 days; 13 to 17: close, offer export where allowed; content-free audit row; never ask for ID or birth date). Gap: support cannot open a deletion for another person (BL-551) |
| Stored | One `ops.audit_log` row, content-free |

---

## 3. Information collected from download to first letter

Classes per `docs/legal/DATA_CLASSIFICATION.md`: L1 public, L2 internal and low risk, L3 personal, L4 secret.

| # | Field | Why | Required | Validation (built) | Class | Where stored | Retention | In export |
|---|---|---|---|---|---|---|---|---|
| 1 | 18+ answer | Adults only (D-006) | Required | Yes or No, nothing preselected | L2 | Phone settings `ageGate.passed` | Install; Erase everything removes it | Yes, `account.json` |
| 2 | Time of a No | 24 h stop | Only after No | ISO time; clock repair | L2 | Phone `ageGate.stoppedAt` | Until next Yes | UNVERIFIED |
| 3 | Local agreement record (Terms, Privacy: version, action, surface, device time, app version, SHA-256 of the sentence) | Proof of what was agreed before any account | Required to pass | Box unticked on every visit | L2 | Phone, local schema v10 (`lib/db/repos/agreements.ts`) | Install; Erase everything | UNVERIFIED |
| 4 | Email address (email sign-in; also from Apple, may be a Hide My Email relay; from Google) | Sign-in and account mail | Required for the email path | `looksLikeEmail` on submit only (`email.tsx:181-186`); never stored on the phone (memory only, `email.tsx` header) | L3 | Supabase `auth.users`; Resend delivery logs | Until account deletion; Resend's copy per Q51 | Yes, profile in `account.json` (UNVERIFIED field list) |
| 5 | Email code and link token | Prove the inbox | Required for the email path | Length from `EXPO_PUBLIC_EMAIL_OTP_LENGTH`, default 6, accepted 6 to 10 (`email.ts:28-29`); production profile sets none, so 6 | L4 | Supabase; the email; phone memory | Single use; expiry 15 min in `config.toml:74` (production UNVERIFIED; Supabase default is 1 hour) | Never |
| 6 | Apple user id, Google user id | Identify the account | Required for that path | Provider ID token with nonce | L3 | Supabase `auth.identities` | Until deletion | No |
| 7 | Name from Apple (first sign-in only) | Prefill the sign-off | Optional (Apple decides) | Trimmed, at most 60 (`apps/mobile/src/lib/auth/apple.ts:41-44`) | L3 | `profiles.display_name` | Until deletion | Yes (profile) |
| 8 | Google profile data (name, picture URL) | Not used by the app | Not asked | The app saves no Google name (`google.ts`); Supabase may keep provider identity data in `auth.identities` (UNVERIFIED for ID-token sign-in) | L3 | Supabase | Until deletion | No |
| 9 | Apple refresh token | Revoke at deletion (5.1.1(v), Apple deletion guidance) | Automatic | Captured after Apple sign-in (`apple.ts:60`), `apple-token` function | L4 | `ops.apple_tokens`, encrypted, service role | Until revoked at deletion | Never |
| 10 | Session and refresh tokens | Stay signed in | Automatic | JWT 15 min (`config.toml:41`); refresh rotation | L4 | Keychain, this device only | Sign-out, deletion | Never |
| 11 | Server consent rows: Terms accept with `auth` method and `age_attested: true`; sensitive-data accept or decline | LEGAL-REQ-001, -006; PRIV-R21 | Terms required for any server feature; sensitive-data required for sync, decline keeps letters local | Server allowlist and `age_attested` true only | L2 (profile id L3; locale L3) | `public.policy_acceptances`, append-only | Account life, then pseudonymised 3 years (PRIV-R21; Privacy 7) | Yes, `consent_history` when readable |
| 12 | IP address of the sign-up request | Country check (D-131) | Automatic | Not kept for the check (D-136) | L3 | Memory only in the hook (not built); Supabase Auth audit log may hold IPs, retention UNVERIFIED, target 90 days (`DATA_CLASSIFICATION.md:547`) | See left | No |
| 13 | Child name or nickname | Whose book; seeds the dictionary | Optional for a single first child; required when several at first run | 1 to 60 characters any script, trimmed, never transliterated (`packages/core/src/child.ts:14`; server `20261109000000_child_name_optional.sql:75-77`, pending apply) | L3 | Phone; server `children` after consent | Until the book or account is deleted | Yes |
| 14 | Birthday or due date | Chapters, age math | Required (one of the two) | Birthday not after tomorrow, not before 1900; due date up to 305 days ahead in the picker (`child.ts:18`), server allows up to 310 ahead and 400 back (`20261109000000:78-84`) | L3; a due date shows a pregnancy (health-adjacent, K-25, Q32) | Phone; server `children` | As 13 | Yes |
| 15 | Signature ("From Papa") | Letters signed in the parent's words | Required | 1 to 30 characters, NFC, trimmed (`child.ts:16,93-96`) | L3 | Phone; server | As 13 | Yes |
| 16 | Letter languages | Transcription | Required (English only in this build, `EXPO_PUBLIC_ENGLISH_ONLY`) | Chips | L2 | Phone | Install | UNVERIFIED |
| 17 | Last sign-in method | "Last time you used Apple" | Automatic | Method name only, never the email | L2 | Phone settings | Install | No |
| 18 | First letter (words, recording) | The product | Required to have a letter | Constitution rules | L3, sensitive (Privacy 9) | Phone; words sync after consent; recording stays on the phone (backup off, `EXPO_PUBLIC_BACKUP: off`) | Until deleted | Yes |

Never collected, door to first letter (built or ruled): passwords; phone number (LEGAL-REQ-012); contacts; location; advertising id; birth date, age or age range of the parent; any Declared Age Range value; the IP address kept for the country check; full legal name for screening (D-137); child surname, gender, photo as required, birth weight, birthplace (F03 Never); analytics or crash data (`EXPO_PUBLIC_ANALYTICS: off`); device model, IDFV or push token in a consent record (PRIV-R21). No OS permission prompt before the first tap on Speak (LEGAL-REQ-007, F03-REQ-007).

---

## 4. Verification steps

### 4.1 Sign in with Apple
- Built: native sheet, raw nonce hashed (`apps/mobile/src/lib/auth/nonce.ts`), `signInWithIdToken`, name saved once, authorization code posted to `apple-token` for later revocation (`apple.ts:60`). Shown first on the sheet (`app/(auth)/sign-in/index.tsx:128`).
- Required [L]: 4.8 says an app using a third-party login (Google) for the primary account must also offer an equivalent login that limits data to name and email, lets the user keep the email private, and does not collect interactions for ads without consent (guidelines read 20 Nov 2026, https://developer.apple.com/app-store/review/guidelines/). Sign in with Apple beside Google meets that on our reading (register CR-080). Apple's deletion page says apps with Sign in with Apple "should use the Sign in with Apple REST API to revoke user tokens" (https://developer.apple.com/support/offering-account-deletion-in-your-app/, read 20 Nov 2026). Revocation at deletion: the purge worker step is UNVERIFIED in this read.

### 4.2 Sign in with Google
- Built: native ID token with nonce (`google.ts`); shown only when both client ids are present (`google.ts:38-40`); whether the production EAS environment holds them is UNVERIFIED.

### 4.3 Email link and code

| Property | Built | Cards (F02) | Norm read today |
|---|---|---|---|
| Code length | 6 (default; production profile sets no length; `config.toml:71`) | 8 digits (A-REQ-018 Rev, Q2) | NIST SP 800-63B-4 3.1.3.2: at least six decimal digits for out-of-band secrets (https://pages.nist.gov/800-63-4/sp800-63b.html, read 20 Nov 2026, primary) |
| Code expiry | 15 min in local `config.toml:74`; production dashboard UNVERIFIED; Supabase default 1 hour | 15 min | NIST 3.1.3.2: invalid unless completed within 10 minutes |
| Link expiry on this phone | Pending request kept 1 hour (`email-link.logic.ts:36`) | 15 min, same as the code | Same as above |
| Link binding | PKCE, only the phone that asked, refused while signed in (`supabase/client.ts:111`; BL-347 built) | Same | n/a |
| Resend | After 60 s, client and server | 60 s; at most 5 per address per hour | Supabase: one OTP request per 60 s |
| Wrong attempts | 5 wrong in 15 min pauses typing for 15 min, client only | Same, plus server alert above 20 per address per hour | NIST 3.2.2: limit consecutive failures to no more than 100 (upper bound, lower allowed); NIST 3.1.4.2: rate limiting SHALL be used when the secret is under 64 bits |
| Lockout | None server-side per address; per-IP 30 per 5 min | Client pause only | As above |
| Single use | Supabase | Single use | NIST: accept an OTP only once |

Note for counsel and security, not a legal rule: NIST SP 800-63B-4 3.1.3.1 says "Email SHALL NOT be used for out-of-band authentication", with an exception for confirmation codes that validate an email address and recovery codes. NIST binds US federal systems, not us; it is the common reference for "reasonable security" arguments (register CR-110). Our email code is a primary sign-in, so it falls under the rule's concern. Apple and Google sit beside it. Engineering reading; `security-architect` owns the call.

### 4.4 What a parent sees during verification (built)
"A link and a code are on their way to {email}" with the address; code field with one-time-code AutoFill; Open Mail; after 60 s, Send a new email, Use a different email, Sign in with Apple (`handoff.logic.ts` `recoverySet`); a wrong code clears the field with a line and no shake; paused state says the link and Apple still work (`code.tsx:22-27`).

---

## 5. Notices and agreements at collection, in order

| Step | What the person sees | What is recorded | Built |
|---|---|---|---|
| 0. App Store page | Privacy policy URL, App Privacy label, age rating 18+ | Nothing | Founder steps in ASC (F21-REQ-005, Q54) |
| 1. Before you begin | "Are you 18 or older?", unticked box "I agree to the Terms of Service and Privacy Policy.", two links opening `/terms` and `/privacy` in the in-app browser | Local rows: Terms 4.1.0 accept, Privacy 3.0.0 accept, SHA-256 of the sentence, device time, app version (`agreements.logic.ts:151-153,198-205`) | Yes |
| 2. Welcome | Start, sign in. F01 asks for a two-sentence privacy notice here (A-REQ-035, K-16) | Nothing | Notice line not confirmed on the built Welcome (UNVERIFIED) |
| 3. Sign-in sheet | Title, body, providers, privacy line "Only you and the people you invite can read your letters. We never sell them or use them for ads." (`strings.en.ts:1482`), Not now | Nothing | Yes |
| 4. Consent sheet, Terms step | "By continuing, you confirm you are 18 or older and agree to the Terms of Service and Privacy Policy." (`packages/content/src/features/auth.en.ts:17`) directly above "Agree and continue" (D-138 item 3), document rows | Server `terms` accept, `method=signin_sheet`, `context {auth, age_attested: true}` (`consent.ts:92-119`) | Yes |
| 5. Consent sheet, sensitive data | Counsel-pending text; "Agree and sync" and "Keep on this phone" equal size, nothing preselected | Server `sensitive-data` accept or decline, `method=consent_sheet` | Yes |
| 6. Claim | Masked account email; "Keep in this account" or "Not my account" | Nothing; ownership moves only after the tap | Yes |
| 7. Child, signature, first letter | Field labels only | Nothing new in consent records ("settings are not agreements", frame section 7) | Yes |
| Later | Microphone primer before the OS prompt (first Speak); reminders prime; analytics never in this build | Permission state only | Per F04, F13 |

Gaps against PRIV-R21 (the consent record rule, `docs/engineering/07-privacy-engineering.md:53-75`):
- The server call sends no `rendered_sha256`, `app_build` or `os_major`, and hard-codes `p_locale: 'en'` (`consent.ts:103-116`). BL-577 app half: `not yet`. Once `20261108000000` is applied and `app.consent_fields_required` is on, these sheet acts are refused (23502), so the builder must land first.
- The local Before you begin rows are not uploaded at first sign-in (BL-579: no upload code found in `apps/mobile/src/lib`). The server's first record of agreement is step 4, and the first two rows stay on the phone only.
- The server records no `privacy` row at sign-in; F02 6.2 step 4 asks for a `privacy` acknowledge beside `terms`. Q-D (agree or acknowledge the Privacy Policy) is open.
- Version drift risk: the phone records the constants Terms 4.1.0 and Privacy 3.0.0 (`agreements.logic.ts:151-153`), while the server records whatever `policy_versions` says, and the links open the unversioned `/terms` and `/privacy`, which D-144 item 3 left unchanged when the 0.9.0 texts went to versioned addresses only. Whether `/terms` today serves 4.1.0 is UNVERIFIED. If it does not, the local record names a text the person could not have read.

Notice at collection (California) [L]: 11 CCR 7012 requires a notice "readily available where consumers will encounter it at or before the point of collection"; for a mobile app a link on the download page and within the app (for example the settings menu); a privacy-policy link must go "directly to the specific section" holding the required contents, not to the top of the policy (https://law.cornell.edu/regulations/california/11-CCR-7012, read 20 Nov 2026; text shows amendment operative 29 Mar 2023; secondary host of the official regulation). Whether the CCPA applies at all at our size is counsel's (Q20). The built links open the top of `/privacy`.

---

## 6. Gaps, recommended defaults and counsel questions

Priority: A blocks public sign-up or the next submission; B before a dated event; C later.

| # | Gap | Built | Card says | Law or store needs | [R] default | Counsel |
|---|---|---|---|---|---|---|
| G1 (A) | Declared Age Range | None | F01-REQ-003, -010, WP-F01-02, -07 | Apple: 18+ apps must check with the API where legally required; Texas enforceable since 4 Jun 2026 for new Texas accounts; CA from 1 Jan 2027 (secondary) | Ship a 1.0.x with the module before 1 Jan 2027, built with the iOS 26.2 SDK: call at launch when eligible, minor stops at once, adult still answers our question, store and log nothing. Write down the Texas exposure for Build 12 until then, as a founder risk acceptance in DECISIONS | Q46 (old Q5 a to d), and whether an adults-only app with no minor path has a 121.054 duty at all |
| G2 (A) | `age_signal` on the server | Sent nowhere today | F02 Q6: send none; PRIV-R21 allows `age_signal` values `declared_range`, `none`, `unavailable_os` | Texas 121.055: delete app-store age data after verification | Keep sending none. If counsel wants evidence, send only `none` or `unavailable_os` (how the check ran), never the range | Q46 |
| G3 (A) | Country check (D-131) | Not on `develop` | D-131, D-136, Privacy 12 | Q57 deadline: before sign-in outside the family | Land File 28 and test that Apple, Google and email sign-ups all trigger the hook before the store build is public; until then Privacy 12's "takes effect only when it ships" stays true, and the founder records that the check is off | Q57 (a), (c), (f) |
| G4 (A) | Sanctions match cannot suspend without delete | Runbook gap | sanctions-match.md | 31 CFR 501.603 (read 1 Nov) | `data-architect` with `security-architect`: one-account sign-in block with a test | Q57 (e) |
| G5 (A) | Email code 6 digits, expiry and link TTL not aligned | 6 digits; 15 min local, production UNVERIFIED; link 1 h | 8 digits, 15 min | NIST: at least 6 digits, 10 min, rate limit; no per-address server limit | Set production OTP length 8 and expiry 10 to 15 min in the dashboard and `EXPO_PUBLIC_EMAIL_OTP_LENGTH=8` together; cut the pending-link TTL to the same; add the server per-address failure count (BL-248). Record the dashboard values with a read date | Q56 (codes as sensitive PI) |
| G6 (A) | Sign-in required (D-160) vs 5.1.1(v) | Account-first; local start only in an outage (`gate.logic.ts:39`) | F02 A-REQ-012 (letter first) is now stale | 5.1.1(v): "If your app doesn't include significant account-based features, let people use it without a login"; apps may not require personal information unless relevant to core function | Keep D-160; the Notes for Review must say what the account does (sync, new phone). Product updates F02 to the account-first order | new, needs a number from legal (App Review reading of required sign-in) |
| G7 (A) | PRIV-R21 fields missing in server consent rows | No hash, build, OS major; locale fixed `en` | BL-577 | Our own rule; proof of the words shown | Land the shared builder before `app.consent_fields_required` turns on | Q41 (e) for retention; none new |
| G8 (B) | Local agreement rows never reach the server | No upload | BL-579 | Proof of the first agreement | Upload unchanged at first sign-in, with device time | Q-D (open in proposals) |
| G9 (A) | Version recorded vs text served | Constants 4.1.0 and 3.0.0; links to unversioned pages | POLICY_VERSIONING | Proof of what was agreed | Links open the versioned page that matches the recorded version; a test pins the two | Q44 (draft texts with real families) |
| G10 (B) | Notice at collection | Links open the top of `/privacy` | A-REQ-035 notice on Welcome | 11 CCR 7012 (c), (f) | Link to the "What we collect" section anchor, in the app and on the store listing | Q20 |
| G11 (B) | Unconfirmed auth users from mistyped emails | No purge found | none | Data minimisation; Privacy 7 retention | Purge `auth.users` never confirmed after 7 days, with a test; record the retention in data-policy section 4 | new, needs a number from legal (retention of unverified sign-up addresses), else Q51 |
| G12 (B) | Second account on one phone | Upload and claim blocked; local visibility not | X4-R1 "never sees" | Q48 another adult's data | Product picks (a) or (b) in 2.6; write the `[X4-R1]` test either way | Q48 only if (a) |
| G13 (B) | Under-18 confirm step after No | Not built | F01-REQ-002 requires it | none found | Founder decides BL-561; until then F01-REQ-002 is `not yet` | none |
| G14 (B) | Auth audit log IP retention | Supabase default, UNVERIFIED | 90-day target | Privacy 2 says providers see IP | Read the Supabase retention for the plan, record it, or say so in Privacy 7 | Q51 |
| G15 (B) | Support-opened deletion for an under-18 report | Not built (BL-551) | Runbook | Terms 2.1 promise to close; COPPA 10-day promise in the runbook | Build before public sign-up, or the runbook's interim path stays | Q46 (d) |
| G16 (C) | Utah, Louisiana, Alabama significant-change and parental flows | None | CR-005 | Secondary: Utah 6 May 2027, Louisiana 1 Jul 2027, Alabama 1 Jan 2027 (in litigation) | Same memory-only module as G1; minor means stop, so consent flows reduce to "not available"; re-read each statute before its date | Q46 |
| G17 (C) | Storefront does not gate location | By design | D-137 controls | Apple: account country sets storefront | Nothing more in 1.0.x; D-137 revisit triggers stand | Q57 (c) |
| G18 (C) | COPPA | Not applicable on our reading | Q45 | FTC FAQ A.8 (updated 10 Jul 2026, https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions): "COPPA only applies to personal information collected online from children"; F.6: audio of a child's voice is personal information when collected from a child. Amended rule compliance date 22 Apr 2026 (Federal Register 2025-05904) | Keep backup off until Q45 is answered; never ask a child to speak; no "kids" metadata | Q45 |

Drift between the cards and the build (for `product`, not legal):
- F01 says Welcome then gate per D-043 and a separate notice on Welcome; the build puts the gate first with the agreement box on the same screen (founder decision F2, 8 Nov). F01 Q1 is answered by the build but D-043 is not amended.
- F02 describes letter-first with Keep the book after the second letter; D-160 made Build 12 account-first. F02's ask table, A-REQ-012 and A-REQ-013 are stale.
- F02 says Google supersedes D-044 (D-054 does this; D-044 row still reads "Google in v1.1").
- Privacy 3.0.0 is "draft-for-counsel" with effective date TBD, yet the phone records 3.0.0 as accepted.

What I could not read (UNVERIFIED): California AB 1043 and AB 1856 primary text (leginfo did not load); Colorado's OS-level law; GDPR and UK GDPR texts (not needed while US-only); the production Supabase Auth settings; App Attest documentation; whether `/terms` and `/privacy` today serve 4.1.0 and 3.0.0.

## Sources read this session (20 Nov 2026)

| Source | URL | Kind |
|---|---|---|
| App Review Guidelines (4.8, 5.1.1 (i), (ii), (iii), (v), 1.3, 5.1.4 partial, 2.3.6, 2.3.8) | https://developer.apple.com/app-store/review/guidelines/ | primary |
| Offering account deletion in your app | https://developer.apple.com/support/offering-account-deletion-in-your-app/ | primary |
| Age assurance Q&A | https://developer.apple.com/support/age-assurance | primary |
| Update for apps distributed in Texas (3 Jun 2026) | https://developer.apple.com/news/?id=sg176nne | primary |
| Update on age requirements, Texas (23 Dec 2025) | https://developer.apple.com/news/?id=8jzbigf4 | primary |
| Next steps for apps distributed in Texas (4 Nov 2025) | https://developer.apple.com/news/?id=2ezb6jhj | primary |
| Manage availability (storefronts) | https://developer-rno.apple.com/help/app-store-connect/manage-your-apps-availability/manage-availability-for-your-app-on-the-app-store | primary |
| Texas SB 2420 enrolled text, Subchapter C | https://capitol.texas.gov/tlodocs/89R/billtext/html/SB02420F.htm | primary |
| App store age laws status (TX, UT, LA, AL, CA), 19 Nov 2026 | https://www.privacyworld.blog/2026/11/app-store-age-verification-laws-your-questions-answered-updated/ | secondary |
| COPPA amended rule, Federal Register 2025-05904 | https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule | primary |
| COPPA FAQ (A.8, F.4, F.6) | https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions | primary |
| 11 CCR 7012 notice at collection | https://law.cornell.edu/regulations/california/11-CCR-7012 | secondary host of primary text |
| OFAC sanctions programs | https://ofac.treasury.gov/sanctions-programs-and-country-information | primary |
| NIST SP 800-63B-4 | https://pages.nist.gov/800-63-4/sp800-63b.html | primary |
| Supabase passwordless email | https://supabase.com/docs/guides/auth/auth-email-passwordless | primary (vendor docs) |
