/**
 * Manifest pack ids and speech model ids to the catalogue's short analytics
 * values. The manifest id (`text-rules.pt`,
 * `speech-model.whisper-large-v3-turbo-q5_0`) is never sent: it is not
 * personal, but it is a free-form string from a server document, and the
 * allowlist only takes closed enums. Pure and tested.
 */
import type { Catalog, Lang } from './catalog';
import { toV1Lang } from './buckets';

export type PackAnalyticsId = Catalog['pack_download']['props']['pack']['values'][number];
export type SpeechModelValue = Catalog['transcription_completed']['props']['model']['values'][number];

/** Speech model packs by manifest id (src/lib/models/catalog.ts, ADR 0015). */
const MODEL_PACKS: Readonly<Record<string, { pack: PackAnalyticsId; lang?: Lang; model: SpeechModelValue }>> = {
  'speech-model.silero-vad-v6.2.0': { pack: 'model_vad', model: 'none' },
  'speech-model.whisper-large-v3-turbo-q5_0': { pack: 'model_turbo', model: 'turbo' },
  'speech-model.whisper-small-q5_1': { pack: 'model_small', model: 'small' },
  'speech-model.whisper-hindi-small-q5_1': { pack: 'model_hindi_small', lang: 'hi', model: 'hindi_small' },
  'speech-model.belle-whisper-turbo-zh-q5_0': { pack: 'model_zh_turbo', lang: 'zh', model: 'zh_turbo' },
};

/** `text-rules.pt` to `{ pack: 'rules_pt', lang: 'pt' }`; anything unknown to `{ pack: 'other' }`. */
export function packAnalyticsId(manifestId: string | null | undefined): { pack: PackAnalyticsId; lang?: Lang } {
  if (!manifestId) return { pack: 'other' };
  const model = MODEL_PACKS[manifestId];
  if (model) return model.lang ? { pack: model.pack, lang: model.lang } : { pack: model.pack };
  const m = /^(text-rules|prompts)\.([a-z]{2,3}(?:-[A-Za-z0-9]+)*)$/.exec(manifestId);
  if (m) {
    const lang = toV1Lang(m[2]);
    if (lang) return { pack: `${m[1] === 'text-rules' ? 'rules' : 'prompts'}_${lang}` as PackAnalyticsId, lang };
  }
  return { pack: 'other' };
}

/** Speech model id (or null for the dev sample engine) to the `model` value. */
export function speechModelValue(modelId: string | null | undefined): SpeechModelValue {
  if (!modelId) return 'none';
  return MODEL_PACKS[modelId]?.model ?? 'none';
}
