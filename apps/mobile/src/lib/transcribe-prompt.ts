/**
 * Whisper initial prompt per chunk (TDD 03 3.5.5, ADR 0015; B-REQ-006;
 * pure, test/transcribe-prompt.test.ts).
 *
 * Two parts, in this order:
 * 1. The family's spellings (child first, then nicknames, family, self,
 *    places, words), each once, so names come out the family's way.
 * 2. A short style seed in the language's own script and punctuation.
 *    Whisper continues the style of the text before it, so the seed asks,
 *    without words of ours entering the letter, for Simplified characters
 *    and full-width punctuation in Mandarin, Devanagari with the danda in
 *    Hindi, Arabic punctuation, and accents and inverted marks in Spanish.
 *    The seed sits last, next to where the transcript begins.
 *
 * The seed is a neutral sentence about the language itself ("The following
 * is Mandarin."), never something a parent might say, so if Whisper ever
 * echoes it back (it can, on unclear audio) `stripPromptEcho` recognises it
 * and drops it: the prompt never becomes a person's words.
 *
 * The language pack's prompt text (packages/core lang packs, language agent)
 * overrides these defaults when present. Capped well under Whisper's prompt
 * limit (whisper.cpp keeps at most half the 448-token text context; Groq
 * caps at 224): the seed is kept, lowest-priority terms are dropped first.
 * The same prompt goes with every chunk, because whisper.rn does not carry
 * the prompt past the first 30 s of a call.
 */
import type { DictionaryKind, DictionaryTerm } from '@scribe/core';
import type { SpeechLanguage } from './models/catalog';

const ORDER: DictionaryKind[] = ['child', 'nickname', 'family', 'self', 'place', 'word'];
export const PROMPT_TOKEN_CAP = 200;

/**
 * Default seeds. Mandarin uses the widely shared "以下是普通话的句子。",
 * which steers Whisper to Simplified characters with punctuation
 * (openai/whisper discussion 277). In our check (ADR 0015) turbo without it
 * punctuated 1 of 7 Mandarin clips, with it 7 of 7, at the same character
 * error. Its commas come out ASCII; the Mandarin language pack's punctuation
 * profile turns them full-width. For a Traditional Chinese family the
 * language pack supplies "以下是普通話的句子。". English needs none:
 * Whisper already punctuates English.
 */
export const DEFAULT_PROMPT_SEEDS: Record<SpeechLanguage, string> = {
  en: '',
  zh: '以下是普通话的句子。',
  hi: 'यह हिंदी में बातचीत है।',
  es: 'Esta es una conversación en español, ¿verdad?',
  fr: "Voici une conversation en français, n'est-ce pas ?",
  pt: 'Esta é uma conversa em português, não é?',
  ar: 'هذه محادثة باللغة العربية، أليس كذلك؟',
};

/**
 * Conservative token estimate: about 3 Latin characters per token; any other
 * script counted at 2 tokens per character (byte-level tokens can split
 * Devanagari and Arabic characters; most Han characters are 1 or 2 tokens).
 */
export function estimateTokens(text: string): number {
  let latin = 0;
  let other = 0;
  for (const ch of text) {
    if (ch.charCodeAt(0) < 128) latin += 1;
    else other += 1;
  }
  return Math.ceil(latin / 3) + other * 2;
}

/** "Asha, Ashu, Papa." or '' for an empty dictionary. */
export function dictionaryPrompt(dictionary: DictionaryTerm[], tokenCap = PROMPT_TOKEN_CAP): string {
  const ranked = dictionary
    .map((d, i) => ({ term: d.term.trim(), rank: ORDER.indexOf(d.kind), i }))
    .filter((d) => d.term.length > 0)
    .sort((a, b) => (a.rank < 0 ? 99 : a.rank) - (b.rank < 0 ? 99 : b.rank) || a.i - b.i);
  const seen = new Set<string>();
  const terms: string[] = [];
  for (const d of ranked) {
    const key = d.term.toLocaleLowerCase();
    if (seen.has(key)) continue;
    const next = [...terms, d.term];
    if (estimateTokens(`${next.join(', ')}.`) > tokenCap) break;
    seen.add(key);
    terms.push(d.term);
  }
  return terms.length ? `${terms.join(', ')}.` : '';
}

/** The full prompt for one chunk: dictionary, then the seed. '' when both are empty. */
export function chunkPrompt(dictionary: DictionaryTerm[], language: SpeechLanguage, seed?: string, tokenCap = PROMPT_TOKEN_CAP): string {
  const s = (seed ?? DEFAULT_PROMPT_SEEDS[language] ?? '').trim();
  const room = Math.max(0, tokenCap - (s ? estimateTokens(s) + 1 : 0));
  const dict = dictionaryPrompt(dictionary, room);
  return [dict, s].filter(Boolean).join(' ');
}

/** Letters and digits only, lower case: how echo checks compare text. */
function core(text: string): string {
  return text.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

/**
 * Removes the seed when Whisper wrote it back. A chunk that is (nearly) the
 * whole seed becomes ''; a chunk that begins with the whole seed loses that
 * sentence. A short fragment of the seed is kept, because a person may well
 * have said one of its words. Anything else is left exactly as heard.
 * Returns whether something was removed, for `stt_meta` (counts only).
 */
export function stripPromptEcho(text: string, seed: string): { text: string; echoed: boolean } {
  const s = core(seed);
  const t = core(text);
  if (!s || !t) return { text, echoed: false };
  if (s.includes(t) && t.length >= 0.6 * s.length) return { text: '', echoed: true };
  if (!t.startsWith(s)) return { text, echoed: false };
  // Walk the original text until the seed's letters are consumed, then cut there.
  let matched = 0;
  let cut = 0;
  const chars = Array.from(text);
  for (let i = 0; i < chars.length && matched < s.length; i++) {
    const c = core(chars[i]);
    matched += c.length;
    cut += chars[i].length;
  }
  const rest = text.slice(cut).replace(/^[\s\p{P}]+/u, '');
  return { text: rest, echoed: true };
}

/**
 * Whisper sometimes writes back the whole list of names when it hears
 * almost nothing. A chunk that is exactly the dictionary list (two or more
 * terms) is that echo; a single name is always kept (people say names).
 */
export function isDictionaryEcho(text: string, dictionaryLine: string): boolean {
  const d = core(dictionaryLine);
  const terms = dictionaryLine.split(',').filter((x) => x.trim()).length;
  return terms >= 2 && d.length > 0 && core(text) === d;
}
