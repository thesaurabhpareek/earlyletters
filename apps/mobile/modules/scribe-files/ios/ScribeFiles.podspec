Pod::Spec.new do |s|
  s.name           = 'ScribeFiles'
  s.version        = '0.1.0'
  s.summary        = 'Application Support paths and iCloud backup exclusion for scribe'
  s.description    = 'Local Expo module: models directory in Application Support, excluded from iCloud backup (ADR 0001).'
  s.license        = 'UNLICENSED'
  s.author         = 'scribe'
  s.homepage       = 'https://example.com'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = "**/*.{h,m,swift}"
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
