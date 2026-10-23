/**
 * `killSwitches.invites` on the phone (ADR 0016 5.1, F19 6.5; review B N1 on #138, comment
 * 6370599543). The signed remote config can pause co-parent invites with no new build: while the
 * switch is on, creating an invite, Share again, the look before joining (peek), joining (accept)
 * and Cancel invite send nothing and the screens show `errors.paused`. lib/family/invites.ts checks
 * it at the start of each of those calls, so a screen cannot forget to.
 *
 * Read the way sync reads `killSwitches.sync` (lib/sync/index.ts remoteKillSource): the remote
 * module is loaded on first use, from inside a call, so a build with server features off never
 * touches it for invites (no screen calls these functions there), and the read fails closed: a
 * reader that cannot load or throws counts as paused, because a switch that silently stops working
 * is worse than a pause someone can see. A stale config cannot clear the switch: lib/remote applies
 * `withFreshKillSwitches` (packages/api remote-config.ts, F19-REQ-008) before anything reads it.
 *
 * What a pause never does: drop an invite. Nothing is sent, so open invites stay open on the server
 * and stay in the Family tab's list (sync_books is a read; this switch does not stop it). `paused` is
 * not a final error (invite-errors.logic.ts FINAL_INVITE_ERRORS), so a token the phone holds stays in
 * the Keychain and the join sheet goes on with Try again once the switch is lifted.
 *
 * Pure TypeScript (no React Native import), so Node tests use it with a fake reader.
 */
import type { RemoteConfig } from '@scribe/api';

/** `killSwitches.invites`: whether invites must stay paused now. */
export interface InvitesKillSource {
  paused(): boolean;
}

/** The part of lib/remote this reads. */
export interface RemoteConfigReader {
  getRemoteConfig(): Pick<RemoteConfig, 'killSwitches'>;
}

/**
 * The real reader: `killSwitches.invites` of the signed remote config, and no other switch.
 * `load` is the remote module (a parameter so the test of the real reader can pass a fake). Metro
 * resolves the inline require when it bundles the app.
 */
export function remoteInvitesKillSource(load: () => RemoteConfigReader = () => require('../remote') as RemoteConfigReader): InvitesKillSource {
  const remote = load();
  return { paused: () => remote.getRemoteConfig().killSwitches.invites === true };
}

let source: InvitesKillSource | null = null;

/** True while `killSwitches.invites` is on, or when it cannot be read at all (fails closed, like sync). */
export function invitesPaused(): boolean {
  try {
    source ??= remoteInvitesKillSource();
    return source.paused();
  } catch {
    return true;
  }
}

/**
 * The error a paused call throws before it sends anything. It carries the server's own SQLSTATE for
 * a paused feature (SCKIL, detail `invites`; packages/api envelope.ts and server/family.ts), so
 * `inviteErrorKind` reads it as `paused` exactly as it reads the server's answer.
 */
export function invitesPausedError(): Error {
  return Object.assign(new Error('invites_paused'), { code: 'SCKIL', details: 'invites' });
}

/** Throws `invitesPausedError()` while invites are paused. Called first by every invite call that would send. */
export function stopIfInvitesPaused(): void {
  if (invitesPaused()) throw invitesPausedError();
}

/**
 * Tests only (vitest sets `VITEST`), like setSyncKillSourceForTests: replace the reader, or pass
 * null to go back to the remote config. Throws anywhere else.
 */
export function setInvitesKillSourceForTests(next: InvitesKillSource | null): void {
  const env = typeof process !== 'undefined' ? process.env : undefined;
  if (!env?.VITEST) throw new Error('setInvitesKillSourceForTests is for tests only');
  source = next;
}
