/// <reference types="node" />
/**
 * The recording container switch, per platform (ADR 0027). iOS records ADTS from build 2: the one line
 * `RECORDING_CONTAINERS.ios = 'adts'` (capture/recording-file.ts), flipped on 27 Oct on the simulator
 * evidence, and set back to 'm4a' if a check due before the freeze fails. Android stays M4A: it is not in
 * the alpha, and Media3 seeks ADTS only with constant-bitrate seeking, which expo-audio does not enable.
 * These tests pin the M4A settings byte for byte, show that ADTS changes only the file type and only on
 * the platform that flips, and that the rest of the app (Export included) already treats an ADTS take as
 * a recording, so they hold before and after the flip.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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

const { RECORDING_CONTAINERS, RECORDING_FILES, recordingContainerFor, voiceRecordingOptions } = await import('../src/lib/capture/recording-format');
const { VOICE_RECORDING_OPTIONS } = await import('../src/lib/capture/recorder');
const { RECORDING_EXTENSIONS, isAudioFile } = await import('../src/lib/capture/sweep.logic');
const { folderFor } = await import('../src/lib/resilience/recovery-export.logic');
const { audioPath } = await import('../src/lib/export/build.logic');

const DOCS = 'file:///var/mobile/Containers/Data/Application/B81D7E44/Documents/';
const M4A_BOTH = { ios: 'm4a', android: 'm4a' } as const;
const BUILD_2 = { ios: 'adts', android: 'm4a' } as const;

describe('[ADR 0005] the M4A recording is unchanged', () => {
  it('AAC-LC, mono, 48 kHz, 64 kbps, high quality, metering on, in .m4a under Documents, exactly as before', () => {
    expect(voiceRecordingOptions(M4A_BOTH)).toEqual({
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

  it('Listen and the kill drill record with the switch: VOICE_RECORDING_OPTIONS is each platform\'s current container', () => {
    expect(VOICE_RECORDING_OPTIONS).toEqual(voiceRecordingOptions(RECORDING_CONTAINERS));
    expect(recordingContainerFor('ios')).toBe(RECORDING_CONTAINERS.ios);
    expect(recordingContainerFor('android')).toBe(RECORDING_CONTAINERS.android);
  });

  it('Export names a take in each platform\'s current container by that container\'s extension, so the flip needs no Export change', () => {
    for (const os of ['ios', 'android'] as const) {
      const { extension } = RECORDING_FILES[recordingContainerFor(os)];
      const take = `${DOCS}ExpoAudio/recording-5D2E0F11-0000-4000-8000-0000000057A0${extension}`;
      expect(audioPath('0199a5b0-0000-7000-8000-00000000e001', take), os).toBe(`audio/0199a5b0-0000-7000-8000-00000000e001${extension}`);
    }
  });
});

describe('[ADR 0027] ADTS on iOS only, for build 2', () => {
  it('Android records M4A in build 2: its ADTS is post-alpha, with its own checks', () => {
    expect(RECORDING_CONTAINERS.android).toBe('m4a');
  });

  it('iOS records ADTS from build 2 (flipped 27 Oct; the one line goes back to m4a if V1, V3 or V4 fails before the freeze)', () => {
    expect(RECORDING_CONTAINERS).toEqual({ ios: 'adts', android: 'm4a' });
    expect(VOICE_RECORDING_OPTIONS).toEqual(voiceRecordingOptions(BUILD_2));
    expect(VOICE_RECORDING_OPTIONS.ios).toMatchObject({ extension: '.aac', outputFormat: 'aac ' });
    expect(VOICE_RECORDING_OPTIONS.android).toMatchObject({ extension: '.m4a', outputFormat: 'mpeg4' });
  });

  it('the build 2 flip changes only iOS, and only its file type: the same AAC-LC frames, rate, channels, bitrate and quality', () => {
    const before = voiceRecordingOptions(M4A_BOTH);
    const after = voiceRecordingOptions(BUILD_2);
    expect(after.ios).toEqual({ ...before.ios, extension: '.aac' }); // the codec stays kAudioFormatMPEG4AAC
    expect(after.android).toEqual(before.android); // .m4a, mpeg4
    expect({ ...after, extension: null, ios: null }).toEqual({ ...before, extension: null, ios: null });
  });

  it('ADTS on Android, when it comes, would change only its file type too', () => {
    const adts = voiceRecordingOptions({ ios: 'm4a', android: 'adts' });
    expect(adts.android).toEqual({ extension: '.aac', outputFormat: 'aac_adts', audioEncoder: 'aac', sampleRate: 48000 });
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

  it('the e2e inspectors know every recording extension: the age-gate check counts them all, the export check takes .aac with audio/aac', () => {
    const container = readFileSync(join(__dirname, '..', 'e2e', 'bin', 'inspect-container.sh'), 'utf8');
    for (const ext of RECORDING_EXTENSIONS) expect(container, ext).toContain(`-iname '*.${ext}'`);
    const exported = readFileSync(join(__dirname, '..', 'e2e', 'bin', 'inspect-export.sh'), 'utf8');
    expect(exported).toContain('\\.(m4a|aac)$');
    expect(exported).toContain('"audio/aac" : "audio/mp4"');
  });
});
