/**
 * The kill drill (RA-19-04; DEVICE_TEST_PLAN DL-01 and DL-02; DATA-REQ-048, F04-REQ-024, F08-REQ-019).
 * E2E builds only: `src/dev/e2e-seams.ts` loads this file only when the build has `EXPO_PUBLIC_E2E=1`
 * and is not production, and it does nothing unless the launch arguments name a drill.
 *
 * The host harness (`apps/mobile/e2e/kill/run-kill-harness.mjs`) launches the app on an iOS simulator
 * with launch arguments, waits for this file's markers (protocol in `kill-drill.logic.ts`) and kills
 * the process with SIGKILL at a random moment. This file calls the app's own capture and save code
 * (`lib/capture/recorder.ts`, `lib/store.ts`) in the order Listen and Review call it, so each kill
 * lands in the real save path, on the real SQLite file and Documents folder. It never judges a run:
 * the harness reads the database and the files from the host after the next launch's sweep.
 *
 * Fictional family only (CLAUDE.md): the drill child is Asha and every drill letter reads
 * "Asha kill drill <run>". Spoken DL-02 letters use a tone the host generates, never a voice.
 *
 * Plants (`e2eKillPlant`) break a save on purpose, so the harness proves it can see a lost or a
 * doubled letter before it reports a pass (a run that cannot fail proves nothing). They exist only here.
 */
import { getRecordingPermissionsAsync, useAudioRecorder, type AudioRecorder } from 'expo-audio';
import { Directory, File, Paths } from 'expo-file-system';
import { useEffect } from 'react';
import { Settings } from 'react-native';
import { ENGINE_VERSION } from '@scribe/core';
import { setAudioMode } from '@/lib/audio-mode';
import { afterLetterKept } from '@/lib/billing';
import { VOICE_RECORDING_OPTIONS, beginTake, ensureAudioHash, hashAudioFile } from '@/lib/capture/recorder';
import { runLaunchSweep } from '@/lib/capture/sweep';
import { fileNameOf } from '@/lib/capture/sweep.logic';
import {
  addChild,
  createDraft,
  deleteDraft,
  getActiveChild,
  getDraft,
  listChildren,
  saveEntry,
  saveLetterFromDraft,
  setDraftTranscript,
  setRecordingProgress,
  setSetting,
  todayISO,
  uuidv7,
  type Draft,
  type Entry,
} from '@/lib/store';
import {
  FIXTURE_FILE,
  MARKER_DIR,
  PLANT_LOSS_GAP_MS,
  TAKE_DIR,
  drillAudioName,
  drillText,
  markerName,
  parseDrillArgs,
  type ArmedMarker,
  type DrillArgs,
  type MarkerKind,
} from './kill-drill.logic';

const DAY = 864e5;

/** Launch arguments never change while the process lives, so they are read once. */
const ARGS: DrillArgs | null = (() => {
  try {
    return parseDrillArgs((key) => Settings.get(key));
  } catch {
    return null;
  }
})();

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

/**
 * Before the 18+ gate reads its setting, in the same first render: the gate boolean (as
 * `src/dev/asha-seed.ts` sets it) and the drill child. Idempotent; once per process.
 */
let prepared = false;
function prepare(): void {
  if (prepared || !ARGS) return;
  prepared = true;
  setSetting('ageGate.passed', '1'); // the gate boolean only (PRD-REQ-019, D-026)
  if (listChildren().length === 0) {
    addChild({ name: 'Asha', birthday: todayISO(new Date(Date.now() - 120 * DAY)), dueDate: null, signsAs: 'Mama' });
  }
}

/** DL-01 needs a recorder; every other launch makes none (a recorder object would only sit in memory). */
function useRecorderForDrill(): AudioRecorder | null {
  return useAudioRecorder(VOICE_RECORDING_OPTIONS);
}
function useNoRecorder(): AudioRecorder | null {
  return null;
}
const useDrillRecorder = ARGS?.mode === 'dl01' ? useRecorderForDrill : useNoRecorder;

let started = false;

/** Called once from the root layout through `useE2eSeams()`; inert without drill launch arguments. */
export function useKillDrill(): void {
  prepare();
  const recorder = useDrillRecorder();
  useEffect(() => {
    const a = ARGS;
    if (!a || started) return;
    started = true;
    runDrill(a, recorder).catch((e: unknown) => {
      try {
        writeMarker('error', a.run, { run: a.run, code: e instanceof DrillError ? e.code : 'drill_failed' });
      } catch {
        // nothing to report to: the harness times out and says so
      }
    });
  }, [recorder]);
}

async function runDrill(a: DrillArgs, recorder: AudioRecorder | null): Promise<void> {
  // The root layout starts the launch sweep after the first frame; wait for the same frame, then for the sweep.
  await nextFrame();
  const report = await runLaunchSweep();
  writeMarker('boot', a.run, { run: a.run, mode: a.mode, swept: report !== null, sweep: report ?? {}, at: new Date().toISOString() });
  if (a.mode === 'dl02') await saveDrill(a);
  else if (a.mode === 'dl01') await recordDrill(a, recorder);
}

// ── DL-02: kill during save ─────────────────────────────────────────────

async function saveDrill(a: DrillArgs): Promise<void> {
  const child = getActiveChild();
  if (!child) throw new DrillError('no_child');
  const text = drillText(a.run);
  let draft: Draft;
  let sha256: string | null = null;
  if (a.kind === 'typed') {
    // As Write leaves it: a typed draft holding the words (app/write.tsx).
    draft = createDraft({ childId: child.id, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: text });
  } else {
    // As Listen leaves a finished take: the file where expo-audio writes takes, a ready draft and, for
    // `spoken`, its hash from Finish (recorder.ts finalizeTake). `spoken-unhashed` makes Save hash it.
    const takes = new Directory(Paths.document, TAKE_DIR);
    if (!takes.exists) takes.create({ intermediates: true, idempotent: true });
    const target = new File(takes, drillAudioName(a.run));
    const fixture = new File(markerDir(), FIXTURE_FILE);
    if (!fixture.exists) throw new DrillError('no_fixture');
    fixture.copySync(target);
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
  const armed: ArmedMarker = {
    run: a.run,
    mode: 'dl02',
    kind: a.kind,
    plant: a.plant,
    draftId: draft.id,
    audioFile: draft.audioUri ? fileNameOf(draft.audioUri) : null,
    text,
    sha256,
    at: new Date().toISOString(),
  };
  if (a.plant !== 'none') {
    // Planted failures are in place before the drill arms, so every kill delay finds them.
    await plant(a, draft, text);
    writeMarker('armed', a.run, armed);
    return;
  }
  writeMarker('armed', a.run, armed);
  const t0 = Date.now();
  await save(draft.id, text);
  writeMarker('done', a.run, { run: a.run, saveMs: Date.now() - t0 });
}

function letterFor(draft: Draft, text: string, childSignsAs: string, childId: string, audio: { sha256: string | null; bytes: number | null }): Entry {
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
    childId,
    authorSignsAs: childSignsAs,
    audioUri: draft.audioUri,
    audioDurationMs: draft.audioDurationMs,
    audioSha256: audio.sha256,
    audioBytes: audio.bytes,
  };
}

/**
 * Planted, never the real save. `loss`: the draft goes and the letter comes only after a gap longer than any
 * kill delay (a save that is not one transaction). `double`: the letter is written and the draft kept.
 */
async function plant(a: DrillArgs, draft: Draft, text: string): Promise<void> {
  const child = getActiveChild();
  if (!child) throw new DrillError('no_child');
  const audio = await ensureAudioHash(draft);
  const entry = letterFor(draft, text, child.signsAs, child.id, audio);
  if (a.plant === 'double') {
    saveEntry(entry);
    return;
  }
  deleteDraft(draft.id);
  setTimeout(() => saveEntry(entry), PLANT_LOSS_GAP_MS);
}

/** Review's save (app/review.tsx `save`): hash check, one transaction, then the Keychain copy of the count. */
async function save(draftId: string, text: string): Promise<void> {
  const draft = getDraft(draftId);
  const child = getActiveChild();
  if (!draft || !child) throw new DrillError('draft_gone');
  const audio = await ensureAudioHash(draft);
  const entry = letterFor(draft, text, child.signsAs, child.id, audio);
  saveLetterFromDraft(draft.id, entry, audio.exists);
  await afterLetterKept();
}

// ── DL-01: kill while recording ─────────────────────────────────────────

async function recordDrill(a: DrillArgs, recorder: AudioRecorder | null): Promise<void> {
  const child = getActiveChild();
  if (!child) throw new DrillError('no_child');
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
    draftId: draft.id,
    audioFile: fileNameOf(uri),
    text: null,
    sha256: null,
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
