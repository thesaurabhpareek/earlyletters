/**
 * A fake of the supabase-js `rpc()` surface for the family tests: records
 * every call with its arguments and headers, and answers from a script.
 * Not a test file itself (vitest picks up only `*.test.ts`).
 */
import type { RpcBuilder, RpcClient, RpcResult } from './family-rpc.logic';

export interface RecordedCall {
  fn: string;
  args: Record<string, unknown> | undefined;
  headers: Record<string, string>;
}

/** An answer: data, a Postgres-style error ({code, message}), or a thrown network failure. */
export type Answer = { data: unknown } | { error: { code: string; message?: string; details?: string } } | { network: true };

export function fakeRpc(script: Record<string, Answer | Answer[]>): RpcClient & { calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const queues = new Map<string, Answer[]>(Object.entries(script).map(([k, v]) => [k, Array.isArray(v) ? [...v] : [v]]));
  const next = (fn: string): Answer => {
    const q = queues.get(fn);
    if (!q || q.length === 0) throw new Error(`fakeRpc: no answer scripted for ${fn}`);
    return q.length > 1 ? q.shift()! : q[0]!;
  };
  return {
    calls,
    rpc(fn, args) {
      const call: RecordedCall = { fn, args, headers: {} };
      calls.push(call);
      const answer = next(fn);
      const run = (): Promise<RpcResult> => {
        if ('network' in answer) return Promise.reject(Object.assign(new TypeError('Network request failed'), { name: 'TypeError' }));
        if ('error' in answer) return Promise.resolve({ data: null, error: answer.error });
        return Promise.resolve({ data: answer.data, error: null });
      };
      const builder: RpcBuilder = {
        setHeader(name, value) {
          call.headers[name] = value;
          return builder;
        },
        then(onfulfilled, onrejected) {
          return run().then(onfulfilled, onrejected);
        },
      };
      return builder;
    },
  };
}

/** Keys k1, k2, ... so a test can tell one action's key from the next. */
export function counterKeys(): () => string {
  let n = 0;
  return () => `00000000-0000-7000-8000-${String(++n).padStart(12, '0')}`;
}
