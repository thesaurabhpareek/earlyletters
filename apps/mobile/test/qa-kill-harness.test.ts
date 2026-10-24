/// <reference types="node" />
/**
 * The kill harness (RA-19-04; DEVICE_TEST_PLAN DL-01, DL-02; B2-11, never waived), tested in Node without a Mac.
 *
 * The harness loop, the oracle and the snapshot reader in `apps/mobile/e2e/kill/` run here for real against a
 * fake app: a container laid out like the simulator's (Documents/SQLite/scribe.db, Documents/ExpoAudio,
 * Library/Caches/kill-drill), written through the app's own migrator and repositories. Each fake launch runs
 * the app's own launch sweep, `runLaunchSweep` from `src/lib/capture/sweep.ts`, unchanged, over a stand-in for
 * expo-file-system backed by the container, so the fake cannot drift from the app's listing rule: when the
 * sweep changes, these tests see it. Killing a fake process stops its timers, as SIGKILL stops the app.
 *
 * Fictional family only: the drill child is Asha.
 */
import { createHash, randomBytes } from 'node:crypto';
import { appendFileSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { migrate } from '../src/lib/db/migrations';
import { children, drafts, entries, letters, settings, uuidv7From, type Entry, type RepoContext } from '../src/lib/db/repos';
import * as logic from '../src/dev/kill-drill.logic';
import { EXIT, countsOf, meetsGate, mergeReports, planRuns, plantCaught, renderMarkdown, runHarness, upperBound95 } from '../e2e/kill/harness.mjs';
import { MONO_FRAME_LIMIT, adtsFacts, containerOfName, redactAfinfo, v1Findings, xxd16 } from '../e2e/kill/adts-evidence.mjs';
import { auditStore, classifyDl01, classifyDl02, storedPathAgainst } from '../e2e/kill/oracle.mjs';
import * as protocol from '../e2e/kill/protocol.mjs';
import { readSnapshot, sha256OfFile, storedPathOf } from '../e2e/kill/snapshot.mjs';
import { AAC_FRAME_SAMPLES, scanAdts } from '../src/lib/capture/adts';
import { REAL_FRAME_LENGTHS, adtsFrame, concat } from './helpers/adts-frames';
import { nodeDb } from './helpers/node-db';

/**
 * The app's launch sweep sees takes in Documents/ExpoAudio, where expo-audio 57 writes them, since #207
 * (`src/lib/capture/recordings.ts`). Before it, the sweep listed only the top of Documents and a killed take
 * lost its draft (DEVICE_TEST_PLAN DL-01). Two tests below pin this: the real sweep on ExpoAudio takes keeps
 * every take (it goes red if the sweep goes back to the top of Documents), and a listing that shows only the
 * top of Documents is a fail the harness reports (exit 1).
 */

/** Shared with the module stand-ins below (vi.mock factories run before the imports). */
const env = vi.hoisted(() => ({
  docs: '',
  ctx: null as unknown,
  playable: true as boolean | null,
  /** The stand-in shows only the top of Documents: the rule the sweep had on develop, pinned whatever it becomes. */
  topLevelOnly: false,
}));

vi.mock('expo-file-system', async () => {
  const fs = await import('node:fs');
  const p = await import('node:path');
  const toPath = (u: string) => decodeURIComponent(u.replace(/^file:\/\//, ''));
  const joined = (parts: unknown[]) => {
    const segs = parts.map((x) => (typeof x === 'string' ? x : (x as { uri: string }).uri));
    return `file://${p.join(toPath(segs[0]), ...segs.slice(1).map(toPath))}`;
  };
  class File {
    uri: string;
    constructor(...parts: unknown[]) {
      this.uri = joined(parts);
    }
    get exists() {
      return fs.existsSync(toPath(this.uri)) && fs.statSync(toPath(this.uri)).isFile();
    }
    get size() {
      return fs.statSync(toPath(this.uri)).size;
    }
    get creationTime() {
      return fs.statSync(toPath(this.uri)).birthtimeMs;
    }
    get modificationTime() {
      return fs.statSync(toPath(this.uri)).mtimeMs;
    }
  }
  class Directory {
    uri: string;
    constructor(...parts: unknown[]) {
      this.uri = joined(parts);
    }
    get exists() {
      return fs.existsSync(toPath(this.uri));
    }
    list(): (File | Directory)[] {
      const dir = toPath(this.uri);
      if (env.topLevelOnly && p.resolve(dir) !== p.resolve(env.docs)) return [];
      if (!fs.existsSync(dir)) return [];
      return fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((d) => !(env.topLevelOnly && d.isDirectory()))
        .map((d) => (d.isDirectory() ? new Directory(`file://${p.join(dir, d.name)}`) : new File(`file://${p.join(dir, d.name)}`)));
    }
  }
  return { File, Directory, Paths: { get document() { return new Directory(`file://${env.docs}`); } } };
});

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

/** The store facade the sweep calls, delegating to the repositories exactly as `src/lib/store.ts` does. */
vi.mock('../src/lib/store', async () => {
  const r = await import('../src/lib/db/repos');
  const c = () => env.ctx as RepoContext;
  return {
    audioRows: () => ({ drafts: r.drafts.audioRows(c()), entries: r.entries.audioRows(c()) }),
    deleteDraft: (id: string) => r.drafts.remove(c(), id),
    finalizeDraftAudio: (id: string, f: Parameters<typeof r.drafts.finalizeAudio>[2]) => r.drafts.finalizeAudio(c(), id, f),
    getActiveChildId: () => {
      const id = r.settings.getSetting(c(), 'activeChildId');
      const all = r.children.listVisible(c());
      return all.find((x) => x.id === id)?.id ?? all[0]?.id ?? null;
    },
    getDraft: (id: string) => r.drafts.get(c(), id),
    listOrphanAudio: () => r.orphans.list(c()),
    reattachOrphanAudio: (name: string, input: Parameters<typeof r.orphans.reattach>[2]) => r.orphans.reattach(c(), name, input),
    rebaseAudioUri: (table: 'drafts' | 'entries', id: string, uri: string) =>
      table === 'drafts' ? r.drafts.rebaseAudioUri(c(), id, uri) : r.entries.rebaseAudioUri(c(), id, uri),
    reportOrphanAudio: (name: string, bytes: number | null) => r.orphans.report(c(), name, bytes),
  };
});
vi.mock('../src/lib/capture/recorder', async () => {
  const fs = await import('node:fs');
  const { createHash: hash } = await import('node:crypto');
  return {
    activeTakeId: () => null,
    hashAudioFile: async (uri: string | null) => {
      const path = uri ? decodeURIComponent(uri.replace(/^file:\/\//, '')) : '';
      if (!path || !fs.existsSync(path)) return null;
      const data = fs.readFileSync(path);
      return { sha256: hash('sha256').update(data).digest('hex'), bytes: data.byteLength };
    },
  };
});
vi.mock('../src/lib/capture/probe', () => ({ probePlayable: async () => env.playable }));
vi.mock('../src/lib/capture/erase', () => ({ purgeShelfAtLaunch: () => {} }));

const ROOT = mkdtempSync(join(tmpdir(), 'qa-kill-harness-'));
afterAll(() => rmSync(ROOT, { recursive: true, force: true }));

type Behaviour = 'atomic' | 'non-atomic' | 'ignores-plants' | 'never-arms' | 'record-fails' | 'dies-after-kill-2' | 'hangs-after-run-2' | 'damages-run-2' | 'launch-throws';
interface FakeOptions {
  /** Where the fake's recorder writes takes: expo-audio 57's `ExpoAudio`, or '' for the top of Documents. */
  takeDir?: string;
  topLevelOnly?: boolean;
  playable?: boolean;
  /** The launch of this run exits before its sweep: the app does not start again after the kill before it. */
  exitsAtLaunch?: number;
  /**
   * DL-01 takes as ADTS (`.aac`, ADR 0027): real frame headers on the framing of a real encoder, written at its bit
   * rate, so a kill cuts the file mid-frame as it would cut the recorder's. The stand-in afinfo opens every one and
   * prints an estimated duration that is wrong on purpose (99 s): the harness must count frames instead.
   */
  container?: 'm4a' | 'adts';
}

/** The real encoder's framing three times over (about 18 s), and how many of its bytes a millisecond of it holds. */
const ADTS_TAKE = concat(...[0, 1, 2].flatMap(() => REAL_FRAME_LENGTHS.map((len) => adtsFrame(len - 7))));
const ADTS_BYTES_PER_MS = REAL_FRAME_LENGTHS.reduce((n, len) => n + len, 0) / ((REAL_FRAME_LENGTHS.length * AAC_FRAME_SAMPLES * 1000) / 48000);
/** What afinfo prints for an ADTS file, with the path in its File line, as on a Mac (its duration is a stand-in). */
const fakeAfinfo = (path: string) =>
  [
    `File:           ${path}`,
    'File type ID:   adts',
    'Num Tracks:     1',
    '----',
    'Data format:     1 ch,  48000 Hz, aac (0x00000000) 0 bits/channel, 0 bytes/packet, 1024 frames/packet, 0 frames/packet',
    '                no channel layout.',
    'estimated duration: 99.000000 sec',
    `audio bytes: ${statSync(path).size}`,
    'bit rate: 64000 bits per second',
    '----',
  ].join('\n');
interface LaunchArgs {
  mode: string;
  run: number;
  kind?: string;
  plant?: string;
  point?: string | null;
}
interface Proc {
  alive: boolean;
  timers: ReturnType<typeof setTimeout>[];
  close: () => void;
  ctx: RepoContext;
  /** Kills this process ignores before one takes (a launch hung where SIGKILL has not landed yet). */
  ignoreKills?: number;
}

const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex');

/** A container laid out like the simulator app's data container. */
function container(name: string) {
  const data = join(ROOT, name, 'data');
  const docs = join(data, 'Documents');
  const marks = join(data, 'Library', 'Caches', logic.MARKER_DIR);
  const dbPath = join(docs, 'SQLite', 'scribe.db');
  return { data, docs, marks, dbPath };
}

function openCtx(dbPath: string): { ctx: RepoContext; close: () => void } {
  const { db, close } = nodeDb(dbPath);
  const ctx: RepoContext = {
    db,
    now: () => new Date().toISOString(),
    newId: (atMs?: number) => uuidv7From(randomBytes(16), atMs ?? Date.now()),
  };
  migrate(db, { now: ctx.now(), newId: () => ctx.newId() });
  return { ctx, close };
}

const drillEntry = (id: string, text: string, childId: string, audio: { uri: string | null; sha256: string | null; bytes: number | null }): Entry => ({
  id,
  kind: 'letter',
  occurredOn: '2026-10-16',
  capturedAt: new Date().toISOString(),
  captureMode: audio.uri ? 'spoken' : 'typed',
  editLevel: 'verbatim',
  promptKey: null,
  engineVersion: 1,
  rawTranscript: text,
  machineEdits: [],
  finalText: text,
  inBook: true,
  soundsLikeMe: null,
  childId,
  authorSignsAs: 'Mama',
  audioUri: audio.uri,
  audioDurationMs: null,
  audioSha256: audio.sha256,
  audioBytes: audio.bytes,
});

/** A fake of the e2e app with the kill drill seam, for the harness's driver interface. */
function fakeDriver(name: string, behaviour: Behaviour = 'atomic', fo: FakeOptions = {}) {
  const c = container(name);
  const takeDir = fo.takeDir ?? '';
  const takes = takeDir ? join(c.docs, takeDir) : c.docs;
  const procs = new Map<number, Proc>();
  let nextPid = 100;
  let launches = 0;
  let killsSoFar = 0;
  const later = (p: Proc, ms: number, fn: () => void | Promise<void>) => {
    p.timers.push(
      setTimeout(() => {
        if (p.alive) void fn();
      }, ms),
    );
  };
  const mark = (kind: logic.MarkerKind, run: number, body: object) => writeFileSync(join(c.marks, logic.markerName(kind, run)), JSON.stringify(body));
  const waitGo = (p: Proc, run: number, then: () => void) => {
    const tick = () => (existsSync(join(c.marks, logic.markerName('go', run))) ? then() : later(p, 5, tick));
    tick();
  };

  const boot = async (p: Proc, a: LaunchArgs) => {
    const { ctx } = p;
    settings.setSetting(ctx, 'ageGate.passed', '1');
    if (children.listVisible(ctx).length === 0) {
      const id = ctx.newId();
      children.insert(ctx, id, { name: 'Asha', birthday: '2026-06-01', dueDate: null, signsAs: 'Mama' });
      settings.setSetting(ctx, 'activeChildId', id);
    }
    const childId = children.listVisible(ctx)[0].id;
    if (behaviour === 'damages-run-2' && a.run === 4) {
      // A later launch damages an earlier letter's recording.
      const f = join(takes, logic.drillAudioName(2));
      if (existsSync(f)) writeFileSync(f, randomBytes(4096));
    }
    // The app's own launch sweep, fresh for this process (it runs once per process in the app too).
    env.ctx = ctx;
    env.docs = c.docs;
    env.playable = fo.playable ?? true;
    env.topLevelOnly = Boolean(fo.topLevelOnly);
    vi.resetModules();
    const { runLaunchSweep } = await import('../src/lib/capture/sweep');
    const report = await runLaunchSweep();
    if (!p.alive) return;
    mark('boot', a.run, { run: a.run, mode: a.mode, swept: report !== null, sweep: report ?? {} });
    if (behaviour === 'never-arms' || (a.mode !== 'dl01' && a.mode !== 'dl02')) return;
    waitGo(p, a.run, () => drill(p, a, childId));
  };

  const drill = (p: Proc, a: LaunchArgs, childId: string) => {
    const { ctx } = p;
    const plant = behaviour === 'ignores-plants' ? 'none' : (a.plant ?? 'none');
    const defaults = { childId, authorSignsAs: 'Mama' };
    const holdAt = (point: string) => mark('point', a.run, { run: a.run, point });
    if (a.mode === 'dl02') {
      const text = logic.drillText(a.run);
      const draftId = ctx.newId();
      let audio = { uri: null as string | null, sha256: null as string | null, bytes: null as number | null };
      const spoken = a.kind !== 'typed';
      const path = join(takes, logic.drillAudioName(a.run));
      if (!spoken) {
        drafts.insert(ctx, draftId, { childId, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: text });
      } else if (a.point) {
        // As Listen: the draft row exists before the file.
        mkdirSync(takes, { recursive: true });
        drafts.insert(ctx, draftId, { childId, captureMode: 'spoken', promptKey: null, audioUri: `file://${path}`, audioDurationMs: 0, state: 'recording' });
        drafts.setTranscriptOnce(ctx, draftId, text);
      } else {
        mkdirSync(takes, { recursive: true });
        copyFileSync(join(c.marks, logic.FIXTURE_FILE), path);
        audio = { uri: `file://${path}`, sha256: sha(path), bytes: statSync(path).size };
        const hashed = a.kind === 'spoken';
        drafts.insert(ctx, draftId, { childId, captureMode: 'spoken', promptKey: null, audioUri: audio.uri, audioDurationMs: null, state: 'ready', audioSha256: hashed ? audio.sha256 : null, audioBytes: hashed ? audio.bytes : null });
        drafts.setTranscriptOnce(ctx, draftId, text);
      }
      const armed = { run: a.run, mode: 'dl02', kind: a.kind, plant, point: a.point ?? null, draftId, audioFile: spoken ? logic.drillAudioName(a.run) : null, text, sha256: audio.sha256, recordedMs: null };
      if (a.point) {
        mark('armed', a.run, armed);
        if (spoken) {
          copyFileSync(join(c.marks, logic.FIXTURE_FILE), path);
          if (a.point === 'after-file-write') return holdAt(a.point);
          drafts.finalizeAudio(ctx, draftId, { audioUri: `file://${path}`, sha256: sha(path), bytes: statSync(path).size, state: 'ready' });
          audio = { uri: `file://${path}`, sha256: sha(path), bytes: statSync(path).size };
        }
        // before-row and inside-transaction: nothing committed when the kill comes (node:sqlite cannot be killed mid-transaction).
        if (a.point === 'before-row' || a.point === 'inside-transaction') return holdAt(a.point);
        letters.saveFromDraft(ctx, draftId, drillEntry(draftId, text, childId, audio), defaults, true);
        return holdAt(a.point);
      }
      const entry = drillEntry(draftId, text, childId, audio);
      // Plants are in place before the drill arms, as in src/dev/kill-drill.ts; so is this fake's bug.
      if (plant === 'double') {
        entries.upsert(ctx, entry, defaults);
        return mark('armed', a.run, armed);
      }
      if (plant === 'damage') {
        letters.saveFromDraft(ctx, draftId, entry, defaults, true);
        const bytes = readFileSync(path);
        bytes[bytes.length >> 1] ^= 0xff;
        writeFileSync(path, bytes);
        return mark('armed', a.run, armed);
      }
      if (plant === 'loss' || behaviour === 'non-atomic') {
        drafts.remove(ctx, draftId);
        later(p, 1000, () => entries.upsert(ctx, entry, defaults));
        return mark('armed', a.run, armed);
      }
      mark('armed', a.run, armed);
      // The save lands a little after Save, so some kills come before the commit and some after.
      later(p, (a.run * 7) % 25, () => {
        letters.saveFromDraft(ctx, draftId, entry, defaults, true);
        mark('done', a.run, { run: a.run });
      });
      return;
    }
    if (behaviour === 'record-fails') return mark('error', a.run, { run: a.run, code: 'record_failed' });
    // DL-01: a take that grows while it records (one byte a millisecond; the fake's player reads its length from that).
    // As ADTS: frames at a real encoder's bit rate, appended in pieces that end anywhere, so a kill cuts a frame.
    mkdirSync(takes, { recursive: true });
    const adts = fo.container === 'adts';
    const takeName = `recording-${a.run}.${adts ? 'aac' : 'm4a'}`;
    const path = join(takes, takeName);
    let written = adts ? Math.round(250 * ADTS_BYTES_PER_MS) : 0;
    writeFileSync(path, adts ? ADTS_TAKE.subarray(0, written) : randomBytes(250));
    const draftId = ctx.newId();
    drafts.insert(ctx, draftId, { childId, captureMode: 'spoken', promptKey: null, audioUri: `file://${path}`, audioDurationMs: 0, state: 'recording' });
    if (plant === 'loss') rmSync(path, { force: true });
    if (plant === 'double') {
      for (let i = 0; i < 2; i += 1) entries.upsert(ctx, drillEntry(ctx.newId(), logic.drillText(a.run), childId, { uri: `file://${path}`, sha256: null, bytes: null }), defaults);
    }
    mark('armed', a.run, { run: a.run, mode: 'dl01', kind: null, plant, point: null, draftId, audioFile: takeName, text: null, sha256: null, recordedMs: 250 });
    const step = Math.round(10 * ADTS_BYTES_PER_MS);
    const grow = () => {
      if (existsSync(path)) {
        if (!adts) appendFileSync(path, randomBytes(10));
        else if (written < ADTS_TAKE.length) {
          appendFileSync(path, ADTS_TAKE.subarray(written, written + step));
          written += step;
        }
      }
      later(p, 10, grow);
    };
    if (plant !== 'loss') later(p, 10, grow);
  };

  const stop = (pid: number) => {
    const p = procs.get(pid);
    if (!p || !p.alive) return false;
    p.alive = false;
    for (const t of p.timers) clearTimeout(t);
    p.close();
    return true;
  };

  return {
    name: 'fake',
    container: c,
    async info() {
      return { simulator: 'fake', version: '1.0.0', build: '1', commit: 'test', bundleId: 'com.example.dev' };
    },
    async reset() {
      rmSync(c.data, { recursive: true, force: true });
      mkdirSync(c.marks, { recursive: true });
      mkdirSync(join(c.docs, 'SQLite'), { recursive: true });
      writeFileSync(join(c.marks, logic.FIXTURE_FILE), randomBytes(4096));
    },
    fixtureSha256: () => sha(join(c.marks, logic.FIXTURE_FILE)),
    writeGo: (run: number) => writeFileSync(join(c.marks, logic.markerName('go', run)), JSON.stringify({ run })),
    async launch(a: LaunchArgs) {
      launches += 1;
      if (behaviour === 'launch-throws' && a.run === 3) throw new Error('xcrun simctl launch failed');
      const pid = (nextPid += 1);
      const { ctx, close } = openCtx(c.dbPath);
      const p: Proc = { alive: true, timers: [], close, ctx };
      procs.set(pid, p);
      if (behaviour === 'dies-after-kill-2' && killsSoFar === 2 && a.mode !== 'setup') {
        // The app cannot start again after run 2's kill.
        later(p, 5, () => {
          stop(pid);
        });
        return pid;
      }
      if (fo.exitsAtLaunch === a.run) {
        later(p, 5, () => {
          stop(pid);
        });
        return pid;
      }
      if (behaviour === 'hangs-after-run-2' && a.run === 3) {
        // The launch after run 2's kill hangs before its sweep, and the first SIGKILL has not landed when the harness looks.
        p.ignoreKills = 1;
        return pid;
      }
      later(p, 5, () => boot(p, a));
      return pid;
    },
    readMarker(kind: logic.MarkerKind, run: number) {
      const path = join(c.marks, logic.markerName(kind, run));
      return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
    },
    alive: (pid: number) => procs.get(pid)?.alive ?? false,
    kill: async (pid: number) => {
      const p = procs.get(pid);
      if (p?.alive && p.ignoreKills) {
        p.ignoreKills -= 1;
        return true;
      }
      const was = stop(pid);
      if (was && launches > 1) killsSoFar += 1;
      return was;
    },
    terminate: async (pid: number) => {
      stop(pid);
    },
    snapshot: () => readSnapshot({ dataDir: c.data }),
    sha256: sha256OfFile,
    playable: (path: string) =>
      fo.playable === false
        ? { ok: false, durationS: null }
        : path.endsWith('.aac')
          ? { ok: true, durationS: 99, text: fakeAfinfo(path) }
          : { ok: true, durationS: statSync(path).size / 1000 },
    cleanup: async () => {},
  };
}

/**
 * Each fake launch imports the app's sweep afresh (vi.resetModules), which a busy CI runner can stretch past 4 s:
 * on #252's CI (run 40034060676) the self-check's last relaunch did, the harness judged that launch as not started,
 * and the damage plant it was judging was reported missed. GitHub Actions sets CI on every job. A wait ends as soon
 * as the launch boots, so the wider budget costs a green run nothing; the tests that time a launch out set their own.
 */
const fast = { bootMs: process.env.CI ? 30_000 : 4000, armMs: 4000, pointMs: 4000 };

describe('[DATA-REQ-048] [F04-REQ-024] the kill drill protocol is one protocol on both sides', () => {
  it('app and host agree on every name, folder and constant', () => {
    expect(protocol.DRILL_MODES).toEqual([...logic.DRILL_MODES]);
    expect(protocol.DRILL_KINDS).toEqual([...logic.DRILL_KINDS]);
    expect(protocol.DRILL_PLANTS).toEqual([...logic.DRILL_PLANTS]);
    expect(protocol.CRASH_POINTS).toEqual([...logic.CRASH_POINTS]);
    expect(protocol.POINT_EXPECTS).toEqual(logic.POINT_EXPECTS);
    expect(protocol.DRILL_ARG).toEqual(logic.DRILL_ARG);
    expect([protocol.MARKER_DIR, protocol.FIXTURE_FILE, protocol.TAKE_DIR, protocol.PLANT_LOSS_GAP_MS, protocol.POINT_HOLD_MS, protocol.DRILL_BUNDLE_SUFFIX]).toEqual([
      logic.MARKER_DIR,
      logic.FIXTURE_FILE,
      logic.TAKE_DIR,
      logic.PLANT_LOSS_GAP_MS,
      logic.POINT_HOLD_MS,
      logic.DRILL_BUNDLE_SUFFIX,
    ]);
    for (const run of [0, 7, 500, 9001]) {
      expect(protocol.drillText(run)).toBe(logic.drillText(run));
      expect(protocol.drillAudioName(run)).toBe(logic.drillAudioName(run));
      for (const k of ['boot', 'go', 'armed', 'point', 'done', 'error'] as const) expect(protocol.markerName(k, run)).toBe(logic.markerName(k, run));
    }
    expect(logic.drillText(3)).toBe('Asha kill drill 3');
  });

  it('the launch arguments the host passes are the ones the app reads, and anything else runs no drill', () => {
    const asDefaults = (argv: string[]) => {
      const m = new Map<string, string>();
      for (let i = 0; i < argv.length; i += 2) m.set(argv[i].replace(/^-/, ''), argv[i + 1]);
      return (k: string) => m.get(k);
    };
    for (const a of [
      { mode: 'dl02', run: 12, kind: 'spoken-unhashed', plant: 'none', point: null },
      { mode: 'dl02', run: 13, kind: 'spoken', plant: 'none', point: 'after-file-write' },
      { mode: 'dl02', run: 14, kind: 'typed', plant: 'none', point: 'inside-transaction' },
      { mode: 'dl02', run: 15, kind: 'spoken', plant: 'damage', point: null },
      { mode: 'dl01', run: 1, kind: 'typed', plant: 'loss', point: null },
      { mode: 'verify', run: 501, kind: 'typed', plant: 'none', point: null },
    ]) {
      expect(logic.parseDrillArgs(asDefaults(protocol.launchArgs(a)))).toEqual(a);
    }
    const no = (argv: string[]) => expect(logic.parseDrillArgs(asDefaults(argv))).toBeNull();
    expect(logic.parseDrillArgs(() => undefined)).toBeNull();
    no(['-e2eKillDrill', 'dl03', '-e2eKillRun', '1']);
    no(['-e2eKillDrill', 'dl02', '-e2eKillRun', '-1']);
    no(['-e2eKillDrill', 'dl02', '-e2eKillRun', '1x']);
    no(['-e2eKillDrill', 'dl02', '-e2eKillRun', '1', '-e2eKillPlant', 'lose']);
    no(['-e2eKillDrill', 'dl02', '-e2eKillRun', '1', '-e2eKillPoint', 'after-file-write']); // typed has no file
    no(['-e2eKillDrill', 'dl01', '-e2eKillRun', '1', '-e2eKillPoint', 'before-row']);
    no(['-e2eKillDrill', 'dl02', '-e2eKillRun', '1', '-e2eKillPlant', 'damage']); // typed has no recording to damage
    expect(logic.parseDrillArgs(asDefaults(['-e2eKillDrill', 'dl02', '-e2eKillRun', '4']))).toEqual({ mode: 'dl02', run: 4, kind: 'typed', plant: 'none', point: null });
  });
});

describe('the drill stays out of every build and every phone that is not a drill simulator (reviewer S, #203)', () => {
  const SRC = join(__dirname, '..', 'src');

  it('the seam is compiled in only with EXPO_PUBLIC_E2E=1 and an app env that is neither preview nor production', () => {
    const seams = readFileSync(join(SRC, 'dev', 'e2e-seams.ts'), 'utf8');
    expect(seams).toMatch(
      /process\.env\.EXPO_PUBLIC_E2E === '1' && process\.env\.EXPO_PUBLIC_APP_ENV !== 'preview' && process\.env\.EXPO_PUBLIC_APP_ENV !== 'production'\s*\?\s*\(require\('\.\/kill-drill'\)/,
    );
    expect(seams).not.toMatch(/^import .*kill-drill/m);
    const loaders: string[] = [];
    const walk = (d: string) => {
      for (const n of readdirSync(d)) {
        const p = join(d, n);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(n) && !p.endsWith(join('dev', 'e2e-seams.ts')) && !p.includes(join('dev', 'kill-drill')) && /['/]kill-drill['.]/.test(readFileSync(p, 'utf8'))) loaders.push(p);
      }
    };
    walk(SRC);
    expect(loaders).toEqual([]);
  }, 30_000);

  it('no store profile in eas.json and no .env file sets EXPO_PUBLIC_E2E', () => {
    const app = join(__dirname, '..');
    const eas = JSON.parse(readFileSync(join(app, 'eas.json'), 'utf8')) as { build: Record<string, { extends?: string; distribution?: string; env?: Record<string, string> }> };
    const resolve = (name: string, seen = new Set<string>()): { distribution?: string; env: Record<string, string> } => {
      const p = eas.build[name];
      if (!p || seen.has(name)) return { env: {} };
      seen.add(name);
      const base = p.extends ? resolve(p.extends, seen) : { env: {} };
      return { distribution: p.distribution ?? base.distribution, env: { ...base.env, ...(p.env ?? {}) } };
    };
    const offenders: string[] = [];
    for (const name of Object.keys(eas.build)) {
      const r = resolve(name);
      const store = ['preview', 'testflight', 'production'].includes(name) || r.distribution === 'store' || ['preview', 'production'].includes(r.env.EXPO_PUBLIC_APP_ENV);
      if (store && 'EXPO_PUBLIC_E2E' in r.env) offenders.push(`eas.json build.${name}`);
    }
    for (const f of readdirSync(app).filter((n) => n.startsWith('.env'))) {
      if (/EXPO_PUBLIC_E2E/.test(readFileSync(join(app, f), 'utf8'))) offenders.push(f);
    }
    expect(offenders).toEqual([]);
  });

  it('even compiled in, the drill arms only on a simulator, in the development bundle, on an install it made', () => {
    const base = { mode: 'dl02' as const, isDevice: false, bundleId: 'com.earlyletters.scribe.dev', drillBundleId: 'com.earlyletters.scribe.dev', hasChild: true, owned: true };
    expect(logic.decideDrillGuard(base)).toEqual({ ok: true });
    expect(logic.decideDrillGuard({ ...base, isDevice: true })).toEqual({ ok: false, code: 'refused_not_simulator' });
    expect(logic.decideDrillGuard({ ...base, isDevice: null })).toEqual({ ok: false, code: 'refused_not_simulator' });
    expect(logic.decideDrillGuard({ ...base, bundleId: 'com.earlyletters.scribe.preview' })).toEqual({ ok: false, code: 'refused_bundle_id' });
    expect(logic.decideDrillGuard({ ...base, bundleId: 'com.earlyletters.scribe' })).toEqual({ ok: false, code: 'refused_bundle_id' });
    expect(logic.decideDrillGuard({ ...base, owned: false })).toEqual({ ok: false, code: 'refused_not_drill_install' });
    // Setup claims only a fresh install: an install that already has a child and was not the drill's is refused.
    expect(logic.decideDrillGuard({ ...base, mode: 'setup', owned: false, hasChild: true })).toEqual({ ok: false, code: 'refused_not_drill_install' });
    expect(logic.decideDrillGuard({ ...base, mode: 'setup', owned: false, hasChild: false })).toEqual({ ok: true });
    const drill = readFileSync(join(SRC, 'dev', 'kill-drill.ts'), 'utf8');
    // The guard runs before the gate boolean, the child and the recorder.
    const guard = drill.indexOf('decideDrillGuard({');
    expect(guard).toBeGreaterThan(0);
    expect(guard).toBeLessThan(drill.indexOf("setSetting('ageGate.passed'"));
    expect(guard).toBeLessThan(drill.indexOf('addChild({'));
    expect(drill).toMatch(/const useDrillRecorder = ARGS\?\.mode === 'dl01' && PLACE_OK \? useRecorderForDrill : useNoRecorder;/);
  });

  it('the inside-transaction crash point still holds inside the save: the store removes the draft with the statement it watches', () => {
    const draftsSrc = readFileSync(join(SRC, 'lib', 'db', 'repos', 'drafts.ts'), 'utf8');
    const removeSql = /export function remove\([^)]*\): void \{\s*db\.run\('([^']+)'/.exec(draftsSrc)?.[1];
    expect(removeSql && logic.DRAFT_REMOVE.test(removeSql)).toBe(true);
    // And it runs inside the save's transaction, after the letter is written.
    const lettersSrc = readFileSync(join(SRC, 'lib', 'db', 'repos', 'letters.ts'), 'utf8');
    expect(lettersSrc).toMatch(/ctx\.db\.transaction\(\(\) => \{\s*entries\.upsert\(ctx, \{ \.\.\.e, id: draftId \}, defaults\);\s*drafts\.remove\(ctx, draftId\);/);
    // Behaviour, on a real engine: the statement is issued with the draft id while the letter row already exists.
    const c = container('point-statement');
    mkdirSync(join(c.docs, 'SQLite'), { recursive: true });
    const { ctx, close } = openCtx(c.dbPath);
    const childId = ctx.newId();
    children.insert(ctx, childId, { name: 'Asha', birthday: '2026-06-01', dueDate: null, signsAs: 'Mama' });
    const id = ctx.newId();
    drafts.insert(ctx, id, { childId, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'x' });
    const seen: boolean[] = [];
    const run = ctx.db.run;
    ctx.db.run = (sql, ...params) => {
      run(sql, ...params);
      if (logic.DRAFT_REMOVE.test(sql) && params[0] === id) seen.push(ctx.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM entries WHERE id = ?', id)?.n === 1);
    };
    letters.saveFromDraft(ctx, id, drillEntry(id, 'x', childId, { uri: null, sha256: null, bytes: null }), { childId, authorSignsAs: 'Mama' });
    ctx.db.run = run;
    expect(seen).toEqual([true]);
    close();
  }, 30_000);
});

describe('[DATA-REQ-048] the oracle judges a run from the database and files alone', () => {
  const setup = (name: string) => {
    const c = container(name);
    const takes = join(c.docs, logic.TAKE_DIR);
    mkdirSync(join(c.docs, 'SQLite'), { recursive: true });
    mkdirSync(takes, { recursive: true });
    const { ctx, close } = openCtx(c.dbPath);
    const childId = ctx.newId();
    children.insert(ctx, childId, { name: 'Asha', birthday: '2026-06-01', dueDate: null, signsAs: 'Mama' });
    const defaults = { childId, authorSignsAs: 'Mama' };
    const io = { sha256: sha256OfFile, playable: (p: string) => ({ ok: true as boolean | null, durationS: statSync(p).size / 1000 }) };
    return { c, takes, ctx, close, childId, defaults, io };
  };

  it('DL-02 typed: once as a letter, intact as a draft, both, or neither; a crash point expects one of the two', () => {
    const { c, ctx, close, childId, defaults, io } = setup('oracle-typed');
    const armedFor = (run: number, draftId: string) => ({ draftId, kind: 'typed', text: logic.drillText(run), audioFile: null, sha256: null });
    const ids = [1, 2, 3, 4].map(() => ctx.newId());
    for (const [i, id] of ids.entries()) {
      drafts.insert(ctx, id, { childId, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: logic.drillText(i + 1) });
    }
    letters.saveFromDraft(ctx, ids[0], drillEntry(ids[0], logic.drillText(1), childId, { uri: null, sha256: null, bytes: null }), defaults);
    entries.upsert(ctx, drillEntry(ids[2], logic.drillText(3), childId, { uri: null, sha256: null, bytes: null }), defaults);
    drafts.remove(ctx, ids[3]);
    const snap = readSnapshot({ dataDir: c.data });
    expect(snap.integrity).toBe('ok');
    expect(classifyDl02(snap, armedFor(1, ids[0]), io).outcome).toBe('letter');
    expect(classifyDl02(snap, armedFor(2, ids[1]), io).outcome).toBe('draft');
    expect(classifyDl02(snap, armedFor(3, ids[2]), io).outcome).toBe('doubled');
    expect(classifyDl02(snap, armedFor(4, ids[3]), io).outcome).toBe('lost');
    expect(classifyDl02(snap, armedFor(1, ids[0]), io, { outcome: 'letter', point: 'after-commit' }).outcome).toBe('letter');
    expect(classifyDl02(snap, armedFor(2, ids[1]), io, { outcome: 'letter', point: 'after-commit' })).toMatchObject({ outcome: 'fail', reasons: [expect.stringContaining('after-commit')] });
    close();
  }, 30_000);

  it('DL-02 spoken: a changed or missing recording is never a pass, judged against the host fixture hash', () => {
    const { c, takes, ctx, close, childId, defaults, io } = setup('oracle-spoken');
    const fixture = randomBytes(1024);
    const fixtureSha = createHash('sha256').update(fixture).digest('hex');
    const make = (run: number) => {
      const path = join(takes, logic.drillAudioName(run));
      writeFileSync(path, fixture);
      const audio = { uri: `file://${path}`, sha256: sha(path), bytes: 1024 };
      const id = ctx.newId();
      drafts.insert(ctx, id, { childId, captureMode: 'spoken', promptKey: null, audioUri: audio.uri, audioDurationMs: null, state: 'ready', audioSha256: audio.sha256, audioBytes: 1024 });
      drafts.setTranscriptOnce(ctx, id, logic.drillText(run));
      letters.saveFromDraft(ctx, id, drillEntry(id, logic.drillText(run), childId, audio), defaults);
      // The app's own hash claim is ignored: the host's fixture hash is the reference.
      return { id, path, armed: { draftId: id, kind: 'spoken', text: logic.drillText(run), audioFile: logic.drillAudioName(run), sha256: 'the app said so' } };
    };
    const ok = make(1);
    const changed = make(2);
    const gone = make(3);
    writeFileSync(changed.path, randomBytes(1024));
    rmSync(gone.path);
    const snap = readSnapshot({ dataDir: c.data });
    expect(classifyDl02(snap, ok.armed, io, { fixtureSha }).outcome).toBe('letter');
    expect(classifyDl02(snap, changed.armed, io, { fixtureSha })).toMatchObject({ outcome: 'fail', reasons: expect.arrayContaining(['the recording changed']) });
    expect(classifyDl02(snap, gone.armed, io, { fixtureSha }).outcome).toBe('lost');
    close();
  }, 30_000);

  it('DL-01: kept means one row, a file with bytes, and a take that plays', () => {
    const { c, takes, ctx, close, childId, defaults, io } = setup('oracle-take');
    const take = (n: number, state: 'recording' | 'ready' | 'unrecoverable', withHash = true) => {
      const path = join(takes, `recording-${n}.m4a`);
      writeFileSync(path, randomBytes(30000));
      const id = ctx.newId();
      drafts.insert(ctx, id, { childId, captureMode: 'spoken', promptKey: null, audioUri: `file://${path}`, audioDurationMs: 0, state, audioSha256: withHash ? sha(path) : null, audioBytes: 30000 });
      return { id, path, armed: { draftId: id, audioFile: `recording-${n}.m4a` } };
    };
    const ready = take(1, 'ready');
    const unplayable = take(2, 'unrecoverable', false);
    const stuck = take(3, 'recording');
    const dropped = take(4, 'recording');
    drafts.remove(ctx, dropped.id);
    const twice = take(5, 'ready');
    entries.upsert(ctx, drillEntry(ctx.newId(), 'x', childId, { uri: `file://${twice.path}`, sha256: null, bytes: null }), defaults);
    const silent = take(6, 'ready');
    const noHash = take(7, 'ready', false);
    const snap = readSnapshot({ dataDir: c.data });
    expect(classifyDl01(snap, ready.armed, io, { expectedMs: 29000 })).toMatchObject({ outcome: 'kept-playable', within5s: true });
    expect(classifyDl01(snap, ready.armed, io, { expectedMs: 40000 })).toMatchObject({ outcome: 'kept-playable', within5s: false });
    expect(classifyDl01(snap, unplayable.armed, io).outcome).toBe('kept-unplayable');
    expect(classifyDl01(snap, stuck.armed, io).outcome).toBe('fail');
    expect(classifyDl01(snap, dropped.armed, io)).toMatchObject({ outcome: 'lost', reasons: [expect.stringContaining('not on Tonight')] });
    expect(classifyDl01(snap, twice.armed, io).outcome).toBe('doubled');
    expect(classifyDl01(snap, silent.armed, { ...io, playable: () => ({ ok: false, durationS: null }) })).toMatchObject({ outcome: 'fail', reasons: [expect.stringContaining('F08-REQ-019')] });
    expect(classifyDl01(snap, noHash.armed, io)).toMatchObject({ outcome: 'fail', reasons: ['marked ready with no hash'] });
    close();
  }, 30_000);

  it('[ADR 0027] DL-01 ADTS: a take is judged by its whole frames, never by afinfo\'s estimate, and its tail is recorded', () => {
    const { c, takes, ctx, close, childId } = setup('oracle-adts');
    const frameS = AAC_FRAME_SAMPLES / 48000;
    const real = concat(...REAL_FRAME_LENGTHS.map((len) => adtsFrame(len - 7)));
    const take = (n: number, bytes: Uint8Array, state: 'ready' | 'unrecoverable' = 'ready', dir = takes) => {
      const path = join(dir, `recording-${n}.aac`);
      writeFileSync(path, bytes);
      const id = ctx.newId();
      drafts.insert(ctx, id, { childId, captureMode: 'spoken', promptKey: null, audioUri: `file://${path}`, audioDurationMs: 0, state, audioSha256: state === 'ready' ? sha(path) : null, audioBytes: bytes.length });
      return { id, path, armed: { draftId: id, audioFile: `recording-${n}.aac` } };
    };
    // afinfo opens a cut-off ADTS stream and estimates a duration from the bytes: 99 s here, whatever the frames.
    const afinfo = (p: string) => ({ ok: true as boolean | null, durationS: 99, text: fakeAfinfo(p) });
    const io = { sha256: sha256OfFile, playable: afinfo };
    const killed = take(1, concat(real, adtsFrame(170).subarray(0, 60))); // a kill cut the next frame after 60 bytes
    const headerOnly = take(2, adtsFrame(170).subarray(0, 60), 'unrecoverable'); // the first frame cut off: no whole frame
    const m4a = take(3, concat(new Uint8Array([0, 0, 0, 0x20]), new TextEncoder().encode('ftypM4A '), new Uint8Array(400)), 'unrecoverable');
    const damaged = real.slice();
    damaged[REAL_FRAME_LENGTHS.slice(0, -20).reduce((n, len) => n + len, 0)] = 0x00; // the sync byte of the frame 20 from the end
    const broken = take(4, damaged);
    const snap = readSnapshot({ dataDir: c.data });
    const lengthS = REAL_FRAME_LENGTHS.length * frameS;
    const v = classifyDl01(snap, killed.armed, io, { expectedMs: lengthS * 1000 + 3000 });
    expect(v).toMatchObject({ outcome: 'kept-playable', container: 'adts', storedPath: 'same', afinfoOpens: true, afinfoDurationS: 99, deviationMs: 3000, within5s: true });
    expect(v.durationS).toBeCloseTo(lengthS, 9);
    expect(v.adts).toMatchObject({ adts: true, frames: REAL_FRAME_LENGTHS.length, tailBytes: 60, tail: 'cut', framesAfterBreak: 0 });
    expect(v.afinfo).toContain('File:           (this take)');
    expect(v.afinfo).not.toContain('recording-1');
    // afinfo's estimate would have been 96 s off the kill point; the frames are 3 s off.
    expect(classifyDl01(snap, killed.armed, io, { expectedMs: lengthS * 1000 + 6000 }).within5s).toBe(false);
    // afinfo opens it, but there is not one whole frame: it does not play.
    expect(classifyDl01(snap, headerOnly.armed, io)).toMatchObject({ outcome: 'kept-unplayable', playable: false, adts: { frames: 0, tail: 'cut', tailBytes: 60 } });
    // An M4A under an .aac name is not the container ADR 0027 asks for: it does not count as playing.
    expect(classifyDl01(snap, m4a.armed, io)).toMatchObject({ outcome: 'kept-unplayable', playable: false, reasons: ['named .aac, but its bytes are not an ADTS stream'], adts: { adts: false, ftypAt4: true } });
    // A break is recorded, as a finding to report before any flip; the frames before it are what a reader is sure to reach.
    const b = classifyDl01(snap, broken.armed, io);
    expect(b).toMatchObject({ outcome: 'kept-playable', adts: { tail: 'break', frames: REAL_FRAME_LENGTHS.length - 20, framesAfterBreak: 19 } });
    expect(b.durationS).toBeCloseTo((REAL_FRAME_LENGTHS.length - 20) * frameS, 9);
    expect(v1Findings(b.adts)).toEqual([expect.stringMatching(/^the tail is a break \(\d+ bytes after the last whole frame, 19 frames after it\)$/)]);
    // When afinfo cannot open it, it does not play, whatever its frames; a take shown as ready then fails.
    expect(classifyDl01(snap, killed.armed, { ...io, playable: () => ({ ok: false, durationS: null }) })).toMatchObject({ outcome: 'fail', reasons: [expect.stringContaining('F08-REQ-019')] });
    // An M4A is judged exactly as before: afinfo's duration, no frame facts.
    expect(containerOfName('recording-1.m4a')).toBe('m4a');
    close();
  }, 30_000);

  it('DL-01: the row must point at the very take on disk, not only at a file of the same name', () => {
    const { c, takes, ctx, close, childId } = setup('oracle-path');
    const io = { sha256: sha256OfFile, playable: (p: string) => ({ ok: true as boolean | null, durationS: statSync(p).size / 1000 }) };
    const row = (name: string, uri: string) => {
      const id = ctx.newId();
      drafts.insert(ctx, id, { childId, captureMode: 'spoken', promptKey: null, audioUri: uri, audioDurationMs: 0, state: 'unrecoverable' });
      return { draftId: id, audioFile: name };
    };
    // The file lives in Documents/ExpoAudio; the row says the top of Documents. The host lists it by name anywhere.
    writeFileSync(join(takes, 'recording-1.m4a'), randomBytes(3000));
    const wrongFolder = row('recording-1.m4a', `file://${join(c.docs, 'recording-1.m4a')}`);
    // Two folders hold the name; the row points at one of them, which is the one judged.
    writeFileSync(join(takes, 'recording-2.m4a'), randomBytes(3000));
    writeFileSync(join(c.docs, 'recording-2.m4a'), randomBytes(0));
    const both = row('recording-2.m4a', `file://${join(takes, 'recording-2.m4a')}`);
    // The same folder and file under Documents, behind another container path (percent-encoded, as a URI may be).
    writeFileSync(join(takes, 'recording 3.m4a'), randomBytes(3000));
    const moved = row('recording 3.m4a', 'file:///private/var/mobile/Containers/Data/Application/0000/Documents/ExpoAudio/recording%203.m4a');
    const snap = readSnapshot({ dataDir: c.data });
    expect(classifyDl01(snap, wrongFolder, io)).toMatchObject({ outcome: 'fail', storedPath: 'other', reasons: [expect.stringContaining('stored path is not the path of the take on disk')] });
    expect(classifyDl01(snap, both, io)).toMatchObject({ outcome: 'kept-unplayable', storedPath: 'same', durationS: 3 }); // the 3000-byte take, not the empty one
    expect(classifyDl01(snap, moved, io)).toMatchObject({ outcome: 'kept-unplayable', storedPath: 'other-container', reasons: [expect.stringContaining('another container path')] });
    expect(storedPathOf('file:///a/Documents/ExpoAudio/recording%203.aac?x=1')).toBe('/a/Documents/ExpoAudio/recording 3.aac');
    expect(storedPathAgainst(null, '/a/Documents/x.aac', '/a/Documents')).toBe('other');
    close();
  }, 30_000);

  it('the whole-database audit: integrity, rows pointing at missing files, stored hashes, and earlier letters judged again', () => {
    const { c, takes, ctx, close, childId, defaults, io } = setup('oracle-audit');
    const path = join(takes, logic.drillAudioName(1));
    writeFileSync(path, randomBytes(512));
    const id = ctx.newId();
    const audio = { uri: `file://${path}`, sha256: sha(path), bytes: 512 };
    drafts.insert(ctx, id, { childId, captureMode: 'spoken', promptKey: null, audioUri: audio.uri, audioDurationMs: null, state: 'ready', audioSha256: audio.sha256, audioBytes: 512 });
    drafts.setTranscriptOnce(ctx, id, logic.drillText(1));
    letters.saveFromDraft(ctx, id, drillEntry(id, logic.drillText(1), childId, audio), defaults);
    const armed = { draftId: id, kind: 'spoken', text: logic.drillText(1), audioFile: logic.drillAudioName(1), sha256: audio.sha256 };
    const kept = [{ run: 1, outcome: 'letter', armed, expect: {} }];
    const none = { mode: 'dl02' as const, kept, badIds: new Set<string>(), badFiles: new Set<string>() };
    expect(auditStore(readSnapshot({ dataDir: c.data }), io, none)).toEqual([]);
    expect(auditStore({ ...readSnapshot({ dataDir: c.data }), integrity: '*** in database main *** Page 3: btree error' }, io, none)).toEqual([
      { run: null, reason: 'PRAGMA integrity_check: *** in database main *** Page 3: btree error' },
    ]);
    writeFileSync(path, randomBytes(512));
    const after = auditStore(readSnapshot({ dataDir: c.data }), io, none);
    expect(after.map((p) => p.reason)).toEqual(['a stored hash differs from its file', expect.stringMatching(/^run 1, judged letter earlier, is now fail/)]);
    rmSync(path);
    expect(auditStore(readSnapshot({ dataDir: c.data }), io, { ...none, kept: [] })).toEqual([{ run: null, reason: 'a letter points at a missing file' }]);
    close();
  }, 30_000);
});

describe('[DATA-REQ-048] [F04-REQ-024] the harness cannot pass vacuously, and never loses a failure', () => {
  it('DL-02 on a correct app: random and crash-point kills all kept once, every planted failure caught', async () => {
    const report = await runHarness({ driver: fakeDriver('dl02-ok'), mode: 'dl02', runs: 6, pointRuns: 1, delayMs: [0, 30], selfCheck: 1, seed: 7, timeouts: fast });
    expect(report.selfCheck).toMatchObject({ asked: 3, caught: 3, missed: [] });
    const c = countsOf(report);
    expect(c.completed).toBe(10);
    expect(c.bad).toBe(0);
    expect(c.points).toEqual({ 'after-file-write': { runs: 1, bad: 0 }, 'before-row': { runs: 1, bad: 0 }, 'inside-transaction': { runs: 1, bad: 0 }, 'after-commit': { runs: 1, bad: 0 } });
    for (const r of report.runs.filter((x: { point: string | null }) => x.point)) expect(r.outcome).toBe((protocol.POINT_EXPECTS as Record<string, string>)[r.point]);
    expect(report.audits).toEqual([]);
    expect(report.exit).toBe(EXIT.pass);
    const md = renderMarkdown(report);
    expect(md).toContain('PASS');
    expect(md).toContain('at inside-transaction: 1 clean');
    expect(md).not.toMatch(/Asha kill drill|[0-9a-f]{8}-[0-9a-f]{4}-7/);
  }, 60_000);

  it('DL-02 on an app whose save is not atomic: the harness fails it', async () => {
    const report = await runHarness({ driver: fakeDriver('dl02-broken', 'non-atomic'), mode: 'dl02', runs: 4, pointRuns: 0, delayMs: [0, 30], selfCheck: 1, seed: 8, timeouts: fast });
    expect(report.selfCheck.caught).toBe(report.selfCheck.asked);
    expect(countsOf(report).lost).toBe(4);
    expect(report.exit).toBe(EXIT.fail);
  }, 60_000);

  it('an app that ignores the plants makes the harness stop as blind, before any real run', async () => {
    const report = await runHarness({ driver: fakeDriver('dl02-blind', 'ignores-plants'), mode: 'dl02', runs: 4, delayMs: [0, 30], selfCheck: 1, seed: 9, timeouts: fast });
    expect(report.selfCheck.missed.length).toBe(3);
    expect(report.runs).toEqual([]);
    expect(report.exit).toBe(EXIT.blind);
  }, 60_000);

  it('a drill that never arms is incomplete, never green', async () => {
    const report = await runHarness({ driver: fakeDriver('dl02-stuck', 'never-arms'), mode: 'dl02', runs: 3, delayMs: [0, 30], selfCheck: 1, seed: 10, timeouts: { ...fast, armMs: 300 } });
    expect(report.errors[0]).toMatchObject({ code: 'no_armed_marker' });
    expect(report.exit).toBe(EXIT.incomplete);
  }, 60_000);

  it('a relaunch that fails after a kill is a fail that names the run, the seed and the kill time', async () => {
    const report = await runHarness({ driver: fakeDriver('dl02-dies', 'dies-after-kill-2'), mode: 'dl02', runs: 4, pointRuns: 0, delayMs: [0, 30], selfCheck: 1, seed: 11, timeouts: fast });
    expect(report.exit).toBe(EXIT.fail);
    // The launch that does not start is the self-check's third, after the double plant: the database read once it
    // is gone holds that letter twice, so the plant counts as caught, and the series stops there.
    expect(report.selfCheck).toMatchObject({ asked: 3, caught: 2, missed: [] });
    const failed = report.runs.find((r: { outcome: string }) => r.outcome === 'fail');
    expect(failed?.reasons[0]).toMatch(/^the app did not start again after this kill \(app_exited\); seed 11, killed \d+ ms after it armed$/);
    // Reviewer H: whether the database survived, read once the failed launch is gone.
    expect(failed?.database).toMatchObject({ read: true, integrity: 'ok', problems: [] });
    expect(failed?.reasons[1]).toMatch(/^the database after the failed launch: integrity_check ok; this run is \w+ in it/);
  }, 60_000);

  it('a plant whose relaunch does not start still counts as caught when the database holds it as planted; the run is still a fail of the app', async () => {
    // The #252 CI flake, made certain: the launch after the damage plant (the self-check's last) never boots.
    const report = await runHarness({ driver: fakeDriver('dl02-sc-exits', 'atomic', { exitsAtLaunch: 9004 }), mode: 'dl02', runs: 4, pointRuns: 0, delayMs: [0, 30], selfCheck: 1, seed: 20, timeouts: fast });
    expect(report.selfCheck).toMatchObject({ asked: 3, caught: 3, missed: [] });
    expect(report.exit).toBe(EXIT.fail);
    const damage = report.runs.find((r: { run: number }) => r.run === 9003);
    expect(damage).toMatchObject({ plant: 'damage', outcome: 'fail', database: { read: true, run: 'fail', runReasons: expect.arrayContaining(['the recording changed']) } });
    expect(damage?.reasons[0]).toMatch(/^the app did not start again after this kill \(app_exited\); seed 20, /);
    const md = renderMarkdown(report);
    expect(md).toContain('FAIL');
    expect(md).toContain('| Self-check (planted failures) | 3 of 3 caught |');
    expect(md).not.toContain('Planted failures the harness missed');
  }, 60_000);

  it('a plant the app ignored is still missed when its relaunch does not start', async () => {
    const report = await runHarness({ driver: fakeDriver('dl02-sc-exits-blind', 'ignores-plants', { exitsAtLaunch: 9004 }), mode: 'dl02', runs: 4, pointRuns: 0, delayMs: [0, 30], selfCheck: 1, seed: 21, timeouts: fast });
    expect(report.selfCheck).toMatchObject({ asked: 3, caught: 0 });
    expect(report.selfCheck.missed).toEqual([
      { run: 9001, plant: 'loss', outcome: expect.stringMatching(/^(letter|draft)$/) },
      { run: 9002, plant: 'double', outcome: expect.stringMatching(/^(letter|draft)$/) },
      { run: 9003, plant: 'damage', outcome: 'fail' },
    ]);
    // Its own outcome is the fail of a launch that did not start; the database holds an intact letter or draft.
    expect(report.runs.find((r: { run: number }) => r.run === 9003)?.database).toMatchObject({ read: true, run: expect.stringMatching(/^(letter|draft)$/) });
    expect(report.exit).toBe(EXIT.fail);
    expect(renderMarkdown(report)).toContain('- run 9003, planted damage, judged fail');
  }, 60_000);

  it('a plant counts as caught only as the failure it plants; after a relaunch that did not start, only from the database read once it was gone', () => {
    const notStarted = 'the app did not start again after this kill (no_boot_marker); seed 7, killed 120 ms after it armed';
    const late = (plant: string, database?: { read: boolean; run?: string; runReasons?: string[] }) => ({ plant, outcome: 'fail', reasons: [notStarted, 'the database after the failed launch: integrity_check ok'], database });
    // The #252 CI shape: the relaunch after the damage plant booted after the budget, and the database shows the damage.
    expect(plantCaught(late('damage', { read: true, run: 'fail', runReasons: ['the recording changed', 'the letter hash differs from its file'] }))).toBe(true);
    expect(plantCaught(late('damage', { read: true, run: 'fail', runReasons: ['the letter words differ from what was saved'] }))).toBe(false);
    expect(plantCaught(late('damage', { read: true, run: 'letter', runReasons: [] }))).toBe(false);
    expect(plantCaught(late('damage', { read: false }))).toBe(false);
    expect(plantCaught(late('damage'))).toBe(false);
    expect(plantCaught(late('loss', { read: true, run: 'lost', runReasons: ['no letter and no draft'] }))).toBe(true);
    expect(plantCaught(late('double', { read: true, run: 'draft', runReasons: [] }))).toBe(false);
    // A relaunch that started: judged by its sweep, as before.
    expect(plantCaught({ plant: 'double', outcome: 'doubled', reasons: ['2 rows hold this letter'] })).toBe(true);
    expect(plantCaught({ plant: 'loss', outcome: 'draft', reasons: [] })).toBe(false);
    expect(plantCaught({ plant: 'none', outcome: 'letter', reasons: [] })).toBe(false);
  });

  it('a launch that hangs after a kill is a fail, and its database is not read while that launch may still be writing', async () => {
    const report = await runHarness({ driver: fakeDriver('dl02-hangs', 'hangs-after-run-2'), mode: 'dl02', runs: 4, pointRuns: 0, delayMs: [0, 30], selfCheck: 1, seed: 19, timeouts: { ...fast, bootMs: 2500 } });
    expect(report.exit).toBe(EXIT.fail);
    const failed = report.runs.find((r: { run: number }) => r.run === 2);
    expect(failed).toMatchObject({ outcome: 'fail', database: { read: false } });
    expect(failed?.reasons[0]).toMatch(/^the app did not start again after this kill \(no_boot_marker\); seed 19, killed \d+ ms after it armed$/);
    expect(failed?.reasons[1]).toBe('the database after the failed launch: not read: the failed launch was still running after SIGKILL, and a database another process may still be writing would not show what the kill left');
    expect(renderMarkdown(report)).toContain('not read: the failed launch was still running');
  }, 60_000);

  it('damage a later launch does to an earlier letter is caught at the next relaunch', async () => {
    const report = await runHarness({ driver: fakeDriver('dl02-damage', 'damages-run-2'), mode: 'dl02', runs: 5, pointRuns: 0, kinds: ['spoken'], delayMs: [0, 30], selfCheck: 1, seed: 12, timeouts: fast });
    expect(report.exit).toBe(EXIT.fail);
    expect(report.audits.length).toBeGreaterThan(0);
    expect(report.runs.find((r: { run: number }) => r.run === 3)).toMatchObject({ outcome: 'fail', reasons: expect.arrayContaining([expect.stringMatching(/^after this kill: run 2, judged (letter|draft) earlier, is now fail: the recording changed/)]) });
  }, 60_000);

  it('a harness error mid-run still returns the report so far, with the stage named', async () => {
    const report = await runHarness({ driver: fakeDriver('dl02-throws', 'launch-throws'), mode: 'dl02', runs: 4, pointRuns: 0, delayMs: [0, 30], selfCheck: 1, seed: 13, timeouts: fast });
    expect(report.crashed).toMatchObject({ stage: 'run: run 3, launch', message: 'xcrun simctl launch failed' });
    expect(report.runs.length).toBe(0); // run 2 was killed, then run 3 could not launch: incomplete, not a pass
    expect(report.exit).toBe(EXIT.incomplete);
  }, 60_000);

  it('DL-01 on a correct app (takes where its sweep looks) keeps every take, playing to within 5 s; no microphone is incomplete', async () => {
    const ok = await runHarness({ driver: fakeDriver('dl01-ok'), mode: 'dl01', runs: 4, delayMs: [20, 60], plantDelayMs: [10, 30], selfCheck: 1, seed: 14, timeouts: fast });
    expect(ok.selfCheck).toMatchObject({ asked: 2, caught: 2 });
    expect(countsOf(ok)).toMatchObject({ completed: 4, kept: 4, within5s: 4, bad: 0 });
    expect(ok.exit).toBe(EXIT.pass);
    const noMic = await runHarness({ driver: fakeDriver('dl01-nomic', 'record-fails'), mode: 'dl01', runs: 4, plantDelayMs: [10, 30], selfCheck: 1, seed: 15, timeouts: fast });
    expect(noMic.errors[0]).toMatchObject({ code: 'record_failed' });
    expect(noMic.exit).toBe(EXIT.incomplete);
  }, 60_000);

  it('DL-01 takes that are kept but do not play fail 07 "49 of 50 playable to within 5 s"', async () => {
    const report = await runHarness({ driver: fakeDriver('dl01-silent', 'atomic', { playable: false }), mode: 'dl01', runs: 3, delayMs: [20, 40], plantDelayMs: [10, 30], selfCheck: 1, seed: 16, timeouts: fast });
    expect(countsOf(report)).toMatchObject({ kept: 3, 'kept-unplayable': 3, within5s: 0, bad: 0 });
    expect(report.exit).toBe(EXIT.fail);
  }, 60_000);

  it('regression: a listing that shows only the top of Documents never finishes a DL-01 take kept in Documents/ExpoAudio, and the harness fails it', async () => {
    // The stand-in hides every folder below Documents from the sweep's listing, as the sweep before #207 did.
    // The sweep plans to drop each draft as empty; since #207 it re-checks the disk first and keeps the draft,
    // so the take is not lost, but it stays "recording" and never reaches Tonight. Before #207 every one was
    // lost. Either way it is not kept, and the harness must say so.
    const report = await runHarness({ driver: fakeDriver('dl01-top-only', 'atomic', { takeDir: logic.TAKE_DIR, topLevelOnly: true }), mode: 'dl01', runs: 3, delayMs: [20, 40], plantDelayMs: [10, 30], selfCheck: 1, seed: 17, timeouts: fast });
    expect(report.selfCheck.caught).toBe(2);
    expect(countsOf(report)).toMatchObject({ completed: 3, bad: 3, kept: 0 });
    for (const r of report.runs) expect(r).toMatchObject({ outcome: 'fail', reasons: ['still marked recording after the sweep'] });
    expect(report.sweep['drop-empty-recording']).toBeGreaterThan(0);
    expect(report.exit).toBe(EXIT.fail);
  }, 60_000);

  it("the app's real sweep on takes where expo-audio 57 writes them (Documents/ExpoAudio) keeps every take; it fails if the sweep goes back to the top of Documents", async () => {
    const report = await runHarness({ driver: fakeDriver('dl01-expoaudio', 'atomic', { takeDir: logic.TAKE_DIR }), mode: 'dl01', runs: 3, delayMs: [20, 40], plantDelayMs: [10, 30], selfCheck: 1, seed: 18, timeouts: fast });
    expect(report.selfCheck.caught).toBe(2);
    expect(countsOf(report)).toMatchObject({ completed: 3, kept: 3, within5s: 3, bad: 0 });
    // Summed over every launch, the self-check's included: the one drop is its loss plant, whose file is gone.
    expect(report.sweep['drop-empty-recording']).toBe(1);
    expect(report.sweep['finalize-recording']).toBeGreaterThanOrEqual(3);
    expect(report.audits).toEqual([]);
    expect(report.exit).toBe(EXIT.pass);
  }, 60_000);
});

describe('[ADR 0027] DL-01 on an ADTS build: frames counted on the host, tails recorded, V1 evidence printed', () => {
  it('kept ADTS takes are judged by their frames and end as a kill leaves them; the report prints the evidence with no ids', async () => {
    const report = await runHarness({ driver: fakeDriver('dl01-adts', 'atomic', { takeDir: logic.TAKE_DIR, container: 'adts' }), mode: 'dl01', runs: 3, delayMs: [20, 60], plantDelayMs: [10, 30], selfCheck: 1, seed: 19, timeouts: fast });
    expect(report.selfCheck.caught).toBe(2);
    const c = countsOf(report);
    expect(c).toMatchObject({ completed: 3, kept: 3, within5s: 3, bad: 0, storedPath: { same: 3, otherContainer: 0, other: 0 } });
    expect(c.adts).toMatchObject({ kept: 3, break: 0, notAdts: 0, v1Failing: 0 });
    expect(c.adts.none + c.adts.cut).toBe(3);
    for (const r of report.runs) {
      expect(r).toMatchObject({ outcome: 'kept-playable', container: 'adts', afinfoDurationS: 99 });
      // The length is the whole frames, not afinfo's 99 s.
      expect(r.durationS).toBeCloseTo((r.adts.frames * AAC_FRAME_SAMPLES) / 48000, 9);
      expect(r.durationS).toBeLessThan(5);
      expect(['cut', 'none']).toContain(r.adts.tail);
      expect(r.adts.frameBytes).toMatchObject({ overLimit: 0, notLc: 0 });
    }
    expect(report.exit).toBe(EXIT.pass);
    const md = renderMarkdown(report);
    expect(md).toContain('## ADTS takes (ADR 0027, checks V1 and V2)');
    expect(md).toContain(`| Tails after the kill (scanAdts) | none ${c.adts.none}, cut ${c.adts.cut}, break 0 |`);
    expect(md).toContain("(kept, the row's stored path is the take's path on disk) | 3 of 3 |");
    expect(md.match(/^00000000: fff1 4c40 /gm)).toHaveLength(3); // the first 16 bytes of each kept take, as xxd prints them
    expect(md).toContain('afinfo file type adts; data format 1 ch,  48000 Hz, aac');
    expect(md).toContain('AAC-LC, frequency index 3, channel configuration 1');
    expect(md.match(/File: {11}\(this take\)/g)).toHaveLength(3);
    // No take names (they carry the recorder's id), no draft ids, no paths.
    expect(md).not.toMatch(/recording-\d|\w\.aac\b|\/Documents|[0-9a-f]{8}-[0-9a-f]{4}-/);
    expect(md).not.toContain('FINDING');
  }, 60_000);
});

describe('[ADR 0027] the host reads frames with the app\'s own scanner, on the framing its tests pin', () => {
  const real = () => concat(...REAL_FRAME_LENGTHS.map((len) => adtsFrame(len - 7)));
  const total = REAL_FRAME_LENGTHS.reduce((n, len) => n + len, 0);

  it('the frame sizes walked are exactly the real encoder\'s, on the chain scanAdts proved, and a kill cut leaves the whole frames', () => {
    const f = adtsFacts(real());
    expect(f).toMatchObject({ adts: true, frames: 283, tail: 'none', tailBytes: 0, wholeBytes: total, totalBytes: total, ftypAt4: false });
    expect(f.frameBytes).toEqual({ count: 283, min: Math.min(...REAL_FRAME_LENGTHS), mean: Math.round((total / 283) * 10) / 10, max: Math.max(...REAL_FRAME_LENGTHS), overLimit: 0, notLc: 0 });
    expect(f.header).toEqual({ mpeg: 4, layer: 0, crc: false, objectType: 2, profile: 'AAC-LC', frequencyIndex: 3, sampleRate: 48000, channelConfiguration: 1 });
    expect(f.first16.startsWith('00000000: fff1 4c40 ')).toBe(true);
    expect(f.kbps).toBe(Math.round((total * 8) / ((283 * AAC_FRAME_SAMPLES * 1000) / 48000)));
    expect(v1Findings(f)).toEqual([]);
    // The figures are scanAdts's own: frames, whole bytes, tail.
    const s = scanAdts(real())!;
    expect([f.frames, f.wholeBytes, f.tail, f.tailBytes]).toEqual([s.frames, s.wholeBytes, s.tail, s.tailBytes]);
    for (let cut = 1; cut < 200; cut += 13) {
      const killed = adtsFacts(real().subarray(0, total - cut));
      const last = REAL_FRAME_LENGTHS.at(-1)!;
      expect(killed).toMatchObject({ frames: cut < last ? 282 : 281, tail: 'cut' });
      expect(killed.frameBytes!.count).toBe(killed.frames);
    }
  });

  it('flags what check V1 rules out: a frame over the AAC limit, a header that is not AAC-LC 48 kHz mono, an ftyp at offset 4', () => {
    const big = adtsFacts(concat(adtsFrame(170), adtsFrame(MONO_FRAME_LIMIT - 7 + 1), adtsFrame(170)));
    expect(big.frameBytes).toMatchObject({ count: 3, max: MONO_FRAME_LIMIT + 1, overLimit: 1 });
    expect(v1Findings(big)).toEqual([`1 frame(s) over ${MONO_FRAME_LIMIT} bytes`]);
    const at44k = adtsFacts(concat(adtsFrame(170, { sampleRateIndex: 4, channels: 2 }), adtsFrame(170, { sampleRateIndex: 4, channels: 2 })));
    expect(v1Findings(at44k)).toEqual(['frequency index 4, not 3 (48 kHz)', 'channel configuration 2, not 1']);
    const main = adtsFrame(170);
    main[2] &= 0x3f; // profile 0: AAC Main
    expect(v1Findings(adtsFacts(concat(main, adtsFrame(170))))).toEqual(['profile AAC Main, not AAC-LC', '1 frame header(s) not AAC-LC']);
    expect(v1Findings(adtsFacts(concat(adtsFrame(100, { crc: true }), adtsFrame(100, { crc: true }))))).toEqual(['the first header is not FF F1 (MPEG-4, layer 0, no CRC)']);
    expect(v1Findings(adtsFacts(concat(new Uint8Array([0, 0, 0, 0x20]), new TextEncoder().encode('ftypM4A '), new Uint8Array(40))))).toEqual(['an ftyp box at offset 4 (an MPEG-4 file, not ADTS)', 'no ADTS stream']);
  });

  it('prints the first 16 bytes as xxd -l 16 does, and afinfo\'s output without the take\'s path or name', () => {
    expect(xxd16(new Uint8Array([0xff, 0xf1, 0x4c, 0x40, 0x1f, 0x1f, 0xfc, 0x21, 0x41, 0x42, 0, 0, 0, 0, 0, 0, 0x99]))).toBe(
      '00000000: fff1 4c40 1f1f fc21 4142 0000 0000 0000  ..L@...!AB......',
    );
    // A short file: the printable column stays where xxd puts it.
    expect(xxd16(new Uint8Array([0xff, 0xf1, 0x4c]))).toBe(`00000000: ${'fff1 4c'.padEnd(39)}  ..L`);
    const path = '/Users/runner/Library/Developer/CoreSimulator/Devices/X/data/Containers/Data/Application/Y/Documents/ExpoAudio/recording-5D2E0F11.aac';
    const out = redactAfinfo(`File:           ${path}\nFile type ID:   adts\nnote: recording-5D2E0F11.aac opened`, path, '(this take)');
    expect(out).toBe('File:           (this take)\nFile type ID:   adts\nnote: (this take) opened');
  });
});

describe('settings, shards and what a clean result proves', () => {
  it('refuses settings that would let a plant slip past or replay wrongly', async () => {
    expect((await runHarness({ driver: fakeDriver('u1'), mode: 'dl02', runs: 1, plantDelayMs: [0, logic.PLANT_LOSS_GAP_MS], timeouts: fast })).exit).toBe(EXIT.usage);
    expect((await runHarness({ driver: fakeDriver('u2'), mode: 'dl02', runs: 1, selfCheck: 0, timeouts: fast })).exit).toBe(EXIT.usage);
    expect((await runHarness({ driver: fakeDriver('u3'), mode: 'dl01', runs: 1, pointRuns: 1, timeouts: fast })).exit).toBe(EXIT.usage);
    expect((await runHarness({ driver: fakeDriver('u4'), mode: 'dl02', runs: 1, seed: -1, timeouts: fast })).exit).toBe(EXIT.usage);
  }, 30_000);

  it('crash-point runs are spread evenly among the random ones, one fixed share per point', () => {
    const plan = planRuns({ mode: 'dl02', runs: 500, pointRuns: 50, kinds: ['typed', 'spoken', 'spoken-unhashed'] });
    expect(plan.length).toBe(700);
    for (const pt of protocol.CRASH_POINTS) expect(plan.filter((r) => r.point === pt).length).toBe(50);
    expect(plan.filter((r) => r.point === 'after-file-write').every((r) => r.kind === 'spoken')).toBe(true);
    expect(plan.slice(0, 70).filter((r) => r.point).length).toBe(20);
    expect(plan.map((r) => r.run)).toEqual(Array.from({ length: 700 }, (_, i) => i + 1));
  });

  it('shards merge into one judged report, and a duplicate shard or a mismatched shard is refused', async () => {
    const a = await runHarness({ driver: fakeDriver('s-a'), mode: 'dl02', runs: 3, pointRuns: 0, delayMs: [0, 30], selfCheck: 1, seed: 1, timeouts: fast });
    const b = await runHarness({ driver: fakeDriver('s-b'), mode: 'dl02', runs: 3, pointRuns: 0, delayMs: [0, 30], selfCheck: 1, seed: 2, timeouts: fast });
    expect(mergeReports([a, b])).toMatchObject({ runsAsked: 6, exit: EXIT.pass });
    expect(() => mergeReports([a, a])).toThrow(/given twice/);
    expect(() => mergeReports([a, { ...b, delayMs: [399, 400] }])).toThrow(/different settings/);
    expect(() => mergeReports([a, { ...b, device: { ...b.device, commit: 'other' } }])).toThrow(/different builds/);
    const broken = await runHarness({ driver: fakeDriver('s-c', 'non-atomic'), mode: 'dl02', runs: 2, pointRuns: 0, delayMs: [0, 30], selfCheck: 1, seed: 3, timeouts: fast });
    expect(mergeReports([a, broken]).exit).toBe(EXIT.fail);
  }, 90_000);

  it('the rule of three: what zero failures in 500 and in 50 runs rule out', () => {
    expect(upperBound95(500)).toBeCloseTo(0.006, 3);
    expect(upperBound95(50)).toBeCloseTo(0.058, 3);
    expect(meetsGate({ mode: 'dl02', runs: Array.from({ length: 500 }, (_, i) => ({ run: i, outcome: 'letter', point: null })) })).toBe(false);
  });
});
