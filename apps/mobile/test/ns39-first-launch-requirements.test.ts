/// <reference types="node" />
/**
 * NS-39 first launch, the rows the first PR left without a titled test (card
 * docs/product/prd/19-from-download-to-first-letter.md): R3 nothing downloads without a tap, R4 a recording waits for
 * its words, R6 servers off has no sign-in, R10 our microphone primer before iOS asks, R11 launch recovery never
 * deletes. R5 is first-run-offline.test.ts. Behaviour runs in Node on the pure rules; the screens (which need a phone)
 * are read as source, each scan with a positive control and a named mutant. Fictional family "Asha" only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { en, speechConsentCopy } from '@scribe/content';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { startTake, type StartDeps } from '../src/components/capture/listen.logic';
import { capabilities, setServerFeaturesForTests } from '../src/lib/capabilities';
import { firstRunGate } from '../src/lib/first-run/gate.logic';
import { firstRunStartStep } from '../src/lib/first-run/handoff.logic';
import { autoStartAllowed, parseChoice } from '../src/lib/models/speech-consent.logic';
import { createRecoveryActions, RETRY_BEAT_MS, type ExportOutcome, type LaunchStatus, type RecoveryDeps, type RecoveryView } from '../src/lib/resilience/launch.logic';
import { initialQueue, languagesWaiting, nextJob, reduce, type QueueEvent } from '../src/lib/transcription-queue/machine';

const SRC = join(__dirname, '..', 'src');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
/** The text of `const <name> = (...) => { ... };` up to its closing `};` at the same indent. */
const handler = (src: string, name: string) => src.match(new RegExp(`const ${name} = \\([^)]*\\) => \\{[\\s\\S]*?\\n  \\};`))?.[0] ?? '';

// ---------- R3 ----------
const STARTS_DOWNLOAD = /startSpeechDownload|requestSpeechFor|requestWords|setSpeechDownloadChoice\('yes'\)/;
/** What the speech card may do on its own: nothing. A download starts only inside `yes` (and `retry`, shown after a yes). */
export function cardBreaks(card: string): string[] {
  const c = code(card);
  const bad: string[] = [];
  if (STARTS_DOWNLOAD.test(handler(c, 'later'))) bad.push('Not now starts a download or writes a yes');
  const effects = [...c.matchAll(/useEffect\(\(\) => \{[\s\S]*?\n  \}, \[[^\]]*\]\);/g)].map((m) => m[0]);
  if (effects.some((e) => STARTS_DOWNLOAD.test(e))) bad.push('an effect starts a download');
  if (/useMemo\([^)]*(startSpeechDownload|requestSpeechFor)/.test(c)) bad.push('rendering starts a download');
  if ([...c.matchAll(/startSpeechDownload\(/g)].length !== 2) bad.push('startSpeechDownload is called from somewhere other than yes and retry');
  if (!/const yes = \(\) => \{[\s\S]*?startSpeechDownload\(language\)/.test(c)) bad.push('the tap does not start the download');
  return bad;
}

describe('[NS-39-R3] nothing downloads without a tap', () => {
  it('[NS-39-R3] only a stored yes lets the app start a download by itself; unset and Not now start nothing', () => {
    expect(autoStartAllowed(parseChoice(null))).toBe(false);
    expect(autoStartAllowed(parseChoice('later'))).toBe(false);
    expect(autoStartAllowed(parseChoice('Yes'))).toBe(false);
    expect(autoStartAllowed(parseChoice('yes'))).toBe(true);
  });
  it('[NS-39-R3] the card says Download on Wi-Fi and Not now, as approved', () => {
    expect(speechConsentCopy.downloadButton).toBe('Download on Wi-Fi');
    expect(speechConsentCopy.laterButton).toBe('Not now');
  });
  it('[NS-39-R3] the card starts a download only inside the tap on Download on Wi-Fi; Not now, mounting and rendering start none', () => {
    expect(cardBreaks(read('components/speech/speech-consent-card.tsx'))).toEqual([]);
  });
  it('[NS-39-R3] the card reaches the download only through the tap handlers its two buttons carry', () => {
    const c = code(read('components/speech/speech-consent-card.tsx'));
    expect(c).toMatch(/label=\{t\.downloadButton\} onPress=\{yes\}/);
    expect(c).toMatch(/label=\{t\.laterButton\} onPress=\{later\}/);
  });
  it('[NS-39-R3] every automatic start in the queue asks the stored choice first', () => {
    const q = read('lib/transcription-queue/index.ts');
    expect(q).toMatch(/onAuthorSpeechLanguage\(\(lang\) => \{ if \(speechAutoStartAllowed\(\)\) void requestSpeechFor\(lang\); \}\)/);
    expect(q).toMatch(/if \(speechAutoStartAllowed\(\)\) void requestSpeechFor\(language\)/);
    expect(q).toMatch(/allowed: \(\) => started && state\.foreground && speechAutoStartAllowed\(\)/);
  });
  it('[NS-39-R3] control: the scan reads the real card as one that starts on a tap', () => {
    expect(/const yes = \(\) => \{[\s\S]*?startSpeechDownload\(language\)/.test(code(read('components/speech/speech-consent-card.tsx')))).toBe(true);
  });
  it('[NS-39-R3] mutant: Not now that starts the download is caught', () => {
    const m = read('components/speech/speech-consent-card.tsx').replace("setSpeechDownloadChoice('later');", "void startSpeechDownload(language);\n    setSpeechDownloadChoice('later');");
    expect(cardBreaks(m)).not.toEqual([]);
  });
  it('[NS-39-R3] mutant: a download started on mount is caught', () => {
    const m = read('components/speech/speech-consent-card.tsx').replace('  const yes = () => {', '  useEffect(() => {\n    void startSpeechDownload(language);\n  }, [language]);\n  const yes = () => {');
    expect(cardBreaks(m)).not.toEqual([]);
  });
});

// ---------- R4 ----------
const T = '2026-11-20T21:00:00Z';
const enqueue = (id: string, kind: 'draft' | 'entry' = 'entry'): QueueEvent => ({ type: 'enqueue', id, kind, language: 'en', capturedAt: T });
const run = (events: QueueEvent[]) => events.reduce(reduce, initialQueue());

describe('[NS-39-R4] a recording waits for its words', () => {
  it('[NS-39-R4] with no speech model on the phone (Not now, or still downloading) the recording is queued and waits, not dropped or failed', () => {
    const s = run([enqueue('asha-1')]);
    expect(s.jobs['asha-1']).toMatchObject({ phase: 'waiting_for_pack', attempts: 0 });
    expect(s.jobs['asha-1'].failure).toBeUndefined();
    expect(nextJob(s, Date.parse(T))).toBeNull();
    expect(languagesWaiting(s)).toEqual(['en']);
  });
  it('[NS-39-R4] the wait can be as long as the person likes: unrelated events never remove or fail it', () => {
    const s = run([enqueue('asha-1'), { type: 'foreground', value: false }, { type: 'foreground', value: true }, { type: 'recording', value: true }, { type: 'recording', value: false }, { type: 'packs', ready: [] }]);
    expect(s.jobs['asha-1'].phase).toBe('waiting_for_pack');
  });
  it('[NS-39-R4] when the words arrive the same recording runs; nothing was lost in between', () => {
    let s = run([enqueue('asha-1'), enqueue('asha-2', 'draft')]);
    s = reduce(s, { type: 'packs', ready: ['en'] });
    expect(Object.keys(s.jobs).sort()).toEqual(['asha-1', 'asha-2']);
    expect(s.jobs['asha-1'].phase).toBe('queued');
    expect(nextJob(s, Date.parse(T))).not.toBeNull();
  });
  it('[NS-39-R4] a second save of the same recording is one job, not a second one', () => {
    const s = run([enqueue('asha-1', 'draft'), enqueue('asha-1', 'entry')]);
    expect(Object.keys(s.jobs)).toEqual(['asha-1']);
    expect(s.jobs['asha-1'].kind).toBe('entry');
  });
  it('[NS-39-R4] Listen starts no download and waits for none; Review can keep the recording alone', () => {
    expect(read('app/listen.tsx')).not.toMatch(/startSpeechDownload|requestWords|retryWords|setSpeechDownloadChoice|(await|\.then\()[^;\n]*(speechDownload|SpeechDownload)/);
    expect(read('app/review.tsx')).toMatch(/keep: \(\) => void keepRecordingOnly\(\)/);
  });
  it('[NS-39-R4] the card tells the person the voice is kept either way, in the approved words', () => {
    expect(speechConsentCopy.chosenLater).toBe('Your voice is kept either way.');
    expect(speechConsentCopy.startNow).toBe('You can start now. Your voice is kept, and the words follow.');
  });
});

// ---------- R6 ----------
describe('[NS-39-R6] servers-off first run has no sign-in', () => {
  afterEach(() => setServerFeaturesForTests(null));
  it('[NS-39-R6] with the switch off no sign-in, sync or co-parent capability exists', () => {
    setServerFeaturesForTests(false);
    expect([capabilities.signIn, capabilities.sync, capabilities.coParent]).toEqual([false, false, false]);
  });
  it('[NS-39-R6] control: with the switch on they do', () => {
    setServerFeaturesForTests(true);
    expect([capabilities.signIn, capabilities.sync, capabilities.coParent]).toEqual([true, true, true]);
  });
  it('[NS-39-R6] the gate does nothing with the switch off: never the Welcome with sign-in, whatever the session, network or book', () => {
    for (const hasSession of [false, true]) {
      for (const online of [false, true]) {
        for (const hasLocalBook of [false, true]) {
          const r = firstRunGate({ serverFeatures: false, ageAnswered: 'yes', hasSession, hasLocalBook, online, signInFailed: !online });
          expect(r.step).toBe('unchanged');
          expect(r.offerSignIn).toBe(false);
          expect(r.outage).toBeNull();
        }
      }
    }
  });
  it('[NS-39-R6] the first step is the Welcome with the one start button, whatever session the phone seems to have', () => {
    for (const hasSession of [false, true]) for (const localStartChosen of [false, true]) expect(firstRunStartStep({ serverFeatures: false, hasSession, localStartChosen })).toBe('welcome');
    expect(en.onboarding.welcome.startButton).toBe('Begin the book');
  });
  it('[NS-39-R6] the Welcome draws its sign-in and invite doors only from the capability flags, and the Welcome screen is the unchanged one', () => {
    const o = code(read('app/onboarding.tsx'));
    expect(o).toMatch(/step === 'welcome' && \(capabilities\.signIn \|\| doors\.joinButton\)/);
    expect(o).toMatch(/\{capabilities\.signIn \? \(/);
    expect(o).toMatch(/visibleCoParentDoors\(capabilities\.coParent, PLUS_ALPHA\)/);
    expect(o).toMatch(/const active = serverFeaturesEnabled\(\) && auth\.configured;|serverFeatures: serverFeaturesEnabled\(\) && configured/);
  });
});

// ---------- R10 ----------
function micRig(perm: { granted: boolean; status?: string }) {
  const calls: string[] = [];
  const deps: StartDeps = {
    alive: () => true,
    getPermission: async () => perm,
    requestPermission: async () => {
      calls.push('request');
      return { granted: true, status: 'granted' };
    },
    freeBytes: () => null,
    pressHaptic: () => void calls.push('haptic'),
    setRecordingMode: async () => void calls.push('recordingMode'),
    setIdleMode: async () => {},
    openTake: () => {
      calls.push('openTake');
      return 1;
    },
    closeTake: () => {},
    onToken: () => {},
    begin: async () => {
      calls.push('begin');
      return { id: 'asha-draft' };
    },
    keepOrphan: () => {},
  };
  return { calls, deps };
}
/** Only the primer's Continue may pass `true`; the red circle and Try again pass nothing that primes. */
export function primerBreaks(listen: string): string[] {
  const c = code(listen);
  const bad: string[] = [];
  if (!/const begin = \(\) => startFromTap\(false\);/.test(c)) bad.push('the red circle can skip the primer');
  if (!/const continueAfterPrimer = \(\) => startFromTap\(true\);/.test(c)) bad.push('Continue does not carry the primed start');
  if ([...c.matchAll(/startFromTap\(true\)|start\(true\)/g)].length !== 1) bad.push('a second path primes');
  if (!/onContinue=\{continueAfterPrimer\}/.test(c)) bad.push('the primer Continue is not wired');
  if (/onType=\{continueAfterPrimer\}|onClose=\{continueAfterPrimer\}/.test(c)) bad.push('another button reaches the iOS prompt');
  if ([...c.matchAll(/requestRecordingPermissionsAsync/g)].length !== 2) bad.push('the iOS prompt is requested from somewhere new'); // import + the one dep
  return bad;
}

describe('[NS-39-R10] microphone primer before the system prompt', () => {
  it('[NS-39-R10] the first tap on Speak, while iOS has not asked, shows our primer and asks iOS nothing', async () => {
    const { calls, deps } = micRig({ granted: false, status: 'undetermined' });
    expect(await startTake(deps, false)).toEqual({ kind: 'primer' });
    expect(calls).toEqual([]);
  });
  it('[NS-39-R10] Continue on the primer is what asks iOS, once, and then the take starts', async () => {
    const { calls, deps } = micRig({ granted: false, status: 'undetermined' });
    const out = await startTake(deps, true);
    expect(out.kind).toBe('live');
    expect(calls.indexOf('request')).toBe(0);
    expect(calls.filter((c) => c === 'request')).toHaveLength(1);
  });
  it('[NS-39-R10] a tap that is not the primer Continue never reaches the iOS prompt while it has not asked', async () => {
    const { calls, deps } = micRig({ granted: false, status: 'undetermined' });
    for (let i = 0; i < 3; i++) await startTake(deps, false);
    expect(calls).not.toContain('request');
  });
  it('[NS-39-R10] the primer shows exactly while iOS would still ask: an earlier answer, yes or no, skips it', async () => {
    const granted = micRig({ granted: true, status: 'granted' });
    expect((await startTake(granted.deps, false)).kind).toBe('live');
    expect(granted.calls).not.toContain('request');
    const denied = micRig({ granted: false, status: 'denied' });
    await startTake(denied.deps, false);
    expect(denied.calls[0]).toBe('request');
  });
  it('[NS-39-R10] the primer words are the approved ones, and Continue is its button', () => {
    expect(en.listen.primer.title).toBe('Your phone will ask about the microphone');
    expect(en.listen.primer.continueButton).toBe('Continue');
  });
  it('[NS-39-R10] on the screen the primer Continue is the one primed path; the red circle, Type instead and Close are not', () => {
    expect(primerBreaks(read('app/listen.tsx'))).toEqual([]);
  });
  it('[NS-39-R10] mutant: a red circle that skips the primer is caught', () => {
    expect(primerBreaks(read('app/listen.tsx').replace('const begin = () => startFromTap(false);', 'const begin = () => startFromTap(true);'))).not.toEqual([]);
  });
});

// ---------- R11 ----------
function recoveryRig(over: Partial<RecoveryDeps> = {}) {
  const calls: string[] = [];
  const views: RecoveryView[] = [];
  const deps: RecoveryDeps = {
    wait: async () => void calls.push('wait'),
    open: () => {
      calls.push('open');
      return 'recovery' as LaunchStatus;
    },
    runExport: async () => {
      calls.push('export');
      return 'shared' as ExportOutcome;
    },
    isLive: () => true,
    update: () => void calls.push('update'),
    ...over,
  };
  return { calls, views, actions: createRecoveryActions(deps) };
}
const RECOVERY_FILES = ['components/resilience/launch-recovery.tsx', 'lib/resilience/launch.logic.ts', 'lib/resilience/recovery-export.logic.ts', 'lib/resilience/recovery-export.ts'];
const DESTRUCTIVE = /\b(deleteAsync|deleteSetting|unlink|rmSync|removeItem|deleteDatabase\w*|eraseEntry|eraseBook|resetStore|wipe\w*|DROP\s+(TABLE|INDEX|TRIGGER)|DELETE\s+FROM)\b/i;
/** The two deletes in recovery-export.ts are its own cache copy: the `recovery-export` folder and the zip it made. */
export function deleteBreaks(files: Record<string, string>): string[] {
  const bad: string[] = [];
  for (const [f, text] of Object.entries(files)) {
    const c = code(text);
    const hit = DESTRUCTIVE.exec(c)?.[0];
    if (hit) bad.push(`${f}: ${hit}`);
    if (f.endsWith('recovery-export.ts')) {
      const deletes = [...c.matchAll(/(\S+)\.delete\(\)/g)].map((m) => m[1]);
      if (deletes.join() !== 'file,dir') bad.push(`${f}: a delete other than the cache copy`);
      if (!/new Directory\(Paths\.cache, 'recovery-export'\)/.test(c)) bad.push(`${f}: the folder it deletes is not the cache copy`);
    } else if (/\.delete\(/.test(c.replace(/listeners\.delete/g, ''))) bad.push(`${f}: .delete(`);
  }
  return bad;
}
const files = () => Object.fromEntries(RECOVERY_FILES.map((f) => [f, read(f)]));

describe('[NS-39-R11] launch recovery never deletes', () => {
  it('[NS-39-R11] the recovery screen offers Try again and Export what\'s readable, in the approved words', () => {
    expect(en.errors.launch.tryAgainButton).toBe('Try again');
    expect(en.errors.launch.exportButton).toBe("Export what's readable");
    const s = code(read('components/resilience/launch-recovery.tsx'));
    expect(s).toMatch(/label: view\.trying \? e\.tryingAgainButton : e\.tryAgainButton/);
    expect(s).toMatch(/view\.exporting \? e\.exportingTitle : e\.exportButton/);
  });
  it('[NS-39-R11] Try again only opens the book again: it is handed no way to delete, reset or rebuild', async () => {
    vi.useFakeTimers();
    try {
      const { calls, actions } = recoveryRig();
      const p = actions.tryAgain();
      await vi.advanceTimersByTimeAsync(RETRY_BEAT_MS);
      await p;
      expect(calls.filter((c) => c !== 'update' && c !== 'wait')).toEqual(['open']);
    } finally {
      vi.useRealTimers();
    }
  });
  it('[NS-39-R11] Export what\'s readable only exports: it never opens, resets or removes the store', async () => {
    const { calls, actions } = recoveryRig();
    await actions.exportReadable();
    expect(calls.filter((c) => c !== 'update')).toEqual(['export']);
  });
  it('[NS-39-R11] RecoveryDeps names no action that deletes: open, export, wait, live check, view update only', () => {
    const src = code(read('lib/resilience/launch.logic.ts'));
    const iface = src.match(/export interface RecoveryDeps \{[\s\S]*?\n\}/)?.[0] ?? '';
    expect([...iface.matchAll(/^\s{2}(\w+):/gm)].map((m) => m[1])).toEqual(['wait', 'open', 'runExport', 'isLive', 'update']);
  });
  it('[NS-39-R11] nothing the recovery path runs deletes a file or row; its only deletes are its own cache copy', () => {
    expect(deleteBreaks(files())).toEqual([]);
  });
  it('[NS-39-R11] a failed open leaves the file as it was: openStore closes the connection and returns an error, with no delete', () => {
    const store = code(read('lib/store.ts'));
    const open = store.slice(store.indexOf('export function openStore'), store.indexOf('const result: OpenStoreResult'));
    expect(open).toMatch(/return \{ ok: false, newer: false, error: new StoreOpenError\(\), migration: null \};/);
    expect(DESTRUCTIVE.test(open)).toBe(false);
    expect(/\.delete\(|unlink|rmSync/.test(open)).toBe(false);
  });
  it('[NS-39-R11] control: the scan sees a delete when there is one', () => {
    expect(deleteBreaks({ ...files(), 'lib/resilience/launch.logic.ts': read('lib/resilience/launch.logic.ts') + "\nawait FileSystem.deleteAsync(uri);" })).not.toEqual([]);
  });
  it('[NS-39-R11] mutant: Export that deletes the originals after zipping is caught', () => {
    const m = read('lib/resilience/recovery-export.ts').replace("removeQuietly(zip); //", "for (const f of foundFiles()) new File(f.uri).delete();\n    removeQuietly(zip); //");
    expect(deleteBreaks({ ...files(), 'lib/resilience/recovery-export.ts': m })).not.toEqual([]);
  });
  it('[NS-39-R11] mutant: a recovery screen with a Delete and start over action is caught', () => {
    const m = read('components/resilience/launch-recovery.tsx').replace("kind: 'quiet'", "kind: 'quiet' }, { label: 'Start over', onPress: () => { deleteSetting('book'); }, _: 0");
    expect(deleteBreaks({ ...files(), 'components/resilience/launch-recovery.tsx': m })).not.toEqual([]);
  });
});
