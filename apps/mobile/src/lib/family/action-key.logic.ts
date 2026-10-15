/**
 * One idempotency key per user action (gap G-07; ADR 0017 rule 3).
 *
 * A "user action" is one thing the person asked for, with its arguments:
 * "invite a co-parent to this book, signed Papa", "leave this book, keeping my
 * letters in it". Every attempt at that action (the first tap, a "Try again"
 * after a lost answer, a retry after signing in again) sends the same key, so
 * the server replays the first result instead of writing twice
 * (`idempotency_claim` in migration 20261005000000). Once the action succeeds,
 * its key is dropped, and the next time the person asks for the same thing it
 * is a new action with a new key.
 *
 * A failed call never stores a result on the server (the claim rolls back
 * with the call), so keeping the key after a failure is always safe.
 *
 * Keys live in memory only. A scope may carry a book id or an invite id; it
 * never goes to logs or analytics (LEGAL-REQ-014).
 *
 * Pure: the key maker is passed in (uuidv7 in the app, a counter in tests).
 */
export class ActionKeys {
  private readonly keys = new Map<string, string>();

  constructor(private readonly makeKey: () => string) {}

  /** The key for this action: the same one until the action succeeds. */
  keyFor(scope: string): string {
    let k = this.keys.get(scope);
    if (!k) {
      k = this.makeKey();
      this.keys.set(scope, k);
    }
    return k;
  }

  /** The action succeeded: the next request for the same thing is a new action. */
  settle(scope: string): void {
    this.keys.delete(scope);
  }

  /** Signed out or the account changed: no key may cross accounts. */
  clear(): void {
    this.keys.clear();
  }

  /** Open actions (tests). */
  get size(): number {
    return this.keys.size;
  }
}

/** Runs one attempt of an action with its key; drops the key only on success. */
export async function runAction<T>(keys: ActionKeys, scope: string, attempt: (key: string) => Promise<T>): Promise<T> {
  const key = keys.keyFor(scope);
  const result = await attempt(key);
  keys.settle(scope);
  return result;
}

/** Scopes for the family write calls: function name plus the arguments that make it the same action. */
export const actionScope = {
  createInvite: (childId: string, signsAs: string | null) => `create_child_invite|${childId}|parent|${signsAs ?? ''}`,
  revokeInvite: (inviteId: string) => `revoke_invite|${inviteId}`,
  /** Only a short prefix of the token: enough to tell two invites apart in one app session. */
  acceptInvite: (token: string) => `accept_child_invite|${token.slice(0, 12)}`,
  leave: (childId: string, keepInBook: boolean) => `leave_child|${childId}|${keepInBook ? 'keep' : 'take_out'}`,
  removeMember: (childId: string, memberId: string, setAside: boolean) => `remove_child_member|${childId}|${memberId}|${setAside ? 'set_aside' : 'keep'}`,
} as const;
