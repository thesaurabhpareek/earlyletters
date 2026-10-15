/**
 * Local Expo module `ScribeStore`: Plus through Apple only (docs/adr/0013).
 * iOS: StoreKit 2 and Apple's SubscriptionStoreView (iOS 17+). Android: a stub
 * that answers "unavailable". Absent in Expo Go and on web, so this export is
 * null there and every caller must handle that (src/lib/billing does).
 */
import { NativeModule, requireOptionalNativeModule } from 'expo';
import type {
  ManageOutcome,
  OfferCodeOutcome,
  NativeEntitlementSnapshot,
  RefundOutcome,
  StoreSheetOptions,
  StoreSheetOutcome,
  SyncOutcome,
} from './types';

export * from './types';

type Events = {
  /** Apple delivered or updated a transaction. Re-read currentEntitlements; the payload holds no ids. */
  onEntitlementsChanged: (event: { reason: 'purchase' | 'update' }) => void;
};

declare class ScribeStoreNative extends NativeModule<Events> {
  storeViewSupport(): 'available' | 'needs_ios_17' | 'unsupported';
  startTransactionListener(): void;
  currentEntitlements(productIds: string[]): Promise<NativeEntitlementSnapshot>;
  presentSubscriptionStore(options: StoreSheetOptions): Promise<{ outcome: StoreSheetOutcome }>;
  showManageSubscriptions(): Promise<ManageOutcome>;
  sync(): Promise<SyncOutcome>;
  presentOfferCodeRedeemSheet(): Promise<OfferCodeOutcome>;
  beginRefundRequest(productIds: string[]): Promise<RefundOutcome>;
}

export const ScribeStore = requireOptionalNativeModule<ScribeStoreNative>('ScribeStore');
