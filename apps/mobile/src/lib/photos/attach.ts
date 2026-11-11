/**
 * Add, replace and remove a picture on a letter that exists (NS-01-R7, R8). These functions are given a letter's id
 * and nothing else: they cannot read or write its words, its transcript, its machine edits or its recording. They
 * never create a letter.
 */
import { commitPhoto, type CommitResult } from './session';
import { photoPath, UNDO_WINDOW_MS, type PhotoDeps, type StoredPhoto } from './types';

/** What Undo needs for 10 seconds after a replace or a remove. The earlier picture's file stays until the ticket settles. */
export interface UndoTicket {
  entryId: string;
  previous: StoredPhoto;
  /** Set when a replace put a new picture in its place; Undo removes it. */
  replacement: StoredPhoto | null;
  expiresAt: number;
}

export type AttachResult =
  | { status: 'added'; result: CommitResult }
  | { status: 'needs_confirm'; existing: StoredPhoto };

/** "Add a photo" on Review or the letter page. A letter that already has one asks before anything changes. */
export async function addPhotoToLetter(
  deps: PhotoDeps,
  input: { entryId: string; finalText: string; bytes: Uint8Array; text: string | null; place?: string | null },
  confirmedReplace = false,
): Promise<AttachResult | { status: 'replaced'; result: CommitResult; ticket: UndoTicket | null }> {
  const existing = deps.store.get(input.entryId);
  if (!existing || existing.deletedAt) return { status: 'added', result: await commitPhoto(deps, input) };
  if (!confirmedReplace) return { status: 'needs_confirm', existing };
  // Confirmed: the first stays on disk until the new one is stored; its file is kept for Undo.
  const result = await commitPhoto(deps, { ...input, entryId: input.entryId });
  if (result.status !== 'stored') {
    // commitPhoto cleans its own failure, so the first is still the letter's picture
    return { status: 'replaced', result, ticket: null };
  }
  return {
    status: 'replaced',
    result,
    ticket: { entryId: input.entryId, previous: existing, replacement: result.photo, expiresAt: deps.now().getTime() + UNDO_WINDOW_MS },
  };
}

/** "Take the photo off": the file stays for 10 seconds so Undo can bring it back. */
export function removePhotoFromLetter(deps: PhotoDeps, entryId: string): UndoTicket | null {
  const previous = deps.store.get(entryId);
  if (!previous) return null;
  deps.store.remove(entryId);
  return { entryId, previous, replacement: null, expiresAt: deps.now().getTime() + UNDO_WINDOW_MS };
}

/** Undo inside the window. Returns false once the window has passed. */
export async function undoPhotoChange(deps: PhotoDeps, ticket: UndoTicket): Promise<boolean> {
  if (deps.now().getTime() > ticket.expiresAt) return false;
  if (ticket.replacement) await deps.files.remove(photoPath(ticket.replacement)).catch(() => {});
  deps.store.put(ticket.previous);
  return true;
}

/** The window has passed (or the parent moved on): the earlier file goes. */
export async function settlePhotoChange(deps: PhotoDeps, ticket: UndoTicket): Promise<void> {
  await deps.files.remove(photoPath(ticket.previous)).catch(() => {});
}
