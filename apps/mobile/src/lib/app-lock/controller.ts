/**
 * App lock at run time: feeds the pure state machine (./machine.ts) from AppState, the live take
 * (lib/capture/recorder.ts onActiveTakeChange) and the share sheet, and talks to expo-local-authentication with its
 * default policy (Face ID or Touch ID, falling back to the device passcode; security.md section 2).
 *
 * Launch budget (A-NFR-001, A-NFR-002): startAppLock reads two settings synchronously and awaits nothing. The device
 * check (is there still a passcode) runs after, never in front of the first frame.
 * Nothing here logs or sends anything.
 */
import * as LocalAuthentication from 'expo-local-authentication';
import { useSyncExternalStore } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { onActiveTakeChange } from '@/lib/capture/recorder';
import { appLockCopy } from './copy';
import { authOutcome, coverShown, INITIAL, lockAbility, reduce, type AppPhase, type AuthOutcome, type GraceChoice, type LockAbility, type LockEvent, type LockState } from './machine';
import { appLockGrace, appLockOn, writeAppLock } from './prefs';

let state: LockState = INITIAL;
const listeners = new Set<() => void>();

function dispatch(e: LockEvent): void {
  const next = reduce(state, e);
  if (next === state) return;
  state = next;
  for (const l of [...listeners]) l();
}

export function getAppLockState(): LockState {
  return state;
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAppLock(): LockState {
  return useSyncExternalStore(subscribe, getAppLockState, getAppLockState);
}

const phaseOf = (s: AppStateStatus): AppPhase | null => (s === 'active' || s === 'inactive' || s === 'background' ? s : null);
/** The phase now; unknown reads as inactive, the safe value (no automatic ask until iOS says active; the cover stays). */
const currentPhase = (): AppPhase => phaseOf(AppState.currentState) ?? 'inactive';

let started = false;

/**
 * Once per process, during the root layout's first render (after the store opened), so a locked book is covered in
 * the very first frame. Returns nothing to await.
 */
export function startAppLock(): void {
  if (started) return;
  started = true;
  dispatch({ type: 'launch', enabled: appLockOn(), grace: appLockGrace(), phase: currentPhase() });
  AppState.addEventListener('change', (s) => {
    const phase = phaseOf(s);
    if (!phase) return;
    dispatch({ type: 'appState', phase, at: Date.now() });
    if (phase === 'active') void checkPasscodeStillSet();
  });
  onActiveTakeChange((live) => dispatch({ type: 'take', live }));
  void checkPasscodeStillSet();
}

/** What this phone can do now. Any error reads as "no lock possible" for the offer, never as a lock that cannot open. */
export async function readLockAbility(): Promise<LockAbility> {
  try {
    const [level, types, hasHardware] = await Promise.all([
      LocalAuthentication.getEnrolledLevelAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
      LocalAuthentication.hasHardwareAsync(),
    ]);
    return lockAbility({ level, types, hasHardware });
  } catch {
    return { available: false };
  }
}

/** The passcode was removed in iPhone Settings: the lock cannot hold, so it turns off and says so once (F17-U21). */
async function checkPasscodeStillSet(): Promise<void> {
  if (!state.enabled) return;
  let level: number;
  try {
    level = await LocalAuthentication.getEnrolledLevelAsync();
  } catch {
    return; // unknown is not "removed": keep the lock
  }
  if (level === LocalAuthentication.SecurityLevel.NONE && state.enabled) passcodeGone();
}

function passcodeGone(): void {
  try {
    writeAppLock({ enabled: false });
  } catch {
    // the state below still turns the lock off for this session
  }
  dispatch({ type: 'passcodeGone' });
}

let inFlight: Promise<AuthOutcome> | null = null;

/** One system sheet at a time. `hold` keeps the lock from falling due while a sheet the app asked for is up. */
function ask(promptMessage: string, hold: boolean): Promise<AuthOutcome> {
  if (inFlight) return inFlight;
  if (hold) dispatch({ type: 'hold', open: true });
  inFlight = LocalAuthentication.authenticateAsync({ promptMessage, disableDeviceFallback: false })
    .then((r) => authOutcome(r as { success: boolean; error?: string }))
    .catch((): AuthOutcome => 'failed')
    .then((outcome) => {
      if (outcome === 'noPasscode') passcodeGone();
      return outcome;
    })
    .finally(() => {
      inFlight = null;
      if (hold) dispatch({ type: 'hold', open: false });
    });
  return inFlight;
}

/** The lock screen's Unlock (and its one automatic ask). */
export async function unlock(): Promise<AuthOutcome> {
  const outcome = await ask(appLockCopy.unlockReason, false);
  if (outcome === 'ok') dispatch({ type: 'unlocked' });
  return outcome;
}

/** The lock screen asked on its own: not again until the next lock (never in a loop). */
export function markPrompted(): void {
  dispatch({ type: 'prompted' });
}

/** Turn on (offer or App lock page): authenticates first, so the Face ID permission appears in context. */
export async function turnOn(): Promise<AuthOutcome> {
  const outcome = await ask(appLockCopy.turnOnReason, true);
  if (outcome === 'ok') {
    writeAppLock({ enabled: true });
    dispatch({ type: 'enable', grace: appLockGrace() });
  }
  return outcome;
}

export async function turnOff(): Promise<AuthOutcome> {
  const outcome = await ask(appLockCopy.turnOffReason, true);
  if (outcome === 'ok') {
    writeAppLock({ enabled: false });
    dispatch({ type: 'disable' });
  }
  return outcome;
}

export function setGrace(grace: GraceChoice): void {
  writeAppLock({ grace });
  dispatch({ type: 'setGrace', grace });
}

/**
 * Read the settings again and start from them, as a cold start would (lock state in memory only). A no-op while a take
 * or a system sheet is live. For Erase everything
 * (#520): once the store is wiped, call this so a just-erased phone does not keep the lock on until the next launch.
 */
export function reloadAppLock(): void {
  // Never while a take or a system sheet is live: a reload would forget them and could let a lock fall during a take.
  if (state.recording || state.holding) return;
  dispatch({ type: 'launch', enabled: appLockOn(), grace: appLockGrace(), phase: currentPhase() });
}

export function clearNotice(): void {
  dispatch({ type: 'noticeShown' });
}

/** Export asks again while the lock is on (security backlog 2). Off: goes ahead. */
export async function confirmForExport(): Promise<boolean> {
  if (!state.enabled) return true;
  return (await ask(appLockCopy.exportReason, true)) === 'ok';
}

/** The share sheet is open: the lock waits until it closes (security.md section 2). */
export async function whileSharing<T>(run: () => Promise<T>): Promise<T> {
  dispatch({ type: 'hold', open: true });
  try {
    return await run();
  } finally {
    dispatch({ type: 'hold', open: false });
  }
}

export { coverShown };
