/**
 * What ships in the iOS app, and what each part is for. The one hand-kept table behind the
 * Licenses page; lib.mjs reads it, scripts/licences/generate.mjs writes the page's data from it,
 * apps/mobile/test/licences.test.ts fails while it disagrees with package-lock.json.
 *
 * Three kinds of row:
 * - PACKAGES: npm packages in the iOS binary (the Hermes bundle Metro builds, or native code
 *   autolinked into the app), each with the theme it is listed under. Name only: every installed
 *   version the lockfile reaches from the app through these packages is listed.
 * - NOT_SHIPPED: packages the app's production tree reaches from a shipped package that are NOT in
 *   the binary (build tools, web-only or Android-only code, types), each with the reason. A key may
 *   be `name` (every version) or `name@version` (that copy only).
 * - NON_NPM: code and data with no npm package of its own: C and C++ libraries compiled in through
 *   CocoaPods, code vendored inside an npm package, the speech models the app downloads, the icon
 *   artwork. Each points at its licence text under third-party/, copied word for word from the
 *   upstream file named in `source`.
 *
 * The walk (lib.mjs `shippedFromLock`) starts at apps/mobile's dependencies and descends only into
 * PACKAGES; every package it meets must be in PACKAGES or NOT_SHIPPED, and every PACKAGES name must
 * be met. So a new dependency fails the test until someone decides, here, whether it ships.
 *
 * How the lists were checked (1 Nov 2026, develop 70ac7528): the package set equals the
 * node_modules folders in the source map of `expo export -p ios` (113 packages), plus the native
 * modules `expo-modules-autolinking resolve -p ios` and `react-native-config` link (11 more,
 * native only). scripts/licences/verify-shipped.mjs repeats that check; run it before a release
 * (docs/ops/RELEASE.md).
 */

/** Theme ids, in page order. Titles and the line under each come from packages/content (licences.themes). */
export const THEMES = /** @type {const} */ (['speech', 'recording', 'look', 'framework', 'storage', 'account', 'other']);

/** @typedef {(typeof THEMES)[number]} Theme */

/** @type {Record<string, Theme>} */
export const PACKAGES = {
  // Speech: what turns a recording into words, on the phone.
  'whisper.rn': 'speech',

  // Recording and audio.
  'expo-audio': 'recording',
  'expo-keep-awake': 'recording',

  // Look and feel: type, icons, colour, motion, touch.
  '@expo/ui': 'look',
  '@gorhom/bottom-sheet': 'look',
  '@gorhom/portal': 'look',
  '@radix-ui/react-compose-refs': 'look',
  '@radix-ui/react-slot': 'look',
  '@react-native-community/datetimepicker': 'look',
  '@react-native-masked-view/masked-view': 'look',
  '@react-native/normalize-colors': 'look',
  '@rn-primitives/separator': 'look',
  '@rn-primitives/slot': 'look',
  'class-variance-authority': 'look',
  clsx: 'look',
  color: 'look',
  'color-convert': 'look',
  'color-name': 'look',
  'color-string': 'look',
  culori: 'look',
  'expo-blur': 'look',
  'expo-font': 'look',
  'expo-glass-effect': 'look',
  'expo-haptics': 'look',
  'expo-splash-screen': 'look',
  'expo-status-bar': 'look',
  'expo-symbols': 'look',
  'expo-system-ui': 'look',
  'is-arrayish': 'look',
  'phosphor-react-native': 'look',
  'react-native-gesture-handler': 'look',
  'react-native-reanimated': 'look',
  'react-native-svg': 'look',
  'react-native-worklets': 'look',
  'simple-swizzle': 'look',
  'tailwind-merge': 'look',
  uniwind: 'look',

  // App framework: React Native, Expo, screens and navigation.
  '@expo/devtools': 'framework',
  '@expo/dom-webview': 'framework',
  '@expo/log-box': 'framework',
  '@expo/metro-runtime': 'framework',
  '@react-native/assets-registry': 'framework',
  '@react-native/js-polyfills': 'framework',
  '@react-native/virtualized-lists': 'framework',
  expo: 'framework',
  'expo-application': 'framework',
  'expo-asset': 'framework',
  'expo-constants': 'framework',
  'expo-dev-client': 'framework',
  'expo-dev-launcher': 'framework',
  'expo-dev-menu': 'framework',
  'expo-dev-menu-interface': 'framework',
  'expo-device': 'framework',
  'expo-json-utils': 'framework',
  'expo-linking': 'framework',
  'expo-manifests': 'framework',
  'expo-modules-core': 'framework',
  'expo-modules-jsi': 'framework',
  'expo-network': 'framework',
  'expo-router': 'framework',
  'expo-updates-interface': 'framework',
  'expo-web-browser': 'framework',
  react: 'framework',
  'react-freeze': 'framework',
  'react-is': 'framework',
  'react-native': 'framework',
  'react-native-is-edge-to-edge': 'framework',
  'react-native-safe-area-context': 'framework',
  'react-native-screens': 'framework',
  scheduler: 'framework',
  'standard-navigation': 'framework',

  // Storage and data: the database on the phone, files, export, encryption.
  '@noble/ed25519': 'storage',
  '@noble/hashes': 'storage',
  'await-lock': 'storage',
  'base64-js': 'storage',
  buffer: 'storage',
  'expo-crypto': 'storage',
  'expo-file-system': 'storage',
  'expo-print': 'storage',
  'expo-secure-store': 'storage',
  'expo-sharing': 'storage',
  'expo-sqlite': 'storage',
  fflate: 'storage',
  ieee754: 'storage',
  'safe-buffer': 'storage',
  valibot: 'storage',

  // Signing in and backup.
  '@react-native-google-signin/google-signin': 'account',
  '@supabase/auth-js': 'account',
  '@supabase/functions-js': 'account',
  '@supabase/phoenix': 'account',
  '@supabase/postgrest-js': 'account',
  '@supabase/realtime-js': 'account',
  '@supabase/storage-js': 'account',
  '@supabase/supabase-js': 'account',
  'expo-apple-authentication': 'account',
  'iceberg-js': 'account',
  'react-native-passkey': 'account',

  // Everything else: reminders and small building blocks.
  '@babel/runtime': 'other',
  '@ungap/structured-clone': 'other',
  'abort-controller': 'other',
  'escape-string-regexp': 'other',
  'event-target-shim': 'other',
  'expo-notifications': 'other',
  'fast-deep-equal': 'other',
  'filter-obj': 'other',
  'flow-enums-runtime': 'other',
  'hoist-non-react-statics': 'other',
  invariant: 'other',
  'memoize-one': 'other',
  nanoid: 'other',
  nullthrows: 'other',
  promise: 'other',
  'query-string': 'other',
  'react-native-url-polyfill': 'other',
  'regenerator-runtime': 'other',
  semver: 'other',
  'split-on-first': 'other',
  'stacktrace-parser': 'other',
  'strict-uri-encode': 'other',
  tslib: 'other',
  'warn-once': 'other',
  'whatwg-fetch': 'other',
  'whatwg-url-minimum': 'other',
};

const BUILD = 'build tool: runs on the build machine, never in the app';
const WEB = 'web only: Metro resolves it for the web build, not iOS';
const TYPES = 'type definitions: removed at build time';
const UNUSED = 'reachable in the tree but no module of it is in the iOS bundle';

/** @type {Record<string, string>} */
export const NOT_SHIPPED = {
  '@babel/core': BUILD,
  '@babel/plugin-transform-arrow-functions': BUILD,
  '@babel/plugin-transform-class-properties': BUILD,
  '@babel/plugin-transform-classes': BUILD,
  '@babel/plugin-transform-nullish-coalescing-operator': BUILD,
  '@babel/plugin-transform-optional-chaining': BUILD,
  '@babel/plugin-transform-shorthand-properties': BUILD,
  '@babel/plugin-transform-template-literals': BUILD,
  '@babel/plugin-transform-unicode-regex': BUILD,
  '@babel/preset-typescript': BUILD,
  '@babel/types': BUILD,
  '@egjs/hammerjs': WEB,
  '@expo-google-fonts/material-symbols': 'Android only: iOS draws SF Symbols, this font is not bundled',
  '@expo/cli': BUILD,
  '@expo/config': BUILD,
  '@expo/config-plugins': BUILD,
  '@expo/config-types': BUILD,
  '@expo/env': BUILD,
  '@expo/expo-modules-macros-plugin': BUILD,
  '@expo/fingerprint': BUILD,
  '@expo/image-utils': BUILD,
  '@expo/local-build-cache-provider': BUILD,
  '@expo/metro': BUILD,
  '@expo/metro-config': BUILD,
  '@expo/plist': BUILD,
  '@expo/schema-utils': BUILD,
  '@radix-ui/react-separator': WEB,
  '@radix-ui/react-tabs': WEB,
  '@react-native/codegen': BUILD,
  '@react-native/community-cli-plugin': BUILD,
  '@react-native/gradle-plugin': 'Android build only',
  '@react-native/metro-config': BUILD,
  '@rn-primitives/portal': UNUSED,
  '@rn-primitives/types': TYPES,
  '@tailwindcss/node': BUILD,
  '@tailwindcss/oxide': BUILD,
  '@types/react': TYPES,
  '@types/react-test-renderer': TYPES,
  anser: 'development error overlay only: not in the release bundle',
  'ansi-regex': UNUSED,
  asap: UNUSED,
  'babel-plugin-syntax-hermes-parser': BUILD,
  'babel-preset-expo': BUILD,
  badgin: WEB,
  chalk: UNUSED,
  'client-only': WEB,
  commander: BUILD,
  'convert-source-map': BUILD,
  'css-select': UNUSED,
  'css-tree': UNUSED,
  debug: UNUSED,
  'decode-uri-component': 'replaced by apps/mobile/shims/decode-uri-component.js, listed as vendored code',
  'expo-build-properties': BUILD,
  'expo-modules-autolinking': BUILD,
  'expo-server': 'server rendering only',
  fontfaceobserver: WEB,
  'hermes-compiler': 'build tool: compiles the bundle; the Hermes engine itself is listed under NON_NPM',
  lightningcss: BUILD,
  'loose-envify': BUILD,
  metro: BUILD,
  'metro-runtime': 'the app depends on one copy (through @expo/metro-runtime) but the bundle carries the one Metro injects: see INJECTED',
  'metro-cache': BUILD,
  'metro-source-map': BUILD,
  'metro-transform-worker': BUILD,
  'pretty-format': 'development only: not in the release bundle',
  'react-devtools-core': 'development only: not in the release bundle',
  'react-dom': WEB,
  'react-fast-compare': UNUSED,
  'react-native-drawer-layout': UNUSED,
  'react-native-web': WEB,
  'react-refresh': 'development only: not in the release bundle',
  'server-only': 'server rendering only',
  'sf-symbols-typescript': TYPES,
  shallowequal: UNUSED,
  tailwindcss: BUILD,
  tinyglobby: BUILD,
  'type-fest': TYPES,
  typescript: BUILD,
  'ua-parser-js': WEB,
  vaul: WEB,
  ws: 'development server connection only: not in the release bundle',
  'xml2js': BUILD,
  yargs: BUILD,
};

/**
 * @typedef {object} NonNpm
 * @property {string} name
 * @property {string} [version]   exact, or the range CocoaPods resolves when the app is built (no Podfile.lock is kept: the iOS project is generated)
 * @property {Theme} theme
 * @property {'native' | 'vendored' | 'model' | 'artwork'} kind
 * @property {string} licence     SPDX id, from the upstream licence file
 * @property {string} file        licence text under scripts/licences/third-party/
 * @property {string} source      where that text was copied from
 * @property {string} why         how it reaches the app
 * @property {string} [model]     for kind 'model': the SpeechModelId in apps/mobile/src/lib/models/catalog.ts
 */

/** @type {NonNpm[]} */
export const NON_NPM = [
  // Speech
  { name: 'whisper.cpp and ggml', version: '1.9.3', theme: 'speech', kind: 'vendored', licence: 'MIT', file: 'whisper.cpp.txt', source: 'https://github.com/ggml-org/whisper.cpp/blob/v1.9.3/LICENSE', why: 'compiled into whisper.rn (node_modules/whisper.rn/cpp, src/version.json)' },
  { name: 'YaRN rotary embedding', theme: 'speech', kind: 'vendored', licence: 'MIT', file: 'yarn.txt', source: 'https://github.com/jquesnelle/yarn/blob/master/LICENSE', why: 'adapted in ggml (whisper.rn/cpp/ggml-cpu/ops.cpp and ggml-metal/kernels/rope.metal credit it)' },
  { name: 'Whisper large-v3-turbo', version: 'q5_0', theme: 'speech', kind: 'model', licence: 'MIT', file: 'openai-whisper.txt', source: 'https://github.com/openai/whisper/blob/main/LICENSE (weights); ggml conversion huggingface.co/ggerganov/whisper.cpp, license: mit', why: 'downloaded when a language uses it', model: 'speech-model.whisper-large-v3-turbo-q5_0' },
  { name: 'Whisper small', version: 'q5_1', theme: 'speech', kind: 'model', licence: 'MIT', file: 'openai-whisper.txt', source: 'https://github.com/openai/whisper/blob/main/LICENSE (weights); ggml conversion huggingface.co/ggerganov/whisper.cpp, license: mit', why: 'downloaded on phones with less memory', model: 'speech-model.whisper-small-q5_1' },
  { name: 'Silero VAD', version: '6.2.0', theme: 'speech', kind: 'model', licence: 'MIT', file: 'silero-vad.txt', source: 'https://github.com/snakers4/silero-vad/blob/v6.2/LICENSE; ggml conversion huggingface.co/ggml-org/whisper-vad, license: mit', why: 'downloaded with the first speech model', model: 'speech-model.silero-vad-v6.2.0' },

  // Look and feel
  { name: 'Phosphor Icons artwork', theme: 'look', kind: 'artwork', licence: 'MIT', file: 'phosphor-core.txt', source: 'https://github.com/phosphor-icons/core/blob/main/LICENSE', why: 'the icon drawings inside phosphor-react-native' },

  // App framework: React Native's iOS dependencies (node_modules/react-native/scripts/cocoapods/helpers.rb and third-party-podspecs)
  { name: 'Hermes', version: '250829098.0.17', theme: 'framework', kind: 'native', licence: 'MIT', file: 'hermes.txt', source: 'https://github.com/facebook/hermes/blob/main/LICENSE', why: 'the JavaScript engine (hermes-engine pod; version from hermes-compiler)' },
  { name: 'Folly', version: '2024.11.18.00', theme: 'framework', kind: 'native', licence: 'Apache-2.0', file: 'folly.txt', source: 'https://github.com/facebook/folly/blob/v2024.11.18.00/LICENSE', why: 'RCT-Folly pod' },
  { name: 'glog', version: '0.3.5', theme: 'framework', kind: 'native', licence: 'BSD-3-Clause', file: 'glog.txt', source: 'https://github.com/google/glog/blob/v0.3.5/COPYING', why: 'glog pod' },
  { name: 'double-conversion', version: '1.1.6', theme: 'framework', kind: 'native', licence: 'BSD-3-Clause', file: 'double-conversion.txt', source: 'https://github.com/google/double-conversion/blob/v1.1.6/LICENSE', why: 'DoubleConversion pod (its podspec says MIT; the upstream file is BSD 3-Clause)' },
  { name: '{fmt}', version: '12.1.0', theme: 'framework', kind: 'native', licence: 'MIT', file: 'fmt.txt', source: 'https://github.com/fmtlib/fmt/blob/12.1.0/LICENSE', why: 'fmt pod' },
  { name: 'fast_float', version: '8.0.0', theme: 'framework', kind: 'native', licence: 'MIT', file: 'fast_float.txt', source: 'https://github.com/fastfloat/fast_float/blob/v8.0.0/LICENSE-MIT', why: 'fast_float pod (offered under MIT, Apache 2.0 or Boost; MIT taken)' },
  { name: 'Boost', version: '1.84.0', theme: 'framework', kind: 'native', licence: 'BSL-1.0', file: 'boost.txt', source: 'https://github.com/boostorg/boost/blob/boost-1.84.0/LICENSE_1_0.txt', why: 'boost pod' },
  { name: 'SocketRocket', version: '0.7.1', theme: 'framework', kind: 'native', licence: 'BSD-3-Clause', file: 'socketrocket.txt', source: 'https://github.com/facebookincubator/SocketRocket/blob/0.7.1/LICENSE', why: 'SocketRocket pod (React Native WebSocket)' },

  // Storage and data
  { name: 'SQLite', version: '3.50.3', theme: 'storage', kind: 'vendored', licence: 'blessing', file: 'sqlite.txt', source: 'node_modules/expo-sqlite/vendor/sqlite3/sqlite3.h (header)', why: 'compiled into expo-sqlite' },

  // Signing in: Google Sign-In's pods (GoogleSignIn.podspec 9.x and its dependencies)
  { name: 'Google Sign-In for iOS', version: '9.x', theme: 'account', kind: 'native', licence: 'Apache-2.0', file: 'googlesignin.txt', source: 'https://github.com/google/GoogleSignIn-iOS/blob/9.1.0/LICENSE', why: 'GoogleSignIn pod ~> 9.0 (@react-native-google-signin/google-signin GoogleSignInPodVersion)' },
  { name: 'AppAuth for iOS', version: '2.x', theme: 'account', kind: 'native', licence: 'Apache-2.0', file: 'appauth.txt', source: 'https://github.com/openid/AppAuth-iOS/blob/master/LICENSE', why: 'AppAuth pod ~> 2.0, from GoogleSignIn' },
  { name: 'GTMAppAuth', version: '5.x', theme: 'account', kind: 'native', licence: 'Apache-2.0', file: 'gtmappauth.txt', source: 'https://github.com/google/GTMAppAuth/blob/master/LICENSE', why: 'GTMAppAuth pod ~> 5.0, from GoogleSignIn' },
  { name: 'GTMSessionFetcher', version: '3.x', theme: 'account', kind: 'native', licence: 'Apache-2.0', file: 'gtmsessionfetcher.txt', source: 'https://github.com/google/gtm-session-fetcher/blob/main/LICENSE', why: 'GTMSessionFetcher/Core pod ~> 3.3, from GoogleSignIn' },
  { name: 'App Check Core', version: '11.x', theme: 'account', kind: 'native', licence: 'Apache-2.0', file: 'appcheck.txt', source: 'https://github.com/google/app-check/blob/main/LICENSE', why: 'AppCheckCore pod ~> 11.0, from GoogleSignIn' },
  { name: 'GoogleUtilities', version: '8.x', theme: 'account', kind: 'native', licence: 'Apache-2.0', file: 'googleutilities.txt', source: 'https://github.com/google/GoogleUtilities/blob/main/LICENSE', why: 'GoogleUtilities pods, from the Google Sign-In adapter and AppCheckCore' },
  { name: 'Promises', version: '2.x', theme: 'account', kind: 'native', licence: 'Apache-2.0', file: 'promises.txt', source: 'https://github.com/google/promises/blob/master/LICENSE', why: 'PromisesObjC pod, from AppCheckCore' },
  { name: 'Interop for Google SDKs', version: '101.x', theme: 'account', kind: 'native', licence: 'Apache-2.0', file: 'interop.txt', source: 'https://github.com/google/interop-ios-for-google-sdks/blob/main/LICENSE', why: 'RecaptchaInterop pod, from the Google Sign-In adapter' },
];

/**
 * npm packages published without a licence file and with no sibling package to read one from
 * (lib.mjs inheritNotices): the text from the upstream repository the package names, copied word
 * for word into third-party/. Used only while the installed package still has no file of its own.
 * @type {Record<string, { file: string, source: string }>}
 */
export const UPSTREAM_NOTICES = {
  'metro-runtime': { file: 'metro.txt', source: 'https://github.com/facebook/metro/blob/v0.84.5/LICENSE (the version Metro injects; package.json repository: react/metro, packages/metro-runtime)' },
  'standard-navigation': { file: 'standard-navigation.txt', source: 'https://github.com/react-navigation/standard-navigation/blob/main/LICENSE (package.json repository)' },
};

/**
 * Code the bundler writes into every bundle from its own dependencies (the module system and
 * `require`), which no app dependency edge reaches: `via` is the path of build packages to resolve
 * through, starting at the repo root. Found in the source map of `expo export -p ios`
 * (node_modules/metro/node_modules/metro-runtime/src/polyfills/require.js).
 * @type {{ name: string, via: string[], theme: Theme }[]}
 */
export const INJECTED = [{ name: 'metro-runtime', via: ['metro'], theme: 'framework' }];

/**
 * The licence texts for the language pack data (packs/text-rules/*.json `attribution`), shown
 * under each attribution line on the Licenses page. `match` is a word the attribution line
 * contains; every line must match exactly one row and every row at least one line (lib.mjs
 * packNotices). Texts copied word for word from `source` into third-party/.
 * @type {{ match: string, licences: string[], files: { file: string, source: string }[] }[]}
 */
export const PACK_NOTICES = [
  { match: 'OpenCC', licences: ['Apache-2.0'], files: [{ file: 'opencc.txt', source: 'https://github.com/BYVoid/OpenCC/blob/master/LICENSE (no NOTICE file upstream)' }] },
  {
    match: 'pinyin-data',
    licences: ['MIT', 'Unicode-3.0'],
    files: [
      { file: 'pinyin-data.txt', source: 'https://github.com/mozillazg/pinyin-data/blob/master/LICENSE' },
      { file: 'unicode-v3.txt', source: 'https://www.unicode.org/license.txt (Unicode License v3, covers the Unihan kMandarin data)' },
    ],
  },
];

/** Everything above, as lib.mjs deriveNotices takes it. */
export const TABLE = { packages: PACKAGES, notShipped: NOT_SHIPPED, nonNpm: NON_NPM, themes: THEMES, upstreamNotices: UPSTREAM_NOTICES, injected: INJECTED, packNotices: PACK_NOTICES };
