/**
 * The remote kill switches the co-parent calls honour (ADR 0016 5.1, F19 6.5; review B N1 on #138,
 * comment 6370599543; review of #243, comment 6372901228):
 *
 *  - `killSwitches.invites`, whose scope is creating and redeeming invites (packages/api
 *    kill-switches.ts, F19-REQ-011): while it is on, creating an invite, Share again (it creates
 *    first), the look before joining (peek) and joining (accept) send nothing and the screens show
 *    `errors.paused`. Cancel invite is not paused: closing a link is the safe direction, it names no
 *    switch (`ENDPOINTS.revokeInvite`), and during a pause a parent may most want to close one.
 *  - `killSwitches.sync`: the pending list is read from `sync_books` (`ENDPOINTS.syncBooks` names the
 *    sync switch), so while sync is paused the list is not asked for and the Family tab keeps the
 *    rows it shows.
 *
 * lib/family/invites.ts checks these at the start of each call, so a screen cannot forget to.
 *
 * Read the way sync reads `killSwitches.sync` (lib/sync/index.ts remoteKillSource): the remote
 * module is loaded on first use, from inside a call, so a build with server features off never
 * touches it for invites (no screen calls these functions there), and the read fails closed: a
 * reader that cannot load or throws counts as paused, because a switch that silently stops working
 * is worse than a pause someone can see. A stale config cannot clear a switch: lib/remote applies
 * `withFreshKillSwitches` (packages/api remote-config.ts, F19-REQ-008) before anything reads it.
 *
 * What a pause never does: drop an invite. Nothing is sent, so open invites stay open on the server
 * and stay in the Family tab's list. `paused` is not a final error (invite-errors.logic.ts
 * FINAL_INVITE_ERRORS), so a token the phone holds stays in the Keychain and the join sheet goes on
 * with Try again once the switch is lifted.
 *
 * Pure TypeScript (no React Native import), so Node tests use it with a fake reader.
 */
import type { RemoteConfig } from '@scribe/api';

/** The switches read here. */
export type FamilyKillSwitch = 'invites' | 'sync';

/** Whether a switch is on now. */
export interface FamilyKillSource {
  on(key: FamilyKillSwitch): boolean;
}

/** The part of lib/remote this reads. */
export interface RemoteConfigReader {
  getRemoteConfig(): Pick<RemoteConfig, 'killSwitches'>;
}

/**
 * The real reader: the signed remote config's kill switches, read on every call (a lifted switch
 * applies at once). `load` is the remote module (a parameter so the test of the real reader can pass
 * a fake). Metro resolves the inline require when it bundles the app.
 */
export function remoteFamilyKillSource(load: () => RemoteConfigReader = () => require('../remote') as RemoteConfigReader): FamilyKillSource {
  const remote = load();
  return { on: (key) => remote.getRemoteConfig().killSwitches[key] === true };
}

let source: FamilyKillSource | null = null;

function switchOn(key: FamilyKillSwitch): boolean {
  try {
    source ??= remoteFamilyKillSource();
    return source.on(key);
  } catch {
    return true;
  }
}

/** True while `killSwitches.invites` is on, or when it cannot be read at all (fails closed, like sync). */
export function invitesPaused(): boolean {
  return switchOn('invites');
}

/** True while `killSwitches.sync` is on (or unreadable): the pending list, a sync_books read, waits. */
export function inviteListPaused(): boolean {
  return switchOn('sync');
}

/**
 * The error a paused call throws before it sends anything. It carries the server's own SQLSTATE for
 * a paused feature (SCKIL, with the switch as the detail; packages/api envelope.ts and
 * server/family.ts), so `inviteErrorKind` reads it as `paused` exactly as it reads the server's answer.
 */
export function pausedError(key: FamilyKillSwitch): Error {
  return Object.assign(new Error(`${key}_paused`), { code: 'SCKIL', details: key });
}

/** Throws `pausedError('invites')` while invites are paused. Called first by create, peek and accept. */
export function stopIfInvitesPaused(): void {
  if (invitesPaused()) throw pausedError('invites');
}

/** Throws `pausedError('sync')` while sync is paused. Called first by the pending list. */
export function stopIfInviteListPaused(): void {
  if (inviteListPaused()) throw pausedError('sync');
}

/**
 * Tests only (vitest sets `VITEST`), like setSyncKillSourceForTests: replace the reader, or pass
 * null to go back to the remote config. Throws anywhere else.
 */
export function setFamilyKillSourceForTests(next: FamilyKillSource | null): void {
  const env = typeof process !== 'undefined' ? process.env : undefined;
  if (!env?.VITEST) throw new Error('setFamilyKillSourceForTests is for tests only');
  source = next;
}
