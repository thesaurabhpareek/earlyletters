/**
 * cleanWithProviders, carrying the entry's language through every step.
 *
 * edit-provider.ts builds its faithfulClean options from the request's
 * level, dictionary and locked phrases only, so a language passed there
 * would be dropped. Until EditRequest grows a `rules` field (requested in
 * the language-pack report), this is the same two-phase flow with the
 * rules threaded in: model providers see only the raw text; rule providers
 * then see which spans verified removals delete; everything is verified
 * together by faithfulClean with the language's rules.
 */
import type { EditProposal, EditProvider, EditRequest, ProviderCleanResult } from '../edit-provider';
import { emptyProposal } from '../edit-provider';
import { faithfulClean, rulesFor, type CleanOptions } from '../pipeline';
import type { LanguageRules } from './engine';
import { LanguagePunctuationProvider } from './punctuation';

export type LanguageOptions = Pick<CleanOptions, 'language' | 'pack' | 'script' | 'rules'>;

async function run(p: EditProvider, req: EditRequest): Promise<EditProposal> {
  try {
    return await p.propose(req);
  } catch {
    // Fixed code only: an error message could echo the transcript into logs.
    return emptyProposal('provider_failed');
  }
}

export async function cleanWithLanguage(req: EditRequest, providers: EditProvider[], lang: LanguageOptions): Promise<ProviderCleanResult> {
  const rules: LanguageRules = rulesFor(lang);
  const base = { level: req.level, dictionary: req.dictionary, locked: req.locked, rules };
  const { removed: _ignored, ...modelReq } = req;
  const outputs = new Map<EditProvider, EditProposal>();

  const stamp = (p: EditProvider) => (outputs.get(p)?.edits ?? []).map((e) => ({ ...e, source: p.source }));
  const models = providers.filter((p) => p.source === 'model');
  const ruleProviders = providers.filter((p) => p.source === 'rule');

  for (const p of models) outputs.set(p, await run(p, modelReq));
  const modelEdits = models.flatMap(stamp);
  const modelFlags = models.flatMap((p) => outputs.get(p)!.flags);

  const dry = faithfulClean(req.raw, { ...base, modelEdits });
  const removed = dry.applied.filter((e) => e.replacement.trim() === '' && e.end > e.start).map(({ start, end }) => ({ start, end }));
  for (const p of ruleProviders) outputs.set(p, await run(p, { ...req, removed }));
  const ruleEdits = ruleProviders.flatMap(stamp);

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

/** The rules-only clean the review screen runs: dictionary, fillers, repeats, script, then language punctuation. */
export function cleanRulesOnly(req: EditRequest, lang: LanguageOptions): Promise<ProviderCleanResult> {
  return cleanWithLanguage(req, [new LanguagePunctuationProvider(rulesFor(lang))], lang);
}
