/** The web preview's seeded recordings (asha-seed.ts) are recognised by their prefix only. */
import { describe, expect, it } from 'vitest';
import { PREVIEW_AUDIO_PREFIX, isPreviewSeedAudio } from './preview-audio.logic';
import { isPreviewAudioPresent } from './preview-audio';

describe('isPreviewSeedAudio', () => {
  it('matches the seeded file URIs', () => {
    expect(isPreviewSeedAudio(`${PREVIEW_AUDIO_PREFIX}asha.m4a`)).toBe(true);
    expect(isPreviewSeedAudio('file:///preview/asha-quiet.m4a')).toBe(true);
  });

  it('never matches a real recording, the bare prefix or nothing', () => {
    expect(isPreviewSeedAudio('file:///var/mobile/Containers/Data/Application/X/Documents/rec.m4a')).toBe(false);
    expect(isPreviewSeedAudio('file:///previewer/asha.m4a')).toBe(false);
    expect(isPreviewSeedAudio(PREVIEW_AUDIO_PREFIX)).toBe(false);
    expect(isPreviewSeedAudio(null)).toBe(false);
    expect(isPreviewSeedAudio(undefined)).toBe(false);
  });
});

describe('isPreviewAudioPresent (native build)', () => {
  it('is always false outside the web preview, even for seeded URIs', () => {
    expect(isPreviewAudioPresent('file:///preview/asha.m4a')).toBe(false);
  });
});
