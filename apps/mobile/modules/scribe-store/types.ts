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
  /** familyShared: Plus reached this person through Apple Family Sharing. */
  ownership: Ownership;
  environment: StoreEnvironment;
  /** In a free introductory offer (free trial). */
  isTrial: boolean;
  isUpgraded: boolean;
  /** Set when Apple refunded it or Family Sharing access was removed. */
  revokedAt?: string;
}

/** Product.SubscriptionInfo.RenewalState, by name. */
export type RenewalStateName = 'subscribed' | 'inGracePeriod' | 'inBillingRetryPeriod' | 'expired' | 'revoked' | 'unknown';

/** A subscription status in the Plus group (one per purchaser: own, and Family Sharing). */
export interface NativeStatus extends NativeTransaction {
  state: RenewalStateName;
  willAutoRenew?: boolean;
  gracePeriodExpiresAt?: string;
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
