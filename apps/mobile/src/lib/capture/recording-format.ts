/**
 * The recorder settings for each platform's container (ADR 0027, accepted
 * pending checks V1, V2 and V3; until then ADR 0005's M4A stays the default
 * on both platforms). The switch itself is `RECORDING_CONTAINERS` in
 * recording-file.ts.
 *
 * - 'm4a', today: AAC-LC in MPEG-4. The index (`moov`) is written when the
 *   recorder stops, so a take cut off by a kill most likely has none and will
 *   not open (TDD 03 R-4). The launch sweep keeps such a take and lists it
 *   (D-085), but it does not play.
 * - 'adts': the same AAC-LC frames, at the same rate, channels, bitrate and
 *   quality, written as an ADTS stream (`.aac`). Every frame carries its own
 *   header, so a take cut off by a kill opens up to its last whole frame.
 *   iOS takes the file type from the extension (the AVAudioRecorder header
 *   says so and Apple documents the same rule for AVAudioFile; unverified
 *   until check V1). Android would use MediaRecorder.OutputFormat.AAC_ADTS
 *   (expo-audio `outputFormat: 'aac_adts'`), but stays M4A in build 2.
 *
 * Nothing converts a take after it is recorded, in either container: the
 * file is kept exactly as the recorder wrote it, and its capture hash
 * describes those bytes. Export names and labels each recording by its own
 * container (export/build.logic.ts `recordingFileOf`, schema 1.2.0).
 */
import { AudioQuality, IOSOutputFormat, type RecordingOptions } from 'expo-audio';
import { RECORDING_CONTAINERS, RECORDING_FILES, type RecordingContainer, type RecordingPlatform } from './recording-file';

export { RECORDING_CONTAINERS, RECORDING_FILES, recordingContainerFor, type RecordingContainer, type RecordingPlatform } from './recording-file';

/**
 * The recorder settings for a container on each platform. Only the file type
 * differs between containers: AAC-LC, mono, 48 kHz, 64 kbps, high encoder
 * quality, metering on, written to Documents (expo-audio puts it in
 * `Documents/ExpoAudio`, Android `<files>/Audio`). expo-audio lays the
 * platform's block over the common options, so the top-level extension
 * matters only where no block applies.
 */
export function voiceRecordingOptions(containers: Readonly<Record<RecordingPlatform, RecordingContainer>> = RECORDING_CONTAINERS): RecordingOptions {
  const ios = RECORDING_FILES[containers.ios];
  const android = RECORDING_FILES[containers.android];
  return {
    extension: ios.extension,
    sampleRate: 48000,
    numberOfChannels: 1,
    bitRate: 64000,
    isMeteringEnabled: true,
    directory: 'document',
    ios: { extension: ios.extension, outputFormat: IOSOutputFormat.MPEG4AAC, audioQuality: AudioQuality.HIGH, sampleRate: 48000 },
    android: { extension: android.extension, outputFormat: android.androidOutputFormat, audioEncoder: 'aac', sampleRate: 48000 },
    web: { mimeType: 'audio/webm', bitsPerSecond: 64000 },
  };
}
