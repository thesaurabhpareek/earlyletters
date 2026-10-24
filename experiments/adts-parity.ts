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
 *   npm run adts-parity -w @scribe/experiments                                 generated chirp takes (no voice)
 *   npm run adts-parity -w @scribe/experiments -- --take experiments/recordings/v1-device.aac
 *   npm run adts-parity -w @scribe/experiments -- --take a.aac --long b.aac --killed <dir of killed .aac takes>
 *
 * Needs Xcode (xcrun swiftc), ffmpeg (brew install ffmpeg) for the twin, and afconvert (macOS) for generated takes.
 * Writes experiments/results/adts-parity/report.md and report.json (numbers only; git-ignored). Every temporary
 * file (cut and damaged copies, decoded PCM, the twin) is deleted as the run ends. A take of a voice never leaves
 * this Mac and nothing about it but numbers is written.
 * Exit code: 0 every V3 condition holds here, 2 the report says one does not, 1 the run itself failed.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { AAC_FRAME_SAMPLES, adtsLengthEvidence, scanAdts } from '../apps/mobile/src/lib/capture/adts';
import type { DecodeRange, RecordingIo } from '../apps/mobile/src/lib/transcribe-run';
import {
  FRAME_AT_PCM,
  PCM_RATE,
  SOURCE_RATE,
  chirpWav,
  crossCorrelate,
  damageLength,
  damageSync,
  lengthAgainstFrames,
  pcm16,
  planRun,
  rms,
  truncations,
  zeroRunAtEnd,
  type PlannedRun,
} from './adts-parity-lib';

const ROOT = resolve(__dirname);
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
  decodedSamples?: number;
  readFrames?: number;
  lengthFrames?: number;
  earlyStops?: number;
  unreadFramesAtStop?: number;
}

async function main(): Promise<number> {
  if (process.platform !== 'darwin') {
    console.error('adts-parity runs Core Audio, so it needs macOS with Xcode (README.md section 8). On Linux only its tests run.');
    return 1;
  }
  const work = mkdtempSync(join(tmpdir(), 'adts-parity-'));
  try {
    return await run(work);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

async function run(work: string): Promise<number> {
  const outDir = arg('--out') ?? join(ROOT, 'results', 'adts-parity');
  mkdirSync(outDir, { recursive: true });
  const bin = join(work, 'adts-coreaudio');
  execFileSync('xcrun', ['swiftc', '-O', '-o', bin, join(ROOT, 'adts-coreaudio.swift')], { stdio: ['ignore', 'ignore', 'inherit'] });
  const swift = (...a: string[]): Json => JSON.parse(execFileSync(bin, a, { encoding: 'utf8' }).trim().split('\n').pop() ?? '{}') as Json;
  const probe = (path: string): Probe => swift('probe', path) as unknown as Probe;
  let pcmCount = 0;
  const decode = (path: string, startMs: number, endMs: number): Decoded => {
    const out = join(work, `pcm-${pcmCount++}.raw`);
    const r = swift('decode', path, String(startMs), String(endMs), out) as unknown as Decoded;
    if (r.ok && existsSync(out)) r.pcm = pcm16(readFileSync(out));
    rmSync(out, { force: true });
    return r;
  };

  // The app's RecordingIo over Core Audio: probe, and decode piece by piece with silence placed before each.
  const io: RecordingIo = {
    probeMs: async (uri) => {
      const p = probe(uri);
      if (!p.ok) throw Object.assign(new Error(p.code), { code: p.code });
      return p.durationMs ?? null;
    },
    decode: async (uri, pieces: readonly DecodeRange[]) => {
      const parts: Int16Array[] = [];
      for (const piece of pieces) {
        parts.push(new Int16Array(Math.max(0, Math.round((piece.silenceBeforeMs * PCM_RATE) / 1000))));
        const d = decode(uri, piece.srcStartMs, piece.srcEndMs);
        if (!d.ok || !d.pcm) throw Object.assign(new Error(d.code), { code: d.code });
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
  const plan = (path: string, bytes: Uint8Array, storedMs: number | null = null): Promise<PlannedRun> =>
    planRun(io, path, bytes, storedMs, async (wholeBytes) => {
      const copy = join(work, `whole-frames-${copies++}.aac`);
      writeFileSync(copy, bytes.subarray(0, wholeBytes));
      return { uri: copy, remove: () => rmSync(copy, { force: true }) };
    });

  // Inputs: a finished take (given, or a generated chirp encoded by Core Audio's own ADTS writer).
  const generated: string[] = [];
  const makeTake = (seconds: number, name: string) => {
    const wav = join(work, `${name}.wav`);
    const aac = join(work, `${name}.aac`);
    writeFileSync(wav, chirpWav(seconds).wav);
    execFileSync('afconvert', ['-f', 'adts', '-d', 'aac', '-b', '64000', wav, aac], { stdio: 'ignore' });
    rmSync(wav);
    generated.push(name);
    return aac;
  };
  const takePath = arg('--take') ?? makeTake(30, 'chirp-30s');
  const longPath = arg('--long') ?? makeTake(10.5 * 60, 'chirp-10m30s');
  const killedDir = arg('--killed');
  const killed = killedDir ? (statSync(killedDir).isDirectory() ? readdirSync(killedDir).filter((f) => /\.aac$/i.test(f)).map((f) => join(killedDir, f)) : [killedDir]) : [];

  const report: Json = { generatedInputs: generated, at: new Date().toISOString() };
  const failures: string[] = [];
  const take = new Uint8Array(readFileSync(takePath));
  const scan = scanAdts(take);
  if (!scan) {
    console.error('the take is not an ADTS stream (scanAdts found no header at byte 0)');
    return 1;
  }
  report.take = { frames: scan.frames, tail: scan.tail, tailBytes: scan.tailBytes, sampleRate: scan.sampleRate, channels: scan.channels, bytes: scan.totalBytes };
  if (scan.tail !== 'none') failures.push(`V1: the finished take does not end on a whole frame (tail ${scan.tail}, ${scan.tailBytes} bytes)`);

  // 1. Twins of identical frames, lined up by cross-correlation.
  const twin = join(work, 'twin.m4a');
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', takePath, '-c:a', 'copy', '-f', 'mp4', twin], { stdio: 'inherit' });
  const pa = probe(takePath);
  const pm = probe(twin);
  const endMs = Math.max(pa.durationMs ?? 0, pm.durationMs ?? 0);
  const da = decode(takePath, 0, pa.durationMs ?? 0);
  const dm = decode(twin, 0, pm.durationMs ?? 0);
  const parity: Json = {
    adts: { probe: pa, decodedSamples: da.decodedSamples, earlyStops: da.earlyStops, code: da.code },
    m4aTwin: { probe: pm, decodedSamples: dm.decodedSamples, earlyStops: dm.earlyStops, code: dm.code },
  };
  if (pa.ok && pa.lengthFrames !== undefined) {
    const vs = lengthAgainstFrames(pa.lengthFrames, scan.frames);
    parity.adtsLengthAgainstFrames = vs;
    parity.primingTrimmedOnAdts = vs.within === 'one-frame-after-priming' ? 'yes' : vs.within === 'one-frame' ? 'no' : 'neither';
    if (vs.within === 'no') failures.push(`V3: ADTS probe length is ${vs.gap} samples off the counted frames`);
  } else failures.push(`V3: Core Audio could not open the finished ADTS take (${pa.code})`);
  if (pm.ok && pm.lengthFrames !== undefined) parity.m4aLengthAgainstFrames = lengthAgainstFrames(pm.lengthFrames, scan.frames);
  if (da.pcm && dm.pcm) {
    const from = Math.min(PCM_RATE, Math.floor(da.pcm.length / 4));
    const c = crossCorrelate(da.pcm, dm.pcm, { from, length: Math.min(2 * PCM_RATE, da.pcm.length - from), maxLag: Math.round(0.3 * PCM_RATE) });
    parity.alignment = { lagSamples16k: c.lag, lagMs: (c.lag * 1000) / PCM_RATE, score: Math.round(c.score * 1e4) / 1e4, note: 'positive: the M4A twin decodes later than the ADTS take' };
    if (c.score < 0.9) failures.push(`V3: the twins do not line up (best score ${c.score.toFixed(3)})`);
    const decodedGapFrames = (da.pcm.length - dm.pcm.length) / FRAME_AT_PCM;
    parity.decodedLengthGapFrames = Math.round(decodedGapFrames * 100) / 100;
  }
  report.parity = parity;
  report.windowEndMs = endMs;

  // 2. Truncated files and real killed takes: probe opens them (or the whole-frame copy), every window decodes, and
  // the run plans over the whole frames.
  const cuts: Json[] = [];
  const checkCut = async (name: string, what: string, path: string, bytes: Uint8Array) => {
    const s = scanAdts(bytes);
    const p = probe(path);
    const planned = await plan(path, bytes);
    const row: Json = { name, what, frames: s?.frames ?? null, tail: s?.tail ?? null, tailBytes: s?.tailBytes ?? null, probe: p, planned };
    if (planned.refused) failures.push(`V3: ${name} was refused (${planned.refused})`);
    if (p.ok && s && p.lengthFrames !== undefined) {
      row.lengthAgainstFrames = lengthAgainstFrames(p.lengthFrames, s.frames);
      if ((row.lengthAgainstFrames as { within: string }).within === 'no' && !planned.usedCopy) failures.push(`V3: ${name} probes ${(row.lengthAgainstFrames as { gap: number }).gap} samples off its whole frames`);
    }
    if (s && s.tail === 'break') failures.push(`V3: ${name} scans as a break, not a kill cut`);
    cuts.push(row);
  };
  for (const t of truncations(take)) {
    const path = join(work, `${t.name}.aac`);
    writeFileSync(path, t.bytes);
    await checkCut(t.name, t.what, path, t.bytes);
    rmSync(path, { force: true });
  }
  for (const [i, path] of killed.entries()) await checkCut(`killed-${i + 1}`, 'a DL-01 killed take', path, new Uint8Array(readFileSync(path)));
  report.cuts = cuts;

  // 3. Damaged files: what Core Audio's length and reads do past the damage, against the undamaged decode.
  const undamaged = da.pcm;
  const damaged: Json[] = [];
  for (const d of [damageSync(take), damageLength(take)]) {
    const path = join(work, `${d.name}.aac`);
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
    if (w.ok && w.pcm) {
      const after = Math.max(0, Math.round(((damageMs - windowStartMs) * PCM_RATE) / 1000) + Math.ceil(FRAME_AT_PCM));
      const tail = w.pcm.subarray(after);
      const zeros = zeroRunAtEnd(w.pcm);
      row.afterDamage = { samples: tail.length, rms: Math.round(rms(tail)), exactZerosAtEnd: zeros, allZero: tail.length > 0 && zeroRunAtEnd(tail) === tail.length };
      if (undamaged) {
        const ref = undamaged.subarray(Math.round((windowStartMs * PCM_RATE) / 1000));
        const length = Math.min(tail.length, ref.length - after, 2 * PCM_RATE);
        if (length > FRAME_AT_PCM) {
          const c = crossCorrelate(w.pcm, ref, { from: after, length, maxLag: Math.ceil(FRAME_AT_PCM) });
          (row.afterDamage as Json).againstUndamaged = { lagSamples16k: c.lag, score: Math.round(c.score * 1e4) / 1e4 };
        }
      }
    }
    const planned = await plan(path, d.bytes);
    row.planned = planned;
    // The ADR's reading: a short probe is refused already; a full probe with the right audio is read past; a full
    // probe with zeros there means Core Audio stops silently, and the native early-stop check goes in first.
    const full = p.ok && evidence && (p.durationMs ?? 0) >= evidence.minDecodedMs;
    const past = row.afterDamage as { allZero?: boolean; againstUndamaged?: { score: number } } | undefined;
    row.reading = !p.ok || !full
      ? planned.refused
        ? 'short or unreadable: the run is refused, as ADR 0027 wants'
        : 'short or unreadable, and the run was not refused: report it'
      : past?.allZero || (w.earlyStops ?? 0) > 0
        ? 'FULL LENGTH, ZEROS PAST THE DAMAGE: Core Audio stops silently; the native early-stop check (S08) goes in before the flip'
        : (past?.againstUndamaged?.score ?? 0) >= 0.9
          ? 'full length, the right audio past the damage: read past'
          : 'full length, audio past the damage that does not match the undamaged take: report it';
    if (/ZEROS|report it/.test(String(row.reading))) failures.push(`V3: ${d.name}: ${row.reading}`);
    damaged.push(row);
    rmSync(path, { force: true });
  }
  report.damaged = damaged;

  // 4. V4, the player half: durations and seek landing, on the long take and a killed one.
  const v4: Json[] = [];
  const killedForV4 = killed[0] ?? (() => {
    const t = truncations(take)[0];
    const path = join(work, 'v4-killed.aac');
    writeFileSync(path, t.bytes);
    return path;
  })();
  for (const [name, path] of [['long', longPath], ['killed', killedForV4]] as const) {
    const s = scanAdts(new Uint8Array(readFileSync(path)));
    const countedS = s ? (s.frames * AAC_FRAME_SAMPLES) / SOURCE_RATE : null;
    const asset = swift('asset', path);
    const targets = countedS ? [1, 60, 300, 599, countedS - 2].filter((t) => t > 0 && t < countedS - 1) : [1];
    const seeks = swift('seek', path, ...targets.map((t) => t.toFixed(3)));
    type Seek = { preciseKey: boolean; zeroTolerance: boolean; targetS: number; landedS: number | null };
    const landed = ((seeks.seeks as Seek[] | undefined) ?? []).map((x) => ({ ...x, errorS: x.landedS === null ? null : Math.round((x.landedS - x.targetS) * 1000) / 1000 }));
    v4.push({
      name,
      countedS,
      asset,
      durationErrorS: typeof asset.durationS === 'number' && countedS ? Math.round((asset.durationS - countedS) * 1000) / 1000 : null,
      preciseDurationErrorS: typeof asset.preciseDurationS === 'number' && countedS ? Math.round((asset.preciseDurationS - countedS) * 1000) / 1000 : null,
      seeks: landed,
      // use-letter-player.ts:144-146 clears scrubbedTo only within 0.75 s of currentTime: a seek landing farther
      // than that from its target (infinite tolerance, as expo-audio's seekTo) freezes the shown position.
      scrubbedToFreezes: landed.filter((x) => !x.zeroTolerance && x.errorS !== null && Math.abs(x.errorS) > 0.75).length,
    });
  }
  report.v4 = v4;
  report.failures = failures;
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
  return failures.length ? 2 : 0;
}

const n = (x: unknown, d = 1) => (typeof x === 'number' && Number.isFinite(x) ? x.toFixed(d) : String(x ?? '-'));

/** Numbers only: no file names, no paths, no audio. */
function markdown(r: Json): string {
  const p = r.parity as Json;
  const lines = [
    '# ADTS decode parity and playback on this Mac (ADR 0027 V3 and V4)',
    '',
    `Inputs: ${(r.generatedInputs as string[]).length ? `generated chirp takes (${(r.generatedInputs as string[]).join(', ')}), encoded by Core Audio's ADTS writer` : 'the takes given'}. Everything here is macOS Core Audio: [U] for the phone.`,
    '',
    `**${(r.failures as string[]).length ? `${(r.failures as string[]).length} V3 condition(s) do not hold here` : 'Every V3 condition checked here holds'}.**`,
    ...(r.failures as string[]).map((f) => `- ${f}`),
    '',
    '## Twins of identical frames',
    '',
    `| | ADTS take | M4A twin (ffmpeg -c:a copy) |`,
    '|---|---|---|',
    `| Opens | ${(p.adts as Json).probe ? ((p.adts as { probe: Probe }).probe.ok ? 'yes' : (p.adts as { probe: Probe }).probe.code) : '-'} | ${(p.m4aTwin as { probe: Probe }).probe.ok ? 'yes' : (p.m4aTwin as { probe: Probe }).probe.code} |`,
    `| probe durationMs | ${n((p.adts as { probe: Probe }).probe.durationMs)} | ${n((p.m4aTwin as { probe: Probe }).probe.durationMs)} |`,
    `| Length against the counted frames (samples short; within) | ${JSON.stringify(p.adtsLengthAgainstFrames ?? '-')} | ${JSON.stringify(p.m4aLengthAgainstFrames ?? '-')} |`,
    `| Decoded samples at 16 kHz | ${n((p.adts as Json).decodedSamples, 0)} | ${n((p.m4aTwin as Json).decodedSamples, 0)} |`,
    '',
    `Priming trimmed on ADTS (TN2258's 2112 samples): **${p.primingTrimmedOnAdts ?? '-'}**. Start offset by cross-correlation: ${JSON.stringify(p.alignment ?? '-')}. Decoded length gap (ADTS minus M4A): ${n(p.decodedLengthGapFrames, 2)} frames.`,
    '',
    '## Cut files and killed takes',
    '',
    '| Case | Whole frames | Tail | probe | Length against the whole frames | Run | Copy | Windows decoded |',
    '|---|---|---|---|---|---|---|---|',
  ];
  for (const c of r.cuts as Json[]) {
    const pl = c.planned as PlannedRun;
    const pr = c.probe as Probe;
    lines.push(`| ${c.name} (${c.what}) | ${c.frames} | ${c.tail} (${c.tailBytes} bytes) | ${pr.ok ? `${n(pr.durationMs)} ms` : pr.code} | ${JSON.stringify(c.lengthAgainstFrames ?? '-')} | ${pl.refused ? `refused: ${pl.refused}` : `planned over ${n(pl.durationMs)} ms of ${n(pl.countedMs)} counted`} | ${pl.usedCopy ? 'yes' : 'no'} | ${pl.windows.length} |`);
  }
  lines.push('', '## Damaged files', '', '| Case | Scan | probe before, after (ms); counted | Window read (code, early stops, unread frames) | Past the damage (rms, exact zeros at end, against undamaged) | Run | Reading |', '|---|---|---|---|---|---|---|');
  for (const d of r.damaged as Json[]) {
    const pl = d.planned as PlannedRun;
    lines.push(
      `| ${d.name} (${d.what}) | ${JSON.stringify(d.scan)} | ${n(d.probeBefore)}, ${n(d.probeAfter)}; ${n(d.countedMs)} | ${JSON.stringify(d.window)} | ${JSON.stringify(d.afterDamage ?? '-')} | ${pl.refused ? `refused: ${pl.refused}` : `planned over ${n(pl.durationMs)} ms`} | ${d.reading} |`,
    );
  }
  lines.push('', '## V4, the player (AVPlayer and AVURLAsset on macOS)', '', '| Take | Counted (s) | Duration as expo-audio asks (error s) | With the precise key (error s) | Seeks: target, landed error (s), tolerance, key | Seeks that would freeze scrubbedTo (over 0.75 s) |', '|---|---|---|---|---|---|');
  for (const v of r.v4 as Json[]) {
    const seeks = (v.seeks as Json[]).map((x) => `${n(x.targetS, 1)}: ${n(x.errorS, 3)} ${x.zeroTolerance ? 'zero' : 'inf'}${x.preciseKey ? ' key' : ''}`).join('; ');
    lines.push(`| ${v.name} | ${n(v.countedS, 2)} | ${n(v.durationErrorS, 3)} | ${n(v.preciseDurationErrorS, 3)} | ${seeks} | ${v.scrubbedToFreezes} |`);
  }
  lines.push('', 'Not measured here [U]:', ...(r.unverified as string[]).map((u) => `- ${u}`), '');
  return lines.join('\n');
}

void (async () => {
  try {
    process.exitCode = await main();
  } catch (e) {
    console.error(`adts-parity failed: ${String((e as Error)?.message ?? e).slice(0, 300)}`);
    process.exitCode = 1;
  }
})();
