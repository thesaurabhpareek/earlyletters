/// <reference types="node" />
/**
 * The founder's TestFlight build 1 complaint (1 Nov 2026), second half: #626 stopped the first-run card saying
 * "Getting ready, 0%", but Book, Review, the letter page and the Settings language rows still rounded the fraction
 * down on their own and could print it during the first percent. Rule (CLAUDE.md, no new copy): a download's wait
 * line says "Downloading" (packsCopy.phases.downloading) below 1%, "Getting ready, n%" from 1%, and never 100% before
 * it is done. One helper, `downloadingLine`, does it for every surface that turns a download fraction into words.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { languageCopy, speechSettingsCopy, wordsCopy } from '@scribe/content';
import { describe, expect, it, vi } from 'vitest';
import { wordsCard, type WordsInput } from '../src/components/capture/words-state.logic';
import { consentLine } from '../src/components/speech/speech-consent-card.logic';
import { speechRow } from '../src/components/settings/recordings.logic';
import { downloadingLine } from '../src/lib/models/speech-download.logic';
import { packsCopy } from '../src/lib/packs/copy';

// language-row.tsx draws with React Native; its pure statusText runs here with the drawing modules stubbed.
vi.mock('react-native', () => ({ Platform: { OS: 'ios' }, Pressable: 'Pressable', View: 'View' }));
vi.mock('phosphor-react-native/src/icons/CaretRight', () => ({ CaretRightIcon: 'CaretRightIcon' }));
vi.mock('@/components/ui/button', () => ({ Button: 'Button' }));
vi.mock('@/components/ui/text', () => ({ Text: 'Text' }));
vi.mock('@/lib/a11y', () => ({ useTheme: () => ({ c: {} }) }));
const { statusText } = await import('../src/components/language/language-row');

const SRC = join(__dirname, '..', 'src');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8');
const speech = (n: number) => `Getting ready, ${n}%`;
const DOWNLOADING = 'Downloading';

describe('downloadingLine: the one rule for a download that is moving', () => {
  const line = (progress: number | null) => downloadingLine(progress, (n) => `${n}%`);

  it('the below-1% word is the existing phase text, "Downloading"', () => {
    expect(packsCopy.phases.downloading).toBe(DOWNLOADING);
    expect(line(0)).toBe(DOWNLOADING);
    expect(line(0.004)).toBe(DOWNLOADING);
    expect(line(0.0099)).toBe(DOWNLOADING);
  });

  it('from 1% the number appears, rounded down', () => {
    expect(line(0.01)).toBe('1%');
    expect(line(0.019)).toBe('1%');
    expect(line(0.4)).toBe('40%');
    expect(line(0.5)).toBe('50%');
  });

  it('is clamped: below 0, not a number and not moving are the word; at or past 100% it stays 99% until it is done', () => {
    expect(line(-0.2)).toBe(DOWNLOADING);
    expect(line(Number.NaN)).toBe(DOWNLOADING);
    expect(line(null)).toBe(DOWNLOADING);
    expect(line(0.999)).toBe('99%');
    expect(line(1)).toBe('99%');
    expect(line(1.7)).toBe('99%');
  });

  it('never prints 0% or 100% in any of the three copy lines the app uses', () => {
    const lines = [
      (n: number) => speechSettingsCopy.downloading.replace('{n}', String(n)),
      (n: number) => wordsCopy.pack.progress.replace('{n}', String(n)),
      (n: number) => languageCopy.status.downloading.replace('{percent}', String(n)),
    ];
    for (const l of lines) {
      for (let p = -0.5; p <= 1.5; p += 0.0005) {
        const text = downloadingLine(p, l);
        expect(text, `fraction ${p}`).not.toMatch(/\b0%|\b100%/);
      }
    }
    expect(downloadingLine(0.4, lines[0]!)).toBe(speech(40));
    expect(downloadingLine(0.4, lines[1]!)).toBe(speech(40));
    expect(downloadingLine(0.4, lines[2]!)).toBe('Downloading, 40%');
  });
});

describe('Review: the downloading card note (words-state.logic)', () => {
  const input = (progress: number | null): WordsInput => ({
    emptyFile: false,
    job: { phase: 'waiting_for_pack', progress: null },
    download: { ask: false, progress, hold: null, lowSpace: false, size: '575 MB', mb: 575, neededSize: '1.6 GB' },
    hints: { long: false, later: false },
    playing: false,
  });

  it('says "Downloading" in the first percent, with the bar still drawn from the true fraction', () => {
    for (const p of [0, 0.002, 0.0099]) {
      const c = wordsCard(input(p));
      expect(c.state).toBe('downloading');
      expect(c.note).toBe(DOWNLOADING);
      expect(c.bar).toBe(p);
    }
  });

  it('says "Getting ready, n%" from 1%, and never 100% before it is done', () => {
    expect(wordsCard(input(0.01)).note).toBe(speech(1));
    expect(wordsCard(input(0.4)).note).toBe(speech(40));
    expect(wordsCard(input(0.999)).note).toBe(speech(99));
    expect(wordsCard(input(1)).note).toBe(speech(99));
  });

  it('a Wi-Fi wait or no progress still has no percent', () => {
    expect(wordsCard(input(null)).note).toBeUndefined();
    const wifi = wordsCard({ ...input(0), download: { ...input(0).download, progress: null, hold: 'waiting_for_wifi' } });
    expect(wifi.note).toBe('Waits for Wi-Fi, 575 MB');
  });
});

describe('Settings, Storage: the language row (recordings.logic speechRow)', () => {
  it('"Downloading" in the first percent, "Getting ready, n%" from 1%, 99% at most', () => {
    expect(speechRow({ kind: 'downloading', fraction: 0 }).subtitle).toBe(DOWNLOADING);
    expect(speechRow({ kind: 'downloading', fraction: 0.004 }).subtitle).toBe(DOWNLOADING);
    expect(speechRow({ kind: 'downloading', fraction: -0.2 }).subtitle).toBe(DOWNLOADING);
    expect(speechRow({ kind: 'downloading', fraction: 0.01 }).subtitle).toBe(speech(1));
    expect(speechRow({ kind: 'downloading', fraction: 0.4 })).toMatchObject({ subtitle: speech(40), percent: 40 });
    expect(speechRow({ kind: 'downloading', fraction: 1.7 })).toMatchObject({ subtitle: speech(99), percent: 99 });
  });

  it('the ring has no number on it and stays a ring at its start', () => {
    const r = speechRow({ kind: 'downloading', fraction: 0.004 });
    expect(r.percent).toBe(0);
    expect(r.action).toBe('stop');
    expect(r.trailing).toBe('Stop');
  });
});

describe('Settings, Spoken language: the text rules row (language-row statusText)', () => {
  const downloading = (bytesDone: number, bytesTotal: number) => statusText({ state: 'downloading', bytesDone, bytesTotal });

  it('"Downloading" in the first percent and when the size is not known yet', () => {
    expect(downloading(0, 7000)).toBe(DOWNLOADING);
    expect(downloading(20, 7000)).toBe(DOWNLOADING);
    expect(downloading(0, 0)).toBe(DOWNLOADING);
  });

  it('"Downloading, n%" from 1%, 99% at most', () => {
    expect(downloading(70, 7000)).toBe('Downloading, 1%');
    expect(downloading(2800, 7000)).toBe('Downloading, 40%');
    expect(downloading(7000, 7000)).toBe('Downloading, 99%');
  });
});

describe('the first-run card keeps the same rule through the same helper', () => {
  it('consentLine', () => {
    const idle = { progress: null, stage: null, hold: null, failure: null } as const;
    expect(consentLine({ ...idle, progress: 0.003 }, 575).text).toBe(DOWNLOADING);
    expect(consentLine({ ...idle, progress: 0.42 }, 575).text).toBe(speech(42));
  });
});

describe('Book and the letter page: the waiting card reason (read in source; they draw with React Native)', () => {
  const part = (file: string, from: string, to: string) => {
    const s = read(file);
    return s.slice(s.indexOf(from), s.indexOf(to));
  };

  it('Book (tabs)/book.tsx WaitingCard asks downloadingLine, not its own rounding', () => {
    const card = part('app/(tabs)/book.tsx', 'function WaitingCard(', 'function Settle(');
    expect(card).toMatch(/downloadingLine\(download\.progress, \(n\) => fill\(s\.downloading, \{ n \}\)\)/);
    expect(card).not.toMatch(/\*\s*100/);
  });

  it('the letter page WaitingCard asks downloadingLine, not its own rounding', () => {
    const card = part('app/letter/[id].tsx', 'function WaitingCard(', 'function WordsSheet(');
    expect(card).toMatch(/downloadingLine\(p, \(n\) => fill\(wordsCopy\.pack\.progress, \{ n \}\)\)/);
    expect(card).not.toMatch(/\*\s*100/);
  });
});

describe('no surface fills a download percent without downloadingLine', () => {
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) return name === 'generated' || name === '__tests__' ? [] : files(p);
      return /\.(ts|tsx)$/.test(name) && !/\.test\.ts$/.test(name) ? [p] : [];
    });

  // The three percent lines: speechSettingsCopy.downloading, wordsCopy.pack.progress, languageCopy.status.downloading.
  const PERCENT_COPY = /fill\([\w.]*(?:\.downloading|pack\.progress),/;

  it('every line that fills one of them is inside downloadingLine(...), so nothing rounds down on its own', () => {
    const offenders: string[] = [];
    let sites = 0;
    for (const file of files(SRC)) {
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((text, i) => {
          if (!PERCENT_COPY.test(text)) return;
          sites += 1;
          if (!text.includes('downloadingLine(')) offenders.push(`${file.slice(SRC.length + 1)}:${i + 1}`);
        });
    }
    expect(offenders).toEqual([]);
    // The scan really found them: Book, Review, the letter page, the Storage language row, the Spoken language row
    // and the first-run card (a new surface must use downloadingLine too, and may raise this).
    expect(sites).toBeGreaterThanOrEqual(6);
  });
});
