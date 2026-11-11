/** Photo with a letter: shapes and the ports the logic runs against (tests use in-memory ones). */
export const PHOTO_TEXT_MAX = 140;
/** Undo after a replace or a remove (NS-01-R7). */
export const UNDO_WINDOW_MS = 10_000;
/** One picture per letter at P0. */
export const STORED_EXT = 'jpg' as const;

/** A kept picture, phone-only. `deletedAt` is set while its letter waits in Recently deleted. */
export interface StoredPhoto {
  entryId: string;
  mediaId: string;
  ext: typeof STORED_EXT;
  /** The parent's own words about the picture; null when they typed none. Never filled in by the app. */
  text: string | null;
  addedAt: string;
  deletedAt: string | null;
}

/** Where picture records live. The device adapter is blocked on the entry_media schema decision (see PR). */
export interface PhotoStore {
  get(entryId: string): StoredPhoto | null;
  put(photo: StoredPhoto): void;
  remove(entryId: string): void;
  all(): StoredPhoto[];
}

/** Files on the phone. Paths are relative to the photos folder: `<entryId>/<mediaId>.jpg`. */
export interface PhotoFiles {
  write(path: string, bytes: Uint8Array): Promise<void>;
  remove(path: string): Promise<void>;
  /** Every path under the folder, for the wipe. */
  list(): Promise<string[]>;
  freeBytes(): Promise<number>;
}

export const photoPath = (p: Pick<StoredPhoto, 'entryId' | 'mediaId' | 'ext'>): string => `${p.entryId}/${p.mediaId}.${p.ext}`;

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

export interface PhotoDeps {
  store: PhotoStore;
  files: PhotoFiles;
  newId: () => string;
  now: () => Date;
}
