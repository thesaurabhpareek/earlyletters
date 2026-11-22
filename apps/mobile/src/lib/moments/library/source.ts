import type { LibrarySource, LibraryWindow } from './types';

const EMPTY_WINDOW: LibraryWindow = {
  ids: [],
  creationMs: new Float64Array(0),
  utcOffsetSec: new Int32Array(0),
  kind: new Uint8Array(0),
  subtypeFlags: new Uint32Array(0),
  favourite: new Uint8Array(0),
  burstId: [],
  placeCell: [],
  durationMs: new Float64Array(0),
  truncated: false,
};

/** The source while no library module is in the build: no windows, no read, no ask. */
export const nullSource: LibrarySource = {
  accessStatus: async () => 'unavailable',
  requestAccess: async () => 'unavailable',
  fetchWindow: async () => EMPTY_WINDOW,
  cancel: () => {},
};
