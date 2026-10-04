/**
 * Speech model catalog (ADR 0015; founder decisions 6 and 15). Pure: no React
 * Native, tested in Node (test/models-catalog.test.ts).
 *
 * Every speech model is a pack of kind `speech-model` in the platform pack
 * system (src/lib/packs, contract in @scribe/api `PackManifest`). Nothing
 * here ships inside the app: a model downloads only when an author picks a
 * language it serves, and every file is trusted only after its SHA-256
 * matches the value below.
 *
 * Which model serves which language (ADR 0015, decision):
 * - English, Spanish, French, Portuguese, Arabic, Mandarin Chinese: one
 *   shared multilingual model, Whisper large-v3-turbo q5_0. A family speaking
 *   any mix of these downloads it once. Mandarin gets Simplified characters
 *   and punctuation from its prompt seed (transcribe-prompt.ts).
 * - Hindi: whisper-hindi-small q5_1 (Apache-2.0, a third of turbo's size;
 *   turbo is weakest on Hindi of our seven languages). Falls back to the
 *   shared model until our copy is hosted.
 * - Candidates (`status: 'candidate'`) are built and hashed but never chosen
 *   until the golden corpus says so: Belle-whisper-large-v3-turbo-zh ties
 *   turbo on Chinese text in our check but writes Latin-script names in
 *   Chinese characters (ADR 0015), and names are the bar that matters most.
 * - Low-memory phones (compact tier): Whisper small q5_1 for every language
 *   except Hindi, which is already small.
 * - Voice activity detection: Silero VAD v6.2.0 (under 1 MB), needed by
 *   every model, downloaded with the first one.
 *
 * Hashes and sizes (verified 3 Oct 2026, see ADR 0015 "Integrity"):
 * - Upstream files: SHA-256 from the Hugging Face API for the pinned revision
 *   (LFS object id), and again by downloading each file from the exact URL
 *   below and hashing it with sha256sum. Both agree.
 * - Files we build (Mandarin, Hindi): whisper.cpp v1.9.3 (commit 371b5a75,
 *   the version whisper.rn 0.7.4 bundles) `whisper-quantize`, run on the
 *   pinned source revision. The same tool re-quantizing upstream turbo f16
 *   reproduces upstream's q5_0 byte for byte (394221709c...), so the build is
 *   deterministic and anyone can reproduce these hashes with the recipe in
 *   ADR 0015. `hosted: false` until the founder uploads them (D-046 host).
 */

export const SPEECH_LANGUAGES = ['en', 'hi', 'es', 'zh', 'fr', 'ar', 'pt'] as const;
/** The seven spoken-letter languages of v1.0 (ISO 639-1). */
export type SpeechLanguage = (typeof SPEECH_LANGUAGES)[number];

export function isSpeechLanguage(code: string | null | undefined): code is SpeechLanguage {
  return !!code && (SPEECH_LANGUAGES as readonly string[]).includes(code);
}

/** full: phones with 4 GB of RAM or more; compact: smaller phones or repeated memory failures (tiers.ts). */
export type Tier = 'full' | 'compact';

export type SpeechModelId =
  | 'speech-model.silero-vad-v6.2.0'
  | 'speech-model.whisper-large-v3-turbo-q5_0'
  | 'speech-model.whisper-small-q5_1'
  | 'speech-model.belle-whisper-turbo-zh-q5_0'
  | 'speech-model.whisper-hindi-small-q5_1';

export interface SpeechModel {
  /** Pack id in the PackManifest (`<kind>.<name>`). */
  id: SpeechModelId;
  kind: 'speech-model';
  role: 'asr' | 'vad';
  /** BCP 47 tag the pack serves, or `mul` for a multilingual model. */
  language: 'mul' | SpeechLanguage;
  /** Pack version: bump when the file changes; the id stays. */
  version: number;
  /** Installed file name (Application Support/models). */
  fileName: string;
  url: string;
  mirrors: string[];
  bytes: number;
  sha256: string;
  /** Licence of the weights. Only permissive licences are accepted (brief: MIT, Apache-2.0, BSD, ISC). */
  licence: 'MIT' | 'Apache-2.0';
  /** Where the bytes come from, pinned to a commit. */
  source: { repo: string; revision: string; file: string; sha256: string };
  /** 'upstream': served as published. Otherwise how we built it (ADR 0015 recipe). */
  build: 'upstream' | { tool: 'whisper.cpp whisper-quantize'; version: 'v1.9.3'; commit: string; quant: 'q5_0' | 'q5_1'; converter?: string };
  /** false until the file is uploaded to the self host (D-046); a model that is not hosted is never chosen. */
  hosted: boolean;
  /** 'default': chosen for a language below. 'candidate': built and hashed for evaluation, never chosen. */
  status: 'default' | 'candidate';
  /** Memory the loaded model needs, estimated (E; measured in BL-043). Drives the tier, never shown. */
  residentBytesEstimate: number;
}

/** Pinned upstream revisions (commit SHAs on huggingface.co). */
export const UPSTREAM = {
  whisperCpp: { repo: 'ggerganov/whisper.cpp', revision: '5359861c739e955e79d9a303bcbc70fb988958b1' },
  vad: { repo: 'ggml-org/whisper-vad', revision: '9ffd54a1e1ee413ddf265af9913beaf518d1639b' },
  belleZh: { repo: 'BELLE-2/Belle-whisper-large-v3-turbo-zh-ggml', revision: '0a7f57392b773254eb60da8e49c7c683af369625' },
  hindiSmall: { repo: 'vasista22/whisper-hindi-small', revision: 'fb4a24afc20c42906deed31c3689e4be31da41fe' },
} as const;

/** whisper.cpp tag whisper.rn 0.7.4 bundles (node_modules/whisper.rn/src/version.json); our quantize tool is built from it. */
export const WHISPER_CPP_BUILD = { version: 'v1.9.3', commit: '371b5a7561823ab2bb32142d2751e35e7534727b' } as const;

/**
 * Base URL of our own model host (D-046: a zero-egress bucket, founder picks
 * the provider). Paths are versioned and immutable: a new file gets a new path.
 */
export const SELF_HOST_BASE = 'https://models.earlyletters.com/speech';

const hf = (r: { repo: string; revision: string }, file: string) => `https://huggingface.co/${r.repo}/resolve/${r.revision}/${file}`;

export const SPEECH_MODELS: Record<SpeechModelId, SpeechModel> = {
  'speech-model.silero-vad-v6.2.0': {
    id: 'speech-model.silero-vad-v6.2.0',
    kind: 'speech-model',
    role: 'vad',
    language: 'mul',
    version: 1,
    fileName: 'ggml-silero-v6.2.0.bin',
    url: hf(UPSTREAM.vad, 'ggml-silero-v6.2.0.bin'),
    mirrors: [],
    bytes: 885_098,
    sha256: '2aa269b785eeb53a82983a20501ddf7c1d9c48e33ab63a41391ac6c9f7fb6987',
    licence: 'MIT',
    source: { ...UPSTREAM.vad, file: 'ggml-silero-v6.2.0.bin', sha256: '2aa269b785eeb53a82983a20501ddf7c1d9c48e33ab63a41391ac6c9f7fb6987' },
    build: 'upstream',
    hosted: true,
    status: 'default',
    residentBytesEstimate: 8_000_000,
  },
  'speech-model.whisper-large-v3-turbo-q5_0': {
    id: 'speech-model.whisper-large-v3-turbo-q5_0',
    kind: 'speech-model',
    role: 'asr',
    language: 'mul',
    version: 1,
    fileName: 'ggml-large-v3-turbo-q5_0.bin',
    url: hf(UPSTREAM.whisperCpp, 'ggml-large-v3-turbo-q5_0.bin'),
    mirrors: [],
    bytes: 574_041_195,
    sha256: '394221709cd5ad1f40c46e6031ca61bce88931e6e088c188294c6d5a55ffa7e2',
    licence: 'MIT',
    source: { ...UPSTREAM.whisperCpp, file: 'ggml-large-v3-turbo-q5_0.bin', sha256: '394221709cd5ad1f40c46e6031ca61bce88931e6e088c188294c6d5a55ffa7e2' },
    build: 'upstream',
    hosted: true,
    status: 'default',
    residentBytesEstimate: 1_000_000_000,
  },
  'speech-model.whisper-small-q5_1': {
    id: 'speech-model.whisper-small-q5_1',
    kind: 'speech-model',
    role: 'asr',
    language: 'mul',
    version: 1,
    fileName: 'ggml-small-q5_1.bin',
    url: hf(UPSTREAM.whisperCpp, 'ggml-small-q5_1.bin'),
    mirrors: [],
    bytes: 190_085_487,
    sha256: 'ae85e4a935d7a567bd102fe55afc16bb595bdb618e11b2fc7591bc08120411bb',
    licence: 'MIT',
    source: { ...UPSTREAM.whisperCpp, file: 'ggml-small-q5_1.bin', sha256: 'ae85e4a935d7a567bd102fe55afc16bb595bdb618e11b2fc7591bc08120411bb' },
    build: 'upstream',
    hosted: true,
    status: 'default',
    residentBytesEstimate: 400_000_000,
  },
  'speech-model.belle-whisper-turbo-zh-q5_0': {
    id: 'speech-model.belle-whisper-turbo-zh-q5_0',
    kind: 'speech-model',
    role: 'asr',
    language: 'zh',
    version: 1,
    fileName: 'ggml-belle-whisper-large-v3-turbo-zh-q5_0.bin',
    url: `${SELF_HOST_BASE}/belle-whisper-large-v3-turbo-zh/0a7f5739/ggml-belle-whisper-large-v3-turbo-zh-q5_0.bin`,
    mirrors: [],
    bytes: 574_041_195,
    sha256: 'bab0d61935b3f75e5435217eadfb1fceb6bcb09751b025a232e76ed33107747f',
    licence: 'Apache-2.0',
    source: { ...UPSTREAM.belleZh, file: 'ggml-model.bin', sha256: '2a3bba5bfdb4d4da3d9949a83b405711727ca1941d4d5810895e077eb3cb4d99' },
    build: { tool: 'whisper.cpp whisper-quantize', version: 'v1.9.3', commit: WHISPER_CPP_BUILD.commit, quant: 'q5_0' },
    hosted: false,
    status: 'candidate',
    residentBytesEstimate: 1_000_000_000,
  },
  'speech-model.whisper-hindi-small-q5_1': {
    id: 'speech-model.whisper-hindi-small-q5_1',
    kind: 'speech-model',
    role: 'asr',
    language: 'hi',
    version: 1,
    fileName: 'ggml-whisper-hindi-small-q5_1.bin',
    url: `${SELF_HOST_BASE}/whisper-hindi-small/fb4a24af/ggml-whisper-hindi-small-q5_1.bin`,
    mirrors: [],
    bytes: 190_085_487,
    sha256: '6813fed7ffa6c3fa14490c1f1788d2d8b6e3b7badf59a2f75fb4c5c21cf00f3f',
    licence: 'Apache-2.0',
    source: { ...UPSTREAM.hindiSmall, file: 'pytorch_model.bin', sha256: 'a19127581a96928c53cc8322249610df2cd59c59e6d06a707d9b1a1b9b25e2d9' },
    build: {
      tool: 'whisper.cpp whisper-quantize',
      version: 'v1.9.3',
      commit: WHISPER_CPP_BUILD.commit,
      quant: 'q5_1',
      converter: 'whisper.cpp v1.9.3 models/convert-h5-to-ggml.py, openai/whisper 86098128 assets, torch 2.5.1 cpu, transformers 4.46.3',
    },
    hosted: false,
    status: 'default',
    residentBytesEstimate: 400_000_000,
  },
};

export const VAD_MODEL_ID: SpeechModelId = 'speech-model.silero-vad-v6.2.0';

/**
 * The recogniser each language uses, best first. The first hosted entry
 * wins; the last entry of every list is a shared upstream model, so every
 * language always has a model.
 */
export const LANGUAGE_MODELS: Record<SpeechLanguage, Record<Tier, readonly SpeechModelId[]>> = {
  en: { full: ['speech-model.whisper-large-v3-turbo-q5_0'], compact: ['speech-model.whisper-small-q5_1'] },
  es: { full: ['speech-model.whisper-large-v3-turbo-q5_0'], compact: ['speech-model.whisper-small-q5_1'] },
  fr: { full: ['speech-model.whisper-large-v3-turbo-q5_0'], compact: ['speech-model.whisper-small-q5_1'] },
  pt: { full: ['speech-model.whisper-large-v3-turbo-q5_0'], compact: ['speech-model.whisper-small-q5_1'] },
  ar: { full: ['speech-model.whisper-large-v3-turbo-q5_0'], compact: ['speech-model.whisper-small-q5_1'] },
  zh: { full: ['speech-model.whisper-large-v3-turbo-q5_0'], compact: ['speech-model.whisper-small-q5_1'] },
  hi: {
    full: ['speech-model.whisper-hindi-small-q5_1', 'speech-model.whisper-large-v3-turbo-q5_0'],
    compact: ['speech-model.whisper-hindi-small-q5_1', 'speech-model.whisper-small-q5_1'],
  },
};

/** Models that may be chosen: hosted ones, plus any the caller says are already installed (a dev copy, an earlier host). */
export type Availability = (id: SpeechModelId) => boolean;
export const hostedOnly: Availability = (id) => SPEECH_MODELS[id].hosted;

/** The recogniser for one language on this tier. */
export function asrModelFor(language: SpeechLanguage, tier: Tier, available: Availability = hostedOnly): SpeechModel {
  const list = LANGUAGE_MODELS[language][tier];
  const id = list.find((m) => available(m)) ?? list[list.length - 1];
  return SPEECH_MODELS[id];
}

export interface SpeechPlan {
  /** Recogniser per language. */
  asr: Partial<Record<SpeechLanguage, SpeechModelId>>;
  /** Every pack to install, VAD first then recognisers, each once. */
  packs: SpeechModelId[];
  /** Bytes a first install downloads. */
  bytes: number;
}

/**
 * What a phone needs for the languages its authors chose. Shared models are
 * counted once: English and Spanish together download one model.
 */
export function speechPlan(languages: readonly SpeechLanguage[], tier: Tier, available: Availability = hostedOnly): SpeechPlan {
  const asr: SpeechPlan['asr'] = {};
  const packs: SpeechModelId[] = [];
  for (const lang of [...new Set(languages)]) {
    const m = asrModelFor(lang, tier, available);
    asr[lang] = m.id;
    if (!packs.includes(m.id)) packs.push(m.id);
  }
  if (packs.length) packs.unshift(VAD_MODEL_ID);
  return { asr, packs, bytes: packs.reduce((n, id) => n + SPEECH_MODELS[id].bytes, 0) };
}

/**
 * Manifest entries for the platform pack system (shape of @scribe/api
 * `PackEntry`, kind `speech-model`). `required: false` on purpose: a speech
 * model is chosen per language by `speechPlan`, not by the generic
 * "every required `mul` pack" rule, which would download the shared model
 * for a Hindi-only family (ADR 0015, request to the platform agent).
 */
export function speechPackEntries(minAppVersion = '1.0.0', available: Availability = hostedOnly) {
  return Object.values(SPEECH_MODELS)
    .filter((m) => m.status === 'default' && available(m.id))
    .map((m) => ({
      id: m.id,
      kind: m.kind,
      language: m.language,
      version: m.version,
      url: m.url,
      mirrors: m.mirrors,
      bytes: m.bytes,
      sha256: m.sha256,
      fileName: m.fileName,
      minAppVersion,
      required: false,
    }));
}

/** Every file name the speech packs may leave in the models directory. */
export const SPEECH_MODEL_FILE_NAMES: readonly string[] = Object.values(SPEECH_MODELS).map((m) => m.fileName);
