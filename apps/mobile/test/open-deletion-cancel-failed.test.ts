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
  d: {} as { signedIn: boolean; error: 'offline' | 'failed' | null; cancel: () => Promise<boolean>; signOut: () => Promise<void> },
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
import { renderHook } from './helpers/mini-react';

type Shown = { kind: string; body: string; primary?: { label: string; onPress: () => void } };
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
