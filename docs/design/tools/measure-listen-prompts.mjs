#!/usr/bin/env node
// Which Listen prompts run past 3 lines at a given text size?
// Plain node (22+), no install. Reads the bundled Literata face and the prompt
// strings, adds up glyph advance widths, and wraps greedily on spaces.
//
// Run from the repo root:
//   node docs/design/tools/measure-listen-prompts.mjs
//   node docs/design/tools/measure-listen-prompts.mjs --width 327 --lines 3
//
// What it is: a computed estimate from font files. It is not a render.
// Limits (said plainly):
//  - No kerning or GPOS shaping, so a line can differ by a point or two.
//  - Greedy wrap on spaces; iOS may break a little differently.
//  - The size table below is React Native's usual non-accessibility scale
//    for body text. The prompt style asks for the iOS `title3` curve, which
//    is a little different. Check on a phone before relying on one prompt.
//  - {child} is replaced by "Asha", the fictional family in the tests.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? Number(process.argv[i + 1]) : dflt;
};
const WIDTH = arg('width', 335); // 375 less a 20 pt gutter each side (the audit's width)
const MAX_LINES = arg('lines', 3); // the cap the Listen prompt used to carry
const BASE = 24; // `type.prompt` fontSize in packages/design-tokens/src/tokens.ts
const SCALES = { Large: 1, xLarge: 1.118, XXL: 1.235, XXXL: 1.353 };

import { loadFont } from './ttf-width.mjs';

const font = loadFont(join(root, 'packages/design-tokens/fonts/Literata-Regular.ttf'));

// --- the prompts: every `text: "..."` in packages/content/src/prompts.ts ---
const src = readFileSync(join(root, 'packages/content/src/prompts.ts'), 'utf8');
const prompts = [];
for (const m of src.matchAll(/key:\s*"([^"]+)",\s*text:\s*"((?:[^"\\]|\\.)*)"/g)) {
  prompts.push({ key: m[1], text: JSON.parse(`"${m[2]}"`).replaceAll('{child}', 'Asha') });
}

function lineCount(text, size) {
  const space = font.width(' ', size);
  let lines = 1, used = 0;
  for (const word of text.split(' ')) {
    const w = font.width(word, size);
    if (used === 0) used = w;
    else if (used + space + w <= WIDTH) used += space + w;
    else { lines++; used = w; }
  }
  return lines;
}

console.log(`${prompts.length} prompts, Literata Regular ${BASE} pt base, text width ${WIDTH} pt, cap ${MAX_LINES} lines`);
for (const [name, scale] of Object.entries(SCALES)) {
  const over = prompts
    .map((p) => ({ ...p, lines: lineCount(p.text, BASE * scale) }))
    .filter((p) => p.lines > MAX_LINES);
  console.log(`\n${name} (x${scale}, ${(BASE * scale).toFixed(1)} pt): ${over.length} past ${MAX_LINES} lines`);
  for (const p of over) console.log(`  ${p.lines} lines  ${p.key}  (${p.text.length} chars)  ${p.text}`);
}
