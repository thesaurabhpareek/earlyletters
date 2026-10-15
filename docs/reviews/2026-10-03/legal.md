# Legal and privacy review: web legal drafts, email compliance, billing emails

Reviewer: independent legal and privacy reviewer (AI, Claude), 3 Oct 2026, branch `feat/email-brand-library`. Prepared as findings for counsel. **Not legal advice; the reviewer is not a lawyer.** Read-only review; this file is the only change.

Scope read: `packages/content/legal/*.md` (terms, privacy, subscription-terms, health-privacy, subprocessors, REVIEW_NOTES), their sources in `docs/legal/`, `docs/emails/COMPLIANCE.md`, `docs/emails/SECURITY.md`, `docs/emails/CATALOG.md`, `supabase/auth-email.md`, `packages/content/src/emails/*.en.ts`, `docs/DECISIONS.md` (D-001, D-004, D-012, D-022, D-036, D-047, D-049, D-071 to D-079), `docs/agents/BRIEF-2026-10-03.md`, `docs/ARCHITECTURE.md` (backup scope), `apps/web/src/pages/[legal].astro`, `apps/web/src/content.config.ts`.

## Verdict

**Not publishable, and the billing email plan does not hold as designed.** Founder decision 3 of the Brief (Apple only, "No server of ours sees purchases", no App Store Server Notifications, server does not enforce Plus) removes the data source that D-022, D-049, D-047, the billing email catalog, Terms 14.6, the Subscription Terms "Reminders" and "Your agreement", and four rows of the Privacy Policy all depend on. As written, the Terms promise renewal emails the system cannot send, and the Privacy Policy describes purchase data and an Apple-to-us data flow that will not exist. This is a decision for the founder and counsel (LGL-01), not a copy fix.

Beyond that: the published pages describe v1.0 features that were cut or deferred (family contributors, Vault mode and iCloud Keychain keys, Google billing), the support inbox and its providers are undisclosed, and Resend's no-training position is unconfirmed while three pages promise it. The CAN-SPAM classification in COMPLIANCE.md is sound; email data minimisation is well designed. Draft marking works on the web (banner, `noindex`, REVIEW_NOTES excluded by the glob).

## Risk table

| ID | Severity | Area | One line |
|---|---|---|---|
| LGL-01 | critical | Billing / ARL | Brief decision 3 (no server sees purchases) makes every D-022 email unsendable; Terms 14.6 and Subscription Terms promise them |
| LGL-02 | high | Privacy accuracy | Privacy Policy, CCPA table and subprocessor page describe purchase data held by us and Apple reporting to us; false under Brief 3 |
| LGL-03 | high | Terms accuracy | Terms 14.12 and D-012 "books inherit Plus from any parent" cannot work without server enforcement; Family Sharing covers only the purchaser's Apple family |
| LGL-04 | high | Purchase consent records | 17602(a)(6) proof of consent (D-049) and the emailed acknowledgment have no data source |
| LGL-05 | high | Privacy accuracy | Backup keys, Vault mode, iCloud Keychain and "family devices" described as present; ARCHITECTURE says v1.0 is a server-wrapped per-file key, Vault later |
| LGL-06 | high | Subprocessors / CHD | Support inbox (`hello@`) runs through Resend receiving and Porkbun forwarding to an unnamed mailbox; none disclosed for support content, which can contain health data |
| LGL-07 | high | No-training promise | Resend has no written no-training clause and lists AI subprocessors; three pages say no provider may train |
| LGL-08 | medium | Statements false at launch | Family contributor role, family authors, return links, "family letters" described as current in Terms, Privacy, Subscription Terms and billing emails (D-055: co-parent only) |
| LGL-09 | medium | Statements false at launch | Google Play billing in Terms short version, 1.4, 8.4, 14.4, 14.5, 26.2 |
| LGL-10 | medium | Sign-in disclosures | Google sign-in: Brief 4 and `auth.en.ts` say v1.0; Privacy, auth-email.md and D-044 say v1.1 |
| LGL-11 | medium | Location claim | "Our servers are in the United States, in California": Resend is us-east-1 |
| LGL-12 | medium | Acknowledgment email | `trial-started` and `plus-started` still lack "what Plus includes" and the cancellation-policy line COMPLIANCE 5.5 requested |
| LGL-13 | medium | Email claim | `welcome`: "Only the family you invite can read your letters" overstates; text is not end-to-end encrypted |
| LGL-14 | medium | Retention claim | Deletion emails say "the law asks" us to keep purchase records 7 years; no such records under Brief 3, and the legal basis is unverified |
| LGL-15 | medium | Placeholders | No build guard stops a non-draft page from publishing raw `{publisherLegalName}`, `{postalAddress}`, `{supportPhone}`, `{county}`, archive URLs, `{modelHost}` |
| LGL-16 | medium | Stale review notes | REVIEW_NOTES names `consumer-health-data.md` and `/consumer-health-data`; the file and slug are `health-privacy`; the Washington homepage-link checklist points at a URL that will not exist |
| LGL-17 | medium | Resend retention | "Service providers delete within 45 days" depends on Resend message retention (30 days, scope unverified) and an unverified log-deletion API |
| LGL-18 | low | ARL law reading | 17602(h) annual reminder medium is "same medium that resulted in activation" (in-app); relevant to the LGL-01 fallback |
| LGL-19 | low | Price increase promise | Terms 14.8 "never renew at a higher price unless you agree" forecloses Apple's no-consent increase mode; fine, but make it deliberate |
| LGL-20 | low | Catalog drift | CATALOG and COMPLIANCE still cite D-002 contributors and server push for billing |
| LGL-21 | low | CAN-SPAM drift risk | Two soft re-engagement lines in billing emails |
| LGL-22 | low | Individual publisher | Fictitious business name and "we" for an individual; Resend account shared with another product |

## Findings

### LGL-01 (critical): the D-022 billing email plan cannot run under Brief decision 3

**Where.** `docs/agents/BRIEF-2026-10-03.md:9` ("No server of ours sees purchases. No RevenueCat, no App Store Server Notifications endpoint ... server code does not enforce Plus"). Against: `docs/DECISIONS.md:72` D-001 (still specifies ASSN V2 and App Store Server API), `:153` D-022 ("the server sends notices by this table. `E` = trial end or period end (App Store instant)"), `:335` D-049 (consent rows "reconciled from the App Store notification"); `docs/emails/CATALOG.md:12` (server push for trial final); `docs/emails/COMPLIANCE.md:279` ("Every value comes from the App Store snapshot"); `packages/content/src/emails/billing.en.ts:11-23` (sender fills `{trialEndDate}`, `{renewalDate}`, `{price}`); `packages/content/legal/terms.md:19, 216-221` (14.6 "We tell you, in the app and by email"); `packages/content/legal/subscription-terms.md:7, 37, 47-54` (summary, "send you a copy by email", "Reminders from us ... by email and in the app").

**Problem.** Without server visibility the server knows none of: that a trial or purchase happened, `E`, whether auto-renew is still on, the price, or a pending price increase. So `trial-started`, `plus-started`, `trial-ending-*`, `annual-renewal-*`, `anniversary-reminder`, `price-increase`, `plus-cancelled` and `plus-ended` have no trigger and no data. Terms 14.6 is a contractual promise; a promise of notices that are never sent is itself a deceptive-practice risk (FTC Act s.5, ROSCA; UNVERIFIED as applied) on top of the ARL exposure COMPLIANCE.md 5.1 assumes we carry.

**Primary-source note.** Cal. Bus. & Prof. Code 17602 (2025 code, Justia, opened 3 Oct 2026): (a)(3) acknowledgment "capable of being retained"; (b)(1)(A) trial over 31 days notice "at least 3 days before and at most 21 days before" expiry; (b)(2) one-year term notice "at least 15 days and not more than 45 days before"; (g)(2) fee change notice 7 to 30 days before; (h)(1) annual reminder "in the same medium that resulted in the activation ... or the same medium in which the customer is accustomed to interacting with the business". Official leginfo text not opened (UNVERIFIED against it). Whether Apple itself sends trial-end or renewal reminders: **UNVERIFIED** (only a developer-forum thread found, no Apple statement). StoreKit 2 exposes the needed facts **on the device**: `RenewalInfo` carries `priceIncreaseStatus` and `expirationReason` (Apple, "Managing Price Increases for Auto-Renewable Subscriptions", opened 3 Oct 2026).

**Fix: founder and counsel choose one, then every listed file is edited to match.**
- **Option A (recommended for legal certainty): narrow exception to Brief 3.** The app reports a minimal notice record when a purchase completes in the app and on each launch: product id, offer type, `E`, `willAutoRenew`, price, `ownershipType`, plus the consent record. No receipts, no ASSN, server still does not enforce Plus. Server sends D-022 emails from it. Known gap: a cancellation made in iOS Settings is not seen until the app next opens, so every reminder must read "If you have already cancelled, there is nothing to do." Requires a founder override of Brief 3 recorded as a new D-entry, and LGL-02 rows stay (reworded: "the app tells us").
- **Option B: no billing email at all.** On purchase, the app schedules local notifications for every D-022 window from on-device StoreKit dates, shows the acknowledgment in the app with a share/save action (for "capable of being retained"), and re-checks `RenewalInfo` on each launch to cancel stale notices. Then delete "by email" from Terms 14.6, 14.8, Terms short version, Subscription Terms summary, "Your agreement" and "Reminders from us"; retire the billing templates (keep the copy for in-app cards); remove Resend's "trial and renewal emails" purpose (privacy.md:138, subprocessors.md:25). **Question for counsel:** do local notifications and in-app cards satisfy 17602(a)(3), (b) and (h) (activation medium was in-app), and New York, Virginia, Massachusetts and Colorado windows, given they fail if notifications are off or the app is deleted? Massachusetts monthly repetition (COMPLIANCE 5.6.1) becomes harder still.
- **Option C:** ship v1.0 Plus with no trial-length over 31 days and annual plans only where Apple's own notices are confirmed sufficient by counsel. Not recommended; changes prices fixed in Brief 3.
- In every option, update D-001 (still describes ASSN and App Store Server API), D-022 ("the server sends"), D-036 ("ARL notices need an email"), D-047 (server-side binding), D-049 and COMPLIANCE.md 5 and 6.1.

### LGL-02 (high): Privacy Policy describes purchase data that will not exist

**Where.** `packages/content/legal/privacy.md:57` (Purchases row: "Apple tells us the status of your subscription under a random ID ... Our database"), `:85` (purpose "Plus subscriptions, trials, notices and refunds"), `:168` (purchase records retention), `:179` ("We delete the random ID that links your account to your App Store purchases"), `:249` (CCPA "Commercial information ... disclosed to Supabase"); `packages/content/legal/subprocessors.md:43` (Apple row: "Apple tells us the status of your subscription"); source `docs/legal/privacy-policy.md` same rows.
**Problem.** Under Brief 3 these are false statements about data flows. Overstating collection is lower risk than understating it, but the CCPA notice at collection must be accurate (11 CCR 7012) and Apple's App Privacy answers must match (REVIEW_NOTES 6, LEGAL-REQ-042).
**Fix.** Follow LGL-01. Under Option B: Purchases row becomes "Whether you have Plus is checked on your phone with Apple. We do not receive your purchase history"; delete the CCPA Commercial information row or mark "None"; delete lines 168 and the random-ID clause of 179; reword the Apple subprocessor row. Under Option A: say "the app tells us" instead of "Apple tells us", and list exactly the fields in LGL-01 Option A.

### LGL-03 (high): "Plus covers the other co-parent" cannot be delivered

**Where.** `packages/content/legal/terms.md:233` (14.12: "Plus applies to the book ... including for the other co-parent in that book. A co-parent can also get Plus through Apple Family Sharing"); `docs/DECISIONS.md:129` D-012 ("books inherit it from any parent"); Brief 3 ("A co-parent gets Plus through Apple Family Sharing ... server code does not enforce Plus").
**Problem.** With entitlement checked only on each device (`Transaction.currentEntitlements`), the second parent's phone cannot know the first parent's Apple entitlement unless it is shared through our server. Family Sharing reaches only members of the purchaser's Apple family group (Apple's `ownershipType` "indicates whether the transaction was purchased by the user, or is made available to them through Family Sharing", developer.apple.com, opened 3 Oct 2026). Separated or unmarried co-parents in different Apple families get nothing, which is exactly the group Terms section 9 addresses. Also, Family Sharing extends Plus to every member of that Apple family, not only co-parents (harmless, but 14.12 should not imply the scope is "co-parent").
**Fix.** Founder decides. Either (a) book-level inheritance via a server-visible flag (needs an exception to Brief 3, same as LGL-01 Option A), or (b) rewrite 14.12: "Plus applies to the Apple Account that buys it, and to people in that Apple Account's Family Sharing group. Each co-parent's Plus is their own." and amend D-012 and the Plus screen copy. Counsel: whether the Plus purchase screen must say this before purchase (17602(a)(1) clear and conspicuous terms; UNVERIFIED reading).

### LGL-04 (high): proof of ARL consent and the retained acknowledgment have no source

**Where.** `packages/content/legal/terms.md:206` (14.3 "we keep a record of what you agreed to and when"), `subscription-terms.md:37`, `docs/DECISIONS.md:335` D-049, `docs/emails/COMPLIANCE.md:265-266` (17602(a)(6) 3-year proof), `privacy.md:169`.
**Problem.** D-049 reconciles consent rows from App Store notifications, which Brief 3 removes. 17602(a)(6) (as quoted in COMPLIANCE 5.1; not re-opened here) requires keeping proof of consent.
**Fix.** Write the consent record from the device at purchase completion (Transaction id hash, product, offer, consent text version, time) to a server table that does not enforce anything. Record this as a scoped exception to Brief 3, or counsel confirms a device-only record is acceptable. Update D-049.

### LGL-05 (high): backup security described as a design that is not in v1.0

**Where.** `packages/content/legal/privacy.md:15, 62, 122, 186, 230`; `terms.md:182` (12.2 Vault mode, Recovery Kit); `health-privacy.md` (indirect). Against `docs/ARCHITECTURE.md:14` ("Reduced for v1.0: One per-file key wrapped by a server-held key ... Vault mode and member key grants later") and D-032 (superseded but its scope reduction is what ARCHITECTURE records). D-073 decides backup ships in v1.0 but does not restore Vault mode.
**Problem.** The policies say keys live in iCloud Keychain and on family devices and that Vault mode exists with no server copy. If v1.0 uses a server-held wrapping key for every file, "only you and the family devices you approve can open them" and the Settings path "switch to Vault mode" are false. Security misstatements are a classic FTC s.5 deception theory (UNVERIFIED as applied).
**Fix.** Founder or backend owner confirms the v1.0 key design. If ARCHITECTURE is current: Privacy 3 Encryption keys row "a key held, locked, on our servers"; section 7 and 11 describe one mode (server-held wrapping key, we could technically open backups under section 7 conditions); delete Vault mode from privacy.md:15, 122, 230 and terms.md:182 or mark "coming in a later version". Engineering requirement LEGAL-REQ on escrow logging (ENGINEERING_REQUIREMENTS:182) must cover the per-file key unwraps.

### LGL-06 (high): the support inbox and its providers are undisclosed

**Where.** `docs/emails/SECURITY.md:36` (MX: Resend receiving `inbound-smtp.us-east-1.amazonaws.com` plus Porkbun forwarding `fwd1/fwd2.porkbun.com`, "Two inboxes for one address"), `:220, 324, 327` (Q1, Q4: personal Gmail "send mail as" possible); `packages/content/legal/privacy.md:61` ("Our email provider"), `:138` (Resend purpose lists only outbound), `:170` (support emails 2 years); `health-privacy.md:43` (processor purposes omit email and support); `subprocessors.md:25` (Resend purpose outbound only); REVIEW_NOTES 3.7.
**Problem.** Support messages and DMARC reports reach Resend inbound and, by fallback, Porkbun and a mailbox provider that is not named. Support mail will contain letter excerpts, health details and child names (people paste them). Washington MHMDA requires disclosing the categories of third parties and processors that receive consumer health data and their contact details (RCW 19.373.020 and .040 as cited in REVIEW_NOTES; not re-opened: UNVERIFIED). The deletion promise (45 days for providers) cannot reach a personal mailbox under no DPA.
**Fix.** Founder picks one route (SECURITY Q1). Then: name the mailbox provider in privacy.md section 8, the CCPA table, health-privacy.md section 5 ("Answering your messages") and the subprocessor page, with region and contact; add "receives messages you send us" to the Resend row if Resend receiving stays; sign the provider's DPA; drop Porkbun forwarding or list Porkbun. Counsel: whether a personal consumer mailbox is acceptable at all for CHD.

### LGL-07 (high): no-training promise not backed for Resend

**Where.** `privacy.md:97, 128`, `subprocessors.md:10, 7` (summary), `terms.md:102` (6.2: we will not use content to train "anyone else's" models), `health-privacy.md:30`; REVIEW_NOTES 3.8 (Resend DPA has no AI-training clause; Resend lists Anthropic and RunPod as subprocessors, read 3 Oct 2026; not re-verified by this reviewer).
**Problem.** Outbound email content is minimal (LGL-ok), but inbound support mail (LGL-06) is content. A categorical "none of them may" promise without a contract term is unsupported.
**Fix.** Get written no-training confirmation from Resend before publication (same gate as PowerSync, CN-7), or reword the sentence to what contracts actually say: "Each may use your information only to provide its service to us." Do not publish while either PowerSync or Resend lacks the term.

### LGL-08 (medium): family contributor features described as present (D-055)

**Where.** `terms.md:18` ("family authors are free"), `:30` (1.2 web page), `:59` (3.4 return links), `:67-71` (4.2 Family role), `:194` (13.1 "inviting co-parents and family, and family letters"); `privacy.md:31` ("at launch, family members write from the app"), `:106` (Family can read the book); `subscription-terms.md:14`; `billing.en.ts:249, 266` ("family letters are free, always"); `docs/emails/COMPLIANCE.md:81` ("Contributors have accounts at v1.0 (D-002)").
**Problem.** D-055 (co-parent only at v1.0) supersedes D-002. Privacy line 31 is now factually wrong. Terms 13.3 makes section 13 non-amendable for existing users, so listing family invites there is a binding forever-free promise for a feature not shipped; acceptable only if the founder intends it.
**Fix.** privacy.md:31: "(coming after the first version; at launch, only a co-parent can join a book)". Add one sentence to Terms 4.2 and Privacy 7: "At launch, the Family role is not available yet; this section applies when it is." Founder confirms the section 13 promise. Billing emails: "Writing, reading, playing your recordings and export are free, always." COMPLIANCE.md:81 cite D-055.

### LGL-09 (medium): Google Play billing reads as live

**Where.** `terms.md:19, 37` (1.4), `:126` (8.4), `:208` (14.4), `:211-212` (14.5 Android steps without "once available"), `:223` (14.7), `:364-366` (26.2). Already logged in REVIEW_NOTES 3.1; not fixed.
**Fix.** Insert "once the Android app is available" in each place, as Subscription Terms already does (subscription-terms.md line 36 and 43). Terms short version: "renews automatically through Apple until you cancel". Note App Review 2.3.10 bars naming other platforms in iOS metadata (D-001 effects); the Terms are linked from the app.

### LGL-10 (medium): Google sign-in timing conflicts

**Where.** Brief 4 and `packages/content/src/emails/auth.en.ts:154` and CATALOG decision 4 (`docs/emails/CATALOG.md:186`): Google at v1.0. `supabase/auth-email.md:76` and D-044: off until v1.1. `privacy.md:48, 247` ("Google, once Google sign-in is offered"); `subprocessors.md:45` (Google "Sign in with Google").
**Problem.** If Google ships at v1.0, the Privacy Policy understates a source of identifiers (name, email, Google subject id) and misstates timing; if not, `google-account-linked` copy is premature.
**Fix.** Founder confirms. If v1.0: privacy.md:48 "You, Apple if you use Sign in with Apple, or Google if you use Sign in with Google", CCPA Identifiers source likewise, auth-email.md:76 "On", update D-044 with a superseding entry. Google OAuth also requires a privacy policy URL and app verification (UNVERIFIED for scopes `email profile`).

### LGL-11 (medium): "servers ... in California" is inaccurate

**Where.** `privacy.md:148`; `subprocessors.md:20` (Supabase "United States (California)" is fine). Resend region us-east-1 per `supabase/auth-email.md:32` (read from the Resend API) and SECURITY.md:36.
**Fix.** privacy.md:148: "Our servers and our service providers are in the United States." (as REVIEW_NOTES 3.6 suggests).

### LGL-12 (medium): acknowledgment emails still miss two fields

**Where.** `packages/content/src/emails/billing.en.ts:55-63` (`trial-started`), `:79-86` (`plus-started`); requested in `docs/emails/COMPLIANCE.md:329-330` (A2 and A9), not applied. Also `billing.en.ts:19` still describes `{cancelByDate}` as "E minus 24 hours, as a date" contrary to COMPLIANCE 5.3; `:23` `{manageUrl}` still UNVERIFIED.
**Fix.** If any acknowledgment survives LGL-01: add `PLUS_INCLUDES` and "Unless the law or Apple's policy says otherwise, there are no partial refunds for unused time." to both; change line 19 to "the last calendar day, in the recipient's time zone, that ends before C (Hawaii time if unknown)"; point `{manageUrl}` at `https://earlyletters.com/cancel` (COMPLIANCE 11). For Family Sharing members (`ownershipType` family shared) send nothing: they are not the payer.

### LGL-13 (medium): welcome email overstates confidentiality

**Where.** `packages/content/src/emails/auth.en.ts:103` ("Only the family you invite can read your letters."). Against `privacy.md:17, 114-120` (not end-to-end encrypted; staff could technically read).
**Fix.** "Your letters are private to you until you add them to the book, and only the family you invite can read the book." Counsel: whether even that needs "in the app". Brief 11 wants calm trust language; it must still be accurate.

### LGL-14 (medium): "the law asks" us to keep purchase records

**Where.** `packages/content/src/emails/account.en.ts:32, 87`; `privacy.md:168` ("proposed: 7 years").
**Problem.** Under Brief 3 we hold no purchase records; the 7-year figure is "proposed" in the policy but stated as a legal requirement in email. Apple is merchant of record; any tax record duty on the individual publisher concerns proceeds, not per-user records (UNVERIFIED).
**Fix.** Remove "and purchase records for 7 years" unless LGL-01 Option A creates them and counsel confirms a legal basis; change "because the law asks us to" to "to show what you agreed to" for the consent record.

### LGL-15 (medium): no guard against publishing placeholders

**Where.** `terms.md:28, 330, 358, 384, 388-391`, `privacy.md:24, 291, 295`, `health-privacy.md:65`, `subprocessors.md:46, 50`, `subscription-terms.md:70`; `apps/web/src/pages/[legal].astro:13` (only the `status` flag controls the banner). `apps/web/src/content/legal/` is empty today, so nothing is deployed yet.
**Fix.** Add a web build test: any legal page whose `status` is not `draft` fails the build if it contains `\{[a-zA-Z]+\}` or `effectiveDate: "TBD"`. `{publisherLegalName}` stays out of code (D-004); fill at publication from a non-committed source or by the founder's publish PR.

### LGL-16 (medium): REVIEW_NOTES is stale on the CHD page and brand file

**Where.** `packages/content/legal/REVIEW_NOTES.md:14, 39, 65` (`consumer-health-data.md`, `/consumer-health-data`), `:225` (Washington homepage link checklist to `/consumer-health-data`), `:96` (brand file still `example.com`; it now reads `earlyletters.com`, `packages/brand/index.ts:25-29`), `:44, 53` (Google "v1.1").
**Problem.** The checklist that implements the MHMDA homepage-link duty points at a URL that will 404; the actual slug is `health-privacy` (health-privacy.md:3, Brief 13, `apps/web/src/lib/legal.ts:4`).
**Fix.** Replace every `consumer-health-data` with `health-privacy`; mark item 3.14 resolved; update Google notes after LGL-10.

### LGL-17 (medium): provider deletion within 45 days depends on Resend

**Where.** `privacy.md:157`, `health-privacy.md:53`, `account.en.ts:43, 84`; `docs/emails/COMPLIANCE.md:250, 361` (Resend shows "30 days" retention on pricing, scope UNVERIFIED; content storage on by default); `docs/legal/DELETION_AND_EXPORT_SPEC.md:214` (Resend log deletion API UNVERIFIED).
**Fix.** Confirm with Resend that message bodies and logs are purged within 30 days on our plan, or that the API deletes them; otherwise the 45-day claim is unsupported for the address and the deletion receipts themselves. Record the answer in `docs/legal/subprocessors.md` (still has `{EMAIL_PROVIDER}`, `{REGION}`, `{RETENTION}` at line 32).

### LGL-18 (low): 17602(h) medium reading supports an in-app fallback

**Where.** `docs/emails/COMPLIANCE.md:272` marks (h) timing and medium "partly UNVERIFIED".
**Finding.** Justia's 2025 text of (h)(1) requires the reminder "in the same medium that resulted in the activation of the automatic renewal ... or the same medium in which the customer is accustomed to interacting with the business". For an in-app purchase, an in-app reminder is arguably the activation medium. Note (h)(1) speaks of an "annual automatic renewal agreement or continuous service agreement"; counsel should confirm whether monthly plans need the yearly reminder (the catalog sends it anyway, which is safe).
**Question for counsel.** Confirm against the official leginfo text and apply to LGL-01 Option B.

### LGL-19 (low): price-increase promise is stricter than Apple allows

**Where.** `terms.md:225` (14.8), `subscription-terms.md:54`, `billing.en.ts:226`. Apple offers price increases that do not require consent ("the App Store informed the customer ... and the subscription is subject to the price increase", Apple doc above).
**Fix.** None required; record in D-022 that the no-consent mode is never used, so App Store Connect settings stay within the Terms.

### LGL-20 (low): catalog and compliance drift

**Where.** `docs/emails/CATALOG.md:12` (server push for trial final), `:69` (`family-book-closing` marked LB while `family.en.ts` header says not sent in v1.0), `docs/emails/COMPLIANCE.md:81` (D-002).
**Fix.** Re-baseline after LGL-01 and D-055: `family-book-closing` to 1.1; billing push per the chosen option.

### LGL-21 (low): CAN-SPAM classification holds; two lines to watch

The classification in `docs/emails/COMPLIANCE.md` 1.3 is consistent with 15 U.S.C. 7702(2) and (17) and 16 CFR 316.3 as quoted there; transactional mail needs no postal address or unsubscribe (agreed). Two lines lean toward re-engagement: `billing.en.ts:250` ("you can turn renewal back on") and `:287` (`plus-quiet`, "You can start Plus again whenever you like"). Neither is at the start or in the subject, so the primary-purpose test still says transactional. Recommend deleting line 287 (v1.1) since the email's stated job is helping a payer stop. Keep the content test COMPLIANCE 2 asks for (no `{unsubscribe}` in transactional, `{postalAddress}` in commercial).

### LGL-22 (low): individual publisher items

- D-004: Terms and Privacy say "an individual based in California" and use "we". Counsel: acceptability, and whether "Early Letters" as a trade name needs a fictitious business name statement (Cal. Bus. & Prof. Code 17910 ff.; UNVERIFIED, COMPLIANCE 3.4). The From line "Early Letters" names a brand, not the legal sender.
- `supabase/auth-email.md:32, 39`: the Resend account, its only API key and its DPA are shared with another product ("HelloLumira"). Use a separate Resend account or team for Early Letters so the DPA, suppression list (account-wide, COMPLIANCE 4.5) and deletion scope cover only this product.
- Guideline 5.1.1(ix) risk accepted or entity started by 27 Nov (D-004): unchanged.

## What is consistent (checked, no finding)

- Prices: $3.99 monthly with 1-month trial, $29.99 annual with 2-month trial match across Brief 3, D-001, D-075, terms.md 14.2, subscription-terms.md plans table, `site.en.ts`, `pages.en.ts`.
- Plan names "Plus Monthly" and "Plus Annual" (D-077) match subscription-terms.md and billing.en.ts.
- Deletion clocks: 30-day undo, live erase 31 days, backups 38 days, providers 45 days match across privacy.md 10, health-privacy.md 6, account.en.ts. Invite retention 90 days matches D-020.
- Data minimisation in email: no `{child}`, letter, transcript or due-date placeholders in any email file (E-1); tracking off (SECURITY 43); no-content subjects.
- Draft marking: every page has `status: "draft"`; `[legal].astro` shows "Draft, pending legal review" and sets `noindex`; `content.config.ts:15` excludes `REVIEW_NOTES.md`.
- D-073 (backup v1.0, sharing v1.1): privacy.md:110 and health-privacy.md:22 already say family listening comes later.

## Questions for counsel (summary)

1. LGL-01: which billing-notice option; do in-app notices satisfy 17602 and the other state ARLs; whether duties fall on us when Apple is merchant of record (Lawyer 1 Q1).
2. LGL-03: Plus scope wording before purchase.
3. LGL-04: device-written consent records as 17602(a)(6) proof.
4. LGL-06: personal mailbox for support content containing consumer health data.
5. LGL-18: 17602(h) medium and monthly plans.
6. LGL-22: fictitious business name; "we" for an individual.

## Sources opened by this reviewer (3 Oct 2026)

- Cal. Bus. & Prof. Code 17602 (2025), Justia: https://law.justia.com/codes/california/code-bpc/division-7/part-3/chapter-1/article-9/section-17602/ (official leginfo not opened)
- Apple, Managing Price Increases for Auto-Renewable Subscriptions: https://developer.apple.com/documentation/storekit/managing-price-increases-for-auto-renewable-subscriptions
- Apple, `Transaction.ownershipType` (page description only): https://developer.apple.com/documentation/storekit/transaction/ownershiptype-swift.property
- Apple Developer Forums thread 95882 (user discussion only; no Apple statement on trial-end emails): https://developer.apple.com/forums/thread/95882

Everything else cited is from repo documents and their own sources; items not re-opened are marked UNVERIFIED above.
