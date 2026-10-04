/**
 * Change notifications for the store (MOB-05). `subscribe` keeps its old
 * meaning (any write); `subscribeTo` fires only when one of the named tables
 * changed, so a screen that shows letters is not re-read when a setting is
 * written. Listeners are called in subscription order over a snapshot, so
 * unsubscribing during a notification is safe.
 */
import type { Table } from './context';

export type ChangeListener = (tables: readonly Table[]) => void;

export interface ChangeBus {
  subscribe(listener: () => void): () => void;
  subscribeTo(tables: Table | readonly Table[], listener: ChangeListener): () => void;
  emit(...tables: Table[]): void;
}

export function createChangeBus(): ChangeBus {
  const all = new Set<{ tables: ReadonlySet<Table> | null; fn: ChangeListener }>();
  const add = (tables: ReadonlySet<Table> | null, fn: ChangeListener) => {
    const sub = { tables, fn };
    all.add(sub);
    return () => {
      all.delete(sub);
    };
  };
  return {
    subscribe: (listener) => add(null, () => listener()),
    subscribeTo: (tables, listener) => add(new Set(typeof tables === 'string' ? [tables] : tables), listener),
    emit: (...tables) => {
      if (tables.length === 0) return;
      for (const sub of [...all]) {
        if (!all.has(sub)) continue; // removed by an earlier listener in this round
        if (sub.tables && !tables.some((t) => sub.tables!.has(t))) continue;
        sub.fn(tables);
      }
    },
  };
}
