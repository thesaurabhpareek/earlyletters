#!/usr/bin/env node
// Voice and formatting lint for docs/prd/v2. Usage: node docs/prd/v2/tools/lint.mjs <file|dir> [...]
// Exits 1 if any finding. Rules come from docs/prd/v2/_AUTHORING.md sections 6 and 7.
import { readFileSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const charRules = [
  { re: /—/g, msg: 'em dash' },
  { re: /–/g, msg: 'en dash' },
  { re: /[‘’“”]/g, msg: 'curly quote' },
  { re: /…/g, msg: 'ellipsis character' },
  { re: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, msg: 'emoji' },
];

const banned = [
  'seamless', 'seamlessly', 'robust', 'leverage', 'leveraging', 'delightful', 'empower', 'empowers', 'empowering',
  'cutting-edge', 'game-changer', 'game changer', 'holistic', 'synergy', "in today's world", "it's important to note",
  "it's worth noting", 'dive into', 'deep dive', 'navigate the', 'elevate', 'streamline', 'best-in-class', 'world-class',
  'unleash', 'supercharge', 'revolutionize', 'revolutionise', 'paradigm', 'tapestry', 'embark',
];

function files(p) {
  const s = statSync(p);
  if (s.isFile()) return p.endsWith('.md') ? [p] : [];
  return readdirSync(p).flatMap((n) => (n === 'tools' ? [] : files(join(p, n))));
}

let count = 0;
for (const target of process.argv.slice(2)) {
  for (const f of files(target)) {
    const lines = readFileSync(f, 'utf8').split('\n');
    let inFence = false;
    lines.forEach((line, i) => {
      if (line.trim().startsWith('```')) inFence = !inFence;
      for (const r of charRules) {
        if (r.re.test(line)) { count++; console.log(`${f}:${i + 1}: ${r.msg}`); }
        r.re.lastIndex = 0;
      }
      if (inFence) return;
      const lower = line.toLowerCase();
      // Skip the rulebook's own list of banned words.
      if (f.endsWith('_AUTHORING.md')) return;
      for (const w of banned) {
        const re = new RegExp(`(^|[^a-z])${w.replace(/[-']/g, (c) => '\\' + c)}([^a-z]|$)`);
        if (re.test(lower)) { count++; console.log(`${f}:${i + 1}: banned word "${w}"`); }
      }
    });
  }
}
if (count) { console.log(`\n${count} finding(s)`); process.exit(1); }
console.log('lint: clean');
