/**
 * The exporter's role per book for account.json memberships and the manifest
 * (BL-323: the real role instead of 'parent'). `store.myRoleIn` reads the
 * server's member list the phone last synced (sync_books.members).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');

let close: () => void = () => {};
let seq = 0;
const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;

function setMembers(childId: string, members: string | null): void {
  store.localSqlDb().run('INSERT OR REPLACE INTO sync_books (child_id, members) VALUES (?, ?)', childId, members);
}

beforeEach(() => {
  store.closeStore();
  const h = nodeDb();
  close = h.close;
  store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => '2026-10-03T09:00:00.000Z', newId });
});
afterEach(() => {
  store.closeStore();
  close();
  close = () => {};
});

describe('[BL-323] myRoleIn', () => {
  it('a book only on this phone (never synced) is the exporter\'s own: parent', () => {
    expect(store.myRoleIn('child-local')).toBe('parent');
  });

  it('reads the exporter\'s own row in the synced member list', () => {
    const me = (role: string) => JSON.stringify([
      { profile_id: 'u-other', role: 'parent', is_me: false, signs_as: 'Papa' },
      { profile_id: 'u-me', role, is_me: true, signs_as: 'Nani' },
    ]);
    setMembers('child-a', me('contributor'));
    setMembers('child-b', me('parent'));
    expect(store.myRoleIn('child-a')).toBe('contributor');
    expect(store.myRoleIn('child-b')).toBe('parent');
  });

  it('an empty, unreadable or unknown member list falls back to parent, the role before sync', () => {
    setMembers('child-c', null);
    setMembers('child-d', 'not json');
    setMembers('child-e', JSON.stringify([{ profile_id: 'u-other', role: 'contributor', is_me: false }]));
    setMembers('child-f', JSON.stringify([{ profile_id: 'u-me', role: 'owner', is_me: true }]));
    for (const id of ['child-c', 'child-d', 'child-e', 'child-f']) expect(store.myRoleIn(id), id).toBe('parent');
  });
});
