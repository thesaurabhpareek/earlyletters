/**
 * Language-aware deterministic punctuation (no model). Every edit is type
 * 'punctuation', changes no letters (case aside) and is verified like any
 * other edit; the verifier's mood, quote, number and word checks apply.
 *
 * Always (the engine's generic rules, as RulePunctuationProvider today):
 *  1. Sentence case in cased scripts: first word of the text and of each
 *     sentence. Caseless scripts (Devanagari, Arabic, Han) are untouched.
 *  2. A terminal mark when the letter has none, in the language's own form
 *     after its own script ("।" after Hindi, "。" after Chinese), or a
 *     trailing comma, semicolon or colon turned into one.
 * Only when the pack's punctuation profile is vetted (cited standard):
 *  3. Local forms right after a letter of the language's script: Chinese
 *     full-width ，？！：；。 (GB/T 15834-2011), Arabic ، ؛ ؟, Hindi । for a
 *     sentence-ending full stop.
 *  4. French spacing: an existing plain space before ; ! ? becomes a narrow
 *     no-break space; a colon always gets a no-break space; no-break spaces
 *     inside « ». Correct for both France and Quebec (OQLF), because a
 *     missing space before ; ! ? is never added.
 *  5. Spanish opening marks (RAE): ¿ or ¡ at the start of a one-clause
 *     sentence that ends in ? or !. A sentence with an inner comma, colon or
 *     semicolon is left alone, because the question may start mid-sentence
 *     ("Si no te gusta, ¿por qué lo comes?") and guessing would misplace it.
 * Nothing here touches quotes, locked phrases or dictionary terms.
 */
import type { Edit, Span } from '../types';
import type { EditProposal, EditProvider, EditRequest } from '../edit-provider';
import { overlaps } from '../protect';
import type { LanguageRules } from './engine';
import { dictionaryEditsFor, protectedSpansFor, termMatches } from './dictionary';

const NARROW_NBSP = ' ';
const NBSP = ' ';

function escapeClass(chars: string): string {
  return chars.replace(/[\\\]\[^-]/g, '\\$&');
}

export function languagePunctuationEdits(req: EditRequest, R: LanguageRules): Edit[] {
  const { raw, dictionary, locked = [] } = req;
  const toks = R.tokens(raw);
  if (toks.length === 0) return [];

  // Spans no punctuation edit may touch: quotes, locked phrases, dictionary
  // terms in any case (a mis-cased name is fixed by stt_fix, not here).
  const variants = dictionary.flatMap((d) => [d.term, ...d.heardAs]).filter((v) => v.trim());
  const keepOut: Span[] = [
    ...protectedSpansFor(raw, dictionary, locked, R),
    ...dictionaryEditsFor(raw, dictionary, R),
    ...variants.flatMap((v) => termMatches(raw, v, R)),
  ];
  const blocked = (s: Span) => keepOut.some((k) => overlaps(k, s));
  const removed = req.removed ?? [];
  const gone = (s: Span) => removed.some((r) => r.start <= s.start && s.end <= r.end);
  const ends = escapeClass(R.sentenceEndChars);
  const openers = R.openers ? `[${escapeClass(R.openers)}]*` : '';
  const breakBefore = new RegExp(`[${ends}][${escapeClass(`"')]»」』）`)}]*\\s+${openers}$`);

  const edits: Edit[] = [];
  const terminal = terminalEdit(raw, toks[toks.length - 1], R);
  const reserved: Span[] = terminal && !blocked(terminal) ? [terminal] : [];
  const free = (s: Span) => !blocked(s) && !reserved.some((r) => overlaps(r, s) || r.start === s.start);

  // 5. Spanish openers, keyed by the position they go in front of.
  const openerAt = new Map<number, string>();
  if (R.can.punctuation && R.pairOpeners) {
    for (const s of sentences(raw, R)) {
      const close = raw[s.end - 1];
      const opener = close === '?' ? '¿' : close === '!' ? '¡' : '';
      if (!opener) continue;
      const body = raw.slice(s.start, s.end - 1);
      if (body.includes(opener) || /[,;:]/.test(body)) continue;
      const first = R.tokens(body)[0];
      if (!first) continue;
      openerAt.set(s.start + first.start, opener); // inside any opening quote: «¿Vienes?»
    }
  }

  // 1. Sentence case (merged with an opener at the same spot: verifyEdits refuses two edits at one start).
  const seen = new Set<number>();
  for (let i = 0; i < toks.length; i++) {
    const startsSentence = i === 0 || breakBefore.test(raw.slice(toks[i - 1].end, toks[i].start));
    if (!startsSentence) continue;
    let j = i;
    while (j < toks.length && (gone(toks[j]) || (req.level === 'clean' && R.isFiller(toks[j].word)))) j++;
    const t = toks[j];
    if (!t || seen.has(t.start)) continue;
    seen.add(t.start);
    const first = String.fromCodePoint(t.word.codePointAt(0)!);
    const upper = first.toUpperCase();
    if (upper === first || /\p{Lu}/u.test(t.word)) continue; // capital already, a digit, a caseless script, or "iPad"
    const span = { start: t.start, end: t.start + first.length };
    if (!free(span)) continue;
    const opener = openerAt.get(t.start) ?? '';
    openerAt.delete(t.start);
    edits.push({ type: 'punctuation', ...span, original: first, replacement: opener + upper, source: 'rule' });
  }
  for (const [at, opener] of openerAt) {
    const span = { start: at, end: at };
    if (free(span) && !edits.some((e) => e.start === at)) edits.push({ type: 'punctuation', ...span, original: '', replacement: opener, source: 'rule' });
  }

  if (R.can.punctuation) {
    edits.push(...localFormEdits(raw, R).filter((e) => free(e) && !edits.some((x) => overlaps(x, e) || x.start === e.start)));
    // a mark the terminal edit replaces ("oui :" -> "oui.") gets no space before it
    const replacedMark = (i: number) => terminal !== null && terminal.start <= i && i < terminal.end;
    edits.push(
      ...spacingEdits(raw, R).filter((e) => !replacedMark(e.end) && free(e) && !edits.some((x) => overlaps(x, e) || x.start === e.start)),
    );
  }
  if (terminal && !blocked(terminal)) edits.push(terminal);
  return edits.sort((a, b) => a.start - b.start);
}

function codePointBefore(text: string, i: number): string {
  if (i <= 0) return '';
  const unit = text.charCodeAt(i - 1);
  return unit >= 0xdc00 && unit <= 0xdfff && i >= 2 ? text.slice(i - 2, i) : text[i - 1];
}

/** Sentences as [start, end) where end is just past the sentence's own end mark (or the text end). */
function sentences(raw: string, R: LanguageRules): Span[] {
  const out: Span[] = [];
  let start = 0;
  for (let i = 0; i < raw.length; i++) {
    if (!R.isSentenceEnd(raw[i])) continue;
    let end = i + 1;
    while (end < raw.length && R.isSentenceEnd(raw[end])) end++;
    out.push({ start, end });
    start = end;
    i = end - 1;
  }
  return out;
}

function terminalEdit(raw: string, last: { word: string; end: number }, R: LanguageRules): Edit | null {
  const tail = raw.slice(last.end).trimEnd();
  for (const ch of tail) if (R.isSentenceEnd(ch)) return null;
  const mark = R.terminalAfter(last.word);
  const dangling = tail.match(/[,;:，；：،؛]+$/);
  if (dangling) {
    const start = last.end + tail.length - dangling[0].length;
    return { type: 'punctuation', start, end: last.end + tail.length, original: dangling[0], replacement: mark, source: 'rule' };
  }
  // After any closing quote or bracket: she said "bau" -> she said "bau".
  const at = last.end + tail.length;
  return { type: 'punctuation', start: at, end: at, original: '', replacement: mark, source: 'rule' };
}

/** 3. ASCII marks to the language's own form, right after its own script. */
function localFormEdits(raw: string, R: LanguageRules): Edit[] {
  const forms = R.pack?.punctuation.localForms ?? {};
  if (Object.keys(forms).length === 0) return [];
  const swallow = R.pack?.punctuation.localFormsSwallowSpace ?? false;
  const out: Edit[] = [];
  for (let i = 0; i < raw.length; i++) {
    const to = forms[raw[i]];
    if (to === undefined) continue;
    // the character before, skipping closing quotes and brackets
    let k = i;
    while (k > 0 && /["'”’)\]»」』）]/.test(raw[k - 1])) k--;
    if (!R.isPrimaryScriptChar(codePointBefore(raw, k))) continue;
    const next = raw[i + 1] ?? '';
    if (/\p{N}/u.test(next)) continue; // 3.5, 3:30, 1,000
    // a full stop becomes the language's own only where it ends a sentence
    if (raw[i] === '.' && next !== '' && !/[\s"'”’)\]»」』）]/.test(next)) continue;
    if (raw[i] === '.' && raw[i + 1] === '.') continue; // dots of an ellipsis
    let end = i + 1;
    if (swallow) {
      const sp = raw.slice(end).match(/^[ \t]+/)?.[0] ?? '';
      if (sp && end + sp.length < raw.length) end += sp.length;
    }
    out.push({ type: 'punctuation', start: i, end, original: raw.slice(i, end), replacement: to, source: 'rule' });
  }
  return out;
}

/** 4. French no-break spaces before high punctuation and inside guillemets. */
function spacingEdits(raw: string, R: LanguageRules): Edit[] {
  const p = R.pack?.punctuation;
  if (!p) return [];
  const out: Edit[] = [];
  const wordish = (c: string) => /[\p{L}\p{M}\p{N}"'”’)\]»]/u.test(c);
  for (const rule of p.spaceBefore) {
    const space = rule.space === 'narrow' ? NARROW_NBSP : NBSP;
    for (let i = 0; i < raw.length; i++) {
      if (raw[i] !== rule.mark) continue;
      if (i > 0 && raw[i - 1] === rule.mark) continue; // "!!" or "??": only before the first
      if (rule.mark === ':' && /\p{N}/u.test(raw[i - 1] ?? '') && /\p{N}/u.test(raw[i + 1] ?? '')) continue; // 3:30
      if (rule.mark === ':' && raw[i + 1] === '/') continue; // a link
      const prev = raw[i - 1] ?? '';
      if (prev === ' ' && wordish(raw[i - 2] ?? '')) {
        out.push({ type: 'punctuation', start: i - 1, end: i, original: ' ', replacement: space, source: 'rule' });
      } else if (rule.insert && wordish(prev)) {
        out.push({ type: 'punctuation', start: i, end: i, original: '', replacement: space, source: 'rule' });
      }
    }
  }
  if (p.spaceInsideGuillemets) {
    for (let i = 0; i < raw.length; i++) {
      if (raw[i] === '«') {
        const next = raw[i + 1] ?? '';
        if (next === ' ') out.push({ type: 'punctuation', start: i + 1, end: i + 2, original: ' ', replacement: NBSP, source: 'rule' });
        else if (/[\p{L}\p{N}]/u.test(next)) out.push({ type: 'punctuation', start: i + 1, end: i + 1, original: '', replacement: NBSP, source: 'rule' });
      } else if (raw[i] === '»') {
        const prev = raw[i - 1] ?? '';
        if (prev === ' ') out.push({ type: 'punctuation', start: i - 1, end: i, original: ' ', replacement: NBSP, source: 'rule' });
        else if (/[\p{L}\p{M}\p{N}.!?]/u.test(prev)) out.push({ type: 'punctuation', start: i, end: i, original: '', replacement: NBSP, source: 'rule' });
      }
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

/** Deterministic, language-aware sentence case and punctuation as an EditProvider. */
export class LanguagePunctuationProvider implements EditProvider {
  readonly id: string;
  readonly source = 'rule' as const;

  constructor(private readonly rules: LanguageRules) {
    this.id = `rule-punctuation-${rules.language}`;
  }

  async propose(req: EditRequest): Promise<EditProposal> {
    return { edits: languagePunctuationEdits(req, this.rules), flags: [], rejected: [], invalid: [] };
  }
}
