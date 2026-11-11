/**
 * The stored copy has no metadata (NS-01-R6, NX-39-R8): location, date, device, thumbnail, Exif, XMP and IPTC are all
 * gone. Pure bytes in, bytes out, so it is tested in Node. It removes; it never adds.
 *
 * JPEG: keeps the image data, the JFIF header (without its thumbnail), the ICC colour profile and Adobe's colour
 * flag, and drops every other APPn segment (Exif and XMP in APP1, Photoshop and IPTC in APP13, maker notes, MPF in
 * APP2 that is not a colour profile) and every comment. It stops at the first unescaped end-of-image marker and
 * drops everything after it (a motion-photo video, a trailer, a planted payload), PRD finding F1.
 *
 * Orientation: the tag lives in Exif, which is dropped, so a picture whose tag is not 1 would show sideways. The result
 * reports the tag it read (`orientation`) and does NOT reject the picture; turning the pixels is a native re-encode
 * (see `OrientationBaker` in types.ts) and `commitPhoto` runs it before it accepts the bytes. Other formats (HEIC,
 * PNG) are `not_jpeg`: the re-encode step must hand back a JPEG.
 */
export type StripResult =
  | { ok: true; bytes: Uint8Array; orientation: number }
  | { ok: false; reason: 'not_jpeg' | 'corrupt' };

const ascii = (b: Uint8Array, at: number, s: string): boolean => {
  if (at + s.length > b.length) return false;
  for (let i = 0; i < s.length; i++) if (b[at + i] !== s.charCodeAt(i)) return false;
  return true;
};

/** Orientation (1 to 8) from an Exif APP1 payload that starts at "Exif\0\0"; 1 when absent or unreadable. */
function exifOrientation(b: Uint8Array, start: number, end: number): number {
  const t = start + 6; // TIFF header
  if (t + 8 > end) return 1;
  const little = b[t] === 0x49 && b[t + 1] === 0x49;
  if (!little && !(b[t] === 0x4d && b[t + 1] === 0x4d)) return 1;
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const u16 = (o: number) => dv.getUint16(o, little);
  const u32 = (o: number) => dv.getUint32(o, little);
  const ifd = t + u32(t + 4);
  if (ifd + 2 > end) return 1;
  const n = u16(ifd);
  for (let i = 0; i < n; i++) {
    const e = ifd + 2 + i * 12;
    if (e + 12 > end) return 1;
    if (u16(e) === 0x0112) {
      const v = u16(e + 8);
      return v >= 1 && v <= 8 ? v : 1;
    }
  }
  return 1;
}

export function stripJpeg(input: Uint8Array): StripResult {
  const b = input;
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return { ok: false, reason: 'not_jpeg' };
  const out: Uint8Array[] = [Uint8Array.of(0xff, 0xd8)];
  let orientation = 1;
  let i = 2;
  let ended = false;
  while (i < b.length) {
    if (b[i] !== 0xff) return { ok: false, reason: 'corrupt' };
    while (b[i] === 0xff && i < b.length) i++; // fill bytes
    const marker = b[i];
    i++;
    if (marker === 0xd9) {
      out.push(Uint8Array.of(0xff, 0xd9));
      ended = true; // whatever follows the end marker is not the picture and is not copied
      break;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      out.push(Uint8Array.of(0xff, marker));
      continue;
    }
    if (i + 2 > b.length) return { ok: false, reason: 'corrupt' };
    const len = (b[i] << 8) | b[i + 1];
    const segEnd = i + len;
    if (len < 2 || segEnd > b.length) return { ok: false, reason: 'corrupt' };
    const body = i + 2;
    if (marker === 0xda) {
      // Start of scan: the header, then the entropy-coded data up to the next real marker. A `FF 00` pair is an
      // escaped data byte and `FF D0` to `FF D7` are restart markers; any other `FF xx` ends the data. A progressive
      // picture has several scans, so the segment loop carries on from that marker (and stops at FF D9).
      let j = segEnd;
      while (j + 1 < b.length) {
        if (b[j] === 0xff && b[j + 1] !== 0x00 && !(b[j + 1] >= 0xd0 && b[j + 1] <= 0xd7) && b[j + 1] !== 0xff) break;
        j += b[j] === 0xff && b[j + 1] === 0x00 ? 2 : 1;
      }
      if (j + 1 >= b.length) return { ok: false, reason: 'corrupt' }; // no end marker: cut short
      out.push(Uint8Array.of(0xff, marker), b.subarray(i, j));
      i = j;
      continue;
    }
    let keep = true;
    if (marker === 0xe1 && ascii(b, body, 'Exif\0\0')) orientation = exifOrientation(b, body, segEnd);
    if (marker === 0xfe) keep = false; // comment
    else if (marker >= 0xe1 && marker <= 0xef) {
      keep = (marker === 0xe2 && ascii(b, body, 'ICC_PROFILE\0')) || (marker === 0xee && ascii(b, body, 'Adobe'));
    }
    if (marker === 0xe0) {
      const seg = b.slice(i, segEnd);
      // JFIF: bytes 0..1 length, 2..6 "JFIF\0", 7..8 version, 9 units, 10..13 density, 14..15 thumbnail size.
      if (ascii(b, body, 'JFIF\0') && seg.length > 16) {
        const head = seg.slice(0, 16); // a copy
        head[0] = 0;
        head[1] = 16;
        head[14] = 0;
        head[15] = 0;
        out.push(Uint8Array.of(0xff, marker), head);
        i = segEnd;
        continue;
      }
      if (!ascii(b, body, 'JFIF\0')) keep = false; // JFXX extension and other APP0 payloads carry thumbnails
    }
    if (keep) out.push(Uint8Array.of(0xff, marker), b.subarray(i, segEnd));
    i = segEnd;
  }
  if (!ended) return { ok: false, reason: 'corrupt' };
  const total = out.reduce((n, c) => n + c.length, 0);
  const bytes = new Uint8Array(total);
  let at = 0;
  for (const c of out) {
    bytes.set(c, at);
    at += c.length;
  }
  return { ok: true, bytes, orientation };
}

/**
 * Independent check used by the tests (and any guard): true when the bytes carry an Exif, XMP or IPTC segment, by
 * walking the segments and again by searching the whole file for the signatures.
 */
export function carriesMetadata(b: Uint8Array): boolean {
  const sigs = ['Exif\0\0', 'http://ns.adobe.com/xap', 'Photoshop 3.0', '8BIM', 'MPF\0'];
  for (let at = 0; at < b.length; at++) for (const s of sigs) if (b[at] === s.charCodeAt(0) && ascii(b, at, s)) return true;
  let i = 2;
  while (i + 4 <= b.length && b[0] === 0xff && b[1] === 0xd8) {
    if (b[i] !== 0xff) break;
    const m = b[i + 1];
    if (m === 0xda || m === 0xd9) break;
    const len = (b[i + 2] << 8) | b[i + 3];
    if (m === 0xe1 || m === 0xed || m === 0xfe) return true;
    i += 2 + len;
  }
  return false;
}
