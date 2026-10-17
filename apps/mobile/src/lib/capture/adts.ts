/**
 * ADTS frame headers, read in plain TypeScript (ADR 0027). Pure: no React
 * Native, no file access; the caller passes the bytes.
 *
 * An ADTS stream is a run of AAC frames, each with its own 7-byte header (9
 * with a CRC): a 12-bit sync word, the sample rate index, the channel
 * configuration and the frame's length in bytes, header included
 * (ISO/IEC 14496-3, 1.A.2). Counting whole frames gives the length the file
 * proves by itself, with no index and no decoder, and finds where a frame
 * cut off by a kill begins. This is the evidence the transcription planner
 * checks a decoder's length against (transcribe-run.ts checkedRunDuration),
 * so the tail of a recording is never dropped without anyone knowing.
 *
 * Nothing here changes a recording; it only reads.
 */

/** Samples in one AAC-LC frame (one raw data block). */
export const AAC_FRAME_SAMPLES = 1024;

/**
 * Encoder priming Apple assumes for AAC in MPEG-4 and ADTS when nothing in
 * the file says otherwise (Technical Note TN2258: "the AAC bitstream always
 * contained an encoding delay of 2112 samples"). A decoder may trim it, so a
 * correct decoded length can be this much shorter than the frames counted.
 */
export const AAC_PRIMING_SAMPLES = 2112;

/** ADTS sampling_frequency_index to Hz (index 13 to 15 are reserved). */
export const ADTS_SAMPLE_RATES = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350] as const;

/** The most bytes one ADTS frame can hold, header included: its frame_length field has 13 bits. */
export const ADTS_MAX_FRAME_BYTES = 8191;

export interface AdtsScan {
  /** Whole AAC frames (raw data blocks) in the stream. */
  frames: number;
  sampleRate: number;
  channels: number;
  /** Bytes up to the end of the last whole frame. */
  wholeBytes: number;
  totalBytes: number;
  /**
   * Bytes after the last whole frame: a frame (or header) cut off, by a kill for example. 0 for a finished
   * take. More than one frame can hold is a break inside the file (`breaksInside`).
   */
  tailBytes: number;
}

interface Header {
  sampleRateIndex: number;
  channels: number;
  frameLength: number;
  headerLength: number;
  blocks: number;
}

function headerAt(b: Uint8Array, at: number): Header | null {
  if (at + 7 > b.length) return null;
  if (b[at] !== 0xff || (b[at + 1] & 0xf6) !== 0xf0) return null; // sync word 0xFFF, layer 00
  const headerLength = (b[at + 1] & 0x01) === 1 ? 7 : 9; // protection_absent: no CRC
  const sampleRateIndex = (b[at + 2] >> 2) & 0x0f;
  if (sampleRateIndex >= ADTS_SAMPLE_RATES.length) return null;
  const channels = ((b[at + 2] & 0x01) << 2) | (b[at + 3] >> 6);
  const frameLength = ((b[at + 3] & 0x03) << 11) | (b[at + 4] << 3) | (b[at + 5] >> 5);
  if (frameLength < headerLength) return null;
  const blocks = (b[at + 6] & 0x03) + 1;
  return { sampleRateIndex, channels, frameLength, headerLength, blocks };
}

/**
 * Counts the whole frames of an ADTS stream. Null when the bytes do not
 * start with an ADTS header (an M4A, for example). Counting stops at the
 * first frame that does not fit in the bytes, or whose header is not one of
 * this stream's: what follows is the tail.
 */
export function scanAdts(bytes: Uint8Array): AdtsScan | null {
  const first = headerAt(bytes, 0);
  if (!first) return null;
  let at = 0;
  let frames = 0;
  for (;;) {
    const h = headerAt(bytes, at);
    if (!h || h.sampleRateIndex !== first.sampleRateIndex || h.channels !== first.channels) break;
    if (at + h.frameLength > bytes.length) break; // the last frame was cut off
    frames += h.blocks;
    at += h.frameLength;
  }
  return {
    frames,
    sampleRate: ADTS_SAMPLE_RATES[first.sampleRateIndex],
    channels: first.channels,
    wholeBytes: at,
    totalBytes: bytes.length,
    tailBytes: bytes.length - at,
  };
}

/**
 * True when more bytes follow the last whole frame than one frame can hold
 * (ADTS_MAX_FRAME_BYTES). A kill cuts off at most one frame, so this is a
 * break inside the file (damage, or bytes that are not this stream), not a
 * cut-off tail. The audio after a break cannot be counted, so the file's
 * length cannot be proven, and a copy of the whole frames before it would
 * leave out what follows (ADR 0027).
 */
export function breaksInside(scan: AdtsScan): boolean {
  return scan.tailBytes > ADTS_MAX_FRAME_BYTES;
}

/**
 * What the counted frames prove about the length, for the planner:
 * `countedMs`, every whole frame; `minDecodedMs`, the shortest length a
 * correct decoder may report (the counted length less Apple's assumed
 * priming and one frame of tolerance).
 */
export function adtsLengthEvidence(scan: AdtsScan): { countedMs: number; minDecodedMs: number } {
  const counted = scan.frames * AAC_FRAME_SAMPLES;
  const ms = (samples: number) => (Math.max(0, samples) / scan.sampleRate) * 1000;
  return { countedMs: ms(counted), minDecodedMs: ms(counted - AAC_PRIMING_SAMPLES - AAC_FRAME_SAMPLES) };
}
