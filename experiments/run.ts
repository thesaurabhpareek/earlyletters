/**
 * Experiment runner (PRD v2 section 24, experiments 1 to 3).
 *
 * For every recording and every model it:
 *  1. converts the audio to 16 kHz mono WAV (ffmpeg),
 *  2. transcribes with whisper.cpp (VAD on, family dictionary as a hint),
 *  3. cleans with the real Early Letters engine (@scribe/core),
 *  4. scores against what you actually said.
 *
 * Output: results/report.md (read this), results/report.csv, and
 * results/review.md (the blind "does this sound like me" sheet).
 *
 * Usage: npm run experiment            (all models in config.local.json)
 *        npm run experiment -- --model base
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { faithfulClean, type DictionaryTerm } from '@scribe/core';
import { lowConfidenceWords, scorePhrase, transcriptText, type WhisperJson } from './score';

interface Phrase {
  file: string;
  expected: string;
}
interface Config {
  childName: string;
  language: string;
  models: string[];
  dictionary: DictionaryTerm[];
  phrases: Phrase[];
}

const ROOT = resolve(__dirname);
const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const configPath = flag('config') ?? join(ROOT, 'config.local.json');
if (!existsSync(configPath)) {
  console.error(`No config at ${configPath}. Run ./setup.sh first, then edit config.local.json.`);
  process.exit(1);
}
const config: Config = JSON.parse(readFileSync(configPath, 'utf8'));
const recordingsDir = flag('recordings') ?? join(ROOT, 'recordings');
const modelsDir = flag('models-dir') ?? join(ROOT, 'models');
const resultsDir = flag('results') ?? join(ROOT, 'results');
const whisperBin = flag('whisper') ?? join(ROOT, 'whisper.cpp', 'build', 'bin', 'whisper-cli');
const models = flag('model') ? [flag('model')!] : config.models;
const vadModel = join(modelsDir, 'ggml-silero-v6.2.0.bin');

for (const need of [whisperBin, vadModel]) {
  if (!existsSync(need)) {
    console.error(`Missing ${need}. Run ./setup.sh first.`);
    process.exit(1);
  }
}

// Whisper's prompt biases spelling toward these words. Keep it short.
const hint = [...new Set(config.dictionary.map((d) => d.term))].join(', ');

const wavDir = join(resultsDir, 'wav');
mkdirSync(wavDir, { recursive: true });

function toWav(file: string): string {
  const src = join(recordingsDir, file);
  if (!existsSync(src)) throw new Error(`Recording not found: ${src}`);
  const out = join(wavDir, `${basename(file).replace(/\.[^.]+$/, '')}.wav`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', out]);
  return out;
}

function transcribe(model: string, wav: string): { json: WhisperJson; seconds: number } {
  const modelPath = join(modelsDir, `ggml-${model}.bin`);
  if (!existsSync(modelPath)) throw new Error(`Model not found: ${modelPath}. Run ./setup.sh.`);
  const outDir = join(resultsDir, model);
  mkdirSync(outDir, { recursive: true });
  const outBase = join(outDir, basename(wav, '.wav'));
  const started = Date.now();
  execFileSync(
    whisperBin,
    ['-m', modelPath, '-f', wav, '-l', config.language, '--prompt', hint, '--vad', '-vm', vadModel, '-ojf', '-of', outBase, '-np'],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );
  return { json: JSON.parse(readFileSync(`${outBase}.json`, 'utf8')), seconds: (Date.now() - started) / 1000 };
}

interface Row {
  model: string;
  file: string;
  expected: string;
  raw: string;
  clean: string;
  werRaw: number;
  werClean: number;
  dictionaryHits: number;
  dictionaryTotal: number;
  phantomWords: number;
  lowConfidence: string[];
  edits: number;
  seconds: number;
}

const rows: Row[] = [];
const wavs = new Map<string, string>();
for (const p of config.phrases) wavs.set(p.file, toWav(p.file));

for (const model of models) {
  for (const p of config.phrases) {
    process.stdout.write(`${model.padEnd(22)} ${p.file.padEnd(28)} `);
    const { json, seconds } = transcribe(model, wavs.get(p.file)!);
    const raw = transcriptText(json);
    const cleaned = faithfulClean(raw, { level: 'clean', dictionary: config.dictionary });
    const s = scorePhrase(p.expected, raw, cleaned.text, config.dictionary);
    rows.push({
      model,
      file: p.file,
      expected: p.expected,
      raw,
      clean: cleaned.text,
      werRaw: s.werRaw,
      werClean: s.werClean,
      dictionaryHits: s.dictionaryHits,
      dictionaryTotal: s.dictionaryTotal,
      phantomWords: s.phantomWords,
      lowConfidence: lowConfidenceWords(json),
      edits: cleaned.applied.length,
      seconds,
    });
    console.log(`WER ${(s.werClean * 100).toFixed(0)}%  ${seconds.toFixed(1)}s`);
  }
}

// ── Reports ────────────────────────────────────────────────────────────
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const speech = (r: Row) => r.expected.trim() !== '';

const summary = models.map((m) => {
  const mine = rows.filter((r) => r.model === m);
  const spoken = mine.filter(speech);
  const silent = mine.filter((r) => !speech(r));
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const hits = spoken.reduce((a, r) => a + r.dictionaryHits, 0);
  const total = spoken.reduce((a, r) => a + r.dictionaryTotal, 0);
  return {
    model: m,
    werRaw: avg(spoken.map((r) => r.werRaw)),
    werClean: avg(spoken.map((r) => r.werClean)),
    names: total ? hits / total : 1,
    phantom: silent.reduce((a, r) => a + r.phantomWords, 0),
    seconds: avg(mine.map((r) => r.seconds)),
  };
});

const passName = (s: (typeof summary)[number]) => s.names >= 0.95;
const passPhantom = (s: (typeof summary)[number]) => s.phantom === 0;

const md: string[] = [
  '# Speech experiment report',
  '',
  `Generated ${new Date().toISOString()} from ${config.phrases.length} recordings.`,
  '',
  '## Summary by model',
  '',
  '| Model | Word error (raw) | Word error (after cleaning) | Names and family words correct | Words invented from silence | Avg seconds |',
  '|---|---|---|---|---|---|',
  ...summary.map(
    (s) =>
      `| ${s.model} | ${pct(s.werRaw)} | ${pct(s.werClean)} | ${pct(s.names)} ${passName(s) ? 'PASS' : 'FAIL'} | ${s.phantom} ${passPhantom(s) ? 'PASS' : 'FAIL'} | ${s.seconds.toFixed(1)} |`,
  ),
  '',
  'Pass bars (PRD v2, experiment 1): names and family words at least 95% correct after cleaning; zero words invented from the silent white-noise clip.',
  'Word error counts fillers you actually said as words, so expect raw error to drop after cleaning.',
  '',
  '## Every recording',
  '',
];
for (const r of rows) {
  md.push(
    `### ${r.model} / ${r.file}`,
    '',
    `- **You said:** ${r.expected || '(silence)'}`,
    `- **Heard (raw):** ${r.raw || '(nothing)'}`,
    `- **After cleaning:** ${r.clean || '(nothing)'}`,
    `- Word error: ${pct(r.werRaw)} raw, ${pct(r.werClean)} cleaned. Names: ${r.dictionaryHits}/${r.dictionaryTotal}. Machine edits: ${r.edits}.`,
    r.lowConfidence.length ? `- Low-confidence words: ${r.lowConfidence.join(', ')}` : '- Low-confidence words: none',
    '',
  );
}
writeFileSync(join(resultsDir, 'report.md'), md.join('\n'));

const csvEscape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
const csv = [
  ['model', 'file', 'expected', 'raw', 'clean', 'wer_raw', 'wer_clean', 'dictionary_hits', 'dictionary_total', 'phantom_words', 'edits', 'seconds'].join(','),
  ...rows.map((r) =>
    [r.model, r.file, r.expected, r.raw, r.clean, r.werRaw.toFixed(4), r.werClean.toFixed(4), r.dictionaryHits, r.dictionaryTotal, r.phantomWords, r.edits, r.seconds.toFixed(2)]
      .map(csvEscape)
      .join(','),
  ),
];
writeFileSync(join(resultsDir, 'report.csv'), csv.join('\n'));

// Experiment 2: blind review sheet. Versions are shuffled per phrase so you
// judge the words, not the label. The key is at the bottom.
const best = [...summary].sort((a, b) => a.werClean - b.werClean)[0]?.model;
const review: string[] = [
  '# Does this sound like me?',
  '',
  `Model: ${best}. For each recording, read both versions. Mark any sentence that is not how you talk, then pick the one you would put in the book.`,
  '',
];
const key: string[] = ['', '---', '', '## Key (read after you choose)', ''];
config.phrases.filter((p) => p.expected.trim()).forEach((p, i) => {
  const r = rows.find((x) => x.model === best && x.file === p.file)!;
  const flip = (i * 7919) % 2 === 1;
  const [a, b] = flip ? [r.clean, r.raw] : [r.raw, r.clean];
  review.push(`## ${i + 1}. ${p.file}`, '', `**A:** ${a}`, '', `**B:** ${b}`, '', '- [ ] A  - [ ] B  - [ ] Both fine  - Not how I talk: ______', '');
  key.push(`${i + 1}. A = ${flip ? 'cleaned' : 'raw'}, B = ${flip ? 'raw' : 'cleaned'}`);
});
writeFileSync(join(resultsDir, 'review.md'), [...review, ...key].join('\n'));

console.log(`\nDone. Open ${join(resultsDir, 'report.md')} and ${join(resultsDir, 'review.md')}`);
