/**
 * The containers a recording can be stored in (ADR 0027), with their file
 * name extension and media type. Pure (no React Native, no expo-audio), so
 * Export, backup and capture can all read it, in the app and in Node.
 *
 * - 'm4a': AAC-LC in MPEG-4, `audio/mp4`. Every take before ADR 0027.
 * - 'adts': the same AAC-LC frames as an ADTS stream, `audio/aac`.
 */
import { fileNameOf } from './sweep.logic';

export type RecordingContainer = 'm4a' | 'adts';

export const RECORDING_FILES = {
  m4a: { extension: '.m4a', mimeType: 'audio/mp4', androidOutputFormat: 'mpeg4' },
  adts: { extension: '.aac', mimeType: 'audio/aac', androidOutputFormat: 'aac_adts' },
} as const satisfies Record<RecordingContainer, { extension: string; mimeType: string; androidOutputFormat: string }>;

export type RecordingMimeType = (typeof RECORDING_FILES)[RecordingContainer]['mimeType'];

/**
 * The container of a stored recording, from its file name: a name ending in
 * `.aac` is ADTS. Anything else is M4A, as every take before ADR 0027 was, so
 * old letters keep exactly the name and label they always had.
 */
export function containerOfRecording(uri: string | null | undefined): RecordingContainer {
  return uri && /\.aac$/i.test(fileNameOf(uri)) ? 'adts' : 'm4a';
}
