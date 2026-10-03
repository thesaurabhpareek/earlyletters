#!/usr/bin/env node
/**
 * Regenerates the data tables in packs/text-rules/zh.json:
 *   phonetic.syllables          toneless pinyin -> characters (first reading)
 *   scriptVariants.targets      Traditional <-> Simplified, one-to-one only
 *
 * Sources (permissive licences; attribution is carried in zh.json):
 *   OpenCC data/dictionary/TSCharacters.txt and STCharacters.txt
 *     https://github.com/BYVoid/OpenCC  Apache-2.0
 *   pinyin-data kMandarin.txt (Unihan kMandarin, most customary reading)
 *     https://github.com/mozillazg/pinyin-data  MIT; Unihan: Unicode License v3
 *
 * Usage (download the three files first; nothing is fetched here):
 *   node packs/text-rules/tools/zh-data.mjs <TSCharacters.txt> <STCharacters.txt> <kMandarin.txt>
 *
 * Rules:
 *  - A variant pair is kept only when OpenCC lists exactly one target for
 *    the character (发 -> 發/髮 is ambiguous and left out), the two differ,
 *    and both are single BMP letters. Ambiguous characters are never
 *    converted; the parent's text keeps them as recognised.
 *  - Pinyin covers the 6,763 characters of GB 2312; Traditional characters
 *    are looked up through the Traditional -> Simplified map at run time.
 *    Tones are dropped; ü is written v.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [ts, st, mandarin] = process.argv.slice(2);
if (!ts || !st || !mandarin) {
  console.error('usage: zh-data.mjs <TSCharacters.txt> <STCharacters.txt> <kMandarin.txt>');
  process.exit(2);
}

const isBmpLetter = (c) => [...c].length === 1 && c.codePointAt(0) <= 0xffff && /^\p{L}$/u.test(c);

function oneToOne(file) {
  const from = [];
  const to = [];
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const [key, values = ''] = line.split('\t');
    const vs = values.trim().split(/\s+/).filter(Boolean);
    if (vs.length !== 1 || vs[0] === key || !isBmpLetter(key) || !isBmpLetter(vs[0])) continue;
    from.push(key);
    to.push(vs[0]);
  }
  return { from: from.join(''), to: to.join('') };
}

function gb2312() {
  const dec = new TextDecoder('gbk');
  const out = [];
  for (let hi = 0xb0; hi <= 0xf7; hi++) {
    for (let lo = 0xa1; lo <= 0xfe; lo++) {
      const ch = dec.decode(new Uint8Array([hi, lo]));
      if (/^\p{Script=Han}$/u.test(ch)) out.push(ch);
    }
  }
  return out;
}

function syllables(file, chars) {
  const reading = new Map();
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = /^U\+([0-9A-F]+):\s*([^#\s]+)/.exec(line);
    if (!m) continue;
    const ch = String.fromCodePoint(parseInt(m[1], 16));
    const first = m[2].split(',')[0];
    const toneless = first.normalize('NFD').replace(/ü/g, 'v').replace(/\p{M}/gu, '').toLowerCase();
    if (/^[a-z]{1,6}$/.test(toneless)) reading.set(ch, toneless);
  }
  const by = {};
  for (const ch of chars) {
    const syl = reading.get(ch);
    if (!syl) continue;
    by[syl] = (by[syl] ?? '') + ch;
  }
  return Object.fromEntries(Object.entries(by).sort(([a], [b]) => (a < b ? -1 : 1)));
}

const here = dirname(fileURLToPath(import.meta.url));
const packPath = join(here, '..', 'zh.json');
const pack = JSON.parse(readFileSync(packPath, 'utf8'));
const chars = gb2312();
pack.phonetic.syllables = syllables(mandarin, chars);
pack.scriptVariants.targets = { Hans: oneToOne(ts), Hant: oneToOne(st) };
writeFileSync(packPath, `${JSON.stringify(pack, null, 2)}\n`);
const count = (o) => [...o.from].length;
console.log(
  `zh.json: ${chars.length} GB 2312 characters, ${Object.keys(pack.phonetic.syllables).length} syllables, ` +
    `${count(pack.scriptVariants.targets.Hans)} Traditional->Simplified, ${count(pack.scriptVariants.targets.Hant)} Simplified->Traditional`,
);
