/**
 * The Book's Photos lens (NS-01-R10 to R12): letters that have a picture, newest first. It only reads. It carries no
 * count, no add control and no hint, and it is absent (not empty) when no picture exists.
 */
import { fill } from '@/lib/copy';
import { photos } from './copy';
import type { StoredPhoto } from './types';

export interface LensLetter {
  id: string;
  /** YYYY-MM-DD, the letter's date. */
  occurredOn: string;
  capturedAt: string;
  /** Only kept letters count (a letter in the book). */
  inBook: boolean;
  kind?: string;
}

export interface LensTile {
  entryId: string;
  mediaId: string;
  occurredOn: string;
  /** "Photo, from the letter of {date}", the date in full. */
  a11yLabel: string;
}

export interface LensMonth {
  /** YYYY-MM */
  key: string;
  tiles: LensTile[];
}

export interface PhotosLens {
  visible: boolean;
  months: LensMonth[];
}

export interface LensOptions {
  /** A sealed letter's picture does not count until it opens (spec 04 FS-R10). */
  isClosedSeal?: (entryId: string) => boolean;
  /** The date in full for VoiceOver ("12 June 2026"). */
  fullDate: (iso: string) => string;
}

export function photosLens(letters: readonly LensLetter[], stored: readonly StoredPhoto[], opts: LensOptions): PhotosLens {
  const byId = new Map(letters.map((l) => [l.id, l]));
  const tiles = stored
    .filter((p) => !p.deletedAt)
    .map((p) => ({ p, l: byId.get(p.entryId) }))
    .filter(({ l, p }) => l && l.inBook && l.kind !== 'not_much' && !opts.isClosedSeal?.(p.entryId))
    .sort((a, b) => b.l!.occurredOn.localeCompare(a.l!.occurredOn) || b.l!.capturedAt.localeCompare(a.l!.capturedAt))
    .map(({ p, l }): LensTile => ({
      entryId: p.entryId,
      mediaId: p.mediaId,
      occurredOn: l!.occurredOn,
      a11yLabel: fill(photos.book.photos.a11yTile, { date: opts.fullDate(l!.occurredOn) }),
    }));
  const months: LensMonth[] = [];
  for (const t of tiles) {
    const key = t.occurredOn.slice(0, 7);
    const last = months[months.length - 1];
    if (last?.key === key) last.tiles.push(t);
    else months.push({ key, tiles: [t] });
  }
  return { visible: tiles.length > 0, months };
}
