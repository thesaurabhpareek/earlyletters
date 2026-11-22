/** The music list: licences, sources, files, sizes, credits and the ?music= choice. See src/film/sound/tracks.ts. */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TRACKS, chosenTrack, credits, dbToGain, parseMusicParam, requiresAttribution, resetChosenTrack, trackById, type Track } from '../src/film/sound/tracks';

const WEB = join(__dirname, '..');
const MB = 1024 * 1024;
const fixture = (over: Partial<Track> = {}): Track => ({
  id: 'x',
  title: 'T',
  artist: 'A',
  licence: 'CC0-1.0',
  sourceUrl: 'https://example.org/t',
  files: [{ src: '/audio/x.mp3', type: 'audio/mpeg' }],
  gainDb: 0,
  crossfadeSeconds: 4,
  mood: 'any',
  ...over,
});

describe('the track list', () => {
  it('has at least one track, with unique, url-safe ids', () => {
    expect(TRACKS.length).toBeGreaterThan(0);
    const ids = TRACKS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  for (const t of TRACKS) {
    it(`${t.id}: has a licence, a source page, a title, an artist and sane numbers`, () => {
      expect(t.licence).toBeTruthy();
      expect(t.title.trim()).not.toBe('');
      expect(t.artist.trim()).not.toBe('');
      expect(t.sourceUrl).toMatch(/^https:\/\//);
      expect(t.gainDb).toBeGreaterThanOrEqual(-24);
      expect(t.gainDb).toBeLessThanOrEqual(12);
      expect(t.crossfadeSeconds).toBeGreaterThanOrEqual(0.5);
      expect(t.crossfadeSeconds).toBeLessThanOrEqual(20);
      if (!t.testOnly) expect(t.licence).not.toBe('test-only');
    });

    it(`${t.id}: every file exists under public, is mp3 or AAC m4a (not ogg), and is at most 6 MB`, () => {
      expect(t.files.length).toBeGreaterThan(0);
      for (const f of t.files) {
        expect(f.src).toMatch(/^\/audio\/[a-z0-9-]+\.(mp3|m4a)$/);
        expect(f.type).toBe(f.src.endsWith('.mp3') ? 'audio/mpeg' : 'audio/mp4');
        const path = join(WEB, 'public', f.src);
        expect(existsSync(path), f.src).toBe(true);
        expect(statSync(path).size, f.src).toBeLessThanOrEqual(6 * MB);
      }
    });
  }

  it('the audio files together are under 20 MB', () => {
    const files = new Set(TRACKS.flatMap((t) => t.files.map((f) => f.src)));
    const total = [...files].reduce((sum, src) => sum + statSync(join(WEB, 'public', src)).size, 0);
    expect(total).toBeLessThan(20 * MB);
  });

  it('ships no test fixture, and the default is vaporware', () => {
    expect(TRACKS.filter((t) => t.testOnly || t.licence === 'test-only')).toEqual([]);
    expect(TRACKS[0].id).toBe('vaporware');
  });

  it('every shipped track is CC0 or public domain unless it is credited in the footer', () => {
    for (const t of TRACKS) if (requiresAttribution(t.licence)) expect(credits().some((c) => c.id === t.id)).toBe(true);
  });

  it('every track that needs credit gets one, with its title, artist, source link and licence', () => {
    const needing = TRACKS.filter((t) => requiresAttribution(t.licence));
    const list = credits();
    expect(list.map((c) => c.id)).toEqual(needing.map((t) => t.id));
    for (const c of list) {
      const t = trackById(c.id);
      expect(c.text).toContain(t.title);
      expect(c.text).toContain(t.artist);
      expect(c.href).toBe(t.sourceUrl);
      expect(c.licence).toBe(t.licence);
    }
  });

  it('the footer renders the credits from the list, and the credit label is short copy', () => {
    const footer = readFileSync(join(WEB, 'src/components/site/Footer.tsx'), 'utf8');
    expect(footer).toMatch(/credits\(\)/);
    expect(footer).toMatch(/site\.sound\.credit/);
  });
});

describe('who needs credit', () => {
  it('the BY family does; CC0, public domain and the test tone do not', () => {
    for (const l of ['CC-BY-4.0', 'CC-BY-3.0', 'CC-BY-SA-4.0', 'CC-BY-SA-3.0'] as const) expect(requiresAttribution(l)).toBe(true);
    for (const l of ['CC0-1.0', 'Public Domain', 'test-only'] as const) expect(requiresAttribution(l)).toBe(false);
  });

  it('credits() lists a CC-BY track and skips a CC0 one', () => {
    const list = credits([fixture({ id: 'a', licence: 'CC0-1.0' }), fixture({ id: 'b', licence: 'CC-BY-4.0', title: 'Slow', artist: 'Ann' })]);
    expect(list).toEqual([{ id: 'b', text: 'Slow by Ann', href: 'https://example.org/t', licence: 'CC-BY-4.0' }]);
  });
});

describe('?music= choice', () => {
  const two = [fixture({ id: 'first' }), fixture({ id: 'second-one' })];

  it('reads a valid id, ignoring case and spaces', () => {
    expect(parseMusicParam('?music=second-one', two)).toBe('second-one');
    expect(parseMusicParam('?x=1&music=SECOND-ONE', two)).toBe('second-one');
    expect(parseMusicParam('?music=%20first%20', two)).toBe('first');
  });

  it('falls back to the default (null, then the first track) for a missing, empty or invalid value', () => {
    for (const q of ['', '?', '?music=', '?music=nope', '?music=../etc', '?music=first&music=zzz%']) {
      const id = parseMusicParam(q, two);
      expect(trackById(id, two).id).toBe(q === '?music=first&music=zzz%' ? 'first' : 'first');
    }
    expect(parseMusicParam('?music=nope', two)).toBeNull();
    expect(trackById(undefined, two).id).toBe('first');
    expect(trackById('nope', two).id).toBe('first');
  });

  it('remembers the first reading in memory only, for the whole visit', () => {
    resetChosenTrack();
    expect(chosenTrack('?music=second-one', two).id).toBe('second-one');
    expect(chosenTrack('', two).id).toBe('second-one'); // moved to a page without the parameter
    resetChosenTrack();
    expect(chosenTrack('', two).id).toBe('first');
  });

  it('writes nothing to any browser storage', () => {
    const src = readFileSync(join(WEB, 'src/film/sound/tracks.ts'), 'utf8');
    expect(src).not.toMatch(/local\s*Storage|session\s*Storage|indexedDB|document\.cookie/i);
    const calls: string[] = [];
    const storage = { getItem: () => null, setItem: (k: string) => void calls.push(k) };
    Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
    resetChosenTrack();
    chosenTrack('?music=second-one', two);
    expect(calls).toEqual([]);
    resetChosenTrack();
  });
});

describe('level', () => {
  it('converts dB to a linear gain', () => {
    expect(dbToGain(0)).toBe(1);
    expect(dbToGain(-6)).toBeCloseTo(0.501, 2);
    expect(dbToGain(6)).toBeCloseTo(1.995, 2);
  });
});
