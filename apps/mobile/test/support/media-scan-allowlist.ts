/**
 * The metadata-only allowlist (NX-39 v2 R9, R50; SEC-ML-1, SEC-ML-2; BL-845).
 *
 * Every list the media scanner (media-scan.ts) judges code against lives in this one file, so a change to what media
 * code may call, read or return is one reviewed diff. Proposed owner in CODEOWNERS: `security-architect`
 * (R9 (d)); until that line is merged, review this file as you would the verifier. Growing a list here to make a
 * scan pass is the one thing this test exists to stop: add the call to the allowlist only with the reviewer's reason in
 * the pull request.
 *
 * Provisional, and said so: the library call names below are the ones the ADR draft (T1) lists for the new
 * `expo-media-library` API; the picker names are the one call P0 needs. SDK 57's real surface is UNVERIFIED (nothing
 * installs either package yet), so the first pull request that installs one re-checks these names against it.
 * The scanner reads our own TypeScript only. It cannot see inside a dependency's native code (R52, BL-878 cover that).
 */

/** Modules whose import means "this file touches the photo library or the picker": the file is scanned. */
export const MEDIA_MODULE = /(?:^|[/@-])(?:expo-media-library|expo-image-picker|media-library|image-picker|photokit|photos?-?picker|react-native-photos|expo-video-thumbnails|expo-image-manipulator)(?:$|[/-])/i;

/** Folders whose files are always scanned, whatever they import. Paths are relative to apps/mobile. */
export const MEDIA_FOLDERS: readonly string[] = [
  'src/lib/media',
  'src/lib/memory-library',
  'src/lib/library',
  'src/lib/moments',
  'src/components/media',
  'src/components/memory-library',
  'modules/scribe-media',
  'modules/scribe-library',
];

/**
 * The names media code may take from a media module, per module. Anything else imported from, or called on, that
 * module fails. `Asset`, `Album` and `Query` are the new API's classes; their members are checked against the same
 * list.
 */
export const ALLOWED_LIBRARY_CALLS: Readonly<Record<string, readonly string[]>> = {
  'expo-media-library': ['requestPermissionsAsync', 'getPermissionsAsync', 'presentPermissionsPickerAsync', 'presentPermissionsPicker', 'addListener'],
  'expo-media-library/next': ['requestPermissionsAsync', 'getPermissionsAsync', 'presentPermissionsPicker', 'Query', 'Asset', 'Album', 'getInfo', 'getLocation', 'getAll', 'getLivePhotoVideoUri', 'addListener'],
  'expo-image-picker': ['launchImageLibraryAsync'],
};

/**
 * Words that may not appear in a name, whole or as one camelCase or snake_case token, anywhere in a scanned file.
 * Matching is on tokens, so `interface` and `surface` do not contain `face`. A name can be a variable, a property, a
 * string that looks like a name ('CLGeocoder'), an import, or a member of anything.
 */
export const BANNED_TOKENS: readonly string[] = [
  // Content analysis (R9 (a)).
  'vision', 'mlkit', 'face', 'faces', 'facial', 'caption', 'captions', 'captioning', 'classify', 'classifier', 'classifiers', 'classification', 'classifications',
  'scene', 'scenes', 'people', 'places', 'tensorflow', 'tflite', 'coreml', 'onnx',
  // Reverse geocoding and finer place than a city key (R6, R7, R40).
  'geocoder', 'geocode', 'geocoding', 'geohash', 'clgeocoder', 'cllocation',
  // Speech on a video's audio (R23).
  'whisper', 'transcribe', 'transcribes', 'transcription', 'speech', 'recognizer',
  // Writing to the library (R4: no add-only permission).
  'createasset', 'createassetasync', 'savetolibraryasync', 'deleteassetsasync', 'createalbumasync', 'addassetstoalbumasync',
];

/** Whole-name patterns for the collection kinds and titles R9 bans (a smart album, a moment, People and Places, a title). */
export const BANNED_NAME_PATTERNS: readonly RegExp[] = [
  /createAsset/i,
  /smartAlbum/i,
  /PHAssetCollection/i,
  /getMoments/i,
  /albumMoment/i,
  /localizedTitle/i,
  /album.*title/i,
  /collection.*title/i,
  /\bVN[A-Z]\w+/,
  /\bML(?:Kit|Image|Face)\w*/,
];

/** The network. A media path never talks to one (R7, R33, R54). */
export const BANNED_NETWORK: readonly string[] = ['fetch', 'xmlhttprequest', 'websocket', 'eventsource', 'sendbeacon', 'axios', 'supabase', 'posthog', 'sentry'];

/** Module paths media code may not import (matched on the specifier text, any part). */
export const BANNED_MODULE = /vision|ml-?kit|tensorflow|tfjs|onnx|coreml|face|caption|classif|scene|people|geocod|speech|whisper|transcri|expo-location|geolocation|supabase|posthog|sentry|axios|image-?label|@scribe\/(?:api|analytics)|\/analytics|\/sync(?:\/|$)/i;

/**
 * Property names on a photo or video record that hold where it was taken or what the camera wrote. Reading one is a
 * finding in every scanned file except those listed in FIELD_READ_EXCEPTIONS (R6: coordinates may be read into memory
 * and reduced to a city key by one helper; that helper is added here in its own reviewed pull request, not before).
 */
export const BANNED_FIELDS: readonly string[] = ['latitude', 'longitude', 'altitude', 'coords', 'coordinate', 'coordinates', 'gps', 'exif', 'location', 'filename', 'serial', 'cameramake', 'cameramodel'];
export const FIELD_READ_EXCEPTIONS: Readonly<Record<string, readonly string[]>> = {};

/** The adapter returns exactly these fields (R9 (b), SEC-ML-1). `pixelSize` holds exactly PIXEL_SIZE_FIELDS. */
export const ASSET_RECORD_FIELDS: readonly string[] = ['opaqueId', 'capturedAt', 'kind', 'durationMs', 'pixelSize', 'cityKey'];
export const PIXEL_SIZE_FIELDS: readonly string[] = ['width', 'height'];

/** A file whose name matches is an adapter boundary: what it returns is checked field by field. */
export const ADAPTER_FILE = /(?:^|[-./])(?:adapter|asset-record)(?:[-.]|$)/;

/** The function-name shape an adapter may return from instead of an object literal (another boundary function). */
export const RECORD_FACTORY = /^to[A-Z]\w*Record$/;
