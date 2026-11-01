/**
 * The author's spoken languages (pure; no React Native, so it can be unit
 * tested in Node). One author per phone in v1.0, so this is a device
 * setting: a primary language plus up to two more, each with the author's
 * script (Chinese: Simplified or Traditional, per author, because Taiwan
 * and Hong Kong write Traditional) and regional spelling (Portuguese:
 * Brazil or Portugal). Neither choice ever respells anything: the script
 * choice converts only characters that have exactly one counterpart, and
 * the region is a label for the keyboard and the recogniser.
 */
import {
  defaultChineseScript,
  defaultRegion,
  isLanguageCode,
  languageInfo,
  type LanguageCode,
  type ScriptCode,
} from '@scribe/core';

export const SPOKEN_LANGUAGE_KEY = 'language.spoken';
/** A primary language plus up to two more (founder brief). */
export const MAX_LANGUAGES = 3;

export interface SpokenLanguage {
  code: LanguageCode;
  /** Chinese only: the author's script. */
  script?: 'Hans' | 'Hant';
  /** Portuguese only: 'pt-BR' or 'pt-PT'. */
  region?: string;
}

export interface SpokenLanguages {
  /** First is the primary language. Never empty. */
  languages: SpokenLanguage[];
}

export const DEFAULT_SPOKEN: SpokenLanguages = { languages: [{ code: 'en' }] };

/** A language with its per-author defaults filled in from the device locale. */
export function withDefaults(code: LanguageCode, localeTag: string | null): SpokenLanguage {
  const info = languageInfo(code);
  const out: SpokenLanguage = { code };
  if (info.scriptChoices.length) out.script = defaultChineseScript(localeTag);
  const region = defaultRegion(code, localeTag);
  if (region) out.region = region;
  return out;
}

/** Anything stored becomes a valid value; unknown, duplicate or extra entries are dropped. */
export function parseSpoken(stored: string | null): SpokenLanguages {
  if (!stored) return DEFAULT_SPOKEN;
  let json: unknown;
  try {
    json = JSON.parse(stored);
  } catch {
    return DEFAULT_SPOKEN;
  }
  const list = (json as { languages?: unknown })?.languages;
  if (!Array.isArray(list)) return DEFAULT_SPOKEN;
  const seen = new Set<string>();
  const languages: SpokenLanguage[] = [];
  for (const item of list) {
    const code = (item as { code?: unknown })?.code;
    if (!isLanguageCode(code) || seen.has(code)) continue;
    seen.add(code);
    const info = languageInfo(code);
    const l: SpokenLanguage = { code };
    const script = (item as { script?: unknown }).script;
    if (info.scriptChoices.some((c) => c.script === script)) l.script = script as 'Hans' | 'Hant';
    const region = (item as { region?: unknown }).region;
    if (info.regions.some((r) => r.tag === region)) l.region = region as string;
    languages.push(l);
    if (languages.length === MAX_LANGUAGES) break;
  }
  return languages.length ? { languages } : DEFAULT_SPOKEN;
}

export function serializeSpoken(s: SpokenLanguages): string {
  return JSON.stringify({ v: 1, languages: s.languages });
}

export function primaryOf(s: SpokenLanguages): SpokenLanguage {
  return s.languages[0];
}

/**
 * The primary the speech engine knows (its own setting) wins if it differs:
 * onboarding may set it directly. It moves to the front, keeping its script
 * and region if it was already listed.
 */
export function reconcilePrimary(s: SpokenLanguages, speechPrimary: LanguageCode | null, localeTag: string | null): SpokenLanguages {
  if (!speechPrimary || s.languages[0].code === speechPrimary) return s;
  const existing = s.languages.find((l) => l.code === speechPrimary) ?? withDefaults(speechPrimary, localeTag);
  return { languages: [existing, ...s.languages.filter((l) => l.code !== speechPrimary)].slice(0, MAX_LANGUAGES) };
}

export function setPrimary(s: SpokenLanguages, code: LanguageCode, localeTag: string | null): SpokenLanguages {
  const existing = s.languages.find((l) => l.code === code) ?? withDefaults(code, localeTag);
  const rest = s.languages.filter((l) => l.code !== code);
  // The old primary stays as an extra language when there is room: changing your main language does not forget the old one.
  return { languages: [existing, ...rest].slice(0, MAX_LANGUAGES) };
}

export function addLanguage(s: SpokenLanguages, code: LanguageCode, localeTag: string | null): SpokenLanguages {
  if (s.languages.some((l) => l.code === code) || s.languages.length >= MAX_LANGUAGES) return s;
  return { languages: [...s.languages, withDefaults(code, localeTag)] };
}

export function removeLanguage(s: SpokenLanguages, code: LanguageCode): SpokenLanguages {
  if (s.languages[0].code === code) return s; // the primary is changed, never removed
  return { languages: s.languages.filter((l) => l.code !== code) };
}

export function updateLanguage(s: SpokenLanguages, code: LanguageCode, patch: Pick<SpokenLanguage, 'script' | 'region'>): SpokenLanguages {
  return { languages: s.languages.map((l) => (l.code === code ? { ...l, ...patch } : l)) };
}

/** BCP 47 tag for the keyboard and the recogniser: zh-Hans, zh-Hant, pt-BR, pt-PT, hi, ar. */
export function bcp47Of(l: SpokenLanguage): string {
  if (l.script) return `${l.code}-${l.script}`;
  return l.region ?? l.code;
}

/** The script an author's letters are written in (for faithfulClean's `script`). */
export function scriptOf(l: SpokenLanguage): ScriptCode | undefined {
  return l.script;
}

/**
 * Props every TextInput that takes letter text should set (report to the
 * screen owners). The keyboard's own autocorrect does the spelling, in the
 * keyboard language the person picked; we never rewrite typed text
 * (founder decision 7). Arabic is laid out right to left.
 */
export function letterInputProps(code: LanguageCode): {
  autoCorrect: true;
  spellCheck: true;
  autoCapitalize: 'sentences';
  keyboardType: 'default';
  textContentType: 'none';
  autoComplete: 'off';
  smartInsertDelete: true;
  style: { writingDirection: 'ltr' | 'rtl'; textAlign: 'left' | 'right' };
} {
  const rtl = languageInfo(code).script.direction === 'rtl';
  return {
    autoCorrect: true,
    spellCheck: true,
    autoCapitalize: 'sentences',
    keyboardType: 'default',
    textContentType: 'none',
    autoComplete: 'off',
    smartInsertDelete: true,
    style: { writingDirection: rtl ? 'rtl' : 'ltr', textAlign: rtl ? 'right' : 'left' },
  };
}

/** "62 KB", "1.4 MB": the pack size as people read it. */
export function formatBytes(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${Math.max(1, Math.round(bytes / 1000))} KB`;
  return `${(bytes / 1_000_000).toFixed(bytes < 10_000_000 ? 1 : 0)} MB`;
}
