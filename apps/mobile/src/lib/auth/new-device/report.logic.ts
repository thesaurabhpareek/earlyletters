/**
 * The app side of the new-device sign-in email (NDR-1, NS-08-R21; data-security 09 section 2.3 item 5). Pure: every
 * dependency is passed in, so it runs without a phone.
 *
 * What goes out: the class word and a random per-install id in the body, the access token as bearer. No profile or
 * session id: the function reads them from the token. Fire and forget: nothing here throws, shows UI or logs.
 */
import type { AuthState } from '../machine.logic';

export const NEW_DEVICE_FUNCTION = 'new-device-fill';
export const REPORT_TIMEOUT_MS = 8_000;
export type DeviceClass = 'apple' | 'other';

/** The function accepts 8 to 128 printable ASCII characters. 32 random bytes as hex is 64. */
export const DEVICE_ID_PATTERN = /^[\x21-\x7e]{8,128}$/;

export const deviceClassOf = (os: string): DeviceClass => (os === 'ios' ? 'apple' : 'other');

/** The reported sign-in: a user id waiting for its settled state, or null. */
export type ReportMark = string | null;

/**
 * Once per sign-in. A sign-in that began on this run (a method is known) is marked while its consent is checked; the mark is
 * spent the moment the state is ready with sync on (session ready, consent recorded). A restored session has no method, so a
 * launch or a foreground re-check never calls. Signed out clears the mark.
 */
export function nextReportMark(mark: ReportMark, state: AuthState): { mark: ReportMark; call: boolean } {
  if (state.status === 'signedOut' || state.status === 'signingIn') return { mark: null, call: false };
  if ((state.status === 'checkingConsent' || state.status === 'needsConsent') && state.method) return { mark: state.userId, call: false };
  if (state.status === 'ready' && state.sync === 'on' && mark === state.userId) return { mark: null, call: true };
  return { mark, call: false };
}

export interface ReportDeps {
  enabled: () => boolean;
  deviceId: () => Promise<string | null>;
  accessToken: () => Promise<string | null>;
  deviceClass: DeviceClass;
  send: (input: { token: string; body: { class: DeviceClass; device_id: string } }) => Promise<boolean>;
}

/** One call, one retry at most. Resolves whatever happens; the answer is never read. */
export async function reportNewDevice(deps: ReportDeps): Promise<void> {
  try {
    if (!deps.enabled()) return;
    const [id, token] = await Promise.all([deps.deviceId(), deps.accessToken()]);
    if (!id || !token || !DEVICE_ID_PATTERN.test(id)) return;
    const input = { token, body: { class: deps.deviceClass, device_id: id } };
    for (let attempt = 0; attempt < 2; attempt++) {
      if (await deps.send(input).catch(() => false)) return;
    }
  } catch {
    // Never blocks, never shows, never logs.
  }
}
