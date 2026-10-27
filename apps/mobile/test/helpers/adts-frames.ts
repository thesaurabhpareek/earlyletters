/**
 * ADTS frames built in a test (ADR 0027), shared by the frame scanner's tests (adts-tail.test.ts) and the kill
 * harness's (qa-kill-harness.test.ts), so both read the same framing. No real audio: headers are built byte for byte,
 * payloads are filler unless a test fills them.
 */
/** One ADTS frame: a 7-byte header (9 with CRC) for AAC-LC, then `payload` bytes. */
export function adtsFrame(payload: number, o: { sampleRateIndex?: number; channels?: number; crc?: boolean; blocks?: number } = {}): Uint8Array {
  const { sampleRateIndex = 3, channels = 1, crc = false, blocks = 1 } = o;
  const header = crc ? 9 : 7;
  const len = header + payload;
  const b = new Uint8Array(len);
  b[0] = 0xff;
  b[1] = 0xf0 | (crc ? 0 : 1); // MPEG-4, layer 00, protection_absent
  b[2] = (1 << 6) | (sampleRateIndex << 2) | ((channels >> 2) & 1); // profile 1 = AAC-LC
  b[3] = ((channels & 3) << 6) | ((len >> 11) & 3);
  b[4] = (len >> 3) & 0xff;
  b[5] = ((len & 7) << 5) | 0x1f;
  b[6] = 0xfc | ((blocks - 1) & 3);
  for (let i = header; i < len; i++) b[i] = (i * 7 + payload) & 0xff;
  return b;
}
export const concat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};

/**
 * The framing of a real encoder's ADTS: every frame length, in order, of ffmpeg 6.1's native AAC encoder
 * (6 s of a 330 Hz tone with pink noise, 48 kHz, mono, 64 kbit/s; 283 frames, 50,565 bytes). Its headers are
 * `FF F1 4C 40 .. .. FC` with the length bits set, which adtsFrame builds byte for byte; the payload is filler,
 * since the scanner reads only headers. No audio is committed (.gitignore: never commit recordings).
 */
export const REAL_FRAME_LENGTHS = [
  191, 216, 167, 162, 178, 184, 174, 171, 172, 184, 186, 187, 171, 178, 174, 172, 189, 170, 162, 184, 185, 176, 189, 188, 186, 184, 173, 175,
  179, 202, 175, 165, 170, 187, 165, 171, 167, 172, 188, 178, 182, 171, 172, 190, 183, 198, 186, 184, 170, 184, 171, 172, 167, 178, 195, 179,
  174, 180, 180, 167, 171, 191, 198, 180, 174, 182, 181, 183, 172, 172, 184, 155, 193, 200, 174, 185, 189, 196, 163, 185, 162, 174, 176, 183,
  177, 178, 172, 176, 185, 197, 182, 173, 174, 173, 178, 181, 171, 165, 178, 172, 192, 181, 179, 176, 188, 170, 168, 189, 166, 171, 190, 176,
  190, 167, 163, 188, 188, 186, 172, 185, 188, 172, 174, 205, 192, 185, 164, 186, 171, 166, 171, 175, 187, 173, 173, 163, 203, 164, 163, 178,
  171, 201, 188, 173, 176, 186, 197, 183, 167, 167, 170, 171, 173, 192, 188, 188, 184, 177, 167, 171, 176, 173, 177, 172, 173, 175, 169, 184,
  177, 183, 197, 186, 183, 189, 167, 172, 176, 169, 180, 173, 202, 192, 179, 180, 168, 182, 175, 175, 174, 199, 166, 167, 177, 169, 191, 171,
  179, 175, 180, 183, 184, 181, 177, 178, 191, 182, 166, 170, 173, 176, 178, 181, 189, 183, 175, 178, 174, 176, 170, 179, 187, 176, 176, 177,
  192, 175, 174, 170, 183, 176, 169, 178, 181, 195, 178, 175, 182, 167, 171, 179, 178, 186, 179, 183, 169, 166, 178, 185, 180, 190, 175, 182,
  177, 173, 178, 177, 180, 178, 185, 170, 189, 170, 169, 180, 186, 176, 172, 183, 178, 176, 181, 176, 183, 177, 174, 172, 174, 183, 180, 179,
  179, 174, 215,
];
