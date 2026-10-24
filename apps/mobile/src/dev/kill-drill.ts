/**
 * The kill drill (RA-19-04; DEVICE_TEST_PLAN DL-01 and DL-02; DATA-REQ-048, F04-REQ-024, F08-REQ-019).
 * E2E builds only: `src/dev/e2e-seams.ts` loads this file only in a build with `EXPO_PUBLIC_E2E=1` whose
 * `EXPO_PUBLIC_APP_ENV` is neither `preview` nor `production` (so never a TestFlight or App Store build),
 * and it does nothing unless the launch arguments name a drill.
 *
 * Even then it refuses to arm, before it touches the 18+ gate, adds a child or opens the microphone,
 * unless it runs on a simulator (`Device.isDevice === false`), in the development bundle, on an install
 * it made itself (`decideDrillGuard` in kill-drill.logic.ts). A refusal writes only an `error` marker.
 *
 * The host harness (`apps/mobile/e2e/kill/run-kill-harness.mjs`) launches the app on an iOS simulator
 * with launch arguments, waits for this file's markers (protocol in `kill-drill.logic.ts`) and kills the
 * process with SIGKILL, either at a random moment or exactly at a named crash point. This file calls the
 * app's own capture and save code (`lib/capture/recorder.ts`, `lib/store.ts`) in the order Listen and
 * Review call it, so each kill lands in the real save path, on the real SQLite file and Documents folder.
 * It never judges a run: the harness reads the database and the files from the host.
 *
 * Fictional family only (CLAUDE.md): the drill child is Asha and every drill letter reads
 * "Asha kill drill <run>". Spoken DL-02 letters use a tone the host generates, never a voice.
 *
 * Plants (`e2eKillPlant`) break a save on purpose, so the harness proves it can see a lost, doubled or
 * damaged letter before it reports a pass (a run that cannot fail proves nothing). They exist only here.
 *
 * A `decode` launch (ADR 0027, checks V2 and V3, the in-app half) reads the takes the host names after its DL-01
 * runs, with the app's own code and nothing else: the frame scan, ScribeAudio's probe, `openRecordingForRun` with
 * the real whole-frame copy and the take's stored progress mark, every `findSpeech` window through `decodePcm16`,
 * and, for the first few, a listening copy (`enhance`) that it probes and deletes. That is the transcription job
 * up to Whisper, where a run is refused or planned. Whisper itself needs a speech pack, which the e2e simulator
 * build has none of; the marker says whether one was installed. It writes numbers only, never audio or words.
 */
import { bundleId as brandBundleId } from '@scribe/brand';
import { ENGINE_VERSION } from '@scribe/core';
import { getRecordingPermissionsAsync, useAudioRecorder, type AudioRecorder } from 'expo-audio';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Directory, File, Paths } from 'expo-file-system';
import { useEffect } from 'react';
import { Settings } from 'react-native';
import { ScribeAudio, scribeAudioErrorCode } from '../../modules/scribe-audio';
import { setAudioMode } from '@/lib/audio-mode';
import { afterLetterKept } from '@/lib/billing';
import { adtsLengthEvidence, breaksInside } from '@/lib/capture/adts';
import { scanRecordingFile, wholeFramesCopy } from '@/lib/capture/adts-file';
import { VOICE_RECORDING_OPTIONS, beginTake, ensureAudioHash, hashAudioFile } from '@/lib/capture/recorder';
import { containerOfRecording } from '@/lib/capture/recording-file';
import { runLaunchSweep } from '@/lib/capture/sweep';
import { fileNameOf } from '@/lib/capture/sweep.logic';
import { vadWindows } from '@/lib/transcribe-plan';
import { RunInputError, openRecordingForRun } from '@/lib/transcribe-run';
import { createWhisperTranscriber } from '@/lib/transcribe-whisper';
import type { SqlParam } from '@/lib/db/sql';
import {
  addChild,
  createDraft,
  deleteDraft,
  finalizeDraftAudio,
  getActiveChild,
  getDraft,
  getSetting,
  listChildren,
  localSqlDb,
  saveEntry,
  saveLetterFromDraft,
  setDraftTranscript,
  setRecordingProgress,
  setSetting,
  todayISO,
  uuidv7,
  type Child,
  type Draft,
  type Entry,
} from '@/lib/store';
import {
  DECODE_FILE_NAME,
  DECODE_LIMIT,
  DRAFT_REMOVE,
  DRILL_BUNDLE_SUFFIX,
  ENHANCE_LIMIT,
  FIXTURE_FILE,
  MARKER_DIR,
  OWNED_SETTING,
  PLANT_LOSS_GAP_MS,
  POINT_HOLD_MS,
  TAKE_DIR,
  decideDrillGuard,
  drillAudioName,
  drillText,
  markerName,
  parseDrillArgs,
  type ArmedMarker,
  type CrashPoint,
  type DecodeRequest,
  type DrillArgs,
  type MarkerKind,
} from './kill-drill.logic';

const DAY = 864e5;
const GO_WAIT_MS = 10 * 60 * 1000;

/** Launch arguments never change while the process lives, so they are read once. */
const ARGS: DrillArgs | null = (() => {
  try {
    return parseDrillArgs((key) => Settings.get(key));
  } catch {
    return null;
  }
})();

const DRILL_BUNDLE_ID = `${brandBundleId()}${DRILL_BUNDLE_SUFFIX}`;
const BUNDLE_ID: string | null = Constants.expoConfig?.ios?.bundleIdentifier ?? null;
/** The parts of the guard that need no database: a simulator, the development bundle. */
const PLACE_OK = Device.isDevice === false && BUNDLE_ID === DRILL_BUNDLE_ID;

/** A code only: no message text leaves the drill. */
class DrillError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

function markerDir(): Directory {
  const dir = new Directory(Paths.cache, MARKER_DIR);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

function writeMarker(kind: MarkerKind, run: number, body: object): void {
  const f = new File(markerDir(), markerName(kind, run));
  f.create({ overwrite: true });
  f.write(JSON.stringify(body));
}

function hasMarker(kind: MarkerKind, run: number): boolean {
  return new File(markerDir(), markerName(kind, run)).exists;
}

/**
 * Before the 18+ gate reads its setting, in the same first render. First the guard; only if it passes: the
 * install's drill mark (setup only, on a fresh install), the gate boolean (as `src/dev/asha-seed.ts` sets it)
 * and the drill child. Once per process.
 */
let prepared = false;
let refusal: string | null = null;
function prepare(): void {
  if (prepared || !ARGS) return;
  prepared = true;
  const owned = getSetting(OWNED_SETTING) === '1';
  const verdict = decideDrillGuard({
    mode: ARGS.mode,
    isDevice: Device.isDevice,
    bundleId: BUNDLE_ID,
    drillBundleId: DRILL_BUNDLE_ID,
    hasChild: listChildren().length > 0,
    owned,
  });
  if (!verdict.ok) {
    refusal = verdict.code;
    return;
  }
  if (!owned) setSetting(OWNED_SETTING, '1');
  setSetting('ageGate.passed', '1'); // the gate boolean only (PRD-REQ-019, D-026)
  if (listChildren().length === 0) {
    addChild({ name: 'Asha', birthday: todayISO(new Date(Date.now() - 120 * DAY)), dueDate: null, signsAs: 'Mama' });
  }
}

/** DL-01 needs a recorder; every other launch, and every launch the guard would refuse, makes none. */
function useRecorderForDrill(): AudioRecorder | null {
  return useAudioRecorder(VOICE_RECORDING_OPTIONS);
}
function useNoRecorder(): AudioRecorder | null {
  return null;
}
const useDrillRecorder = ARGS?.mode === 'dl01' && PLACE_OK ? useRecorderForDrill : useNoRecorder;

let started = false;

/** Called once from the root layout through `useE2eSeams()`; inert without drill launch arguments. */
export function useKillDrill(): void {
  prepare();
  const recorder = useDrillRecorder();
  useEffect(() => {
    const a = ARGS;
    if (!a || started) return;
    started = true;
    const fail = (code: string) => {
      try {
        writeMarker('error', a.run, { run: a.run, code });
      } catch {
        // nothing to report to: the harness times out and says so
      }
    };
    if (refusal) {
      fail(refusal);
      return;
    }
    runDrill(a, recorder).catch((e: unknown) => fail(e instanceof DrillError ? e.code : 'drill_failed'));
  }, [recorder]);
}

async function runDrill(a: DrillArgs, recorder: AudioRecorder | null): Promise<void> {
  // The root layout starts the launch sweep after the first frame; wait for the same frame, then for the sweep.
  await nextFrame();
  const report = await runLaunchSweep();
  writeMarker('boot', a.run, { run: a.run, mode: a.mode, swept: report !== null, sweep: report ?? {}, at: new Date().toISOString() });
  if (a.mode !== 'dl01' && a.mode !== 'dl02' && a.mode !== 'decode') return;
  // The host judges the previous run now; nothing changes on disk until it says go.
  const t0 = Date.now();
  while (!hasMarker('go', a.run)) {
    if (Date.now() - t0 > GO_WAIT_MS) throw new DrillError('no_go');
    await sleep(25);
  }
  if (a.mode === 'decode') await decodeDrill(a);
  else if (a.mode === 'dl02') await (a.point ? pointDrill(a) : saveDrill(a));
  else await recordDrill(a, recorder);
}

function activeChild(): Child {
  const child = getActiveChild();
  if (!child) throw new DrillError('no_child');
  return child;
}

function takeFile(run: number): File {
  const takes = new Directory(Paths.document, TAKE_DIR);
  if (!takes.exists) takes.create({ intermediates: true, idempotent: true });
  return new File(takes, drillAudioName(run));
}

function copyFixture(target: File): void {
  const fixture = new File(markerDir(), FIXTURE_FILE);
  if (!fixture.exists) throw new DrillError('no_fixture');
  fixture.copySync(target);
}

function armedFor(a: DrillArgs, draft: Draft, text: string, sha256: string | null): ArmedMarker {
  return {
    run: a.run,
    mode: 'dl02',
    kind: a.kind,
    plant: a.plant,
    point: a.point,
    draftId: draft.id,
    audioFile: draft.audioUri ? fileNameOf(draft.audioUri) : null,
    text,
    sha256,
    recordedMs: null,
    at: new Date().toISOString(),
  };
}

function letterFor(draft: Draft, text: string, child: Child, audio: { sha256: string | null; bytes: number | null }): Entry {
  return {
    id: draft.id,
    kind: 'letter',
    occurredOn: todayISO(new Date(draft.createdAt)),
    capturedAt: draft.createdAt,
    captureMode: draft.captureMode,
    editLevel: 'verbatim',
    promptKey: null,
    engineVersion: ENGINE_VERSION,
    rawTranscript: text,
    machineEdits: [],
    finalText: text,
    inBook: true,
    soundsLikeMe: null,
    childId: child.id,
    authorSignsAs: child.signsAs,
    audioUri: draft.audioUri,
    audioDurationMs: draft.audioDurationMs,
    audioSha256: audio.sha256,
    audioBytes: audio.bytes,
  };
}

// ── DL-02: kill during save, at a random moment ──────────────────────────

async function saveDrill(a: DrillArgs): Promise<void> {
  const child = activeChild();
  const text = drillText(a.run);
  let draft: Draft;
  let sha256: string | null = null;
  if (a.kind === 'typed') {
    // As Write leaves it: a typed draft holding the words (app/write.tsx).
    draft = createDraft({ childId: child.id, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: text });
  } else {
    // As Listen leaves a finished take: the file where expo-audio writes takes, a ready draft and, for
    // `spoken`, its hash from Finish (recorder.ts finalizeTake). `spoken-unhashed` makes Save hash it.
    const target = takeFile(a.run);
    copyFixture(target);
    const hash = await hashAudioFile(target.uri);
    if (!hash) throw new DrillError('fixture_unreadable');
    sha256 = hash.sha256;
    const hashed = a.kind === 'spoken';
    draft = createDraft({
      childId: child.id,
      captureMode: 'spoken',
      promptKey: null,
      audioUri: target.uri,
      audioDurationMs: null,
      state: 'ready',
      audioSha256: hashed ? hash.sha256 : null,
      audioBytes: hashed ? hash.bytes : null,
    });
    setDraftTranscript(draft.id, text); // the words Review would show
  }
  if (a.plant !== 'none') {
    // Planted failures are in place before the drill arms, so every kill delay finds them.
    await plant(a, draft, text, child);
    writeMarker('armed', a.run, armedFor(a, draft, text, sha256));
    return;
  }
  writeMarker('armed', a.run, armedFor(a, draft, text, sha256));
  const t0 = Date.now();
  await save(draft.id, text, child);
  writeMarker('done', a.run, { run: a.run, saveMs: Date.now() - t0 });
}

/**
 * Planted, never the real save. `loss`: the draft goes and the letter comes only after a gap longer than any
 * kill delay (a save that is not one transaction). `double`: the letter is written and the draft kept.
 * `damage`: the real save, then one byte of the recording changed.
 */
async function plant(a: DrillArgs, draft: Draft, text: string, child: Child): Promise<void> {
  const audio = await ensureAudioHash(draft);
  const entry = letterFor(draft, text, child, audio);
  if (a.plant === 'double') {
    saveEntry(entry);
    return;
  }
  if (a.plant === 'damage') {
    await save(draft.id, text, child);
    if (!draft.audioUri) throw new DrillError('no_audio_to_damage');
    const f = new File(draft.audioUri);
    const bytes = f.bytesSync();
    bytes[bytes.length >> 1] ^= 0xff;
    f.write(bytes);
    return;
  }
  deleteDraft(draft.id);
  setTimeout(() => saveEntry(entry), PLANT_LOSS_GAP_MS);
}

/** Review's save (app/review.tsx `save`): hash check, one transaction, then the Keychain copy of the count. */
async function save(draftId: string, text: string, child: Child): Promise<void> {
  const draft = getDraft(draftId);
  if (!draft) throw new DrillError('draft_gone');
  const audio = await ensureAudioHash(draft);
  saveLetterFromDraft(draft.id, letterFor(draft, text, child, audio), audio.exists);
  await afterLetterKept();
}

// ── DL-02: kill exactly at a crash point ─────────────────────────────────

/** Writes the point marker, then waits to be killed (the host kills within milliseconds). */
async function hold(a: DrillArgs, point: CrashPoint): Promise<void> {
  if (a.point !== point) return;
  writeMarker('point', a.run, { run: a.run, point, at: new Date().toISOString() });
  await sleep(POINT_HOLD_MS);
}

/** The same inside the open transaction: a synchronous wait, so nothing commits while the host kills. */
function holdInsideTransaction(a: DrillArgs): void {
  if (a.point !== 'inside-transaction') return;
  writeMarker('point', a.run, { run: a.run, point: a.point, at: new Date().toISOString() });
  const until = Date.now() + POINT_HOLD_MS;
  while (Date.now() < until) {
    // held on purpose, uncommitted
  }
}

/**
 * A save with its crash point. The order is Listen's and Review's: for a spoken letter the draft row exists
 * before the file (Listen writes it before the microphone), the file is written and closed, the draft is
 * finalized with its hash (recorder.ts finalizeTake), then Save: the hash check, one transaction, the Keychain.
 *
 * The transaction is the real `store.saveLetterFromDraft`. For `inside-transaction` the drill wraps the store
 * connection's `run` for the length of that one call and holds right after the statement that removes this
 * draft (`drafts.remove`), so the letter row is written, the draft gone, and nothing committed. If that
 * statement ever changes, the point never fires and the harness reports the run incomplete, never a pass;
 * `apps/mobile/test/qa-kill-harness.test.ts` also checks the statement.
 */
async function pointDrill(a: DrillArgs): Promise<void> {
  const child = activeChild();
  const text = drillText(a.run);
  let draft: Draft;
  let target: File | null = null;
  if (a.kind === 'typed') {
    draft = createDraft({ childId: child.id, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: text });
  } else {
    target = takeFile(a.run);
    draft = createDraft({ childId: child.id, captureMode: 'spoken', promptKey: null, audioUri: target.uri, audioDurationMs: 0, state: 'recording' });
    setDraftTranscript(draft.id, text);
  }
  writeMarker('armed', a.run, armedFor(a, draft, text, null));
  if (target) {
    copyFixture(target);
    await hold(a, 'after-file-write');
    const hash = await hashAudioFile(target.uri);
    finalizeDraftAudio(draft.id, { audioUri: target.uri, sha256: hash?.sha256 ?? null, bytes: hash?.bytes ?? null, state: 'ready' });
  }
  const fresh = getDraft(draft.id);
  if (!fresh) throw new DrillError('draft_gone');
  const audio = await ensureAudioHash(fresh);
  await hold(a, 'before-row');
  const entry = letterFor(fresh, text, child, audio);
  const db = localSqlDb();
  const run = db.run;
  if (a.point === 'inside-transaction') {
    db.run = (sql: string, ...params: SqlParam[]) => {
      run(sql, ...params);
      if (DRAFT_REMOVE.test(sql) && params[0] === fresh.id) holdInsideTransaction(a);
    };
  }
  try {
    saveLetterFromDraft(fresh.id, entry, audio.exists);
  } finally {
    db.run = run;
  }
  await hold(a, 'after-commit');
  await afterLetterKept();
  writeMarker('done', a.run, { run: a.run });
}

// ── DL-01: kill while recording ─────────────────────────────────────────

async function recordDrill(a: DrillArgs, recorder: AudioRecorder | null): Promise<void> {
  const child = activeChild();
  if (!recorder) throw new DrillError('no_recorder');
  // The harness grants the microphone with `xcrun simctl privacy`; the drill never shows the iOS prompt.
  if (!(await getRecordingPermissionsAsync()).granted) throw new DrillError('mic_not_granted');
  let draft: Draft;
  try {
    // As Listen starts a take (app/listen.tsx `start`).
    await setAudioMode('recording');
    draft = await beginTake(recorder, { childId: child.id, promptKey: null });
  } catch {
    throw new DrillError('record_failed');
  }
  await sleep(250);
  const uri = draft.audioUri;
  if (!uri || !recorder.getStatus().isRecording) throw new DrillError('not_recording');
  // Planted failures are in place before the drill arms, so every kill delay finds them.
  if (a.plant === 'loss') {
    // Planted: the take's file is removed while it records (the recorder keeps writing to nothing).
    new File(uri).delete();
  }
  if (a.plant === 'double') {
    // Planted: two letters point at the take's file as well as its draft.
    for (let i = 0; i < 2; i += 1) {
      const at = new Date();
      saveEntry({
        id: uuidv7(at.getTime()),
        kind: 'letter',
        occurredOn: todayISO(at),
        capturedAt: at.toISOString(),
        captureMode: 'spoken',
        editLevel: 'verbatim',
        promptKey: null,
        engineVersion: ENGINE_VERSION,
        rawTranscript: drillText(a.run),
        machineEdits: [],
        finalText: drillText(a.run),
        inBook: false,
        soundsLikeMe: null,
        childId: child.id,
        authorSignsAs: child.signsAs,
        audioUri: uri,
        audioDurationMs: null,
      });
    }
  }
  const armed: ArmedMarker = {
    run: a.run,
    mode: 'dl01',
    kind: null,
    plant: a.plant,
    point: null,
    draftId: draft.id,
    audioFile: fileNameOf(uri),
    text: null,
    sha256: null,
    recordedMs: recorder.getStatus().durationMillis,
    at: new Date().toISOString(),
  };
  writeMarker('armed', a.run, armed);
  // Elapsed time to the draft every 5 s, as Listen does, so a take recovered after a kill has a length.
  setInterval(() => {
    try {
      setRecordingProgress(draft.id, recorder.getStatus().durationMillis);
    } catch {
      // the next tick tries again
    }
  }, 5000);
}

// ── ADR 0027: the in-app decode check of kept takes (checks V2 and V3) ──

/** The host's `go` marker for a decode launch; read again if the host is still writing it. */
async function readDecodeRequest(run: number): Promise<DecodeRequest> {
  for (let i = 0; ; i += 1) {
    try {
      const body = JSON.parse(new File(markerDir(), markerName('go', run)).textSync()) as Partial<DecodeRequest>;
      return { run, files: Array.isArray(body.files) ? body.files.slice(0, DECODE_LIMIT) : [] };
    } catch {
      if (i >= 40) throw new DrillError('decode_request_unreadable');
      await sleep(25);
    }
  }
}

const codeOf = (e: unknown) => (e instanceof RunInputError ? e.reason : (scribeAudioErrorCode(e) ?? 'error'));

/** A listening copy of the take in Caches, its length, then the copy deleted. */
async function enhanceCheck(uri: string): Promise<Record<string, unknown>> {
  const audio = ScribeAudio;
  if (!audio) return { error: 'no_scribe_audio' };
  const out = new File(markerDir(), 'enhance-check.m4a');
  try {
    if (!audio.isIsolationAvailable()) return { error: 'isolation_unavailable' };
    if (out.exists) out.delete();
    const made = await audio.enhance('kill-drill-enhance', uri, out.uri, { mix: 80 });
    const probe = await audio.probe(out.uri);
    return { ms: made.durationMs, copyProbeMs: probe.durationMs };
  } catch (e) {
    return { error: codeOf(e) };
  } finally {
    try {
      if (out.exists) out.delete();
    } catch {
      // the uninstall at the end of the harness removes it
    }
  }
}

/**
 * One take as the transcription job reads it, up to Whisper (transcribe-whisper.ts): the frame scan, the probe,
 * `openRecordingForRun` with the real whole-frame copy and the stored progress mark, then every 5-minute window
 * `findSpeech` decodes. Numbers only.
 */
async function decodeOne(uri: string, draftId: string | null, withEnhance: boolean): Promise<Record<string, unknown>> {
  const audio = ScribeAudio;
  if (!audio) return { error: 'no_scribe_audio' };
  const container = containerOfRecording(uri);
  const storedMs = draftId ? (getDraft(draftId)?.audioDurationMs ?? null) : null;
  const scan = container === 'adts' ? await scanRecordingFile(uri) : null;
  const out: Record<string, unknown> = { container, storedMs };
  if (scan) {
    Object.assign(out, {
      frames: scan.frames,
      wholeBytes: scan.wholeBytes,
      tailBytes: scan.tailBytes,
      tail: scan.tail,
      framesAfterBreak: scan.framesAfterBreak,
      countedMs: adtsLengthEvidence(scan).countedMs,
    });
  }
  try {
    const p = await audio.probe(uri);
    out.probeMs = p.durationMs;
    out.sampleRate = p.sampleRate;
  } catch (e) {
    out.probeError = codeOf(e);
  }
  let usedCopy = false;
  let windows = 0;
  try {
    const run = await openRecordingForRun(
      { probeMs: async (u) => (await audio.probe(u)).durationMs, decode: (u, pieces) => audio.decodePcm16(u, [...pieces]) },
      uri,
      storedMs,
      scan ? { evidence: adtsLengthEvidence(scan), tail: scan.wholeBytes > 0 ? scan.tail : 'none', breakInside: breaksInside(scan) } : null,
      () => {
        usedCopy = true;
        return wholeFramesCopy(uri, scan?.wholeBytes ?? 0);
      },
    );
    out.plannedMs = run.durationMs;
    try {
      for (const w of vadWindows(run.durationMs)) {
        await run.decode([{ srcStartMs: w.startMs, srcEndMs: w.endMs, silenceBeforeMs: 0 }]);
        windows += 1;
      }
    } finally {
      run.close();
    }
  } catch (e) {
    out.refused = codeOf(e);
  }
  out.usedCopy = usedCopy;
  out.windows = windows;
  if (withEnhance) out.enhance = await enhanceCheck(uri);
  return out;
}

async function decodeDrill(a: DrillArgs): Promise<void> {
  const request = await readDecodeRequest(a.run);
  let whisper: string | null;
  try {
    whisper = (await createWhisperTranscriber().availability('en')) ?? 'available';
  } catch {
    whisper = 'unknown';
  }
  const takes = new Directory(Paths.document, TAKE_DIR);
  const results: Array<Record<string, unknown>> = [];
  for (const [i, f] of request.files.entries()) {
    const name = typeof f?.name === 'string' ? f.name : '';
    if (!DECODE_FILE_NAME.test(name)) {
      results.push({ name: null, error: 'bad_name' });
      continue;
    }
    const file = new File(takes, name);
    if (!file.exists) {
      results.push({ name, error: 'missing' });
      continue;
    }
    try {
      results.push({ name, ...(await decodeOne(file.uri, typeof f.draftId === 'string' ? f.draftId : null, i < ENHANCE_LIMIT)) });
    } catch (e) {
      results.push({ name, error: codeOf(e) });
    }
  }
  writeMarker('decoded', a.run, { run: a.run, whisper, results, at: new Date().toISOString() });
}
