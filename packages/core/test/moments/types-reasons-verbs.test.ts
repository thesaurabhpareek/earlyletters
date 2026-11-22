import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as core from '../../src';
import {
  ACCESS_STATES,
  CARD_KINDS,
  LABEL_MAX_CHARS,
  MACHINE_LINE_KINDS,
  REASONS,
  REASON_PRECEDENCE,
  VERBS,
  VERB_FACTS,
  isReason,
  isVerb,
  reasonRank,
  type MachineLine,
  type Moment,
  type ParentLabel,
} from '../../src/moments';

const DIR = join(__dirname, '../../src/moments');
const sources = readdirSync(DIR).filter((f) => f.endsWith('.ts'));
const read = (f: string) => readFileSync(join(DIR, f), 'utf8');

describe('NS-53 reasons (6.4a)', () => {
  it('[NS-53-R42] the closed list is exactly the 15 first-release reasons', () => {
    expect([...REASONS].sort()).toEqual(
      [
        'RSN-MARKED', 'RSN-BIRTHDAY', 'RSN-MONTHDAY', 'RSN-KEPT', 'RSN-HEART', 'RSN-VIDEO', 'RSN-DAY',
        'RSN-YEAR', 'RSN-RUN', 'RSN-PICKED', 'RSN-PLACE', 'RSN-HOLIDAY', 'RSN-FIRST', 'RSN-LETTER',
        'RSN-QUESTION',
      ].sort(),
    );
    expect(new Set(REASONS).size).toBe(15);
  });

  it('[NS-53-R286] RSN-ALBUM and RSN-SUGGEST are absent from the list, the guard and every moments source', () => {
    for (const gone of ['RSN-ALBUM', 'RSN-SUGGEST']) {
      expect((REASONS as readonly string[]).includes(gone)).toBe(false);
      expect(isReason(gone)).toBe(false);
    }
    for (const f of sources) {
      const code = read(f).replace(/\/\/.*$/gm, '');
      expect(code, f).not.toMatch(/RSN-ALBUM|RSN-SUGGEST/);
    }
  });

  it('[NS-53-R42] a reason outside the list is refused', () => {
    expect(isReason('RSN-DAY')).toBe(true);
    for (const bad of ['RSN-BEST', 'rsn-day', '', null, undefined, 7]) expect(isReason(bad)).toBe(false);
  });

  it('[NS-53-R42] precedence is marked, first, birthday, month day, holiday, kept, place, heart, video, day', () => {
    expect([...REASON_PRECEDENCE]).toEqual([
      'RSN-MARKED', 'RSN-FIRST', 'RSN-BIRTHDAY', 'RSN-MONTHDAY', 'RSN-HOLIDAY', 'RSN-KEPT',
      'RSN-PLACE', 'RSN-HEART', 'RSN-VIDEO', 'RSN-DAY',
    ]);
    for (const r of REASON_PRECEDENCE) expect(REASONS).toContain(r);
    expect(reasonRank('RSN-MARKED')).toBe(0);
    expect(reasonRank('RSN-DAY')).toBe(9);
    expect(reasonRank('RSN-HEART')! < reasonRank('RSN-VIDEO')!).toBe(true);
    expect(reasonRank('RSN-QUESTION')).toBeNull();
  });
});

describe('NS-53 verbs (7.4, D6)', () => {
  it('[NS-53-R54] the teaching verbs are exactly five', () => {
    expect([...VERBS]).toEqual(['nameDay', 'notNow', 'notThisOne', 'hideDay', 'keepClose']);
    expect(VERBS).toHaveLength(5);
  });

  it('[NS-53-R54] the two dropped verbs do not exist', () => {
    for (const gone of ['leaveOutPicture', 'useAlbum', 'leaveOut', 'chooseAlbum']) expect(isVerb(gone)).toBe(false);
    expect(isVerb('notThisOne')).toBe(true);
  });

  it('[NS-53-R54] every verb has an Undo, and only the name verb stores words', () => {
    for (const v of VERBS) expect(VERB_FACTS[v].undo).toBe(true);
    expect(VERBS.filter((v) => VERB_FACTS[v].storesLabel)).toEqual(['nameDay']);
    expect(VERBS.filter((v) => VERB_FACTS[v].untilTomorrow)).toEqual(['notNow']);
  });

  it('[NS-53-R55] a name is up to 60 typed characters', () => {
    expect(LABEL_MAX_CHARS).toBe(60);
  });
});

describe('NS-53 the Moment type (R59, R201)', () => {
  it('[NS-53-R59] [NS-53-R201] no coordinate, album, picture-id or machine-text member exists on a Moment', () => {
    type Banned =
      | 'lat' | 'lng' | 'lon' | 'latitude' | 'longitude' | 'coordinate' | 'coordinates' | 'location'
      | 'albumTitle' | 'albumId' | 'album' | 'title' | 'caption' | 'filename' | 'name' | 'text';
    const none: Extract<keyof Moment, Banned> extends never ? true : false = true;
    expect(none).toBe(true);
    const keys: (keyof Moment)[] = ['dayKey', 'cardKind', 'reason', 'machineLines', 'parentLabel', 'tileIds'];
    expect(keys).toHaveLength(6);
  });

  it('[NS-53-R201] the parent label and a machine line cannot stand in for each other', () => {
    const label = 'Nani called' as ParentLabel;
    const line: MachineLine = { kind: 'reason', reason: 'RSN-DAY' };
    // @ts-expect-error a machine line is not a parent label
    const a: ParentLabel = line;
    // @ts-expect-error a plain string typed elsewhere is not a parent label
    const b: ParentLabel = 'machine written';
    // @ts-expect-error a parent label is not a machine line
    const c: MachineLine = label;
    const m: Moment = {
      dayKey: '2026-11-14', cardKind: 'K-LIB', reason: 'RSN-DAY', machineLines: [line], parentLabel: label, tileIds: [],
    };
    // @ts-expect-error the machine slot takes lines only, not the parent's words
    const bad: Moment = { ...m, machineLines: [label] };
    expect([a, b, c, bad, m].length).toBe(5);
    expect([...MACHINE_LINE_KINDS]).toEqual(['reason', 'place', 'holiday']);
  });

  it('[NS-53-R59] closed enums hold what the spec lists', () => {
    expect([...ACCESS_STATES]).toEqual(['notDetermined', 'full', 'limited', 'denied', 'restricted', 'off']);
    expect(CARD_KINDS).not.toContain('K-PICK');
  });
});

/** The only imports from outside moments/, each file named: the pure age and prompt modules, which import nothing. */
const OUTSIDE: Record<string, string[]> = { 'holidays.ts': ['../age'], 'occasions.ts': ['../age'], 'slots.ts': ['../age', '../prompts'], 'plan.ts': ['../age'] };

describe('NS-53 the engine stays pure (CODE-R10, R43)', () => {
  it('[NS-53-R43] age.ts and prompts.ts, the two modules moments may import, import nothing themselves', () => {
    for (const f of ['age.ts', 'prompts.ts']) expect(readFileSync(join(__dirname, '..', '..', 'src', f), 'utf8'), f).not.toMatch(/^\s*(import|export)[^;]*from\s/m);
  });

  it('[NS-53-R43] moments imports only its own files and the named pure modules: no react-native, expo, node, fs or network module', () => {
    for (const f of sources) {
      const specs = [...read(f).matchAll(/(?:import|export)[^'"]*?from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
      for (const s of specs) expect(s.startsWith('./') || (OUTSIDE[f] ?? []).includes(s), `${f} imports ${s}`).toBe(true);
      expect(read(f), f).not.toMatch(/\brequire\(|import\(/);
    }
  });

  it('[NS-53-R43] no moments source names a forbidden signal', () => {
    for (const f of sources) {
      const code = read(f).replace(/\/\/.*$/gm, '');
      expect(code, f).not.toMatch(/PHPerson|CLGeocoder|MapKit|Vision|CoreML|MediaPlayer|Intl\./);
    }
  });

  it('[NS-53-R36] core exports the engine once, as the moments namespace', () => {
    expect(core.moments.REASONS).toBe(REASONS);
    expect(core.moments.VERBS).toBe(VERBS);
    expect('REASONS' in core).toBe(false);
  });
});
