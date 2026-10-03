/**
 * WEB ONLY (design previews, never shipped). The fictional family seeded by
 * `?seed=asha` (asha-seed.ts) points its recordings at `file:///preview/...`,
 * which no browser can read. In a preview build (development, or an export
 * with EXPO_PUBLIC_WEB_PREVIEW=1) those URIs count as present so the letter
 * page shows the player, as it would on a phone. Anything else, and every
 * production web build, stays "not on this phone".
 */
import { isPreviewSeedAudio } from './preview-audio.logic';

const preview = __DEV__ || process.env.EXPO_PUBLIC_WEB_PREVIEW === '1';

export function isPreviewAudioPresent(uri: string | null | undefined): boolean {
  return preview && isPreviewSeedAudio(uri);
}
