#!/usr/bin/env node
// The kill harness (RA-19-04; DEVICE_TEST_PLAN DL-01 and DL-02; B2-11 in docs/qa/ALPHA_GO_NO_GO.md, never waived).
// macOS with Xcode. Callable from CI: the workflow is S20's (RA-20-10a); apps/mobile/e2e/ci/kill-harness.yml.example
// is the sketch. Needs an e2e simulator build (`EXPO_PUBLIC_E2E=1`, `EXPO_PUBLIC_APP_ENV=development`, so the
// `.dev` bundle id) with S20's wiring line in app/_layout.tsx (RA-20-18). Instructions: apps/mobile/e2e/README.md section 9.
//
//   node apps/mobile/e2e/kill/run-kill-harness.mjs --mode dl02 --udid <UDID> --app <path/to/App.app> [--runs 500]
//   node apps/mobile/e2e/kill/run-kill-harness.mjs --mode dl01 --udid <UDID> --app <App.app> --mic-silent [--runs 125]
//   node apps/mobile/e2e/kill/run-kill-harness.mjs --merge a/report.json b/report.json
//
// Options: --kind typed|spoken|spoken-unhashed|mixed (DL-02, default mixed), --point-runs N (DL-02 kills at each of the
// four crash points, default runs/10), --delay-ms A-B (DL-02 default 0-400, DL-01 default 10000-120000), --seed N,
// --self-check N (planted runs of each kind, default 2), --bundle-id ID (must match the .app), --out DIR (default
// ~/.scribe-kill/<mode>-<UTC time>), --keep-app (do not uninstall at the end; by default the drill's data, recordings
// included, is deleted), --json (one JSON line).
//
// Exit: 0 every run kept its letter or take exactly once, the database checked clean after every relaunch and the
// self-check caught every plant; 1 a run lost, doubled or damaged one, the app did not start after a kill, or (DL-01)
// fewer than 49 in 50 takes play to within 5 s; 2 usage or a refused setup; 3 incomplete (a timeout, no microphone,
// fewer runs judged than planned, a harness error); 4 the self-check missed a planted failure. Only 0 is green.
// Every exit after the arguments are accepted writes report.json and report.md.
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// node:sqlite prints an experimental warning on first use, and Node notes that it reparses the app's frame scanner
// (src/lib/capture/adts.ts, which apps/mobile/package.json does not mark as a module) as one; the harness output
// stays readable without them.
const emitWarning = process.emitWarning;
const quiet = (w) => String(w).includes('SQLite') || (String(w).includes('adts.ts') && String(w).includes('Module type'));
process.emitWarning = (w, ...rest) => (quiet(w) ? undefined : emitWarning.call(process, w, ...rest));

// The oracle judges ADTS takes with the app's own scanAdts, imported from TypeScript as it is (adts-evidence.mjs):
// Node 22.18 or later strips the types by default. On an older Node nothing runs.
let harness;
try {
  harness = await import('./harness.mjs');
} catch (e) {
  // Before 22.18 (without --experimental-strip-types) Node cannot load a .ts file at all; any other failure is not the version.
  const ts = e?.code === 'ERR_UNKNOWN_FILE_EXTENSION' && String(e?.message ?? '').includes('.ts');
  console.error(
    ts
      ? `the kill harness needs Node 22.18 or later, which imports the app's frame scanner (src/lib/capture/adts.ts) as it is; this is Node ${process.versions.node}`
      : `the kill harness could not load: ${String(e?.message ?? e).slice(0, 300)}`,
  );
  process.exit(2);
}
const { EXIT, mergeReports, renderMarkdown, runHarness, stepSummary } = harness;
const { bundleIdOf, simctlDriver } = await import('./simctl-driver.mjs');
const { DRILL_BUNDLE_SUFFIX } = await import('./protocol.mjs');

const WHOLE = /^\d+$/;

function parse(argv) {
  const a = { merge: [] };
  const whole = (k, v) => {
    if (!WHOLE.test(v)) throw new Error(`${k} takes a whole number (got ${JSON.stringify(v)})`);
    return Number(v);
  };
  for (let i = 0; i < argv.length; i += 1) {
    const k = argv[i];
    const v = () => {
      if (i + 1 >= argv.length) throw new Error(`${k} needs a value`);
      return argv[++i];
    };
    if (k === '--mode') a.mode = v();
    else if (k === '--udid') a.udid = v();
    else if (k === '--app') a.app = v();
    else if (k === '--bundle-id') a.bundleId = v();
    else if (k === '--runs') a.runs = whole(k, v());
    else if (k === '--point-runs') a.pointRuns = whole(k, v());
    else if (k === '--kind') a.kind = v();
    else if (k === '--delay-ms') a.delay = v();
    else if (k === '--seed') a.seed = whole(k, v());
    else if (k === '--self-check') a.selfCheck = whole(k, v());
    else if (k === '--out') a.out = v();
    else if (k === '--keep-app') a.keepApp = true;
    else if (k === '--mic-silent') a.micSilent = true;
    else if (k === '--json') a.json = true;
    else if (k === '--merge') {
      while (i + 1 < argv.length && !argv[i + 1].startsWith('--')) a.merge.push(argv[++i]);
      if (!a.merge.length) throw new Error('--merge needs at least one report.json');
    } else throw new Error(`unknown argument ${k}`);
  }
  return a;
}

function range(text) {
  const m = /^(\d+)-(\d+)$/.exec(text ?? '');
  if (!m) throw new Error('--delay-ms takes A-B in milliseconds, for example 0-400');
  return [Number(m[1]), Number(m[2])];
}

function stamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
}

function publish(report, outDir, asJson) {
  try {
    mkdirSync(outDir, { recursive: true });
    const md = renderMarkdown(report);
    writeFileSync(join(outDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
    writeFileSync(join(outDir, 'report.md'), md);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, stepSummary(report));
    if (asJson) {
      const { runs: _runs, ...head } = report;
      console.log(JSON.stringify(head));
    } else console.log(md);
    console.log(`report: ${join(outDir, 'report.md')}`);
  } catch (e) {
    // The report could not be written: print it, so the result is never lost with the folder.
    console.error(`could not write the report to ${outDir}: ${String(e?.message ?? e)}`);
    console.log(JSON.stringify(report));
  }
}

async function main() {
  let a;
  try {
    a = parse(process.argv.slice(2));
  } catch (e) {
    console.error(String(e.message));
    return EXIT.usage;
  }
  if (a.merge.length) {
    let merged;
    try {
      merged = mergeReports(a.merge.map((p) => JSON.parse(readFileSync(p, 'utf8'))));
    } catch (e) {
      console.error(String(e.message));
      return EXIT.usage;
    }
    publish(merged, a.out ?? join(homedir(), '.scribe-kill', `${merged.mode}-merged-${stamp()}`), a.json);
    return merged.exit;
  }
  if (process.platform !== 'darwin') {
    console.error('the kill harness needs macOS with Xcode (xcrun simctl); on Linux only its tests run (npm test)');
    return EXIT.usage;
  }
  if (a.mode !== 'dl01' && a.mode !== 'dl02') {
    console.error('usage: --mode dl01|dl02 --udid <UDID> --app <App.app> [--runs N] (see the header of this file)');
    return EXIT.usage;
  }
  if (!a.udid || !a.app) {
    console.error('--udid and --app are required: the harness installs the app fresh for the self-check and again for the runs');
    return EXIT.usage;
  }
  // The harness uninstalls and installs the bundle it names, so the name comes from the app itself.
  const appId = bundleIdOf(a.app);
  if (!appId) {
    console.error(`cannot read CFBundleIdentifier from ${a.app}/Info.plist`);
    return EXIT.usage;
  }
  if (a.bundleId && a.bundleId !== appId) {
    console.error(`--bundle-id ${a.bundleId} is not the bundle id of --app (${appId})`);
    return EXIT.usage;
  }
  if (!appId.endsWith(DRILL_BUNDLE_SUFFIX)) {
    // The seam is compiled into the development app env only, and the drill refuses any other bundle.
    console.error(`${appId} is not an e2e build: the drill runs only in the ${DRILL_BUNDLE_SUFFIX} bundle (EXPO_PUBLIC_APP_ENV=development, EXPO_PUBLIC_E2E=1)`);
    return EXIT.usage;
  }
  if (a.mode === 'dl01' && !a.micSilent) {
    // DL-01 records from the simulator's microphone, which is the Mac's input. Never a family room.
    console.error(
      'DL-01 records from the Mac microphone for up to two minutes a run. Pass --mic-silent to confirm the input is silent: ' +
        'a CI runner, or a Mac whose input is a silent virtual device (README section 9). Nothing ran.',
    );
    return EXIT.usage;
  }
  const kinds = !a.kind || a.kind === 'mixed' ? ['typed', 'spoken', 'spoken-unhashed'] : [a.kind];
  let delayMs;
  try {
    delayMs = a.delay ? range(a.delay) : undefined;
  } catch (e) {
    console.error(String(e.message));
    return EXIT.usage;
  }
  const outDir = a.out ?? join(homedir(), '.scribe-kill', `${a.mode}-${stamp()}`);
  const driver = simctlDriver({
    udid: a.udid,
    appPath: a.app,
    bundleId: appId,
    mode: a.mode,
    needsFixture: a.mode === 'dl02',
  });
  const opts = { driver, mode: a.mode, runs: a.runs ?? 500, kinds, log: (l) => console.error(l) };
  if (delayMs) opts.delayMs = delayMs;
  if (a.seed !== undefined) opts.seed = a.seed;
  if (a.selfCheck !== undefined) opts.selfCheck = a.selfCheck;
  if (a.pointRuns !== undefined) opts.pointRuns = a.pointRuns;
  let report;
  try {
    report = await runHarness(opts);
  } catch (e) {
    // runHarness returns a report for its own errors; this is only for something it could not catch.
    report = {
      mode: a.mode, runsAsked: opts.runs, seed: opts.seed ?? null, delayMs: delayMs ?? [0, 0], kinds,
      startedAt: new Date().toISOString(), finishedAt: new Date().toISOString(), device: null,
      selfCheck: { asked: 0, caught: 0, missed: [], runs: [] }, runs: [], audits: [], sweep: {},
      errors: [{ phase: 'harness', stage: 'run', code: String(e?.message ?? e).slice(0, 300) }],
      crashed: { stage: 'run', message: String(e?.message ?? e).slice(0, 300) }, exit: EXIT.incomplete,
    };
  } finally {
    try {
      await driver.cleanup({ keepApp: Boolean(a.keepApp) });
    } catch (e) {
      console.error(`cleanup: ${String(e?.message ?? e)}`);
    }
  }
  publish(report, outDir, a.json);
  return report.exit;
}

process.exitCode = await main();
