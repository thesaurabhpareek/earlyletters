/**
 * Per-language quality gate (F05 section 7.1; F05-REQ-002 to F05-REQ-006;
 * WP-F05-02). Pure: no audio, no files, no processes. gate.ts runs the
 * recordings through the app's own transcription code (gate-audio.ts) and
 * hands the raw transcripts here; this file cleans them with the app's own
 * cleaning, scores them, checks the sample and the engine, and writes the
 * report. Tested on synthetic fixtures (gate.test.ts, the fictional family
 * "Asha").
 *
 * Privacy: the report and the summary hold numbers, codes and versions
 * only. No transcript, reference text, dictionary term, file name or
 * speaker label leaves `clipDetails`, which gate.ts writes only to the
 * git-ignored results folder on the founder's Mac.
 *
 * Decisions this tool does not make: which languages ship (founder, DR-01,
 * FT-34), the bars themselves (proposed [R], founder F05 Q2), the model per
 * language (ADR 0015). A report that passes is evidence for the founder,
 * never a go.
 */
import { createHash } from 'node:crypto';
import {
  ENGINE_VERSION,
  ENGLISH_PACK,
  compileRules,
  languageInfo,
  validatePackJson,
  verifyEdits,
  type DictionaryTerm,
  type Edit,
  type EditType,
  type LanguageCode,
  type ScriptCode,
  type TextRulesPack,
} from '@scribe/core';
import {
  SPEECH_MODELS,
  VAD_MODEL_ID,
  WHISPER_CPP_BUILD,
  asrModelFor,
  isSpeechLanguage,
  type SpeechLanguage,
  type SpeechModelId,
  type Tier,
} from '../apps/mobile/src/lib/models/catalog';
import { cleanSpoken, spokenEditLevel } from '../apps/mobile/src/lib/transcription-queue/clean';
import { PLAN_DEFAULTS, planChunks, vadWindows } from '../apps/mobile/src/lib/transcribe-plan';
import { joinChunks, looksLikeLoop, speechOnly } from '../apps/mobile/src/lib/transcribe-post';
import { DEFAULT_PROMPT_SEEDS, PROMPT_TOKEN_CAP, chunkPrompt, isDictionaryEcho, stripPromptEcho } from '../apps/mobile/src/lib/transcribe-prompt';
import { DECODE_OPTIONS, LOOP_RETRY_TEMPERATURE, VAD_OPTIONS } from '../apps/mobile/src/lib/transcribe-run';
import { align, dictionaryAccuracy, errorCounts, metricFor, normWords, units, type Metric } from './score';

export const GATE_SCHEMA = 'early-letters.f05-gate/1';
export const GATE_TOOL_VERSION = 1;

// ---------------------------------------------------------------------------
// Bars (F05 7.1, proposed [R]; founder F05 Q2). Data, so a changed bar is one line and a review.
// ---------------------------------------------------------------------------

export type ScriptCheckId =
  | 'es_opening_marks'
  | 'fr_no_break_spaces'
  | 'pt_no_respelling'
  | 'zh_script'
  | 'zh_full_width'
  | 'hi_devanagari'
  | 'hi_latin_english'
  | 'ar_harakat_unchanged'
  | 'ar_punctuation';

export interface LanguageBars {
  metric: Metric;
  /** Primary error after cleaning, at most (overall, or per group where `groups` is set). */
  maxError: number;
  minNames: number;
  maxPhantom: number;
  scriptChecks: ScriptCheckId[];
  /** Arabic dialect groups, Portuguese varieties: the error bar holds in each one. */
  groups?: { required?: string[]; minGroups?: number; minSpeakersPerGroup: number };
  /** 2-minute letter, Finish to text, p90 on the tier device (30 runs). */
  maxP90Seconds: number;
  minDeviceRuns: number;
}

const COMMON = { minNames: 0.95, maxPhantom: 0, maxP90Seconds: 30, minDeviceRuns: 30 } as const;

export const GATE_BARS: Record<SpeechLanguage, LanguageBars> = {
  en: { ...COMMON, metric: 'wer', maxError: 0.1, scriptChecks: [] },
  es: { ...COMMON, metric: 'wer', maxError: 0.1, scriptChecks: ['es_opening_marks'] },
  fr: { ...COMMON, metric: 'wer', maxError: 0.1, scriptChecks: ['fr_no_break_spaces'] },
  pt: { ...COMMON, metric: 'wer', maxError: 0.1, scriptChecks: ['pt_no_respelling'], groups: { required: ['pt-BR', 'pt-PT'], minSpeakersPerGroup: 5 } },
  zh: { ...COMMON, metric: 'cer', maxError: 0.1, scriptChecks: ['zh_script', 'zh_full_width'] },
  hi: { ...COMMON, metric: 'wer', maxError: 0.15, scriptChecks: ['hi_devanagari', 'hi_latin_english'] },
  ar: { ...COMMON, metric: 'wer', maxError: 0.2, scriptChecks: ['ar_harakat_unchanged', 'ar_punctuation'], groups: { minGroups: 3, minSpeakersPerGroup: 4 } },
};

/** Share bars of the script checks. Spanish 90% is F05's number; the others are this tool's proposal [R] where F05 names no number. */
export const SCRIPT_BARS: Record<ScriptCheckId, { min?: number; maxCount?: number; label: string; proposed: boolean }> = {
  es_opening_marks: { min: 0.9, label: 'Opening ¿ or ¡ where a sentence ends in ? or !', proposed: false },
  fr_no_break_spaces: { maxCount: 0, label: 'No plain space before : ; ? ! or inside « » in final text', proposed: false },
  pt_no_respelling: { maxCount: 0, label: 'No machine edit respells a word (varieties never converted)', proposed: false },
  zh_script: { min: 0.99, label: "Characters in the author's script after the script edit", proposed: false },
  zh_full_width: { min: 0.99, label: 'Full-width punctuation after Chinese characters', proposed: true },
  hi_devanagari: { min: 0.95, label: 'Hindi words written in Devanagari', proposed: false },
  hi_latin_english: { min: 0.95, label: 'English words left in Latin letters', proposed: false },
  ar_harakat_unchanged: { maxCount: 0, label: 'Clips where cleaning added or removed a haraka', proposed: false },
  ar_punctuation: { min: 0.99, label: 'Arabic punctuation after Arabic words', proposed: true },
};

/** F05-REQ-003 sample (R5 8.2): 10 speakers, 40 clips, 5 noise clips; per speaker 3 scripted, 1 unscripted, 1 whispered, 1 over white noise. */
export const SAMPLE_BARS = { minSpeakers: 10, minGatingClips: 40, minNoiseClips: 5, perSpeaker: { scripted: 3, unscripted: 1, whisper: 1, white_noise: 1 } } as const;

// ---------------------------------------------------------------------------
// Corpus
// ---------------------------------------------------------------------------

/**
 * scripted, unscripted: the gating clips. whisper, white_noise: separate
 * rows, not gating at v1.0 (R3 DX-14). noise: no speech at all (phantom
 * words). code_switched (F05-REQ-031) and wrong_language (F05 A5): reported,
 * never gating.
 */
export const CLIP_KINDS = ['scripted', 'unscripted', 'whisper', 'white_noise', 'noise', 'code_switched', 'wrong_language'] as const;
export type ClipKind = (typeof CLIP_KINDS)[number];
export const GATING_KINDS: readonly ClipKind[] = ['scripted', 'unscripted'];

export interface PhraseConfig {
  file: string;
  /** Exactly what was said ('' for a noise clip). */
  expected: string;
  /** The letter language the clip is decoded in; defaults to the config's `language`. */
  language?: string;
  speaker?: string;
  kind?: string;
  /** Arabic dialect group, Portuguese variety (pt-BR, pt-PT). */
  group?: string;
}

export interface GateConfig {
  language?: string;
  dictionary?: DictionaryTerm[];
  /** The author's script per language (Mandarin: Hans or Hant). */
  scripts?: Partial<Record<string, string>>;
  phrases: PhraseConfig[];
}

export interface Clip {
  file: string;
  expected: string;
  kind: ClipKind;
  /** Anonymous label, S01, S02, in order of first appearance; '?' when the config names none. */
  speaker: string;
  group: string | null;
}

/** The clips of one language, with problems as content-free messages (phrase numbers, never the words). */
export function clipsFor(config: GateConfig, language: SpeechLanguage): { clips: Clip[]; problems: string[] } {
  const clips: Clip[] = [];
  const problems: string[] = [];
  const speakerIds = new Map<string, string>();
  config.phrases.forEach((p, i) => {
    const lang = p.language ?? config.language ?? 'en';
    if (lang !== language) return;
    const n = i + 1;
    if (!p.file || typeof p.file !== 'string') {
      problems.push(`phrase ${n}: no file`);
      return;
    }
    const expected = typeof p.expected === 'string' ? p.expected : '';
    const kind = (p.kind ?? (expected.trim() ? 'scripted' : 'noise')) as ClipKind;
    if (!(CLIP_KINDS as readonly string[]).includes(kind)) {
      problems.push(`phrase ${n}: unknown kind (use one of ${CLIP_KINDS.join(', ')})`);
      return;
    }
    if (kind === 'noise' && expected.trim()) problems.push(`phrase ${n}: a noise clip must have empty expected text`);
    if (kind !== 'noise' && !expected.trim()) problems.push(`phrase ${n}: a speech clip needs its expected text`);
    let speaker = '?';
    if (p.speaker) {
      if (!speakerIds.has(p.speaker)) speakerIds.set(p.speaker, `S${String(speakerIds.size + 1).padStart(2, '0')}`);
      speaker = speakerIds.get(p.speaker)!;
    }
    clips.push({ file: p.file, expected, kind, speaker, group: p.group ?? null });
  });
  return { clips, problems };
}

// ---------------------------------------------------------------------------
// The language pack the app ships for this language
// ---------------------------------------------------------------------------

export interface PackInfo {
  pack: TextRulesPack;
  id: string;
  version: string;
  sha256: string;
}

export const sha256Hex = (data: string | Uint8Array): string => createHash('sha256').update(data).digest('hex');
const shortHash = (value: unknown): string => sha256Hex(JSON.stringify(value)).slice(0, 16);

/** Reads the shipped text-rules pack exactly as the app does (validatePackJson); English is the bundled pack. */
export function loadPack(language: SpeechLanguage, packText: string): PackInfo {
  const sha256 = sha256Hex(packText);
  if (language === 'en') return { pack: ENGLISH_PACK, id: 'text-rules.en', version: ENGLISH_PACK.version, sha256 };
  const v = validatePackJson(packText, { expectLanguage: language as LanguageCode });
  if (!v.ok) throw new Error(`pack_invalid: ${v.errors.slice(0, 3).join('; ')}`);
  return { pack: v.pack, id: `text-rules.${language}`, version: v.pack.version, sha256 };
}

// ---------------------------------------------------------------------------
// Fingerprint (F05-REQ-006): everything that changes what a parent would see
// ---------------------------------------------------------------------------

export interface Fingerprint {
  language: SpeechLanguage;
  tier: Tier;
  model: { id: SpeechModelId; sha256: string; shipped: boolean };
  vad: { id: SpeechModelId; sha256: string };
  pack: { id: string; version: string; sha256: string };
  engineVersion: number;
  decoder: string;
  /** Short hashes of behaviour on fixed probes, so a comment edit never marks a gate stale but a behaviour change does. */
  prompt: string;
  vadSettings: string;
  planner: string;
  post: string;
  decode: string;
}

const PROBE_DICTIONARY: DictionaryTerm[] = [
  { term: 'Asha', kind: 'child', heardAs: ['Usher'] },
  { term: 'Ashu', kind: 'nickname', heardAs: [] },
  { term: 'Nani', kind: 'family', heardAs: [] },
  { term: 'Papa', kind: 'self', heardAs: [] },
];
const PROBE_SPANS = [
  { startMs: 0, endMs: 4_000 },
  { startMs: 4_500, endMs: 9_000 },
  { startMs: 11_000, endMs: 52_000 },
  { startMs: 53_000, endMs: 55_000 },
  { startMs: 70_000, endMs: 71_000 },
];

/** The shipped model for a language and tier (ADR 0015: first hosted entry), unless a candidate is named. */
export function gateModel(language: SpeechLanguage, tier: Tier, override?: SpeechModelId): { id: SpeechModelId; shipped: boolean } {
  const shipped = asrModelFor(language, tier).id;
  if (!override) return { id: shipped, shipped: true };
  if (!(override in SPEECH_MODELS)) throw new Error(`unknown_model: ${override}`);
  return { id: override, shipped: override === shipped };
}

export function fingerprintFor(language: SpeechLanguage, tier: Tier, pack: PackInfo, modelOverride?: SpeechModelId): Fingerprint {
  const m = gateModel(language, tier, modelOverride);
  const seed = DEFAULT_PROMPT_SEEDS[language];
  return {
    language,
    tier,
    model: { id: m.id, sha256: SPEECH_MODELS[m.id].sha256, shipped: m.shipped },
    vad: { id: VAD_MODEL_ID, sha256: SPEECH_MODELS[VAD_MODEL_ID].sha256 },
    pack: { id: pack.id, version: pack.version, sha256: pack.sha256 },
    engineVersion: ENGINE_VERSION,
    decoder: `whisper.cpp ${WHISPER_CPP_BUILD.version}`,
    prompt: shortHash([seed, PROMPT_TOKEN_CAP, chunkPrompt(PROBE_DICTIONARY, language), chunkPrompt([], language)]),
    vadSettings: shortHash([VAD_OPTIONS, vadWindows(11 * 60_000)]),
    planner: shortHash([PLAN_DEFAULTS, planChunks(PROBE_SPANS, 72_000)]),
    post: shortHash([
      speechOnly('[MUSIC] Asha laughed. (applause)'),
      stripPromptEcho(`${seed} Asha.`, seed),
      looksLikeLoop('bye bye bye bye', 2_000),
      looksLikeLoop('Asha ran to Nani.', 2_000),
      isDictionaryEcho('Asha, Ashu.', 'Asha, Ashu.'),
      joinChunks(['Asha', '', 'slept.']),
    ]),
    decode: shortHash([DECODE_OPTIONS, LOOP_RETRY_TEMPERATURE]),
  };
}

/** The part of a fingerprint that decides the raw transcript (a replay may reuse raw only if this is unchanged). */
export function decodePart(f: Fingerprint): Pick<Fingerprint, 'model' | 'vad' | 'decoder' | 'prompt' | 'vadSettings' | 'planner' | 'post' | 'decode'> {
  return { model: f.model, vad: f.vad, decoder: f.decoder, prompt: f.prompt, vadSettings: f.vadSettings, planner: f.planner, post: f.post, decode: f.decode };
}

export const fingerprintId = (f: Fingerprint): string => shortHash(f);

/** Components that differ, by name ('model', 'pack', 'engineVersion', ...). Empty when the gate is current. */
export function fingerprintDiff(recorded: Fingerprint, current: Fingerprint): string[] {
  const keys = new Set([...Object.keys(recorded), ...Object.keys(current)]) as Set<keyof Fingerprint>;
  return [...keys].filter((k) => JSON.stringify(recorded[k]) !== JSON.stringify(current[k])).sort();
}

// ---------------------------------------------------------------------------
// Engine readiness (F05-REQ-004): the verifier refuses meaning changes in this script
// ---------------------------------------------------------------------------

export interface AdversarialCase {
  id: string;
  language: SpeechLanguage;
  raw: string;
  type: EditType;
  from: string;
  to: string;
  script?: ScriptCode;
  /** What the edit would do to the letter (R5 4.4). */
  harm: string;
}

/** Edits that would add meaning. Every one must be refused, in safe mode and once the pack is vetted (R5 4.4 E2 to E4, E6; F06). */
export const ADVERSARIAL: readonly AdversarialCase[] = [
  { id: 'en-mood', language: 'en', raw: 'You did it.', type: 'punctuation', from: '.', to: '?', harm: 'statement becomes a question' },
  { id: 'en-negation', language: 'en', raw: 'I did not sleep.', type: 'filler', from: ' not', to: '', harm: 'negation removed' },
  { id: 'hi-E2-gender', language: 'hi', raw: 'मेरी प्यारी बेटी सो गई।', type: 'punctuation', from: 'बेटी', to: 'बेटा', harm: 'daughter becomes son' },
  { id: 'hi-vowel-sign', language: 'hi', raw: 'मैं घर जाता हूँ।', type: 'punctuation', from: 'मैं', to: 'में', harm: 'I becomes in' },
  { id: 'hi-negation', language: 'hi', raw: 'मैं नहीं जाऊँगा।', type: 'filler', from: 'नहीं ', to: '', harm: 'negation removed' },
  { id: 'hi-mood', language: 'hi', raw: 'वह खुश है।', type: 'punctuation', from: '।', to: '?', harm: 'statement becomes a question' },
  { id: 'ar-E3-gender', language: 'ar', raw: 'أنتِ نائمة.', type: 'punctuation', from: 'أنتِ', to: 'أنتَ', harm: 'you (feminine) becomes you (masculine)' },
  { id: 'ar-E4-mood', language: 'ar', raw: 'هل أنت بخير.', type: 'punctuation', from: '.', to: '؟', harm: 'statement becomes a question' },
  { id: 'ar-harakat', language: 'ar', raw: 'ماما نامت.', type: 'punctuation', from: 'نامت', to: 'نَامَت', harm: 'harakat added' },
  { id: 'ar-negation', language: 'ar', raw: 'لا، ماما ما نامت.', type: 'filler', from: 'لا، ', to: '', harm: 'negation removed' },
  { id: 'zh-E4-mood', language: 'zh', raw: '他来了。', type: 'punctuation', from: '。', to: '？', harm: 'statement becomes a question' },
  { id: 'zh-script-wrong-way', language: 'zh', raw: '我们很开心', type: 'punctuation', from: '们', to: '們', script: 'Hans', harm: 'script edit away from the author script' },
  { id: 'zh-negation', language: 'zh', raw: '我不想睡。', type: 'filler', from: '不', to: '', harm: 'negation removed' },
  { id: 'es-accent', language: 'es', raw: 'Lo hago si quieres.', type: 'punctuation', from: 'si', to: 'sí', harm: 'if becomes yes' },
  { id: 'es-E6-opener', language: 'es', raw: 'Quieres agua? Ya.', type: 'punctuation', from: 'Ya', to: '¿Ya', harm: 'statement becomes a question' },
  { id: 'es-negation', language: 'es', raw: 'No quiero dormir.', type: 'filler', from: 'No ', to: '', harm: 'negation removed' },
  { id: 'fr-negation-ne', language: 'fr', raw: 'Je ne veux pas dormir.', type: 'filler', from: ' ne', to: '', harm: 'negation weakened' },
  { id: 'fr-negation-pas', language: 'fr', raw: 'Je ne veux pas dormir.', type: 'repeat', from: ' pas', to: '', harm: 'negation removed' },
  { id: 'pt-variety', language: 'pt', raw: 'O bebê dormiu.', type: 'punctuation', from: 'bebê', to: 'bebé', harm: 'Brazilian spelling turned European' },
  { id: 'pt-negation', language: 'pt', raw: 'Ela não dormiu.', type: 'filler', from: ' não', to: '', harm: 'negation removed' },
];

function vettedCopy(pack: TextRulesPack): TextRulesPack {
  const p = JSON.parse(JSON.stringify(pack)) as TextRulesPack;
  // The same tables packages/core's language tests raise to model a signed-off pack.
  for (const k of ['fillers', 'meaning', 'repeats', 'phonetic'] as const) {
    const table = (p as unknown as Record<string, { review?: { status: string } }>)[k];
    if (table?.review) table.review = { ...table.review, status: 'native-reviewed' };
  }
  return p;
}

function edit(raw: string, type: EditType, from: string, to: string): Edit {
  const start = raw.indexOf(from);
  if (start < 0) throw new Error('adversarial_case_broken');
  return { type, start, end: start + from.length, original: from, replacement: to, source: 'model' };
}

export interface Readiness {
  /** Case ids the verifier ACCEPTED (each one would let the machine add meaning). Must be empty. */
  accepted: string[];
  cases: number;
  /** Hindi only: words keep their vowel signs (R5 4.4 E1). */
  tokenizerKeepsMarks: boolean | null;
}

export function verifierReadiness(language: SpeechLanguage, pack: TextRulesPack, set: readonly AdversarialCase[] = ADVERSARIAL): Readiness {
  const accepted: string[] = [];
  const cases = set.filter((c) => c.language === language);
  for (const c of cases) {
    const variants = language === 'en' ? [compileRules('en', pack, c.script ? { script: c.script } : {})] : [pack, vettedCopy(pack)].map((p) => compileRules(language as LanguageCode, p, c.script ? { script: c.script } : {}));
    for (const rules of variants) {
      const r = verifyEdits([edit(c.raw, c.type, c.from, c.to)], { raw: c.raw, level: 'clean', dictionary: [], protectedSpans: [], rules });
      if (r.accepted.length > 0 && !accepted.includes(c.id)) accepted.push(c.id);
    }
  }
  const tokenizerKeepsMarks = language === 'hi' ? compileRules('hi', pack).tokens('मेरी प्यारी बेटी').length === 3 : null;
  return { accepted, cases: cases.length, tokenizerKeepsMarks };
}

// ---------------------------------------------------------------------------
// Native-speaker sign-off (F05-REQ-005)
// ---------------------------------------------------------------------------

/** `docs/qa/evidence/F05-pack-<lang>-<version>.md`, the file F05-REQ-005 asks for. */
export const signoffPath = (language: SpeechLanguage, version: string): string => `docs/qa/evidence/F05-pack-${language}-${version}.md`;

export function packSignoff(language: SpeechLanguage, pack: TextRulesPack, signoffText: string | null): { ok: boolean; missing: string[] } {
  if (language === 'en') return { ok: true, missing: [] };
  const missing: string[] = [];
  if (signoffText === null) missing.push('sign-off file');
  else {
    if (!/reviewer role\s*:\s*\S/i.test(signoffText)) missing.push('reviewer role line');
    if (!/date\s*:\s*\d{4}-\d{2}-\d{2}/i.test(signoffText)) missing.push('date line (YYYY-MM-DD)');
  }
  for (const k of ['fillers', 'repeats', 'punctuation'] as const) {
    const status = (pack as unknown as Record<string, { review?: { status?: string } }>)[k]?.review?.status;
    if (status !== 'native-reviewed') missing.push(`${k} table is ${status ?? 'absent'}, not native-reviewed`);
  }
  return { ok: missing.length === 0, missing };
}

// ---------------------------------------------------------------------------
// Scoring one clip
// ---------------------------------------------------------------------------

/** What the decoder gave for one clip (gate-audio.ts, or a replay of its cache). */
export interface ClipOutcome {
  file: string;
  raw: string;
  /** Seconds the Mac took; never a device figure. */
  seconds?: number;
  /** Chunks flagged as repetition loops. */
  loops?: number;
}

export type ScriptCounts = Partial<Record<string, number>>;

export interface ClipScore {
  clip: Clip;
  refUnits: number;
  errorsRaw: number;
  errorsClean: number;
  namesSaid: number;
  namesRight: number;
  phantom: number;
  loops: number;
  script: ScriptCounts;
  /** Text, for the founder's own review only (results folder, git-ignored). Never in a report. */
  text: { expected: string; raw: string; clean: string };
}

const HAN = /\p{Script=Han}/u;
const ARABIC_LETTER = /\p{Script=Arabic}/u;
const HARAKAT = /[ً-ْٰ]/g;
const isScript = (word: string, script: 'Devanagari' | 'Latin' | 'Arabic') => new RegExp(`\\p{Script=${script}}`, 'u').test(word);
const lettersOf = (s: string) => s.normalize('NFC').replace(/[^\p{L}\p{M}\p{N}]/gu, '');

/** Counts behind each script check, summed over clips (numerators and denominators by name). */
export function scriptCounts(language: SpeechLanguage, c: { expected: string; raw: string; clean: string; applied: Edit[] }, opts: { script?: ScriptCode; pack: TextRulesPack }): ScriptCounts {
  const out: ScriptCounts = {};
  const text = c.clean;
  if (language === 'es') {
    const sentences = text.split(/(?<=[.!?\u2026])\s+/).map((s) => s.trim()).filter(Boolean);
    for (const s of sentences) {
      const end = s[s.length - 1];
      if (end !== '?' && end !== '!') continue;
      out.es_total = (out.es_total ?? 0) + 1;
      if (s.includes(end === '?' ? '¿' : '¡')) out.es_ok = (out.es_ok ?? 0) + 1;
    }
  }
  if (language === 'fr') {
    out.fr_plain = (text.match(/ [:;?!»]|« /g) ?? []).length;
  }
  if (language === 'pt') {
    out.pt_respellings = c.applied.filter((e) => e.type !== 'stt_fix' && e.replacement !== '' && lettersOf(e.original) !== lettersOf(e.replacement)).length;
  }
  if (language === 'zh') {
    const target = opts.script ?? 'Hans';
    const other = new Set(Array.from(opts.pack.scriptVariants?.targets?.[target]?.from ?? ''));
    for (const ch of Array.from(text)) {
      if (!HAN.test(ch)) continue;
      out.zh_han = (out.zh_han ?? 0) + 1;
      if (other.has(ch)) out.zh_other_script = (out.zh_other_script ?? 0) + 1;
    }
    const chars = Array.from(text);
    for (let i = 1; i < chars.length; i++) {
      if (!HAN.test(chars[i - 1])) continue;
      if ('，。？！：；、'.includes(chars[i])) out.zh_punct = (out.zh_punct ?? 0) + 1;
      else if (',.?!:;'.includes(chars[i])) {
        out.zh_punct = (out.zh_punct ?? 0) + 1;
        out.zh_punct_ascii = (out.zh_punct_ascii ?? 0) + 1;
      }
    }
  }
  if (language === 'hi') {
    for (const o of align(normWords(c.expected, 'hi'), normWords(text, 'hi'))) {
      if (o.op !== 'match' && o.op !== 'sub') continue;
      if (isScript(o.ref, 'Devanagari')) {
        out.hi_deva_total = (out.hi_deva_total ?? 0) + 1;
        if (isScript(o.hyp, 'Devanagari')) out.hi_deva_ok = (out.hi_deva_ok ?? 0) + 1;
        if (isScript(o.hyp, 'Arabic')) out.hi_urdu_script = (out.hi_urdu_script ?? 0) + 1;
      } else if (isScript(o.ref, 'Latin')) {
        out.hi_latin_total = (out.hi_latin_total ?? 0) + 1;
        if (isScript(o.hyp, 'Latin')) out.hi_latin_ok = (out.hi_latin_ok ?? 0) + 1;
      }
    }
  }
  if (language === 'ar') {
    const before = (c.raw.match(HARAKAT) ?? []).join('');
    const after = (text.match(HARAKAT) ?? []).join('');
    out.ar_harakat_changed = before === after ? 0 : 1;
    const chars = Array.from(text);
    for (let i = 1; i < chars.length; i++) {
      if (!ARABIC_LETTER.test(chars[i - 1]) || '،؛؟'.includes(chars[i - 1])) continue;
      if ('،؛؟'.includes(chars[i])) out.ar_punct = (out.ar_punct ?? 0) + 1;
      else if (',;?'.includes(chars[i])) {
        out.ar_punct = (out.ar_punct ?? 0) + 1;
        out.ar_punct_ascii = (out.ar_punct_ascii ?? 0) + 1;
      }
    }
  }
  return out;
}

export interface ScoreContext {
  language: SpeechLanguage;
  pack: TextRulesPack;
  dictionary: DictionaryTerm[];
  script?: ScriptCode;
}

/** Cleans the raw transcript exactly as Review does (cleanSpoken with the language's pack) and scores it. */
export function scoreClip(clip: Clip, outcome: ClipOutcome, ctx: ScoreContext): ClipScore {
  const { language } = ctx;
  const cleaned = cleanSpoken(outcome.raw, ctx.dictionary, language, spokenEditLevel(language), {
    pack: ctx.pack,
    ...(ctx.script ? { script: ctx.script } : {}),
  });
  const speech = clip.kind !== 'noise';
  const raw = speech ? errorCounts(clip.expected, outcome.raw, language) : { errors: 0, refUnits: 0, hypUnits: 0 };
  const clean = speech ? errorCounts(clip.expected, cleaned.text, language) : { errors: 0, refUnits: 0, hypUnits: 0 };
  const names = speech ? dictionaryAccuracy(clip.expected, cleaned.text, ctx.dictionary) : { hits: 0, total: 0 };
  return {
    clip,
    refUnits: clean.refUnits,
    errorsRaw: raw.errors,
    errorsClean: clean.errors,
    namesSaid: names.total,
    namesRight: names.hits,
    phantom: speech ? 0 : units(outcome.raw, language).length,
    loops: outcome.loops ?? 0,
    script: speech ? scriptCounts(language, { expected: clip.expected, raw: outcome.raw, clean: cleaned.text, applied: cleaned.applied }, { script: ctx.script, pack: ctx.pack }) : {},
    text: { expected: clip.expected, raw: outcome.raw, clean: cleaned.text },
  };
}

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

/** Small seeded PRNG (mulberry32): the same corpus always gives the same interval. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rateOf = (rows: Array<{ errors: number; ref: number }>): number | null => {
  const ref = rows.reduce((n, r) => n + r.ref, 0);
  return ref > 0 ? rows.reduce((n, r) => n + r.errors, 0) / ref : null;
};

/**
 * Per-speaker (cluster) bootstrap 95% interval of the corpus error rate
 * (F05 7.1 Statistics): speakers are resampled with replacement, so one
 * speaker's many clips cannot narrow the interval. null under 2 speakers.
 */
export function speakerBootstrap(rows: Array<{ speaker: string; errors: number; ref: number }>, iterations = 2_000, seed = 20_261_015): [number, number] | null {
  const bySpeaker = new Map<string, { errors: number; ref: number }>();
  for (const r of rows) {
    const s = bySpeaker.get(r.speaker) ?? { errors: 0, ref: 0 };
    s.errors += r.errors;
    s.ref += r.ref;
    bySpeaker.set(r.speaker, s);
  }
  const speakers = [...bySpeaker.keys()].sort().map((k) => bySpeaker.get(k)!);
  if (speakers.length < 2) return null;
  const next = rng(seed);
  const rates: number[] = [];
  for (let b = 0; b < iterations; b++) {
    let errors = 0;
    let ref = 0;
    for (let i = 0; i < speakers.length; i++) {
      const s = speakers[Math.floor(next() * speakers.length)];
      errors += s.errors;
      ref += s.ref;
    }
    if (ref > 0) rates.push(errors / ref);
  }
  if (!rates.length) return null;
  rates.sort((a, b) => a - b);
  const at = (q: number) => rates[Math.min(rates.length - 1, Math.max(0, Math.ceil(q * rates.length) - 1))];
  return [at(0.025), at(0.975)];
}

/** Nearest-rank percentile. */
export function percentile(values: readonly number[], q: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1))];
}

// ---------------------------------------------------------------------------
// Device runs (S1-17, recorded by hand on the iPhone; F05-REQ-040 numbers)
// ---------------------------------------------------------------------------

export interface DeviceRun {
  language: string;
  tier: Tier;
  /** "iPhone SE (3rd generation)": the tier device for the full tier. */
  device?: string;
  build?: string;
  audioSeconds: number;
  /** Finish tapped to words on screen. */
  finishToTextSeconds: number;
  jetsam?: boolean;
  peakMemoryMB?: number;
  batteryPercent?: number;
}

export interface DeviceSummary {
  runs: number;
  twoMinuteRuns: number;
  p90Seconds: number | null;
  jetsams: number;
  peakMemoryMB: number | null;
  devices: string[];
}

export function deviceSummary(runs: readonly DeviceRun[], language: SpeechLanguage, tier: Tier): DeviceSummary {
  const mine = runs.filter((r) => r.language === language && r.tier === tier && Number.isFinite(r.finishToTextSeconds));
  const twoMinute = mine.filter((r) => r.audioSeconds >= 110 && r.audioSeconds <= 130);
  const mem = mine.map((r) => r.peakMemoryMB).filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
  return {
    runs: mine.length,
    twoMinuteRuns: twoMinute.length,
    p90Seconds: percentile(
      twoMinute.map((r) => r.finishToTextSeconds),
      0.9,
    ),
    jetsams: mine.filter((r) => r.jetsam === true).length,
    peakMemoryMB: mem.length ? Math.max(...mem) : null,
    devices: [...new Set(mine.map((r) => r.device).filter((d): d is string => !!d))].sort(),
  };
}

// ---------------------------------------------------------------------------
// The report
// ---------------------------------------------------------------------------

export type CheckStatus = 'pass' | 'fail' | 'missing';

export interface GateCheck {
  id: string;
  requirement: 'F05-REQ-002' | 'F05-REQ-003' | 'F05-REQ-004' | 'F05-REQ-005' | 'F05-REQ-006';
  label: string;
  status: CheckStatus;
  value: number | string | null;
  bar: string;
  note?: string;
}

export interface RateRow {
  clips: number;
  speakers: number;
  raw: number | null;
  clean: number | null;
  ci95: [number, number] | null;
}

export interface GateReport {
  schema: typeof GATE_SCHEMA;
  tool: number;
  language: SpeechLanguage;
  tier: Tier;
  generatedAt: string;
  /** True only when every check passes. Evidence for the founder's FT-34 decision, never the decision. */
  passed: boolean;
  failing: string[];
  /** The interval's upper end crosses the error bar: the founder sees the interval before the language ships (F05 7.1). */
  founderReview: boolean;
  fingerprint: Fingerprint;
  fingerprintId: string;
  /** Raw transcripts reused from an earlier decode with the same decode fingerprint (cleaning re-run). */
  replayed: boolean;
  /** The whisper.cpp tag the Mac actually ran (null: unknown). The fingerprint holds the version the app bundles. */
  decoderSeen: string | null;
  sample: {
    speakers: number;
    gatingClips: number;
    noiseClips: number;
    byKind: Partial<Record<ClipKind, number>>;
    groups: Record<string, number>;
  };
  metrics: {
    metric: Metric;
    overall: RateRow;
    groups: Record<string, RateRow>;
    kinds: Partial<Record<ClipKind, RateRow>>;
    names: number | null;
    phantomUnits: number;
    loops: number;
    script: Partial<Record<ScriptCheckId, number | null>>;
    device: DeviceSummary | null;
    macSecondsPerClip: number | null;
  };
  checks: GateCheck[];
}

export interface GateInput {
  language: SpeechLanguage;
  tier: Tier;
  clips: Clip[];
  outcomes: ReadonlyMap<string, ClipOutcome>;
  packText: string;
  dictionary: DictionaryTerm[];
  script?: ScriptCode;
  signoffText: string | null;
  deviceRuns: readonly DeviceRun[];
  /** `git describe` of the whisper.cpp the Mac used; null when unknown. */
  decoderVersion: string | null;
  /** SHA-256 of the model file the Mac actually loaded. */
  modelFileSha256: string | null;
  /** SHA-256 of the voice detector file the Mac loaded (null: not checked). */
  vadFileSha256?: string | null;
  modelOverride?: SpeechModelId;
  replayed?: boolean;
  generatedAt: string;
}

const pctText = (n: number) => `${(n * 100).toFixed(1)}%`;

function rateRow(scores: ClipScore[]): RateRow {
  const rows = scores.map((s) => ({ speaker: s.clip.speaker, errors: s.errorsClean, ref: s.refUnits }));
  return {
    clips: scores.length,
    speakers: new Set(scores.map((s) => s.clip.speaker)).size,
    raw: rateOf(scores.map((s) => ({ errors: s.errorsRaw, ref: s.refUnits }))),
    clean: rateOf(rows),
    ci95: speakerBootstrap(rows),
  };
}

const sum = (scores: ClipScore[], key: string) => scores.reduce((n, s) => n + (s.script[key] ?? 0), 0);
const share = (ok: number, total: number) => (total > 0 ? ok / total : null);

function scriptValue(id: ScriptCheckId, s: ClipScore[]): number | null {
  switch (id) {
    case 'es_opening_marks':
      return share(sum(s, 'es_ok'), sum(s, 'es_total'));
    case 'fr_no_break_spaces':
      return sum(s, 'fr_plain');
    case 'pt_no_respelling':
      return sum(s, 'pt_respellings');
    case 'zh_script':
      return share(sum(s, 'zh_han') - sum(s, 'zh_other_script'), sum(s, 'zh_han'));
    case 'zh_full_width':
      return share(sum(s, 'zh_punct') - sum(s, 'zh_punct_ascii'), sum(s, 'zh_punct'));
    case 'hi_devanagari':
      return share(sum(s, 'hi_deva_ok'), sum(s, 'hi_deva_total'));
    case 'hi_latin_english':
      return share(sum(s, 'hi_latin_ok'), sum(s, 'hi_latin_total'));
    case 'ar_harakat_unchanged':
      return sum(s, 'ar_harakat_changed');
    case 'ar_punctuation':
      return share(sum(s, 'ar_punct') - sum(s, 'ar_punct_ascii'), sum(s, 'ar_punct'));
  }
}

/** Scores every clip and builds the report plus the per-clip details (details hold text: local results only). */
export function buildGateReport(input: GateInput): { report: GateReport; details: ClipScore[] } {
  const { language, tier } = input;
  if (!isSpeechLanguage(language)) throw new Error('unknown_language');
  const bars = GATE_BARS[language];
  const pack = loadPack(language, input.packText);
  const fingerprint = fingerprintFor(language, tier, pack, input.modelOverride);
  const ctx: ScoreContext = { language, pack: pack.pack, dictionary: input.dictionary, script: input.script };

  const details: ClipScore[] = [];
  for (const clip of input.clips) {
    const outcome = input.outcomes.get(clip.file);
    if (outcome) details.push(scoreClip(clip, outcome, ctx));
  }
  const missingOutcomes = input.clips.length - details.length;
  const gating = details.filter((d) => GATING_KINDS.includes(d.clip.kind));
  const noise = details.filter((d) => d.clip.kind === 'noise');

  const checks: GateCheck[] = [];
  const add = (c: GateCheck) => checks.push(c);
  const metricName = bars.metric === 'cer' ? 'Character error' : 'Word error';

  // F05-REQ-002: accuracy bars
  const overall = rateRow(gating);
  const groups: Record<string, RateRow> = {};
  for (const g of [...new Set(gating.map((d) => d.clip.group).filter((x): x is string => !!x))].sort()) {
    groups[g] = rateRow(gating.filter((d) => d.clip.group === g));
  }
  const errorBar = `${pctText(bars.maxError)} or less`;
  if (bars.groups) {
    const required = bars.groups.required ?? Object.keys(groups);
    for (const g of required.length ? required : ['(none)']) {
      const row = groups[g];
      add({
        id: `error_rate.${g}`,
        requirement: 'F05-REQ-002',
        label: `${metricName} after cleaning, ${g}`,
        status: !row || row.clean === null ? 'missing' : row.clean <= bars.maxError ? 'pass' : 'fail',
        value: row?.clean ?? null,
        bar: errorBar,
      });
    }
  } else {
    add({
      id: 'error_rate',
      requirement: 'F05-REQ-002',
      label: `${metricName} after cleaning`,
      status: overall.clean === null ? 'missing' : overall.clean <= bars.maxError ? 'pass' : 'fail',
      value: overall.clean,
      bar: errorBar,
    });
  }
  const namesSaid = gating.reduce((n, d) => n + d.namesSaid, 0);
  const names = namesSaid ? gating.reduce((n, d) => n + d.namesRight, 0) / namesSaid : null;
  add({
    id: 'names',
    requirement: 'F05-REQ-002',
    label: 'Names and family words spelled the family way, after cleaning',
    status: names === null ? 'missing' : names >= bars.minNames ? 'pass' : 'fail',
    value: names,
    bar: `${pctText(bars.minNames)} or more`,
    note: names === null ? 'no dictionary term was said in a gating clip' : undefined,
  });
  const phantomUnits = noise.reduce((n, d) => n + d.phantom, 0);
  add({
    id: 'phantom_words',
    requirement: 'F05-REQ-002',
    label: 'Words invented on noise-only clips',
    status: noise.length === 0 ? 'missing' : phantomUnits <= bars.maxPhantom ? 'pass' : 'fail',
    value: noise.length ? phantomUnits : null,
    bar: '0',
  });
  const script: Partial<Record<ScriptCheckId, number | null>> = {};
  for (const id of bars.scriptChecks) {
    const value = scriptValue(id, gating);
    script[id] = value;
    const b = SCRIPT_BARS[id];
    const ok = value !== null && (b.min !== undefined ? value >= b.min : value <= (b.maxCount ?? 0));
    add({
      id,
      requirement: 'F05-REQ-002',
      label: b.label,
      status: value === null ? 'missing' : ok ? 'pass' : 'fail',
      value,
      bar: b.min !== undefined ? `${pctText(b.min)} or more${b.proposed ? ' (proposed by this tool)' : ''}` : `${b.maxCount ?? 0}`,
      note: value === null ? 'nothing in the corpus to measure this on; add clips that contain it' : undefined,
    });
  }
  const device = input.deviceRuns.length ? deviceSummary(input.deviceRuns, language, tier) : null;
  add({
    id: 'speed_p90',
    requirement: 'F05-REQ-002',
    label: '2-minute letter, Finish to text, p90 on the tier device',
    status: !device || device.twoMinuteRuns < bars.minDeviceRuns || device.p90Seconds === null ? 'missing' : device.p90Seconds <= bars.maxP90Seconds ? 'pass' : 'fail',
    value: device?.p90Seconds ?? null,
    bar: `${bars.maxP90Seconds} s or less over ${bars.minDeviceRuns} runs`,
    note: !device ? 'no device runs given (--device); measured on the iPhone, never on this Mac' : device.twoMinuteRuns < bars.minDeviceRuns ? `${device.twoMinuteRuns} of ${bars.minDeviceRuns} runs` : undefined,
  });
  add({
    id: 'jetsam',
    requirement: 'F05-REQ-002',
    label: 'App killed for memory during a transcription',
    status: !device || device.runs < bars.minDeviceRuns ? (device && device.jetsams > 0 ? 'fail' : 'missing') : device.jetsams === 0 ? 'pass' : 'fail',
    value: device?.jetsams ?? null,
    bar: `0 in ${bars.minDeviceRuns} runs`,
  });

  // F05-REQ-003: sample
  const speakers = new Set(gating.map((d) => d.clip.speaker).filter((s) => s !== '?'));
  const byKind: Partial<Record<ClipKind, number>> = {};
  for (const d of details) byKind[d.clip.kind] = (byKind[d.clip.kind] ?? 0) + 1;
  add({ id: 'sample.speakers', requirement: 'F05-REQ-003', label: 'Native speakers with gating clips', status: speakers.size >= SAMPLE_BARS.minSpeakers ? 'pass' : 'fail', value: speakers.size, bar: `${SAMPLE_BARS.minSpeakers} or more` });
  add({ id: 'sample.clips', requirement: 'F05-REQ-003', label: 'Gating clips (scripted and unscripted letters)', status: gating.length >= SAMPLE_BARS.minGatingClips ? 'pass' : 'fail', value: gating.length, bar: `${SAMPLE_BARS.minGatingClips} or more` });
  add({ id: 'sample.noise', requirement: 'F05-REQ-003', label: 'Noise-only clips', status: noise.length >= SAMPLE_BARS.minNoiseClips ? 'pass' : 'fail', value: noise.length, bar: `${SAMPLE_BARS.minNoiseClips} or more` });
  const short: string[] = [];
  for (const sp of [...speakers].sort()) {
    const mine = details.filter((d) => d.clip.speaker === sp);
    for (const [kind, need] of Object.entries(SAMPLE_BARS.perSpeaker)) {
      if (mine.filter((d) => d.clip.kind === kind).length < need) {
        short.push(sp);
        break;
      }
    }
  }
  add({
    id: 'sample.per_speaker',
    requirement: 'F05-REQ-003',
    label: 'Speakers with 3 scripted, 1 unscripted, 1 whispered and 1 white-noise clip',
    status: speakers.size > 0 && short.length === 0 ? 'pass' : 'fail',
    value: speakers.size - short.length,
    bar: 'every speaker',
  });
  const groupSpeakers: Record<string, number> = {};
  for (const g of Object.keys(groups)) groupSpeakers[g] = new Set(gating.filter((d) => d.clip.group === g).map((d) => d.clip.speaker)).size;
  if (bars.groups) {
    const g = bars.groups;
    const enough = Object.entries(groupSpeakers).filter(([, n]) => n >= g.minSpeakersPerGroup).map(([k]) => k);
    const ok = g.required ? g.required.every((r) => enough.includes(r)) : enough.length >= (g.minGroups ?? 1);
    add({
      id: 'sample.groups',
      requirement: 'F05-REQ-003',
      label: g.required ? `Speakers per variety (${g.required.join(', ')})` : 'Dialect groups with enough speakers',
      status: ok ? 'pass' : 'fail',
      value: g.required ? g.required.map((r) => `${r} ${groupSpeakers[r] ?? 0}`).join(', ') : enough.length,
      bar: g.required ? `${g.minSpeakersPerGroup} or more in each` : `${g.minGroups} groups of ${g.minSpeakersPerGroup} or more`,
    });
  }
  if (missingOutcomes > 0) {
    add({ id: 'sample.decoded', requirement: 'F05-REQ-003', label: 'Clips in the config that were decoded', status: 'fail', value: details.length, bar: `all ${input.clips.length}` });
  }

  // F05-REQ-004: the verifier is ready for this script
  const readiness = verifierReadiness(language, pack.pack);
  const ready = readiness.accepted.length === 0 && readiness.tokenizerKeepsMarks !== false;
  add({
    id: 'verifier',
    requirement: 'F05-REQ-004',
    label: 'Engine refuses every meaning change in the adversarial set (R5 4.4)',
    status: ready ? 'pass' : 'fail',
    value: ready ? `${readiness.cases} refused` : 'verifier_not_ready',
    bar: 'every case refused',
    note: ready ? undefined : `accepted: ${readiness.accepted.join(', ') || 'none'}; Devanagari tokens keep marks: ${readiness.tokenizerKeepsMarks}`,
  });

  // F05-REQ-005: native-speaker sign-off for this pack version
  const signoff = packSignoff(language, pack.pack, input.signoffText);
  add({
    id: 'pack_signoff',
    requirement: 'F05-REQ-005',
    label: language === 'en' ? 'Bundled English pack (reviewed tables)' : `Native-speaker sign-off, ${signoffPath(language, pack.version)}`,
    status: signoff.ok ? 'pass' : input.signoffText === null ? 'missing' : 'fail',
    value: signoff.ok ? 'present' : null,
    bar: 'file names the reviewer role and date; fillers, repeats and punctuation tables native-reviewed',
    note: signoff.ok ? undefined : signoff.missing.join('; '),
  });

  // F05-REQ-006: this run used what ships
  const vadOk = input.vadFileSha256 == null || input.vadFileSha256 === fingerprint.vad.sha256;
  const fileOk = input.modelFileSha256 === null ? null : input.modelFileSha256 === fingerprint.model.sha256 && vadOk;
  add({
    id: 'model_shipped',
    requirement: 'F05-REQ-006',
    label: 'The model file is the one the app ships for this language and tier',
    status: !fingerprint.model.shipped || fileOk === false ? 'fail' : fileOk === null ? 'missing' : 'pass',
    value: fingerprint.model.id,
    bar: asrModelFor(language, tier).id,
    note: !fingerprint.model.shipped
      ? 'candidate evaluation: a pass here cannot ship this language'
      : fileOk === false
        ? `${vadOk ? 'model' : 'voice detector'} file SHA-256 differs from the catalog`
        : fileOk === null
          ? 'model file not checked'
          : undefined,
  });
  const decoderOk = input.decoderVersion === null ? null : input.decoderVersion === WHISPER_CPP_BUILD.version;
  add({
    id: 'decoder',
    requirement: 'F05-REQ-006',
    label: 'Decoder is the whisper.cpp version whisper.rn bundles',
    status: decoderOk === null ? 'missing' : decoderOk ? 'pass' : 'fail',
    value: input.decoderVersion,
    bar: WHISPER_CPP_BUILD.version,
  });

  const failing = checks.filter((c) => c.status !== 'pass').map((c) => c.id);
  const ciCrosses = (row: RateRow | undefined) => !!row?.ci95 && row.clean !== null && row.clean <= bars.maxError && row.ci95[1] > bars.maxError;
  const founderReview = bars.groups ? Object.values(groups).some(ciCrosses) : ciCrosses(overall);
  const kinds: Partial<Record<ClipKind, RateRow>> = {};
  for (const k of CLIP_KINDS) {
    if (k === 'noise') continue;
    const rows = details.filter((d) => d.clip.kind === k);
    if (rows.length) kinds[k] = rateRow(rows);
  }
  const secs = details.map((d) => input.outcomes.get(d.clip.file)?.seconds).filter((n): n is number => typeof n === 'number');

  const report: GateReport = {
    schema: GATE_SCHEMA,
    tool: GATE_TOOL_VERSION,
    language,
    tier,
    generatedAt: input.generatedAt,
    passed: failing.length === 0,
    failing,
    founderReview,
    fingerprint,
    fingerprintId: fingerprintId(fingerprint),
    replayed: input.replayed === true,
    decoderSeen: input.decoderVersion,
    sample: { speakers: speakers.size, gatingClips: gating.length, noiseClips: noise.length, byKind, groups: groupSpeakers },
    metrics: {
      metric: bars.metric,
      overall,
      groups,
      kinds,
      names,
      phantomUnits,
      loops: details.reduce((n, d) => n + d.loops, 0),
      script,
      device,
      macSecondsPerClip: secs.length ? secs.reduce((a, b) => a + b, 0) / secs.length : null,
    },
    checks,
  };
  return { report, details };
}

// ---------------------------------------------------------------------------
// Summary for docs/qa/evidence/F05-gate-<lang>.md (numbers only; one section per tier)
// ---------------------------------------------------------------------------

export const evidencePath = (language: SpeechLanguage): string => `docs/qa/evidence/F05-gate-${language}.md`;
const START = (tier: Tier) => `<!-- gate:${tier}:start -->`;
const END = (tier: Tier) => `<!-- gate:${tier}:end -->`;
const FINGERPRINT_RE = /<!-- gate-fingerprint (\{.*?\}) -->/;

const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`;
const show = (v: number | string | null, asShare: boolean) => (v === null ? 'not measured' : typeof v === 'number' ? (asShare && v <= 1 ? pctText(v) : String(Number.isInteger(v) ? v : v.toFixed(2))) : v);

export function renderTierSection(r: GateReport): string {
  const ci = r.metrics.overall.ci95 ? `${pctText(r.metrics.overall.ci95[0])} to ${pctText(r.metrics.overall.ci95[1])}` : 'needs 2 or more speakers';
  const lines = [
    START(r.tier),
    `<!-- gate-fingerprint ${JSON.stringify(r.fingerprint)} -->`,
    `### ${r.tier === 'full' ? 'Full tier (4 GB and up; tier device iPhone SE 3)' : 'Compact tier (under 4 GB, or after 2 memory kills)'}`,
    '',
    `- Result: **${r.passed ? 'every check passes' : `does not pass (${r.failing.length} of ${r.checks.length} checks open)`}**${r.founderReview ? '; the interval crosses the bar, so the founder reviews it before the language ships' : ''}`,
    `- Generated ${r.generatedAt} by experiments/gate.ts (tool ${r.tool}), fingerprint ${r.fingerprintId}${r.replayed ? ', cleaning re-run on stored raw transcripts' : ''}`,
    `- Model ${r.fingerprint.model.id}${r.fingerprint.model.shipped ? '' : ' (candidate, not what ships)'}, pack ${r.fingerprint.pack.id} ${r.fingerprint.pack.version}, engine ${r.fingerprint.engineVersion}; decoder run ${r.decoderSeen ? `whisper.cpp ${r.decoderSeen}` : 'unknown'} (the app bundles ${r.fingerprint.decoder})`,
    `- Sample: ${count(r.sample.speakers, 'speaker')}, ${count(r.sample.gatingClips, 'gating clip')}, ${count(r.sample.noiseClips, 'noise clip')}`,
    `- ${r.metrics.metric.toUpperCase()} after cleaning ${show(r.metrics.overall.clean, true)} (raw ${show(r.metrics.overall.raw, true)}), per-speaker 95% interval ${ci}`,
    ...Object.entries(r.metrics.groups).map(([g, row]) => `- ${g}: ${show(row.clean, true)} over ${row.speakers} speakers`),
    ...Object.entries(r.metrics.kinds)
      .filter(([k]) => !GATING_KINDS.includes(k as ClipKind))
      .map(([k, row]) => `- ${k.replace('_', ' ')} clips (reported, not gating): ${show(row!.clean, true)} over ${row!.clips} clips`),
    '',
    '| Check | Requirement | Value | Bar | Status |',
    '|---|---|---|---|---|',
    ...r.checks.map((c) => `| ${c.label} | ${c.requirement} | ${show(c.value, c.id !== 'phantom_words' && c.id !== 'jetsam' && !c.id.startsWith('sample') && c.id !== 'fr_no_break_spaces' && c.id !== 'pt_no_respelling' && c.id !== 'ar_harakat_unchanged' && c.id !== 'speed_p90')} | ${c.bar} | ${c.status}${c.note ? `: ${c.note}` : ''} |`),
    END(r.tier),
  ];
  return lines.join('\n');
}

export function newEvidenceFile(language: SpeechLanguage): string {
  const name = languageInfo(language as LanguageCode).english;
  return [
    `# F05 gate: ${name} (${language})`,
    '',
    'Written by `npm run gate` (experiments/gate.ts). Numbers, versions and codes only: no recording, transcript, name or speaker is in this file. Bars and rules: `docs/prd/v2/features/F05-transcription.md` section 7.1 (proposed bars, founder question Q2). Raw reports stay on the Mac in `experiments/reports/` (git-ignored).',
    '',
    '## Founder decision (FT-34, DR-01)',
    '',
    'Which languages ship is the founder\'s decision. A report that passes is evidence, not a go.',
    '',
    '- Decision (go, no-go, or record and type):',
    '- Exceptions to a bar, with the reason:',
    '- Signed by:',
    '- Date:',
    '',
    '## Gate results',
    '',
  ].join('\n');
}

/** Replaces (or adds) this tier's section; the founder's decision lines are never touched. */
export function mergeEvidence(existing: string | null, language: SpeechLanguage, section: string, tier: Tier): string {
  const base = existing ?? newEvidenceFile(language);
  const start = base.indexOf(START(tier));
  const end = base.indexOf(END(tier));
  if (start >= 0 && end > start) return `${base.slice(0, start)}${section}${base.slice(end + END(tier).length)}`;
  return `${base.replace(/\s*$/, '\n\n')}${section}\n`;
}

export interface Staleness {
  language: SpeechLanguage;
  tier: Tier;
  status: 'current' | 'stale';
  /** Fingerprint components that changed since the gate ran (model, pack, engineVersion, prompt, vadSettings, planner, ...). */
  changed: string[];
}

/**
 * F05-REQ-006: a recorded gate is stale once the model file, pack, prompt
 * rendering, voice detector settings, chunk planner, clean-up or engine
 * version it ran on has changed. CI and the manifest build call this
 * (`npm run gate -- --check`); a stale language must be gated again before
 * its pack or model is published.
 */
export function staleness(language: SpeechLanguage, evidenceText: string, packText: string): Staleness[] {
  const pack = loadPack(language, packText);
  const out: Staleness[] = [];
  for (const [tier, recorded] of Object.entries(recordedFingerprints(evidenceText)) as Array<[Tier, Fingerprint]>) {
    const current = fingerprintFor(language, tier, pack, recorded.model?.shipped === false ? recorded.model.id : undefined);
    const changed = fingerprintDiff(recorded, current);
    out.push({ language, tier, status: changed.length ? 'stale' : 'current', changed });
  }
  return out;
}

/** Fingerprints recorded per tier in an evidence file (F05-REQ-006 stale check). */
export function recordedFingerprints(evidence: string): Partial<Record<Tier, Fingerprint>> {
  const out: Partial<Record<Tier, Fingerprint>> = {};
  for (const tier of ['full', 'compact'] as const) {
    const start = evidence.indexOf(START(tier));
    const end = evidence.indexOf(END(tier));
    if (start < 0 || end < start) continue;
    const m = evidence.slice(start, end).match(FINGERPRINT_RE);
    if (!m) continue;
    try {
      out[tier] = JSON.parse(m[1]) as Fingerprint;
    } catch {
      // an edited, unreadable fingerprint counts as no record
    }
  }
  return out;
}
