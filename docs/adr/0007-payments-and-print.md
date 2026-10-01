# ADR 0007: Payments — RevenueCat over StoreKit for digital; card payments for printed books via Lulu Print API

Status: Accepted. Date: 2026-10-01.

## Context
Monetization undecided: one-time unlock, subscription, or both, plus printed books. Must follow App Store rules. Founder should not maintain receipt validation.

## Rules (App Review Guidelines, opened 2026-10-01) [S20]
- 3.1.1: unlocking features or content (subscriptions, full version, premium content) **must use in-app purchase**.
- 3.1.2: auto-renewing subscriptions must last at least seven days and be available across the user's devices.
- 3.1.3(e): physical goods consumed outside the app **must use purchase methods other than IAP** (e.g. Apple Pay or card).
- External purchase links for digital goods: allowed via StoreKit External Purchase Link Entitlement in specific storefronts; the prohibition on such buttons/links does not apply on the **United States storefront**.
- 5.1.2(i): disclose and obtain explicit permission before sharing personal data with third-party AI.
- Commission: 15% under the Small Business Program for developers under $1M proceeds [S19].

## Options
| Option | Licence / cost | Notes |
|---|---|---|
| **RevenueCat** | free to $2,500 monthly tracked revenue, then 1% [S18] | Hosted receipt validation, entitlements, paywalls, webhooks to Supabase |
| expo-iap | open source; repo archived Aug 2026, moved to openiap monorepo; supports subs, consumables, non-consumables [S46] | We would own server-side validation |
| react-native-iap | same author family (Unverified current state) | same |

## Decision
- **RevenueCat** for all digital purchases (one-time non-consumable "Lifetime" and/or subscription; both modelled as entitlements so the business model can change without code changes).
- **Printed books:** card payment (Apple Pay / Stripe — Stripe pricing Unverified) in a web checkout or in-app Apple Pay sheet, then a Supabase Edge Function submits the print job to **Lulu Print API** (API free; you pay print cost, shipping, fulfillment fee and sales tax per job [S47]; sandbox, cost-calculation endpoint and webhooks available [S47]). Example: Lulu 6x9 hardcover total print cost $12.07 in Lulu's own comparison [S47] (not a photo book; get real quotes).
- Do not use US external purchase links for digital goods in v1 (complexity, review risk); revisit if fees matter.

## Consequences
1% of revenue above $2.5k MTR to RevenueCat. Print orders are outside Apple's commission but we own payments, refunds and support for them.

## Alternatives rejected
expo-iap alone (we would build validation and entitlement sync). Selling printed books via IAP (not allowed under 3.1.3(e)).
