/**
 * Edit providers: anything that proposes machine edits to a raw transcript.
 *
 * A provider returns typed `Edit`s only, never text. It cannot hand back a
 * "cleaned version" of anyone's words, because there is no field for one.
 * Whatever a provider proposes is verified again by `faithfulClean`, so a
 * buggy or hostile provider can at worst propose edits that get rejected.
 *
 * Providers are pure TypeScript. A model-backed provider receives its model
 * as a function (see `model-edits.ts`); the network lives in the app or the
 * experiment harness, never in core.
 */
import type { CleanResult, DictionaryTerm, Edit, EditLevel, EditSource, Flag, RejectedEdit, Span } from './types';
import { faithfulClean } from './pipeline';

export interface EditRequest {
  raw: string;
  level: EditLevel;
  dictionary: DictionaryTerm[];
  /** Phrases the parent locked in review. Never edited. */
  locked?: string[];
  /**
   * Spans of `raw` that already-verified edits delete. Set by
   * cleanWithProviders for rule providers, so sentence case lands on the
   * first word that survives a false start. Never sent to a model.
   */
  removed?: Span[];
}

/** An item of provider output that could not become an Edit at all. */
export interface InvalidItem {
  index: number;
  reason: string;
}

export interface EditProposal {
  /** Edits the provider stands behind. Already verified for model providers. */
  edits: Edit[];
  flags: Flag[];
  /** Edits the provider produced but the verifier refused. */
  rejected: RejectedEdit[];
  /** Output items that were not well-formed edits (model providers only). */
  invalid: InvalidItem[];
  /** Set when the provider failed as a whole (model error, unparseable output). */
  error?: string;
}

export interface EditProvider {
  /** Stable id for logs and experiment reports, e.g. "rule-punctuation". */
  readonly id: string;
  /**
   * 'rule' for deterministic code in this package; 'model' for anything
   * learned. The pipeline stamps every edit with this value, so a provider
   * cannot dodge the model change ceiling by labelling its edits 'rule'.
   */
  readonly source: EditSource;
  propose(req: EditRequest): Promise<EditProposal>;
}

export function emptyProposal(error?: string): EditProposal {
  return { edits: [], flags: [], rejected: [], invalid: [], ...(error ? { error } : {}) };
}

export interface ProviderCleanResult extends CleanResult {
  /** Per provider: what it proposed and what it lost before the pipeline. */
  providers: Array<{ id: string; source: EditSource; proposed: number; rejected: number; invalid: number; error?: string }>;
}

async function run(p: EditProvider, req: EditRequest): Promise<EditProposal> {
  try {
    return await p.propose(req);
  } catch {
    // Fixed code only: an error message could echo the transcript into logs.
    return emptyProposal('provider_failed');
  }
}

/**
 * Run the deterministic pipeline plus any providers, then verify everything
 * together. A provider that throws contributes nothing; the entry still gets
 * the rules-only result.
 *
 * Two phases: model providers see only the raw text. Rule providers then
 * also see which spans the verified removals delete, so their edits land on
 * surviving words and do not collide with a model's false-start removal.
 */
export async function cleanWithProviders(req: EditRequest, providers: EditProvider[]): Promise<ProviderCleanResult> {
  const base = { level: req.level, dictionary: req.dictionary, locked: req.locked };
  const { removed: _ignored, ...modelReq } = req;
  const outputs = new Map<EditProvider, EditProposal>();

  const stamp = (p: EditProvider) => (outputs.get(p)?.edits ?? []).map((e) => ({ ...e, source: p.source }));
  const models = providers.filter((p) => p.source === 'model');
  const rules = providers.filter((p) => p.source === 'rule');

  for (const p of models) outputs.set(p, await run(p, modelReq));
  const modelEdits = models.flatMap(stamp);
  const modelFlags = models.flatMap((p) => outputs.get(p)!.flags);

  // Dry run without rule providers: which spans do verified edits delete?
  const dry = faithfulClean(req.raw, { ...base, modelEdits });
  const removed = dry.applied.filter((e) => e.replacement.trim() === '' && e.end > e.start).map(({ start, end }) => ({ start, end }));
  for (const p of rules) outputs.set(p, await run(p, { ...req, removed }));
  const ruleEdits = rules.flatMap(stamp);

  const result = faithfulClean(req.raw, { ...base, ruleEdits, modelEdits, modelFlags });
  return {
    ...result,
    rejected: [...providers.flatMap((p) => outputs.get(p)!.rejected), ...result.rejected],
    providers: providers.map((p) => {
      const out = outputs.get(p)!;
      return {
        id: p.id,
        source: p.source,
        proposed: out.edits.length,
        rejected: out.rejected.length,
        invalid: out.invalid.length,
        ...(out.error ? { error: out.error } : {}),
      };
    }),
  };
}
