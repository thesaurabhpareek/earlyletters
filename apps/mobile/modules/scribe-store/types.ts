/**
 * Shapes the ScribeStore native module returns (ios/ScribeStoreModule.swift).
 * Pure types, no React Native, so unit tests can import them.
 *
 * Privacy: nothing here identifies a person. No transaction id, receipt,
 * Apple account or app account token crosses into JavaScript; only product
 * ids, dates and flags (DATA_CLASSIFICATION L2).
 */

/** Where Apple's subscription store view can be shown. */
export type StoreViewSupport = 'available' | 'needs_ios_17' | 'unsupported';

export type StoreEnvironment = 'production' | 'sandbox' | 'xcode';
export type Ownership = 'purchased' | 'familyShared';

/** One verified StoreKit 2 transaction, reduced to what the plan needs. */
export interface NativeTransaction {
  productId: string;
  /** ISO instant the current period or free trial ends (renews). */
  expiresAt?: string;
  purchasedAt?: string;
  /** ISO instant of the first purchase of this subscription (its anniversary; the yearly plan reminder, G-15). */
  originalPurchasedAt?: string;
  /** familyShared: Plus reached this person through Apple Family Sharing. */
  ownership: Ownership;
  environment: StoreEnvironment;
  /** In a free introductory offer (free trial). */
  isTrial: boolean;
  /**
   * How the current period was offered (StoreKit `offer.type`, iOS 17.2+; `offerType` before).
   * `other` is a kind this build does not know (for example a win-back offer, which Plus does not use).
   */
  offerType?: NativeOfferType;
  /** The current period is free under any offer: an introductory trial or an offer code with a free period. */
  freePeriod?: boolean;
  isUpgraded: boolean;
  /** Set when Apple refunded it or Family Sharing access was removed. */
  revokedAt?: string;
}

export type NativeOfferType = 'none' | 'introductory' | 'promotional' | 'offer_code' | 'other';

/** Product.SubscriptionInfo.RenewalState, by name. */
export type RenewalStateName = 'subscribed' | 'inGracePeriod' | 'inBillingRetryPeriod' | 'expired' | 'revoked' | 'unknown';

/** A subscription status in the Plus group (one per purchaser: own, and Family Sharing). */
export interface NativeStatus extends NativeTransaction {
  state: RenewalStateName;
  willAutoRenew?: boolean;
  gracePeriodExpiresAt?: string;
}

/**
 * One of the person's own Plus subscriptions for the D-080 status report (WP-F14-15a), from
 * `statusReportRefs(salt, productIds)`. Only `purchased` ownership: Family Sharing members never
 * report (F14-REQ-006). `subRef` is hex(SHA-256(salt bytes || UTF-8 original transaction id)),
 * made in Swift: the transaction id itself never crosses into JavaScript (F14-REQ-014).
 */
export interface NativeStatusRef extends NativeStatus {
  subRef: string;
}

/** What `currentEntitlements` returns. */
export interface NativeEntitlementSnapshot {
  /** Transaction.currentEntitlements: subscribed or in billing grace, verified, Plus products only. */
  entitlements: NativeTransaction[];
  /** Product.SubscriptionInfo.status(for:) of the Plus group, verified, for the Plan screen. */
  statuses: NativeStatus[];
  /** ISO instant this was read on the device. */
  checkedAt: string;
}

export interface StoreSheetOptions {
  productIds: string[];
  title: string;
  subtitle: string;
  features: string[];
  notes: string[];
  termsUrl: string;
  privacyUrl: string;
  accentLight: string;
  accentDark: string;
  backgroundLight: string;
  backgroundDark: string;
}

export type StoreSheetOutcome = 'purchased' | 'dismissed' | 'busy' | 'unavailable';
export type ManageOutcome = 'shown' | 'unavailable' | 'failed';
export type SyncOutcome = 'synced' | 'cancelled' | 'failed';
/** `presented`: Apple's sheet was shown. A redeemed code arrives as an entitlement update, not here. */
export type OfferCodeOutcome = 'presented' | 'unavailable' | 'failed';
export type RefundOutcome = 'success' | 'cancelled' | 'none' | 'unavailable' | 'failed';
