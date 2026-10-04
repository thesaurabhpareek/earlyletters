/**
 * File paths for native libraries (pure; test/models-catalog.test.ts).
 */

/**
 * A plain file system path for whisper.rn. It strips `file://` but does not
 * percent-decode, and the iOS folder is "Application Support" (a space):
 * `Application%20Support` would not be found.
 */
export function nativePath(uriOrPath: string): string {
  if (!uriOrPath.startsWith('file://')) return uriOrPath;
  const rest = uriOrPath.slice('file://'.length);
  try {
    return decodeURI(rest);
  } catch {
    return rest;
  }
}
