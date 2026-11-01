Pod::Spec.new do |s|
  s.name           = 'ScribeAudio'
  s.version        = '0.1.0'
  s.summary        = 'In-memory AAC decode to 16 kHz PCM, listening copies with system voice isolation, streamed SHA-256'
  s.description    = 'Local Expo module for scribe (TDD 03 3.4, ADR 0015). Uses only Apple system frameworks; adds no third-party code.'
  s.license        = 'UNLICENSED'
  s.author         = 'scribe'
  s.homepage       = 'https://example.com'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'AVFoundation', 'AudioToolbox'

  s.source_files = "**/*.{h,m,swift}"
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
