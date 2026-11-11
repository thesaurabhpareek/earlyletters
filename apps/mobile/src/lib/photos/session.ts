/**
 * Photo-first on Home (NS-01-R3 to R5, R17, R22): a picture chosen before any words. Nothing is written until Keep.
 * `PhotoSession` holds the picked source in memory only; `commitPhoto` is the single place a file and a row are made.
 */
import { normalizePhotoPlace, normalizePhotoText } from './text';
import { carriesMetadata, stripJpeg } from './strip';
import { photoPath, STORED_EXT, type PhotoDeps, type PhotoPicker, type PickedAsset, type PickOutcome, type StoredPhoto } from './types';

export class PhotoSession {
  private asset: PickedAsset | null = null;
  private typed = '';
  private placeTyped = '';

  /** The picked source, or null. Only the still of a Live Photo is ever kept: `pairedVideoUri` is dropped here. */
  pick(asset: PickedAsset): void {
    this.asset = { uri: asset.uri };
  }
  change(asset: PickedAsset): void {
    this.pick(asset);
  }
  setText(typed: string): void {
    this.typed = typed;
  }
  setPlace(typed: string): void {
    this.placeTyped = typed;
  }
  /** The text as typed, for Undo. */
  get typedText(): string {
    return this.typed;
  }
  get typedPlace(): string {
    return this.placeTyped;
  }
  get place(): string | null {
    return normalizePhotoPlace(this.placeTyped);
  }
  get source(): PickedAsset | null {
    return this.asset;
  }
  get text(): string | null {
    return normalizePhotoText(this.typed);
  }
  /** Back, or "Let it go": nothing was written, so there is nothing to undo. */
  discard(): void {
    this.asset = null;
    this.typed = '';
    this.placeTyped = '';
  }
}

/** A letter needs words to be kept; a picture alone never is (NS-01-R5, D-103). */
export const canKeepWithPhoto = (finalText: string): boolean => finalText.trim().length > 0;

export type PickRun =
  | { status: 'picked'; asset: PickedAsset }
  | { status: 'cancelled' }
  | { status: 'failed' };

/**
 * Open the system picker (NS-01-R2, R17). The picker port has no permission call, so none can be made. An iCloud-only
 * picture reports progress and can be cancelled; a cancel or a failure leaves nothing behind.
 */
export function runPick(picker: PhotoPicker, onProgress?: (fraction: number) => void): { done: Promise<PickRun>; cancel(): void } {
  const run = picker.open({ onProgress });
  const done = run.done.then(
    (o: PickOutcome): PickRun => (o.status === 'picked' ? { status: 'picked', asset: { uri: o.asset.uri } } : { status: o.status }),
    (): PickRun => ({ status: 'failed' }),
  );
  return { done, cancel: () => run.cancel() };
}

export type CommitResult =
  | { status: 'stored'; photo: StoredPhoto }
  | { status: 'needs_words' }
  | { status: 'unreadable'; reason: 'not_jpeg' | 'corrupt' | 'needs_rotation' }
  | { status: 'no_space' }
  | { status: 'failed' };

/**
 * Make the stripped copy and its row, for a letter that now exists. On any failure 0 files remain and the letter is
 * not touched (NS-01-R17): the caller keeps the letter whatever this returns. A picture with no words writes nothing.
 */
export async function commitPhoto(
  deps: PhotoDeps,
  input: { entryId: string; finalText: string; bytes: Uint8Array; text: string | null; place?: string | null },
): Promise<CommitResult> {
  if (!canKeepWithPhoto(input.finalText)) return { status: 'needs_words' };
  let stripped = stripJpeg(input.bytes);
  if (!stripped.ok && stripped.reason === 'corrupt') return { status: 'unreadable', reason: 'corrupt' };
  if (!stripped.ok || stripped.orientation !== 1) {
    // Not a JPEG (HEIC, PNG), or a JPEG whose Exif turn would be lost when Exif goes: the native step makes an upright
    // JPEG first. Without it (no device adapter yet) nothing is stored and the letter is kept as it is.
    const why = stripped.ok ? 'needs_rotation' : stripped.reason;
    const baked = await deps.orientation?.bake(input.bytes).catch(() => null);
    if (!baked) return { status: 'unreadable', reason: why };
    stripped = stripJpeg(baked);
    if (!stripped.ok) return { status: 'unreadable', reason: stripped.reason };
    if (stripped.orientation !== 1) return { status: 'unreadable', reason: 'needs_rotation' };
  }
  if (carriesMetadata(stripped.bytes)) return { status: 'failed' }; // belt and braces: never store a copy that still carries any
  try {
    if ((await deps.files.freeBytes()) < stripped.bytes.length * 2) return { status: 'no_space' };
  } catch {
    return { status: 'failed' };
  }
  let sha256: string;
  try {
    sha256 = await deps.sha256(stripped.bytes);
  } catch {
    return { status: 'failed' };
  }
  const photo: StoredPhoto = {
    entryId: input.entryId,
    mediaId: deps.newId(),
    ext: STORED_EXT,
    bytes: stripped.bytes.length,
    sha256,
    width: stripped.width,
    height: stripped.height,
    text: normalizePhotoText(input.text),
    place: normalizePhotoPlace(input.place),
    addedAt: deps.now().toISOString(),
    deletedAt: null, // derived from the letter by the store; never written
  };
  const path = photoPath(photo);
  const prior = deps.store.get(input.entryId);
  try {
    await deps.files.write(path, stripped.bytes);
    deps.store.put(photo);
  } catch {
    await deps.files.remove(path).catch(() => {});
    if (prior) deps.store.put(prior);
    else deps.store.remove(input.entryId);
    return { status: 'failed' };
  }
  return { status: 'stored', photo };
}
