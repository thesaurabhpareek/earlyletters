/**
 * The containers a recording can be stored in (ADR 0027), with their file
 * name extension and media type, and the switch that picks the container new
 * takes use on each platform. Pure (no React Native, no expo-audio), so
 * Export, backup, transcription and capture can all read it, in the app and
 * in Node.
 *
 * - 'm4a': AAC-LC in MPEG-4, `audio/mp4`. Every take before ADR 0027.
 * - 'adts': the same AAC-LC frames as an ADTS stream, `audio/aac`.
 */
import { fileNameOf } from './sweep.logic';

export type RecordingContainer = 'm4a' | 'adts';
export type RecordingPlatform = 'ios' | 'android';

export const RECORDING_FILES = {
  m4a: { extension: '.m4a', mimeType: 'audio/mp4', androidOutputFormat: 'mpeg4' },
  adts: { extension: '.aac', mimeType: 'audio/aac', androidOutputFormat: 'aac_adts' },
} as const satisfies Record<RecordingContainer, { extension: string; mimeType: string; androidOutputFormat: string }>;

export type RecordingMimeType = (typeof RECORDING_FILES)[RecordingContainer]['mimeType'];

/**
 * The container new takes use, per platform (ADR 0027). iOS records ADTS
 * from build 2: flipped on 27 Oct on the simulator evidence (V2 passed twice,
 * 50 of 50 killed takes playing each time; V3's in-app decode check 50 of 50;
 * V1's header half). V1's speech half, V3's Mac half and V4 are due before the
 * build 2 freeze, and this line goes back to 'm4a' if one fails. Android
 * stays 'm4a': it is not in the alpha, and Media3 seeks ADTS only with
 * constant-bitrate seeking, which expo-audio does not enable, so Android ADTS
 * is post-alpha work with its own checks.
 */
export const RECORDING_CONTAINERS: Readonly<Record<RecordingPlatform, RecordingContainer>> = { ios: 'adts', android: 'm4a' };

/** The container new takes use on a platform (`Platform.OS`); anything but Android follows iOS. */
export function recordingContainerFor(os: string): RecordingContainer {
  return os === 'android' ? RECORDING_CONTAINERS.android : RECORDING_CONTAINERS.ios;
}

/**
 * The container of a stored recording, from its file name: a name ending in
 * `.aac` is ADTS. Anything else is M4A, as every take before ADR 0027 was, so
 * old letters keep exactly the name and label they always had.
 */
export function containerOfRecording(uri: string | null | undefined): RecordingContainer {
  return uri && /\.aac$/i.test(fileNameOf(uri)) ? 'adts' : 'm4a';
}
