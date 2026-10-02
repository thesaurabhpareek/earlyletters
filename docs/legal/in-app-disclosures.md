---
title: Early Letters in-app and store disclosures
version: 1.0.0
status: draft-for-counsel
effective_date: TBD
last_updated: 2026-10-02
owner: founder
related: terms-of-service.md (1.1.0), subscription-terms.md (1.0.0), packages/content/VOICE.md
---

> **Drafting notice.** This document was drafted by an AI (Claude) for review by a licensed attorney. It is not legal advice. Notes for counsel appear as **[COUNSEL: ...]**.

# In-app and store disclosures

The exact short strings for the beta label, the "it can make mistakes" note, and the paywall legal links, with where each one appears. Every string is under 140 characters as stored (with prices filled in, they stay under 140), uses straight quotes, and has no em dashes, en dashes, ellipsis characters or emoji. Strings move into `packages/content` (strings.en.ts and store.en.ts) so the content rule tests run on them. `{child}`, `{monthlyPrice}`, `{annualPrice}` and `{date}` are placeholders filled at runtime; prices always come from the store.

**Voice note.** The brief's example used "We tidy small slips". VOICE.md bans words that suggest software "tidied" a letter, so these strings say "fix small slips" instead, which matches story 2 ("We fix slips of the tongue.").

## 1. Beta label

| Key | Where it appears | String | Chars |
|---|---|---|---|
| `about.beta.label` | Settings > Help and Legal > About, under the app name and version | Beta | 4 |
| `about.beta.body` | Same screen, below the label | Early Letters is in beta. Some things may change or break. Export a copy of your letters now and then. | 102 |
| `about.beta.exportCta` | Button under `about.beta.body` (opens Export everything) | Export a copy | 13 |

Rules: show the label quietly (caption style, no badge colour). Never show it on Tonight, Listening, Review or the Book. Remove all beta strings in the same release as Terms Section 16.4.

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
| `plus.legal.renewAnnual` | Plus sheet, directly under the annual option when the user is trial-eligible | Free for 2 months, then {annualPrice} a year. Renews automatically until you cancel, at least 24 hours before it renews. | 120 |
| `plus.legal.renewMonthly` | Plus sheet, under the monthly option when trial-eligible | Free for 1 month, then {monthlyPrice} a month. Renews automatically until you cancel, at least 24 hours before it renews. | 121 |
| `plus.legal.renewNoTrial` | Plus sheet, under either option when not trial-eligible | {price} a {period}, charged now. Renews automatically until you cancel, at least 24 hours before it renews. | 107 |
| `plus.legal.cancel` | Plus sheet, above the links | Cancel any time in Settings, Plan, Manage subscription, or in your Apple or Google account. | 91 |
| `plus.legal.links` | Plus sheet footer; each word is a link | Terms of Service, Privacy Policy, Subscription terms, Restore (four separate link labels) | see note |
| `plus.legal.agree` | Plus sheet, directly above the purchase button | By continuing, you agree to the Subscription terms and Terms of Service. | 72 |

Note on `plus.legal.links`: the component draws the separators, so the stored strings are four separate labels: "Terms of Service" (16), "Privacy Policy" (14), "Subscription terms" (18), "Restore" (7).

Rules: all of section 3 is visible at the default text size without scrolling past the purchase button, and wraps (never truncates) at the largest Dynamic Type size (PRD C-REQ-022, C-NFR-006). "Free trial" wording appears only when the store reports eligibility. Links open in-app. This is store-required disclosure text, which VOICE and PRD C section 7 allow to state prices, dates and renewal plainly.

**[COUNSEL: Covers Apple DPLA Schedule 2 section 3.8(b) (title, length, price, links to Privacy Policy and Terms of Use in the app), Google Play Subscriptions policy, and California Business and Professions Code 17602 (clear and conspicuous terms near the purchase button, price after the trial, express affirmative consent). Confirm whether `plus.legal.agree` plus the store's purchase sheet is enough "express affirmative consent", or whether a separate checkbox is needed. Log paywall version, product and time for each purchase as proof of consent. If Apple's Standard EULA is used, App Store metadata must also link the Terms of Use.]**

## 4. Store listing

| Key | Where it appears | String | Chars |
|---|---|---|---|
| `store.description.betaLine` | App Store and Google Play description, last paragraph | Early Letters is in beta. We are still building, and some things may change. Your letters are always yours to export. | 117 |
| `store.description.subscriptionLine` | App Store and Google Play description, after the feature list | Writing, reading, listening and export are free, always. Plus is optional and renews automatically until you cancel. | 116 |
| `store.description.legalLinks` | Last lines of the description | Terms of Service: {TERMS_URL} Privacy Policy: {PRIVACY_URL} | varies |
| `store.promotionalText.beta` | App Store promotional text (optional, changeable without review) | Now in beta. Tell us what you think at {SUPPORT_EMAIL}. | 55 |

Rules: no "beta" in the app name or subtitle (30-character fields are reserved for the name and category). Remove the beta lines when the label ends.

## 5. Where each disclosure is backed in the Terms

| Disclosure | Terms of Service section |
|---|---|
| Beta label and store beta line | 16.4, 20.2 |
| "It can make mistakes" note | 11.4 to 11.6, 20.2, 20.3 |
| Paywall disclosure and links | 14, Subscription Terms |
| "Your letters are always yours to export" | 12.3, 13 |

## Changelog

| Version | Date | Status | Changes |
|---|---|---|---|
| 1.0.0 | 2026-10-02 | draft-for-counsel | First draft, prepared by Claude for counsel review, at the founder's request. |
