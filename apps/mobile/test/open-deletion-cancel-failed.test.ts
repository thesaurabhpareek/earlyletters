/// <reference types="node" />
/**
 * [BL-491 point 5] (CDesO-46, exec-team ruled under D-172): a Cancel deletion press that does not go through says the
 * outcome is not known yet, never "Nothing has changed." The deletion screen (open-deletion.tsx) is driven on the small
 * stand-in for React's hooks: the real screen and its real press controller, with the account-deletion hook stood in so
 * the cancel can fail offline or failed. What the screen hands StateScreen is read off the returned tree. Whether
 * VoiceOver reads it is a device check. Fictional family "Asha" only.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  spoken: [] as string[],
  d: {} as {
    signedIn: boolean;
    error: 'offline' | 'failed' | null;
    cancel: () => Promise<boolean>;
    signOut: () => Promise<void>;
    /** The hook's session count and status (use-account-deletion.ts); the older cases here leave them out. */
    session?: number;
    status?: { state: 'executing'; requestId: string; scheduledFor?: string } | null;
  },
}));

vi.mock('react', async () => (await import('./helpers/mini-react')).reactStandIn);
vi.mock('react-native', () => ({ View: function View() { return null; }, ActivityIndicator: () => null, Platform: { OS: 'ios' } }));
vi.mock('expo-router', () => ({ router: { push: () => undefined } }));
vi.mock('@/components/ui/state-screen', () => ({ StateScreen: function StateScreen() { return null; } }));
vi.mock('@/components/ui/text', () => ({ Text: () => null }));
vi.mock('@/lib/a11y', () => ({ announce: (m: string) => void h.spoken.push(m), useTheme: () => ({ c: { accent: '#000000' } }) }));
vi.mock('@/lib/account-deletion/confirm-sign-out', () => ({ confirmSignOut: () => undefined }));
vi.mock('@/lib/haptics', () => ({ haptic: () => undefined }));
vi.mock('@/lib/store', () => ({ listChildren: () => [] }));
vi.mock('@/lib/sync', () => ({ syncNow: () => Promise.resolve(null) }));
vi.mock('@/lib/dates', () => ({ longDate: (day: string) => day }));
vi.mock('@/lib/account-deletion', async () => {
  const { accountDeletionCopy } = await import('@scribe/content');
  const { deletionView } = await import('../src/lib/account-deletion/open-request');
  const { localDay } = await import('../src/lib/account-deletion/logic');
  return { accountDeletionCopy, deletionView, localDay, useAccountDeletion: () => h.d };
});

import { accountDeletionCopy as c } from '@scribe/content';
import { OpenDeletionScreen } from '../src/components/settings/open-deletion';
import { shownRequest } from '../src/components/settings/open-deletion.logic';
import { renderHook } from './helpers/mini-react';

type Shown = { kind: string; title: string; body: string; primary?: { label: string; onPress: () => void }; quiet?: Array<{ label: string }> };
type El = { type?: unknown; props?: { children?: unknown } & Record<string, unknown> };

/** The props the screen hands StateScreen, found in the returned tree. */
function shown(tree: unknown): Shown {
  const stack: unknown[] = [tree];
  while (stack.length) {
    const el = stack.pop() as El | null;
    if (!el || typeof el !== 'object') continue;
    if (Array.isArray(el)) stack.push(...el);
    else if (typeof el.type === 'function' && el.type.name === 'StateScreen') return el.props as unknown as Shown;
    else if (el.props) stack.push(el.props.children);
  }
  throw new Error('no StateScreen in the tree');
}

const request = { state: 'scheduled' as const, requestId: 'req-asha', scheduledFor: '2099-12-19T09:00:00.000Z' };
const settle = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

beforeEach(() => {
  h.spoken.length = 0;
});

describe('[BL-491 point 5] a failed Cancel deletion on the deletion screen', () => {
  for (const reason of ['offline', 'failed'] as const) {
    it(`says it is not clear yet whether it cancelled, and to tap Cancel deletion again (${reason})`, async () => {
      h.d = {
        signedIn: true,
        error: null,
        cancel: async () => {
          h.d.error = reason;
          return false;
        },
        signOut: async () => undefined,
      };
      const r = renderHook(() => OpenDeletionScreen({ request }));
      const before = shown(r.result.current);
      expect(before.primary?.label).toBe(c.scheduled.cancelButton);
      expect(before.body).not.toContain(c.errors.cancelFailed);

      before.primary!.onPress();
      await settle();
      r.rerender();

      const after = shown(r.result.current);
      expect(after.kind).toBe('error');
      expect(after.body).toContain("It's not clear yet if the deletion was canceled. Tap Cancel deletion again.");
      expect(after.body).not.toMatch(/nothing has changed/i);
      // VoiceOver is told the same line, once.
      expect(h.spoken.filter((s) => s === c.errors.cancelFailed)).toHaveLength(1);
      // Cancel deletion is offered again: pressing it once more is harmless.
      expect(after.primary?.label).toBe(c.scheduled.cancelButton);
    });
  }

  it('a passive read that failed says nothing until Cancel deletion is pressed', () => {
    h.d = { signedIn: true, error: 'offline', cancel: async () => false, signOut: async () => undefined };
    const r = renderHook(() => OpenDeletionScreen({ request }));
    expect(shown(r.result.current).kind).toBe('empty');
    expect(shown(r.result.current).body).not.toContain(c.errors.cancelFailed);
    expect(shown(r.result.current).body).not.toContain(c.errors.offline);
  });
});

describe('[BL-491] the cancel-failed line goes once nothing on the screen can be canceled', () => {
  type Req = { state: 'scheduled'; requestId: string; scheduledFor: string } | { state: 'executing'; requestId: string } | { state: 'cancelled'; at: string };

  /** The deletion screen after one Cancel deletion that failed offline; `now` is the request the screen is drawn with. */
  async function afterFailedCancel() {
    const now: { request: Req } = { request };
    h.d = {
      signedIn: true,
      error: null,
      cancel: async () => {
        h.d.error = 'offline';
        return false;
      },
      signOut: async () => undefined,
    };
    const r = renderHook(() => OpenDeletionScreen({ request: now.request }));
    shown(r.result.current).primary!.onPress();
    await settle();
    r.rerender();
    expect(shown(r.result.current).body).toContain(c.errors.cancelFailed);
    return { r, now };
  }

  it('the request turns canceled while the screen is open (the cancel went through after all)', async () => {
    const { r, now } = await afterFailedCancel();
    now.request = { state: 'cancelled', at: '2099-11-19T09:00:00.000Z' };
    r.rerender();
    const after = shown(r.result.current);
    expect(after.body).not.toContain(c.errors.cancelFailed);
    expect(after.kind).toBe('empty');
  });

  it('the request is being carried out', async () => {
    const { r, now } = await afterFailedCancel();
    now.request = { state: 'executing', requestId: 'req-asha' };
    r.rerender();
    expect(shown(r.result.current).body).not.toContain(c.errors.cancelFailed);
    expect(shown(r.result.current).kind).toBe('empty');
  });

  it('the person signs out of this phone: the screen offers Sign in, not Cancel deletion', async () => {
    const { r } = await afterFailedCancel();
    h.d.signedIn = false;
    r.rerender();
    const after = shown(r.result.current);
    expect(after.primary?.label).toBe(c.signedOut.button);
    expect(after.body).not.toContain(c.errors.cancelFailed);
    expect(after.kind).toBe('empty');
  });
});

describe('[BL-491] a failed Cancel deletion does not come back after a sign-out and sign-in on the same screen (review follow-up on #2166)', () => {
  it('the old press is not this session\'s: a read that fails after signing in again shows no cancel line; a new press does', async () => {
    h.d = {
      signedIn: true,
      session: 0,
      error: null,
      cancel: async () => {
        h.d.error = 'offline';
        return false;
      },
      signOut: async () => undefined,
    };
    const r = renderHook(() => OpenDeletionScreen({ request }));
    shown(r.result.current).primary!.onPress();
    await settle();
    r.rerender();
    expect(shown(r.result.current).body).toContain(c.errors.cancelFailed);

    // Signed out (the hook counts the session), then in again. The error is left as it was here, as a read that failed
    // after the new sign-in would leave it: the screen must not show it as the old press's.
    Object.assign(h.d, { signedIn: false, session: 1 });
    r.rerender();
    Object.assign(h.d, { signedIn: true, session: 2 });
    r.rerender();
    const after = shown(r.result.current);
    expect(after.primary?.label).toBe(c.scheduled.cancelButton);
    expect(after.body).not.toContain(c.errors.cancelFailed);
    expect(after.kind).toBe('empty');

    // A press in this session that fails says so again.
    h.d.error = null;
    after.primary!.onPress();
    await settle();
    r.rerender();
    expect(shown(r.result.current).body).toContain(c.errors.cancelFailed);
  });
});

describe('[CDesO-59 case 3] a Cancel deletion that finds the request executing moves the screen at once (review follow-up on #2191)', () => {
  it('draws the executing view from the answer the hook already has, says it, and shows no failure line', async () => {
    h.d = {
      signedIn: true,
      session: 0,
      error: null,
      status: null,
      // The hook's cancel on an executing answer: no error, its status is the read that said so (use-account-deletion.ts).
      // The note is not rewritten here, as under HO-911's guard.
      cancel: async () => {
        h.d.status = { state: 'executing', requestId: 'req-asha', scheduledFor: request.scheduledFor };
        return false;
      },
      signOut: async () => undefined,
    };
    const r = renderHook(() => OpenDeletionScreen({ request }));
    shown(r.result.current).primary!.onPress();
    await settle();
    r.rerender();
    const after = shown(r.result.current);
    expect(after.title).toBe(c.open.executingTitle);
    expect(after.body).toBe(c.executing);
    expect(after.kind).toBe('empty');
    expect(after.primary?.label).toBe(c.scheduled.doneButton);
    expect(after.body).not.toContain(c.errors.cancelFailed);
    expect(h.spoken).toContain(`${c.open.executingTitle}. ${c.executing}`);
  });

  it('takes the hook\'s word only for the same request, and only over a note that still says scheduled', () => {
    const executing = { state: 'executing' as const, requestId: 'req-asha', scheduledFor: request.scheduledFor };
    expect(shownRequest(request, executing)).toEqual(executing);
    expect(shownRequest(request, null)).toBe(request);
    expect(shownRequest(request, { state: 'executing', requestId: 'req-other' })).toBe(request);
    expect(shownRequest(request, { state: 'scheduled', requestId: 'req-asha', scheduledFor: request.scheduledFor })).toBe(request);
    // A request can go from executing to held (a legal hold): a held note is newer than any executing answer, and stays.
    const held = { ...request, state: 'held' as const };
    expect(shownRequest(held, executing)).toBe(held);
    const cancelled = { state: 'cancelled' as const, at: '2099-11-19T09:00:00.000Z' };
    expect(shownRequest(cancelled, executing)).toBe(cancelled);
  });
});
