/**
 * A picture that could not be stored with its letter (NS-01-R17). The letter and its words are kept either way; this
 * only remembers, for this run of the app, that the letter page should say so once, calmly, and offer Add again. It holds
 * a letter id and nothing else, is never written to disk, logged or sent, and clears when a picture is stored for that
 * letter. A restart forgets it: the letter page then simply shows the letter with no picture.
 */
const ids = new Set<string>();
const listeners = new Set<() => void>();
let version = 0;
const emit = () => {
  version++;
  for (const l of [...listeners]) l();
};

export function markPhotoNotSaved(ownerId: string): void {
  if (!ids.has(ownerId)) {
    ids.add(ownerId);
    emit();
  }
}
export function clearPhotoNotSaved(ownerId: string): void {
  if (ids.delete(ownerId)) emit();
}
export const photoNotSaved = (ownerId: string): boolean => ids.has(ownerId);
export const subscribePhotoNotSaved = (l: () => void): (() => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};
export const photoNotSavedVersion = (): number => version;
