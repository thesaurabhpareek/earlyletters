/**
 * Per-language gate report (F05 7.1; F05-REQ-002 to F05-REQ-006; WP-F05-02).
 * Mac only, like the rest of this kit: see README.md section 7.
 *
 * From the repo root:
 *   npm run gate -w @scribe/experiments -- --language en                 full tier, shipped model
 *   npm run gate -w @scribe/experiments -- --language hi --tier compact  the small-model tier
 *   npm run gate -w @scribe/experiments -- --language en --device experiments/device.local.json
 *   npm run gate -w @scribe/experiments -- --language en --replay        re-clean stored raw transcripts (engine or pack change only)
 *   npm run gate -w @scribe/experiments -- --language en --evidence      also write docs/qa/evidence/F05-gate-en.md (numbers only)
 *   npm run gate -w @scribe/experiments -- --check                       F05-REQ-006: are recorded gates still current? (any OS, no audio)
 *   add --debug to print a failure's full message (it can hold your words; never paste it anywhere)
 *
 * Reads experiments/config.local.json (phrases with `language`, `speaker`,
 * `kind`, `group`), your recordings in experiments/recordings/, and the
 * models setup.sh downloaded. Writes:
 *   experiments/reports/gate-<lang>-<tier>.json      the report (numbers only; git-ignored)
 *   experiments/results/gate/<lang>-<tier>/clips.md  every clip with its words, for you (git-ignored)
 *   experiments/results/gate/<lang>-<tier>/raw.json  raw transcripts for --replay (git-ignored)
 * Recordings and transcripts never leave this Mac and are never committed.
 * Exit code: 0 every check passes, 2 the report says it does not, 1 the run itself failed.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { toNFC, type ScriptCode } from '@scribe/core';
import { SPEECH_MODELS, VAD_MODEL_ID, isSpeechLanguage, type SpeechLanguage, type SpeechModelId, type Tier } from '../apps/mobile/src/lib/models/catalog';
import { safeErrorMessage, toWav16, transcribeWav, type MacTools } from './gate-audio';
import {
  buildGateReport,
  clipsFor,
  decodePart,
  evidencePath,
  fingerprintFor,
  loadPack,
  mergeEvidence,
  renderTierSection,
  signoffPath,
  staleness,
  type ClipOutcome,
  type DeviceRun,
  type GateConfig,
  type GateReport,
} from './gate-lib';

const ROOT = resolve(__dirname);
const REPO = resolve(ROOT, '..');
const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const has = (name: string) => args.includes(`--${name}`);
/** A path the person typed: relative to where they ran npm (npm runs workspace scripts inside experiments/). */
const pathFlag = (name: string) => {
  const v = flag(name);
  return v ? resolve(process.env.INIT_CWD ?? process.cwd(), v) : undefined;
};

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const packText = (lang: SpeechLanguage) => readFileSync(join(REPO, 'packs', 'text-rules', `${lang}.json`), 'utf8');

function check(): void {
  const dir = join(REPO, 'docs', 'qa', 'evidence');
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => /^F05-gate-[a-z]{2}\.md$/.test(f)) : [];
  if (!files.length) {
    console.log('No gate recorded yet (docs/qa/evidence/F05-gate-<lang>.md): nothing can be stale.');
    return;
  }
  let stale = 0;
  for (const f of files.sort()) {
    const lang = f.slice('F05-gate-'.length, -'.md'.length);
    if (!isSpeechLanguage(lang)) continue;
    const results = staleness(lang, readFileSync(join(dir, f), 'utf8'), packText(lang));
    if (!results.length) console.log(`${f}: no tier recorded`);
    for (const r of results) {
      if (r.status === 'stale') stale += 1;
      console.log(`${f} ${r.tier}: ${r.status}${r.changed.length ? ` (changed: ${r.changed.join(', ')})` : ''}`);
    }
  }
  if (stale) {
    console.error(`\n${stale} recorded gate(s) ran on a model, pack or pipeline that has changed. Run the gate again before publishing (F05-REQ-006).`);
    process.exit(1);
  }
}

async function sha256File(path: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk as Buffer);
  return hash.digest('hex');
}

function decoderVersion(whisperDir: string): string | null {
  try {
    return execFileSync('git', ['-C', whisperDir, 'describe', '--tags', '--exact-match'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null;
  } catch {
    return null;
  }
}

function readDeviceRuns(path: string | undefined): DeviceRun[] {
  if (!path) return [];
  const json = readJson<DeviceRun[] | { runs: DeviceRun[] }>(path, 'The device runs file');
  return Array.isArray(json) ? json : (json.runs ?? []);
}

/** Reads a JSON file of the person's own; a parse error names the file, never the text around the mistake. */
function readJson<T>(path: string, what: string): T {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    fail(`${what} (${path}) is not valid JSON. Check its commas, brackets and quotes.`);
  }
}

const pct = (n: number | null) => (n === null ? 'n/a' : `${(n * 100).toFixed(1)}%`);

async function main(): Promise<void> {
  if (has('check')) return check();

  const language = flag('language');
  if (!isSpeechLanguage(language)) {
    fail('Usage, from the repo root: npm run gate -w @scribe/experiments -- --language <en|hi|es|zh|fr|ar|pt> [--tier full|compact]. See experiments/README.md section 7.');
  }
  const tier = (flag('tier') ?? 'full') as Tier;
  if (tier !== 'full' && tier !== 'compact') fail('--tier is full or compact');
  const configPath = pathFlag('config') ?? join(ROOT, 'config.local.json');
  if (!existsSync(configPath)) fail(`No config at ${configPath}. Run ./experiments/setup.sh, then edit config.local.json (README section 7).`);
  const config = readJson<GateConfig>(configPath, 'The config');
  const { clips, problems } = clipsFor(config, language);
  for (const p of problems) console.warn(`config: ${p}`);
  if (!clips.length) fail(`No phrases with language "${language}" in ${configPath}.`);

  const dictionary = config.dictionary ?? [];
  const rawScript = config.scripts?.[language];
  const script: ScriptCode | undefined = language === 'zh' ? (rawScript === 'Hant' ? 'Hant' : 'Hans') : undefined;
  const modelOverride = flag('model') as SpeechModelId | undefined;
  const text = packText(language);
  const pack = loadPack(language, text);
  const fingerprint = fingerprintFor(language, tier, pack, modelOverride);

  const resultsDir = join(ROOT, 'results', 'gate', `${language}-${tier}`);
  const reportsDir = join(ROOT, 'reports');
  mkdirSync(resultsDir, { recursive: true });
  mkdirSync(reportsDir, { recursive: true });
  const cachePath = join(resultsDir, 'raw.json');

  const outcomes = new Map<string, ClipOutcome>();
  let modelFileSha256: string | null = null;
  let vadFileSha256: string | null = null;
  let decoder: string | null = null;
  const replayed = has('replay');

  if (replayed) {
    if (!existsSync(cachePath)) fail(`Nothing to replay: ${cachePath} is missing. Run without --replay first.`);
    const cache = readJson<{ decode: unknown; modelFileSha256: string | null; vadFileSha256?: string | null; decoder: string | null; clips: ClipOutcome[] }>(cachePath, 'The stored transcripts');
    if (JSON.stringify(cache.decode) !== JSON.stringify(decodePart(fingerprint))) {
      fail('The model, decoder, prompt, voice detector, planner or clean-up changed since these transcripts were made. Run without --replay.');
    }
    for (const c of cache.clips) outcomes.set(c.file, c);
    modelFileSha256 = cache.modelFileSha256;
    vadFileSha256 = cache.vadFileSha256 ?? null;
    decoder = cache.decoder;
  } else {
    const whisperDir = pathFlag('whisper-dir') ?? join(ROOT, 'whisper.cpp');
    const tools: MacTools = {
      whisperCli: join(whisperDir, 'build', 'bin', 'whisper-cli'),
      vadTool: join(whisperDir, 'build', 'bin', 'whisper-vad-speech-segments'),
      ffmpeg: 'ffmpeg',
    };
    const modelsDir = pathFlag('models-dir') ?? join(ROOT, 'models');
    const modelPath = join(modelsDir, SPEECH_MODELS[fingerprint.model.id].fileName);
    const vadPath = join(modelsDir, SPEECH_MODELS[VAD_MODEL_ID].fileName);
    for (const need of [tools.whisperCli, tools.vadTool, modelPath, vadPath]) {
      if (!existsSync(need)) fail(`Missing ${need}. Run ./experiments/setup.sh (it pins whisper.cpp ${fingerprint.decoder.split(' ')[1]} and downloads the models).`);
    }
    decoder = decoderVersion(whisperDir);
    process.stdout.write('Checking the model file against the app catalog... ');
    modelFileSha256 = await sha256File(modelPath);
    vadFileSha256 = await sha256File(vadPath);
    const same = modelFileSha256 === fingerprint.model.sha256 && vadFileSha256 === fingerprint.vad.sha256;
    console.log(same ? 'same files the app ships.' : 'DIFFERENT from the catalog (the report will fail model_shipped).');

    const recordingsDir = pathFlag('recordings') ?? join(ROOT, 'recordings');
    const work = join(resultsDir, 'work');
    for (const clip of clips) {
      const src = join(recordingsDir, clip.file);
      if (!existsSync(src)) {
        console.warn(`missing recording: ${clip.file}`);
        continue;
      }
      const wav = join(work, `${basename(clip.file).replace(/\.[^.]+$/, '')}.wav`);
      mkdirSync(work, { recursive: true });
      toWav16(tools, src, wav);
      try {
        const run = await transcribeWav({ tools, wav, workDir: join(work, 'slices'), model: modelPath, vadModel: vadPath, language, dictionary });
        // NFC at the transcription boundary, as the app does before raw becomes permanent (ADR 0014).
        outcomes.set(clip.file, { file: clip.file, raw: toNFC(run.raw), seconds: run.seconds, loops: run.loops });
        console.log(`${clip.file.padEnd(28)} ${clip.kind.padEnd(14)} ${run.seconds.toFixed(1)} s`);
      } finally {
        rmSync(wav, { force: true });
      }
    }
    rmSync(work, { recursive: true, force: true });
    writeFileSync(cachePath, JSON.stringify({ decode: decodePart(fingerprint), modelFileSha256, vadFileSha256, decoder, clips: [...outcomes.values()] }, null, 2));
  }

  const signoffFile = join(REPO, signoffPath(language, pack.version));
  const { report, details } = buildGateReport({
    language,
    tier,
    clips,
    outcomes,
    packText: text,
    dictionary,
    script,
    signoffText: existsSync(signoffFile) ? readFileSync(signoffFile, 'utf8') : null,
    deviceRuns: readDeviceRuns(pathFlag('device')),
    decoderVersion: decoder,
    modelFileSha256,
    vadFileSha256,
    modelOverride,
    replayed,
    generatedAt: new Date().toISOString(),
  });

  const reportPath = join(reportsDir, `gate-${language}-${tier}.json`);
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(join(resultsDir, 'clips.md'), clipsMarkdown(report, details));
  if (has('evidence')) {
    const path = join(REPO, evidencePath(language));
    mkdirSync(join(REPO, 'docs', 'qa', 'evidence'), { recursive: true });
    writeFileSync(path, mergeEvidence(existsSync(path) ? readFileSync(path, 'utf8') : null, language, renderTierSection(report), tier));
    console.log(`\nWrote ${evidencePath(language)} (numbers only; add your decision lines there).`);
  }

  console.log(`\n${language} ${tier}: ${report.passed ? 'every check passes' : `${report.failing.length} of ${report.checks.length} checks open`}`);
  for (const c of report.checks) console.log(`  ${c.status.padEnd(7)} ${c.id}${c.status === 'pass' ? '' : `  (bar ${c.bar})`}`);
  console.log(`\nReport: ${reportPath}\nYour clips, with their words: ${join(resultsDir, 'clips.md')}`);
  process.exit(report.passed ? 0 : 2);
}

/** For your eyes only (results/ is git-ignored): every clip with what was said, heard and kept. */
function clipsMarkdown(report: GateReport, details: ReturnType<typeof buildGateReport>['details']): string {
  const lines = [`# Gate clips: ${report.language}, ${report.tier} tier`, '', 'Private: these are your words. This file stays in experiments/results/ and is never committed.', ''];
  for (const d of details) {
    const rate = d.refUnits ? d.errorsClean / d.refUnits : null;
    lines.push(
      `## ${d.clip.file} (${d.clip.kind}, ${d.clip.speaker}${d.clip.group ? `, ${d.clip.group}` : ''})`,
      '',
      `- You said: ${d.text.expected || '(nothing)'}`,
      `- Heard (raw): ${d.text.raw || '(nothing)'}`,
      `- After cleaning: ${d.text.clean || '(nothing)'}`,
      `- ${report.metrics.metric.toUpperCase()} after cleaning ${pct(rate)}; names ${d.namesRight}/${d.namesSaid}${d.phantom ? `; invented on silence: ${d.phantom}` : ''}${d.loops ? `; repetition loops: ${d.loops}` : ''}`,
      '',
    );
  }
  return lines.join('\n');
}

main().catch((e: unknown) => fail(`gate failed: ${safeErrorMessage(e, has('debug'))}`));
