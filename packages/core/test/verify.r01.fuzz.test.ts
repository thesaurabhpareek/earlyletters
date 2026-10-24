/**
 * [F06-REQ-021] Property test: zero accepted meaning changes (R-01 launch gate).
 *
 * The constitution: the machine may remove and repair. It may never add meaning.
 *
 * 10,000 cases on a fixed seed (SCRIBE_FUZZ_SEED overrides it nightly,
 * SCRIBE_FUZZ_RUNS the count). Each case is one synthetic letter about the
 * fictional family "Asha", in one of the seven launch languages, with a
 * dictionary drawn from a pool that holds every R-01 trap: names that are
 * everyday words (Hope, Will, May, Bean), a heard-as that is another
 * family member's name (Usha), heard-as values that are a negation or a
 * number (Noa heard as "no", Tenzin heard as "ten"), and a kinship word
 * taught to a child. The letters carry combining marks, joiners, direction
 * marks, every quotation style, mood marks in every script, hyphenated yes
 * and no ("uh-uh", "mm-hmm"), spaced filler pairs and numeric ranges.
 *
 * Each case is attacked three ways and checked after each:
 *   1. verifyEdits alone with a hostile edit list (model and rule sources);
 *   2. faithfulClean with those edits as model edits and as rule edits
 *      (a hostile or buggy rule provider, F06-U11);
 *   3. faithfulClean with no extra edits: the app path (rules only).
 * A fourth path (engine 8) draws from its own PRNG, so paths 1 to 3 replay
 * exactly as before for a given seed and run: one corpus sentence with an
 * invisible character put at a word end or a word start, and the space next
 * to it deleted under every edit type; or a quotation mark put behind a said
 * end mark, and another end mark put behind it. It is checked through the
 * verifier alone and through faithfulClean as model edits.
 *
 * The invariant is defined here, independently of src/meaning.ts: after the
 * accepted edits, no word was added or swapped (only removed, kept, agreed in
 * the closed English table, or spelled as a dictionary term under the F07 7.2
 * rules); every negation, number, mood mark, quotation mark, invisible
 * character, hyphenated word and quoted word that was said is still there;
 * the words read the same with every invisible character left out (engine 8:
 * an invisible character joins or splits nothing a reader sees);
 * no letter lost its mark; no everyday word gained a capital mid-sentence;
 * no end mark was put next to another that was said apart from it (engine 7);
 * and the final character pass (normalizeFinal) changes no letter, number,
 * negation, mood mark or quotation count (R-01 D14 is about traceability).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  applyEdits,
  BETWEEN_MARKS,
  checkEdit,
  compileRules,
  END_MARKS,
  ENGLISH_RULES,
  faithfulClean,
  isInvisible,
  MOOD_CANON,
  protectedSpansFor,
  verifyEdits,
  type DictionaryTerm,
  type Edit,
  type EditLevel,
  type EditType,
  type LanguageCode,
  type LanguageRules,
  type ScriptCode,
  type TextRulesPack,
} from '../src';

const SEED = Number(process.env.SCRIBE_FUZZ_SEED ?? 20261015);
const RUNS = Number(process.env.SCRIBE_FUZZ_RUNS ?? 10000);

/* ---------- PRNG (mulberry32, as in verify.fuzz.test.ts) ---------- */

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

/* ---------- languages ---------- */

const DIR = join(__dirname, '../../../packs/text-rules');
const loadPack = (l: LanguageCode) => JSON.parse(readFileSync(join(DIR, `${l}.json`), 'utf8')) as TextRulesPack;
function vetted(l: LanguageCode): TextRulesPack {
  const p = loadPack(l);
  for (const k of ['fillers', 'meaning', 'repeats', 'phonetic'] as const) p[k].review = { status: 'native-reviewed', by: 'test' };
  return p;
}

interface Lang {
  id: string;
  code: LanguageCode;
  pack: TextRulesPack | null;
  script?: ScriptCode;
  level: EditLevel;
  rules: LanguageRules;
  /** Base letters; the generator mutates them. */
  corpus: string[];
  /** The fictional family's names in this script, with the R-01 traps. */
  dict: () => DictionaryTerm[];
  /** Words a hostile edit may swap in. */
  pool: string[];
  /** Negations, from an independent English list or the pack's own protective table. */
  negations: (w: string) => boolean;
  /** Filler words, for the "a filler said as its own sentence takes its end mark" allowance. */
  fillers: Set<string>;
  /** Interjections that mean yes or no, written as one hyphenated word. */
  hyphenated: string[];
  cased: boolean;
  char: boolean;
}

const EN_NEG = new Set(['not', 'no', 'never', 'cannot', 'nobody', 'nothing', 'none', 'nowhere', 'neither', 'nor', 'nope', 'nah']);
const enNeg = (w: string) => EN_NEG.has(w) || w.endsWith("n't");
const packNeg = (p: TextRulesPack) => {
  const s = new Set(p.meaning.negations.map((w) => w.normalize('NFC').toLowerCase()));
  return (w: string) => s.has(w) || p.meaning.negationPrefixes.some((x) => w.startsWith(x)) || p.meaning.negationSuffixes.some((x) => w.endsWith(x));
};
const packFillers = (p: TextRulesPack | null) => new Set([...(p?.fillers.auto ?? []), ...(p?.fillers.suggest ?? [])]);

/** English dictionary pool: every R-01 trap. Fictional family only. */
function enDict(rnd: () => number): DictionaryTerm[] {
  const pick = (p: number) => rnd() < p;
  const out: DictionaryTerm[] = [{ term: 'Asha', kind: 'child', heardAs: pick(0.4) ? ['Usher', 'Asia', 'Usha'] : ['Usher', 'Asia'] }];
  if (pick(0.5)) out.push({ term: 'Usha', kind: 'family', heardAs: [] }); // D13
  if (pick(0.5)) out.push({ term: 'Hope', kind: 'child', heardAs: [] }); // D10
  if (pick(0.5)) out.push({ term: 'Will', kind: 'nickname', heardAs: [] }); // D10
  if (pick(0.3)) out.push({ term: 'May', kind: 'child', heardAs: [] }); // D10 (a modal)
  if (pick(0.3)) out.push({ term: 'Bean', kind: 'nickname', heardAs: [] }); // D10 (a nickname)
  if (pick(0.4)) out.push({ term: 'Mumma', kind: 'family', heardAs: ['mama'] });
  if (pick(0.3)) out.push({ term: 'Noa', kind: 'child', heardAs: ['no'] }); // a heard-as that is a negation
  if (pick(0.3)) out.push({ term: 'Tenzin', kind: 'child', heardAs: ['ten'] }); // a heard-as that is a number
  if (pick(0.2)) out.push({ term: 'Lily', kind: 'child', heardAs: ['mama'] }); // kinship taught to a child
  if (pick(0.3)) out.push({ term: 'Ashu', kind: 'nickname', heardAs: ['ah shoe'] });
  return out;
}

/** Everyday words among the pool's names, per the spec (F06-REQ-008, F07 7.2 rule 4). Independent of src. */
const EVERYDAY = new Set(['hope', 'will', 'may', 'bean', 'mumma', 'mama', 'lily', 'mamá', 'maman', 'mamãe']);
/** Heard-as values that carry meaning on their own (F07 7.2 rule 5). */
const MEANING_HEARD = new Set(['no', 'ten', 'non', 'não', 'नहीं', 'لا', '不']);
const KINSHIP_HEARD = new Set(['mama']);

const EN_CORPUS = [
  'Um, Asha laughed at the the duck today.',
  'I hope you sleep well and we will see the moon.',
  'Tomorrow we may go out, and she ate a bean.',
  'Usher came over and Usha sang to her.',
  'No, she did not cry. I said no.',
  'She counted to ten and then to 1,000.',
  'Did you want more? Uh-uh, she said.',
  'Mm-hmm, Asha nodded, uh, and smiled.',
  'Uh uh, not now, the soup was so-so.',
  'She slept 2 – 3 hours and woke at 3:30.',
  'Asha said ‘um, up’ and Mumma said “uh, no”.',
  'You did it! You crawled all the way to mama.',
  'Hmm, uh-oh, she dropped the café cup.',
  'We were tired, we were really tired, but we went.',
  'Asha said „um, yes“ at the door, then Hope waved.',
  'she walked today it was amazing',
  "Asha's duck is here and it's the bye-bye song.",
];

function makeLangs(): Lang[] {
  const L: Lang[] = [];
  const en = (id: string, level: EditLevel): Lang => ({
    id, code: 'en', pack: null, level, rules: ENGLISH_RULES, corpus: EN_CORPUS, dict: () => [], negations: enNeg,
    fillers: new Set(['um', 'umm', 'ummm', 'uh', 'uhh', 'uhm', 'erm', 'er', 'hmm', 'hmmm']), // "mm" is offered, never removed (D-112)
    hyphenated: ['uh-uh', 'mm-hmm', 'uh-oh', 'so-so', 'bye-bye', 'mm-mm'],
    pool: ['not', "n't", 'never', 'no', 'was', 'were', 'could', 'would', 'Asha', 'Usha', 'Hope', 'Will', 'May', 'two', 'ten', 'happy', 'the', 'and', "we're"],
    cased: true, char: false,
  });
  L.push(en('en-clean', 'clean'), en('en-clean', 'clean'), en('en-clean', 'clean'), en('en-verbatim', 'verbatim'));
  const latin = (code: 'es' | 'fr' | 'pt', mode: 'shipped' | 'vetted', corpus: string[], kin: string, no: string, hy: string[], pool: string[]): Lang => {
    const pack = mode === 'vetted' ? vetted(code) : loadPack(code);
    return {
      id: `${code}-${mode}`, code, pack, level: mode === 'vetted' ? 'clean' : 'verbatim', rules: compileRules(code, pack), corpus,
      dict: () => [
        { term: 'Asha', kind: 'child', heardAs: ['Usher', 'Usha'] },
        { term: 'Usha', kind: 'family', heardAs: [] },
        { term: kin, kind: 'self', heardAs: [] },
        { term: 'Noa', kind: 'nickname', heardAs: [no] },
      ],
      negations: packNeg(pack), fillers: packFillers(pack), hyphenated: hy, pool, cased: true, char: false,
    };
  };
  const ES = ['Em, Asha se rió con el pato.', '¿Quieres más? Uh-uh, dijo Asha.', 'No, ella no lloró. Dije no.', 'Usher vino y Usha cantó.', 'Durmió 2 – 3 horas, ¡qué bien!', 'Asha dijo «em, no» y su mamá rió.', 'Lo hago si quieres, papá.', 'Asha dijo ‘um, sí’ a las 3:30.'];
  const FR = ['Euh, Asha a ri avec le canard.', 'Tu en veux encore ? Hum-hum, dit Asha.', 'Non, elle n’a pas pleuré. J’ai dit non.', 'Usher est venu et Usha a chanté.', 'Elle a dormi 2 – 3 heures !', 'Asha a dit « euh, non » et sa maman a ri.', 'Asha a été sage.', 'Asha a dit ‘euh, oui’ à 3:30.'];
  const PT = ['Hã, Asha riu com o pato.', 'Quer mais? Hum-hum, disse Asha.', 'Não, ela não chorou. Eu disse não.', 'Usher veio e Usha cantou.', 'Dormiu 2 – 3 horas!', 'Asha disse «hum, não» e a mamãe riu.', 'Asha abraçou a avó.', 'Te dou um beijo às 3:30.'];
  for (const mode of ['shipped', 'vetted'] as const) {
    L.push(latin('es', mode, ES, 'Mamá', 'no', ['uh-uh'], ['no', 'nunca', 'Asha', 'Usha', 'dos', 'feliz', 'el', 'y']));
    L.push(latin('fr', mode, FR, 'Maman', 'non', ['hum-hum'], ['pas', 'non', 'jamais', 'Asha', 'Usha', 'deux', 'heureuse', 'le', 'et']));
    L.push(latin('pt', mode, PT, 'Mamãe', 'não', ['hum-hum'], ['não', 'nunca', 'Asha', 'Usha', 'dois', 'feliz', 'o', 'e']));
  }
  const other = (code: 'hi' | 'ar' | 'zh', mode: 'shipped' | 'vetted', corpus: string[], dict: DictionaryTerm[], pool: string[], script?: ScriptCode): Lang => {
    const pack = mode === 'vetted' ? vetted(code) : loadPack(code);
    return {
      id: `${code}-${mode}`, code, pack, script, level: mode === 'vetted' ? 'clean' : 'verbatim', rules: compileRules(code, pack, script ? { script } : {}), corpus,
      dict: () => dict, negations: packNeg(pack), fillers: packFillers(pack), hyphenated: [], pool, cased: false, char: code === 'zh',
    };
  };
  const HI = ['उम, आशा आज बहुत हँसी।', 'मेरी प्यारी बेटी सो गई।', 'मैं नहीं जाऊंगा।', 'आसा आज आई और उषा ने गाना गाया।', 'उसे मत उठाओ, वह सो रही है।', 'क्या तुमने चाँद देखा?', 'आशा ने दो दाँत दिखाए!', 'Papa sang “आशा, सो जा” and she slept.'];
  const AR = ['امم، آشا نامت مبكرا.', 'أنتِ جميلة جدا.', 'هل نامت آشا؟', 'لا، لم تبك.', 'اوشا جاءت اليوم وأوشا غنت.', 'كَتَبَ الولد رسالة!', 'قالت آشا «امم، لا» وضحكت.', 'نامت 2 – 3 ساعات.'];
  const ZH = ['呃，阿莎今天笑了。', '她睡了。', '你做到了！', '阿沙今天来了，乌莎唱歌了。', '阿莎说「呃，不要」。', '她不哭，没有哭。', '她睡了吗？', '阿莎说“呃，好”。'];
  for (const mode of ['shipped', 'vetted'] as const) {
    L.push(other('hi', mode, HI, [{ term: 'आशा', kind: 'child', heardAs: ['आसा', 'उषा'] }, { term: 'उषा', kind: 'family', heardAs: [] }, { term: 'नेहा', kind: 'nickname', heardAs: ['नहीं'] }], ['नहीं', 'मत', 'था', 'थी', 'आशा', 'उषा', 'दो', 'खुश']));
    L.push(other('ar', mode, AR, [{ term: 'آشا', kind: 'child', heardAs: ['اوشا', 'أوشا'] }, { term: 'أوشا', kind: 'family', heardAs: [] }, { term: 'لانا', kind: 'nickname', heardAs: ['لا'] }], ['لا', 'لم', 'ما', 'آشا', 'أوشا', 'اثنان', 'سعيدة']));
    L.push(other('zh', mode, ZH, [{ term: '阿莎', kind: 'child', heardAs: ['阿沙', '乌莎'] }, { term: '乌莎', kind: 'family', heardAs: [] }, { term: '布布', kind: 'nickname', heardAs: ['不'] }], ['不', '没', '了', '阿莎', '乌莎', '两', '开心'], 'Hans'));
  }
  return L;
}

/* ---------- the oracle: independent definitions ---------- */

const WORD = /[\p{L}\p{N}][\p{L}\p{M}\p{N}]*(?:[\u200C\u200D]+[\p{L}\p{M}\p{N}]+|['’][\p{L}\p{M}\p{N}]+)*/gu;
const HAN = /\p{Script=Han}/u;
const WORDISH = /[\p{L}\p{M}\p{N}]/u;
const lw = (s: string) => s.normalize('NFC').toLowerCase().replace(/’/g, "'");

interface Tok { w: string; lw: string; start: number; end: number }
function toks(text: string, char: boolean): Tok[] {
  const out: Tok[] = [];
  for (const m of text.matchAll(WORD)) {
    const start = m.index!;
    if (char && HAN.test(m[0])) {
      // Every Han character is its own word; marks ride with the one before.
      let i = 0;
      for (const ch of m[0]) {
        if (/\p{M}/u.test(ch) && out.length) {
          out[out.length - 1].w += ch;
          out[out.length - 1].end += ch.length;
        } else out.push({ w: ch, lw: lw(ch), start: start + i, end: start + i + ch.length });
        i += ch.length;
      }
    } else out.push({ w: m[0], lw: lw(m[0]), start, end: start + m[0].length });
  }
  return out;
}

// With the verifier's own table added, so a combined mark the generator writes ("‽", "⁉", U+2E2E) is a mood mark here too.
const MOOD: Record<string, string> = { ...MOOD_CANON, '?': '?', '？': '?', '؟': '?', '!': '!', '！': '!', '¿': '¿', '¡': '¡' };
const moodOf = (s: string) => [...s].map((c) => MOOD[c] ?? '').join('');
/** With paired openers (Spanish), an added ¿ or ¡ that pairs with its ? or ! is a repair; one is never removed. */
const pairs = (lang: Lang) => lang.pack?.punctuation.pairOpeners === true && lang.pack.punctuation.review.status !== 'draft';
const mood = (s: string, lang?: Lang) => (lang && pairs(lang) ? moodOf(s).replace(/[¿¡]/g, '') : moodOf(s));
const openers = (s: string) => [...s].filter((c) => c === '¿' || c === '¡').length;
const QUOTE = /\p{Quotation_Mark}/u;
/**
 * Marks that double as an apostrophe: between two word characters ("don’t",
 * "Asha's") they quote nothing. Every other quotation mark counts wherever it
 * stands: 「 between two characters (说「呃) is still a quotation mark, so a
 * space put before it moves no mark (seed 20261003 run 8161, 18 Oct).
 */
const APOSTROPHE_LIKE = new Set(["'", '’', '‛', '＇']);
/** The quotation marks in order (tests-lens review Note A, 23 Oct): a swap of one mark for another is a change, not only a count. */
const quoteMarks = (s: string) => [...s].filter((c, i, a) => QUOTE.test(c) && !(APOSTROPHE_LIKE.has(c) && WORDISH.test(a[i - 1] ?? '') && WORDISH.test(a[i + 1] ?? ''))).join('');
/** The house rule may straighten curly quotes (D14, D-112 item 1) and nothing else: compare the final text after that one mapping. */
const houseQuotes = (s: string) => s.replace(/[“”„‟″]/g, '"').replace(/[‘’‚‛′]/g, "'");
const INVISIBLE = /[\p{Default_Ignorable_Code_Point}\p{Bidi_Control}]/u;
const invisibles = (s: string) => [...s].filter((c) => INVISIBLE.test(c)).join('');
/** The text as a reader sees it: every invisible character left out (engine 8). */
const seen = (s: string) => [...s].filter((c) => !INVISIBLE.test(c)).join('');
const DIGITS = /\p{N}+(?:[.,:/٫٬]\p{N}+)*/gu;
const digits = (s: string) => [...s.matchAll(DIGITS)].map((m) => m[0]).join('|');
const HYPHENATED = /[\p{L}\p{N}][\p{L}\p{M}\p{N}]*(?:[-\u2010\u2011][\p{L}\p{M}\p{N}]+)+/gu;
const hyphenated = (s: string) => [...s.matchAll(HYPHENATED)].map((m) => lw(m[0]));
const lettersOnly = (s: string) => s.normalize('NFC').replace(/[^\p{L}\p{M}\p{N}]/gu, '').toLowerCase();
/**
 * End marks that touch the end mark before them, counted ("?." is 1, "..." is 2): only spaces, quotation
 * marks and invisible characters may sit between (engine 7, #179 re-check Note E: "more?."
 * and "她睡了？." were accepted). The sets are the verifier's own, imported (END_MARKS, BETWEEN_MARKS, the
 * language's sentence ends and quotation marks), so the oracle is never narrower than the verifier: the
 * copy written out here lacked U+2E2E, U+203A and the opening quotes (#249 review B-N3). Every Unicode
 * quotation mark is between too, by the oracle's own QUOTE (engine 8; #257 review A, section 1: engine 7
 * accepted a "." behind U+2018 and 14 other marks). A closing bracket is not between, as in the verifier:
 * "We went home (it rained!)." keeps its own "." (#249 review F1, N1).
 */
const isEnd = (c: string, R: LanguageRules) => END_MARKS.includes(c) || R.isSentenceEnd(c);
const betweenEnds = (c: string, R: LanguageRules) =>
  /\s/u.test(c) || BETWEEN_MARKS.includes(c) || QUOTE.test(c) || INVISIBLE.test(c) || isInvisible(c) || R.isQuoteChar(c);
function touchingEnds(s: string, R: LanguageRules): number {
  let n = 0;
  let open = false;
  for (const c of s) {
    if (isEnd(c, R)) {
      if (open) n++;
      open = true;
    } else if (!betweenEnds(c, R)) open = false;
  }
  return n;
}
/** Every end mark the verifier knows (END_MARKS, imported): U+203D, U+2E2E, U+061F, the danda, U+3002, U+FF01, U+FF1F, U+2026 among them. */
const cpAt = (s: string, i: number) => (i < s.length ? String.fromCodePoint(s.codePointAt(i)!) : '');
/** Where the end marks of `s` start, in UTF-16 units. */
function endsAt(s: string): number[] {
  const out: number[] = [];
  let i = 0;
  for (const c of s) {
    if (END_MARKS.includes(c)) out.push(i);
    i += c.length;
  }
  return out;
}

const OPEN_CLOSE: Record<string, string> = { '“': '”', '‘': '’', '„': '“”', '«': '»', '「': '」', '『': '』', '"': '"' };
/** Quoted speech: an opening mark that is not inside a word, to the next mark that may close it. */
function quoted(s: string): Array<{ start: number; end: number }> {
  const out: Array<{ start: number; end: number }> = [];
  for (let i = 0; i < s.length; i++) {
    const close = OPEN_CLOSE[s[i]];
    if (!close || WORDISH.test(s[i - 1] ?? '')) continue;
    for (let j = i + 1; j < s.length; j++) {
      if (close.includes(s[j]) && !(WORDISH.test(s[j - 1]) && WORDISH.test(s[j + 1] ?? ''))) {
        out.push({ start: i, end: j + 1 });
        i = j;
        break;
      }
    }
  }
  return out;
}

const AGREE: string[][] = [['is', 'are', 'am'], ['was', 'were'], ['has', 'have'], ['do', 'does'], ['go', 'goes'], ["isn't", "aren't"], ["wasn't", "weren't"], ["hasn't", "haven't"], ["doesn't", "don't"], ['a', 'an']];
const agrees = (a: string, b: string) => AGREE.some((g) => g.includes(a) && g.includes(b));

/** May the raw words `span` become dictionary term `d`? The F07 7.2 rules, written out again here. */
function mayBecome(span: Tok[], d: DictionaryTerm, dict: DictionaryTerm[], char = false): boolean {
  const text = lw(span.map((t) => t.w).join(char ? '' : ' '));
  const others = dict.filter((x) => lw(x.term) !== lw(d.term));
  if (others.some((x) => lw(x.term) === text || x.heardAs.some((h) => lw(h) === text))) return false; // D13
  if (span.some((t) => others.some((x) => lw(x.term) === t.lw))) return false; // another name inside it
  if (text === lw(d.term)) return !EVERYDAY.has(text); // D10: case-only fix of an everyday word
  if (d.heardAs.some((h) => lw(h) === text)) {
    if (MEANING_HEARD.has(text)) return false;
    if (KINSHIP_HEARD.has(text)) return d.kind === 'self' || d.kind === 'family';
    return true;
  }
  // A model's near-sounding name: only words the recogniser capitalised, none of them everyday or grammar.
  return span.length <= 3 && span.every((t) => /^\p{Lu}/u.test(t.w) && !EVERYDAY.has(t.lw) && !EN_NEG.has(t.lw) && !['the', 'a', 'and', 'she', 'he', 'i', 'we', 'you'].includes(t.lw));
}

/**
 * Final words are raw words in order: removed, kept, agreed, or a dictionary
 * term (one or more final words, exactly as the term is spelled) standing for
 * 1 to 3 raw words, or as many as the term has plus one in Chinese.
 */
function faithful(raw: Tok[], fin: Tok[], dict: DictionaryTerm[], english: boolean, char: boolean): boolean {
  const terms = dict.map((d) => ({ d, n: Math.max(1, toks(d.term, char).length), spelled: d.term.normalize('NFC') }));
  const memo = new Map<number, boolean>();
  const go = (i: number, j: number): boolean => {
    if (j === fin.length) return true;
    if (i === raw.length) return false;
    const key = i * 4096 + j;
    const hit = memo.get(key);
    if (hit !== undefined) return hit;
    let ok = go(i + 1, j);
    if (!ok && (raw[i].lw === fin[j].lw || (english && agrees(raw[i].lw, fin[j].lw)))) ok = go(i + 1, j + 1);
    for (const { d, n, spelled } of terms) {
      if (ok) break;
      if (fin.slice(j, j + n).map((t) => t.w.normalize('NFC')).join(char ? '' : ' ') !== spelled) continue;
      for (let k = 1; k <= Math.max(3, n + 1) && !ok && i + k <= raw.length; k++) if (mayBecome(raw.slice(i, i + k), d, dict, char)) ok = go(i + k, j + n);
    }
    memo.set(key, ok);
    return ok;
  };
  return go(0, 0);
}

/** Does a sentence start at `at` in `text`? */
function sentenceStart(text: string, at: number): boolean {
  const before = text.slice(0, at);
  if (/\n\s*$/.test(before)) return true;
  const p = before.replace(/[\s"'“‘„«「『(¿¡]+$/u, '');
  return p === '' || /[.!?。？！؟।॥]["'”’)\]»」』]*$/u.test(p);
}

/** Where raw offset `pos` (an edit start) lands in the edited text. */
function shiftOf(accepted: Edit[], pos: number): number {
  return accepted.filter((e) => e.end <= pos && e.start < pos).reduce((n, e) => n + e.replacement.length - e.original.length, 0);
}

/** Why the accepted edits changed meaning, or null. */
function broken(raw: string, accepted: Edit[], lang: Lang, dict: DictionaryTerm[]): string | null {
  const text = applyEdits(raw, accepted);
  const rt = toks(raw, lang.char);
  const ft = toks(text, lang.char);
  if (!faithful(rt, ft, dict, lang.code === 'en', lang.char)) return 'added_or_swapped_word';
  // The same words as a reader sees them: "Asha" U+200B " slept" may not become "Asha" U+200B "slept" (engine 8;
  // WORD splits at U+200B, so only U+200C and U+200D joins were seen before, seed 20261015 run 81642).
  const [sr, st] = [seen(raw), seen(text)];
  if ((sr !== raw || st !== text) && !faithful(toks(sr, lang.char), toks(st, lang.char), dict, lang.code === 'en', lang.char)) return 'seen_words_changed';
  // Negations: every one said is still there; one said once keeps its count.
  const rn = rt.filter((t) => lang.negations(t.lw)).map((t) => t.lw);
  const fn = ft.filter((t) => lang.negations(t.lw)).map((t) => t.lw);
  if (rn.some((w) => !fn.includes(w))) return 'negation_removed';
  if (new Set(rn).size === rn.length && fn.length !== rn.length) return 'negation_count_changed';
  if (digits(text) !== digits(raw)) return 'number_changed';
  // Mood: only a filler said as its own sentence may take its end mark with it.
  if (openers(text) < openers(raw)) return 'mood_changed';
  for (const e of accepted) {
    if (mood(e.original, lang) === mood(e.replacement, lang)) continue;
    const ws = toks(e.original, lang.char);
    if (!(e.type === 'filler' && e.replacement === '' && ws.length > 0 && ws.every((t) => lang.fillers.has(t.lw)))) return 'mood_changed';
  }
  if (quoteMarks(text) !== quoteMarks(raw)) return 'quotes_changed';
  if (touchingEnds(text, lang.rules) > touchingEnds(raw, lang.rules)) return 'end_mark_doubled';
  const q = quoted(raw);
  for (const e of accepted) {
    if (e.type !== 'punctuation' && e.type !== 'paragraph' && q.some((s) => s.start < e.end && e.start < s.end)) return 'quoted_words_edited';
  }
  if (invisibles(text) !== invisibles(raw)) return 'invisible_changed';
  const hyRaw = hyphenated(raw);
  const hyFin = hyphenated(text);
  for (const h of new Set(hyRaw)) if (hyFin.filter((x) => x === h).length < hyRaw.filter((x) => x === h).length) return 'hyphenated_word_cut';
  if (/(^|[^\p{L}\p{N}\p{M}\u200C\u200D])\p{M}/u.test(text) && !/(^|[^\p{L}\p{N}\p{M}\u200C\u200D])\p{M}/u.test(raw)) return 'orphan_mark';
  // Names: every name fix follows the F07 7.2 rules; no capital lands mid-sentence on an everyday word.
  for (const e of accepted) {
    if (e.type === 'stt_fix') {
      const d = dict.find((x) => x.term.normalize('NFC') === e.replacement.trim().normalize('NFC'));
      if (!d || !mayBecome(toks(e.original, lang.char), d, dict, lang.char)) return 'name_fix_not_allowed';
    }
    if (e.type === 'punctuation' && lang.cased) {
      const a = toks(e.original, false);
      const b = toks(e.replacement, false);
      for (let k = 0; k < Math.min(a.length, b.length); k++) {
        if (a[k].w === b[k].w || a[k].w[0] === b[k].w[0] || b[k].w[0] !== b[k].w[0].toUpperCase()) continue;
        const at = e.start + shiftOf(accepted, e.start) + b[k].start;
        if (!sentenceStart(text, at) && !/^i(?:'|’|$)/.test(a[k].lw)) return 'capital_mid_sentence';
      }
    }
  }
  return null;
}

/**
 * The final character pass may tidy marks, never meaning (R-01 D14 is
 * traceability only). Compared with the edited text trimmed, as F06-REQ-016
 * defines final_text (JavaScript's trim also drops a leading or trailing U+FEFF).
 */
function brokenFinal(editedRaw: string, final: string, lang: Lang): string | null {
  const edited = editedRaw.trim();
  if (lettersOnly(final) !== lettersOnly(edited)) return 'final_changed_letters';
  // Words, not letters only (tests-lens review Note B, 23 Oct): "we're" to "were" keeps the letters and changes the word.
  const words = (s: string) => toks(houseQuotes(s).normalize('NFC'), lang.char).map((t) => t.lw).join(' ');
  if (words(final) !== words(edited)) return 'final_changed_words';
  if (digits(final) !== digits(edited)) return 'final_changed_numbers';
  if (moodOf(final) !== moodOf(edited)) return 'final_changed_mood';
  if (quoteMarks(houseQuotes(final)) !== quoteMarks(houseQuotes(edited))) return 'final_changed_quotes';
  if (invisibles(final) !== invisibles(edited)) return 'final_changed_invisible';
  const neg = (s: string) => toks(s, lang.char).filter((t) => lang.negations(t.lw)).map((t) => t.lw).join('|');
  if (neg(final) !== neg(edited)) return 'final_changed_negation';
  return null;
}

/* ---------- the generator ---------- */

// U+00AD (soft hyphen) joined on review (#179 N3, 23 Oct): the house rule used to drop it with no stored edit.
const INVIS = ['\u200E', '\u200F', '\u202E', '\u200B', '\u200C', '\u200D', '\u2066', '\u061C', '\uFEFF', '\u00AD'];
const QUOTES: Array<[string, string]> = [['“', '”'], ['‘', '’'], ['„', '“'], ['«', '»'], ['「', '」'], ['"', '"']];
const MOODS = [...new Set(['?', '!', '？', '！', '؟', '¿', '¡', '.', '。', '।', '?!', ...END_MARKS])];
const MARKS = ['́', '̀', '̂', '̈', 'ा', 'ि', 'े', '्', 'ं', 'َ', 'ُ', 'ِ'];

/** A synthetic letter: one to three corpus sentences, mutated. */
function letter(lang: Lang, rnd: () => number): string {
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
  let raw = Array.from({ length: 1 + Math.floor(rnd() * 3) }, () => pick(lang.corpus)).join(' ');
  const t = toks(raw, lang.char);
  if (t.length && rnd() < 0.3) {
    const w = pick(t); // an invisible right after a word (D4 as said by the recogniser)
    raw = raw.slice(0, w.end) + pick(INVIS) + raw.slice(w.end);
  }
  if (t.length > 2 && rnd() < 0.2) {
    const w = pick(t.slice(1)); // a hyphenated yes or no, or a spaced filler pair, before a word
    const hy = lang.hyphenated.length ? pick([...lang.hyphenated, 'uh uh', 'mm hmm']) : '';
    if (hy && lang.code === 'en') raw = `${raw.slice(0, w.start)}${hy}, ${raw.slice(w.start)}`;
  }
  const ends = endsAt(raw);
  if (ends.length && rnd() < 0.25) {
    const at = pick(ends); // a said end mark in another script, as a recogniser may write it ("‽", U+2026, U+061F in English)
    raw = raw.slice(0, at) + pick(END_MARKS) + raw.slice(at + cpAt(raw, at).length);
  }
  return raw;
}

const TYPES: EditType[] = ['filler', 'false_start', 'repeat', 'stt_fix', 'punctuation', 'agreement', 'paragraph'];

/** The hostile proposer: random edits of every R-01 shape, plus honest repairs. */
function hostile(raw: string, lang: Lang, dict: DictionaryTerm[], rnd: () => number, tally: Map<string, number>): Edit[] {
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
  const t = toks(raw, lang.char);
  const out: Edit[] = [];
  const mk = (kind: string, type: EditType, start: number, end: number, replacement: string): void => {
    tally.set(kind, (tally.get(kind) ?? 0) + 1);
    out.push({ type, start, end, original: raw.slice(start, end), replacement, source: rnd() < 0.25 ? 'rule' : 'model' });
  };
  const n = 1 + Math.floor(rnd() * 6);
  for (let k = 0; k < n && t.length; k++) {
    const w = pick(t);
    const i = t.indexOf(w);
    const last = t[Math.min(t.length - 1, i + Math.floor(rnd() * 3))];
    const type = pick(TYPES);
    switch (Math.floor(rnd() * 19)) {
      case 0: mk('swap_word', type, w.start, last.end, pick(lang.pool)); break;
      case 1: mk('negation', type, w.start, w.end, rnd() < 0.5 ? `${w.w}n't` : `${pick(lang.pool)} ${w.w}`); break;
      case 2: { const at = w.start + 1 + Math.floor(rnd() * Math.max(1, w.w.length - 1)); mk('apostrophe', pick(['punctuation', type]), at, at, "'"); break; }
      case 3: if (i + 1 < t.length) mk('join', 'punctuation', w.end, t[i + 1].start, ''); break;
      case 4: { const m = /[.!?。？！؟।]/u.exec(raw.slice(w.end)); const at = m ? w.end + m.index : w.end; mk('mood', 'punctuation', at, m ? at + 1 : at, pick(MOODS)); break; }
      case 5: { const [o, c] = pick(QUOTES); mk('quote', pick(['punctuation', type]), w.start, last.end, `${o}${raw.slice(w.start, last.end)}${c}`); break; }
      case 6: { const at = w.start + Math.floor(rnd() * w.w.length); const ch = raw[at]; mk('case_flip', 'punctuation', at, at + 1, ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase()); break; }
      case 7: mk('delete', pick(['filler', 'repeat', 'false_start']), w.start, t[i + 1]?.start ?? last.end, ''); break;
      case 8: mk('to_term', 'stt_fix', w.start, last.end, pick(dict).term); break; // D13 and D10 shapes
      case 9: { const a = Math.floor(rnd() * raw.length); mk('char_span', type, a, Math.min(raw.length, a + Math.floor(rnd() * 6)), pick(['', ' ', '.', ',', pick(lang.pool)])); break; }
      case 10: { const at = rnd() < 0.5 ? w.end : w.start + Math.floor(rnd() * (w.end - w.start + 1)); mk('invisible', pick(['punctuation', 'paragraph', type]), at, at, pick(INVIS)); break; } // D4
      case 11: { // D6: a part or all of a hyphenated word, or a spaced filler pair
        const m = [...raw.matchAll(/[\p{L}]+(?:-[\p{L}]+)+|\b(?:uh uh|mm hmm|Uh uh|Mm hmm)\b/gu)];
        if (m.length) { const h = pick(m); const cut = rnd() < 0.5 ? h[0].length : h[0].indexOf(h[0].includes('-') ? '-' : ' '); mk('hyphen_part', pick(['filler', 'repeat', 'false_start']), h.index!, h.index! + Math.max(1, cut), ''); }
        break;
      }
      case 12: { // D10: an everyday word in lowercase to the dictionary term spelled like it
        const d = dict.find((x) => EVERYDAY.has(lw(x.term)) && t.some((y) => y.lw === lw(x.term) && y.w !== x.term));
        const y = d && t.find((z) => z.lw === lw(d.term) && z.w !== d.term);
        if (d && y) mk('name_word_case', pick(['stt_fix', 'punctuation']), y.start, y.end, d.term);
        break;
      }
      case 13: { // D13: one family name to another
        const a = dict.find((x) => t.some((y) => y.lw === lw(x.term)));
        const y = a && t.find((z) => z.lw === lw(a.term));
        const b = a && dict.find((x) => x !== a);
        if (y && b) mk('name_swap', 'stt_fix', y.start, y.end, b.term);
        break;
      }
      case 14: { // D3: add, drop or swap a combining mark
        const m = [...w.w.matchAll(/\p{M}/gu)];
        if (m.length && rnd() < 0.6) { const at = w.start + pick(m).index!; mk('mark_swap', pick(['punctuation', type]), at, at + 1, rnd() < 0.5 ? '' : pick(MARKS)); }
        else mk('mark_add', pick(['punctuation', type]), w.end, w.end, pick(MARKS));
        break;
      }
      case 15: if (lang.code === 'en') mk('noun_number', 'agreement', w.start, w.end, w.w.endsWith('s') ? w.w.slice(0, -1) : `${w.w}s`); break; // D9
      case 16: mk('heard_as', 'stt_fix', w.start, w.end, pick(dict).term); break;
      case 17: { // engine 7: any end mark the verifier knows, put before or after one already said, or behind its closers
        const ends = endsAt(raw);
        if (!ends.length) break;
        let at = pick(ends);
        const where = Math.floor(rnd() * 3);
        if (where > 0) at += cpAt(raw, at).length;
        if (where > 1) for (let c = cpAt(raw, at); c && betweenEnds(c, lang.rules); c = cpAt(raw, at)) at += c.length;
        const mark = pick(END_MARKS);
        tally.set(`mark ${mark}`, (tally.get(`mark ${mark}`) ?? 0) + 1);
        mk('mark_pair', pick(['punctuation', type]), at, at, mark);
        break;
      }
      default: // honest repairs, so the verifier has something to accept
        if (rnd() < 0.5) mk('honest_period', 'punctuation', raw.trimEnd().length, raw.trimEnd().length, lang.code === 'zh' ? '。' : '.');
        else if (/^\p{Ll}/u.test(raw)) mk('honest_case', 'punctuation', 0, 1, raw[0].toUpperCase());
        else if (lang.fillers.has(w.lw)) mk('honest_filler', 'filler', w.start, t[i + 1]?.start ?? w.end, '');
    }
  }
  return out;
}

/* ---------- path 4: invisible characters and quotation marks at boundaries (engine 8) ---------- */

/**
 * The invisible characters path 4 puts at a word edge: the ten the generator writes, U+2060 (the
 * eleven of #257 review A, section 2), and more of the class: the Mongolian vowel separator, three
 * invisible operators, a deprecated format character, an embedding and its pop, two isolates, a
 * musical format character and a language tag outside the BMP.
 */
const INVIS_AT_EDGE = [
  ...INVIS, '\u2060', '\u180E', '\u2061', '\u2062', '\u2063', '\u206F', '\u202A', '\u202C', '\u2067', '\u2069', '\u{1D173}', '\u{E0001}',
];
/** Every Unicode quotation mark (all in the BMP), from Unicode itself, not from the verifier. */
const ALL_QUOTES: string[] = [];
for (let cp = 0; cp <= 0xffff; cp++) if ((cp < 0xd800 || cp > 0xdfff) && QUOTE.test(String.fromCodePoint(cp))) ALL_QUOTES.push(String.fromCodePoint(cp));
const hex = (s: string) => `U+${s.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`;

/**
 * One corpus sentence with an invisible character at a word end ("Asha" U+200B " slept") or a word
 * start ("Asha " U+200B "slept"), and edits that delete the space beside it: alone, as paragraph or
 * punctuation, and with the next word, as a removal or a name fix. Or, half the time and always where
 * no two words have one space between them (Chinese), a quotation mark put right behind a said end
 * mark, and an end mark put behind that ("no." U+2018 plus ".") or the two swapped.
 */
function edgeCase(lang: Lang, dict: DictionaryTerm[], rnd: () => number, tally: Map<string, number>): { raw: string; edits: Edit[] } | null {
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
  const base = pick(lang.corpus);
  const t = toks(base, lang.char);
  const gaps = t.slice(0, -1).map((w, i) => i).filter((i) => base.slice(t[i].end, t[i + 1].start) === ' ');
  const edits: Edit[] = [];
  const mk = (raw: string, type: EditType, start: number, end: number, replacement: string) =>
    edits.push({ type, start, end, original: raw.slice(start, end), replacement, source: 'model' });
  if (gaps.length && rnd() < 0.5) {
    const i = pick(gaps);
    const inv = pick(INVIS_AT_EDGE);
    const side = rnd() < 0.5 ? 'end' : 'start';
    const raw = side === 'end' ? base.slice(0, t[i].end) + inv + base.slice(t[i].end) : base.slice(0, t[i + 1].start) + inv + base.slice(t[i + 1].start);
    const space = side === 'end' ? t[i].end + inv.length : t[i].end;
    const next = t[i + 1].end + inv.length;
    const type = pick(['paragraph', 'punctuation'] as const);
    tally.set(`edge ${hex(inv)} ${side} ${type}`, (tally.get(`edge ${hex(inv)} ${side} ${type}`) ?? 0) + 1);
    mk(raw, type, space, space + 1, '');
    const other = pick(['filler', 'repeat', 'false_start', 'stt_fix'] as const);
    if (other === 'stt_fix' && dict.length) mk(raw, other, space, next, pick(dict).term);
    else if (other !== 'stt_fix') mk(raw, other, space, next, '');
    return { raw, edits };
  }
  const ends = endsAt(base);
  if (!ends.length) return null;
  const at = pick(ends) + 1;
  const q = pick(ALL_QUOTES);
  const raw = base.slice(0, at) + q + base.slice(at);
  tally.set(`behind ${hex(q)}`, (tally.get(`behind ${hex(q)}`) ?? 0) + 1);
  if (rnd() < 0.7) mk(raw, pick(['punctuation', 'punctuation', 'paragraph', 'filler'] as const), at + 1, at + 1, pick(END_MARKS));
  else if (raw[at + 1] !== undefined && END_MARKS.includes(raw[at + 1])) mk(raw, 'punctuation', at, at + 2, raw[at + 1] + q); // "no." q "." to "no.." q
  else mk(raw, 'punctuation', at - 1, at + 1, q + raw[at - 1]); // the said mark moved behind the quotation mark
  return { raw, edits };
}

/* ---------- the property ---------- */

describe('[F06-REQ-021] zero accepted meaning changes: R-01 launch gate property', () => {
  it(`[F06-REQ-021] ${RUNS} synthetic letters (seed ${SEED}), seven languages, three attack paths each and a fourth at word and mark edges, zero meaning changes`, async () => {
    const rnd = mulberry32(SEED);
    const langs = makeLangs();
    const tally = new Map<string, number>();
    const perLang = new Map<string, number>();
    const appliedByType = new Map<string, number>();
    let proposed = 0;
    let accepted = 0;
    let rulesApplied = 0;
    // Path 4's own stream: paths 1 to 3 draw exactly what they drew before engine 8, so an old seed and run replay as reported.
    const rnd4 = mulberry32(SEED ^ 0x5bd1e995);
    let edgeAccepted = 0;
    const fail = (run: number, path: string, why: string, raw: string, text: string, edits: Edit[]) => {
      throw new Error(`seed ${SEED} run ${run} (${path}): ${why}\nraw:   ${JSON.stringify(raw)}\ntext:  ${JSON.stringify(text)}\nedits: ${JSON.stringify(edits)}`);
    };

    for (let run = 0; run < RUNS; run++) {
      // Hand the worker back to vitest now and then: one synchronous call longer than 60 s fails the run with
      // "Timeout calling onTaskUpdate" although every case passed (80,000 runs, about 100 s, 23 Oct).
      if (run % 2000 === 1999) await new Promise<void>((resolve) => setImmediate(resolve));
      const lang = langs[Math.floor(rnd() * langs.length)];
      perLang.set(lang.id, (perLang.get(lang.id) ?? 0) + 1);
      const dict = lang.code === 'en' ? enDict(rnd) : lang.dict();
      const level: EditLevel = rnd() < 0.8 ? lang.level : lang.level === 'clean' ? 'verbatim' : 'clean';
      const raw = letter(lang, rnd);
      const edits = hostile(raw, lang, dict, rnd, tally);
      proposed += edits.length;
      const R = lang.rules;
      const opts = { level, dictionary: dict, language: lang.code, pack: lang.pack, script: lang.script };

      // 1. The verifier alone.
      const ctx = { raw, level, dictionary: dict, protectedSpans: protectedSpansFor(raw, dict, [], R), rules: R };
      const v = verifyEdits(edits, ctx);
      accepted += v.accepted.length;
      for (const e of v.accepted) if (checkEdit(e, ctx) !== null) fail(run, 'verifier', 'accepted_edit_fails_checkEdit', raw, '', [e]);
      const why1 = broken(raw, v.accepted, lang, dict);
      if (why1) fail(run, 'verifier', why1, raw, applyEdits(raw, v.accepted), v.accepted);

      // 2. The pipeline, with the hostile edits as a model and as a rule provider.
      const models = edits.filter((e) => e.source === 'model');
      const ruleOnes = edits.filter((e) => e.source === 'rule');
      const p = faithfulClean(raw, { ...opts, modelEdits: models, ruleEdits: ruleOnes });
      const why2 = broken(raw, p.applied, lang, dict) ?? brokenFinal(applyEdits(raw, p.applied), p.text, lang);
      if (why2) fail(run, 'pipeline', why2, raw, p.text, p.applied);

      // 3. The app path: rules only.
      const a = faithfulClean(raw, opts);
      rulesApplied += a.applied.length;
      for (const e of a.applied) appliedByType.set(e.type, (appliedByType.get(e.type) ?? 0) + 1);
      const why3 = broken(raw, a.applied, lang, dict) ?? brokenFinal(applyEdits(raw, a.applied), a.text, lang);
      if (why3) fail(run, 'rules', why3, raw, a.text, a.applied);

      // 4. Invisible characters and quotation marks at boundaries (engine 8), from rnd4.
      const edge = edgeCase(lang, dict, rnd4, tally);
      if (edge) {
        const ctx4 = { ...opts, raw: edge.raw, dictionary: dict, protectedSpans: protectedSpansFor(edge.raw, dict, [], R), rules: R };
        const v4 = verifyEdits(edge.edits, ctx4);
        edgeAccepted += v4.accepted.length;
        for (const e of v4.accepted) if (checkEdit(e, ctx4) !== null) fail(run, 'edge verifier', 'accepted_edit_fails_checkEdit', edge.raw, '', [e]);
        const why4 = broken(edge.raw, v4.accepted, lang, dict);
        if (why4) fail(run, 'edge verifier', why4, edge.raw, applyEdits(edge.raw, v4.accepted), v4.accepted);
        const p4 = faithfulClean(edge.raw, { ...opts, modelEdits: edge.edits });
        const why5 = broken(edge.raw, p4.applied, lang, dict) ?? brokenFinal(applyEdits(edge.raw, p4.applied), p4.text, lang);
        if (why5) fail(run, 'edge pipeline', why5, edge.raw, p4.text, p4.applied);
      }
    }

    // Not vacuous: every language ran, every attack shape was proposed, and honest edits still get through.
    expect(new Set([...perLang.keys()].map((id) => id.slice(0, 2)))).toEqual(new Set(['en', 'es', 'fr', 'pt', 'hi', 'ar', 'zh']));
    for (const kind of ['swap_word', 'negation', 'mood', 'quote', 'delete', 'to_term', 'invisible', 'hyphen_part', 'name_word_case', 'name_swap', 'mark_swap', 'noun_number', 'heard_as', 'mark_pair']) {
      expect(tally.get(kind) ?? 0, kind).toBeGreaterThan(50);
    }
    // Every end mark the verifier knows was put next to a said one (#249 review B-N3), and the list is all sixteen,
    // written out, so a mark dropped from END_MARKS fails here too (#257 review A, section 1, plant P3).
    expect([...END_MARKS].sort()).toEqual(
      ['.', '!', '?', '\u3002', '\uFF01', '\uFF1F', '\u061F', '\u0964', '\u0965', '\u203D', '\u2047', '\u2048', '\u2049', '\u203C', '\u2E2E', '\u2026'].sort(),
    );
    for (const mark of END_MARKS) expect(tally.get(`mark ${mark}`) ?? 0, `mark U+${mark.codePointAt(0)!.toString(16)}`).toBeGreaterThan(RUNS / 1000);
    expect(proposed).toBeGreaterThan(RUNS * 2);
    expect(accepted).toBeGreaterThan(RUNS / 20);
    expect(rulesApplied).toBeGreaterThan(RUNS / 4);
    for (const type of ['filler', 'repeat', 'stt_fix']) expect(appliedByType.get(type) ?? 0, type).toBeGreaterThan(100);
    // Path 4 reached every invisible character at both word edges under both whitespace-carrying types,
    // and every quotation mark behind a said end mark; and it still accepted honest edits.
    for (const inv of INVIS_AT_EDGE) {
      for (const side of ['end', 'start']) {
        for (const type of ['paragraph', 'punctuation']) {
          expect(tally.get(`edge ${hex(inv)} ${side} ${type}`) ?? 0, `edge ${hex(inv)} ${side} ${type}`).toBeGreaterThan(RUNS / 2000);
        }
      }
    }
    for (const q of ALL_QUOTES) expect(tally.get(`behind ${hex(q)}`) ?? 0, `behind ${hex(q)}`).toBeGreaterThan(RUNS / 1000);
    expect(ALL_QUOTES.length).toBe(30);
    expect(edgeAccepted).toBeGreaterThan(RUNS / 50);
    // 100,000 runs took 214 s here on 24 Oct with path 4 (verify.fuzz.test.ts beside it). The nightly job stops at
    // 15 minutes, so this stays under that: a slow runner meets the job's limit, not a shorter one of this test's.
  }, 840_000);

  it('[F06-REQ-021] the oracle itself catches each R-01 meaning change (checker sanity)', () => {
    const en = makeLangs()[0];
    const dict: DictionaryTerm[] = [
      { term: 'Asha', kind: 'child', heardAs: ['Usha'] },
      { term: 'Usha', kind: 'family', heardAs: [] },
      { term: 'Hope', kind: 'child', heardAs: [] },
      { term: 'Noa', kind: 'child', heardAs: ['no'] },
    ];
    const at = (raw: string, original: string, replacement: string, type: EditType = 'punctuation'): Edit[] => {
      const start = raw.indexOf(original);
      return [{ type, start, end: start + original.length, original, replacement, source: 'model' }];
    };
    const b = (raw: string, e: Edit[]) => broken(raw, e, en, dict);
    expect(b('Uh-uh, she said.', at('Uh-uh, she said.', 'Uh-uh, ', '', 'filler'))).toBe('hyphenated_word_cut'); // D6
    expect(b('I hope so.', at('I hope so.', 'hope', 'Hope', 'stt_fix'))).toBe('name_fix_not_allowed'); // D10
    expect(b('I hope so.', at('I hope so.', 'h', 'H'))).toBe('capital_mid_sentence'); // D10 via punctuation
    expect(b('Usha came.', at('Usha came.', 'Usha', 'Asha', 'stt_fix'))).toBe('added_or_swapped_word'); // D13: Usha may not stand for Asha
    expect(b('I said no.', at('I said no.', 'no', 'Noa', 'stt_fix'))).toBe('added_or_swapped_word'); // a heard-as that is a negation
    expect(b('I am not sad.', at('I am not sad.', 'not ', '', 'filler'))).toBe('negation_removed');
    expect(b('Asha slept.', at('Asha slept.', 'slept', 'slept\u200F'))).toBe('invisible_changed'); // D4
    expect(b('She said ‘um, up’ now.', at('She said ‘um, up’ now.', 'um, ', '', 'filler'))).toBe('quoted_words_edited'); // D7
    expect(b('We saw the dogs.', at('We saw the dogs.', 'dogs', 'dog', 'agreement'))).toBe('added_or_swapped_word'); // D9
    expect(b('You did it.', at('You did it.', '.', '？'))).toBe('mood_changed'); // D5
    expect(b('She slept 2 hours.', at('She slept 2 hours.', '2 ', '', 'filler'))).toBe('number_changed');
    expect(b('We went to the café.', at('We went to the café.', 'café', 'cafe'))).toBe('added_or_swapped_word'); // D3
    expect(brokenFinal('She slept 2 – 3 hours.', 'She slept 2, 3 hours.', en)).toBeNull(); // letters and digit groups alike: the range rule is checked in regression/en
    expect(b('Um, Asha slept.', at('Um, Asha slept.', 'Um, ', '', 'filler'))).toBeNull(); // honest
    expect(b('asha slept.', at('asha slept.', 'a', 'A'))).toBeNull(); // honest sentence case
    // Quotation marks between two characters: an apostrophe inside a word is not a quote, 「 always is
    // (seed 20261003 run 8161: a space before 「 was reported as a changed quote).
    const zh = makeLangs().find((l) => l.code === 'zh')!;
    const bz = (raw: string, e: Edit[]) => broken(raw, e, zh, []);
    const said = '阿莎说「呃，不要」。';
    expect(bz(said, [{ type: 'paragraph', start: 3, end: 3, original: '', replacement: ' ', source: 'model' }])).toBeNull(); // whitespace moves no mark
    expect(bz(said, at(said, '「', ''))).toBe('quotes_changed'); // D7: the mark itself may not go
    expect(b("Asha's duck.", at("Asha's duck.", "Asha's", 'Asha’s', 'punctuation'))).toBeNull(); // an apostrophe swap quotes nothing
    expect(b('She said ’up’.', at('She said ’up’.', '’up’', 'up'))).toBe('quotes_changed'); // paired marks around a word are quotes
    // Tests-lens review (23 Oct): a swap of one quotation mark for another is a change (Note A); the final pass may not change a word (Note B).
    expect(b('She said “bau” today.', at('She said “bau” today.', '“bau”', '«bau»'))).toBe('quotes_changed');
    expect(brokenFinal("We're here.", 'Were here.', en)).toBe('final_changed_words');
    expect(brokenFinal('We’re here, “up”.', 'We\'re here, "up".', en)).toBeNull(); // the house rule's straight quotes are allowed
    expect(brokenFinal('She said “bau”.', 'She said «bau».', en)).toBe('final_changed_quotes');
    // Engine 7 (#179 re-check Note E): no end mark next to one already said, whichever mark; the speaker's mark may lose a stray partner.
    const put = (raw: string, mark: string): Edit => ({ type: 'punctuation', start: raw.length, end: raw.length, original: '', replacement: mark, source: 'model' });
    expect(b('Was there more?', [put('Was there more?', '.')])).toBe('end_mark_doubled');
    expect(bz('她睡了？', [put('她睡了？', '.')])).toBe('end_mark_doubled');
    expect(b('Was there more? um', [...at('Was there more? um', ' um', '', 'filler'), put('Was there more? um', '.')])).toBe('end_mark_doubled');
    expect(b('Was there more', [put('Was there more', '.')])).toBeNull();
    expect(b('Was there more?.', at('Was there more?.', '?.', '?'))).toBeNull();
    // Engine 8: words as a reader sees them, and a mark behind any quotation mark (#257 review A, sections 1 and 2).
    const zw = 'Asha\u200B slept well.';
    expect(b(zw, [{ type: 'paragraph', start: 5, end: 6, original: ' ', replacement: '', source: 'model' }])).toBe('seen_words_changed');
    expect(b(zw, at(zw, 'well', 'Well'))).toBe('capital_mid_sentence'); // the seen-words clause adds nothing where no word joins
    const low = 'She said \u201Ano.\u2018';
    expect(b(low, [put(low, '.')])).toBe('end_mark_doubled');
  });
});
