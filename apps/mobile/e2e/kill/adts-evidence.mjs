// ADTS takes judged from their own frames, on the host (ADR 0027, check V2), and the V1 evidence printed for each
// kept one. A take named `.aac` is judged by counting its whole frames with the app's own frame scanner, `scanAdts`
// in apps/mobile/src/lib/capture/adts.ts, imported as it is: Node 22 runs TypeScript that uses only erasable syntax
// (type stripping, on by default since 22.18), so there is one frame parser, not a second copy here. `afinfo` still
// has to open the file, but its "estimated duration" is not the length: Core Audio opens a cut-off ADTS stream and
// estimates its duration from the bytes and the bit rate, whatever its frames are.
//
// Pure: the caller passes the bytes, except adtsFactsOfFile, which reads one file. Nothing here writes, and nothing
// it returns holds audio beyond the first 16 bytes (a 7-byte frame header and the start of the encoder's first
// frame), which check V1 asks to see.
import { readFileSync, statSync } from 'node:fs';
import { AAC_FRAME_SAMPLES, AAC_MAX_BLOCK_BYTES_PER_CHANNEL, ADTS_MAX_FRAME_BYTES, ADTS_SAMPLE_RATES, scanAdts } from '../../src/lib/capture/adts.ts';

/** The container a take's file name says: `.aac` is ADTS (capture/recording-file.ts `containerOfRecording`). */
export function containerOfName(name) {
  const m = /\.([a-z0-9]+)$/i.exec(String(name ?? ''));
  if (!m) return 'unknown';
  const ext = m[1].toLowerCase();
  return ext === 'aac' ? 'adts' : ext;
}

/** The most bytes one of our mono frames may hold by the AAC limit (ADR 0027): a 7-byte header and 768 bytes. */
export const MONO_FRAME_LIMIT = 7 + AAC_MAX_BLOCK_BYTES_PER_CHANNEL;

const AUDIO_OBJECT = { 1: 'AAC Main', 2: 'AAC-LC', 3: 'AAC SSR', 4: 'AAC LTP' };

/** The 16 bytes as `xxd -l 16` prints them: offset, eight groups of two bytes, then the printable characters. */
export function xxd16(bytes) {
  const b = bytes.subarray(0, 16);
  const groups = [];
  for (let i = 0; i < 16; i += 2) {
    groups.push(i < b.length ? b[i].toString(16).padStart(2, '0') + (i + 1 < b.length ? b[i + 1].toString(16).padStart(2, '0') : '  ') : '    ');
  }
  const text = Array.from(b, (x) => (x >= 0x20 && x < 0x7f ? String.fromCharCode(x) : '.')).join('');
  return `00000000: ${groups.join(' ')}  ${text}`;
}

/** The fields of the first frame header that check V1 names, read from the bytes. Null when it is not an ADTS header. */
export function firstHeader(b) {
  if (b.length < 7 || b[0] !== 0xff || (b[1] & 0xf0) !== 0xf0) return null;
  const objectType = ((b[2] >> 6) & 0x03) + 1; // ADTS profile is the MPEG-4 audio object type less one
  const frequencyIndex = (b[2] >> 2) & 0x0f;
  return {
    mpeg: (b[1] & 0x08) === 0 ? 4 : 2,
    layer: (b[1] >> 1) & 0x03,
    crc: (b[1] & 0x01) === 0,
    objectType,
    profile: AUDIO_OBJECT[objectType] ?? `object type ${objectType}`,
    frequencyIndex,
    sampleRate: ADTS_SAMPLE_RATES[frequencyIndex] ?? null,
    channelConfiguration: ((b[2] & 0x01) << 2) | (b[3] >> 6),
  };
}

/**
 * The byte length of every whole frame, walked along the chain scanAdts already proved (from byte 0 to its
 * `wholeBytes`), reading only each header's 13-bit frame_length and its profile bits. Null if the walk does not land
 * exactly on `wholeBytes`, which would mean this walk and scanAdts disagree.
 */
export function wholeFrameLengths(b, wholeBytes) {
  const lengths = [];
  let notLc = 0;
  let at = 0;
  while (at < wholeBytes) {
    if (at + 7 > wholeBytes) return null;
    const len = ((b[at + 3] & 0x03) << 11) | (b[at + 4] << 3) | (b[at + 5] >> 5);
    if (len < 7) return null;
    if (((b[at + 2] >> 6) & 0x03) !== 1) notLc += 1;
    lengths.push(len);
    at += len;
  }
  return at === wholeBytes ? { lengths, notLc } : null;
}

/**
 * @typedef {{ mpeg: number, layer: number, crc: boolean, objectType: number, profile: string, frequencyIndex: number,
 *   sampleRate: number|null, channelConfiguration: number }} AdtsHeader
 * @typedef {{ count: number, min: number|null, mean: number|null, max: number|null, overLimit: number, notLc: number }} FrameBytes
 * @typedef {{ adts: boolean, first16: string, ftypAt4: boolean, totalBytes: number, header?: AdtsHeader|null,
 *   frames?: number, sampleRate?: number, channels?: number, wholeBytes?: number, tailBytes?: number,
 *   tail?: 'none'|'cut'|'break', framesAfterBreak?: number, breakInside?: boolean, durationMs?: number,
 *   kbps?: number|null, frameBytes?: FrameBytes|null }} AdtsFacts
 */

/**
 * What a take's bytes say about it, for DL-01 (length from whole frames, the tail as the kill left it) and for the
 * V1 evidence (header fields, no `ftyp` at offset 4, frame size distribution). `adts` false when the bytes are not an
 * ADTS stream, for example an M4A under an `.aac` name; then only the first 16 bytes and the `ftyp` check are set.
 * @param {Uint8Array|ArrayBuffer} bytes
 * @returns {AdtsFacts}
 */
export function adtsFacts(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const ftypAt4 = b.length >= 8 && b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70;
  const base = { first16: xxd16(b), ftypAt4, totalBytes: b.length };
  const scan = scanAdts(b);
  if (!scan) return { adts: false, ...base };
  const walk = wholeFrameLengths(b, scan.wholeBytes);
  const lengths = walk?.lengths ?? [];
  const durationMs = (scan.frames * AAC_FRAME_SAMPLES * 1000) / scan.sampleRate;
  return {
    adts: true,
    ...base,
    header: firstHeader(b),
    frames: scan.frames,
    sampleRate: scan.sampleRate,
    channels: scan.channels,
    wholeBytes: scan.wholeBytes,
    tailBytes: scan.tailBytes,
    tail: scan.tail,
    framesAfterBreak: scan.framesAfterBreak,
    breakInside: scan.tailBytes > ADTS_MAX_FRAME_BYTES,
    durationMs,
    kbps: durationMs > 0 ? Math.round((scan.wholeBytes * 8) / durationMs) : null,
    frameBytes: walk
      ? {
          count: lengths.length,
          min: lengths.length ? Math.min(...lengths) : null,
          mean: lengths.length ? Math.round((scan.wholeBytes / lengths.length) * 10) / 10 : null,
          max: lengths.length ? Math.max(...lengths) : null,
          overLimit: lengths.filter((n) => n > MONO_FRAME_LIMIT).length,
          notLc: walk.notLc,
        }
      : null,
  };
}

const factsCache = new Map();
/**
 * adtsFacts of one file, cached by path, size and time: every relaunch judges every earlier kept take again.
 * @param {string} path
 * @returns {AdtsFacts}
 */
export function adtsFactsOfFile(path) {
  const st = statSync(path);
  const key = `${path}|${st.size}|${st.mtimeMs}`;
  if (!factsCache.has(key)) factsCache.set(key, adtsFacts(readFileSync(path)));
  return factsCache.get(key);
}

/**
 * What check V1 asks of every take, from its facts, as findings (an empty list is a pass): an ADTS stream starting
 * `FF F1`, AAC-LC, frequency index 3 (48 kHz), channel configuration 1, no `ftyp` at offset 4, no frame over the AAC
 * limit, and a tail that is not a break. A killed take ends `cut` or `none`; a finished one must end `none` (V1).
 */
export function v1Findings(f) {
  const out = [];
  if (f.ftypAt4) out.push('an ftyp box at offset 4 (an MPEG-4 file, not ADTS)');
  if (!f.adts) return [...out, 'no ADTS stream'];
  const h = f.header;
  if (!h || h.mpeg !== 4 || h.layer !== 0 || h.crc) out.push('the first header is not FF F1 (MPEG-4, layer 0, no CRC)');
  if (h && h.objectType !== 2) out.push(`profile ${h.profile}, not AAC-LC`);
  if (h && h.frequencyIndex !== 3) out.push(`frequency index ${h.frequencyIndex}, not 3 (48 kHz)`);
  if (h && h.channelConfiguration !== 1) out.push(`channel configuration ${h.channelConfiguration}, not 1`);
  if (!f.frameBytes) out.push('the frame walk does not land on the end of the whole frames');
  else {
    if (f.frameBytes.overLimit) out.push(`${f.frameBytes.overLimit} frame(s) over ${MONO_FRAME_LIMIT} bytes`);
    if (f.frameBytes.notLc) out.push(`${f.frameBytes.notLc} frame header(s) not AAC-LC`);
  }
  if (f.frames === 0) out.push('no whole frame');
  if (f.tail === 'break') out.push(`the tail is a break (${f.tailBytes} bytes after the last whole frame${f.framesAfterBreak ? `, ${f.framesAfterBreak} frames after it` : ''})`);
  return out;
}

/**
 * afinfo's output with nothing that names the take: its File line, and any other mention of the path or the file
 * name (a recorder id), become `label`.
 */
export function redactAfinfo(text, path, label) {
  const name = String(path).slice(String(path).lastIndexOf('/') + 1);
  return String(text ?? '')
    .split('\n')
    .map((line) => (/^\s*File:/.test(line) ? `File:           ${label}` : line.split(path).join(label).split(name).join(label)))
    .join('\n')
    .trimEnd();
}

/** The afinfo fields check V1 names (file type, data format, bit rate), when afinfo printed them. */
export function afinfoFields(text) {
  const t = String(text ?? '');
  const pick = (re) => re.exec(t)?.[1]?.trim() ?? null;
  return {
    fileType: pick(/File type ID:\s*(\S+)/),
    dataFormat: pick(/Data format:\s*([^\n]+)/),
    bitRate: pick(/bit rate:\s*([^\n]+)/),
    estimatedDurationS: (() => {
      const v = pick(/estimated duration:\s*([\d.]+)\s*sec/);
      return v === null ? null : Number(v);
    })(),
  };
}
