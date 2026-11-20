Pod::Spec.new do |s|
  s.name           = 'ScribePhoto'
  s.version        = '0.1.0'
  s.summary        = 'Apple system photo picker and an upright, metadata-free JPEG re-encode of one picked photo for scribe'
  s.description    = 'Local Expo module: PHPickerViewController with no photo library (no permission) and ImageIO. Reads one file the parent picked, turns its pixels upright, writes a JPEG with no metadata. No network, no permission request.'
  s.license        = 'UNLICENSED'
  s.author         = 'scribe'
  s.homepage       = 'https://example.com'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'CoreGraphics', 'ImageIO', 'PhotosUI', 'UIKit', 'UniformTypeIdentifiers'

  s.source_files = "**/*.{h,m,swift}"
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
