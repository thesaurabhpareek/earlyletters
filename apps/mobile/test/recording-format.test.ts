/// <reference types="node" />
/**
 * The recording container switch (ADR 0027, proposed; ADR 0005 holds until it is accepted). The default
 * stays M4A; ADTS is a prototype to flip once DL-01 on the simulator (#203) shows ADTS takes play after
 * a kill and Export carries `.aac`. These tests pin that the default did not move, that ADTS changes only
 * the file type, and that the rest of the app already treats an ADTS take as a recording.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-audio', () => ({ AudioQuality: { HIGH: 96 }, IOSOutputFormat: { MPEG4AAC: 'aac ' }, setAudioModeAsync: async () => {} }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7), CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digest: async () => new ArrayBuffer(32) }));
vi.mock('expo-file-system', () => ({ File: class {} }));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const { RECORDING_CONTAINER, RECORDING_FILES, voiceRecordingOptions } = await import('../src/lib/capture/recording-format');
const { VOICE_RECORDING_OPTIONS } = await import('../src/lib/capture/recorder');
const { isAudioFile } = await import('../src/lib/capture/sweep.logic');
const { folderFor } = await import('../src/lib/resilience/recovery-export.logic');
const { audioPath } = await import('../src/lib/export/build.logic');

const DOCS = 'file:///var/mobile/Containers/Data/Application/B81D7E44/Documents/';

describe('[ADR 0005] the default recording is unchanged', () => {
  it('AAC-LC, mono, 48 kHz, 64 kbps, high quality, metering on, in .m4a under Documents, exactly as before', () => {
    expect(RECORDING_CONTAINER).toBe('m4a');
    expect(voiceRecordingOptions()).toEqual({
      extension: '.m4a',
      sampleRate: 48000,
      numberOfChannels: 1,
      bitRate: 64000,
      isMeteringEnabled: true,
      directory: 'document',
      ios: { extension: '.m4a', outputFormat: 'aac ', audioQuality: 96, sampleRate: 48000 },
      android: { extension: '.m4a', outputFormat: 'mpeg4', audioEncoder: 'aac', sampleRate: 48000 },
      web: { mimeType: 'audio/webm', bitsPerSecond: 64000 },
    });
  });

  it('Listen and the kill drill record with the switch: VOICE_RECORDING_OPTIONS is the default container', () => {
    expect(VOICE_RECORDING_OPTIONS).toEqual(voiceRecordingOptions(RECORDING_CONTAINER));
  });

  it('the default stays M4A while Export names every recording .m4a (flip only with S03\'s Export change)', () => {
    expect(RECORDING_CONTAINER === 'm4a' || !audioPath('0199a5b0-0000-7000-8000-00000000e001').endsWith('.m4a')).toBe(true);
  });
});

describe('[ADR 0027] ADTS, the prototype', () => {
  it('changes only the file type: the same AAC-LC frames, rate, channels, bitrate and encoder quality', () => {
    const m4a = voiceRecordingOptions('m4a');
    const adts = voiceRecordingOptions('adts');
    expect(adts.extension).toBe('.aac');
    expect(adts.ios).toMatchObject({ extension: '.aac', outputFormat: 'aac ' }); // the codec stays kAudioFormatMPEG4AAC
    expect(adts.android).toMatchObject({ extension: '.aac', outputFormat: 'aac_adts', audioEncoder: 'aac' });
    const fileTypeOnly = (o: typeof m4a) => ({
      ...o,
      extension: null,
      ios: { ...o.ios, extension: null },
      android: { ...o.android, extension: null, outputFormat: null },
    });
    expect(fileTypeOnly(adts)).toEqual(fileTypeOnly(m4a));
  });

  it('each container has its own extension and media type', () => {
    expect(RECORDING_FILES.m4a).toMatchObject({ extension: '.m4a', mimeType: 'audio/mp4' });
    expect(RECORDING_FILES.adts).toMatchObject({ extension: '.aac', mimeType: 'audio/aac' });
  });

  it('an ADTS take is a recording to the sweep, erase and "Export what is readable"', () => {
    const take = `${DOCS}ExpoAudio/recording-5D2E0F11-0000-4000-8000-0000000057A1.aac`;
    expect(isAudioFile(take)).toBe(true);
    expect(folderFor({ name: 'recording-5D2E0F11-0000-4000-8000-0000000057A1.aac', source: 'documents' })).toBe('recordings');
  });
});
