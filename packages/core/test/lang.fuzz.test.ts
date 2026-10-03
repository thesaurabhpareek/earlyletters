/**
 * Property test for every v1.0 language (ADR 0014), in the spirit of
 * verify.fuzz.test.ts. A seeded hostile model proposes random edits over a
 * small corpus per language: deletions under every removal label, word
 * swaps from a pool of negations, numbers, family words and names, mood
 * marks in every script (? ？ ؟ ! ！ ¿ ¡), added or removed combining marks
 * (harakat, vowel signs, nukta, accents), script swaps both ways, quotes,
 * arbitrary spans. Each language runs with its pack as shipped (draft word
 * tables) and as it will be once signed off (vetted). Whatever the
 * verifier lets through must:
 *   1. add no word: final words are raw words in order (compared NFC,
 *      lowercase, Chinese in the author's script), or a dictionary term
 *      standing in for 1 to 3 raw words;
 *   2. keep every once-said negation, every once-said digit group, and the
 *      count of question and exclamation marks (¿ ¡ may only be added in
 *      Spanish) and of quotation marks.
 * SCRIBE_FUZZ_SEED and SCRIBE_FUZZ_RUNS work as in the English fuzz test.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  applyEdits,
  checkEdit,
  compileRules,
  faithfulClean,
  protectedSpans,
  verifyEdits,
  type DictionaryTerm,
  type Edit,
  type EditType,
  type LanguageCode,
  type LanguageRules,
  type ScriptCode,
  type TextRulesPack,
} from '../src';

const SEED = Number(process.env.SCRIBE_FUZZ_SEED ?? 20261003);
const RUNS = Math.max(200, Math.floor(Number(process.env.SCRIBE_FUZZ_RUNS ?? 10000) / 6));

const DIR = join(__dirname, '../../../packs/text-rules');
const load = (l: LanguageCode) => JSON.parse(readFileSync(join(DIR, `${l}.json`), 'utf8')) as TextRulesPack;
function vetted(l: LanguageCode): TextRulesPack {
  const p = load(l);
  for (const k of ['fillers', 'meaning', 'repeats', 'phonetic'] as const) p[k].review = { status: 'native-reviewed' };
  return p;
}

interface Lang {
  code: Exclude<LanguageCode, 'en'>;
  script?: ScriptCode;
  dict: DictionaryTerm[];
  corpus: string[];
  pool: string[];
  marks: string[];
}

const LANGS: Lang[] = [
  {
    code: 'hi',
    dict: [{ term: 'आशा', kind: 'child', heardAs: ['आसा'] }],
    corpus: ['उम्म मैं नहीं जाऊँगा, माँ दो रोटी देगी.', 'आसा ने आज पहली बार कदम रखा।', 'वह खुश है, वह खुश है और हम घर गए', 'क्या तुम आओगे? मत रोओ!', 'धीरे धीरे वह सो गई, उम्म, 3 बजे।'],
    pool: ['नहीं', 'न', 'मत', 'दो', 'तीन', 'माँ', 'पापा', 'आशा', 'था', 'है', 'में', 'मैं', 'सकता'],
    marks: ['़', 'ं', 'ि', 'ी', '्'],
  },
  {
    code: 'es',
    dict: [{ term: 'Asha', kind: 'child', heardAs: ['Asia'] }],
    corpus: ['em quieres agua? no, no quiero dos.', 'Asia dio sus primeros pasos hoy, eh, con mamá.', 'si vienes, te doy tres besos', 'la la la, duerme ya!', 'Nunca llora, el el perro ladra.'],
    pool: ['no', 'nunca', 'sí', 'dos', 'tres', 'mamá', 'papá', 'Asha', 'era', 'es', 'puede', 'podría', 'el'],
    marks: ['́', '̃', '̈'],
  },
  {
    code: 'fr',
    dict: [{ term: 'Asha', kind: 'child', heardAs: ['Acha'] }],
    corpus: ["euh je ne veux pas ! papa n'aime pas les deux chats.", 'Acha a fait ses premiers pas : trois pas.', 'je je pense que non non', 'Elle a dit « salut » à mamie ?', 'Tu viens ; on y va.'],
    pool: ['ne', 'pas', 'jamais', 'deux', 'trois', 'papa', 'maman', 'Asha', 'était', 'est', 'peut', 'pourrait', 'je'],
    marks: ['́', '̀', '̂', '̧'],
  },
  {
    code: 'pt',
    dict: [{ term: 'Asha', kind: 'child', heardAs: ['Ácha'] }],
    corpus: ['hã não, a mamãe tem três filhos.', 'Ácha deu os primeiros passos hoje, né?', 'o bebê dormiu, o o cachorro latiu', 'Ela é tipo linda!', 'Nunca chora, vai dormir às 8:30.'],
    pool: ['não', 'nunca', 'nem', 'dois', 'três', 'mamãe', 'papai', 'Asha', 'era', 'é', 'pode', 'poderia', 'o'],
    marks: ['́', '̂', '̃'],
  },
  {
    code: 'ar',
    dict: [{ term: 'آشا', kind: 'child', heardAs: ['عاشا'] }],
    corpus: ['اممم لا، ماما ما نامت. عندها ثلاثة أطفال.', 'عاشا مشت اليوم? مش عايزة تنام', 'كَتَبَ الوَلَدُ في في الدفتر', 'هل أنت بخير؟ نعم!', 'بدي ماما، جميـــل جدا'],
    pool: ['لا', 'ما', 'مش', 'لم', 'ثلاثة', 'أربعة', 'ماما', 'بابا', 'آشا', 'كان', 'يمكن', 'في'],
    marks: ['َ', 'ُ', 'ِ', 'ّ', 'ْ', 'ـ'],
  },
  {
    code: 'zh',
    script: 'Hans',
    dict: [{ term: '阿莎', kind: 'child', heardAs: ['阿沙'] }],
    corpus: ['呃，她不喜欢，妈妈有三个苹果。', '阿沙今天第一次走路了? 我們很開心', '宝宝呃逆了，额头热。嗯，好', '你没去吗？我我想去公园!', '她说“好”……然后——睡了, 3.5斤'],
    pool: ['不', '没', '别', '三', '四', '两', '妈', '爸', '阿莎', '了', '会', '们', '們', '开', '開'],
    marks: ['️'],
  },
];

/* ---------- PRNG ---------- */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- the invariant's own definitions ---------- */

function makeCheck(lang: Lang, R: LanguageRules) {
  const variants = (w: string) => [...w].map((c) => R.variantOf(c) ?? c).join('');
  // Tatweel (U+0640) stretches a word on the page; it is not a letter of it, and the final text drops it.
  const word = (w: string) => variants(w.normalize('NFC').toLowerCase().replace(/[’‘′]/g, "'").replace(/\u0640/g, ''));
  const wordsOf = (s: string) => R.tokens(s).map((t) => word(t.word));
  const terms = new Set(lang.dict.map((d) => word(d.term)));
  const termParts = new Set(lang.dict.flatMap((d) => R.tokens(d.term).map((t) => word(t.word))));

  function faithful(raw: string[], fin: string[]): boolean {
    const memo = new Map<number, boolean>();
    const go = (i: number, j: number): boolean => {
      if (j === fin.length) return true;
      if (i === raw.length) return false;
      const key = i * 1000 + j;
      if (memo.has(key)) return memo.get(key)!;
      let ok = go(i + 1, j) || (raw[i] === fin[j] && go(i + 1, j + 1));
      // a dictionary term (one token, or each character of a Chinese name) standing in for 1 to 3 raw words
      for (let span = 1; !ok && span <= 3 && i + span <= raw.length; span++) {
        if (terms.has(fin[j]) || termParts.has(fin[j])) ok = go(i + span, j + 1);
      }
      memo.set(key, ok);
      return ok;
    };
    return go(0, 0);
  }

  const once = (xs: string[]) => new Set(xs).size === xs.length;
  const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;
  return (raw: string, text: string): string | null => {
    const rw = wordsOf(raw);
    const fw = wordsOf(text);
    if (!faithful(rw, fw)) return 'added_or_swapped_word';
    const neg = (ws: string[]) => ws.filter((w) => R.isNegation(w));
    if (once(neg(rw)) && neg(fw).length !== neg(rw).length) return 'negation_changed';
    const digits = (s: string) => s.match(/\p{N}+(?:[.,:/٫٬]\p{N}+)*/gu) ?? [];
    if (once(digits(raw)) && digits(text).join('|') !== digits(raw).join('|')) return 'number_changed';
    if (count(raw, /[?？؟]/g) !== count(text, /[?？؟]/g)) return 'question_changed';
    if (count(raw, /[!！]/g) !== count(text, /[!！]/g)) return 'exclamation_changed';
    const inverted = (s: string) => count(s, /[¿¡]/g);
    if (lang.code === 'es' ? inverted(text) < inverted(raw) : inverted(text) !== inverted(raw)) return 'inverted_mark_changed';
    if (count(raw, /["“”«»「」『』]/g) !== count(text, /["“”«»「」『』]/g)) return 'quotes_changed';
    return null;
  };
}

/* ---------- the hostile model ---------- */

const TYPES: EditType[] = ['filler', 'false_start', 'repeat', 'stt_fix', 'punctuation', 'agreement'];

function fuzzEdits(raw: string, lang: Lang, R: LanguageRules, rnd: () => number): Edit[] {
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
  const toks = R.tokens(raw);
  const edits: Edit[] = [];
  const mk = (type: EditType, start: number, end: number, replacement: string): Edit => ({ type, start, end, original: raw.slice(start, end), replacement, source: 'model' });
  const n = 1 + Math.floor(rnd() * 5);
  for (let k = 0; k < n && toks.length; k++) {
    const i = Math.floor(rnd() * toks.length);
    const t = toks[i];
    const last = toks[Math.min(toks.length - 1, i + Math.floor(rnd() * 3))];
    const type = pick(TYPES);
    switch (Math.floor(rnd() * 11)) {
      case 0: // a word or phrase replaced by pool words
        edits.push(mk(type, t.start, last.end, Array.from({ length: 1 + Math.floor(rnd() * 2) }, () => pick(lang.pool)).join(lang.code === 'zh' ? '' : ' ')));
        break;
      case 1: // a combining mark added after a letter, or the word's last character dropped
        edits.push(rnd() < 0.5 ? mk(pick(['punctuation', type] as EditType[]), t.end, t.end, pick(lang.marks)) : mk(pick(['punctuation', type] as EditType[]), t.end - 1, t.end, ''));
        break;
      case 2: // a mood mark of any script, added or swapped
        {
          const m = /[.!?。！？؟।]/u.exec(raw.slice(t.end));
          const mood = pick(['?', '!', '？', '！', '؟', '¿', '¡', '.', '。', '।']);
          if (m) edits.push(mk('punctuation', t.end + m.index, t.end + m.index + 1, mood));
          else edits.push(mk('punctuation', t.start, t.start, mood));
        }
        break;
      case 3: // quotes around words
        edits.push(mk('punctuation', t.start, last.end, `${pick(['"', '«', '「'])}${raw.slice(t.start, last.end)}${pick(['"', '»', '」'])}`));
        break;
      case 4: // delete under a removal label, with or without the gap after
        edits.push(mk(pick(['filler', 'repeat', 'false_start'] as EditType[]), t.start, rnd() < 0.5 ? last.end : (toks[toks.indexOf(last) + 1]?.start ?? last.end), ''));
        break;
      case 5: // a word to a dictionary name
        edits.push(mk('stt_fix', t.start, last.end, pick(lang.dict).term));
        break;
      case 6: // script swap either way, one character
        {
          const ch = String.fromCodePoint(raw.codePointAt(t.start)!);
          const other = pick(['们', '們', '开', '開', '发', '發', '后', '後']);
          edits.push(mk('punctuation', t.start, t.start + ch.length, other));
        }
        break;
      case 7: // join or split words
        if (i + 1 < toks.length) edits.push(mk('punctuation', t.end, toks[i + 1].start, ''));
        else edits.push(mk('punctuation', t.start + 1, t.start + 1, ' '));
        break;
      case 8: // arbitrary span, arbitrary replacement
        {
          const a = Math.floor(rnd() * raw.length);
          const b = Math.min(raw.length, a + Math.floor(rnd() * 6));
          edits.push(mk(type, a, b, pick(['', ' ', '.', ',', '，', '،', pick(lang.pool), raw.slice(b, b + 2)])));
        }
        break;
      default: // honest repairs, so the verifier has something to accept
        {
          const end = raw.trimEnd().length;
          if (rnd() < 0.5) edits.push(mk('punctuation', end, end, R.terminal));
          else if (/^\p{Ll}/u.test(raw)) edits.push(mk('punctuation', 0, 1, raw[0].toUpperCase()));
          else {
            const c = /[,?]/.exec(raw);
            if (c) edits.push(mk('punctuation', c.index, c.index + 1, ({ ',': '，', '?': '？' } as Record<string, string>)[c[0]]));
          }
        }
    }
  }
  return edits;
}

describe('every language: random hostile edits never add or swap meaning', () => {
  for (const lang of LANGS) {
    for (const mode of ['as shipped', 'vetted'] as const) {
      it(`${lang.code} ${mode}: ${RUNS} generated edit lists (seed ${SEED})`, () => {
        const pack = mode === 'vetted' ? vetted(lang.code) : load(lang.code);
        const R = compileRules(lang.code, pack, lang.script ? { script: lang.script } : {});
        const broke = makeCheck(lang, R);
        const rnd = mulberry32(SEED + lang.code.charCodeAt(0) + (mode === 'vetted' ? 1 : 0));
        let proposed = 0;
        let accepted = 0;
        for (let run = 0; run < RUNS; run++) {
          const raw = lang.corpus[Math.floor(rnd() * lang.corpus.length)];
          const edits = fuzzEdits(raw, lang, R, rnd);
          proposed += edits.length;
          const c = { raw, level: 'clean' as const, dictionary: lang.dict, protectedSpans: protectedSpans(raw, lang.dict), rules: R };
          const v = verifyEdits(edits, c);
          accepted += v.accepted.length;
          for (const e of v.accepted) expect(checkEdit(e, c), `seed ${SEED} run ${run}`).toBeNull();
          const text = applyEdits(raw, v.accepted);
          const why = broke(raw, text);
          if (why) throw new Error(`${lang.code} ${mode} seed ${SEED} run ${run}: ${why}\nraw:  ${raw}\ntext: ${text}\nedits: ${JSON.stringify(v.accepted)}`);

          const out = faithfulClean(raw, { level: 'clean', dictionary: lang.dict, rules: R, modelEdits: edits });
          const why2 = broke(raw, out.text);
          if (why2) throw new Error(`${lang.code} ${mode} seed ${SEED} run ${run} (pipeline): ${why2}\nraw:  ${raw}\ntext: ${out.text}\nedits: ${JSON.stringify(out.applied)}`);
        }
        expect(proposed).toBeGreaterThan(RUNS * 2);
        expect(accepted).toBeGreaterThan(RUNS / 10);
      });
    }
  }
});
