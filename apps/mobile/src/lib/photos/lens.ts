/**
 * The Book's Photos lens (NS-01-R10 to R12; design spec 01 section 5.1): the letters that have a picture, shown as the
 * Book's own letter cards under the Book's own month openers, newest first as the Book reads. It only reads. It carries
 * no count, no add control and no hint, and it is absent (not empty) when no picture exists.
 */
import type { StoredPhoto } from './types';

export interface LensLetter {
  id: string;
  /** Only kept letters count (a letter in the book). */
  inBook: boolean;
  kind?: string;
}

export interface PhotosLens {
  visible: boolean;
  /** The picture of each kept, open letter that has one, by letter id. No total is kept anywhere (NS-01-R11). */
  photos: ReadonlyMap<string, StoredPhoto>;
}

export interface LensOptions {
  /** A sealed letter's picture does not count until it opens (spec 04 FS-R10). */
  isClosedSeal?: (entryId: string) => boolean;
}

export function photosLens(letters: readonly LensLetter[], stored: readonly StoredPhoto[], opts: LensOptions = {}): PhotosLens {
  const byId = new Map(letters.map((l) => [l.id, l]));
  const photos = new Map<string, StoredPhoto>();
  for (const p of stored) {
    const l = byId.get(p.entryId);
    if (!p.deletedAt && l && l.inBook && l.kind !== 'not_much' && !opts.isClosedSeal?.(p.entryId)) photos.set(p.entryId, p);
  }
  return { visible: photos.size > 0, photos };
}

/** The Book's chapters with only the letters that have a picture, in the Book's own order; an emptied chapter is dropped. */
export function photoChapters<C extends { data: readonly { id: string }[] }>(chapters: readonly C[], photos: ReadonlyMap<string, unknown>): C[] {
  return chapters.map((c) => ({ ...c, data: c.data.filter((e) => photos.has(e.id)) })).filter((c) => c.data.length > 0);
}
