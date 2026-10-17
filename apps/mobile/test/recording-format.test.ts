/// <reference types="node" />
/**
 * The recording container switch (ADR 0027, accepted pending checks V1 and V2). The default stays M4A
 * until V1 (a simulator take is real ADTS) and V2 (DL-01 on the simulator, #203) pass; then the flip is
 * the one line `RECORDING_CONTAINER = 'adts'`. These tests pin the M4A settings byte for byte, show that
 * ADTS changes only the file type, and that the rest of the app (Export included) already treats an ADTS
 * take as a recording, so they hold before and after the flip.
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

describe('[ADR 0005] the M4A recording is unchanged', () => {
  it('AAC-LC, mono, 48 kHz, 64 kbps, high quality, metering on, in .m4a under Documents, exactly as before', () => {
    expect(voiceRecordingOptions('m4a')).toEqual({
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

  it('Export names a take in the current container by that container\'s extension, so the flip needs no Export change', () => {
    const { extension } = RECORDING_FILES[RECORDING_CONTAINER];
    const take = `${DOCS}ExpoAudio/recording-5D2E0F11-0000-4000-8000-0000000057A0${extension}`;
    expect(audioPath('0199a5b0-0000-7000-8000-00000000e001', take)).toBe(`audio/0199a5b0-0000-7000-8000-00000000e001${extension}`);
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
