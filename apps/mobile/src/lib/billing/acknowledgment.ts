/**
 * When to show the acknowledgment sheet (BL-342, WP-F14-06; C-REQ-024): once, right after a
 * purchase or a free period starts in the app. presentPlusStore() calls `requestAcknowledgment()`
 * when Apple's sheet closes with Plus on; `<PlusAcknowledgmentHost />` (components/plus) shows it
 * wherever it is mounted. The flag is kept in device settings so a kill before the sheet shows
 * still shows it at the next launch. No React Native import: tested in Node.
 */

/** Device settings key: '1' while an acknowledgment waits to be shown. No ids, no dates. */
export const ACK_PENDING_KEY = 'plus.ackPending';

export interface FlagStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

let storage: FlagStorage | null = null;
let pending = false;
const listeners = new Set<() => void>();

export function configureAcknowledgmentStorage(s: FlagStorage | null): void {
  storage = s;
  try {
    pending = s?.get(ACK_PENDING_KEY) === '1';
  } catch {
    pending = false;
  }
}

function write(v: boolean): void {
  pending = v;
  try {
    storage?.set(ACK_PENDING_KEY, v ? '1' : '0');
  } catch {
    // In memory still holds it for this run.
  }
  for (const l of listeners) l();
}

/** A purchase or free period started in the app: show the acknowledgment. */
export function requestAcknowledgment(): void {
  write(true);
}

/** The person closed the sheet (Done or Save a copy then Done). */
export function acknowledgmentShown(): void {
  write(false);
}

export function acknowledgmentPending(): boolean {
  return pending;
}

export function subscribeAcknowledgment(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
