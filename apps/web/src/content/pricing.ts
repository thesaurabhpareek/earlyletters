/**
 * Plus prices and free-trial lengths: the founder's final figures (Oct 2026), and the one place on
 * earlyletters.com that holds them. Every sentence that states a price or a trial reads from here;
 * test/pricing.test.ts fails on a dollar amount or a trial length written anywhere else under src,
 * and on the old prices ever coming back. US dollars, sold through the App Store in the US (ADR 0013).
 * Change the figures here and nowhere else.
 */

/** One auto-renewable Plus plan: what the App Store bills, and how long its free trial runs. */
export interface PlusPlan {
  /** The billed amount in US dollars, as the page says it ("$4.99"). Copy, never arithmetic. */
  readonly price: `$${number}`;
  /** The free trial in whole months (an Apple introductory offer). */
  readonly trialMonths: number;
}

export const plusPricing = {
  monthly: { price: '$4.99', trialMonths: 1 },
  annual: { price: '$49.99', trialMonths: 2 },
} as const satisfies Record<'monthly' | 'annual', PlusPlan>;

/** Dollars as the page writes them, from whole cents: 989 becomes "$9.89". */
function usd(cents: number): `$${string}` {
  return `$${(cents / 100).toFixed(2)}`;
}
/** "$4.99" as whole cents (499), so sums are exact and never float arithmetic. */
function cents(price: string): number {
  return Math.round(Number(price.slice(1)) * 100);
}

/**
 * What the yearly plan saves against paying the monthly price twelve times (twelve payments, less the yearly price).
 * Derived from the constants above, never typed, so it cannot drift if a price changes.
 * test/pricing.test.ts checks the arithmetic.
 */
export const annualSavings = {
  /** Twelve monthly payments, whole cents. */
  twelveMonthsCents: cents(plusPricing.monthly.price) * 12,
  /** The saving, whole cents. */
  cents: cents(plusPricing.monthly.price) * 12 - cents(plusPricing.annual.price),
  /** The saving as the page says it ("$9.89"). */
  price: usd(cents(plusPricing.monthly.price) * 12 - cents(plusPricing.annual.price)),
} as const;
