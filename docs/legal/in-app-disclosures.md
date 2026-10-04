---
title: Early Letters in-app and store disclosures
version: 3.0.0
status: draft-for-counsel
effective_date: TBD
last_updated: 2026-10-04
owner: founder
related: terms-of-service.md (3.0.0), subscription-terms.md (3.0.0), privacy-policy.md (2.0.0), packages/content/VOICE.md
---

# In-app and store disclosures

The short statements the app and the App Store listing make about privacy, mistakes and Plus, where each one appears, and which legal text backs it. The live strings are in `packages/content` (and `apps/mobile/src/components/consent/copy.ts` until moved there), where the content rule tests run on them. This file does not repeat the strings, so it cannot drift from them.

## 1. What each disclosure says

| Disclosure | Where it appears | It must say | Backed by |
|---|---|---|---|
| Early version label | Settings, Help and Legal, About | Early Letters is an early version and can make mistakes; export a copy now and then | Terms 8 |
| "Have a read" note | Once, on the first spoken letter, before the first save | We fix small slips and can mishear a word or name; please read it before you save | Terms 4.3 |
| Trust line | Settings, Privacy (top), first recording, website, store listing | Your letters and recordings are private; never sold, never used for ads, never used to train machine learning models | Privacy Policy, short version and section 5; Terms 3.2 |
| Voice line | Where a recording is made or kept | We never imitate your voice; the original recording is kept exactly as made | Privacy Policy 5; Terms 4.2 |
| Microphone permission | iOS prompt | The microphone records the letters you speak; recordings stay on this phone | Privacy Policy 2 and 3 |
| Usage reports | Settings, Privacy toggle; one consent ask after the first letter | Simple counts, never letters, recordings or names; off until you say yes; change it any time | Privacy Policy 3 |
| Plus | Apple's subscription screen plus our text above it; Settings, Plan | What Plus adds, price and trial from Apple, renews until you cancel, cancel 24 hours before it ends, Family Sharing | Subscription Terms; Terms 6 |
| Store listing | App Store description | The same trust line; the Plus paragraph; links to Terms and Privacy Policy, and the Consumer Health Data Privacy Policy if counsel asks for it | All of the above |

## 2. Rules

- "Your recordings stay on this phone" is true while nothing uploads or backs up audio. It must change in the same release as any audio upload.
- The store listing never says "beta" (D-060). The in-app early-version note stays.
- Prices and trial lengths come from Apple's offer, never from code.
- Nothing above the plans may make the free period more prominent than the price Apple bills.
- Manage subscription opens Apple's cancel screen in one tap, with nothing in between.
- Straight quotes, no dashes, ellipsis characters or emoji. `{child}` and `{app}` are filled at run time.

## 3. Strings that still describe the earlier plan

The membership decision of 4 Oct 2026 (2 free letters, then Plus) is in the legal texts but not yet in the app. These strings and the plan engine still describe "free, always", "your first book is free" and "writing with your co-parent", and must change in the same release as the 2-letter gate: `packages/content/src/features/billing.en.ts` (promise), `strings.en.ts` (plus), `store.en.ts` (subscription paragraph and "A book for each child"), `site.en.ts` (Plus FAQ). The content rules test pins the old Plus wording, so changing it means changing that test deliberately, in the same pull request as the gate.

## Changelog

| Version | Date | Change |
|---|---|---|
| 3.0.0 | 2026-10-04 | Shortened to a table of where each disclosure appears and what backs it. Removed the quoted strings, sign-in acceptance, reminder and confirmation-sheet designs (not built), and the web contributor items. Listed the strings that still carry the earlier plan. Nothing is published. Earlier text is in git history. |
| 1.4.0 | 2026-10-03 | Draft for the server version. |
