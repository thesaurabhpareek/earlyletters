# Pricing change memo: membership model, 4 Oct 2026

> **AI-drafted for counsel review. Not legal advice.** Nothing here is a legal conclusion. Statements marked **Unverified** were not checked against an opened source. No statute is cited that is not already named in this repo's own documents. All affected documents are unpublished drafts, so no users are bound by any version.

## 1. What changed (founder decision, 4 Oct 2026)

- Writing, reading, playing recordings and export are no longer "free, always". Plus is no longer "optional". Plus (same name, same price) is the membership that unlocks the product.
- Free version: the first 2 letters per account (a letter is one saved entry, spoken or typed). After that, adding new letters needs Plus.
- Letters already made always stay. If someone never subscribes or Plus ends, every letter and recording they made stays readable, playable and exportable. Only new letters need Plus.
- One membership covers the book. Family authors add letters without their own membership.
- Unchanged: $3.99 a month with a 1-month free trial, $29.99 a year with a 2-month free trial, Apple only, US only, auto-renewal, cancellation and reminder windows. Still true: private by design, parents approve family letters, no ads, no selling data.
- Added the same day (founder request): Apple offer codes (free months for testers, neighbours and friends), redeemed through the App Store. See `docs/ops/OFFER_CODES.md` on branch `docs/offer-codes-runbook`.

## 2. Versions

| Document | Old | New | Class |
|---|---|---|---|
| terms-of-service.md | 1.4.0 | 2.0.0 | Major |
| subscription-terms.md | 1.3.0 | 2.0.0 | Major |
| in-app-disclosures.md | 1.3.0 | 2.0.0 | Major |
| ENGINEERING_REQUIREMENTS.md | 1.1.0 | 2.0.0 | Major |
| compliance-register.md | 1.2.0 | 1.3.0 | Minor (counsel to classify) |
| privacy-policy.md | 1.3.0 | 1.4.0 | Minor (note only; major if a letter count is new data) |
| app-store-privacy-labels.md | 1.2.0 | 1.2.1 | Patch (note only) |
| subprocessors.md | 1.2.0 | 1.2.1 | Patch (note only) |
| consumer-health-data-notice.md | 1.1.0 | unchanged | No statement conflicts |

Majors follow POLICY_VERSIONING 2.1 items 4, 6 and 9 (withdraws a promise; changes the free scope; counsel to confirm). Because nothing is published, no 30-day notice, email or re-consent is owed yet. If any earlier version had been published or shared, notice and re-consent under POLICY_VERSIONING sections 5 and 6 would apply. Frontmatter status stays `draft-for-counsel` everywhere.

## 3. Passages that need counsel eyes

1. Terms of Service Section 13 (was "Free, always"), the two summary lines, 14.1, 14.11, 14.12, 16.2, 25.4 and Appendix B item 5. Key question: 13.2 and 13.4 keep and bind the "existing letters stay" promise plus export and deletion; 16.2 and 25.4 were narrowed from "Section 13" to 13.2 and the export and deletion items. Confirm the narrowing is acceptable.
2. subscription-terms.md "What is free", "What Plus adds", "If Plus ends", "Offer codes", "Open questions".
3. in-app-disclosures.md: new `plus.legal.letters`, `plus.redeem.row`, `plus.redeem.note`; rewritten `store.description.subscriptionLine` (160 characters, over its stated 145).
4. ENGINEERING_REQUIREMENTS.md: LEGAL-REQ-050 rewritten; LEGAL-REQ-061 and 062 are new. No requirement ID was removed.
5. compliance-register.md CR-012, claims-audit row 10, new CR-132.

Export, deletion and data-access wording was checked and not weakened: Terms 8.4, 9.2, 12.3, 13.1, 13.2, 17.1; Privacy Policy short version and rights section; LEGAL-REQ-034 (restated as never needing Plus); the deletion spec and data policy were read and need no change.

Documents outside `docs/legal/` that still carry the old promise and need their owners: `packages/content/src/{strings,store,site}.en.ts`, `apps/web/src/content/site.ts`, `packages/core/test/plan.test.ts`, `docs/prd/C-habits-pricing-settings.md`, `docs/prd/PRD.md`, `docs/tdd/08-payments-entitlements.md`, `docs/web/copy/BR1-audit.md`. Also `apps/web/src/lib/legal/delete-account-copy.ts` says export is "free"; that remains true and was not changed. I did not edit any of these.

## 4. Angles to confirm (all unverified)

- **Auto-renewal laws.** Whether the renewal laws listed in Terms Appendix A (L1, L10 to L14) and ROSCA are affected when a subscription gates the core action of adding letters; whether a person who hits the limit mid-letter and then buys has given express affirmative consent; whether the Plus sheet must state the 2-letter limit near the purchase button.
- **Apple 3.1.2(c) and 3.1.1.** 3.1.2(c) requires describing what the subscription gives before asking; the sheet must now say new letters after the first 2 need Plus. Whether Apple's rules allow this much of the product to sit behind a subscription, and the rule against own unlock mechanisms for offer codes (runbook), are unverified; the guidelines were not re-read for this memo.
- **"Free" claims and "free trial".** FTC guidance on "free" (CR-012, 16 CFR 251 not opened). Whether "first 2 letters free" next to "1 month free trial" on one screen confuses people, and whether the limit must be stated beside the word "free". The in-app-disclosures rule keeps the two apart.
- **Data access and portability.** Whether state access, deletion and portability rights (register CR-014, CR-022, CR-031) are affected. As drafted they are not: export and deletion never need Plus.
- **Children.** Nothing in the decision touches children's data collection (adults only; CR-016). Counsel to confirm no change to the COPPA analysis (privacy-policy CN-2).
- **Consumer health data.** No change to the notice is made. The 2-letter allowance needs at most a count, not content. Whether a count is "collection" of anything health-related is judged unlikely but is unverified.
- **Letter count as a data use.** If a per-account count is stored on our server, the Privacy Policy section 3, the Apple privacy labels and the data map may need a line (privacy-policy CN-21).
- **Offer codes.** Whether a code's free period can be set to not convert to paid; whether reminder windows and the "free trial" rules cover an offer-code period; the longest period Apple allows (unknown, so no length such as 6 months is written anywhere in the drafts).
- **A buyer or successor.** Whether the narrowed promises bind a successor as Terms 27.3 intends.

## 5. Open questions (founder and counsel; not decided in any text)

1. Do family letters count toward the 2 free letters? Related: how the count works per account, before an account exists, or with two accounts.
2. What does a second child's book get without Plus?
3. What happens to a letter being recorded when the limit is hit? Recommendation: never lose or discard what the person just said; keep it on the phone, offer Plus, save it on subscribing (LEGAL-REQ-062, marked pending founder).
4. Offer codes: can conversion be switched off for an offer-code free period (unverified), and are the reminders required for offer-code periods?
5. Can the free allowance (2) be changed later for existing users? 13.4 binds only 13.2 and the export and deletion items.
6. Should Plus still be described as including backup, Read together and extra themes? Carried over unchanged; the decision brief did not mention them.
