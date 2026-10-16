// The kill harness loop (RA-19-04): launch, wait for the drill to arm, wait a random time, SIGKILL,
// relaunch, let the app's own launch sweep run, then judge the killed run from the host (oracle.mjs).
// Device-neutral: the iOS simulator driver is simctl-driver.mjs; the Node tests drive a fake app.
//
// A run cannot pass vacuously: before the real runs, on its own fresh install, the harness runs planted
// failures (the app loses or doubles a letter on purpose) and stops with exit 4 unless it caught every one.
import { classifyDl01, classifyDl02, isBad } from './oracle.mjs';
import { DRILL_KINDS, PLANT_LOSS_GAP_MS } from './protocol.mjs';

export const EXIT = Object.freeze({ pass: 0, fail: 1, usage: 2, incomplete: 3, blind: 4 });

export const DEFAULTS = Object.freeze({
  dl02: { delayMs: [0, 400], plantDelayMs: [0, 400] },
  dl01: { delayMs: [2000, 60000], plantDelayMs: [2000, 4000] },
  timeouts: { bootMs: 120000, armMs: 30000 },
  selfCheck: 2,
});

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

class HarnessUsageError extends Error {}

function check(cond, message) {
  if (!cond) throw new HarnessUsageError(message);
}

function validate(o) {
  check(o.mode === 'dl01' || o.mode === 'dl02', 'mode must be dl01 or dl02');
  check(Number.isInteger(o.runs) && o.runs >= 1, 'runs must be a whole number from 1');
  for (const k of ['delayMs', 'plantDelayMs']) {
    const [lo, hi] = o[k];
    check(Number.isFinite(lo) && Number.isFinite(hi) && lo >= 0 && hi >= lo, `${k} must be a range from 0 up`);
  }
  check(Number.isInteger(o.selfCheck) && o.selfCheck >= 1, 'the self-check needs at least one planted run of each kind');
  if (o.mode === 'dl02') {
    check(o.kinds.length > 0 && o.kinds.every((k) => DRILL_KINDS.includes(k)), 'unknown DL-02 kind');
    // The planted loss holds the letter in neither table for PLANT_LOSS_GAP_MS; a later kill would miss it.
    check(o.plantDelayMs[1] < PLANT_LOSS_GAP_MS, `plant delays must stay under ${PLANT_LOSS_GAP_MS} ms`);
  }
}

/**
 * @param {object} opts
 * @param {object} opts.driver  simctl-driver.mjs or a test fake
 * @param {'dl01'|'dl02'} opts.mode
 * @param {number} opts.runs
 * @param {string[]} [opts.kinds]  DL-02 kinds, used in turn
 * @param {[number, number]} [opts.delayMs]  kill delay after the drill arms
 * @param {[number, number]} [opts.plantDelayMs]
 * @param {number} [opts.seed]
 * @param {number} [opts.selfCheck]  planted runs of each kind (loss, double)
 * @param {{ bootMs: number, armMs: number }} [opts.timeouts]
 * @param {(line: string) => void} [opts.log]
 */
export async function runHarness(opts) {
  const o = {
    kinds: ['typed', 'spoken', 'spoken-unhashed'],
    seed: (Date.now() ^ (Math.random() * 2 ** 31)) >>> 0,
    selfCheck: DEFAULTS.selfCheck,
    timeouts: DEFAULTS.timeouts,
    log: () => {},
    ...(opts.mode === 'dl01' || opts.mode === 'dl02' ? DEFAULTS[opts.mode] : {}),
    ...opts,
  };
  const report = {
    mode: o.mode,
    runsAsked: o.runs,
    seed: o.seed,
    delayMs: o.delayMs,
    kinds: o.mode === 'dl02' ? o.kinds : null,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    device: null,
    selfCheck: { asked: 0, caught: 0, missed: [], runs: [] },
    runs: [],
    errors: [],
    exit: EXIT.usage,
  };
  try {
    validate(o);
  } catch (e) {
    if (e instanceof HarnessUsageError) {
      report.errors.push({ phase: 'usage', code: e.message });
      return report;
    }
    throw e;
  }
  const random = seededRandom(o.seed);
  const pick = ([lo, hi]) => Math.round(lo + random() * (hi - lo));
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const driver = o.driver;
  report.device = driver.info ? await driver.info() : null;

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

  const judge = (p) => {
    const snap = driver.snapshot();
    const io = { sha256: (path) => driver.sha256(path), playable: (path) => driver.playable(path) };
    const verdict = o.mode === 'dl02' ? classifyDl02(snap, p.armed, io) : classifyDl01(snap, p.armed, io);
    return {
      run: p.item.run,
      plant: p.item.plant,
      kind: p.item.kind ?? null,
      delayMs: p.delayMs,
      waitedMs: p.waitedMs,
      saveDone: p.saveDone,
      diedBeforeKill: p.diedBeforeKill,
      ...verdict,
    };
  };

  /** One fresh install, the setup launch, then each item killed in turn; returns judged runs and errors. */
  const series = async (items, delayRange, label) => {
    await driver.reset();
    const results = [];
    const errors = [];
    const setupPid = await driver.launch({ mode: 'setup', run: 0 });
    const setup = await waitFor('boot', 0, setupPid, o.timeouts.bootMs, 50);
    await driver.terminate(setupPid);
    if (!setup.ok) return { results, errors: [{ phase: label, run: 0, code: setup.code }] };
    let pending = null;
    let last = 0;
    for (const item of items) {
      last = item.run;
      const pid = await driver.launch({ mode: o.mode, run: item.run, kind: item.kind, plant: item.plant });
      const boot = await waitFor('boot', item.run, pid, o.timeouts.bootMs, 50);
      if (!boot.ok) {
        errors.push({ phase: label, run: item.run, code: boot.code });
        await driver.kill(pid);
        pending = null;
        break;
      }
      if (pending) results.push(judge(pending));
      pending = null;
      const armed = await waitFor('armed', item.run, pid, o.timeouts.armMs, 1);
      if (!armed.ok) {
        errors.push({ phase: label, run: item.run, code: armed.code });
        await driver.kill(pid);
        break;
      }
      const delayMs = pick(delayRange);
      const t0 = performance.now();
      if (delayMs > 0) await sleep(delayMs);
      const waitedMs = Math.round(performance.now() - t0);
      const wasAlive = await driver.kill(pid);
      pending = { item, armed: armed.marker, delayMs, waitedMs, saveDone: driver.readMarker('done', item.run) !== null, diedBeforeKill: !wasAlive };
      o.log(`${label} run ${item.run}: killed after ${waitedMs} ms`);
    }
    if (pending) {
      const verifyRun = last + 1;
      const pid = await driver.launch({ mode: 'verify', run: verifyRun });
      const boot = await waitFor('boot', verifyRun, pid, o.timeouts.bootMs, 50);
      if (boot.ok) results.push(judge(pending));
      else errors.push({ phase: label, run: verifyRun, code: boot.code });
      await driver.terminate(pid);
    }
    return { results, errors };
  };

  const kindOf = (i) => (o.mode === 'dl02' ? o.kinds[i % o.kinds.length] : undefined);

  // 1. Self-check: planted failures on their own install. Each must come back as the failure it plants.
  const planted = [];
  for (const plant of ['loss', 'double']) {
    for (let i = 0; i < o.selfCheck; i += 1) planted.push({ run: 9001 + planted.length, plant, kind: kindOf(planted.length) });
  }
  const sc = await series(planted, o.plantDelayMs, 'self-check');
  report.selfCheck.asked = planted.length;
  report.selfCheck.runs = sc.results.map((r) => ({ run: r.run, plant: r.plant, kind: r.kind, outcome: r.outcome }));
  for (const r of sc.results) {
    const want = r.plant === 'loss' ? 'lost' : 'doubled';
    if (r.outcome === want) report.selfCheck.caught += 1;
    else report.selfCheck.missed.push({ run: r.run, plant: r.plant, outcome: r.outcome });
  }
  report.errors.push(...sc.errors);
  if (sc.errors.length || sc.results.length < planted.length) {
    report.exit = EXIT.incomplete;
    report.finishedAt = new Date().toISOString();
    return report;
  }
  if (report.selfCheck.caught < planted.length) {
    report.exit = EXIT.blind;
    report.finishedAt = new Date().toISOString();
    return report;
  }

  // 2. The real runs, on a second fresh install.
  const items = Array.from({ length: o.runs }, (_, i) => ({ run: i + 1, plant: 'none', kind: kindOf(i) }));
  const real = await series(items, o.delayMs, 'run');
  report.runs = real.results;
  report.errors.push(...real.errors);
  report.finishedAt = new Date().toISOString();
  report.exit = exitFor(report);
  return report;
}

/**
 * The counts a report shows, from its judged runs: one key per outcome, plus the derived figures.
 * @returns {Record<string, number | null> & { completed: number, bad: number }}
 */
export function countsOf(report) {
  /** @type {Record<string, number | null> & { completed: number, bad: number }} */
  const c = { completed: report.runs.length, bad: 0 };
  for (const r of report.runs) {
    c[r.outcome] = (c[r.outcome] ?? 0) + 1;
    if (isBad(r.outcome)) c.bad += 1;
  }
  if (report.mode === 'dl02') {
    // A letter whose save had not returned when the kill came: the kill landed after the commit, inside Save.
    c.insideSave = report.runs.filter((r) => r.outcome === 'letter' && !r.saveDone).length;
  } else {
    const kept = (c['kept-playable'] ?? 0) + (c['kept-unplayable'] ?? 0);
    c.kept = kept;
    c.unplayableRate = kept ? (c['kept-unplayable'] ?? 0) / kept : null;
    c.wronglyListed = report.runs.filter((r) => r.wronglyListed).length;
  }
  return c;
}

export function exitFor(report) {
  if (report.errors.some((e) => e.phase === 'usage')) return EXIT.usage;
  if (report.selfCheck.asked > 0 && report.selfCheck.caught < report.selfCheck.asked) {
    return report.errors.length ? EXIT.incomplete : EXIT.blind;
  }
  const c = countsOf(report);
  if (c.bad > 0) return EXIT.fail;
  if (report.errors.length || c.completed < report.runsAsked) return EXIT.incomplete;
  return EXIT.pass;
}

/** Sums reports of the same mode (shards of one gate run); the merged report is judged again. */
export function mergeReports(reports) {
  if (!reports.length) throw new HarnessUsageError('nothing to merge');
  const mode = reports[0].mode;
  if (!reports.every((r) => r.mode === mode)) throw new HarnessUsageError('reports of different modes');
  const merged = {
    mode,
    runsAsked: reports.reduce((n, r) => n + r.runsAsked, 0),
    seed: reports.map((r) => r.seed),
    delayMs: reports[0].delayMs,
    kinds: reports[0].kinds,
    startedAt: reports.map((r) => r.startedAt).sort()[0],
    finishedAt: reports.map((r) => r.finishedAt ?? '').sort().at(-1),
    device: reports.map((r) => r.device),
    selfCheck: {
      asked: reports.reduce((n, r) => n + r.selfCheck.asked, 0),
      caught: reports.reduce((n, r) => n + r.selfCheck.caught, 0),
      missed: reports.flatMap((r) => r.selfCheck.missed),
      runs: reports.flatMap((r) => r.selfCheck.runs),
    },
    runs: reports.flatMap((r, i) => r.runs.map((x) => ({ ...x, shard: i + 1 }))),
    errors: reports.flatMap((r) => r.errors),
    exit: EXIT.usage,
  };
  merged.exit = exitFor(merged);
  return merged;
}

const VERDICT = {
  [EXIT.pass]: 'PASS: every run kept its letter or recording exactly once, and the self-check caught every planted failure',
  [EXIT.fail]: 'FAIL: a run lost, doubled or damaged a letter or recording',
  [EXIT.usage]: 'NOT RUN: usage error',
  [EXIT.incomplete]: 'INCOMPLETE: not every run finished (see errors); this is not a pass',
  [EXIT.blind]: 'BLIND: the self-check missed a planted failure, so this run proves nothing',
};

/** A content-free Markdown summary (run numbers, outcomes and reasons; no ids, no words). */
export function renderMarkdown(report, gateRuns = 500) {
  const c = countsOf(report);
  const title = report.mode === 'dl02' ? 'DL-02, kill during save' : 'DL-01, kill while recording';
  const lines = [
    `# Kill harness: ${title}`,
    '',
    `**${VERDICT[report.exit]}** (exit ${report.exit}).`,
    '',
    `| | |`,
    `|---|---|`,
    `| Runs asked, judged | ${report.runsAsked}, ${c.completed} |`,
    `| Kill delay after the drill armed | ${report.delayMs[0]} to ${report.delayMs[1]} ms, seed ${Array.isArray(report.seed) ? report.seed.join(', ') : report.seed} |`,
  ];
  if (report.kinds) lines.push(`| Kinds, in turn | ${report.kinds.join(', ')} |`);
  lines.push(`| Self-check (planted loss and double) | ${report.selfCheck.caught} of ${report.selfCheck.asked} caught |`);
  lines.push(`| Started, finished (UTC) | ${report.startedAt}, ${report.finishedAt ?? 'not finished'} |`);
  const devices = (Array.isArray(report.device) ? report.device : [report.device]).filter(Boolean);
  for (const d of devices) lines.push(`| Device and build | ${Object.entries(d).map(([k, v]) => `${k} ${v}`).join('; ')} |`);
  lines.push('', '| Outcome | Runs |', '|---|---|');
  const order = report.mode === 'dl02' ? ['letter', 'draft', 'lost', 'doubled', 'fail'] : ['kept-playable', 'kept-unplayable', 'lost', 'doubled', 'fail'];
  for (const k of order) lines.push(`| ${k} | ${c[k] ?? 0} |`);
  if (report.mode === 'dl02') {
    lines.push(`| (letter, killed inside Save after the commit) | ${c.insideSave} |`);
  } else {
    lines.push(`| (unplayable rate of kept takes) | ${c.unplayableRate === null ? 'n/a' : `${(c.unplayableRate * 100).toFixed(1)}%`} |`);
    lines.push(`| (playable but listed as unplayable) | ${c.wronglyListed} |`);
  }
  const passedRuns = c.completed - c.bad;
  lines.push('', `Gate B2-11 needs ${gateRuns} of ${gateRuns} on the freeze commit: this report has ${passedRuns} of ${report.runsAsked} kept${report.runsAsked < gateRuns ? ` (a ${report.runsAsked}-run set, not the gate)` : ''}.`);
  const bad = report.runs.filter((r) => isBad(r.outcome));
  if (bad.length) {
    lines.push('', '| Run | Kind | Outcome | Why |', '|---|---|---|---|');
    for (const r of bad.slice(0, 50)) lines.push(`| ${r.run} | ${r.kind ?? '-'} | ${r.outcome} | ${r.reasons.join('; ')} |`);
    if (bad.length > 50) lines.push(`| ... | | | ${bad.length - 50} more in report.json |`);
  }
  if (report.selfCheck.missed.length) {
    lines.push('', 'Planted failures the harness missed:');
    for (const m of report.selfCheck.missed) lines.push(`- run ${m.run}, planted ${m.plant}, judged ${m.outcome}`);
  }
  if (report.errors.length) {
    lines.push('', 'Errors:');
    for (const e of report.errors) lines.push(`- ${e.phase} run ${e.run ?? '-'}: ${e.code}`);
  }
  return `${lines.join('\n')}\n`;
}
