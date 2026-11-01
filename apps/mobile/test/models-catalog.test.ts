import { describe, expect, it } from 'vitest';
import { PACK_FILE_NAME_RE, PACK_ID_RE, parsePackManifest } from '@scribe/api';
import {
  LANGUAGE_MODELS,
  SPEECH_LANGUAGES,
  SPEECH_MODELS,
  SPEECH_MODEL_FILE_NAMES,
  UPSTREAM,
  VAD_MODEL_ID,
  WHISPER_CPP_BUILD,
  asrModelFor,
  hostedOnly,
  isSpeechLanguage,
  speechPackEntries,
  speechPlan,
  type SpeechModelId,
} from '../src/lib/models/catalog';
import { nativePath } from '../src/lib/models/paths';
import { FULL_TIER_MIN_RAM_BYTES, MEMORY_FAILURES_BEFORE_COMPACT, pickTier } from '../src/lib/models/tiers';

const MODELS = Object.values(SPEECH_MODELS);
const everything = () => true;

describe('speech model catalog integrity (ADR 0015)', () => {
  it('every entry is a well-formed, pinned, permissively licensed pack', () => {
    for (const m of MODELS) {
      expect(m.id, m.id).toMatch(PACK_ID_RE);
      expect(m.id.startsWith('speech-model.'), m.id).toBe(true);
      expect(m.fileName, m.id).toMatch(PACK_FILE_NAME_RE);
      expect(m.sha256, m.id).toMatch(/^[0-9a-f]{64}$/);
      expect(m.source.sha256, m.id).toMatch(/^[0-9a-f]{64}$/);
      expect(m.source.revision, m.id).toMatch(/^[0-9a-f]{40}$/);
      expect(Number.isInteger(m.bytes) && m.bytes > 0, m.id).toBe(true);
      expect(m.url, m.id).toMatch(/^https:\/\//);
      expect(m.url, m.id).not.toMatch(/\/resolve\/main\//); // a moving branch could change the bytes
      expect(['MIT', 'Apache-2.0'], m.id).toContain(m.licence);
      expect(m.version, m.id).toBeGreaterThanOrEqual(1);
    }
  });

  it('ids and file names are unique', () => {
    expect(new Set(MODELS.map((m) => m.id)).size).toBe(MODELS.length);
    expect(new Set(SPEECH_MODEL_FILE_NAMES).size).toBe(MODELS.length);
  });

  it('an upstream file is served exactly as published (same bytes as its pinned source)', () => {
    for (const m of MODELS.filter((x) => x.build === 'upstream')) {
      expect(m.sha256, m.id).toBe(m.source.sha256);
      expect(m.url, m.id).toContain(m.source.revision);
      expect(m.url.endsWith(`/${m.source.file}`), m.id).toBe(true);
    }
  });

  it('a file we build names the exact whisper.cpp tag whisper.rn bundles, and is not marked hosted before upload', () => {
    for (const m of MODELS.filter((x) => x.build !== 'upstream')) {
      if (m.build === 'upstream') continue;
      expect(m.build.version, m.id).toBe(WHISPER_CPP_BUILD.version);
      expect(m.build.commit, m.id).toBe(WHISPER_CPP_BUILD.commit);
      expect(m.sha256, m.id).not.toBe(m.source.sha256);
    }
  });

  it('pins the hashes verified on 3 Oct 2026 (HF API and direct download agree)', () => {
    expect(SPEECH_MODELS['speech-model.whisper-large-v3-turbo-q5_0']).toMatchObject({
      bytes: 574_041_195,
      sha256: '394221709cd5ad1f40c46e6031ca61bce88931e6e088c188294c6d5a55ffa7e2',
      source: { revision: UPSTREAM.whisperCpp.revision },
    });
    expect(SPEECH_MODELS['speech-model.whisper-small-q5_1'].sha256).toBe('ae85e4a935d7a567bd102fe55afc16bb595bdb618e11b2fc7591bc08120411bb');
    expect(SPEECH_MODELS[VAD_MODEL_ID].sha256).toBe('2aa269b785eeb53a82983a20501ddf7c1d9c48e33ab63a41391ac6c9f7fb6987');
    expect(SPEECH_MODELS['speech-model.whisper-hindi-small-q5_1'].sha256).toBe('6813fed7ffa6c3fa14490c1f1788d2d8b6e3b7badf59a2f75fb4c5c21cf00f3f');
  });

  it('every v1.0 language has a recogniser on both tiers, ending in a hosted shared model', () => {
    expect([...SPEECH_LANGUAGES].sort()).toEqual(['ar', 'en', 'es', 'fr', 'hi', 'pt', 'zh']);
    for (const lang of SPEECH_LANGUAGES) {
      for (const tier of ['full', 'compact'] as const) {
        const list = LANGUAGE_MODELS[lang][tier];
        expect(list.length, `${lang} ${tier}`).toBeGreaterThan(0);
        const last = SPEECH_MODELS[list[list.length - 1]];
        expect(last.hosted && last.language === 'mul', `${lang} ${tier}`).toBe(true);
        for (const id of list) {
          expect(SPEECH_MODELS[id].role, id).toBe('asr');
          expect(SPEECH_MODELS[id].status, `${id} is a candidate and must not be chosen`).toBe('default');
          expect(['mul', lang], id).toContain(SPEECH_MODELS[id].language);
        }
      }
    }
  });

  it('the compact tier never needs a large model', () => {
    for (const lang of SPEECH_LANGUAGES) {
      for (const id of LANGUAGE_MODELS[lang].compact) expect(SPEECH_MODELS[id].residentBytesEstimate, id).toBeLessThanOrEqual(500_000_000);
    }
  });
});

describe('what a family downloads (founder decision 15: lean, on demand)', () => {
  const TURBO = SPEECH_MODELS['speech-model.whisper-large-v3-turbo-q5_0'].bytes;
  const VAD = SPEECH_MODELS[VAD_MODEL_ID].bytes;
  const HINDI = SPEECH_MODELS['speech-model.whisper-hindi-small-q5_1'].bytes;

  it('nothing is needed until a language is chosen', () => {
    expect(speechPlan([], 'full')).toEqual({ asr: {}, packs: [], bytes: 0 });
  });

  it('English and Spanish share one model: one download', () => {
    const plan = speechPlan(['en', 'es'], 'full');
    expect(plan.packs).toEqual([VAD_MODEL_ID, 'speech-model.whisper-large-v3-turbo-q5_0']);
    expect(plan.bytes).toBe(TURBO + VAD);
    expect(plan.bytes).toBe(574_926_293);
  });

  it('Mandarin uses the shared model too (the Belle candidate is never chosen)', () => {
    expect(speechPlan(['zh'], 'full', everything).asr.zh).toBe('speech-model.whisper-large-v3-turbo-q5_0');
    expect(speechPlan(['en', 'zh'], 'full', everything).bytes).toBe(TURBO + VAD);
  });

  it('Hindi uses its own small model once hosted, and the shared model until then', () => {
    expect(asrModelFor('hi', 'full', hostedOnly).id).toBe('speech-model.whisper-large-v3-turbo-q5_0');
    const plan = speechPlan(['hi'], 'full', everything);
    expect(plan.asr.hi).toBe('speech-model.whisper-hindi-small-q5_1');
    expect(plan.bytes).toBe(HINDI + VAD);
    expect(speechPlan(['en', 'hi'], 'full', everything).bytes).toBe(TURBO + HINDI + VAD);
  });

  it('a model this phone already has stays usable even if it is not listed as hosted', () => {
    const installed = (id: SpeechModelId) => id === 'speech-model.whisper-hindi-small-q5_1' || SPEECH_MODELS[id].hosted;
    expect(asrModelFor('hi', 'full', installed).id).toBe('speech-model.whisper-hindi-small-q5_1');
  });

  it('low-memory phones download the small models only', () => {
    const plan = speechPlan(['en', 'zh', 'ar'], 'compact', everything);
    expect(plan.packs).toEqual([VAD_MODEL_ID, 'speech-model.whisper-small-q5_1']);
    expect(speechPlan(['hi'], 'compact', everything).asr.hi).toBe('speech-model.whisper-hindi-small-q5_1');
  });

  it('manifest entries pass the platform contract (@scribe/api) and exclude candidates and unhosted files', () => {
    const entries = speechPackEntries('1.0.0');
    const parsed = parsePackManifest({ schemaVersion: 1, version: 1, generatedAt: '2026-10-03T00:00:00Z', packs: entries });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.skipped).toBe(0);
    expect(parsed.value.packs.map((p) => p.id).sort()).toEqual([
      'speech-model.silero-vad-v6.2.0',
      'speech-model.whisper-large-v3-turbo-q5_0',
      'speech-model.whisper-small-q5_1',
    ]);
    // Never auto-downloaded by the generic "required mul pack" rule: the speech plan decides.
    expect(parsed.value.packs.every((p) => p.required === false)).toBe(true);
    const all = speechPackEntries('1.0.0', everything).map((p) => p.id);
    expect(all).toContain('speech-model.whisper-hindi-small-q5_1');
    expect(all).not.toContain('speech-model.belle-whisper-turbo-zh-q5_0');
  });
});

describe('tiers and paths', () => {
  it('picks the full tier at 4 GB and the compact tier below, after memory failures, or when RAM is unknown', () => {
    expect(pickTier({ totalMemoryBytes: 3.8e9, memoryFailures: 0 })).toBe('full');
    expect(pickTier({ totalMemoryBytes: FULL_TIER_MIN_RAM_BYTES - 1, memoryFailures: 0 })).toBe('compact');
    expect(pickTier({ totalMemoryBytes: 8e9, memoryFailures: MEMORY_FAILURES_BEFORE_COMPACT })).toBe('compact');
    expect(pickTier({ totalMemoryBytes: null, memoryFailures: 0 })).toBe('compact');
    expect(pickTier({ totalMemoryBytes: 8e9, memoryFailures: 0, preference: 'compact' })).toBe('compact');
  });

  it('turns file URIs into real paths for whisper.rn (Application Support has a space)', () => {
    expect(nativePath('file:///var/mobile/Containers/Data/Application/X/Library/Application%20Support/packs/a.bin')).toBe(
      '/var/mobile/Containers/Data/Application/X/Library/Application Support/packs/a.bin',
    );
    expect(nativePath('/already/a/path.bin')).toBe('/already/a/path.bin');
  });

  it('recognises only the seven v1.0 languages', () => {
    expect(isSpeechLanguage('hi')).toBe(true);
    expect(isSpeechLanguage('de')).toBe(false);
    expect(isSpeechLanguage(null)).toBe(false);
  });
});
