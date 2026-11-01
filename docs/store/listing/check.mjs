// Usage: node docs/store/listing/check.mjs
// Checks limits (counted in characters, not bytes), banned characters and words, and prices against
// apps/web/src/content/pricing.ts. Exits 1 on any failure.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(here, 'listing.json'), 'utf8'));
const pricingSrc = readFileSync(join(here, '../../../apps/web/src/content/pricing.ts'), 'utf8');
const m = pricingSrc.match(/monthly:\s*\{\s*price:\s*'(\$[\d.]+)',\s*trialMonths:\s*(\d+)\s*\},\s*annual:\s*\{\s*price:\s*'(\$[\d.]+)',\s*trialMonths:\s*(\d+)/);
if (!m) { console.error('Could not read pricing.ts'); process.exit(1); }
const [, monthly, mTrial, annual, aTrial] = m;

const len = (s) => [...s].length;
let failed = 0;
const rows = [];
const fail = (msg) => { failed++; console.log(`FAIL ${msg}`); };

function limit(label, text, max, min = 0) {
  const n = len(text);
  const ok = n <= max && n >= min;
  rows.push(`${ok ? 'ok  ' : 'FAIL'} ${label}: ${n}/${max}`);
  if (!ok) failed++;
}

const a = data.apple, p = data.googlePlay;
limit('apple.name', a.name, 30);
limit('apple.subtitle', a.subtitle, 30);
limit('apple.promotionalText', a.promotionalText, 170);
limit('apple.description', a.description, 4000, 1500);
limit('apple.keywords', a.keywords, 100);
limit('apple.whatsNew', a.whatsNew, 4000);
limit('play.title', p.title, 30);
limit('play.shortDescription', p.shortDescription, 80);
limit('play.fullDescription', p.fullDescription, 4000);
if (p.tags.length > 5) fail(`play.tags has ${p.tags.length}, max 5`);
if (/\s/.test(a.keywords)) fail('apple.keywords contains whitespace');
for (const [loc, v] of Object.entries(data.localisation.locales)) {
  limit(`loc.${loc}.subtitle`, v.subtitle, 30);
  limit(`loc.${loc}.promotionalText`, v.promotionalText, 170);
}

// Every string in the file, for content rules.
const leaves = [];
(function walk(v, path) {
  if (typeof v === 'string') leaves.push([path, v]);
  else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k);
})(data, '');

const english = leaves.filter(([path]) => !path.startsWith('localisation.locales') && !path.endsWith('availability') && !path.endsWith('review') && !path.endsWith('confidence') && !path.startsWith('_comment') && !path.startsWith('localisation.status') && !path.startsWith('localisation.storefrontNote'));
const copy = leaves.filter(([path]) => !/(^_comment|availability|\.review|\.confidence|localisation\.status|localisation\.storefrontNote)/.test(path));

const CHARS = /[—–‘’“”…]/;
const EMOJI = /\p{Extended_Pictographic}/u;
for (const [path, t] of copy) {
  if (CHARS.test(t)) fail(`${path}: em/en dash, curly quote or ellipsis character`);
  if (EMOJI.test(t)) fail(`${path}: emoji`);
}
const ex = copy.reduce((n, [, t]) => n + (t.match(/!/g)?.length ?? 0), 0);
if (ex > 0) fail(`exclamation marks: ${ex}`);

const AI = /\b(AI|A\.I\.|artificial intelligence|smart|magic(al)?|generat(e|es|ed|ing)|polish(ed|es|ing)?|perfect(ed|s)?|enhanc(e|ed|es|ing))\b/;
const FEAR = /\b(too late|don'?t miss|you haven'?t|you forgot|streaks?|lost forever|regrets?|never get back|die|dies|died|dying|death|dead|passed away|when you'?re gone|if you'?re gone|legacy|precious|cherish|journey|unlock|seamless|effortless|learn|literacy|educational)\b/i;
const GENDER = /\b(she|he|her|him|his|hers|girl|boy|daughter|son)\b/i;
const BETA = /\bbeta\b/i;
for (const [path, t] of english) {
  if (AI.test(t)) fail(`${path}: AI or writing-claim word`);
  if (FEAR.test(t)) fail(`${path}: fear, guilt, loss or banned brand word`);
  if (GENDER.test(t)) fail(`${path}: gendered word for the child`);
  if (BETA.test(t)) fail(`${path}: beta wording (D-030)`);
  if (/\brewrit/i.test(t) && !/\b(never|not|don'?t|won'?t|no)\b[^.]{0,40}\brewrit/i.test(t)) fail(`${path}: rewrite not inside a never-rewrite promise`);
}
// Platform names: none of the other store's names, and no Android in iOS metadata (App Review 2.3.10).
for (const [path, t] of english) {
  if (path.startsWith('apple') && /android|google/i.test(t)) fail(`${path}: other platform named in iOS copy`);
  if (path.startsWith('googlePlay') && !path.endsWith('availability') && /\b(app store|apple|iphone|ios)\b/i.test(t)) fail(`${path}: Apple name in Play copy`);
}
// Keywords must not repeat words in name or subtitle.
const used = new Set(`${a.name} ${a.subtitle}`.toLowerCase().match(/[a-z]+/g));
for (const k of a.keywords.split(',')) if (used.has(k.toLowerCase())) fail(`apple.keywords repeats "${k}"`);
if (new Set(a.keywords.split(',')).size !== a.keywords.split(',').length) fail('apple.keywords has duplicates');

// Prices and trials: only the pricing.ts figures may appear.
for (const [path, t] of copy) {
  for (const d of t.match(/\$\d[\d.,]*/g) ?? []) if (d !== monthly && d !== annual) fail(`${path}: price ${d} is not in pricing.ts`);
  for (const n of t.match(/\b(\d+)-month\b/g) ?? []) if (![mTrial, aTrial].includes(String(parseInt(n)))) fail(`${path}: trial ${n} is not in pricing.ts`);
}
for (const [path, t] of [['apple.description', a.description], ['play.fullDescription', p.fullDescription]]) {
  const want = `${monthly} a month with a ${mTrial}-month free trial, or ${annual} a year with a ${aTrial}-month free trial`;
  // The first store build's Apple description (packages/content store.en.ts) names no price: the price comes from App Store Connect.
  const namesPrice = /\$\d/.test(t);
  if ((path.startsWith('play') || namesPrice) && !t.includes(want)) fail(`${path}: pricing sentence does not match pricing.ts`);
  if (!/first two letters are free/.test(t)) fail(`${path}: missing "first two letters are free"`);
}

console.log(rows.join('\n'));
console.log(failed ? `\n${failed} failure(s)` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
