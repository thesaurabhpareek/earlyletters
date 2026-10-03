/**
 * validatePack: the gate between downloaded bytes and the engine.
 *
 * The platform layer checks a pack's SHA-256 against the signed manifest;
 * this checks that what was signed is something the engine can safely read.
 * It is a closed schema: an unknown key anywhere is an error, every string
 * is length-limited, NFC and free of control and bidi-override characters,
 * every table entry must be one word under the language's own tokenizer,
 * and the cross-table rules that keep removals honest hold (no filler is a
 * negation, number, pronoun, modal or kinship word; no agreement group
 * crosses a negation; a local punctuation form keeps the mark's mood).
 *
 * A pack that fails is not used; the language runs in safe mode. Errors
 * are short codes with a path, never pack content, so they can be logged.
 */
import { MOOD_CANON } from '../meaning';
import { LanguageRules } from './engine';
import { languageInfo, isLanguageCode } from './languages';
import {
  LANG_ENGINE_VERSION,
  REVIEW_STATUSES,
  SCRIPT_CODES,
  TEXT_RULES_SCHEMA,
  type LanguageCode,
  type ScriptCode,
  type TextRulesPack,
} from './types';

export const PACK_LIMITS = {
  /** Largest pack file accepted, in UTF-8 bytes. */
  maxBytes: 512 * 1024,
  maxListEntries: 5000,
  maxWordLength: 48,
  maxStringLength: 600,
  maxSyllableChars: 40000,
  maxVariantChars: 12000,
  maxRewriteRules: 64,
} as const;

export type PackValidation = { ok: true; pack: TextRulesPack } | { ok: false; errors: string[] };

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const BAD_CHARS = /[\p{Cc}‎‏؜‪-‮⁦-⁩﻿]/u;
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
const PUNCT_OR_SYMBOL = /^[\p{P}\p{S}]$/u;
const LOCAL_FORM_KEYS = new Set([',', '.', '?', '!', ';', ':']);
const APOSTROPHES = new Set(["'", '’', '‘', '′']);
const DROPPABLE = new Set(['ـ']); // Arabic tatweel: a stretch, never a letter of the word

class Checker {
  readonly errors: string[] = [];
  constructor(private readonly rules: LanguageRules) {}

  err(path: string, code: string): false {
    if (this.errors.length < 200) this.errors.push(`${path}: ${code}`);
    return false;
  }

  keys(o: Obj, path: string, required: string[], optional: string[] = []): boolean {
    let ok = true;
    for (const k of required) if (!(k in o)) ok = this.err(`${path}.${k}`, 'missing');
    for (const k of Object.keys(o)) if (!required.includes(k) && !optional.includes(k)) ok = this.err(`${path}.${k}`, 'unknown_key');
    return ok;
  }

  str(v: unknown, path: string, max: number = PACK_LIMITS.maxStringLength, allowEmpty = false): v is string {
    if (typeof v !== 'string') return this.err(path, 'not_string');
    if (!allowEmpty && v.length === 0) return this.err(path, 'empty');
    if (v.length > max) return this.err(path, 'too_long');
    if (BAD_CHARS.test(v) && !(v === ' ' || v === ' ')) return this.err(path, 'control_or_bidi_character');
    if (LONE_SURROGATE.test(v)) return this.err(path, 'lone_surrogate');
    if (v.normalize('NFC') !== v) return this.err(path, 'not_nfc');
    return true;
  }

  bool(v: unknown, path: string): v is boolean {
    return typeof v === 'boolean' || this.err(path, 'not_boolean');
  }

  int(v: unknown, path: string, min: number, max: number): v is number {
    if (typeof v !== 'number' || !Number.isInteger(v)) return this.err(path, 'not_integer');
    if (v < min || v > max) return this.err(path, 'out_of_range');
    return true;
  }

  oneOf<T extends string>(v: unknown, path: string, allowed: readonly T[]): v is T {
    return (typeof v === 'string' && (allowed as readonly string[]).includes(v)) || this.err(path, 'not_allowed_value');
  }

  array(v: unknown, path: string, max: number = PACK_LIMITS.maxListEntries): v is unknown[] {
    if (!Array.isArray(v)) return this.err(path, 'not_array');
    if (v.length > max) return this.err(path, 'too_many_entries');
    return true;
  }

  /** One code point that is punctuation or a symbol. */
  mark(v: unknown, path: string): v is string {
    if (!this.str(v, path, 2)) return false;
    return ([...v].length === 1 && PUNCT_OR_SYMBOL.test(v)) || this.err(path, 'not_a_single_mark');
  }

  /** A list of words, each one token of this language, lowercase where the script has case, no duplicates. */
  words(v: unknown, path: string): string[] {
    if (!this.array(v, path)) return [];
    const out: string[] = [];
    const seen = new Set<string>();
    v.forEach((w, i) => {
      const p = `${path}[${i}]`;
      if (!this.str(w, p, PACK_LIMITS.maxWordLength)) return;
      const toks = this.rules.tokens(w);
      if (toks.length !== 1 || toks[0].word !== w) return this.err(p, 'not_single_word');
      if (w.toLowerCase() !== w) return this.err(p, 'not_lowercase');
      if (seen.has(w)) return this.err(p, 'duplicate');
      seen.add(w);
      out.push(w);
    });
    return out;
  }

  latin(v: unknown, path: string, re: RegExp): v is string {
    return (typeof v === 'string' && re.test(v)) || this.err(path, 'not_allowed_value');
  }

  review(v: unknown, path: string): void {
    if (!isObj(v)) return void this.err(path, 'not_object');
    this.keys(v, path, ['status'], ['by', 'date', 'sources']);
    this.oneOf(v.status, `${path}.status`, REVIEW_STATUSES);
    if (v.by !== undefined) this.str(v.by, `${path}.by`, 160);
    if (v.date !== undefined && !(typeof v.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.date))) this.err(`${path}.date`, 'not_a_date');
    if (v.sources !== undefined && this.array(v.sources, `${path}.sources`, 60)) {
      v.sources.forEach((s, i) => this.str(s, `${path}.sources[${i}]`, 400));
    }
  }

  table(v: unknown, path: string, required: string[], optional: string[] = []): v is Obj {
    if (!isObj(v)) return this.err(path, 'not_object');
    this.keys(v, path, ['review', ...required], optional);
    this.review(v.review, `${path}.review`);
    return true;
  }
}

/**
 * Check a parsed pack. `expectLanguage` is the language the manifest says
 * this pack is for; a pack for another language is refused.
 */
export function validatePack(input: unknown, opts: { expectLanguage?: LanguageCode } = {}): PackValidation {
  if (!isObj(input)) return { ok: false, errors: ['$: not_object'] };
  const language = input.language;
  if (!isLanguageCode(language)) return { ok: false, errors: ['$.language: not_a_v1_language'] };
  if (opts.expectLanguage && language !== opts.expectLanguage) return { ok: false, errors: ['$.language: not_the_expected_language'] };
  const info = languageInfo(language);
  const c = new Checker(new LanguageRules(null, language));

  c.keys(input, '$', ['kind', 'schema', 'language', 'version', 'engine', 'name', 'script', 'attribution', 'normalization', 'punctuation', 'fillers', 'meaning', 'repeats', 'phonetic'], ['scriptVariants', 'asr']);
  if (input.kind !== 'text-rules') c.err('$.kind', 'not_text_rules');
  if (input.schema !== TEXT_RULES_SCHEMA) c.err('$.schema', 'unsupported_schema');
  if (!(typeof input.version === 'string' && /^\d{1,4}\.\d{1,4}\.\d{1,6}$/.test(input.version))) c.err('$.version', 'not_semver');
  if (typeof input.engine === 'number' && Number.isInteger(input.engine) && input.engine > LANG_ENGINE_VERSION) c.err('$.engine', 'engine_too_new');
  else c.int(input.engine, '$.engine', 1, LANG_ENGINE_VERSION);

  if (isObj(input.name)) {
    c.keys(input.name, '$.name', ['english', 'native']);
    c.str(input.name.english, '$.name.english', 64);
    c.str(input.name.native, '$.name.native', 64);
  } else c.err('$.name', 'not_object');

  // Script: must agree with the facts bundled in the app, so a pack cannot turn Arabic left-to-right.
  const scriptCodes: ScriptCode[] = [];
  if (isObj(input.script)) {
    const s = input.script;
    c.keys(s, '$.script', ['primary', 'variants', 'direction', 'cased', 'segmentation']);
    if (s.primary !== info.script.primary) c.err('$.script.primary', 'does_not_match_language');
    if (s.direction !== info.script.direction) c.err('$.script.direction', 'does_not_match_language');
    if (s.cased !== info.script.cased) c.err('$.script.cased', 'does_not_match_language');
    if (s.segmentation !== info.script.segmentation) c.err('$.script.segmentation', 'does_not_match_language');
    if (c.array(s.variants, '$.script.variants', 4)) {
      s.variants.forEach((v, i) => {
        if (c.oneOf(v, `$.script.variants[${i}]`, SCRIPT_CODES) && !info.script.variants.includes(v)) c.err(`$.script.variants[${i}]`, 'does_not_match_language');
      });
    }
    scriptCodes.push(info.script.primary, ...info.script.variants);
  } else c.err('$.script', 'not_object');

  if (c.array(input.attribution, '$.attribution', 20)) input.attribution.forEach((a, i) => c.str(a, `$.attribution[${i}]`, 600));

  // Normalisation.
  const n = input.normalization;
  if (c.table(n, '$.normalization', ['form', 'dropFromFinal', 'ignoreForMatching', 'foldForMatching', 'house'])) {
    if (n.form !== 'NFC') c.err('$.normalization.form', 'not_nfc');
    if (c.array(n.dropFromFinal, '$.normalization.dropFromFinal', 4)) {
      n.dropFromFinal.forEach((d, i) => {
        if (typeof d !== 'string' || !DROPPABLE.has(d)) c.err(`$.normalization.dropFromFinal[${i}]`, 'not_droppable');
      });
    }
    if (c.array(n.ignoreForMatching, '$.normalization.ignoreForMatching', 64)) {
      n.ignoreForMatching.forEach((m, i) => {
        if (typeof m !== 'string' || [...m].length !== 1 || !(/^\p{M}$/u.test(m) || DROPPABLE.has(m))) c.err(`$.normalization.ignoreForMatching[${i}]`, 'not_a_mark');
      });
    }
    if (isObj(n.foldForMatching)) {
      for (const [k, v] of Object.entries(n.foldForMatching)) {
        if (!(/^\p{L}$/u.test(k) && typeof v === 'string' && /^\p{L}$/u.test(v) && k !== v)) c.err(`$.normalization.foldForMatching`, 'not_letter_to_letter');
      }
    } else c.err('$.normalization.foldForMatching', 'not_object');
    if (isObj(n.house)) {
      const h = n.house;
      c.keys(h, '$.normalization.house', ['dashes', 'dashTo', 'quotes', 'ellipsis', 'spaces']);
      c.oneOf(h.dashes, '$.normalization.house.dashes', ['replace', 'keep'] as const);
      if (!(typeof h.dashTo === 'string' && /^[\p{P}\s]{1,3}$/u.test(h.dashTo))) c.err('$.normalization.house.dashTo', 'not_punctuation');
      c.oneOf(h.quotes, '$.normalization.house.quotes', ['straight', 'keep'] as const);
      c.oneOf(h.ellipsis, '$.normalization.house.ellipsis', ['dots', 'keep'] as const);
      c.oneOf(h.spaces, '$.normalization.house.spaces', ['plain', 'keep'] as const);
    } else c.err('$.normalization.house', 'not_object');
  }

  // Punctuation profile.
  const p = input.punctuation;
  if (c.table(p, '$.punctuation', ['sentenceEnd', 'terminal', 'openers', 'pairOpeners', 'quotes', 'commas', 'localForms', 'localFormsSwallowSpace', 'spaceBefore', 'spaceInsideGuillemets'])) {
    const ends: string[] = [];
    if (c.array(p.sentenceEnd, '$.punctuation.sentenceEnd', 12)) {
      p.sentenceEnd.forEach((m, i) => {
        if (c.mark(m, `$.punctuation.sentenceEnd[${i}]`)) ends.push(m);
      });
    }
    if (c.mark(p.terminal, '$.punctuation.terminal')) {
      if (!ends.includes(p.terminal)) c.err('$.punctuation.terminal', 'not_a_sentence_end');
      if (MOOD_CANON[p.terminal] !== undefined) c.err('$.punctuation.terminal', 'terminal_sets_mood');
    }
    if (c.array(p.openers, '$.punctuation.openers', 2)) p.openers.forEach((o, i) => o === '¿' || o === '¡' || c.err(`$.punctuation.openers[${i}]`, 'not_allowed_value'));
    if (c.bool(p.pairOpeners, '$.punctuation.pairOpeners') && p.pairOpeners && !(Array.isArray(p.openers) && p.openers.length > 0)) {
      c.err('$.punctuation.pairOpeners', 'no_openers');
    }
    if (c.array(p.quotes, '$.punctuation.quotes', 16)) {
      p.quotes.forEach((q, i) => {
        if (c.mark(q, `$.punctuation.quotes[${i}]`) && APOSTROPHES.has(q)) c.err(`$.punctuation.quotes[${i}]`, 'apostrophe_is_not_a_quote');
      });
    }
    if (c.array(p.commas, '$.punctuation.commas', 4)) {
      p.commas.forEach((m, i) => {
        if (c.mark(m, `$.punctuation.commas[${i}]`) && (MOOD_CANON[m] !== undefined || ends.includes(m))) c.err(`$.punctuation.commas[${i}]`, 'not_a_comma');
      });
    }
    if (isObj(p.localForms)) {
      for (const [k, v] of Object.entries(p.localForms)) {
        const path = `$.punctuation.localForms[${JSON.stringify(k)}]`;
        if (!LOCAL_FORM_KEYS.has(k)) {
          c.err(path, 'not_an_ascii_mark');
          continue;
        }
        if (!c.mark(v, path)) continue;
        if (MOOD_CANON[k] !== MOOD_CANON[v]) c.err(path, 'changes_mood');
        if (k === '.' && !ends.includes(v)) c.err(path, 'full_stop_must_stay_a_sentence_end');
        if (k !== '.' && MOOD_CANON[k] === undefined && ends.includes(v)) c.err(path, 'becomes_a_sentence_end');
      }
    } else c.err('$.punctuation.localForms', 'not_object');
    c.bool(p.localFormsSwallowSpace, '$.punctuation.localFormsSwallowSpace');
    if (c.array(p.spaceBefore, '$.punctuation.spaceBefore', 8)) {
      p.spaceBefore.forEach((r, i) => {
        const path = `$.punctuation.spaceBefore[${i}]`;
        if (!isObj(r)) return c.err(path, 'not_object');
        c.keys(r, path, ['mark', 'space', 'insert']);
        c.mark(r.mark, `${path}.mark`);
        c.oneOf(r.space, `${path}.space`, ['narrow', 'nbsp'] as const);
        c.bool(r.insert, `${path}.insert`);
      });
    }
    c.bool(p.spaceInsideGuillemets, '$.punctuation.spaceInsideGuillemets');
  }

  // Fillers.
  const f = input.fillers;
  let fillers: string[] = [];
  if (c.table(f, '$.fillers', ['auto', 'suggest'])) {
    fillers = [...c.words(f.auto, '$.fillers.auto'), ...c.words(f.suggest, '$.fillers.suggest')];
  }

  // Meaning tables.
  const m = input.meaning;
  const meaningSets: Record<string, Set<string>> = {};
  if (
    c.table(m, '$.meaning', [
      'negations', 'negationSuffixes', 'modals', 'numberWords', 'functionWords', 'pronouns', 'kinship', 'alwaysCapitalized',
      'agreementGroups', 'tenseGroups', 'agreementInflections', 'vowels', 'minStem', 'tenseEndings', 'stemDropFinal',
    ])
  ) {
    for (const k of ['negations', 'modals', 'numberWords', 'functionWords', 'pronouns', 'kinship', 'alwaysCapitalized']) {
      meaningSets[k] = new Set(c.words(m[k], `$.meaning.${k}`));
    }
    if (c.array(m.negationSuffixes, '$.meaning.negationSuffixes', 8)) m.negationSuffixes.forEach((s, i) => c.str(s, `$.meaning.negationSuffixes[${i}]`, 8));
    const negation = (w: string) => meaningSets.negations.has(w) || (Array.isArray(m.negationSuffixes) && m.negationSuffixes.some((s) => typeof s === 'string' && w.endsWith(s)));
    for (const k of ['agreementGroups', 'tenseGroups']) {
      const groups = m[k];
      if (!c.array(groups, `$.meaning.${k}`, 400)) continue;
      groups.forEach((g, i) => {
        const ws = c.words(g, `$.meaning.${k}[${i}]`);
        if (ws.length < 2) return c.err(`$.meaning.${k}[${i}]`, 'group_needs_two_words');
        if (k === 'agreementGroups') {
          if (new Set(ws.map(negation)).size > 1) c.err(`$.meaning.${k}[${i}]`, 'agreement_crosses_negation');
          if (ws.some((w) => meaningSets.modals?.has(w))) c.err(`$.meaning.${k}[${i}]`, 'agreement_contains_modal');
        }
      });
    }
    if (c.array(m.agreementInflections, '$.meaning.agreementInflections', 16)) {
      m.agreementInflections.forEach((x, i) => {
        const path = `$.meaning.agreementInflections[${i}]`;
        if (!isObj(x)) return c.err(path, 'not_object');
        c.keys(x, path, ['add'], ['strip', 'afterConsonant']);
        c.latin(x.add, `${path}.add`, /^\p{Ll}{1,8}$/u);
        if (x.strip !== undefined) c.latin(x.strip, `${path}.strip`, /^\p{Ll}{1,8}$/u);
        if (x.afterConsonant !== undefined) c.bool(x.afterConsonant, `${path}.afterConsonant`);
      });
    }
    if (!(typeof m.vowels === 'string' && /^\p{L}{0,32}$/u.test(m.vowels))) c.err('$.meaning.vowels', 'not_letters');
    c.int(m.minStem, '$.meaning.minStem', 1, 10);
    if (c.array(m.tenseEndings, '$.meaning.tenseEndings', 64)) m.tenseEndings.forEach((e, i) => c.latin(e, `$.meaning.tenseEndings[${i}]`, /^[\p{L}\p{M}]{1,10}$/u));
    if (c.array(m.stemDropFinal, '$.meaning.stemDropFinal', 8)) m.stemDropFinal.forEach((e, i) => c.latin(e, `$.meaning.stemDropFinal[${i}]`, /^\p{L}$/u));
    // A filler is never a word that carries meaning.
    for (const w of fillers) {
      for (const k of ['negations', 'modals', 'numberWords', 'pronouns', 'kinship']) {
        if (meaningSets[k]?.has(w) || (k === 'negations' && negation(w))) c.err(`$.fillers: "${k}"`, 'filler_carries_meaning');
      }
    }
  }

  // Repeats.
  const r = input.repeats;
  if (c.table(r, '$.repeats', ['always', 'suggest', 'dangling', 'verifierExtra', 'cleft', 'subject', 'maxPhrase'])) {
    const always = c.words(r.always, '$.repeats.always');
    c.words(r.suggest, '$.repeats.suggest');
    c.words(r.dangling, '$.repeats.dangling');
    c.words(r.verifierExtra, '$.repeats.verifierExtra');
    for (const w of always) if (meaningSets.negations?.has(w)) c.err('$.repeats.always', 'negation_is_never_a_stumble');
    if (isObj(r.cleft)) {
      c.keys(r.cleft, '$.repeats.cleft', ['words', 'openers']);
      c.words(r.cleft.words, '$.repeats.cleft.words');
      c.words(r.cleft.openers, '$.repeats.cleft.openers');
    } else c.err('$.repeats.cleft', 'not_object');
    if (isObj(r.subject)) {
      c.keys(r.subject, '$.repeats.subject', ['words', 'objectVerbs', 'clauseLeads', 'discourseAfter']);
      for (const k of ['words', 'objectVerbs', 'clauseLeads', 'discourseAfter']) c.words(r.subject[k], `$.repeats.subject.${k}`);
    } else c.err('$.repeats.subject', 'not_object');
    c.int(r.maxPhrase, '$.repeats.maxPhrase', 1, 6);
  }

  // Phonetic.
  const ph = input.phonetic;
  if (c.table(ph, '$.phonetic', ['romanize', 'rewrite', 'vowels', 'collapseDoubles', 'dropFinalAfterVowel', 'stripMarks', 'compareVowels'], ['abugida', 'syllables'])) {
    const latinMap = (o: unknown, path: string) => {
      if (!isObj(o)) return c.err(path, 'not_object');
      const entries = Object.entries(o);
      if (entries.length > 400) return c.err(path, 'too_many_entries');
      for (const [k, v] of entries) {
        if (!(k.length > 0 && [...k].length <= 4 && k.normalize('NFC') === k && !/[A-Za-z]/.test(k))) c.err(path, 'bad_key');
        if (!(typeof v === 'string' && /^[a-z]{0,6}$/.test(v))) c.err(path, 'value_not_lowercase_latin');
      }
      return true;
    };
    latinMap(ph.romanize, '$.phonetic.romanize');
    if (ph.abugida !== undefined) {
      const a = ph.abugida;
      if (isObj(a)) {
        c.keys(a, '$.phonetic.abugida', ['consonants', 'vowelSigns', 'virama', 'inherent', 'dropFinalInherent']);
        latinMap(a.consonants, '$.phonetic.abugida.consonants');
        latinMap(a.vowelSigns, '$.phonetic.abugida.vowelSigns');
        if (!(typeof a.virama === 'string' && /^\p{M}$/u.test(a.virama))) c.err('$.phonetic.abugida.virama', 'not_a_mark');
        c.latin(a.inherent, '$.phonetic.abugida.inherent', /^[a-z]{0,2}$/);
        c.bool(a.dropFinalInherent, '$.phonetic.abugida.dropFinalInherent');
      } else c.err('$.phonetic.abugida', 'not_object');
    }
    if (ph.syllables !== undefined) {
      if (isObj(ph.syllables)) {
        const seen = new Set<string>();
        let total = 0;
        for (const [syl, chars] of Object.entries(ph.syllables)) {
          if (!/^[a-z]{1,6}$/.test(syl)) c.err('$.phonetic.syllables', 'bad_syllable');
          if (typeof chars !== 'string' || !/^\p{Script=Han}+$/u.test(chars)) {
            c.err(`$.phonetic.syllables.${syl}`, 'not_han');
            continue;
          }
          for (const ch of chars) {
            if (seen.has(ch)) c.err(`$.phonetic.syllables.${syl}`, 'character_in_two_syllables');
            seen.add(ch);
            total++;
          }
        }
        if (total > PACK_LIMITS.maxSyllableChars) c.err('$.phonetic.syllables', 'too_large');
      } else c.err('$.phonetic.syllables', 'not_object');
    }
    if (c.array(ph.rewrite, '$.phonetic.rewrite', PACK_LIMITS.maxRewriteRules)) {
      ph.rewrite.forEach((w, i) => {
        const path = `$.phonetic.rewrite[${i}]`;
        if (!isObj(w)) return c.err(path, 'not_object');
        c.keys(w, path, ['from', 'to'], ['before']);
        c.latin(w.from, `${path}.from`, /^[a-zA-Z]{1,4}$/);
        c.latin(w.to, `${path}.to`, /^[a-zA-Z]{0,4}$/);
        if (w.before !== undefined) c.latin(w.before, `${path}.before`, /^[a-z]{1,12}$/);
      });
    }
    c.latin(ph.vowels, '$.phonetic.vowels', /^[a-z]{1,12}$/);
    c.bool(ph.collapseDoubles, '$.phonetic.collapseDoubles');
    if (c.array(ph.dropFinalAfterVowel, '$.phonetic.dropFinalAfterVowel', 4)) ph.dropFinalAfterVowel.forEach((x, i) => c.latin(x, `$.phonetic.dropFinalAfterVowel[${i}]`, /^[a-z]$/));
    c.bool(ph.stripMarks, '$.phonetic.stripMarks');
    c.bool(ph.compareVowels, '$.phonetic.compareVowels');
  }

  // Script variants: one-to-one, letters only, inside the Basic Multilingual Plane.
  const sv = input.scriptVariants;
  if (sv !== undefined && c.table(sv, '$.scriptVariants', ['targets'])) {
    if (isObj(sv.targets)) {
      for (const [target, map] of Object.entries(sv.targets)) {
        const path = `$.scriptVariants.targets.${target}`;
        if (!scriptCodes.includes(target as ScriptCode)) c.err(path, 'not_a_script_of_this_language');
        if (!isObj(map)) {
          c.err(path, 'not_object');
          continue;
        }
        c.keys(map, path, ['from', 'to']);
        if (!c.str(map.from, `${path}.from`, PACK_LIMITS.maxVariantChars * 2) || !c.str(map.to, `${path}.to`, PACK_LIMITS.maxVariantChars * 2)) continue;
        const from = [...map.from];
        const to = [...map.to];
        if (from.length !== to.length) {
          c.err(path, 'lengths_differ');
          continue;
        }
        const seen = new Set<string>();
        from.forEach((ch, i) => {
          if (seen.has(ch)) c.err(path, 'duplicate_source_character');
          seen.add(ch);
          if (ch === to[i]) c.err(path, 'maps_to_itself');
          if (!/^\p{L}$/u.test(ch) || !/^\p{L}$/u.test(to[i])) c.err(path, 'not_a_letter');
          if (ch.codePointAt(0)! > 0xffff || to[i].codePointAt(0)! > 0xffff) c.err(path, 'outside_bmp');
        });
      }
    } else c.err('$.scriptVariants.targets', 'not_object');
  }

  if (input.asr !== undefined) {
    if (isObj(input.asr)) {
      c.keys(input.asr, '$.asr', ['initialPrompt']);
      if (isObj(input.asr.initialPrompt)) {
        for (const [k, v] of Object.entries(input.asr.initialPrompt)) {
          if (!scriptCodes.includes(k as ScriptCode)) c.err(`$.asr.initialPrompt.${k}`, 'not_a_script_of_this_language');
          c.str(v, `$.asr.initialPrompt.${k}`, 200);
        }
      } else c.err('$.asr.initialPrompt', 'not_object');
    } else c.err('$.asr', 'not_object');
  }

  return c.errors.length ? { ok: false, errors: c.errors } : { ok: true, pack: input as unknown as TextRulesPack };
}

/** UTF-8 length without TextEncoder (not every JS runtime the app meets has one). */
export function utf8Length(text: string): number {
  let n = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    n += cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
  }
  return n;
}

/** Parse and check pack bytes as text. Size is checked before parsing. */
export function validatePackJson(text: string, opts: { expectLanguage?: LanguageCode } = {}): PackValidation {
  if (text.length > PACK_LIMITS.maxBytes || utf8Length(text) > PACK_LIMITS.maxBytes) return { ok: false, errors: ['$: too_large'] };
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, errors: ['$: not_json'] };
  }
  return validatePack(json, opts);
}
