/**
 * The language rules a letter is cleaned with (ADR 0014).
 *
 * English is bundled. Every other language reads its text-rules pack from
 * the pack folder (lib/packs installed it after checking its SHA-256
 * against the signed manifest), checks it again with validatePackJson, and
 * hands it to the engine. A missing or unreadable pack is never an error a
 * parent sees: the language simply runs in punctuation-safe mode until the
 * pack arrives.
 *
 * For callers that clean text (review screen, transcription queue):
 *   faithfulClean(raw, { level, dictionary, ...languageCleanOptions(lang) })
 *   cleanRulesOnly(req, languageCleanOptions(lang))     // with language punctuation
 */
import { File } from 'expo-file-system';
import {
  compileRules,
  ENGLISH_PACK,
  textRulesPackId,
  validatePackJson,
  type CleanOptions,
  type LanguageCode,
  type LanguageRules,
  type TextRulesPack,
} from '@scribe/core';
import { onProgress, packPath } from '../packs';
import type { SpokenLanguage } from './spoken-language.logic';

const loaded = new Map<LanguageCode, { path: string; pack: TextRulesPack | null }>();
let watching = false;

function watch(): void {
  if (watching) return;
  watching = true;
  // A newer pack, or a removed one, is read again next time.
  onProgress((p) => {
    if (!p.id.startsWith('text-rules.') || (p.phase !== 'installed' && p.phase !== 'removed')) return;
    loaded.delete(p.id.slice('text-rules.'.length) as LanguageCode);
  });
}

/** The installed, valid pack for a language; English is always there. null means safe mode. */
export function installedTextRules(code: LanguageCode): TextRulesPack | null {
  if (code === 'en') return ENGLISH_PACK;
  watch();
  const path = packPath(textRulesPackId(code));
  if (!path) return null;
  const hit = loaded.get(code);
  if (hit && hit.path === path) return hit.pack;
  let pack: TextRulesPack | null = null;
  try {
    const v = validatePackJson(new File(path).textSync(), { expectLanguage: code });
    pack = v.ok ? v.pack : null; // errors are codes without content; nothing to log here
  } catch {
    pack = null;
  }
  loaded.set(code, { path, pack });
  return pack;
}

const asSpoken = (l: SpokenLanguage | LanguageCode): SpokenLanguage => (typeof l === 'string' ? { code: l } : l);

/** Options to spread into faithfulClean / cleanRulesOnly for a letter in this language. */
export function languageCleanOptions(l: SpokenLanguage | LanguageCode): Pick<CleanOptions, 'language' | 'pack' | 'script'> {
  const s = asSpoken(l);
  return { language: s.code, pack: installedTextRules(s.code), ...(s.script ? { script: s.script } : {}) };
}

/** Compiled rules (cached by the engine per pack and script). */
export function rulesForLanguage(l: SpokenLanguage | LanguageCode): LanguageRules {
  const s = asSpoken(l);
  return compileRules(s.code, installedTextRules(s.code), s.script ? { script: s.script } : {});
}
