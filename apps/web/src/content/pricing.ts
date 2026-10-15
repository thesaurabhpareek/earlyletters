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
