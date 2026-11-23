/**
 * [FR-AIS-15] A model change (new file, revision, quantisation or tier mapping)
 * is never silent. This test pins every catalog model's identity and the
 * language-to-model-by-tier table. Changing either fails here until the same PR
 * updates the pin, and the PR then owes the items listed in `MODEL_CHANGE_PR`:
 * the licence record, the gate numbers for each language served, the drift
 * report if ENGINE_VERSION changed, the size delta in bytes, the memory and
 * speed rows, and whether the pack manifest version rose. A model that scores
 * lower than the one it replaces on a gating row is refused (the gate, `npm run
 * gate` in experiments, decides; this test only makes the change visible).
 * BL-1357 part A. The PR-template checklist is proposed in docs/ops/proposed/.
 */
import { describe, expect, it } from 'vitest';
import { LANGUAGE_MODELS, SPEECH_MODELS } from '../src/lib/models/catalog';

export const MODEL_CHANGE_PR = [
  'licence record (FR-AIS-09)',
  'gate report numbers for every language the model serves (FR-AIS-36)',
  'drift report if ENGINE_VERSION changed',
  'size delta in bytes',
  'on-device memory and speed rows (FR-AIS-42 to 44)',
  'whether the pack manifest version rose',
] as const;

const identity = () =>
  Object.values(SPEECH_MODELS)
    .map((m) => ({ id: m.id, version: m.version, bytes: m.bytes, sha256: m.sha256, revision: m.source.revision, licence: m.licence, status: m.status, hosted: m.hosted }))
    .sort((a, b) => (a.id < b.id ? -1 : 1));

const PINNED_IDENTITY = [
  { id: 'speech-model.belle-whisper-turbo-zh-q5_0', version: 1, bytes: 574041195, sha256: 'bab0d61935b3f75e5435217eadfb1fceb6bcb09751b025a232e76ed33107747f', revision: '0a7f57392b773254eb60da8e49c7c683af369625', licence: 'Apache-2.0', status: 'candidate', hosted: false },
  { id: 'speech-model.silero-vad-v6.2.0', version: 1, bytes: 885098, sha256: '2aa269b785eeb53a82983a20501ddf7c1d9c48e33ab63a41391ac6c9f7fb6987', revision: '9ffd54a1e1ee413ddf265af9913beaf518d1639b', licence: 'MIT', status: 'default', hosted: true },
  { id: 'speech-model.whisper-hindi-small-q5_1', version: 1, bytes: 190085487, sha256: '6813fed7ffa6c3fa14490c1f1788d2d8b6e3b7badf59a2f75fb4c5c21cf00f3f', revision: 'fb4a24afc20c42906deed31c3689e4be31da41fe', licence: 'Apache-2.0', status: 'default', hosted: false },
  { id: 'speech-model.whisper-large-v3-turbo-q5_0', version: 1, bytes: 574041195, sha256: '394221709cd5ad1f40c46e6031ca61bce88931e6e088c188294c6d5a55ffa7e2', revision: '5359861c739e955e79d9a303bcbc70fb988958b1', licence: 'MIT', status: 'default', hosted: true },
  { id: 'speech-model.whisper-small-q5_1', version: 1, bytes: 190085487, sha256: 'ae85e4a935d7a567bd102fe55afc16bb595bdb618e11b2fc7591bc08120411bb', revision: '5359861c739e955e79d9a303bcbc70fb988958b1', licence: 'MIT', status: 'default', hosted: true },
];
const PINNED_TIERS = {
  en: { full: ['speech-model.whisper-large-v3-turbo-q5_0'], compact: ['speech-model.whisper-small-q5_1'] },
  es: { full: ['speech-model.whisper-large-v3-turbo-q5_0'], compact: ['speech-model.whisper-small-q5_1'] },
  fr: { full: ['speech-model.whisper-large-v3-turbo-q5_0'], compact: ['speech-model.whisper-small-q5_1'] },
  pt: { full: ['speech-model.whisper-large-v3-turbo-q5_0'], compact: ['speech-model.whisper-small-q5_1'] },
  ar: { full: ['speech-model.whisper-large-v3-turbo-q5_0'], compact: ['speech-model.whisper-small-q5_1'] },
  zh: { full: ['speech-model.whisper-large-v3-turbo-q5_0'], compact: ['speech-model.whisper-small-q5_1'] },
  hi: { full: ['speech-model.whisper-hindi-small-q5_1', 'speech-model.whisper-large-v3-turbo-q5_0'], compact: ['speech-model.whisper-hindi-small-q5_1', 'speech-model.whisper-small-q5_1'] },
};

describe('[FR-AIS-15] a model change shows up as a pin change, and the PR owes the change record', () => {
  it('[FR-AIS-15] the catalog identity (file, bytes, hash, revision, licence, status, hosted) is as pinned', () => {
    expect(identity(), `a model changed: the PR must carry ${MODEL_CHANGE_PR.join('; ')}`).toEqual(PINNED_IDENTITY);
  });

  it('[FR-AIS-15] the language-to-model mapping by tier is as pinned', () => {
    expect(LANGUAGE_MODELS, `a tier mapping changed: the PR must carry ${MODEL_CHANGE_PR.join('; ')}`).toEqual(PINNED_TIERS);
  });
});
