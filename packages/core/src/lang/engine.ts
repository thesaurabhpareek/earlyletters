/**
 * The generic language engine: turns a validated TextRulesPack into the
 * LanguageRules the verifier, the clean rules and the punctuation provider
 * read. One interpreter for every language; English is just the bundled
 * pack. Nothing here evaluates pack content as code: words go into Sets,
 * marks into character classes (escaped), rewrites into escaped literal
 * patterns.
 *
 * Two kinds of table, two kinds of trust (ADR 0014):
 *  - ENABLING tables let the engine change text: fillers, repeats,
 *    agreement, name similarity, punctuation forms, script conversion,
 *    final-character policy. Each is used only when its review status
 *    reaches MIN_STATUS; otherwise the capability is off ("safe mode").
 *  - PROTECTIVE tables only make the verifier refuse more: negations,
 *    modals, number words, function words, pronouns, kinship, quotes.
 *    They are loaded even as drafts, because a draft can at worst cost a
 *    parent one untidy word, never put words in their mouth.
 */
import type { EditLevel } from '../types';
import { normalizeChars, tokens as wordTokens, type Token } from '../text';
import { MOOD_CANON } from '../meaning';
import { ENGLISH_PACK } from './english';
import { languageInfo } from './languages';
import {
  MIN_STATUS,
  statusAtLeast,
  type HousePolicy,
  type LanguageCode,
  type PackScript,
  type ReviewStatus,
  type ScriptCode,
  type TextRulesPack,
} from './types';

/** What the rules may do for this language right now. */
export interface Capabilities {
  /** Remove hesitation sounds (auto list) and offer the suggest list. */
  fillers: boolean;
  /** Remove repeats and false starts. Needs the repeat and meaning tables. */
  removals: boolean;
  /** One-word number/person repairs. */
  agreement: boolean;
  /** Fix a capitalised near-sounding word to a dictionary name. Cased scripts only. */
  nameSimilarity: boolean;
  /** Rule punctuation from the profile: local forms, spacing, inverted openers, terminal mark. */
  punctuation: boolean;
  /** Final-character policy from the pack (otherwise the house rule of normalizeChars). */
  house: boolean;
  /** Convert characters to the author's chosen script (zh Hans/Hant). */
  scriptVariants: boolean;
}

export interface CompileOptions {
  /** The author's chosen script (zh: 'Hans' or 'Hant'). Conversion happens only when this is set. */
  script?: ScriptCode;
}

const HAN = /\p{Script=Han}/u;
const MARK = /\p{M}/u;
const LETTER_MARK = /[\p{L}\p{M}]/u;
const DIGIT_RUN = /\p{N}+(?:[.,:/٫٬]\p{N}+)*/gu;
const BASE_QUOTES = '"“”«»„‟‹›「」『』';
/** Sentence enders the engine always knows, whatever the pack: ASCII, Devanagari danda, full-width and Arabic marks. */
const BASE_SENTENCE_END = '.!?।॥？！؟';
const BASE_CLOSERS = `"'”’)]»」』）`;
const BASE_OPENERS = `"'“‘([«「『（`;

function escapeClass(chars: string): string {
  return chars.replace(/[\\\]\[^-]/g, '\\$&');
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function uniqueChars(...parts: string[]): string {
  return [...new Set([...parts.join('')])].join('');
}

/** A Map of string keys with the longest key length, for longest-match scans. */
class LongestMap {
  readonly map = new Map<string, string>();
  maxLen = 0;
  constructor(entries: Record<string, string> = {}) {
    for (const [k, v] of Object.entries(entries)) {
      const key = k.normalize('NFC');
      this.map.set(key, v);
      this.maxLen = Math.max(this.maxLen, key.length);
    }
  }
  at(s: string, i: number): { value: string; len: number } | null {
    for (let n = Math.min(this.maxLen, s.length - i); n > 0; n--) {
      const v = this.map.get(s.slice(i, i + n));
      if (v !== undefined) return { value: v, len: n };
    }
    return null;
  }
}

function vetted(status: ReviewStatus | undefined, need: ReviewStatus): boolean {
  return status !== undefined && statusAtLeast(status, need);
}

function isDefaultHouse(h: HousePolicy): boolean {
  return h.dashes === 'replace' && h.dashTo === ', ' && h.quotes === 'straight' && h.ellipsis === 'dots' && h.spaces === 'plain';
}

/**
 * normalizeChars with a pack's house policy. With the default policy this
 * is exactly normalizeChars (the engine calls normalizeChars directly then).
 */
export function normalizeCharsWith(input: string, house: HousePolicy): string {
  if (isDefaultHouse(house)) return normalizeChars(input);
  let s = input;
  const comma = house.dashTo;
  const c = escapeRe(comma.trim() || ',');
  if (house.dashes === 'replace') {
    s = s.replace(/(\d)–(\d)/g, '$1-$2');
    s = s.replace(/\s*[—–]+\s*/g, comma);
  }
  if (house.quotes === 'straight') {
    s = s.replace(/[‘’′]/g, "'");
    s = s.replace(/[“”″]/g, '"');
  }
  if (house.ellipsis === 'dots') s = s.replace(/…/g, '...');
  if (house.spaces === 'plain') s = s.replace(/[  ]/g, ' ');
  s = s.replace(/­/g, '');
  if (house.dashes === 'replace') {
    s = s.replace(new RegExp(`${c}\\s*${c}`, 'g'), comma.trim() || ',');
    s = s.replace(new RegExp(`[ \\t]+${c}`, 'g'), comma.trim() || ',');
    s = s.replace(new RegExp(`${c}\\s*([.!?。！？؟।])`, 'g'), '$1');
    s = s.replace(new RegExp(`^${c}\\s*`, 'gm'), '');
  }
  s = s.replace(/[ \t]{2,}/g, ' ');
  return s;
}

export class LanguageRules {
  readonly language: LanguageCode;
  /** null for the built-in safe rules of a language whose pack is not on the phone. */
  readonly packVersion: string | null;
  readonly script: PackScript;
  /** The author's chosen script, when the language has variants. */
  readonly targetScript: ScriptCode | null;
  readonly can: Capabilities;
  readonly pack: TextRulesPack | null;

  /* tables */
  private readonly fillerAuto: Set<string>;
  private readonly fillerSuggest: Set<string>;
  private readonly negations: Set<string>;
  private readonly negationSuffixes: string[];
  private readonly negationPrefixes: string[];
  private readonly modals: Set<string>;
  private readonly numberWords: Set<string>;
  private readonly functionWords: Set<string>;
  private readonly pronouns: Set<string>;
  private readonly kinship: Set<string>;
  private readonly alwaysCap: Set<string>;
  private readonly agreementGroups: Set<string>[];
  private readonly tenseGroups: Set<string>[];
  private readonly inflections: TextRulesPack['meaning']['agreementInflections'];
  private readonly vowels: string;
  private readonly minStem: number;
  private readonly tenseEndings: string[];
  private readonly stemDropFinal: string[];

  /** Repeat tables, read by repeats.ts and the verifier. Empty when removals are off. */
  readonly repeat: {
    always: Set<string>;
    suggest: Set<string>;
    dangling: Set<string>;
    verifierRepeatable: Set<string>;
    cleftWords: Set<string>;
    cleftOpeners: Set<string>;
    subjectWords: Set<string>;
    objectVerbs: Set<string>;
    clauseLeads: Set<string>;
    discourseAfter: Set<string>;
    maxPhrase: number;
  };

  /* punctuation */
  readonly sentenceEndChars: string;
  readonly terminal: string;
  readonly openers: string;
  readonly pairOpeners: boolean;
  readonly commaChars: string;
  private readonly quoteChars: string;
  private readonly closers: string;
  private readonly stripBefore: RegExp;
  private readonly stripBeforeWithComma: RegExp;
  private readonly sentenceEndAfterClosers: RegExp;
  private readonly sentenceBreakRe: RegExp;
  /** Between two copies of a repeat: spaces and commas only. */
  readonly softGap: RegExp;
  /** Inside a repeated phrase: spaces only (or nothing, between Chinese characters). */
  readonly tightGap: RegExp;
  readonly clauseBreak: RegExp;
  readonly sentenceEndRe: RegExp;

  /* normalisation and script */
  private readonly ignoreForMatching: Set<string>;
  private readonly foldForMatching: Map<string, string>;
  private readonly house: HousePolicy | null;
  private readonly dropFromFinal: string;
  private readonly toTarget: Map<string, string>;
  private readonly toHans: Map<string, string>;

  /* phonetic */
  private readonly romanizeMap: LongestMap;
  private readonly consonants: LongestMap | null;
  private readonly vowelSigns: LongestMap | null;
  private readonly abugida: TextRulesPack['phonetic']['abugida'] | undefined;
  private readonly syllableOf: Map<string, string>;
  private readonly rewrites: Array<{ re: RegExp; to: string }>;
  private readonly vowelRun: RegExp;
  private readonly phonetic: TextRulesPack['phonetic'];

  constructor(pack: TextRulesPack | null, language: LanguageCode, opts: CompileOptions = {}) {
    const info = languageInfo(language);
    this.pack = pack;
    this.language = language;
    this.packVersion = pack?.version ?? null;
    this.script = pack?.script ?? info.script;
    const scripts: ScriptCode[] = [this.script.primary, ...this.script.variants];
    this.targetScript = opts.script && scripts.includes(opts.script) ? opts.script : null;

    const st = (t: { review: { status: ReviewStatus } } | undefined) => t?.review.status;
    const fillersOk = vetted(st(pack?.fillers), MIN_STATUS.fillers);
    const meaningOk = vetted(st(pack?.meaning), MIN_STATUS.meaning);
    const repeatsOk = vetted(st(pack?.repeats), MIN_STATUS.repeats) && meaningOk;
    const phoneticOk = vetted(st(pack?.phonetic), MIN_STATUS.phonetic);
    const punctOk = vetted(st(pack?.punctuation), MIN_STATUS.punctuation);
    const normOk = vetted(st(pack?.normalization), MIN_STATUS.normalization);
    const variantsOk = vetted(st(pack?.scriptVariants), MIN_STATUS.scriptVariants);

    const set = (xs: readonly string[] | undefined) => new Set((xs ?? []).map((x) => this.key(x)));
    const strictSet = (xs: readonly string[] | undefined) => new Set((xs ?? []).map((x) => this.norm(x)));

    // Normalisation for matching first: key() depends on it.
    this.ignoreForMatching = new Set([...(pack?.normalization.ignoreForMatching ?? [])].flatMap((s) => [...s]));
    this.foldForMatching = new Map(Object.entries(pack?.normalization.foldForMatching ?? {}));

    // Enabling tables: only when vetted.
    this.fillerAuto = fillersOk ? strictSet(pack!.fillers.auto) : new Set();
    this.fillerSuggest = fillersOk ? strictSet(pack!.fillers.suggest) : new Set();
    const m = pack?.meaning;
    this.agreementGroups = meaningOk ? (m!.agreementGroups ?? []).map((g) => strictSet(g)) : [];
    this.inflections = meaningOk ? m!.agreementInflections : [];
    this.alwaysCap = meaningOk ? strictSet(m!.alwaysCapitalized) : new Set();

    // Protective tables: always, drafts included.
    this.negations = set(m?.negations);
    this.negationSuffixes = (m?.negationSuffixes ?? []).map((x) => this.key(x));
    this.negationPrefixes = (m?.negationPrefixes ?? []).map((x) => this.key(x));
    this.modals = set(m?.modals);
    this.numberWords = set(m?.numberWords);
    this.functionWords = set(m?.functionWords);
    this.pronouns = set(m?.pronouns);
    this.kinship = set(m?.kinship);
    this.tenseGroups = (m?.tenseGroups ?? []).map((g) => strictSet(g));
    this.vowels = m?.vowels ?? '';
    this.minStem = m?.minStem ?? 3;
    this.tenseEndings = [...(m?.tenseEndings ?? [])].sort((a, b) => b.length - a.length);
    this.stemDropFinal = m?.stemDropFinal ?? [];

    const r = repeatsOk ? pack!.repeats : null;
    this.repeat = {
      always: strictSet(r?.always),
      suggest: strictSet(r?.suggest),
      dangling: strictSet(r?.dangling),
      verifierRepeatable: strictSet([...(r?.always ?? []), ...(r?.suggest ?? []), ...(r?.verifierExtra ?? [])]),
      cleftWords: strictSet(r?.cleft.words),
      cleftOpeners: strictSet(r?.cleft.openers),
      subjectWords: strictSet(r?.subject.words),
      objectVerbs: strictSet(r?.subject.objectVerbs),
      clauseLeads: strictSet(r?.subject.clauseLeads),
      discourseAfter: strictSet(r?.subject.discourseAfter),
      maxPhrase: r?.maxPhrase ?? 4,
    };

    // Punctuation. Sentence ends: the bundled facts for this language, plus the pack's when vetted.
    const p = pack?.punctuation;
    this.sentenceEndChars = uniqueChars(BASE_SENTENCE_END, info.sentenceEnd.join(''), punctOk ? p!.sentenceEnd.join('') : '');
    this.terminal = punctOk ? p!.terminal : info.terminal;
    this.openers = punctOk ? p!.openers.join('') : '';
    this.pairOpeners = punctOk ? p!.pairOpeners : false;
    this.commaChars = uniqueChars(',', punctOk ? p!.commas.join('') : '');
    this.quoteChars = uniqueChars(BASE_QUOTES, (p?.quotes ?? []).join(''));
    this.closers = uniqueChars(BASE_CLOSERS, (p?.quotes ?? []).join(''));
    const ends = escapeClass(this.sentenceEndChars);
    const openClass = escapeClass(uniqueChars(BASE_OPENERS, this.openers, (p?.quotes ?? []).join('')));
    this.stripBefore = new RegExp(`[\\s${openClass}]+$`, 'u');
    this.stripBeforeWithComma = new RegExp(`[\\s,${openClass}]+$`, 'u');
    this.sentenceEndAfterClosers = new RegExp(`[${ends}][${escapeClass(this.closers)}]*$`, 'u');
    this.sentenceBreakRe = new RegExp(`[${ends}](\\s|$)`, 'g');
    this.sentenceEndRe = new RegExp(`[${ends}]`);
    this.clauseBreak = new RegExp(`[${ends};:${escapeClass(this.commaChars)}；：؛]`);
    this.softGap = new RegExp(`^[\\s${escapeClass(this.commaChars)}]*$`);
    this.tightGap = this.script.segmentation === 'char' ? /^\s*$/ : /^\s+$/;

    // Final-character policy and script conversion.
    const n = pack?.normalization;
    this.house = normOk && n ? n.house : null;
    this.dropFromFinal = normOk && n ? n.dropFromFinal.join('') : '';
    const variantMap = (target: ScriptCode | null) => {
      const t = target ? pack?.scriptVariants?.targets[target] : undefined;
      const out = new Map<string, string>();
      if (!t) return out;
      const from = [...t.from];
      const to = [...t.to];
      from.forEach((ch, i) => out.set(ch, to[i]));
      return out;
    };
    this.toTarget = variantsOk ? variantMap(this.targetScript) : new Map();
    this.toHans = variantMap('Hans'); // lookup aid for pinyin only; never edits text

    // Phonetic.
    const ph = pack?.phonetic ?? ENGLISH_PACK.phonetic;
    this.phonetic = ph;
    this.romanizeMap = new LongestMap(ph.romanize);
    this.abugida = ph.abugida;
    this.consonants = ph.abugida ? new LongestMap(ph.abugida.consonants) : null;
    this.vowelSigns = ph.abugida ? new LongestMap(ph.abugida.vowelSigns) : null;
    this.syllableOf = new Map();
    for (const [syl, chars] of Object.entries(ph.syllables ?? {})) for (const ch of chars) if (!this.syllableOf.has(ch)) this.syllableOf.set(ch, syl);
    this.rewrites = ph.rewrite.map((w) => ({
      re: new RegExp(escapeRe(w.from) + (w.before ? `(?=[${escapeClass(w.before)}])` : ''), 'g'),
      to: w.to,
    }));
    this.vowelRun = new RegExp(`[${escapeClass(ph.vowels)}]+`, 'g');

    const hasAgreement = this.agreementGroups.some((g) => g.size > 1) || this.inflections.length > 0;
    this.can = {
      fillers: fillersOk && this.fillerAuto.size + this.fillerSuggest.size > 0,
      removals: repeatsOk,
      agreement: meaningOk && hasAgreement,
      nameSimilarity: this.script.cased && phoneticOk && meaningOk,
      punctuation: punctOk,
      house: this.house !== null,
      scriptVariants: this.toTarget.size > 0,
    };
  }

  /* ---------- words ---------- */

  /** Words, segmentation-aware: every Han character is its own token under 'char'. */
  tokens(text: string): Token[] {
    const base = wordTokens(text);
    if (this.script.segmentation !== 'char') return base;
    const out: Token[] = [];
    for (const t of base) {
      if (!HAN.test(t.word)) {
        out.push(t);
        continue;
      }
      let run: Token | null = null;
      let last: Token | null = null;
      for (let i = 0; i < t.word.length; ) {
        const cp = t.word.codePointAt(i)!;
        const ch = String.fromCodePoint(cp);
        const at = t.start + i;
        if (HAN.test(ch)) {
          if (run) out.push(run);
          run = null;
          last = { word: ch, start: at, end: at + ch.length };
          out.push(last);
        } else if (MARK.test(ch) && last && !run) {
          // a variation selector or mark rides with the character before it
          last.word += ch;
          last.end += ch.length;
        } else {
          run = run ? { word: run.word + ch, start: run.start, end: at + ch.length } : { word: ch, start: at, end: at + ch.length };
          last = null;
        }
        i += ch.length;
      }
      if (run) out.push(run);
    }
    return out;
  }

  /** Lowercased words, as the legacy `words`. */
  words(text: string): string[] {
    return this.tokens(text).map((t) => t.word.toLowerCase());
  }

  /** Strict comparison form: NFC, lowercase, straight apostrophe. Two words are "the same" only if these match. */
  norm(word: string): string {
    return word.normalize('NFC').toLowerCase().replace(/[’‘′]/g, "'");
  }

  /** Table-lookup form: norm plus the pack's matching folds (harakat ignored, alef forms merged). Output never sees it. */
  key(word: string): string {
    const w = this.norm(word);
    if (this.ignoreForMatching.size === 0 && this.foldForMatching.size === 0) return w;
    let out = '';
    for (const ch of w) {
      if (this.ignoreForMatching.has(ch)) continue;
      out += this.foldForMatching.get(ch) ?? ch;
    }
    return out;
  }

  /** norm after converting to the author's script: 發 and 发 are the same word for a Simplified author. */
  scriptNorm(word: string): string {
    if (this.toTarget.size === 0) return this.norm(word);
    let out = '';
    for (const ch of word) out += this.toTarget.get(ch) ?? ch;
    return this.norm(out);
  }

  /** Can a removal between these two characters glue two words together? */
  joins(left: string, right: string): boolean {
    const wordish = (c: string) => /[\p{L}\p{M}\p{N}]/u.test(c);
    if (!wordish(left) || !wordish(right)) return false;
    if (this.script.segmentation === 'char' && (HAN.test(left) || HAN.test(right))) return false;
    return true;
  }

  /* ---------- tables ---------- */

  /** A hesitation sound the rules may remove; `withSuggest` also accepts the offered-only list. */
  isFiller(word: string, withSuggest = false): boolean {
    const w = this.norm(word);
    return this.fillerAuto.has(w) || (withSuggest && this.fillerSuggest.has(w));
  }

  isSuggestFiller(word: string): boolean {
    return this.fillerSuggest.has(this.norm(word));
  }

  isNegation(word: string): boolean {
    const k = this.key(word);
    return this.negations.has(k) || this.negationSuffixes.some((s) => k.endsWith(s)) || this.negationPrefixes.some((p) => k.startsWith(p));
  }

  /**
   * Under 'char' segmentation a one-character filler counts only where it
   * stands alone: no letter or digit right before or after it. Always true
   * for languages with spaces between words.
   */
  standsAlone(raw: string, start: number, end: number): boolean {
    if (this.script.segmentation !== 'char') return true;
    const unit = raw.charCodeAt(start - 1);
    const before = start <= 0 ? '' : unit >= 0xdc00 && unit <= 0xdfff && start >= 2 ? raw.slice(start - 2, start) : raw[start - 1];
    const after = end >= raw.length ? '' : String.fromCodePoint(raw.codePointAt(end)!);
    const wordish = (c: string) => /[\p{L}\p{N}]/u.test(c);
    return !wordish(before) && !wordish(after);
  }

  negationCount(text: string): number {
    return this.tokens(text).filter((t) => this.isNegation(t.word)).length;
  }

  isModal(word: string): boolean {
    return this.modals.has(this.key(word));
  }

  isFunctionWord(word: string): boolean {
    return this.functionWords.has(this.key(word));
  }

  /** Every number, in order: digit groups with their separators, then number words. */
  numbersOf(text: string): string[] {
    const out: string[] = [];
    for (const m of text.matchAll(DIGIT_RUN)) out.push(m[0]);
    for (const t of this.tokens(text)) {
      const k = this.key(t.word);
      if (this.numberWords.has(k)) out.push(k);
    }
    return out;
  }

  /** Canonical mood marks. With paired openers (Spanish) ¿ and ¡ are checked by pairing instead. */
  moodMarks(text: string): string {
    let out = '';
    for (const ch of text) {
      const c = MOOD_CANON[ch];
      if (c === undefined) continue;
      if (this.pairOpeners && (ch === '¿' || ch === '¡')) continue;
      out += c;
    }
    return out;
  }

  quoteMarkCount(text: string): number {
    let n = 0;
    for (const ch of text) if (this.quoteChars.includes(ch)) n++;
    return n;
  }

  isQuoteChar(ch: string): boolean {
    return this.quoteChars.includes(ch);
  }

  /** Words a similarity-based stt_fix may never replace. */
  isProtectedWord(word: string): boolean {
    const w = this.key(word);
    return (
      this.functionWords.has(w) || this.pronouns.has(w) || this.kinship.has(w) || this.isNegation(w) || this.modals.has(w) ||
      this.numberWords.has(w) || /\p{N}/u.test(w)
    );
  }

  isKinship(word: string): boolean {
    return this.kinship.has(this.key(word));
  }

  /** Always capitalised wherever it stands (English I). */
  isPronounI(word: string): boolean {
    return this.alwaysCap.has(this.norm(word));
  }

  /** True when a -> b changes number or person only. */
  isAgreementPair(a: string, b: string): boolean {
    const x = this.norm(a);
    const y = this.norm(b);
    if (x === y) return false;
    if (this.agreementGroups.some((g) => g.has(x) && g.has(y))) return true;
    return this.sameWordInflected(x, y);
  }

  private sameWordInflected(a: string, b: string): boolean {
    if (this.inflections.length === 0) return false;
    const [base, inflected] = a.length <= b.length ? [a, b] : [b, a];
    if (base.length < this.minStem || /['\p{N}]/u.test(base + inflected)) return false;
    if (this.functionWords.has(base) || this.modals.has(base) || this.isNegation(base) || this.numberWords.has(base)) return false;
    for (const inf of this.inflections) {
      const strip = inf.strip ?? '';
      if (!base.endsWith(strip)) continue;
      const stem = base.slice(0, base.length - strip.length);
      if (inf.afterConsonant) {
        const c = stem[stem.length - 1];
        if (c === undefined || this.vowels.includes(c)) continue;
      }
      if (inflected === stem + inf.add) return true;
    }
    return false;
  }

  /** Why a one-word swap is not agreement, for a precise reject reason. */
  classifyWordSwap(a: string, b: string): 'changes_negation' | 'changes_modal' | 'changes_tense' | 'changes_word' | 'agreement_stem_mismatch' {
    const x = this.norm(a);
    const y = this.norm(b);
    if (this.isNegation(x) !== this.isNegation(y)) return 'changes_negation';
    if ((this.modals.has(this.key(x)) || this.modals.has(this.key(y))) && x !== y) return 'changes_modal';
    if (this.tenseGroups.some((g) => g.has(x) && g.has(y))) return 'changes_tense';
    if (x.replace(/'/g, '') === y.replace(/'/g, '')) return 'changes_word';
    const stem = (w: string) => {
      const end = this.tenseEndings.find((e) => w.endsWith(e));
      let s = end ? w.slice(0, w.length - end.length) : w;
      if (s.length > 0 && this.stemDropFinal.includes(s[s.length - 1])) s = s.slice(0, -1);
      return s;
    };
    if (stem(x).length >= this.minStem && stem(x) === stem(y)) return 'changes_tense';
    return 'agreement_stem_mismatch';
  }

  /* ---------- sentences ---------- */

  /**
   * Does a sentence start right after `prefix`? Opening quotes, brackets and
   * (Spanish) ¿ ¡ are skipped, and at the clean level so are trailing fillers
   * the rules will remove.
   */
  startsSentence(prefix: string, level: EditLevel): boolean {
    if (/\n\s*$/.test(prefix)) return true;
    let p = prefix.replace(this.stripBefore, '');
    if (level === 'clean') {
      for (;;) {
        const toks = this.tokens(p);
        const last = toks[toks.length - 1];
        if (!last || !this.isFiller(last.word) || !/^[\s,]*$/.test(p.slice(last.end))) break;
        p = p.slice(0, last.start).replace(this.stripBeforeWithComma, '');
      }
    }
    return p === '' || this.sentenceEndAfterClosers.test(p);
  }

  /** Index of the sentence that `pos` falls in (for "one agreement per sentence"). */
  sentenceIndex(raw: string, pos: number): number {
    return (raw.slice(0, pos).match(this.sentenceBreakRe) ?? []).length;
  }

  isSentenceEnd(ch: string): boolean {
    return this.sentenceEndChars.includes(ch);
  }

  /** The end mark for a letter whose last word is `lastWord`: the language's own form after its own script. */
  terminalAfter(lastWord: string): string {
    const lastLetter = [...lastWord].reverse().find((c) => !MARK.test(c)) ?? '';
    return this.terminal !== '.' && this.isPrimaryScriptChar(lastLetter) ? this.terminal : '.';
  }

  /** A letter (or mark) of this language's primary script. */
  isPrimaryScriptChar(ch: string): boolean {
    if (!ch) return false;
    switch (this.script.primary) {
      case 'Deva':
        return /[ऀ-ॿ꣠-ꣿ]/.test(ch) && LETTER_MARK.test(ch);
      case 'Arab':
        return /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/.test(ch) && LETTER_MARK.test(ch);
      case 'Hans':
      case 'Hant':
        return HAN.test(ch);
      case 'Latn':
        return /\p{Script=Latin}/u.test(ch);
    }
  }

  /* ---------- normalisation and script ---------- */

  /** The final text: house character policy, then characters the pack drops (Arabic tatweel). */
  normalizeFinal(text: string): string {
    let s = this.house ? normalizeCharsWith(text, this.house) : normalizeChars(text);
    if (this.dropFromFinal) for (const ch of this.dropFromFinal) s = s.split(ch).join('');
    return s;
  }

  /** The author's-script form of one character, or undefined when it needs no change. */
  variantOf(ch: string): string | undefined {
    return this.toTarget.get(ch);
  }

  /** Same letters except characters converted to the author's script, one for one. */
  sameLettersAcrossScripts(a: string, b: string): boolean {
    if (this.toTarget.size === 0) return false;
    const la = [...a].filter((c) => /[\p{L}\p{M}\p{N}]/u.test(c));
    const lb = [...b].filter((c) => /[\p{L}\p{M}\p{N}]/u.test(c));
    if (la.length !== lb.length) return false;
    return la.every((c, i) => c === lb[i] || c.toLowerCase() === lb[i].toLowerCase() || this.toTarget.get(c) === lb[i]);
  }

  /* ---------- phonetic ---------- */

  /** Script -> lowercase Latin, longest match first; characters with no entry are kept. */
  romanize(text: string): string {
    const s = text.normalize('NFC');
    let out = '';
    for (let i = 0; i < s.length; ) {
      if (this.consonants && this.abugida) {
        const c = this.consonants.at(s, i);
        if (c) {
          out += c.value;
          i += c.len;
          const v = this.vowelSigns!.at(s, i);
          if (v) {
            out += v.value;
            i += v.len;
          } else if (s.startsWith(this.abugida.virama, i)) {
            i += this.abugida.virama.length;
          } else {
            // Schwa deletion: no inherent vowel at the end of a word.
            const atEnd = i >= s.length || !LETTER_MARK.test(s[i]);
            if (!(atEnd && this.abugida.dropFinalInherent)) out += this.abugida.inherent;
          }
          continue;
        }
      }
      const r = this.romanizeMap.at(s, i);
      if (r) {
        out += r.value;
        i += r.len;
        continue;
      }
      const cp = s.codePointAt(i)!;
      const ch = String.fromCodePoint(cp);
      if (this.syllableOf.size) {
        const syl = this.syllableOf.get(ch) ?? this.syllableOf.get(this.toHans.get(ch) ?? '');
        if (syl !== undefined) {
          out += syl;
          i += ch.length;
          continue;
        }
      }
      out += ch;
      i += ch.length;
    }
    return out;
  }

  /**
   * A rough sound key for names in any of this language's scripts. English
   * pack: exactly the legacy soundKey. Others romanize first, so "नीला",
   * "نيلا" and "Neela" share the consonants n-l.
   */
  soundKey(text: string): string {
    let s = this.romanize(text).toLowerCase().replace(/[’‘′]/g, "'");
    if (this.phonetic.stripMarks) s = s.normalize('NFD').replace(/\p{M}/gu, '');
    s = s.replace(/[^\p{L}]/gu, '');
    for (const w of this.rewrites) s = s.replace(w.re, w.to);
    s = s.replace(this.vowelRun, 'a').replace(/(.)\1+/gu, '$1');
    for (const c of this.phonetic.dropFinalAfterVowel) {
      if (s.length > 2 && s.endsWith(`a${c}`)) {
        s = s.slice(0, -1);
        break;
      }
    }
    return s;
  }

  /**
   * The name-matching key: the consonant skeleton of the sound key, doubles
   * collapsed again once vowels are gone (محمد has no written vowels, so
   * "Mohammed" and محمد meet at m-d once h drops and m-m collapses).
   */
  phoneticKey(name: string): string {
    return this.soundKey(name).replace(/a/g, '').replace(/(.)\1+/gu, '$1');
  }

  /** Same consonant sounds in the same order (and, where vowels are written, at most one vowel group apart). */
  soundsLike(original: string, term: string): boolean {
    const a = this.soundKey(original);
    const b = this.soundKey(term);
    if (!a || !b) return false;
    if (!this.phonetic.compareVowels) {
      const ka = this.phoneticKey(original);
      return ka.length > 0 && ka === this.phoneticKey(term);
    }
    const consonants = (k: string) => k.replace(/a/g, '');
    const vowels = (k: string) => (k.match(/a/g) ?? []).length;
    if (Math.abs(vowels(a) - vowels(b)) > 1) return false;
    return consonants(a).length > 0 && consonants(a) === consonants(b);
  }
}

/* ---------- resolving rules ---------- */

/** The bundled English rules. Identical behaviour to the engine before packs. */
export const ENGLISH_RULES = new LanguageRules(ENGLISH_PACK, 'en');

const compiled = new WeakMap<TextRulesPack, Map<string, LanguageRules>>();
const safe = new Map<LanguageCode, LanguageRules>();

/**
 * Rules for a language. With a pack (already checked by validatePack),
 * its vetted tables; without one, the safe rules: script facts only, every
 * enabling table off. English without a pack is the bundled English pack.
 */
export function compileRules(language: LanguageCode, pack?: TextRulesPack | null, opts: CompileOptions = {}): LanguageRules {
  if (pack && pack.language !== language) pack = null;
  if (!pack && language === 'en') return opts.script ? new LanguageRules(ENGLISH_PACK, 'en', opts) : ENGLISH_RULES;
  if (!pack) {
    if (opts.script) return new LanguageRules(null, language, opts);
    let r = safe.get(language);
    if (!r) safe.set(language, (r = new LanguageRules(null, language)));
    return r;
  }
  if (pack === ENGLISH_PACK && !opts.script) return ENGLISH_RULES;
  let byScript = compiled.get(pack);
  if (!byScript) compiled.set(pack, (byScript = new Map()));
  const k = opts.script ?? '';
  let r = byScript.get(k);
  if (!r) byScript.set(k, (r = new LanguageRules(pack, language, opts)));
  return r;
}
