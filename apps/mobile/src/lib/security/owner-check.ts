/**
 * The phone's owner check (FR-SEC-06; E54; design 12-first-run-3.md, FS-34): Face ID, Touch ID or the passcode, asked
 * through expo-local-authentication's default policy (passcode falls back). Not a sign-in and not App lock.
 *
 * Erase everything calls it before the erase (components/settings/wipe.logic.ts runEraseEverything). Delete account does
 * NOT (E54; OQ-F4 is the open question, and its default stands: no check). A pending erase finished at launch
 * (lib/erase-everything.ts resumeEraseAtLaunch) never asks: the person already passed it, and a kill must not strand it.
 *
 * 'passed'      the person proved it.
 * 'unavailable' the phone has no passcode, so there is nothing to ask: the confirm runs alone (FR-SEC-06, G16).
 * 'cancelled'   the person cancelled: nothing changes, nothing is said.
 * 'failed'      locked out, a native error or no answer in time: nothing changes (fail closed, security Review B), and the
 *               screen says so in one line.
 * Nothing here logs or sends anything.
 */
import * as LocalAuthentication from 'expo-local-authentication';
import { authOutcome } from '@/lib/app-lock/machine';
import { ownerCheckCopy } from './copy';

export type OwnerCheckResult = 'passed' | 'cancelled' | 'failed' | 'unavailable';

/** A system sheet that has not answered by now is treated as failed, so the app lock's hold (whileSharing) is released. */
export const OWNER_CHECK_TIMEOUT_MS = 120_000;
const USER_CANCEL = new Set(['user_cancel', 'system_cancel', 'app_cancel', 'user_fallback']);

let inFlight: Promise<OwnerCheckResult> | null = null;

async function run(): Promise<OwnerCheckResult> {
  try {
    if ((await LocalAuthentication.getEnrolledLevelAsync()) === LocalAuthentication.SecurityLevel.NONE) return 'unavailable';
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: ownerCheckCopy.eraseReason, disableDeviceFallback: false });
    const outcome = authOutcome(r as { success: boolean; error?: string });
    if (outcome === 'ok') return 'passed';
    if (outcome === 'noPasscode') return 'unavailable';
    return outcome === 'cancelled' && USER_CANCEL.has((r as { error?: string }).error ?? '') ? 'cancelled' : 'failed';
  } catch {
    return 'failed';
  }
}

function withTimeout(p: Promise<OwnerCheckResult>, ms: number): Promise<OwnerCheckResult> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve('failed'), ms);
    void p.then(
      (v) => (clearTimeout(t), resolve(v)),
      () => (clearTimeout(t), resolve('failed')),
    );
  });
}

/** One system sheet at a time: a second tap while it is up gets the same answer. */
export function ownerCheck(timeoutMs: number = OWNER_CHECK_TIMEOUT_MS): Promise<OwnerCheckResult> {
  if (!inFlight) inFlight = withTimeout(run(), timeoutMs).finally(() => (inFlight = null));
  return inFlight;
}
