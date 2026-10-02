/**
 * A model-backed EditProvider that never trusts the model.
 *
 * The model is given the raw transcript and asked for a strict JSON list of
 * typed edits. This file:
 *  1. parses the reply as JSON (no prose, no code fences, no repair),
 *  2. validates each item against a closed schema (unknown keys or types
 *     drop the item),
 *  3. locates each `original` in the raw text by exact, word-bounded match,
 *  4. stamps every edit source 'model' and runs it through verifyEdits.
 * Only what survives step 4 is returned. A model that tries to add a word,
 * swap a synonym or rewrite a sentence gets an empty proposal for that item.
 *
 * There is no network code here. The caller passes `call`, which may hit a
 * hosted endpoint (ADR 0003), llama.rn on device, or a stub in tests.
 */
import type { Edit, EditType, Flag, Span } from './types';
import type { EditProposal, EditProvider, EditRequest, InvalidItem } from './edit-provider';
import { emptyProposal } from './edit-provider';
import { protectedSpans } from './protect';
import { verifyEdits } from './verify';

export interface ModelCallRequest {
  system: string;
  user: string;
  /** JSON Schema for the reply; pass to constrained decoding where supported. */
  schema: typeof EDIT_JSON_SCHEMA;
}

/** Returns the model's raw reply text. Throw on transport errors. */
export type ModelCall = (req: ModelCallRequest, signal?: AbortSignal) => Promise<string>;

/** Edit types a model may propose. 'paragraph' is left to the layout code. */
export const MODEL_EDIT_TYPES: readonly EditType[] = ['filler', 'false_start', 'repeat', 'stt_fix', 'punctuation', 'agreement'];

export const EDIT_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['edits'],
  properties: {
    edits: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'original', 'replacement'],
        properties: {
          type: { enum: MODEL_EDIT_TYPES },
          original: { type: 'string', minLength: 1 },
          replacement: { type: 'string' },
          occurrence: { type: 'integer', minimum: 1 },
        },
      },
    },
    flags: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['original'],
        properties: {
          original: { type: 'string', minLength: 1 },
          occurrence: { type: 'integer', minimum: 1 },
        },
      },
    },
  },
} as const;

export const EDIT_SYSTEM_PROMPT = [
  'You repair speech-to-text transcripts of parents talking to their child. You never rewrite.',
  'Return JSON only, matching the schema. No prose.',
  'Each edit names an exact substring of the transcript ("original"), what replaces it, and an edit type:',
  '- filler: remove a hesitation sound (um, uh). replacement is "".',
  '- false_start: remove words the speaker abandoned and then said again. replacement is "".',
  '- repeat: remove an accidental immediate repeat. replacement is "".',
  '- stt_fix: replace a misheard word with a term from the family dictionary, spelled exactly as listed.',
  '- punctuation: change punctuation or capitalisation only. The letters must stay the same.',
  '- agreement: change one word to another form of the same word (have to has).',
  'Never add a word that was not said. Never change meaning, tone, dialect or language. Never translate or transliterate.',
  'Keep Hindi, Hinglish and the child\'s own words exactly as they are. Leave anything inside double quotes alone.',
  'If "original" appears more than once, set "occurrence" (1 = first).',
  'If you are unsure about a word, add it to "flags" instead of editing it. If nothing needs fixing, return {"edits": []}.',
].join('\n');

export function editUserPrompt(req: EditRequest): string {
  const terms = [...new Set(req.dictionary.map((d) => d.term))];
  return [
    `Family dictionary: ${terms.length ? terms.join(', ') : '(none)'}`,
    `Mode: ${req.level === 'verbatim' ? 'verbatim (only punctuation and stt_fix allowed)' : 'clean'}`,
    'Transcript:',
    req.raw,
  ].join('\n');
}

/** Upper bounds that keep a runaway model from costing us time. */
const MAX_REPLY_CHARS = 64_000;
const MAX_ITEMS = 200;
const ALLOWED_EDIT_KEYS = new Set(['type', 'original', 'replacement', 'occurrence']);
const ALLOWED_FLAG_KEYS = new Set(['original', 'occurrence']);

interface ParsedItem {
  type: EditType;
  original: string;
  replacement: string;
  occurrence?: number;
}

export interface ParsedReply {
  items: Array<{ index: number; item: ParsedItem }>;
  flags: Array<{ index: number; original: string; occurrence?: number }>;
  invalid: InvalidItem[];
  error?: string;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const validOccurrence = (v: unknown) => v === undefined || (Number.isInteger(v) && (v as number) >= 1);

/** Strict parse of a model reply. Pure; exported for tests and experiments. */
export function parseEditReply(reply: string): ParsedReply {
  const out: ParsedReply = { items: [], flags: [], invalid: [] };
  if (reply.length > MAX_REPLY_CHARS) return { ...out, error: 'reply_too_long' };
  let json: unknown;
  try {
    json = JSON.parse(reply);
  } catch {
    return { ...out, error: 'not_json' };
  }
  if (!isObject(json) || !Array.isArray(json.edits)) return { ...out, error: 'schema_mismatch' };
  if (Object.keys(json).some((k) => k !== 'edits' && k !== 'flags')) return { ...out, error: 'schema_mismatch' };
  if (json.flags !== undefined && !Array.isArray(json.flags)) return { ...out, error: 'schema_mismatch' };
  if (json.edits.length + ((json.flags as unknown[]) ?? []).length > MAX_ITEMS) return { ...out, error: 'too_many_items' };

  json.edits.forEach((raw: unknown, index: number) => {
    if (!isObject(raw)) return out.invalid.push({ index, reason: 'not_an_object' });
    if (Object.keys(raw).some((k) => !ALLOWED_EDIT_KEYS.has(k))) return out.invalid.push({ index, reason: 'unknown_key' });
    const { type, original, replacement, occurrence } = raw;
    if (typeof type !== 'string' || !(MODEL_EDIT_TYPES as readonly string[]).includes(type)) {
      return out.invalid.push({ index, reason: 'unknown_type' });
    }
    if (typeof original !== 'string' || original.length === 0) return out.invalid.push({ index, reason: 'bad_original' });
    if (typeof replacement !== 'string') return out.invalid.push({ index, reason: 'bad_replacement' });
    if (!validOccurrence(occurrence)) return out.invalid.push({ index, reason: 'bad_occurrence' });
    out.items.push({ index, item: { type: type as EditType, original, replacement, occurrence: occurrence as number | undefined } });
  });

  ((json.flags as unknown[]) ?? []).forEach((raw, index) => {
    const at = 10_000 + index; // flags are reported after edits
    if (!isObject(raw) || Object.keys(raw).some((k) => !ALLOWED_FLAG_KEYS.has(k))) return out.invalid.push({ index: at, reason: 'bad_flag' });
    if (typeof raw.original !== 'string' || raw.original.length === 0 || !validOccurrence(raw.occurrence)) {
      return out.invalid.push({ index: at, reason: 'bad_flag' });
    }
    out.flags.push({ index: at, original: raw.original, occurrence: raw.occurrence as number | undefined });
  });
  return out;
}

const WORDISH = /[\p{L}\p{N}]/u;

/** Every word-bounded, exact-case position of `needle` in `hay`. */
export function findOccurrences(hay: string, needle: string): number[] {
  const out: number[] = [];
  const checkBefore = WORDISH.test(needle[0]);
  const checkAfter = WORDISH.test(needle[needle.length - 1]);
  for (let i = hay.indexOf(needle); i >= 0; i = hay.indexOf(needle, i + 1)) {
    if (checkBefore && i > 0 && WORDISH.test(hay[i - 1])) continue;
    const end = i + needle.length;
    if (checkAfter && end < hay.length && WORDISH.test(hay[end])) continue;
    out.push(i);
  }
  return out;
}

/** Resolve text + occurrence to a span. Ambiguity without an occurrence is an error. */
function locate(raw: string, original: string, occurrence?: number): Span | string {
  const hits = findOccurrences(raw, original);
  if (hits.length === 0) return 'original_not_found';
  if (occurrence === undefined && hits.length > 1) return 'ambiguous_original';
  const at = hits[(occurrence ?? 1) - 1];
  if (at === undefined) return 'occurrence_out_of_range';
  return { start: at, end: at + original.length };
}

export interface JsonModelEditProviderOptions {
  /** Shown in reports, e.g. "qwen3.5-2b-q4". */
  id?: string;
  signal?: AbortSignal;
}

export class JsonModelEditProvider implements EditProvider {
  readonly id: string;
  readonly source = 'model' as const;

  constructor(
    private readonly call: ModelCall,
    private readonly opts: JsonModelEditProviderOptions = {},
  ) {
    this.id = opts.id ?? 'json-model';
  }

  async propose(req: EditRequest): Promise<EditProposal> {
    if (req.raw.trim() === '') return emptyProposal();
    let reply: string;
    try {
      reply = await this.call({ system: EDIT_SYSTEM_PROMPT, user: editUserPrompt(req), schema: EDIT_JSON_SCHEMA }, this.opts.signal);
    } catch {
      // Fixed code only: an error message could echo the transcript into logs.
      return emptyProposal('model_call_failed');
    }
    if (typeof reply !== 'string') return emptyProposal('not_json');
    return this.fromReply(reply, req);
  }

  /** Turn a reply into verified edits. Public so experiments can replay saved replies. */
  fromReply(reply: string, req: EditRequest): EditProposal {
    const parsed = parseEditReply(reply);
    if (parsed.error) return { ...emptyProposal(parsed.error), invalid: parsed.invalid };
    const invalid = [...parsed.invalid];

    const candidates: Edit[] = [];
    for (const { index, item } of parsed.items) {
      const span = locate(req.raw, item.original, item.occurrence);
      if (typeof span === 'string') {
        invalid.push({ index, reason: span });
        continue;
      }
      candidates.push({ type: item.type, ...span, original: item.original, replacement: item.replacement, source: 'model' });
    }

    const flags: Flag[] = [];
    for (const f of parsed.flags) {
      const span = locate(req.raw, f.original, f.occurrence);
      if (typeof span === 'string') invalid.push({ index: f.index, reason: `flag_${span}` });
      else flags.push({ ...span, original: f.original, reason: 'model_unsure' });
    }

    const verified = verifyEdits(candidates, {
      raw: req.raw,
      level: req.level,
      dictionary: req.dictionary,
      protectedSpans: protectedSpans(req.raw, req.dictionary, req.locked ?? []),
    });
    return { edits: verified.accepted, flags, rejected: verified.rejected, invalid };
  }
}
