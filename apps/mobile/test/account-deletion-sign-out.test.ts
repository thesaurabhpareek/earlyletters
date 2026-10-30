/**
 * Sign out of this phone while a deletion is scheduled (critics' pass 30 Oct 2026, S3): it landed on "Sign in to delete
 * your account." with no confirm and no word that the request was still open. Now a native confirm says the deletion
 * stays scheduled for its date and that signing in again cancels it, and the signed-out page says the same in both
 * situations. The page and the deletion screen share the one confirm (lib/account-deletion/confirm-sign-out.ts).
 * Fictional family "Asha" only (CLAUDE.md).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { accountDeletionCopy as c, authCopy } from '@scribe/content';

const alert = vi.fn();
vi.mock('react-native', () => ({ Alert: { alert: (...args: unknown[]) => alert(...args) } }));

import { confirmSignOut } from '../src/lib/account-deletion/confirm-sign-out';

type Button = { text: string; style?: string; onPress?: () => void };

describe('[S3] the confirm before Sign out of this phone', () => {
  beforeEach(() => alert.mockClear());

  it('asks first, says the deletion stays scheduled for its date, and signs out only on the Sign out button', () => {
    const signOut = vi.fn();
    confirmSignOut('November 29, 2026', signOut);
    expect(signOut).not.toHaveBeenCalled(); // nothing happens at the tap
    expect(alert).toHaveBeenCalledTimes(1);
    const [title, body, buttons] = alert.mock.calls[0] as [string, string, Button[]];
    expect(title).toBe(authCopy.account.signOutTitle);
    expect(body).toBe('Your deletion stays scheduled for November 29, 2026. Sign in again any time to cancel it.');
    expect(buttons.map((b) => b.text)).toEqual([authCopy.account.cancel, authCopy.account.signOut]);
    expect(buttons[0].style).toBe('cancel');
    expect(buttons[1].style).not.toBe('destructive'); // signing out deletes nothing
    buttons[0].onPress?.();
    expect(signOut).not.toHaveBeenCalled(); // Cancel leaves her signed in
    buttons[1].onPress?.();
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('the words say the request stays open and how to cancel it, in the content rules\' voice', () => {
    expect(c.scheduled.signOutBody).toContain('{date}');
    expect(c.scheduled.signOutBody).toMatch(/stays scheduled/);
    expect(c.scheduled.signOutBody).toMatch(/Sign in again any time to cancel it\.$/);
    expect(c.scheduled.signOutBody).not.toMatch(/\b(we|our|us)\b/i);
  });

  it('the signed-out page is true both for a person who never asked and for one who signed out after asking', () => {
    expect(c.signedOut.body).toBe('Sign in to delete your account, or to cancel a deletion you started. Letters that are only on this phone stay here until you delete the app.');
    expect(c.signedOut.scheduledBody).toBe('Your account will be deleted on {date}. Sign in to cancel the deletion.');
  });
});
