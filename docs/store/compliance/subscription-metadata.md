# Plus subscription metadata (App Store Connect and Play Console)

Figures come only from `apps/web/src/content/pricing.ts` (`plusPricing`): **Plus Monthly $4.99, 1-month free trial; Plus Yearly $49.99, 2-month free trial**, US dollars, sold through the App Store in the US (ADR 0013, D-013). The membership model is D-051: the first two letters are free; adding new letters then needs Plus; letters already made always stay readable, playable and exportable.

**Status of the build.** The current code has no purchase path (Profile A): no `expo-iap`, `hasPlus()` returns false, the Plus button is disabled (`plus-gate.tsx`), the two-letter limit is not enforced anywhere, and the database enforces only "a second book needs Plus" in `create_child`. The server side of entitlements exists in pending migration `20261003010000` (`store_subscriptions`, `apply_store_transaction`, `has_plus`, `get_plan_state`) but there is no Edge Function in `supabase/` to receive Apple's notifications. So this page is the setup sheet for Profile B, and nothing here should be created in App Store Connect for a Profile A submission (OPEN-01, OPEN-09).

## 1. Subscription group

| Field | Value | Notes |
|---|---|---|
| Group reference name | `Early Letters Plus` | Internal |
| Group display name (US English) | `Early Letters Plus` (18 characters; limit 30) | Shown on the system subscription screens |
| Number of groups | 1 | ADR 0013: both plans are in one group so a person can hold only one at a time and can switch |
| Level order | Plus Yearly above Plus Monthly (same service) | Upgrade from monthly to yearly applies immediately; downgrade at the next renewal. Confirm the order in the console |
| App name shown | From the app record | Do not name other platforms (2.3.10) |

## 2. Products

| Field | Plus Monthly | Plus Yearly |
|---|---|---|
| Product ID | **OPEN-08**. ADR 0013 proposes `el_plus_monthly_399` | **OPEN-08**. ADR 0013 proposes `el_plus_annual_2999` |
| Reference name | `Plus Monthly` | `Plus Yearly` |
| Duration | 1 month | 1 year |
| Price (US storefront) | **$4.99** | **$49.99** |
| Other storefronts | Not enabled (US only at launch, D-013, LEGAL-REQ-058) | Same |
| Display name (limit 30) | `Plus Monthly` (12) | `Plus Yearly` (11) |
| Description (limit 45) | `Add new letters to the family book.` (35) | `Add new letters to the family book.` (35) |
| Introductory offer | **Free trial, 1 month**, new subscribers | **Free trial, 2 months**, new subscribers |
| Offer territories | United States | United States |
| Offer eligibility | New subscribers of this subscription group. Apple decides eligibility, one free trial per Apple Account per group | Same |
| Family Sharing | Off (decision needed; the membership is per account, and "one membership covers the book" is handled in our own entitlement model, K-28) | Same |
| Review screenshot | The Plus sheet from the build, showing both plans, price first, trial second | Same |
| Review notes | See `app-review-notes.md` section 5 | Same |

**Product ids (OPEN-08).** Ids are permanent. `el_plus_monthly_399` and `el_plus_annual_2999` bake the retired $3.99 and $29.99 prices into the id, which would mislead anyone reading logs and cannot be corrected later. Suggested price-free ids: `el_plus_monthly` and `el_plus_annual`. Whichever you choose, the same strings go into the app, the notification Edge Function and `store_subscriptions.product_id` (that column accepts `[A-Za-z0-9._-]{1,100}`, so both forms validate). If the app is later transferred to an organisation, ids must not collide with the recipient's (D-004, item 5).

Why not a hand-typed price in the metadata: the console price is chosen from Apple's US price points ($4.99 and $49.99 are standard points; confirm in the console), but every sentence in the app and listing that states a figure must be generated from `pricing.ts`, or `apps/web/test/pricing.test.ts` and the content tests will not protect it. `packages/content/src/store.en.ts` and `site.en.ts` still contain $3.99 and $29.99 (OPEN-10).

## 3. Sheet and listing text (figures filled from `pricing.ts`)

Strings are the ones in `docs/legal/in-app-disclosures.md` section 3 (draft for counsel), with the figures filled in. They obey the content rules.

| Key | Filled text |
|---|---|
| `plus.legal.renewTrial`, monthly | `1 month free, then $4.99 a month. Renews automatically until you cancel. Cancel by {cancelByDate} and you pay nothing.` |
| `plus.legal.renewTrial`, yearly | `2 months free, then $49.99 a year. Renews automatically until you cancel. Cancel by {cancelByDate} and you pay nothing.` |
| `plus.legal.renewNoTrial` | `{price} a {period}, charged now. Renews automatically until you cancel at least 24 hours before it renews.` (for people the store reports as not trial-eligible) |
| `plus.legal.letters` | `Plus lets you add new letters after your first 2. Letters you already made always stay yours to read, play and export.` |
| `plus.legal.agree` | `By subscribing, you agree that Plus renews automatically at this price until you cancel.` |
| `plus.legal.cancel` | `Cancel any time in Settings, Plan, Manage subscription, or in your Apple Account subscriptions.` |
| Store description subscription line | `Your first 2 letters are free. Plus adds more, and letters you made always stay yours. It renews until you cancel.` |
| Store description legal links | `Terms of Use: {TERMS_URL}  Privacy Policy: {PRIVACY_URL}` (not yet in `store.en.ts`; add it, OPEN-02) |

Guideline 3.1.2 checks for the sheet (all in `in-app-disclosures.md` section 3, draft): lead with the billed amount, the trial secondary; neither plan preselected; what Plus adds stated before the purchase button; auto-renewal terms near the button; visible links to Terms and Privacy Policy and a Restore control; Manage subscription one tap to the store's cancel screen; "free" wording for the trial only when the store reports eligibility; the phrase "first 2 letters" never in the same line as a price or trial.

## 4. Server and account setup (founder tasks)

| Item | Detail | Status |
|---|---|---|
| Paid Applications Agreement, banking, tax forms | Needed before any in-app purchase can be tested or submitted. As an individual (D-004) these are in the founder's personal name. Small Business Program (15%) is open to individuals | Founder, not verifiable here |
| App Store Server Notifications V2 | Production and sandbox URLs pointing to a Supabase Edge Function that verifies Apple's signed payload and calls `apply_store_transaction` (service role only) | Edge Function absent from `supabase/` (OPEN-06, OPEN-26) |
| In-App Purchase key / App Store Server API key | Created in App Store Connect; stored as an Edge Function secret, never in the repo | Founder |
| Sandbox | Production database counts sandbox purchases only if `app.store_environment = 'sandbox'` is set (`store_environment_allowed`). Apple reviewers buy in the sandbox even against production builds, so decide how production treats review purchases (OPEN-07) | Open |
| Billing Grace Period | On, 16 days (D-048, recommended) | Set in console |
| Price increases | Never raise without consent; notice 7 to 30 days before any change (`subscription-terms.md`) | Policy |
| Offer codes | Early-tester offers use Apple offer codes, not our own code system (D-052); not required to ship v1.0.0 | Optional |
| Refunds | Apple's own flow (`reportaproblem.apple.com`, or the in-app request). A refund never changes letters or recordings | Policy |
| Restore | `syncIOS` / restore; never moves an active subscription between two accounts (D-047) | Build |
| Account binding | Random `appAccountToken` per account (`my_app_account_token()`); not the profile id | Built in DB |

## 5. Entitlement states that the review build must handle

`store_subscriptions.status` values: `trial`, `active`, `grace`, `billing_retry`, `expired`, `revoked`, `refunded`. `has_plus()` is true for trial, active and grace while unexpired (with 5 minutes of clock skew). Expiry must never delete a letter: "If Plus ends" in `subscription-terms.md`. A reviewer who cancels in the sandbox should still be able to read, play and export everything they made.

## 6. Google Play (prepared, not in v1.0 scope: OPEN-20)

| Field | Value |
|---|---|
| Subscription | One subscription "Early Letters Plus", two base plans |
| Base plans | Monthly, $4.99, auto-renewing; Yearly, $49.99, auto-renewing |
| Offers | Free trial offers, 1 month on the monthly plan and 2 months on the yearly plan, for new customers |
| Countries | United States only at launch |
| Grace period | Mirror D-048; confirm Play's allowed lengths |
| Billing in the app | ADR 0013 designs Apple only; Android billing and the account-token mapping are not designed (README capability table; ADR 0007 kept RevenueCat as the "likely Android-time option") |
| Pricing disclosure | Same sheet text; replace "Apple Account" with the Play equivalent in Android-only strings |

## 7. Open questions for the founder (subscriptions only)

1. OPEN-08: final product ids and group names.
2. OPEN-09: what the app does at the limit, and whether the two-free-letters rule ships in v1.0.0. The D-051 edges are still open: do family letters count toward the two; what a second child's book gets without Plus; what happens to a letter being recorded when the limit is hit (the recommendation in `subscription-terms.md` is to keep it on the phone and let the person save it after subscribing; counsel to confirm that is consistent with "letters already made always stay").
3. Read together: D-009 says 3 free sessions per book. Store copy repeats it (`store.en.ts`), and `subscription-terms.md` lists Read together under Plus. Confirm that this rule and the two-letter rule are both in v1.0.0 and both shown on the sheet.
4. License agreement: use Apple's standard EULA, or custom terms (the draft Terms hold Apple's minimum terms and the individual publisher's name, D-004). The published Terms for the app do not exist yet (OPEN-02).
5. Free-trial and "free letters" wording: counsel's FTC "free" check (CR-012, 16 CFR 251) is still unverified in the repo.
