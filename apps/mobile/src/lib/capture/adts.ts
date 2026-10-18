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

/**
 * The most bytes one raw data block may carry per channel: 6144 bits, the
 * decoder input buffer every AAC bitstream must fit (ISO/IEC 14496-3,
 * 4.5.3.1; ISO/IEC 13818-7, 8.2.2). For our mono recordings that caps a
 * frame at 7 + 768 bytes, about 4.5 times the 64 kbit/s average.
 */
export const AAC_MAX_BLOCK_BYTES_PER_CHANNEL = 768;

/** A run of this many of the stream's whole frames, back to back to the end of the file, is audio after a break. */
export const MIN_FRAMES_AFTER_BREAK = 2;

/**
 * How an ADTS stream ends after its last whole frame:
 * - `none`: on a whole frame (a finished take);
 * - `cut`: exactly as a kill leaves it, a header cut short (under 7 bytes,
 *   every byte this stream's own), or this stream's own header with a
 *   possible frame length that runs past the end of the file, and none of
 *   the stream's frames after it;
 * - `break`: anything else (damage, a trailer, bytes that are not this
 *   stream).
 */
export type AdtsTail = 'none' | 'cut' | 'break';

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
  /** What those bytes are (`AdtsTail`). Only a `cut` tail is read from a copy of the whole frames. */
  tail: AdtsTail;
  /**
   * Whole frames (raw data blocks) of this stream found after a break, back to back to the end of the file
   * (`framesChainedToEnd`). They are audio the file holds past the damage, so they count toward the length the
   * file proves (`adtsLengthEvidence`): a decoder that stops at the damage reads short and is refused. 0 when
   * the tail is `none` or `cut`.
   */
  framesAfterBreak: number;
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

/** Channels for an ADTS channel configuration: 1 to 6 as written, 7 is 7.1 (8); 0 (set elsewhere) is unknown. */
function channelCount(configuration: number): number {
  return configuration === 7 ? 8 : configuration;
}

/**
 * True when a header's frame_length is possible for this stream: at most the
 * header plus 6144 bits per channel for each raw data block (and the 4 bytes
 * of block positions and CRC a protected multi-block frame adds per block).
 * A length past that is damage, never a frame an encoder wrote.
 */
function plausibleLength(h: Header): boolean {
  const n = channelCount(h.channels);
  if (n === 0) return true;
  return h.frameLength <= h.headerLength + h.blocks * (n * AAC_MAX_BLOCK_BYTES_PER_CHANNEL + 4);
}

/** This stream's own header at `at` (same sampling frequency index and channel configuration), or null. */
function ownHeaderAt(b: Uint8Array, at: number, first: Header): Header | null {
  const h = headerAt(b, at);
  return h && h.sampleRateIndex === first.sampleRateIndex && h.channels === first.channels ? h : null;
}

/**
 * True when the bytes from `at` to the end are exactly what a kill leaves:
 * a header cut short whose bytes are all this stream's (sync word and layer,
 * then the sampling frequency index and channel configuration as far as they
 * go), or this stream's own whole header with a possible frame length
 * (`plausibleLength`) that runs past the end. A kill only cuts the file
 * short; it never changes earlier bytes.
 */
function isKillCut(b: Uint8Array, at: number, first: Header): boolean {
  const rest = b.length - at;
  if (rest <= 0) return false;
  if (rest < 7) {
    if (b[at] !== 0xff) return false;
    if (rest > 1 && (b[at + 1] & 0xf6) !== 0xf0) return false;
    if (rest > 2 && (((b[at + 2] >> 2) & 0x0f) !== first.sampleRateIndex || (b[at + 2] & 0x01) !== first.channels >> 2)) return false;
    if (rest > 3 && b[at + 3] >> 6 !== (first.channels & 0x03)) return false;
    return true;
  }
  const h = ownHeaderAt(b, at, first);
  return !!h && plausibleLength(h) && h.frameLength > rest;
}

/**
 * Whole frames (raw data blocks) of this stream in a run that starts at `p`
 * and goes back to back to the end of the file, ending exactly there or in a
 * kill cut, when the run has at least MIN_FRAMES_AFTER_BREAK frames; else 0.
 */
function chainFrom(b: Uint8Array, p: number, first: Header): number {
  let at = p;
  let whole = 0;
  let blocks = 0;
  while (at < b.length) {
    const h = ownHeaderAt(b, at, first);
    if (!h || !plausibleLength(h) || at + h.frameLength > b.length) {
      if (!isKillCut(b, at, first)) return 0;
      break;
    }
    whole += 1;
    blocks += h.blocks;
    at += h.frameLength;
  }
  return whole >= MIN_FRAMES_AFTER_BREAK ? blocks : 0;
}

/**
 * This stream's frames after a break: the first run, starting anywhere from
 * `from` on, of at least MIN_FRAMES_AFTER_BREAK whole frames back to back to
 * the end of the file (ending exactly there, or in a kill cut). A kill leaves
 * nothing of the stream after its cut, and a trailer or zeroed blocks hold no
 * such run, so a run found is audio past damage.
 */
function framesChainedToEnd(b: Uint8Array, from: number, first: Header): number {
  for (let p = from; p + 7 <= b.length; p++) {
    if (b[p] !== 0xff) continue;
    const blocks = chainFrom(b, p, first);
    if (blocks > 0) return blocks;
  }
  return 0;
}

/**
 * Counts the whole frames of an ADTS stream. Null when the bytes do not
 * start with an ADTS header (an M4A, for example). Counting stops at the
 * first frame that does not fit in the bytes, or whose header is not one of
 * this stream's: what follows is the tail. Within the outer bound, the tail is
 * searched for this stream's frames running to the end of the file
 * (`framesChainedToEnd`): found, the tail is a break with that audio after
 * it; not found, it is a `cut` when `isKillCut`, else a break.
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
  const tailBytes = bytes.length - at;
  let tail: AdtsTail = 'none';
  let framesAfterBreak = 0;
  if (tailBytes > 0) {
    framesAfterBreak = tailBytes <= ADTS_MAX_FRAME_BYTES ? framesChainedToEnd(bytes, at + 1, first) : 0;
    tail = framesAfterBreak === 0 && isKillCut(bytes, at, first) ? 'cut' : 'break';
  }
  return {
    frames,
    sampleRate: ADTS_SAMPLE_RATES[first.sampleRateIndex],
    channels: first.channels,
    wholeBytes: at,
    totalBytes: bytes.length,
    tailBytes,
    tail,
    framesAfterBreak,
  };
}

/**
 * True when more bytes follow the last whole frame than one frame can hold
 * (ADTS_MAX_FRAME_BYTES): the outer bound, refused before anything is read.
 * A kill cuts off at most one frame, so this is a break inside the file
 * (damage, or bytes that are not this stream), not a cut-off tail. The audio
 * after a break cannot be counted, so the file's length cannot be proven, and
 * a copy of the whole frames before it would leave out what follows
 * (ADR 0027). A smaller tail that is not a kill cut (`tail: 'break'`) is
 * refused only if the decoder cannot read the file itself.
 */
export function breaksInside(scan: AdtsScan): boolean {
  return scan.tailBytes > ADTS_MAX_FRAME_BYTES;
}

/**
 * What the counted frames prove about the length, for the planner:
 * `countedMs`, every whole frame, those found after a break included;
 * `minDecodedMs`, the shortest length a correct decoder may report (the
 * counted length less Apple's assumed priming and one frame of tolerance).
 */
export function adtsLengthEvidence(scan: AdtsScan): { countedMs: number; minDecodedMs: number } {
  const counted = (scan.frames + scan.framesAfterBreak) * AAC_FRAME_SAMPLES;
  const ms = (samples: number) => (Math.max(0, samples) / scan.sampleRate) * 1000;
  return { countedMs: ms(counted), minDecodedMs: ms(counted - AAC_PRIMING_SAMPLES - AAC_FRAME_SAMPLES) };
}
