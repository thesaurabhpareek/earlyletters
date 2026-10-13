/**
 * One idempotency key per user action, reused by every retry of it (ADR 0017
 * rule 3; supabase/APPLY.md "App changes for file 12"; gap G-07). Pure,
 * tested in test/auth-idempotency.test.ts.
 *
 * The server (`create_child_invite`, `record_policy_act`) replays the first
 * result for a repeated key with the same arguments, and refuses the same key
 * with other arguments (22023). So:
 *  - the scope names the action AND its arguments (book, role, signature,
 *    document, answer): changing what the person asked for is a new action;
 *  - a network failure or a timeout keeps the key, so "Try again" is a retry;
 *  - success, or a final error, forgets it, so the next tap is a new action.
 *
 * Keys live in memory only. An app kill starts a new action, which the
 * server-side limits already allow for.
 */
export type KeyMaker = () => string;

export class ActionKeys {
  private readonly keys = new Map<string, string>();

  constructor(private readonly make: KeyMaker) {}

  /** The key for this action: the same one until `settle` is called. */
  keyFor(scope: string): string {
    let k = this.keys.get(scope);
    if (!k) {
      k = this.make();
      this.keys.set(scope, k);
    }
    return k;
  }

  /** The action finished (it worked, or failed for good): the next attempt is a new action. */
  settle(scope: string): void {
    this.keys.delete(scope);
  }

  /** Test and sign-out helper. */
  clear(): void {
    this.keys.clear();
  }

  get size(): number {
    return this.keys.size;
  }
}

/**
 * Runs one attempt of an action with its key. Retryable failures (the
 * caller's `retryable(e)`, normally a network error or 40001) keep the key;
 * anything else settles it.
 */
export async function withActionKey<T>(
  keys: ActionKeys,
  scope: string,
  attempt: (key: string) => Promise<T>,
  retryable: (e: unknown) => boolean,
): Promise<T> {
  const key = keys.keyFor(scope);
  try {
    const out = await attempt(key);
    keys.settle(scope);
    return out;
  } catch (e) {
    if (!retryable(e)) keys.settle(scope);
    throw e;
  }
}
