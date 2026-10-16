import CryptoKit
import ExpoModulesCore
import StoreKit
import UIKit

/// SwiftUI also declares `Transaction` and becomes visible with ExpoModulesCore, so a bare
/// `Transaction` is ambiguous (Xcode 26.6, iOS compile check #188). Every `Transaction` in
/// this module means StoreKit's. Internal, not fileprivate: it appears in internal
/// signatures (`Entitlements.isLive`).
typealias Transaction = StoreKit.Transaction

/// Plus through Apple only (docs/adr/0013; founder decision 3, 3 Oct 2026).
///
/// Everything here is Apple's own: SubscriptionStoreView renders the plans,
/// prices, free trial terms, restore and the legal links; the entitlement is
/// read from Transaction.currentEntitlements on this device; Manage and refund
/// open Apple's sheets. No server of ours sees a purchase, and nothing here
/// sends a transaction id, receipt or account id anywhere: the snapshot handed
/// to JavaScript holds product ids, dates and flags only.
public class ScribeStoreModule: Module {
  private let listener = TransactionListener()

  public func definition() -> ModuleDefinition {
    Name("ScribeStore")

    Events("onEntitlementsChanged")

    // Apple: listen to Transaction.updates from launch, or Ask to Buy approvals,
    // renewals, refunds, Family Sharing changes and store view purchases that
    // finish while the app is closed can be missed.
    OnCreate {
      self.startListening()
    }

    OnDestroy {
      self.listener.stop()
    }

    /// "available" on iOS 17 and later (SubscriptionStoreView), else "needs_ios_17".
    Function("storeViewSupport") { () -> String in
      if #available(iOS 17.0, *) {
        return "available"
      }
      return "needs_ios_17"
    }

    /// Idempotent; OnCreate already started it. Kept so JavaScript can be sure.
    Function("startTransactionListener") {
      self.startListening()
    }

    /// Verified current entitlements and subscription statuses for the given products.
    AsyncFunction("currentEntitlements") { (productIds: [String]) async -> [String: Any] in
      return await Entitlements.snapshot(productIds: Set(productIds))
    }

    /// Presents Apple's subscription store as a sheet. Resolves when it closes:
    /// { outcome: "purchased" | "dismissed" | "busy" | "unavailable" }.
    AsyncFunction("presentSubscriptionStore") { (options: StoreSheetOptions) async -> [String: Any] in
      let outcome = await self.presentStore(options)
      return ["outcome": outcome]
    }

    /// Apple's manage-subscriptions sheet: "shown" | "unavailable" | "failed".
    AsyncFunction("showManageSubscriptions") { () async -> String in
      return await ScribeStoreModule.showManageSubscriptions()
    }

    /// AppStore.sync() for Restore. Apple asks the person to sign in, so call it
    /// only from a tap. "synced" | "cancelled" | "failed".
    AsyncFunction("sync") { () async -> String in
      do {
        try await AppStore.sync()
        return "synced"
      } catch StoreKitError.userCancelled {
        return "cancelled"
      } catch {
        return "failed"
      }
    }

    /// Apple's offer code redemption sheet (D-081: codes come from Apple, never a code system of ours).
    /// "presented" | "unavailable" | "failed". It resolves when the sheet has been shown; a redeemed code
    /// arrives as a Transaction through the update listener above (onEntitlementsChanged), so the caller
    /// re-reads the entitlements afterwards. API read in Apple's documentation on 4 Oct 2026:
    /// `@MainActor static func AppStore.presentOfferCodeRedeemSheet(in: UIWindowScene) async throws`,
    /// iOS 16.0+ (the `(from:options:)` form replaces it from iOS 27). NOT yet run on a device: sandbox
    /// test with an offer code (device pass S1) before the first submission.
    AsyncFunction("presentOfferCodeRedeemSheet") { () async -> String in
      return await ScribeStoreModule.presentOfferCodeRedeemSheet()
    }

    /// Apple's refund request sheet for the person's own Plus purchase (not a
    /// Family Sharing one). "success" | "cancelled" | "none" | "unavailable" | "failed".
    AsyncFunction("beginRefundRequest") { (productIds: [String]) async -> String in
      return await ScribeStoreModule.beginRefundRequest(productIds: Set(productIds))
    }

    /// D-080 status report (WP-F14-15a; contract packages/api/src/server/subscription-status.ts).
    /// The person's own Plus subscriptions (ownership purchased; Family Sharing never reports),
    /// each with `subRef` = hex(SHA-256(salt bytes || UTF-8 original transaction id)). The id
    /// itself never leaves Swift (F14-REQ-014). A malformed salt answers an empty list.
    AsyncFunction("statusReportRefs") { (salt: String, productIds: [String]) async -> [[String: Any]] in
      guard let saltBytes = StatusRef.decodeSalt(salt) else { return [] }
      return await Entitlements.statusReportItems(productIds: Set(productIds), salt: saltBytes)
    }
  }

  private func startListening() {
    // Called on the listener's background task. sendEvent is safe from any
    // thread (Expo schedules it on the JavaScript runtime); the sheet is
    // main-actor state, so that part hops to the main actor.
    listener.start { [weak self] purchased in
      self?.sendEvent("onEntitlementsChanged", ["reason": purchased ? "purchase" : "update"])
      if purchased {
        Task { @MainActor in
          StoreSheet.shared.finish(outcome: "purchased")
        }
      }
    }
  }

  @MainActor
  private func presentStore(_ options: StoreSheetOptions) async -> String {
    guard #available(iOS 17.0, *) else {
      return "unavailable"
    }
    // A presenter that is on its way out, or already showing something, would
    // refuse the presentation and never call back (review L9): say so now.
    guard let presenter = appContext?.utilities?.currentViewController(),
          !presenter.isBeingDismissed, presenter.presentedViewController == nil,
          presenter.viewIfLoaded?.window != nil else {
      return "unavailable"
    }
    let content = StoreSheetContent(options)
    return await withCheckedContinuation { continuation in
      // The body runs synchronously on the caller's actor (main); say so for older toolchains.
      MainActor.assumeIsolated {
        // OnceResume guarantees exactly one resume whatever path closes the sheet.
        let once = OnceResume(continuation)
        StoreSheet.shared.present(content: content, from: presenter) { outcome in
          once.resume(outcome)
        }
      }
    }
  }

  @MainActor
  private static func activeWindowScene() -> UIWindowScene? {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    return scenes.first { $0.activationState == .foregroundActive } ?? scenes.first
  }

  @MainActor
  private static func showManageSubscriptions() async -> String {
    guard let scene = activeWindowScene() else {
      return "unavailable"
    }
    do {
      try await AppStore.showManageSubscriptions(in: scene)
      return "shown"
    } catch {
      return "failed"
    }
  }

  @MainActor
  private static func presentOfferCodeRedeemSheet() async -> String {
    guard #available(iOS 16.0, *) else {
      return "unavailable"
    }
    guard let scene = activeWindowScene() else {
      return "unavailable"
    }
    do {
      try await AppStore.presentOfferCodeRedeemSheet(in: scene)
      return "presented"
    } catch {
      return "failed"
    }
  }

  @MainActor
  private static func beginRefundRequest(productIds: Set<String>) async -> String {
    guard let transactionID = await Entitlements.ownPurchaseTransactionID(productIds: productIds) else {
      return "none"
    }
    guard let scene = activeWindowScene() else {
      return "unavailable"
    }
    do {
      let status = try await Transaction.beginRefundRequest(for: transactionID, in: scene)
      return status == .success ? "success" : "cancelled"
    } catch {
      return "failed"
    }
  }
}

/// Resumes a checked continuation at most once (a second resume is a crash).
/// The store sheet can close through several paths (its own dismiss, a
/// purchase, the watchdog, the host disappearing); only the first one counts.
final class OnceResume: @unchecked Sendable {
  private let lock = NSLock()
  private var continuation: CheckedContinuation<String, Never>?

  init(_ continuation: CheckedContinuation<String, Never>) {
    self.continuation = continuation
  }

  func resume(_ value: String) {
    lock.lock()
    let c = continuation
    continuation = nil
    lock.unlock()
    c?.resume(returning: value)
  }
}

/// Finishes every verified transaction Apple delivers and reports a change.
/// Unverified transactions are ignored and left unfinished (Apple's sample code).
final class TransactionListener: @unchecked Sendable {
  private let lock = NSLock()
  private var task: Task<Void, Never>?

  func start(onChange: @escaping (_ purchased: Bool) -> Void) {
    lock.lock()
    defer { lock.unlock() }
    guard task == nil else { return }
    task = Task.detached(priority: .background) {
      for await result in Transaction.updates {
        guard case .verified(let transaction) = result else { continue }
        await transaction.finish()
        onChange(Entitlements.isLive(transaction))
      }
    }
  }

  func stop() {
    lock.lock()
    defer { lock.unlock() }
    task?.cancel()
    task = nil
  }
}

/// Reads what StoreKit 2 already knows on the device. Works offline from
/// StoreKit's own cache; never prompts for sign-in.
enum Entitlements {
  private static let iso: ISO8601DateFormatter = {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return f
  }()

  static func isLive(_ t: Transaction) -> Bool {
    if t.revocationDate != nil || t.isUpgraded { return false }
    if let end = t.expirationDate { return end > Date() }
    return true
  }

  static func snapshot(productIds: Set<String>) async -> [String: Any] {
    var entitlements: [[String: Any]] = []
    var groupIds = Set<String>()

    // Apple's entitlement check: the latest transaction of each subscription
    // that is subscribed or in its billing grace period. Refunded and revoked
    // ones never appear here. Family Sharing ones do (ownershipType).
    for await result in Transaction.currentEntitlements {
      guard case .verified(let t) = result, productIds.contains(t.productID), t.productType == .autoRenewable else { continue }
      if let group = t.subscriptionGroupID { groupIds.insert(group) }
      entitlements.append(describe(t))
    }

    // For the Plan screen: grace end, auto-renew, billing retry, expired.
    // The group id comes from a past transaction, so nothing is configured twice.
    if groupIds.isEmpty {
      for id in productIds {
        if let result = await Transaction.latest(for: id), case .verified(let t) = result, let group = t.subscriptionGroupID {
          groupIds.insert(group)
        }
      }
    }
    var statuses: [[String: Any]] = []
    for group in groupIds {
      guard let list = try? await Product.SubscriptionInfo.status(for: group) else { continue }
      for status in list {
        guard case .verified(let t) = status.transaction, productIds.contains(t.productID) else { continue }
        var item = describe(t)
        item["state"] = stateName(status.state)
        if case .verified(let renewal) = status.renewalInfo {
          item["willAutoRenew"] = renewal.willAutoRenew
          if let grace = renewal.gracePeriodExpirationDate {
            item["gracePeriodExpiresAt"] = iso.string(from: grace)
          }
        }
        statuses.append(item)
      }
    }

    return ["entitlements": entitlements, "statuses": statuses, "checkedAt": iso.string(from: Date())]
  }

  /// Own subscriptions with their salted reference, for the status report. One item per
  /// original purchase; the newest status Apple lists for it.
  static func statusReportItems(productIds: Set<String>, salt: Data) async -> [[String: Any]] {
    var groupIds = Set<String>()
    for await result in Transaction.currentEntitlements {
      guard case .verified(let t) = result, productIds.contains(t.productID), let group = t.subscriptionGroupID else { continue }
      groupIds.insert(group)
    }
    for id in productIds {
      if let result = await Transaction.latest(for: id), case .verified(let t) = result, let group = t.subscriptionGroupID {
        groupIds.insert(group)
      }
    }
    var seen = Set<UInt64>()
    var items: [[String: Any]] = []
    for group in groupIds {
      guard let list = try? await Product.SubscriptionInfo.status(for: group) else { continue }
      for status in list {
        guard case .verified(let t) = status.transaction, productIds.contains(t.productID),
              t.ownershipType == .purchased, !seen.contains(t.originalID) else { continue }
        seen.insert(t.originalID)
        var item = describe(t)
        item["state"] = stateName(status.state)
        if case .verified(let renewal) = status.renewalInfo {
          item["willAutoRenew"] = renewal.willAutoRenew
        }
        item["subRef"] = StatusRef.subRef(salt: salt, originalID: t.originalID)
        items.append(item)
      }
    }
    return items
  }

  /// The person's own (not Family Sharing) current Plus purchase, for a refund request.
  static func ownPurchaseTransactionID(productIds: Set<String>) async -> UInt64? {
    var best: Transaction?
    for await result in Transaction.currentEntitlements {
      guard case .verified(let t) = result, productIds.contains(t.productID), t.ownershipType == .purchased else { continue }
      if best == nil || t.purchaseDate > best!.purchaseDate { best = t }
    }
    if best == nil {
      for id in productIds {
        if let result = await Transaction.latest(for: id), case .verified(let t) = result,
           t.ownershipType == .purchased, t.revocationDate == nil,
           best == nil || t.purchaseDate > best!.purchaseDate {
          best = t
        }
      }
    }
    return best?.id
  }

  private static func describe(_ t: Transaction) -> [String: Any] {
    var item: [String: Any] = [
      "productId": t.productID,
      "purchasedAt": iso.string(from: t.purchaseDate),
      // The first purchase of this subscription: the yearly reminder's anniversary (Q-003 memo 5, G-15).
      "originalPurchasedAt": iso.string(from: t.originalPurchaseDate),
      "ownership": t.ownershipType == .familyShared ? "familyShared" : "purchased",
      "environment": environmentName(t.environment),
      "isTrial": isFreeTrial(t),
      "isUpgraded": t.isUpgraded,
      "offerType": offerTypeName(t),
      "freePeriod": isFreePeriod(t),
    ]
    if let end = t.expirationDate { item["expiresAt"] = iso.string(from: end) }
    if let revoked = t.revocationDate { item["revokedAt"] = iso.string(from: revoked) }
    return item
  }

  private static func isFreeTrial(_ t: Transaction) -> Bool {
    if #available(iOS 17.2, *) {
      guard let offer = t.offer else { return false }
      return offer.type == .introductory && offer.paymentMode == .freeTrial
    }
    // Before iOS 17.2. Plus has no paid introductory offers, so introductory means free.
    return t.offerType == .introductory
  }

  /// How the current period was offered. A win-back offer (iOS 18) is "win_back" (contract
  /// OFFER_TYPES, S07 #138); a kind newer than this build reads as "other".
  private static func offerTypeName(_ t: Transaction) -> String {
    let type: Transaction.OfferType?
    if #available(iOS 17.2, *) {
      type = t.offer?.type
    } else {
      type = t.offerType
    }
    guard let type else { return "none" }
    if type == .introductory { return "introductory" }
    if type == .promotional { return "promotional" }
    if type == .code { return "offer_code" }
    if #available(iOS 18.0, *), type == .winBack { return "win_back" }
    return "other"
  }

  /// The current period costs nothing: a free trial, or an offer code or promotional offer with a
  /// free period. Before iOS 17.2 only the introductory offer is known to be free (Plus has no paid
  /// introductory offers); an offer code's payment mode is not readable there, so it reads as paid.
  private static func isFreePeriod(_ t: Transaction) -> Bool {
    if #available(iOS 17.2, *) {
      guard let offer = t.offer else { return false }
      return offer.paymentMode == .freeTrial
    }
    return t.offerType == .introductory
  }

  private static func environmentName(_ e: AppStore.Environment) -> String {
    if e == .production { return "production" }
    if e == .xcode { return "xcode" }
    return "sandbox"
  }

  private static func stateName(_ s: Product.SubscriptionInfo.RenewalState) -> String {
    switch s {
    case .subscribed: return "subscribed"
    case .inGracePeriod: return "inGracePeriod"
    case .inBillingRetryPeriod: return "inBillingRetryPeriod"
    case .expired: return "expired"
    case .revoked: return "revoked"
    default: return "unknown"
    }
  }
}

/// `subRef` for the D-080 status report (R2 AR-13). Matches `subRefReference` in
/// packages/api/src/server/subscription-status.ts byte for byte: SHA-256 over the 32 salt
/// bytes followed by the UTF-8 decimal original transaction id, as lowercase hex.
enum StatusRef {
  /// base64url without padding, exactly 43 characters, 32 bytes. Anything else is nil.
  static func decodeSalt(_ s: String) -> Data? {
    guard s.count == 43, s.range(of: "^[A-Za-z0-9_-]{43}$", options: .regularExpression) != nil else { return nil }
    let b64 = s.replacingOccurrences(of: "-", with: "+").replacingOccurrences(of: "_", with: "/") + "="
    guard let data = Data(base64Encoded: b64), data.count == 32 else { return nil }
    return data
  }

  static func subRef(salt: Data, originalID: UInt64) -> String {
    var input = salt
    input.append(contentsOf: Array(String(originalID).utf8))
    return SHA256.hash(data: input).map { String(format: "%02x", $0) }.joined()
  }
}
