/**
 * The TypeScript surface of the library read (NS-53-R220, CPO-29 PR 9a). Pure: no native call, no fetch, no
 * permission string. The native module is PR 9b and waits for the G1a-L read-out. Shapes come from core.
 */
import type { moments } from '@scribe/core';

/** What the phone says about photo access, before we map it. `unavailable` is no module in the build. */
export type NativeAccessStatus = 'notDetermined' | 'limited' | 'full' | 'denied' | 'restricted' | 'unavailable';

/** One window of the library, asked for by the engine (spec 10.1 step 1). */
export interface WindowRequest {
  readonly fromMs: number;
  readonly toMs: number;
  readonly limit: number;
}

/** Re-exported so callers name one type for the columnar window. */
export type LibraryWindow = moments.LibraryWindow;
export type AccessState = moments.AccessState;

/** The data functions of R220. Thumbnails and full images are native views and are not part of this surface. */
export interface LibrarySource {
  /** No prompt, cheap. */
  accessStatus(): Promise<NativeAccessStatus>;
  /** The one system ask; only the primer's Continue may call it. */
  requestAccess(): Promise<NativeAccessStatus>;
  fetchWindow(req: WindowRequest): Promise<LibraryWindow>;
  cancel(): void;
}
