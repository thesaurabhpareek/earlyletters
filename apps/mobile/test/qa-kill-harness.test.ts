/// <reference types="node" />
/**
 * The kill harness (RA-19-04; DEVICE_TEST_PLAN DL-01, DL-02; B2-11, never waived), tested in Node without a Mac.
 *
 * The harness loop, the oracle and the snapshot reader in `apps/mobile/e2e/kill/` run here for real against a
 * fake app: a container laid out like the simulator's (Documents/SQLite/scribe.db, Documents/ExpoAudio,
 * Library/Caches/kill-drill), written through the app's own migrator and repositories and swept with the app's
 * own planner (`planLaunchSweep`). Killing a fake process stops its timers, as SIGKILL stops the app. The fake
 * is a correct app unless a test says otherwise; it proves the harness, not the app (the simulator run does that).
 *
 * Fictional family only: the drill child is Asha.
 */
import { createHash, randomBytes } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { planLaunchSweep, type SweepFile } from '../src/lib/capture/sweep.logic';
import { migrate } from '../src/lib/db/migrations';
import { children, drafts, entries, letters, orphans, settings, uuidv7From, type Entry, type RepoContext } from '../src/lib/db/repos';
import * as logic from '../src/dev/kill-drill.logic';
import { EXIT, countsOf, mergeReports, renderMarkdown, runHarness } from '../e2e/kill/harness.mjs';
import { classifyDl01, classifyDl02 } from '../e2e/kill/oracle.mjs';
import * as protocol from '../e2e/kill/protocol.mjs';
import { readSnapshot, sha256OfFile } from '../e2e/kill/snapshot.mjs';
import { nodeDb } from './helpers/node-db';

const ROOT = mkdtempSync(join(tmpdir(), 'qa-kill-harness-'));
afterAll(() => rmSync(ROOT, { recursive: true, force: true }));

type Behaviour = 'atomic' | 'non-atomic' | 'ignores-plants' | 'never-arms' | 'record-fails';
interface LaunchArgs {
  mode: string;
  run: number;
  kind?: string;
  plant?: string;
}
interface Proc {
  alive: boolean;
  timers: ReturnType<typeof setTimeout>[];
  close: () => void;
  ctx: RepoContext;
}

const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex');

/** A container laid out like the simulator app's data container. */
function container(name: string) {
  const data = join(ROOT, name, 'data');
  const docs = join(data, 'Documents');
  const takes = join(docs, logic.TAKE_DIR);
  const marks = join(data, 'Library', 'Caches', logic.MARKER_DIR);
  const dbPath = join(docs, 'SQLite', 'scribe.db');
  return { data, docs, takes, marks, dbPath };
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

function audioFiles(dir: string): SweepFile[] {
  const out: SweepFile[] = [];
  const walk = (d: string) => {
    if (!existsSync(d)) return;
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (n.endsWith('.m4a')) out.push({ uri: `file://${p}`, bytes: statSync(p).size, playable: true });
    }
  };
  walk(dir);
  return out;
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
function fakeDriver(name: string, behaviour: Behaviour = 'atomic') {
  const c = container(name);
  const procs = new Map<number, Proc>();
  let nextPid = 100;
  const later = (p: Proc, ms: number, fn: () => void) => {
    p.timers.push(
      setTimeout(() => {
        if (p.alive) fn();
      }, ms),
    );
  };
  const mark = (kind: logic.MarkerKind, run: number, body: object) => writeFileSync(join(c.marks, logic.markerName(kind, run)), JSON.stringify(body));

  /** The app's launch sweep, applied as sweep.ts applies it (this fake looks in Documents at any depth). */
  const sweep = (ctx: RepoContext, childId: string) => {
    const actions = planLaunchSweep({
      files: audioFiles(c.docs),
      drafts: drafts.audioRows(ctx),
      entries: entries.audioRows(ctx),
      reported: orphans.list(ctx).map((o) => o.fileName),
      activeChildId: childId,
      skipDraftIds: [],
    });
    for (const a of actions) {
      const path = 'uri' in a ? a.uri.replace(/^file:\/\//, '') : '';
      if (a.kind === 'finalize-recording') drafts.finalizeAudio(ctx, a.draftId, { audioUri: a.uri, sha256: sha(path), bytes: a.bytes, state: 'ready', recovered: true });
      else if (a.kind === 'unrecoverable-recording' || a.kind === 'unplayable-recording') drafts.finalizeAudio(ctx, a.draftId, { audioUri: a.uri, sha256: null, bytes: 0, state: 'unrecoverable', recovered: true });
      else if (a.kind === 'drop-empty-recording') drafts.remove(ctx, a.draftId);
      else if (a.kind === 'reattach') orphans.reattach(ctx, a.fileName, { childId, audioUri: a.uri, createdAt: new Date().toISOString(), sha256: sha(path), bytes: a.bytes, state: 'ready' });
      else if (a.kind === 'report') orphans.report(ctx, a.fileName, a.bytes);
    }
  };

  const boot = (p: Proc, a: LaunchArgs) => {
    const { ctx } = p;
    settings.setSetting(ctx, 'ageGate.passed', '1');
    if (children.listVisible(ctx).length === 0) {
      const id = ctx.newId();
      children.insert(ctx, id, { name: 'Asha', birthday: '2026-06-01', dueDate: null, signsAs: 'Mama' });
      settings.setSetting(ctx, 'activeChildId', id);
    }
    const childId = children.listVisible(ctx)[0].id;
    sweep(ctx, childId);
    mark('boot', a.run, { run: a.run, mode: a.mode });
    if (behaviour === 'never-arms' || (a.mode !== 'dl01' && a.mode !== 'dl02')) return;
    const plant = behaviour === 'ignores-plants' ? 'none' : (a.plant ?? 'none');
    const defaults = { childId, authorSignsAs: 'Mama' };
    if (a.mode === 'dl02') {
      const text = logic.drillText(a.run);
      const draftId = ctx.newId();
      let audio = { uri: null as string | null, sha256: null as string | null, bytes: null as number | null };
      if (a.kind === 'typed') {
        drafts.insert(ctx, draftId, { childId, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: text });
      } else {
        mkdirSync(c.takes, { recursive: true });
        const path = join(c.takes, logic.drillAudioName(a.run));
        copyFileSync(join(c.marks, logic.FIXTURE_FILE), path);
        audio = { uri: `file://${path}`, sha256: sha(path), bytes: statSync(path).size };
        const hashed = a.kind === 'spoken';
        drafts.insert(ctx, draftId, {
          childId,
          captureMode: 'spoken',
          promptKey: null,
          audioUri: audio.uri,
          audioDurationMs: null,
          state: 'ready',
          audioSha256: hashed ? audio.sha256 : null,
          audioBytes: hashed ? audio.bytes : null,
        });
        drafts.setTranscriptOnce(ctx, draftId, text);
      }
      const entry = drillEntry(draftId, text, childId, audio);
      const armed = { run: a.run, mode: 'dl02', kind: a.kind, plant, draftId, audioFile: audio.uri ? logic.drillAudioName(a.run) : null, text, sha256: audio.sha256 };
      // Plants are in place before the drill arms, as in src/dev/kill-drill.ts; so is this fake's bug.
      if (plant === 'double') {
        entries.upsert(ctx, entry, defaults);
        mark('armed', a.run, armed);
        return;
      }
      if (plant === 'loss' || behaviour === 'non-atomic') {
        drafts.remove(ctx, draftId);
        later(p, 1000, () => entries.upsert(ctx, entry, defaults));
        mark('armed', a.run, armed);
        return;
      }
      mark('armed', a.run, armed);
      // The save lands a little after Save, so some kills come before the commit and some after.
      later(p, (a.run * 7) % 25, () => {
        letters.saveFromDraft(ctx, draftId, entry, defaults, true);
        mark('done', a.run, { run: a.run });
      });
      return;
    }
    if (behaviour === 'record-fails') {
      mark('error', a.run, { run: a.run, code: 'record_failed' });
      return;
    }
    mkdirSync(c.takes, { recursive: true });
    const path = join(c.takes, `recording-${a.run}.m4a`);
    writeFileSync(path, randomBytes(2048));
    const draftId = ctx.newId();
    drafts.insert(ctx, draftId, { childId, captureMode: 'spoken', promptKey: null, audioUri: `file://${path}`, audioDurationMs: 0, state: 'recording' });
    if (plant === 'loss') rmSync(path, { force: true });
    if (plant === 'double') {
      for (let i = 0; i < 2; i += 1) entries.upsert(ctx, drillEntry(ctx.newId(), logic.drillText(a.run), childId, { uri: `file://${path}`, sha256: null, bytes: null }), defaults);
    }
    mark('armed', a.run, { run: a.run, mode: 'dl01', kind: null, plant, draftId, audioFile: `recording-${a.run}.m4a`, text: null, sha256: null });
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
      return { simulator: 'fake' };
    },
    async reset() {
      rmSync(c.data, { recursive: true, force: true });
      mkdirSync(c.marks, { recursive: true });
      mkdirSync(join(c.docs, 'SQLite'), { recursive: true });
      writeFileSync(join(c.marks, logic.FIXTURE_FILE), randomBytes(4096));
    },
    async launch(a: LaunchArgs) {
      const pid = (nextPid += 1);
      const { ctx, close } = openCtx(c.dbPath);
      const p: Proc = { alive: true, timers: [], close, ctx };
      procs.set(pid, p);
      later(p, 5, () => boot(p, a));
      return pid;
    },
    readMarker(kind: logic.MarkerKind, run: number) {
      const path = join(c.marks, logic.markerName(kind, run));
      return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
    },
    alive: (pid: number) => procs.get(pid)?.alive ?? false,
    kill: async (pid: number) => stop(pid),
    terminate: async (pid: number) => {
      stop(pid);
    },
    snapshot: () => readSnapshot({ dataDir: c.data }),
    sha256: sha256OfFile,
    playable: () => ({ ok: true, durationS: 1 }),
    cleanup: async () => {},
  };
}

const fast = { bootMs: 3000, armMs: 3000 };

describe('[DATA-REQ-048] [F04-REQ-024] the kill drill protocol is one protocol on both sides', () => {
  it('app and host agree on every name, folder and constant', () => {
    expect(protocol.DRILL_MODES).toEqual([...logic.DRILL_MODES]);
    expect(protocol.DRILL_KINDS).toEqual([...logic.DRILL_KINDS]);
    expect(protocol.DRILL_PLANTS).toEqual([...logic.DRILL_PLANTS]);
    expect(protocol.DRILL_ARG).toEqual(logic.DRILL_ARG);
    expect([protocol.MARKER_DIR, protocol.FIXTURE_FILE, protocol.TAKE_DIR, protocol.PLANT_LOSS_GAP_MS]).toEqual([
      logic.MARKER_DIR,
      logic.FIXTURE_FILE,
      logic.TAKE_DIR,
      logic.PLANT_LOSS_GAP_MS,
    ]);
    for (const run of [0, 7, 500, 9001]) {
      expect(protocol.drillText(run)).toBe(logic.drillText(run));
      expect(protocol.drillAudioName(run)).toBe(logic.drillAudioName(run));
      for (const k of ['boot', 'armed', 'done', 'error'] as const) expect(protocol.markerName(k, run)).toBe(logic.markerName(k, run));
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
      { mode: 'dl02', run: 12, kind: 'spoken-unhashed', plant: 'none' },
      { mode: 'dl01', run: 1, kind: 'typed', plant: 'loss' },
      { mode: 'verify', run: 501, kind: 'typed', plant: 'none' },
    ]) {
      expect(logic.parseDrillArgs(asDefaults(protocol.launchArgs(a)))).toEqual(a);
    }
    expect(logic.parseDrillArgs(() => undefined)).toBeNull();
    expect(logic.parseDrillArgs(asDefaults(['-e2eKillDrill', 'dl03', '-e2eKillRun', '1']))).toBeNull();
    expect(logic.parseDrillArgs(asDefaults(['-e2eKillDrill', 'dl02', '-e2eKillRun', '-1']))).toBeNull();
    expect(logic.parseDrillArgs(asDefaults(['-e2eKillDrill', 'dl02', '-e2eKillRun', '1x']))).toBeNull();
    expect(logic.parseDrillArgs(asDefaults(['-e2eKillDrill', 'dl02', '-e2eKillRun', '1', '-e2eKillPlant', 'lose']))).toBeNull();
    expect(logic.parseDrillArgs(asDefaults(['-e2eKillDrill', 'dl02', '-e2eKillRun', '4']))).toEqual({ mode: 'dl02', run: 4, kind: 'typed', plant: 'none' });
  });

  it('the seam is compiled in only for e2e builds that are not production, and nothing else loads the drill', () => {
    const src = join(__dirname, '..', 'src');
    const seams = readFileSync(join(src, 'dev', 'e2e-seams.ts'), 'utf8');
    expect(seams).toMatch(/process\.env\.EXPO_PUBLIC_E2E === '1' && process\.env\.EXPO_PUBLIC_APP_ENV !== 'production'\s*\?\s*\(require\('\.\/kill-drill'\)/);
    expect(seams).not.toMatch(/^import .*kill-drill/m);
    const loaders: string[] = [];
    const walk = (d: string) => {
      for (const n of readdirSync(d)) {
        const p = join(d, n);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(n) && !p.endsWith(join('dev', 'e2e-seams.ts')) && /['/]kill-drill['.]/.test(readFileSync(p, 'utf8')) && !p.includes(join('dev', 'kill-drill'))) loaders.push(p);
      }
    };
    walk(src);
    expect(loaders).toEqual([]);
  });
});

describe('[DATA-REQ-048] the oracle judges a run from the database and files alone', () => {
  const setup = (name: string) => {
    const c = container(name);
    mkdirSync(join(c.docs, 'SQLite'), { recursive: true });
    mkdirSync(c.takes, { recursive: true });
    const { ctx, close } = openCtx(c.dbPath);
    const childId = ctx.newId();
    children.insert(ctx, childId, { name: 'Asha', birthday: '2026-06-01', dueDate: null, signsAs: 'Mama' });
    const defaults = { childId, authorSignsAs: 'Mama' };
    const io = { sha256: sha256OfFile, playable: () => ({ ok: true as boolean | null, durationS: 1 }) };
    return { c, ctx, close, childId, defaults, io };
  };

  it('DL-02 typed: once as a letter, intact as a draft, both, or neither', () => {
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
    expect(classifyDl02(snap, armedFor(1, ids[0]), io).outcome).toBe('letter');
    expect(classifyDl02(snap, armedFor(2, ids[1]), io).outcome).toBe('draft');
    expect(classifyDl02(snap, armedFor(3, ids[2]), io).outcome).toBe('doubled');
    expect(classifyDl02(snap, armedFor(4, ids[3]), io).outcome).toBe('lost');
    close();
  });

  it('DL-02 spoken: a changed or missing recording is never a pass', () => {
    const { c, ctx, close, childId, defaults, io } = setup('oracle-spoken');
    const make = (run: number) => {
      const path = join(c.takes, logic.drillAudioName(run));
      writeFileSync(path, randomBytes(1024));
      const audio = { uri: `file://${path}`, sha256: sha(path), bytes: 1024 };
      const id = ctx.newId();
      drafts.insert(ctx, id, { childId, captureMode: 'spoken', promptKey: null, audioUri: audio.uri, audioDurationMs: null, state: 'ready', audioSha256: audio.sha256, audioBytes: 1024 });
      drafts.setTranscriptOnce(ctx, id, logic.drillText(run));
      letters.saveFromDraft(ctx, id, drillEntry(id, logic.drillText(run), childId, audio), defaults);
      return { id, path, armed: { draftId: id, kind: 'spoken', text: logic.drillText(run), audioFile: logic.drillAudioName(run), sha256: audio.sha256 } };
    };
    const ok = make(1);
    const changed = make(2);
    const gone = make(3);
    writeFileSync(changed.path, randomBytes(1024));
    rmSync(gone.path);
    const snap = readSnapshot({ dataDir: c.data });
    expect(classifyDl02(snap, ok.armed, io).outcome).toBe('letter');
    expect(classifyDl02(snap, changed.armed, io)).toMatchObject({ outcome: 'fail', reasons: expect.arrayContaining(['the recording changed']) });
    expect(classifyDl02(snap, gone.armed, io).outcome).toBe('lost');
    close();
  });

  it('DL-01: a take is kept only when exactly one row points at a file with bytes', () => {
    const { c, ctx, close, childId, defaults, io } = setup('oracle-take');
    const take = (n: number, state: 'recording' | 'ready' | 'unrecoverable', withHash = true) => {
      const path = join(c.takes, `recording-${n}.m4a`);
      writeFileSync(path, randomBytes(512));
      const id = ctx.newId();
      drafts.insert(ctx, id, { childId, captureMode: 'spoken', promptKey: null, audioUri: `file://${path}`, audioDurationMs: 0, state, audioSha256: withHash ? sha(path) : null, audioBytes: 512 });
      return { id, path, armed: { draftId: id, audioFile: `recording-${n}.m4a` } };
    };
    const ready = take(1, 'ready');
    const unplayable = take(2, 'unrecoverable');
    const stuck = take(3, 'recording');
    const dropped = take(4, 'recording');
    drafts.remove(ctx, dropped.id);
    const twice = take(5, 'ready');
    entries.upsert(ctx, drillEntry(ctx.newId(), 'x', childId, { uri: `file://${twice.path}`, sha256: null, bytes: null }), defaults);
    const silent = take(6, 'ready');
    const snap = readSnapshot({ dataDir: c.data });
    expect(classifyDl01(snap, ready.armed, io).outcome).toBe('kept-playable');
    expect(classifyDl01(snap, unplayable.armed, io).outcome).toBe('kept-unplayable');
    expect(classifyDl01(snap, stuck.armed, io).outcome).toBe('fail');
    expect(classifyDl01(snap, dropped.armed, io)).toMatchObject({ outcome: 'lost', reasons: [expect.stringContaining('not on Tonight')] });
    expect(classifyDl01(snap, twice.armed, io).outcome).toBe('doubled');
    expect(classifyDl01(snap, silent.armed, { ...io, playable: () => ({ ok: false, durationS: null }) })).toMatchObject({
      outcome: 'fail',
      reasons: [expect.stringContaining('F08-REQ-019')],
    });
    close();
  });
});

describe('[DATA-REQ-048] [F04-REQ-024] the harness cannot pass vacuously', () => {
  it('DL-02 on a correct app: every run judged, none lost or doubled, every planted failure caught', async () => {
    const report = await runHarness({ driver: fakeDriver('dl02-ok'), mode: 'dl02', runs: 9, delayMs: [0, 30], seed: 7, timeouts: fast });
    expect(report.selfCheck).toMatchObject({ asked: 4, caught: 4, missed: [] });
    const c = countsOf(report);
    expect(c.completed).toBe(9);
    expect((c.letter ?? 0) + (c.draft ?? 0)).toBe(9);
    expect(c.bad).toBe(0);
    expect(report.exit).toBe(EXIT.pass);
    const md = renderMarkdown(report);
    expect(md).toContain('PASS');
    expect(md).not.toMatch(/Asha kill drill|[0-9a-f]{8}-[0-9a-f]{4}-7/);
  }, 30_000);

  it('DL-02 on an app whose save is not atomic: the harness fails it', async () => {
    const report = await runHarness({ driver: fakeDriver('dl02-broken', 'non-atomic'), mode: 'dl02', runs: 6, delayMs: [0, 30], seed: 8, timeouts: fast });
    expect(report.selfCheck.caught).toBe(report.selfCheck.asked);
    expect(countsOf(report).lost).toBe(6);
    expect(report.exit).toBe(EXIT.fail);
  }, 30_000);

  it('an app that ignores the plants makes the harness stop as blind, before any real run', async () => {
    const report = await runHarness({ driver: fakeDriver('dl02-blind', 'ignores-plants'), mode: 'dl02', runs: 6, delayMs: [0, 30], seed: 9, timeouts: fast });
    expect(report.selfCheck.missed.length).toBeGreaterThan(0);
    expect(report.runs).toEqual([]);
    expect(report.exit).toBe(EXIT.blind);
  }, 30_000);

  it('a drill that never arms is incomplete, never green', async () => {
    const report = await runHarness({ driver: fakeDriver('dl02-stuck', 'never-arms'), mode: 'dl02', runs: 3, delayMs: [0, 30], seed: 10, timeouts: { bootMs: 3000, armMs: 300 } });
    expect(report.errors[0]).toMatchObject({ code: 'no_armed_marker' });
    expect(report.exit).toBe(EXIT.incomplete);
  }, 30_000);

  it('DL-01 on a correct app keeps every take; no microphone is incomplete', async () => {
    const ok = await runHarness({ driver: fakeDriver('dl01-ok'), mode: 'dl01', runs: 4, delayMs: [10, 30], plantDelayMs: [10, 30], selfCheck: 1, seed: 11, timeouts: fast });
    expect(ok.selfCheck).toMatchObject({ asked: 2, caught: 2 });
    expect(countsOf(ok)).toMatchObject({ completed: 4, kept: 4, bad: 0 });
    expect(ok.exit).toBe(EXIT.pass);
    const noMic = await runHarness({ driver: fakeDriver('dl01-nomic', 'record-fails'), mode: 'dl01', runs: 4, plantDelayMs: [10, 30], selfCheck: 1, seed: 12, timeouts: fast });
    expect(noMic.errors[0]).toMatchObject({ code: 'record_failed' });
    expect(noMic.exit).toBe(EXIT.incomplete);
  }, 30_000);

  it('refuses settings that would let a plant slip past, and shards merge into one judged report', async () => {
    const tooLate = await runHarness({ driver: fakeDriver('dl02-usage'), mode: 'dl02', runs: 1, plantDelayMs: [0, logic.PLANT_LOSS_GAP_MS], timeouts: fast });
    expect(tooLate.exit).toBe(EXIT.usage);
    const noCheck = await runHarness({ driver: fakeDriver('dl02-usage2'), mode: 'dl02', runs: 1, selfCheck: 0, timeouts: fast });
    expect(noCheck.exit).toBe(EXIT.usage);
    const a = await runHarness({ driver: fakeDriver('dl02-shard-a'), mode: 'dl02', runs: 3, delayMs: [0, 30], selfCheck: 1, seed: 1, timeouts: fast });
    const b = await runHarness({ driver: fakeDriver('dl02-shard-b'), mode: 'dl02', runs: 3, delayMs: [0, 30], selfCheck: 1, seed: 2, timeouts: fast });
    const merged = mergeReports([a, b]);
    expect(merged).toMatchObject({ runsAsked: 6, exit: EXIT.pass });
    const broken = await runHarness({ driver: fakeDriver('dl02-shard-c', 'non-atomic'), mode: 'dl02', runs: 2, delayMs: [0, 30], selfCheck: 1, seed: 3, timeouts: fast });
    expect(mergeReports([a, broken]).exit).toBe(EXIT.fail);
  }, 60_000);
});
