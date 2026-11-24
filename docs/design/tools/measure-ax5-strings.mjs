#!/usr/bin/env node
// How do the real strings of a few settings screens set at Dynamic Type AX5 (x3.571)?
// Plain node (22+), no install. Run from the repo root:
//   node docs/design/tools/measure-ax5-strings.mjs
// For each string: line count, the widest single word (a word wider than the box splits mid-word,
// because iOS does not hyphenate) and the text height. A computed estimate from the bundled font
// files and the type ramp in tokens.ts, not a render. No kerning, greedy wrap on spaces.
// Strings are read from the source files by key, so a changed string changes the table.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadFont } from './ttf-width.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const AX5 = 3.571;
const fontsDir = join(root, 'packages/design-tokens/fonts');
const faces = {
  body: ['Mukta-Regular', 18, 24],
  headline: ['Mukta-SemiBold', 18, 23],
  subhead: ['Mukta-Regular', 16, 21],
  footnote: ['Mukta-Regular', 14, 19],
  label: ['Mukta-Medium', 18, 22],
};
const fonts = {};
const font = (n) => (fonts[n] ??= loadFont(join(fontsDir, `${n}.ttf`)));

const read = (p) => readFileSync(join(root, p), 'utf8');
// first `key: 'text'` or `key: "text"` in the file
function pick(file, key) {
  const m = read(file).match(new RegExp(`\\b${key}:\\s*(?:\\n\\s*)?(['"])((?:\\\\.|(?!\\1).)*)\\1`));
  if (!m) throw new Error(`${key} not found in ${file}`);
  return m[2].replace(/\\'/g, "'").replace(/\\"/g, '"');
}

const REM = 'packages/content/src/features/reminders.en.ts';
const STR = 'packages/content/src/strings.en.ts';
const LOCK = 'apps/mobile/src/lib/app-lock/copy.ts';
// Widths (READ in apps/mobile/src/app/settings/*.tsx and components/ui/list-row.tsx):
// page gutter px-5 = 20 each side; a row or footer adds px-4 = 16 each side -> 303 pt on a 375 pt phone.
// A notice card p-4 with a 20 pt icon and an 8 pt gap -> 275 pt for its title.
// The public name is read from packages/brand, never typed here (CLAUDE.md).
const BRAND = read('packages/brand/index.ts').match(/const name = '([^']+)'/)[1];
const ROW = 303, PAGE = 335, NOTICE_TITLE = 275, NOTICE_BODY = 303;

const rows = [
  // [screen, what, style, width, text]
  ['Reminders', 'switch row title "Reminders"', 'body', ROW, pick(REM, 'enabledLabel')],
  ['Reminders', 'footer, privacyLine', 'footnote', ROW, pick(REM, 'privacyLine')],
  ['Reminders', 'footer, quietLine', 'footnote', ROW, pick(REM, 'quietLine')],
  ['Reminders', 'quietHelp', 'footnote', ROW, pick(REM, 'quietHelp')],
  ['Reminders', 'row title, month and birthday messages', 'body', ROW, pick(REM, 'monthNotesLabel')],
  ['Reminders', 'row help, monthNotesHelp', 'footnote', ROW, pick(REM, 'monthNotesHelp')],
  ['Reminders', 'names help, namesHelpOff', 'footnote', ROW, pick(REM, 'namesHelpOff')],
  ['Reminders', 'names help, lockNames', 'footnote', ROW, pick(REM, 'lockNames')],
  ['Reminders', 'denied card title (headline, beside a 20 pt icon)', 'headline', NOTICE_TITLE, pick(REM, 'deniedTitle')],
  ['Reminders', 'denied card body (subhead)', 'subhead', NOTICE_BODY, pick(REM, 'deniedBody')],
  ['Reminders', 'button "Open Settings" (label, size sm, padding 16 each side)', 'label', PAGE - 32, pick(REM, 'openSettingsButton')],
  ['App lock', 'switch row title (Face ID variant)', 'body', ROW, read(LOCK).match(/toggle:\s*\{\s*faceId:\s*'([^']+)'/)[1]],
  ['App lock', 'noPasscode line', 'footnote', ROW, pick(LOCK, 'noPasscode')],
  ['App lock', 'faceIdDenied line', 'footnote', ROW, pick(LOCK, 'faceIdDenied').replace('{app}', BRAND)],
  ['App lock', 'recordingLine', 'footnote', ROW, pick(LOCK, 'recordingLine')],
  ['App lock', 'footer', 'footnote', ROW, pick(LOCK, 'footer')],
  ['Privacy row', 'row title', 'body', ROW, pick(STR, 'analyticsLabel')],
  ['Privacy row', 'row help', 'footnote', ROW, pick(STR, 'analyticsHelp')],
  ['Privacy row', 'section footer, analyticsOffNote', 'footnote', ROW, pick(STR, 'analyticsOffNote')],
];

function wrap(text, style, width) {
  const [face, size, lh] = faces[style];
  const f = font(face), px = size * AX5;
  const space = f.width(' ', px);
  let lines = 1, used = 0, widest = 0;
  for (const word of text.split(' ')) {
    const w = f.width(word, px);
    widest = Math.max(widest, w);
    if (used === 0) used = w;
    else if (used + space + w <= width) used += space + w;
    else { lines++; used = w; }
  }
  return { lines, widest, height: lines * lh * AX5, px };
}

console.log(`AX5 = x${AX5}. Widths: row/footer ${ROW} pt, page ${PAGE} pt, notice title ${NOTICE_TITLE} pt.`);
console.log('screen | what | style pt | box | lines | widest word | text height | splits a word?');
for (const [screen, what, style, width, text] of rows) {
  const r = wrap(text, style, width);
  console.log(`${screen} | ${what} | ${style} ${r.px.toFixed(1)} | ${width} | ${r.lines} | ${r.widest.toFixed(0)} | ${r.height.toFixed(0)} | ${r.widest > width ? 'YES' : 'no'}`);
}
