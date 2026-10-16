#!/usr/bin/env node
// The kill harness (RA-19-04; DEVICE_TEST_PLAN DL-01 and DL-02; B2-11 in docs/qa/ALPHA_GO_NO_GO.md, never waived).
// macOS with Xcode. Callable from CI: the workflow is S20's (RA-20-10a); apps/mobile/e2e/ci/kill-harness.yml.example
// is the sketch. Needs an e2e simulator build (`EXPO_PUBLIC_E2E=1`, not production) with S20's wiring line in
// app/_layout.tsx (RA-20-18). Full instructions: apps/mobile/e2e/README.md section 9.
//
//   node apps/mobile/e2e/kill/run-kill-harness.mjs --mode dl02 --udid <UDID> --app <path/to/App.app> [--runs 500]
//   node apps/mobile/e2e/kill/run-kill-harness.mjs --mode dl01 --udid <UDID> --app <App.app> --mic-silent [--runs 500]
//   node apps/mobile/e2e/kill/run-kill-harness.mjs --merge a/report.json b/report.json
//
// Options: --bundle-id (default com.earlyletters.scribe.preview), --kind typed|spoken|spoken-unhashed|mixed (DL-02,
// default mixed), --delay-ms A-B (DL-02 default 0-400, DL-01 default 2000-60000), --seed N, --self-check N (planted
// runs of each kind, default 2, at least 1), --out DIR (default ~/.scribe-kill/<mode>-<UTC time>), --keep-app (do not
// uninstall at the end; by default the drill's data, recordings included, is deleted), --json (one JSON line).
//
// Exit: 0 every run kept its letter or take exactly once and the self-check caught every plant; 1 a run lost, doubled
// or damaged one; 2 usage or a refused setup; 3 incomplete (a timeout, no microphone, fewer runs judged than asked);
// 4 the self-check missed a planted failure, so the run proves nothing. Only 0 is green.
import { mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// node:sqlite prints an experimental warning on first use; the harness output stays readable without it.
const emitWarning = process.emitWarning;
process.emitWarning = (w, ...rest) => (String(w).includes('SQLite') ? undefined : emitWarning.call(process, w, ...rest));

const { EXIT, mergeReports, renderMarkdown, runHarness } = await import('./harness.mjs');
const { simctlDriver } = await import('./simctl-driver.mjs');

function parse(argv) {
  const a = { merge: [] };
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
    else if (k === '--runs') a.runs = Number(v());
    else if (k === '--kind') a.kind = v();
    else if (k === '--delay-ms') a.delay = v();
    else if (k === '--seed') a.seed = Number(v());
    else if (k === '--self-check') a.selfCheck = Number(v());
    else if (k === '--out') a.out = v();
    else if (k === '--keep-app') a.keepApp = true;
    else if (k === '--mic-silent') a.micSilent = true;
    else if (k === '--json') a.json = true;
    else if (k === '--merge') {
      while (i + 1 < argv.length && !argv[i + 1].startsWith('--')) a.merge.push(argv[++i]);
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
  mkdirSync(outDir, { recursive: true });
  const md = renderMarkdown(report);
  writeFileSync(join(outDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(join(outDir, 'report.md'), md);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
  if (asJson) {
    const { runs: _runs, ...head } = report;
    console.log(JSON.stringify(head));
  } else console.log(md);
  console.log(`report: ${join(outDir, 'report.md')}`);
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
  if (a.mode === 'dl01' && !a.micSilent) {
    // DL-01 records from the simulator's microphone, which is the Mac's input. Never a family room.
    console.error(
      'DL-01 records from the Mac microphone for up to a minute a run. Pass --mic-silent to confirm the input is silent: ' +
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
  const bundleId = a.bundleId ?? 'com.earlyletters.scribe.preview';
  const driver = simctlDriver({
    udid: a.udid,
    appPath: a.app,
    bundleId,
    mode: a.mode,
    needsFixture: a.mode === 'dl02' && kinds.some((k) => k !== 'typed'),
  });
  const opts = { driver, mode: a.mode, runs: Number.isFinite(a.runs) ? a.runs : 500, kinds, log: (l) => console.error(l) };
  if (delayMs) opts.delayMs = delayMs;
  if (Number.isFinite(a.seed)) opts.seed = a.seed;
  if (Number.isFinite(a.selfCheck)) opts.selfCheck = a.selfCheck;
  let report;
  try {
    report = await runHarness(opts);
  } finally {
    await driver.cleanup({ keepApp: Boolean(a.keepApp) });
  }
  publish(report, a.out ?? join(homedir(), '.scribe-kill', `${a.mode}-${stamp()}`), a.json);
  return report.exit;
}

process.exitCode = await main();
