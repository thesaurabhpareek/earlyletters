// Test helper only (CPO-29, CPrivO-14): a LibrarySource that serves a window the test built. It lives outside src so
// no reachable path can import it. Fictional family Asha only; no coordinate, no photo bytes.
import type { LibrarySource, NativeAccessStatus, WindowRequest } from '../../src/lib/moments/library';
import type { moments } from '@scribe/core';

export function fixtureSource(status: NativeAccessStatus, window: moments.LibraryWindow): LibrarySource {
  return {
    accessStatus: async () => status,
    requestAccess: async () => status,
    fetchWindow: async (_req: WindowRequest) => window,
    cancel: () => {},
  };
}
