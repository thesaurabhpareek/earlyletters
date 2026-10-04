Pod::Spec.new do |s|
  s.name           = 'ScribeStore'
  s.version        = '0.1.0'
  s.summary        = 'Plus through Apple: StoreKit 2 subscription store view, entitlements, restore and manage'
  s.description    = 'Local Expo module (ADR 0013): presents SubscriptionStoreView, reads Transaction.currentEntitlements on the device, listens to Transaction.updates, AppStore.sync, manage subscriptions and refund request sheets. Apple frameworks only.'
  s.license        = 'UNLICENSED'
  s.author         = 'scribe'
  s.homepage       = 'https://example.com'
  # The app's minimum (Expo SDK 57). The subscription store view itself needs
  # iOS 17 and is guarded with #available; everything else works from 16.4.
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'StoreKit', 'SwiftUI'

  s.source_files = "**/*.{h,m,swift}"
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
