/**
 * App lock: the state machine (F1; CPO-2, CISO-1; proposals/account-security/security.md section 2, design.md 2.3 to
 * 2.5; docs/design/screens/SETTINGS_AND_ACCOUNT.md sections 3 to 5). Pure: no React Native, no clock, no storage, so
 * every rule below is tested in Node (test/app-lock-machine.test.ts). lib/app-lock/controller.ts feeds it AppState,
 * the live take and the share sheet, and the root layout draws what it says.
 *
 * Rules:
 * - Off until the parent turns it on (CPO-2). Off, it never covers, never locks and never asks.
 * - Locks on a cold start, and on coming back after longer in the background than the grace ("Ask again after":
 *   Immediately, After 1 minute (default), After 5 minutes). `inactive` alone never locks (the Face ID sheet, a call,
 *   Control Center, the share sheet).
 * - The privacy cover is up whenever the lock is on and the app is not active, and whenever it is locked, so the app
 *   switcher snapshot never shows a letter or a name. It is drawn at once (no fade).
 * - Never during a take (paused included): a lock that falls due waits, and applies once the take is kept. The lock
 *   never stops or drops audio; it only covers. The same for the share sheet (Export).
 * - The lock screen asks once on its own per lock, never in a loop; after a cancel only Unlock asks again.
 * - The device passcode is removed: the lock turns off and says so once.
 */

/** "Ask again after" choices (F17-REQ-010 range). Fifteen minutes waits for F17-REQ-010 to widen. */
export const GRACE_CHOICES = ['immediately', 'oneMinute', 'fiveMinutes'] as const;
export type GraceChoice = (typeof GRACE_CHOICES)[number];
export const GRACE_MS: Record<GraceChoice, number> = { immediately: 0, oneMinute: 60_000, fiveMinutes: 300_000 };
/** F17 J step 2: one minute. */
export const DEFAULT_GRACE: GraceChoice = 'oneMinute';

export function parseGrace(v: string | null | undefined): GraceChoice {
  return (GRACE_CHOICES as readonly string[]).includes(v ?? '') ? (v as GraceChoice) : DEFAULT_GRACE;
}

export type AppPhase = 'active' | 'inactive' | 'background';

export type LockState = {
  /** The parent turned the lock on (settings `appLock.enabled`). */
  enabled: boolean;
  grace: GraceChoice;
  /** The lock screen is up: nothing of the book shows until the device says it is them. */
  locked: boolean;
  phase: AppPhase;
  /** When the app last went to the background, while the lock was on. Null while in front. */
  backgroundSince: number | null;
  /** A take is live (recording or paused, until it is kept). */
  recording: boolean;
  /** The share sheet (Export) or a system authentication sheet the app asked for is open. */
  holding: boolean;
  /** The grace passed during a take or a hold: lock as soon as it ends. */
  due: boolean;
  /** The lock screen may ask once on its own (cleared when it does; set again by the next lock). */
  promptArmed: boolean;
  /** One line to show once, then clear (`noticeShown`). */
  notice: 'passcodeRemoved' | null;
};

export type LockEvent =
  /** Cold start, with what the settings say. */
  | { type: 'launch'; enabled: boolean; grace: GraceChoice; phase?: AppPhase }
  | { type: 'appState'; phase: AppPhase; at: number }
  | { type: 'take'; live: boolean }
  | { type: 'hold'; open: boolean }
  /** The device confirmed it is them on the lock screen. */
  | { type: 'unlocked' }
  /** The lock screen asked on its own; it does not again until the next lock. */
  | { type: 'prompted' }
  /** Turned on in the offer or on the App lock page (after authenticating there). */
  | { type: 'enable'; grace?: GraceChoice }
  | { type: 'disable' }
  | { type: 'setGrace'; grace: GraceChoice }
  /** The device has no passcode now: the lock cannot hold, so it turns off and says so once. */
  | { type: 'passcodeGone' }
  | { type: 'noticeShown' };

export const INITIAL: LockState = {
  enabled: false,
  grace: DEFAULT_GRACE,
  locked: false,
  phase: 'active',
  backgroundSince: null,
  recording: false,
  holding: false,
  due: false,
  promptArmed: false,
  notice: null,
};

/** Lock now, or mark it due if a take or a hold is in the way. */
function lockOrDefer(s: LockState): LockState {
  if (s.recording || s.holding) return { ...s, due: true };
  return { ...s, locked: true, due: false, promptArmed: true };
}

export function reduce(s: LockState, e: LockEvent): LockState {
  switch (e.type) {
    case 'launch':
      // Cold start: no take and no sheet can be open yet, so it locks at once.
      // The automatic ask waits until iOS has made the app active (shouldAutoPrompt), so it is not spent on a sheet
      // the system refuses during launch.
      return { ...INITIAL, enabled: e.enabled, grace: e.grace, phase: e.phase ?? 'active', locked: e.enabled, promptArmed: e.enabled };
    case 'appState': {
      if (!s.enabled) return { ...s, phase: e.phase, backgroundSince: null };
      if (e.phase === 'inactive') return { ...s, phase: 'inactive' };
      if (e.phase === 'background') return { ...s, phase: 'background', backgroundSince: s.backgroundSince ?? e.at };
      // Back in front.
      const away = s.backgroundSince === null ? null : e.at - s.backgroundSince;
      const next: LockState = { ...s, phase: 'active', backgroundSince: null };
      if (s.locked || away === null || away < GRACE_MS[s.grace]) return next;
      return lockOrDefer(next);
    }
    case 'take': {
      const next = { ...s, recording: e.live };
      return !e.live && s.due && s.enabled ? lockOrDefer(next) : next;
    }
    case 'hold': {
      const next = { ...s, holding: e.open };
      return !e.open && s.due && s.enabled ? lockOrDefer(next) : next;
    }
    case 'unlocked':
      return { ...s, locked: false, due: false, promptArmed: false, backgroundSince: null };
    case 'prompted':
      return { ...s, promptArmed: false };
    case 'enable':
      // Turning it on authenticated first, so the book stays open now.
      return { ...s, enabled: true, grace: e.grace ?? s.grace, locked: false, due: false, promptArmed: false, backgroundSince: null };
    case 'disable':
      return { ...s, enabled: false, locked: false, due: false, promptArmed: false, backgroundSince: null };
    case 'setGrace':
      return { ...s, grace: e.grace };
    case 'passcodeGone':
      return s.enabled ? { ...s, enabled: false, locked: false, due: false, promptArmed: false, backgroundSince: null, notice: 'passcodeRemoved' } : s;
    case 'noticeShown':
      return { ...s, notice: null };
  }
}

/** The opaque cover (mark only): up while locked, and whenever the lock is on and the app is not in front. */
export function coverShown(s: LockState): boolean {
  return s.enabled && (s.locked || s.phase !== 'active');
}

/** The lock screen asks on its own: once per lock, only in front, never while a system sheet is already up. */
export function shouldAutoPrompt(s: LockState): boolean {
  return s.locked && s.promptArmed && s.phase === 'active' && !s.holding;
}

// ---------------------------------------------------------------------------------------------------------------------
// What the device can do (expo-local-authentication), as plain data.
// ---------------------------------------------------------------------------------------------------------------------

/** expo-local-authentication SecurityLevel: 0 none (no passcode), 1 passcode only, 2 or 3 biometrics. */
export type DeviceAuth = {
  level: number;
  /** AuthenticationType values: 1 fingerprint (Touch ID), 2 facial recognition (Face ID). */
  types: readonly number[];
  /** hasHardwareAsync: false on iOS when biometrics exist but are not available to this app (Face ID turned off for it). */
  hasHardware: boolean;
};

export type LockMethod = 'faceId' | 'touchId' | 'passcode';

export type LockAbility =
  /** No device passcode: the offer is hidden and the switch cannot turn on. */
  | { available: false }
  /** `faceIdDenied`: the phone has Face ID but it is off for this app, so the passcode opens the book. */
  | { available: true; method: LockMethod; faceIdDenied: boolean };

const FINGERPRINT = 1;
const FACE = 2;

/**
 * Which word the lock uses and whether it can be on. Biometrics unavailable (not set up, turned off for the app, or
 * locked out) fall back to the passcode: the default policy always allows it (disableDeviceFallback false).
 */
export function lockAbility(d: DeviceAuth): LockAbility {
  if (!(d.level >= 1)) return { available: false };
  const biometric = d.level >= 2;
  if (biometric && d.types.includes(FACE)) return { available: true, method: 'faceId', faceIdDenied: false };
  if (biometric && d.types.includes(FINGERPRINT)) return { available: true, method: 'touchId', faceIdDenied: false };
  return { available: true, method: 'passcode', faceIdDenied: d.types.includes(FACE) && !d.hasHardware };
}

/** expo-local-authentication's result, reduced to what the screens do with it. */
export type AuthOutcome = 'ok' | 'cancelled' | 'noPasscode' | 'failed';

export function authOutcome(r: { success: boolean; error?: string }): AuthOutcome {
  if (r.success) return 'ok';
  const err = r.error ?? '';
  if (err === 'passcode_not_set') return 'noPasscode';
  if (err === 'user_cancel' || err === 'system_cancel' || err === 'app_cancel' || err === 'user_fallback') return 'cancelled';
  return 'failed';
}
