import ExpoModulesCore
import StoreKit
import UIKit

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

    /// Apple's refund request sheet for the person's own Plus purchase (not a
    /// Family Sharing one). "success" | "cancelled" | "none" | "unavailable" | "failed".
    AsyncFunction("beginRefundRequest") { (productIds: [String]) async -> String in
      return await ScribeStoreModule.beginRefundRequest(productIds: Set(productIds))
    }
  }

  private func startListening() {
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
    guard let presenter = appContext?.utilities?.currentViewController() else {
      return "unavailable"
    }
    let content = StoreSheetContent(options)
    return await withCheckedContinuation { continuation in
      // The body runs synchronously on the caller's actor (main); say so for older toolchains.
      MainActor.assumeIsolated {
        StoreSheet.shared.present(content: content, from: presenter) { outcome in
          continuation.resume(returning: outcome)
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

/// Finishes every verified transaction Apple delivers and reports a change.
/// Unverified transactions are ignored and left unfinished (Apple's sample code).
final class TransactionListener {
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
      "ownership": t.ownershipType == .familyShared ? "familyShared" : "purchased",
      "environment": environmentName(t.environment),
      "isTrial": isFreeTrial(t),
      "isUpgraded": t.isUpgraded,
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
