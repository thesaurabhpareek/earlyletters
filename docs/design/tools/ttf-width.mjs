// The smallest TrueType reader that gives advance widths, plain node (22+), no install.
// Shared by measure-listen-prompts.mjs and measure-ax5-strings.mjs.
// Limits: no kerning, no GPOS shaping, no fallback faces. A line can differ by a point or two from a render.
import { readFileSync } from 'node:fs';

export function loadFont(path) {
  const b = readFileSync(path);
  const tables = {};
  const n = b.readUInt16BE(4);
  for (let i = 0; i < n; i++) {
    const o = 12 + i * 16;
    tables[b.toString('latin1', o, o + 4)] = b.readUInt32BE(o + 8);
  }
  const unitsPerEm = b.readUInt16BE(tables.head + 18);
  const numH = b.readUInt16BE(tables.hhea + 34);
  const hmtx = tables.hmtx;
  const advance = (gid) => b.readUInt16BE(hmtx + 4 * Math.min(gid, numH - 1));
  // cmap: format 4 (BMP) or 12
  const cm = tables.cmap;
  const subs = b.readUInt16BE(cm + 2);
  let pick = null;
  for (let i = 0; i < subs; i++) {
    const p = b.readUInt16BE(cm + 4 + i * 8);
    const e = b.readUInt16BE(cm + 6 + i * 8);
    const off = cm + b.readUInt32BE(cm + 8 + i * 8);
    const fmt = b.readUInt16BE(off);
    if ((p === 3 && e === 10 && fmt === 12) || (!pick && p === 3 && e === 1 && fmt === 4)) pick = { off, fmt };
  }
  const glyph = (cp) => {
    const { off, fmt } = pick;
    if (fmt === 12) {
      const g = b.readUInt32BE(off + 12);
      for (let i = 0; i < g; i++) {
        const s = off + 16 + i * 12;
        const a = b.readUInt32BE(s), z = b.readUInt32BE(s + 4);
        if (cp >= a && cp <= z) return b.readUInt32BE(s + 8) + (cp - a);
      }
      return 0;
    }
    const segX2 = b.readUInt16BE(off + 6);
    const endO = off + 14, startO = endO + segX2 + 2, deltaO = startO + segX2, rangeO = deltaO + segX2;
    for (let s = 0; s < segX2; s += 2) {
      if (cp <= b.readUInt16BE(endO + s)) {
        const a = b.readUInt16BE(startO + s);
        if (cp < a) return 0;
        const ro = b.readUInt16BE(rangeO + s);
        if (ro === 0) return (cp + b.readUInt16BE(deltaO + s)) & 0xffff;
        const gid = b.readUInt16BE(rangeO + s + ro + 2 * (cp - a));
        return gid === 0 ? 0 : (gid + b.readUInt16BE(deltaO + s)) & 0xffff;
      }
    }
    return 0;
  };
  const width = (text, size) => {
    let u = 0;
    for (const ch of text) u += advance(glyph(ch.codePointAt(0)));
    return (u * size) / unitsPerEm;
  };
  return { width };
}
