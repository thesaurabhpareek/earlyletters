---
title: Lawyer 1 review, Terms of Service, subscriptions and consumer disclosures
date: 2026-10-02
reviewer: AI (Claude), acting as US technology and consumer-protection counsel
documents: terms-of-service.md 1.2.0, subscription-terms.md 1.1.0, in-app-disclosures.md 1.1.0
---

> **This is an AI review prepared for licensed counsel. It is not legal advice.** No attorney-client relationship exists. A California-licensed attorney must review and approve every document before publication. Where a source could not be opened, this memo says so.

# Lawyer 1 review: terms and consumer law

## Summary

The drafts were already careful: no arbitration, honest promises, Apple minimum terms, liability carve-outs. The main risks were (1) reminder timings that met California but not New York, Virginia, Utah or Massachusetts, and a product spec (PRD C) that sends notices on days that break several of them; (2) fixed trial lengths in legal text while a pricing experiment varies them; (3) "18+" with no confirmation step; (4) price-increase wording that left a New York refund duty we could not perform on Apple purchases. Fixes are applied in my three documents. Product and copy changes owned by others are listed under "Requested changes".

Pricing applied: free core (write, read, play back, export, family authors); Plus $3.99 a month with a 1-month free trial or $29.99 a year with a 2-month free trial, through Apple first and Google Play later via RevenueCat; extra children in Plus; lifetime and print later; US only; beta; 18+.

## Findings

### High

**H1. Reminder windows did not satisfy all state auto-renewal laws, and PRD C conflicts with them.** Fixed in Terms 14.6 and Subscription Terms. Windows that apply together:

| Law | Annual renewal notice | Trial-ending notice |
|---|---|---|
| California 17602(b) (AB 2863, from 1 July 2025) [L1] | 15 to 45 days before renewal | Trial over 31 days: 3 to 21 days before it ends; if both apply, only the (b)(2) notice is required |
| New York GBL 527-a (from 5 Nov 2025) [L10, L11] | 15 to 45 days before the cancellation deadline | Trial over one month: 3 to 21 days before the cancellation deadline |
| Virginia 59.1-207.46 (version from 1 Oct 2026) [L12] | 30 to 60 days before renewal | Trial over 30 days: within 30 days of the end |
| Utah (from 1 Jan 2025) [L13] | 30 to 60 days | At least 3 days before the end |
| Massachusetts 940 CMR 38.00 (from 2 Sep 2025) [L13, L14, secondary] | 5 to 30 days before the cancellation deadline | State the calendar date to cancel by |

The only day that fits every annual window is about 30 days before renewal. The draft now says: annual renewal about 30 days before and again about 7 days before; trials over one month 16 to 21 days before the end; every trial at least 3 days before the last day to cancel (trial end minus 24 hours, so D-4). **Decision needed, owner PRD C agent:** C-REQ-025, C-REQ-026 and section 4.3 still say D-7 and D-3 for trials and D-7 for annual renewal. Either PRD C changes, or the Terms lines are cut before publication. Promising notices the product does not send is a misrepresentation in its own right. The 30-day window is tight: schedule it in UTC with a margin and test it.

**H2. Trial length was hard-coded in legal text, but the trial experiment varies it.** PRD C section 8 tests 2-month, 1-month and 2-week trials on the annual plan. Fixed: Terms 14.2 and Subscription Terms now say the price, trial length and cancel-by date shown in the app are the terms that apply. Paywall strings take `{trialLength}` and `{cancelByDate}` from the store offer.

**H3. Express affirmative consent and proof of consent.** California 17602(a)(4) requires express affirmative consent to the renewal terms, and (a)(6) requires keeping proof for 3 years, or 1 year after termination if longer [L1]. Fixed: `plus.legal.agree` now names automatic renewal ("you agree that Plus renews automatically at this price until you cancel"), there is a retained acknowledgment (`plus.ack.body`, also emailed), and a consent-log rule. ROSCA (15 U.S.C. 8403: disclose material terms before billing, express informed consent, simple cancellation) is met by the same design; the statute page could not be opened.

**H4. The 18+ rule had no confirmation step (and the Texas and California age laws).** Fixed: Terms 1.5 and 2.1 and new strings `auth.legal.accept` and `web.legal.accept` ("By continuing, you confirm you are 18 or older..."). If we learn a user is under 18, we close the account and offer an export where lawful. **Counsel needed:** whether a self-declaration is enough under Texas SB 2420 (App Store Accountability Act; search results say it is in force in 2026, not opened), similar Utah and Louisiana laws, and California AB 1043 (developers request an age signal from 1 Jan 2027). A store signal showing a minor is actual knowledge. This draft excludes teen parents; counsel to confirm.

### Medium

**M1. Price increases.** New York requires consent to an increase, or a right to cancel within 14 days of the higher charge with a pro-rata refund [L10]. We cannot issue Apple refunds. Fixed: Terms 14.8 now says we never renew at a higher price without the user's agreement. **Owner PRD C:** always use the store's opt-in consent flow for increases, never Apple's notice-only option. Notice stays at 7 to 30 days (California 17602(g)).

**M2. Cancellation path.** California 17602(d) (direct link or button), Colorado (one-step online cancel, from 16 Feb 2026), New York (cancel through all mediums), Minnesota (no unsolicited retention offers), and a New York City click-to-cancel rule reported in force 1 Oct 2026 (search result only). Fixed: Terms 14.10 "We never put an offer or extra step between you and cancelling", and a one-tap rule for Manage subscription. **Counsel needed:** whether a deep link to Apple's cancel screen meets the "one step" laws.

**M3. Marketing claims stronger than the transcription promise.** `store.en.ts` says "keeps every word exactly as you said it" and "Every sentence in your book is one you actually said". `strings.en.ts` says "We only tidy what the microphone got wrong". But Terms 11.1 allows removing fillers and fixing grammar slips ("she have" to "she has"). That gap is UCL and false-advertising risk, and "tidy" and "Lightly tidied" also break VOICE.md. **Owner packages/content:** say "Kept in your words. We only fix small slips, and you can undo every fix." No change to the Terms.

**M4. Store listing missing the Terms of Use link.** The `store.en.ts` description has no Terms of Use or Privacy link. Apple Schedule 2 section 3.8(b) needs them in the app, and Apple review commonly expects them in the metadata too. **Owner packages/content:** add `store.description.legalLinks`.

**M5. Store copy "we never sell or share your data"**, and the site FAQ saying recordings leave the phone when a letter is shared with family, while Terms 12.1 says recordings leave only with backup or the web page. **Owner: privacy lawyer (Lawyer 2) and packages/content:** "share" is a CCPA term of art and data does go to service providers and family, so narrow to "We never sell your data and never use it for ads." The PRD B owner should confirm whether family playback moves audio, and Terms 12.1 will follow.

**M6. Family copies after an author withdraws a letter.** The license in 7.1 ended when a letter left the book, which in theory would cover a grandparent's printed book. Fixed: 7.2 lets readers keep copies they already made for personal family use.

**M7. Co-authorship and recordings with several voices.** Fixed: new 5.4. The person who saves a letter is its author, and other adults' voices need their agreement. Each author still owns their own letters (5.1). Open: the B-REQ-025 "leave my letters for {child}" option will need a license that survives account deletion (Terms 8 counsel note).

**M8. Massachusetts monthly-plan disclosures.** For terms of 31 days or less, the key terms must be repeated as often as the user is billed [L14, secondary source]. **Counsel needed:** if this applies, PRD C should add a renewal-receipt email with how to cancel.

### Low

**L1. Beta and "can make mistakes" disclaimers, kept light.** Fixed: 11.5 and 11.6 are merged into one line. The in-app strings are unchanged (one-time Review card, Help line, quiet About label). These disclaimers do not override the binding promises (16.4, 20.4), and they should not. Under California law a disclaimer cannot cancel out an express promise in marketing, so M3 matters more than the disclaimer wording.

**L2. Liability cap.** The cap is the greater of 12 months' fees or $50, and it excludes fraud, intentional misconduct, gross negligence, violation of law and personal injury. That tracks Civil Code 1668, under which these exclusions are void, and the rule that future gross negligence cannot be released. 21.2 now names the CLRA (Civil Code 1751, which says CLRA rights cannot be waived). The code pages could not be opened; the text was relied on from general knowledge. **Decision:** whether breach of 6.2 (no training, no sale) or a security breach should sit outside the cap. A $50 cap for losing irreplaceable family recordings invites an unconscionability argument (Civil Code 1670.5).

**L3. Arbitration.** Keep courts plus small claims, as drafted. Reasons: brand trust, no mass-arbitration fee exposure under CCP 1281.97 to 1281.98, and McGill already preserves public injunctive relief. The trade-off is class-action exposure. Option B stays in the draft for counsel.

**L4. Apple EULA.** 26.1 tracks Apple's ten minimum terms [S2]. 1.2.0 removes "Legacy Contacts" from the license scope to match Apple's text, which names only Family Sharing and volume purchasing. Recommendation: use these Terms as a custom EULA, so one document governs, rather than the Standard EULA, whose blanket "as is" terms sit badly beside our promises. A real support phone number is required either way.

**L5. 90-day shutdown promise.** It is enforceable as a contract promise while the company is solvent. It may not survive a bankruptcy trustee's rejection of the contract. Keep it, and fund a wind-down reserve. Export runs on the phone, so the practical risk is limited to backups.

**L6. Free forever (13.3) cannot be amended for existing users.** That is deliberate and binds a buyer through 17.2 and 27.3. Confirm the founder accepts this.

## Requested changes for other owners

| Owner | Change |
|---|---|
| PRD C | H1 notice days (annual renewal D-30 and D-7; long trial D-16 to D-21; every trial at least D-4); M1 opt-in price consent; consent log; trial length from the store offer; M8 receipt email if needed |
| PRD A | `auth.legal.accept` with the 18+ confirmation (A-REQ-034); age-signal handling plan for Texas and AB 1043 |
| packages/content | M3 copy fixes (store, settings `neverRewrite`, `tidyLabel`, `tidyOn`); M4 legal links; add the section 3 and 3a strings to strings.en.ts |
| Lawyer 2 (privacy) | M5 "sell or share" wording; recording-flow consistency with Terms 12.1 |

## Questions for licensed counsel (target 1 to 3 hours)

1. **Store-billed auto-renewal (about 45 min).** With Apple as merchant of record, do the California, New York, Virginia, Massachusetts, Colorado and NYC duties apply to us as stated, and do the D-30 annual notice and the 16 to 21 day trial notice satisfy all of them? Is the store's purchase sheet plus `plus.legal.agree` express affirmative consent, and does a deep link to Apple's cancel screen meet the one-step cancellation laws?
2. **Age (about 30 min).** Is a self-declared 18+ confirmation enough under Texas SB 2420 and similar laws now, and what must change by 1 Jan 2027 for AB 1043? Should teen parents be excluded?
3. **Liability and promises (about 30 min).** Is the $50 floor enforceable for consumer data loss? Should a security breach or breach of 6.2 be carved out of the cap? Do the binding promises (Sections 6.2, 11, 13 and 17) bind an asset buyer, and what survives insolvency?
4. **Arbitration and EULA (about 15 min).** Confirm no arbitration, and a custom EULA rather than Apple's Standard EULA.

## Sources

Opened on 2 October 2026: [L1] AB 2863 chaptered text (LegiScan; the official leginfo page blocks automated access); FTC Negative Option Rule page (2024 rule; ANPRM 11 to 13 March 2026; no later action shown); [L10] NY GBL 527-a (Justia); [L11] Perkins Coie on New York and Colorado; [L12] Virginia Code 59.1-207.46 (LIS); [L13] Kelley Drye 2025 round-up; [L14] Churnkey on Massachusetts (secondary); Fenwick on AB 2863; [S2] Apple minimum EULA terms; Apple App Review Guidelines 3.1.2 and 5.1.1(v). Search results only, not opened: Eighth Circuit vacatur (July 2025); NYC click-to-cancel rule; Texas SB 2420 status; California AB 1043. Not opened, from general knowledge: Civil Code 1668, 1670.5, 1751; 15 U.S.C. 8403; CCP 1281.97 to 1281.98. Internal: docs/prd/C-habits-pricing-settings.md, docs/research/COMPETITIVE_RESEARCH.md, packages/content/src/store.en.ts, strings.en.ts, site.en.ts, VOICE.md, docs/legal/POLICY_VERSIONING.md.
