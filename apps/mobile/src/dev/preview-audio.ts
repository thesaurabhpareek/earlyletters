/**
 * Native: seeded preview audio does not exist, so this is always false and a
 * letter's recording is present only when its file is really on the phone.
 * The web design preview has its own version (preview-audio.web.ts).
 */
export function isPreviewAudioPresent(_uri: string | null | undefined): boolean {
  return false;
}
