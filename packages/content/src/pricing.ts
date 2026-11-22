// The one place Plus prices and trial wording live for public copy (website, store listing, pages).
// Founder, 4 Oct 2026 (D-082): monthly $4.99 with a 1-month free trial; yearly $49.99 with a 2-month free trial.
// Yearly is priced at about ten months for twelve months of access (12 x 4.99 = 59.88; 59.88 - 49.99 = 9.89,
// about two months). The trial and the yearly discount are two separate things.
// NEVER used in app copy: the app shows Apple's own sheet, which carries the storefront price and trial
// eligibility (D-083). The mobile app's source for these numbers is storekit/EarlyLetters.storekit.
// To change a price or a trial length, change it here and in the StoreKit file, then App Store Connect.
export const PLUS_PRICE = {
  monthly: '$4.99',
  yearly: '$49.99',
} as const;

/** Free-trial wording, kept apart from the prices so the trials can change without touching the numbers. */
export const PLUS_TRIAL = {
  monthly: 'the first month free',
  yearly: 'the first 2 months free',
} as const;

export const plusPriceLine = {
  line: `${PLUS_PRICE.monthly} a month or ${PLUS_PRICE.yearly} a year`,
  monthly: `${PLUS_PRICE.monthly} a month, with ${PLUS_TRIAL.monthly}`,
  annual: `${PLUS_PRICE.yearly} a year, with ${PLUS_TRIAL.yearly}`,
} as const;

/**
 * App Store Connect metadata for Plus: what the founder types into the subscription group and the two
 * products (docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md steps 3 and 4), mirrored in
 * apps/mobile/storekit/EarlyLetters.storekit (test: apps/mobile/test/billing-plan.test.ts). Display names
 * per D-077. Apple's In-App Purchase limits (App Store Connect Help, In-App Purchase information, read
 * 15 Oct 2026): display name 2 to 30 characters, description at most 45, reference name at most 64.
 * Says only what v1.0 ships: Plus lets you keep adding letters (D-082). No price or trial here: Apple
 * shows both from the product's own price and offer.
 */
export const APP_STORE_PLUS = {
  group: { referenceName: 'Plus', displayName: 'Plus' },
  monthly: { referenceName: 'Plus Monthly', displayName: 'Plus Monthly', description: 'Keep adding letters, billed monthly' },
  annual: { referenceName: 'Plus Annual', displayName: 'Plus Annual', description: 'Keep adding letters, billed yearly' },
} as const;
