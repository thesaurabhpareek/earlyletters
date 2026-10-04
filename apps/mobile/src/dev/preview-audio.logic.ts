/** Where the web preview's seeded recordings live (asha-seed.ts). Pure and tested. */
export const PREVIEW_AUDIO_PREFIX = 'file:///preview/';

export function isPreviewSeedAudio(uri: string | null | undefined): boolean {
  return typeof uri === 'string' && uri.startsWith(PREVIEW_AUDIO_PREFIX) && uri.length > PREVIEW_AUDIO_PREFIX.length;
}
