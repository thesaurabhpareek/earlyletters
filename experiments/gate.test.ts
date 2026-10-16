/**
 * The per-language gate tool (F05-REQ-002 to F05-REQ-006, WP-F05-02) on
 * synthetic fixtures only: the fictional family "Asha", made-up sentences,
 * generated sine and silence instead of recordings. No real voice, name or
 * transcript is in this file.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { DictionaryTerm } from '@scribe/core';
import { SPEECH_MODELS, WHISPER_CPP_BUILD, asrModelFor, type SpeechLanguage } from '../apps/mobile/src/lib/models/catalog';
import { chunkSampleCount, planChunks } from '../apps/mobile/src/lib/transcribe-plan';
import { VAD_OPTIONS } from '../apps/mobile/src/lib/transcribe-run';
import { ToolFailed, chunkPcm, parseVadSegments, parseWav, parseWhisperJson, runTool, safeErrorMessage, vadArgs, wavBytes, whisperArgs, windowPcm } from './gate-audio';
import {
  ADVERSARIAL,
  GATE_BARS,
  buildGateReport,
  clipsFor,
  fingerprintFor,
  loadPack,
  mergeEvidence,
  newEvidenceFile,
  recordedFingerprints,
  renderTierSection,
  speakerBootstrap,
  staleness,
  verifierReadiness,
  type ClipOutcome,
  type DeviceRun,
  type GateConfig,
  type GateInput,
  type PhraseConfig,
} from './gate-lib';

const PACKS = join(__dirname, '..', 'packs', 'text-rules');
const packText = (l: SpeechLanguage) => readFileSync(join(PACKS, `${l}.json`), 'utf8');

const DICT: DictionaryTerm[] = [
  { term: 'Asha', kind: 'child', heardAs: [] },
  { term: 'Nani', kind: 'family', heardAs: [] },
];

const EN_LINES = [
  'Asha laughed at the rain on the window today',
  'Nani sang to Asha before her nap',
  'You held the blue spoon all by yourself',
  'We walked to the park and Asha waved at every dog',
];

/** A full English sample: 10 speakers, 3 scripted + 1 unscripted + 1 whispered + 1 white-noise clip each, 5 noise clips. */
function englishCorpus(speakers = 10): PhraseConfig[] {
  const phrases: PhraseConfig[] = [];
  for (let s = 1; s <= speakers; s++) {
    const kinds = ['scripted', 'scripted', 'scripted', 'unscripted', 'whisper', 'white_noise'];
    kinds.forEach((kind, k) => phrases.push({ file: `p${s}-${k}.m4a`, expected: EN_LINES[k % EN_LINES.length], language: 'en', speaker: `parent-${s}`, kind }));
  }
  for (let n = 1; n <= 5; n++) phrases.push({ file: `noise-${n}.m4a`, expected: '', language: 'en', kind: 'noise' });
  return phrases;
}

const perfect = (phrases: PhraseConfig[], tweak: (p: PhraseConfig) => string = (p) => p.expected): Map<string, ClipOutcome> =>
  new Map(phrases.map((p) => [p.file, { file: p.file, raw: tweak(p), seconds: 1 }]));

function deviceRuns(language: string, n = 30, seconds = 24, jetsam = false): DeviceRun[] {
  return Array.from({ length: n }, (_, i) => ({ language, tier: 'full' as const, device: 'iPhone SE (3rd generation)', audioSeconds: 120, finishToTextSeconds: seconds + (i % 5), jetsam: jetsam && i === 0 }));
}

function input(language: SpeechLanguage, phrases: PhraseConfig[], over: Partial<GateInput> = {}): GateInput {
  const config: GateConfig = { language, dictionary: DICT, phrases };
  return {
    language,
    tier: 'full',
    clips: clipsFor(config, language).clips,
    outcomes: perfect(phrases),
    packText: packText(language),
    dictionary: DICT,
    signoffText: null,
    deviceRuns: deviceRuns(language),
    decoderVersion: WHISPER_CPP_BUILD.version,
    modelFileSha256: SPEECH_MODELS[asrModelFor(language, 'full').id].sha256,
    generatedAt: '2026-10-15T12:00:00.000Z',
    ...over,
  };
}

const status = (r: ReturnType<typeof buildGateReport>['report'], id: string) => r.checks.find((c) => c.id === id)?.status;

describe('corpus config (WP-F05-02: a language per phrase)', () => {
  it('takes the phrases of one language, defaults the kind and labels speakers anonymously', () => {
    const { clips, problems } = clipsFor(
      {
        language: 'en',
        phrases: [
          { file: 'a.m4a', expected: 'Asha slept.', speaker: 'mum' },
          { file: 'b.m4a', expected: 'Asha durmió.', language: 'es', speaker: 'dad' },
          { file: 'c.m4a', expected: '', speaker: 'mum' },
          { file: 'd.m4a', expected: 'Good night, Asha.', speaker: 'grandad', kind: 'unscripted' },
        ],
      },
      'en',
    );
    expect(clips.map((c) => [c.file, c.kind, c.speaker])).toEqual([
      ['a.m4a', 'scripted', 'S01'],
      ['c.m4a', 'noise', 'S01'],
      ['d.m4a', 'unscripted', 'S02'],
    ]);
    expect(problems).toEqual([]);
  });

  it('reports problems by phrase number, never by their words', () => {
    const { problems } = clipsFor(
      { language: 'en', phrases: [{ file: 'x.m4a', expected: 'Asha and Nani', kind: 'noise' }, { file: 'y.m4a', expected: '', kind: 'scripted' }, { file: 'z.m4a', expected: 'hi', kind: 'chatty' }] },
      'en',
    );
    expect(problems).toHaveLength(3);
    expect(problems.join(' ')).not.toMatch(/Asha|Nani/);
    expect(problems[0]).toMatch(/^phrase 1:/);
  });
});

describe('[F05-REQ-002] bars per language', () => {
  it('a full English sample that meets every bar passes, with device numbers and the shipped model and decoder', () => {
    const { report } = buildGateReport(input('en', englishCorpus()));
    expect(report.failing).toEqual([]);
    expect(report.passed).toBe(true);
    expect(report.metrics.overall.clean).toBe(0);
    expect(report.metrics.names).toBe(1);
    expect(report.metrics.kinds.whisper?.clips).toBe(10); // a separate row, not gating
  });

  it('one invented word on a noise clip fails the language (zero phantom words)', () => {
    const phrases = englishCorpus();
    const { report } = buildGateReport(input('en', phrases, { outcomes: perfect(phrases, (p) => (p.file === 'noise-3.m4a' ? 'Thank you.' : p.expected)) }));
    expect(status(report, 'phantom_words')).toBe('fail');
    expect(report.metrics.phantomUnits).toBe(2);
    expect(report.passed).toBe(false);
  });

  it('word error above 10% fails; a misspelt name fails the names bar', () => {
    const phrases = englishCorpus();
    const garble = (p: PhraseConfig) => (p.kind === 'scripted' || p.kind === 'unscripted' ? p.expected.replace(/Asha/g, 'Usher').replace('rain', 'train').replace('blue', 'glue') : p.expected);
    const { report } = buildGateReport(input('en', phrases, { outcomes: perfect(phrases, garble) }));
    expect(status(report, 'error_rate')).toBe('fail');
    expect(status(report, 'names')).toBe('fail');
  });

  it('speed and memory are device numbers: missing until 30 SE 3 runs are given, failing on one memory kill', () => {
    const phrases = englishCorpus();
    expect(status(buildGateReport(input('en', phrases, { deviceRuns: [] })).report, 'speed_p90')).toBe('missing');
    expect(status(buildGateReport(input('en', phrases, { deviceRuns: deviceRuns('en', 12) })).report, 'speed_p90')).toBe('missing');
    expect(status(buildGateReport(input('en', phrases, { deviceRuns: deviceRuns('en', 30, 40) })).report, 'speed_p90')).toBe('fail');
    expect(status(buildGateReport(input('en', phrases, { deviceRuns: deviceRuns('en', 30, 20, true) })).report, 'jetsam')).toBe('fail');
  });

  it('every language has bars; Hindi 15% and Arabic 20% per dialect group, the rest 10% (F05 7.1, proposed)', () => {
    expect(GATE_BARS.hi.maxError).toBe(0.15);
    expect(GATE_BARS.ar.maxError).toBe(0.2);
    for (const l of ['en', 'es', 'fr', 'pt', 'zh'] as const) expect(GATE_BARS[l].maxError).toBe(0.1);
    expect(GATE_BARS.zh.metric).toBe('cer');
  });
});

describe('[F05-REQ-003] sample', () => {
  it('two speakers is not a gate sample: speakers, clips and noise clips fail, and the report says so', () => {
    const phrases = englishCorpus(2).filter((p) => p.kind !== 'noise' || p.file === 'noise-1.m4a');
    const { report } = buildGateReport(input('en', phrases));
    expect(status(report, 'sample.speakers')).toBe('fail');
    expect(status(report, 'sample.clips')).toBe('fail');
    expect(status(report, 'sample.noise')).toBe('fail');
    expect(status(report, 'error_rate')).toBe('pass'); // indicative accuracy still reported
    expect(report.passed).toBe(false);
    expect(report.sample).toMatchObject({ speakers: 2, gatingClips: 8, noiseClips: 1 });
  });

  it('a speaker without a whispered or white-noise clip is short', () => {
    const phrases = englishCorpus().filter((p) => !(p.speaker === 'parent-4' && p.kind === 'whisper'));
    expect(status(buildGateReport(input('en', phrases)).report, 'sample.per_speaker')).toBe('fail');
  });

  it('Portuguese needs 5 Brazilian and 5 European speakers, with the bar in each variety', () => {
    const phrases: PhraseConfig[] = englishCorpus().map((p, i) => ({
      ...p,
      language: 'pt',
      expected: p.expected ? 'Asha dormiu cedo hoje e sorriu para a Nani' : '',
      group: p.speaker ? (Number(p.speaker.split('-')[1]) <= 5 ? 'pt-BR' : 'pt-PT') : undefined,
      file: `pt-${i}.m4a`,
    }));
    const { report } = buildGateReport(input('pt', phrases));
    expect(status(report, 'sample.groups')).toBe('pass');
    expect(report.checks.filter((c) => c.id.startsWith('error_rate.')).map((c) => c.id)).toEqual(['error_rate.pt-BR', 'error_rate.pt-PT']);
    expect(status(report, 'pt_no_respelling')).toBe('pass');
    const fewer = phrases.filter((p) => p.group !== 'pt-PT');
    expect(status(buildGateReport(input('pt', fewer)).report, 'sample.groups')).toBe('fail');
  });
});

describe('[F05-REQ-002] script checks', () => {
  it('Hindi: a gender swap is one word wrong (marks kept), and the script shares follow each reference word', () => {
    const phrases: PhraseConfig[] = [{ file: 'h1.m4a', expected: 'मेरी प्यारी बेटी आज Asha park गई', language: 'hi', speaker: 'a' }];
    const { report } = buildGateReport(input('hi', phrases, { outcomes: perfect(phrases, () => 'मेरी प्यारी बेटा आज Asha पार्क गई') }));
    expect(report.metrics.overall.clean).toBeCloseTo(2 / 7);
    expect(report.metrics.script.hi_devanagari).toBe(1);
    expect(report.metrics.script.hi_latin_english).toBeCloseTo(1 / 2); // "park" came back in Devanagari
    expect(status(report, 'hi_latin_english')).toBe('fail');
  });

  it('Mandarin: scored by character; a Traditional character in a Simplified letter counts against the script bar', () => {
    const phrases: PhraseConfig[] = [{ file: 'z1.m4a', expected: '阿莎今天很开心我们去公园', language: 'zh', speaker: 'a' }];
    const ok = buildGateReport(input('zh', phrases, { script: 'Hans' }));
    expect(ok.report.metrics.metric).toBe('cer');
    expect(ok.report.metrics.overall.clean).toBe(0);
    expect(ok.report.metrics.script.zh_script).toBe(1);
    // 們 has one Simplified form, so the script edit converts it before scoring: still 100%.
    const converted = buildGateReport(input('zh', phrases, { script: 'Hans', outcomes: perfect(phrases, () => '阿莎今天很開心我們去公園') }));
    expect(converted.report.metrics.script.zh_script).toBe(1);
    expect(converted.report.metrics.overall.clean).toBe(0);
  });

  it('Arabic: the error bar holds per dialect group; harakat are never added or removed by cleaning', () => {
    const phrases: PhraseConfig[] = ['egyptian', 'levantine', 'gulf'].flatMap((group, g) =>
      [1, 2, 3, 4].map((s) => ({ file: `ar-${g}-${s}.m4a`, expected: 'آشا نامت بعد الحمام', language: 'ar', speaker: `${group}-${s}`, group })),
    );
    const { report } = buildGateReport(input('ar', phrases));
    expect(report.checks.filter((c) => c.id.startsWith('error_rate.')).map((c) => c.status)).toEqual(['pass', 'pass', 'pass']);
    expect(status(report, 'sample.groups')).toBe('pass');
    expect(report.metrics.script.ar_harakat_unchanged).toBe(0);
  });

  it('Spanish: a question without its opening mark counts against the 90% bar', () => {
    const phrases: PhraseConfig[] = [{ file: 'e1.m4a', expected: 'Quieres agua Asha', language: 'es', speaker: 'a' }];
    const asked = buildGateReport(input('es', phrases, { outcomes: perfect(phrases, () => '¿Quieres agua, Asha?') }));
    expect(asked.report.metrics.script.es_opening_marks).toBe(1);
    const bare = buildGateReport(input('es', phrases, { outcomes: perfect(phrases, () => 'Quieres agua, Asha?') }));
    expect(bare.report.metrics.script.es_opening_marks).toBe(0);
  });
});

describe('[F05-REQ-004] no non-English gate passes before the verifier is ready for its script', () => {
  it('on today\'s engine every adversarial meaning change is refused, in safe mode and vetted, for all seven', () => {
    for (const l of ['en', 'hi', 'es', 'zh', 'fr', 'ar', 'pt'] as const) {
      const r = verifierReadiness(l, loadPack(l, packText(l)).pack);
      expect(r.accepted, l).toEqual([]);
      expect(r.cases, l).toBeGreaterThan(0);
    }
    expect(ADVERSARIAL.some((c) => c.id === 'hi-E2-gender')).toBe(true);
    expect(ADVERSARIAL.some((c) => c.id === 'ar-E3-gender')).toBe(true);
  });

  it('an edit the verifier accepts is caught and fails the report as verifier_not_ready', () => {
    const harmless = [{ id: 'probe-accepted', language: 'en' as const, raw: 'you did it.', type: 'punctuation' as const, from: 'you', to: 'You', harm: 'none (a capital)' }];
    expect(verifierReadiness('en', loadPack('en', packText('en')).pack, harmless).accepted).toEqual(['probe-accepted']);
  });
});

describe('[F05-REQ-005] native-speaker sign-off', () => {
  it('a non-English pack needs the sign-off file and native-reviewed tables; English is the bundled reviewed pack', () => {
    const phrases: PhraseConfig[] = [{ file: 'f1.m4a', expected: 'Asha a ri aujourd\u2019hui', language: 'fr', speaker: 'a' }];
    expect(status(buildGateReport(input('fr', phrases)).report, 'pack_signoff')).toBe('missing');
    const filed = buildGateReport(input('fr', phrases, { signoffText: 'Reviewer role: native French speaker, parent\nDate: 2026-10-20\n' })).report;
    expect(status(filed, 'pack_signoff')).toBe('fail'); // the file exists, but the pack tables are still draft
    expect(filed.checks.find((c) => c.id === 'pack_signoff')?.note).toMatch(/fillers table is draft/);
    expect(status(buildGateReport(input('en', englishCorpus())).report, 'pack_signoff')).toBe('pass');
  });
});

describe('[F05-REQ-006] fingerprint and stale gates', () => {
  it('a candidate model or a different model file never counts as what ships', () => {
    const phrases = englishCorpus();
    const candidate = buildGateReport(input('en', phrases, { modelOverride: 'speech-model.whisper-small-q5_1' })).report;
    expect(status(candidate, 'model_shipped')).toBe('fail');
    expect(status(buildGateReport(input('en', phrases, { modelFileSha256: '0'.repeat(64) })).report, 'model_shipped')).toBe('fail');
    expect(status(buildGateReport(input('en', phrases, { decoderVersion: 'v1.9.5' })).report, 'decoder')).toBe('fail');
    expect(status(buildGateReport(input('en', phrases, { decoderVersion: null })).report, 'decoder')).toBe('missing');
  });

  it('the recorded gate is current until the pack, model, engine or pipeline changes', () => {
    const { report } = buildGateReport(input('en', englishCorpus()));
    const evidence = mergeEvidence(null, 'en', renderTierSection(report), 'full');
    expect(recordedFingerprints(evidence).full?.engineVersion).toBe(report.fingerprint.engineVersion);
    expect(staleness('en', evidence, packText('en'))).toEqual([{ language: 'en', tier: 'full', status: 'current', changed: [] }]);
    const editedPack = packText('en').replace('"version": "1.0.0"', '"version": "1.0.1"');
    expect(editedPack).not.toBe(packText('en'));
    expect(staleness('en', evidence, editedPack)[0]).toMatchObject({ status: 'stale', changed: ['pack'] });
    const oldEngine = evidence.replace(/"engineVersion":\d+/, '"engineVersion":4');
    expect(staleness('en', oldEngine, packText('en'))[0].changed).toEqual(['engineVersion']);
  });

  it('the fingerprint follows behaviour, not the file: same inputs, same id; each language has its own prompt', () => {
    const en = fingerprintFor('en', 'full', loadPack('en', packText('en')));
    expect(fingerprintFor('en', 'full', loadPack('en', packText('en')))).toEqual(en);
    const es = fingerprintFor('es', 'full', loadPack('es', packText('es')));
    expect(es.prompt).not.toBe(en.prompt);
    expect(es.planner).toBe(en.planner);
    expect(fingerprintFor('hi', 'compact', loadPack('hi', packText('hi'))).model.id).toBe(asrModelFor('hi', 'compact').id);
  });

  it('writing a tier section keeps the founder decision lines and the other tier', () => {
    const { report } = buildGateReport(input('en', englishCorpus()));
    const signed = newEvidenceFile('en').replace('- Signed by:', '- Signed by: founder');
    const withFull = mergeEvidence(signed, 'en', renderTierSection(report), 'full');
    const withBoth = mergeEvidence(withFull, 'en', renderTierSection({ ...report, tier: 'compact' }), 'compact');
    const again = mergeEvidence(withBoth, 'en', renderTierSection({ ...report, generatedAt: '2026-11-01T00:00:00.000Z' }), 'full');
    expect(again).toContain('- Signed by: founder');
    expect(again.match(/<!-- gate:full:start -->/g)).toHaveLength(1);
    expect(again).toContain('<!-- gate:compact:start -->');
    expect(again).toContain('2026-11-01T00:00:00.000Z');
  });
});

describe('privacy: reports and summaries hold numbers, never words', () => {
  it('no reference text, transcript, dictionary term, file name or speaker label reaches the report or the summary', () => {
    const phrases = englishCorpus();
    const { report, details } = buildGateReport(input('en', phrases, { outcomes: perfect(phrases, (p) => (p.expected ? `${p.expected} Ashaville` : '')) }));
    const out = `${JSON.stringify(report)}\n${renderTierSection(report)}`;
    for (const needle of ['Asha', 'Nani', 'rain', 'spoon', 'Ashaville', 'p1-0.m4a', 'noise-1.m4a', 'parent-1']) expect(out, needle).not.toContain(needle);
    expect(details[0].text.raw).toContain('Ashaville'); // the local clip list keeps them, for the founder only
  });

  it('the summary uses plain punctuation only (no dashes, curly quotes or ellipsis characters)', () => {
    const { report } = buildGateReport(input('en', englishCorpus(2)));
    const text = `${newEvidenceFile('en')}${renderTierSection(report)}`;
    expect(text).not.toMatch(/[\u2013\u2014\u2018\u2019\u201C\u201D\u2026]/);
  });
});

describe('statistics', () => {
  it('per-speaker bootstrap: repeatable, around the point estimate, null under two speakers', () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ speaker: `S${i}`, errors: i % 3, ref: 20 }));
    const a = speakerBootstrap(rows);
    expect(a).toEqual(speakerBootstrap(rows));
    const point = rows.reduce((n, r) => n + r.errors, 0) / rows.reduce((n, r) => n + r.ref, 0);
    expect(a![0]).toBeLessThanOrEqual(point);
    expect(a![1]).toBeGreaterThanOrEqual(point);
    expect(speakerBootstrap([{ speaker: 'S1', errors: 1, ref: 10 }])).toBeNull();
  });

  it('flags for the founder when the interval crosses the bar although the point estimate passes', () => {
    const phrases = englishCorpus();
    // Speakers 1 and 2 have about 40% word error, the rest none: corpus error under 10%, interval above it.
    const tweak = (p: PhraseConfig) => (p.speaker && ['parent-1', 'parent-2'].includes(p.speaker) && p.kind !== 'whisper' && p.kind !== 'white_noise' ? p.expected.split(' ').map((w, i) => (i % 2 ? 'mm' : w)).join(' ') : p.expected);
    const { report } = buildGateReport(input('en', phrases, { outcomes: perfect(phrases, tweak) }));
    expect(report.metrics.overall.clean!).toBeLessThanOrEqual(0.1);
    expect(report.metrics.overall.ci95![1]).toBeGreaterThan(0.1);
    expect(report.founderReview).toBe(true);
  });
});

describe('the Mac run mirrors the phone (gate-audio.ts)', () => {
  it('WAV in and out at 16 kHz mono PCM16', () => {
    const pcm = Int16Array.from([0, 1000, -1000, 32767, -32768]);
    expect(Array.from(parseWav(wavBytes(pcm)))).toEqual(Array.from(pcm));
    const stereo = wavBytes(pcm);
    new DataView(stereo.buffer).setUint16(22, 2, true);
    expect(() => parseWav(stereo)).toThrow('wav_not_16k_mono_pcm16');
  });

  it('a chunk is built like ScribeAudio builds it: inserted silence, then the piece, same sample count as the planner', () => {
    const pcm = new Int16Array(16_000 * 70).fill(7);
    const plan = planChunks(
      [
        { startMs: 1_000, endMs: 3_000 },
        { startMs: 10_000, endMs: 12_000 },
      ],
      70_000,
    );
    const buf = new Int16Array(chunkPcm(pcm, plan[0].pieces));
    expect(buf.length).toBe(chunkSampleCount(plan[0]));
    expect(plan[0].pieces[1].silenceBeforeMs).toBeGreaterThan(0);
    const silenceStart = msToSamplesLocal(2_000);
    expect(buf[silenceStart + 10]).toBe(0);
    expect(buf[0]).toBe(7);
    expect(new Int16Array(windowPcm(pcm, 0, 300_000)).length).toBe(pcm.length); // a window past the end stops at the end
  });

  it('the app voice detector settings all reach whisper.cpp; an unmapped one stops the gate', () => {
    const a = vadArgs('w.wav', 'vad.bin');
    for (const v of Object.values(VAD_OPTIONS)) expect(a).toContain(String(v));
    expect(a.slice(a.indexOf('-vsd'), a.indexOf('-vsd') + 2)).toEqual(['-vsd', String(VAD_OPTIONS.minSilenceDurationMs)]);
    expect(() => vadArgs('w.wav', 'vad.bin', { ...VAD_OPTIONS, maxSpeechDurationS: 30 })).toThrow('vad_option_not_mapped');
    expect(parseVadSegments('Detected 2 speech segments:\nSpeech segment 0: start = 29.00, end = 221.50\nSpeech segment 1: start = 300.00, end = 310.00\n')).toEqual([
      { t0: 29, t1: 221.5 },
      { t0: 300, t1: 310 },
    ]);
  });

  it("[F05-REQ-008, F05-REQ-009] decodes greedy, language forced, never 'auto', never translate or diarize", () => {
    const a = whisperArgs({ model: 'm.bin', wav: 'c.wav', outBase: 'c', language: 'hi', prompt: 'Asha.', temperature: 0 });
    expect(a.slice(a.indexOf('-l'), a.indexOf('-l') + 2)).toEqual(['-l', 'hi']);
    expect(a.slice(a.indexOf('-bs'), a.indexOf('-bs') + 2)).toEqual(['-bs', '1']);
    expect(a).toContain('-nfa');
    expect(a).not.toContain('-tr');
    expect(a).not.toContain('-tdrz');
    expect(() => whisperArgs({ model: 'm', wav: 'c', outBase: 'c', language: 'auto', prompt: '', temperature: 0 })).toThrow('language_must_be_set');
  });

  it('reads whisper-cli JSON as whisper.rn shapes it: joined text, timed tokens in centiseconds, no special tokens', () => {
    const json = JSON.stringify({
      transcription: [
        { text: ' Asha slept.', tokens: [{ text: '[_BEG_]', offsets: { from: 0, to: 0 } }, { text: ' Asha', offsets: { from: 0, to: 420 } }, { text: ' slept', offsets: { from: 420, to: 900 } }, { text: '.', offsets: { from: 900, to: 950 } }, { text: '[_TT_50]', offsets: { from: 1000, to: 1000 } }] },
      ],
    });
    expect(parseWhisperJson(json)).toEqual({
      result: ' Asha slept.',
      segments: [
        { text: ' Asha', t0: 0, t1: 42 },
        { text: ' slept', t0: 42, t1: 90 },
        { text: '.', t0: 90, t1: 95 },
      ],
    });
  });
});

describe('privacy: a failing tool never prints the prompt or what it heard', () => {
  // A stand-in for whisper-cli that fails: the command line carries the prompt with the family's names, and the
  // tool writes a heard word to stderr before it exits.
  const failing = ['-e', 'console.error("heard: Ashu"); process.exit(3)', '--', '--prompt', 'Asha, Ashu, Nani.'];

  it('runTool reports the tool and its exit status only', () => {
    let err: unknown = null;
    try {
      runTool('whisper_cli', process.execPath, failing);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(ToolFailed);
    expect((err as Error).message).toBe('whisper_cli_failed: exit 3');
    expect(JSON.stringify(err)).not.toMatch(/Asha|Ashu|Nani|prompt/);
    expect(safeErrorMessage(err)).toBe('whisper_cli_failed: exit 3');
  });

  it('a tool that cannot start is named by its code, not by its arguments', () => {
    expect(() => runTool('vad_tool', '/nonexistent/whisper-vad-speech-segments', ['--prompt', 'Asha'])).toThrow('vad_tool_failed: exit ENOENT');
  });

  it('unreadable decoder output and parse errors never quote the words', () => {
    expect(() => parseWhisperJson('{"transcription": [ {"text": " Asha slept')).toThrow('whisper_json_unreadable');
    let parseError: unknown = null;
    try {
      JSON.parse('Asha walked to Nani'); // Node quotes the text: "Asha walked to Nani" is not valid JSON
    } catch (e) {
      parseError = e;
    }
    expect(safeErrorMessage(parseError)).not.toMatch(/Asha|Nani/);
    expect(safeErrorMessage(new Error('Asha'))).not.toMatch(/Asha/);
    expect(safeErrorMessage(new Error('asha'))).not.toMatch(/asha/); // a bare word is not a code
    expect(safeErrorMessage(new Error('duration_invalid'))).toBe('duration_invalid');
    expect(safeErrorMessage(parseError, true)).toMatch(/Asha/); // only when the person asks with --debug
  });

  it('a run that succeeds returns the tool output', () => {
    expect(runTool('node', process.execPath, ['-e', 'process.stdout.write("Speech segment 0: start = 1.00, end = 2.00")'], { stdout: true })).toContain('Speech segment 0');
  });
});

function msToSamplesLocal(ms: number): number {
  return Math.round((ms * 16_000) / 1000);
}
