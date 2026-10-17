/**
 * Writes textures/grain.png from tokens.atmosphere.grain: the film grain the light-scheme lamp
 * draws over its pool so an 8-bit display shows no rings in the soft tail. Deterministic (seeded),
 * so the file only changes when the token does; test/grain.test.ts checks the file against this.
 *
 *   npm run build:grain -w @scribe/design-tokens
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
import { tokens } from './tokens';

/** Grey and alpha for every pixel, row by row: [grey, alpha, grey, alpha, ...]. */
export function grainPixels(g: { tile: number; blackMax: number; whiteMax: number; seed: number } = tokens.atmosphere.grain): Uint8Array {
  let s = g.seed >>> 0;
  // mulberry32: small, fast, and the same on every machine.
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = new Uint8Array(g.tile * g.tile * 2);
  for (let i = 0; i < g.tile * g.tile; i++) {
    const white = next() < 0.5;
    const max = white ? g.whiteMax : g.blackMax;
    out[i * 2] = white ? 255 : 0;
    out[i * 2 + 1] = Math.floor(next() * (max + 1));
  }
  return out;
}

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (b: Uint8Array) => {
  let c = 0xffffffff;
  for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type: string, data: Uint8Array): Buffer {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), Buffer.from(data)]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** A grey-and-alpha PNG (colour type 4, 8 bits), no filtering, best compression. */
export function grainPng(g = tokens.atmosphere.grain): Buffer {
  const px = grainPixels(g);
  const rows = Buffer.alloc(g.tile * (1 + g.tile * 2));
  for (let y = 0; y < g.tile; y++) {
    rows[y * (1 + g.tile * 2)] = 0;
    Buffer.from(px.buffer, y * g.tile * 2, g.tile * 2).copy(rows, y * (1 + g.tile * 2) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(g.tile, 0);
  ihdr.writeUInt32BE(g.tile, 4);
  ihdr[8] = 8;
  ihdr[9] = 4;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', new Uint8Array()),
  ]);
}

/**
 * One file with no scale suffix: the lamp draws it at `tile / scale` points through an SVG pattern, so every screen
 * gets the same grain, and Metro and the web export both resolve it (an @3x-only asset is not found on the web).
 */
export const GRAIN_FILE = join(dirname(fileURLToPath(import.meta.url)), '..', 'textures', 'grain.png');

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(GRAIN_FILE, grainPng());
  console.log(`wrote ${GRAIN_FILE}`);
}
