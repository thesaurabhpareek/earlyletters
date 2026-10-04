import ExpoModulesCore
import StoreKit
import SwiftUI
import UIKit

/// What JavaScript passes to `presentSubscriptionStore`. Words come from the
/// app's copy (never typed here); URLs and colours come from packages/brand.
struct StoreSheetOptions: Record {
  @Field var productIds: [String] = []
  @Field var title: String = ""
  @Field var subtitle: String = ""
  @Field var features: [String] = []
  @Field var notes: [String] = []
  @Field var termsUrl: String = ""
  @Field var privacyUrl: String = ""
  @Field var accentLight: String = ""
  @Field var accentDark: String = ""
  @Field var backgroundLight: String = ""
  @Field var backgroundDark: String = ""
}

/// Plain values copied out of the record before SwiftUI sees them.
struct StoreSheetContent {
  let productIds: [String]
  let title: String
  let subtitle: String
  let features: [String]
  let notes: [String]
  let termsURL: URL?
  let privacyURL: URL?
  let accent: Color
  let background: Color?

  init(_ o: StoreSheetOptions) {
    productIds = o.productIds
    title = o.title
    subtitle = o.subtitle
    features = o.features
    notes = o.notes
    termsURL = URL(string: o.termsUrl)
    privacyURL = URL(string: o.privacyUrl)
    // Without a dark accent, dark mode keeps the system tint: Apple's filled
    // subscribe buttons put white text on the tint, and a light brand accent
    // would fail contrast there.
    accent = StoreSheetContent.dynamic(light: o.accentLight, dark: o.accentDark, darkFallback: .systemBlue) ?? Color.accentColor
    background = StoreSheetContent.dynamic(light: o.backgroundLight, dark: o.backgroundDark, darkFallback: .systemBackground)
  }

  private static func dynamic(light: String, dark: String, darkFallback: UIColor) -> Color? {
    guard let l = UIColor(storeHex: light) else { return nil }
    let d = UIColor(storeHex: dark) ?? darkFallback
    return Color(UIColor { $0.userInterfaceStyle == .dark ? d : l })
  }
}

private extension UIColor {
  convenience init?(storeHex hex: String) {
    var s = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    if s.hasPrefix("#") { s.removeFirst() }
    guard s.count == 6, let v = UInt32(s, radix: 16) else { return nil }
    self.init(
      red: CGFloat((v >> 16) & 0xFF) / 255,
      green: CGFloat((v >> 8) & 0xFF) / 255,
      blue: CGFloat(v & 0xFF) / 255,
      alpha: 1
    )
  }
}

/// Presents Apple's store view in a real SwiftUI sheet. A clear, full-screen
/// host carries the sheet so SwiftUI's own dismiss (the store view's Close
/// button, a swipe down) works and reports back exactly once.
@MainActor
final class StoreSheet {
  static let shared = StoreSheet()

  private var host: UIViewController?
  private var model: StoreSheetModel?
  private var completion: (@MainActor (String) -> Void)?

  @available(iOS 17.0, *)
  func present(content: StoreSheetContent, from presenter: UIViewController, completion: @escaping @MainActor (String) -> Void) {
    guard host == nil else {
      completion("busy")
      return
    }
    let model = StoreSheetModel()
    let host = UIHostingController(rootView: StoreSheetRoot(model: model, content: content))
    host.view.backgroundColor = .clear
    host.modalPresentationStyle = .overFullScreen
    model.onDismiss = { [weak self] outcome in
      self?.tearDown(outcome: outcome)
    }
    self.model = model
    self.host = host
    self.completion = completion
    presenter.present(host, animated: false) {
      model.isPresented = true
    }
  }

  /// Closes the sheet if it is open (a purchase arrived through Transaction.updates).
  func finish(outcome: String) {
    guard let model, model.isPresented else { return }
    model.outcome = outcome
    model.isPresented = false
  }

  private func tearDown(outcome: String) {
    let done = completion
    completion = nil
    model = nil
    guard let host else {
      done?(outcome)
      return
    }
    self.host = nil
    host.dismiss(animated: false) {
      done?(outcome)
    }
  }
}

@MainActor
final class StoreSheetModel: ObservableObject {
  @Published var isPresented = false
  var outcome = "dismissed"
  var onDismiss: (@MainActor (String) -> Void)?
}

@available(iOS 17.0, *)
struct StoreSheetRoot: View {
  @ObservedObject var model: StoreSheetModel
  let content: StoreSheetContent

  var body: some View {
    Color.clear
      .ignoresSafeArea()
      .sheet(isPresented: $model.isPresented, onDismiss: { model.onDismiss?(model.outcome) }) {
        PlusSubscriptionStore(content: content)
      }
  }
}

/// Apple's SubscriptionStoreView: plans, prices, free trial terms for eligible
/// people, the subscribe buttons, Restore, Terms and Privacy, and Close. One
/// button per plan, so no plan is preselected (PRD C-REQ-022).
@available(iOS 17.0, *)
struct PlusSubscriptionStore: View {
  let content: StoreSheetContent

  var body: some View {
    SubscriptionStoreView(productIDs: content.productIds) {
      PlusMarketing(content: content)
    }
    .subscriptionStoreControlStyle(.buttons)
    .subscriptionStoreButtonLabel(.multiline)
    .storeButton(.visible, for: .restorePurchases)
    .storeButton(.visible, for: .policies)
    .storeButton(.visible, for: .cancellation)
    .modifier(PolicyDestinations(terms: content.termsURL, privacy: content.privacyURL))
    .modifier(StoreBackground(color: content.background))
    .tint(content.accent)
  }
}

/// What Plus adds, said before any subscribe button (App Review 3.1.2).
@available(iOS 17.0, *)
struct PlusMarketing: View {
  let content: StoreSheetContent

  var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      Text(content.title)
        .font(.largeTitle.weight(.semibold))
        .fontDesign(.serif)
        .accessibilityAddTraits(.isHeader)
      if !content.subtitle.isEmpty {
        Text(content.subtitle)
          .font(.title3)
          .foregroundStyle(.secondary)
      }
      VStack(alignment: .leading, spacing: 10) {
        ForEach(Array(content.features.enumerated()), id: \.offset) { _, feature in
          Label {
            Text(feature)
          } icon: {
            Image(systemName: "checkmark.circle.fill")
              .foregroundStyle(content.accent)
              .accessibilityHidden(true)
          }
          .font(.body)
        }
      }
      ForEach(Array(content.notes.enumerated()), id: \.offset) { _, note in
        Text(note)
          .font(.footnote)
          .foregroundStyle(.secondary)
          .fixedSize(horizontal: false, vertical: true)
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(.horizontal, 24)
    .padding(.top, 32)
    .padding(.bottom, 8)
  }
}

@available(iOS 17.0, *)
struct PolicyDestinations: ViewModifier {
  let terms: URL?
  let privacy: URL?

  @ViewBuilder
  func body(content: Content) -> some View {
    if let terms, let privacy {
      content
        .subscriptionStorePolicyDestination(url: terms, for: .termsOfService)
        .subscriptionStorePolicyDestination(url: privacy, for: .privacyPolicy)
    } else if let terms {
      content.subscriptionStorePolicyDestination(url: terms, for: .termsOfService)
    } else if let privacy {
      content.subscriptionStorePolicyDestination(url: privacy, for: .privacyPolicy)
    } else {
      content
    }
  }
}

@available(iOS 17.0, *)
struct StoreBackground: ViewModifier {
  let color: Color?

  @ViewBuilder
  func body(content: Content) -> some View {
    if let color {
      content.containerBackground(color, for: .subscriptionStoreFullHeight)
    } else {
      content
    }
  }
}
