/**
 * One idempotency key per user action, reused across retries (gap G-07;
 * supabase/APPLY.md file 12: the server replays a repeated key with the same
 * arguments and refuses it with other arguments).
 */
import { describe, expect, it } from 'vitest';
import { ActionKeys, withActionKey } from '../src/lib/supabase/idempotency.logic';
import { isNetworkError } from '../src/lib/supabase/errors.logic';

let n = 0;
const maker = () => `0199a000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
const offline = Object.assign(new Error('Network request failed'), { name: 'TypeError' });
const retryable = (e: unknown) => isNetworkError(e) || (e as { code?: string })?.code === '40001';

/** A server with the file-12 semantics: first call per key writes, a repeat replays, other arguments are 22023. */
function server() {
  const seen = new Map<string, { args: string; result: string }>();
  let writes = 0;
  return {
    get writes() {
      return writes;
    },
    call(key: string, args: unknown): string {
      const a = JSON.stringify(args);
      const prev = seen.get(key);
      if (prev) {
        if (prev.args !== a) throw Object.assign(new Error('reused'), { code: '22023' });
        return prev.result;
      }
      writes++;
      const result = `invite-${writes}`;
      seen.set(key, { args: a, result });
      return result;
    },
  };
}

describe('idempotency keys (G-07)', () => {
  it('a retry after a lost answer reuses the key, so the server writes once', async () => {
    const keys = new ActionKeys(maker);
    const s = server();
    const scope = 'create_child_invite:book-1:parent:Papa';
    const used: string[] = [];
    // First attempt: the server wrote, but the answer never arrived.
    await expect(
      withActionKey(keys, scope, async (k) => {
        used.push(k);
        s.call(k, ['book-1', 'parent', 'Papa']);
        throw offline;
      }, retryable),
    ).rejects.toBe(offline);
    // "Try again": same key, the server replays.
    const r = await withActionKey(keys, scope, async (k) => {
      used.push(k);
      return s.call(k, ['book-1', 'parent', 'Papa']);
    }, retryable);
    expect(used[0]).toBe(used[1]);
    expect(r).toBe('invite-1');
    expect(s.writes).toBe(1);
    expect(keys.size).toBe(0);
  });

  it('after success the next tap is a new action with a new key', async () => {
    const keys = new ActionKeys(maker);
    const s = server();
    const scope = 'create_child_invite:book-1:parent:';
    const a = await withActionKey(keys, scope, async (k) => s.call(k, ['book-1']), retryable);
    const b = await withActionKey(keys, scope, async (k) => s.call(k, ['book-1']), retryable);
    expect(a).not.toBe(b);
    expect(s.writes).toBe(2);
  });

  it('a final error forgets the key; a retryable 40001 keeps it', async () => {
    const keys = new ActionKeys(maker);
    const k1 = keys.keyFor('x');
    await expect(withActionKey(keys, 'x', async () => { throw { code: '40001' }; }, retryable)).rejects.toEqual({ code: '40001' });
    expect(keys.keyFor('x')).toBe(k1);
    await expect(withActionKey(keys, 'x', async () => { throw { code: 'SCRAT' }; }, retryable)).rejects.toEqual({ code: 'SCRAT' });
    expect(keys.keyFor('x')).not.toBe(k1);
  });

  it('changing what was asked (another signature, another answer) is another scope, so never a 22023', async () => {
    const keys = new ActionKeys(maker);
    expect(keys.keyFor('create_child_invite:b:parent:Papa')).not.toBe(keys.keyFor('create_child_invite:b:parent:Baba'));
    expect(keys.keyFor('record_policy_act:terms:terms:1.5.0:accept')).not.toBe(keys.keyFor('record_policy_act:sensitive:sensitive-data:1.2.0:accept'));
  });

  it('clear() forgets everything (sign-out)', () => {
    const keys = new ActionKeys(maker);
    keys.keyFor('a');
    keys.keyFor('b');
    keys.clear();
    expect(keys.size).toBe(0);
  });
});
