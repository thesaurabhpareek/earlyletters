/// <reference types="node" />
/**
 * [BL-878] Native module gate (NX-39-R52, SEC-ML-11). A package that brings native media, background or transcode
 * code into the app needs a review line in docs/security/NATIVE_MODULE_GATE.md before it appears in
 * apps/mobile/package.json. This is a ratchet over the review table: it checks the record exists and is complete,
 * not that the review was good (that is `security-architect`'s read of the lockfile and plist diff).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO = join(__dirname, '..', '..', '..');
const DOC = 'docs/security/NATIVE_MODULE_GATE.md';

/** Names the gate watches. Extend this list when a new family of package appears; never shrink it to pass. */
export const WATCHED: RegExp[] = [
  /^expo-(audio|av|video|camera|image-picker|image-manipulator|media-library|background-task|background-fetch|task-manager|video-thumbnails|speech|speech-recognition|screen-capture|file-system-next)$/,
  /^react-native-(video|image-picker|image-crop-picker|image-resizer|vision-camera|background-.+|track-player|audio.*|photo-.+|create-thumbnail|compressor|video-processing|nitro-.+|fs|blob-util|executorch|audio-studio)$/,
  /ffmpeg/i,
  /whisper/i,
  /compressor/i,
  /downloader/i,
  /^(llama\.rn|onnxruntime.*|react-native-executorch)$/,
  /^@react-native-voice\/voice$/,
  /^@react-native-ml-kit\//,
  /^@siteed\/.*audio/,
  /^@react-native-camera-roll\//,
  /^@react-native-community\/(image-editor|audio-toolkit)$/,
];

/** Packages that predate the gate and may keep a range until their repin date. The set does not grow. */
export const GRANDFATHERED = ['expo-audio', 'whisper.rn'];

const LICENCES = /^(MIT|Apache-2\.0|BSD-2-Clause|BSD-3-Clause|ISC)$/;
const PLACEHOLDER = /^(tbd|todo|none|n\/a|na|unknown|x|xx|\?|-|\.\.\.|test|foo|bar|placeholder)$/i;

export type LedgerRow = { pkg: string; pin: string; plugin: string; licence: string; maintainer: string; review: string };

/** The package name a dependency really installs: `npm:expo-av@1.0.0` under a neutral key resolves to expo-av. */
export function realName(name: string, spec: string): string {
  const m = /^npm:((?:@[^/@]+\/)?[^@]+)@/.exec(spec);
  return m ? m[1] : name;
}

export function watchedDeps(deps: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, spec] of Object.entries(deps)) {
    const real = realName(name, spec);
    if (WATCHED.some((re) => re.test(name) || re.test(real))) out[name] = spec;
  }
  return out;
}

export function parseLedger(text: string): LedgerRow[] {
  const rows: LedgerRow[] = [];
  for (const line of text.split(/\r?\n/)) {
    const cells = line.split('|').map((c) => c.trim());
    const m = /^`([^`]+)`$/.exec(cells[1] ?? '');
    if (!m || cells.length < 8) continue;
    rows.push({ pkg: m[1], pin: cells[2], plugin: cells[3], licence: cells[4], maintainer: cells[5], review: cells[6] });
  }
  return rows;
}

const EXACT = /^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/;

function realDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? null : d;
}

/**
 * One finding per problem; empty means the gate holds. Pure, so a fixture can prove each mutant.
 * `locked` maps a package name to the version in package-lock.json; `today` is injectable for the expiry mutants.
 */
export function gateFindings(
  deps: Record<string, string>,
  ledgerText: string,
  locked: Record<string, string> = {},
  today: Date = new Date(),
): string[] {
  const rows = parseLedger(ledgerText);
  const out: string[] = [];
  for (const [name, spec] of Object.entries(watchedDeps(deps))) {
    const row = rows.find((r) => r.pkg === name);
    if (!row) {
      out.push(`${name}@${spec}: no review row in ${DOC}`);
      continue;
    }
    if (!LICENCES.test(row.licence)) out.push(`${name}: licence "${row.licence}" is not one of MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC`);
    const who = row.maintainer;
    if (PLACEHOLDER.test(who) || !(/\s/.test(who) || /^https?:\/\//.test(who))) out.push(`${name}: maintainer "${who}" is not a real name or url`);
    const m = /^(verified|UNVERIFIED): (.{10,})$/.exec(row.plugin);
    if (!m || PLACEHOLDER.test(m[2].trim())) out.push(`${name}: plugin output must be "verified: <evidence>" or "UNVERIFIED: <reason>"`);
    const d = realDate(row.review.split(/\s/)[0]);
    if (!d) out.push(`${name}: review date missing or not a real date`);
    else if (d.getTime() > today.getTime() + 864e5) out.push(`${name}: review date is in the future`);
    const gf = /^grandfathered range, locked (\S+), repin by (\d{4}-\d{2}-\d{2})\b/.exec(row.pin);
    if (EXACT.test(spec)) {
      if (!new RegExp(`^exact ${spec.replace(/\./g, '\\.')}\\b`).test(row.pin)) out.push(`${name}: package.json holds ${spec} but the row says "${row.pin}"`);
    } else if (!gf || !GRANDFATHERED.includes(name)) {
      out.push(`${name}@${spec}: a range; only ${GRANDFATHERED.join(' and ')} may be grandfathered, a new package is pinned exactly`);
    } else {
      const due = realDate(gf[2]);
      if (!due) out.push(`${name}: repin date is not a real date`);
      else if (due.getTime() < today.getTime()) out.push(`${name}: repin date ${gf[2]} has passed; pin it exactly and re-review`);
      if (locked[name] !== undefined && locked[name] !== gf[1]) out.push(`${name}: lockfile has ${locked[name]} but the row was reviewed at ${gf[1]}; re-review and pin exactly`);
    }
  }
  return out;
}

type Pkg = Partial<Record<'dependencies' | 'devDependencies' | 'optionalDependencies' | 'peerDependencies', Record<string, string>>>;
const read = (f: string) => JSON.parse(readFileSync(join(REPO, f), 'utf8'));
const allDeps = (p: Pkg) => ({ ...p.peerDependencies, ...p.optionalDependencies, ...p.devDependencies, ...p.dependencies });
const mobile = read('apps/mobile/package.json') as Pkg;
const root = read('package.json') as Pkg;
const lock = read('package-lock.json') as { packages: Record<string, { version?: string }> };
const ledger = readFileSync(join(REPO, DOC), 'utf8');
const lockedOf = (names: string[]) =>
  Object.fromEntries(names.map((n) => [n, lock.packages[`node_modules/${n}`]?.version ?? lock.packages[`apps/mobile/node_modules/${n}`]?.version]).filter(([, v]) => v));

const NOW = new Date('2026-11-21T12:00:00Z');
const ROW = (pin: string, plugin: string, licence: string, who: string, date: string, name = 'expo-image-picker') =>
  `| \`${name}\` | ${pin} | ${plugin} | ${licence} | ${who} | ${date} |`;
const OK = ['exact 1.2.3', 'UNVERIFIED: no prebuild run on this branch', 'MIT', 'Expo (650 Industries)', '2026-11-21 security'] as const;
const run = (cells: readonly string[], spec = '1.2.3', name = 'expo-image-picker') =>
  gateFindings({ [name]: spec }, ROW(cells[0], cells[1], cells[2], cells[3], cells[4], name), {}, NOW);
const withCell = (i: number, v: string) => OK.map((c, j) => (j === i ? v : c));

describe('[BL-878] native module gate', () => {
  it('[BL-878] every media, background or transcode dependency in the repo has a complete review row', () => {
    for (const p of [mobile, root]) {
      const deps = allDeps(p);
      expect(gateFindings(deps, ledger, lockedOf(Object.keys(deps)))).toEqual([]);
    }
  });

  it('[BL-878] the two packages on develop today are on the ledger', () => {
    expect(Object.keys(watchedDeps(allDeps(mobile))).sort()).toEqual(['expo-audio', 'whisper.rn']);
  });

  it('[BL-878] the grandfathered ranges are the two that predate the gate and carry a repin date', () => {
    const grand = parseLedger(ledger).filter((r) => r.pin.startsWith('grandfathered')).map((r) => r.pkg).sort();
    expect(grand).toEqual(GRANDFATHERED);
  });

  it('[BL-878] a complete exact row passes', () => {
    expect(run(OK)).toEqual([]);
  });

  it('[BL-878] mutant: a new watched package with no row fails', () => {
    expect(gateFindings({ 'expo-image-picker': '1.2.3' }, '', {}, NOW)).toEqual([expect.stringContaining('no review row')]);
  });

  it('[BL-878] mutant: each watched family is caught by name, and look-alikes are not', () => {
    for (const n of ['expo-media-library', 'expo-background-task', 'expo-task-manager', 'ffmpeg-kit-react-native', 'react-native-compressor', 'expo-video', 'whisper.rn', '@react-native-camera-roll/camera-roll', 'react-native-image-resizer', 'react-native-fs', '@siteed/expo-audio-studio', 'react-native-background-downloader', 'llama.rn', 'onnxruntime-react-native', '@react-native-voice/voice', 'expo-speech', '@react-native-ml-kit/text-recognition']) {
      expect(Object.keys(watchedDeps({ [n]: '1.0.0' })), n).toEqual([n]);
    }
    expect(Object.keys(watchedDeps({ 'expo-haptics': '1.0.0', clsx: '2.0.0', 'expo-audio-utils-ui': '1' }))).toEqual([]);
  });

  it('[BL-878] mutant: an npm: alias under a neutral name is judged by its target', () => {
    expect(Object.keys(watchedDeps({ 'media-helper': 'npm:expo-av@1.0.0' }))).toEqual(['media-helper']);
    expect(Object.keys(watchedDeps({ 'media-helper': 'npm:@scope/ffmpeg-thing@1.0.0' }))).toEqual(['media-helper']);
  });

  it('[BL-878] mutant: optional and peer dependencies are scanned too', () => {
    expect(Object.keys(watchedDeps(allDeps({ optionalDependencies: { 'expo-camera': '1.0.0' }, peerDependencies: { 'expo-av': '1.0.0' } }))).sort()).toEqual(['expo-av', 'expo-camera']);
  });

  it('[BL-878] mutant: a new package on a range (^ or ~) fails even with a row', () => {
    for (const spec of ['~1.2.3', '^1.2.3', '*', 'latest', 'github:someone/repo']) {
      expect(run(OK, spec), spec).not.toEqual([]);
    }
  });

  it('[BL-878] mutant: a new package on a range cannot borrow a grandfathered row', () => {
    const gf = ['grandfathered range, locked 1.2.3, repin by 2027-02-28', ...OK.slice(1)];
    expect(run(gf, '^1.2.3')).toEqual([expect.stringContaining('only expo-audio and whisper.rn')]);
  });

  it('[BL-878] mutant: placeholder licence, GPL and other non-permissive ids fail', () => {
    for (const l of ['', 'tbd', 'none', 'n/a', 'unknown', 'x', 'GPL-3.0', 'AGPL-3.0', 'LGPL-2.1', 'MIT OR GPL-3.0', 'SSPL-1.0', 'UNLICENSED', 'mit']) {
      expect(run(withCell(2, l)), `licence ${l}`).toEqual([expect.stringContaining('licence')]);
    }
    for (const l of ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC']) expect(run(withCell(2, l)), l).toEqual([]);
  });

  it('[BL-878] mutant: placeholder maintainer fails', () => {
    for (const w of ['', 'none', 'unknown', 'n/a', 'TBD', 'x', 'Expo']) {
      expect(run(withCell(3, w)), `maintainer ${w}`).toEqual([expect.stringContaining('maintainer')]);
    }
    expect(run(withCell(3, 'https://github.com/expo/expo'))).toEqual([]);
  });

  it('[BL-878] mutant: plugin cell must say verified or UNVERIFIED with a reason', () => {
    for (const c of ['', 'UNVERIFIED', 'UNVERIFIED:', 'UNVERIFIED: tbd', 'unverified: no run at all', 'looks fine', 'verified', 'verified: ok', 'UNVERIFIED, no prebuild run']) {
      expect(run(withCell(1, c)), `plugin ${c}`).toEqual([expect.stringContaining('plugin output')]);
    }
    expect(run(withCell(1, 'verified: prebuild diff attached in the PR body'))).toEqual([]);
  });

  it('[BL-878] mutant: an impossible, malformed or future review date fails', () => {
    for (const d of ['', 'soon', '9999-99-99', '2026-02-30', '2026-13-01', '01-01-2026', '2031-01-01']) {
      expect(run(withCell(4, d)), `date ${d}`).toEqual([expect.stringContaining('review date')]);
    }
  });

  it('[BL-878] mutant: exact row that does not match the version in package.json fails', () => {
    expect(run(OK, '1.2.4')).toEqual([expect.stringContaining('package.json holds 1.2.4')]);
    expect(run(['exact 1.2.30', ...OK.slice(1)], '1.2.3')).toEqual([expect.stringContaining('package.json holds')]);
  });

  describe('[BL-878] grandfathered ranges have a way out in code', () => {
    const GF = (locked: string, by: string) => [`grandfathered range, locked ${locked}, repin by ${by}`, ...OK.slice(1)];
    const go = (cells: readonly string[], locked: string, today = NOW) =>
      gateFindings({ 'whisper.rn': '~0.7.4' }, ROW(cells[0], cells[1], cells[2], cells[3], cells[4], 'whisper.rn'), { 'whisper.rn': locked }, today);

    it('[BL-878] holds while the lockfile matches the review and the date is ahead', () => {
      expect(go(GF('0.7.4', '2027-02-28'), '0.7.4')).toEqual([]);
    });
    it('[BL-878] mutant: a bump in the lockfile fails until the row is re-reviewed', () => {
      expect(go(GF('0.7.4', '2027-02-28'), '0.9.0')).toEqual([expect.stringContaining('lockfile has 0.9.0')]);
    });
    it('[BL-878] mutant: after the repin date the range fails', () => {
      expect(go(GF('0.7.4', '2027-02-28'), '0.7.4', new Date('2027-03-01T00:00:00Z'))).toEqual([expect.stringContaining('has passed')]);
    });
    it('[BL-878] mutant: a grandfathered row with no repin date or a bad one fails', () => {
      expect(go(['grandfathered range', ...OK.slice(1)], '0.7.4')).toEqual([expect.stringContaining('only expo-audio')]);
      expect(go(GF('0.7.4', '2027-02-30'), '0.7.4')).toEqual([expect.stringContaining('repin date')]);
    });
  });
});
