// The kill harness loop (RA-19-04): launch, wait for the drill to arm, kill (SIGKILL) at a random moment or
// exactly at a crash point, relaunch, let the app's own launch sweep run, then judge the killed run and audit
// the whole database from the host (oracle.mjs). Device-neutral: the iOS simulator driver is simctl-driver.mjs;
// the Node tests drive a fake app.
//
// A run cannot pass vacuously: before the real runs, on its own fresh install, the harness runs planted failures
// (the app loses, doubles or damages a letter on purpose) and stops with exit 4 unless it caught every one.
// A relaunch that fails after a kill is a fail (exit 1), never incomplete. Whatever happens, a report is returned.
import { MONO_FRAME_LIMIT, afinfoFields, v1Findings } from './adts-evidence.mjs';
import { auditStore, classifyDl01, classifyDl02, isBad } from './oracle.mjs';
import { CRASH_POINTS, DRILL_KINDS, PLANT_LOSS_GAP_MS, POINT_EXPECTS } from './protocol.mjs';

export const EXIT = Object.freeze({ pass: 0, fail: 1, usage: 2, incomplete: 3, blind: 4 });

export const DEFAULTS = Object.freeze({
  // DL-02: 07 "Kill during save", random 0 to 400 ms after Save. DL-01: 07 "Kill while recording", 10 to 120 s.
  dl02: { delayMs: [0, 400], plantDelayMs: [0, 400] },
  dl01: { delayMs: [10000, 120000], plantDelayMs: [2000, 4000] },
  timeouts: { bootMs: 120000, armMs: 30000, pointMs: 30000 },
  selfCheck: 2,
  // 07 "Kill while recording": 49 or more of 50 playable to within 5 s.
  playableShare: 49 / 50,
});

/** What each planted failure must be judged as. */
export const PLANT_EXPECTS = Object.freeze({ loss: 'lost', double: 'doubled', damage: 'fail' });

/**
 * Whether a planted run came back as the failure it plants. A run whose next launch did not start is a fail
 * whatever the plant did, so its own outcome proves nothing: the plant then counts as caught only if the
 * database, read once that launch was gone (relaunchFailed), holds the planted failure, for a damage plant with
 * its recording changed. Not read, or anything else there, is a miss. The run stays a fail of the app (exit 1);
 * a relaunch slower than the boot budget no longer also reports a plant the oracle caught as missed.
 * @param {{ plant: string, outcome: string, reasons: string[], database?: { read: boolean, run?: string, runReasons?: string[] } }} r
 */
export function plantCaught(r) {
  const want = PLANT_EXPECTS[r.plant];
  if (!want) return false;
  if (!r.reasons.some((x) => x.startsWith('the app did not start'))) return r.outcome === want;
  const d = r.database;
  return Boolean(d?.read) && d.run === want && (r.plant !== 'damage' || (d.runReasons ?? []).includes('the recording changed'));
}
const PLANTS = { dl02: ['loss', 'double', 'damage'], dl01: ['loss', 'double'] };
/** The B2-11 gate sizes: 500 random kills a mode, and for DL-02 50 at each crash point. */
export const GATE = Object.freeze({ runs: 500, pointRuns: 50 });

/** Small seeded generator (mulberry32), so a report's delays can be replayed from its seed. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** With zero failures in n independent runs, the 95% upper bound on the failure rate (about 3/n, the rule of three). */
export function upperBound95(n) {
  return n > 0 ? 1 - 0.05 ** (1 / n) : 1;
}

class HarnessUsageError extends Error {}

function check(cond, message) {
  if (!cond) throw new HarnessUsageError(message);
}

function validate(o) {
  check(o.mode === 'dl01' || o.mode === 'dl02', 'mode must be dl01 or dl02');
  check(Number.isInteger(o.runs) && o.runs >= 1, 'runs must be a whole number from 1');
  check(Number.isInteger(o.pointRuns) && o.pointRuns >= 0, 'point runs must be a whole number from 0');
  check(o.mode === 'dl02' || o.pointRuns === 0, 'crash points are DL-02 only');
  for (const k of ['delayMs', 'plantDelayMs']) {
    const r = o[k];
    check(Array.isArray(r) && r.length === 2 && Number.isFinite(r[0]) && Number.isFinite(r[1]) && r[0] >= 0 && r[1] >= r[0], `${k} must be a range from 0 up`);
  }
  check(Number.isInteger(o.selfCheck) && o.selfCheck >= 1, 'the self-check needs at least one planted run of each kind');
  check(Number.isInteger(o.seed) && o.seed >= 0, 'the seed must be a whole number from 0');
  if (o.mode === 'dl02') {
    check(o.kinds.length > 0 && o.kinds.every((k) => DRILL_KINDS.includes(k)), 'unknown DL-02 kind');
    // The planted loss holds the letter in neither table for PLANT_LOSS_GAP_MS; a later kill would miss it.
    check(o.plantDelayMs[1] < PLANT_LOSS_GAP_MS, `plant delays must stay under ${PLANT_LOSS_GAP_MS} ms`);
  }
}

/** The real runs: random kills, with the crash-point runs spread evenly among them (DL-02). */
export function planRuns(o) {
  const kindOf = (i) => (o.mode === 'dl02' ? o.kinds[i % o.kinds.length] : undefined);
  const random = Array.from({ length: o.runs }, (_, i) => ({ plant: 'none', kind: kindOf(i), point: null }));
  const points = [];
  for (let i = 0; i < o.pointRuns; i += 1) {
    for (const [j, point] of CRASH_POINTS.entries()) {
      // A file write needs a recording; the other points alternate a typed and a spoken letter.
      const kind = point === 'after-file-write' ? 'spoken' : (i + j) % 2 === 0 ? 'typed' : 'spoken';
      points.push({ plant: 'none', kind, point });
    }
  }
  const total = random.length + points.length;
  const out = [];
  let r = 0;
  let p = 0;
  for (let i = 0; i < total; i += 1) {
    const takePoint = Math.floor(((i + 1) * points.length) / total) > Math.floor((i * points.length) / total);
    out.push({ run: i + 1, ...(takePoint ? points[p++] : random[r++]) });
  }
  return out;
}

const defined = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

/**
 * @param {object} opts
 * @param {object} opts.driver  simctl-driver.mjs or a test fake
 * @param {'dl01'|'dl02'} opts.mode
 * @param {number} opts.runs  random kills
 * @param {number} [opts.pointRuns]  DL-02: runs at each crash point (default runs / 10, rounded up)
 * @param {string[]} [opts.kinds]  DL-02 kinds, used in turn
 * @param {[number, number]} [opts.delayMs]  kill delay after the drill arms
 * @param {[number, number]} [opts.plantDelayMs]
 * @param {number} [opts.seed]
 * @param {number} [opts.selfCheck]  planted runs of each kind
 * @param {{ bootMs: number, armMs: number, pointMs: number }} [opts.timeouts]
 * @param {(line: string) => void} [opts.log]
 */
export async function runHarness(opts) {
  const given = defined(opts);
  const mode = given.mode === 'dl01' || given.mode === 'dl02' ? given.mode : null;
  const o = {
    kinds: ['typed', 'spoken', 'spoken-unhashed'],
    seed: (Date.now() ^ (Math.random() * 2 ** 31)) >>> 0,
    selfCheck: DEFAULTS.selfCheck,
    log: () => {},
    ...(mode ? DEFAULTS[mode] : {}),
    pointRuns: mode === 'dl02' && Number.isInteger(given.runs) ? Math.ceil(given.runs / 10) : 0,
    ...given,
    timeouts: { ...DEFAULTS.timeouts, ...(given.timeouts ?? {}) },
  };
  /** @type {any} */
  const report = {
    mode: o.mode,
    runsAsked: o.runs,
    pointRunsAsked: o.pointRuns,
    seed: o.seed,
    delayMs: o.delayMs,
    kinds: o.mode === 'dl02' ? o.kinds : null,
    selfCheckPerPlant: o.selfCheck,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    device: null,
    fixtureSha256: null,
    selfCheck: { asked: 0, caught: 0, missed: [], runs: [] },
    runs: [],
    audits: [],
    sweep: {},
    errors: [],
    crashed: null,
    exit: EXIT.usage,
  };
  let stage = 'start';
  const finish = (exit) => {
    report.finishedAt = new Date().toISOString();
    report.exit = exit ?? exitFor(report);
    return report;
  };
  try {
    validate(o);
  } catch (e) {
    if (e instanceof HarnessUsageError) {
      report.errors.push({ phase: 'usage', code: e.message });
      return finish(EXIT.usage);
    }
    throw e;
  }
  const random = seededRandom(o.seed);
  const pick = ([lo, hi]) => Math.round(lo + random() * (hi - lo));
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const driver = o.driver;
  const io = { sha256: (path) => driver.sha256(path), playable: (path) => driver.playable(path) };

  const waitFor = async (kind, run, pid, timeoutMs, pollMs) => {
    const t0 = Date.now();
    for (;;) {
      const m = driver.readMarker(kind, run);
      if (m) return { ok: true, marker: m };
      const err = driver.readMarker('error', run);
      if (err) return { ok: false, code: String(err.code ?? 'drill_error') };
      if (!(await driver.alive(pid))) return { ok: false, code: 'app_exited' };
      if (Date.now() - t0 > timeoutMs) return { ok: false, code: `no_${kind}_marker` };
      await sleep(pollMs);
    }
  };

  const expectFor = (p) =>
    o.mode === 'dl02'
      ? { fixtureSha: report.fixtureSha256, outcome: p.item.point ? POINT_EXPECTS[p.item.point] : null, point: p.item.point }
      : { expectedMs: Number.isFinite(p.armed.recordedMs) ? p.armed.recordedMs + p.waitedMs : null };

  const baseOf = (p) => ({
    run: p.item.run,
    plant: p.item.plant,
    kind: p.item.kind ?? null,
    point: p.item.point ?? null,
    delayMs: p.delayMs,
    waitedMs: p.waitedMs,
    saveDone: p.saveDone,
    diedBeforeKill: p.diedBeforeKill,
  });

  /** One fresh install, the setup launch, then each item killed in turn. */
  const series = async (items, delayRange, label) => {
    const results = [];
    const errors = [];
    const kept = [];
    const badIds = new Set();
    const badFiles = new Set();
    let fatal = false;

    const judge = (p, bootMarker) => {
      const base = baseOf(p);
      let snap;
      try {
        snap = driver.snapshot();
      } catch (e) {
        fatal = true;
        return { ...base, outcome: 'fail', reasons: [`the database could not be read after this kill: ${String(e?.message ?? e).slice(0, 160)}`] };
      }
      const expect = expectFor(p);
      const verdict = o.mode === 'dl02' ? classifyDl02(snap, p.armed, io, expect) : classifyDl01(snap, p.armed, io, expect);
      const result = { ...base, ...verdict, reasons: [...verdict.reasons] };
      if (bootMarker && bootMarker.swept === false) {
        result.outcome = 'fail';
        result.reasons.push('the launch sweep did not finish after this kill');
      }
      if (isBad(result.outcome) || p.item.plant !== 'none') {
        badIds.add(p.armed.draftId);
        if (p.armed.audioFile) badFiles.add(p.armed.audioFile);
      }
      const problems = auditStore(snap, io, { mode: o.mode, kept, badIds, badFiles });
      if (problems.length) {
        report.audits.push({ afterRun: base.run, problems: problems.map((x) => x.reason) });
        if (p.item.plant === 'none') {
          result.outcome = 'fail';
          result.reasons.push(...problems.map((x) => `after this kill: ${x.reason}`));
        }
        for (const x of problems) {
          const i = kept.findIndex((k) => k.run === x.run);
          if (i < 0) continue;
          badIds.add(kept[i].armed.draftId);
          if (kept[i].armed.audioFile) badFiles.add(kept[i].armed.audioFile);
          kept.splice(i, 1);
        }
      } else if (p.item.plant === 'none' && !isBad(result.outcome)) {
        kept.push({ run: base.run, outcome: result.outcome, armed: p.armed, expect });
      }
      return result;
    };

    /**
     * What the database holds after a launch that did not start (reviewer H): read only once that launch is
     * certainly gone, so the snapshot shows what the kill and the failed launch left, not a write in progress.
     * Never changes the verdict (the run is already a fail); it tells a dead database from a launch that died.
     */
    const databaseAfter = async (p, pid) => {
      await driver.kill(pid);
      if (await driver.alive(pid)) {
        return { read: false, why: 'not read: the failed launch was still running after SIGKILL, and a database another process may still be writing would not show what the kill left' };
      }
      let snap;
      try {
        snap = driver.snapshot();
      } catch (e) {
        return { read: false, why: `could not be read: ${String(e?.message ?? e).slice(0, 160)}` };
      }
      const v = o.mode === 'dl02' ? classifyDl02(snap, p.armed, io, expectFor(p)) : classifyDl01(snap, p.armed, io, expectFor(p));
      const others = { mode: o.mode, kept, badIds: new Set([...badIds, p.armed.draftId]), badFiles: new Set([...badFiles, ...(p.armed.audioFile ? [p.armed.audioFile] : [])]) };
      const problems = auditStore(snap, io, others).map((x) => x.reason);
      return { read: true, integrity: snap.integrity, run: v.outcome, runReasons: v.reasons, earlierKept: kept.length, problems };
    };

    const describeDatabase = (d) => {
      if (!d.read) return `the database after the failed launch: ${d.why}`;
      const run = `this run is ${d.run} in it${d.runReasons.length ? ` (${d.runReasons.join('; ')})` : ''}`;
      const rest = d.problems.length ? `${d.problems.length} problem(s): ${d.problems.join('; ')}` : `the ${d.earlierKept} earlier kept run(s) are as judged`;
      return `the database after the failed launch: integrity_check ${d.integrity}; ${run}; ${rest}`;
    };

    /** The killed run when the next launch did not start: a fail (exit 1) naming the run, the seed and the kill time. */
    const relaunchFailed = async (p, code, pid) => {
      fatal = true;
      const database = await databaseAfter(p, pid);
      return {
        ...baseOf(p),
        outcome: 'fail',
        reasons: [`the app did not start again after this kill (${code}); seed ${o.seed}, killed ${p.waitedMs} ms after it ${p.item.point ? `reached ${p.item.point}` : 'armed'}`, describeDatabase(database)],
        database,
      };
    };

    const addSweep = (bootMarker) => {
      for (const [k, n] of Object.entries(bootMarker?.sweep ?? {})) report.sweep[k] = (report.sweep[k] ?? 0) + Number(n || 0);
    };

    stage = `${label}: reset`;
    await driver.reset();
    if (o.mode === 'dl02' && driver.fixtureSha256) report.fixtureSha256 = driver.fixtureSha256();
    stage = `${label}: setup launch`;
    const setupPid = await driver.launch({ mode: 'setup', run: 0 });
    const setup = await waitFor('boot', 0, setupPid, o.timeouts.bootMs, 50);
    await driver.terminate(setupPid);
    if (!setup.ok) return { results, errors: [{ phase: label, run: 0, code: setup.code }], fatal };
    let pending = null;
    let last = 0;
    for (const item of items) {
      last = item.run;
      stage = `${label}: run ${item.run}, launch`;
      const pid = await driver.launch({ mode: o.mode, run: item.run, kind: item.kind, plant: item.plant, point: item.point });
      const boot = await waitFor('boot', item.run, pid, o.timeouts.bootMs, 50);
      if (pending) {
        stage = `${label}: run ${pending.item.run}, judge`;
        if (!boot.ok) {
          results.push(await relaunchFailed(pending, boot.code, pid));
          await driver.kill(pid);
          return { results, errors, fatal };
        }
        results.push(judge(pending, boot.marker));
        pending = null;
        if (fatal) {
          await driver.kill(pid);
          return { results, errors, fatal };
        }
      } else if (!boot.ok) {
        errors.push({ phase: label, run: item.run, code: boot.code });
        await driver.kill(pid);
        return { results, errors, fatal };
      }
      addSweep(boot.marker);
      stage = `${label}: run ${item.run}, arm`;
      driver.writeGo(item.run);
      const armed = await waitFor('armed', item.run, pid, o.timeouts.armMs, 1);
      if (!armed.ok) {
        errors.push({ phase: label, run: item.run, code: armed.code });
        await driver.kill(pid);
        return { results, errors, fatal };
      }
      let delayMs = 0;
      const t0 = performance.now();
      if (item.point) {
        const at = await waitFor('point', item.run, pid, o.timeouts.pointMs, 1);
        if (!at.ok) {
          errors.push({ phase: label, run: item.run, code: at.code });
          await driver.kill(pid);
          return { results, errors, fatal };
        }
      } else {
        delayMs = pick(delayRange);
        if (delayMs > 0) await sleep(delayMs);
      }
      const waitedMs = Math.round(performance.now() - t0);
      stage = `${label}: run ${item.run}, kill`;
      const wasAlive = await driver.kill(pid);
      pending = { item, armed: armed.marker, delayMs, waitedMs, saveDone: driver.readMarker('done', item.run) !== null, diedBeforeKill: !wasAlive };
      o.log(`${label} run ${item.run}: killed ${item.point ? `at ${item.point}` : `after ${waitedMs} ms`}`);
    }
    if (pending) {
      const verifyRun = last + 1;
      stage = `${label}: verify launch`;
      const pid = await driver.launch({ mode: 'verify', run: verifyRun });
      const boot = await waitFor('boot', verifyRun, pid, o.timeouts.bootMs, 50);
      stage = `${label}: run ${pending.item.run}, judge`;
      if (boot.ok) {
        addSweep(boot.marker);
        results.push(judge(pending, boot.marker));
      } else {
        results.push(await relaunchFailed(pending, boot.code, pid));
      }
      await driver.terminate(pid);
    }
    return { results, errors, fatal };
  };

  try {
    report.device = driver.info ? await driver.info() : null;

    // 1. Self-check: planted failures on their own install. Each must come back as the failure it plants.
    const planted = [];
    for (const plant of PLANTS[o.mode]) {
      for (let i = 0; i < o.selfCheck; i += 1) {
        const kind = o.mode === 'dl02' ? (plant === 'damage' ? 'spoken' : o.kinds[planted.length % o.kinds.length]) : undefined;
        planted.push({ run: 9001 + planted.length, plant, kind, point: null });
      }
    }
    const sc = await series(planted, o.plantDelayMs, 'self-check');
    report.selfCheck.asked = planted.length;
    report.selfCheck.runs = sc.results.map((r) => ({ run: r.run, plant: r.plant, kind: r.kind, outcome: r.outcome, reasons: r.reasons }));
    for (const r of sc.results) {
      if (plantCaught(r)) report.selfCheck.caught += 1;
      else report.selfCheck.missed.push({ run: r.run, plant: r.plant, outcome: r.outcome });
    }
    report.errors.push(...sc.errors);
    if (sc.fatal) {
      // The app could not start again after a planted kill: that is a failure of the app, not of the oracle.
      report.runs = sc.results.filter((r) => r.outcome === 'fail' && r.reasons.some((x) => x.startsWith('the app did not start') || x.startsWith('the database could not be read')));
      return finish(EXIT.fail);
    }
    if (sc.errors.length || sc.results.length < planted.length) return finish(EXIT.incomplete);
    if (report.selfCheck.caught < planted.length) return finish(EXIT.blind);

    // 2. The real runs, on a second fresh install.
    const items = planRuns(o);
    report.runsPlanned = items.length;
    const real = await series(items, o.delayMs, 'run');
    report.runs = real.results;
    report.errors.push(...real.errors);
    return finish();
  } catch (e) {
    report.crashed = { stage, message: String(e?.message ?? e).slice(0, 300) };
    report.errors.push({ phase: 'harness', stage, code: report.crashed.message });
    return finish();
  }
}

/**
 * The counts a report shows, from its judged runs: one key per outcome, plus the derived figures.
 * @returns {Record<string, any> & { completed: number, bad: number }}
 */
export function countsOf(report) {
  /** @type {Record<string, any> & { completed: number, bad: number }} */
  const c = { completed: report.runs.length, bad: 0 };
  for (const r of report.runs) {
    c[r.outcome] = (c[r.outcome] ?? 0) + 1;
    if (isBad(r.outcome)) c.bad += 1;
  }
  const stratum = (list) => ({ runs: list.length, bad: list.filter((r) => isBad(r.outcome)).length });
  c.random = stratum(report.runs.filter((r) => !r.point));
  c.points = Object.fromEntries(CRASH_POINTS.map((pt) => [pt, stratum(report.runs.filter((r) => r.point === pt))]));
  if (report.mode === 'dl02') {
    // A letter whose save had not returned when the kill came: the kill landed after the commit, inside Save.
    c.insideSave = report.runs.filter((r) => !r.point && r.outcome === 'letter' && !r.saveDone).length;
    c.beforeCommit = report.runs.filter((r) => !r.point && r.outcome === 'draft').length;
  } else {
    const kept = (c['kept-playable'] ?? 0) + (c['kept-unplayable'] ?? 0);
    c.kept = kept;
    c.within5s = report.runs.filter((r) => r.within5s).length;
    c.unplayableRate = kept ? (c['kept-unplayable'] ?? 0) / kept : null;
    c.wronglyListed = report.runs.filter((r) => r.wronglyListed).length;
    const keptRuns = report.runs.filter((r) => r.outcome === 'kept-playable' || r.outcome === 'kept-unplayable');
    c.storedPath = {
      same: keptRuns.filter((r) => r.storedPath === 'same').length,
      otherContainer: keptRuns.filter((r) => r.storedPath === 'other-container').length,
      other: report.runs.filter((r) => r.storedPath === 'other').length,
    };
    // ADR 0027: kept ADTS takes, their tails as the kill left them, and those failing a check V1 names.
    const adts = keptRuns.filter((r) => r.container === 'adts' && r.adts);
    c.adts = {
      kept: adts.length,
      none: adts.filter((r) => r.adts.tail === 'none').length,
      cut: adts.filter((r) => r.adts.tail === 'cut').length,
      break: adts.filter((r) => r.adts.tail === 'break').length,
      notAdts: adts.filter((r) => !r.adts.adts).length,
      v1Failing: adts.filter((r) => v1Findings(r.adts).length > 0).length,
    };
  }
  return c;
}

export function exitFor(report) {
  if (report.errors.some((e) => e.phase === 'usage')) return EXIT.usage;
  const c = countsOf(report);
  if (c.bad > 0) return EXIT.fail;
  if (report.selfCheck.asked > 0 && report.selfCheck.caught < report.selfCheck.asked) {
    return report.errors.length || report.crashed ? EXIT.incomplete : EXIT.blind;
  }
  const planned = report.runsPlanned ?? report.runsAsked + 4 * (report.pointRunsAsked ?? 0);
  if (report.crashed || report.errors.length || c.completed < planned) return EXIT.incomplete;
  // 07: 49 or more of 50 kept takes play to within 5 s of the kill.
  if (report.mode === 'dl01' && c.within5s < Math.ceil(DEFAULTS.playableShare * c.completed)) return EXIT.fail;
  return EXIT.pass;
}

/** Whether a report is big enough to be the B2-11 gate. */
export function meetsGate(report) {
  const c = countsOf(report);
  if (report.mode === 'dl01') return c.random.runs >= GATE.runs;
  return c.random.runs >= GATE.runs && CRASH_POINTS.every((pt) => c.points[pt].runs >= GATE.pointRuns);
}

const sameSettings = (a, b) =>
  a.mode === b.mode &&
  JSON.stringify(a.delayMs) === JSON.stringify(b.delayMs) &&
  JSON.stringify(a.kinds) === JSON.stringify(b.kinds) &&
  a.selfCheckPerPlant === b.selfCheckPerPlant &&
  (a.pointRunsAsked > 0) === (b.pointRunsAsked > 0);
const sameBuild = (a, b) => ['version', 'build', 'commit', 'bundleId'].every((k) => (a.device ?? {})[k] === (b.device ?? {})[k]);

/** Sums shards of one gate run. Refuses a shard given twice and shards with other settings or another build. */
export function mergeReports(reports) {
  if (!reports.length) throw new HarnessUsageError('nothing to merge');
  const seen = new Set();
  for (const r of reports) {
    const key = `${r.seed}|${r.startedAt}`;
    if (seen.has(key)) throw new HarnessUsageError(`the shard with seed ${r.seed} is given twice`);
    seen.add(key);
    if (!sameSettings(reports[0], r)) throw new HarnessUsageError('shards with different settings (mode, delays, kinds, self-check or crash points) cannot be merged');
    if (!sameBuild(reports[0], r)) throw new HarnessUsageError('shards of different builds or commits cannot be merged');
  }
  /** @type {any} */
  const merged = {
    mode: reports[0].mode,
    runsAsked: reports.reduce((n, r) => n + r.runsAsked, 0),
    pointRunsAsked: reports.reduce((n, r) => n + (r.pointRunsAsked ?? 0), 0),
    runsPlanned: reports.reduce((n, r) => n + (r.runsPlanned ?? r.runsAsked + 4 * (r.pointRunsAsked ?? 0)), 0),
    seed: reports.map((r) => r.seed),
    delayMs: reports[0].delayMs,
    kinds: reports[0].kinds,
    selfCheckPerPlant: reports[0].selfCheckPerPlant,
    startedAt: reports.map((r) => r.startedAt).sort()[0],
    finishedAt: reports.map((r) => r.finishedAt ?? '').sort().at(-1),
    device: reports.map((r) => r.device),
    fixtureSha256: reports.map((r) => r.fixtureSha256),
    selfCheck: {
      asked: reports.reduce((n, r) => n + r.selfCheck.asked, 0),
      caught: reports.reduce((n, r) => n + r.selfCheck.caught, 0),
      missed: reports.flatMap((r) => r.selfCheck.missed),
      runs: reports.flatMap((r) => r.selfCheck.runs),
    },
    runs: reports.flatMap((r, i) => r.runs.map((x) => ({ ...x, shard: i + 1 }))),
    audits: reports.flatMap((r) => r.audits ?? []),
    sweep: {},
    errors: reports.flatMap((r) => r.errors),
    crashed: reports.find((r) => r.crashed)?.crashed ?? null,
    exit: EXIT.usage,
  };
  for (const r of reports) for (const [k, n] of Object.entries(r.sweep ?? {})) merged.sweep[k] = (merged.sweep[k] ?? 0) + n;
  merged.exit = exitFor(merged);
  return merged;
}

const VERDICT = {
  [EXIT.pass]: 'PASS: every run kept its letter or recording exactly once, the database checked clean after every relaunch, and the self-check caught every planted failure',
  [EXIT.fail]: 'FAIL: a run lost, doubled or damaged a letter or recording, the app did not start after a kill, or the database check failed',
  [EXIT.usage]: 'NOT RUN: usage error',
  [EXIT.incomplete]: 'INCOMPLETE: not every run finished (see errors); this is not a pass',
  [EXIT.blind]: 'BLIND: the self-check missed a planted failure, so this run proves nothing',
};

const pct = (x) => `${(x * 100).toFixed(1)}%`;

/** A content-free Markdown summary (run numbers, outcomes and reasons; no ids, no words). */
export function renderMarkdown(report) {
  const c = countsOf(report);
  const title = report.mode === 'dl02' ? 'DL-02, kill during save' : 'DL-01, kill while recording';
  const seeds = Array.isArray(report.seed) ? report.seed.join(', ') : report.seed;
  const lines = [
    `# Kill harness: ${title}`,
    '',
    `**${VERDICT[report.exit]}** (exit ${report.exit}).`,
    '',
    '| | |',
    '|---|---|',
    `| Runs planned, judged | ${report.runsPlanned ?? report.runsAsked}, ${c.completed} |`,
    `| Random kills | ${c.random.runs}, ${report.delayMs[0]} to ${report.delayMs[1]} ms after the drill armed; seed ${seeds} (replaying a seed also needs the same --self-check) |`,
  ];
  if (report.mode === 'dl02') lines.push(`| Crash-point kills | ${CRASH_POINTS.map((pt) => `${pt} ${c.points[pt].runs}`).join(', ')} |`);
  if (report.kinds) lines.push(`| Kinds, in turn | ${report.kinds.join(', ')} |`);
  lines.push(`| Self-check (planted failures) | ${report.selfCheck.caught} of ${report.selfCheck.asked} caught |`);
  lines.push(`| Database checks after every relaunch | integrity_check, rows pointing at missing files, stored hashes, every earlier kept letter judged again: ${report.audits.length ? `${report.audits.length} relaunch(es) found problems` : 'clean'} |`);
  lines.push(`| Started, finished (UTC) | ${report.startedAt}, ${report.finishedAt ?? 'not finished'} |`);
  const devices = (Array.isArray(report.device) ? report.device : [report.device]).filter(Boolean);
  for (const d of devices) lines.push(`| Device and build | ${Object.entries(d).map(([k, v]) => `${k} ${v}`).join('; ')} |`);
  if (Object.keys(report.sweep ?? {}).length) lines.push(`| The app's launch sweep, summed | ${Object.entries(report.sweep).map(([k, n]) => `${k} ${n}`).join(', ')} |`);
  lines.push('', '| Outcome | Runs |', '|---|---|');
  const order = report.mode === 'dl02' ? ['letter', 'draft', 'lost', 'doubled', 'fail'] : ['kept-playable', 'kept-unplayable', 'lost', 'doubled', 'fail'];
  for (const k of order) lines.push(`| ${k} | ${c[k] ?? 0} |`);
  if (report.mode === 'dl02') {
    lines.push(`| (random kills before the commit: the draft kept) | ${c.beforeCommit} |`);
    lines.push(`| (random kills inside Save after the commit) | ${c.insideSave} |`);
  } else {
    lines.push(`| (playing to within 5 s of the kill; 07 needs ${pct(DEFAULTS.playableShare)}) | ${c.within5s} of ${c.completed} |`);
    lines.push(`| (playable but listed as unplayable) | ${c.wronglyListed} |`);
    lines.push(`| (kept, the row's stored path is the take's path on disk) | ${c.storedPath.same} of ${c.kept}${c.storedPath.otherContainer ? `; ${c.storedPath.otherContainer} name the same folder and file under another container path` : ''} |`);
  }
  lines.push('', 'What a clean result rules out (95% upper bound on the loss rate per kill, zero failures in n runs; about 3/n):', '');
  const bound = (s) => (s.bad === 0 && s.runs > 0 ? `${s.runs} clean, rules out above ${pct(upperBound95(s.runs))}` : s.runs ? `${s.bad} of ${s.runs} bad` : 'none run');
  lines.push(`- random kills: ${bound(c.random)}`);
  if (report.mode === 'dl02') for (const pt of CRASH_POINTS) lines.push(`- at ${pt}: ${bound(c.points[pt])}`);
  lines.push('', meetsGate(report) ? 'Big enough for the B2-11 gate (on the freeze commit).' : `Smaller than the B2-11 gate (${GATE.runs} random kills${report.mode === 'dl02' ? ` and ${GATE.pointRuns} at each crash point` : ''}).`);
  const bad = report.runs.filter((r) => isBad(r.outcome));
  if (bad.length) {
    lines.push('', '| Run | Kind | Point | Outcome | Why |', '|---|---|---|---|---|');
    for (const r of bad.slice(0, 50)) lines.push(`| ${r.run} | ${r.kind ?? '-'} | ${r.point ?? '-'} | ${r.outcome} | ${r.reasons.join('; ')} |`);
    if (bad.length > 50) lines.push(`| ... | | | | ${bad.length - 50} more in report.json |`);
  }
  if (report.selfCheck.missed.length) {
    lines.push('', 'Planted failures the harness missed:');
    for (const m of report.selfCheck.missed) lines.push(`- run ${m.run}, planted ${m.plant}, judged ${m.outcome}`);
  }
  if (report.errors.length) {
    lines.push('', 'Errors:');
    for (const e of report.errors) lines.push(`- ${e.phase}${e.stage ? ` (${e.stage})` : ''} run ${e.run ?? '-'}: ${e.code}`);
  }
  if (report.mode === 'dl01') lines.push(...renderAdts(report, c));
  return `${lines.join('\n')}\n`;
}

const runLabel = (r) => (r.shard ? `${r.shard}.${r.run}` : String(r.run));
const fixed = (x, d) => (Number.isFinite(x) ? x.toFixed(d) : '-');

/**
 * ADR 0027 checks V1 and V2 for every kept ADTS take: how it was judged (whole frames, not afinfo's estimate), its
 * tail as the kill left it, and V1's evidence (the first 16 bytes, afinfo's output without the file's name, the
 * header fields and the frame size distribution). Run numbers only; no ids, no words, no audio beyond 16 bytes.
 */
function renderAdts(report, c) {
  const runs = report.runs.filter((r) => (r.outcome === 'kept-playable' || r.outcome === 'kept-unplayable') && r.container === 'adts' && r.adts);
  if (!runs.length) return [];
  const a = c.adts;
  const out = ['', '## ADTS takes (ADR 0027, checks V1 and V2)', ''];
  out.push(
    "An ADTS take's length is its whole frames (frames x 1024 / sample rate), counted on the host with the app's own `scanAdts`, never afinfo's estimated duration; afinfo must still open it.",
    '',
    '| | |',
    '|---|---|',
    `| Kept .aac takes | ${a.kept} of ${c.kept} kept |`,
    `| Tails after the kill (scanAdts) | none ${a.none}, cut ${a.cut}, break ${a.break} |`,
  );
  const sizes = runs.map((r) => r.adts.frameBytes).filter(Boolean);
  const frames = sizes.reduce((n, s) => n + s.count, 0);
  const bytes = runs.reduce((n, r) => n + (r.adts.frameBytes ? r.adts.wholeBytes : 0), 0);
  if (sizes.length) {
    out.push(
      `| Frame bytes over every kept take | min ${Math.min(...sizes.map((s) => s.min ?? Infinity))}, mean ${frames ? (bytes / frames).toFixed(1) : '-'}, max ${Math.max(...sizes.map((s) => s.max ?? 0))}, over ${frames} frames; over ${MONO_FRAME_LIMIT} bytes: ${sizes.reduce((n, s) => n + s.overLimit, 0)} |`,
    );
  }
  out.push(`| Takes failing a V1 check (FF F1, AAC-LC, frequency index 3, channel configuration 1, no ftyp at offset 4, no frame over ${MONO_FRAME_LIMIT} bytes, no break) | ${a.v1Failing} |`);
  const devices = (Array.isArray(report.device) ? report.device : [report.device]).filter(Boolean);
  const inputs = [...new Set(devices.map((d) => d.micInput).filter(Boolean))];
  if (inputs.length) out.push(`| Microphone input | ${inputs.join(', ')}. A silent input gives the frame sizes of silence: V1's speech half needs a device run |`);
  const findings = runs.flatMap((r) => v1Findings(r.adts).map((x) => `run ${runLabel(r)}: ${x}`));
  if (findings.length) {
    out.push('', `**FINDING, to report before any flip (ADR 0027): ${findings.length} V1 or tail finding(s).**`, '');
    for (const x of findings.slice(0, 100)) out.push(`- ${x}`);
    if (findings.length > 100) out.push(`- ... ${findings.length - 100} more in report.json`);
  }
  out.push(
    '',
    '| Run | afinfo opens | Whole frames | Length by frames (s) | afinfo estimate (s) | Off the kill point (ms) | Bytes after the last whole frame | Tail | Frame bytes min, mean, max | kbit/s | First header | Stored path |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|',
  );
  for (const r of runs) {
    const f = r.adts;
    const h = f.header;
    const head = h ? `${h.profile}, frequency index ${h.frequencyIndex}, channel configuration ${h.channelConfiguration}${h.crc ? ', CRC' : ''}${f.ftypAt4 ? ', ftyp at 4' : ''}` : f.ftypAt4 ? 'not ADTS (ftyp at 4)' : 'not ADTS';
    const fb = f.frameBytes ? `${f.frameBytes.min}, ${f.frameBytes.mean}, ${f.frameBytes.max}` : '-';
    out.push(
      `| ${runLabel(r)} | ${r.afinfoOpens === true ? 'yes' : r.afinfoOpens === false ? 'no' : 'not run'} | ${f.adts ? f.frames : '-'} | ${fixed(r.durationS, 3)} | ${fixed(r.afinfoDurationS, 3)} | ${r.deviationMs ?? '-'} | ${f.adts ? f.tailBytes : '-'} | ${f.adts ? f.tail : '-'}${f.framesAfterBreak ? ` (${f.framesAfterBreak} frames after it)` : ''} | ${fb} | ${f.kbps ?? '-'} | ${head} | ${r.storedPath ?? '-'} |`,
    );
  }
  out.push('', "### V1 evidence for each kept take (afinfo's File line replaced; nothing else changed)");
  for (const r of runs) {
    const af = afinfoFields(r.afinfo);
    out.push(
      '',
      `Run ${runLabel(r)}: afinfo file type ${af.fileType ?? '-'}; data format ${af.dataFormat ?? '-'}; bit rate ${af.bitRate ?? '-'}. First 16 bytes (xxd -l 16):`,
      '',
      '```',
      r.adts.first16,
      ...(r.afinfo ? ['', r.afinfo] : ['', '(no afinfo output)']),
      '```',
    );
  }
  return out;
}
