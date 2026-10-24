/**
 * ADR 0027 checks V3 (decode parity) and V4 (playback), the Mac half. Mac only, like the rest of this kit: see
 * README.md section 8. It runs Core Audio, through adts-coreaudio.swift (a line-for-line mirror of ScribeAudio's
 * probe and decodePcm16 on macOS's AVFoundation), and the app's own run planning (adts-parity-lib.ts), on:
 *   - a finished ADTS take and its twin made of identical frames (`ffmpeg -i take.aac -c:a copy take.m4a`), lined up
 *     by cross-correlation, with the start offset (priming) reported apart from the length;
 *   - that take cut at three offsets (mid-frame, mid-header, right after a header), and any DL-01 killed takes given;
 *   - that take damaged two ways (the sync byte 20 frames from the end zeroed; the frame_length 10 frames from the end
 *     set to a possible but wrong value), with what Core Audio's length and reads do past the damage;
 *   - V4's player half: AVURLAsset durations as expo-audio builds the asset and with the precise-timing key, and where
 *     seeks land, on a take of 10 minutes or more and a killed one.
 * macOS is not iOS: every number is [U] for the phone until the in-app half runs (README section 8 names it).
 *
 * From the repo root:
 *   npm run adts-parity -w @scribe/experiments                                 generated takes (no voice)
 *   npm run adts-parity -w @scribe/experiments -- --take experiments/recordings/v1-device.aac
 *   npm run adts-parity -w @scribe/experiments -- --take a.aac --long b.aac --killed <dir of killed .aac takes>
 *
 * Needs Xcode (xcrun swiftc), ffmpeg (brew install ffmpeg) for the twin, and afconvert (macOS) for generated takes.
 * Writes experiments/results/adts-parity/report.md and report.json (numbers only, no file names or paths;
 * git-ignored). Every temporary file (cut and damaged copies, decoded PCM, the twin, the helper binary) is deleted as
 * the run ends, on Ctrl-C too. A take of a voice never leaves this Mac and nothing about it but numbers is written.
 * Exit code: 0 every V3 condition checked here holds; 2 one does not (the report says which); 3 a damage case could
 * not be decided (the take is silent past the damage); 1 the run itself failed; 130 stopped with Ctrl-C (or SIGTERM).
 * V4 is not a gate: a helper failure there is listed as not measured and leaves the exit as V3 decided it.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { arch, release, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { AAC_FRAME_SAMPLES, AAC_PRIMING_SAMPLES, adtsLengthEvidence, scanAdts } from '../apps/mobile/src/lib/capture/adts';
import type { DecodeRange, RecordingIo } from '../apps/mobile/src/lib/transcribe-run';
import {
  FRAME_AT_PCM,
  PCM_RATE,
  SAME_AUDIO,
  SOURCE_RATE,
  chirpWav,
  classifyHelperError,
  crossCorrelate,
  damageLength,
  damageReading,
  damageSync,
  firstHelperFailure,
  lengthAgainstFrames,
  pcm16,
  planRun,
  rms,
  truncations,
  zeroRunAtEnd,
  zeroRunWithSignal,
  type PlannedRun,
} from './adts-parity-lib';

const ROOT = resolve(__dirname);
const HELPER_TIMEOUT_MS = 180_000;
/** ADR 0027's tolerance: the damaged frame and the 3 after it may go unheard (85 ms). */
const COMPARE_SKIP_FRAMES = 4;
const arg = (k: string) => {
  const i = process.argv.indexOf(k);
  const v = i >= 0 ? process.argv[i + 1] : undefined;
  return v ? resolve(process.env.INIT_CWD ?? process.cwd(), v) : undefined;
};

type Json = Record<string, unknown>;
interface Probe {
  ok: boolean;
  code?: string;
  durationMs?: number;
  sampleRate?: number;
  channels?: number;
  lengthFrames?: number;
}
interface Decoded {
  ok: boolean;
  code?: string;
  pcm?: Int16Array;
  samples?: number;
  /** Samples Core Audio actually returned (the rest of `samples` is ScribeAudio's zero fill). */
  decodedSamples?: number;
  readFrames?: number;
  lengthFrames?: number;
  /** Reads that returned nothing while more than one AAC frame of Core Audio's own length was unread. */
  earlyStops?: number;
  unreadFramesAtStop?: number;
}
/** What the decodes of one planned run did, summed over its windows (the PCM itself is not kept). */
interface DecodeStats {
  calls: number;
  decodedSamples: number;
  earlyStops: number;
}

let work: string | null = null;
const cleanUp = () => {
  if (work) rmSync(work, { recursive: true, force: true });
  work = null;
};
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    cleanUp();
    process.exit(130);
  });
}

/** One line of a tool's version, or "unknown"; never fails the run. */
function version(cmd: string, args: string[]): string {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 20_000 }).trim().split('\n')[0];
  } catch {
    return 'unknown';
  }
}

async function main(): Promise<number> {
  if (process.platform !== 'darwin') {
    console.error('adts-parity runs Core Audio, so it needs macOS with Xcode (README.md section 8). On Linux only its tests run.');
    return 1;
  }
  work = mkdtempSync(join(tmpdir(), 'adts-parity-'));
  try {
    return await run(work);
  } finally {
    cleanUp();
  }
}

async function run(dir: string): Promise<number> {
  const outDir = arg('--out') ?? join(ROOT, 'results', 'adts-parity');
  mkdirSync(outDir, { recursive: true });
  const bin = join(dir, 'adts-coreaudio');
  execFileSync('xcrun', ['swiftc', '-O', '-o', bin, join(ROOT, 'adts-coreaudio.swift')], { stdio: ['ignore', 'ignore', 'inherit'] });

  /**
   * One call of the Core Audio helper. A crash (a Swift trap, a Core Audio exception on damaged data) or a stall is
   * itself an answer, so it comes back as { ok: false, code } with no command line and no path in it. Ctrl-C reaches
   * the helper too, and the run cannot take the signal while it waits: a helper ended by SIGINT or SIGTERM ends the
   * run (exit 130), never an answer about the file.
   */
  const swift = (...a: string[]): Json => {
    try {
      const out = execFileSync(bin, a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: HELPER_TIMEOUT_MS });
      return JSON.parse(out.trim().split('\n').pop() ?? '') as Json;
    } catch (e) {
      const code = classifyHelperError(e);
      if (code === 'interrupt') {
        cleanUp();
        process.exit(130);
      }
      return { ok: false, code };
    }
  };
  const probe = (path: string): Probe => swift('probe', path) as unknown as Probe;
  let pcmCount = 0;
  const decode = (path: string, startMs: number, endMs: number): Decoded => {
    const out = join(dir, `pcm-${pcmCount++}.raw`);
    const r = swift('decode', path, String(startMs), String(endMs), out) as unknown as Decoded;
    if (r.ok && existsSync(out)) r.pcm = pcm16(readFileSync(out));
    rmSync(out, { force: true });
    return r;
  };

  // The app's RecordingIo over Core Audio: probe, and decode piece by piece with silence placed before each. Every
  // decode's own figures go to `decodeLog`, so a planned run can be held to them.
  let decodeLog: Decoded[] = [];
  const io: RecordingIo = {
    probeMs: async (uri) => {
      const p = probe(uri);
      if (!p.ok) throw Object.assign(new Error('probe failed'), { code: p.code });
      return p.durationMs ?? null;
    },
    decode: async (uri, pieces: readonly DecodeRange[]) => {
      const parts: Int16Array[] = [];
      for (const piece of pieces) {
        parts.push(new Int16Array(Math.max(0, Math.round((piece.silenceBeforeMs * PCM_RATE) / 1000))));
        const d = decode(uri, piece.srcStartMs, piece.srcEndMs);
        decodeLog.push({ ...d, pcm: undefined });
        if (!d.ok || !d.pcm) throw Object.assign(new Error('decode failed'), { code: d.code });
        parts.push(d.pcm);
      }
      const all = new Int16Array(parts.reduce((n, p) => n + p.length, 0));
      let o = 0;
      for (const p of parts) {
        all.set(p, o);
        o += p.length;
      }
      return all.buffer;
    },
  };
  let copies = 0;
  const plan = async (path: string, bytes: Uint8Array): Promise<PlannedRun & { decodes: DecodeStats; helperFailure: string | null }> => {
    decodeLog = [];
    const p = await planRun(io, path, bytes, null, async (wholeBytes) => {
      const copy = join(dir, `whole-frames-${copies++}.aac`);
      writeFileSync(copy, bytes.subarray(0, wholeBytes));
      return { uri: copy, remove: () => rmSync(copy, { force: true }) };
    });
    const ok = decodeLog.filter((d) => d.ok);
    return {
      ...p,
      decodes: { calls: decodeLog.length, decodedSamples: ok.reduce((n, d) => n + (d.decodedSamples ?? 0), 0), earlyStops: ok.reduce((n, d) => n + (d.earlyStops ?? 0), 0) },
      helperFailure: firstHelperFailure([p.refused, ...decodeLog.map((d) => d.code)]),
    };
  };
  /** Decoded samples at 16 kHz against whole frames: within one frame, with or without Apple's 2112 samples of priming. */
  const decodedAgainstFrames = (decoded16k: number, frames: number) => lengthAgainstFrames(Math.round((decoded16k * SOURCE_RATE) / PCM_RATE), frames);

  // Inputs: a finished take (given, or generated: a tone with signal to its end, encoded by Core Audio's ADTS writer).
  const generated: string[] = [];
  const makeTake = (seconds: number, name: string) => {
    const wav = join(dir, `${name}.wav`);
    const aac = join(dir, `${name}.aac`);
    writeFileSync(wav, chirpWav(seconds).wav);
    execFileSync('afconvert', ['-f', 'adts', '-d', 'aac', '-b', '64000', wav, aac], { stdio: 'ignore' });
    rmSync(wav);
    generated.push(name);
    return aac;
  };
  const takePath = arg('--take') ?? makeTake(30, 'tone-30s');
  const longPath = arg('--long') ?? makeTake(10.5 * 60, 'tone-10m30s');
  const killedArg = arg('--killed');
  const killedAll = killedArg ? (statSync(killedArg).isDirectory() ? readdirSync(killedArg).sort().map((f) => join(killedArg, f)) : [killedArg]) : [];
  const killed = killedAll.filter((f) => /\.aac$/i.test(f));
  const notes: string[] = [];
  if (killedArg) notes.push(`--killed: ${killed.length} .aac file(s) used, ${killedAll.length - killed.length} other file(s) ignored (killed takes must come from an ios: 'adts' build)`);
  if (!killed.length) notes.push("V4's killed take is a synthetic cut of the take (cut mid-frame), since no killed take was given");
  for (const x of notes) console.log(x);

  const report: Json = {
    at: new Date().toISOString(),
    generatedInputs: generated,
    notes,
    environment: {
      macos: `${version('sw_vers', ['-productVersion'])} (${version('sw_vers', ['-buildVersion'])})`,
      xcode: version('xcodebuild', ['-version']),
      swiftc: version('xcrun', ['swiftc', '--version']),
      ffmpeg: version('ffmpeg', ['-version']),
      architecture: arch(),
      darwin: release(),
    },
  };
  const failures: string[] = [];
  const undecided: string[] = [];
  const take = new Uint8Array(readFileSync(takePath));
  const scan = scanAdts(take);
  if (!scan) {
    console.error('the take is not an ADTS stream (scanAdts found no header at byte 0)');
    return 1;
  }
  report.take = { frames: scan.frames, tail: scan.tail, tailBytes: scan.tailBytes, sampleRate: scan.sampleRate, channels: scan.channels, bytes: scan.totalBytes };
  if (scan.tail !== 'none') failures.push(`V1: the finished take does not end on a whole frame (tail ${scan.tail}, ${scan.tailBytes} bytes)`);

  // 1. Twins of identical frames, lined up by cross-correlation. No early stop, and every decoded length within one
  // frame of the counted frames (with or without the priming).
  const twin = join(dir, 'twin.m4a');
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', takePath, '-c:a', 'copy', '-f', 'mp4', twin], { stdio: 'inherit' });
  const pa = probe(takePath);
  const pm = probe(twin);
  const da = pa.ok ? decode(takePath, 0, pa.durationMs ?? 0) : ({ ok: false, code: pa.code } as Decoded);
  const dm = pm.ok ? decode(twin, 0, pm.durationMs ?? 0) : ({ ok: false, code: pm.code } as Decoded);
  const side = (p: Probe, d: Decoded) => ({
    probe: p,
    decodedSamples: d.decodedSamples ?? null,
    earlyStops: d.earlyStops ?? null,
    code: d.code ?? null,
    decodedAgainstFrames: d.ok && d.decodedSamples !== undefined ? decodedAgainstFrames(d.decodedSamples, scan.frames) : null,
  });
  const parity: Json = { adts: side(pa, da), m4aTwin: side(pm, dm) };
  for (const [name, p, d] of [['ADTS take', pa, da], ['M4A twin', pm, dm]] as const) {
    if (!p.ok) failures.push(`V3: Core Audio could not open the ${name} (${p.code})`);
    else if (!d.ok) failures.push(`V3: decoding the ${name} failed (${d.code})`);
    else {
      if ((d.earlyStops ?? 0) > 0) failures.push(`V3: a read of the ${name} stopped early ${d.earlyStops} time(s) (the native check would trip on a healthy file)`);
      if (d.decodedSamples !== undefined && decodedAgainstFrames(d.decodedSamples, scan.frames).within === 'no') failures.push(`V3: the ${name} decodes ${decodedAgainstFrames(d.decodedSamples, scan.frames).gap} samples off the counted frames`);
    }
  }
  if (pa.ok && pa.lengthFrames !== undefined) {
    const vs = lengthAgainstFrames(pa.lengthFrames, scan.frames);
    parity.adtsLengthAgainstFrames = vs;
    parity.primingTrimmedOnAdts = vs.within === 'one-frame-after-priming' ? 'yes' : vs.within === 'one-frame' ? 'no' : 'neither';
    if (vs.within === 'no') failures.push(`V3: the ADTS probe length is ${vs.gap} samples off the counted frames`);
  }
  if (pm.ok && pm.lengthFrames !== undefined) parity.m4aLengthAgainstFrames = lengthAgainstFrames(pm.lengthFrames, scan.frames);
  if (da.pcm && dm.pcm) {
    const from = Math.min(PCM_RATE, Math.floor(da.pcm.length / 4));
    const c = crossCorrelate(da.pcm, dm.pcm, { from, length: Math.min(2 * PCM_RATE, da.pcm.length - from), maxLag: Math.round(0.3 * PCM_RATE) });
    parity.alignment =
      c.lag === null || c.score === null
        ? { result: 'no overlap with signal on both sides' }
        : { lagSamples16k: c.lag, lagMs: (c.lag * 1000) / PCM_RATE, score: Math.round(c.score * 1e4) / 1e4, note: 'positive: the M4A twin decodes later than the ADTS take' };
    if (c.score === null) undecided.push('V3: the twins have no span with signal on both sides to line up');
    else if (c.score < SAME_AUDIO) failures.push(`V3: the twins do not line up (best score ${c.score.toFixed(3)})`);
    if (da.decodedSamples !== undefined && dm.decodedSamples !== undefined) parity.decodedLengthGapFrames = Math.round(((da.decodedSamples - dm.decodedSamples) / FRAME_AT_PCM) * 100) / 100;
  }
  report.parity = parity;

  // 2. Truncated files and real killed takes: probe opens them (or the whole-frame copy), every window decodes with no
  // early stop, the run plans over the whole frames, and the decoded length is the whole frames within one frame.
  const cuts: Json[] = [];
  const checkCut = async (name: string, what: string, path: string, bytes: Uint8Array) => {
    const s = scanAdts(bytes);
    const p = probe(path);
    const planned = await plan(path, bytes);
    const row: Json = { name, what, frames: s?.frames ?? null, tail: s?.tail ?? null, tailBytes: s?.tailBytes ?? null, probe: p, planned };
    if (planned.refused) failures.push(`V3: ${name} was refused (${planned.refused})`);
    if (planned.decodes.earlyStops > 0) failures.push(`V3: ${name}: a read stopped early ${planned.decodes.earlyStops} time(s) (the native check would trip on a kill-cut file)`);
    if (s && !planned.refused) {
      const vs = decodedAgainstFrames(planned.decodes.decodedSamples, s.frames);
      row.decodedAgainstFrames = vs;
      if (vs.within === 'no') failures.push(`V3: ${name} decodes ${vs.gap} samples off its whole frames`);
    }
    if (p.ok && s && p.lengthFrames !== undefined) row.probeAgainstFrames = lengthAgainstFrames(p.lengthFrames, s.frames);
    if (s && s.tail === 'break') failures.push(`V3: ${name} scans as a break, not a kill cut`);
    cuts.push(row);
  };
  for (const t of truncations(take)) {
    const path = join(dir, `${t.name}.aac`);
    writeFileSync(path, t.bytes);
    await checkCut(t.name, t.what, path, t.bytes);
    rmSync(path, { force: true });
  }
  for (const [i, path] of killed.entries()) await checkCut(`killed-${i + 1}`, 'a DL-01 killed take', path, new Uint8Array(readFileSync(path)));
  report.cuts = cuts;

  // 3. Damaged files: what Core Audio's length and reads do past the damage, read the ADR's way (damageReading).
  const undamaged = da.pcm;
  const damaged: Json[] = [];
  for (const d of [damageSync(take), damageLength(take)]) {
    const path = join(dir, `${d.name}.aac`);
    writeFileSync(path, d.bytes);
    const s = scanAdts(d.bytes);
    const evidence = s ? adtsLengthEvidence(s) : null;
    const p = probe(path);
    const damageMs = (d.damagedFrame * AAC_FRAME_SAMPLES * 1000) / SOURCE_RATE;
    // A window that starts before the damage and runs to the end, as the 5-minute voice windows do.
    const windowStartMs = Math.floor(damageMs / 300_000) * 300_000;
    const windowEndMs = Math.max(p.durationMs ?? 0, evidence?.countedMs ?? 0);
    const w = decode(path, windowStartMs, windowEndMs);
    const row: Json = {
      name: d.name,
      what: d.what,
      scan: s ? { frames: s.frames, framesAfterBreak: s.framesAfterBreak, tail: s.tail, tailBytes: s.tailBytes } : null,
      countedMs: evidence?.countedMs ?? null,
      probeBefore: pa.durationMs ?? null,
      probeAfter: p.ok ? p.durationMs : p.code,
      window: { startMs: windowStartMs, endMs: windowEndMs, code: w.code ?? null, decodedSamples: w.decodedSamples ?? null, earlyStops: w.earlyStops ?? null, unreadFramesAtStop: w.unreadFramesAtStop ?? null },
    };
    let referenceRms: number | null = null;
    let comparable = false;
    let pastAllZero = false;
    let zeroRun = 0;
    let score: number | null = null;
    let lagFrames: number | null = null;
    if (w.ok && w.pcm) {
      // Compared from four frames past the damage: ADR 0027 lets the damaged frame and the 3 after it go unheard (its
      // 85 ms tolerance), and a decoder that follows a damaged length misreads a frame or two before it resyncs.
      const after = Math.max(0, Math.round(((damageMs - windowStartMs) * PCM_RATE) / 1000) + Math.ceil(COMPARE_SKIP_FRAMES * FRAME_AT_PCM));
      const past = w.pcm.subarray(after);
      pastAllZero = past.length > 0 && zeroRunAtEnd(past) === past.length;
      const afterDamage: Json = { samples: past.length, rms: Math.round(rms(past)), exactZerosAtEnd: zeroRunAtEnd(w.pcm), allZero: pastAllZero };
      if (undamaged) {
        const ref = undamaged.subarray(Math.round((windowStartMs * PCM_RATE) / 1000));
        const length = Math.min(past.length, ref.length - after, 2 * PCM_RATE);
        referenceRms = length > 0 ? Math.round(rms(ref, after, after + length)) : null;
        afterDamage.referenceRms = referenceRms;
        comparable = length > 2 * FRAME_AT_PCM;
        if (comparable) {
          // Within 4 frames of lag: a decoder that drops the damaged frame shifts what follows by one.
          const c = crossCorrelate(w.pcm, ref, { from: after, length, maxLag: Math.ceil(COMPARE_SKIP_FRAMES * FRAME_AT_PCM) });
          score = c.score;
          lagFrames = c.lag === null ? null : c.lag / FRAME_AT_PCM;
          // A frame or more of exact zeros where the undamaged take has signal is audio the decoder did not return.
          zeroRun = zeroRunWithSignal(w.pcm, ref, { from: after, length, lag: c.lag ?? 0 });
          afterDamage.zeroRunFrames = Math.round((zeroRun / FRAME_AT_PCM) * 100) / 100;
          afterDamage.againstUndamaged =
            c.score === null || c.lag === null
              ? 'no overlap with signal on both sides'
              : { lagSamples16k: c.lag, lagFrames: Math.round((c.lag / FRAME_AT_PCM) * 100) / 100, score: Math.round(c.score * 1e4) / 1e4, note: 'positive lag: frames dropped at the damage' };
        } else afterDamage.againstUndamaged = 'too short to compare';
      }
      row.afterDamage = afterDamage;
    }
    const planned = await plan(path, d.bytes);
    row.planned = planned;
    // A helper failure in any of the file's calls, the planned run's included, is the answer for this file.
    const helperFailed = firstHelperFailure([p.code, w.code, planned.helperFailure]);
    const reading = damageReading({
      helperFailed,
      probeOk: p.ok,
      fullLength: Boolean(p.ok && evidence && (p.durationMs ?? 0) >= evidence.minDecodedMs),
      refused: planned.refused,
      earlyStops: (w.earlyStops ?? 0) + planned.decodes.earlyStops,
      referenceRms,
      comparable,
      pastAllZero,
      zeroRun,
      score,
      lagFrames,
    });
    row.reading = reading;
    if (reading.failure) failures.push(`V3: ${d.name}: ${reading.text}`);
    if (!reading.decided) undecided.push(`V3: ${d.name}: ${reading.text}`);
    damaged.push(row);
    rmSync(path, { force: true });
  }
  report.damaged = damaged;

  // 4. V4, the player half: durations and seek landing, on the long take and a killed one. Not a V3 gate: a helper
  // failure here is listed as not measured.
  const v4: Json[] = [];
  const v4NotMeasured: string[] = [];
  const killedForV4 =
    killed[0] ??
    (() => {
      const path = join(dir, 'v4-killed.aac');
      writeFileSync(path, truncations(take)[0].bytes);
      return path;
    })();
  type Seek = { preciseKey: boolean; zeroTolerance: boolean; targetS: number; landedS: number | null };
  for (const [name, path] of [['long', longPath], ['killed', killedForV4]] as const) {
    const s = scanAdts(new Uint8Array(readFileSync(path)));
    const countedS = s ? (s.frames * AAC_FRAME_SAMPLES) / SOURCE_RATE : null;
    const asset = swift('asset', path);
    const targets = countedS ? [1, 60, 300, 599, countedS - 2].filter((t) => t > 0 && t < countedS - 1) : [1];
    const seeks = swift('seek', path, ...targets.map((t) => t.toFixed(3)));
    if (!asset.ok) v4NotMeasured.push(`V4 ${name} take: duration not measured (${asset.code})`);
    if (!seeks.ok) v4NotMeasured.push(`V4 ${name} take: seeks not measured (${seeks.code})`);
    const landed = ((seeks.seeks as Seek[] | undefined) ?? []).map((x) => ({ ...x, errorS: x.landedS === null ? null : Math.round((x.landedS - x.targetS) * 1000) / 1000 }));
    v4.push({
      name,
      countedS,
      asset,
      durationErrorS: typeof asset.durationS === 'number' && countedS ? Math.round((asset.durationS - countedS) * 1000) / 1000 : null,
      preciseDurationErrorS: typeof asset.preciseDurationS === 'number' && countedS ? Math.round((asset.preciseDurationS - countedS) * 1000) / 1000 : null,
      seeks: landed,
      // use-letter-player.ts:144-146 clears scrubbedTo only within 0.75 s of currentTime: a seek landing farther than
      // that from its target freezes the shown position. Counted only as expo-audio 57 seeks: no precise-timing key,
      // infinite tolerance.
      scrubbedToFreezes: landed.filter((x) => !x.preciseKey && !x.zeroTolerance && x.errorS !== null && Math.abs(x.errorS) > 0.75).length,
    });
  }
  report.v4 = v4;
  report.v4NotMeasured = v4NotMeasured;
  report.failures = failures;
  report.undecided = undecided;
  report.priming = { appleAssumedSamples: AAC_PRIMING_SAMPLES };
  report.unverified = [
    'every number is macOS Core Audio, not the phone [U]',
    'probe against the recorder clock (durationMillis), for finished M4A and ADTS takes: in-app only [U]',
    'enhance (the listening copy) length against the original: in-app only [U]',
    'the real transcription job through Whisper: in-app only; refusal is decided before Whisper and is run here [U]',
    'the scrubbedTo freeze itself, in use-letter-player.ts: in-app only; the seek landing that causes it is measured here [U]',
  ];
  writeFileSync(join(outDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  const md = markdown(report);
  writeFileSync(join(outDir, 'report.md'), md);
  console.log(md);
  console.log(`report: ${join(outDir, 'report.md')}`);
  return failures.length ? 2 : undecided.length ? 3 : 0;
}

const n = (x: unknown, d = 1) => (typeof x === 'number' && Number.isFinite(x) ? x.toFixed(d) : String(x ?? '-'));
const j = (x: unknown) => JSON.stringify(x ?? '-');

/** Numbers only: no file names, no paths, no audio. */
function markdown(r: Json): string {
  type Side = { probe: Probe; decodedSamples: number | null; earlyStops: number | null; decodedAgainstFrames: unknown };
  const p = r.parity as { adts: Side; m4aTwin: Side } & Json;
  const failures = r.failures as string[];
  const undecided = r.undecided as string[];
  const env = r.environment as Json;
  const lines = [
    '# ADTS decode parity and playback on this Mac (ADR 0027 V3 and V4)',
    '',
    `Inputs: ${(r.generatedInputs as string[]).length ? `generated tones with signal to their end (${(r.generatedInputs as string[]).join(', ')}), encoded by Core Audio's ADTS writer` : 'the takes given'}. Everything here is macOS Core Audio: [U] for the phone.`,
    `Environment: macOS ${env.macos}; ${env.xcode}; ${env.swiftc}; ${env.ffmpeg}; ${env.architecture}.`,
    ...(r.notes as string[]).map((x) => `Note: ${x}.`),
    '',
    `**${failures.length ? `${failures.length} V3 condition(s) do not hold here` : undecided.length ? `Nothing failed, but ${undecided.length} case(s) could not be decided` : 'Every V3 condition checked here holds'}.**`,
    ...failures.map((f) => `- ${f}`),
    ...undecided.map((f) => `- not decided: ${f}`),
    '',
    '## Twins of identical frames',
    '',
    '| | ADTS take | M4A twin (ffmpeg -c:a copy) |',
    '|---|---|---|',
    `| Opens | ${p.adts.probe.ok ? 'yes' : p.adts.probe.code} | ${p.m4aTwin.probe.ok ? 'yes' : p.m4aTwin.probe.code} |`,
    `| probe durationMs | ${n(p.adts.probe.durationMs)} | ${n(p.m4aTwin.probe.durationMs)} |`,
    `| probe length against the counted frames (samples short; within) | ${j(p.adtsLengthAgainstFrames)} | ${j(p.m4aLengthAgainstFrames)} |`,
    `| Decoded samples at 16 kHz (what Core Audio returned) | ${n(p.adts.decodedSamples, 0)} | ${n(p.m4aTwin.decodedSamples, 0)} |`,
    `| Decoded length against the counted frames | ${j(p.adts.decodedAgainstFrames)} | ${j(p.m4aTwin.decodedAgainstFrames)} |`,
    `| Reads that stopped early (must be 0) | ${n(p.adts.earlyStops, 0)} | ${n(p.m4aTwin.earlyStops, 0)} |`,
    '',
    `Priming trimmed on ADTS (TN2258's 2112 samples): **${p.primingTrimmedOnAdts ?? '-'}**. Start offset by cross-correlation: ${j(p.alignment)}. Decoded length gap (ADTS minus M4A): ${n(p.decodedLengthGapFrames, 2)} frames.`,
    '',
    '## Cut files and killed takes',
    '',
    '| Case | Whole frames | Tail | probe | probe against the whole frames | Run | Copy | Windows | Decoded against the whole frames | Early stops (must be 0) |',
    '|---|---|---|---|---|---|---|---|---|---|',
  ];
  for (const c of r.cuts as Json[]) {
    const pl = c.planned as PlannedRun & { decodes: DecodeStats };
    const pr = c.probe as Probe;
    lines.push(
      `| ${c.name} (${c.what}) | ${c.frames} | ${c.tail} (${c.tailBytes} bytes) | ${pr.ok ? `${n(pr.durationMs)} ms` : pr.code} | ${j(c.probeAgainstFrames)} | ${pl.refused ? `refused: ${pl.refused}` : `planned over ${n(pl.durationMs)} ms of ${n(pl.countedMs)} counted`} | ${pl.usedCopy ? 'yes' : 'no'} | ${pl.windows.length} | ${j(c.decodedAgainstFrames)} | ${pl.decodes.earlyStops} |`,
    );
  }
  lines.push('', '## Damaged files', '', '| Case | Scan | probe before, after (ms); counted | Window read (code, decoded samples, early stops, unread frames) | Past the damage (rms, reference rms, exact zeros at end, against undamaged) | Run | Reading |', '|---|---|---|---|---|---|---|');
  for (const d of r.damaged as Json[]) {
    const pl = d.planned as PlannedRun;
    lines.push(
      `| ${d.name} (${d.what}) | ${j(d.scan)} | ${n(d.probeBefore)}, ${n(d.probeAfter)}; ${n(d.countedMs)} | ${j(d.window)} | ${j(d.afterDamage)} | ${pl.refused ? `refused: ${pl.refused}` : `planned over ${n(pl.durationMs)} ms`} | ${(d.reading as { text: string }).text} |`,
    );
  }
  lines.push(
    '',
    '## V4, the player (AVPlayer and AVURLAsset on macOS)',
    '',
    '| Take | Counted (s) | Duration as expo-audio asks (error s) | With the precise key (error s) | Seeks: target, landed error (s), tolerance, key | expo-audio seeks that would freeze scrubbedTo (over 0.75 s) |',
    '|---|---|---|---|---|---|',
  );
  for (const v of r.v4 as Json[]) {
    const seeks = (v.seeks as Json[]).map((x) => `${n(x.targetS, 1)}: ${n(x.errorS, 3)} ${x.zeroTolerance ? 'zero' : 'inf'}${x.preciseKey ? ' key' : ''}`).join('; ') || 'not measured';
    lines.push(`| ${v.name} | ${n(v.countedS, 2)} | ${n(v.durationErrorS, 3)} | ${n(v.preciseDurationErrorS, 3)} | ${seeks} | ${v.scrubbedToFreezes} |`);
  }
  for (const x of r.v4NotMeasured as string[]) lines.push(`- ${x}`);
  lines.push('', 'Not measured here [U]:', ...(r.unverified as string[]).map((u) => `- ${u}`), '', 'Send this report.md to the coordinator, or paste it into the PR or the evidence file that asked for it: it holds numbers only.', '');
  return lines.join('\n');
}

void (async () => {
  try {
    process.exitCode = await main();
  } catch (e) {
    // Never the message: it can hold a command line with a path in it.
    console.error(`adts-parity failed (${(e as { code?: string })?.code ?? (e as Error)?.name ?? 'error'})`);
    cleanUp();
    process.exitCode = 1;
  }
})();
