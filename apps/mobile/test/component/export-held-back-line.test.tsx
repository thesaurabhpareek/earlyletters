/**
 * FU-13d (BL-933; NS-01-R6, BL-1410): the export screen's held-back line, rendered (app/settings/export.tsx, static
 * markup through react-native-web; BL-278 harness). When the finished export left pictures out at the last guard, the
 * ready state says so under "ready": nothing when none was held back, the One line for one, the Many line for two or
 * more. The words are the app's own (packages/content export.en.ts).
 *
 * Static markup draws a screen once, so it cannot run an export to reach the ready state. The screen's one state hook is
 * given the ready state instead: the stand-in useState answers any call that starts from the screen's `{ kind: 'idle' }`
 * state with the state under test, and passes every other call to React. What it does NOT prove: the export run that sets
 * that state (test/export-photos.test.ts counts photosHeldBack), and layout on a phone. Fictional family Asha only.
 */
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderMarkup } from '../helpers/render-markup';
import { harness } from './harness';

const h = vi.hoisted(() => ({ state: null as unknown }));

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  const useState = ((init: unknown) => {
    const isScreenState = typeof init === 'object' && init !== null && (init as { kind?: unknown }).kind === 'idle';
    if (isScreenState && h.state) return [h.state, () => undefined];
    return actual.useState(init);
  }) as typeof actual.useState;
  return { ...actual, default: { ...actual, useState }, useState };
});
vi.mock('expo-keep-awake', () => ({ activateKeepAwakeAsync: async () => undefined, deactivateKeepAwake: async () => undefined }));
vi.mock('expo-router', () => ({ Stack: { Screen: () => null }, router: { push: () => undefined, back: () => undefined } }));
vi.mock('phosphor-react-native/src/icons/BookOpen', () => ({ BookOpenIcon: () => null }));
vi.mock('phosphor-react-native/src/icons/CheckCircle', () => ({ CheckCircleIcon: () => null }));
vi.mock('phosphor-react-native/src/icons/Database', () => ({ DatabaseIcon: () => null }));
vi.mock('phosphor-react-native/src/icons/FileText', () => ({ FileTextIcon: () => null }));
vi.mock('phosphor-react-native/src/icons/LockSimple', () => ({ LockSimpleIcon: () => null }));
vi.mock('phosphor-react-native/src/icons/Microphone', () => ({ MicrophoneIcon: () => null }));
vi.mock('react-native-safe-area-context', async () => {
  const { View } = await import('react-native-web');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
vi.mock('@/components/book/book-cover', () => ({ BookCover: () => null }));
vi.mock('@/components/settings/help-fallback', () => ({ useHelpLink: () => ({ open: () => undefined, sheet: null }) }));
vi.mock('@/lib/asks/surface', () => ({ setSurfaceBusy: () => undefined }));
vi.mock('@/lib/app-lock/controller', () => ({ confirmForExport: async () => true, whileSharing: async (f: () => Promise<void>) => f() }));
vi.mock('@/lib/analytics/track', () => ({ trackExportStarted: () => undefined, trackExportCompleted: () => undefined, trackExportFailed: () => undefined }));
vi.mock('@/lib/export', async () => {
  const { exportCopy } = await import('@scribe/content');
  class Stop extends Error {}
  return {
    exportCopy,
    cleanupExports: () => undefined,
    exportSummary: () => ({ letters: 3, recordings: 1, books: 1 }),
    runExport: async () => {
      throw new Error('not run in a render test');
    },
    shareExport: async () => undefined,
    ExportCancelledError: Stop,
    ExportLowSpaceError: Stop,
    ExportTooLargeError: Stop,
  };
});
vi.mock('@/lib/store', () => ({
  getActiveChild: () => ({ id: 'asha', name: 'Asha' }),
  listChildren: () => [{ id: 'asha', name: 'Asha' }],
  getSetting: () => null,
  setSetting: () => undefined,
}));

import { exportCopy } from '@scribe/content';
import { copy } from '@/lib/copy';

/** HTML-escaped as react-dom writes text. */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
const s = exportCopy.screen;

async function renderReady(photosHeldBack: number): Promise<string> {
  h.state = { kind: 'ready', result: { uri: 'file:///cache/exports/asha.zip', fileName: 'asha.zip', bytes: 1_000, entries: 3, recordings: 1, books: 1, mismatched: 0, photosHeldBack } };
  const mod = await import('@/app/settings/export');
  const Screen = mod.default;
  return renderMarkup(<Screen />);
}

beforeEach(() => {
  harness.fontScale = 1;
  harness.announced.length = 0;
  h.state = null;
});

describe('[BL-933] FU-13d: the held-back line on the finished export', () => {
  it('[NS-01-R6] FU-13d: the strings are distinct and say the letters are still in', () => {
    expect(s.photoHeldBackOne).not.toBe(s.photoHeldBackMany);
    expect(s.photoHeldBackOne).toMatch(/Its letter is still in the export\.$/);
    expect(s.photoHeldBackMany).toMatch(/Their letters are still in the export\.$/);
  });

  it('[NS-01-R6] FU-13d: no picture held back: the ready state shows neither line', async () => {
    const html = await renderReady(0);
    expect(html).toContain(esc(s.shareButton)); // the ready state is what was drawn
    expect(html).not.toContain(esc(s.photoHeldBackOne));
    expect(html).not.toContain(esc(s.photoHeldBackMany));
  });

  it('[NS-01-R6][BL-1410] FU-13d: one picture held back: the One line, after "ready", and not the Many line', async () => {
    const html = await renderReady(1);
    expect(html).toContain(`>${esc(s.photoHeldBackOne)}<`);
    expect(html.indexOf(`>${esc(copy.settings.export.ready)}<`)).toBeGreaterThan(-1);
    expect(html.indexOf(`>${esc(copy.settings.export.ready)}<`)).toBeLessThan(html.indexOf(esc(s.photoHeldBackOne)));
    expect(html).not.toContain(esc(s.photoHeldBackMany));
  });

  it('[NS-01-R6][BL-1410] FU-13d: two pictures held back: the Many line, and not the One line', async () => {
    const html = await renderReady(2);
    expect(html).toContain(`>${esc(s.photoHeldBackMany)}<`);
    expect(html).not.toContain(esc(s.photoHeldBackOne));
  });

  it('FU-13d: the line is not drawn before the export has run', async () => {
    const Screen = (await import('@/app/settings/export')).default;
    const html = renderMarkup(<Screen />);
    expect(html).not.toContain(esc(s.shareButton));
    expect(html).not.toContain(esc(s.photoHeldBackOne));
    expect(html).not.toContain(esc(s.photoHeldBackMany));
  });
});
