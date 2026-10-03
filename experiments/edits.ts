/**
 * Edit-pass comparison (PRD v2 section 24, experiment 3): on the SAME
 * transcripts, compare
 *   rules        dictionary + fillers + repeats + RulePunctuationProvider
 *   rules+model  the same, plus a JsonModelEditProvider
 * Pure functions; the model is passed in as a function, so tests use a stub
 * and the CLI (edit-compare.ts) wires a local or hosted endpoint.
 */
import {
  cleanWithProviders,
  JsonModelEditProvider,
  RulePunctuationProvider,
  type DictionaryTerm,
  type EditLevel,
  type EditProvider,
  type ModelCall,
  type RejectReason,
} from '@scribe/core';
import { normWords, wer } from './score';

export interface Transcript {
  /** Recording or sample id; never a real name. */
  file: string;
  raw: string;
  /** What was actually said, if known. Enables word error after cleaning. */
  expected?: string;
  /** Which speech model produced `raw`, when it came from `npm run experiment`. */
  asr?: string;
}

export type Variant = 'rules' | 'rules+model';

export interface EditRow {
  file: string;
  asr?: string;
  variant: Variant;
  raw: string;
  clean: string;
  /**
   * Word-level edit distance from raw to clean, over raw word count. Case
   * and punctuation are ignored, so this measures words removed or changed,
   * which is exactly what the constitution limits.
   */
  changedWordRatio: number;
  /** Edits applied, by type. */
  applied: Record<string, number>;
  /** Possible repeats offered to the parent, not applied ("so so", "you you" after a verb). */
  suggested: number;
  /** Verifier rejections (model provider + pipeline), by reason. */
  rejections: Partial<Record<RejectReason, number>>;
  rejectedTotal: number;
  /** Model output items that were not well-formed edits. */
  invalid: number;
  /** Provider-level failure code, e.g. not_json, model_call_failed. */
  error?: string;
  /** Word error against what was said, after cleaning (null if unknown). */
  werClean: number | null;
}

const tally = <K extends string>(keys: K[]) =>
  keys.reduce<Partial<Record<K, number>>>((m, k) => ({ ...m, [k]: (m[k] ?? 0) + 1 }), {});

/** Changed-word ratio between two texts: 0 means the same words in the same order. */
export function changedWordRatio(raw: string, clean: string): number {
  if (normWords(raw).length === 0) return 0;
  return wer(raw, clean);
}

export async function compareTranscript(
  t: Transcript,
  dictionary: DictionaryTerm[],
  model: ModelCall | null,
  opts: { level?: EditLevel; modelId?: string } = {},
): Promise<EditRow[]> {
  const level = opts.level ?? 'clean';
  const variants: Array<[Variant, EditProvider[]]> = [['rules', [new RulePunctuationProvider()]]];
  if (model) variants.push(['rules+model', [new RulePunctuationProvider(), new JsonModelEditProvider(model, { id: opts.modelId })]]);

  const rows: EditRow[] = [];
  for (const [variant, providers] of variants) {
    const out = await cleanWithProviders({ raw: t.raw, level, dictionary }, providers);
    const modelSummary = out.providers.find((p) => p.source === 'model');
    rows.push({
      file: t.file,
      asr: t.asr,
      variant,
      raw: t.raw,
      clean: out.text,
      changedWordRatio: changedWordRatio(t.raw, out.text),
      applied: tally(out.applied.map((e) => e.type)),
      suggested: out.suggestions.length,
      rejections: tally(out.rejected.map((r) => r.reason)),
      rejectedTotal: out.rejected.length,
      invalid: modelSummary?.invalid ?? 0,
      ...(modelSummary?.error ? { error: modelSummary.error } : {}),
      werClean: t.expected && t.expected.trim() ? wer(t.expected, out.text) : null,
    });
  }
  return rows;
}

export interface VariantSummary {
  variant: Variant;
  transcripts: number;
  avgChangedWordRatio: number;
  maxChangedWordRatio: number;
  totalApplied: number;
  totalSuggested: number;
  totalRejected: number;
  totalInvalid: number;
  errors: number;
  /** Average word error after cleaning, over transcripts with `expected`. */
  avgWerClean: number | null;
  /** Transcripts whose cleaned text differs between the two variants. */
  differsFromRules?: number;
}

export function summarize(rows: EditRow[]): VariantSummary[] {
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const variants = [...new Set(rows.map((r) => r.variant))];
  return variants.map((variant) => {
    const mine = rows.filter((r) => r.variant === variant);
    const scored = mine.filter((r) => r.werClean !== null).map((r) => r.werClean as number);
    const s: VariantSummary = {
      variant,
      transcripts: mine.length,
      avgChangedWordRatio: avg(mine.map((r) => r.changedWordRatio)),
      maxChangedWordRatio: Math.max(0, ...mine.map((r) => r.changedWordRatio)),
      totalApplied: mine.reduce((n, r) => n + Object.values(r.applied).reduce((a, b) => a + b, 0), 0),
      totalSuggested: mine.reduce((n, r) => n + r.suggested, 0),
      totalRejected: mine.reduce((n, r) => n + r.rejectedTotal, 0),
      totalInvalid: mine.reduce((n, r) => n + r.invalid, 0),
      errors: mine.filter((r) => r.error).length,
      avgWerClean: scored.length ? avg(scored) : null,
    };
    if (variant !== 'rules') {
      const key = (r: EditRow) => `${r.asr ?? ''}|${r.file}`;
      const rules = new Map(rows.filter((r) => r.variant === 'rules').map((r) => [key(r), r.clean]));
      s.differsFromRules = mine.filter((r) => rules.get(key(r)) !== r.clean).length;
    }
    return s;
  });
}

/**
 * A ModelCall that replays saved replies instead of calling anything, keyed
 * by transcript id. Lets anyone re-score a model's output (for example after
 * a verifier change) with no endpoint and no key. A missing id throws, which
 * the provider reports as model_call_failed.
 */
export function replayModel(replies: Record<string, string>, currentId: () => string): ModelCall {
  return async () => {
    const reply = replies[currentId()];
    if (reply === undefined) throw new Error('no saved reply');
    return reply;
  };
}

/** Wrap a ModelCall so every reply is kept, keyed by transcript id, for --save-replies. */
export function recordingModel(call: ModelCall, currentId: () => string, into: Record<string, string>): ModelCall {
  return async (req, signal) => {
    const reply = await call(req, signal);
    into[currentId()] = reply;
    return reply;
  };
}
