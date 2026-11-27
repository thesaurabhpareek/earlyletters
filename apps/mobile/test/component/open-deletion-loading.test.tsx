/**
 * BL-494 point 3: while Cancel deletion runs, the deletion screen keeps its state (the heading, the date, the empty
 * kind) and its one primary, Cancel deletion, is busy; Sign out waits until the press settles (no second press, as
 * before). The real OpenDeletionScreen and its real press controller are rendered; StateScreen is stood in to read the
 * props it is given (test/component/state-screen-loading.test.tsx proves StateScreen draws `loading` as a busy button).
 * The cancel never settles here, so the press stays on its way for the render. Fictional family "Asha" only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StateAction } from '@/components/ui/state-screen.logic';
import type { PressController } from '@/components/settings/open-deletion.logic';

const seen = vi.hoisted(() => ({
  props: null as null | { kind: string; title: string; body?: string; primary?: StateAction; quiet?: readonly StateAction[] },
  press: false,
  ctl: null as unknown,
}));

vi.mock('@/components/ui/state-screen', () => ({
  StateScreen: (p: NonNullable<typeof seen.props>) => {
    seen.props = p;
    return null;
  },
}));
vi.mock('expo-router', () => ({ router: { push: () => undefined } }));
vi.mock('@/lib/store', () => ({ listChildren: () => [] }));
vi.mock('@/lib/sync', () => ({ syncNow: () => new Promise(() => undefined) }));
vi.mock('@/lib/account-deletion/confirm-sign-out', () => ({ confirmSignOut: () => undefined }));
vi.mock('@/lib/account-deletion', async () => {
  const [copy, logic, open] = await Promise.all([
    import('@/lib/account-deletion/copy'),
    import('@/lib/account-deletion/logic'),
    import('@/lib/account-deletion/open-request'),
  ]);
  return {
    accountDeletionCopy: copy.accountDeletionCopy,
    localDay: logic.localDay,
    deletionView: open.deletionView,
    // Signed in, no error; the cancel itself is the controller's (stood in below), so this one is never called.
    useAccountDeletion: () => ({ signedIn: true, error: null, cancel: () => new Promise(() => undefined), signOut: async () => undefined }),
  };
});
// The real controller, given a cancel that never settles; when the test asks, Cancel deletion is pressed before the render.
vi.mock('@/components/settings/open-deletion.logic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/settings/open-deletion.logic')>();
  return {
    ...actual,
    createPressController: (deps: Parameters<typeof actual.createPressController>[0]) => {
      const ctl = actual.createPressController({ ...deps, cancel: () => new Promise<boolean>(() => undefined) });
      if (seen.press) ctl.cancel();
      seen.ctl = ctl;
      return ctl;
    },
  };
});

import { accountDeletionCopy as c } from '@/lib/account-deletion/copy';
import { OpenDeletionScreen } from '@/components/settings/open-deletion';
import { renderMarkup } from '../helpers/render-markup';
import { harness } from './harness';

const request = { state: 'scheduled' as const, requestId: 'r-asha', scheduledFor: '2026-12-27T09:00:00.000Z' };
const draw = (pressed: boolean) => {
  seen.press = pressed;
  seen.props = null;
  renderMarkup(<OpenDeletionScreen request={request} />);
  return seen.props!;
};

beforeEach(() => {
  harness.announced.length = 0;
});
afterEach(() => {
  (seen.ctl as PressController | null)?.dispose(); // clears the 20 s cap timer
});

describe('[BL-494 point 3] Cancel deletion on its way keeps the screen and shows a busy primary', () => {
  it('before a press: the empty state, Cancel deletion as the primary (not busy), Sign out quiet', () => {
    const p = draw(false);
    expect(p.kind).toBe('empty');
    expect(p.title).toBe(c.scheduled.heading);
    expect(p.primary).toMatchObject({ label: c.scheduled.cancelButton, loading: false });
    expect(p.quiet?.map((a) => a.label)).toEqual([c.scheduled.doneButton]);
  });

  it('while the cancel runs: same kind, title and words; the primary is Cancel deletion with loading; nothing else to press', () => {
    const idle = draw(false);
    const p = draw(true);
    expect((seen.ctl as PressController).get().working).toBe('cancel');
    expect(p.kind).toBe('empty'); // not the loading state
    expect(p.title).toBe(idle.title);
    expect(p.body).toBe(idle.body);
    expect(p.primary).toMatchObject({ label: c.scheduled.cancelButton, loading: true });
    expect(p.quiet).toEqual([]);
    // #1761's spoken line still goes out when the press starts.
    expect(harness.announced).toContain(c.open.cancelling);
  });
});
