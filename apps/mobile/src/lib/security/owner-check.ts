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
 * 'cancelled'   cancelled, locked out or failed: nothing changes. Anything we cannot read is treated the same way.
 * Nothing here logs or sends anything.
 */
import * as LocalAuthentication from 'expo-local-authentication';
import { authOutcome } from '@/lib/app-lock/machine';
import { ownerCheckCopy } from './copy';

export type OwnerCheckResult = 'passed' | 'cancelled' | 'unavailable';

let inFlight: Promise<OwnerCheckResult> | null = null;

async function run(): Promise<OwnerCheckResult> {
  try {
    if ((await LocalAuthentication.getEnrolledLevelAsync()) === LocalAuthentication.SecurityLevel.NONE) return 'unavailable';
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: ownerCheckCopy.eraseReason, disableDeviceFallback: false });
    const outcome = authOutcome(r as { success: boolean; error?: string });
    if (outcome === 'ok') return 'passed';
    return outcome === 'noPasscode' ? 'unavailable' : 'cancelled';
  } catch {
    return 'cancelled';
  }
}

/** One system sheet at a time: a second tap while it is up gets the same answer. */
export function ownerCheck(): Promise<OwnerCheckResult> {
  if (!inFlight) inFlight = run().finally(() => (inFlight = null));
  return inFlight;
}
