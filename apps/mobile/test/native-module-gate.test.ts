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
  /^expo-(audio|av|video|camera|image-picker|image-manipulator|media-library|background-task|background-fetch|task-manager|video-thumbnails|speech-recognition|screen-capture)$/,
  /^react-native-(video|image-picker|image-crop-picker|vision-camera|background-.+|track-player|audio.*|photo-.+|create-thumbnail|compressor|video-processing|nitro-.+)$/,
  /ffmpeg/i,
  /whisper/i,
  /compressor/i,
  /^@react-native-camera-roll\//,
  /^@react-native-community\/(image-editor|audio-toolkit)$/,
];

export type LedgerRow = { pkg: string; pin: string; plugin: string; licence: string; maintainer: string; review: string };

export function watchedDeps(deps: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, spec] of Object.entries(deps)) if (WATCHED.some((re) => re.test(name))) out[name] = spec;
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

/** One finding per problem; empty means the gate holds. Pure, so a fixture can prove each mutant. */
export function gateFindings(deps: Record<string, string>, ledgerText: string): string[] {
  const rows = parseLedger(ledgerText);
  const out: string[] = [];
  for (const [name, spec] of Object.entries(watchedDeps(deps))) {
    const row = rows.find((r) => r.pkg === name);
    if (!row) {
      out.push(`${name}@${spec}: no review row in ${DOC}`);
      continue;
    }
    if (!row.licence || /^(tbd|\?|-)$/i.test(row.licence)) out.push(`${name}: licence not recorded`);
    if (!row.maintainer || /^(tbd|\?|-)$/i.test(row.maintainer)) out.push(`${name}: maintainer not recorded`);
    if (!/^(verified|UNVERIFIED)\b/.test(row.plugin)) out.push(`${name}: plugin output must start with verified or UNVERIFIED`);
    if (!/^\d{4}-\d{2}-\d{2}\b/.test(row.review)) out.push(`${name}: review date missing`);
    if (EXACT.test(spec)) {
      if (!/^exact\b/.test(row.pin)) out.push(`${name}: pinned exactly in package.json but the row says "${row.pin}"`);
    } else if (!/^grandfathered\b/.test(row.pin)) {
      out.push(`${name}@${spec}: a range; only a row marked grandfathered may keep one, a new package is pinned exactly`);
    }
  }
  return out;
}

const pkg = JSON.parse(readFileSync(join(REPO, 'apps/mobile/package.json'), 'utf8')) as {
  dependencies: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const ledger = readFileSync(join(REPO, DOC), 'utf8');

const GOOD = [
  '| package | pin | plugin output | licence | maintainer | review |',
  '|---|---|---|---|---|---|',
  '| `expo-image-picker` | exact 1.2.3 | UNVERIFIED, no prebuild run | MIT | Expo | 2026-11-21 |',
].join('\n');

describe('[BL-878] native module gate', () => {
  it('[BL-878] every media, background or transcode dependency in apps/mobile has a complete review row', () => {
    expect(gateFindings({ ...pkg.dependencies, ...(pkg.devDependencies ?? {}) }, ledger)).toEqual([]);
  });

  it('[BL-878] the two packages on develop today are on the ledger', () => {
    expect(Object.keys(watchedDeps(pkg.dependencies)).sort()).toEqual(['expo-audio', 'whisper.rn']);
  });

  it('[BL-878] mutant: a new watched package with no row fails', () => {
    expect(gateFindings({ 'expo-image-picker': '1.2.3' }, '')).toEqual([
      expect.stringContaining('no review row'),
    ]);
    expect(gateFindings({ 'expo-image-picker': '1.2.3' }, GOOD)).toEqual([]);
  });

  it('[BL-878] mutant: each watched family is caught by name', () => {
    for (const n of ['expo-media-library', 'expo-background-task', 'expo-task-manager', 'ffmpeg-kit-react-native', 'react-native-compressor', 'expo-video', 'whisper.rn', '@react-native-camera-roll/camera-roll']) {
      expect(Object.keys(watchedDeps({ [n]: '1.0.0' })), n).toEqual([n]);
    }
    expect(Object.keys(watchedDeps({ 'expo-haptics': '1.0.0', clsx: '2.0.0', 'expo-audio-utils-ui': '1' }))).toEqual([]);
  });

  it('[BL-878] mutant: a new package on a range (^ or ~) fails even with a row', () => {
    expect(gateFindings({ 'expo-image-picker': '~1.2.3' }, GOOD)).toEqual([expect.stringContaining('a range')]);
    expect(gateFindings({ 'expo-image-picker': '^1.2.3' }, GOOD)).toEqual([expect.stringContaining('a range')]);
  });

  it('[BL-878] mutant: a row without licence, maintainer, date or a verified/UNVERIFIED word fails', () => {
    const row = (cells: string) => `| \`expo-image-picker\` | ${cells} |`;
    expect(gateFindings({ 'expo-image-picker': '1.2.3' }, row('exact 1.2.3 | UNVERIFIED | | Expo | 2026-11-21'))).toEqual(['expo-image-picker: licence not recorded']);
    expect(gateFindings({ 'expo-image-picker': '1.2.3' }, row('exact 1.2.3 | UNVERIFIED | MIT | TBD | 2026-11-21'))).toEqual(['expo-image-picker: maintainer not recorded']);
    expect(gateFindings({ 'expo-image-picker': '1.2.3' }, row('exact 1.2.3 | looks fine | MIT | Expo | 2026-11-21'))).toEqual([expect.stringContaining('verified or UNVERIFIED')]);
    expect(gateFindings({ 'expo-image-picker': '1.2.3' }, row('exact 1.2.3 | UNVERIFIED | MIT | Expo | soon'))).toEqual(['expo-image-picker: review date missing']);
  });

  it('[BL-878] mutant: a row that says exact while package.json holds a different shape is caught both ways', () => {
    expect(gateFindings({ 'expo-image-picker': '1.2.3' }, GOOD.replace('exact 1.2.3', 'grandfathered range'))).toEqual([expect.stringContaining('says "grandfathered')]);
  });

  it('[BL-878] the doc and the test agree that the ledger only grandfathers packages that predate the gate', () => {
    const grand = parseLedger(ledger).filter((r) => r.pin.startsWith('grandfathered')).map((r) => r.pkg).sort();
    expect(grand).toEqual(['expo-audio', 'whisper.rn']);
  });
});
