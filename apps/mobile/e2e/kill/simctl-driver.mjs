// The iOS simulator driver for the kill harness. macOS only: xcrun simctl, afinfo, afconvert, plutil.
// The app runs as a host process, so the kill is a real SIGKILL from the host, as when iOS ends an app.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FIXTURE_FILE, MARKER_DIR, launchArgs, markerName } from './protocol.mjs';
import { readSnapshot, sha256OfFile } from './snapshot.mjs';

/** The bundle id inside an .app (its Info.plist), or null when it cannot be read. */
export function bundleIdOf(appPath) {
  try {
    return execFileSync('plutil', ['-extract', 'CFBundleIdentifier', 'raw', join(appPath, 'Info.plist')], { encoding: 'utf8' }).trim() || null;
  } catch {
    return null;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function xcrun(...args) {
  return execFileSync('xcrun', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

/** A 16-bit mono WAV of a soft tone: the spoken DL-02 fixture is generated, never a voice. */
export function toneWav(seconds = 120, rate = 48000) {
  const n = seconds * rate;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i += 1) buf.writeInt16LE(Math.round(0.2 * 32767 * Math.sin((2 * Math.PI * 440 * i) / rate)), 44 + i * 2);
  return buf;
}

/**
 * @param {{ udid: string, appPath: string, bundleId: string, mode: 'dl01'|'dl02', needsFixture: boolean }} o
 */
export function simctlDriver(o) {
  let dataDir = null;
  let fixture = null;
  let fixtureDir = null;
  const playableCache = new Map();

  const markers = () => join(dataDir, 'Library', 'Caches', MARKER_DIR);
  const alive = (pid) => {
    try {
      process.kill(pid, 0);
      return true;
    } catch (e) {
      return e.code === 'EPERM';
    }
  };

  const makeFixture = () => {
    if (fixture) return fixture;
    const dir = mkdtempSync(join(tmpdir(), 'scribe-kill-fixture-'));
    fixtureDir = dir;
    const wav = join(dir, 'tone.wav');
    const m4a = join(dir, FIXTURE_FILE);
    writeFileSync(wav, toneWav());
    execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '64000', wav, m4a], { stdio: 'ignore' });
    rmSync(wav);
    fixture = m4a;
    return fixture;
  };

  return {
    name: 'simctl',

    async info() {
      const info = { simulator: o.udid };
      try {
        const list = JSON.parse(xcrun('simctl', 'list', 'devices', '-j'));
        for (const [runtime, devices] of Object.entries(list.devices)) {
          const d = devices.find((x) => x.udid === o.udid || (o.udid === 'booted' && x.state === 'Booted'));
          if (d) Object.assign(info, { simulator: d.name, runtime: runtime.split('.').pop() });
        }
      } catch {}
      for (const [k, key] of [['version', 'CFBundleShortVersionString'], ['build', 'CFBundleVersion']]) {
        try {
          info[k] = execFileSync('plutil', ['-extract', key, 'raw', join(o.appPath, 'Info.plist')], { encoding: 'utf8' }).trim();
        } catch {}
      }
      info.bundleId = o.bundleId;
      if (process.env.GITHUB_SHA) info.commit = process.env.GITHUB_SHA.slice(0, 12);
      if (o.mode === 'dl01') {
        // The simulator records from this Mac's default input: say which one it was (a name, never audio).
        try {
          const audio = JSON.parse(execFileSync('system_profiler', ['SPAudioDataType', '-json'], { encoding: 'utf8' }));
          const items = (audio.SPAudioDataType ?? []).flatMap((x) => x._items ?? []);
          const input = items.find((x) => x.coreaudio_default_audio_input_device === 'spaudio_yes');
          info.micInput = input?._name ?? 'none';
        } catch {
          info.micInput = 'unknown';
        }
      }
      return info;
    },

    /** Fresh install: uninstall, install, grant the microphone for DL-01, place the tone fixture. */
    async reset() {
      xcrun('simctl', 'bootstatus', o.udid, '-b');
      try {
        xcrun('simctl', 'terminate', o.udid, o.bundleId);
      } catch {}
      try {
        xcrun('simctl', 'uninstall', o.udid, o.bundleId);
      } catch {}
      xcrun('simctl', 'install', o.udid, o.appPath);
      if (o.mode === 'dl01') xcrun('simctl', 'privacy', o.udid, 'grant', 'microphone', o.bundleId);
      dataDir = xcrun('simctl', 'get_app_container', o.udid, o.bundleId, 'data').trim();
      mkdirSync(markers(), { recursive: true });
      if (o.needsFixture) writeFileSync(join(markers(), FIXTURE_FILE), readFileSync(makeFixture()));
    },

    async launch(a) {
      const out = xcrun('simctl', 'launch', '--terminate-running-process', o.udid, o.bundleId, ...launchArgs(a));
      const m = out.match(/:\s*(\d+)\s*$/m);
      if (!m) throw new Error('simctl launch printed no pid');
      return Number(m[1]);
    },

    /** The host's own hash of the fixture it placed: DL-02 compares recordings with this, not with the app's hash. */
    fixtureSha256() {
      return o.needsFixture ? sha256OfFile(makeFixture()) : null;
    },

    /** Lets the app go on after the host judged the previous run (protocol: the go marker; a decode launch's names its takes). */
    writeGo(run, body = { run }) {
      writeFileSync(join(markers(), markerName('go', run)), JSON.stringify(body));
    },

    readMarker(kind, run) {
      const p = join(markers(), markerName(kind, run));
      if (!existsSync(p)) return null;
      try {
        return JSON.parse(readFileSync(p, 'utf8'));
      } catch {
        return null; // still being written; the next poll reads it
      }
    },

    alive,

    /** SIGKILL, then wait until the process is gone. Returns whether it was still running. */
    async kill(pid) {
      const was = alive(pid);
      try {
        process.kill(pid, 'SIGKILL');
      } catch {}
      for (let i = 0; i < 500 && alive(pid); i += 1) await sleep(10);
      return was;
    },

    async terminate(pid) {
      try {
        xcrun('simctl', 'terminate', o.udid, o.bundleId);
      } catch {}
      for (let i = 0; i < 500 && alive(pid); i += 1) await sleep(10);
    },

    snapshot() {
      return readSnapshot({ dataDir });
    },

    sha256: sha256OfFile,

    /**
     * afinfo opens the file the way Core Audio would play it; a take cut off without its index will not open. For an
     * ADTS take (`.aac`) its output is kept too, as check V1's evidence (the oracle removes the file's name); its
     * estimated duration is not the take's length there (the oracle counts frames, adts-evidence.mjs).
     */
    playable(path) {
      const st = statSync(path);
      const key = `${path}|${st.size}|${st.mtimeMs}`;
      if (playableCache.has(key)) return playableCache.get(key);
      const r = spawnSync('afinfo', [path], { encoding: 'utf8' });
      const keepText = /\.aac$/i.test(path);
      let out;
      if (r.error) out = { ok: null, durationS: null };
      else if (r.status !== 0) out = { ok: false, durationS: null, ...(keepText ? { text: `${r.stdout ?? ''}${r.stderr ?? ''}`.slice(0, 4000) } : {}) };
      else {
        const m = /estimated duration:\s*([\d.]+)\s*sec/.exec(r.stdout);
        out = { ok: true, durationS: m ? Number(m[1]) : null, ...(keepText ? { text: r.stdout.slice(0, 4000) } : {}) };
      }
      playableCache.set(key, out);
      return out;
    },

    /** Uninstalling deletes the drill's data container, DL-01 recordings included. */
    async cleanup({ keepApp }) {
      if (fixtureDir) {
        // Only the harness's own temp file and its folder; nothing else is deleted.
        rmSync(join(fixtureDir, FIXTURE_FILE), { force: true });
        rmdirSync(fixtureDir);
      }
      if (keepApp) return;
      try {
        xcrun('simctl', 'terminate', o.udid, o.bundleId);
      } catch {}
      try {
        xcrun('simctl', 'uninstall', o.udid, o.bundleId);
      } catch {}
    },
  };
}
