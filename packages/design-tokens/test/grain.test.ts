import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { GRAIN_FILE, grainPixels, grainPng } from '../src/build-grain';
import { tokens } from '../src/tokens';

const g = tokens.atmosphere.grain;

/** The pixels of a grey-and-alpha PNG with unfiltered rows (what build-grain writes). */
function decode(png: Buffer) {
  expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  let at = 8;
  let ihdr: Buffer | null = null;
  const idat: Buffer[] = [];
  while (at < png.length) {
    const len = png.readUInt32BE(at);
    const type = png.subarray(at + 4, at + 8).toString('ascii');
    const data = png.subarray(at + 8, at + 8 + len);
    if (type === 'IHDR') ihdr = data;
    if (type === 'IDAT') idat.push(data);
    at += 12 + len;
  }
  const width = ihdr!.readUInt32BE(0);
  const height = ihdr!.readUInt32BE(4);
  const raw = inflateSync(Buffer.concat(idat));
  const px: number[] = [];
  for (let y = 0; y < height; y++) {
    const row = y * (1 + width * 2);
    expect(raw[row]).toBe(0);
    px.push(...raw.subarray(row + 1, row + 1 + width * 2));
  }
  return { width, height, depth: ihdr![8], colour: ihdr![9], px };
}

describe('the lamp grain texture (tokens.atmosphere.grain)', () => {
  const file = readFileSync(GRAIN_FILE);

  it('is the file build-grain writes from the token, byte for byte (run npm run build:grain after changing it)', () => {
    expect(GRAIN_FILE).toMatch(/textures\/grain\.png$/);
    expect(file.equals(grainPng())).toBe(true);
  });

  it('is a small square grey-and-alpha tile: 128 pixels drawn at 3 per point, under 16 KB', () => {
    const d = decode(file);
    expect([d.width, d.height, d.depth, d.colour]).toEqual([g.tile, g.tile, 8, 4]);
    expect(g.scale).toBe(3);
    expect(file.length).toBeLessThan(16 * 1024);
  });

  it('is signed and faint: black or white specks, about half each, never above their max alpha', () => {
    const px = grainPixels();
    let white = 0;
    for (let i = 0; i < px.length; i += 2) {
      expect([0, 255]).toContain(px[i]);
      if (px[i] === 255) {
        white++;
        expect(px[i + 1]).toBeLessThanOrEqual(g.whiteMax);
      } else expect(px[i + 1]).toBeLessThanOrEqual(g.blackMax);
    }
    const share = white / (px.length / 2);
    expect(share).toBeGreaterThan(0.45);
    expect(share).toBeLessThan(0.55);
  });
});
