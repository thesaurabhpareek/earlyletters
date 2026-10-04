---
title: Early Letters in-app and store disclosures
version: 2.0.0
status: draft-for-counsel
effective_date: TBD
last_updated: 2026-10-04
owner: founder
related: terms-of-service.md (2.0.0), subscription-terms.md (2.0.0), packages/content/VOICE.md, docs/legal/memos/lawyer-1.md
---

> **Drafting notice.** This document was drafted by an AI (Claude) for review by a licensed attorney. It is not legal advice. Notes for counsel appear as **[COUNSEL: ...]**.

# In-app and store disclosures

The exact short strings for the beta label, the "it can make mistakes" note, and the paywall legal links, with where each one appears. Every string is under 140 characters as stored (with prices filled in, they stay under 140), except `store.description.subscriptionLine`, a paragraph of the store description (145), uses straight quotes, and has no em dashes, en dashes, ellipsis characters or emoji. Strings move into `packages/content` (strings.en.ts and store.en.ts) so the content rule tests run on them. `{child}`, `{price}`, `{period}`, `{trialLength}`, `{cancelByDate}`, `{renewDate}` and `{date}` are placeholders filled at runtime. Prices and trial lengths always come from the store offer, never from code, because the trial experiment (PRD C section 8) varies the length. `{cancelByDate}` is the trial or period end minus 24 hours, shown as a calendar date.

**Voice note.** The brief's example used "We tidy small slips". VOICE.md bans words that suggest software "tidied" a letter, so these strings say "fix small slips" instead, which matches story 2 ("We fix slips of the tongue.").

## 1. Beta label

| Key | Where it appears | String | Chars |
|---|---|---|---|
| `about.beta.label` | Settings > Help and Legal > About, under the app name and version | Beta | 4 |
| `about.beta.body` | Same screen, below the label | Early Letters is in beta. Some things may change or break. Export a copy of your letters now and then. | 102 |
| `about.beta.exportCta` | Button under `about.beta.body` (opens Export everything) | Export a copy | 13 |

Rules: show the label quietly (caption style, no badge colour). Never show it on Tonight, Listening, Review or the Book. Remove all beta strings in the same release as Terms Section 16.4. The beta ends only when the founder says so (PRD.md K-13); there is no date or metric trigger.

## 2. "It can make mistakes" note

| Key | Where it appears | String | Chars |
|---|---|---|---|
| `review.firstNote.title` | One-time card at the top of Review, the first time a spoken letter is transcribed on this install | Please have a read | 18 |
| `review.firstNote.body` | Same card | We fix small slips, like "um" and repeats. We can also mishear a word or a name. Please read it before you save. | 112 |
| `review.firstNote.dismiss` | Card button | Got it | 6 |
| `help.mistakes` | Settings > Help and Legal > How transcription works (always available) | Your words are kept as you said them. We can mishear, so read each letter and fix anything we got wrong. | 104 |

Rules: shown once per install, after the first transcript appears and before the first save, so it is seen at the right moment without blocking. It never returns as a nag. It never appears for typed letters. It may also appear once on the family web page after a contributor's first spoken letter is transcribed (key `web.firstNote.body`, same text as `review.firstNote.body`).

**[COUNSEL: The note supports Terms Section 11.6 (user reviews and is responsible). It deliberately does not say "not a medical or legal record" in the product, because that line would read as alarming at a tender moment; that limit lives in the Terms (11.6, 20.3). Confirm this is acceptable.]**

## 3. Paywall legal links and disclosure

| Key | Where it appears | String | Chars |
|---|---|---|---|
| `plus.legal.renewTrial` | Plus sheet, directly under the chosen plan when trial-eligible | {trialLength} free, then {price} a {period}. Renews automatically until you cancel. Cancel by {cancelByDate} and you pay nothing. | up to 123 filled |
| `plus.legal.renewNoTrial` | Plus sheet, under the chosen plan when not trial-eligible | {price} a {period}, charged now. Renews automatically until you cancel at least 24 hours before it renews. | up to 101 filled |
| `plus.legal.cancel` | Plus sheet, above the links | Cancel any time in Settings, Plan, Manage subscription, or in your Apple Account subscriptions. | 95 |
| `plus.legal.agree` | Plus sheet, directly above the purchase button | By subscribing, you agree that Plus renews automatically at this price until you cancel. | 88 |
| `plus.legal.letters` | Plus sheet, in the list of what Plus adds, before the purchase button (Apple 3.1.2(c)). **Draft wording, counsel and founder to approve** | Plus lets you add new letters after your first 2. Letters you already made always stay yours to read, play and export. | 119 |
| `plus.redeem.row` | Settings > Plan, row "Redeem a code"; also a quiet link on the Plus sheet. Opens the App Store's own code sheet. **Pending BL-213; draft wording** | Redeem a code | 13 |
| `plus.redeem.note` | Same row, one line below it | Codes are redeemed through the App Store. When a free period ends, Plus renews at the price shown unless you turn off renewal first. | 132 |
| `plus.legal.links` | Plus sheet footer; each label is a link | Terms of Service, Privacy Policy, Subscription terms, Restore (four separate labels) | 16, 14, 18, 7 |
| `plus.ack.body` | Confirmation sheet after purchase, and the same text in the confirmation email | Plus is on, free until {date}. Then {price} a {period} until you cancel. Cancel by {cancelByDate} to pay nothing. | up to 125 filled |

Rules:
- The plan option leads with the billed amount ("{price} a year"); the free period is secondary text. Apple reviewers commonly reject paywalls where the free period is more prominent than the billed price (Unverified practice, not a quoted guideline).
- Neither plan is preselected. The sheet states what Plus adds before the purchase button (Apple 3.1.2(c)).
- All of section 3 is visible at the default text size without scrolling past the purchase button, and wraps, never truncates, at the largest Dynamic Type size (PRD C-REQ-022, C-NFR-006).
- "Free" wording for a free trial appears only when the store reports eligibility. The words "first 2 letters" are the free version, not a free trial; never put them in the same line as a trial or price. Links open in-app.
- The Manage subscription row opens the store's cancel screen in one tap. No offer, survey or extra screen comes before it.
- Log paywall version, product, offer and time for each purchase as proof of consent, kept at least 3 years or 1 year after the plan ends, whichever is longer (California 17602).
- This is store-required disclosure text, which VOICE and PRD C section 7 allow to state prices, dates and renewal plainly.

**[COUNSEL REVIEW, founder decision of 4 Oct 2026: `plus.legal.letters` is new, because the sheet must now say that new letters after the first 2 need Plus. `plus.redeem.row` and `plus.redeem.note` reflect the offer-code request of 4 Oct: unverified whether Apple allows a code's free period to be set not to convert, so the note says renewal can be turned off. Whether the limit moment also needs a sheet string (what the person sees when they reach the second letter, and what happens to a letter being recorded) is open; recommendation: never lose or discard what the person just said. Strings are not yet in packages/content; the content rules apply when they move.]**

**[COUNSEL: Covers Apple DPLA Schedule 2 section 3.8(b), Google Play Subscriptions policy, California 17602 (clear and conspicuous terms near the button, price after the trial, express affirmative consent to the renewal terms, retained acknowledgment) and Massachusetts (calendar date to cancel by). Confirm that `plus.legal.agree` plus the store's purchase sheet is express affirmative consent to the renewal terms, or whether a separate tap is needed.]**

## 3a. Sign-in acceptance (owner: PRD A, A-REQ-034)

| Key | Where it appears | String | Chars |
|---|---|---|---|
| `auth.legal.accept` | Above the sign-in buttons | By continuing, you confirm you are 18 or older and agree to the Terms and Privacy Policy. | 89 |
| `web.legal.accept` | Family web page (v1.1, PRD K-35), above the first Send | By sending, you confirm you are 18 or older and agree to the Terms and Privacy Policy. | 86 |

Rule: the acceptance stores the Terms version and time (POLICY_VERSIONING section 7). Terms 1.5 and 2.1 rely on this line.

## 4. Store listing

| Key | Where it appears | String | Chars |
|---|---|---|---|
| `store.description.betaLine` | App Store and Google Play description, last paragraph. **Pending founder decision D-030 (PRD K-37):** recommended not to use it in the v1.0 App Store listing, because Guideline 2.2 keeps betas on TestFlight; the in-app label in section 1 stays | Early Letters is in beta. We are still building, and some things may change. Your letters are always yours to export. | 117 |
| `store.description.subscriptionLine` | App Store and Google Play description, after the feature list. **Changed 4 Oct 2026; draft wording for counsel. The store description closing paragraph in `store.en.ts` was rewritten at the same time.** | Your first 2 letters are free. Plus adds more, and letters you made always stay yours. It renews until you cancel. | 114 |
| `store.description.legalLinks` | Last lines of the description | Terms of Use: {TERMS_URL} Privacy Policy: {PRIVACY_URL} | varies |
| `store.promotionalText.beta` | App Store promotional text (optional, changeable without review). **Pending D-030:** recommended not used at v1.0 | Now in beta. Tell us what you think at {SUPPORT_EMAIL}. | 55 |

Rules: `packages/content/src/store.en.ts` does not yet end its description with `store.description.legalLinks`; the content owner must add it (Apple expects a Terms of Use link for auto-renewing subscriptions). No "beta" in the app name or subtitle (30-character fields are reserved for the name and category). Remove the beta lines when the label ends.

## 5. Where each disclosure is backed in the Terms

| Disclosure | Terms of Service section |
|---|---|
| Beta label and store beta line | 16.4, 20.2 |
| "It can make mistakes" note | 11.4 to 11.6, 20.2, 20.3 |
| Paywall disclosure and links | 14, Subscription Terms |
| 18+ acceptance line | 1.5, 2.1 |
| "Your letters are always yours to export" | 12.3, 13.2 |
| First 2 letters free; new letters need Plus | 13.1, 13.3, 14.1 |

## Changelog

| Version | Date | Status | Changes |
|---|---|---|---|
| 2.0.0 | 2026-10-04 | draft-for-counsel | Founder decision of 4 Oct 2026 (membership model) and offer-code request. `store.description.subscriptionLine` rewritten (the old line said writing and export were "free, always" and Plus was "optional"; the new line is 114 characters, inside the 145 stated in the intro; the longer store description closing paragraph in `store.en.ts` carries the full price, trial and cancellation disclosure); new strings `plus.legal.letters`, `plus.redeem.row`, `plus.redeem.note`; trial versus free-version wording rule; backing table updated. **Major** under POLICY_VERSIONING 2.1 items 4 and 6 (removes a promise). Unpublished draft, no users bound; counsel to confirm. |
| 1.3.0 | 2026-10-03 | draft-for-counsel | Alignment with PRD.md 1.3: `plus.legal.cancel` names only Apple (Plus is sold through the App Store only at v1.0, ADR 0013; App Review 2.3.10 bars other platforms' names in iOS copy); `store.description.betaLine` and `store.promotionalText.beta` marked pending D-030 (recommended: TestFlight beta, no store beta line); `web.legal.accept` ships with the web page in v1.1. Patch-level wording; counsel to confirm. |
| 1.2.0 | 2026-10-02 | draft-for-counsel | Product alignment with PRD.md 1.2: `subscriptionLine` uses "playing your recordings" and matches `store.en.ts` (K-11); beta ends only on the founder's decision (K-13). Patch-level wording; counsel to confirm. |
| 1.1.0 | 2026-10-02 | draft-for-counsel | Consumer-law review: paywall strings take trial length and cancel-by date from the store offer; clearer renewal wording; consent line now names automatic renewal; acknowledgment string; prominence, one-tap cancel and consent-log rules; 18+ acceptance strings (3a); store legal-links gap flagged. Beta and mistakes strings unchanged. |
| 1.0.0 | 2026-10-02 | draft-for-counsel | First draft, prepared by Claude for counsel review, at the founder's request. |
