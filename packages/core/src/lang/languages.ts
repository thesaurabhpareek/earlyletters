/**
 * The v1.0 spoken-letter languages: names, scripts and the facts the
 * engine needs before (or without) a downloaded pack. Small and bundled;
 * the word tables live in the packs.
 *
 * Native names follow Unicode CLDR as written in each language's own
 * list UI (capitalised, as iOS shows them in Settings, General, Language).
 */
import type { LanguageCode, PackScript, ScriptCode } from './types';

export interface LanguageInfo {
  code: LanguageCode;
  /** English name, for the English UI and search. */
  english: string;
  /** The language's own name, shown first in the picker. */
  native: string;
  /** Extra search terms: other spellings and names people type. */
  aliases: string[];
  script: PackScript;
  /** Sentence enders beyond ASCII . ! ? (Devanagari danda, Chinese full stop). */
  sentenceEnd: string[];
  /** Mark added at the end of a letter once the pack's punctuation table is vetted. */
  terminal: string;
  /** Which scripts an author can choose, with their own names (zh: 简体中文, 繁體中文). */
  scriptChoices: Array<{ script: ScriptCode; native: string; english: string }>;
  /**
   * Regional spelling standards an author can choose (Portuguese: Brazil or
   * Portugal). It labels the author's language for the keyboard and the
   * recogniser; the engine NEVER respells between them (fato and facto,
   * bebê and bebé are both right, each where it is written).
   */
  regions: Array<{ tag: string; native: string; english: string }>;
  /** BCP 47 tag for the keyboard and for Whisper ("zh" covers both scripts). */
  bcp47: string;
}

const LATIN: PackScript = { primary: 'Latn', variants: [], direction: 'ltr', cased: true, segmentation: 'space' };

export const LANGUAGES: readonly LanguageInfo[] = [
  {
    code: 'en',
    english: 'English',
    native: 'English',
    aliases: ['english', 'inglés', 'anglais', 'inglês', 'अंग्रेज़ी', 'अंग्रेजी', '英语', '英語', 'الإنجليزية'],
    script: LATIN,
    sentenceEnd: [],
    terminal: '.',
    scriptChoices: [],
    regions: [],
    bcp47: 'en',
  },
  {
    code: 'hi',
    english: 'Hindi',
    native: 'हिन्दी',
    aliases: ['hindi', 'हिंदी', 'हिन्दी'],
    script: { primary: 'Deva', variants: [], direction: 'ltr', cased: false, segmentation: 'space' },
    sentenceEnd: ['।', '॥'],
    terminal: '।',
    scriptChoices: [],
    regions: [],
    bcp47: 'hi',
  },
  {
    code: 'es',
    english: 'Spanish',
    native: 'Español',
    aliases: ['spanish', 'español', 'espanol', 'castellano', 'castilian'],
    script: LATIN,
    sentenceEnd: [],
    terminal: '.',
    scriptChoices: [],
    regions: [],
    bcp47: 'es',
  },
  {
    code: 'zh',
    english: 'Mandarin Chinese',
    native: '中文',
    aliases: ['chinese', 'mandarin', 'putonghua', 'guoyu', 'huayu', '中文', '普通话', '普通話', '汉语', '漢語', '国语', '國語', '华语', '華語'],
    script: { primary: 'Hans', variants: ['Hant'], direction: 'ltr', cased: false, segmentation: 'char' },
    sentenceEnd: ['。'],
    terminal: '。',
    scriptChoices: [
      { script: 'Hans', native: '简体中文', english: 'Simplified' },
      { script: 'Hant', native: '繁體中文', english: 'Traditional' },
    ],
    regions: [],
    bcp47: 'zh',
  },
  {
    code: 'fr',
    english: 'French',
    native: 'Français',
    aliases: ['french', 'français', 'francais'],
    script: LATIN,
    sentenceEnd: [],
    terminal: '.',
    scriptChoices: [],
    regions: [],
    bcp47: 'fr',
  },
  {
    code: 'ar',
    english: 'Arabic',
    native: 'العربية',
    aliases: ['arabic', 'العربية', 'عربي', 'arabe', 'árabe'],
    script: { primary: 'Arab', variants: [], direction: 'rtl', cased: false, segmentation: 'space' },
    sentenceEnd: [],
    terminal: '.',
    scriptChoices: [],
    regions: [],
    bcp47: 'ar',
  },
  {
    code: 'pt',
    english: 'Portuguese',
    native: 'Português',
    aliases: ['portuguese', 'português', 'portugues'],
    script: LATIN,
    sentenceEnd: [],
    terminal: '.',
    scriptChoices: [],
    regions: [
      { tag: 'pt-BR', native: 'Português do Brasil', english: 'Brazil' },
      { tag: 'pt-PT', native: 'Português europeu', english: 'Portugal' },
    ],
    bcp47: 'pt',
  },
];

const BY_CODE = new Map(LANGUAGES.map((l) => [l.code, l]));

export function isLanguageCode(code: unknown): code is LanguageCode {
  return typeof code === 'string' && BY_CODE.has(code as LanguageCode);
}

export function languageInfo(code: LanguageCode): LanguageInfo {
  return BY_CODE.get(code)!;
}

/** 'hi', 'hi-IN', 'zh_Hant_TW', 'ZH' -> the v1.0 language, or null. */
export function toLanguageCode(tag: string | null | undefined): LanguageCode | null {
  if (!tag) return null;
  const primary = tag.trim().toLowerCase().split(/[-_]/)[0];
  return isLanguageCode(primary) ? primary : null;
}

/** Script and region subtags of a BCP 47 tag: "zh-Hant-TW" -> Hant, TW; "en_PT" -> PT. */
export function localeParts(tag: string | null | undefined): { script: string | null; region: string | null } {
  const parts = (tag ?? '').trim().split(/[-_]/).slice(1);
  const script = parts.find((p) => /^[A-Za-z]{4}$/.test(p)) ?? null;
  const region = parts.find((p) => /^[A-Za-z]{2}$|^\d{3}$/.test(p)) ?? null;
  return { script: script && script[0].toUpperCase() + script.slice(1).toLowerCase(), region: region && region.toUpperCase() };
}

/**
 * The Chinese script a device locale suggests: Traditional for zh-Hant and
 * for Taiwan, Hong Kong and Macau (whatever the UI language, so an English
 * phone in Taipei suggests Traditional); Simplified otherwise. Only a
 * default; each author chooses in Settings.
 */
export function defaultChineseScript(localeTag: string | null | undefined): 'Hans' | 'Hant' {
  const { script, region } = localeParts(localeTag);
  if (script === 'Hant') return 'Hant';
  if (script === 'Hans') return 'Hans';
  return region === 'TW' || region === 'HK' || region === 'MO' ? 'Hant' : 'Hans';
}

/** Countries that follow European Portuguese spelling. */
const PT_PT_REGIONS = new Set(['PT', 'AO', 'MZ', 'CV', 'GW', 'ST', 'TL', 'MO']);

/**
 * The regional standard a device locale suggests: pt-PT for Portugal and
 * the countries that follow its spelling, pt-BR otherwise. Only a default;
 * the author chooses in Settings.
 */
export function defaultRegion(code: LanguageCode, localeTag: string | null | undefined): string | null {
  const info = languageInfo(code);
  if (info.regions.length === 0) return null;
  const { region } = localeParts(localeTag);
  if (code === 'pt') return region && PT_PT_REGIONS.has(region) ? 'pt-PT' : 'pt-BR';
  return info.regions[0].tag;
}

/** The id of a language's text-rules pack in the signed manifest (packages/api PACK_ID_RE: `text-rules.pt`). */
export function textRulesPackId(code: LanguageCode): string {
  return `text-rules.${code}`;
}

/**
 * Case- and accent-insensitive search over English names, native names and
 * aliases. Pure, so the picker and its tests agree.
 */
export function searchLanguages(query: string, list: readonly LanguageInfo[] = LANGUAGES): LanguageInfo[] {
  const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
  const q = fold(query);
  if (!q) return [...list];
  return list.filter((l) => [l.english, l.native, l.code, ...l.aliases].some((n) => fold(n).includes(q)));
}
