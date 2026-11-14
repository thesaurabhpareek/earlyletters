/** Photo with a letter: shapes and the ports the logic runs against (tests use in-memory ones). */
export const PHOTO_TEXT_MAX = 140;
/** The parent's typed place for a picture (NS-01-R21, PROPOSED cap). Never read from the file. */
export const PHOTO_PLACE_MAX = 60;
/** Undo after a replace or a remove (NS-01-R7). */
export const UNDO_WINDOW_MS = 10_000;
/** One picture per letter at P0. */
export const STORED_EXT = 'jpg' as const;

/**
 * A kept picture, phone-only (ADR 0028 D1, the `entry_media` row). `deletedAt` is DERIVED by the store from its letter
 * (`entries.deleted_at`): it is never written, so a restored letter needs no picture write and the two cannot drift.
 */
export interface StoredPhoto {
  /** The owner: the kept letter's id, or the draft's id until Keep. They are the same id, so the picture never moves. */
  entryId: string;
  mediaId: string;
  ext: typeof STORED_EXT;
  /** Size of the stripped copy, its SHA-256 (a hash of a picture is L4) and its pixel size (entry_media columns). */
  bytes: number;
  sha256: string;
  width: number | null;
  height: number | null;
  /** The parent's own words about the picture; null when they typed none. Never filled in by the app. */
  text: string | null;
  /** A place the parent typed, or null. Never filled in, suggested or read from the picture's own data. */
  place: string | null;
  addedAt: string;
  deletedAt: string | null;
}

/**
 * Where picture records live: the local `entry_media` table (migration 11). `put` never writes `deletedAt`. The owner is
 * a letter, or a draft until Keep; `all()` lists kept letters' pictures only.
 */
export interface PhotoStore {
  get(entryId: string): StoredPhoto | null;
  put(photo: StoredPhoto): void;
  remove(entryId: string): void;
  all(): StoredPhoto[];
}

/** Files on the phone. Paths are relative to the photos folder: `<mediaId>.jpg` (ADR 0028 D1). No entry id in the name. */
export interface PhotoFiles {
  write(path: string, bytes: Uint8Array): Promise<void>;
  remove(path: string): Promise<void>;
  /** Every path under the folder, for the wipe. */
  list(): Promise<string[]>;
  freeBytes(): Promise<number>;
}

export const photoPath = (p: Pick<StoredPhoto, 'mediaId' | 'ext'>): string => `${p.mediaId}.${p.ext}`;

/** Where a picture sits inside an export (derived, ADR 0028 D2; NX-39-R32): `photos/<entry_id>/<media_id>.jpg`. */
export const exportPhotoPath = (p: Pick<StoredPhoto, 'entryId' | 'mediaId' | 'ext'>): string => `photos/${p.entryId}/${p.mediaId}.${p.ext}`;

/**
 * The native re-encode that turns a picture's pixels upright (ImageIO). Exif is dropped from the stored copy, so a
 * picture whose orientation tag is not 1 is only kept if the pixels are turned first. Returns a JPEG whose pixels are
 * upright and that carries no orientation tag, or null when it cannot. No JavaScript implementation exists, and the
 * device adapter is not written yet (it needs a device run): until one is registered, such a picture is reported as
 * `needs_rotation` and nothing is stored.
 */
export interface OrientationBaker {
  bake(original: Uint8Array, source?: { uri?: string }): Promise<Uint8Array | null>;
}

/** What the system picker hands back. Only the still of a Live Photo is ever read. */
export interface PickedAsset {
  uri: string;
  /** A Live Photo's paired video. Never read, never stored (NX-39-R12). */
  pairedVideoUri?: string | null;
}

export type PickOutcome =
  | { status: 'picked'; asset: PickedAsset }
  | { status: 'cancelled' }
  | { status: 'failed' };

/** The system picker. No permission method exists on this port on purpose (NS-01-R2). */
export interface PhotoPicker {
  open(handlers: { onProgress?: (fraction: number) => void }): { done: Promise<PickOutcome>; cancel(): void };
}

/**
 * The picker's temporary files (Caches/ImagePicker). The package keeps a copy of the ORIGINAL there, with its location,
 * and never deletes it (review C7). The app reads it once, then removes it; a sweep at launch empties the folder.
 */
export interface PickedFiles {
  read(uri: string): Promise<Uint8Array>;
  /** Never throws: a file already gone is fine. */
  remove(uri: string): Promise<void>;
  /** Empties the picker's folder. Never throws. */
  sweep(): Promise<void>;
}

export interface PhotoDeps {
  store: PhotoStore;
  files: PhotoFiles;
  newId: () => string;
  now: () => Date;
  /** SHA-256 of the stripped bytes, lower-case hex. */
  sha256: (bytes: Uint8Array) => Promise<string>;
  /** The native re-encode step. Absent until the device adapter exists. */
  orientation?: OrientationBaker;
}
