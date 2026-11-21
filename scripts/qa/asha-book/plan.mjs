// The Asha seeded book, pure part (MEASUREMENT-PLAN.md section 3, helper H2). No I/O, no clock, no Math.random:
// the same input gives the same plan. Fictional family only. The app writes it into its store in
// apps/mobile/test/helpers/asha-book-db.ts. Pictures are plan rows (file names and sizes), never image bytes.
import { createHash } from 'node:crypto';

export const DEFAULT_SEED = 20261120;
/** Asha was born 2025-04-12 (fictional, packages/content/test/no-real-family-data.test.ts). */
export const RANGE = { from: '2025-04-12', to: '2030-04-11' };
export const SIZES = {
  small: { letters: 50, pictures: 10 },
  book: { letters: 1000, pictures: 300 },
};

// The whole vocabulary: every word a letter can hold. Non-Latin words are written as escapes to keep this file ASCII.
export const VOCAB = {
  en: 'asha laughed rain window dal nani papa mama morning blanket spoon giggle sleepy garden shoes bath song kitten bubbles walked clapped sunny cuddle story yellow cup puddle'.split(' '),
  hi: ['\u092a\u094d\u092f\u093e\u0930', '\u092c\u093f\u091f\u093f\u092f\u093e', '\u0906\u091c', '\u0939\u0901\u0938\u0940'],
  ar: ['\u062d\u0628', '\u0627\u0644\u064a\u0648\u0645', '\u0636\u062d\u0643\u0629', '\u0645\u0627\u0645\u0627'],
  zh: ['\u7231', '\u4eca\u5929', '\u7b11', '\u5b9d\u5b9d'],
};
export const RTL = new Set(['ar']);

/** mulberry32: a small seeded generator. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(n, next) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const pad = (n, w = 2) => String(n).padStart(w, '0');

/**
 * planBook({ seed, letters, pictures }) -> { seed, items }. Items are in date order. Each:
 * { index, date, kind: 'spoken'|'typed', language, words, text, audio: {sha256, bytes, ms}|null,
 *   picture: null|{ file, aspect, format, orientation, bytes }, deleted }.
 * At least 3 letters in each of the 60 months (when letters >= 180); one month holds 60; 3 letters of 4,000 words;
 * 10 each in Hindi, Arabic and Chinese; 70% spoken; 20 in Recently deleted (2 per 100 letters when small).
 */
export function planBook({ seed = DEFAULT_SEED, letters = SIZES.book.letters, pictures = SIZES.book.pictures } = {}) {
  const next = rng(seed);
  const months = 60;
  const counts = new Array(months).fill(0);
  const full = letters >= 180;
  if (full) {
    counts.fill(3);
    counts[30] = 60;
  }
  for (let left = letters - counts.reduce((s, c) => s + c, 0); left > 0; left--) {
    // later months weigh more, so the book grows year on year; month 30 stays at 60
    let pick;
    do pick = Math.floor(Math.sqrt(next()) * months);
    while (full && pick === 30);
    counts[pick]++;
  }
  const dates = [];
  counts.forEach((c, m) => {
    const y = 2025 + Math.floor((3 + m) / 12);
    const mo = ((3 + m) % 12) + 1;
    for (let i = 0; i < c; i++) dates.push(`${y}-${pad(mo)}-${pad((m === 0 ? 12 : 1) + Math.floor(next() * (m === 0 ? 17 : 28)))}`);
  });
  dates.sort();

  const order = shuffled(letters, next);
  const lang = new Map();
  order.slice(0, Math.min(30, letters)).forEach((i, k) => lang.set(i, ['hi', 'ar', 'zh'][k % 3]));
  const giants = new Set(order.slice(30, 33).filter((i) => letters >= 100 && !lang.has(i)));
  const deleted = new Set(shuffled(letters, next).slice(0, Math.round(letters / 50)));
  const withPicture = shuffled(letters, next).slice(0, pictures);
  const aspects = [['4:3', 0.7], ['3:4', 0.15], ['1:1', 0.1], ['3:1', 0.05]];
  const pics = new Map();
  withPicture.forEach((letter, k) => {
    let share = k / pictures;
    const aspect = aspects.find(([, w]) => (share -= w) < 0)?.[0] ?? '3:1';
    pics.set(letter, {
      file: `asha-${k + 1}.jpg`,
      aspect,
      format: k % 30 === 1 ? 'png' : 'jpeg',
      orientation: k % 30 === 2 ? 6 : 1,
      bytes: 2_000_000 + Math.floor(next() * 2_000_000),
    });
  });

  const items = dates.map((date, index) => {
    const language = lang.get(index) ?? 'en';
    const words = giants.has(index) ? 4000 : 20 + Math.floor(next() * 281);
    const vocab = VOCAB[language];
    const text = Array.from({ length: language === 'en' ? words : Math.min(words, 40) }, () => vocab[Math.floor(next() * vocab.length)]).join(' ');
    const spoken = next() < 0.7;
    const sha256 = createHash('sha256').update(`asha-audio-${seed}-${index}`).digest('hex');
    const picture = pics.get(index) ?? null;
    return {
      index,
      date,
      kind: spoken ? 'spoken' : 'typed',
      language,
      words: text.split(' ').length,
      text,
      audio: spoken ? { sha256, bytes: 24_000, ms: 3000 } : null,
      picture: picture && { ...picture, file: picture.format === 'png' ? picture.file.replace('.jpg', '.png') : picture.file },
      deleted: deleted.has(index),
    };
  });
  return { seed, items };
}

export const planSha256 = (plan) => createHash('sha256').update(JSON.stringify(plan)).digest('hex');

// CLI: node scripts/qa/asha-book/plan.mjs [seed] [small|book]  prints counts and the plan hash (numbers only, no content).
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const seed = Number(process.argv[2] ?? DEFAULT_SEED);
  const plan = planBook({ seed, ...SIZES[process.argv[3] ?? 'book'] });
  console.log(JSON.stringify({ seed, letters: plan.items.length, pictures: plan.items.filter((i) => i.picture).length, sha256: planSha256(plan) }));
}
