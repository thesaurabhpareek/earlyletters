/// <reference types="node" />
/**
 * Co-parent invites follow the server (S04 follow-up to #138 and #184):
 *  - `killSwitches.invites` (F19-REQ-011, WP-F19-12f; review B N1 on #138, comment 6370599543). On:
 *    creating an invite, Share again, peek and accept send nothing and read as `paused`, one neutral
 *    line; Cancel invite still goes out (the switch's scope is creating and redeeming; review of
 *    #243 N1, comment 6372901228). Off: the same calls reach the server. Stale: a config signed more
 *    than 7 days before the server's clock cannot clear the switch (F19-REQ-008), so the reader still
 *    sees it on. A pause never loses an invite or a held link.
 *  - The pending list is `sync_books().books[].invites` (review A on #138, comment 6370591557), read
 *    defensively, and waits while `killSwitches.sync` is on (#243 N2); in a full book expired rows
 *    are hidden (#243 N3). The real SQL is in test/family-e2e.test.ts.
 *  - The error kinds the family contract names (packages/api/src/server/family.ts) where #184 used
 *    other names: SCKIL `paused`, SCCID `id_taken`, SCCON family-share `family_share_consent`.
 * Fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  base64ToBytes,
  DEFAULT_REMOTE_CONFIG,
  generateSigningKey,
  parseRemoteConfig,
  signDocument,
  withFreshKillSwitches,
  type RemoteConfig,
  type TrustedKey,
} from '@scribe/api';
import { inviteErrorKindFor } from '@scribe/api/server';
import { familyCopy } from '@scribe/content';
import { renderTemplate } from '@scribe/core';
import { FINAL_INVITE_ERRORS, inviteErrorKind, NEW_DRAFT_ERRORS, type InviteErrorKind } from '../src/lib/family/invite-errors.logic';
import { newInviteDraft } from '../src/lib/family/invite-draft.logic';
import { openInvites, readPendingInvites, visiblePendingRows } from '../src/lib/family/invite-list.logic';
import { acceptInvite, createCoParentInvite, listPendingInvites, peekInvite, revokeInvite, shareInviteAgain, type FamilyClient } from '../src/lib/family/invites';
import { inviteListPaused, invitesPaused, remoteFamilyKillSource, setFamilyKillSourceForTests, type FamilyKillSource } from '../src/lib/family/invites-switch';
import { joinErrorLine, joinPlan } from '../src/lib/family/join-flow.logic';
import { familyTabState } from '../src/lib/family/members.logic';
import { SignedDocumentClient, type DocHttp, type DocHttpResponse } from '../src/lib/remote/documents';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const ASHA = '0199e4a2-7b3c-7d10-8a1b-2c3d4e5f6a7b';
const TOKEN = 'q8Zr0_Yc-3Jk9LmN2pQ4sT6vW8xZ1aB3cD5eF7gH9iJ';
const draftDeps = {
  randomBytes: (n: number) => new Uint8Array(n).map((_, i) => (i * 7 + 3) % 256),
  sha256Hex: async () => 'ab'.repeat(32),
  newId: () => '0199e4a2-7b3c-7d10-8a1b-000000000001',
};

/** What the server's sync_books sends Mama: Asha's book with two open invites and an expired one. */
const SYNC_BOOKS = {
  epoch: 1,
  first_run_open: false,
  books: [
    {
      id: ASHA,
      role: 'parent',
      name: 'Asha',
      invites: [
        { id: 'i-3', role: 'parent', signs_as: 'Papa', created_at: '2026-10-22T09:00:00.000Z', expires_at: '2026-10-29T09:00:00.000Z', status: 'open' },
        { id: 'i-2', role: 'parent', signs_as: null, created_at: '2026-10-20T09:00:00.000Z', expires_at: '2026-10-27T09:00:00.000Z', status: 'open' },
        { id: 'i-1', role: 'parent', signs_as: 'Papa', created_at: '2026-10-10T09:00:00.000Z', expires_at: '2026-10-17T09:00:00.000Z', status: 'expired' },
      ],
    },
  ],
};

/** A PostgREST stand-in that records every call and answers as the server would. */
function fakeServer() {
  const calls: string[] = [];
  const args: Record<string, unknown>[] = [];
  const answer = (fn: string, args: Record<string, unknown>) => {
    if (fn === 'create_child_invite') return { data: args.p_invite_id, error: null };
    if (fn === 'peek_invite') return { data: { inviter: 'Mama', role: 'parent' }, error: null };
    if (fn === 'accept_child_invite') return { data: ASHA, error: null };
    if (fn === 'revoke_invite') return { data: true, error: null };
    if (fn === 'sync_books') return { data: SYNC_BOOKS, error: null };
    return { data: null, error: { code: 'PGRST202', message: 'no such function' } };
  };
  const client = {
    rpc: (fn: string, a: Record<string, unknown> = {}) => {
      calls.push(fn);
      args.push(a);
      const call = {
        setHeader: () => call,
        then: <T1, T2>(ok?: (r: unknown) => T1 | PromiseLike<T1>, bad?: (e: unknown) => T2 | PromiseLike<T2>) => Promise.resolve(answer(fn, a)).then(ok, bad),
      };
      return call;
    },
    from: (table: string) => {
      calls.push(`from:${table}`);
      throw new Error('no table reads in these flows');
    },
  } as unknown as FamilyClient;
  return { client, calls, args };
}

async function kindOf(p: Promise<unknown>): Promise<InviteErrorKind | 'ok'> {
  try {
    await p;
    return 'ok';
  } catch (e) {
    return inviteErrorKind(e);
  }
}

/** Every invite call a screen makes that would send something, against `client`. */
async function everyInviteCall(client: FamilyClient, share: (url: string) => Promise<'shared' | 'dismissed'>) {
  const old = { id: 'i-3', signsAs: 'Papa' };
  return {
    create: await kindOf(createCoParentInvite(client, ASHA, 'Papa', await newInviteDraft(draftDeps))),
    shareAgain: await kindOf(shareInviteAgain(client, ASHA, old, await newInviteDraft(draftDeps), share)),
    peek: await kindOf(peekInvite(client, TOKEN)),
    accept: await kindOf(acceptInvite(client, TOKEN)),
    cancel: await kindOf(revokeInvite(client, 'i-3')),
  };
}

let switchOn = false;
let syncOn = false;
const switchSource: FamilyKillSource = { on: (key) => (key === 'invites' ? switchOn : syncOn) };

afterEach(() => {
  switchOn = false;
  syncOn = false;
  setFamilyKillSourceForTests(null);
});

describe('[F19-REQ-011] the real reader of killSwitches.invites and killSwitches.sync', () => {
  it('reads each switch for itself: sync never pauses invites, and invites never pause the list', () => {
    let config = { killSwitches: { ...DEFAULT_REMOTE_CONFIG.killSwitches, sync: true, serverContent: true } };
    setFamilyKillSourceForTests(remoteFamilyKillSource(() => ({ getRemoteConfig: () => config })));
    expect(invitesPaused()).toBe(false);
    expect(inviteListPaused()).toBe(true);
    config = { killSwitches: { ...DEFAULT_REMOTE_CONFIG.killSwitches, invites: true } };
    expect(invitesPaused()).toBe(true); // read on every call: no relaunch needed
    expect(inviteListPaused()).toBe(false);
    // Only the boolean true pauses; the bundled defaults never do.
    const defaults = remoteFamilyKillSource(() => ({ getRemoteConfig: () => DEFAULT_REMOTE_CONFIG }));
    expect([defaults.on('invites'), defaults.on('sync')]).toEqual([false, false]);
  });

  it('fails closed, like sync: a reader that throws reads as paused', () => {
    setFamilyKillSourceForTests({
      on: () => {
        throw new Error('remote config could not be read');
      },
    });
    expect(invitesPaused()).toBe(true);
    expect(inviteListPaused()).toBe(true);
  });

  it('is loaded on first use, from inside a call, as sync loads its switch (nothing at import time)', () => {
    const reader = src('lib/family/invites-switch.ts');
    expect(reader).toMatch(/require\('\.\.\/remote'\)/);
    expect(reader).not.toMatch(/^import (?!type )/m);
    expect(reader).toMatch(/killSwitches\[key\] === true/);
  });
});

describe('[F19-REQ-011] switch on: nothing is sent, and the screens say invites are paused', () => {
  it('create, Share again, peek and accept each read as paused before any request; Cancel invite still goes out', async () => {
    setFamilyKillSourceForTests(switchSource);
    switchOn = true;
    const { client, calls, args } = fakeServer();
    let sheets = 0;
    const result = await everyInviteCall(client, async () => {
      sheets++;
      return 'shared';
    });
    expect(result).toEqual({ create: 'paused', shareAgain: 'paused', peek: 'paused', accept: 'paused', cancel: 'ok' });
    // The only request is the cancel: closing a link is the safe direction (the switch stops creating and redeeming).
    expect(calls).toEqual(['revoke_invite']);
    expect(args).toEqual([{ p_invite: 'i-3' }]);
    expect(sheets).toBe(0); // Share again never opened the share sheet
  });

  it('[F11-REQ-019] the switch turns on while the share sheet is open: the unsent new invite is still cancelled, and a sent one still closes the old', async () => {
    setFamilyKillSourceForTests(switchSource);
    const old = { id: 'i-3', signsAs: 'Papa' };
    // Dismissed: nobody has the new link, so it is cancelled again even though invites are paused now.
    const dismissed = fakeServer();
    const draft = await newInviteDraft(draftDeps);
    const closed = async (): Promise<'dismissed'> => {
      switchOn = true;
      return 'dismissed';
    };
    expect(await shareInviteAgain(dismissed.client, ASHA, old, draft, closed)).toBe('dismissed');
    expect(dismissed.calls).toEqual(['create_child_invite', 'revoke_invite']);
    expect(dismissed.args[1]).toEqual({ p_invite: draft.id });
    // Shared: the old link is closed, so a forwarded copy is never revived.
    switchOn = false;
    const sent = fakeServer();
    const shared = async (): Promise<'shared'> => {
      switchOn = true;
      return 'shared';
    };
    expect(await shareInviteAgain(sent.client, ASHA, old, await newInviteDraft(draftDeps), shared)).toBe('shared');
    expect(sent.calls).toEqual(['create_child_invite', 'revoke_invite']);
    expect(sent.args[1]).toEqual({ p_invite: 'i-3' });
  });

  it('the pending list still reads (a paused invite is still an invite), and only through sync_books', async () => {
    setFamilyKillSourceForTests(switchSource);
    switchOn = true;
    const { client, calls } = fakeServer();
    const rows = await listPendingInvites(client, ASHA);
    expect(rows.map((r) => r.id)).toEqual(['i-3', 'i-2', 'i-1']);
    expect(calls).toEqual(['sync_books']);
  });

  it('a pause never loses a pending invite or a token the phone holds', () => {
    // The join sheet drops the stored token only on a final error, and paused is not one: Try again goes on.
    expect(FINAL_INVITE_ERRORS).not.toContain('paused');
    expect(src('app/invite/index.tsx')).toMatch(/if \(FINAL_INVITE_ERRORS\.includes\(kind\)\) await clearPendingInvite\(t\);/);
    const failed = { loaded: true, token: TOKEN, signedIn: true, canSync: true, preview: null, busy: null, wantsJoin: false, joinedChildId: null, error: 'paused' as const };
    expect(joinPlan(failed)).toEqual({ view: 'failed', next: 'none' });
    expect(joinPlan({ ...failed, error: null })).toEqual({ view: 'peeking', next: 'peek' });
    // The Family tab keeps listing while invites are paused, and Cancel invite is never held back there.
    const tab = src('app/(tabs)/family.tsx');
    expect(tab).toMatch(/setPending\(await listPendingInvites\(client, childId\)\)/);
    expect(tab).not.toMatch(/invitesPaused/);
    expect(src('lib/family/invites.ts')).toMatch(/export async function revokeInvite\(sb: FamilyClient, inviteId: string\): Promise<void> \{\s*const \{ error \} = await sb\.rpc\('revoke_invite'/);
  });

  it('a pause is not counted as a failed invite (nothing was attempted)', () => {
    expect(src('app/invite/new.tsx')).toMatch(/if \(kind !== 'paused'\) track\('invite_failed'/);
    expect(src('app/invite/index.tsx')).toMatch(/if \(kind !== 'paused'\) track\('invite_failed'/);
  });

  it('the paused line is one neutral sentence pair that never names the child, on every screen', () => {
    const line = familyCopy.errors.paused;
    expect(line).toBe('Invites are paused for now. Please try again a little later.');
    expect(line).not.toMatch(/\{|\b(lost|lose|fail|error|sorry|problem|wrong)\b/i);
    expect(renderTemplate(line, { child: 'Asha' })).toBe(line);
    expect(joinErrorLine('paused')).toBe('paused');
  });
});

describe('[F19-REQ-011] killSwitches.sync on: the pending list waits and the tab keeps its rows', () => {
  it('no sync_books request while sync is paused; the list reads again once it is lifted', async () => {
    setFamilyKillSourceForTests(switchSource);
    syncOn = true;
    const { client, calls } = fakeServer();
    expect(await kindOf(listPendingInvites(client, ASHA))).toBe('paused');
    expect(calls).toEqual([]);
    // Inviting is not sync: with only sync paused, the invite calls still go out.
    expect(await kindOf(peekInvite(client, TOKEN))).toBe('ok');
    syncOn = false;
    expect((await listPendingInvites(client, ASHA)).map((r) => r.id)).toEqual(['i-3', 'i-2', 'i-1']);
    expect(calls).toEqual(['peek_invite', 'sync_books']);
  });

  it('the Family tab keeps what it shows when the list is not read, and drops a cancelled row itself', () => {
    const tab = src('app/(tabs)/family.tsx');
    expect(tab).toMatch(/try \{\s*setPending\(await listPendingInvites\(client, childId\)\);\s*\} catch \{\s*\/\/ Keep what is shown/);
    expect(tab).toMatch(/await revokeInvite\(client, row\.id\);[\s\S]{0,120}setPending\(\(rows\) => rows\.filter\(\(r\) => r\.id !== row\.id\)\);/);
  });
});

describe('[F19-REQ-011] switch off: the same calls reach the server', () => {
  it('create, Share again, peek, accept and cancel each send their request', async () => {
    setFamilyKillSourceForTests(switchSource);
    const { client, calls } = fakeServer();
    const result = await everyInviteCall(client, async () => 'shared');
    expect(result).toEqual({ create: 'ok', shareAgain: 'ok', peek: 'ok', accept: 'ok', cancel: 'ok' });
    expect(calls).toEqual(['create_child_invite', 'create_child_invite', 'revoke_invite', 'peek_invite', 'accept_child_invite', 'revoke_invite']);
  });
});

describe('[F19-REQ-008] stale: an old copy of the config cannot clear the switch', () => {
  const key = generateSigningKey();
  const secret = base64ToBytes(key.secretKey)!;
  const trusted: TrustedKey[] = [{ keyId: 'el-test', publicKey: key.publicKey, kinds: ['remote-config'] }];
  const NOW = Date.parse('2026-10-23T14:00:00Z');
  const signedConfig = (version: number, generatedAt: string, invites: boolean) =>
    JSON.stringify(signDocument('remote-config', { schemaVersion: 1, version, generatedAt, killSwitches: { invites } }, secret, 'el-test'));

  function phoneConfig() {
    const queue: DocHttpResponse[] = [];
    const http: DocHttp = { get: async () => queue.shift() ?? Promise.reject(new Error('offline')) };
    const store = new Map<string, string>();
    // The remote config client as lib/remote builds it, with the same staleness rule.
    const client = new SignedDocumentClient<RemoteConfig>({
      kind: 'remote-config',
      url: 'https://example.invalid/functions/v1/config/v1/remote-config',
      parse: (p) => {
        const r = parseRemoteConfig(p);
        return r.ok ? { ok: true, value: r.value } : { ok: false, reason: r.reason };
      },
      versionOf: (c) => c.version,
      fallback: DEFAULT_REMOTE_CONFIG,
      storage: { read: (n) => store.get(n) ?? null, write: (n, t) => void store.set(n, t), remove: (n) => void store.delete(n) },
      http,
      trustedKeys: () => trusted,
      appVersion: '1.0.0',
      minIntervalMs: 300_000,
      timeoutMs: 5000,
      now: () => NOW,
      adjust: (next, previous, { serverDate }) => withFreshKillSwitches(next, previous, serverDate),
      signedTimeOf: (c) => Date.parse(c.generatedAt),
    });
    return { client, queue };
  }

  it('the switch set by a fresh copy stays on through a stale clearing copy, and only a fresh publish lifts it', async () => {
    const { client, queue } = phoneConfig();
    const reader = remoteFamilyKillSource(() => ({ getRemoteConfig: () => client.current() }));
    setFamilyKillSourceForTests(reader);
    const { client: server, calls } = fakeServer();

    queue.push({ status: 200, etag: '"v3"', body: signedConfig(3, '2026-10-22T00:00:00.000Z', true), date: 'Thu, 22 Oct 2026 00:05:00 GMT' });
    expect(await client.refresh(true)).toBe('updated');
    expect(reader.on('invites')).toBe(true);

    // A cache replays version 4, signed on 1 Oct with the switch cleared, while the server clock says 23 Oct.
    queue.push({ status: 200, etag: '"v4"', body: signedConfig(4, '2026-10-01T00:00:00.000Z', false), date: 'Fri, 23 Oct 2026 13:00:00 GMT' });
    expect(await client.refresh(true)).toBe('updated');
    expect(client.current().version).toBe(4);
    expect(reader.on('invites')).toBe(true);
    expect(await kindOf(createCoParentInvite(server, ASHA, null, await newInviteDraft(draftDeps)))).toBe('paused');
    expect(await kindOf(peekInvite(server, TOKEN))).toBe('paused');
    expect(calls).toEqual([]);

    // A fresh publish that clears it: invites go out again.
    queue.push({ status: 200, etag: '"v5"', body: signedConfig(5, '2026-10-23T12:00:00.000Z', false), date: 'Fri, 23 Oct 2026 13:30:00 GMT' });
    expect(await client.refresh(true)).toBe('updated');
    expect(reader.on('invites')).toBe(false);
    expect(await kindOf(peekInvite(server, TOKEN))).toBe('ok');
    expect(calls).toEqual(['peek_invite']);
  });

  it('a stale copy that sets the switch is honoured (stopping is the safe direction)', async () => {
    const { client, queue } = phoneConfig();
    const reader = remoteFamilyKillSource(() => ({ getRemoteConfig: () => client.current() }));
    queue.push({ status: 200, etag: '"v5"', body: signedConfig(5, '2026-09-01T00:00:00.000Z', true), date: 'Fri, 23 Oct 2026 13:00:00 GMT' });
    expect(await client.refresh(true)).toBe('updated');
    expect(reader.on('invites')).toBe(true);
  });
});

describe('[F11-REQ-019] the pending list from sync_books', () => {
  it('reads the one book\'s invites in the server\'s order, as the server marks them', () => {
    const rows = readPendingInvites(SYNC_BOOKS, ASHA);
    expect(rows).toEqual([
      { id: 'i-3', signsAs: 'Papa', createdAt: '2026-10-22T09:00:00.000Z', expiresAt: '2026-10-29T09:00:00.000Z', status: 'open' },
      { id: 'i-2', signsAs: null, createdAt: '2026-10-20T09:00:00.000Z', expiresAt: '2026-10-27T09:00:00.000Z', status: 'open' },
      { id: 'i-1', signsAs: 'Papa', createdAt: '2026-10-10T09:00:00.000Z', expiresAt: '2026-10-17T09:00:00.000Z', status: 'expired' },
    ]);
    // Only open invites hold back the invite card; an expired one is listed, not counted.
    expect(openInvites(rows).map((r) => r.id)).toEqual(['i-3', 'i-2']);
    expect(familyTabState({ role: 'parent', members: [], openInvites: openInvites(rows.slice(2)).length }).showInviteCard).toBe(true);
  });

  it('[F11-REQ-004] in a full book expired rows are hidden, so a co-parent who joined is never listed twice', () => {
    const rows = readPendingInvites(SYNC_BOOKS, ASHA);
    expect(visiblePendingRows(rows, true).map((r) => r.id)).toEqual(['i-3', 'i-2']);
    expect(visiblePendingRows(rows, false).map((r) => r.id)).toEqual(['i-3', 'i-2', 'i-1']);
    expect(src('app/(tabs)/family.tsx')).toMatch(/\{visiblePendingRows\(pending, state\.full\)\.map\(\(p\) => \(/);
  });

  it('a book not listed, or listed without invites (not a parent), has none; an answer without books is not a list', () => {
    expect(readPendingInvites(SYNC_BOOKS, 'another-book')).toEqual([]);
    expect(readPendingInvites({ books: [{ id: ASHA, invites: null }] }, ASHA)).toEqual([]);
    expect(readPendingInvites({ books: [] }, ASHA)).toEqual([]);
    for (const bad of [null, 'x', [], {}, { books: null }, { books: 'x' }]) expect(() => readPendingInvites(bad, ASHA)).toThrow();
  });

  it('skips a row that does not read, keeps only what the screen shows, and never a hash', () => {
    const good = { id: 'i-9', role: 'parent', signs_as: '  Papa  ', created_at: '2026-10-22T09:00:00.000Z', expires_at: '2026-10-29T09:00:00.000Z', status: 'open' };
    const rows = readPendingInvites(
      {
        books: [
          {
            id: ASHA,
            invites: [
              { ...good, token_hash: '\\x' + 'ab'.repeat(32), code_hash: 'x' },
              { ...good, id: 'contributor', role: 'contributor' },
              { ...good, id: 'odd-status', status: 'accepted' },
              { ...good, id: 'no-date', expires_at: 'soon' },
              { ...good, id: '' },
              { ...good, id: 'long', signs_as: 'P'.repeat(40) },
              null,
              'x',
            ],
          },
        ],
      },
      ASHA,
    );
    expect(rows.map((r) => r.id)).toEqual(['i-9', 'long']);
    expect(Object.keys(rows[0]).sort()).toEqual(['createdAt', 'expiresAt', 'id', 'signsAs', 'status']);
    expect(rows[0].signsAs).toBe('Papa');
    expect(rows[1].signsAs).toHaveLength(30);
    expect(JSON.stringify(rows)).not.toMatch(/hash|abab/);
  });

  it('the app never selects child_invites; the Family tab shows expired rows as the server marks them', () => {
    const invites = src('lib/family/invites.ts').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    expect(invites).not.toMatch(/child_invites/);
    expect(invites).toMatch(/sb\.rpc\('sync_books'\)/);
    const tab = src('app/(tabs)/family.tsx');
    expect(tab).toMatch(/status=\{p\.status === 'open' \? openUntil\(p\.expiresAt\) : f\.members\.expired\}/);
    expect(tab).toMatch(/\{p\.status === 'open' && \(\s*<RowAction\s+testID="family\.pending\.cancel"/);
    expect(tab).toMatch(/openInvites: openCount/);
    expect(familyCopy.members.openUntil).toBe('Invited, open until {date}');
    expect(familyCopy.members.expired).toBe('Invite expired');
  });
});

describe('error kinds named as the family contract names them (packages/api/src/server/family.ts)', () => {
  const pg = (code: string, details: string | null = null) => ({ code, message: 'whatever the server says', details, hint: null });

  it('SCKIL is paused, SCCID is id_taken, SCCON family-share is family_share_consent, on both sides', () => {
    const cases: [string, string | null, InviteErrorKind][] = [
      ['SCKIL', 'invites', 'paused'],
      ['SCKIL', null, 'paused'],
      ['SCCID', null, 'id_taken'],
      ['SCCON', 'family-share', 'family_share_consent'],
      ['SCCON', null, 'consent_needed'],
      ['SCCAP', '2', 'book_full'],
      ['SCPAR', null, 'not_parent'],
      ['SCRAT', null, 'rate_limited'],
      ['SCDEL', null, 'book_deleted'],
      ['SCINV', 'expired', 'expired'],
      ['SCINV', 'used', 'used'],
      ['SCINV', 'revoked', 'revoked'],
      ['SCINV', 'already_member', 'already_member'],
      ['SCINV', 'not_found', 'not_found'],
    ];
    for (const [code, detail, kind] of cases) {
      expect(inviteErrorKind(pg(code, detail)), `${code} ${detail}`).toBe(kind);
      expect(inviteErrorKindFor(code, detail), `${code} ${detail}`).toBe(kind);
    }
  });

  it('id_taken gets the same action as retry_new_invite: one more try with a fresh draft', () => {
    expect([...NEW_DRAFT_ERRORS].sort()).toEqual(['id_taken', 'retry_new_invite']);
    expect(src('app/invite/new.tsx')).toMatch(/if \(!NEW_DRAFT_ERRORS\.includes\(inviteErrorKind\(e\)\)\) throw e;/);
    expect(familyCopy.errors.id_taken).toBe(familyCopy.errors.retry_new_invite);
  });

  it('family_share_consent has its own line and never the general consent screen; only a server with the setting on sends it', () => {
    const sheet = src('app/invite/new.tsx');
    expect(sheet).toMatch(/error === 'consent_needed' \? \(\s*<QuietButton label=\{familyCopy\.card\.finishSetup\}/);
    expect(familyCopy.errors.family_share_consent).not.toBe(familyCopy.errors.consent_needed);
    // The general consent refusal, with no detail, is still the general line.
    expect(inviteErrorKind(pg('SCCON', 'sensitive-data'))).toBe('consent_needed');
  });

  it('no line names the child before joining: the join sheet\'s lines have no {child}', () => {
    for (const k of ['paused', 'family_share_consent', 'id_taken', 'expired', 'used', 'revoked', 'not_found', 'book_full', 'network', 'unknown'] as const) {
      expect(familyCopy.errors[k], k).not.toMatch(/\{child\}/);
    }
  });
});
