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

/**
 * The Chinese script a device locale suggests: Traditional for zh-Hant,
 * zh-TW, zh-HK and zh-MO; Simplified otherwise. Only a default; the author
 * chooses in Settings.
 */
export function defaultChineseScript(localeTag: string | null | undefined): 'Hans' | 'Hant' {
  const t = (localeTag ?? '').toLowerCase().replace(/_/g, '-');
  return /(^|-)hant(-|$)|-(tw|hk|mo)(-|$)/.test(t) ? 'Hant' : 'Hans';
}

/** The id of a language's text-rules pack in the signed manifest. */
export function textRulesPackId(code: LanguageCode): string {
  return `text-rules-${code}`;
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
