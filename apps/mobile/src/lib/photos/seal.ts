/**
 * Whether a letter is a sealed letter that has not opened yet, so its picture waits with it (NS-01-R10b, spec 04 FS-R10).
 * There is no seal state on this phone yet (sealed letters are a later build), so nothing is closed today. The Book reads
 * the lens through this one function: the build that adds seals changes this body and nothing else, and the rule
 * (`photosLens` with `isClosedSeal`) is already tested with a closed seal.
 */
export const isClosedSeal = (_entryId: string): boolean => false;
