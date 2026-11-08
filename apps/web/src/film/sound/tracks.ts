/**
 * The film's music: a typed list of real, openly licensed recordings that we host ourselves (public/audio).
 * Nothing is generated and nothing is fetched from anyone else: a track is downloaded from our own origin, only after
 * the visitor's first gesture, and only the one that is chosen. Pure data and helpers, so it is unit-tested alone
 * (test/tracks.test.ts). The licence register and the rules for adding a track are in docs/web/ambient-sound.md.
 *
 * To add a track: put the file(s) in apps/web/public/audio/, add one entry below, and run the tests. The tests fail
 * when a licence, a source link, a file, a size or (for licences that ask for credit) a credit is missing.
 */

/**
 * The licence of a recording, exactly as its page names it. Add a value here only after reading that licence's text.
 * 'test-only' is for a throwaway test fixture, never a licence for anything real.
 */
export type Licence = 'CC0-1.0' | 'Public Domain' | 'CC-BY-4.0' | 'CC-BY-3.0' | 'CC-BY-SA-4.0' | 'CC-BY-SA-3.0' | 'test-only';

/** Licences that ask the user of the work to credit its author (all the CC "BY" family). CC0 and public domain do not. */
export function requiresAttribution(licence: Licence): boolean {
  return licence.startsWith('CC-BY');
}

export type Mood = 'night' | 'dusk' | 'paper' | 'any';

export type TrackFile = {
  /** Path under the site's own origin, e.g. /audio/slow-piano.m4a. */
  src: string;
  /** mp3 ('audio/mpeg') plays everywhere; AAC in m4a ('audio/mp4') plays on iPhone Safari and Chrome. Not ogg: Safari is unreliable with it. */
  type: 'audio/mpeg' | 'audio/mp4';
};

export type Track = {
  /** Lowercase letters, digits and dashes. Used by ?music=<id>. */
  id: string;
  title: string;
  artist: string;
  licence: Licence;
  /** The page the recording came from, where its licence can be read. */
  sourceUrl: string;
  /** Tried in order; the first the browser can decode is used. */
  files: TrackFile[];
  /** Level trim in dB so every track sits near -23 LUFS at rest. Measured, not guessed (docs/web/ambient-sound.md). */
  gainDb: number;
  /** Seconds of overlap when the track comes round again, so the loop has no seam. */
  crossfadeSeconds: number;
  /** The scene tone this track suits best; 'any' for all. Informational for now. */
  mood: Mood;
  /** Set only on a throwaway test fixture; none is shipped. */
  testOnly?: boolean;
};

/**
 * The list. The first entry is the default. All four are CC0 1.0 recordings from OpenGameArt (no credit is required, so
 * the footer shows none); the licence register with how each was checked is in docs/web/ambient-sound.md.
 */
export const TRACKS: readonly Track[] = [
  {
    id: 'vaporware',
    title: 'Calm Piano 1 (Vaporware)',
    artist: 'cynicmusic',
    licence: 'CC0-1.0',
    sourceUrl: 'https://opengameart.org/content/calm-piano-1-vaporware',
    files: [{ src: '/audio/vaporware.mp3', type: 'audio/mpeg' }],
    gainDb: 0, // already normalised to about -23 LUFS integrated, peak under -7 dBFS, with a fade in and out in the file
    crossfadeSeconds: 4,
    mood: 'any',
  },
  {
    id: 'lifewave',
    title: 'Calm Ambient 3 (Lifewave 2k)',
    artist: 'cynicmusic',
    licence: 'CC0-1.0',
    sourceUrl: 'https://opengameart.org/content/calm-ambient-3-lifewave-2k',
    files: [{ src: '/audio/lifewave.mp3', type: 'audio/mpeg' }],
    gainDb: 0, // already normalised to about -23 LUFS integrated, peak under -7 dBFS, with a fade in and out in the file
    crossfadeSeconds: 4,
    mood: 'night',
  },
  {
    id: 'contemplation',
    title: 'Contemplation',
    artist: 'Joth',
    licence: 'CC0-1.0',
    sourceUrl: 'https://opengameart.org/content/contemplation-0',
    files: [{ src: '/audio/contemplation.mp3', type: 'audio/mpeg' }],
    gainDb: 0, // already normalised to about -23 LUFS integrated, peak under -7 dBFS, with a fade in and out in the file
    crossfadeSeconds: 4,
    mood: 'dusk',
  },
  {
    id: 'first-light',
    title: 'First Light Particles',
    artist: 'Yoiyami',
    licence: 'CC0-1.0',
    sourceUrl: 'https://opengameart.org/content/first-light-particles-%E2%80%93-cc0-atmospheric-pianoambient-track',
    files: [{ src: '/audio/first-light.mp3', type: 'audio/mpeg' }],
    gainDb: 0, // already normalised to about -23 LUFS integrated, peak under -7 dBFS, with a fade in and out in the file
    crossfadeSeconds: 4,
    mood: 'paper',
  },
];

export const DEFAULT_TRACK_ID = TRACKS[0].id;

/** The track an id names, or the default when the id is missing, unknown or not a string. */
export function trackById(id: string | null | undefined, tracks: readonly Track[] = TRACKS): Track {
  return tracks.find((t) => t.id === id) ?? tracks[0];
}

/** Reads ?music=<id> from a query string. Returns null when absent or invalid, so the caller falls back to the default. */
export function parseMusicParam(search: string, tracks: readonly Track[] = TRACKS): string | null {
  try {
    const value = new URLSearchParams(search).get('music');
    if (!value) return null;
    const id = value.trim().toLowerCase();
    return tracks.some((t) => t.id === id) ? id : null;
  } catch {
    return null;
  }
}

/**
 * The choice lives in this variable only: it lasts for the visit (the page's own lifetime, including moving between
 * pages of the site) and is never written anywhere. The first read looks at the address bar once.
 */
let chosen: string | null | undefined;

export function chosenTrack(search: string | undefined = typeof window === 'undefined' ? '' : window.location.search, tracks: readonly Track[] = TRACKS): Track {
  if (chosen === undefined) chosen = parseMusicParam(search, tracks);
  return trackById(chosen, tracks);
}

/** Test hook: forget the in-memory choice. */
export function resetChosenTrack(): void {
  chosen = undefined;
}

export type Credit = { id: string; text: string; href: string; licence: Licence };

/**
 * The credit lines for every track that needs one, made from the list itself so attribution cannot be forgotten.
 * The footer shows these (Footer.tsx). A track without a required credit adds nothing.
 */
export function credits(tracks: readonly Track[] = TRACKS): Credit[] {
  return tracks.filter((t) => requiresAttribution(t.licence)).map((t) => ({ id: t.id, text: `${t.title} by ${t.artist}`, href: t.sourceUrl, licence: t.licence }));
}

/** dB to a linear gain. */
export const dbToGain = (db: number): number => Math.pow(10, db / 20);
