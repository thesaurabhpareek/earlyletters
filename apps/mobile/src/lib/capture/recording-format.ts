/**
 * Which container a take is written into (ADR 0027, accepted pending checks
 * V1 and V2; until then ADR 0005's M4A stays the default).
 *
 * - 'm4a', today: AAC-LC in MPEG-4. The index (`moov`) is written when the
 *   recorder stops, so a take cut off by a kill most likely has none and will
 *   not open (TDD 03 R-4). The launch sweep keeps such a take and lists it
 *   (D-085), but it does not play.
 * - 'adts': the same AAC-LC frames, at the same rate, channels, bitrate and
 *   quality, written as an ADTS stream (`.aac`). Every frame carries its own
 *   header, so a take cut off by a kill opens up to its last whole frame.
 *   iOS takes the file type from the extension (the AVAudioRecorder header
 *   says so and Apple documents the same rule for AVAudioFile; unverified on
 *   a device until check V1 in ADR 0027). Android uses
 *   MediaRecorder.OutputFormat.AAC_ADTS (expo-audio `outputFormat: 'aac_adts'`).
 *
 * The default stays 'm4a' until both hold: V1, a simulator take written as
 * real ADTS, and V2, DL-01 on the simulator (#203) with ADTS takes playing
 * after a kill. Export already names and labels each recording by its own
 * container (export/build.logic.ts `recordingFileOf`, schema 1.2.0).
 * Nothing converts a take after it is recorded, in either container: the
 * file is kept exactly as the recorder wrote it, and its capture hash
 * describes those bytes.
 */
import { AudioQuality, IOSOutputFormat, type RecordingOptions } from 'expo-audio';
import { RECORDING_FILES, type RecordingContainer } from './recording-file';

export { RECORDING_FILES, type RecordingContainer } from './recording-file';

/** The container new takes use. Change it only as ADR 0027 says. */
export const RECORDING_CONTAINER: RecordingContainer = 'm4a';

/**
 * The recorder settings for a container. Only the file type differs between
 * containers: AAC-LC, mono, 48 kHz, 64 kbps, high encoder quality, metering
 * on, written to Documents (expo-audio puts it in `Documents/ExpoAudio`).
 */
export function voiceRecordingOptions(container: RecordingContainer = RECORDING_CONTAINER): RecordingOptions {
  const file = RECORDING_FILES[container];
  return {
    extension: file.extension,
    sampleRate: 48000,
    numberOfChannels: 1,
    bitRate: 64000,
    isMeteringEnabled: true,
    directory: 'document',
    ios: { extension: file.extension, outputFormat: IOSOutputFormat.MPEG4AAC, audioQuality: AudioQuality.HIGH, sampleRate: 48000 },
    android: { extension: file.extension, outputFormat: file.androidOutputFormat, audioEncoder: 'aac', sampleRate: 48000 },
    web: { mimeType: 'audio/webm', bitsPerSecond: 64000 },
  };
}
