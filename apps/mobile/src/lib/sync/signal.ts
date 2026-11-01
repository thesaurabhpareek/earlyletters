/**
 * store.ts calls signalOutbox() after a write that queued an upload; the sync
 * engine listens and pushes soon after ("after a save" trigger). No React
 * Native here, so store.ts and tests can import it.
 */
const listeners = new Set<() => void>();

export function onOutboxChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function signalOutbox(): void {
  listeners.forEach((l) => l());
}
