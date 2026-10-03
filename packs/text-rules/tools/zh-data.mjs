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
 *  - A character with exactly one OpenCC candidate converts to it. When
 *    OpenCC lists several, the candidates are first narrowed to the target standard's own
 *    character set: GB 2312 for Simplified, Big5 for Traditional (開 -> 开
 *    or the Extension B 𫔭 becomes just 开; 麵 -> 面 or the Japanese 麺
 *    becomes just 面). A pair is kept only when exactly one candidate
 *    remains and it differs from the source (发 -> 發 or 髮 stays
 *    ambiguous; 乾 -> 干 or 乾 can stay as it is, so it is left out). Both
 *    must be single BMP letters. Ambiguous characters are never converted;
 *    the parent's text keeps them as recognised.
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

function oneToOne(file, targetSet) {
  const from = [];
  const to = [];
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const [key, values = ''] = line.split('\t');
    const all = [...new Set(values.trim().split(/\s+/).filter(Boolean))];
    const vs = all.length === 1 ? all : all.filter((v) => v === key || targetSet.has(v));
    if (vs.length !== 1 || vs[0] === key || !isBmpLetter(key) || !isBmpLetter(vs[0])) continue;
    from.push(key);
    to.push(vs[0]);
  }
  return { from: from.join(''), to: to.join('') };
}

/** Han characters of a double-byte legacy standard, decoded row by row. */
function hanSet(encoding, leads, trails) {
  const dec = new TextDecoder(encoding);
  const out = [];
  for (const hi of leads) {
    for (const lo of trails) {
      const ch = dec.decode(new Uint8Array([hi, lo]));
      if (/^\p{Script=Han}$/u.test(ch)) out.push(ch);
    }
  }
  return out;
}

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
/** GB 2312 hanzi: rows 0xB0..0xF7 (the GBK decoder reads this area identically). */
const gb2312 = () => hanSet('gbk', range(0xb0, 0xf7), range(0xa1, 0xfe));
/** Big5 hanzi: lead bytes 0xA4..0xF9, trail bytes 0x40..0x7E and 0xA1..0xFE. */
const big5 = () => hanSet('big5', range(0xa4, 0xf9), [...range(0x40, 0x7e), ...range(0xa1, 0xfe)]);

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
const traditional = new Set(big5());
pack.phonetic.syllables = syllables(mandarin, chars);
pack.scriptVariants.targets = { Hans: oneToOne(ts, new Set(chars)), Hant: oneToOne(st, traditional) };
writeFileSync(packPath, `${JSON.stringify(pack, null, 2)}\n`);
const count = (o) => [...o.from].length;
console.log(
  `zh.json: ${chars.length} GB 2312 and ${traditional.size} Big5 characters, ${Object.keys(pack.phonetic.syllables).length} syllables, ` +
    `${count(pack.scriptVariants.targets.Hans)} Traditional->Simplified, ${count(pack.scriptVariants.targets.Hant)} Simplified->Traditional`,
);
